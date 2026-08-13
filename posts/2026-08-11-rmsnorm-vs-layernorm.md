---
title: RMSNorm vs. LayerNorm
subtitle: Modern language models deleted one step from the operation that normalizes them, and the deleted step turns out to have been doing almost nothing.
date: 2026-08-11
tags: llm
icon: 🍵
---

Every transformer normalizes: between attention and the feed-forward block,
each token's hidden vector is rescaled so its entries have a controlled size.
For seven years that meant **layer normalization**. Today almost every large
language model uses **root mean square layer normalization** — LayerNorm with
one step deleted. This post is about why deleting it was worth doing.

[TOC]

## Two Small Rooms in Every Layer

RMSNorm is a drop-in replacement, not a rearrangement: both occupy the same
two slots.

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

Each attempt charged something. The labels above the arrows name what the
step to their left was still paying.

<div class='roadmap'>
    <svg viewBox='0 0 760 166' role='img' aria-label='Roadmap of normalization: BatchNorm 2015, LayerNorm 2016, RMSNorm 2019, the default from 2023. Each step is forced by a cost of the one before it.'>
      <line class='spine' x1='94.2' y1='40' x2='665.8' y2='40'/>
      <polygon class='head' points='198.5,40 189.5,36 189.5,44'/>
      <text class='why' x='189.5' y='27'>statistics depend on the batch</text>
      <polygon class='head' points='389.0,40 380.0,36 380.0,44'/>
      <text class='why' x='380.0' y='27'>is the mean doing any work?</text>
      <polygon class='head' points='579.5,40 570.5,36 570.5,44'/>
      <text class='why' x='570.5' y='27'>same quality, less time</text>
      <g class='stop'>
        <rect class='hit' x='6.0' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='94.2' cy='40' r='4.5'/>
        <rect class='box' x='6.0' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='94.2' y='65.0'>2015</text>
        <text class='stage' x='94.2' y='79.0'>BatchNorm</text>
        <text class='body' x='94.2' y='97.0'>Standardize each feature</text>
        <text class='body' x='94.2' y='111.5'>across the mini-batch. Deep</text>
        <text class='body' x='94.2' y='126.0'>networks become trainable.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='196.5' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='284.8' cy='40' r='4.5'/>
        <rect class='box' x='196.5' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='284.8' y='65.0'>2016</text>
        <text class='stage' x='284.8' y='79.0'>LayerNorm</text>
        <text class='body' x='284.8' y='97.0'>Normalize each example</text>
        <text class='body' x='284.8' y='111.5'>across its own features</text>
        <text class='body' x='284.8' y='126.0'>instead. No batch</text>
        <text class='body' x='284.8' y='140.5'>dependence, no train/test</text>
        <text class='body' x='284.8' y='155.0'>gap.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='387.0' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='475.2' cy='40' r='4.5'/>
        <rect class='box' x='387.0' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='475.2' y='65.0'>2019</text>
        <text class='stage' x='475.2' y='79.0'>RMSNorm</text>
        <text class='body' x='475.2' y='97.0'>Zhang and Sennrich drop the</text>
        <text class='body' x='475.2' y='111.5'>mean subtraction, keeping</text>
        <text class='body' x='475.2' y='126.0'>only the division. 7 to 64%</text>
        <text class='body' x='475.2' y='140.5'>less running time.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='577.5' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='665.8' cy='40' r='4.5'/>
        <rect class='box' x='577.5' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='665.8' y='65.0'>2023-</text>
        <text class='stage' x='665.8' y='79.0'>the default</text>
        <text class='body' x='665.8' y='97.0'>LLaMA ships it; Mistral,</text>
        <text class='body' x='665.8' y='111.5'>Qwen, Gemma, DeepSeek</text>
        <text class='body' x='665.8' y='126.0'>follow. LayerNorm becomes</text>
        <text class='body' x='665.8' y='140.5'>the exception.</text>
      </g>
    </svg>
</div>

The motivation was **cost, not quality**, and they said plainly what they
thought was load-bearing:

> In this paper, we hypothesize that the re-scaling invariance is the reason
> for success of LayerNorm, rather than re-centering invariance.

The interesting part is not that a faster method won, but that the standard
explanation for *why* LayerNorm worked was half wrong, and nobody checked for
three years.

## 2. The Arithmetic of an Absence

Both take a token's hidden vector $x \in \mathbb{R}^d$ and return one of the
same shape. **LayerNorm** computes two statistics across the $d$ entries:

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

That is the whole difference: no $\mu$, no subtraction, and originally no
bias.

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

The two statistics are closer than they look, and everything else follows
from the relationship. Expand the sum of squares around the mean:

$$
\frac{1}{d}\sum_i x_i^2
= \underbrace{\frac{1}{d}\sum_i (x_i-\mu)^2}_{\sigma^2}
+ \underbrace{\frac{2\mu}{d}\sum_i (x_i - \mu)}_{= \, 0}
+ \; \mu^2 ,
\qquad\text{so}\qquad \text{RMS}^2 = \sigma^2 + \mu^2 .
$$

The middle term vanishes because deviations from the mean sum to zero. So
**the RMS is the standard deviation plus whatever the mean contributes** — and
the real question is how big $\mu$ is next to $\sigma$.

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

Set $g = 1$, $b = 0$. Each method returns a positive multiple of a vector —
LayerNorm of $x - \mu\mathbf{1}$, RMSNorm of $x$ — and scale is irrelevant to
both, so the entire disagreement is the angle $\theta$ between those
directions. Using $\|x - \mu\mathbf{1}\|^2 = \|x\|^2 - d\mu^2$:

$$
\cos\theta = \frac{\langle x - \mu\mathbf{1},\, x\rangle}{\|x - \mu\mathbf{1}\|\,\|x\|}
= \frac{\sqrt{\|x\|^2 - d\mu^2}}{\|x\|}
= \sqrt{1 - \frac{\mu^2}{\text{RMS}(x)^2}} = \frac{\sigma}{\text{RMS}(x)} .
$$

**The agreement is exactly $\sigma/\text{RMS}$** — no approximation, no
assumption about the distribution of $x$.

Now add the assumption real networks satisfy: $d$ is large. If the entries of
$x$ are independent with mean zero and variance one, $\mu$ has variance $1/d$,
and expanding the square root gives

$$
\mathbb{E}\!\left[1 - \cos\theta\right] \approx \frac{1}{2d} .
$$

**The disagreement shrinks like $1/d$** — about $0.00065$ at GPT-2's
$d = 768$, and $0.00012$ at Llama 2 7B's $d = 4096$. Section 4 checks it.

### The invariance left behind

Both are invariant to **re-scaling**, since
$\text{RMS}(\alpha x) = \alpha\,\text{RMS}(x)$ cancels. Only LayerNorm is
invariant to **re-centering**: add $c$ to every entry and each deviation
$x_i - \mu$ is unchanged, so its output is identical. RMSNorm sees a different
vector.

That is the real trade, stated without spin: RMSNorm gives up a genuine
mathematical property, and the claim — supported then by experiments and since
by the field — is that this property was not the one carrying the load.

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

## 3. What the Clock Knew and the Counter Did Not

Every paper has one figure carrying its argument, and RMSNorm's contains no
RMSNorm at all: one translation model with and without LayerNorm, plotted
against steps and then against seconds.

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

## 4. Watching a Difference Vanish into Width

Both are checkable, and each normalizer is two lines:

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

Both hold — and hold them together: at realistic widths the two do nearly the
same thing, which is why the swap is safe, while the property RMSNorm sold is
real, which is why it was a bet.[^shift]

## 5. Chat This Over With Friends

The story worth telling is that every large language model of the last few
years quietly deleted a step from the operation that normalizes it, and
nothing broke. LayerNorm subtracts the mean of a token's features before
dividing by their spread; RMSNorm simply does not subtract. What lifts this
above a micro-optimization is that you can say exactly how much was given up:
the cosine between the two outputs is $\sigma/\text{RMS}$, exactly, which at
GPT-2's width puts them about seven parts in ten thousand apart and closing as
$1/2d$. The mean LayerNorm spent seven years subtracting was, in a network
that wide, very nearly not there at all.

Where the usual telling goes wrong is the moral. "RMSNorm is faster" is true
and is not the finding; the finding is that it *ties*, and the tie is the
whole argument, because when two methods reach the same quality the one doing
less work should win. Something real was sold, though: LayerNorm is invariant to adding a constant
to every feature and RMSNorm is not, and the field's position is a bet that
this invariance was never doing the work. Seven years of models suggest it was
right. The part worth raising is that this is a *negative* result — somebody
removed a step, showed nothing broke, and it mattered more than most additions
do.

## 6. References

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
