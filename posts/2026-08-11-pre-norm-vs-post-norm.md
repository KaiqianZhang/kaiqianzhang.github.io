---
title: Pre-Norm vs. Post-Norm
subtitle: Moving the normalizer off the main path is what made deep transformers trainable, and the argument over where to put it instead is still going.
date: 2026-08-11
tags: llm
icon: 🍵
---

A transformer layer has three moving parts: a sub-layer that does the work, a
residual connection that adds its output back, and a normalizer. There are few
sensible ways to order them, and the choice looks like a detail. It is not:
moving the normalizer from after the addition to before the sub-layer is the
difference between a model that needs a tuned learning-rate warm-up and one
that does not.

[TOC]

## The Normalizer Steps Aside

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
        (a) it is interrupted twice per layer, in (b) it runs clean bottom to
        top. That uninterrupted column is most of the story.
        <br>
        Figure 1, Xiong et al. (2020), recoloured.
    </div>
</div>

## 1. The Ritual Nobody Could Explain

For three years, training a transformer meant a ritual nobody could explain.
The arrow labels are the history; the boxes its dates.

<div class='roadmap'>
    <svg viewBox='0 0 760 166' role='img' aria-label='Roadmap of normalizer placement: warm-up appears in 2017, the rearrangement spreads in 2018 to 2019, Xiong et al. explain it in 2020, pre-norm is the default after.'>
      <line class='spine' x1='94.2' y1='40' x2='665.8' y2='40'/>
      <polygon class='head' points='198.5,40 189.5,36 189.5,44'/>
      <text class='why' x='189.5' y='27'>nobody could say what it was for</text>
      <polygon class='head' points='389.0,40 380.0,36 380.0,44'/>
      <text class='why' x='380.0' y='27'>it worked, unexplained</text>
      <polygon class='head' points='579.5,40 570.5,36 570.5,44'/>
      <text class='why' x='570.5' y='27'>a folk remedy becomes a rule</text>
      <g class='stop'>
        <rect class='hit' x='6.0' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='94.2' cy='40' r='4.5'/>
        <rect class='box' x='6.0' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='94.2' y='65.0'>2017</text>
        <text class='stage' x='94.2' y='79.0'>warm-up appears</text>
        <text class='body' x='94.2' y='97.0'>The Transformer needs a</text>
        <text class='body' x='94.2' y='111.5'>learning rate that ramps</text>
        <text class='body' x='94.2' y='126.0'>for 4,000 steps. Offered as</text>
        <text class='body' x='94.2' y='140.5'>recipe, not finding.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='196.5' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='284.8' cy='40' r='4.5'/>
        <rect class='box' x='196.5' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='284.8' y='65.0'>2018-19</text>
        <text class='stage' x='284.8' y='79.0'>a quiet rearrangement</text>
        <text class='body' x='284.8' y='97.0'>Baevski and Auli, the</text>
        <text class='body' x='284.8' y='111.5'>Sparse Transformer, GPT-2:</text>
        <text class='body' x='284.8' y='126.0'>the normalizer moves into</text>
        <text class='body' x='284.8' y='140.5'>the branch. In none of them</text>
        <text class='body' x='284.8' y='155.0'>is it the headline.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='387.0' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='475.2' cy='40' r='4.5'/>
        <rect class='box' x='387.0' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='475.2' y='65.0'>2020</text>
        <text class='stage' x='475.2' y='79.0'>someone works out why</text>
        <text class='body' x='475.2' y='97.0'>Xiong et al.: at</text>
        <text class='body' x='475.2' y='111.5'>initialization post-norm</text>
        <text class='body' x='475.2' y='126.0'>gradients near the output</text>
        <text class='body' x='475.2' y='140.5'>are large, so warm-up is</text>
        <text class='body' x='475.2' y='155.0'>the workaround.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='577.5' y='30' width='176.5' height='125.5'/>
        <circle class='dot' cx='665.8' cy='40' r='4.5'/>
        <rect class='box' x='577.5' y='56' width='176.5' height='101.5' rx='7'/>
        <text class='yr' x='665.8' y='65.0'>2020-</text>
        <text class='stage' x='665.8' y='79.0'>pre-norm by default</text>
        <text class='body' x='665.8' y='97.0'>GPT-3, LLaMA, Mistral,</text>
        <text class='body' x='665.8' y='111.5'>Qwen, Gemma, DeepSeek.</text>
        <text class='body' x='665.8' y='126.0'>Then, from 2022, people</text>
        <text class='body' x='665.8' y='140.5'>begin moving it back.</text>
      </g>
    </svg>
</div>

Warm-up was load-bearing: too few steps and the optimization diverges, and
quality is sensitive to both the step count and the peak rate. A cost at the
start of every run, two interacting hyper-parameters, no account of what
either was for. Xiong et al. call them **Post-LN** and **Pre-LN**.

## 2. The Stream That Only Rises

One line of algebra, and everything follows — all of it at
**initialization**. With $F_l$ the $l$-th sub-layer and $N$ the normalizer,
**post-norm** puts $N$ outside and **pre-norm** inside:

$$
x_{l+1} = N\big(x_l + F_l(x_l)\big)
\qquad\text{versus}\qquad
x_{l+1} = x_l + F_l\big(N(x_l)\big), \quad x_{\text{out}} = N(x_{L}).
$$

Now follow $\|x_l\|$, the **residual stream**. Under post-norm the last
operation in every layer is $N$, so it stays at $\sqrt{d}$. Under pre-norm
nothing rescales it, so the outputs accumulate — independent at
initialization, so their *squared* norms add:

$$
\|x_L\|^2 \;\approx\; \|x_0\|^2 + \sum_{l=0}^{L-1}\|F_l\|^2 \;\approx\; (L+1)\,d .
$$

**The pre-norm residual stream grows like $\sqrt{L}$.** A 64-layer model makes
128 residual writes and arrives eleven times larger.

<div class='knob'>
    <svg viewBox='0 0 720 270' id='str-svg' role='img'
         aria-label='Residual stream size against depth. The pre-norm curve climbs as the square root of depth; the post-norm curve is flat. A second control shrinks the branch weights and flattens the pre-norm curve.'>
        <g id='str-scene'></g>
    </svg>
    <div class='controls'>
        <label for='str-l'>depth &#8212; residual writes $L$</label>
        <input type='range' id='str-l' min='2' max='256' value='128'>
        <span class='readout' id='str-l-out'></span>
    </div>
    <div class='controls'>
        <label for='str-b'>branch scale $\beta$ at initialization</label>
        <input type='range' id='str-b' min='10' max='140' value='100'>
        <span class='readout' id='str-b-out'></span>
    </div>
    <p class='note' id='str-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 2.</span>
    The algebra with its knobs exposed: the
    <span style='color:#8C77BC'><b>pre-norm</b></span> stream climbs as
    $\sqrt{1 + L\beta^2}$ while
    <span style='color:#3E6491'><b>post-norm</b></span> stays flat. Drag
    $\beta$ to $1/\sqrt{L}$ and the climb almost vanishes.
</div>
<script>
(function () {
  var scene = document.getElementById('str-scene'),
      lR = document.getElementById('str-l'), bR = document.getElementById('str-b'),
      lOut = document.getElementById('str-l-out'), bOut = document.getElementById('str-b-out'),
      note = document.getElementById('str-note');
  var X0 = 62, X1 = 700, Y0 = 214, YTOP = 26;

  function draw() {
    var L = +lR.value, beta = +bR.value / 100;
    var top = Math.max(2.2, Math.sqrt(1 + L * beta * beta) * 1.12);
    function px(l) { return X0 + l / L * (X1 - X0); }
    function py(v) { return Y0 - v / top * (Y0 - YTOP); }
    var s = '', i;
    for (i = 0; i <= 4; i++) {
      var v = top * i / 4;
      s += "<line class='grid' x1='" + X0 + "' y1='" + py(v).toFixed(1) +
           "' x2='" + X1 + "' y2='" + py(v).toFixed(1) + "'/>" +
           "<text class='tick' x='" + (X0 - 8) + "' y='" + (py(v) + 3).toFixed(1) +
           "' text-anchor='end'>" + v.toFixed(1) + "</text>";
    }
    var pre = [], post = [];
    for (i = 0; i <= L; i++) {
      pre.push(px(i).toFixed(1) + ',' + py(Math.sqrt(1 + i * beta * beta)).toFixed(1));
      post.push(px(i).toFixed(1) + ',' + py(1).toFixed(1));
    }
    s += "<polyline points='" + post.join(' ') + "' fill='none' stroke='#3E6491' stroke-width='2.4'/>";
    s += "<polyline points='" + pre.join(' ') + "' fill='none' stroke='#8C77BC' stroke-width='2.6'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='240'>residual write &#8594;</text>";
    s += "<text class='axlabel' x='" + (X0 - 46) + "' y='" + (YTOP - 8) +
         "'>&#8214;x&#8214; in units of &#8730;d</text>";
    scene.innerHTML = s;
    var end = Math.sqrt(1 + L * beta * beta);
    lOut.textContent = 'L = ' + L;
    bOut.textContent = '\u03b2 = ' + beta.toFixed(2);
    var gpt2 = 1 / Math.sqrt(L);
    note.textContent = 'At the top of the stack the pre-norm vector is ' +
      end.toFixed(2) + '\u00d7 the size it started, against post-norm\u2019s 1.00\u00d7. ' +
      'GPT-2\u2019s 1/\u221aL for this depth would be \u03b2 = ' + gpt2.toFixed(2) +
      ', which lands the stream at ' + Math.sqrt(2).toFixed(2) + '\u00d7 however deep the model gets.';
  }
  lR.addEventListener('input', draw);
  bR.addEventListener('input', draw);
  draw();
})();
</script>

The growth follows from the initialization, not the architecture: GPT-2
cancelled it deliberately, scaling residual weights by $1/\sqrt{N}$ two years
before anyone explained why.

Now the consequence. The last thing a pre-norm network does is normalize, and
the Jacobian of $N$ at $x_L$ carries a factor
$\sqrt{d}/\|x_L\| \approx 1/\sqrt{L+1}$. **The deeper the model, the more its
final normalization damps every gradient in it.** Post-norm has no such term.
That is Theorem 1 of Xiong et al. — though both sides are *upper* bounds, so
the separation is really carried by the measurements in section 3.[^warmup]

<div class='pulse-anim'>
    <svg viewBox='0 0 720 250' role='img'
         aria-label='Two stacks of six layers. A gradient pulse travels down the post-norm stack passing through a normalizer at every layer, and down the pre-norm stack along an unbroken residual path.'>
        <text class='rowlabel' x='96' y='18'>POST-NORM</text>
        <text class='rowlabel' x='452' y='18'>PRE-NORM</text>
        <g class='stack'>
            <line class='spine-hard' x1='150' y1='34' x2='150' y2='214'/>
            <rect class='norm' x='134' y='40'  width='32' height='13' rx='3'/>
            <rect class='norm' x='134' y='70'  width='32' height='13' rx='3'/>
            <rect class='norm' x='134' y='100' width='32' height='13' rx='3'/>
            <rect class='norm' x='134' y='130' width='32' height='13' rx='3'/>
            <rect class='norm' x='134' y='160' width='32' height='13' rx='3'/>
            <rect class='norm' x='134' y='190' width='32' height='13' rx='3'/>
            <circle class='pulse pulse-post' cx='150' cy='34' r='7'/>
        </g>
        <g class='stack'>
            <line class='spine-clean' x1='506' y1='34' x2='506' y2='214'/>
            <rect class='norm off' x='546' y='40'  width='32' height='13' rx='3'/>
            <rect class='norm off' x='546' y='70'  width='32' height='13' rx='3'/>
            <rect class='norm off' x='546' y='100' width='32' height='13' rx='3'/>
            <rect class='norm off' x='546' y='130' width='32' height='13' rx='3'/>
            <rect class='norm off' x='546' y='160' width='32' height='13' rx='3'/>
            <rect class='norm off' x='546' y='190' width='32' height='13' rx='3'/>
            <circle class='pulse pulse-pre' cx='506' cy='34' r='7'/>
        </g>
        <text class='cap' x='96' y='236'>six normalizers stand in the road</text>
        <text class='cap' x='452' y='236'>the road is clear; they stand beside it</text>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 3.</span>
        A gradient travelling back down each arrangement. On the left it is
        squeezed through a normalizer at every layer and arrives faint; on the
        right the path is an unbroken chain of additions and it arrives
        intact.
    </div>
</div>

## 3. Where the Gradient Piles Up

The theorem is about the last layer. Across all of them the picture differs,
and *not* as section 2 predicts.

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
        <span class='caption-label'>Figure 4.</span>
        Panel (a) is the argument, (b) the payoff. Note what (a) says about
        warm-up: it does not proportion Post-LN's gradients across layers, it
        makes them all small.
        <br>
        Figures 3(b) and 4(b), Xiong et al. (2020), recoloured.
    </div>
</div>

The clean residual path is the mechanism, not a metaphor: the main path in
Figure 1(b) is a sum with no nonlinearity and no rescaling, where post-norm
has $L$ normalizers in the road. And a tie in quality was never established —
Xiong et al. showed pre-norm reaching *comparable* results faster.

## 4. The Slow Walk Back

If pre-norm had simply won, this post would end here. Instead the last few
years have been an effort to recover post-norm's advantages without its
instability, turning a two-way choice into a four-way one. Swin Transformer V2
(2021) moved the normalizer to each branch's *output*, bounding what gets
added to the stream; DeepNet (2022) kept post-norm and fixed the instability
directly, reaching 1,000 layers; Gemma 2 normalizes *both* ends
(**Peri-LN**), and OLMo 2 adopted Swin's arrangement as **reordered norm**.

The honest detail: it does not work alone. OLMo 2 pairs it with query and key
normalization, reporting that "in isolation, neither of these changes yield
good results, but together they improve both the growth and the spikiness of
the L2 norm of the gradient." Without the pre-norm, attention sees the raw
residual stream, so the logits grow with it and something must bound them.

<div class='knob'>
    <svg viewBox='0 0 720 250' id='arr-svg' role='img'
         aria-label='A transformer sub-layer with the normalizer able to sit in four places: on the main path after the addition, inside the branch before the sub-layer, inside the branch after it, or both.'>
        <g id='arr-scene'></g>
    </svg>
    <div class='controls'>
        <label for='arr-w'>where the normalizer sits</label>
        <input type='range' id='arr-w' min='0' max='3' value='1' step='1'>
        <span class='readout' id='arr-w-out'></span>
    </div>
    <div class='controls'>
        <label for='arr-l'>depth $L$</label>
        <input type='range' id='arr-l' min='6' max='256' value='64'>
        <span class='readout' id='arr-l-out'></span>
    </div>
    <p class='note' id='arr-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 5.</span>
    All four live arrangements as one movable diagram. Drag the first
    slider and watch the
    <span style='color:#6E8C66'><b>normalizer</b></span> step off the main
    path, into the branch, to its far end, then both. The second says what
    each costs at depth: only a normalizer on the grey main path holds the
    stream flat, and only a clear path escapes warm-up.
</div>
<script>
(function () {
  var scene = document.getElementById('arr-scene'),
      wR = document.getElementById('arr-w'), lR = document.getElementById('arr-l'),
      wOut = document.getElementById('arr-w-out'), lOut = document.getElementById('arr-l-out'),
      note = document.getElementById('arr-note');
  var MODES = [
    {name: 'post-norm', users: 'Transformer, BERT', formula: 'x \u2190 N(x + F(x))',
     onPath: true,  pre: false, post: false},
    {name: 'pre-norm', users: 'GPT-2 onwards, LLaMA, Mistral', formula: 'x \u2190 x + F(N(x))',
     onPath: false, pre: true,  post: false},
    {name: 'reordered', users: 'Swin V2, OLMo 2', formula: 'x \u2190 x + N(F(x))',
     onPath: false, pre: false, post: true},
    {name: 'peri-norm', users: 'Gemma 2', formula: 'x \u2190 x + N(F(N(x)))',
     onPath: false, pre: true,  post: true}
  ];
  var SPINE_X = 150, TOP = 40, BOT = 200, BR = 430;

  function box(x, y, w, h, fill, label, cls) {
    return "<g class='" + (cls || '') + "'><rect x='" + x + "' y='" + y + "' width='" + w +
      "' height='" + h + "' rx='5' fill='" + fill + "' fill-opacity='0.9'/>" +
      "<text x='" + (x + w / 2) + "' y='" + (y + h / 2 + 4) +
      "' text-anchor='middle' font-size='11' font-weight='600' fill='#FFFFFF'>" +
      label + "</text></g>";
  }
  function draw() {
    var m = MODES[+wR.value], L = +lR.value, s = '';
    s += "<line x1='" + SPINE_X + "' y1='" + TOP + "' x2='" + SPINE_X + "' y2='" + BOT +
         "' stroke='#C9C3BC' stroke-width='9' stroke-linecap='round'/>";
    s += "<text x='" + (SPINE_X - 16) + "' y='" + (TOP + 6) +
         "' text-anchor='end' font-size='10.5' fill='#8C8C8C'>out</text>";
    s += "<text x='" + (SPINE_X - 16) + "' y='" + BOT +
         "' text-anchor='end' font-size='10.5' fill='#8C8C8C'>in</text>";
    // branch: leaves the path low, returns high
    s += "<path d='M " + SPINE_X + " 168 H " + BR + " V 82 H " + SPINE_X +
         "' fill='none' stroke='#C6BBDD' stroke-width='2.4'/>";
    s += "<circle cx='" + SPINE_X + "' cy='82' r='7' fill='none' stroke='#8C77BC' stroke-width='2.2'/>";
    s += "<text x='" + (SPINE_X + 1) + "' y='86' text-anchor='middle' font-size='11' fill='#8C77BC'>+</text>";
    s += box(BR - 46, 108, 92, 34, '#3E6491', 'sub-layer F');
    if (m.onPath) s += box(SPINE_X - 46, 44, 92, 26, '#6E8C66', 'Norm');
    if (m.pre)  s += box(BR - 150, 155, 78, 26, '#6E8C66', 'Norm');
    if (m.post) s += box(BR - 150, 69, 78, 26, '#6E8C66', 'Norm');
    s += "<text x='560' y='196' font-size='12' font-weight='600' fill='#3F3F3F'>" + m.name + "</text>";
    s += "<text x='560' y='214' font-size='10.5' fill='#7A7A7A'>" + m.users + "</text>";
    s += "<text x='560' y='232' font-size='10.5' fill='#8C77BC'>" + m.formula + "</text>";
    scene.innerHTML = s;
    wOut.textContent = m.name;
    lOut.textContent = 'L = ' + L;
    var grow = m.onPath ? 1 : Math.sqrt(1 + L);
    note.textContent = m.onPath
      ? 'The stream is rinsed at every layer, so it stays at 1.00\u00d7 however deep the '
        + 'model gets \u2014 and the gradient is undamped, which is what warm-up is for.'
      : 'The main path is clear, so the gradient reaches the bottom having passed through '
        + 'nothing \u2014 and the stream reaches ' + grow.toFixed(1) + '\u00d7 its starting size at L = '
        + L + '. ' + (m.post
          ? 'Normalizing the branch output bounds what gets written into it.'
          : 'Nothing here bounds what the branch writes into the stream.');
  }
  wR.addEventListener('input', draw);
  lR.addEventListener('input', draw);
  draw();
})();
</script>

So "moving it back" needs qualifying. Only DeepNet went back literally; the
others leave the residual path clean and move the normalizer *within* the
branch. What was recovered is post-norm's restraint, not its position.

## 5. What a Stack of Random Matrices Knows

Both claims are checkable in a toy: random linear sub-layers, stacked two ways.

```python
def pre_norm_step(x, W):
    return x + W @ norm(x)          # main path untouched

def post_norm_step(x, W):
    return norm(x + W @ x)          # main path renormalized
```

<div class='knob'>
    <svg viewBox='0 0 720 250' id='stk-svg' role='img'
         aria-label='Measured last-layer gradient against depth for both arrangements, drawn against the closed-form curves.'>
        <g id='stk-scene'></g>
    </svg>
    <div class='controls'>
        <label for='stk-l'>depth $L$</label>
        <input type='range' id='stk-l' min='2' max='128' value='64'>
        <span class='readout' id='stk-l-out'></span>
    </div>
    <div class='controls'>
        <label for='stk-d'>width $d$</label>
        <input type='range' id='stk-d' min='3' max='9' value='6'>
        <span class='readout' id='stk-d-out'></span>
    </div>
    <p class='note' id='stk-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 6.</span>
    Measured live. Dots are a run over random Gaussian sub-layers; the
    dashed lines are $1/\sqrt{L+1}$ and $1/\sqrt{2}$, fitted to nothing.
    Widening $d$ tightens the dots onto them. Note what does *not* happen to
    the <span style='color:#3E6491'><b>post-norm</b></span> line as depth
    changes.
</div>
<script>
(function () {
  var scene = document.getElementById('stk-scene'),
      lR = document.getElementById('stk-l'), dR = document.getElementById('stk-d'),
      lOut = document.getElementById('stk-l-out'), dOut = document.getElementById('stk-d-out'),
      note = document.getElementById('stk-note');
  var X0 = 66, X1 = 700, Y0 = 196, YTOP = 24;

  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  // A stack of random linear sub-layers, W ~ N(0, 1/d), stacked both ways.
  // Only the two things section 2 predicts are measured: how the stream grows
  // and what the final normalizer does to the gradient.
  function run(L, d, pre) {
    var x = new Float64Array(d), i, l, last = 1;
    for (i = 0; i < d; i++) x[i] = gauss();
    var scale = 1 / Math.sqrt(d);
    for (l = 0; l < L; l++) {
      var inp = x, n = 0;
      if (pre) { n = 0; for (i = 0; i < d; i++) n += x[i] * x[i];
                 n = Math.sqrt(n / d); inp = x.map(function (t) { return t / n; }); }
      var out = new Float64Array(d);
      for (i = 0; i < d; i++) {
        var acc = 0;
        for (var j = 0; j < d; j++) acc += gauss() * scale * inp[j];
        out[i] = acc;
      }
      if (pre) { for (i = 0; i < d; i++) x[i] = x[i] + out[i]; }
      else {
        var y = new Float64Array(d), m = 0;
        for (i = 0; i < d; i++) { y[i] = x[i] + out[i]; m += y[i] * y[i]; }
        // What the last normalizer divides by is the size of the sum going
        // *into* it, not the unit-size vector coming out. Measuring after the
        // division would report 1.000 for every depth, which is the shape of
        // the answer but not the number.
        last = Math.sqrt(d) / Math.sqrt(m);
        m = Math.sqrt(m / d);
        for (i = 0; i < d; i++) x[i] = y[i] / m;
      }
    }
    if (!pre) return last;
    var nn = 0;
    for (i = 0; i < d; i++) nn += x[i] * x[i];
    // the final normalizer contributes sqrt(d)/||x||, which is the damping
    return Math.sqrt(d) / Math.sqrt(nn);
  }
  function draw() {
    var L = +lR.value, d = Math.pow(2, +dR.value);
    var pts = [], i;
    var xs = [];
    for (i = 2; i <= L; i = Math.ceil(i * 1.7)) xs.push(i);
    if (xs[xs.length - 1] !== L) xs.push(L);
    function px(l) { return X0 + Math.log(l) / Math.log(Math.max(3, L)) * (X1 - X0); }
    function py(v) { return Y0 - v / 1.15 * (Y0 - YTOP); }
    var s = '', k;
    for (k = 0; k <= 4; k++) {
      var v = 1.15 * k / 4;
      s += "<line class='grid' x1='" + X0 + "' y1='" + py(v).toFixed(1) + "' x2='" + X1 +
           "' y2='" + py(v).toFixed(1) + "'/><text class='tick' x='" + (X0 - 8) +
           "' y='" + (py(v) + 3).toFixed(1) + "' text-anchor='end'>" + v.toFixed(2) + "</text>";
    }
    var theory = [];
    for (k = 2; k <= L; k++) theory.push(px(k).toFixed(1) + ',' + py(1 / Math.sqrt(k + 1)).toFixed(1));
    s += "<polyline points='" + theory.join(' ') + "' fill='none' stroke='#8C77BC' " +
         "stroke-width='1.6' stroke-dasharray='5 3'/>";
    s += "<line x1='" + X0 + "' y1='" + py(1 / Math.SQRT2).toFixed(1) + "' x2='" + X1 +
         "' y2='" + py(1 / Math.SQRT2).toFixed(1) + "' stroke='#3E6491' stroke-width='1.6' stroke-dasharray='5 3'/>";
    var lastPre = 0, lastPost = 0;
    xs.forEach(function (l) {
      var a = run(l, d, true), b = run(l, d, false);
      lastPre = a; lastPost = b;
      s += "<circle cx='" + px(l).toFixed(1) + "' cy='" + py(a).toFixed(1) +
           "' r='4' fill='#8C77BC'/>";
      s += "<circle cx='" + px(l).toFixed(1) + "' cy='" + py(b).toFixed(1) +
           "' r='4' fill='#3E6491'/>";
      s += "<text class='tick' x='" + px(l).toFixed(1) + "' y='" + (Y0 + 16) +
           "' text-anchor='middle'>" + l + "</text>";
    });
    s += "<text class='axlabel' x='" + X0 + "' y='232'>depth $L$, log spaced &#8594;</text>";
    scene.innerHTML = s;
    lOut.textContent = 'L = ' + L;
    dOut.textContent = 'd = ' + d;
    note.textContent = 'At L = ' + L + ': pre-norm measured ' + lastPre.toFixed(3) +
      ' against a predicted ' + (1 / Math.sqrt(L + 1)).toFixed(3) +
      '; post-norm measured ' + lastPost.toFixed(3) + ' against 1/\u221a2 = 0.707.';
  }
  lR.addEventListener('input', draw);
  dR.addEventListener('input', draw);
  draw();
})();
</script>

This is the *mechanism* behind Theorem 1, not the theorem: no attention, no
nonlinearity, no data, and the damping needs none of them. One honesty note —
nothing here is unstable, so it says nothing about post-norm's difficulty.

## 6. Chat This Over With Friends

In one sentence: moving the normalizer one step earlier — off the main path
and into the residual branch — is most of the reason anyone can train a
hundred-layer transformer. The mechanism is simple enough to carry around.
Under pre-norm nothing rescales the main path, so the vector travelling up it
accumulates, growing like $\sqrt{L}$; a 64-layer model arrives carrying
something eleven times larger than it started with. The last thing the network
does is normalize, dividing by that size, so every gradient is damped by
roughly $1/\sqrt{L}$ before a single training step. That is the whole of the
2020 theorem, and a stack of random matrices reproduces both halves.

The conclusion people draw is usually too strong. It is often said pre-norm
let us delete learning-rate warm-up, and every large model named here still
warms up; what changed is that its length and peak stopped being choices that
could sink a run. The better thing to raise is that the field has been walking
the decision back since about 2022. DeepNet made post-norm trainable at a
thousand layers; OLMo 2 and Gemma normalize *after* the sub-layer again, and
OLMo 2 reports this only works paired with normalizing the attention queries
and keys. Nobody put the normalizer back on the main path — what got recovered
was post-norm's restraint, not its position.

## 7. References

1. Vaswani, A., et al. (2017). Attention Is All You Need.
   [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
2. Xiong, R., et al. (2020). On Layer Normalization in the Transformer
   Architecture. *ICML*. [arXiv:2002.04745](https://arxiv.org/abs/2002.04745)
3. Wang, H., et al. (2022). DeepNet: Scaling Transformers to 1,000 Layers.
   [arXiv:2203.00555](https://arxiv.org/abs/2203.00555)
4. Liu, Z., et al. (2022). Swin Transformer V2. *CVPR*.
   [arXiv:2111.09883](https://arxiv.org/abs/2111.09883)
5. OLMo Team (2025). 2 OLMo 2 Furious.
   [arXiv:2501.00656](https://arxiv.org/abs/2501.00656)

[^warmup]: Warm-up is not *only* about placement. Liu et al. (2019) argued it
    compensates for the variance of Adam's adaptive learning rate early on;
    Xiong et al. note it helps other optimizers too. Both effects are probably
    real.
