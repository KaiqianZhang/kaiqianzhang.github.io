---
title: RoPE and iRoPE
subtitle: How I learned to see position as rotation — and why some long-context models mix RoPE with layers that use no explicit positional encoding.
date: 2026-08-22
tags: foundations
format: three-part
---

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 326' role='img' aria-label='A braced tree of the post: three sections, each expanding into the ideas it covers'>
<text x='14' y='180.5' class='lbl bg a-pop' style='--d:0.00s;fill:var(--w-plum)'>RoPE</text>
<text x='14' y='202.5' class='lbl bg a-pop' style='--d:0.08s;fill:var(--w-plum)'>and iRoPE</text>
<path d='M142.0 65.0 C138.7 65.0, 138.7 178.5, 120.0 184.5 C138.7 190.5, 138.7 304.0, 142.0 304.0' fill='none' stroke='var(--w-plum)' stroke-width='2.4' stroke-linecap='round' class='a-draw' style='--d:0.25s;--dur:0.9s'/>
<circle cx='152' cy='65.0' r='4' fill='var(--w-student)' class='a-beat' style='--dur:1.9s;--d:0.50s'/>
<text x='164' y='70.0' class='lbl a-rise' style='--d:0.50s;fill:var(--w-student)'>① Learning together</text>
<rect x='306' y='55.0' width='44' height='19' rx='9' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.62s'/>
<text x='328' y='69.0' class='lbl sm mid a-fade' style='--d:0.72s;fill:var(--w-student)'>5 min</text>
<path d='M388.0 26.0 C384.7 26.0, 384.7 59.0, 366.0 65.0 C384.7 71.0, 384.7 104.0, 388.0 104.0' fill='none' stroke='var(--w-student)' stroke-width='2.0' stroke-linecap='round' class='a-draw' style='--d:0.95s;--dur:0.9s'/>
<text x='396' y='30.0' class='lbl sm a-rise' style='--d:1.15s'>how RoPE turns position into relative rotation</text>
<text x='396' y='56.0' class='lbl sm a-rise' style='--d:1.22s'>why one head uses many rotation speeds</text>
<text x='396' y='82.0' class='lbl sm a-rise' style='--d:1.29s'>why long-range scores can weaken</text>
<text x='396' y='108.0' class='lbl sm a-rise' style='--d:1.36s'>how iRoPE mixes RoPE and NoPE</text>
<circle cx='152' cy='204.0' r='4' fill='var(--w-teacher)' class='a-beat' style='--dur:2.2s;--d:0.65s'/>
<text x='164' y='209.0' class='lbl a-rise' style='--d:0.65s;fill:var(--w-teacher)'>② Inspire together</text>
<rect x='306' y='194.0' width='44' height='19' rx='9' fill='var(--w-teacher)' fill-opacity='0.16' class='a-pop' style='--d:0.77s'/>
<text x='328' y='208.0' class='lbl sm mid a-fade' style='--d:0.87s;fill:var(--w-teacher)'>4 min</text>
<path d='M388.0 152.0 C384.7 152.0, 384.7 198.0, 366.0 204.0 C384.7 210.0, 384.7 256.0, 388.0 256.0' fill='none' stroke='var(--w-teacher)' stroke-width='2.0' stroke-linecap='round' class='a-draw' style='--d:1.13s;--dur:0.9s'/>
<text x='396' y='156.0' class='lbl sm a-rise' style='--d:1.33s'>stretching context with PI, NTK, and YaRN</text>
<text x='396' y='182.0' class='lbl sm a-rise' style='--d:1.40s'>raising the base, and the bound on it</text>
<text x='396' y='208.0' class='lbl sm a-rise' style='--d:1.47s'>removing explicit position in some layers</text>
<text x='396' y='234.0' class='lbl sm a-rise' style='--d:1.54s'>changing softmax instead with SSMax</text>
<text x='396' y='260.0' class='lbl sm a-rise' style='--d:1.61s'>five research questions I was left with</text>
<circle cx='152' cy='304.0' r='4' fill='var(--w-loss)' class='a-beat' style='--dur:2.6s;--d:0.80s'/>
<text x='164' y='309.0' class='lbl a-rise' style='--d:0.80s;fill:var(--w-loss)'>③ Chat together</text>
<rect x='306' y='294.0' width='44' height='19' rx='9' fill='var(--w-loss)' fill-opacity='0.16' class='a-pop' style='--d:0.92s'/>
<text x='328' y='308.0' class='lbl sm mid a-fade' style='--d:1.02s;fill:var(--w-loss)'>1 min</text>
<path d='M366 304.0 L388 304.0' fill='none' stroke='var(--w-loss)' stroke-width='2' stroke-linecap='round' class='a-draw' style='--d:1.31s'/>
<text x='396' y='308.0' class='lbl sm a-rise' style='--d:1.51s'>the takeaways</text>
</svg>
</div>

When I first encountered RoPE, I pictured each pair of query and key
coordinates as two hands on a clock. That picture helped me understand RoPE,
its long-range limits, and why iRoPE mixes RoPE with NoPE layers.

## Learning together

Self-attention has no built-in notion of token order: without positional
information or a causal mask, permuting the tokens simply permutes the
outputs. A decoder does receive some order information from its causal mask,
but **rotary position embedding (RoPE)** gives attention an explicit way to
represent relative distance. I still find it one of the most elegant ideas
in the modern transformer.

Attention **scores pairs of tokens**. A query at position $m$ and a key at
position $n$ produce a dot product called an attention logit. After softmax,
a larger logit generally means that the query reads more from that key.

One fact made RoPE click for me: **a dot product depends on vector lengths
and their angle.** Rotation preserves the lengths, so RoPE changes only the
relative angle. Rotating both vectors by the same amount leaves their dot
product unchanged.

RoPE works **two coordinates at a time**. I will call each pair a **band** as
a visual shorthand, not as standard terminology. For band $i$, RoPE rotates
the query by $m\theta_i$ and the key by $n\theta_i$.

$$q_m \rightarrow R_m q, \qquad k_n \rightarrow R_n k, \qquad
\langle R_m q,\; R_n k\rangle = \langle q,\; R_{n-m} k\rangle$$

Here, $R_m$ collects all band-wise rotations $m\theta_i$. Within band $i$,
the **relative** rotation is $(n-m)\theta_i$, so the dot product depends on
relative rather than absolute position.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 300' role='img' aria-label='Three dials on one clock, turning at rates proportional to their real wavelengths, each carrying a query arrow and a key arrow with a fixed wedge between them'>
<text x='16' y='22' class='lbl sm'>I picture each pair of coordinates as a dial. A head has d/2 dials, each rotating at its own rate.</text>
<text x='16' y='40' class='lbl sm'>Here, by the time the first dial has made 32 turns, the third has made only one.</text>
<circle cx='138' cy='150' r='62' fill='none' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='190.0' y1='150.0' x2='200.0' y2='150.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='138.0' y1='202.0' x2='138.0' y2='212.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='86.0' y1='150.0' x2='76.0' y2='150.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='138.0' y1='98.0' x2='138.0' y2='88.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<g class='a-spin' style='--dur:1.9s;--ox:138px;--oy:150px'>
<path d='M138 150 L188.0 150.0 A50 50 0 0 0 166.7 109.0 Z' fill='var(--w-loss)' fill-opacity='0.22'/>
<line x1='138' y1='150' x2='196.0' y2='150.0' stroke='var(--w-student)' stroke-width='3.5' stroke-linecap='round'/>
<line x1='138' y1='150' x2='171.3' y2='102.5' stroke='var(--w-teacher)' stroke-width='3.5' stroke-linecap='round'/>
</g>
<circle cx='138' cy='150' r='4' fill='var(--w-dim)'/>
<text x='138' y='242' class='lbl mid'>band 0</text>
<text x='138' y='260' class='lbl sm mid'>one turn every 6.3 tokens</text>
<circle cx='356' cy='150' r='62' fill='none' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='408.0' y1='150.0' x2='418.0' y2='150.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='356.0' y1='202.0' x2='356.0' y2='212.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='304.0' y1='150.0' x2='294.0' y2='150.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='356.0' y1='98.0' x2='356.0' y2='88.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<g class='a-spin' style='--dur:10.7s;--ox:356px;--oy:150px'>
<path d='M356 150 L406.0 150.0 A50 50 0 0 0 384.7 109.0 Z' fill='var(--w-loss)' fill-opacity='0.22'/>
<line x1='356' y1='150' x2='414.0' y2='150.0' stroke='var(--w-student)' stroke-width='3.5' stroke-linecap='round'/>
<line x1='356' y1='150' x2='389.3' y2='102.5' stroke='var(--w-teacher)' stroke-width='3.5' stroke-linecap='round'/>
</g>
<circle cx='356' cy='150' r='4' fill='var(--w-dim)'/>
<text x='356' y='242' class='lbl mid'>band 12</text>
<text x='356' y='260' class='lbl sm mid'>one turn every 35.3 tokens</text>
<circle cx='574' cy='150' r='62' fill='none' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='626.0' y1='150.0' x2='636.0' y2='150.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='574.0' y1='202.0' x2='574.0' y2='212.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='522.0' y1='150.0' x2='512.0' y2='150.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<line x1='574.0' y1='98.0' x2='574.0' y2='88.0' stroke='var(--w-edge)' stroke-width='1.5'/>
<g class='a-spin' style='--dur:60.1s;--ox:574px;--oy:150px'>
<path d='M574 150 L624.0 150.0 A50 50 0 0 0 602.7 109.0 Z' fill='var(--w-loss)' fill-opacity='0.22'/>
<line x1='574' y1='150' x2='632.0' y2='150.0' stroke='var(--w-student)' stroke-width='3.5' stroke-linecap='round'/>
<line x1='574' y1='150' x2='607.3' y2='102.5' stroke='var(--w-teacher)' stroke-width='3.5' stroke-linecap='round'/>
</g>
<circle cx='574' cy='150' r='4' fill='var(--w-dim)'/>
<text x='574' y='242' class='lbl mid'>band 24</text>
<text x='574' y='260' class='lbl sm mid'>one turn every 198 tokens</text>
<line x1='16' y1='290' x2='34' y2='290' stroke='var(--w-student)' stroke-width='3.5' stroke-linecap='round'/>
<text x='40' y='294' class='lbl sm' style='fill:var(--w-student)'>query</text>
<line x1='75' y1='290' x2='93' y2='290' stroke='var(--w-teacher)' stroke-width='3.5' stroke-linecap='round'/>
<text x='99' y='294' class='lbl sm' style='fill:var(--w-teacher)'>key</text>
<rect x='122' y='284' width='18' height='12' rx='3' fill='var(--w-loss)' fill-opacity='0.35'/>
<text x='146' y='294' class='lbl sm' style='fill:var(--w-loss)'>the gap that survives the dot product</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> Three bands from one attention head, rotating at different rates. Within a band, both arrows rotate with position; their relative angle is what survives in the dot product. I stop at band 24 here — band 56 rotates roughly three thousand times more slowly than band 0.</div>
</div>

One attention head contains many of these dials. If the head dimension is
$d$, RoPE creates $d/2$ bands, with rotation rates

$$\theta_i = \theta_{\text{base}}^{-2i/d}, \qquad i = 0 \ldots d/2-1$$

With the usual base of 10,000, these rates span nearly **four orders of
magnitude**. A band's **wavelength** is the number of tokens required for one
full turn: about 6 for band 0, but roughly 20,000 for band 56. I carry three
intuitions from this:

- **Fast bands resolve nearby offsets; slow bands vary over longer ranges.**
  Fast bands are precise locally but wrap around many times.
- **A band that barely rotates contributes little positional resolution.**
  It assigns nearly the same angle to many positions.
- **The frequency spectrum is a design choice.** I read many long-context
  methods as different ways to modify its slow end.

### A useful picture of long-range decay

Imagine a simple case in which the query and key are identical before RoPE.
At zero distance, every band is aligned. As I separate the tokens, band $i$
acquires the angle $(n-m)\theta_i$; positive and negative contributions can
then cancel. This tendency is called **long-range decay**. The original RoPE
paper presents it as a useful bias toward nearby tokens.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 214' role='img' aria-label='An illustrative RoPE score weakening with distance until it becomes comparable to random score variation'>
<text x='16' y='22' class='lbl sm'>a toy relative score for an initially aligned query and key as their distance grows</text>
<line x1='62' y1='166.4' x2='652' y2='166.4' stroke='var(--w-edge)' stroke-width='1.3'/>
<line x1='62.0' y1='40.0' x2='62.0' y2='172.4' stroke='var(--w-grid)' stroke-width='1'/>
<text x='62.0' y='186.4' class='lbl sm mid'>1</text>
<line x1='212.8' y1='40.0' x2='212.8' y2='172.4' stroke='var(--w-grid)' stroke-width='1'/>
<text x='212.8' y='186.4' class='lbl sm mid'>10</text>
<line x1='363.5' y1='40.0' x2='363.5' y2='172.4' stroke='var(--w-grid)' stroke-width='1'/>
<text x='363.5' y='186.4' class='lbl sm mid'>100</text>
<line x1='514.3' y1='40.0' x2='514.3' y2='172.4' stroke='var(--w-grid)' stroke-width='1'/>
<text x='514.3' y='186.4' class='lbl sm mid'>1,000</text>
<line x1='652.0' y1='40.0' x2='652.0' y2='172.4' stroke='var(--w-grid)' stroke-width='1'/>
<text x='652.0' y='186.4' class='lbl sm mid'>8,192</text>
<text x='54' y='44.0' class='lbl sm end'>1.0</text>
<text x='54' y='170.4' class='lbl sm end'>0</text>
<line x1='62' y1='150.6' x2='652' y2='150.6' stroke='var(--w-pruned)' stroke-width='1.6' stroke-dasharray='5 4' class='a-breathe' style='--dur:3.4s;--lo:0.45;--hi:1'/>
<text x='70' y='143.6' class='lbl sm' style='fill:var(--w-pruned)'>typical noise scale &#8212; unrelated pairs fluctuate around zero</text>
<path d='M62.0 43.8 L107.4 53.1 L133.9 63.3 L152.8 70.4 L167.4 73.2 L179.3 73.4 L189.4 73.9 L198.2 76.1 L205.9 79.3 L212.8 81.8 L219.0 82.8 L224.7 82.7 L229.9 83.0 L234.8 84.4 L239.3 86.4 L243.5 88.0 L247.5 88.4 L254.8 88.3 L261.3 91.2 L267.3 92.4 L272.8 92.0 L277.8 94.8 L282.5 95.6 L286.8 94.7 L290.9 97.8 L294.8 98.4 L300.2 97.7 L305.2 101.7 L309.8 97.9 L314.1 106.0 L318.1 97.4 L323.2 109.6 L327.9 99.1 L332.2 110.3 L336.3 102.5 L340.2 109.9 L344.7 104.2 L348.9 109.3 L352.9 113.1 L357.4 111.6 L361.5 119.4 L365.5 109.4 L369.8 119.2 L373.8 107.1 L378.1 113.6 L382.2 111.3 L386.0 120.8 L390.1 122.9 L394.3 117.1 L398.3 126.6 L402.4 112.0 L406.2 121.4 L410.2 119.5 L414.3 125.3 L418.3 129.3 L422.2 117.4 L426.1 126.1 L430.0 118.1 L433.9 127.9 L437.8 123.6 L441.7 134.9 L445.6 138.3 L449.5 125.2 L453.5 130.5 L457.3 130.9 L461.3 131.4 L465.1 143.7 L469.0 122.8 L473.0 137.4 L476.8 136.2 L480.6 139.4 L484.5 142.8 L488.4 132.3 L492.2 141.7 L496.1 135.3 L499.9 135.9 L503.8 136.8 L507.7 147.0 L511.6 154.7 L515.4 130.9 L519.3 152.2 L523.1 148.4 L526.9 149.4 L530.8 161.7 L534.6 142.9 L538.4 146.6 L542.3 140.1 L546.1 144.4 L549.9 164.1 L553.8 143.1 L557.6 151.6 L561.4 151.7 L565.3 149.1 L569.1 167.1 L572.9 142.3 L576.7 151.8 L580.6 152.5 L584.4 156.0 L588.2 160.8 L592.0 148.7 L595.9 157.4 L599.7 157.4 L603.5 163.7 L607.3 155.2 L611.2 164.6 L615.0 171.4 L618.8 151.5 L622.6 158.3 L626.5 158.9 L630.3 172.3 L634.1 177.2 L637.9 156.0 L641.7 174.9 L645.6 179.3 L649.4 172.0' fill='none' stroke='var(--w-student)' stroke-width='2.2' stroke-linejoin='round' class='a-draw' style='--dur:2.4s'/>
<text x='133.9' y='57.7' class='lbl sm a-fade' style='--d:2.50s;fill:var(--w-student)'>the score decays with distance</text>
<line x1='561.2' y1='34.0' x2='561.2' y2='172.4' stroke='var(--w-loss)' stroke-width='1.6' stroke-dasharray='4 4'/>
<text x='561.2' y='28.0' class='lbl sm mid' style='fill:var(--w-loss)'>trained length</text>
<text x='571.6' y='110.8' class='lbl sm a-fade' style='--d:3.00s;fill:var(--w-loss)'>past here, the score</text>
<text x='571.6' y='126.0' class='lbl sm a-fade' style='--d:3.05s;fill:var(--w-loss)'>oscillates at unseen angles</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> An illustrative relative score computed from a RoPE frequency bank with base 10,000. The signal weakens with distance and eventually becomes comparable to the variation expected from unrelated vectors.</div>
</div>

This is intuition, not a universal law. Real queries and keys are not
identical, and their scores can oscillate. Still, the toy case exposes a
signal-to-noise problem:

- An unrelated pair has expected normalized score zero, but individual
  scores vary by roughly $1/\sqrt{d/2}$ in this simplified picture.
- When the signal falls to that scale, **one head cannot reliably separate a
  distant match from an unrelated token using this signal alone**.
- Beyond the training length, the model also encounters relative angles it
  was never optimized to interpret.

For me, this is the limitation the dial picture reveals: many rotating
components can make alignment harder to recover as distance grows.

<div class='lab wide' id='decay-lab'>
<div class='lab-head'><span class='name'>Lab 1 · how far RoPE can still see</span><span class='hint'>raise the base and watch the usable range move</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label for='dec-base'>RoPE base θ <span class='val' id='dec-base-v'></span></label>
<input type='range' id='dec-base' min='3' max='7.5' step='0.05' value='4'>
</div>
<div class='ctl'>
<label for='dec-dim'>head dimension <span class='val' id='dec-dim-v'></span></label>
<input type='range' id='dec-dim' min='32' max='256' step='32' value='128'>
</div>
<div class='ctl'>
<label for='dec-delta'>how far apart the two tokens are <span class='val' id='dec-delta-v'></span></label>
<input type='range' id='dec-delta' min='0' max='4' step='0.02' value='2'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--w-student)'><span class='k'>score at this distance</span><span class='v' id='dec-stat-score'></span></div>
<div class='stat' style='--stat-hue:var(--w-pruned)'><span class='k'>typical noise scale</span><span class='v' id='dec-stat-floor'></span></div>
<div class='stat' style='--stat-hue:var(--w-kept)'><span class='k'>usable range</span><span class='v' id='dec-stat-range'></span></div>
</div>
<div class='verdict' id='dec-verdict'></div>
<svg viewBox='0 0 700 268' role='img'></svg>
<p class='cap'>Computed from the RoPE frequency bank. Violet shows an initially aligned query and key; clay shows the typical variation of an unrelated pair. When the two overlap, this simplified score alone no longer separates them reliably.</p>
</div>
</div>

### iRoPE: stop encoding position in some layers

The most surprising response I found was to **omit explicit positional
encoding from some layers**.

Such a layer is not blind to order. The causal mask lets each token attend
only to its prefix, and earlier layers may already carry order-sensitive
features. A model can therefore learn position indirectly. This is commonly
called **NoPE**: no explicit positional encoding.

**iRoPE** interleaves RoPE and NoPE layers. I think of RoPE layers as adding
an explicit relative-position bias and NoPE layers as providing a path
without RoPE's distance-dependent rotation. A common pattern is three RoPE
layers followed by one NoPE layer, although the schedule is a design choice.
Llama 4 Scout uses iRoPE in its reported 10-million-token context window.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 292' role='img' aria-label='A stack that interleaves three RoPE layers with one NoPE layer'>
<text x='16' y='24' class='lbl sm'>a simplified view: RoPE layers encode relative position, while NoPE layers provide a path without rotary decay</text>
<rect x='34' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.05s'/>
<text x='57' y='48' class='lbl sm mid a-fade' style='--d:0.20s;fill:var(--w-student)'>RoPE</text>
<text x='57' y='214' class='lbl sm mid a-fade' style='--d:0.25s'>1</text>
<circle cx='57' cy='156' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:1.6s'/>
<rect x='88' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.11s'/>
<text x='111' y='48' class='lbl sm mid a-fade' style='--d:0.26s;fill:var(--w-student)'>RoPE</text>
<text x='111' y='214' class='lbl sm mid a-fade' style='--d:0.31s'>2</text>
<circle cx='111' cy='134' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:1.9s'/>
<rect x='142' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.17s'/>
<text x='165' y='48' class='lbl sm mid a-fade' style='--d:0.32s;fill:var(--w-student)'>RoPE</text>
<text x='165' y='214' class='lbl sm mid a-fade' style='--d:0.37s'>3</text>
<circle cx='165' cy='112' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:2.2s'/>
<rect x='196' y='56' width='46' height='140' rx='6' fill='var(--w-teacher)' fill-opacity='0.85' class='a-pop' style='--d:0.23s'/>
<text x='219' y='48' class='lbl sm mid a-fade' style='--d:0.38s;fill:var(--w-teacher)'>NoPE</text>
<text x='219' y='214' class='lbl sm mid a-fade' style='--d:0.43s'>4</text>
<circle cx='219' cy='174' r='5' fill='var(--w-teacher)' class='a-travel' style='--dur:2.6s;--fx:0px;--tx:0px'></circle>
<path d='M219 174 C219 76, 219 66, 219 72' fill='none' stroke='var(--w-teacher)' stroke-width='2' class='a-flow' style='--dur:1.6s'/>
<rect x='250' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.29s'/>
<text x='273' y='48' class='lbl sm mid a-fade' style='--d:0.44s;fill:var(--w-student)'>RoPE</text>
<text x='273' y='214' class='lbl sm mid a-fade' style='--d:0.49s'>5</text>
<circle cx='273' cy='134' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:1.9s'/>
<rect x='304' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.35s'/>
<text x='327' y='48' class='lbl sm mid a-fade' style='--d:0.50s;fill:var(--w-student)'>RoPE</text>
<text x='327' y='214' class='lbl sm mid a-fade' style='--d:0.55s'>6</text>
<circle cx='327' cy='112' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:2.2s'/>
<rect x='358' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.41s'/>
<text x='381' y='48' class='lbl sm mid a-fade' style='--d:0.56s;fill:var(--w-student)'>RoPE</text>
<text x='381' y='214' class='lbl sm mid a-fade' style='--d:0.61s'>7</text>
<circle cx='381' cy='156' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:1.6s'/>
<rect x='412' y='56' width='46' height='140' rx='6' fill='var(--w-teacher)' fill-opacity='0.85' class='a-pop' style='--d:0.47s'/>
<text x='435' y='48' class='lbl sm mid a-fade' style='--d:0.62s;fill:var(--w-teacher)'>NoPE</text>
<text x='435' y='214' class='lbl sm mid a-fade' style='--d:0.67s'>8</text>
<circle cx='435' cy='174' r='5' fill='var(--w-teacher)' class='a-travel' style='--dur:2.6s;--fx:0px;--tx:0px'></circle>
<path d='M435 174 C435 76, 435 66, 435 72' fill='none' stroke='var(--w-teacher)' stroke-width='2' class='a-flow' style='--dur:1.6s'/>
<rect x='466' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.53s'/>
<text x='489' y='48' class='lbl sm mid a-fade' style='--d:0.68s;fill:var(--w-student)'>RoPE</text>
<text x='489' y='214' class='lbl sm mid a-fade' style='--d:0.73s'>9</text>
<circle cx='489' cy='112' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:2.2s'/>
<rect x='520' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.59s'/>
<text x='543' y='48' class='lbl sm mid a-fade' style='--d:0.74s;fill:var(--w-student)'>RoPE</text>
<text x='543' y='214' class='lbl sm mid a-fade' style='--d:0.79s'>10</text>
<circle cx='543' cy='156' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:1.6s'/>
<rect x='574' y='56' width='46' height='140' rx='6' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.65s'/>
<text x='597' y='48' class='lbl sm mid a-fade' style='--d:0.80s;fill:var(--w-student)'>RoPE</text>
<text x='597' y='214' class='lbl sm mid a-fade' style='--d:0.85s'>11</text>
<circle cx='597' cy='134' r='4' fill='var(--w-student)' fill-opacity='0.9' class='a-beat' style='--dur:1.9s'/>
<rect x='628' y='56' width='46' height='140' rx='6' fill='var(--w-teacher)' fill-opacity='0.85' class='a-pop' style='--d:0.71s'/>
<text x='651' y='48' class='lbl sm mid a-fade' style='--d:0.86s;fill:var(--w-teacher)'>NoPE</text>
<text x='651' y='214' class='lbl sm mid a-fade' style='--d:0.91s'>12</text>
<circle cx='651' cy='174' r='5' fill='var(--w-teacher)' class='a-travel' style='--dur:2.6s;--fx:0px;--tx:0px'></circle>
<path d='M651 174 C651 76, 651 66, 651 72' fill='none' stroke='var(--w-teacher)' stroke-width='2' class='a-flow' style='--dur:1.6s'/>
<path d='M40 236 L640 236' stroke='var(--w-teacher)' stroke-width='2.4' class='a-flow' style='--dur:2.2s'/>
<text x='340' y='258' class='lbl sm mid' style='fill:var(--w-teacher)'>NoPE layers let distant tokens interact without a RoPE rotation between them</text>
<rect x='34' y='272' width='12' height='12' rx='3' fill='var(--w-student)' fill-opacity='0.16'/>
<text x='52' y='282' class='lbl sm'>RoPE &#8212; explicit relative position</text>
<rect x='300' y='272' width='12' height='12' rx='3' fill='var(--w-teacher)' fill-opacity='0.85'/>
<text x='318' y='282' class='lbl sm'>NoPE &#8212; order learned indirectly from context and masking</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> A simplified iRoPE pattern. Most layers use rotary position; periodically, a NoPE layer omits the rotation and gives attention a distance-independent path.</div>
</div>

### What to carry into the next part

- **RoPE turns absolute positions into relative rotation.**
- **Fast bands resolve local offsets; slow bands vary over longer ranges.**
- **At long distances, the positional signal can approach random score
  variation.**
- **NoPE avoids this rotary effect by applying no position-dependent
  rotation.**

## Inspire together

I read these papers as different answers to one question: **what should a
model do with RoPE's slow bands when the context becomes much longer?**

**Stretch them.**

One approach maps a longer sequence back into the positions seen during
training. The angles stay familiar, but positional resolution decreases.

- **Position Interpolation** ([Chen et al., 2023](https://arxiv.org/abs/2306.15595))
  scales every position uniformly, so fast local bands slow down too.
- **NTK-aware scaling** raises the RoPE base, stretching slow bands much more
  than fast ones.
- **YaRN** ([Peng et al., 2023](https://arxiv.org/abs/2309.00071)) preserves
  fast bands, interpolates slow ones, and ramps between them. It also adjusts
  attention scaling; Llama 3.1 adopted a YaRN-style scheme.
- **LongRoPE2** ([Microsoft, 2025](https://arxiv.org/abs/2502.20082)) searches
  for a nonuniform rescaling schedule.

**Raise the base.** I would start with this paper to understand why it works.

- **Base of RoPE Bounds Context Length** ([Men et al., NeurIPS 2024](https://arxiv.org/abs/2405.14591))
  derives a **lower bound** on the base for a target length. Below it, a model
  may accept long input without reliably distinguishing positions. This
  helped me understand Llama 3's much larger base of 500,000.

**Delete position in some layers.**

This work asks a question I missed at first: what if some layers receive no
explicit position?

- **NoPE** ([Kazemnejad et al., NeurIPS 2023](https://arxiv.org/abs/2305.19466))
  performs surprisingly well on several length-generalization tasks.
- **RNoPE** ([Cohere, 2025](https://arxiv.org/abs/2501.18795)) interleaves
  RoPE and NoPE; its analyses find long-range retrieval concentrated in the
  NoPE layers.
- **SWAN-GPT** ([NVIDIA, 2025](https://arxiv.org/abs/2504.08719)) combines a
  similar hybrid with sliding-window attention.
- **iRoPE** ([Meta, Llama 4](https://ai.meta.com/blog/llama-4-multimodal-intelligence/))
  brings interleaving into Llama 4.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 320' role='img' aria-label='Each long context method shown as what it does to the bank of wavelengths'>
<text x='16' y='18' class='lbl sm'>Each dot represents one band's wavelength, measured in tokens.</text>
<text x='16' y='32' class='lbl sm'>PI moves every band; NTK-aware scaling and YaRN move the slow end more strongly.</text>
<text x='16' y='82' class='lbl sm a-rise' style='--d:0.20s'>RoPE as trained</text>
<circle cx='208.0' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.35' class='a-pop' style='--d:0.30s'/>
<circle cx='212.0' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.36' class='a-pop' style='--d:0.30s'/>
<circle cx='216.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.37' class='a-pop' style='--d:0.31s'/>
<circle cx='220.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.38' class='a-pop' style='--d:0.31s'/>
<circle cx='224.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.38' class='a-pop' style='--d:0.32s'/>
<circle cx='228.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.39' class='a-pop' style='--d:0.32s'/>
<circle cx='232.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.40' class='a-pop' style='--d:0.32s'/>
<circle cx='236.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.41' class='a-pop' style='--d:0.33s'/>
<circle cx='240.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.42' class='a-pop' style='--d:0.33s'/>
<circle cx='244.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.43' class='a-pop' style='--d:0.34s'/>
<circle cx='248.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.44' class='a-pop' style='--d:0.34s'/>
<circle cx='252.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.44' class='a-pop' style='--d:0.34s'/>
<circle cx='256.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.45' class='a-pop' style='--d:0.35s'/>
<circle cx='260.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.46' class='a-pop' style='--d:0.35s'/>
<circle cx='264.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.47' class='a-pop' style='--d:0.36s'/>
<circle cx='268.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.48' class='a-pop' style='--d:0.36s'/>
<circle cx='272.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.49' class='a-pop' style='--d:0.36s'/>
<circle cx='276.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.50' class='a-pop' style='--d:0.37s'/>
<circle cx='280.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.50' class='a-pop' style='--d:0.37s'/>
<circle cx='284.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.51' class='a-pop' style='--d:0.38s'/>
<circle cx='288.5' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.52' class='a-pop' style='--d:0.38s'/>
<circle cx='292.5' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.53' class='a-pop' style='--d:0.38s'/>
<circle cx='296.5' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.54' class='a-pop' style='--d:0.39s'/>
<circle cx='300.5' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.55' class='a-pop' style='--d:0.39s'/>
<circle cx='304.6' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.56' class='a-pop' style='--d:0.40s'/>
<circle cx='308.6' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.56' class='a-pop' style='--d:0.40s'/>
<circle cx='312.6' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.57' class='a-pop' style='--d:0.40s'/>
<circle cx='316.6' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.58' class='a-pop' style='--d:0.41s'/>
<circle cx='320.7' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.59' class='a-pop' style='--d:0.41s'/>
<circle cx='324.7' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.60' class='a-pop' style='--d:0.42s'/>
<circle cx='328.7' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.61' class='a-pop' style='--d:0.42s'/>
<circle cx='332.7' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.62' class='a-pop' style='--d:0.42s'/>
<circle cx='336.8' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.62' class='a-pop' style='--d:0.43s'/>
<circle cx='340.8' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.63' class='a-pop' style='--d:0.43s'/>
<circle cx='344.8' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.64' class='a-pop' style='--d:0.44s'/>
<circle cx='348.8' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.65' class='a-pop' style='--d:0.44s'/>
<circle cx='352.8' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.66' class='a-pop' style='--d:0.44s'/>
<circle cx='356.9' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.67' class='a-pop' style='--d:0.45s'/>
<circle cx='360.9' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.68' class='a-pop' style='--d:0.45s'/>
<circle cx='364.9' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.69' class='a-pop' style='--d:0.46s'/>
<circle cx='368.9' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.69' class='a-pop' style='--d:0.46s'/>
<circle cx='373.0' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.70' class='a-pop' style='--d:0.46s'/>
<circle cx='377.0' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.71' class='a-pop' style='--d:0.47s'/>
<circle cx='381.0' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.72' class='a-pop' style='--d:0.47s'/>
<circle cx='385.0' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.73' class='a-pop' style='--d:0.48s'/>
<circle cx='389.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.74' class='a-pop' style='--d:0.48s'/>
<circle cx='393.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.75' class='a-pop' style='--d:0.48s'/>
<circle cx='397.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.75' class='a-pop' style='--d:0.49s'/>
<circle cx='401.1' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.76' class='a-pop' style='--d:0.49s'/>
<circle cx='405.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.77' class='a-pop' style='--d:0.50s'/>
<circle cx='409.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.78' class='a-pop' style='--d:0.50s'/>
<circle cx='413.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.79' class='a-pop' style='--d:0.50s'/>
<circle cx='417.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.80' class='a-pop' style='--d:0.51s'/>
<circle cx='421.2' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.81' class='a-pop' style='--d:0.51s'/>
<circle cx='425.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.81' class='a-pop' style='--d:0.52s'/>
<circle cx='429.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.82' class='a-pop' style='--d:0.52s'/>
<circle cx='433.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.83' class='a-pop' style='--d:0.52s'/>
<circle cx='437.3' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.84' class='a-pop' style='--d:0.53s'/>
<circle cx='441.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.85' class='a-pop' style='--d:0.53s'/>
<circle cx='445.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.86' class='a-pop' style='--d:0.54s'/>
<circle cx='449.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.87' class='a-pop' style='--d:0.54s'/>
<circle cx='453.4' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.87' class='a-pop' style='--d:0.54s'/>
<circle cx='457.5' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.88' class='a-pop' style='--d:0.55s'/>
<circle cx='461.5' cy='78' r='3.4' fill='var(--w-student)' fill-opacity='0.89' class='a-pop' style='--d:0.55s'/>
<text x='16' y='126' class='lbl sm a-rise' style='--d:0.45s'>interpolate (PI)</text>
<circle cx='266.1' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.35' class='a-pop' style='--d:0.55s'/>
<circle cx='270.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.36' class='a-pop' style='--d:0.55s'/>
<circle cx='274.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.37' class='a-pop' style='--d:0.56s'/>
<circle cx='278.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.38' class='a-pop' style='--d:0.56s'/>
<circle cx='282.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.38' class='a-pop' style='--d:0.57s'/>
<circle cx='286.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.39' class='a-pop' style='--d:0.57s'/>
<circle cx='290.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.40' class='a-pop' style='--d:0.57s'/>
<circle cx='294.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.41' class='a-pop' style='--d:0.58s'/>
<circle cx='298.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.42' class='a-pop' style='--d:0.58s'/>
<circle cx='302.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.43' class='a-pop' style='--d:0.59s'/>
<circle cx='306.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.44' class='a-pop' style='--d:0.59s'/>
<circle cx='310.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.44' class='a-pop' style='--d:0.59s'/>
<circle cx='314.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.45' class='a-pop' style='--d:0.60s'/>
<circle cx='318.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.46' class='a-pop' style='--d:0.60s'/>
<circle cx='322.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.47' class='a-pop' style='--d:0.61s'/>
<circle cx='326.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.48' class='a-pop' style='--d:0.61s'/>
<circle cx='330.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.49' class='a-pop' style='--d:0.61s'/>
<circle cx='334.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.50' class='a-pop' style='--d:0.62s'/>
<circle cx='338.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.50' class='a-pop' style='--d:0.62s'/>
<circle cx='342.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.51' class='a-pop' style='--d:0.63s'/>
<circle cx='346.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.52' class='a-pop' style='--d:0.63s'/>
<circle cx='350.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.53' class='a-pop' style='--d:0.63s'/>
<circle cx='354.7' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.54' class='a-pop' style='--d:0.64s'/>
<circle cx='358.7' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.55' class='a-pop' style='--d:0.64s'/>
<circle cx='362.7' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.56' class='a-pop' style='--d:0.65s'/>
<circle cx='366.7' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.56' class='a-pop' style='--d:0.65s'/>
<circle cx='370.7' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.57' class='a-pop' style='--d:0.65s'/>
<circle cx='374.8' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.58' class='a-pop' style='--d:0.66s'/>
<circle cx='378.8' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.59' class='a-pop' style='--d:0.66s'/>
<circle cx='382.8' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.60' class='a-pop' style='--d:0.67s'/>
<circle cx='386.8' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.61' class='a-pop' style='--d:0.67s'/>
<circle cx='390.9' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.62' class='a-pop' style='--d:0.67s'/>
<circle cx='394.9' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.62' class='a-pop' style='--d:0.68s'/>
<circle cx='398.9' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.63' class='a-pop' style='--d:0.68s'/>
<circle cx='402.9' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.64' class='a-pop' style='--d:0.69s'/>
<circle cx='407.0' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.65' class='a-pop' style='--d:0.69s'/>
<circle cx='411.0' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.66' class='a-pop' style='--d:0.69s'/>
<circle cx='415.0' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.67' class='a-pop' style='--d:0.70s'/>
<circle cx='419.0' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.68' class='a-pop' style='--d:0.70s'/>
<circle cx='423.1' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.69' class='a-pop' style='--d:0.71s'/>
<circle cx='427.1' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.69' class='a-pop' style='--d:0.71s'/>
<circle cx='431.1' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.70' class='a-pop' style='--d:0.71s'/>
<circle cx='435.1' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.71' class='a-pop' style='--d:0.72s'/>
<circle cx='439.1' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.72' class='a-pop' style='--d:0.72s'/>
<circle cx='443.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.73' class='a-pop' style='--d:0.73s'/>
<circle cx='447.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.74' class='a-pop' style='--d:0.73s'/>
<circle cx='451.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.75' class='a-pop' style='--d:0.73s'/>
<circle cx='455.2' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.75' class='a-pop' style='--d:0.74s'/>
<circle cx='459.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.76' class='a-pop' style='--d:0.74s'/>
<circle cx='463.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.77' class='a-pop' style='--d:0.75s'/>
<circle cx='467.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.78' class='a-pop' style='--d:0.75s'/>
<circle cx='471.3' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.79' class='a-pop' style='--d:0.75s'/>
<circle cx='475.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.80' class='a-pop' style='--d:0.76s'/>
<circle cx='479.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.81' class='a-pop' style='--d:0.76s'/>
<circle cx='483.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.81' class='a-pop' style='--d:0.77s'/>
<circle cx='487.4' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.82' class='a-pop' style='--d:0.77s'/>
<circle cx='491.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.83' class='a-pop' style='--d:0.77s'/>
<circle cx='495.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.84' class='a-pop' style='--d:0.78s'/>
<circle cx='499.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.85' class='a-pop' style='--d:0.78s'/>
<circle cx='503.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.86' class='a-pop' style='--d:0.79s'/>
<circle cx='507.5' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.87' class='a-pop' style='--d:0.79s'/>
<circle cx='511.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.87' class='a-pop' style='--d:0.79s'/>
<circle cx='515.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.88' class='a-pop' style='--d:0.80s'/>
<circle cx='519.6' cy='122' r='3.4' fill='var(--w-lav)' fill-opacity='0.89' class='a-pop' style='--d:0.80s'/>
<text x='16' y='170' class='lbl sm a-rise' style='--d:0.70s'>raise the base / NTK</text>
<circle cx='208.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.35' class='a-pop' style='--d:0.80s'/>
<circle cx='212.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.36' class='a-pop' style='--d:0.80s'/>
<circle cx='217.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.37' class='a-pop' style='--d:0.81s'/>
<circle cx='222.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.38' class='a-pop' style='--d:0.81s'/>
<circle cx='227.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.38' class='a-pop' style='--d:0.82s'/>
<circle cx='232.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.39' class='a-pop' style='--d:0.82s'/>
<circle cx='237.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.40' class='a-pop' style='--d:0.82s'/>
<circle cx='242.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.41' class='a-pop' style='--d:0.83s'/>
<circle cx='247.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.42' class='a-pop' style='--d:0.83s'/>
<circle cx='252.5' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.43' class='a-pop' style='--d:0.84s'/>
<circle cx='257.5' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.44' class='a-pop' style='--d:0.84s'/>
<circle cx='262.4' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.44' class='a-pop' style='--d:0.84s'/>
<circle cx='267.4' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.45' class='a-pop' style='--d:0.85s'/>
<circle cx='272.3' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.46' class='a-pop' style='--d:0.85s'/>
<circle cx='277.3' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.47' class='a-pop' style='--d:0.86s'/>
<circle cx='282.2' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.48' class='a-pop' style='--d:0.86s'/>
<circle cx='287.1' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.49' class='a-pop' style='--d:0.86s'/>
<circle cx='292.1' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.50' class='a-pop' style='--d:0.87s'/>
<circle cx='297.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.50' class='a-pop' style='--d:0.87s'/>
<circle cx='302.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.51' class='a-pop' style='--d:0.88s'/>
<circle cx='306.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.52' class='a-pop' style='--d:0.88s'/>
<circle cx='311.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.53' class='a-pop' style='--d:0.88s'/>
<circle cx='316.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.54' class='a-pop' style='--d:0.89s'/>
<circle cx='321.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.55' class='a-pop' style='--d:0.89s'/>
<circle cx='326.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.56' class='a-pop' style='--d:0.90s'/>
<circle cx='331.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.56' class='a-pop' style='--d:0.90s'/>
<circle cx='336.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.57' class='a-pop' style='--d:0.90s'/>
<circle cx='341.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.58' class='a-pop' style='--d:0.91s'/>
<circle cx='346.5' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.59' class='a-pop' style='--d:0.91s'/>
<circle cx='351.4' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.60' class='a-pop' style='--d:0.92s'/>
<circle cx='356.4' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.61' class='a-pop' style='--d:0.92s'/>
<circle cx='361.3' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.62' class='a-pop' style='--d:0.92s'/>
<circle cx='366.3' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.62' class='a-pop' style='--d:0.93s'/>
<circle cx='371.2' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.63' class='a-pop' style='--d:0.93s'/>
<circle cx='376.2' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.64' class='a-pop' style='--d:0.94s'/>
<circle cx='381.1' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.65' class='a-pop' style='--d:0.94s'/>
<circle cx='386.1' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.66' class='a-pop' style='--d:0.94s'/>
<circle cx='391.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.67' class='a-pop' style='--d:0.95s'/>
<circle cx='396.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.68' class='a-pop' style='--d:0.95s'/>
<circle cx='400.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.69' class='a-pop' style='--d:0.96s'/>
<circle cx='405.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.69' class='a-pop' style='--d:0.96s'/>
<circle cx='410.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.70' class='a-pop' style='--d:0.96s'/>
<circle cx='415.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.71' class='a-pop' style='--d:0.97s'/>
<circle cx='420.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.72' class='a-pop' style='--d:0.97s'/>
<circle cx='425.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.73' class='a-pop' style='--d:0.98s'/>
<circle cx='430.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.74' class='a-pop' style='--d:0.98s'/>
<circle cx='435.5' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.75' class='a-pop' style='--d:0.98s'/>
<circle cx='440.5' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.75' class='a-pop' style='--d:0.99s'/>
<circle cx='445.4' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.76' class='a-pop' style='--d:0.99s'/>
<circle cx='450.4' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.77' class='a-pop' style='--d:1.00s'/>
<circle cx='455.3' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.78' class='a-pop' style='--d:1.00s'/>
<circle cx='460.3' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.79' class='a-pop' style='--d:1.00s'/>
<circle cx='465.2' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.80' class='a-pop' style='--d:1.01s'/>
<circle cx='470.2' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.81' class='a-pop' style='--d:1.01s'/>
<circle cx='475.1' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.81' class='a-pop' style='--d:1.02s'/>
<circle cx='480.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.82' class='a-pop' style='--d:1.02s'/>
<circle cx='485.0' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.83' class='a-pop' style='--d:1.02s'/>
<circle cx='489.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.84' class='a-pop' style='--d:1.03s'/>
<circle cx='494.9' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.85' class='a-pop' style='--d:1.03s'/>
<circle cx='499.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.86' class='a-pop' style='--d:1.04s'/>
<circle cx='504.8' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.87' class='a-pop' style='--d:1.04s'/>
<circle cx='509.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.87' class='a-pop' style='--d:1.04s'/>
<circle cx='514.7' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.88' class='a-pop' style='--d:1.05s'/>
<circle cx='519.6' cy='166' r='3.4' fill='var(--w-teacher)' fill-opacity='0.89' class='a-pop' style='--d:1.05s'/>
<text x='16' y='214' class='lbl sm a-rise' style='--d:0.95s'>YaRN</text>
<circle cx='208.0' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.35' class='a-pop' style='--d:1.05s'/>
<circle cx='212.0' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.36' class='a-pop' style='--d:1.05s'/>
<circle cx='216.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.37' class='a-pop' style='--d:1.06s'/>
<circle cx='220.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.38' class='a-pop' style='--d:1.06s'/>
<circle cx='224.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.38' class='a-pop' style='--d:1.07s'/>
<circle cx='228.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.39' class='a-pop' style='--d:1.07s'/>
<circle cx='232.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.40' class='a-pop' style='--d:1.07s'/>
<circle cx='236.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.41' class='a-pop' style='--d:1.08s'/>
<circle cx='240.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.42' class='a-pop' style='--d:1.08s'/>
<circle cx='244.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.43' class='a-pop' style='--d:1.09s'/>
<circle cx='248.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.44' class='a-pop' style='--d:1.09s'/>
<circle cx='252.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.44' class='a-pop' style='--d:1.09s'/>
<circle cx='256.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.45' class='a-pop' style='--d:1.10s'/>
<circle cx='260.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.46' class='a-pop' style='--d:1.10s'/>
<circle cx='264.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.47' class='a-pop' style='--d:1.11s'/>
<circle cx='268.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.48' class='a-pop' style='--d:1.11s'/>
<circle cx='272.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.49' class='a-pop' style='--d:1.11s'/>
<circle cx='276.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.50' class='a-pop' style='--d:1.12s'/>
<circle cx='280.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.50' class='a-pop' style='--d:1.12s'/>
<circle cx='284.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.51' class='a-pop' style='--d:1.13s'/>
<circle cx='288.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.52' class='a-pop' style='--d:1.13s'/>
<circle cx='292.7' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.53' class='a-pop' style='--d:1.13s'/>
<circle cx='300.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.54' class='a-pop' style='--d:1.14s'/>
<circle cx='307.9' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.55' class='a-pop' style='--d:1.14s'/>
<circle cx='315.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.56' class='a-pop' style='--d:1.15s'/>
<circle cx='322.8' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.56' class='a-pop' style='--d:1.15s'/>
<circle cx='330.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.57' class='a-pop' style='--d:1.15s'/>
<circle cx='337.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.58' class='a-pop' style='--d:1.16s'/>
<circle cx='344.6' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.59' class='a-pop' style='--d:1.16s'/>
<circle cx='351.7' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.60' class='a-pop' style='--d:1.17s'/>
<circle cx='358.7' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.61' class='a-pop' style='--d:1.17s'/>
<circle cx='365.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.62' class='a-pop' style='--d:1.17s'/>
<circle cx='372.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.62' class='a-pop' style='--d:1.18s'/>
<circle cx='378.9' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.63' class='a-pop' style='--d:1.18s'/>
<circle cx='385.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.64' class='a-pop' style='--d:1.19s'/>
<circle cx='391.6' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.65' class='a-pop' style='--d:1.19s'/>
<circle cx='397.8' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.66' class='a-pop' style='--d:1.19s'/>
<circle cx='403.8' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.67' class='a-pop' style='--d:1.20s'/>
<circle cx='409.7' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.68' class='a-pop' style='--d:1.20s'/>
<circle cx='415.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.69' class='a-pop' style='--d:1.21s'/>
<circle cx='421.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.69' class='a-pop' style='--d:1.21s'/>
<circle cx='426.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.70' class='a-pop' style='--d:1.21s'/>
<circle cx='431.9' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.71' class='a-pop' style='--d:1.22s'/>
<circle cx='437.1' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.72' class='a-pop' style='--d:1.22s'/>
<circle cx='442.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.73' class='a-pop' style='--d:1.23s'/>
<circle cx='447.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.74' class='a-pop' style='--d:1.23s'/>
<circle cx='451.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.75' class='a-pop' style='--d:1.23s'/>
<circle cx='455.2' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.75' class='a-pop' style='--d:1.24s'/>
<circle cx='459.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.76' class='a-pop' style='--d:1.24s'/>
<circle cx='463.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.77' class='a-pop' style='--d:1.25s'/>
<circle cx='467.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.78' class='a-pop' style='--d:1.25s'/>
<circle cx='471.3' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.79' class='a-pop' style='--d:1.25s'/>
<circle cx='475.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.80' class='a-pop' style='--d:1.26s'/>
<circle cx='479.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.81' class='a-pop' style='--d:1.26s'/>
<circle cx='483.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.81' class='a-pop' style='--d:1.27s'/>
<circle cx='487.4' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.82' class='a-pop' style='--d:1.27s'/>
<circle cx='491.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.83' class='a-pop' style='--d:1.27s'/>
<circle cx='495.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.84' class='a-pop' style='--d:1.28s'/>
<circle cx='499.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.85' class='a-pop' style='--d:1.28s'/>
<circle cx='503.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.86' class='a-pop' style='--d:1.29s'/>
<circle cx='507.5' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.87' class='a-pop' style='--d:1.29s'/>
<circle cx='511.6' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.87' class='a-pop' style='--d:1.29s'/>
<circle cx='515.6' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.88' class='a-pop' style='--d:1.30s'/>
<circle cx='519.6' cy='210' r='3.4' fill='var(--w-kept)' fill-opacity='0.89' class='a-pop' style='--d:1.30s'/>
<text x='16' y='258' class='lbl sm a-rise' style='--d:1.20s'>NoPE</text>
<text x='176' y='258' class='lbl sm a-fade' style='--d:1.40s;fill:var(--w-pruned)'>no frequency bands &#8212; the layer receives no explicit position</text>
<line x1='389.2' y1='60' x2='389.2' y2='276' stroke='var(--w-loss)' stroke-width='1.5' stroke-dasharray='4 4' class='a-breathe' style='--dur:3.6s;--lo:0.4;--hi:0.95'/>
<text x='389.2' y='292' class='lbl sm mid' style='fill:var(--w-loss)'>trained</text>
<line x1='447.3' y1='60' x2='447.3' y2='276' stroke='var(--w-loss)' stroke-width='1.5' stroke-dasharray='4 4' class='a-breathe' style='--dur:3.6s;--lo:0.4;--hi:0.95'/>
<text x='447.3' y='292' class='lbl sm mid' style='fill:var(--w-loss)'>target</text>
<text x='221.0' y='54' class='lbl sm mid'>10</text>
<text x='349.7' y='54' class='lbl sm mid'>1,000</text>
<text x='478.5' y='54' class='lbl sm mid'>100,000</text>
<text x='607.2' y='54' class='lbl sm mid'>10,000,000</text>
<text x='16' y='312' class='lbl sm'>The horizontal axis is logarithmic; notice which part of the spectrum each method moves.</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 4.</span> The same frequency bank under four approaches. Position Interpolation shifts every wavelength. Raising the base changes the slow end more strongly. YaRN preserves the fast end while stretching the slow end. NoPE removes explicit rotary frequencies from the layer.</div>
</div>

**Change the softmax instead.** Scalable-Softmax leaves RoPE unchanged and
modifies how attention logits are normalized.

- **Scalable-Softmax** ([Nakanishi, 2025](https://arxiv.org/abs/2501.19399))
  observes that, as the number of tokens $n$ grows, a fixed logit advantage
  produces a smaller maximum attention weight. SSMax scales logits using
  $\log n$ to offset this dilution.

**Let heads use different schedules.** Most implementations give every head
the same frequencies.

- **AdaRoPE** ([2026](https://arxiv.org/abs/2607.19363)) learns frequencies
  and scaling per head. To me, it makes sense that local and retrieval heads
  may need different ranges.

**Question RoPE itself.** These results made me doubt that one rescaled
frequency schedule can solve every long-context problem.

- **RoPE Distinguishes Neither Positions Nor Tokens, Provably**
  ([Du et al., May 2026](https://arxiv.org/abs/2605.15514)) argues, under its
  assumptions, that RoPE loses locality as context grows. It also finds that
  the base trades position discrimination against token discrimination.
- **Retrieval heads rely heavily on slow bands**
  ([June 2026](https://arxiv.org/abs/2606.21249)). In OLMo-2, masking 87
  retrieval heads drops recall from 1.00 to 0.00; zeroing their 32 slowest
  dimensions drops it to 0.18.
- **Why long-term decay can break down**
  ([ICLR 2025 blog post](https://iclr-blogposts.github.io/2025/blog/pocp/))
  studies POCP, the proportion of query-key subvector pairs with obtuse
  angles. At high POCP, scores can fluctuate instead of decaying smoothly.

### Where this could go

I wrote down five questions. I do not yet know whether each is new or
practical, but they helped me connect the papers:

- **Could slow bands be allocated specifically to retrieval heads?** AdaRoPE
  learns per-head frequencies; retrieval-head work finds long-range copiers.
  I have not found a study joining them.
- **Could POCP become a training objective rather than only a diagnostic?**
  Perhaps a regularizer could keep selected heads in a useful angular regime.
- **Can the RoPE/NoPE interleave schedule be chosen systematically?** RNoPE,
  SWAN-GPT, and iRoPE use fixed patterns. Could model measurements choose the
  schedule?
- **Do SSMax and NoPE solve overlapping problems?** They intervene at
  different points but both preserve long-range attention. I would like to
  see a joint ablation.
- **What benchmark would separate position failure from token-content
  failure?** Du et al. distinguish them theoretically, while a standard
  needle-in-a-haystack test may mix them.


<div class='lab wide' id='spec-lab'>
<div class='lab-head'><span class='name'>Lab 2 · three ways to stretch context</span><span class='hint'>choose a method, increase the length, and compare the costs</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label>method</label>
<div class='seg seg-method'>
<button type='button' data-value='none' aria-pressed='true'>as trained</button>
<button type='button' data-value='pi' aria-pressed='false'>PI</button>
<button type='button' data-value='ntk' aria-pressed='false'>NTK / base</button>
<button type='button' data-value='yarn' aria-pressed='false'>YaRN</button>
</div>
</div>
<div class='ctl'>
<label for='spec-s'>stretch factor <span class='val' id='spec-s-v'></span></label>
<input type='range' id='spec-s' min='1' max='64' step='1' value='8'>
</div>
<div class='ctl'>
<label for='spec-ctx'>trained context <span class='val' id='spec-ctx-v'></span></label>
<input type='range' id='spec-ctx' min='2048' max='32768' step='2048' value='4096'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--w-loss)'><span class='k'>slowest band pushed</span><span class='v' id='spec-stat-dead'></span></div>
<div class='stat' style='--stat-hue:var(--w-lav)'><span class='k'>local ruler</span><span class='v' id='spec-stat-max'></span></div>
<div class='stat' style='--stat-hue:var(--w-clay)'><span class='k'>YaRN attention temp</span><span class='v' id='spec-stat-temp'></span></div>
</div>
<div class='verdict' id='spec-verdict'></div>
<svg viewBox='0 0 700 210' role='img'></svg>
<p class='cap'>I use this lab to compare how far bands move beyond their training angles and how much local resolution the fastest bands lose. PI trades one cost for the other; NTK-aware scaling and YaRN spread the change unevenly.</p>
</div>
</div>

## Chat together

<div class='flashcard'>
<div class='fc-head'><span class='name'>The takeaways</span><button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>deal again</button></div>
<div class='fc-body'>
<div class='card' style='--d:0.08s'><span class='q'>what RoPE does</span><span class='a'>RoPE rotates query and key dimensions by angles proportional to position. Their shared absolute position cancels in the dot product, leaving relative position.</span></div>
<div class='card' style='--d:0.21s'><span class='q'>how I picture long-range decay</span><span class='a'>I picture one head as a bank of dials rotating at different speeds. As two initially aligned tokens move apart, the bands fall out of phase and can partially cancel, weakening the distance-dependent signal.</span></div>
<div class='card' style='--d:0.34s'><span class='q'>why signal-to-noise matters</span><span class='a'>Unrelated scores fluctuate around zero. When the signal from a distant match becomes comparable to that variation, one head cannot separate the two reliably from this signal alone.</span></div>
<div class='card' style='--d:0.47s'><span class='q'>the main design choice</span><span class='a'>Long-context methods interpolate slow bands, stretch them unevenly, raise the base, learn them per head, or remove rotation from selected layers.</span></div>
<div class='card' style='--d:0.60s'><span class='q'>what iRoPE is</span><span class='a'>iRoPE interleaves layers that use RoPE with layers that use no explicit positional encoding. The NoPE layers provide a path that does not depend on rotary distance.</span></div>
<div class='card' style='--d:0.73s'><span class='q'>what I am still wondering about</span><span class='a'>Changing the RoPE base may trade position discrimination against token discrimination. Could hybrid or head-specific designs avoid that tradeoff?</span></div>
</div>
</div>

## References

I list the original sources below in the order they appear.

1. Su et al. [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864), 2021 — the original RoPE paper.
2. Chen et al. [Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595), 2023 — Position Interpolation.
3. Peng et al. [YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071), 2023.
4. Microsoft. [LongRoPE2: Near-Lossless LLM Context Window Scaling](https://arxiv.org/abs/2502.20082), 2025.
5. Men et al. [Base of RoPE Bounds Context Length](https://arxiv.org/abs/2405.14591), NeurIPS 2024.
6. Kazemnejad et al. [The Impact of Positional Encoding on Length Generalization in Transformers](https://arxiv.org/abs/2305.19466), NeurIPS 2023 — NoPE.
7. Cohere. [RoPE to NoPE and Back Again: A New Hybrid Attention Strategy](https://arxiv.org/abs/2501.18795), 2025 — RNoPE.
8. NVIDIA. [SWAN-GPT: An Efficient and Scalable Approach for Long-Context Language Modeling](https://arxiv.org/abs/2504.08719), 2025.
9. Meta. [The Llama 4 herd](https://ai.meta.com/blog/llama-4-multimodal-intelligence/), 2025 — iRoPE.
10. Nakanishi. [Scalable-Softmax Is Superior for Attention](https://arxiv.org/abs/2501.19399), 2025 — SSMax.
11. [AdaRoPE: Not All Attention Heads Should Rotate and Scale Equally](https://arxiv.org/abs/2607.19363), 2026 — learnable per-head frequencies.
12. Du et al. [RoPE Distinguishes Neither Positions Nor Tokens in Long Contexts, Provably](https://arxiv.org/abs/2605.15514), 2026.
13. [Does RoPE Prevent or Degrade Retrieval Heads? A Mechanistic Analysis](https://arxiv.org/abs/2606.21249), 2026.
14. [Why RoPE Struggles to Maintain Long-Term Decay in Long Sequences?](https://iclr-blogposts.github.io/2025/blog/pocp/) ICLR 2025 blogpost — POCP.

NTK-aware scaling is the one method here without a conventional paper
citation. It originated in a community discussion and was later adopted in
many implementations.
