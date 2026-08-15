"""The CBOW / Skip-gram sliding window for the mindmap post.

The first version drew the four arrows as short stubs sitting under each
neighbour word. The directions were right, but nothing was *connected*: four
disconnected dashes with a gap under the centre word, which is not what either
model does. Here each arrow is an arc that actually runs between the centre
word and one neighbour, so CBOW reads as four things pointing at one and
Skip-gram as one thing pointing at four.

Arc depth grows with distance, so the second neighbour out visibly reaches
further than the first.

Run:  python3 figures/w2v_window.py
"""

import math

WORDS = ['the', 'cat', 'sat', 'on', 'the', 'warm', 'mat']
X0, DX = 50, 60                      # first word centre, spacing
HALF = 152                           # window half-width
OFFSETS = [-120, -60, 60, 120]       # neighbours, relative to the centre word

# Per row: label, y of the word baseline, and the class the CSS colours by.
ROWS = [('CBOW', 56, 'cbow'), ('SKIP-GRAM', 196, 'skip')]
ROW_GAP = 140

ARC_TOP = 16       # how far below the baseline the arcs start and end
DIP_NEAR = 30      # dip for the immediate neighbours
DIP_FAR = 46       # dip for the ones two away
ATTACH = [-13, -5, 5, 13]            # fan the centre ends so heads do not stack


def arrow_head(x, y, angle, size=6.5):
    """A small triangle at (x, y) pointing along `angle` radians."""
    pts = []
    for a in (0, 2.5, -2.5):
        pts.append((x + size * math.cos(angle + a),
                    y + size * math.sin(angle + a)))
    return ' '.join('%.1f,%.1f' % p for p in pts)


def arcs(base_y, inward):
    """One arc per neighbour.

    inward=True  (CBOW): neighbour -> centre, head at the centre.
    inward=False (Skip): centre -> neighbour, head at the neighbour.
    """
    out = []
    top = base_y + ARC_TOP
    for off, att in zip(OFFSETS, ATTACH):
        dip = top + (DIP_FAR if abs(off) == 120 else DIP_NEAR)
        near, far = (off, att) if inward else (att, off)
        ctrl = (near + far) / 2.0
        out.append("<path class='arc' d='M %.1f %.1f Q %.1f %.1f %.1f %.1f'/>"
                   % (near, top, ctrl, dip, far, top))
        # tangent at the end point of a quadratic Bezier is (P2 - P1)
        ang = math.atan2(top - dip, far - ctrl)
        out.append("<polygon class='head' points='%s'/>"
                   % arrow_head(far, top, ang))
    return out


def build():
    width = X0 + DX * (len(WORDS) - 1) + X0
    height = ROWS[-1][1] + ARC_TOP + DIP_FAR + 26
    label = ('A window slides along the sentence "the cat sat on the warm '
             'mat". In the upper row, labelled CBOW, four arcs run inward from '
             'the neighbouring words to the centre word. In the lower row, '
             'labelled Skip-gram, the same four arcs run outward from the '
             'centre word to its neighbours.')
    out = ["<svg viewBox='0 0 %d %d' role='img' aria-label='%s'>"
           % (width, height, label)]

    for name, base_y, cls in ROWS:
        inward = cls == 'cbow'
        top = base_y + ARC_TOP
        frame_y = base_y - 30
        frame_h = ARC_TOP + DIP_FAR + 42
        out.append("  <g class='%s'>" % cls)
        out.append("    <text class='rowlabel' x='6' y='%d'>%s</text>"
                   % (frame_y - 12, name))
        out.append("    <g class='slide'>")
        out.append("      <rect class='frame' x='%d' y='%d' width='%d' "
                   "height='%d' rx='9'/>" % (-HALF, frame_y, 2 * HALF, frame_h))
        out.append("      <rect class='centre' x='-26' y='%d' width='52' "
                   "height='30' rx='6'/>" % (base_y - 22))
        for line in arcs(base_y, inward):
            out.append('      ' + line)
        out.append('    </g>')
        for i, w in enumerate(WORDS):
            out.append("    <text class='word' x='%d' y='%d'>%s</text>"
                       % (X0 + i * DX, base_y, w))
        out.append('  </g>')

    out.append('</svg>')
    return '\n'.join(out), top


if __name__ == '__main__':
    svg, _ = build()
    print(svg)
