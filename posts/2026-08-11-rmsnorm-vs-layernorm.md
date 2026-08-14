---
title: RMSNorm vs. LayerNorm
subtitle: Modern language models deleted one step from the operation that normalizes them, and the deleted step turns out to have been doing almost nothing.
date: 2026-08-11
tags: llm
icon: 🍵
length: long
---

I want to tell you about a change that almost every large language model has
made, and that is easy to miss, because it consists of deleting one line of
arithmetic.

Somewhere inside a transformer there is an operation that runs on every word,
in every layer, and does nothing more dramatic than rescale a list of numbers
so that they are neither too large nor too small. For seven years that
operation was **layer normalization**. Today it is **root mean square layer
normalization**, which is layer normalization with one step taken out. Nothing
else about the models changed.

I think this is worth a whole post for two reasons. The first is that the
deleted step turns out to have been doing very nearly nothing, and I can tell
you *exactly* how nearly: there is a clean formula for how far the two
operations disagree, and it shrinks as models get wider. The second is that
the paper making the case is one of the more honest I have read, and the
figure carrying its argument does not contain the proposed method at all.

I am going to assume you know nothing at all about how a language model works
on the inside, so we will start with where this thing sits.

[TOC]

## Two Small Rooms in Every Layer

A transformer is a stack of identical layers. GPT-2 has twelve of them; Llama
3 70B has eighty. Each layer does two things to the sentence in turn. First it
runs **attention**, which lets every word look at the other words and take
something from them. Then it runs a **feed-forward block**, which is a small
network applied to each word on its own. Around each of those two operations
there is a **residual connection**, which means that whatever comes out is
added back onto whatever went in — the layer edits the representation rather
than replacing it.

Normalization lives at those two joints. Twice per layer, in every layer, each
word's vector of numbers is handed to a normalizer, which rescales it and
passes it on. In a seven-billion-parameter model that is sixty-four of these
operations between the text arriving and a word coming out, and the whole of
this post takes place inside one of them.

<div class='figure-pair tall'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/transformer-postln-block.png'
                 alt='Block diagram of a Post-LN transformer layer. Input flows through multi-head attention, then addition, then Layer Norm, then FFN, then addition, then Layer Norm.'>
            <div class='annot'>
                <span class='who'>(a) Post-norm, the 2017 arrangement.</span>
                The green boxes sit on the main path, <i>after</i> each
                residual addition. This is the original Transformer, and
                BERT.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/transformer-preln-block.png'
                 alt='Block diagram of a Pre-LN transformer layer. Input branches to Layer Norm, then multi-head attention, then addition; then branches to Layer Norm, then FFN, then addition.'>
            <div class='annot'>
                <span class='who'>(b) Pre-norm, the modern arrangement.</span>
                The green boxes moved <i>inside</i> the residual branch, before
                each sub-layer, leaving the main path clear. GPT-2 and
                GPT-3 already did this with LayerNorm; LLaMA, Mistral, Qwen,
                and Gemma do it with RMSNorm in those boxes.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        Two normalization sites per layer, in green — everything here happens
        inside a green box. They read "Layer Norm" because the diagram
        predates the switch; a current model has RMSNorm in the same
        positions. Moving from (a) to (b) is a <i>separate</i> change, about
        gradients rather than cost.
        <br>
        Reproduced figures throughout this post are recoloured to the
        palette used here, so that LayerNorm is always blue, RMSNorm always
        green, and an un-normalized baseline always plum. Only hue is
        changed; no data is altered.
        <br>
        Figure 1, Xiong et al. (2020), split into its two panels and
        recoloured.
    </div>
</div>

## 1. Seven Years of Subtracting a Ghost

The history here is short, and it is entirely a history of prices. Each method
below exists because the one before it was charging something its users had
grown tired of paying, and the labels above the arrows are what was being
charged.

<div class='roadmap'>
    <svg viewBox='0 0 760 384' role='img' aria-label='Roadmap of normalization: BatchNorm 2015, LayerNorm 2016, RMSNorm 2019, the default from 2023. Each step is forced by a cost of the one before it.'>
      <path class='spine' d='M99.4,191.5 Q379.9,192.3 660.4,191.3'/>
      <path class='head' d='M180.5,191.9 Q193.3,191.4 206.0,191.7'/>
      <path class='head' d='M179.8,191.8 Q193.2,191.9 206.5,191.8'/>
      <path class='head' d='M206.5,192.6 Q203.9,194.0 201.1,195.2'/>
      <path class='head' d='M206.2,191.4 Q203.2,190.2 200.2,189.2'/>
      <text class='why' x='193.0' y='163.0'>statistics depend on</text>
      <text class='why' x='193.0' y='181.0'>the batch</text>
      <path class='head' d='M366.7,192.2 Q379.8,192.5 393.0,192.5'/>
      <path class='head' d='M367.0,191.8 Q379.8,192.2 392.6,192.5'/>
      <path class='head' d='M392.5,192.3 Q390.2,193.8 387.5,194.6'/>
      <path class='head' d='M392.4,191.8 Q389.9,190.9 387.7,189.5'/>
      <text class='why' x='380.0' y='163.0'>is the mean doing any</text>
      <text class='why' x='380.0' y='181.0'>work?</text>
      <path class='head' d='M554.2,191.9 Q567.1,191.4 580.0,191.5'/>
      <path class='head' d='M554.6,191.4 Q567.4,191.0 580.2,191.8'/>
      <path class='head' d='M580.3,191.7 Q578.0,193.2 575.5,194.5'/>
      <path class='head' d='M579.3,191.5 Q577.1,190.9 575.4,189.5'/>
      <text class='why' x='567.0' y='163.0'>same quality, less</text>
      <text class='why' x='567.0' y='181.0'>time</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M99.2,136.7 Q100.2,164.4 100.1,192.2'/>
        <circle class='dot' cx='99.5' cy='192.0' r='5'/>
        <path class='box' d='M24.7,-0.6 Q193.0,-1.0 361.3,-0.6 Q370.3,-0.6 370.3,8.4 Q369.8,67.5 370.3,126.5 Q370.3,135.5 361.3,135.5 Q193.0,136.2 24.7,135.5 Q15.7,135.5 15.7,126.5 Q16.0,67.5 15.7,8.4 Q15.7,-0.6 24.7,-0.6'/>
        <path class='box' d='M23.6,-0.3 Q192.4,-0.1 361.1,-0.3 Q370.1,-0.3 370.1,8.7 Q369.8,68.2 370.1,127.8 Q370.1,136.8 361.1,136.8 Q192.4,136.6 23.6,136.8 Q14.6,136.8 14.6,127.8 Q14.1,68.2 14.6,8.7 Q14.6,-0.3 23.6,-0.3'/>
        <text class='yr' x='29.0' y='21.0'>2015</text>
        <text class='stage' x='29.0' y='45.0'>BatchNorm</text>
        <circle class='bul' cx='33.0' cy='63.0' r='2'/>
        <text class='body' x='42.0' y='67.0'>standardize each feature across the</text>
        <text class='body' x='42.0' y='86.5'>mini-batch</text>
        <circle class='bul' cx='33.0' cy='102.0' r='2'/>
        <text class='body' x='42.0' y='106.0'>deep networks become trainable</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='248.0' width='356.0' height='136.0'/>
        <path class='stem' d='M286.4,248.4 Q287.1,220.1 287.0,191.8'/>
        <circle class='dot' cx='286.5' cy='192.0' r='5'/>
        <path class='box' d='M23.3,248.1 Q192.3,248.4 361.3,248.1 Q370.3,248.1 370.3,257.1 Q371.0,316.2 370.3,375.2 Q370.3,384.2 361.3,384.2 Q192.3,384.8 23.3,384.2 Q14.3,384.2 14.3,375.2 Q14.2,316.2 14.3,257.1 Q14.3,248.1 23.3,248.1'/>
        <path class='box' d='M24.2,248.2 Q192.9,248.0 361.6,248.2 Q370.6,248.2 370.6,257.2 Q370.6,316.1 370.6,375.0 Q370.6,384.0 361.6,384.0 Q192.9,384.9 24.2,384.0 Q15.2,384.0 15.2,375.0 Q15.2,316.1 15.2,257.2 Q15.2,248.2 24.2,248.2'/>
        <text class='yr' x='29.0' y='269.0'>2016</text>
        <text class='stage' x='29.0' y='293.0'>LayerNorm</text>
        <circle class='bul' cx='33.0' cy='311.0' r='2'/>
        <text class='body' x='42.0' y='315.0'>normalize each example across its own</text>
        <text class='body' x='42.0' y='334.5'>features</text>
        <circle class='bul' cx='33.0' cy='350.0' r='2'/>
        <text class='body' x='42.0' y='354.0'>no batch dependence, no train/test gap</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='136.0'/>
        <path class='stem' d='M473.9,136.5 Q473.2,164.0 472.8,191.4'/>
        <circle class='dot' cx='473.5' cy='192.0' r='5'/>
        <path class='box' d='M397.4,-0.0 Q567.0,0.1 736.6,-0.0 Q745.6,-0.0 745.6,9.0 Q746.5,67.9 745.6,126.8 Q745.6,135.8 736.6,135.8 Q567.0,136.0 397.4,135.8 Q388.4,135.8 388.4,126.8 Q387.8,67.9 388.4,9.0 Q388.4,-0.0 397.4,-0.0'/>
        <path class='box' d='M397.8,-0.3 Q567.1,0.2 736.5,-0.3 Q745.5,-0.3 745.5,8.7 Q745.8,67.9 745.5,127.0 Q745.5,136.0 736.5,136.0 Q567.1,135.9 397.8,136.0 Q388.8,136.0 388.8,127.0 Q389.2,67.9 388.8,8.7 Q388.8,-0.3 397.8,-0.3'/>
        <text class='yr' x='403.0' y='21.0'>2019</text>
        <text class='stage' x='403.0' y='45.0'>RMSNorm</text>
        <circle class='bul' cx='407.0' cy='63.0' r='2'/>
        <text class='body' x='416.0' y='67.0'>Zhang and Sennrich drop the mean</text>
        <text class='body' x='416.0' y='86.5'>subtraction</text>
        <circle class='bul' cx='407.0' cy='102.0' r='2'/>
        <text class='body' x='416.0' y='106.0'>only the division survives</text>
        <circle class='bul' cx='407.0' cy='121.5' r='2'/>
        <text class='body' x='416.0' y='125.5'>7 to 64% less running time</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='248.0' width='356.0' height='136.0'/>
        <path class='stem' d='M660.3,247.4 Q660.1,219.9 659.8,192.4'/>
        <circle class='dot' cx='660.5' cy='192.0' r='5'/>
        <path class='box' d='M397.8,247.6 Q566.8,248.1 735.8,247.6 Q744.8,247.6 744.8,256.6 Q744.2,315.9 744.8,375.3 Q744.8,384.3 735.8,384.3 Q566.8,384.8 397.8,384.3 Q388.8,384.3 388.8,375.3 Q387.9,315.9 388.8,256.6 Q388.8,247.6 397.8,247.6'/>
        <path class='box' d='M398.1,248.6 Q567.4,247.7 736.7,248.6 Q745.7,248.6 745.7,257.6 Q744.8,316.6 745.7,375.6 Q745.7,384.6 736.7,384.6 Q567.4,385.3 398.1,384.6 Q389.1,384.6 389.1,375.6 Q389.3,316.6 389.1,257.6 Q389.1,248.6 398.1,248.6'/>
        <text class='yr' x='403.0' y='269.0'>2023-</text>
        <text class='stage' x='403.0' y='293.0'>the default</text>
        <circle class='bul' cx='407.0' cy='311.0' r='2'/>
        <text class='body' x='416.0' y='315.0'>LLaMA ships it; Mistral, Qwen, Gemma</text>
        <text class='body' x='416.0' y='334.5'>follow</text>
        <circle class='bul' cx='407.0' cy='350.0' r='2'/>
        <text class='body' x='416.0' y='354.0'>LayerNorm becomes the exception</text>
      </g>
    </svg>
</div>

I would stop on the third box, because the motivation there was **cost, not
quality**, and Zhang and Sennrich were unusually direct about what they
believed was actually doing the work:

> In this paper, we hypothesize that the re-scaling invariance is the reason
> for success of LayerNorm, rather than re-centering invariance.

That sentence is a claim about somebody else's method. LayerNorm had been
standard for three years by then, and the accepted account of why it worked
had two parts to it. This paper says that one of the two parts is not the
reason, removes it, and shows that nothing breaks.

What I find striking is not that a cheaper method won. It is that the standard
explanation for the expensive method was half wrong, in print, for three
years, and that it took somebody trying to make it *faster* to notice. That is
worth remembering as a general shape: an optimization is sometimes the only
thing that ever tests an explanation, because it is the only work that has a
reason to ask which part is load-bearing.

## 2. The Size of Things, and Why It Runs Away

Before we can compare two normalizers I owe you an account of what either of
them is for, because "rescale the numbers" is not a reason on its own.

A word arriving at the model is turned into a **vector**: a list of numbers,
all of which the model learned. GPT-2 uses lists of 768 numbers, Llama 2 7B
uses 4096. Nothing about any single entry means anything you could name; what
carries meaning is the whole list, and the model's job is to keep editing that
list until it is a good enough description of the word in its context to
predict what comes next.

The editing is where the trouble starts. Because of those residual
connections, every layer *adds* to the list rather than replacing it, and
sixty-four rounds of addition is a lot of opportunity for the numbers to grow.
If they grow, the next layer receives inputs it was never trained to handle;
the exponentials inside attention saturate, so a word puts essentially all its
attention on one other word and there is no gradient left to learn from; and
in the sixteen-bit arithmetic these models actually run in, large enough
numbers stop being representable at all. If instead they shrink, the signal
fades and the layer has nothing to work with. Neither failure announces
itself. Both simply produce a model that will not train.

A normalizer is the fix, and it is blunt. Take the token's list, measure how
big it is, and divide by that measurement. Whatever came in, what leaves has a
known size, so the next layer always receives its input on the same footing.
Because dividing everything by one number also throws away a degree of freedom
the model might want, each normalizer carries a small set of learned weights —
one per entry, written $g$ — that it multiplies back in afterwards. The model
can therefore restore any scale it turns out to need. What it cannot do is
drift.

I should say plainly that nobody in this story is arguing about whether to
normalize. Section 4 has the measurement of what happens without it, and it is
not close. The entire argument is about *how you measure how big a list is* —
and there are two obvious answers to that, which differ by one step.

## 3. The Arithmetic of an Absence

Both normalizers take a token's hidden vector $x \in \mathbb{R}^d$ and hand
back one of the same shape, and both are two lines of arithmetic. **LayerNorm**
computes two statistics across the $d$ entries — their average, and how far
they typically sit from it:

$$
\mu = \frac{1}{d}\sum_i x_i, \quad
\sigma = \sqrt{\frac{1}{d}\sum_i (x_i - \mu)^2}, \quad
\text{LayerNorm}(x)_i = g_i \frac{x_i - \mu}{\sigma} + b_i .
$$

**RMSNorm** computes one, and divides:

$$
\text{RMS}(x) = \sqrt{\frac{1}{d}\sum_i x_i^2}, \qquad
\text{RMSNorm}(x)_i = g_i \frac{x_i}{\text{RMS}(x)} .
$$

That is the whole difference. LayerNorm centres the numbers first — it works
out their average, subtracts it from every entry, and only then divides by
their spread. RMSNorm skips the centring: it divides by the size of the list
as it stands. No $\mu$, no subtraction, and in the original proposal no bias
$b$ either.

It is worth being clear about why anyone cared, because one subtraction does
not sound like an expense. It is not the arithmetic. Computing $\mu$ means
reading all $d$ entries and adding them up before anything else can begin, and
only then can the second pass over the same entries start. On the hardware
these models run on, that serial dependency is worth more than the additions
it contains, and it happens sixty-four times per token per layer stack. The
question is whether the answer changes.

<div class='pipe-anim'>
    <div class='panels'>
        <div class='panel'>
            <svg viewBox='0 0 256 168' role='img'
                 aria-label='LayerNorm applied to eight activations: the bars first slide down until their mean sits on zero, then shrink until their spread is one.'>
                <text class='rowlabel' x='6' y='14'>LAYERNORM</text>
                <line class='zero' x1='6' y1='104' x2='250' y2='104'/>
                <g transform='translate(0 104)'>
                    <g class='ln-shift'>
                        <g class='ln-scale'>
                            <rect class='barpos' x='14.0' y='-52.8' width='20' height='52.8' rx='2'/>
                    <rect class='barpos' x='44.0' y='0.0' width='20' height='13.2' rx='2'/>
                    <rect class='barpos' x='74.0' y='-39.6' width='20' height='39.6' rx='2'/>
                    <rect class='barpos' x='104.0' y='-70.4' width='20' height='70.4' rx='2'/>
                    <rect class='barpos' x='134.0' y='-8.8' width='20' height='8.8' rx='2'/>
                    <rect class='barpos' x='164.0' y='0.0' width='20' height='26.4' rx='2'/>
                    <rect class='barpos' x='194.0' y='-44.0' width='20' height='44.0' rx='2'/>
                    <rect class='barpos' x='224.0' y='-22.0' width='20' height='22.0' rx='2'/>
                        </g>
                    </g>
                </g>
                <line class='meanline ln-meanline' x1='6' x2='250'/>
                <text class='cap' x='6' y='160'>subtract &#956;, then divide by &#963;</text>
            </svg>
        </div>
        <div class='panel'>
            <svg viewBox='0 0 256 168' role='img'
                 aria-label='RMSNorm applied to the same eight activations: the bars only shrink. They never slide, so their mean stays where it was.'>
                <text class='rowlabel' x='6' y='14'>RMSNORM</text>
                <line class='zero' x1='6' y1='104' x2='250' y2='104'/>
                <g transform='translate(0 104)'>
                    <g class='rms-scale'>
                        <rect class='barpos' x='14.0' y='-52.8' width='20' height='52.8' rx='2'/>
                    <rect class='barpos' x='44.0' y='0.0' width='20' height='13.2' rx='2'/>
                    <rect class='barpos' x='74.0' y='-39.6' width='20' height='39.6' rx='2'/>
                    <rect class='barpos' x='104.0' y='-70.4' width='20' height='70.4' rx='2'/>
                    <rect class='barpos' x='134.0' y='-8.8' width='20' height='8.8' rx='2'/>
                    <rect class='barpos' x='164.0' y='0.0' width='20' height='26.4' rx='2'/>
                    <rect class='barpos' x='194.0' y='-44.0' width='20' height='44.0' rx='2'/>
                    <rect class='barpos' x='224.0' y='-22.0' width='20' height='22.0' rx='2'/>
                    </g>
                </g>
                <line class='meanline rms-meanline' x1='6' x2='250'/>
                <text class='cap' x='6' y='160'>divide by RMS &#8212; and that is all</text>
            </svg>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 2.</span>
        The same eight activations through both normalizers, on a loop. Watch
        the dashed mean line: LayerNorm drags it to zero before scaling,
        RMSNorm leaves it where it was. That missing step is the whole
        difference.
    </div>
</div>

### Why RMS stands in for $\sigma$

The two measurements are closer than they look, and once you have seen the
relationship between them everything else in this post follows from it. Expand
the sum of squares around the mean:

$$
\frac{1}{d}\sum_i x_i^2
= \underbrace{\frac{1}{d}\sum_i (x_i-\mu)^2}_{\sigma^2}
+ \underbrace{\frac{2\mu}{d}\sum_i (x_i - \mu)}_{= \, 0}
+ \; \mu^2 ,
\qquad\text{so}\qquad \text{RMS}^2 = \sigma^2 + \mu^2 .
$$

The middle term disappears because deviations from a mean sum to zero, by the
definition of the mean. What is left says that **the RMS is the standard
deviation plus whatever the mean contributes**, combined the way the sides of
a right-angled triangle combine. So the two normalizers are measuring the same
thing plus a correction, and the whole question — the entire question, for the
rest of this post — is how big $\mu$ is next to $\sigma$.

If that is Pythagoras, it should be drawable, and it is.

<div class='knob'>
    <svg viewBox='0 0 720 300' id='geo-svg' role='img'
         aria-label='A rotatable three-dimensional view. A vector is split into a component along the all-ones diagonal and a component lying in the plane where the coordinates sum to zero. The two components meet at a right angle.'>
        <g id='geo-scene'></g>
    </svg>
    <div class='controls'>
        <label for='geo-mu'>mean &#956;</label>
        <input type='range' id='geo-mu' min='0' max='250' value='90'>
        <span class='readout' id='geo-mu-out'></span>
    </div>
    <div class='controls'>
        <label for='geo-rot'>rotate the view</label>
        <input type='range' id='geo-rot' min='0' max='360' value='38'>
        <span class='readout' id='geo-rot-out'></span>
    </div>
    <p class='note' id='geo-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 3.</span>
    The identity, in three dimensions.
    <span style='color:#C48BAC'><b>&#956;&#8901;1</b></span> runs along the
    all-ones diagonal and
    <span style='color:#3E6491'><b>x &#8722; &#956;&#8901;1</b></span> lies in
    the plane where coordinates sum to zero. They meet at a right angle, so
    $\text{RMS}^2 = \sigma^2 + \mu^2$ is Pythagoras. Drag $\mu$; spin the
    view to see the plane edge-on.
</div>
<script>
(function () {
  var svg = document.getElementById('geo-svg'),
      scene = document.getElementById('geo-scene'),
      muR = document.getElementById('geo-mu'),
      rotR = document.getElementById('geo-rot'),
      muOut = document.getElementById('geo-mu-out'),
      rotOut = document.getElementById('geo-rot-out'),
      note = document.getElementById('geo-note');
  var CX = 360, CY = 168, S = 46, ELEV = 0.42, SQ = Math.sqrt(1.5);

  function proj(p, a) {
    var x = p[0] * Math.cos(a) - p[1] * Math.sin(a);
    var t = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    return [CX + x * S, CY - (p[2] * Math.cos(ELEV) - t * Math.sin(ELEV)) * S];
  }
  function line(p, q, cls, extra) {
    return "<line class='" + cls + "' x1='" + p[0].toFixed(1) + "' y1='" +
      p[1].toFixed(1) + "' x2='" + q[0].toFixed(1) + "' y2='" + q[1].toFixed(1) +
      "' " + (extra || '') + "/>";
  }
  function draw() {
    var mu = +muR.value / 100, a = +rotR.value * Math.PI / 180;
    // sigma is fixed at 1, so x = mu*(1,1,1) + sqrt(3)*u with u a unit vector
    // lying in the sum-to-zero plane. Then |x|^2 = 3(sigma^2 + mu^2).
    var dev = [SQ, -SQ, 0];                       // sqrt(3) * (1,-1,0)/sqrt(2)
    var mean = [mu, mu, mu];
    var x = [mean[0] + dev[0], mean[1] + dev[1], mean[2] + dev[2]];
    var rms = Math.sqrt(1 + mu * mu), cos = 1 / rms;
    var deg = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;

    var O = proj([0, 0, 0], a), s = '';
    // the sum-to-zero plane, as a quad spanned by two in-plane directions
    var u1 = [1 / Math.SQRT2, -1 / Math.SQRT2, 0],
        u2 = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)], R = 2.5;
    var quad = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(function (c) {
      return proj([R * (c[0] * u1[0] + c[1] * u2[0]),
                   R * (c[0] * u1[1] + c[1] * u2[1]),
                   R * (c[0] * u1[2] + c[1] * u2[2])], a);
    });
    s += "<polygon class='face' points='" +
         quad.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + "'/>";
    // the all-ones diagonal, extended both ways
    s += line(proj([-1.2, -1.2, -1.2], a), proj([2.9, 2.9, 2.9], a), 'edge');
    // the two components and their sum
    var Pm = proj(mean, a), Px = proj(x, a);
    s += line(O, Pm, 'vec', "stroke='#C48BAC'");
    s += line(Pm, Px, 'vec', "stroke='#3E6491'");
    s += line(O, Px, 'vec', "stroke='#8C77BC'");
    s += line(O, proj(dev, a), 'ghost', "stroke='#3E6491'");
    [[O, '#3F3F3F'], [Pm, '#C48BAC'], [Px, '#8C77BC']].forEach(function (n) {
      s += "<circle class='node' cx='" + n[0][0].toFixed(1) + "' cy='" +
           n[0][1].toFixed(1) + "' r='3.6' fill='" + n[1] + "'/>";
    });
    scene.innerHTML = s;
    muOut.textContent = '\u03bc = ' + mu.toFixed(2);
    rotOut.textContent = rotR.value + '\u00b0';
    note.textContent = 'sigma = 1.00, mu = ' + mu.toFixed(2) + ', so RMS = ' +
      rms.toFixed(3) + '. The two normalizers point ' + deg.toFixed(1) +
      '\u00b0 apart, because cos = sigma / RMS = ' + cos.toFixed(3) + '.';
  }
  muR.addEventListener('input', draw);
  rotR.addEventListener('input', draw);
  draw();
})();
</script>

### Exactly how far apart are they

Knowing the two measurements are related is not the same as knowing how much
the two *outputs* differ, so let me do that properly, because the answer is
exact and I have never seen it stated in a way that felt like a real bound.

Set $g = 1$, $b = 0$. Each method returns a positive multiple of a vector —
LayerNorm of $x - \mu\mathbf{1}$, RMSNorm of $x$ — and scale is irrelevant to
both, so the entire disagreement is the angle $\theta$ between those
directions. Using $\|x - \mu\mathbf{1}\|^2 = \|x\|^2 - d\mu^2$:

$$
\cos\theta = \frac{\langle x - \mu\mathbf{1},\, x\rangle}{\|x - \mu\mathbf{1}\|\,\|x\|}
= \frac{\sqrt{\|x\|^2 - d\mu^2}}{\|x\|}
= \sqrt{1 - \frac{\mu^2}{\text{RMS}(x)^2}} = \frac{\sigma}{\text{RMS}(x)} .
$$

**The agreement between the two normalizers is exactly $\sigma/\text{RMS}$.**
There is no approximation in that line and no assumption about how the entries
of $x$ are distributed. It is true of every vector. If the mean is zero the two
outputs are identical; the further the mean is from zero relative to the
spread, the further apart they point.

Now bring in the one fact about real networks that makes this a small number.
The vectors are wide. If the $d$ entries are independent with mean zero and
variance one — which is what initialization arranges for and what training
roughly maintains — then $\mu$ is an average of $d$ such things and has
variance $1/d$. Expanding the square root gives

$$
\mathbb{E}\!\left[1 - \cos\theta\right] \approx \frac{1}{2d} .
$$

**The disagreement shrinks like $1/d$.** At GPT-2's width of 768 that is about
$0.00065$; at Llama 2 7B's width of 4096 it is about $0.00012$. Those are not
"small differences in the loss" or "differences within noise". They are how
far the two outputs are from being the same vector, and they get smaller every
time the field builds a wider model. Section 5 measures it rather than taking
my word for it.

### The invariance left behind

I do not want to leave you thinking that nothing was given up, because
something was, and it is the honest half of the story.

Both normalizers are invariant to **re-scaling**, since
$\text{RMS}(\alpha x) = \alpha\,\text{RMS}(x)$ cancels. Only LayerNorm is
invariant to **re-centering**: add $c$ to every entry and each deviation
$x_i - \mu$ is unchanged, so its output is identical. RMSNorm sees a different
vector.

So here is the trade, stated without spin. RMSNorm gives up a real
mathematical property. Feed it a vector and feed it that same vector with a
constant added to every entry, and it will hand back two different answers,
where LayerNorm would hand back the same one twice. The claim — supported at
the time by experiments, and since by every large model that has been trained
this way — is that this property was never the one carrying the load. It is a
bet, not a theorem, and the widget below is the bet drawn to scale.

<div class='knob'>
    <svg viewBox='0 0 720 250' id='inv-svg' role='img'
         aria-label='Three rows of bars: the input after a scale and a shift, then the LayerNorm output, then the RMSNorm output. The LayerNorm row never changes; the RMSNorm row changes as soon as a shift is applied.'>
        <g id='inv-scene'></g>
    </svg>
    <div class='controls'>
        <label for='inv-a'>re-scale &#945;</label>
        <input type='range' id='inv-a' min='25' max='300' value='100'>
        <span class='readout' id='inv-a-out'></span>
    </div>
    <div class='controls'>
        <label for='inv-c'>re-centre &#8212; add $c$ to every entry</label>
        <input type='range' id='inv-c' min='-200' max='200' value='0'>
        <span class='readout' id='inv-c-out'></span>
    </div>
    <p class='note' id='inv-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 4.</span>
    The two invariances. Move $\alpha$ and nothing happens to either
    output. Move $c$ and the
    <span style='color:#3E6491'><b>LayerNorm</b></span> row stays frozen while
    the <span style='color:#8C77BC'><b>RMSNorm</b></span> row walks away from
    its dashed start — the property RMSNorm sells, drawn to scale. The readout
    is $1/\sqrt{1+(c/\alpha)^2}$, since $\alpha$ divides out of RMSNorm
    entirely.
</div>
<script>
(function () {
  var scene = document.getElementById('inv-scene'),
      aR = document.getElementById('inv-a'), cR = document.getElementById('inv-c'),
      aOut = document.getElementById('inv-a-out'), cOut = document.getElementById('inv-c-out'),
      note = document.getElementById('inv-note');
  // Zero mean and unit RMS, so the closed form 1/sqrt(1+c^2) applies exactly.
  var X = [1.0425, -0.3475, 0.7818, 1.5637, 0.1737, -0.7818, -0.9556, -1.4769];
  var W = 46, X0 = 150, UNIT = 17;
  var ROWS = [['input  \u03b1x + c', 46, '#8C8C8C'],
              ['LayerNorm', 130, '#3E6491'],
              ['RMSNorm', 214, '#8C77BC']];

  function mean(v) { return v.reduce(function (s, t) { return s + t; }, 0) / v.length; }
  function ln(v) {
    var m = mean(v);
    var sd = Math.sqrt(mean(v.map(function (t) { return (t - m) * (t - m); })));
    return v.map(function (t) { return (t - m) / sd; });
  }
  function rn(v) {
    var r = Math.sqrt(mean(v.map(function (t) { return t * t; })));
    return v.map(function (t) { return t / r; });
  }
  var BASE_LN = ln(X), BASE_RN = rn(X);

  function row(vals, y, colour, ghost) {
    var s = "<line class='zero' x1='" + X0 + "' y1='" + y + "' x2='710' y2='" + y + "'/>";
    vals.forEach(function (v, i) {
      var x = X0 + i * W + 6, h = Math.abs(v) * UNIT;
      s += "<rect x='" + x + "' y='" + (v > 0 ? y - h : y).toFixed(1) +
           "' width='30' height='" + h.toFixed(1) + "' rx='2' fill='" + colour +
           "' fill-opacity='0.85'/>";
      if (ghost) {
        var gh = Math.abs(ghost[i]) * UNIT;
        s += "<rect x='" + x + "' y='" + (ghost[i] > 0 ? y - gh : y).toFixed(1) +
             "' width='30' height='" + gh.toFixed(1) +
             "' rx='2' fill='none' stroke='" + colour +
             "' stroke-opacity='0.45' stroke-dasharray='3 2'/>";
      }
    });
    return s;
  }
  function draw() {
    var a = +aR.value / 100, c = +cR.value / 100;
    var y = X.map(function (t) { return a * t + c; });
    var L = ln(y), R = rn(y);
    var s = '';
    ROWS.forEach(function (r) {
      s += "<text class='axlabel' x='8' y='" + (r[1] + 4) + "' fill='" + r[2] + "'>" + r[0] + "</text>";
    });
    s += row(y.map(function (t) { return t / Math.max(1, a); }), ROWS[0][1], '#8C8C8C', null);
    s += row(L, ROWS[1][1], '#3E6491', BASE_LN);
    s += row(R, ROWS[2][1], '#8C77BC', BASE_RN);
    scene.innerHTML = s;
    aOut.textContent = '\u03b1 = ' + a.toFixed(2);
    cOut.textContent = 'c = ' + c.toFixed(2);
    var dot = 0, n1 = 0, n2 = 0;
    for (var i = 0; i < R.length; i++) { dot += R[i] * BASE_RN[i]; n1 += R[i] * R[i]; n2 += BASE_RN[i] * BASE_RN[i]; }
    var cos = dot / Math.sqrt(n1 * n2);
    // The closed form is in the shift *relative to the scale*: alpha divides
    // out of RMSNorm entirely, so what matters is c/alpha, not c.
    var t = c / a;
    note.textContent = 'LayerNorm output is unchanged. RMSNorm output sits at ' +
      'cosine ' + cos.toFixed(4) + ' from where it started \u2014 and the closed ' +
      'form 1/sqrt(1 + (c/\u03b1)\u00b2) gives ' +
      (1 / Math.sqrt(1 + t * t)).toFixed(4) + '.';
  }
  aR.addEventListener('input', draw);
  cR.addEventListener('input', draw);
  draw();
})();
</script>

## 4. What the Clock Knew and the Counter Did Not

Every paper has one figure that carries its argument, and I find the choice in
this one delightful, because the figure that carries the RMSNorm paper's
argument contains no RMSNorm at all.

It is a single translation model trained twice, with and without LayerNorm,
and the same two runs are plotted against two different horizontal axes. On
the left, the number of training steps taken. On the right, the number of
seconds spent. Watch what happens to the gap.

<div class='figure-pair'>
    <div class='panels'>
        <div class='panel'>
            <img src='/images/rmsnorm-loss-vs-steps.png'
                 alt='Training loss against training step for a baseline model and a LayerNorm model. The LayerNorm curve is far below the baseline; markers show 7.0 and 5.4 at the same step.'>
            <div class='annot'>
                <span class='who'>(a) Measured in steps.</span>
                Where the un-normalized <b>Baseline</b> (plum) is at a loss of
                7.0, <b>LayerNorm</b> (blue) is already at 5.4. Normalization
                is winning, and winning big.
            </div>
        </div>
        <div class='panel'>
            <img src='/images/rmsnorm-loss-vs-time.png'
                 alt='The same two runs plotted against wall-clock training time. The gap is visibly smaller; markers show 7.0 and 5.9.'>
            <div class='annot'>
                <span class='who'>(b) Measured in seconds.</span>
                The same two runs. Now LayerNorm is only at 5.9, because each
                of its steps took longer. A third of the advantage was spent
                paying for the normalizer.
            </div>
        </div>
    </div>
    <div class='caption'>
        <span class='caption-label'>Figure 5.</span>
        The whole case, in one pair of axes. 5.4 against 5.9: normalization
        earns its keep per step, then hands much of it back per second.
        Deleting the mean collects the difference. Note what is <i>not</i>
        argued — nobody proposes dropping normalization, only its price.
        <br>
        Figure 1, Zhang &amp; Sennrich (2019), recoloured.
    </div>
</div>

That is the entire case, and notice how little of it is about RMSNorm. The
argument runs: normalization is clearly worth having, since the model without
it is nowhere; but a third of what it wins per step is handed straight back
per second, because the normalizer itself is slow; therefore the prize is not
a better normalizer but a cheaper one that ties. Everything else in the paper
is the demonstration that removing the mean does tie.

I would hold on to the shape of that argument even if you never think about
normalization again. When a technique is winning on one axis and losing on
another, the useful question is rarely "can we win more" — it is "which axis
is the one we are actually billed on".

## 5. Watching a Difference Vanish into Width

I have claimed a formula and quoted two numbers from it, so let me show you
both being checked, on vectors drawn fresh in your browser while you watch.
Each normalizer is two lines of arithmetic:

```python
def layernorm(x):
    return (x - x.mean(-1, keepdims=True)) / x.std(-1, keepdims=True)

def rmsnorm(x):
    return x / np.sqrt((x ** 2).mean(-1, keepdims=True))
```

The widget runs it live, on fresh draws.

<div class='knob'>
    <svg viewBox='0 0 720 260' id='sim-svg' role='img'
         aria-label='A live histogram of the disagreement between LayerNorm and RMSNorm over four hundred random vectors, with the predicted one-over-two-d marked.'>
        <g id='sim-scene'></g>
    </svg>
    <div class='controls'>
        <label for='sim-d'>width $d$</label>
        <input type='range' id='sim-d' min='1' max='12' value='4'>
        <span class='readout' id='sim-d-out'></span>
    </div>
    <div class='controls'>
        <label for='sim-c'>mean carried by the activations</label>
        <input type='range' id='sim-c' min='0' max='150' value='0'>
        <span class='readout' id='sim-c-out'></span>
    </div>
    <p class='note' id='sim-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 6.</span>
    Four hundred fresh random vectors per redraw. The histogram walks left
        as $d$ grows and its mean lands on the dashed $1/2d$. Then push the
        second slider: give the activations a mean and the agreement comes
        apart. That is the honest boundary — the two converge because the mean
        of a wide random vector is near zero, not because it never mattered.
</div>
<script>
(function () {
  var scene = document.getElementById('sim-scene'),
      dR = document.getElementById('sim-d'), cR = document.getElementById('sim-c'),
      dOut = document.getElementById('sim-d-out'), cOut = document.getElementById('sim-c-out'),
      note = document.getElementById('sim-note');
  var N = 400, X0 = 66, X1 = 700, Y0 = 205, YTOP = 24;

  function gauss() {           // Box-Muller
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function trial(d, c) {
    var x = new Float64Array(d), m = 0, i;
    for (i = 0; i < d; i++) { x[i] = gauss() + c; m += x[i]; }
    m /= d;
    var ss = 0, sq = 0;
    for (i = 0; i < d; i++) { ss += (x[i] - m) * (x[i] - m); sq += x[i] * x[i]; }
    var sd = Math.sqrt(ss / d), rms = Math.sqrt(sq / d);
    var dot = 0;                      // cos between (x-m)/sd and x/rms
    for (i = 0; i < d; i++) dot += ((x[i] - m) / sd) * (x[i] / rms);
    return 1 - dot / d;               // both are unit-RMS, so |v|^2 = d
  }
  function draw() {
    var d = Math.pow(2, +dR.value), c = +cR.value / 100;
    var vals = [], mean = 0, i;
    for (i = 0; i < N; i++) { var g = trial(d, c); vals.push(g); mean += g; }
    mean /= N;
    var pred = 1 / (2 * d);
    var hi = Math.max(mean * 3, pred * 3, 1e-9);
    var B = 34, bins = new Array(B).fill(0);
    for (i = 0; i < N; i++) bins[Math.min(B - 1, Math.floor(vals[i] / hi * B))]++;
    var peak = Math.max.apply(null, bins), w = (X1 - X0) / B, s = '';
    s += "<line class='axis' x1='" + X0 + "' y1='" + Y0 + "' x2='" + X1 + "' y2='" + Y0 + "'/>";
    for (i = 0; i < B; i++) {
      var h = bins[i] / peak * (Y0 - YTOP);
      s += "<rect x='" + (X0 + i * w + 1).toFixed(1) + "' y='" + (Y0 - h).toFixed(1) +
           "' width='" + (w - 2).toFixed(1) + "' height='" + h.toFixed(1) +
           "' rx='1.5' fill='#8C77BC' fill-opacity='0.8'/>";
    }
    function mark(v, colour, label, dy) {
      var x = X0 + Math.min(1, v / hi) * (X1 - X0);
      return "<line x1='" + x.toFixed(1) + "' y1='" + YTOP + "' x2='" + x.toFixed(1) +
        "' y2='" + Y0 + "' stroke='" + colour + "' stroke-width='1.6' stroke-dasharray='5 3'/>" +
        "<text class='tick' x='" + (x + 5).toFixed(1) + "' y='" + dy + "' fill='" + colour + "'>" + label + "</text>";
    }
    s += mark(pred, '#3E6491', 'predicted 1/2d', YTOP + 12);
    s += mark(mean, '#A8443E', 'measured mean', YTOP + 28);
    s += "<text class='axlabel' x='" + X0 + "' y='232'>1 &#8722; cosine similarity between the two outputs &#8594;</text>";
    scene.innerHTML = s;
    dOut.textContent = 'd = ' + d;
    cOut.textContent = 'mean = ' + c.toFixed(2);
    var ratio = mean / pred;
    note.textContent = 'measured ' + mean.toExponential(3) + ' against a predicted ' +
      pred.toExponential(3) + ' \u2014 a ratio of ' + ratio.toFixed(2) + '. ' +
      (c < 0.05
        ? 'With zero-mean activations the prediction holds across the whole range of d.'
        : 'With a mean of ' + c.toFixed(2) + ' the prediction no longer applies: the ' +
          'mean subtraction now has something real to remove.');
  }
  dR.addEventListener('input', draw);
  cR.addEventListener('input', draw);
  draw();
})();
</script>

Both things hold at once, and I would ask you to hold them together, because
each on its own is misleading. At the widths real models use, the two
normalizers do so nearly the same thing that the difference is in the fourth
decimal place — which is why the swap was safe. And the property RMSNorm gave
up is completely real, and the second slider makes it appear on demand — which
is why it was a bet rather than a free lunch.[^shift] What decided the bet was
not the mathematics. It was that the activations of a trained network happen
to sit near zero mean, and nobody has a proof that they must.

### Where This Sits Now

If you are heading into research, the thing to take from this is not the
formula. It is that a component everyone treated as settled had an explanation
attached to it that nobody had tested, and testing it was worth more than
improving it.

The specific result is now everywhere: RMSNorm is in LLaMA, Mistral, Qwen,
Gemma and essentially every open model released since 2023, and the ordinary
implementation fuses it into a single kernel so the division costs almost
nothing. That makes it a closed question in practice. The open part is what
sits next to it. Normalization is one of the few operations in a transformer
that is not a matrix multiply, which means it is one of the few places where
the model is limited by moving numbers around rather than by arithmetic — the
same problem that dominates the KV cache. Work on removing normalizers
entirely, or on folding them into the operations around them, is live for
exactly that reason, and the argument in Figure 5 is the argument it makes.

## 6. Chat This Over With Friends

The story worth telling is that every large language model of the last few
years quietly deleted a step from the operation that normalizes it, and
nothing broke. Normalizing means measuring how big a token's list of numbers
has grown and dividing it back down, which has to happen twice a layer or the
numbers run away. The old method subtracted the average of the list before
dividing; the new one does not bother subtracting. What lifts this above a
micro-optimization is that you can say exactly how much was given up: the
agreement between the two outputs is the ratio $\sigma/\text{RMS}$, exactly,
with no approximation anywhere, and at GPT-2's width that puts them about
seven parts in ten thousand apart, closing as one over twice the width. The
average that the old method spent seven years subtracting was, in a network
that wide, very nearly not there at all.

Where the usual telling goes wrong is the moral. "RMSNorm is faster" is true
and is not the finding — the finding is that it *ties*, and the tie is the
whole argument, because when two methods reach the same quality the one doing
less work should win. The fair objection is that something real was sold:
LayerNorm gives the same answer if you add a constant to every feature and
RMSNorm does not, so the field's position is a bet that this invariance was
never doing the work. Seven years of models suggest the bet was right, and
nobody has proved it. What I like most is that this is a *negative* result.
Somebody removed a step, showed nothing broke, and it has mattered more than
most additions do.

## 7. References

1. Ba, J. L., Kiros, J. R., & Hinton, G. E. (2016). Layer Normalization.
   [arXiv:1607.06450](https://arxiv.org/abs/1607.06450)
2. Zhang, B., & Sennrich, R. (2019). Root Mean Square Layer Normalization.
   *NeurIPS*. [arXiv:1910.07467](https://arxiv.org/abs/1910.07467)
3. Vaswani, A., et al. (2017). Attention Is All You Need. *NeurIPS*.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
4. Raffel, C., et al. (2020). Exploring the Limits of Transfer Learning with a
   Unified Text-to-Text Transformer. *JMLR*.
   [arXiv:1910.10683](https://arxiv.org/abs/1910.10683)
5. Touvron, H., et al. (2023). LLaMA: Open and Efficient Foundation Language
   Models. [arXiv:2302.13971](https://arxiv.org/abs/2302.13971)

[^shift]: For zero-mean unit-RMS $x$, shifting by $c$ gives
    $\cos = 1/\sqrt{1+c^2}$; with a scale $\alpha$, the shift that matters is
    $c/\alpha$.
