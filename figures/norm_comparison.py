"""Figure for 'RMSNorm vs. LayerNorm'.

Panel (a): how closely RMSNorm tracks LayerNorm as width grows.
Panel (b): the one thing LayerNorm has that RMSNorm does not -- shift invariance.

Run:  python3 figures/norm_comparison.py
Writes static/images/rmsnorm-vs-layernorm.png
"""

import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'static', 'images', 'rmsnorm-vs-layernorm.png')

# Muted Morandi-ish palette, warm greys with a sage green that matches the
# site's post icon.
LN = '#8896AB'        # dusty blue
RMS = '#7E9B76'       # sage green
REF = '#B3A394'       # taupe, used for analytic reference curves
GRID = '#E4E1DC'
TEXT = '#4A4A4A'
MUTED = '#8C8C8C'

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Helvetica', 'Arial', 'DejaVu Sans'],
    'font.size': 10,
    'axes.edgecolor': '#BFBFBF',
    'axes.labelcolor': TEXT,
    'text.color': TEXT,
    'xtick.color': MUTED,
    'ytick.color': MUTED,
    'axes.spines.top': False,
    'axes.spines.right': False,
})

rng = np.random.default_rng(0)


def layernorm(x):
    return (x - x.mean(-1, keepdims=True)) / x.std(-1, keepdims=True)


def rmsnorm(x):
    return x / np.sqrt((x ** 2).mean(-1, keepdims=True))


def cosine(a, b):
    return (np.sum(a * b, -1)
            / (np.linalg.norm(a, axis=-1) * np.linalg.norm(b, axis=-1)))


fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.1))

# -- (a) agreement grows with width -----------------------------------------

dims = np.unique(np.round(np.logspace(np.log10(2), np.log10(8192), 22))
                 ).astype(int)
med, lo, hi = [], [], []
for d in dims:
    x = rng.standard_normal((4000, d))
    gap = 1 - cosine(layernorm(x), rmsnorm(x))
    # The 1/2d prediction is for the mean, so plot the mean against it.
    med.append(np.mean(gap))
    lo.append(np.percentile(gap, 5))
    hi.append(np.percentile(gap, 95))

ax1.fill_between(dims, lo, hi, color=RMS, alpha=0.18, linewidth=0)
ax1.plot(dims, med, color=RMS, linewidth=2, zorder=3,
         label='simulated (mean, 5–95%)')
ax1.plot(dims, 1 / (2 * np.array(dims)), color=REF, linewidth=1.5,
         linestyle=(0, (5, 3)), zorder=4, label=r'theory:  $1/2d$')

ax1.set_xscale('log')
ax1.set_yscale('log')
ax1.set_xlabel('width $d$')
ax1.set_ylabel('disagreement   $1-\\cos(\\mathrm{LN},\\ \\mathrm{RMS})$')
ax1.set_title('(a)  The gap closes as $1/2d$',
              fontsize=11, loc='left', pad=12)
ax1.set_ylim(1e-5, 1)
ax1.grid(color=GRID, linewidth=0.8, which='major')
ax1.set_axisbelow(True)
ax1.legend(frameon=False, loc='lower left', fontsize=9)

# Mark the widths real models actually use.
for d, name in [(768, 'GPT-2'), (4096, 'Llama 2 7B')]:
    ax1.axvline(d, color=MUTED, linewidth=0.7, linestyle=':', zorder=1)
    ax1.text(d * 1.15, 0.30, name, fontsize=8, color=MUTED, rotation=90,
             va='top', ha='left')

# -- (b) the property RMSNorm gives up --------------------------------------

d = 512
shifts = np.linspace(0, 4, 41)
x = rng.standard_normal((4000, d))
ln0, rms0 = layernorm(x), rmsnorm(x)

ln_sim, rms_sim = [], []
for c in shifts:
    xs = x + c
    ln_sim.append(np.median(cosine(layernorm(xs), ln0)))
    rms_sim.append(np.median(cosine(rmsnorm(xs), rms0)))

ax2.plot(shifts, ln_sim, color=LN, linewidth=2.2, label='LayerNorm', zorder=3)
ax2.plot(shifts, rms_sim, color=RMS, linewidth=2.2, label='RMSNorm', zorder=3)
ax2.plot(shifts, 1 / np.sqrt(1 + shifts ** 2), color=REF, linewidth=1.5,
         linestyle=(0, (5, 3)), zorder=4, label=r'theory:  $1/\sqrt{1+c^2}$')

ax2.set_xlabel('shift $c$ added to every coordinate')
ax2.set_ylabel('cosine similarity to the unshifted output')
ax2.set_title('(b)  Only LayerNorm ignores a shift',
              fontsize=11, loc='left', pad=12)
ax2.set_ylim(0, 1.05)
ax2.set_xlim(0, 4)
ax2.grid(color=GRID, linewidth=0.8)
ax2.set_axisbelow(True)
ax2.legend(frameon=False, loc='lower left', fontsize=9)

ax2.annotate('LayerNorm: output is identical', xy=(2.9, 1.0), xytext=(1.35, 0.87),
             fontsize=9, color=LN,
             arrowprops=dict(arrowstyle='->', color=LN, linewidth=1))
ax2.annotate('RMSNorm: output rotates away', xy=(2.3, 0.40), xytext=(1.6, 0.55),
             fontsize=9, color=RMS,
             arrowprops=dict(arrowstyle='->', color=RMS, linewidth=1))

fig.tight_layout(pad=1.4)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
fig.savefig(OUT, dpi=130, facecolor='white')
print('wrote', OUT)

# Numbers quoted in the post.
for d in (768, 4096):
    x = rng.standard_normal((20000, d))
    gap = 1 - cosine(layernorm(x), rmsnorm(x))
    print('d=%-5d mean gap = %.3e   1/2d = %.3e   mean cos = %.6f'
          % (d, gap.mean(), 1 / (2 * d), 1 - gap.mean()))
