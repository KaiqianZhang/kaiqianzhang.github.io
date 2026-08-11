---
title: RMSNorm vs. LayerNorm
subtitle: Nearly every modern language model deleted one step from LayerNorm — here is exactly how little that step was doing.
date: 2026-08-11
tags: llm
icon: 🍵
---

Every transformer normalizes. Between the attention block and the feed-forward
block, and again before the next attention block, the hidden vector for each
token is rescaled so that its entries have a controlled size. Without this the
models do not train.

For seven years the standard way to do this was **layer normalization**, or
**LayerNorm**. Today almost every large language model uses something simpler
called **root mean square layer normalization**, or **RMSNorm**. The change
between them is small enough to state in one sentence: RMSNorm does not
subtract the mean.

This post is about why that one deletion was worth making, and what it tells
us about how progress in this field actually happens.

[TOC]

## Where the Normalizer Lives

Before the history, it is worth seeing where in the network any of this
happens. RMSNorm is a drop-in replacement for LayerNorm, not a rearrangement
of the architecture — both occupy exactly the same slot. So the useful picture
is of the slot itself.

<div class='figure-pair tall'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/transformer-postln-block.png'
                 alt='Block diagram of a Post-LN transformer layer. Input flows through multi-head attention, then addition, then Layer Norm, then FFN, then addition, then Layer Norm.'>
            <div class='annot'>
                <span class='who'>(a) Post-norm, the 2017 arrangement.</span>
                The green boxes sit on the main path, <i>after</i> each
                residual addition. This is the original Transformer, and it is
                what BERT, GPT-2, and GPT-3 use.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/transformer-preln-block.png'
                 alt='Block diagram of a Pre-LN transformer layer. Input branches to Layer Norm, then multi-head attention, then addition; then branches to Layer Norm, then FFN, then addition.'>
            <div class='annot'>
                <span class='who'>(b) Pre-norm, the modern arrangement.</span>
                The green boxes moved <i>inside</i> the residual branch, before
                each sub-layer, leaving the main path clear. This is what
                LLaMA, Mistral, Qwen, and Gemma use — with RMSNorm in those
                boxes.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        Two normalization sites per layer, marked in green — one before
        attention, one before the feed-forward network. Everything in this post
        happens inside a green box. The boxes are labelled "Layer Norm" because
        the diagram predates the switch; in a current model they contain
        RMSNorm instead, in the same positions. Note that moving from (a) to
        (b) is a <i>separate</i> change from the one this post is about, made
        for reasons to do with gradients rather than cost. Today's models made
        both.
        <br>
        Reproduced figures throughout this post are recoloured to the
        palette used here, so that LayerNorm is always blue, RMSNorm always
        green, and an un-normalized baseline always taupe. Only hue is
        changed; no data is altered.
        <br>
        Figure 1, Xiong et al. (2020), split into its two panels and
        recoloured.
    </div>
</div>

## 1. The Mean That Everyone Kept Subtracting

To see why RMSNorm exists, it helps to know what problem normalization was
invented to solve, and what each attempt cost.

**2015: normalization arrives.** Ioffe and Szegedy introduced **batch
normalization**, which standardizes each feature using the mean and variance
computed *across the examples in a mini-batch*. It worked remarkably well for
convolutional networks, and it made much deeper networks trainable. But the
statistics depend on the batch, and that dependence is a problem. Sequences
have different lengths, so a recurrent network's batch statistics are
different at every time step. Inference on a single example has no batch at
all, so BatchNorm needs a separate set of running averages, which is one more
thing to get wrong.

**2016: LayerNorm removes the batch.** Ba, Kiros, and Hinton made a small
change with large consequences. Instead of normalizing each feature across the
batch, normalize *each example across its own features*. The statistics for a
token now depend on that token and nothing else. There is no batch dependence,
no train/test discrepancy, and no difficulty with variable-length sequences.
LayerNorm was designed with recurrent networks in mind, and the paper's
experiments are on RNNs.

Then the Transformer arrived in 2017 and used LayerNorm throughout. BERT used
it. GPT-2 and GPT-3 used it. For most of a decade, if you were building a
language model, LayerNorm was not a decision you thought about.

**2019: someone questions the mean.** LayerNorm does two things: it subtracts
the mean (**re-centering**) and it divides by the standard deviation
(**re-scaling**). The standard explanation for why LayerNorm helps credited
both. Biao Zhang and Rico Sennrich asked whether the first one was doing any
work.

Their motivation was cost. Normalization is not free, and its cost is paid
once per normalization layer, on every token, on every step, forever. Their
Figure 1 makes the point sharply: on a GRU-based translation model, when the
un-normalized baseline reaches a training loss of 7.0, LayerNorm has reached
5.4 after the same number of *steps* — but only 5.9 after the same amount of
*time*. Part of what LayerNorm wins per step, it gives back per second.

So they proposed removing the mean subtraction and keeping only the division,
now by the root mean square. They stated the hypothesis plainly:

> In this paper, we hypothesize that the re-scaling invariance is the reason
> for success of LayerNorm, rather than re-centering invariance.

Across machine translation, image classification, image-caption retrieval, and
question answering, RMSNorm matched LayerNorm's quality while reducing running
time by 7% to 64%.

**2019–2020: quiet adoption.** T5 used a simplified LayerNorm with no mean
subtraction and no bias — RMSNorm in all but name. The paper barely mentions
it.

**2023 onward: the new default.** LLaMA used RMSNorm, and the architecture it
popularized — pre-norm placement, RMSNorm, rotary position embeddings, SwiGLU
— became the template. Mistral, Qwen, Gemma, DeepSeek, Phi, and OLMo all use
RMSNorm. LayerNorm has not disappeared; it is still in the older models people
run every day, and in plenty of vision architectures. But for new large
language models, RMSNorm is now the default and LayerNorm is the exception.

The interesting part of this history is not that a faster method won. It is
that a widely repeated explanation for *why* LayerNorm worked turned out to be
half wrong, and nobody checked for three years.

## 2. The Arithmetic of an Absence

Both methods take a single token's hidden vector $x \in \mathbb{R}^d$ and
return a vector of the same shape. The only difference is which statistics
they use.

**LayerNorm** computes both the mean and the standard deviation across the $d$
entries,

$$
\mu = \frac{1}{d}\sum_{i=1}^{d} x_i, \qquad
\sigma = \sqrt{\frac{1}{d}\sum_{i=1}^{d}(x_i - \mu)^2},
$$

and then standardizes, rescales by a learned gain $g$, and shifts by a learned
bias $b$:

$$
\text{LayerNorm}(x)_i = g_i \cdot \frac{x_i - \mu}{\sigma} + b_i.
$$

**RMSNorm** computes one statistic, the root mean square,

$$
\text{RMS}(x) = \sqrt{\frac{1}{d}\sum_{i=1}^{d} x_i^2},
$$

and divides by it:

$$
\text{RMSNorm}(x)_i = g_i \cdot \frac{x_i}{\text{RMS}(x)}.
$$

That is the whole difference. No $\mu$, no subtraction, and in the original
formulation no bias either.

### Why RMS Stands In for $\sigma$

These two statistics are more closely related than they look. Expand the sum
of squares by adding and subtracting $\mu$:

$$
\frac{1}{d}\sum_i x_i^2
= \frac{1}{d}\sum_i (x_i - \mu + \mu)^2
= \underbrace{\frac{1}{d}\sum_i (x_i-\mu)^2}_{\sigma^2}
+ \underbrace{\frac{2\mu}{d}\sum_i (x_i - \mu)}_{= \, 0}
+ \; \mu^2 .
$$

The middle term vanishes because deviations from the mean sum to zero. So

$$
\text{RMS}(x)^2 = \sigma^2 + \mu^2 .
$$

This is the familiar identity that the mean square equals the variance plus
the squared mean, and it says something useful here. **The RMS is the standard
deviation plus whatever the mean contributes.** When $\mu = 0$ the two are
identical, and RMSNorm and LayerNorm compute exactly the same thing. The
original paper makes precisely this observation: "When the mean of summed
inputs is zero, RMSNorm is exactly equal to LayerNorm."

So the real question is not whether the two formulas look different. It is how
big $\mu$ is compared to $\sigma$ in practice.

### Exactly How Far Apart Are They?

We can answer that question with an identity rather than a guess.

Set the learned parameters aside for a moment ($g = 1$, $b = 0$) and notice
that each method returns a *positive scalar multiple* of a vector: LayerNorm
returns a multiple of $x - \mu\mathbf{1}$, and RMSNorm returns a multiple of
$x$. Scaling a vector does not change the direction it points, so the angle
between the two outputs is just the angle between $x - \mu\mathbf{1}$ and $x$.

Take the cosine of that angle. Two facts do all the work — that
$\sum_i x_i = d\mu$, and that $\|x - \mu\mathbf{1}\|^2 = \|x\|^2 - d\mu^2$:

$$
\cos\theta
= \frac{\langle x - \mu\mathbf{1},\, x\rangle}{\|x - \mu\mathbf{1}\|\,\|x\|}
= \frac{\|x\|^2 - d\mu^2}{\sqrt{\|x\|^2 - d\mu^2}\;\|x\|}
= \frac{\sqrt{\|x\|^2 - d\mu^2}}{\|x\|}
= \sqrt{1 - \frac{d\mu^2}{\|x\|^2}} .
$$

Now use $\|x\|^2 = d \cdot \text{RMS}(x)^2$ and the identity from above:

$$
\boxed{\;\cos\theta = \sqrt{1 - \frac{\mu^2}{\text{RMS}(x)^2}} = \frac{\sigma}{\text{RMS}(x)}\;}
$$

I find this satisfying. **The agreement between LayerNorm and RMSNorm is
exactly the ratio $\sigma / \text{RMS}$.** No approximation, no assumption
about the distribution of $x$. If the mean is small relative to the overall
scale, the two normalizers point in nearly the same direction, and the "nearly"
is quantified precisely.

### What Width Does to the Difference

Now add the one assumption that matters for real networks: $d$ is large.

Suppose the entries of $x$ are independent draws with mean zero and variance
one. The sample mean $\mu$ then has variance $1/d$, so $d\mu^2$ follows a
chi-square distribution with one degree of freedom, and $\|x\|^2 \approx d$.
Substituting into the identity and using $\sqrt{1-u} \approx 1 - u/2$ for
small $u$:

$$
1 - \cos\theta \;\approx\; \frac{d\mu^2}{2\|x\|^2} \;\approx\; \frac{\chi^2_1}{2d},
\qquad \text{so} \qquad
\mathbb{E}\!\left[1 - \cos\theta\right] \approx \frac{1}{2d}.
$$

**The disagreement between LayerNorm and RMSNorm shrinks in proportion to
$1/d$.** GPT-2 has $d = 768$, which puts the expected disagreement near
$1/1536 \approx 0.00065$. Llama 2 7B has $d = 4096$, giving about $0.00012$.
The mean that LayerNorm works to remove is, in a model of realistic width,
almost not there.

Section 5 puts this prediction to the test.

### The Property That Was Traded Away

The papers frame the comparison in terms of *invariance*: which changes to the
input leave the output untouched.

Both are invariant to **re-scaling**. Since $\text{RMS}(\alpha x) = \alpha\,
\text{RMS}(x)$ for $\alpha > 0$, the factor cancels:

$$
\text{RMSNorm}(\alpha x) = \frac{\alpha x}{\alpha \,\text{RMS}(x)} = \text{RMSNorm}(x).
$$

Only LayerNorm is invariant to **re-centering**. Add a constant $c$ to every
entry: the mean becomes $\mu + c$, each deviation $x_i - \mu$ is unchanged,
and $\sigma$ is unchanged, so $\text{LayerNorm}(x + c\mathbf{1}) =
\text{LayerNorm}(x)$ exactly. RMSNorm has no such property — it sees a
genuinely different vector.

This is the real trade, and it is worth stating without spin. RMSNorm is not a
free lunch or a strictly better method. It gives up a genuine mathematical
property. The claim of the paper — supported by experiments then, and by the
entire field since — is that this particular property was not the one carrying
the load.

## 3. Two Papers, Three Years, One Benchmark

The clearest way to see the argument is to put the two papers side by side.
They happen to run the same experiment: mean Recall@1 on the order-embedding
image retrieval task, plotted against training steps in units of 300. Three
years apart, on the same benchmark, with the same axes.

<div class='figure-pair'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/layernorm-2016-recall1.png'
                 alt='Mean Recall@1 versus iteration for order-embeddings with and without layer normalization. The LN curve rises faster and peaks higher.'>
            <div class='annot'>
                <span class='who'>2016 — the case for LayerNorm.</span>
                <b>Order-Embedding + LN</b> (blue) climbs faster and settles
                about a point higher than the un-normalized
                <b>Order-Embedding</b> (taupe). This is the gain that made
                LayerNorm standard.
            </div>
            <div class='source'>
                Figure 1(a), Ba, Kiros &amp; Hinton (2016), recoloured.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/rmsnorm-2019-recall1.png'
                 alt='Mean Recall@1 versus training steps for baseline, LayerNorm, RMSNorm and pRMSNorm. The LayerNorm, RMSNorm and pRMSNorm curves lie on top of one another, all above the baseline.'>
            <div class='annot'>
                <span class='who'>2019 — the case for RMSNorm.</span>
                <b>RMSNorm</b> (green) and <b>pRMSNorm</b> (rose) sit on top of
                <b>LayerNorm</b> (blue), all clearly above <b>Baseline</b>
                (taupe). Deleting the mean subtraction cost nothing.
            </div>
            <div class='source'>
                Figure 2(a), Zhang &amp; Sennrich (2019), recoloured.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 2.</span>
        The same benchmark, three years apart. The left panel is the argument
        that normalizing helps: the gap between blue and green is what
        LayerNorm bought. The right panel is the argument that <i>re-centering
        is not what helped</i>: the gap that matters is again the one above the
        baseline, and RMSNorm captures all of it while computing one statistic
        instead of two. The curves to compare are not the fastest and the
        slowest — they are the ones lying on top of each other.
    </div>
</div>

Read the right panel carefully. The finding is not that RMSNorm wins. The
finding is that RMSNorm *ties*, and a tie is the entire point: if two methods
reach the same quality and one of them does less work, the one that does less
work should be preferred.

## 4. The Ledger: What Is Kept, What Is Lost

|  | LayerNorm | RMSNorm |
|---|---|---|
| Statistics computed | mean and variance | root mean square |
| Learned parameters | gain and bias, $2d$ | gain, $d$ |
| Invariant to re-scaling | yes | yes |
| Invariant to re-centering | yes | **no** |
| Equal to the other when | — | $\mu = 0$ |
| Agreement with the other | $\sigma/\text{RMS}$ | $\sigma/\text{RMS}$ |
| Typical era | Transformer, BERT, GPT-2, GPT-3 | T5, LLaMA, Mistral, Qwen, Gemma, DeepSeek |

A few points worth carrying away.

**The savings are real but modest, and that is fine.** The 7%–64% range comes
from the 2019 paper's models, several of which were RNNs where normalization
is a large share of the work. In a modern transformer the normalization layers
are a small fraction of total arithmetic, and fused kernels have narrowed the
gap further. The honest summary is that RMSNorm is somewhat cheaper, slightly
smaller, and *no worse* — and "no worse but simpler" is enough to win a
default.

**Small per-token costs multiply at scale.** A 70B-parameter model has on the
order of 80 layers with two normalization sites each, applied to every token
of every sequence, across trillions of training tokens and then across the
entire deployed lifetime of the model. Anything on that path is worth
simplifying.

**Simplicity compounds beyond speed.** One statistic instead of two means one
reduction pass over the activation, which matters because these layers are
limited by memory bandwidth rather than arithmetic. Dropping the bias removes
parameters. Fewer moving parts make the kernel easier to fuse and the
numerics easier to reason about in low precision. None of these is dramatic
alone.

**The methodological lesson is the durable one.** The field had a story about
why LayerNorm worked, and the story named two mechanisms. Someone tested them
separately and found that one was carrying the weight. Removing a component
and showing that nothing breaks is a real contribution, and it is rarer than
it should be — partly because a paper reporting a tie is harder to publish
than one reporting a win.

## 5. Watching the Gap Close

The derivation in section 2 makes two falsifiable predictions. Simulating them
takes very little code, because both normalizers are two lines:

```python
def layernorm(x):
    return (x - x.mean(-1, keepdims=True)) / x.std(-1, keepdims=True)

def rmsnorm(x):
    return x / np.sqrt((x ** 2).mean(-1, keepdims=True))
```

The first prediction is that the disagreement between them, measured as one
minus the cosine similarity of their outputs, should average $1/2d$. The
second is that adding a constant $c$ to every coordinate should leave
LayerNorm's output *exactly* unchanged, while rotating RMSNorm's output away
by a factor of $1/\sqrt{1+c^2}$.[^shift]

<div class='figure'>
    <img src='/images/rmsnorm-vs-layernorm.png'
         alt='Two panels. Left: log-log plot of disagreement between LayerNorm and RMSNorm against width d, following a 1/2d line. Right: cosine similarity to the unshifted output against shift c, with LayerNorm flat at 1 and RMSNorm decaying.'>
    <div class='caption'>
        <span class='caption-label'>Figure 3.</span>
        Gaussian inputs, 4,000 draws per point. <b>(a)</b> The two normalizers
        disagree less and less as the model gets wider, and the simulated mean
        lands on the predicted $1/2d$ line. At GPT-2's width the disagreement
        is about $7\times10^{-4}$; at Llama 2 7B's width, about
        $1\times10^{-4}$. <b>(b)</b> The property RMSNorm gives up. Shifting
        every coordinate by $c$ leaves LayerNorm's output identical, while
        RMSNorm's rotates away exactly as $1/\sqrt{1+c^2}$.
    </div>
</div>

Both predictions hold. In panel (a) the dashed theory line is not fitted to
anything — it is $1/2d$, and the simulated mean sits on it across four orders
of magnitude. At $d = 768$ the measured disagreement is $6.53\times10^{-4}$
against a predicted $6.51\times10^{-4}$.

Panel (a) is the case for RMSNorm and panel (b) is the case against it, and
both are worth holding at once. At realistic widths the two methods are doing
nearly the same thing, which is why the swap is safe. But they are not
identical, and if a model's activations ever developed a large shared offset
across the feature dimension, the two would diverge exactly as panel (b) shows.
The empirical claim underneath every modern LLM is that this does not happen
enough to matter.

## 6. Recap

- LayerNorm normalizes each token across its own features, using the mean and
  the standard deviation. RMSNorm drops the mean and divides by the root mean
  square.
- The two are related by $\text{RMS}^2 = \sigma^2 + \mu^2$, so they coincide
  exactly when the mean is zero.
- Their agreement is not approximate hand-waving. It is exactly
  $\cos\theta = \sigma/\text{RMS}$, and for a $d$-dimensional vector with
  roughly independent entries the disagreement averages $1/2d$ — negligible at
  the widths real models use.
- What RMSNorm gives up is invariance to a constant shift of every feature.
  This is a genuine loss, and the empirical finding of the last seven years is
  that it does not matter.
- RMSNorm is cheaper, has half the learned parameters, and matches quality.
  That combination made it the default for essentially every large language
  model since 2023.
- The transferable lesson: when a method works, find out *which part* of it
  works. A result that removes something and changes nothing is worth as much
  as one that adds something.

## 7. The Paper Trail

1. Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer Normalization.
   [arXiv:1607.06450](https://arxiv.org/abs/1607.06450).
2. Zhang, B., & Sennrich, R. (2019). Root Mean Square Layer Normalization.
   *Advances in Neural Information Processing Systems 32*.
   [arXiv:1910.07467](https://arxiv.org/abs/1910.07467). Code:
   [github.com/bzhangGo/rmsnorm](https://github.com/bzhangGo/rmsnorm).
3. Ioffe, S., & Szegedy, C. (2015). Batch Normalization: Accelerating Deep
   Network Training by Reducing Internal Covariate Shift.
   [arXiv:1502.03167](https://arxiv.org/abs/1502.03167).
4. Vaswani, A., et al. (2017). Attention Is All You Need.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762).
5. Santurkar, S., Tsipras, D., Ilyas, A., & Madry, A. (2018). How Does Batch
   Normalization Help Optimization?
   [arXiv:1805.11604](https://arxiv.org/abs/1805.11604).
6. Raffel, C., et al. (2020). Exploring the Limits of Transfer Learning with a
   Unified Text-to-Text Transformer (T5).
   [arXiv:1910.10683](https://arxiv.org/abs/1910.10683).
7. Xiong, R., et al. (2020). On Layer Normalization in the Transformer
   Architecture. [arXiv:2002.04745](https://arxiv.org/abs/2002.04745).
8. Touvron, H., et al. (2023). LLaMA: Open and Efficient Foundation Language
   Models. [arXiv:2302.13971](https://arxiv.org/abs/2302.13971).

[^shift]: Both results in panel (b) are exact rather than empirical. Because
    normalizing only rescales, the cosine between RMSNorm's shifted and
    unshifted outputs equals the cosine between $x + c\mathbf{1}$ and $x$,
    which for a zero-mean $x$ with $\|x\|^2 \approx d$ works out to
    $1/\sqrt{1+c^2}$. The figure's code is in `figures/norm_comparison.py`.
