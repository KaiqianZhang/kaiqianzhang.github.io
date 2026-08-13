"""Figures for 'My Mindmap of LLMs'.

Four plots, one per stage of the map:

  mindmap-sparsity.png    how quickly n-grams outrun any corpus
  mindmap-softmax.png     the cost of a softmax over the vocabulary, and the
                          two ways word2vec avoids paying it
  mindmap-gradients.png   repeated Jacobian products through an RNN, against
                          an additive path of the kind a gate provides
  mindmap-perplexity.png  the exponentiated entropy of a model's own
                          predictive distribution -- which is bounded by V,
                          unlike held-out perplexity, which is not

The corpus for the first plot is the blog's other posts. The post this figure
appears in is excluded, so the measurement does not include itself and the
numbers stay stable as it is edited.

Run:  python3 figures/mindmap.py
"""

import glob
import os
import re

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'static', 'images')

BLUE = '#5F7396'
PLUM = '#8B7194'
SAGE = '#6E8C66'
LAV = '#8C7BA6'
CLAY = '#A87D76'
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


def save(fig, name):
    fig.tight_layout(pad=1.2)
    os.makedirs(OUT, exist_ok=True)
    fig.savefig(os.path.join(OUT, name), dpi=130, facecolor='white')
    print('wrote', name)


# -- 1. n-gram sparsity -----------------------------------------------------

def corpus_tokens():
    words = []
    for path in sorted(glob.glob(os.path.join(os.path.dirname(HERE),
                                              'posts', '*.md'))):
        if 'mindmap' in os.path.basename(path):
            continue                      # do not measure the post on itself
        text = open(path, encoding='utf-8').read()
        text = text.split('---', 2)[2] if text.startswith('---') else text
        text = re.sub(r'```.*?```', ' ', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\$\$.*?\$\$', ' ', text, flags=re.DOTALL)
        text = re.sub(r'\$[^$]*\$', ' ', text)
        words += re.findall(r"[a-z']+", text.lower())
    return words


tokens = corpus_tokens()
V = len(set(tokens))
print('corpus: %d tokens, %d distinct words' % (len(tokens), V))

orders = [1, 2, 3, 4, 5]
possible, seen, once = [], [], []
for n in orders:
    grams = {}
    for i in range(len(tokens) - n + 1):
        g = tuple(tokens[i:i + n])
        grams[g] = grams.get(g, 0) + 1
    possible.append(float(V) ** n)
    seen.append(len(grams))
    once.append(sum(1 for c in grams.values() if c == 1) / len(grams))
    print('  n=%d  possible=%.3g  distinct seen=%d  seen-once=%.1f%%'
          % (n, possible[-1], seen[-1], 100 * once[-1]))

fig, ax = plt.subplots(figsize=(7.2, 4.3))
ax.plot(orders, possible, color=PLUM, linewidth=2.2, marker='o', markersize=5,
        label=r'possible: $V^{\,n}$')
ax.plot(orders, seen, color=BLUE, linewidth=2.2, marker='o', markersize=5,
        label='ever actually seen')
ax.set_yscale('log')
ax.set_xticks(orders)
ax.set_xlabel('$n$, words of context')
ax.set_ylabel('number of distinct $n$-grams')
ax.set_title('Every word of context multiplies the space by $V$',
             fontsize=11, loc='left', pad=12)
ax.grid(color=GRID, linewidth=0.8)
ax.set_axisbelow(True)
ax.legend(frameon=False, loc='upper left', fontsize=9)
# Label the shrinking coverage from n=2 on; at n=1 it is trivially 1.0.
for n_, p_, s_ in zip(orders, possible, seen):
    if n_ == 1:
        continue
    ax.annotate('%.0e of the space' % (s_ / p_) if n_ == 2 else '%.0e' % (s_ / p_),
                (n_, s_), textcoords='offset points', xytext=(0, -18),
                ha='center', fontsize=8, color=MUTED)
ax.set_ylim(bottom=possible[0] / 60, top=possible[-1] * 40)
save(fig, 'mindmap-sparsity.png')


# -- 2. the softmax bill ----------------------------------------------------

fig, ax = plt.subplots(figsize=(7.2, 4.3))
vocab = np.logspace(3, 6.3, 200)
ax.plot(vocab, vocab, color=PLUM, linewidth=2.2,
        label=r'full softmax:  $O(V)$')
ax.plot(vocab, np.log2(vocab), color=BLUE, linewidth=2.2,
        label=r'hierarchical softmax:  $O(\log_2 V)$')
ax.axhline(6, color=SAGE, linewidth=2.2,
           label=r'negative sampling:  $O(k)$, here $k=5$')
ax.set_xscale('log')
ax.set_yscale('log')
ax.set_xlabel('vocabulary size $V$')
ax.set_ylabel('output-layer work per training example')
ax.set_title('Two ways not to pay for the whole vocabulary',
             fontsize=11, loc='left', pad=12)
ax.grid(color=GRID, linewidth=0.8)
ax.set_axisbelow(True)
ax.legend(frameon=False, loc='upper left', fontsize=9)
for x in (50000,):
    ax.axvline(x, color=MUTED, linewidth=0.8, linestyle=':')
    ax.text(x * 1.25, 2.0e5, 'V = 50,000', fontsize=8.5, color=MUTED,
            ha='left', va='top')
print('at V=50000:  full=%d  hierarchical=%.1f  negative=6'
      % (50000, np.log2(50000)))
save(fig, 'mindmap-softmax.png')


# -- 3. gradients through time ----------------------------------------------

rng = np.random.default_rng(0)
D, T, TRIALS = 64, 60, 30
steps = np.arange(1, T + 1)


def scaled(rho):
    """A random matrix rescaled to have exactly the given spectral radius."""
    W = rng.standard_normal((D, D))
    return W * (rho / max(abs(np.linalg.eigvals(W))))


def back_through_time(rho, saturating):
    """Norm of the gradient after being pushed back through T Jacobians."""
    out = []
    for _ in range(TRIALS):
        W = scaled(rho)
        g = rng.standard_normal(D)
        g /= np.linalg.norm(g)
        h = np.tanh(rng.standard_normal(D))
        norms = []
        for _t in range(T):
            if saturating:
                h = np.tanh(W @ h)
                g = W.T @ ((1 - h ** 2) * g)   # tanh' folds into the Jacobian
            else:
                g = W.T @ g                    # the linear recurrence
            norms.append(np.linalg.norm(g))
        out.append(norms)
    return np.exp(np.mean(np.log(np.array(out) + 1e-300), axis=0))


fig, (axA, axB) = plt.subplots(1, 2, figsize=(11, 4.3), sharey=True)

# (a) the textbook picture: a bare repeated Jacobian, no nonlinearity.
for rho, colour in ((0.8, BLUE), (1.2, PLUM)):
    axA.plot(steps, back_through_time(rho, False), color=colour, linewidth=2.2,
             label=r'$\rho(W)=%.1f$' % rho)
    axA.plot(steps, rho ** steps, color=LAV, linewidth=1.3,
             linestyle=(0, (5, 3)), zorder=5,
             label=r'$\rho^{\,T}$' if rho == 0.8 else None)
axA.set_title('(a)  A bare matrix, applied over and over',
              fontsize=11, loc='left', pad=12)
axA.set_ylabel('gradient norm reaching that step')
axA.legend(frameon=False, loc='lower left', fontsize=9)

# (b) the same matrices through tanh, which is the model actually written down.
for rho, colour in ((0.8, BLUE), (1.2, PLUM)):
    axB.plot(steps, back_through_time(rho, True), color=colour, linewidth=2.2,
             label=r'$\rho(W)=%.1f$, through $\tanh$' % rho)
axB.plot(steps, np.ones_like(steps, dtype=float), color=SAGE, linewidth=2.0,
         linestyle=(0, (6, 3)),
         label='idealized additive path (not simulated)')
axB.set_title('(b)  The same matrices, through the nonlinearity',
              fontsize=11, loc='left', pad=12)
axB.legend(frameon=False, loc='lower left', fontsize=9)

for ax in (axA, axB):
    ax.set_yscale('log')
    ax.set_xlabel('time steps back through the sequence')
    ax.set_xlim(1, T)
    ax.set_ylim(1e-8, 1e6)
    ax.grid(color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)

print('linear rho=0.8 at T=50 : %.2e   (0.8^50 = %.2e)'
      % (back_through_time(0.8, False)[49], 0.8 ** 50))
print('linear rho=1.2 at T=50 : %.2e   (1.2^50 = %.2e)'
      % (back_through_time(1.2, False)[49], 1.2 ** 50))
print('tanh   rho=0.8 at T=50 : %.2e' % back_through_time(0.8, True)[49])
print('tanh   rho=1.2 at T=50 : %.2e  <- still below 1: vanishes, not explodes'
      % back_through_time(1.2, True)[49])
save(fig, 'mindmap-gradients.png')


# -- 4. perplexity as a branching factor ------------------------------------

fig, ax = plt.subplots(figsize=(7.2, 4.3))
VOCAB = 50000
logits = rng.standard_normal(VOCAB)
temps = np.logspace(-1.4, 1.4, 160)
ppl = []
for t in temps:
    p = np.exp((logits - logits.max()) / t)
    p /= p.sum()
    ppl.append(np.exp(-(p * np.log(p + 1e-300)).sum()))
ax.plot(temps, ppl, color=BLUE, linewidth=2.4)
ax.axhline(VOCAB, color=PLUM, linewidth=1.4, linestyle=(0, (5, 3)))
ax.axhline(1, color=SAGE, linewidth=1.4, linestyle=(0, (5, 3)))
ax.text(temps[0] * 1.1, VOCAB * 0.45, 'V = 50,000: no idea at all',
        fontsize=8.5, color=PLUM)
ax.text(temps[0] * 1.1, 1.25, 'PPL = 1: certain', fontsize=8.5, color=SAGE)
ax.set_xscale('log')
ax.set_yscale('log')
ax.set_xlabel('softmax temperature (sharper $\\leftarrow$   $\\rightarrow$ flatter)')
ax.set_ylabel("perplexity of the model's own next-word distribution")
ax.set_title('Confidence, read as a number of options',
             fontsize=11, loc='left', pad=12)
ax.set_ylim(0.8, 1.4e5)
ax.grid(color=GRID, linewidth=0.8)
ax.set_axisbelow(True)
save(fig, 'mindmap-perplexity.png')

# A uniform distribution over exactly k words has perplexity k, exactly.
for k in (2, 10, 1000):
    p = np.zeros(VOCAB)
    p[:k] = 1.0 / k
    h = -(p[:k] * np.log(p[:k])).sum()
    print('uniform over %-5d words -> perplexity %.4f' % (k, np.exp(h)))
