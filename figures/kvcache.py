"""Figure for 'The KV Cache'.

Decodes the same sequence twice through one real attention layer -- once
keeping a cache of past keys and values, once recomputing the whole prefix at
every step -- and times both.

Two things are being checked, and they are different in kind:

  1. The cache is *exact*. The cached output at every step must equal the last
     row of the recomputed output to floating-point tolerance. If this failed,
     nothing else here would matter.
  2. The arithmetic has a closed form. Per step the recomputing decoder does
     exactly t times the work of the caching one, because every one of its
     terms carries a factor t that the cached step does not:

         cached      step t:  8 d^2 + 4 t d
         recomputed  step t:  8 t d^2 + 4 t^2 d

     Summed over n steps that is O(n d^2 + n^2 d) against O(n^2 d^2 + n^3 d).

Panel (a) is per-step time against t, with the FLOP prediction over it.
Panel (b) is the cumulative cost, which is the number anyone actually pays.

Run:  python3 figures/kvcache.py
Writes static/images/kv-cache-cost.png
"""

import os
import time

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from palette import LAVENDER, BLUE, MARKER, GRID, AXIS, TEXT, MUTED

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'static', 'images', 'kv-cache-cost.png')

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Helvetica', 'Arial', 'DejaVu Sans'],
    'font.size': 16,
    'axes.edgecolor': AXIS,
    'axes.labelcolor': TEXT,
    'text.color': TEXT,
    'xtick.color': MUTED,
    'ytick.color': MUTED,
    'axes.spines.top': False,
    'axes.spines.right': False,
})

# One attention layer, GPT-2 small's shape, so the numbers are recognisable.
D, H, N = 768, 12, 320
DH = D // H
REPEATS = 5

rng = np.random.default_rng(0)
Wq = rng.normal(0, D ** -0.5, (D, D))
Wk = rng.normal(0, D ** -0.5, (D, D))
Wv = rng.normal(0, D ** -0.5, (D, D))
Wo = rng.normal(0, D ** -0.5, (D, D))
X = rng.normal(0, 1, (N, D))            # the layer's input for the whole run


def heads(a):
    """(t, D) -> (H, t, DH)."""
    return a.reshape(-1, H, DH).transpose(1, 0, 2)


def attend(q, K, V):
    """q: (H, tq, DH), K/V: (H, tk, DH). Causal only where tq == tk."""
    s = q @ K.transpose(0, 2, 1) / np.sqrt(DH)
    if q.shape[1] == K.shape[1]:
        s = s + np.triu(np.full((q.shape[1], q.shape[1]), -np.inf), 1)
    s = s - s.max(-1, keepdims=True)
    p = np.exp(s)
    p /= p.sum(-1, keepdims=True)
    return (p @ V).transpose(1, 0, 2).reshape(q.shape[1], D)


def step_cached(t, Kc, Vc):
    """Project token t-1 only, append to the cache, attend over all of it."""
    x = X[t - 1:t]
    q, k, v = heads(x @ Wq), heads(x @ Wk), heads(x @ Wv)
    Kc = k if Kc is None else np.concatenate([Kc, k], axis=1)
    Vc = v if Vc is None else np.concatenate([Vc, v], axis=1)
    return attend(q, Kc, Vc) @ Wo, Kc, Vc


def step_recomputed(t):
    """No cache: push the whole prefix through again and keep the last row."""
    xs = X[:t]
    q, k, v = heads(xs @ Wq), heads(xs @ Wk), heads(xs @ Wv)
    return (attend(q, k, v) @ Wo)[-1:]


def timed(fn):
    best = np.inf
    for _ in range(REPEATS):
        t0 = time.perf_counter()
        fn()
        best = min(best, time.perf_counter() - t0)
    return best


ts = list(range(1, N + 1))
t_cached, t_recomp, worst_gap = [], [], 0.0
Kc = Vc = None

for t in ts:
    out_c, Kc, Vc = step_cached(t, Kc, Vc)          # advance the cache once
    K_, V_ = Kc, Vc
    t_cached.append(timed(lambda: step_cached(t, K_[:, :t - 1], V_[:, :t - 1])))
    t_recomp.append(timed(lambda: step_recomputed(t)))
    worst_gap = max(worst_gap, np.abs(out_c - step_recomputed(t)).max())

t_cached = np.array(t_cached) * 1e3                 # milliseconds
t_recomp = np.array(t_recomp) * 1e3
ts = np.array(ts, dtype=float)

flops_cached = 8 * D ** 2 + 4 * ts * D
flops_recomp = 8 * ts * D ** 2 + 4 * ts ** 2 * D

# One fitted constant for both curves -- the achieved rate of this machine --
# so the shapes are the claim, not the scale.
rate = float(np.sum(np.concatenate([flops_cached, flops_recomp])
                    * np.concatenate([t_cached, t_recomp]))
             / np.sum(np.concatenate([t_cached, t_recomp]) ** 2))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5.0))

ax1.plot(ts, t_recomp, lw=0, marker='o', ms=3.0, color=BLUE, alpha=.55)
ax1.plot(ts, flops_recomp / rate, lw=1.9, color=BLUE)
ax1.plot(ts, t_cached, lw=0, marker='o', ms=3.0, color=LAVENDER, alpha=.55)
ax1.plot(ts, flops_cached / rate, lw=1.9, color=LAVENDER)
ax1.set_yscale('log')
# Labelled on the curves rather than in a legend box: at this size a legend
# large enough to read is a legend large enough to cover the data.
ax1.text(300, 13, 'no cache', color=BLUE, fontsize=15, ha='right', va='bottom')
ax1.text(300, 0.95, r'$8td^2 + 4t^2d$', color=BLUE, fontsize=13, ha='right')
ax1.text(300, 0.42, 'with cache', color=LAVENDER, fontsize=15, ha='right',
         va='top')
ax1.text(300, 0.033, r'$8d^2 + 4td$', color=LAVENDER, fontsize=13, ha='right')
ax1.set_xlabel('$t$, tokens already generated')
ax1.set_ylabel('time per token (ms), log')
ax1.set_title('(a) one step', loc='left', fontsize=17)
# The cached measurement sits well above its own FLOP prediction and stays
# flat. That gap is not an error in the prediction; it is the fixed cost of
# issuing the call at all, and it is the whole reason decoding is not
# compute-bound in practice. Label it rather than hide it.
mid = len(ts) // 2
ax1.annotate('one token cannot fill the machine:\nfixed overhead, not arithmetic',
             xy=(ts[mid], t_cached[mid] * 0.92), xytext=(20, 0.11),
             fontsize=13, color=MARKER, ha='left', va='center',
             arrowprops=dict(arrowstyle='-', color=MARKER, lw=.9,
                             connectionstyle='arc3,rad=0.12'))
ax1.grid(color=GRID, lw=.7)
ax1.set_axisbelow(True)

cum_c, cum_r = np.cumsum(t_cached), np.cumsum(t_recomp)
ax2.plot(ts, cum_r, lw=2.2, color=BLUE, label='no cache')
ax2.plot(ts, cum_c, lw=2.2, color=LAVENDER, label='with cache')
ax2.fill_between(ts, cum_c, cum_r, color=BLUE, alpha=.10, lw=0)
ax2.annotate('%.0f$\\times$ less work\nby token %d' % (cum_r[-1] / cum_c[-1], N),
             xy=(ts[-1], (cum_r[-1] + cum_c[-1]) / 2), xytext=(-14, 0),
             textcoords='offset points', ha='right', va='center',
             fontsize=15, color=MARKER)
ax2.set_xlabel('tokens generated')
ax2.set_ylabel('cumulative time (ms)')
ax2.set_title('(b) the whole sequence', loc='left', fontsize=17)
ax2.legend(frameon=False, fontsize=14, loc='upper left')
ax2.grid(color=GRID, lw=.7)
ax2.set_axisbelow(True)

fig.tight_layout()
fig.savefig(OUT, dpi=170, facecolor='white')

pred_ratio = flops_recomp[-1] / flops_cached[-1]
print('d = %d, heads = %d, tokens = %d' % (D, H, N))
print('exactness: largest |cached - recomputed| over all %d steps = %.2e'
      % (N, worst_gap))
print('cumulative: %.1f ms cached, %.1f ms recomputed  ->  %.1fx'
      % (cum_c[-1], cum_r[-1], cum_r[-1] / cum_c[-1]))
print('per-step at t = %d: predicted ratio %.0fx, measured %.0fx'
      % (N, pred_ratio, t_recomp[-1] / t_cached[-1]))
print('fitted rate: %.1f GFLOP/s' % (rate / 1e9 * 1e3))
print('wrote %s' % OUT)
