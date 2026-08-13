"""Figure for 'Attention'.

Why dot-product attention divides by sqrt(d). The Transformer paper justifies
it in an appendix, in one sentence: if q and k have independent components
with mean 0 and variance 1, then

    q . k = sum_i q_i k_i     has mean 0 and variance d,

so the scores grow like sqrt(d) as the vectors get wider, and dividing by
sqrt(d) puts them back at variance 1.

That is a closed form, so it can be checked rather than believed. Panel (a)
samples the dot product for a range of widths and plots its measured variance
against the predicted line var = d. Panel (b) shows why anyone cares: it feeds
those scores through a softmax over 64 keys and measures how much of the
weight lands on the single largest one. Unscaled, that fraction climbs toward
1 as the model gets wider, which is a softmax that has stopped averaging and
started picking -- and a softmax pinned at 1 has almost no gradient left to
train on.

Run:  python3 figures/attention.py
Writes static/images/attention-scaling.png
"""

import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from palette import LAVENDER, BLUE, CLAY, MARKER, GRID, AXIS, TEXT, MUTED

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'static', 'images', 'attention-scaling.png')

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Helvetica', 'Arial', 'DejaVu Sans'],
    'font.size': 10,
    'axes.edgecolor': AXIS,
    'axes.labelcolor': TEXT,
    'text.color': TEXT,
    'xtick.color': MUTED,
    'ytick.color': MUTED,
    'axes.spines.top': False,
    'axes.spines.right': False,
})

rng = np.random.default_rng(0)
DIMS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
TRIALS = 20000
KEYS = 64                      # how many tokens the query is attending over

meas_var, top_unscaled, top_scaled, ent_unscaled, ent_scaled = [], [], [], [], []

for d in DIMS:
    q = rng.normal(0, 1, (TRIALS, d))
    k = rng.normal(0, 1, (TRIALS, d))
    meas_var.append(float(np.var(np.sum(q * k, axis=1))))

    # One query against KEYS keys, repeated, to see what the softmax does.
    q1 = rng.normal(0, 1, (2000, 1, d))
    K = rng.normal(0, 1, (2000, KEYS, d))
    scores = np.einsum('nid,nkd->nk', q1, K)

    def summarise(s):
        s = s - s.max(1, keepdims=True)
        p = np.exp(s)
        p /= p.sum(1, keepdims=True)
        ent = -np.sum(p * np.log(np.clip(p, 1e-12, None)), axis=1)
        return float(p.max(1).mean()), float(ent.mean())

    a, b = summarise(scores)
    top_unscaled.append(a); ent_unscaled.append(b)
    a, b = summarise(scores / np.sqrt(d))
    top_scaled.append(a); ent_scaled.append(b)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2))

ax1.plot(DIMS, DIMS, lw=1.9, color=BLUE, label=r'predicted:  $\mathrm{Var}(q\cdot k) = d$')
ax1.plot(DIMS, meas_var, lw=0, marker='o', ms=6, color=LAVENDER,
         markeredgecolor='white', markeredgewidth=1.2,
         label='measured, %s samples each' % f'{TRIALS:,}')
ax1.set_xscale('log', base=2); ax1.set_yscale('log', base=2)
ax1.set_xlabel('$d$, numbers in each vector')
ax1.set_ylabel('variance of the raw score $q\\cdot k$')
ax1.set_title('(a) the scores grow with width', loc='left', fontsize=11)
ax1.legend(frameon=False, fontsize=9, loc='upper left')
ax1.grid(color=GRID, lw=.7); ax1.set_axisbelow(True)

ax2.plot(DIMS, top_unscaled, lw=2.2, marker='o', ms=4.5, color=CLAY,
         label='no scaling')
ax2.plot(DIMS, top_scaled, lw=2.2, marker='o', ms=4.5, color=LAVENDER,
         label=r'divided by $\sqrt{d}$')
ax2.axhline(1 / KEYS, lw=1.2, ls='--', color=MARKER)
ax2.text(DIMS[0], 1 / KEYS * 1.25, 'a flat average over %d keys' % KEYS,
         fontsize=8.5, color=MARKER)
ax2.set_xscale('log', base=2)
ax2.set_ylim(0, 1.05)
ax2.set_xlabel('$d$, numbers in each vector')
ax2.set_ylabel('weight landing on the single largest key')
ax2.set_title('(b) what that does to the softmax', loc='left', fontsize=11)
ax2.legend(frameon=False, fontsize=9, loc='center right')
ax2.grid(color=GRID, lw=.7); ax2.set_axisbelow(True)

fig.tight_layout()
fig.savefig(OUT, dpi=170, facecolor='white')

print('keys per softmax: %d, trials per point: %d' % (KEYS, TRIALS))
print('%6s %12s %12s %10s %10s' % ('d', 'var measured', 'var = d', 'top raw', 'top /sqrt'))
for i, d in enumerate(DIMS):
    print('%6d %12.1f %12d %10.3f %10.3f'
          % (d, meas_var[i], d, top_unscaled[i], top_scaled[i]))
rel = max(abs(meas_var[i] - d) / d for i, d in enumerate(DIMS))
print('worst relative error against Var = d: %.2f%%' % (100 * rel))
print('at d = 1024: unscaled softmax puts %.1f%% on one key; scaled puts %.1f%%'
      % (100 * top_unscaled[-1], 100 * top_scaled[-1]))
print('a flat average over %d keys would put %.2f%% on each' % (KEYS, 100 / KEYS))
print('wrote %s' % OUT)
