---
title: FFN-SwiGLU
subtitle: The feed-forward layer holds most of a transformer's parameters, and the field demoted its activation to a gate that nobody can explain.
date: 2026-07-27
tags: llm
icon: 🍵
length: long
draft: true
---

Attention gets the attention. It is the part of a transformer with the famous
paper and the famous name, and if you have read one explanation of these
models it was probably about that.

So I want to write about the other part — the one that holds most of the
parameters. After attention has run, every layer contains a second block, and
in a modern model something like two thirds of the weights are in it. For
years its design did not change at all: two matrices with a nonlinearity
wedged between them, the same arrangement neural networks have used since the
1980s.

Then in 2020 Noam Shazeer put a gate inside it, in a way carefully arranged to
cost nothing, and essentially every model released since has copied him. What
I find wonderful about this is the paper's own conclusion, which I will quote
in full later: it declines to explain why the change works. It is still
unexplained. It is also in the model you used this morning.

I am going to assume no background at all, so I will start with what this
block is and where it sits.

[TOC]

## The Widest Place a Token Ever Goes

A transformer is a stack of identical layers, and each layer does two things
in turn.

The first is **attention**, which moves information *between* words: it lets
each word look at the others and take something from them. The second is the
**feed-forward network**, which does the opposite. It never looks sideways at
all. It takes each word's vector on its own, entirely ignorant of the rest of
the sentence, and puts it through the same small network every other word goes
through.

That small network has a distinctive shape, and the shape is the whole subject
of this post. It takes the word's vector — 4,096 numbers, in the model I will
use throughout — and multiplies it by a matrix that expands it to something
much wider, typically four times as wide. It does something nonlinear in that
wide space. Then it multiplies by a second matrix that brings it back down to
4,096 and adds the result to what was already there.

Two questions are worth holding while you look at the picture below. Why
expand at all, if you are only going to come back down? And what is the
nonlinear thing in the middle actually for? The answer to the first is that a
matrix on its own can only mix a word's numbers together in fixed proportions;
the interesting behaviour lives in the nonlinear step, and the expansion gives
that step more room to work in.

The answer to the second is the rest of this post — because in 2020 the field
changed its mind about what that middle step is for, and demoted it from the
thing doing the work to something more like a tap.

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

The pieces were lying around for years before anybody assembled them, and not
in the order the usual telling implies.

<div class='roadmap'>
    <svg viewBox='0 0 760 459' role='img' aria-label='Roadmap of the feed-forward layer: a gate arrives in 2016, the Transformer ships a plain two-matrix FFN in 2017, Shazeer puts the gate inside it in 2020, and LLaMA makes that the default.'>
      <path class='spine' d='M99.5,230.0 Q380.0,229.3 660.5,229.6'/>
      <path class='head' d='M180.0,228.9 Q192.7,229.0 205.4,229.0'/>
      <path class='head' d='M180.6,229.4 Q193.6,229.9 206.6,229.4'/>
      <path class='head' d='M206.7,229.1 Q203.5,230.9 200.6,233.1'/>
      <path class='head' d='M206.6,229.0 Q203.7,227.9 200.9,226.6'/>
      <text class='why' x='193.0' y='182.5'>built for</text>
      <text class='why' x='193.0' y='200.5'>convolutions, not</text>
      <text class='why' x='193.0' y='218.5'>attention</text>
      <path class='head' d='M366.8,229.1 Q380.2,229.5 393.6,228.9'/>
      <path class='head' d='M367.2,229.8 Q380.2,230.2 393.3,229.9'/>
      <path class='head' d='M393.7,230.0 Q391.3,231.9 388.5,233.2'/>
      <path class='head' d='M392.5,230.0 Q389.8,228.8 387.6,226.8'/>
      <text class='why' x='380.0' y='182.5'>the activation</text>
      <text class='why' x='380.0' y='200.5'>changed; the shape</text>
      <text class='why' x='380.0' y='218.5'>never did</text>
      <path class='head' d='M554.2,229.8 Q567.4,229.9 580.6,229.3'/>
      <path class='head' d='M554.4,229.2 Q567.4,229.4 580.3,229.4'/>
      <path class='head' d='M580.1,230.0 Q577.1,231.1 574.3,232.7'/>
      <path class='head' d='M580.1,228.9 Q577.6,227.6 575.4,226.1'/>
      <text class='why' x='567.0' y='218.5'>it wins, unexplained</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='155.5'/>
        <path class='stem' d='M99.2,155.9 Q99.1,192.6 99.3,229.3'/>
        <circle class='dot' cx='99.5' cy='229.5' r='5'/>
        <path class='box' d='M24.1,-0.4 Q193.1,-1.1 362.1,-0.4 Q371.1,-0.4 371.1,8.6 Q371.0,77.6 371.1,146.5 Q371.1,155.5 362.1,155.5 Q193.1,156.3 24.1,155.5 Q15.1,155.5 15.1,146.5 Q15.5,77.6 15.1,8.6 Q15.1,-0.4 24.1,-0.4'/>
        <path class='box' d='M24.1,-0.4 Q192.9,0.1 361.6,-0.4 Q370.6,-0.4 370.6,8.6 Q369.9,77.2 370.6,145.9 Q370.6,154.9 361.6,154.9 Q192.9,154.7 24.1,154.9 Q15.1,154.9 15.1,145.9 Q15.9,77.2 15.1,8.6 Q15.1,-0.4 24.1,-0.4'/>
        <text class='yr' x='29.0' y='21.0'>2016</text>
        <text class='stage' x='29.0' y='45.0'>a gate appears</text>
        <circle class='bul' cx='33.0' cy='63.0' r='2'/>
        <text class='body' x='42.0' y='67.0'>Dauphin et al. multiply two linear</text>
        <text class='body' x='42.0' y='86.5'>projections</text>
        <circle class='bul' cx='33.0' cy='102.0' r='2'/>
        <text class='body' x='42.0' y='106.0'>one of them squashed</text>
        <circle class='bul' cx='33.0' cy='121.5' r='2'/>
        <text class='body' x='42.0' y='125.5'>it predates the Transformer it ends up</text>
        <text class='body' x='42.0' y='145.0'>inside</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='303.5' width='356.0' height='155.5'/>
        <path class='stem' d='M286.7,304.2 Q286.5,266.5 286.8,228.9'/>
        <circle class='dot' cx='286.5' cy='229.5' r='5'/>
        <path class='box' d='M24.8,303.6 Q193.6,303.5 362.5,303.6 Q371.5,303.6 371.5,312.6 Q370.8,381.2 371.5,449.7 Q371.5,458.7 362.5,458.7 Q193.6,459.4 24.8,458.7 Q15.8,458.7 15.8,449.7 Q15.1,381.2 15.8,312.6 Q15.8,303.6 24.8,303.6'/>
        <path class='box' d='M24.0,302.7 Q193.0,303.6 361.9,302.7 Q370.9,302.7 370.9,311.7 Q370.0,380.7 370.9,449.7 Q370.9,458.7 361.9,458.7 Q193.0,458.1 24.0,458.7 Q15.0,458.7 15.0,449.7 Q15.5,380.7 15.0,311.7 Q15.0,302.7 24.0,302.7'/>
        <text class='yr' x='29.0' y='324.5'>2017</text>
        <text class='stage' x='29.0' y='348.5'>the plain FFN</text>
        <circle class='bul' cx='33.0' cy='366.5' r='2'/>
        <text class='body' x='42.0' y='370.5'>two matrices, widened fourfold</text>
        <circle class='bul' cx='33.0' cy='386.0' r='2'/>
        <text class='body' x='42.0' y='390.0'>a pointwise nonlinearity between them</text>
        <circle class='bul' cx='33.0' cy='405.5' r='2'/>
        <text class='body' x='42.0' y='409.5'>BERT and GPT swap in GELU; the shape</text>
        <text class='body' x='42.0' y='429.0'>stands</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='155.5'/>
        <path class='stem' d='M474.0,154.9 Q473.7,192.0 473.2,229.1'/>
        <circle class='dot' cx='473.5' cy='229.5' r='5'/>
        <path class='box' d='M397.3,0.5 Q567.0,-0.3 736.8,0.5 Q745.8,0.5 745.8,9.5 Q746.5,78.3 745.8,147.0 Q745.8,156.0 736.8,156.0 Q567.0,155.4 397.3,156.0 Q388.3,156.0 388.3,147.0 Q387.5,78.3 388.3,9.5 Q388.3,0.5 397.3,0.5'/>
        <path class='box' d='M397.4,-0.6 Q566.3,-0.2 735.2,-0.6 Q744.2,-0.6 744.2,8.4 Q743.3,77.6 744.2,146.7 Q744.2,155.7 735.2,155.7 Q566.3,156.3 397.4,155.7 Q388.4,155.7 388.4,146.7 Q388.9,77.6 388.4,8.4 Q388.4,-0.6 397.4,-0.6'/>
        <text class='yr' x='403.0' y='21.0'>2020</text>
        <text class='stage' x='403.0' y='45.0'>Shazeer combines them</text>
        <circle class='bul' cx='407.0' cy='63.0' r='2'/>
        <text class='body' x='416.0' y='67.0'>a gated linear unit inside the FFN</text>
        <circle class='bul' cx='407.0' cy='82.5' r='2'/>
        <text class='body' x='416.0' y='86.5'>three matrices, so the width drops to</text>
        <text class='body' x='416.0' y='106.0'>two thirds</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='303.5' width='356.0' height='155.5'/>
        <path class='stem' d='M659.9,302.9 Q659.8,266.1 659.9,229.2'/>
        <circle class='dot' cx='660.5' cy='229.5' r='5'/>
        <path class='box' d='M397.8,302.9 Q567.3,303.1 736.8,302.9 Q745.8,302.9 745.8,311.9 Q746.6,381.1 745.8,450.4 Q745.8,459.4 736.8,459.4 Q567.3,459.3 397.8,459.4 Q388.8,459.4 388.8,450.4 Q388.9,381.1 388.8,311.9 Q388.8,302.9 397.8,302.9'/>
        <path class='box' d='M397.2,302.7 Q566.5,302.1 735.7,302.7 Q744.7,302.7 744.7,311.7 Q745.0,381.1 744.7,450.6 Q744.7,459.6 735.7,459.6 Q566.5,460.5 397.2,459.6 Q388.2,459.6 388.2,450.6 Q387.6,381.1 388.2,311.7 Q388.2,302.7 397.2,302.7'/>
        <text class='yr' x='403.0' y='324.5'>2023-</text>
        <text class='stage' x='403.0' y='348.5'>LLaMA makes it default</text>
        <circle class='bul' cx='407.0' cy='366.5' r='2'/>
        <text class='body' x='416.0' y='370.5'>SwiGLU in LLaMA, Mistral, Qwen, DeepSeek</text>
        <circle class='bul' cx='407.0' cy='386.0' r='2'/>
        <text class='body' x='416.0' y='390.0'>Gemma keeps the GELU-gated variant</text>
      </g>
    </svg>
</div>

The middle arrow needs care, because it would be easy to read it as saying
nobody thought about this block for three years. People *did* revisit the
activation: BERT and GPT both put GELU where the original ReLU had been, and
Shazeer's introduction says so plainly. What went unrevisited was the
*shape* — one matrix up, one activation, one matrix down.

It is worth pausing on how much was riding on that unexamined shape. The
feed-forward block holds about two thirds of the non-embedding parameters in a
decoder-only model: 66.8% of them in LLaMA 7B. (The figure was only 57% in the
2017 encoder-decoder, which spends parameters on cross-attention that a modern
decoder does not have.) The most-copied design decision in the architecture
was also one of the least examined ones.

## 2. A Third Matrix, Paid For in Width

The original layer is two matrices with a rectifier between them. Written
without biases, as T5 does:

$$
\text{FFN}_{\text{ReLU}}(x, W_1, W_2) = \max(xW_1,\, 0)\,W_2 .
$$

Read that as: expand, then set every negative entry to zero, then bring it
back down. The $\max(\cdot, 0)$ is the nonlinear step, and it is a blunt one —
each of the wide layer's units either passes its value along or is switched
off.

A **gated linear unit** replaces the single expansion with two, and uses one
of them to modulate the other. Shazeer's version puts Swish on the gate:

$$
\text{FFN}_{\text{SwiGLU}}(x, W, V, W_2) = \big(\text{Swish}_1(xW) \otimes xV\big)\,W_2,
\qquad \text{Swish}_\beta(x) = x\,\sigma(\beta x),
$$

where $\otimes$ means multiplying entry by entry. That is the whole
definition, and it is worth reading twice, because the same input $x$ now goes
up two separate routes. One route, through $W$, gets squashed by Swish. The
other, through $V$, is left alone. Then the two wide vectors are multiplied
together entry by entry, and the result goes down through $W_2$.

The activation has not been *replaced* so much as demoted. It used to stand
between the two matrices, and everything had to pass through it. Now it stands
to one side and decides, unit by unit, how much of a third matrix's output
gets through. A squashed value near zero closes that unit; a value near one
lets it pass unchanged. It has stopped being the thing that computes and
become the thing that permits.

### Why the width falls to exactly two thirds

Here is the step I would do slowly, because it is the reason the change could
be adopted at all.

Adding a third matrix to a block that holds two thirds of the model's
parameters should be unaffordable — it is half again as many weights in the
largest part of the model. Shazeer's move is to refuse to pay, and to take the
cost out of the *width* instead. The ReLU layer holds two matrices, so
$2\,d\,d_{ff}$ parameters; the gated layer holds three at some new width
$d_{ff}'$, so $3\,d\,d_{ff}'$. Set them equal:

$$
3\,d\,d_{ff}' = 2\,d\,d_{ff} \quad\Longrightarrow\quad d_{ff}' = \tfrac{2}{3}\,d_{ff}.
$$

Notice that $d$ cancels. The rule is not a tuned constant that happens to work
at one scale; it holds at every model size there will ever be, which is why it
survived the jump from a 2020 experiment to models a thousand times larger.
With the customary $d_{ff} = 4d$, the new width is $\tfrac{8}{3}d$. One extra
matrix, paid for entirely in width, at identical parameter count and very
nearly identical arithmetic.

Watch the rule land in a real model. LLaMA 7B has $d = 4096$, so two thirds of
$4d$ is $10{,}922.67$ — not a width anybody can allocate, and not a shape the
hardware would like even if you could. It rounds up to the next multiple of
256, giving **11,008**, which is the number written on Figure 1. That rounding
leaves the layer 0.78% larger than the ReLU version it replaced, which is the
detail that quietly disappears whenever somebody calls the swap exactly free.

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

The gate needs something to squash it, and the candidates form a family worth
knowing, because the difference between them is the difference between the
named variants people argue about.

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

Two things are worth taking from that figure. The first is that the dip is
real rather than a drawing artefact: GELU and Swish are **not monotonic**.
They dip below zero for small negative inputs before coming back up towards
it, which means a slightly negative input produces a slightly negative gate —
a unit that does not merely close but briefly reverses.

The second is that $\beta$ is not really a hyperparameter at all. Because
$\text{Swish}_\beta(xW) = \tfrac{1}{\beta}\text{Swish}_1(x\beta W)$, any value
of $\beta$ can be absorbed by rescaling $W$ and $W_2$ — and those are learned,
so the model can do the rescaling itself during training. That is why Shazeer
fixes it at 1 without comment, and it is a good example of a knob that looks
like a choice and is not.

All of that is one number at a time. What I actually want you to see is what
the gate does to a whole layer of them at once:

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

Now the evidence. This paper has four tables and not a single figure, which is
why Figure 1 in this post is drawn rather than reproduced from it — and it
means the argument is only visible if you read all four.

The interesting thing about them is that no variant wins. On pretraining
perplexity **GEGLU**, the same construction with GELU on the gate, edges
SwiGLU 1.633 to 1.636; but GLUE goes to ReGLU, SuperGLUE to SwiGLU, and SQuAD
to Bilinear, which has no gate nonlinearity at all. Four tables, four
winners.

And the margins are thin: Shazeer measures run-to-run variability only in the
short column, where the GEGLU–SwiGLU gap of 0.002 sits against standard
deviations of 0.004 and 0.010. The fully-trained column is a single run each
with no spread reported at all. The paper establishes a gap between gated and
ungated, and a tie inside the gated family.

Which makes adoption the question, and the usual telling is wrong. It was not
Meta choosing and everyone copying: **PaLM used SwiGLU in April 2022**, a year
before LLaMA, at 540B, and it was Google's — while Google's Gemma ships
**GEGLU** to this day. The split runs inside labs, not between them. LLaMA's
choice mattered because its weights were public, so Mistral, Qwen, DeepSeek
and Phi inherited a recipe, not a measurement.

Which brings me to my favourite last line in the literature. Having introduced
a change that is now in almost every language model in production, Shazeer
closes the paper like this:

> We offer no explanation as to why these architectures seem to work; we
> attribute their success, as all else, to divine benevolence.

I do not think that is false modesty, and people have tried to fill the gap
since. The usual story is that multiplying two projections together makes the
layer *quadratic* in its input where a ReLU layer is piecewise linear, so one
gated layer can express multiplicative interactions between features that a
plain one cannot. That is exactly true of the **Bilinear** variant, which has
no gate nonlinearity at all, and only true near the origin once Swish is
sitting on the gate.

Note the weight the argument has to carry, though. A deep stack of ReLU layers
*approximates* products perfectly well — that is what depth is for. So what is
actually at stake is what a single layer can do at a fixed parameter count,
which is a much narrower claim than "gating adds expressiveness". No account
of this has won consensus, and I would treat anybody who states one
confidently with mild suspicion.

### Where This Sits Now

If you are heading into research, this is the clearest example I know of
something that is universal, load-bearing, and unexplained.

The mechanism itself is settled: every open model of the last three years uses
some member of this family, and nobody is arguing about whether to gate. What
is unsettled is why it helps, and that matters more than it sounds, because
the same block is where two of the field's most active lines of work are
happening.

Mixture-of-experts models make this block sparse — many feed-forward blocks,
only a couple of which run for any given token — which is how the largest
models are built now, and every one of those experts is a SwiGLU. And
interpretability research keeps finding that individual facts and concepts are
stored in this block's wide middle layer rather than in attention. Both lines
are building on a component whose own paper attributes its success to divine
benevolence.

There is also a lesson in the accounting. The reason this change spread is not
that it was better; the tables above barely support that. It is that Shazeer
worked out how to make it *free*, and a free change with a plausible upside
faces almost no resistance. When you propose something, the parameter-matched
version of it is a different proposal from the one that costs more, and only
one of the two will be adopted.

## 5. Chat This Over With Friends

The part of a transformer nobody talks about is where most of its parameters
are. Attention mixes words together; the feed-forward layer that follows it
works on each word alone, and holds roughly two thirds of the non-embedding
weights in a modern model. In 2020 Noam Shazeer changed one thing about it.
Instead of one wide matrix and a squashing function, use *two* wide matrices,
squash one of them, and multiply the two together entry by entry — so the
squashing function stops being the thing that computes and becomes a tap that
decides how much of the other matrix gets through. The elegant part is the
accounting. Three matrices where there were two would cost half again as much,
so you shrink the wide middle to exactly two thirds of its old width, and
because the model width cancels out of that calculation the rule holds at
every scale. In LLaMA 7B it means going up to 11,008 instead of 16,384: the
same budget, spent differently.

What most people get wrong is that a winner was ever established. GEGLU edges
SwiGLU on pretraining perplexity by 0.003, a margin the paper never shows to
be real, and the three downstream tables go to ReGLU, SwiGLU and Bilinear, one
each. Nor was this Meta choosing and the field copying: Google's PaLM shipped
SwiGLU a year before LLaMA, while Google's Gemma ships GEGLU to this day. The
best part is the paper's last line, where Shazeer declines to explain the
result and attributes it "to divine benevolence." People have tried since;
no account has won. A great deal of what runs in production is there because
it works and nobody knows why.

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
