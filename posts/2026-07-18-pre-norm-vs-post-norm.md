---
title: Pre-Norm vs. Post-Norm
subtitle: Moving the normalizer off the main path is what made deep transformers trainable, and the argument over where to put it instead is still going.
date: 2026-07-18
tags: llm
icon: 🍵
length: long
---

I want to write about a decision that looks like nothing at all: which of
three operations in a transformer layer happens first.

A layer has three moving parts. There is a sub-layer that does the actual work
— attention, or a small feed-forward network. There is a **residual
connection**, which adds that work back onto what came in. And there is a
**normalizer**, which rescales the numbers so they cannot run away. There are
only a couple of sensible orders to put those in, and choosing between them
sounds like the kind of thing you would settle by taste.

It is not. Moving the normalizer from after the addition to before the
sub-layer is most of the reason anyone can train a hundred-layer transformer
at all, and for three years before somebody worked out why, the entire field
was performing a ritual at the start of every training run to paper over the
difference. What I like about this story is that the explanation, when it
came, was one line of algebra that anybody could have written down.

I will assume no background. We start with the shape of a layer.

[TOC]

## The Normalizer Steps Aside

Here are the two arrangements, side by side. I would look at them for a
moment before reading on, because almost everything below is a consequence of
the difference between these two pictures.

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

For three years, training a transformer meant performing a ritual that nobody
could account for. The boxes below are the dates; the labels above the arrows
are what forced each move.

<div class='roadmap'>
    <svg viewBox='0 0 760 423' role='img' aria-label='Roadmap of normalizer placement: warm-up appears in 2017, the rearrangement spreads in 2018 to 2019, Xiong et al. explain it in 2020, pre-norm is the default after.'>
      <path class='spine' d='M99.4,211.9 Q380.1,212.7 660.8,211.8'/>
      <path class='head' d='M179.8,211.0 Q192.5,210.9 205.3,211.4'/>
      <path class='head' d='M180.0,211.8 Q193.0,211.9 206.0,211.5'/>
      <path class='head' d='M205.7,211.8 Q203.7,213.6 201.5,215.3'/>
      <path class='head' d='M205.4,211.1 Q202.9,209.9 200.3,209.1'/>
      <text class='why' x='193.0' y='182.5'>nobody could say what</text>
      <text class='why' x='193.0' y='200.5'>it was for</text>
      <path class='head' d='M366.6,211.4 Q379.7,211.7 392.7,211.4'/>
      <path class='head' d='M366.4,211.0 Q379.7,211.7 393.0,211.9'/>
      <path class='head' d='M393.3,211.0 Q390.2,212.4 387.3,214.3'/>
      <path class='head' d='M392.7,211.4 Q390.1,210.5 387.8,209.0'/>
      <text class='why' x='380.0' y='182.5'>it worked,</text>
      <text class='why' x='380.0' y='200.5'>unexplained</text>
      <path class='head' d='M554.2,211.6 Q567.4,211.7 580.5,211.5'/>
      <path class='head' d='M553.8,211.6 Q566.9,211.3 580.1,211.4'/>
      <path class='head' d='M579.5,211.7 Q576.7,212.8 574.4,214.7'/>
      <path class='head' d='M580.2,211.1 Q578.0,209.6 575.4,208.7'/>
      <text class='why' x='567.0' y='182.5'>a folk remedy becomes</text>
      <text class='why' x='567.0' y='200.5'>a rule</text>
      <g class='stop'>
        <rect class='hit' x='15.0' y='0.0' width='356.0' height='155.5'/>
        <path class='stem' d='M99.0,154.9 Q99.4,183.2 98.9,211.6'/>
        <circle class='dot' cx='99.5' cy='211.5' r='5'/>
        <path class='box' d='M23.1,-0.1 Q192.5,-1.0 361.9,-0.1 Q370.9,-0.1 370.9,8.9 Q370.8,77.4 370.9,146.0 Q370.9,155.0 361.9,155.0 Q192.5,154.4 23.1,155.0 Q14.1,155.0 14.1,146.0 Q13.2,77.4 14.1,8.9 Q14.1,-0.1 23.1,-0.1'/>
        <path class='box' d='M23.8,-0.5 Q193.1,0.2 362.4,-0.5 Q371.4,-0.5 371.4,8.5 Q371.8,77.4 371.4,146.3 Q371.4,155.3 362.4,155.3 Q193.1,155.1 23.8,155.3 Q14.8,155.3 14.8,146.3 Q14.3,77.4 14.8,8.5 Q14.8,-0.5 23.8,-0.5'/>
        <text class='yr' x='29.0' y='21.0'>2017</text>
        <text class='stage' x='29.0' y='45.0'>warm-up appears</text>
        <circle class='bul' cx='33.0' cy='63.0' r='2'/>
        <text class='body' x='42.0' y='67.0'>the Transformer needs a ramped learning</text>
        <text class='body' x='42.0' y='86.5'>rate</text>
        <circle class='bul' cx='33.0' cy='102.0' r='2'/>
        <text class='body' x='42.0' y='106.0'>4,000 steps, with no reason given</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='15.0' y='267.5' width='356.0' height='155.5'/>
        <path class='stem' d='M286.0,266.8 Q286.0,239.2 286.9,211.5'/>
        <circle class='dot' cx='286.5' cy='211.5' r='5'/>
        <path class='box' d='M24.7,268.2 Q193.3,268.5 361.9,268.2 Q370.9,268.2 370.9,277.2 Q370.3,345.7 370.9,414.2 Q370.9,423.2 361.9,423.2 Q193.3,422.9 24.7,423.2 Q15.7,423.2 15.7,414.2 Q16.1,345.7 15.7,277.2 Q15.7,268.2 24.7,268.2'/>
        <path class='box' d='M23.3,267.3 Q192.7,267.5 362.1,267.3 Q371.1,267.3 371.1,276.3 Q370.3,345.5 371.1,414.7 Q371.1,423.7 362.1,423.7 Q192.7,422.8 23.3,423.7 Q14.3,423.7 14.3,414.7 Q14.0,345.5 14.3,276.3 Q14.3,267.3 23.3,267.3'/>
        <text class='yr' x='29.0' y='288.5'>2018-19</text>
        <text class='stage' x='29.0' y='312.5'>the block is rearranged</text>
        <circle class='bul' cx='33.0' cy='330.5' r='2'/>
        <text class='body' x='42.0' y='334.5'>normalize before the sublayer, not after</text>
        <circle class='bul' cx='33.0' cy='350.0' r='2'/>
        <text class='body' x='42.0' y='354.0'>training gets stable; the folklore</text>
        <text class='body' x='42.0' y='373.5'>spreads</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='0.0' width='356.0' height='155.5'/>
        <path class='stem' d='M473.1,156.1 Q473.9,184.0 474.1,211.9'/>
        <circle class='dot' cx='473.5' cy='211.5' r='5'/>
        <path class='box' d='M397.4,-0.7 Q566.7,0.1 736.1,-0.7 Q745.1,-0.7 745.1,8.3 Q745.7,77.6 745.1,146.9 Q745.1,155.9 736.1,155.9 Q566.7,155.8 397.4,155.9 Q388.4,155.9 388.4,146.9 Q388.2,77.6 388.4,8.3 Q388.4,-0.7 397.4,-0.7'/>
        <path class='box' d='M397.8,0.1 Q566.8,0.2 735.8,0.1 Q744.8,0.1 744.8,9.1 Q744.2,78.2 744.8,147.4 Q744.8,156.4 735.8,156.4 Q566.8,156.2 397.8,156.4 Q388.8,156.4 388.8,147.4 Q388.6,78.2 388.8,9.1 Q388.8,0.1 397.8,0.1'/>
        <text class='yr' x='403.0' y='21.0'>2020</text>
        <text class='stage' x='403.0' y='45.0'>Xiong et al. explain it</text>
        <circle class='bul' cx='407.0' cy='63.0' r='2'/>
        <text class='body' x='416.0' y='67.0'>post-norm gradients grow with depth at</text>
        <text class='body' x='416.0' y='86.5'>init</text>
        <circle class='bul' cx='407.0' cy='102.0' r='2'/>
        <text class='body' x='416.0' y='106.0'>pre-norm gradients do not</text>
        <circle class='bul' cx='407.0' cy='121.5' r='2'/>
        <text class='body' x='416.0' y='125.5'>so the warm-up was patching a real</text>
        <text class='body' x='416.0' y='145.0'>problem</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='389.0' y='267.5' width='356.0' height='155.5'/>
        <path class='stem' d='M660.7,267.3 Q660.4,239.7 660.4,212.1'/>
        <circle class='dot' cx='660.5' cy='211.5' r='5'/>
        <path class='box' d='M397.2,267.6 Q566.8,267.3 736.4,267.6 Q745.4,267.6 745.4,276.6 Q745.5,345.0 745.4,413.5 Q745.4,422.5 736.4,422.5 Q566.8,421.8 397.2,422.5 Q388.2,422.5 388.2,413.5 Q387.9,345.0 388.2,276.6 Q388.2,267.6 397.2,267.6'/>
        <path class='box' d='M398.5,268.4 Q566.9,267.9 735.3,268.4 Q744.3,268.4 744.3,277.4 Q744.3,345.8 744.3,414.3 Q744.3,423.3 735.3,423.3 Q566.9,423.0 398.5,423.3 Q389.5,423.3 389.5,414.3 Q389.9,345.8 389.5,277.4 Q389.5,268.4 398.5,268.4'/>
        <text class='yr' x='403.0' y='288.5'>2020-</text>
        <text class='stage' x='403.0' y='312.5'>pre-norm by default</text>
        <circle class='bul' cx='407.0' cy='330.5' r='2'/>
        <text class='body' x='416.0' y='334.5'>GPT-3, LLaMA, PaLM and the rest adopt it</text>
        <circle class='bul' cx='407.0' cy='350.0' r='2'/>
        <text class='body' x='416.0' y='354.0'>post-norm survives in a few places</text>
      </g>
    </svg>
</div>

The ritual is **learning-rate warm-up**, and if you have not met it, it is
this. Training a network means repeatedly nudging its weights in the direction
that reduces the error, and the size of the nudge is the learning rate. Warm-up
means starting that rate at almost zero and raising it over the first few
thousand steps instead of using the intended value immediately.

It was not optional. Use too few warm-up steps and the optimization simply
diverges; the final quality is sensitive both to how many steps you use and to
how high you go. So the field was paying a cost at the start of every run, and
tuning two interacting knobs to do it, with no account of what either knob was
for. The two arrangements now have names, from the paper that finally
explained it: Xiong and colleagues call them **Post-LN** and **Pre-LN**.

## 2. The One Road Every Layer Writes To

Before the algebra I want to give you the picture it is about, because the
algebra is one line and the picture is the part that stays with you.

Think of a token's vector — its list of numbers — as travelling up through the
model on a single road. It enters at the bottom, and every layer writes
something onto it. This road is the **residual stream**.

The reason it exists is worth knowing. Early deep networks did not have one:
each layer replaced its input with something new. Those networks were very
hard to train, because a training signal has to travel all the way back down
from the output to the first layer, and passing through fifty replacements
leaves it unrecognizable.

The residual connection fixes this by making every layer *additive*. What a
layer computes is added to what was already there, so there is always a
straight, uninterrupted path from the top of the model to the bottom, and the
training signal can travel down it without being mangled.

Now put the normalizer in. Its job is to stop the numbers on the road growing
without limit, and it does that by measuring how large they are and dividing
back down. And here is the whole question of this post: **do you put the
normalizer in the road, or beside it?**

Post-norm puts it in the road. Each layer takes what is there, adds its
contribution, then normalizes the total — so the road is interrupted, twice a
layer, by an operation that rescales everything travelling on it. Pre-norm
moves it into the branch. Each layer takes a *copy* of what is on the road,
normalizes the copy, computes with it, and adds the result back to the road,
which is never touched.

That is the difference. The road is either clear or it is not, and a signal
travelling back down a clear road arrives in better condition. What took three
years to notice is that this also has a consequence going *forwards*, and that
the forwards consequence is what the warm-up was for.

## 3. The Stream That Only Rises

Everything now follows from one line of algebra, and I should say up front
that all of it is about the network at **initialization** — before any
training has happened, when the weights are still random. With $F_l$ the
$l$-th sub-layer and $N$ the normalizer, **post-norm** puts $N$ outside the
addition and **pre-norm** puts it inside:

$$
x_{l+1} = N\big(x_l + F_l(x_l)\big)
\qquad\text{versus}\qquad
x_{l+1} = x_l + F_l\big(N(x_l)\big), \quad x_{\text{out}} = N(x_{L}).
$$

Now follow the size of what is on the road, written $\|x_l\|$. Under post-norm
the last operation in every layer is $N$, so the size is reset every layer and
sits at $\sqrt{d}$ forever. Under pre-norm nothing ever rescales the road, so
every layer's contribution simply accumulates on it. At initialization those
contributions are independent of one another, which means they add the way
independent random vectors add: their *squared* lengths sum.

$$
\|x_L\|^2 \;\approx\; \|x_0\|^2 + \sum_{l=0}^{L-1}\|F_l\|^2 \;\approx\; (L+1)\,d .
$$

**The pre-norm residual stream grows like $\sqrt{L}$.** That is not a subtle
effect. A 64-layer model makes 128 residual writes — two per layer — and what
arrives at the top is about eleven times the size of what started at the
bottom. Nothing is broken by this; the numbers are simply much larger up
there than down here, and no part of the architecture is trying to stop them.

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

One detail I would not skip: the growth follows from how the weights are
initialized, not from the architecture, which is why the second slider can
switch it off. GPT-2 cancelled it deliberately, scaling the residual weights
by $1/\sqrt{N}$, two years before anybody published an explanation of what
that was doing.

Now the consequence, which is the part worth carrying. The last thing a pre-
norm network does, after every layer has written to the road, is normalize.
Normalizing means dividing by the size of what is there — and we have just
established that in a deep model, what is there is $\sqrt{L}$ times larger
than it should be.

So that final division is by a large number, and because a gradient travelling
backwards has to pass back through it, every gradient in the network is
multiplied by roughly $1/\sqrt{L+1}$ on its way out.

**The deeper a pre-norm model is, the harder its own final normalization damps
every gradient in it.** Post-norm has no such term, because post-norm never
let the road grow in the first place. That is Theorem 1 of Xiong et al. I
should add the caveat they add: both sides are *upper* bounds, so the theorem
does not by itself prove a separation. What carries the separation is the
measurement in the next section.[^warmup]

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

## 4. Where the Gradient Piles Up

The theorem is about the last layer. What happens across all of them is
measured rather than derived, and I want to show it to you because it does
*not* say what section 3 would lead you to expect.

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

So the honest summary is that the road being clear is the mechanism, and it is
not a metaphor: the main path in Figure 1(b) really is a sum, with no
nonlinearity and no rescaling anywhere along it, where post-norm has $L$
normalizers standing in it. What warm-up was doing was holding the learning
rate small enough that a post-norm network could survive the early steps in
which its gradients are wild. Pre-norm does not need that because its
gradients are not wild — merely, at depth, quiet.

One thing I should not overstate: nobody established that pre-norm is *better*
in the sense of reaching a better model. Xiong et al. showed it reaching
comparable results faster, and without the ritual. That is the claim, and it
is the claim that won.

## 5. The Slow Walk Back

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

## 6. What a Stack of Random Matrices Knows

I have made two quantitative claims — that the stream grows like $\sqrt{L}$
and that the final normalization damps gradients by $1/\sqrt{L+1}$ — and both
are checkable in something small enough to fit in a paragraph. No attention,
no data, no training: just random linear sub-layers, stacked the two ways.

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
  // Only the two things section 3 predicts are measured: how the stream grows
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

What that shows is the *mechanism* behind Theorem 1 rather than the theorem
itself, and I think the mechanism is the more useful thing to hold. There is
no attention here, no nonlinearity, no data and no learning, and the damping
appears anyway. It is a property of the arithmetic of stacking, not of
anything a transformer does in particular.

One honesty note, because it cuts the other way. Nothing in this toy is
unstable — the post-norm stack sits there perfectly well — so it says nothing
at all about why post-norm is hard to train. It demonstrates pre-norm's cost,
not post-norm's.

### Where This Sits Now

If you are heading into research, the thing to take from this is that a
component's *position* can matter as much as what it computes, and that the
field spent three years treating a symptom of a position choice as a
hyper-parameter.

The specific arrangement is settled at the boundaries and open in the middle.
Nobody is putting the normalizer back on the main path — the clean residual
stream is now something everything else assumes, including every
interpretability method that reads the stream directly.

But the question of how to bound what gets *written* to it is live: Peri-LN,
reordered norm, and query-key normalization are all recent attempts, and OLMo
2's finding that theirs only works in combination is the kind of result that
suggests nobody has the underlying principle yet. The other reason this stays
interesting is depth. Every argument above gets worse as $L$ grows, so if
models get much deeper rather than merely wider, this becomes a live problem
again rather than a settled one.

## 7. Chat This Over With Friends

In one sentence: moving the normalizer one step earlier — off the main path
and into the side branch — is most of the reason anybody can train a
hundred-layer transformer. The mechanism is simple enough to carry around in
your head. A token's vector travels up the model on a single road that every
layer adds to, and under pre-norm nothing along that road ever rescales it, so
it accumulates, growing like the square root of the depth. A 64-layer model
arrives at the top carrying something about eleven times larger than what
started at the bottom. The last thing the network does is normalize, which
means divide by that size — so every gradient in the model is damped by
roughly one over the square root of the depth before a single training step
has happened. That is the whole of the 2020 theorem, and a stack of random
matrices with no data in it reproduces both halves.

The conclusion people usually draw from this is a little too strong. You will
hear that pre-norm let the field delete learning-rate warm-up, and every large
model named in this post still warms up; what actually changed is that the
warm-up's length and peak stopped being choices that could sink a run. The
more interesting thing to raise is that the field has been quietly walking the
decision back since about 2022. DeepNet made post-norm trainable at a thousand
layers; Gemma 2 normalizes both ends of each branch, and OLMo 2 normalizes
after the sub-layer again — while reporting that this only works when paired
with normalizing attention's queries and keys, which is not the sound of a
solved problem. What nobody has done is put the normalizer back on the main
path. The road stays clear. What got recovered was post-norm's restraint, not
its position.

## 8. References

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
