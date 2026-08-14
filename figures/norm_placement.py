"""Figure for 'Pre-Norm vs. Post-Norm'.

A toy residual stack with linear sub-layers, forward and backward written out
by hand so there is no autograd dependency.

    pre-norm    x <- x + W N(x)
    post-norm   x <- N(x + W x)

with N the RMS normalizer, N(x) = x * sqrt(d) / ||x||, and W having entries
drawn from N(0, 1/d) so that E||Wz||^2 = ||z||^2.

Panel (a): the residual stream norm against depth. Pre-norm accumulates and
           grows as sqrt(L); post-norm is reset every layer and is flat.
Panel (b): the last layer's parameter gradient norm against depth, which is
           Theorem 1 of Xiong et al. (2020): independent of L for post-norm,
           damped by 1/sqrt(L) for pre-norm.

Note this toy does NOT reproduce the paper's Figure 3(b), where Post-LN's
per-layer gradient climbs toward the output. That profile depends on details
of the real architecture the toy leaves out. What the toy does capture is the
mechanism behind Theorem 1: the final normalization divides by the residual
stream norm, which under pre-norm has grown to sqrt(L).

Run:  python3 figures/norm_placement.py
"""

import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'static', 'images', 'pre-vs-post-norm.png')

PRE = '#3E6491'       # pre-norm, dusty blue
POST = '#8C77BC'      # post-norm, plum
REF = '#C48BAC'       # lavender, analytic reference
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

D = 512


def norm(x):
    """RMS normalizer: rescales x to have norm sqrt(d)."""
    return x * np.sqrt(len(x)) / np.linalg.norm(x)


def jac_t(y, g):
    """(dN/dy)^T g, for N(y) = y sqrt(d)/||y||. The Jacobian is symmetric."""
    n = np.linalg.norm(y)
    return (np.sqrt(len(y)) / n) * (g - y * (y @ g) / n ** 2)


def run(kind, weights, x0, target=None):
    """Forward, and if a target is given, backward. Returns norms per layer."""
    x = x0.copy()
    xs, us = [x.copy()], []
    for W in weights:
        if kind == 'pre':
            us.append(x.copy())                    # input to this layer's norm
            x = x + W @ norm(x)
        else:
            u = x + W @ x
            us.append(u)                           # input to this layer's norm
            x = norm(u)
        xs.append(x.copy())

    stream = np.array([np.linalg.norm(v) for v in xs])
    if target is None:
        return stream, None

    # Loss = -<output, target>, so the gradient at the output is -target.
    # Pre-norm applies one final normalization before the prediction head.
    g = -target
    if kind == 'pre':
        g = jac_t(xs[-1], g)

    grads = np.zeros(len(weights))
    for l in range(len(weights) - 1, -1, -1):
        W = weights[l]
        if kind == 'pre':
            h = norm(us[l])
            grads[l] = np.linalg.norm(np.outer(g, h))
            g = g + jac_t(us[l], W.T @ g)
        else:
            gu = jac_t(us[l], g)
            grads[l] = np.linalg.norm(np.outer(gu, xs[l]))
            g = gu + W.T @ gu
    return stream, grads


rng = np.random.default_rng(0)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.1))

# -- (a) the residual stream ------------------------------------------------

L_MAX, TRIALS = 128, 24
acc = acc_stream = {'pre': [], 'post': []}
for _ in range(TRIALS):
    W = [rng.standard_normal((D, D)) / np.sqrt(D) for _ in range(L_MAX)]
    x0 = norm(rng.standard_normal(D))
    for kind in acc:
        acc[kind].append(run(kind, W, x0)[0] / np.sqrt(D))

depth = np.arange(L_MAX + 1)
ax1.plot(depth, np.mean(acc['pre'], 0), color=PRE, linewidth=2.2, zorder=3,
         label='pre-norm')
ax1.plot(depth, np.mean(acc['post'], 0), color=POST, linewidth=2.2, zorder=3,
         label='post-norm')
# Drawn under the data and wider, so the measured curve stays visible.
ax1.plot(depth, np.sqrt(depth + 1), color=REF, linewidth=4, alpha=0.55,
         zorder=2, label=r'theory:  $\sqrt{L+1}$')

ax1.set_xlabel('layer $L$')
ax1.set_ylabel(r'residual stream norm  $\|x_L\| \, / \, \sqrt{d}$')
ax1.set_title('(a)  One stream grows, the other is reset',
              fontsize=11, loc='left', pad=12)
ax1.set_xlim(0, L_MAX)
ax1.grid(color=GRID, linewidth=0.8)
ax1.set_axisbelow(True)
ax1.legend(frameon=False, loc='upper left', fontsize=9)

# -- (b) the last layer's gradient, against depth ---------------------------

depths = [2, 4, 8, 16, 32, 64, 128]
last = {'pre': [], 'post': []}
for L in depths:
    tally = {'pre': [], 'post': []}
    for _ in range(TRIALS):
        W = [rng.standard_normal((D, D)) / np.sqrt(D) for _ in range(L)]
        x0 = norm(rng.standard_normal(D))
        t = rng.standard_normal(D)
        t /= np.linalg.norm(t)
        for kind in tally:
            tally[kind].append(run(kind, W, x0, t)[1][-1] / np.sqrt(D))
    for kind in last:
        last[kind].append(np.mean(tally[kind]))

ax2.plot(depths, last['pre'], color=PRE, linewidth=2.2, marker='o',
         markersize=4, zorder=3, label='pre-norm')
ax2.plot(depths, last['post'], color=POST, linewidth=2.2, marker='o',
         markersize=4, zorder=3, label='post-norm')
grid_d = np.array(depths, dtype=float)
ax2.plot(grid_d, 1 / np.sqrt(grid_d + 1), color=REF, linewidth=1.5,
         linestyle=(0, (5, 3)), zorder=4, label=r'theory:  $1/\sqrt{L+1}$')
ax2.axhline(1 / np.sqrt(2), color=REF, linewidth=1.5, linestyle=(0, (1, 2)),
            zorder=4, label=r'theory:  $1/\sqrt{2}$, constant in $L$')

ax2.set_xscale('log')
ax2.set_yscale('log')
ax2.set_xlabel('depth $L$')
ax2.set_ylabel(r'last layer gradient norm $/\ \sqrt{d}$')
ax2.set_title('(b)  Depth damps one gradient and not the other',
              fontsize=11, loc='left', pad=12)
ax2.grid(color=GRID, linewidth=0.8)
ax2.set_axisbelow(True)
ax2.legend(frameon=False, loc='lower left', fontsize=9)

fig.tight_layout(pad=1.4)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
fig.savefig(OUT, dpi=220, facecolor='white')
print('wrote', OUT)

# Numbers quoted in the post. These are read off the same averaged arrays
# that are plotted, not from a fresh draw.
stream = np.mean(acc_stream['pre'], 0)
print()
for n in (16, 64, 128):
    print('plotted pre-norm stream at L=%-4d %.3f   sqrt(L+1)=%.3f'
          % (n, stream[n], np.sqrt(n + 1)))
print()
for L, pr, po in zip(depths, last['pre'], last['post']):
    print('L=%-4d pre %.4f  (theory %.4f)   post %.4f'
          % (L, pr, 1 / np.sqrt(L + 1), po))
print('post-norm mean %.4f   1/sqrt(2)=%.4f'
      % (np.mean(last['post']), 1 / np.sqrt(2)))
