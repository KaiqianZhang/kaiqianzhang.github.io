"""The site palette. One definition, imported by every figure script.

Lavender-proned Morandi: muted and slightly dusty, built around a lavender
primary, weighted toward blue and violet, with no grey ever carrying meaning.

The second constraint is separation. The palette this replaced had plum and
lavender at dE76 = 6.5 — two series a reader could not tell apart. Every pair
below is at least dE 26, and the tight pairs are also separated in lightness,
so they survive greyscale printing and the common colour-vision deficiencies.

    python3 figures/palette.py      prints the separation matrix
"""

import itertools
import math

# -- the palette ------------------------------------------------------------

LAVENDER = '#8C77BC'    # primary: the first series, the main curve
BLUE = '#3E6491'        # the thing it is being compared against
ROSE = '#C48BAC'        # a third series; violet-rose, lighter than lavender
SAGE = '#6E8C66'        # a rescued or corrected variant
CLAY = '#B07E55'        # a fourth series
INK = '#22253E'         # a fifth series, or emphasis text
MARKER = '#A8443E'      # annotation only, deliberately salient

# Structure, never data.
GRID = '#DEDAD4'
AXIS = '#BFBFBF'
TEXT = '#3F3F3F'
MUTED = '#6E6E6E'

SERIES = [LAVENDER, BLUE, ROSE, SAGE, CLAY, INK]

NAMES = {LAVENDER: 'lavender', BLUE: 'blue', ROSE: 'rose', SAGE: 'sage',
         CLAY: 'clay', INK: 'ink', MARKER: 'marker'}


# -- separation, so the constraint above is checkable, not asserted ----------

def _lab(hexv):
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = [lin(int(hexv[i:i + 2], 16)) for i in (1, 3, 5)]
    X = r * .4124 + g * .3576 + b * .1805
    Y = r * .2126 + g * .7152 + b * .0722
    Z = r * .0193 + g * .1192 + b * .9505

    def f(t):
        return t ** (1 / 3.) if t > 0.008856 else 7.787 * t + 16 / 116.
    return (116 * f(Y) - 16, 500 * (f(X / .95047) - f(Y)),
            200 * (f(Y) - f(Z / 1.08883)))


def delta_e(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(_lab(a), _lab(b))))


def lightness(hexv):
    return _lab(hexv)[0]


if __name__ == '__main__':
    print('%-10s %-8s %s' % ('name', 'hex', 'L*'))
    for c in SERIES + [MARKER]:
        print('%-10s %-8s %5.1f' % (NAMES[c], c, lightness(c)))
    pairs = sorted((delta_e(a, b), a, b)
                   for a, b in itertools.combinations(SERIES, 2))
    print('\nclosest series pairs:')
    for d, a, b in pairs[:4]:
        print('  %-9s %-9s dE=%5.1f  dL=%5.1f'
              % (NAMES[a], NAMES[b], d, abs(lightness(a) - lightness(b))))
    print('\nminimum separation: dE %.1f' % pairs[0][0])
    assert pairs[0][0] >= 25, 'two series are too close to tell apart'
    print('ok')
