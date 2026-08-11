---
title: Pre-Norm vs. Post-Norm
subtitle: Moving the normalizer off the main path is what made deep transformers trainable, and the argument over where to put it instead is still going.
date: 2026-08-12
tags: llm
icon: 🍵
---

A transformer layer has three moving parts: a sub-layer that does the work
(attention, or a feed-forward network), a residual connection that adds the
sub-layer's output back to its input, and a normalizer. There are only a few
sensible ways to order them, and the choice looks like a detail.

It is not a detail. Moving the normalizer from after the addition to before
the sub-layer is the difference between a model that requires a carefully
tuned learning-rate warm-up and one that does not. It changes what the
gradients look like before a single step of training has been taken.

[TOC]

## The Normalizer Steps Aside

The original Transformer put the normalizer on the main path, after the
residual addition. Modern language models take it off that path — most of
them putting it before the sub-layer instead, though as section 5 gets to,
that is no longer unanimous.

<div class='figure-pair tall'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/transformer-postln-block.png'
                 alt='Block diagram of a Post-LN transformer layer. Input flows through multi-head attention, then addition, then Layer Norm, then FFN, then addition, then Layer Norm.'>
            <div class='annot'>
                <span class='who'>(a) Post-norm.</span>
                The normalizer sits on the main path, after each addition.
                Every signal travelling from input to output passes through
                all of them. This is the 2017 Transformer, and BERT.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/transformer-preln-block.png'
                 alt='Block diagram of a Pre-LN transformer layer. Input branches to Layer Norm, then multi-head attention, then addition; then branches to Layer Norm, then FFN, then addition.'>
            <div class='annot'>
                <span class='who'>(b) Pre-norm.</span>
                The normalizer moves into the branch, before each sub-layer.
                The main path is now an unbroken chain of additions from
                input to output. This is GPT-2 onwards.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        The same three parts in a different order. Follow the grey column: in
        (a) it is interrupted twice per layer by a normalizer, in (b) it runs
        clean from bottom to top and every normalizer has stepped aside into a
        branch. That uninterrupted column is most of the story — it is what
        makes pre-norm easy to train, and, as section 5 gets to, the property
        that later designs kept even while moving the normalizer around it.
        <br>
        Figure 1, Xiong et al. (2020), split into its two panels and
        recoloured. This diagram also opens
        <a href='/blog/2026/08/11/rmsnorm-vs-layernorm/'>the RMSNorm post</a>,
        where the question was which normalizer goes in the green boxes rather
        than where the boxes go.
    </div>
</div>

## 1. The Ritual Nobody Could Explain

For three years, training a transformer meant performing a ritual whose
purpose nobody could quite articulate.

**2017: the warm-up appears.** The original Transformer is trained with a
learning rate that starts near zero, rises linearly for 4,000 steps, and only
then begins to decay. This **learning-rate warm-up** was presented as part of
the recipe rather than as a finding. It was, however, load-bearing: later work
found that with too few warm-up steps the optimization simply diverges, and
that final quality was sensitive both to the number of warm-up steps and to
the peak learning rate.

That is an unpleasant place to be. Warm-up costs time at the start of every
run, adds two hyper-parameters that interact with each other, and — worst —
nobody could say what it was for. It was not invented for transformers:
large-batch image training had used gradual warm-up since 2017, where the
explanation was batch size rather than architecture. But transformers seemed
to need it at any batch size, which suggested something else was going on.

**2018–2019: a rearrangement spreads quietly.** Several groups independently
moved the normalizer inside the residual branch — Baevski and Auli, the
Sparse Transformer, work on deep translation models, and GPT-2, which put
normalization at the input of each sub-block and added a final one after the
last block. In none of them was it the headline. It was a thing you did to
stop deep models falling over.

**2020: someone works out why.** Ruibin Xiong and colleagues asked what the
warm-up was for. Their paper calls the arrangements Post-LN and Pre-LN, after
LayerNorm; the names are interchangeable with post-norm and pre-norm here.
Their answer is an argument about initialization: at initialization, the
Post-LN transformer's gradients near the output are large, so a large
learning rate destabilizes training, and warm-up is the workaround. Move the
normalizer into the branch and the problem does not arise. This is the paper
that turned a folk remedy into a design rule, and the one this post is mostly
about.

**2020 onwards: pre-norm becomes the default.** GPT-3, LLaMA, Mistral, Qwen,
Gemma, DeepSeek — pre-norm throughout, usually with RMSNorm in place of
LayerNorm. If you train a transformer today without thinking about it, you
train a pre-norm one.

And then, starting around 2022, people began moving it back. That is section
5.

## 2. The Stream That Only Rises

The difference between the two arrangements is one line of algebra, and the
consequence follows from it directly. One caveat governs this whole section:
everything below describes a network **at initialization**, before any
training. That is where the theory lives, and it is not the same as a claim
about a trained model.

Write $F_l$ for the $l$-th sub-layer and $N$ for the normalizer. **Post-norm**
puts $N$ outside:

$$
x_{l+1} = N\big(x_l + F_l(x_l)\big).
$$

**Pre-norm** puts $N$ inside the branch, and adds one final normalization
before the prediction head:

$$
x_{l+1} = x_l + F_l\big(N(x_l)\big), \qquad x_{\text{out}} = N(x_{L}).
$$

### What the residual stream does

Now follow $\|x_l\|$, the size of the vector travelling up the main path — the
**residual stream**.

Under post-norm the answer is immediate. The last operation in every layer is
$N$, so whatever went in, what comes out has been rescaled to a fixed size.
For an RMS-style normalizer producing unit root-mean-square entries,
$\|x_{l+1}\| = \sqrt{d}$ for every $l$. The stream is rinsed clean at every
layer.

Under pre-norm nothing rescales the main path at all. It is additions all the
way up, so the sub-layer outputs accumulate:

$$
x_L = x_0 + \sum_{l=0}^{L-1} F_l\big(N(x_l)\big).
$$

Each $F_l$ receives a normalized input, so its output has some characteristic
size, say $\|F_l\| \approx \sqrt{d}$. At initialization these terms are
essentially uncorrelated with one another and with $x_0$ — they are built from
independent random weights — so their squared norms add rather than their
norms:

$$
\|x_L\|^2 \;\approx\; \|x_0\|^2 + \sum_{l=0}^{L-1}\|F_l\|^2 \;\approx\; (L+1)\,d,
\qquad\text{so}\qquad \|x_L\| \approx \sqrt{(L+1)\,d}.
$$

**The pre-norm residual stream grows like $\sqrt{L}$.** Counting residual
writes rather than layers — a transformer layer contributes two, one per
sub-layer — a 64-layer model performs 128 of them and carries a vector about
eleven times larger at the top than at the bottom.

Two qualifications. The constant $(L+1)d$ belongs to this sketch; Xiong et
al.'s Lemma 2 only brackets the real quantity between $(1+l/2)d$ and
$(1+3l/2)d$, since a ReLU discards about half the feed-forward branch's
energy. The $\sqrt{L}$ scaling survives, the constant does not.

More importantly, the growth follows from how the branch is initialized
rather than from the architecture. GPT-2 cancels it deliberately, reporting
"a modified initialization which accounts for the accumulation on the
residual path with model depth" and scaling residual weights by $1/\sqrt{N}$
— which makes the sum $\approx d$ and the stream flat in depth. The
accumulation was spotted and patched two years before anyone explained it.

### Why that determines the gradients

The last thing a pre-norm network does is normalize: $x_{\text{out}} =
N(x_L)$. The Jacobian of $N$ at $x_L$ carries a factor $\sqrt{d}/\|x_L\|$, and
$\|x_L\| \approx \sqrt{(L+1)d}$. So every gradient flowing back from the loss
is multiplied by

$$
\frac{\sqrt{d}}{\|x_L\|} \;\approx\; \frac{1}{\sqrt{L+1}} .
$$

**The deeper the pre-norm model, the more its final normalization damps every
gradient in it.** Post-norm has no such term. Its last normalizer divides by
$\|x + F(x)\|$, which is a constant of order $\sqrt{d}$ — $\sqrt{2d}$ in the
toy of section 6, hence the factor $1/\sqrt{2}$ that appears there — and
crucially it does not move with $L$. Depth changes nothing.

This is Theorem 1 of Xiong et al. Writing $\tilde{\mathcal{L}}$ for the loss
and $W^{2,L}$ for the last sub-layer's second weight matrix, they bound the
gradient at the last layer as

$$
\Big\|\tfrac{\partial \tilde{\mathcal{L}}}{\partial W^{2,L}}\Big\|_F \le
\mathcal{O}\big(d\sqrt{\ln d}\big) \quad\text{(post-norm)},
\qquad
\mathcal{O}\!\left(d\sqrt{\tfrac{\ln d}{L}}\right) \quad\text{(pre-norm)} .
$$

Same expression, one divided by $\sqrt{L}$. In their words, the reason is
that "in the Post-LN Transformer, the scale of the inputs to the layer
normalization is independent of $L$", whereas in the Pre-LN Transformer "the
scale of the input to the final layer normalization is linear in $L$, and thus
the gradients of all parameters will be normalized by $\sqrt{L}$."

Read precisely, the theorem is weaker than it looks. Both lines are *upper*
bounds, so neither establishes that post-norm's gradients are large. The
separation is carried by the measurements in section 3, not by the theorem —
whose assumptions include single-head attention and query and key matrices
initialized to zero.

Two objections deserve stating rather than hiding. Adam, which everyone uses,
is invariant to rescaling a gradient by a constant, so a constant factor
between the two arrangements should barely move the update size; Xiong et
al.'s partial answer is that warm-up helps SGD too. And the $1/\sqrt{L}$
damping describes step zero — the final normalizer has a learned gain, and
the first thing training does with a uniformly damped gradient is grow it.

With those caveats, warm-up has an explanation. Post-norm starts where the
relation between step size and stability is delicate, and warm-up tiptoes
through it; pre-norm starts somewhere flatter. What changed in 2020 was not
that warm-up disappeared — every model named in section 1 still uses it — but
that its length and peak stopped being choices that could sink a
run.[^warmup]

## 3. Where the Gradient Piles Up

The theorem is about the last layer. The more revealing picture is what
happens across all of them — and it is *not* what section 2 predicts. A
uniform $1/\sqrt{L}$ damping says nothing about how gradients should vary
from layer to layer. The profile below is a separate phenomenon, and it is
the one that actually motivated warm-up.

<div class='figure-pair'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/preln-grad-by-layer.png'
                 alt='Bar chart of gradient magnitude for each of six layers. Pre-LN bars are roughly level around 0.3 to 0.55. Post-LN bars climb from about 0.12 at layer 1 to about 1.65 at layer 6. Post-LN after warm-up is near zero everywhere.'>
            <div class='annot'>
                <span class='who'>(a) The mechanism.</span>
                <b>Post-LN</b> (plum) climbs from roughly 0.12 at the first
                layer to about 1.65 at the sixth — thirteen-fold
                across six layers. <b>Pre-LN</b> (blue) drifts down mildly
                over the same span, 0.55 to 0.29, a factor of two. After
                warm-up (sage), Post-LN's gradients are small everywhere.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/preln-bleu-warmup.png'
                 alt='BLEU against epochs for four configurations. The two Pre-LN curves without warm-up rise fastest and highest; Post-LN with warm-up trails them; Post-LN without warm-up is worst.'>
            <div class='annot'>
                <span class='who'>(b) The consequence.</span>
                Both <b>Pre-LN</b> runs without warm-up (the two blues, one
                under Adam and one under RAdam) reach a higher BLEU sooner
                than <b>Post-LN with warm-up</b> (sage), and finish level
                with it — the paper's own word is "comparable".
                <b>Post-LN</b> (plum) is worst even under RAdam, an optimizer
                designed to make warm-up unnecessary.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 2.</span>
        Panel (a) is the argument and panel (b) is the payoff. Note what (a)
        says about warm-up: it does not make Post-LN's gradients well
        proportioned across layers, it makes them all small. Warm-up survives
        the dangerous region by moving slowly through it, which is why it
        costs time and why removing it saves time. The comparison in (b) that
        matters is blue against sage — the arrangement that needs no ritual
        against the arrangement that does.
        <br>
        Figures 3(b) and 4(b), Xiong et al. (2020), recoloured. Across the
        two charts in this post Pre-LN is blue, Post-LN plum, and Post-LN
        rescued by warm-up sage; the colours in the block diagram above are
        structural and unrelated.
    </div>
</div>

## 4. The Bill for a Clean Path

|  | Post-norm | Pre-norm |
|---|---|---|
| Formula | $N(x + F(x))$ | $x + F(N(x))$ |
| Residual stream at init | reset each layer | grows as $\sqrt{L}$ |
| Last-layer gradient at init | independent of $L$ | damped by $1/\sqrt{L}$ |
| Sensitivity to warm-up length | high | low |
| Depth, without extra measures | hard past a few dozen layers | routine at 100+ |

Three things are worth taking from this.

**The clean residual path is the mechanism, not a metaphor.** The main path
in Figure 1(b) is a sum with no nonlinearity and no rescaling on it, so the
gradient reaching layer $l$ contains a term that has passed through nothing
at all. In post-norm, $L$ normalizers stand in the road.

**Stability may have been bought with something.** A growing stream means
later layers write into a vector that is already large, so each one's
relative contribution shrinks with depth, and recent work argues deep
pre-norm models under-use their later layers as a result. Treat it as an open
question: under the $\sqrt{L}$ model the effect is weak — 50 to 100 layers
shrinks a layer's relative write by only $\sqrt{2}$ — and that work generally
blames a faster, training-time variance growth instead.

**A tie in final quality was never established.** Xiong et al. showed pre-norm
reaching comparable results faster and without warm-up. Comparable is not
better, and the paper does not claim it is. Post-norm's reputation for
quality survived: DeepNet, arriving two years later, motivates itself by
setting out to combine "the good performance of Post-LN and the stable
training of Pre-LN", which only makes sense as a goal if the first of those
was still worth wanting.

It would be easy to overstate this. The work in the next section is not, in
the main, chasing a quality edge from post-norm; its stated motivations are
about stability — gradient spikes, activation growth, variance control. The
unfinished comparison is a loose end, not the engine.

## 5. The Slow Walk Back

If pre-norm had simply won, this post would end here. Instead the last few
years have been a slow effort to recover post-norm's advantages without its
instability, and the result is that the two-way choice has become a four-way
one.

**2021, from vision: normalize the output, not the input.** Swin Transformer
V2 moved the normalizer to the *output* of each residual branch — still off
the main path, but applied after the sub-layer rather than before it. The
stream stays unnormalized, but what gets added into it is bounded.

**2022: make post-norm trainable instead.** DeepNet took the other route,
keeping post-norm and fixing the instability directly by scaling the residual
connection by a constant $\alpha$ and shrinking the initial weights inside the
branch by $\beta$, both derived from the architecture. The result was a
1,000-layer transformer, an order of magnitude deeper than anything before
it. Their headline comparison — a 200-layer 3.2B model beating a 48-layer 12B
model by 5 BLEU — is against a different system on different data, so read it
as evidence the depth is usable, not as a measurement of what post-norm
buys.

**2024–2025: the frontier labs move.** Gemma 2 normalizes *both* the input and
the output of every sub-layer — belt and braces, now often called **Peri-LN** or
sandwich normalization. OLMo 2 went further and adopted the Swin arrangement
wholesale, calling it **reordered norm**:

$$
h = x + \text{RMSNorm}\big(\text{Attention}(x)\big), \qquad
h_{\text{out}} = h + \text{RMSNorm}\big(\text{MLP}(h)\big).
$$

The honest detail, which is easy to lose when this gets repeated: it does not
work on its own. OLMo 2 pairs it with normalization of the attention queries
and keys, and reports that "in isolation, neither of these changes yield good
results, but together they improve both the growth and the spikiness of the L2
norm of the gradient."

That dependency is the interesting part, not a caveat. Removing the pre-norm
means attention now receives the raw residual stream — the quantity that
grows — so the attention logits grow with it and something must bound them.
Normalizing queries and keys is that something. The pattern repeats: Swin V2
paired res-post-norm with scaled cosine attention, and DeepNet's $\alpha$ and
$\beta$ are derived together. None of these is a one-line change.

So there are now four arrangements in live use:

| Name | Formula | Used by |
|---|---|---|
| Post-norm | $x \leftarrow N(x + F(x))$ | Transformer, BERT |
| Pre-norm | $x \leftarrow x + F(N(x))$ | GPT-2, GPT-3, LLaMA, Mistral, Qwen |
| Reordered / output-norm | $x \leftarrow x + N(F(x))$ | Swin V2, OLMo 2 |
| Peri-norm / sandwich | $x \leftarrow x + N(F(N(x)))$ | Gemma 2 |

The table understates the variety — DeepNorm, Admin, ReZero, LayerScale and
NormFormer all sit somewhere in this space — but it captures the compromise:
keep the main path free of normalizers, which was pre-norm's insight, while
stopping the branch from writing unbounded quantities into it, which was
post-norm's.

So "moving it back" needs qualifying. DeepNet went back literally, putting
the normalizer on the main path and making it work by scaling the residual.
The others did not: reordered and peri-norm leave the residual path clean and
move the normalizer around *within* the branch. What was recovered is not
post-norm's position but its restraint.

## 6. What a Stack of Random Matrices Knows

Both claims in section 2 are checkable in a toy small enough to write by hand.
Take a stack of random linear sub-layers, $W$ with entries drawn from
$\mathcal{N}(0, 1/d)$ so that $\mathbb{E}\|Wz\|^2 = \|z\|^2$, and stack them
the two ways:

```python
def pre_norm_step(x, W):
    return x + W @ norm(x)          # main path untouched

def post_norm_step(x, W):
    return norm(x + W @ x)          # main path renormalized
```

<div class='figure'>
    <img src='/images/pre-vs-post-norm.png'
         alt='Two panels. Left: residual stream norm against layer, with pre-norm following a square-root curve and post-norm flat. Right: log-log plot of last-layer gradient norm against depth, with pre-norm falling along a one-over-root-L line and post-norm constant.'>
    <div class='caption'>
        <span class='caption-label'>Figure 3.</span>
        Norms are in units of $\sqrt{d}$, so a post-norm stream held at
        $\sqrt{d}$ reads as 1; each curve is the mean of 24 random stacks.
        <b>(a)</b> The pre-norm stream (blue) tracks $\sqrt{L+1}$: 4.14
        against a predicted 4.12 at 16 residual writes, 11.40 against 11.36 at
        128. <b>(b)</b> Pre-norm's last-layer gradient falls along
        $1/\sqrt{L+1}$ — 0.578 against 0.577 at $L=2$, 0.087 against 0.088 at
        $L=128$ — while post-norm sits flat at $1/\sqrt{2}$ across a
        sixty-four-fold change in depth. That constant is section 2's:
        post-norm's last normalizer divides by $\|x + F(x)\| \approx
        \sqrt{2d}$, not $\sqrt{d}$. Reference lines are closed forms, not fits.
    </div>
</div>

Panel (b) is the *mechanism* behind Theorem 1 rather than the theorem, which
is a statement about transformers; this stack has no attention, no
nonlinearity and no data. What it shows is that the damping needs none of
them. It is a property of dividing by the length of a vector that addition
has been lengthening.

Two honesty notes, because a toy that agrees with you is the easiest thing to
build. Panel (a) nearly restates its own assumption: asking whether $L$
random vectors sum to length $\sqrt{L}$ is asking whether high-dimensional
random vectors are near-orthogonal. The non-trivial claim — that a *real*
sub-layer's output is uncorrelated with the stream — is what i.i.d. Gaussian
weights assume away. And nothing here is unstable: post-norm's gradient sits
flat and well-behaved. The toy shows pre-norm's damping and is silent on
post-norm's difficulty, which is the half the opening rests on.

## 7. Recap

- A transformer layer's three parts can be ordered a few ways. Post-norm puts
  the normalizer on the main path after the addition; pre-norm moves it into
  the residual branch, before the sub-layer.
- Under pre-norm nothing rescales the main path, so at initialization the
  residual stream grows as $\sqrt{L}$ — unless the branch is deliberately
  initialized to cancel it, as GPT-2's was. Under post-norm it is reset.
- The final normalization divides by that stream, so pre-norm damps every
  gradient by $1/\sqrt{L}$ while post-norm's are independent of depth. This is
  Theorem 1 of Xiong et al., and a stack of random matrices reproduces it.
- That is most of what warm-up was for. Note what did *not* happen: warm-up
  is still standard in every large model named here. What changed is that its
  length and peak stopped being choices that could sink a run.
- The trade may run both ways. Pre-norm buys trainability and depth; what a
  growing stream costs the later layers is an open question.
- The question is live again. DeepNet made post-norm trainable at 1,000
  layers; Swin V2, OLMo 2 and Gemma 2 have moved normalization back to
  *after* the sub-layer while keeping the main path clean. Nobody has put a
  normalizer back on the main path — and nobody should say pre-norm simply
  won.

## 8. References

1. Vaswani, A., et al. (2017). Attention Is All You Need.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762).
2. Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer Normalization.
   [arXiv:1607.06450](https://arxiv.org/abs/1607.06450).
3. Xiong, R., et al. (2020). On Layer Normalization in the Transformer
   Architecture. *ICML 2020*.
   [arXiv:2002.04745](https://arxiv.org/abs/2002.04745).
4. Radford, A., et al. (2019). Language Models are Unsupervised Multitask
   Learners (GPT-2). OpenAI technical report.
5. Baevski, A., & Auli, M. (2018). Adaptive Input Representations for Neural
   Language Modeling. [arXiv:1809.10853](https://arxiv.org/abs/1809.10853).
6. Liu, Z., et al. (2021). Swin Transformer V2: Scaling Up Capacity and
   Resolution. [arXiv:2111.09883](https://arxiv.org/abs/2111.09883).
7. Wang, H., et al. (2022). DeepNet: Scaling Transformers to 1,000 Layers.
   [arXiv:2203.00555](https://arxiv.org/abs/2203.00555).
8. Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical
   Size. [arXiv:2408.00118](https://arxiv.org/abs/2408.00118).
9. OLMo Team (2025). 2 OLMo 2 Furious.
   [arXiv:2501.00656](https://arxiv.org/abs/2501.00656).
10. Kim, J., et al. (2025). Peri-LN: Revisiting Normalization Layer in the
    Transformer Architecture.
    [arXiv:2502.02732](https://arxiv.org/abs/2502.02732).

[^warmup]: Warm-up is not *only* about normalizer placement. Liu et al.
    (2019) argued it compensates for the high variance of Adam's adaptive
    learning rate early in training, and proposed RAdam to fix that directly.
    Xiong et al. note that warm-up helps other optimizers too, which suggests
    Adam is not the whole story — and Figure 2(b) shows Pre-LN doing fine
    under both. Both effects are probably real.
