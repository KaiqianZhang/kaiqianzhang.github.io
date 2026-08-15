---
title: "My Mindmap of LLMs: Past Lives and Present"
subtitle: Every idea a transformer replaced was itself a fix for the thing before it, and the whole chain is one argument about how to represent a word.
date: 2026-06-16
tags: llm
icon: 🍵
length: long
---

For a while now I have kept a mindmap of how language models got to where they
are. It begins at counting words and ends at a single node reading
*Transformer*, and what turned out to be useful about having it all on one
page was not the branches. It was the arrows between them.

That is the argument of this post. Each idea in the chain is not an invention
that happened to arrive; it is an answer to a specific, nameable thing the
previous idea could not do. Learn what each one could not do and the chain
starts to feel almost inevitable — which is a far better thing to carry around
than a list of names and dates.

So I have redrawn it as a single line, and I want to walk that line end to end
with you, assuming you know none of it. I will stop a few times to correct
myself along the way: going back to the original papers for this post, several
things I had written down confidently turned out to be wrong.

<div class='roadmap'>
    <svg viewBox='0 0 760 384' role='img' aria-label='Roadmap of language modelling: counting in the 1990s, embeddings in 2013, recurrence, and attention from 2017.'>
      <path class='spine' d='M99.4,192.6 Q380.1,193.3 660.9,192.3'/>
      <path class='head' d='M180.6,192.6 Q193.3,192.2 206.1,192.7'/>
      <path class='head' d='M179.3,192.3 Q192.8,191.7 206.3,191.5'/>
      <path class='head' d='M205.4,191.9 Q202.9,193.8 200.3,195.6'/>
      <path class='head' d='M206.3,192.5 Q203.8,190.5 201.4,188.4'/>
      <text class='why' x='193.0' y='163.0'>the counts ran out of</text>
      <text class='why' x='193.0' y='181.0'>data</text>
      <path class='head' d='M366.8,191.4 Q380.2,191.7 393.5,192.3'/>
      <path class='head' d='M366.8,192.4 Q379.9,191.6 393.0,191.4'/>
      <path class='head' d='M393.6,192.5 Q390.7,193.7 388.1,195.5'/>
      <path class='head' d='M393.3,191.8 Q390.4,190.6 387.5,189.5'/>
      <text class='why' x='380.0' y='163.0'>a word needs its</text>
      <text class='why' x='380.0' y='181.0'>context</text>
      <path class='head' d='M554.3,191.5 Q567.3,191.7 580.4,191.9'/>
      <path class='head' d='M554.7,191.5 Q567.6,191.5 580.5,191.6'/>
      <path class='head' d='M580.6,192.0 Q578.0,193.6 575.1,194.5'/>
      <path class='head' d='M580.3,191.3 Q577.8,190.1 575.5,188.6'/>
      <text class='why' x='567.0' y='163.0'>recurrence could not</text>
      <text class='why' x='567.0' y='181.0'>be parallelized</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M99.7,136.4 Q99.2,164.4 99.7,192.4'/>
        <circle class='dot' cx='99.5' cy='192.0' r='5'/>
        <path class='box' d='M24.2,0.2 Q193.0,0.7 361.9,0.2 Q370.9,0.2 370.9,9.2 Q371.6,67.9 370.9,126.6 Q370.9,135.6 361.9,135.6 Q193.0,134.8 24.2,135.6 Q15.2,135.6 15.2,126.6 Q15.9,67.9 15.2,9.2 Q15.2,0.2 24.2,0.2'/>
        <path class='box' d='M24.8,0.0 Q193.5,-0.8 362.2,0.0 Q371.2,0.0 371.2,9.0 Q371.6,67.6 371.2,126.3 Q371.2,135.3 362.2,135.3 Q193.5,135.0 24.8,135.3 Q15.8,135.3 15.8,126.3 Q15.7,67.6 15.8,9.0 Q15.8,0.0 24.8,0.0'/>
        <text class='yr' x='29.0' y='21.0'>1990s</text>
        <text class='stage' x='29.0' y='45.0'>count the n-grams</text>
        <circle class='bul' cx='33.0' cy='63.0' r='2'/>
        <text class='body' x='42.0' y='67.0'>estimate the next word from how often it</text>
        <text class='body' x='42.0' y='86.5'>followed</text>
        <circle class='bul' cx='33.0' cy='102.0' r='2'/>
        <text class='body' x='42.0' y='106.0'>the table outgrows any corpus</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='248.0' width='356.0' height='136.0'/>
        <path class='stem' d='M285.9,247.6 Q285.4,219.5 285.8,191.3'/>
        <circle class='dot' cx='286.5' cy='192.0' r='5'/>
        <path class='box' d='M24.1,248.8 Q193.0,248.9 362.0,248.8 Q371.0,248.8 371.0,257.8 Q370.4,316.6 371.0,375.3 Q371.0,384.3 362.0,384.3 Q193.0,384.7 24.1,384.3 Q15.1,384.3 15.1,375.3 Q16.0,316.6 15.1,257.8 Q15.1,248.8 24.1,248.8'/>
        <path class='box' d='M24.1,247.2 Q193.2,246.2 362.2,247.2 Q371.2,247.2 371.2,256.2 Q370.8,315.8 371.2,375.4 Q371.2,384.4 362.2,384.4 Q193.2,385.0 24.1,384.4 Q15.1,384.4 15.1,375.4 Q15.9,315.8 15.1,256.2 Q15.1,247.2 24.1,247.2'/>
        <text class='yr' x='29.0' y='269.0'>2013</text>
        <text class='stage' x='29.0' y='293.0'>learn the words</text>
        <circle class='bul' cx='33.0' cy='311.0' r='2'/>
        <text class='body' x='42.0' y='315.0'>word2vec puts words in a vector space</text>
        <circle class='bul' cx='33.0' cy='330.5' r='2'/>
        <text class='body' x='42.0' y='334.5'>similar words land near each other</text>
        <circle class='bul' cx='33.0' cy='350.0' r='2'/>
        <text class='body' x='42.0' y='354.0'>one vector per word, whatever the</text>
        <text class='body' x='42.0' y='373.5'>sentence</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M474.1,136.5 Q473.8,164.3 473.1,192.1'/>
        <circle class='dot' cx='473.5' cy='192.0' r='5'/>
        <path class='box' d='M397.6,-0.4 Q566.7,0.3 735.8,-0.4 Q744.8,-0.4 744.8,8.6 Q744.4,68.0 744.8,127.4 Q744.8,136.4 735.8,136.4 Q566.7,137.1 397.6,136.4 Q388.6,136.4 388.6,127.4 Q389.0,68.0 388.6,8.6 Q388.6,-0.4 397.6,-0.4'/>
        <path class='box' d='M397.6,0.9 Q566.9,0.1 736.1,0.9 Q745.1,0.9 745.1,9.9 Q745.4,68.5 745.1,127.1 Q745.1,136.1 736.1,136.1 Q566.9,136.2 397.6,136.1 Q388.6,136.1 388.6,127.1 Q388.4,68.5 388.6,9.9 Q388.6,0.9 397.6,0.9'/>
        <text class='yr' x='403.0' y='21.0'>2014-16</text>
        <text class='stage' x='403.0' y='45.0'>read in order</text>
        <circle class='bul' cx='407.0' cy='63.0' r='2'/>
        <text class='body' x='416.0' y='67.0'>recurrent networks carry a state along</text>
        <text class='body' x='416.0' y='86.5'>the sentence</text>
        <circle class='bul' cx='407.0' cy='102.0' r='2'/>
        <text class='body' x='416.0' y='106.0'>context at last, but strictly sequential</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='248.0' width='356.0' height='136.0'/>
        <path class='stem' d='M661.0,247.9 Q660.8,219.9 660.1,191.9'/>
        <circle class='dot' cx='660.5' cy='192.0' r='5'/>
        <path class='box' d='M397.3,248.5 Q566.8,248.6 736.3,248.5 Q745.3,248.5 745.3,257.5 Q745.3,316.3 745.3,375.0 Q745.3,384.0 736.3,384.0 Q566.8,383.1 397.3,384.0 Q388.3,384.0 388.3,375.0 Q387.9,316.3 388.3,257.5 Q388.3,248.5 397.3,248.5'/>
        <path class='box' d='M397.4,248.1 Q566.7,248.2 735.9,248.1 Q744.9,248.1 744.9,257.1 Q744.2,315.8 744.9,374.4 Q744.9,383.4 735.9,383.4 Q566.7,383.9 397.4,383.4 Q388.4,383.4 388.4,374.4 Q388.1,315.8 388.4,257.1 Q388.4,248.1 397.4,248.1'/>
        <text class='yr' x='403.0' y='269.0'>2017-</text>
        <text class='stage' x='403.0' y='293.0'>attend to everything</text>
        <circle class='bul' cx='407.0' cy='311.0' r='2'/>
        <text class='body' x='416.0' y='315.0'>the Transformer drops recurrence</text>
        <text class='body' x='416.0' y='334.5'>entirely</text>
        <circle class='bul' cx='407.0' cy='350.0' r='2'/>
        <text class='body' x='416.0' y='354.0'>all positions at once, so training</text>
        <text class='body' x='416.0' y='373.5'>parallelizes</text>
      </g>
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

Let me start with what a language model *is*, because everything downstream is
a different answer to the same question.

A language model assigns a probability to a piece of text. That is the whole
definition. Given "the cat sat on the", a language model tells you how likely
each possible next word is — "mat" high, "thermodynamics" low — and given a
whole sentence it tells you how likely that sentence is to be something
somebody would say. Everything a modern chatbot does is built on top of this
one capability, applied over and over.

The convenient thing is that a probability over a whole sentence can be built
one word at a time. The chain rule of probability says the probability of a
sequence is the probability of its first word, times the probability of the
second given the first, times the probability of the third given the first
two, and so on:

$$
P(w_1 w_2 \ldots w_T) = P(w_1)\,P(w_2 \mid w_1)\,P(w_3 \mid w_1 w_2)\cdots
$$

So the problem reduces to estimating one factor: given everything so far, how
likely is each next word?

The **statistical language model** estimates that by counting, which is the
most natural thing anybody could try. How often, in a large pile of text, is
"the cat sat on the" followed by "mat"? Divide by how often "the cat sat on
the" appears at all, and you have your probability.

Conditioning on *all* of history is hopeless — no corpus contains your exact
sentence — so an **n-gram** model truncates it. Use only the previous $n-1$
words to predict the $n$th, and estimate that from counts. A five-gram model
looks back four words and no further.

The failure is immediate and it is arithmetic rather than linguistic. A
vocabulary of $V$ words has $V^n$ possible $n$-grams, and $V^n$ grows faster
than any pile of text you can assemble. The figure below counts this on the
text of this very blog, which is small enough that I can show you every
number.

<div class='figure'>
    <img src='/images/mindmap-sparsity.png'
         alt='Log-scale plot of possible n-grams against n-grams ever observed, for n from 1 to 5. The possible count rises steeply; the observed count is nearly flat.'>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        Measured on this blog's own other posts — 23,198 words, 2,530 of them
        distinct. At $n = 1$ every word in the space is observed by
        definition. By $n = 5$ there are $1.0 \times 10^{17}$ possible
        five-word sequences and exactly 22,477 ever occur, which is
        $2\times10^{-13}$ of the space. Worse, <b>97.6%</b> of those 22,477
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

That last point is the one that opens the rest of the story, so let me put it
plainly. To a counter, words are atoms with no interior. "Cat" and "dog" are
two different symbols, exactly as unrelated as "cat" and "thermodynamics", and
seeing a thousand sentences about cats teaches such a model nothing whatsoever
about dogs. Every human intuition about language says this is the wrong
representation.

**NNLM**, Bengio's neural language model, was the first *neural* attempt at
fixing it. Not the first attempt at all — latent semantic analysis and Brown
clustering had been deriving similarity from counts since the early 1990s.

Its input is **one-hot**: a word is a list of $V$ numbers, all zero except a
single 1 in the slot belonging to that word. Two things are wrong with that,
and together they are the whole complaint. It loses the meaning of the word,
and its dimension is horribly large.

Notice what the first of those costs you. Any two one-hot vectors point in
perpendicular directions, so at the input, similarity between words is not
merely unmeasured. It is unrepresentable.

And here is the first thing I had wrong, because NNLM *already fixes it*.
Between
the one-hot input and the hidden layer sits a shared matrix $C$ whose rows are
word vectors — learning a distributed representation is what Bengio's paper is
*for*, and the one-hot is an indexing convention, not a theory of meaning. So
the next arrow is not "Word2Vec invented embeddings" but something narrower:
NNLM's came attached to an expensive model, and Word2Vec got them cheap.

## 2. When a Word Became a Direction

Bengio had shown that a network could learn word vectors. The problem was that
his network was expensive, and for a decade almost nobody used it. What changed
in 2013 was not the idea but its price.

**Word2Vec**'s goal is to generate word embeddings, and I should say plainly
what one is, because it is the idea the whole field is built on.

An **embedding** is a list of a few hundred numbers standing for a word, in
which the numbers themselves are learned rather than assigned.

Because they are learned from how words are used, words used in similar ways
end up with similar lists — and "similar" now means something arithmetic: the
two lists point in nearly the same direction. A word has stopped being a
symbol and become a *direction* in a space, which is where the section title
comes from. Once that is true you can ask which words lie near which others and
get a sensible answer, which a counter could never give you.

The insight in Word2Vec is not the embedding but how to get one cheaply — as a
side effect of something else. Set up a prediction task nobody actually cares
about, train a deliberately shallow network on it, and then throw the task
away and keep the weight matrix from the input side. Its rows are your
embeddings. (The model learns two such matrices, and which one you keep is a
convention rather than a result.)

Mikolov et al. remove NNLM's nonlinear hidden layer, and the paper is explicit
that this is a *compute* argument: without it they could train on 1.6 billion
words. Collobert and Weston had already got embeddings as a by-product in
2008; the 2013 contribution is that it became cheap enough for everyone.

There are two ways to arrange that task, and they are mirror images.

<div class='figure-pair w2v-anim'>
    <div class='panels'>
        <div class='panel' style='flex: 1 1 100%'>
            <svg viewBox='0 0 460 284' role='img' aria-label='A window slides along the sentence "the cat sat on the warm mat". In the upper row, labelled CBOW, four arcs run inward from the neighbouring words to the centre word. In the lower row, labelled Skip-gram, the same four arcs run outward from the centre word to its neighbours.'>
                  <g class='cbow'>
                    <text class='rowlabel' x='6' y='14'>CBOW</text>
                    <g class='slide'>
                      <rect class='frame' x='-152' y='26' width='304' height='104' rx='9'/>
                      <rect class='centre' x='-26' y='34' width='52' height='30' rx='6'/>
                      <path class='arc' d='M -120.0 72.0 Q -66.5 118.0 -13.0 72.0'/>
                      <polygon class='head' points='-8.1,67.8 -14.4,78.3 -19.5,72.4'/>
                      <path class='arc' d='M -60.0 72.0 Q -32.5 102.0 -5.0 72.0'/>
                      <polygon class='head' points='-0.6,67.2 -5.7,78.5 -11.4,73.2'/>
                      <path class='arc' d='M 60.0 72.0 Q 32.5 102.0 5.0 72.0'/>
                      <polygon class='head' points='0.6,67.2 11.4,73.2 5.7,78.5'/>
                      <path class='arc' d='M 120.0 72.0 Q 66.5 118.0 13.0 72.0'/>
                      <polygon class='head' points='8.1,67.8 19.5,72.4 14.4,78.3'/>
                    </g>
                    <text class='word' x='50' y='56'>the</text>
                    <text class='word' x='110' y='56'>cat</text>
                    <text class='word' x='170' y='56'>sat</text>
                    <text class='word' x='230' y='56'>on</text>
                    <text class='word' x='290' y='56'>the</text>
                    <text class='word' x='350' y='56'>warm</text>
                    <text class='word' x='410' y='56'>mat</text>
                  </g>
                  <g class='skip'>
                    <text class='rowlabel' x='6' y='154'>SKIP-GRAM</text>
                    <g class='slide'>
                      <rect class='frame' x='-152' y='166' width='304' height='104' rx='9'/>
                      <rect class='centre' x='-26' y='174' width='52' height='30' rx='6'/>
                      <path class='arc' d='M -13.0 212.0 Q -66.5 258.0 -120.0 212.0'/>
                      <polygon class='head' points='-124.9,207.8 -113.5,212.4 -118.6,218.3'/>
                      <path class='arc' d='M -5.0 212.0 Q -32.5 242.0 -60.0 212.0'/>
                      <polygon class='head' points='-64.4,207.2 -53.6,213.2 -59.3,218.5'/>
                      <path class='arc' d='M 5.0 212.0 Q 32.5 242.0 60.0 212.0'/>
                      <polygon class='head' points='64.4,207.2 59.3,218.5 53.6,213.2'/>
                      <path class='arc' d='M 13.0 212.0 Q 66.5 258.0 120.0 212.0'/>
                      <polygon class='head' points='124.9,207.8 118.6,218.3 113.5,212.4'/>
                    </g>
                    <text class='word' x='50' y='196'>the</text>
                    <text class='word' x='110' y='196'>cat</text>
                    <text class='word' x='170' y='196'>sat</text>
                    <text class='word' x='230' y='196'>on</text>
                    <text class='word' x='290' y='196'>the</text>
                    <text class='word' x='350' y='196'>warm</text>
                    <text class='word' x='410' y='196'>mat</text>
                  </g>
                </svg>
            <div class='annot'>
                <span class='who'>The same window, two directions.</span>
                <b>CBOW</b> hides the middle word and asks the four
                neighbours to guess it — a cloze test: given the context,
                predict the word in the blank. <b>Skip-gram</b> reverses every
                arrow, showing the middle word and asking it to guess each
                neighbour in turn.
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

Which of the two you want depends on the corpus. The short version I carry
around is that **CBOW is quick**, suiting large-scale text like news, while
**Skip-gram is precise**, suiting low-frequency words.

That framing comes from word2vec's documentation rather than from either
paper. The 2013 paper reports a different axis: CBOW better on syntactic
analogies, Skip-gram on semantic ones, and CBOW about three times faster.

The mechanism usually offered concerns a word's role as *context*. Skip-gram
factors each window into $2c$ pairs, so a rare context word gets its own
gradient, while CBOW averages it in with $2c-1$ neighbours and dilutes it.

### The bill at the output layer

Both arrangements have the same problem at the far end, and it is worth
following because the two escapes from it are still in use.

Whichever way round you set the task, the model finishes by producing a score
for every word in the vocabulary and turning those scores into probabilities —
a **softmax** over the whole vocabulary. That is $O(V)$ work for every single
training example, and with $V = 50{,}000$ and billions of examples it is not a
part of the cost of training. It *is* the cost of training. Word2Vec ships two
ways out of it, and both are still in use.

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

**GloVe** takes the opposite view, a global one. Word2Vec learns from one
window at a time and never sees the corpus whole; GloVe first builds a
co-occurrence matrix $X \in \mathbb{R}^{V \times V}$ and then fits
$w_i^\top \tilde{w}_j + b_i + \tilde{b}_j = \log X_{ij}$.

That form comes from one observation: what carries meaning is not a
co-occurrence count but a *ratio* of them. $P(k \mid \text{ice}) /
P(k \mid \text{steam})$ is large for *solid*, small for *gas*, about 1 for
*water* — the ratio isolates exactly the dimension along which the two words
differ. The matrix is enormous and sparse, which is the
point: only nonzero entries are ever touched.

## 3. A Matrix Multiplied by Itself

That is a good answer to "what is a word, numerically": a direction in a few
hundred dimensions, learned from the company it keeps. The next limit is
not a matter of training that better. It is in the shape of the thing.

An embedding table is a lookup table. "Bank" has one vector, fixed the moment
training ends, whether the sentence around it is about money or about a river.
And the context these models consume is a *bag* — the surrounding words are
averaged together, which throws away their order, so "dog bites man" and "man
bites dog" arrive as the same input. Two of the most basic facts about
language, that words mean different things in different sentences and that
order matters, are outside what this representation can express.

It is tempting to blame feed-forward networks for that, and I had it written
down that way for a long time. Too strong: NNLM is feed-forward and works
fine, and so, for that matter, is a transformer. The narrower and true
statement is that a fixed-width network over a *bag* can represent neither
variable-length history nor order.

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

This is why RNNs get described as having a short-term memory of roughly fifty
steps. Not a hard limit — a practical one.

**LSTM** is the architecture that answer required. It carries two states
rather than one: a hidden state $h_t$ and a **cell state** $c_t$, and it adds
gates that decide what happens to the cell:

- the **input gate** — what information to write
- the **output gate** — what information to expose
- the **forget gate** — what information to retain

Three gates is the LSTM everyone actually uses, but the credit for them is
split: Hochreiter and Schmidhuber's 1997 paper has only the input
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
error carousel has a self-weight of exactly 1.0, which makes the sage line in
Figure 5 literal.

The forget gate then put a learnable $f_t \in (0,1)$ back in the path, so it
decays again — just with a base the model can push toward 1, hence the
standard advice to initialize its bias high. The figures usually quoted, a few
hundred steps for an LSTM against a few dozen for an RNN, are rules of thumb
rather than measurements.

One more entry belongs here, though its significance only lands in section 5:
**xLSTM** (2024) revisits all of this with two variants — sLSTM, which puts
exponential gating on a scalar memory, and mLSTM, which swaps the scalar cell
for a matrix and, crucially, can be run in parallel across the sequence. Hold
on to that last property.

## 4. When Meaning Started to Depend on Neighbours

By now we have both halves of a solution, without anyone having put them
together: section 2 gave us vectors that carry meaning, section 3 a network
that reads a sentence in order. **ELMo** is what happens when someone combines
them. Word2Vec and GloVe give each word one vector for all time; ELMo runs a
two-layer bidirectional LSTM over the whole sentence and takes a word's vector
from *that*, so the output is an embedding of a word *in a sequence* rather
than of a word.

Two details are worth not compressing. The forward and backward LSTMs are
**independent**, trained separately and concatenated rather than jointly —
precisely BERT's later criticism. And the output is a *learned, task-specific
weighted sum of all layers*: layers encode different things, syntax lower,
semantics higher.

This is what fixing the polysemy problem amounts to: Word2Vec and GloVe
have no way to represent word sense or sentence meaning, and ELMo's "bank"
differs between the money sentence and the river one because the LSTM read
the rest of the sentence first.

ELMo was **feature-based**: its output was concatenated onto whatever
task-specific embedding you had, and its weights were frozen while the
downstream model trained. Worth being precise, since this gets flattened into
"ELMo was never fine-tuned" — the paper *does* fine-tune the language model on
domain text first and reports that it helps. What stays frozen is the biLM during
supervised training. Pretraining as a better input, then, but not yet as the
model itself — that last step is where the chain finally arrives.

## 5. When Everything Happened At Once

The chain ends where it began, in a single word: *Transformer*. It needs only
one word by this point, because everything above has already explained why it
had to exist.

Both RNN and LSTM share one defect that no amount of gating repaired *at the
time*: **sequential dependence**. Step $t$ cannot be computed until step $t-1$
is done, which forfeits the one thing modern hardware is good at. The
qualifier matters, because mLSTM later showed gating and parallelism are not
actually incompatible — it simply took a decade.

<div class='knob'>
    <svg viewBox='0 0 720 260' id='par-svg' role='img'
         aria-label='Two timelines. The recurrent model computes one token per step, so its wall clock grows with sequence length. The transformer computes every position in one step but does quadratically many pair comparisons.'>
        <g id='par-scene'></g>
    </svg>
    <div class='controls'>
        <label for='par-t'>sequence length $T$</label>
        <input type='range' id='par-t' min='2' max='24' value='8'>
        <span class='readout' id='par-t-out'></span>
    </div>
    <div class='controls'>
        <label for='par-p'>parallel units available</label>
        <input type='range' id='par-p' min='1' max='64' value='32'>
        <span class='readout' id='par-p-out'></span>
    </div>
    <p class='note' id='par-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 6.</span>
    The trade the transformer made, drawn as time. The
    <span style='color:#3E6491'><b>recurrent</b></span> model takes $T$ steps
    however much hardware you give it &#8212; each cell waits on the one
    before, so the second slider does nothing to it at all. The
    <span style='color:#8C77BC'><b>transformer</b></span> does more total work,
    $T^2$ pair comparisons against the RNN's $T$, and finishes sooner anyway
    because that work can all happen at once. Pull the parallel units down to
    one and the advantage evaporates: this was a bet on hardware, not a
    reduction in arithmetic.
</div>

<script>
(function () {
  var scene = document.getElementById('par-scene'),
      tR = document.getElementById('par-t'), pR = document.getElementById('par-p'),
      tOut = document.getElementById('par-t-out'), pOut = document.getElementById('par-p-out'),
      note = document.getElementById('par-note');
  var X0 = 118, X1 = 700, ROW1 = 74, ROW2 = 176, H = 20;

  function draw() {
    var T = +tR.value, P = +pR.value;
    var rnnSteps = T;                         // strictly sequential
    var attnWork = T * T;                     // every position against every other
    var attnSteps = Math.ceil(attnWork / P);  // as many at a time as there are units
    var span = Math.max(rnnSteps, attnSteps, 1);
    var w = (X1 - X0) / span, s = '', i;

    s += "<text x='8' y='" + (ROW1 - 22) + "' font-size='11' font-weight='600' fill='#3E6491'>RNN / LSTM</text>";
    s += "<text x='8' y='" + (ROW1 - 7) + "' font-size='10' fill='#8C8C8C'>one token per step</text>";
    for (i = 0; i < rnnSteps; i++) {
      s += "<rect x='" + (X0 + i * w + 1.5).toFixed(1) + "' y='" + ROW1 + "' width='" +
           Math.max(2, w - 3).toFixed(1) + "' height='" + H + "' rx='3' fill='#3E6491' fill-opacity='0.85'/>";
      if (i < rnnSteps - 1 && w > 12) {
        s += "<line x1='" + (X0 + (i + 1) * w - 1.5).toFixed(1) + "' y1='" + (ROW1 + H / 2) +
             "' x2='" + (X0 + (i + 1) * w + 1.5).toFixed(1) + "' y2='" + (ROW1 + H / 2) +
             "' stroke='#3E6491' stroke-width='1.4'/>";
      }
    }
    s += "<text x='8' y='" + (ROW2 - 22) + "' font-size='11' font-weight='600' fill='#8C77BC'>Transformer</text>";
    s += "<text x='8' y='" + (ROW2 - 7) + "' font-size='10' fill='#8C8C8C'>every pair at once</text>";
    for (i = 0; i < attnSteps; i++) {
      s += "<rect x='" + (X0 + i * w + 1.5).toFixed(1) + "' y='" + ROW2 + "' width='" +
           Math.max(2, w - 3).toFixed(1) + "' height='" + H + "' rx='3' fill='#8C77BC' fill-opacity='0.85'/>";
    }
    s += "<line x1='" + X0 + "' y1='" + (ROW2 + H + 22) + "' x2='" + X1 + "' y2='" + (ROW2 + H + 22) +
         "' stroke='#D8D4CE' stroke-width='1.2'/>";
    s += "<text x='" + X0 + "' y='" + (ROW2 + H + 40) + "' font-size='10.5' fill='#6E6E6E'>wall-clock steps &#8594;</text>";
    scene.innerHTML = s;
    tOut.textContent = 'T = ' + T;
    pOut.textContent = P + ' unit' + (P === 1 ? '' : 's');
    note.textContent = 'The recurrent model needs ' + rnnSteps + ' sequential steps. The ' +
      'transformer does ' + attnWork + ' pair comparisons \u2014 ' + (attnWork / rnnSteps).toFixed(0) +
      '\u00d7 the work \u2014 but finishes in ' + attnSteps + ' step' + (attnSteps === 1 ? '' : 's') +
      ' on ' + P + ' unit' + (P === 1 ? '' : 's') + '. ' +
      (attnSteps < rnnSteps ? 'The extra arithmetic is free because it is not on the critical path.'
                            : 'With this little hardware the extra arithmetic is not free at all.');
  }
  tR.addEventListener('input', draw);
  pR.addEventListener('input', draw);
  draw();
})();
</script>

One link I had missed entirely belongs here: attention was not the
transformer's invention. Bahdanau and colleagues added it to an RNN encoder-decoder in 2014,
so a decoder could look back at any source position without squeezing through
a bottleneck state. The transformer deleted the recurrence around it — every
position against every other in one parallel operation, with reach no longer
set by how far a gradient survives a matrix product.

The price is worth writing down, because the cheerful version of this story
tends to omit it: **attention costs $O(T^2)$**, and
autoregressive decoding needs a KV cache that grows with the sequence.

Two qualifications, since that sentence has aged. The quadratic term is
*compute*: attention's memory has been linear in practice since FlashAttention
showed the $T \times T$ matrix need never be materialized. And the parallelism
is real in training and prefill but not in generation, which emits one token
per forward pass and is as sequential as an RNN — which is why the KV cache
exists at all.

That node opens onto three arguments I have written up elsewhere: which
normalizer goes inside the block
([RMSNorm vs. LayerNorm](/blog/2026/07/10/rmsnorm-vs-layernorm/)), where in
the block it goes
([Pre-Norm vs. Post-Norm](/blog/2026/07/18/pre-norm-vs-post-norm/)), and how
position gets into a model that has no sense of order
([RoPE](/blog/2026/07/02/rope/)).

One last side note belongs here, about normalization — the operation that
keeps the numbers inside a deep network from running away. **BatchNorm**
normalizes a feature across the samples in a batch; **LayerNorm** normalizes
across the features within one sample.

The sharper half of the argument for preferring the latter is this: the same
channel of two different images is a comparable quantity, and two different
channels of one image are not. Sentences make it worse still, since they have
different lengths and arrive in batches of wildly varying shape. That is most
of why language models normalize within a sample rather than across a
batch.

## 6. Counting the Doors Still Open

Everything so far has been about representation. It is worth closing with the
number the whole field used to measure whether any of it was working:
**perplexity**.

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

It is much easier to feel than to read about. Drag the distribution from
peaked to flat and watch the number follow — it runs from 1 to the vocabulary
size and no further:

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

### Where This Sits Now

If you are heading into research, the reason to know this chain is not
historical interest. It is that every one of these ideas is still in the
building.

The n-gram's failure is why models learn representations rather than counts,
and the way a modern model still fails on rare sequences is a softer version
of the same arithmetic. Embeddings are the first and last layers of every
transformer, and in the largest vocabularies they are a substantial fraction
of the parameters. The vanishing-gradient analysis in section 3 is exactly the
analysis behind residual connections, and behind where a transformer puts its
normalizers.

The sequential-versus-parallel argument has come back around too. The
state-space models — Mamba, and the mLSTM of xLSTM — are recurrences that
found a way to be parallel in training, which is precisely the property the
transformer won on. Whether they displace attention at scale is genuinely
open.

The thing I would take from the shape of the whole chain, though, is that
every step was a *representation* decision rather than an optimization one.
What is a word, numerically. The current answer is "a vector whose meaning is
computed from everything around it", and it has held for eight years, which is
by far the longest any answer has lasted.

## 7. Chat This Over With Friends

The thing worth saying is that the whole history before transformers is a
single question asked over and over: what is a word, numerically? A count,
then a direction, then a direction that depends on its neighbours, then one
that depends on all of them at once — and each answer exists because the
previous one could not do something specific. Counting died of arithmetic, and
the numbers are stark enough to quote from memory. With a vocabulary of just
2,530 words there are $10^{17}$ possible five-word sequences; a corpus sees
around $10^{-13}$ of them, and almost every one of those exactly once. No
quantity of data repairs that, because the space grows faster than any corpus
can be made to grow.

Two things in the popular telling are wrong, and correcting them is the
enjoyable part. Word2Vec did not invent word embeddings — Bengio's neural
language model was learning them a decade earlier, and learning them is what
that paper is *for*; Word2Vec's contribution was making them cheap enough for
everyone. And the lineage people recite is not a chronology at all: LSTM
predates Word2Vec by sixteen years, and ELMo appeared four months *after* the
transformer. An arrow in a chain like this means "here is what that could not
do", never "here is what came next". The fair objection to the whole
framing is that smoothed n-grams were not the failure it implies — modified
Kneser-Ney five-grams held the state of the art for roughly two decades. What
counting could never supply is any notion that two words are *similar*, and
that, rather than accuracy, is what the rest of the story is about.

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
