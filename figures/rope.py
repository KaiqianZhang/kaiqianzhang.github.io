"""Figures for 'RoPE'.

Two figures, placed in different sections of the post.

rope-invariance.png  the attention logit q_m . k_n for one fixed random (q, k)
                     pair over all position pairs. RoPE makes it a function of
                     m - n alone, which shows up as perfect diagonal banding.
rope-wavelengths.png the wavelength of each frequency band -- how many tokens
                     that band needs to complete one full turn -- against band
                     index, with the regimes YaRN treats differently.

Run:  python3 figures/rope.py
"""

import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'static', 'images')

Q = '#5F7396'         # query / band curve, dusty blue
K = '#8B7194'         # key, plum
REF = '#8C7BA6'       # lavender
ACCENT = '#A8443E'    # salient marker
GRID = '#DEDAD4'
TEXT = '#3F3F3F'
MUTED = '#6E6E6E'

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

DIVERGING = LinearSegmentedColormap.from_list(
    'morandi', ['#6E5A78', '#8B7194', '#C9BFC9', '#F2EFEA',
                '#B9C2D0', '#5F7396', '#3E5273'])


def rope(x, pos, base=10000.0):
    """Rotate each 2-D slice of x by pos * theta_i."""
    d = x.shape[-1]
    i = np.arange(d // 2)
    theta = base ** (-2.0 * i / d)
    ang = np.outer(np.atleast_1d(pos), theta)          # [P, d/2]
    a, b = x[..., 0::2], x[..., 1::2]
    out = np.empty(ang.shape[:1] + (d,))
    out[:, 0::2] = a * np.cos(ang) - b * np.sin(ang)
    out[:, 1::2] = a * np.sin(ang) + b * np.cos(ang)
    return out


fig1, ax1 = plt.subplots(figsize=(5.4, 4.6))

# -- (a) the logit depends only on m - n ------------------------------------

D, N = 64, 128
rng = np.random.default_rng(0)
q = rng.standard_normal(D)
k = rng.standard_normal(D)
pos = np.arange(N)
Qm, Kn = rope(q, pos), rope(k, pos)
logits = Qm @ Kn.T / np.sqrt(D)

lim = np.abs(logits).max()
im = ax1.imshow(logits, cmap=DIVERGING, vmin=-lim, vmax=lim, origin='lower')
ax1.set_xlabel('key position $n$')
ax1.set_ylabel('query position $m$')
ax1.set_title('Constant along every diagonal',
              fontsize=11, loc='left', pad=12)
cb = fig1.colorbar(im, ax=ax1, fraction=0.046, pad=0.03)
cb.set_label('attention logit', fontsize=9)
cb.outline.set_edgecolor('#BFBFBF')

# How exactly constant? Compare each diagonal's spread to the overall spread.
worst = max(np.ptp(np.diagonal(logits, off)) for off in range(-N + 1, N))
print('largest spread within any single diagonal : %.3e' % worst)
print('overall spread of the logits              : %.3e' % np.ptp(logits))

fig1.tight_layout(pad=1.2)
os.makedirs(OUT, exist_ok=True)
fig1.savefig(os.path.join(OUT, 'rope-invariance.png'), dpi=130,
             facecolor='white')
print('wrote rope-invariance.png')

# -- how long each band takes to come back round ----------------------------

fig2, ax2 = plt.subplots(figsize=(7.2, 4.4))
d_head = 128
i = np.arange(d_head // 2)
for base, colour, style, label in ((10000.0, Q, '-', r'base $10^4$  (Llama 1/2)'),
                                   (500000.0, K, '-', r'base $5\times10^5$  (Llama 3)')):
    lam = 2 * np.pi * base ** (2.0 * i / d_head)
    ax2.plot(i, lam, color=colour, linewidth=2.2, linestyle=style, zorder=4,
             label=label)

L = 4096
ax2.axhline(L, color=ACCENT, linewidth=1.3, linestyle=(0, (5, 3)), zorder=3)
ax2.text(1, L * 1.5, 'training context, 4096 tokens', fontsize=8.5,
         color=ACCENT)

# YaRN's regimes, set by the ratio r = L / wavelength with alpha=1, beta=32.
# Neutral tint, deepening with wavelength, so the bands cannot be mistaken
# for belonging to either plotted series.
ax2.axhspan(1, L / 32, color='#B9B3AB', alpha=0.12, zorder=1)
ax2.axhspan(L / 32, L, color='#B9B3AB', alpha=0.26, zorder=1)
ax2.axhspan(L, 1e8, color='#B9B3AB', alpha=0.42, zorder=1)
for x, y, txt in ((30, 11, 'wraps many times: left alone'),
                  (2, 620, 'partly stretched'),
                  (29, 1.5e6, 'never wraps: interpolated')):
    ax2.text(x, y, txt, fontsize=8.5, color=MUTED, ha='left', va='center')

ax2.set_yscale('log')
ax2.set_xlim(0, 63)
ax2.set_ylim(3, 1e7)
ax2.set_xlabel('frequency band $i$')
ax2.set_ylabel('wavelength: tokens per full turn')
ax2.set_title('From six tokens to millions',
              fontsize=11, loc='left', pad=12)
ax2.grid(color=GRID, linewidth=0.8)
ax2.set_axisbelow(True)
ax2.legend(frameon=False, loc='upper left', fontsize=9)

fig2.tight_layout(pad=1.2)
fig2.savefig(os.path.join(OUT, 'rope-wavelengths.png'), dpi=130,
             facecolor='white')
print('wrote rope-wavelengths.png')

# Numbers quoted in the post.
print()
for base in (10000.0, 500000.0):
    lam = 2 * np.pi * base ** (2.0 * i / d_head)
    print('base %-8g fastest band %.2f tokens, slowest %.0f tokens'
          % (base, lam[0], lam[-1]))
lam = 2 * np.pi * 10000.0 ** (2.0 * i / d_head)
print('bands with wavelength > 4096 (never wrap in context): %d of %d'
      % ((lam > 4096).sum(), len(lam)))
print('bands with wavelength < 4096/32 (left alone by YaRN): %d of %d'
      % ((lam < 4096 / 32).sum(), len(lam)))

# -- does the inner product actually decay? ---------------------------------
# Su et al.'s Figure 2 plots an upper bound. This compares that bound against
# the realised logit magnitude for random q, k -- which is flat, exactly.

fig3, ax3 = plt.subplots(figsize=(7.2, 4.4))
d, base = 128, 10000.0
j = np.arange(d // 2)
th = base ** (-2.0 * j / d)
t = np.arange(10, 257)      # the range Su et al.'s own figure plots

# The paper's quantity: mean over partial sums S_j of |sum_{i<j} e^{i t theta_i}|.
phases = np.exp(1j * np.outer(t, th))                      # [T, d/2]
S = np.cumsum(phases, axis=1)
bound = np.abs(S).mean(axis=1)

rng = np.random.default_rng(1)
q = rng.standard_normal((6000, d))
k = rng.standard_normal((6000, d))
a = q[:, 0::2] * k[:, 0::2] + q[:, 1::2] * k[:, 1::2]
b = q[:, 1::2] * k[:, 0::2] - q[:, 0::2] * k[:, 1::2]
rms = np.array([(a * np.cos(tt * th) + b * np.sin(tt * th)).sum(1).std()
                for tt in t])

ax3.plot(t, bound / bound[0], color=REF, linewidth=2.2, zorder=3,
         label="Su et al.'s upper bound")
ax3.plot(t, rms / rms[0], color=Q, linewidth=2.2, zorder=4,
         label='realised logit, RMS over random $q,k$')
ax3.axhline(1.0, color=MUTED, linewidth=0.9, linestyle=(0, (1, 3)), zorder=2)

ax3.set_xlabel('relative distance $m-n$')
ax3.set_ylabel('relative to its value at distance 10')
ax3.set_title('The bound falls. The thing underneath it does not.',
              fontsize=11, loc='left', pad=12)
ax3.set_xlim(10, 256)
ax3.set_ylim(0, 1.25)
ax3.grid(color=GRID, linewidth=0.8)
ax3.set_axisbelow(True)
ax3.legend(frameon=False, loc='lower left', fontsize=9)

fig3.tight_layout(pad=1.2)
fig3.savefig(os.path.join(OUT, 'rope-decay-test.png'), dpi=130,
             facecolor='white')
print('wrote rope-decay-test.png')
print('bound at t=250 relative to t=10 : %.3f' % (bound[-7] / bound[0]))
print('RMS   at t=250 relative to t=10 : %.3f' % (rms[-7] / rms[0]))
print('RMS is sqrt(d) = %.3f throughout (max deviation %.3f)'
      % (np.sqrt(d), np.abs(rms - np.sqrt(d)).max()))
