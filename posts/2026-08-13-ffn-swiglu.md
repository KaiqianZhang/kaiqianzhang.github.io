---
title: FFN-SwiGLU
subtitle: The feed-forward layer holds most of a transformer's parameters, and the field demoted its activation to a gate that nobody can explain.
date: 2026-08-13
tags: llm
icon: 🍵
---

Attention gets the attention. But most of a transformer's parameters are not
in attention at all — they sit in the feed-forward network that follows it,
and for years its shape never changed: two matrices with a nonlinearity wedged
between them. Then Noam Shazeer put a gate inside it. The change was designed
to cost nothing, and the paper introducing it declines to say why it works.

[TOC]

## The Widest Place a Token Ever Goes

Attention mixes information *between* positions. The feed-forward network does
the opposite: the same weights applied to each token alone, expanding its
vector into a wider space, doing something nonlinear there, and projecting it back. Watch the shapes; they are the argument.

<div class='ffn-anim'>
    <svg viewBox='0 0 720 268' role='img'
         aria-label='A feed-forward layer. One token vector of width 4096 enters, is projected by two separate matrices into width 11008, one branch is passed through Swish and multiplied elementwise into the other, and a third matrix projects the result back to width 4096.'>
        <text class='lbl' x='10' y='128'>x</text>
        <text class='dim' x='8' y='146'>d = 4096</text>
        <line class='wire' x1='34' y1='122' x2='150' y2='72'/>
        <line class='wire' x1='34' y1='122' x2='150' y2='184'/>
        <rect class='mat gate' x='150' y='54' width='104' height='36' rx='5'/>
        <text class='mlbl' x='202' y='71'>W</text>
        <text class='mdim' x='202' y='84'>4096 &#215; 11008</text>
        <rect class='mat val' x='150' y='166' width='104' height='36' rx='5'/>
        <text class='mlbl' x='202' y='183'>V</text>
        <text class='mdim' x='202' y='196'>4096 &#215; 11008</text>
        <line class='wire' x1='254' y1='72' x2='306' y2='72'/>
        <rect class='mat act' x='306' y='54' width='78' height='36' rx='5'/>
        <text class='mlbl act-t' x='345' y='77'>Swish</text>
        <line class='wire' x1='384' y1='72' x2='452' y2='72'/>
        <line class='wire' x1='452' y1='72' x2='452' y2='112'/>
        <line class='wire' x1='254' y1='184' x2='452' y2='184'/>
        <line class='wire' x1='452' y1='184' x2='452' y2='144'/>
        <circle class='prod' cx='452' cy='128' r='15'/>
        <text class='plbl' x='452' y='133'>&#8855;</text>
        <text class='dim' x='452' y='163'>11008</text>
        <line class='wire' x1='467' y1='128' x2='524' y2='128'/>
        <rect class='mat down' x='524' y='110' width='112' height='36' rx='5'/>
        <text class='mlbl' x='580' y='127'>W&#8322;</text>
        <text class='mdim' x='580' y='140'>11008 &#215; 4096</text>
        <line class='wire' x1='636' y1='128' x2='690' y2='128'/>
        <text class='lbl' x='694' y='128'>y</text>
        <text class='dim' x='696' y='146'>d = 4096</text>
        <circle class='tok tok-g' cx='0' cy='0' r='6'/>
        <circle class='tok tok-v' cx='0' cy='0' r='6'/>
        <circle class='tok tok-o' cx='0' cy='0' r='6'/>
        <text class='note' x='150' y='232'>two projections up</text>
        <text class='note' x='396' y='232'>one gates the other</text>
        <text class='note' x='560' y='232'>one projection down</text>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        A SwiGLU feed-forward layer, with LLaMA 7B's widths on it. The token
        takes <i>two</i> routes up rather than one: $W$ and $V$ project the
        same input into the same wide space, Swish squashes only the first,
        and the two are multiplied entry by entry before $W_2$ brings it home.
        The original had no lower branch.
    </div>
</div>

## 1. When the Gate Arrived Before the Door It Would Open

The pieces were lying around before anyone assembled them, and not in the
order the story implies.

<div class='roadmap'>
    <svg viewBox='0 0 760 166' role='img' aria-label='Roadmap of the feed-forward layer: a gate arrives in 2016, the Transformer ships a plain two-matrix FFN in 2017, Shazeer puts the gate inside it in 2020, and LLaMA makes that the default.'>
      <line class='spine' x1='94.2' y1='40' x2='665.8' y2='40'/>
      <polygon class='head' points='198.5,40 189.5,36 189.5,44'/>
      <text class='why' x='189.5' y='27'>built for convolutions, not attention</text>
      <polygon class='head' points='389.0,40 380.0,36 380.0,44'/>
      <text class='why' x='380.0' y='27'>the activation changed; the shape never did</text>
      <polygon class='head' points='579.5,40 570.5,36 570.5,44'/>
      <text class='why' x='570.5' y='27'>it wins, unexplained</text>
      <g class='stop'>
        <rect class='hit' x='6.0' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='94.2' cy='40' r='4.5'/>
        <rect class='box' x='6.0' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='94.2' y='65.0'>2016</text>
        <text class='stage' x='94.2' y='79.0'>a gate appears</text>
        <text class='body' x='94.2' y='97.0'>Dauphin et al. multiply two</text>
        <text class='body' x='94.2' y='111.5'>linear projections, one</text>
        <text class='body' x='94.2' y='126.0'>squashed. It predates the</text>
        <text class='body' x='94.2' y='140.5'>Transformer it ends up</text>
        <text class='body' x='94.2' y='155.0'>inside.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='196.5' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='284.8' cy='40' r='4.5'/>
        <rect class='box' x='196.5' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='284.8' y='65.0'>2017</text>
        <text class='stage' x='284.8' y='79.0'>the plain FFN</text>
        <text class='body' x='284.8' y='97.0'>Two matrices, widened</text>
        <text class='body' x='284.8' y='111.5'>fourfold, with a pointwise</text>
        <text class='body' x='284.8' y='126.0'>nonlinearity between them.</text>
        <text class='body' x='284.8' y='140.5'>BERT and GPT swap in GELU;</text>
        <text class='body' x='284.8' y='155.0'>the shape stands.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='387.0' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='475.2' cy='40' r='4.5'/>
        <rect class='box' x='387.0' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='475.2' y='65.0'>2020</text>
        <text class='stage' x='475.2' y='79.0'>Shazeer combines them</text>
        <text class='body' x='475.2' y='97.0'>A GLU inside the FFN. Three</text>
        <text class='body' x='475.2' y='111.5'>matrices, so the hidden</text>
        <text class='body' x='475.2' y='126.0'>width shrinks to two thirds</text>
        <text class='body' x='475.2' y='140.5'>to pay for it.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='577.5' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='665.8' cy='40' r='4.5'/>
        <rect class='box' x='577.5' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='665.8' y='65.0'>2023-</text>
        <text class='stage' x='665.8' y='79.0'>LLaMA makes it default</text>
        <text class='body' x='665.8' y='97.0'>SwiGLU in LLaMA, Mistral,</text>
        <text class='body' x='665.8' y='111.5'>Qwen, DeepSeek. Gemma keeps</text>
        <text class='body' x='665.8' y='126.0'>the GELU-gated variant</text>
        <text class='body' x='665.8' y='140.5'>instead.</text>
      </g>
    </svg>
</div>

The middle arrow needs care. People *did* revisit the activation — BERT and
GPT put GELU where the ReLU had been, and Shazeer's introduction says so. What
went unrevisited was the *shape*, which holds about two thirds of the
non-embedding parameters in a decoder-only model: 66.8% in LLaMA 7B, though
only 57% in the 2017 encoder-decoder, which also carries cross-attention.

## 2. A Third Matrix, Paid For in Width

The original layer is two matrices with a rectifier between them, written
without biases as T5 does:

$$
\text{FFN}_{\text{ReLU}}(x, W_1, W_2) = \max(xW_1,\, 0)\,W_2 .
$$

A **gated linear unit** replaces that single expansion with two and uses one
to modulate the other. Shazeer's version puts Swish on the gate:

$$
\text{FFN}_{\text{SwiGLU}}(x, W, V, W_2) = \big(\text{Swish}_1(xW) \otimes xV\big)\,W_2,
\qquad \text{Swish}_\beta(x) = x\,\sigma(\beta x),
$$

where $\otimes$ is elementwise multiplication. That is the whole definition.
The activation has not been *replaced* so much as demoted: it no longer stands
between two matrices, it decides how much of a third gets through.

### Why the width falls to exactly two thirds

Here is the step worth doing slowly, because it is why the change is free.
The ReLU layer holds two matrices, so $2\,d\,d_{ff}$ parameters; the gated
layer holds three at some new width $d_{ff}'$, so $3\,d\,d_{ff}'$. Setting
them equal,

$$
3\,d\,d_{ff}' = 2\,d\,d_{ff} \quad\Longrightarrow\quad d_{ff}' = \tfrac{2}{3}\,d_{ff}.
$$

The $d$ cancels, so the rule holds at every model size. With the customary
$d_{ff} = 4d$ that is $\tfrac{8}{3}d$: one extra matrix, paid for in width.

Watch it land in LLaMA 7B, where $d = 4096$. Two thirds of $4d$ is
$10{,}922.67$, not a width you can allocate, so it rounds up to the next
multiple of 256: **11,008**, the number on Figure 1 — leaving the layer 0.78%
larger than the ReLU version, the detail lost whenever the swap is called
exactly free.

<div class='knob'>
    <svg viewBox='0 0 720 210' id='par-svg' role='img'
         aria-label='Two stacked bars comparing the parameter count of a ReLU feed-forward layer against a SwiGLU one, as the hidden width is changed.'>
        <g id='par-scene'></g>
    </svg>
    <div class='controls'>
        <label for='par-d'>model width $d$</label>
        <input type='range' id='par-d' min='0' max='5' value='2' step='1'>
        <span class='readout' id='par-d-out'></span>
    </div>
    <div class='controls'>
        <label for='par-r'>hidden width, as a multiple of $d$</label>
        <input type='range' id='par-r' min='100' max='500' value='400'>
        <span class='readout' id='par-r-out'></span>
    </div>
    <p class='note' id='par-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 2.</span>
    The same accounting, drawn, against a
    <span style='color:#3E6491'><b>ReLU</b></span> baseline fixed at $4d$.
    Drag the width to $2.67d$ and the bars match exactly, at any $d$.
</div>

<script>
(function () {
  var scene = document.getElementById('par-scene'),
      dR = document.getElementById('par-d'), rR = document.getElementById('par-r'),
      dOut = document.getElementById('par-d-out'), rOut = document.getElementById('par-r-out'),
      note = document.getElementById('par-note');
  var DS = [512, 1024, 2048, 4096, 5120, 8192];
  var X0 = 150, X1 = 660, ROW1 = 56, ROW2 = 116, H = 34;

  function draw() {
    var d = DS[+dR.value], r = +rR.value / 100;
    // An integer-percent slider cannot land on 8/3, and the whole point of
    // this widget is that at 8/3 the two bars are *exactly* equal. Snap the
    // step nearest it to the exact value rather than display 1.001.
    if (Math.abs(r - 8 / 3) < 0.005) r = 8 / 3;
    // The ReLU baseline is fixed at the customary 4d; only the gated layer's
    // hidden width moves. Comparing both at the same width would pin the
    // ratio at 1.5 forever, which is exactly the thing the section denies.
    var relu = 2 * d * (4 * d), swi = 3 * d * (d * r);
    var top = Math.max(relu, swi, 1);
    function w(v) { return (X1 - X0) * v / top; }
    var s = '';
    [['ReLU: 2 matrices at 4d', relu, '#3E6491', ROW1],
     ['SwiGLU: 3 matrices', swi, '#8C77BC', ROW2]].forEach(function (b) {
      s += "<text class='axlabel' x='8' y='" + (b[3] + 22) + "' fill='" + b[2] + "'>" + b[0] + "</text>";
      s += "<rect x='" + X0 + "' y='" + b[3] + "' width='" + w(b[1]).toFixed(1) +
           "' height='" + H + "' rx='4' fill='" + b[2] + "' fill-opacity='0.85'/>";
      s += "<text class='tick' x='" + (X0 + w(b[1]) + 8).toFixed(1) + "' y='" + (b[3] + 22) +
           "'>" + (b[1] / 1e6).toFixed(1) + "M</text>";
    });
    var match = X0 + w(relu);
    s += "<line x1='" + match.toFixed(1) + "' y1='" + (ROW1 - 10) + "' x2='" + match.toFixed(1) +
         "' y2='" + (ROW2 + H + 10) + "' stroke='#A8443E' stroke-width='1.5' stroke-dasharray='4 3'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='192'>parameters in one feed-forward layer &#8594;</text>";
    scene.innerHTML = s;
    dOut.textContent = 'd = ' + d;
    rOut.textContent = r.toFixed(2) + 'd  (' + Math.round(d * r) + ')';
    note.textContent = 'Against a ReLU baseline fixed at 4d, SwiGLU at ' + r.toFixed(2) +
      'd costs ' + (swi / relu).toFixed(3) + '\u00d7 as much. ' +
      (Math.abs(r - 8 / 3) < 0.02
        ? 'That is the two-thirds rule \u2014 and it stays 1.000 at every d, because d cancels.'
        : 'Slide the width to 2.67d and this reads 1.000, whatever d is.');
  }
  dR.addEventListener('input', draw);
  rR.addEventListener('input', draw);
  draw();
})();
</script>

## 3. Four Curves, and the Units They Silence

The gate needs something to squash it, and the candidates form a family:

<div class='knob'>
    <svg viewBox='0 0 720 300' id='act-svg' role='img'
         aria-label='Four activation functions plotted together: ReLU, GELU, Swish, and the sigmoid used by the original gated linear unit.'>
        <g id='act-scene'></g>
    </svg>
    <div class='controls'>
        <label for='act-b'>Swish's $\beta$</label>
        <input type='range' id='act-b' min='5' max='800' value='100'>
        <span class='readout' id='act-b-out'></span>
    </div>
    <div class='controls'>
        <label for='act-x'>evaluate at $x$</label>
        <input type='range' id='act-x' min='-400' max='400' value='-120'>
        <span class='readout' id='act-x-out'></span>
    </div>
    <p class='note' id='act-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 3.</span>
<b>ReLU</b>, $\max(x, 0)$, decides with a hinge. <b>GELU</b>,
    $x\Phi(x)$, weights its input by the probability a standard normal falls
    below it. <b>Swish</b>, $x\sigma(\beta x)$, does the same with a sigmoid;
    at $\beta=0.05$ it flattens towards $x/2$, at 8 it hardens into ReLU.
</div>

<script>
(function () {
  var scene = document.getElementById('act-scene'),
      bR = document.getElementById('act-b'), xR = document.getElementById('act-x'),
      bOut = document.getElementById('act-b-out'), xOut = document.getElementById('act-x-out'),
      note = document.getElementById('act-note');
  var X0 = 60, X1 = 690, Y0 = 250, YTOP = 26, LO = -4, HI = 4, VLO = -1.2, VHI = 4;

  function erf(z) {                       // Abramowitz and Stegun 7.1.26
    var sg = z < 0 ? -1 : 1; z = Math.abs(z);
    var t = 1 / (1 + 0.3275911 * z);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
              - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return sg * y;
  }
  var F = {
    relu:  function (x) { return Math.max(x, 0); },
    gelu:  function (x) { return x * 0.5 * (1 + erf(x / Math.SQRT2)); },
    swish: function (x, b) { return x / (1 + Math.exp(-b * x)); },
    sig:   function (x) { return 1 / (1 + Math.exp(-x)); }
  };
  var SERIES = [['relu', 'ReLU', '#3E6491'], ['gelu', 'GELU', '#C48BAC'],
                ['swish', 'Swish', '#8C77BC'], ['sig', 'sigmoid', '#6E8C66']];

  function px(x) { return X0 + (x - LO) / (HI - LO) * (X1 - X0); }
  function py(v) { return Y0 - (v - VLO) / (VHI - VLO) * (Y0 - YTOP); }

  function draw() {
    var beta = +bR.value / 100, at = +xR.value / 100, s = '', i;
    for (i = -1; i <= 4; i++) {
      s += "<line class='grid' x1='" + X0 + "' y1='" + py(i).toFixed(1) + "' x2='" + X1 +
           "' y2='" + py(i).toFixed(1) + "'/><text class='tick' x='" + (X0 - 8) + "' y='" +
           (py(i) + 3).toFixed(1) + "' text-anchor='end'>" + i + "</text>";
    }
    s += "<line class='axis' x1='" + px(0).toFixed(1) + "' y1='" + YTOP + "' x2='" +
         px(0).toFixed(1) + "' y2='" + Y0 + "'/>";
    SERIES.forEach(function (ser, k) {
      var pts = [];
      for (var x = LO; x <= HI; x += 0.02) {
        pts.push(px(x).toFixed(1) + ',' + py(F[ser[0]](x, beta)).toFixed(1));
      }
      s += "<polyline points='" + pts.join(' ') + "' fill='none' stroke='" + ser[2] +
           "' stroke-width='2.4'/>";
      var v = F[ser[0]](at, beta);
      s += "<circle cx='" + px(at).toFixed(1) + "' cy='" + py(v).toFixed(1) +
           "' r='4.5' fill='" + ser[2] + "' stroke='#FFFFFF' stroke-width='1.5'/>";
      s += "<text x='" + (X1 - 4) + "' y='" + (44 + k * 17) + "' text-anchor='end' " +
           "font-size='11' font-weight='600' fill='" + ser[2] + "'>" + ser[1] +
           " = " + v.toFixed(3) + "</text>";
    });
    s += "<line x1='" + px(at).toFixed(1) + "' y1='" + YTOP + "' x2='" + px(at).toFixed(1) +
         "' y2='" + Y0 + "' stroke='#A8443E' stroke-width='1.2' stroke-dasharray='4 3'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='278'>input to the activation &#8594;</text>";
    scene.innerHTML = s;
    bOut.textContent = '\u03b2 = ' + beta.toFixed(2);
    xOut.textContent = 'x = ' + at.toFixed(2);
    // Swish_beta's minimum sits at -1.27846/beta, which is outside the plotted
    // window for small beta. Scan far enough to find it wherever it is, and
    // say plainly when it is off the left edge of the chart.
    var lo = 0, loAt = 0, span = Math.max(6, 4 / beta);
    for (var x = -span; x < 0; x += span / 4000) {
      var v = F.swish(x, beta); if (v < lo) { lo = v; loAt = x; }
    }
    note.textContent = beta > 6
      ? 'At beta = ' + beta.toFixed(1) + ', Swish sits within ' +
        Math.abs(F.swish(-0.5, beta)).toFixed(3) + ' of ReLU at x = -0.5: the hinge is back.'
      : 'Swish dips to ' + lo.toFixed(3) + ' at x = ' + loAt.toFixed(2) +
        (loAt < LO ? ', off the left of this window, ' : ', ') +
        'then returns towards zero. ReLU is flat at 0 everywhere left of the ' +
        'origin, which is the whole difference in gradient behaviour.';
  }
  bR.addEventListener('input', draw);
  xR.addEventListener('input', draw);
  draw();
})();
</script>

Two things there. The dip is real: GELU and Swish are **not monotonic**,
going negative for small negative inputs before returning towards zero. And
$\beta$ is not really a hyperparameter — since $\text{Swish}_\beta(xW) =
\tfrac{1}{\beta}\text{Swish}_1(x\beta W)$, any $\beta$ is absorbed by rescaling
$W$ and $W_2$, which is why Shazeer fixes it at 1 without comment.

That is one number at a time. What the gate does to a whole layer:

<div class='knob'>
    <svg viewBox='0 0 720 250' id='gat-svg' role='img'
         aria-label='Twenty-four hidden units. The top row is the gate after Swish, the middle row is the value branch, and the bottom row is their elementwise product, which is what leaves the layer.'>
        <g id='gat-scene'></g>
    </svg>
    <div class='controls'>
        <label for='gat-s'>how decisively the gate is driven</label>
        <input type='range' id='gat-s' min='10' max='400' value='150'>
        <span class='readout' id='gat-s-out'></span>
    </div>
    <div class='controls'>
        <label for='gat-b'>Swish's $\beta$</label>
        <input type='range' id='gat-b' min='5' max='800' value='100'>
        <span class='readout' id='gat-b-out'></span>
    </div>
    <p class='note' id='gat-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 4.</span>
            24 hidden units, fixed random projections.
    <span style='color:#8C77BC'><b>Gate</b></span> and
    <span style='color:#3E6491'><b>value</b></span> are independent
    projections of the same token; the
    <span style='color:#22253E'><b>product</b></span> is what leaves. Drive
    the gate harder and it stops weighting and starts selecting: whole units
    cut to nothing while neighbours pass untouched. That is what the third
    matrix bought.
</div>

<script>
(function () {
  var scene = document.getElementById('gat-scene'),
      sR = document.getElementById('gat-s'), bR = document.getElementById('gat-b'),
      sOut = document.getElementById('gat-s-out'), bOut = document.getElementById('gat-b-out'),
      note = document.getElementById('gat-note');
  // Fixed draws, so the picture is stable while the sliders move.
  var G = [0.82, -1.41, 0.35, 1.77, -0.62, 0.14, -1.05, 1.23, 0.48, -0.27,
           1.61, -0.88, 0.06, 0.95, -1.72, 0.71, -0.33, 1.38, -0.51, 0.24,
           1.09, -1.16, 0.63, -0.09];
  var V = [1.12, 0.74, -1.35, 0.42, 1.58, -0.91, 0.28, -1.47, 0.86, 1.31,
           -0.55, 0.19, 1.66, -1.02, 0.37, 1.44, -0.68, 0.11, 1.25, -1.53,
           0.59, 0.93, -1.21, 0.46];
  var N = 24, X0 = 108, X1 = 706, ROWS = [46, 118, 196];

  function draw() {
    var scale = +sR.value / 100, beta = +bR.value / 100;
    var w = (X1 - X0) / N, s = '', i, cut = 0;
    var gate = [], prod = [];
    for (i = 0; i < N; i++) {
      var z = G[i] * scale;
      gate.push(z / (1 + Math.exp(-beta * z)));       // Swish_beta
      prod.push(gate[i] * V[i]);
    }
    var gmax = Math.max.apply(null, gate.map(Math.abs)) || 1;
    var pmax = Math.max.apply(null, prod.map(Math.abs)) || 1;
    [['gate  Swish(xW)', gate, gmax, '#8C77BC', ROWS[0], 26],
     ['value  xV',       V,    1.8,  '#3E6491', ROWS[1], 26],
     ['product',         prod, pmax, '#22253E', ROWS[2], 34]].forEach(function (r) {
      s += "<text class='axlabel' x='6' y='" + (r[4] + 4) + "' fill='" + r[3] + "'>" + r[0] + "</text>";
      s += "<line class='grid' x1='" + X0 + "' y1='" + r[4] + "' x2='" + X1 + "' y2='" + r[4] + "'/>";
      r[1].forEach(function (v, k) {
        var h = Math.abs(v) / r[2] * r[5];
        s += "<rect x='" + (X0 + k * w + 1.5).toFixed(1) + "' y='" +
             (v > 0 ? r[4] - h : r[4]).toFixed(1) + "' width='" + (w - 3).toFixed(1) +
             "' height='" + h.toFixed(1) + "' rx='1.5' fill='" + r[3] + "' fill-opacity='0.85'/>";
      });
    });
    for (i = 0; i < N; i++) {
      if (Math.abs(prod[i]) < 0.1 * Math.abs(V[i]) * gmax) cut++;
    }
    scene.innerHTML = s;
    sOut.textContent = '\u00d7' + scale.toFixed(2);
    bOut.textContent = '\u03b2 = ' + beta.toFixed(2);
    var open_ = gate.filter(function (g) { return g > 0.05 * gmax; }).length;
    note.textContent = open_ + ' of the 24 units are open, ' + (N - open_) +
      ' are shut or nearly so. The value row never changes \u2014 every ' +
      'difference in the bottom row was decided by the gate.';
  }
  sR.addEventListener('input', draw);
  bR.addEventListener('input', draw);
  draw();
})();
</script>

## 4. The Variant That Won, and the One That Was Better

The paper has four tables and not one figure — which is why Figure 1 is drawn
rather than reproduced, and why it is worth reading all four. No variant wins
them. On pretraining perplexity **GEGLU**, the same construction with GELU on
the gate, edges SwiGLU 1.633 to 1.636; but GLUE goes to ReGLU, SuperGLUE to
SwiGLU, and SQuAD to Bilinear, which has no gate nonlinearity at all. Four
tables, four winners. And the margins are thin: Shazeer measures run-to-run
variability only in the short column, where the GEGLU–SwiGLU gap of 0.002 sits
against standard deviations of 0.004 and 0.010. The fully-trained column is a
single run each with no spread reported at all. The paper establishes a gap
between gated and ungated, and a tie inside the gated family.

Which makes adoption the question, and the usual telling is wrong. It was not
Meta choosing and everyone copying: **PaLM used SwiGLU in April 2022**, a year
before LLaMA, at 540B, and it was Google's — while Google's Gemma ships
**GEGLU** to this day. The split runs inside labs, not between them. LLaMA's
choice mattered because its weights were public, so Mistral, Qwen, DeepSeek
and Phi inherited a recipe, not a measurement.

His conclusion:

> We offer no explanation as to why these architectures seem to work; we
> attribute their success, as all else, to divine benevolence.

People have tried since. The usual story is that a product of two projections
is quadratic where a ReLU layer is piecewise linear, so one gated layer
expresses multiplicative interactions a plain one cannot — exactly true of the
*Bilinear* variant, and only near the origin once Swish sits on the gate. Note
the weaker word: a deep ReLU stack *approximates* products perfectly well, so
what is at stake is one layer at fixed parameter count. No account has won
consensus.

## 5. Chat This Over With Friends

The part of a transformer nobody talks about is where most of its parameters
are. Attention mixes tokens together; the feed-forward layer after it works on
each token alone and holds roughly two thirds of the non-embedding weights in
a modern model. In 2020 Noam Shazeer changed one thing: instead of one wide matrix and a
ReLU, use *two* wide matrices, squash one, and multiply them entry by
entry. The elegant part is the accounting: three matrices where there were two would
cost half again as much, so you shrink the hidden width to exactly two thirds,
and the model width cancels, so the rule holds at every scale. In LLaMA 7B
that is 4,096 going up to 11,008 rather than 16,384 — the same budget, spent
differently.

What most people get wrong is that a winner was ever established. GEGLU edges
SwiGLU on pretraining perplexity by 0.003, a margin the paper never shows to
be real, and the three downstream tables go to ReGLU, SwiGLU and Bilinear, one
each. Nor was this Meta choosing and the field copying: Google's PaLM shipped
SwiGLU a year before LLaMA, while Google's Gemma ships GEGLU to this day. The
best part is the paper's last line, where Shazeer declines to explain the
result and attributes it "to divine benevolence." People have tried since;
no account has won. A great deal of what runs in production is there because
it works and nobody quite knows why.

## 6. References

1. Shazeer, N. (2020). GLU Variants Improve Transformer.
   [arXiv:2002.05202](https://arxiv.org/abs/2002.05202)
2. Dauphin, Y., Fan, A., Auli, M., & Grangier, D. (2016). Language Modeling
   with Gated Convolutional Networks.
   [arXiv:1612.08083](https://arxiv.org/abs/1612.08083); *ICML* 2017.
3. Vaswani, A., et al. (2017). Attention Is All You Need. *NeurIPS*.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
4. Hendrycks, D., & Gimpel, K. (2016). Gaussian Error Linear Units (GELUs).
   [arXiv:1606.08415](https://arxiv.org/abs/1606.08415)
5. Ramachandran, P., Zoph, B., & Le, Q. V. (2017). Searching for Activation
   Functions. [arXiv:1710.05941](https://arxiv.org/abs/1710.05941). Earlier and
   independently, as **SiLU**: Elfwing, Uchibe & Doya,
   [arXiv:1702.03118](https://arxiv.org/abs/1702.03118).
6. Touvron, H., et al. (2023). LLaMA: Open and Efficient Foundation Language
   Models. [arXiv:2302.13971](https://arxiv.org/abs/2302.13971)
7. Gemma Team (2024). Gemma: Open Models Based on Gemini Research and
   Technology. [arXiv:2403.08295](https://arxiv.org/abs/2403.08295)
