---
title: What the KV Cache Costs
subtitle: The buffer that makes generation affordable is the reason serving a language model is hard.
date: 2026-08-13
tags: llm
icon: 🍵
---

I wrote a post about [the KV cache](/blog/2026/08/13/kv-cache/), which is the
buffer that stops a language model from redoing all of its work every time it
writes a word. That post was about what the cache is and why it is allowed to
exist. This one is about what it costs, which turns out to be a much stranger
subject, and the one that actually occupies people who run these models for a
living.

I will not assume you have read the other post. The next few paragraphs give
you everything you need.

[TOC]

## What We Are Talking About

Let me give you the whole mechanism in a few paragraphs, so that nothing below
depends on your having read anything else.

A language model writes one **token** at a time — a token being a chunk of
text, roughly a word. To choose each one, it looks back over everything
written so far, and the looking-back is done by a mechanism called
**attention**. Attention turns every token into three lists of numbers. The
first says what that token is looking for, the second advertises what it has
to offer, and the third is the content it hands over. They are called the
**query**, the **key** and the **value**. The current token's query is
compared against every earlier token's key, and the resulting scores decide
how much of each value gets blended into the answer.

Two structural facts, because both show up in the arithmetic below. The model
does not run one copy of this across the full width of its vectors — it splits
the width into parallel pieces called **heads**, each with its own learned
projections. And it repeats the whole arrangement at every **layer**, stacked
dozens deep. Llama 3 70B has 80 layers. Modern models use fewer heads for keys
and values than for queries, which is why I will write $n_{kv}$ for the
key-value head count and mention separately that there are usually four or
eight times as many query heads.

Now the important part. A token's key and value depend only on that token and
the ones before it, so once computed they never change. Its query does not
have that property in any useful sense, because a query is used once, at the
step it belongs to, and is never wanted again. So there is an obvious saving
available: store every token's key and value, and reuse them at every later
step instead of recomputing them. That store is the **KV cache**, and it is
the difference between generation costing you the square of the answer's
length and costing you something close to linear in it. I wrote a whole post
about [what it is and why it works](/blog/2026/08/13/kv-cache/); this one
takes it as given.

Per layer, per conversation, the cache holds two tensors of shape
$n_{kv} \times t \times d_h$, where $t$ counts the tokens seen so far and
$d_h$ is how many numbers are in one key. Read that as a stack of rows, one
row per token. Multiply it out over $L$ layers, at $p$ bytes a number, and one
conversation is holding

$$
2 \, L \, n_{kv} \, d_h \, t \, p \quad \text{bytes.}
$$

For Llama 3 8B, with 32 layers, 8 key-value heads and 128 numbers per head,
that comes to 128 KiB for every token. For Llama 3 70B it is 320 KiB, so a
conversation that fills its 128K-token context window — 131,072 tokens, since
these are always powers of two — is sitting on exactly 40 GiB. A **context
window** is just the model's limit on how much text it can consider at once.

Two things about that number matter, and the whole of this post is really
about the second. The first is that it is large. The second is that it belongs
to *one conversation*, and nobody else can touch it.

One last piece of vocabulary, since I will lean on it. Answering happens in
two phases that behave nothing alike. **Prefill** is the model reading your
prompt, which it can do in one pass because the whole prompt is already there.
**Decode** is the model writing the answer, one token at a time, because it
cannot start the second token until it has seen the first. Everything
expensive in this post happens during decode.

<div class='loop-anim'>
    <svg viewBox='0 0 720 210' role='img'
         aria-label='One block of model weights, read by every conversation on the machine, beside four separate key-value caches, one per conversation, each growing on its own and usable by nobody else.'>
        <text class='step' x='8' y='26'>shared by everyone</text>
        <rect class='gu-w' x='8' y='38' width='150' height='150' rx='6'/>
        <text class='gu-lbl' x='83' y='105'>model weights</text>
        <text class='gu-lbl' x='83' y='122' font-weight='400'>read once per step</text>
        <text class='step' x='196' y='26'>one per conversation, shared with nobody</text>
        <rect class='gu-room' x='196' y='38' width='516' height='32' rx='4'/>
        <rect class='gu-c g1' x='198' y='40' width='512' height='28' rx='3'/>
        <rect class='gu-room' x='196' y='78' width='516' height='32' rx='4'/>
        <rect class='gu-c g2' x='198' y='80' width='512' height='28' rx='3'/>
        <rect class='gu-room' x='196' y='118' width='516' height='32' rx='4'/>
        <rect class='gu-c g3' x='198' y='120' width='512' height='28' rx='3'/>
        <rect class='gu-room' x='196' y='158' width='516' height='32' rx='4'/>
        <rect class='gu-c g4' x='198' y='160' width='512' height='28' rx='3'/>
        <text class='note' x='454' y='206'>every one of these has to be read on every single step, too</text>
    </svg>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span>
        The asymmetry this whole post is about. On the left, one set of
        weights, read once per step no matter how many people are being
        served — the more of them there are, the better that bargain looks. On
        the right, one cache per conversation, growing as each one goes on,
        and useful to nobody but its owner. Adding a fifth conversation adds a
        fifth bar, and every bar has to be read on every step.
    </div>
</div>

## 1. Four Ways to Fight the Same Number

The story of the last few years is a sequence of attempts to make that number
smaller, or at least cheaper to live with.

<div class='roadmap'>
    <svg viewBox='0 0 760 194' role='img' aria-label='Roadmap of the fight against the cost of the KV cache: multi-query attention in 2019, grouped-query in 2023, paging in 2023, and latent compression in 2024.'>
      <line class='spine' x1='94.2' y1='40' x2='665.8' y2='40'/>
      <polygon class='head' points='198.5,40 189.5,36 189.5,44'/>
      <text class='why' x='189.5' y='27'>one shared head was too few</text>
      <polygon class='head' points='389.0,40 380.0,36 380.0,44'/>
      <text class='why' x='380.0' y='27'>a smaller cache, still allocated badly</text>
      <polygon class='head' points='579.5,40 570.5,36 570.5,44'/>
      <text class='why' x='570.5' y='27'>better layout, but the tensor was still large</text>
      <g class='stop'>
        <rect class='hit' x='6.0' y='30' width='176.5' height='154.5'/>
        <circle class='dot' cx='94.2' cy='40' r='4.5'/>
        <rect class='box' x='6.0' y='56' width='176.5' height='130.5' rx='7'/>
        <text class='yr' x='94.2' y='65.0'>2019</text>
        <text class='stage' x='94.2' y='79.0'>share one head</text>
        <text class='body' x='94.2' y='97.0'>Multi-query attention gives</text>
        <text class='body' x='94.2' y='111.5'>every query head the same</text>
        <text class='body' x='94.2' y='126.0'>keys and values, dividing</text>
        <text class='body' x='94.2' y='140.5'>the cache by the head</text>
        <text class='body' x='94.2' y='155.0'>count. Quality slips.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='196.5' y='30' width='176.5' height='154.5'/>
        <circle class='dot' cx='284.8' cy='40' r='4.5'/>
        <rect class='box' x='196.5' y='56' width='176.5' height='130.5' rx='7'/>
        <text class='yr' x='284.8' y='65.0'>2023</text>
        <text class='stage' x='284.8' y='79.0'>share a few</text>
        <text class='body' x='284.8' y='97.0'>Grouped-query attention</text>
        <text class='body' x='284.8' y='111.5'>gives each group of query</text>
        <text class='body' x='284.8' y='126.0'>heads its own, uptrained</text>
        <text class='body' x='284.8' y='140.5'>from a normal checkpoint</text>
        <text class='body' x='284.8' y='155.0'>with 5% of pretraining</text>
        <text class='body' x='284.8' y='169.5'>compute. Llama 3 and</text>
        <text class='body' x='284.8' y='184.0'>Mistral ship it.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='387.0' y='30' width='176.5' height='154.5'/>
        <circle class='dot' cx='475.2' cy='40' r='4.5'/>
        <rect class='box' x='387.0' y='56' width='176.5' height='130.5' rx='7'/>
        <text class='yr' x='475.2' y='65.0'>2023</text>
        <text class='stage' x='475.2' y='79.0'>stop reserving it</text>
        <text class='body' x='475.2' y='97.0'>vLLM hands the cache out in</text>
        <text class='body' x='475.2' y='111.5'>small blocks as it is</text>
        <text class='body' x='475.2' y='126.0'>needed, the way an</text>
        <text class='body' x='475.2' y='140.5'>operating system pages</text>
        <text class='body' x='475.2' y='155.0'>memory. Nothing gets</text>
        <text class='body' x='475.2' y='169.5'>smaller.</text>
      </g>
      <g class='stop'>
        <rect class='hit' x='577.5' y='30' width='176.5' height='154.5'/>
        <circle class='dot' cx='665.8' cy='40' r='4.5'/>
        <rect class='box' x='577.5' y='56' width='176.5' height='130.5' rx='7'/>
        <text class='yr' x='665.8' y='65.0'>2024</text>
        <text class='stage' x='665.8' y='79.0'>compress it</text>
        <text class='body' x='665.8' y='97.0'>DeepSeek squeezes the keys</text>
        <text class='body' x='665.8' y='111.5'>and values of a token into</text>
        <text class='body' x='665.8' y='126.0'>one shared latent vector,</text>
        <text class='body' x='665.8' y='140.5'>and reconstructs them on</text>
        <text class='body' x='665.8' y='155.0'>the way in.</text>
      </g>
    </svg>
</div>

I want to point at the third box, because it is the one that surprised me. The
first, second and fourth are all attempts to make the cache *smaller* — fewer
key-value heads, or a compressed stand-in for them. The third makes nothing
smaller at all. It just stops the memory being reserved wastefully, and it
turned out to be worth more than either of the shrinking tricks. I will come
back to it in section 3.

## 2. One Room per Guest, and the Weights Everyone Shares

Let me start with the thing that makes this cost an unusual one.

The **weights** of a model — the numbers it learned during training — are
shared. Every conversation being served runs through the same weights, so a
server handling fifty conversations at once reads them once and lets all fifty
benefit. I would go so far as to say this is why serving models is a business
at all: the expensive asset gets amortised across everybody using it, and the
more people show up, the better the economics look.

The cache is the opposite. Each conversation has its own, it cannot be lent to
anybody else, and it grows for as long as the conversation continues. If the
weights are a building that all the guests share, the cache is a room per
guest, and the rooms get bigger the longer people stay.

<div class='knob'>
    <svg viewBox='0 0 720 250' id='bg-svg' role='img'
         aria-label='The 80 gigabytes of one H100, divided into model weights, the key-value caches of however many conversations fit, and whatever is left over. As the context length grows, fewer conversations fit.'>
        <g id='bg-scene'></g>
    </svg>
    <div class='controls'>
        <label for='bg-m'>model</label>
        <input type='range' id='bg-m' min='0' max='2' value='0' step='1'>
        <span class='readout' id='bg-m-out'></span>
    </div>
    <div class='controls'>
        <label for='bg-l'>tokens in each conversation</label>
        <input type='range' id='bg-l' min='0' max='5' value='2' step='1'>
        <span class='readout' id='bg-l-out'></span>
    </div>
    <p class='note' id='bg-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 2.</span>
    One 80 GB H100, and what it can hold.
    <span style='color:#3E6491'><b>Weights</b></span> are paid for once no
    matter how busy the machine is, and everything left over goes to
    <span style='color:#8C77BC'><b>caches</b></span>, one per conversation. I
    would drag the second slider slowly: the weights never move, and the
    number of people the machine can serve falls off a cliff.
</div>

<script>
(function () {
  var scene = document.getElementById('bg-scene'),
      mR = document.getElementById('bg-m'), lR = document.getElementById('bg-l'),
      mOut = document.getElementById('bg-m-out'), lOut = document.getElementById('bg-l-out'),
      note = document.getElementById('bg-note');
  // layers, kv heads, head dim, parameters. All from the Llama 3 paper.
  var MODELS = [{n: 'Llama 3 8B', L: 32, kv: 8, dh: 128, P: 8.03e9},
                {n: 'Llama 3 70B', L: 80, kv: 8, dh: 128, P: 70.6e9},
                {n: 'Llama 3 405B', L: 126, kv: 8, dh: 128, P: 405.85e9}];
  var LENS = [1024, 4096, 16384, 32768, 65536, 131072];
  var HBM = 80e9, X0 = 24, X1 = 696, Y = 60, H = 52;

  function draw() {
    var m = MODELS[+mR.value], L = LENS[+lR.value];
    var w = m.P * 2;                                  // fp16 weights
    var perSeq = 2 * m.L * m.kv * m.dh * 2 * L;       // bytes of cache per conversation
    var free = HBM - w;
    var fits = Math.max(0, Math.floor(free / perSeq));
    var used = fits * perSeq;
    var s = '';

    if (w >= HBM) {
      s += "<rect x='" + X0 + "' y='" + Y + "' width='" + (X1 - X0) + "' height='" + H +
           "' rx='4' fill='#3E6491' fill-opacity='0.85'/>";
      s += "<text class='wnum' x='" + (X0 + 12) + "' y='" + (Y + 31) + "' fill='#FFFFFF'>" +
           m.n + " does not fit on one card at all (" + (w / 1e9).toFixed(0) + " GB of weights)</text>";
    } else {
      var wx = (X1 - X0) * w / HBM, ux = (X1 - X0) * used / HBM;
      s += "<rect x='" + X0 + "' y='" + Y + "' width='" + wx.toFixed(1) + "' height='" + H +
           "' rx='4' fill='#3E6491' fill-opacity='0.85'/>";
      s += "<rect x='" + (X0 + wx).toFixed(1) + "' y='" + Y + "' width='" + ux.toFixed(1) +
           "' height='" + H + "' rx='0' fill='#8C77BC' fill-opacity='0.85'/>";
      s += "<rect x='" + (X0 + wx + ux).toFixed(1) + "' y='" + Y + "' width='" +
           Math.max(0, (X1 - X0) - wx - ux).toFixed(1) + "' height='" + H +
           "' rx='0' fill='#FFFFFF' stroke='#DEDAD4'/>";
      // one tick per conversation, up to a legible number
      if (fits > 0 && fits <= 64) {
        for (var i = 1; i < fits; i++) {
          var tx = X0 + wx + ux * i / fits;
          s += "<line x1='" + tx.toFixed(1) + "' y1='" + Y + "' x2='" + tx.toFixed(1) +
               "' y2='" + (Y + H) + "' stroke='#FFFFFF' stroke-opacity='0.55'/>";
        }
      }
      s += "<text class='wnum' x='" + (X0 + 10) + "' y='" + (Y + 31) + "' fill='#FFFFFF'>" +
           (w / 1e9).toFixed(0) + " GB</text>";
    }
    s += "<text class='gl' x='" + X0 + "' y='" + (Y - 12) + "'>80 GB of memory on one H100</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y + H + 26) + "'>weights, paid once</text>";
    s += "<text class='axlabel' x='" + (X0 + 220) + "' y='" + (Y + H + 26) +
         "'>one cache per conversation</text>";
    s += "<text class='axlabel' x='" + (X0 + 470) + "' y='" + (Y + H + 26) + "'>unused</text>";
    s += "<text class='hd' x='" + X0 + "' y='" + (Y + H + 62) + "' font-size='26'>" +
         (w >= HBM ? '0' : fits) + "</text>";
    s += "<text class='axlabel' x='" + (X0 + (w >= HBM ? 22 : String(fits).length * 17 + 8)) +
         "' y='" + (Y + H + 62) + "'>conversations fit at once</text>";
    scene.innerHTML = s;
    mOut.textContent = m.n;
    lOut.textContent = (L / 1024) + 'k tokens each';
    note.textContent = w >= HBM
      ? m.n + ' needs ' + (w / 1e9).toFixed(0) + ' GB just for its weights, so it has to be ' +
        'split across several cards before a single conversation can begin.'
      : 'Each conversation of ' + (L / 1024) + 'k tokens carries ' +
        (perSeq / 1e9).toFixed(2) + ' GB of cache, and ' + (free / 1e9).toFixed(0) +
        ' GB is left after the weights, so ' + fits + ' of them fit. ' +
        (fits < 4 ? 'At that point the machine is serving almost nobody, and the weights are ' +
                    'being read for their benefit alone.'
                  : 'Double the context and that number roughly halves.');
  }
  mR.addEventListener('input', draw);
  lR.addEventListener('input', draw);
  draw();
})();
</script>

To see why this hurts more than it looks, I need to tell you one fact about
the hardware. Models are run on **GPUs** — graphics processors, originally built for
rendering, which happen to be very good at doing the same arithmetic to
thousands of numbers at once. On a GPU, moving a number out of memory and into
the part of the chip that does the arithmetic takes time, and it takes far
more time than the arithmetic itself does. An NVIDIA H100 can perform roughly
three hundred arithmetic operations in the time it takes to fetch a single
byte from its memory. The rate at which it can move bytes is called its
**memory bandwidth**.

This is exactly what Noam Shazeer worked out in 2019. The paper that opens the
roadmap above is remembered for multi-query attention, which is the fix it
proposes, but the part I care about here is the diagnosis that comes first. He
computed the ratio of memory access to arithmetic for one step of decoding,
and got

$$
\Theta\!\left(\frac{n}{d} + \frac{1}{b}\right),
$$

where $n$ is the length of the conversation, $d$ is the width of the model,
and $b$ is the number of conversations being served together. (The estimate
assumes $n \le d$; longer conversations only make the first term worse.)

Now think about what a ratio close to one would mean. The chip would be moving
one byte out of memory for every single arithmetic operation it performs. That
is a terrible trade on this hardware. As I said a moment ago, an H100 can do
about three hundred operations in the time it takes to fetch one byte, so at a
ratio of one it is spending almost all of its time waiting for memory to
arrive and almost none of it computing. The machine is idling, and you are
still paying for it by the hour.

Now I would like you to look at the two terms separately, because they behave
completely differently, and the difference between them is the whole problem
this post is about. The $1/b$ term is the
friendly one: serve more conversations at once and it shrinks, because the
weights get read once and shared among all of them. This is why servers batch
requests together, and it is the single most effective thing anybody does. The
$n/d$ term is not friendly at all. It does not shrink with batching, because
every conversation drags its own cache along. Adding a fifty-first conversation
adds a fifty-first cache that has to be read on every step.

You can feel the trade in the figure below. Move the batch size and watch the
throughput climb as the weights get shared out. Then push the context length
out and watch the cache take over the bar underneath, until the curve stops
rising and the machine simply runs out of memory.

<div class='knob'>
    <svg viewBox='0 0 720 290' id='rl-svg' role='img'
         aria-label='Decoding throughput against batch size for a Llama 3 8B shaped model on one H100, with the bytes moved per step split into weights and KV cache.'>
        <g id='rl-scene'></g>
    </svg>
    <div class='controls'>
        <label for='rl-b'>batch size</label>
        <input type='range' id='rl-b' min='1' max='256' value='16'>
        <span class='readout' id='rl-b-out'></span>
    </div>
    <div class='controls'>
        <label for='rl-l'>context length</label>
        <input type='range' id='rl-l' min='0' max='5' value='3' step='1'>
        <span class='readout' id='rl-l-out'></span>
    </div>
    <div class='controls'>
        <label for='rl-k'>key-value heads (32 query heads)</label>
        <input type='range' id='rl-k' min='0' max='5' value='3' step='1'>
        <span class='readout' id='rl-k-out'></span>
    </div>
    <p class='note' id='rl-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 3.</span>
    A Llama 3 8B-shaped model on one H100. I should say plainly that this
    assumes peak bandwidth and peak arithmetic throughput, so it is an upper
    bound on a machine nobody actually has; a real server lands well below it.
    The bar splits the bytes each step has to move into
    <span style='color:#3E6491'><b>weights</b></span>, read once for the whole
    batch, and <span style='color:#8C77BC'><b>cache</b></span>, read once per
    conversation. Nothing anywhere in this range is limited by arithmetic.
</div>

<script>
(function () {
  var scene = document.getElementById('rl-scene'),
      bR = document.getElementById('rl-b'), lR = document.getElementById('rl-l'),
      kR = document.getElementById('rl-k'), note = document.getElementById('rl-note'),
      bOut = document.getElementById('rl-b-out'), lOut = document.getElementById('rl-l-out'),
      kOut = document.getElementById('rl-k-out');
  var LAYERS = 32, DH = 128, DMODEL = 4096, BYTES = 2;
  // Llama 3 8B is 8.03B parameters at 8 KV heads. Moving the slider changes
  // the width of W_K and W_V, so the model itself changes size: 7.80B at MQA,
  // 8.84B at full MHA. The input embedding, 128256 x 4096, is a lookup rather
  // than a matmul, so it is neither streamed nor counted as arithmetic.
  var EMBED = 128256 * DMODEL;
  var BASE = 8.03e9 - 2 * DMODEL * (8 * DH) * LAYERS - EMBED;
  function params(kv) { return BASE + 2 * DMODEL * (kv * DH) * LAYERS; }
  var BW = 3.35e12, FLOPS = 989e12, HBM = 80e9;
  var LENS = [1024, 2048, 4096, 8192, 16384, 32768], KVH = [1, 2, 4, 8, 16, 32];
  var X0 = 62, X1 = 700, Y0 = 190, YTOP = 24, BMAX = 256;

  function perStep(b, L, kv) {
    var P = params(kv);
    var wBytes = P * BYTES;
    var cBytes = b * L * 2 * LAYERS * kv * DH * BYTES;
    var flops = 2 * P * b + 4 * L * DMODEL * LAYERS * b;
    var tMem = (wBytes + cBytes) / BW, tCmp = flops / FLOPS;
    return { w: wBytes, c: cBytes, tMem: tMem, tCmp: tCmp,
             tps: b / Math.max(tMem, tCmp) };
  }

  function draw() {
    var b = +bR.value, L = LENS[+lR.value], kv = KVH[+kR.value];
    var cur = perStep(b, L, kv), s = '', i;
    var top = 0;
    for (i = 1; i <= BMAX; i++) { top = Math.max(top, perStep(i, L, kv).tps); }
    top = Math.max(top, 1) * 1.12;
    function px(v) { return X0 + (v - 1) / (BMAX - 1) * (X1 - X0); }
    function py(v) { return Y0 - v / top * (Y0 - YTOP); }
    for (i = 0; i <= 4; i++) {
      var g = top * i / 4;
      s += "<line class='grid' x1='" + X0 + "' y1='" + py(g).toFixed(1) + "' x2='" + X1 +
           "' y2='" + py(g).toFixed(1) + "'/><text class='tick' x='" + (X0 - 8) + "' y='" +
           (py(g) + 3).toFixed(1) + "' text-anchor='end'>" + Math.round(g) + "</text>";
    }
    var fitPts = [], ghost = [];
    for (i = 1; i <= BMAX; i++) {
      var st = perStep(i, L, kv), pt = px(i).toFixed(1) + ',' + py(st.tps).toFixed(1);
      if (st.w + st.c + EMBED * BYTES <= HBM) { fitPts.push(pt); } else { ghost.push(pt); }
    }
    if (ghost.length && fitPts.length) { ghost.unshift(fitPts[fitPts.length - 1]); }
    if (ghost.length) {
      s += "<polyline points='" + ghost.join(' ') + "' fill='none' stroke='#8C77BC' " +
           "stroke-width='2.4' stroke-opacity='0.35' stroke-dasharray='5 4'/>";
      s += "<text class='tick' x='" + X1 + "' y='" + (YTOP + 10) +
           "' text-anchor='end'>dashed: will not fit in 80 GB</text>";
    }
    s += "<polyline points='" + fitPts.join(' ') + "' fill='none' stroke='#8C77BC' stroke-width='2.4'/>";
    s += "<circle cx='" + px(b).toFixed(1) + "' cy='" + py(cur.tps).toFixed(1) +
         "' r='5' fill='#A8443E' stroke='#FFFFFF' stroke-width='1.6'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (Y0 + 22) + "'>batch size &#8594;</text>";
    s += "<text class='axlabel' x='" + (X0 - 8) + "' y='" + (YTOP - 8) +
         "' text-anchor='end'>tokens/s, all sequences</text>";
    var tot = cur.w + cur.c, BY = 236, W = X1 - X0;
    s += "<rect x='" + X0 + "' y='" + BY + "' width='" + (W * cur.w / tot).toFixed(1) +
         "' height='26' rx='3' fill='#3E6491' fill-opacity='0.85'/>";
    s += "<rect x='" + (X0 + W * cur.w / tot).toFixed(1) + "' y='" + BY + "' width='" +
         (W * cur.c / tot).toFixed(1) + "' height='26' rx='3' fill='#8C77BC' fill-opacity='0.85'/>";
    s += "<text class='axlabel' x='" + X0 + "' y='" + (BY - 7) + "'>bytes moved per decode step: " +
         (tot / 1e9).toFixed(1) + " GB</text>";
    s += "<text class='wnum' x='" + (X0 + 8) + "' y='" + (BY + 17) + "' fill='#FFFFFF'>" +
         (100 * cur.w / tot).toFixed(0) + "%</text>";
    s += "<text class='wnum' x='" + (X1 - 34) + "' y='" + (BY + 17) + "' fill='#FFFFFF'>" +
         (100 * cur.c / tot).toFixed(0) + "%</text>";
    scene.innerHTML = s;
    bOut.textContent = b + ' sequence' + (b === 1 ? '' : 's');
    lOut.textContent = (L / 1024) + 'k tokens';
    kOut.textContent = kv + (kv === 32 ? ' (MHA)' : kv === 1 ? ' (MQA)' : ' (GQA)');
    var fits = (cur.w + cur.c + EMBED * BYTES) <= HBM;
    // The step takes max(tMem, tCmp), not their sum, so quote the ratio of the
    // two and name which one is binding rather than a share of a total that
    // nothing actually pays.
    note.textContent = 'Cache ' + (cur.c / 1e9).toFixed(1) + ' GB against ' +
      (cur.w / 1e9).toFixed(1) + ' GB of weights. Moving those bytes takes ' +
      (cur.tMem / cur.tCmp).toFixed(1) + '\u00d7 longer than the arithmetic, so the ' +
      'step is memory-bound at ' + cur.tps.toFixed(0) + ' tokens/s across the batch ' +
      '\u2014 but ' + (1 / Math.max(cur.tMem, cur.tCmp)).toFixed(0) + ' per sequence, ' +
      'which is what someone waiting for a reply feels. ' + (fits
        ? 'It fits in 80 GB.'
        : 'Weights plus cache need ' + ((cur.w + cur.c) / 1e9).toFixed(0) +
          ' GB and the card has 80 \u2014 the cache runs out of memory before the ' +
          'arithmetic ever becomes the limit.');
  }
  [bR, lR, kR].forEach(function (r) { r.addEventListener('input', draw); });
  draw();
})();
</script>

## 3. The Waste That Had Nothing to Do With Size

The first answers to all of this were attempts to make the cache smaller, by
having several query heads share a single key-value head between them. That is
the story of multi-query and grouped-query attention, boxes one and two of the
roadmap, and it deserves its own post rather than a paragraph in this one.

But there was a second failure that no amount of shrinking would have fixed,
and I think it is the more interesting one, because nothing about it is a
property of the model at all.

The attention **kernels** of the day — a kernel being the small, heavily
optimised program that actually runs one piece of the model on the GPU —
required the cache for a single conversation to sit in one unbroken block of
memory. And nobody knows in advance how long a conversation will run. Put
those two facts together and you get the only safe thing anyone could do:
reserve each conversation enough room for the longest answer it might ever
produce, and hope it uses it.

<div class='knob'>
    <svg viewBox='0 0 720 210' id='pg-svg' role='img'
         aria-label='A strip of GPU memory filled by four requests, either by reserving each request its maximum length contiguously or by handing out small blocks on demand.'>
        <g id='pg-scene'></g>
    </svg>
    <div class='controls'>
        <label for='pg-m'>allocation</label>
        <button type='button' id='pg-m' class='btn'>reserve the maximum</button>
        <span class='readout' id='pg-m-out'></span>
    </div>
    <div class='controls'>
        <label for='pg-r'>maximum length a request may reach</label>
        <input type='range' id='pg-r' min='8' max='28' value='20'>
        <span class='readout' id='pg-r-out'></span>
    </div>
    <p class='note' id='pg-note'></p>
</div>
<div class='caption'>
    <span class='caption-label'>Figure 4.</span>
    Four conversations growing in one strip of memory. The solid cells are
    holding real keys and values. The pale ones have been reserved for text
    that has not arrived yet, and I would watch how many of them there are,
    because every one is memory that nobody else is allowed to use.
</div>

<script>
(function () {
  var scene = document.getElementById('pg-scene'),
      mB = document.getElementById('pg-m'), mOut = document.getElementById('pg-m-out'),
      rR = document.getElementById('pg-r'), rOut = document.getElementById('pg-r-out'),
      note = document.getElementById('pg-note');
  var reserve = true, BLOCK = 4, SLOTS = 64, LEN = [7, 14, 5, 11], tick = 0;
  var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    var maxLen = +rR.value, s = '', i, r;
    var used = [], alloc = [];
    for (r = 0; r < LEN.length; r++) {
      var grown = Math.min(LEN[r], Math.max(0, tick - r * 3));
      used.push(grown);
      alloc.push(reserve ? maxLen : Math.ceil(grown / BLOCK) * BLOCK);
    }
    var cell = 10.4, X0 = 26, Y0 = 34, at = 0, fit = true;
    var COLS = ['#8C77BC', '#C48BAC', '#6E8C66', '#B07E55'];
    for (r = 0; r < LEN.length; r++) {
      for (i = 0; i < alloc[r]; i++) {
        if (at >= SLOTS) { fit = false; break; }
        var col = at % 32, row = Math.floor(at / 32);
        s += "<rect x='" + (X0 + col * (cell + 1.6)).toFixed(1) + "' y='" +
             (Y0 + row * 30).toFixed(1) + "' width='" + cell.toFixed(1) +
             "' height='20' rx='2' fill='" + COLS[r] + "' fill-opacity='" +
             (i < used[r] ? '0.9' : '0.16') + "' stroke='" + COLS[r] +
             "' stroke-opacity='0.45' stroke-width='0.8'/>";
        at++;
      }
      if (!fit) { break; }
      if (!reserve) { continue; }
    }
    for (i = at; i < SLOTS; i++) {
      var c2 = i % 32, r2 = Math.floor(i / 32);
      s += "<rect x='" + (X0 + c2 * (cell + 1.6)).toFixed(1) + "' y='" + (Y0 + r2 * 30).toFixed(1) +
           "' width='" + cell.toFixed(1) + "' height='20' rx='2' fill='#FFFFFF' stroke='#DEDAD4'/>";
    }
    var U = used.reduce(function (a, b) { return a + b; }, 0);
    var A = Math.min(SLOTS, alloc.reduce(function (a, b) { return a + b; }, 0));
    s += "<text class='gl' x='" + X0 + "' y='24'>64 slots of KV cache memory</text>";
    s += "<text class='axlabel' x='" + X0 + "' y='118'>" + U + " slots hold a token, " +
         A + ' are spoken for &#8212; ' + (100 * U / A).toFixed(0) + '% useful</text>';
    var bw = 620;
    s += "<rect x='" + X0 + "' y='134' width='" + bw + "' height='18' rx='3' fill='#DEDAD4'/>";
    s += "<rect x='" + X0 + "' y='134' width='" + (bw * U / A).toFixed(1) +
         "' height='18' rx='3' fill='#8C77BC'/>";
    if (!fit) {
      s += "<text class='wnum' x='" + X0 + "' y='172' fill='#A8443E'>memory is full: " +
           'a fifth request would have to wait, however little of it is really in use.</text>';
    }
    scene.innerHTML = s;
    mOut.textContent = reserve ? 'contiguous, up to ' + maxLen : 'blocks of ' + BLOCK + ', on demand';
    rOut.textContent = maxLen + ' tokens';
    note.textContent = reserve
      ? 'Every request is given room for ' + maxLen + ' tokens the moment it arrives, ' +
        'because its cache must be contiguous and nobody knows how long it will run. ' +
        'The gap between the two numbers above is memory that exists, is untouched, and ' +
        'cannot be lent to anyone.'
      : 'Each request holds only the blocks it has filled, plus at most ' + (BLOCK - 1) +
        ' spare slots in its last one. The waste no longer depends on how long the ' +
        'request might have run.';
  }
  mB.addEventListener('click', function () {
    reserve = !reserve;
    mB.textContent = reserve ? 'reserve the maximum' : 'hand out blocks';
    draw();
  });
  rR.addEventListener('input', draw);
  if (!reduced) {
    setInterval(function () { tick = (tick + 1) % 24; draw(); }, 700);
  } else { tick = 23; }
  draw();
})();
</script>

The consequence is that most of the memory set aside for caches was holding
nothing at all. The waste has a name, or rather two, and they are worth
knowing because the figure below is labelled with them. **Internal
fragmentation** is the room reserved inside a conversation's own block that it
never grows into. **External fragmentation** is the gaps left between blocks,
each too small for anybody else to move into. In 2023 Kwon and colleagues
measured both on real traffic, and I still find the result startling.

<div class='figure'>
    <img src='/images/kvcache-memory-waste.png'
         alt='Four stacked bars, each the whole KV cache memory of a serving
              system. The first three, all Orca variants, hold only 20.4, 26.8
              and 38.2 percent actual token states, the remainder being
              reservation and internal and external fragmentation. The fourth,
              vLLM, holds 96.3 percent token states.'>
    <div class='caption'>
        <span class='caption-label'>Figure 5.</span>
        Reproduced from Kwon et al. (2023), Figure 2, and recoloured into
        this site's palette. Each bar is the whole of one system's KV cache
        memory, and only the
        <span style='color:#8C77BC'><b>bottom band</b></span> is holding real
        tokens: between 20.4% and 38.2% of it in the systems of the day,
        against 96.3% once the memory is handed out in blocks. I would stress
        that no tensor got any smaller here.
    </div>
</div>

I find this figure quietly remarkable, and it is the reason I wanted to write
this post separately from the other one. The fix was not a better model, a
smaller cache, or a cleverer attention formula. It was to stop insisting that
the cache be contiguous, and hand it out in small blocks as it is needed,
which is exactly what operating systems have done with memory since the
1960s. Nothing got smaller. It was simply put away properly, and the useful
fraction went from about a fifth to almost all of it.

There is a lesson in that which generalises well beyond language models. When
something is expensive, the instinct is to make it smaller. It is worth
checking first whether you are merely storing it badly.

## 4. Where It Stops Being Free

I have one more thing to say, and it is about a line that gets crossed
quietly.

Everything so far leaves the model's answers exactly as they were.
Paging the cache, batching conversations, reading the rows in a different
order — none of these changes a single output. The model says precisely what it
would have said anyway, and that is what has made all of it free in the sense
that matters: you get the speed without giving anything up.

The techniques that come next are not like that, and I think it is worth
knowing where the line is. Throwing away old tokens to make room changes what
the model computes, because the tokens it can no longer see are tokens it can
no longer use. Storing the cache in four bits instead of sixteen changes it
too, in a smaller and subtler way. And sharing key-value heads, which is the
first two boxes of the roadmap, is a third case again: it does not approximate
an existing model, it produces a *different* model, one that had to be trained
or retrained to work that way.

All three may well be worth doing, and all three are in production somewhere
right now. But they are a different kind of bargain from paging, and when
somebody tells you that a serving trick is free, this is the question to ask
about it.

## 5. Chat This Over With Friends

The strange thing about serving a language model is that the expensive part is
not the model. Its weights are shared by everybody on the machine, so the more
conversations you serve at once, the less each one costs, and that is the
entire economics of the business. But every conversation also drags along its
own KV cache, which cannot be shared with anybody, and which grows for as long
as the conversation lasts. So the one move that makes everything else
cheaper — serving more people at once — is the move that makes this particular
cost worse. On a single 80 GB card running an 8B model, long conversations run
out at about three at a time.

The received wisdom is that the answer is to make the cache smaller, and there
is a serious literature on doing exactly that. What I did not expect is that
the biggest win came from somewhere else entirely. When Kwon and colleagues
measured real servers in 2023, only **20% to 38%** of the memory reserved for
caches was holding anything at all, because systems had to reserve room for
the longest answer each conversation might produce. Handing it out in small
blocks instead, the way operating systems have paged memory since the 1960s,
took that to **96%** without making a single tensor smaller. The fair
objection is that this was an unforced error being corrected rather than a
deep insight, and that shrinking still matters once contexts get long. What is
open is whether anything is left that is free: the remaining moves all change
what the model actually says.

## 6. References

1. Shazeer, N. (2019). Fast Transformer Decoding: One Write-Head is All You
   Need. [arXiv:1911.02150](https://arxiv.org/abs/1911.02150)
2. Kwon, W., et al. (2023). Efficient Memory Management for LLM Serving with
   PagedAttention. *SOSP*.
   [arXiv:2309.06180](https://arxiv.org/abs/2309.06180)
3. Ainslie, J., et al. (2023). GQA: Training Generalized Multi-Query
   Transformer Models from Multi-Head Checkpoints. *EMNLP*. [arXiv:2305.13245](https://arxiv.org/abs/2305.13245)
4. Pope, R., et al. (2022). Efficiently Scaling Transformer Inference.
   [arXiv:2211.05102](https://arxiv.org/abs/2211.05102)
5. Grattafiori, A., et al. (2024). The Llama 3 Herd of Models.
   [arXiv:2407.21783](https://arxiv.org/abs/2407.21783)
6. DeepSeek-AI (2024). DeepSeek-V2: A Strong, Economical, and Efficient
   Mixture-of-Experts Language Model. [arXiv:2405.04434](https://arxiv.org/abs/2405.04434)
