---
title: "My Mindmap of LLMs: Past Lives and Present"
subtitle: Every idea a transformer replaced was itself a fix for the thing before it, and the whole chain is one argument about how to represent a word.
date: 2026-08-10
tags: llm
icon: 🍵
---

I keep a mindmap of how language models got here. It starts at counting words
and ends at a single node reading *Transformer*, and the useful thing about
having it on one page is that the arrows between branches turn out to matter
more than the branches.

Each idea in the chain is a repair of a specific, nameable failure in the one
before it. Nothing appears because someone thought it was elegant. This post
walks that chain, with the map's own structure as the outline. The whole of
it fits on one line:

<div class='roadmap'>
            <svg viewBox='0 0 720 118' role='img' aria-label='Roadmap: counts, then vectors, then memory, then context, then all at once. Each step is forced by a failure in the one before it.'>
              <line class='spine' x1='72' y1='46' x2='648' y2='46'/>
              <polygon class='head' points='151,46 142,42 142,50'/>
              <polygon class='head' points='295,46 286,42 286,50'/>
              <polygon class='head' points='439,46 430,42 430,50'/>
              <polygon class='head' points='583,46 574,42 574,50'/>
              <text class='why' x='144' y='30'>no similarity</text>
              <text class='why' x='288' y='30'>no order</text>
              <text class='why' x='432' y='30'>one vector per word</text>
              <text class='why' x='576' y='30'>sequential</text>
              <circle class='dot' cx='72' cy='46' r='4.5'/>
              <text class='stage' x='72' y='72'>counts</text>
              <text class='models' x='72' y='89'>n-gram · NNLM</text>
              <text class='sec' x='72' y='108'>§1</text>
              <circle class='dot' cx='216' cy='46' r='4.5'/>
              <text class='stage' x='216' y='72'>vectors</text>
              <text class='models' x='216' y='89'>Word2Vec · GloVe</text>
              <text class='sec' x='216' y='108'>§2</text>
              <circle class='dot' cx='360' cy='46' r='4.5'/>
              <text class='stage' x='360' y='72'>memory</text>
              <text class='models' x='360' y='89'>RNN · LSTM</text>
              <text class='sec' x='360' y='108'>§3</text>
              <circle class='dot' cx='504' cy='46' r='4.5'/>
              <text class='stage' x='504' y='72'>context</text>
              <text class='models' x='504' y='89'>ELMo</text>
              <text class='sec' x='504' y='108'>§4</text>
              <circle class='dot' cx='648' cy='46' r='4.5'/>
              <text class='stage' x='648' y='72'>all at once</text>
              <text class='models' x='648' y='89'>Transformer</text>
              <text class='sec' x='648' y='108'>§5</text>
            </svg>
        </div>

[TOC]

## What the Map Is For

The map has two big branches — the era of counting and the era of sequences —
and a scattering of side notes on evaluation and normalization. What the strip
above compresses is the single line running through all of it: a word is a
count, then a direction, then a direction that depends on its neighbours, then
one that depends on all of them at once.

The labels above the arrows are the load-bearing part. Each is a specific
defect in the method to its left, and the method to its right exists to
answer it. Read the post as four such answers.

## 1. When a Word Was Just a Count

A language model assigns probability to text, and the chain rule says you can
build it one word at a time:

$$
P(w_1 w_2 \ldots w_T) = P(w_1)\,P(w_2 \mid w_1)\,P(w_3 \mid w_1 w_2)\cdots
$$

The **statistical language model** estimates each factor by counting. Since
conditioning on all of history is hopeless, an **n-gram** model truncates it:
use the previous $n-1$ words to predict the $n$th, and estimate that
probability by counting how often the combination appeared.

The failure is immediate and arithmetic. A vocabulary of $V$ words has $V^n$
possible $n$-grams, and $V^n$ grows faster than any corpus.

<div class='figure'>
    <img src='/images/mindmap-sparsity.png'
         alt='Log-scale plot of possible n-grams against n-grams ever observed, for n from 1 to 5. The possible count rises steeply; the observed count is nearly flat.'>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        Measured on this blog's own three posts — 8,168 words, 1,640 of them
        distinct. At $n = 1$ every word in the space is observed by
        definition. By $n = 5$ there are $1.2 \times 10^{16}$ possible
        five-word sequences and exactly 8,052 ever occur, which is
        $7\times10^{-13}$ of the space. Worse, <b>98.9%</b> of those 8,052
        occur exactly once, so almost every count the model would rely on is
        the number 1. A bigger corpus moves these numbers and does not change
        their shape.
    </div>
</div>

Everything unseen gets probability zero, which the chain rule then propagates
to the whole sentence. Smoothing and backoff patch this; they do not fix it,
because the real problem is that the model has no notion that two words might
be *similar*. To an n-gram counter, "cat" and "dog" are as unrelated as "cat"
and "thermodynamics".

**NNLM**, the neural language model, was the first serious attempt at that.
Three layers — input, hidden, output — take a sequence and predict the
probability of the next word. But the input is **one-hot**: a vector as long
as the vocabulary, all zeros but one. My map's note on it is the whole
problem in one line: *lose the word meaning, dimension is horribly large*.
Two one-hot vectors for any two distinct words are orthogonal. Similarity is
not merely unmeasured; it is unrepresentable.

## 2. When a Word Became a Direction

**Word2Vec**'s goal is stated in the map as: generate word embeddings. The
insight is to get them as a side effect. Set up a fake prediction task, train
a shallow network on it, and throw the network away — the weights are the
embeddings.

There are two ways to arrange that task, and they are mirror images.

<div class='figure-pair w2v-anim'>
    <div class='panels'>
        <div class='panel' style='flex: 1 1 100%'>
            <svg viewBox='0 0 460 250' role='img'
                 aria-label='A window slides along the sentence "the cat sat on the warm mat". In the upper row, labelled CBOW, arrows point inward from the four context words to the centre word. In the lower row, labelled Skip-gram, arrows point outward from the centre word to the four context words.'>
                <g class='cbow'>
                    <text class='rowlabel' x='6' y='24'>CBOW</text>
                    <g class='slide' transform='translate(170 0)'>
                        <rect class='frame' x='-152' y='34' width='304' height='58' rx='9'/>
                        <rect class='centre' x='-26' y='40' width='52' height='30' rx='6'/>
                        <g class='arrow'>
                            <line x1='-134' y1='82' x2='-108' y2='82'/><polygon points='-100,82 -110,77 -110,87'/>
                            <line x1='-74' y1='82' x2='-48' y2='82'/><polygon points='-40,82 -50,77 -50,87'/>
                            <line x1='74' y1='82' x2='48' y2='82'/><polygon points='40,82 50,77 50,87'/>
                            <line x1='134' y1='82' x2='108' y2='82'/><polygon points='100,82 110,77 110,87'/>
                        </g>
                    </g>
                    <text class='word' x='50' y='62'>the</text>
                    <text class='word' x='110' y='62'>cat</text>
                    <text class='word' x='170' y='62'>sat</text>
                    <text class='word' x='230' y='62'>on</text>
                    <text class='word' x='290' y='62'>the</text>
                    <text class='word' x='350' y='62'>warm</text>
                    <text class='word' x='410' y='62'>mat</text>
                </g>
                <g class='skip'>
                    <text class='rowlabel' x='6' y='159'>SKIP-GRAM</text>
                    <g class='slide' transform='translate(170 0)'>
                        <rect class='frame' x='-152' y='169' width='304' height='58' rx='9'/>
                        <rect class='centre' x='-26' y='175' width='52' height='30' rx='6'/>
                        <g class='arrow'>
                            <line x1='-108' y1='217' x2='-134' y2='217'/><polygon points='-142,217 -132,212 -132,222'/>
                            <line x1='-48' y1='217' x2='-74' y2='217'/><polygon points='-82,217 -72,212 -72,222'/>
                            <line x1='48' y1='217' x2='74' y2='217'/><polygon points='82,217 72,212 72,222'/>
                            <line x1='108' y1='217' x2='134' y2='217'/><polygon points='142,217 132,212 132,222'/>
                        </g>
                    </g>
                    <text class='word' x='50' y='197'>the</text>
                    <text class='word' x='110' y='197'>cat</text>
                    <text class='word' x='170' y='197'>sat</text>
                    <text class='word' x='230' y='197'>on</text>
                    <text class='word' x='290' y='197'>the</text>
                    <text class='word' x='350' y='197'>warm</text>
                    <text class='word' x='410' y='197'>mat</text>
                </g>
            </svg>
            <div class='annot'>
                <span class='who'>The same window, two directions.</span>
                <b>CBOW</b> hides the middle word and asks the four
                neighbours to guess it — a cloze test, in my map's phrasing:
                given the context, predict the probability of the word in the
                blank. <b>Skip-gram</b> reverses every arrow: it shows the
                middle word and asks it to guess each neighbour in turn.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 2.</span>
        The window slides across the sentence, and every position it stops at
        is one training example. Neither task is interesting in itself —
        nobody wants a model that predicts "sat" from "the cat on the". The
        point is the projection layer in the middle, which has to compress a
        word into a few hundred numbers to do the job at all. Those numbers
        are what you keep.
    </div>
</div>

The original paper draws the same pair as wiring diagrams:

<div class='figure'>
    <img src='/images/word2vec-architectures.png'
         alt='The CBOW and Skip-gram architectures as input-projection-output diagrams. CBOW sums four context inputs into a projection and outputs the middle word; Skip-gram takes the middle word and outputs the four context words.'>
    <div class='caption'>
        <span class='caption-label'>Figure 3.</span>
        Note what is <i>not</i> in either diagram: any recurrence, any
        ordering inside the window, any depth. The context words are
        <i>averaged</i>, in the paper's own word, so "cat sat on the" and "the
        on sat cat" produce the same projection.
        This is a bag of words with a lookup table attached, and it was enough
        to make word vectors that do arithmetic.
        <br>
        Figure 1, Mikolov et al. (2013), tinted.
    </div>
</div>

Which of the two you want depends on the corpus, and my map is blunt about
it: **CBOW is quick**, suits large-scale text like news; **Skip-gram is
precise**, suits low-frequency words like legal terminology. That framing
comes from word2vec's own documentation rather than from either paper — the
2013 paper reports only that CBOW trained in about a day against Skip-gram's
three — but the mechanism behind it is clear enough. The reason is sample
count. Skip-gram generates one training pair per context word, so a
rare word in the middle produces several gradient updates; CBOW averages its
context into a single update and lets frequent patterns dominate.

### The bill at the output layer

Both models end in a softmax over the entire vocabulary, and that is $O(V)$
work for every training example. With $V = 50{,}000$ and billions of
examples, this is the whole cost of training.

Word2Vec ships two ways out, and both are in the map.

**Negative sampling** stops trying to be a language model at all. Instead of
"which of the 50,000 words is it?", ask "is this pair real?" — one true word
against $k$ sampled fakes. The cost falls from $O(V)$ to $O(k)$, with $k$
around 5.

**Hierarchical softmax** keeps the probabilistic framing but arranges the
vocabulary as a binary tree. Reaching a word means making $\log_2 V$ binary
decisions, so the cost falls to $O(\log_2 V)$.

<div class='figure'>
    <img src='/images/mindmap-softmax.png'
         alt='Log-log plot of output-layer work against vocabulary size, showing a linear cost curve for full softmax, a logarithmic curve for hierarchical softmax, and a flat line for negative sampling.'>
    <div class='caption'>
        <span class='caption-label'>Figure 4.</span>
        At a vocabulary of 50,000 the full softmax costs 50,000 units of work
        per example, hierarchical softmax costs about 16, and negative
        sampling with $k=5$ costs 6. The gap is four orders of magnitude, and
        it is the difference between an idea and a trainable model. Note the
        shapes rather than the constants: negative sampling does not grow with
        $V$ at all, which is why it became the default.
    </div>
</div>

**GloVe** takes what my map calls the *global view*. Word2Vec learns from one
window at a time and never sees the corpus as a whole. GloVe first builds a
co-occurrence matrix $X \in \mathbb{R}^{V \times V}$, counting how often each
word appears near each other word, then factorizes it so that vector
arithmetic reproduces ratios of those counts. Same output — a table of word
vectors — from the opposite direction: all the statistics at once rather than
one window at a time. The matrix is enormous and, as the map notes, sparse.

## 3. When Order Started to Matter

Word vectors have a hard limit, and it is not subtle. They are a lookup
table. "Bank" has one vector, whether the sentence is about money or a river.
And a bag of context words has thrown away order, so "dog bites man" and "man
bites dog" are the same input.

Feed-forward networks cannot fix this — as the map puts it, *DNN and MLP
cannot deal with time-series data*, because they take a fixed-size input and
have nowhere to put a variable-length past.

**RNN** answers with a loop. Process the sequence one token at a time, and
carry a hidden state forward:

$$
h_t = \tanh\!\big(W_{xh}\,x_t + W_{hh}\,h_{t-1} + b_h\big),
\qquad y_t = W_{hy}\,h_t + b_y .
$$

The state $h_t$ depends on the current input and on everything before it
through $h_{t-1}$; the $\tanh$ supplies the nonlinearity; and — the part that
makes it a *model* rather than a very deep network — the same $W$ matrices
are reused at every step. Training uses **backpropagation through time**,
which unrolls the loop and backpropagates along it.

That reuse is exactly what breaks. Sending a gradient from step $T$ back to
step $t$ means multiplying by the same Jacobian $T-t$ times, and repeated
multiplication by a matrix has only two long-run outcomes.

<div class='figure'>
    <img src='/images/mindmap-gradients.png'
         alt='Log-scale plot of gradient norm against time steps, showing exponential decay for spectral radius below one, exponential growth above one, a damped curve through tanh, and a flat line for an additive path.'>
    <div class='caption'>
        <span class='caption-label'>Figure 5.</span>
        The gradient's fate is decided by the spectral radius $\rho(W)$. Below
        1 it decays like $\rho^{\,T}$ and above 1 it grows the same way. At
        $\rho = 0.8$ the law predicts $0.8^{50} = 1.4\times10^{-5}$ after fifty
        steps; the simulation reaches $4\times10^{-6}$, a constant factor
        below, because a random non-normal Jacobian carries a sub-unit
        prefactor. The dotted line is the same spectral radius seen through
        $\tanh$: saturation flattens the
        derivative and damps the explosion, which is why exploding gradients
        are usually cured by clipping while vanishing ones needed an
        architecture. The flat sage line is what an additive path gives you.
    </div>
</div>

The law is simple enough to feel by hand. Drag the spectral radius and watch
the same curve swing between the two failures:

<div class='knob' id='rho-knob'>
    <div class='controls'>
        <label for='rho-range'>spectral radius &#961;(W)</label>
        <input id='rho-range' type='range' min='0.60' max='1.40' step='0.01' value='0.80'>
        <span class='readout' id='rho-out'>&#961; = 0.80</span>
    </div>
    <svg viewBox='0 0 700 260' role='img' aria-label='Gradient norm against time steps, redrawn as the spectral radius slider moves.'>
        <g id='rho-grid'></g>
        <line class='axis' x1='70' y1='215' x2='680' y2='215'/>
        <line class='axis' x1='70' y1='20' x2='70' y2='215'/>
        <line class='ref' id='rho-unit' x1='70' y1='0' x2='680' y2='0'/>
        <polyline class='trace' id='rho-trace' points=''/>
        <text class='axlabel' x='375' y='245' text-anchor='middle'>time steps back through the sequence</text>
        <text class='axlabel' x='16' y='118' text-anchor='middle' transform='rotate(-90 16 118)'>gradient norm</text>
    </svg>
    <p class='note' id='rho-note'></p>
    <script>
    (function () {
      var T = 60, LO = -12, HI = 12, X0 = 70, X1 = 680, Y0 = 215, Y1 = 20;
      var range = document.getElementById('rho-range');
      var out = document.getElementById('rho-out');
      var note = document.getElementById('rho-note');
      var trace = document.getElementById('rho-trace');
      var grid = document.getElementById('rho-grid');
      var unit = document.getElementById('rho-unit');
      function ypx(e) { return Y0 + (e - LO) / (HI - LO) * (Y1 - Y0); }
      var g = '';
      for (var e = LO; e <= HI; e += 4) {
        g += "<line class='grid' x1='70' y1='" + ypx(e) + "' x2='680' y2='" + ypx(e) + "'/>";
        g += "<text class='tick' x='62' y='" + (ypx(e) + 3) + "' text-anchor='end'>1e" + e + "</text>";
      }
      for (var t = 0; t <= T; t += 15) {
        var x = X0 + t / T * (X1 - X0);
        g += "<text class='tick' x='" + x + "' y='231' text-anchor='middle'>" + t + "</text>";
      }
      grid.innerHTML = g;
      unit.setAttribute('y1', ypx(0));
      unit.setAttribute('y2', ypx(0));
      function draw() {
        var rho = parseFloat(range.value), pts = [];
        for (var t = 0; t <= T; t++) {
          var e = t * Math.log(rho) / Math.LN10;
          pts.push((X0 + t / T * (X1 - X0)).toFixed(1) + ',' +
                   ypx(Math.max(LO, Math.min(HI, e))).toFixed(1));
        }
        trace.setAttribute('points', pts.join(' '));
        out.innerHTML = '&#961; = ' + rho.toFixed(2);
        var f = Math.pow(rho, 50);
        var word = rho < 0.995 ? 'shrunk' : (rho > 1.005 ? 'grown' : 'unchanged');
        note.textContent = 'After 50 steps a gradient has ' + word + ' by a factor of ' +
          (f < 0.001 || f > 1000 ? f.toExponential(1) : f.toFixed(2)) + '.';
      }
      range.addEventListener('input', draw);
      draw();
    })();
    </script>
</div>

This is why the map annotates RNN with *short-term dependency (T=50)*. Not a
hard limit — a practical one.

**LSTM** is the architecture that answer required. It carries two states
rather than one: a hidden state $h_t$ and a **cell state** $c_t$, and it adds
gates that decide what happens to the cell:

- the **input gate** — what information to write
- the **output gate** — what information to expose
- the **forget gate** — what information to retain

My map lists three gates, which is the LSTM everyone actually uses, but the
credit is split: Hochreiter and Schmidhuber's 1997 paper has only the input
and output gates. The forget gate — arguably the most important of the three,
since without it the cell can only accumulate — was added two years later by
Gers, Schmidhuber and Cummins, in a paper titled, exactly to the point,
*Learning to Forget*.

The cell state is updated mostly by addition rather than by repeated matrix
multiplication, which gives the gradient a path closer to the flat green line
in Figure 5. My map's phrasing is the right one: it *preserves a relatively
stable gradient path*. Not a cure — a reprieve, and the map's estimate of the
reach it buys is *T = 200*, four times the RNN's.

## 4. When Meaning Started to Depend on Neighbours

**ELMo** closes the loop back to section 2. Word2Vec and GloVe give each word
one vector for all time; ELMo runs a two-layer bidirectional LSTM over the
whole sentence — forward and backward — and takes the vector for a word from
*that*. The output is an embedding of a word in a sequence, not of a word.

This is what my map means by fixing the polysemy problem: Word2Vec and GloVe
have no way to represent word sense or sentence meaning, and ELMo's "bank"
differs between the money sentence and the river one because the LSTM read
the rest of the sentence first.

ELMo was **feature-based**: its output was concatenated onto whatever
task-specific embedding you already had, as
$x_t = [\text{task embedding},\ \text{ELMo embedding}]$, and its weights were
frozen while the downstream model trained. Worth being precise, since this
gets flattened into "ELMo was never fine-tuned": the paper does fine-tune the
language model on domain text first, and reports that doing so helps. What
stays frozen is the biLM during supervised training. Pretraining as a better
input, not yet as the model itself.

## 5. When Everything Happened At Once

The map's last node in this branch is a single word: *Transformer*. It gets
one word because everything above explains why it had to exist.

Both RNN and LSTM share one defect that no amount of gating repairs:
**sequential dependence**. Step $t$ cannot be computed until step $t-1$ is
done, which forfeits the one thing modern hardware is good at. Attention
computes every position against every other in one parallel operation, and
the context it can reach is not limited by how far a gradient survives a
matrix product.

My map is careful to write down the price, and it is worth repeating because
the cheerful version of this story usually omits it: **attention costs
$O(T^2)$**, and autoregressive decoding needs a KV cache that grows with the
sequence. RNNs were $O(T)$ with constant memory. The transformer traded
asymptotic cost for parallelism and reach, and it was the right trade because
parallelism is what scales.

What that node opens onto is three separate arguments I have written up
elsewhere: which normalizer goes inside the block
([RMSNorm vs. LayerNorm](/blog/2026/08/11/rmsnorm-vs-layernorm/)), where in
the block it goes
([Pre-Norm vs. Post-Norm](/blog/2026/08/11/pre-norm-vs-post-norm/)), and how
position gets into a model that has no sense of order
([RoPE](/blog/2026/08/11/rope/)). The map's side note comparing BatchNorm —
normalizing across samples — with LayerNorm — normalizing within one — is the
first of those.

## 6. How You Know Any of It Worked

The map answers this with one metric: **perplexity**.

$$
\text{PPL}(W) = P(W)^{-1/N}
$$

the inverse geometric mean of the probability the model assigned to each of
the $N$ words it saw. Lower is better. The useful way to read it is as an
**effective branching factor**: a model with perplexity 40 is, on average, as
uncertain as if it were choosing uniformly among 40 words at every step.

That reading is exact, not a metaphor. A model that spreads its probability
uniformly over exactly $k$ words has perplexity exactly $k$ — I checked, and
uniform over 1,000 words gives 1000.0000.

<div class='figure'>
    <img src='/images/mindmap-perplexity.png'
         alt='Log-log plot of perplexity against softmax temperature, running from near 1 when the distribution is sharp up to the vocabulary size when it is flat.'>
    <div class='caption'>
        <span class='caption-label'>Figure 6.</span>
        Perplexity spans $[1, V]$. At the bottom the model is certain and has
        one choice; at the top it is uniform over the vocabulary and has
        learned nothing. Everything real sits in between, and the number is
        only comparable between models that share a vocabulary — which is why
        perplexity comparisons across tokenizers are meaningless.
    </div>
</div>

The same idea is easier to feel than to read. Drag the distribution from
peaked to flat and watch the number follow:

<div class='knob' id='ppl-knob'>
    <div class='controls'>
        <label for='ppl-range'>how sharp the distribution is</label>
        <input id='ppl-range' type='range' min='-90' max='90' step='1' value='0'>
        <span class='readout' id='ppl-out'></span>
    </div>
    <svg viewBox='0 0 700 220' role='img' aria-label='Bar chart of the probability assigned to twenty-four candidate next words, redrawn as the sharpness slider moves.'>
        <g id='ppl-bars'></g>
        <line class='axis' x1='40' y1='185' x2='680' y2='185'/>
        <text class='axlabel' x='360' y='210' text-anchor='middle'>twenty-four candidate next words, most likely first</text>
    </svg>
    <p class='note' id='ppl-note'></p>
    <script>
    (function () {
      var K = 24, X0 = 44, X1 = 676, Y0 = 185, TOP = 24;
      var logits = [];
      for (var i = 0; i < K; i++) logits.push(-0.28 * i - 0.35 * Math.sin(i * 1.7));
      var range = document.getElementById('ppl-range');
      var out = document.getElementById('ppl-out');
      var note = document.getElementById('ppl-note');
      var bars = document.getElementById('ppl-bars');
      function draw() {
        var t = Math.pow(10, parseFloat(range.value) / 60);
        var m = Math.max.apply(null, logits), p = [], s = 0, i;
        for (i = 0; i < K; i++) { p.push(Math.exp((logits[i] - m) / t)); s += p[i]; }
        var h = 0;
        for (i = 0; i < K; i++) { p[i] /= s; if (p[i] > 0) h -= p[i] * Math.log(p[i]); }
        var ppl = Math.exp(h), w = (X1 - X0) / K, svg = '';
        for (i = 0; i < K; i++) {
          var bh = p[i] / Math.max.apply(null, p) * (Y0 - TOP);
          svg += "<rect class='bar' x='" + (X0 + i * w + 1.5).toFixed(1) + "' y='" +
                 (Y0 - bh).toFixed(1) + "' width='" + (w - 3).toFixed(1) +
                 "' height='" + bh.toFixed(1) + "' rx='1.5'/>";
        }
        bars.innerHTML = svg;
        out.textContent = 'perplexity = ' + ppl.toFixed(2);
        note.textContent = 'The model is behaving as if choosing uniformly among ' +
          ppl.toFixed(1) + ' of the ' + K + ' words. Flat gives ' + K + '; certain gives 1.';
      }
      range.addEventListener('input', draw);
      draw();
    })();
    </script>
</div>

## 7. Recap

- The chain is one question asked repeatedly: what is a word, numerically? A
  count, then a direction, then a direction that depends on its neighbours,
  then one that depends on all of them at once.
- $n$-grams fail on arithmetic. Five words of context over a 1,640-word
  vocabulary is $10^{16}$ possibilities, and a corpus sees $10^{-13}$ of it —
  almost all exactly once.
- One-hot vectors make similarity unrepresentable, because any two distinct
  words are orthogonal. Word2Vec fixes that by making the embedding a
  by-product of a task nobody cares about.
- The softmax over the vocabulary was the binding cost, and both escapes —
  negative sampling and hierarchical softmax — bought about four orders of
  magnitude.
- RNNs put order back and pay for it in repeated Jacobian products, which
  vanish or explode as $\rho^{\,T}$. LSTM's gates buy an additive path and
  roughly four times the reach.
- ELMo made the vector depend on the sentence. The transformer removed the
  sequential dependence entirely, at a cost of $O(T^2)$ attention and a
  growing cache — a trade that was worth it because parallelism scales and
  recurrence does not.

## 8. References

1. Bengio, Y., Ducharme, R., Vincent, P., & Jauvin, C. (2003). A Neural
   Probabilistic Language Model. *JMLR* 3, 1137–1155.
2. Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). Efficient Estimation
   of Word Representations in Vector Space.
   [arXiv:1301.3781](https://arxiv.org/abs/1301.3781).
3. Mikolov, T., Sutskever, I., Chen, K., Corrado, G., & Dean, J. (2013).
   Distributed Representations of Words and Phrases and their
   Compositionality. [arXiv:1310.4546](https://arxiv.org/abs/1310.4546).
4. Pennington, J., Socher, R., & Manning, C. (2014). GloVe: Global Vectors for
   Word Representation. *EMNLP 2014*.
5. Hochreiter, S., & Schmidhuber, J. (1997). Long Short-Term Memory. *Neural
   Computation* 9(8), 1735–1780.
6. Gers, F. A., Schmidhuber, J., & Cummins, F. (2000). Learning to Forget:
   Continual Prediction with LSTM. *Neural Computation* 12(10), 2451–2471.
7. Pascanu, R., Mikolov, T., & Bengio, Y. (2013). On the Difficulty of
   Training Recurrent Neural Networks.
   [arXiv:1211.5063](https://arxiv.org/abs/1211.5063).
8. Peters, M. E., et al. (2018). Deep Contextualized Word Representations
   (ELMo). [arXiv:1802.05365](https://arxiv.org/abs/1802.05365).
9. Vaswani, A., et al. (2017). Attention Is All You Need.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762).
