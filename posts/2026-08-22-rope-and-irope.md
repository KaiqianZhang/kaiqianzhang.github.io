---
title: RoPE and iRoPE
subtitle: Position becomes an angle, the angle decays, and the fix everyone converged on is to stop encoding position in some layers altogether.
date: 2026-08-22
tags: llm
format: three-part
---

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 326' role='img' aria-label='A braced tree of the post: three sections, each expanding into the ideas it covers'>
<text x='14' y='189.5' class='lbl bg a-pop' style='--d:0.00s;fill:var(--w-plum)'>RoPE and iRoPE</text>
<path d='M142.0 65.0 C138.7 65.0, 138.7 178.5, 120.0 184.5 C138.7 190.5, 138.7 304.0, 142.0 304.0' fill='none' stroke='var(--w-plum)' stroke-width='2.4' stroke-linecap='round' class='a-draw' style='--d:0.25s;--dur:0.9s'/>
<circle cx='152' cy='65.0' r='4' fill='var(--w-student)' class='a-beat' style='--dur:1.9s;--d:0.50s'/>
<text x='164' y='70.0' class='lbl a-rise' style='--d:0.50s;fill:var(--w-student)'>① Learning together</text>
<rect x='306' y='55.0' width='44' height='19' rx='9' fill='var(--w-student)' fill-opacity='0.16' class='a-pop' style='--d:0.62s'/>
<text x='328' y='69.0' class='lbl sm mid a-fade' style='--d:0.72s;fill:var(--w-student)'>5 min</text>
<path d='M388.0 26.0 C384.7 26.0, 384.7 59.0, 366.0 65.0 C384.7 71.0, 384.7 104.0, 388.0 104.0' fill='none' stroke='var(--w-student)' stroke-width='2.0' stroke-linecap='round' class='a-draw' style='--d:0.95s;--dur:0.9s'/>
<text x='396' y='30.0' class='lbl sm a-rise' style='--d:1.15s'>position becomes an angle that cancels</text>
<text x='396' y='56.0' class='lbl sm a-rise' style='--d:1.22s'>a bank of dials, fast to slow</text>
<text x='396' y='82.0' class='lbl sm a-rise' style='--d:1.29s'>long-range decay, and the floor under it</text>
<text x='396' y='108.0' class='lbl sm a-rise' style='--d:1.36s'>iRoPE — drop position in some layers</text>
<circle cx='152' cy='204.0' r='4' fill='var(--w-teacher)' class='a-beat' style='--dur:2.2s;--d:0.65s'/>
<text x='164' y='209.0' class='lbl a-rise' style='--d:0.65s;fill:var(--w-teacher)'>② Inspire together</text>
<rect x='306' y='194.0' width='44' height='19' rx='9' fill='var(--w-teacher)' fill-opacity='0.16' class='a-pop' style='--d:0.77s'/>
<text x='328' y='208.0' class='lbl sm mid a-fade' style='--d:0.87s;fill:var(--w-teacher)'>4 min</text>
<path d='M388.0 152.0 C384.7 152.0, 384.7 198.0, 366.0 204.0 C384.7 210.0, 384.7 256.0, 388.0 256.0' fill='none' stroke='var(--w-teacher)' stroke-width='2.0' stroke-linecap='round' class='a-draw' style='--d:1.13s;--dur:0.9s'/>
<text x='396' y='156.0' class='lbl sm a-rise' style='--d:1.33s'>stretch the bands — PI, NTK, YaRN</text>
<text x='396' y='182.0' class='lbl sm a-rise' style='--d:1.40s'>raise the base — and the bound on it</text>
<text x='396' y='208.0' class='lbl sm a-rise' style='--d:1.47s'>drop position — NoPE, RNoPE, SWAN, iRoPE</text>
<text x='396' y='234.0' class='lbl sm a-rise' style='--d:1.54s'>fix the softmax — SSMax</text>
<text x='396' y='260.0' class='lbl sm a-rise' style='--d:1.61s'>where this could go — five openings</text>
<circle cx='152' cy='304.0' r='4' fill='var(--w-loss)' class='a-beat' style='--dur:2.6s;--d:0.80s'/>
<text x='164' y='309.0' class='lbl a-rise' style='--d:0.80s;fill:var(--w-loss)'>③ Chat together</text>
<rect x='306' y='294.0' width='44' height='19' rx='9' fill='var(--w-loss)' fill-opacity='0.16' class='a-pop' style='--d:0.92s'/>
<text x='328' y='308.0' class='lbl sm mid a-fade' style='--d:1.02s;fill:var(--w-loss)'>1 min</text>
<path d='M366 304.0 L388 304.0' fill='none' stroke='var(--w-loss)' stroke-width='2' stroke-linecap='round' class='a-draw' style='--d:1.31s'/>
<text x='396' y='308.0' class='lbl sm a-rise' style='--d:1.51s'>six things you could say out loud</text>
</svg>
</div>

## Learning together

Attention is a set operation: strip position out and *"the dog bit the man"*
and *"the man bit the dog"* are the same input. **RoPE** — rotary position
embedding — is how almost every open model puts the order back, and I still
think it is the prettiest idea in the modern transformer.

The trick fits in a line. Take the query and key **two coordinates at a
time** — I will call each such pair a **band** — read each band as a point on
a dial, and **turn that dial by an angle proportional to the token's
position**.

$$q_m \rightarrow R_m q, \qquad k_n \rightarrow R_n k, \qquad
\langle R_m q,\; R_n k\rangle = \langle q,\; R_{n-m} k\rangle$$

That equality is the whole design, and if you remember one line from me, I
would like it to be this one. Rotating both and then taking the dot product
leaves a rotation by $n-m$ — **the difference of the two positions**. Absolute
position is injected and then deliberately cancels.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 300' role='img' aria-label='Three dials on one clock, turning at rates proportional to their real wavelengths, each carrying a query arrow and a key arrow with a fixed wedge between them'>
<text x='16' y='22' class='lbl sm'>a band is one pair of coordinates, read as a dial. a head runs d/2 of them, each turning by its own angle per token.</text>
<text x='16' y='40' class='lbl sm'>all three run off one clock — by the time the first has gone round 32 times, the third has turned once.</text>
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
<div class='caption'><span class='caption-label'>Figure 1.</span> Three bands from one head, turning at rates proportional to their real wavelengths. Both arrows rotate with position; the wedge between them never changes. I stopped at band 24 because band 56 turns three thousand times slower, and no animation shows that honestly.</div>
</div>

A head does not run one dial. It runs one per band, $d/2$ in all, at angles

$$\theta_i = \theta_{\text{base}}^{-2i/d}, \qquad i = 0 \ldots d/2-1$$

which for the usual base of 10,000 spans **four orders of magnitude**. Band 0
completes a turn every 6 tokens; band 56 takes about 20,000. That spread is
the part I want you to hold on to:

- **Fast bands are a local ruler.** They resolve "three tokens back" sharply,
  and wrap uselessly over long distances.
- **Slow bands are the long-range ruler.** They are the only ones that can
  still tell 5,000 apart from 6,000.
- **A band is only useful if it turns at least once inside your context.**
  Slower than that and it returns nearly the same angle for every position it
  sees — it cannot distinguish anything.
- **So the frequency spectrum is the design surface.** Nearly every long
  context method in the literature is a decision about what to do with the
  slow end of this bank.

### Long-range decay, which was sold as a feature

Here is the part I find genuinely uncomfortable. Put two tokens that really
do match — a query and key that agree across the bands — and slide them
apart.

At distance zero every band contributes fully. As distance grows each band
turns at its own rate, they fall out of step, and their contributions start
cancelling. The score falls. This is **long-range decay**, which the original
RoPE paper presents as a feature: nearby tokens naturally matter more.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 214' role='img' aria-label='RoPE relative attention score falling as distance grows and then flattening into a noise floor'>
<text x='16' y='22' class='lbl sm'>relative attention score for a query and key that match, as they move apart</text>
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
<text x='70' y='143.6' class='lbl sm' style='fill:var(--w-pruned)'>noise floor &#8212; an unrelated pair scores this much</text>
<path d='M62.0 43.8 L107.4 53.1 L133.9 63.3 L152.8 70.4 L167.4 73.2 L179.3 73.4 L189.4 73.9 L198.2 76.1 L205.9 79.3 L212.8 81.8 L219.0 82.8 L224.7 82.7 L229.9 83.0 L234.8 84.4 L239.3 86.4 L243.5 88.0 L247.5 88.4 L254.8 88.3 L261.3 91.2 L267.3 92.4 L272.8 92.0 L277.8 94.8 L282.5 95.6 L286.8 94.7 L290.9 97.8 L294.8 98.4 L300.2 97.7 L305.2 101.7 L309.8 97.9 L314.1 106.0 L318.1 97.4 L323.2 109.6 L327.9 99.1 L332.2 110.3 L336.3 102.5 L340.2 109.9 L344.7 104.2 L348.9 109.3 L352.9 113.1 L357.4 111.6 L361.5 119.4 L365.5 109.4 L369.8 119.2 L373.8 107.1 L378.1 113.6 L382.2 111.3 L386.0 120.8 L390.1 122.9 L394.3 117.1 L398.3 126.6 L402.4 112.0 L406.2 121.4 L410.2 119.5 L414.3 125.3 L418.3 129.3 L422.2 117.4 L426.1 126.1 L430.0 118.1 L433.9 127.9 L437.8 123.6 L441.7 134.9 L445.6 138.3 L449.5 125.2 L453.5 130.5 L457.3 130.9 L461.3 131.4 L465.1 143.7 L469.0 122.8 L473.0 137.4 L476.8 136.2 L480.6 139.4 L484.5 142.8 L488.4 132.3 L492.2 141.7 L496.1 135.3 L499.9 135.9 L503.8 136.8 L507.7 147.0 L511.6 154.7 L515.4 130.9 L519.3 152.2 L523.1 148.4 L526.9 149.4 L530.8 161.7 L534.6 142.9 L538.4 146.6 L542.3 140.1 L546.1 144.4 L549.9 164.1 L553.8 143.1 L557.6 151.6 L561.4 151.7 L565.3 149.1 L569.1 167.1 L572.9 142.3 L576.7 151.8 L580.6 152.5 L584.4 156.0 L588.2 160.8 L592.0 148.7 L595.9 157.4 L599.7 157.4 L603.5 163.7 L607.3 155.2 L611.2 164.6 L615.0 171.4 L618.8 151.5 L622.6 158.3 L626.5 158.9 L630.3 172.3 L634.1 177.2 L637.9 156.0 L641.7 174.9 L645.6 179.3 L649.4 172.0' fill='none' stroke='var(--w-student)' stroke-width='2.2' stroke-linejoin='round' class='a-draw' style='--dur:2.4s'/>
<text x='133.9' y='57.7' class='lbl sm a-fade' style='--d:2.50s;fill:var(--w-student)'>the score decays with distance</text>
<line x1='561.2' y1='34.0' x2='561.2' y2='172.4' stroke='var(--w-loss)' stroke-width='1.6' stroke-dasharray='4 4'/>
<text x='561.2' y='28.0' class='lbl sm mid' style='fill:var(--w-loss)'>trained length</text>
<text x='571.6' y='110.8' class='lbl sm a-fade' style='--d:3.00s;fill:var(--w-loss)'>past here it is not</text>
<text x='571.6' y='126.0' class='lbl sm a-fade' style='--d:3.05s;fill:var(--w-loss)'>decaying, it is rattling</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> The relative score for a matching pair, computed from the real bank at base 10,000. It falls — that is the long-range decay — then stops falling and levels out at what an unrelated pair scores.</div>
</div>

It is desirable right up until it isn't, and it took me a while to see why.
The problem is not that the score decays; it is **what it decays to**:

- An unrelated query and key do not score zero. They score around
  $1/\sqrt{d/2}$ — random phases adding up to a nonzero floor.
- Once a matching pair has decayed to that floor, **the score no longer
  carries information**. "These two tokens belong together, 6,000 apart" and
  "these two have nothing to do with each other" produce the same number.
- Past the trained length it is worse than decay. The curve stops falling and
  starts oscillating around the floor, because the model has never seen those
  rotation angles and has no reason to behave smoothly there.

That, to me, is the ceiling — not an implementation bug but the geometry of
adding up rotating vectors, and why a model trained at 8K does not merely get *worse* at
100K but stops discriminating at all.

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
<div class='stat' style='--stat-hue:var(--w-pruned)'><span class='k'>noise floor</span><span class='v' id='dec-stat-floor'></span></div>
<div class='stat' style='--stat-hue:var(--w-kept)'><span class='k'>usable range</span><span class='v' id='dec-stat-range'></span></div>
</div>
<div class='verdict' id='dec-verdict'></div>
<svg viewBox='0 0 700 268' role='img'></svg>
<p class='cap'>Computed from the real bank. Violet is a query and key that <b>agree</b>; the clay band is where an <b>unrelated</b> pair sits. Once violet is inside clay, the score says nothing about whether the two tokens match.</p>
</div>
</div>

### iRoPE: stop encoding position in some layers

The fix I did not see coming, and the one the field converged on: **in some
layers, encode no position at all.**

A layer with no positional encoding is not orderless. Causal masking already
leaks position — a token at index 5 can see five things, one at index 5,000
can see five thousand — and that difference is learnable. This is **NoPE**,
and the order it recovers is *implicit*. Crucially, **nothing in it decays
with distance**, because nothing in it depends on distance.

So interleave. Most layers keep RoPE and work locally; every fourth or so gets
nothing and carries the long range. That is **iRoPE** — *i* for interleaved —
and it is what Llama 4 Scout uses to claim a 10M context.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 292' role='img' aria-label='A stack of layers where most carry rotary position and every fourth carries none, with information hopping locally in the first and jumping far in the second'>
<text x='16' y='24' class='lbl sm'>a token's information moving up the stack: short hops where position is encoded, one long jump where it is not</text>
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
<text x='340' y='258' class='lbl sm mid' style='fill:var(--w-teacher)'>the bare layers are the only place two distant tokens can reach each other with nothing decaying in between</text>
<rect x='34' y='272' width='12' height='12' rx='3' fill='var(--w-student)' fill-opacity='0.16'/>
<text x='52' y='282' class='lbl sm'>RoPE &#8212; local, and it fades</text>
<rect x='300' y='272' width='12' height='12' rx='3' fill='var(--w-teacher)' fill-opacity='0.85'/>
<text x='318' y='282' class='lbl sm'>NoPE &#8212; global, order inferred from the causal mask alone</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> The interleave. Most layers carry rotary position and work locally; every fourth carries none, and has no distance-dependent term left to decay.</div>
</div>

## Inspire together

I read all of it as one question asked six ways: **what to do about the slow
bands.**

**Stretch them.**

- **Position Interpolation** ([Chen et al., 2023](https://arxiv.org/abs/2306.15595)) — divide every position index by the stretch factor. Uniform, so it blunts the fast bands too.
- **NTK-aware scaling** — raise the base: slow bands stretch a lot, fast bands barely. Community-invented, never published, universally used.
- **YaRN** ([Peng et al., 2023](https://arxiv.org/abs/2309.00071)) — NTK-by-parts: leave bands that already turn often alone, fully interpolate the ones that barely turn, ramp between. Plus attention temperature $t = 0.1\ln s + 1$. Llama 3.1 uses this.
- **LongRoPE2** ([Microsoft, 2025](https://arxiv.org/abs/2502.20082)) — searches the per-band rescaling rather than deriving it.

**Raise the base.**

- **Base of RoPE Bounds Context Length** ([Men et al., NeurIPS 2024](https://arxiv.org/abs/2405.14591)) — the sharpest result here: for a target length there is a **lower bound** on the base, below which a model can only *look* like it handles long context. Llama 3's 500,000 is this in production.

**Delete position in some layers.**

- **NoPE** ([Kazemnejad et al., NeurIPS 2023](https://arxiv.org/abs/2305.19466)) — decoder-only transformers length-generalise *better* with no positional encoding at all.
- **RNoPE** ([Cohere, 2025](https://arxiv.org/abs/2501.18795)) — interleaves the two and shows why it works: retrieval concentrates in the NoPE layers, with a spike of attention mass on the target span.
- **SWAN-GPT** ([NVIDIA, 2025](https://arxiv.org/abs/2504.08719)) — NoPE interleaved with sliding-window RoPE; an existing model can be **converted** with modest retraining.
- **iRoPE** ([Meta, Llama 4](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)) — the same shape at scale.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 320' role='img' aria-label='Each long context method shown as what it does to the bank of wavelengths'>
<text x='16' y='18' class='lbl sm'>every band's wavelength, in tokens.</text>
<text x='16' y='32' class='lbl sm'>interpolation slides every band; NTK and YaRN slide mostly the slow end.</text>
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
<text x='176' y='258' class='lbl sm a-fade' style='--d:1.40s;fill:var(--w-pruned)'>no bands at all &#8212; the layer is told nothing about position</text>
<line x1='389.2' y1='60' x2='389.2' y2='276' stroke='var(--w-loss)' stroke-width='1.5' stroke-dasharray='4 4' class='a-breathe' style='--dur:3.6s;--lo:0.4;--hi:0.95'/>
<text x='389.2' y='292' class='lbl sm mid' style='fill:var(--w-loss)'>trained</text>
<line x1='447.3' y1='60' x2='447.3' y2='276' stroke='var(--w-loss)' stroke-width='1.5' stroke-dasharray='4 4' class='a-breathe' style='--dur:3.6s;--lo:0.4;--hi:0.95'/>
<text x='447.3' y='292' class='lbl sm mid' style='fill:var(--w-loss)'>target</text>
<text x='221.0' y='54' class='lbl sm mid'>10</text>
<text x='349.7' y='54' class='lbl sm mid'>1,000</text>
<text x='478.5' y='54' class='lbl sm mid'>100,000</text>
<text x='607.2' y='54' class='lbl sm mid'>10,000,000</text>
<text x='16' y='312' class='lbl sm'>log scale &#8212; what matters is which end of the bank each method moves</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 4.</span> The same bank under each family of fix. Interpolation slides everything right, blunting the fast bands; raising the base stretches the slow end much more; YaRN moves only the slow end; NoPE removes the bank.</div>
</div>

**Fix the softmax instead.**

- **Scalable-Softmax** ([Nakanishi, 2025](https://arxiv.org/abs/2501.19399)) — as $n$ grows, softmax's largest attainable weight shrinks and attention flattens. SSMax scales logits by $s\log n$ to cancel it.

**Stop treating heads alike.**

- **AdaRoPE** ([2026](https://arxiv.org/abs/2607.19363)) — learnable per-head frequencies and attention scaling, on the finding that heads with different jobs want different frequency ranges. Beats partial-RoPE, NoPE and YaRN.

**Or: the approach may be wrong.**

- **RoPE Distinguishes Neither Positions Nor Tokens, Provably** ([Du et al., May 2026](https://arxiv.org/abs/2605.15514)) — as context grows RoPE provably loses its locality bias, failure probability approaching chance. And the base **trades distinguishing positions against distinguishing tokens, and cannot keep both.**
- **Retrieval heads run on the slow bands** ([June 2026](https://arxiv.org/abs/2606.21249)) — across OLMo-2, Qwen, Llama and Gemma: masking OLMo-2's 87 retrieval heads drops recall from 1.00 to 0.00, and zeroing only the 32 lowest-frequency RoPE dimensions inside them drops it to 0.18. The long-range machinery lives in exactly the bands that break first.
- **Why decay stops holding** ([ICLR 2025 blogpost](https://iclr-blogposts.github.io/2025/blog/pocp/)) — POCP, the share of obtuse angles between query and key sub-vectors, predicts it: above ~50% the score fluctuates instead of decaying, and long-context post-training mostly works by *lowering* it.

### Where this could go

Each sits in a gap between two papers above, and I would happily take any.

- **Give the slow bands to the heads measured to need them.** AdaRoPE *learns* per-head frequencies; the retrieval-head work *identifies* which heads do the long-range copying. Join them — allocate by measurement, not gradient. The detector exists.
- **Make POCP an objective, not a diagnostic.** It predicts decay failure before the loss does, and post-training already lowers it by accident.

- **Derive the interleave ratio.** RNoPE, SWAN-GPT and iRoPE all pick "every fourth layer" by hand. Predict the right NoPE fraction from POCP or a head census and a hyperparameter becomes a measurement.
- **Test whether SSMax and NoPE are redundant.** Same symptom, opposite ends, and Llama 4 ships both. If SSMax cuts how many NoPE layers you need, nobody has measured it.
- **Build the benchmark the negative result implies.** Du et al. prove *two* failures — position and token indistinguishability. Needle-in-a-haystack conflates them, and saturates.

<div class='lab wide' id='spec-lab'>
<div class='lab-head'><span class='name'>Lab 2 · the four ways to stretch a context</span><span class='hint'>pick a method, then stretch it and read both costs</span></div>
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
<p class='cap'>Two costs. <b>Vertical</b>: how far past its trained angles each band is pushed — 1× means it never meets an unfamiliar one. <b>Local ruler</b>: resolution the fastest band gave up. PI buys safety with resolution; NTK and YaRN get both.</p>
</div>
</div>

## Chat together

<div class='flashcard'>
<div class='fc-head'><span class='name'>The takeaways</span><span class='hint'>six things you could say out loud</span><button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>deal again</button></div>
<div class='fc-body'>
<div class='card' style='--d:0.08s'><span class='q'>what RoPE does</span><span class='a'>Turns each pair of dimensions by an angle proportional to position. The rotation cancels in the dot product, so attention only sees the <em>difference</em> of two positions.</span></div>
<div class='card' style='--d:0.21s'><span class='q'>what long-range decay is</span><span class='a'>A head is a bank of dials at different speeds. Two matching tokens start in phase; as they separate the dials fall out of step and cancel, so the score decays with distance.</span></div>
<div class='card' style='--d:0.34s'><span class='q'>why that is a ceiling</span><span class='a'>It decays <em>to the score an unrelated pair gets</em>. Past that point "related, far apart" and "unrelated" are the same number.</span></div>
<div class='card' style='--d:0.47s'><span class='q'>the one design surface</span><span class='a'>Every fix is a decision about the slow bands: interpolate them, stretch them unevenly, raise the base, or delete them. That is the whole literature.</span></div>
<div class='card' style='--d:0.60s'><span class='q'>what iRoPE is</span><span class='a'>Interleave. Most layers keep RoPE; every fourth gets none and infers order from the causal mask. Cohere and NVIDIA published the shape; Llama 4 ships it.</span></div>
<div class='card' style='--d:0.73s'><span class='q'>what to argue about</span><span class='a'>A 2026 proof says the base trades position-discrimination against token-discrimination and cannot keep both. If it holds, rescaling never saves RoPE.</span></div>
</div>
</div>
