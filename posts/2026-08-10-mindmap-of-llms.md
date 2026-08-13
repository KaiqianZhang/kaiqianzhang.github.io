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

Each idea in the chain answers a specific, nameable failure in the one before
it. This post walks that chain, with the map's own structure as the outline.
The whole of it fits on one line:

<div class='roadmap'>
            <svg viewBox='0 0 720 118' role='img' aria-label='Roadmap: counts, then vectors, then memory, then context, then all at once. Each step is forced by a failure in the one before it.'>
              <line class='spine' x1='72' y1='46' x2='648' y2='46'/>
              <polygon class='head' points='151,46 142,42 142,50'/>
              <polygon class='head' points='295,46 286,42 286,50'/>
              <polygon class='head' points='439,46 430,42 430,50'/>
              <polygon class='head' points='583,46 574,42 574,50'/>
              <text class='why' x='144' y='30'>no similarity</text>
              <text class='why' x='288' y='30'>no order</text>
              <text class='why' x='432' y='30'>embeddings still static</text>
              <text class='why' x='576' y='30'>sequential</text>
              <circle class='dot' cx='72' cy='46' r='4.5'/>
              <text class='stage' x='72' y='72'>counts</text>
              <text class='models' x='72' y='89'>n-gram · NNLM 2003</text>
              <text class='sec' x='72' y='108'>§1</text>
              <circle class='dot' cx='216' cy='46' r='4.5'/>
              <text class='stage' x='216' y='72'>vectors</text>
              <text class='models' x='216' y='89'>Word2Vec 2013 · GloVe 2014</text>
              <text class='sec' x='216' y='108'>§2</text>
              <circle class='dot' cx='360' cy='46' r='4.5'/>
              <text class='stage' x='360' y='72'>memory</text>
              <text class='models' x='360' y='89'>RNN 1990 · LSTM 1997</text>
              <text class='sec' x='360' y='108'>§3</text>
              <circle class='dot' cx='504' cy='46' r='4.5'/>
              <text class='stage' x='504' y='72'>context</text>
              <text class='models' x='504' y='89'>ELMo 2018</text>
              <text class='sec' x='504' y='108'>§4</text>
              <circle class='dot' cx='648' cy='46' r='4.5'/>
              <text class='stage' x='648' y='72'>all at once</text>
              <text class='models' x='648' y='89'>Transformer 2017</text>
              <text class='sec' x='648' y='108'>§5</text>
            </svg>
        </div>

[TOC]

## One Line, Read Left to Right

The labels above the arrows are the load-bearing part: each names what was
still missing at that point, and the stage to its right is the answer.

One warning before the dates mislead you. **This ordering is conceptual, not
chronological** — read the years and the line stops being a timeline. LSTM
predates Word2Vec by sixteen years, and ELMo appeared four months *after* the
transformer, so the transformer cannot be a repair of ELMo and recurrence was
not invented because word vectors lacked order. The arrows mean "this is what
that could not do", not "this came next".

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
        Measured on this blog's own three posts — 7,003 words, 1,514 of them
        distinct. At $n = 1$ every word in the space is observed by
        definition. By $n = 5$ there are $8 \times 10^{15}$ possible
        five-word sequences and exactly 6,860 ever occur, which is
        $9\times10^{-13}$ of the space. Worse, <b>98.2%</b> of those 6,860
        occur exactly once, so almost every count the model would rely on is
        the number 1. A bigger corpus moves these numbers and does not change
        their shape.
    </div>
</div>

One caveat about that figure: a corpus of $N$ tokens holds at most $N$
five-gram positions, so the flat line is pinned by arithmetic as much as by
language. What it really shows is $V^n$ outrunning any corpus at all.

Everything unseen gets probability zero, which the chain rule propagates to
the whole sentence. Smoothing and backoff repair that better than this framing
usually admits — modified Kneser-Ney five-grams held the state of the art for
roughly two decades and were still a serious baseline in 2013, the year
word2vec appeared. What they cannot supply is any notion that two words are
*similar*. To a counter, "cat" and "dog" are as unrelated as "cat" and
"thermodynamics".

**NNLM**, the neural language model, was the first *neural* attempt at that —
latent semantic analysis and Brown clustering had been deriving similarity
from counts since the early 1990s. Its input is **one-hot**, and my map's note
is the whole complaint: *lose the word meaning, dimension is horribly large*.
Two one-hot vectors are orthogonal, so similarity is not merely unmeasured at
the input; it is unrepresentable.

That is a correction to my own map, because NNLM *already fixes it*. Between
the one-hot input and the hidden layer sits a shared matrix $C$ whose rows are
word vectors — learning a distributed representation is what Bengio's paper is
*for*, and the one-hot is an indexing convention, not a theory of meaning. So
the next arrow is not "Word2Vec invented embeddings" but something narrower:
NNLM's came attached to an expensive model, and Word2Vec got them cheap.

## 2. When a Word Became a Direction

**Word2Vec**'s goal, in the map's words: generate word embeddings. The insight
is to get them cheaply, as a side effect — set up a fake prediction task, train
a shallow network, and keep the input-side weight matrix. Those rows are the
embeddings, though the model learns two and which you keep is a convention.

Mikolov et al. remove NNLM's nonlinear hidden layer, and the paper is explicit
that this is a *compute* argument: without it they could train on 1.6 billion
words. Collobert and Weston had already got embeddings as a by-product in
2008; the 2013 contribution is that it became cheap enough for everyone.

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
        is one training example. Neither task matters in itself; the point is
        the projection layer between input and output, which has to compress a
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
        ordering inside the window, any depth. The projection node is drawn
        <b>SUM</b>, though the paper's prose says the vectors are
        <i>averaged</i> — the same thing up to a constant, and either way "cat
        sat on the" and "the on sat cat" give the same projection. A bag of
        words with a lookup table attached, and enough to make word vectors
        that do arithmetic.
        <br>
        Figure 1, Mikolov et al. (2013), tinted.
    </div>
</div>

Which you want depends on the corpus, and my map is blunt: **CBOW is quick**,
for large-scale text like news; **Skip-gram is precise**, for low-frequency
words. That framing comes from word2vec's documentation rather than either
paper — the 2013 paper reports a different axis, CBOW better on syntactic
analogies, Skip-gram on semantic ones, and CBOW about three times faster. The
mechanism usually offered concerns a word's role as *context*: Skip-gram
factors each window into $2c$ pairs, so a rare context word gets its own
gradient, while CBOW averages it in with $2c-1$ neighbours and dilutes it.

### The bill at the output layer

Both models end in a softmax over the whole vocabulary — $O(V)$ work per
training example, which with $V = 50{,}000$ and billions of examples is the
entire cost of training. Word2Vec ships two ways out, both in the map.

**Negative sampling** stops trying to be a language model at all. Instead of
"which of the 50,000 words is it?", ask "is this pair real?" — one true word
against $k$ sampled fakes, so the cost falls to $O(k)$ with $k$ around 5. It
buys that by giving up normalization: the result is no longer a probability
distribution, which is why you cannot read a perplexity off it.

**Hierarchical softmax** keeps the probabilistic framing but arranges the
vocabulary as a binary tree, so reaching a word means a sequence of binary
decisions rather than scoring every word. That is $O(\log_2 V)$ for a balanced
tree; word2vec uses a Huffman tree, which puts frequent words nearer the root
and brings the average depth down to about the unigram entropy — better still
than the plot below shows.

<div class='figure'>
    <img src='/images/mindmap-softmax.png'
         alt='Log-log plot of output-layer work against vocabulary size, showing a linear cost curve for full softmax, a logarithmic curve for hierarchical softmax, and a flat line for negative sampling.'>
    <div class='caption'>
        <span class='caption-label'>Figure 4.</span>
        At a vocabulary of 50,000 the full softmax costs 50,000 units of work
        per example, hierarchical softmax costs about 16, and negative
        sampling with $k=5$ costs 6 — 3.9 orders of magnitude for negative
        sampling, 3.5 for hierarchical softmax, and the difference between an
        idea and a trainable model. Note the
        shapes rather than the constants: negative sampling does not grow with
        $V$ at all, which is why it became the default.
    </div>
</div>

**GloVe** takes what my map calls the *global view*. Word2Vec learns from one
window at a time and never sees the corpus whole; GloVe first builds a
co-occurrence matrix $X \in \mathbb{R}^{V \times V}$ and then fits
$w_i^\top \tilde{w}_j + b_i + \tilde{b}_j = \log X_{ij}$.

That form comes from one observation: what carries meaning is not a
co-occurrence count but a *ratio* of them. $P(k \mid \text{ice}) /
P(k \mid \text{steam})$ is large for *solid*, small for *gas*, about 1 for
*water* — the ratio isolates exactly the dimension along which the two words
differ. The matrix is enormous and, as the map notes, sparse, which is the
point: only nonzero entries are ever touched.

## 3. A Matrix Multiplied by Itself

Word vectors have a hard limit. They are a lookup table: "bank" has one
vector whether the sentence is about money or a river, and a bag of context
has thrown away order, so "dog bites man" and "man bites dog" are one input.

My map says *DNN and MLP cannot deal with time-series data*, which needs
narrowing — NNLM is feed-forward and works fine, and so is a transformer. The
true statement is that a fixed-width network over a *bag* of context can
represent neither variable-length history nor order.

**RNN** answers with a loop. Process the sequence one token at a time, and
carry a hidden state forward:

$$
h_t = \tanh\!\big(W_{xh}\,x_t + W_{hh}\,h_{t-1} + b_h\big),
\qquad y_t = W_{hy}\,h_t + b_y .
$$

The state carries everything before it through $h_{t-1}$, and the same $W$
matrices are reused at every step, which is what lets one model handle any
length. Training unrolls the loop — **backpropagation through time**.

That reuse is what breaks. Sending a gradient from step $T$ back to step $t$
means multiplying by the same Jacobian $T-t$ times.

<div class='figure'>
    <img src='/images/mindmap-gradients.png'
         alt='Two log-scale panels of gradient norm against time steps. Panel (a), a linear recurrence: one curve decays and one grows. Panel (b), the same matrices through tanh: both curves decay, alongside a flat reference line for an idealized additive path.'>
    <div class='caption'>
        <span class='caption-label'>Figure 5.</span>
        <b>(a)</b> With no nonlinearity, the gradient decays like
        $\rho^{\,T}$ below 1 and grows the same way above it. The simulation
        runs a constant factor under the dashed law — $1.4\times10^{-5}$
        predicted at $\rho=0.8$ after fifty steps, $4\times10^{-6}$ measured —
        because a random non-normal matrix carries a sub-unit prefactor.
        <b>(b)</b> The same matrices through the $\tanh$ this section actually
        wrote down, where the symmetry disappears: <i>both</i> vanish,
        $\rho=1.2$ down to $2.8\times10^{-1}$ by fifty steps as saturation kills the
        derivative faster than the matrix amplifies. That is Pascanu et al.'s
        asymmetry — a small spectral radius is <i>sufficient</i> for
        vanishing, a large one only <i>necessary</i> for exploding. The sage
        line is drawn, not measured: the idealization a purely additive path
        would give.
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
since without it the cell can only accumulate — arrived in 1999, from Gers,
Schmidhuber and Cummins, in a paper titled exactly to the point: *Learning to
Forget*.

The cell is updated by addition rather than by a matrix product:

$$
c_t = f_t \odot c_{t-1} + i_t \odot g_t,
\qquad\text{so}\qquad
\frac{\partial c_t}{\partial c_{t-1}} = f_t .
$$

That single line is the whole architecture. Sending a gradient back through
the cell multiplies by $f_t$ rather than by $W^\top J$, so the backward
product is $\prod_t f_t$ — still a product, but of numbers the model
*chooses* rather than of a fixed matrix's spectrum.

A reprieve, not a cure. The 1997 original is the cleaner case: its constant
error carousel has a self-weight of exactly 1.0, making the sage line in
Figure 5 literal. The forget gate put a learnable $f_t \in (0,1)$ back in the
path, which decays again — just with a base the model can push toward 1, hence
the standard advice to initialize its bias high. My map's *T = 200* against
*T = 50* are rough marks in my notes, not measurements.

One more node from my map, and it matters shortly: **xLSTM** (2024) revisits
all this with two variants — sLSTM, exponential gating on a scalar memory, and
mLSTM, which swaps the scalar cell for a matrix and is parallelizable over the
sequence.

## 4. When Meaning Started to Depend on Neighbours

**ELMo** closes the loop back to section 2. Word2Vec and GloVe give each word
one vector for all time; ELMo runs a two-layer bidirectional LSTM over the
whole sentence and takes the vector for a word from *that*. The output is an
embedding of a word in a sequence, not of a word.

Two details my map compresses. The forward and backward LSTMs are
**independent**, trained separately and concatenated rather than jointly —
precisely BERT's later criticism. And the output is a *learned, task-specific
weighted sum of all layers*: layers encode different things, syntax lower,
semantics higher.

This is what my map means by fixing the polysemy problem: Word2Vec and GloVe
have no way to represent word sense or sentence meaning, and ELMo's "bank"
differs between the money sentence and the river one because the LSTM read
the rest of the sentence first.

ELMo was **feature-based**: its output was concatenated onto whatever
task-specific embedding you had, and its weights were frozen while the
downstream model trained. Worth being precise, since this gets flattened into
"ELMo was never fine-tuned" — the paper *does* fine-tune the language model on
domain text first and reports that it helps. What stays frozen is the biLM
during supervised training. Pretraining as a better input, not yet as the
model itself.

## 5. When Everything Happened At Once

The map's last node in this branch is a single word: *Transformer*. It gets
one word because everything above explains why it had to exist.

Both RNN and LSTM share one defect that no amount of gating repaired *at the
time*: **sequential dependence**. Step $t$ cannot be computed until step $t-1$
is done, which forfeits the one thing modern hardware is good at. The
qualifier matters, because mLSTM later showed gating and parallelism are not
actually incompatible — it simply took a decade.

One link my map omits belongs here: attention was not the transformer's
invention. Bahdanau and colleagues added it to an RNN encoder-decoder in 2014,
so a decoder could look back at any source position without squeezing through
a bottleneck state. The transformer deleted the recurrence around it — every
position against every other in one parallel operation, with reach no longer
set by how far a gradient survives a matrix product.

My map writes down the price, and it is worth repeating because the cheerful
version of this story omits it: **attention costs $O(T^2)$**, and
autoregressive decoding needs a KV cache that grows with the sequence.

Two qualifications, since that sentence has aged. The quadratic term is
*compute*: attention's memory has been linear in practice since FlashAttention
showed the $T \times T$ matrix need never be materialized. And the parallelism
is real in training and prefill but not in generation, which emits one token
per forward pass and is as sequential as an RNN — which is why the KV cache
exists at all.

That node opens onto three arguments I have written up elsewhere: which
normalizer goes inside the block
([RMSNorm vs. LayerNorm](/blog/2026/08/11/rmsnorm-vs-layernorm/)), where in
the block it goes
([Pre-Norm vs. Post-Norm](/blog/2026/08/11/pre-norm-vs-post-norm/)), and how
position gets into a model that has no sense of order
([RoPE](/blog/2026/08/11/rope/)).

My map's last side note belongs here. **BatchNorm** normalizes a feature
across the samples in a batch; **LayerNorm** across the features within one
sample. The map's justification is the sharper half: the same channel of two
images is comparable, two channels of one image are not.

## 6. Counting the Doors Still Open

The map answers this with one metric: **perplexity**.

$$
\text{PPL}(W) = P(W)^{-1/N}
$$

the inverse geometric mean of the probability the model assigned to each of
the $N$ words it saw. Lower is better. The useful way to read it is as an
**effective branching factor**: a model with perplexity 40 is, on average, as
uncertain as if it were choosing uniformly among 40 words at every step.

A model spreading probability uniformly over exactly $k$ words has perplexity
exactly $k$ — uniform over 1,000 gives 1000.0000. But that exactness belongs
to the uniform case only: in general perplexity is the size of the *uniform
distribution with the same entropy*, so a model at 40 might be choosing
between three words most of the time and five thousand occasionally.

A second distinction the formula hides, which caught me out: the equation
above is **held-out** perplexity, measured against unseen text, and it is
unbounded above — assign $10^{-9}$ to the word that actually occurred and you
score $10^{9}$, far past $V$. What is bounded by $[1, V]$ is the exponentiated
entropy of the model's *own* distribution — its confidence, no data involved.
The figure below plots the second.

Easier to feel than to read. Drag the distribution from peaked to flat and
watch the number follow — it runs from 1 to the vocabulary size and no
further:

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

## 7. Chat This Over With Friends

**The one-line version.** The whole history before transformers is a single
question asked over and over: what is a word, numerically? A count, then a
direction, then a direction that depends on its neighbours, then one that
depends on all of them at once. Each answer exists because the previous one
could not do something specific.

**The detail that lands.** Counting dies of arithmetic. With a vocabulary of
just 1,514 words there are $10^{15}$ possible five-word sequences, and a
corpus sees around $10^{-13}$ of them — almost all exactly once. No amount of
data fixes that, because the space grows faster than any corpus can.

**What most people get wrong.** Two things. Word2Vec did not invent word
embeddings — Bengio's neural language model learned them a decade earlier, and
learning them is what that paper is *for*. Word2Vec's contribution was making
them cheap: strip out the expensive hidden layer and you can train on billions
of words. And the lineage everyone recites is not chronological. LSTM predates
Word2Vec by sixteen years, and ELMo came out four months *after* the
transformer.

**If someone pushes back.** The fair objection is that smoothed n-grams were
not the failure this framing implies — modified Kneser-Ney five-grams held the
state of the art for roughly two decades. What they could never supply is any
notion that two words are similar.

**The one-line mechanism worth remembering.** An RNN sends its gradient back
by multiplying by the same matrix over and over, so it dies or diverges
exponentially. An LSTM replaces that with $\prod_t f_t$ — still a product, but
of numbers the model gets to choose.

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
