---
title: Pre-Norm vs. Post-Norm
subtitle: Moving the normalizer off the main path is what made deep transformers trainable, and the argument over where to put it instead is still going.
date: 2026-08-11
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
residual addition. Modern language models take it off that path, most putting
it before the sub-layer instead — though as section 5 gets to, no longer
unanimously.

<div class='figure-pair tall'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/transformer-postln-block.png'
                 alt='Block diagram of a Post-LN transformer layer. Input flows through multi-head attention, then addition, then Layer Norm, then FFN, then addition, then Layer Norm.'>
            <div class='annot'>
                <span class='who'>(a) Post-norm.</span>
                The normalizer sits on the main path, after each addition, so
                every signal from input to output passes through all of them.
                The 2017 Transformer, and BERT.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/transformer-preln-block.png'
                 alt='Block diagram of a Pre-LN transformer layer. Input branches to Layer Norm, then multi-head attention, then addition; then branches to Layer Norm, then FFN, then addition.'>
            <div class='annot'>
                <span class='who'>(b) Pre-norm.</span>
                The normalizer moves into the branch, before each sub-layer,
                leaving the main path an unbroken chain of additions. GPT-2
                onwards.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        The same three parts in a different order. Follow the grey column: in
        (a) it is interrupted twice per layer, in (b) it runs clean from
        bottom to top. That uninterrupted column is most of the story — what
        makes pre-norm easy to train, and the property later designs kept even
        while moving the normalizer around it.
        <br>
        Figure 1, Xiong et al. (2020), split into its two panels and
        recoloured. It also opens
        <a href='/blog/2026/08/11/rmsnorm-vs-layernorm/'>the RMSNorm post</a>,
        where the question was which normalizer goes in the boxes.
    </div>
</div>

## 1. The Ritual Nobody Could Explain

For three years, training a transformer meant a ritual nobody could quite
explain. The labels above the arrows are the history; the boxes are its
dates.

<div class='roadmap'>
    <svg viewBox='0 0 760 166' role='img' aria-label='Roadmap of normalizer placement: warm-up appears in 2017, the rearrangement spreads in 2018 to 2019, Xiong et al. explain it in 2020, pre-norm is the default after.'>
      <line class='spine' x1='94.2' y1='40' x2='665.8' y2='40'/>
      <polygon class='head' points='198.5,40 189.5,36 189.5,44'/>
      <text class='why' x='189.5' y='27'>nobody could say what it was for</text>
      <polygon class='head' points='389.0,40 380.0,36 380.0,44'/>
      <text class='why' x='380.0' y='27'>it worked, unexplained</text>
      <polygon class='head' points='579.5,40 570.5,36 570.5,44'/>
      <text class='why' x='570.5' y='27'>a folk remedy becomes a rule</text>
      <circle class='dot' cx='94.2' cy='40' r='4.5'/>
      <rect class='box' x='6.0' y='56' width='176.5' height='101.5' rx='7'/>
      <text class='yr' x='94.2' y='65.0'>2017</text>
      <text class='stage' x='94.2' y='79.0'>warm-up appears</text>
      <text class='body' x='94.2' y='97.0'>The Transformer needs a</text>
      <text class='body' x='94.2' y='111.5'>learning rate that ramps</text>
      <text class='body' x='94.2' y='126.0'>for 4,000 steps. Offered as</text>
      <text class='body' x='94.2' y='140.5'>recipe, not finding.</text>
      <circle class='dot' cx='284.8' cy='40' r='4.5'/>
      <rect class='box' x='196.5' y='56' width='176.5' height='101.5' rx='7'/>
      <text class='yr' x='284.8' y='65.0'>2018-19</text>
      <text class='stage' x='284.8' y='79.0'>a quiet rearrangement</text>
      <text class='body' x='284.8' y='97.0'>Baevski and Auli, the</text>
      <text class='body' x='284.8' y='111.5'>Sparse Transformer, GPT-2:</text>
      <text class='body' x='284.8' y='126.0'>the normalizer moves into</text>
      <text class='body' x='284.8' y='140.5'>the branch. In none of them</text>
      <text class='body' x='284.8' y='155.0'>is it the headline.</text>
      <circle class='dot' cx='475.2' cy='40' r='4.5'/>
      <rect class='box' x='387.0' y='56' width='176.5' height='101.5' rx='7'/>
      <text class='yr' x='475.2' y='65.0'>2020</text>
      <text class='stage' x='475.2' y='79.0'>someone works out why</text>
      <text class='body' x='475.2' y='97.0'>Xiong et al.: at</text>
      <text class='body' x='475.2' y='111.5'>initialization post-norm</text>
      <text class='body' x='475.2' y='126.0'>gradients near the output</text>
      <text class='body' x='475.2' y='140.5'>are large, so warm-up is</text>
      <text class='body' x='475.2' y='155.0'>the workaround.</text>
      <circle class='dot' cx='665.8' cy='40' r='4.5'/>
      <rect class='box' x='577.5' y='56' width='176.5' height='101.5' rx='7'/>
      <text class='yr' x='665.8' y='65.0'>2020-</text>
      <text class='stage' x='665.8' y='79.0'>pre-norm by default</text>
      <text class='body' x='665.8' y='97.0'>GPT-3, LLaMA, Mistral,</text>
      <text class='body' x='665.8' y='111.5'>Qwen, Gemma, DeepSeek.</text>
      <text class='body' x='665.8' y='126.0'>Then, from 2022, people</text>
      <text class='body' x='665.8' y='140.5'>begin moving it back.</text>
    </svg>
</div>

Warm-up was load-bearing: with too few steps the optimization diverges, and
final quality is sensitive to both the number of steps and the peak rate. That is an unpleasant place to be — a cost at the
start of every run, two interacting hyper-parameters, and no account of what
either is for. Nor was it a transformer invention; large-batch image training
had used gradual warm-up since 2017, where the explanation was batch size.
Transformers seemed to need it at any batch size.

Xiong et al. call the two arrangements **Post-LN** and **Pre-LN**, after
LayerNorm; those names are interchangeable with post-norm and pre-norm here,
and they are the ones on the figures below. Theirs is the paper that turned a
folk remedy into a design rule, and the one this post is mostly about. The
moving-back began around 2022; that is section 5.

## 2. The Stream That Only Rises

The difference is one line of algebra, and the consequence follows directly.
One caveat governs the whole section: everything below describes a network
**at initialization**. That is where the theory lives, and it is not a claim
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

Now follow $\|x_l\|$, the size of the vector on the main path — the
**residual stream**.

Under post-norm the last operation in every layer is $N$, so whatever went in
comes out rescaled to a fixed size: $\|x_{l+1}\| = \sqrt{d}$ for every $l$,
for an RMS-style normalizer with unit root-mean-square entries. The stream is
rinsed clean at every layer.

Under pre-norm nothing rescales the main path at all. It is additions all the
way up, so the sub-layer outputs accumulate:

$$
x_L = x_0 + \sum_{l=0}^{L-1} F_l\big(N(x_l)\big).
$$

Each $F_l$ receives a normalized input, so its output has a characteristic
size, say $\|F_l\| \approx \sqrt{d}$. At initialization these terms are built
from independent random weights and so are essentially uncorrelated, which
means their *squared* norms add:

$$
\|x_L\|^2 \;\approx\; \|x_0\|^2 + \sum_{l=0}^{L-1}\|F_l\|^2 \;\approx\; (L+1)\,d,
\qquad\text{so}\qquad \|x_L\| \approx \sqrt{(L+1)\,d}.
$$

**The pre-norm residual stream grows like $\sqrt{L}$.** Counting residual
writes rather than layers — a transformer layer contributes two — a 64-layer
model performs 128 of them and carries a vector about eleven times larger at
the top than at the bottom.

The constant is only a sketch: Xiong et al.'s Lemma 2 brackets the real
quantity between $(1+l/2)d$ and $(1+3l/2)d$. The $\sqrt{L}$ scaling survives,
the constant does not. And the growth follows from how the branch is
initialized rather than from the architecture — GPT-2 cancels it deliberately,
scaling residual weights by $1/\sqrt{N}$ to account for "the accumulation on
the residual path with model depth", two years before anyone explained it.

### Why that determines the gradients

The last thing a pre-norm network does is normalize: $x_{\text{out}} =
N(x_L)$. The Jacobian of $N$ at $x_L$ carries a factor $\sqrt{d}/\|x_L\|$, and
$\|x_L\| \approx \sqrt{(L+1)d}$. So every gradient flowing back from the loss
is multiplied by

$$
\frac{\sqrt{d}}{\|x_L\|} \;\approx\; \frac{1}{\sqrt{L+1}} .
$$

**The deeper the pre-norm model, the more its final normalization damps every
gradient in it.** Post-norm has no such term: its last normalizer divides by
$\|x + F(x)\|$, a constant of order $\sqrt{d}$ that does not move with $L$.
Depth changes nothing.

This is Theorem 1 of Xiong et al., which bounds the gradient at the last
sub-layer's weight matrix $W^{2,L}$ by

$$
\mathcal{O}\big(d\sqrt{\ln d}\big) \quad\text{(post-norm)},
\qquad
\mathcal{O}\!\left(d\sqrt{\tfrac{\ln d}{L}}\right) \quad\text{(pre-norm)} .
$$

Same expression, one divided by $\sqrt{L}$, because "the scale of the input to
the final layer normalization is linear in $L$" while post-norm's "is
independent of $L$".

Read precisely, the theorem is weaker than it looks: both lines are *upper*
bounds, so neither establishes that post-norm's gradients are large — the
separation is carried by the measurements in section 3. And $1/\sqrt{L}$
damping describes step zero only, since the final normalizer has a learned
gain.

With those caveats, warm-up has an explanation. Post-norm starts where the
relation between step size and stability is delicate and warm-up tiptoes
through it; pre-norm starts somewhere flatter. What changed in 2020 was not
that warm-up disappeared — every model in section 1 still uses it — but that
its length and peak stopped being choices that could sink a run.[^warmup]

## 3. Where the Gradient Piles Up

The theorem is about the last layer. What happens across all of them is more
revealing, and it is *not* what section 2 predicts: a uniform $1/\sqrt{L}$
damping says nothing about how gradients should vary from layer to layer. The
profile below is a separate phenomenon, and the one that actually motivated
warm-up.

<div class='figure-pair'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/preln-grad-by-layer.png'
                 alt='Bar chart of gradient magnitude for each of six layers. Pre-LN bars are roughly level around 0.3 to 0.55. Post-LN bars climb from about 0.12 at layer 1 to about 1.65 at layer 6. Post-LN after warm-up is near zero everywhere.'>
            <div class='annot'>
                <span class='who'>(a) The mechanism.</span>
                <b>Post-LN</b> (plum) climbs from roughly 0.12 at the first
                layer to about 1.65 at the sixth — thirteen-fold.
                <b>Pre-LN</b> (blue) drifts down over the same span, 0.55 to
                0.29. After warm-up (sage), Post-LN's gradients are small
                everywhere.
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
        Panel (a) is the argument, panel (b) the payoff. Note what (a) says
        about warm-up: it does not make Post-LN's gradients well proportioned
        across layers, it makes them all small. It survives the dangerous
        region by moving slowly through it — which is why it costs time, and
        why removing it saves time.
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

**The clean residual path is the mechanism, not a metaphor.** The main path in
Figure 1(b) is a sum with no nonlinearity and no rescaling, so the gradient
reaching layer $l$ contains a term that passed through nothing. In post-norm,
$L$ normalizers stand in the road.

**Stability may have been bought with something.** Later layers write into a
vector that is already large, so each one's relative contribution shrinks with
depth, and recent work argues deep pre-norm models under-use their later
layers. Treat it as open: under the $\sqrt{L}$ model the effect is weak — 50
to 100 layers shrinks a layer's relative write by only $\sqrt{2}$ — and that
work generally blames a faster training-time variance growth instead.

**A tie in final quality was never established.** Xiong et al. showed pre-norm
reaching *comparable* results faster and without warm-up, and comparable is
not better. Post-norm's reputation survived: DeepNet, two years later,
motivates itself by combining "the good performance of Post-LN and the stable
training of Pre-LN" — only a sensible goal if the first was still worth
wanting.


## 5. The Slow Walk Back

If pre-norm had simply won, this post would end here. Instead the last few
years have been an effort to recover post-norm's advantages without its
instability, turning a two-way choice into a four-way one.

**2021, from vision.** Swin Transformer V2 moved the normalizer to the
*output* of each branch — still off the main path, but after the sub-layer
rather than before. The stream stays unnormalized; what gets added to it is
bounded.

**2022: make post-norm trainable instead.** DeepNet kept post-norm and fixed
the instability directly, scaling the residual connection by $\alpha$ and
shrinking the branch's initial weights by $\beta$, both derived from the
architecture. The result was a 1,000-layer transformer. Their headline — a
200-layer 3.2B model beating a 48-layer 12B model by 5 BLEU — is against a
different system on different data, so read it as evidence the depth is
usable, not as a measurement of what post-norm buys.

**2024–2025: the frontier labs move.** Gemma 2 normalizes *both* the input and
the output of every sub-layer — belt and braces, now often called **Peri-LN** or
sandwich normalization. OLMo 2 went further and adopted the Swin arrangement
wholesale, calling it **reordered norm**:

$$
h = x + \text{RMSNorm}\big(\text{Attention}(x)\big), \qquad
h_{\text{out}} = h + \text{RMSNorm}\big(\text{MLP}(h)\big).
$$

The honest detail, easy to lose when this gets repeated: it does not work on
its own. OLMo 2 pairs it with query and key normalization, reporting that "in
isolation, neither of these changes yield good results, but together they
improve both the growth and the spikiness of the L2 norm of the gradient."

That dependency is the interesting part. Removing the pre-norm means
attention receives the raw residual stream — the quantity that grows — so the
logits grow with it and something must bound them. The pattern repeats: Swin
V2 paired res-post-norm with scaled cosine attention, and DeepNet's $\alpha$
and $\beta$ are derived together. None of these is a one-line change.

Four arrangements are now in live use:

| Name | Formula | Used by |
|---|---|---|
| Post-norm | $x \leftarrow N(x + F(x))$ | Transformer, BERT |
| Pre-norm | $x \leftarrow x + F(N(x))$ | GPT-2, GPT-3, LLaMA, Mistral, Qwen |
| Reordered / output-norm | $x \leftarrow x + N(F(x))$ | Swin V2, OLMo 2 |
| Peri-norm / sandwich | $x \leftarrow x + N(F(N(x)))$ | Gemma 2 |

The table understates the variety — DeepNorm, Admin, ReZero, LayerScale and
NormFormer all sit in this space — but it captures the compromise: keep the
main path free of normalizers, pre-norm's insight, while stopping the branch
writing unbounded quantities into it, post-norm's.

So "moving it back" needs qualifying. Only DeepNet went back literally.
Reordered and peri-norm leave the residual path clean and move the normalizer
around *within* the branch. What was recovered is not post-norm's position but
its restraint.

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
        Norms are in units of $\sqrt{d}$, so a post-norm stream held there
        reads as 1; each curve is the mean of 24 random stacks.
        <b>(a)</b> The pre-norm stream (blue) tracks $\sqrt{L+1}$: 4.14
        against a predicted 4.12 at 16 residual writes, 11.40 against 11.36 at
        128. <b>(b)</b> Its last-layer gradient falls along $1/\sqrt{L+1}$ —
        0.578 against 0.577 at $L=2$, 0.087 against 0.088 at $L=128$ — while
        post-norm sits flat at $1/\sqrt{2}$ across a sixty-four-fold change in
        depth, the constant being section 2's $\|x + F(x)\| \approx
        \sqrt{2d}$. Reference lines are closed forms, not fits.
    </div>
</div>

Panel (b) is the *mechanism* behind Theorem 1 rather than the theorem: this
stack has no attention, no nonlinearity and no data, and the damping needs
none of them. It is a property of dividing by the length of a vector that
addition has been lengthening.

Two honesty notes, because a toy that agrees with you is the easiest thing to
build. Panel (a) nearly restates its own assumption: that a *real* sub-layer's
output is uncorrelated with the stream is what i.i.d. Gaussian weights assume
away. And nothing here is unstable — the toy shows pre-norm's damping and is
silent on post-norm's difficulty, which is the half the opening rests on.

## 7. Chat This Over With Friends

**The one-line version.** Moving the normalizer one step earlier — off the
main path and into the branch — is most of why anyone can train a hundred-layer
transformer at all.

**The detail that lands.** Nothing rescales pre-norm's main path, so the
vector running up it accumulates like $\sqrt{L}$ — a 64-layer model carries
something eleven times larger at the top than at the bottom. The last thing
the network does is normalize, which divides by that, so every gradient in a
deep pre-norm model is damped by $1/\sqrt{L}$ before training starts. That is
the whole theorem, and a stack of random matrices reproduces it.

**What most people get wrong.** "Pre-norm meant we could delete the
learning-rate warm-up." Every large model named in this post still warms up.
What actually changed is subtler and more useful: warm-up's length and peak
stopped being choices that could sink a run.

**If someone pushes back.** The good objection is that Adam is invariant to
rescaling a gradient by a constant, so a constant factor should barely move
the update size. That is the weakest joint in the standard argument.

**The thing nobody expects.** It is being walked back. DeepNet made post-norm
trainable at a thousand layers; OLMo 2 and Gemma normalize *after* the
sub-layer again. Nobody put it back on the main path — what got recovered was
post-norm's restraint, not its position.

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
