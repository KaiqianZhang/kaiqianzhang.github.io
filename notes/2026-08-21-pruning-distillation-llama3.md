---
title: Pruning & Distillation in LLaMA3
subtitle: How an 8B model becomes a 4B model that still knows most of what it knew, and why the tokenizer decides whether the prompt fits at all.
date: 2026-08-21
tags: foundations, post-training
keywords: tokenizer compression ratio, pruning, distillation, KL divergence, logits, SwiGLU
---

<p class='lede'>Three ideas that belong together: what makes a tokenizer good, what it means to cut a model down, and how the cut-down model is taught to behave like the one it came from. They are the three places a model's size actually gets decided — how much text a token carries, how many weights survive, and how well the survivors are retrained.</p>

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 266' role='img' aria-label='A braced tree of the sections in this note'>
<text x='14' y='121.0' class='lbl bg a-pop' style='--d:0.00s;fill:var(--n-plum)'>Pruning &amp;</text>
<text x='14' y='143.0' class='lbl bg a-pop' style='--d:0.08s;fill:var(--n-plum)'>Distillation</text>
<path d='M172.0 34.0 C168.7 34.0, 168.7 130.0, 150.0 136.0 C168.7 142.0, 168.7 238.0, 172.0 238.0' fill='none' stroke='var(--n-plum)' stroke-width='2.2' stroke-linecap='round' class='a-draw' style='--d:0.25s;--dur:0.9s'/>
<circle cx='186' cy='30.0' r='4' fill='var(--n-student)' class='a-beat' style='--dur:1.9s;--d:0.50s'/>
<text x='200' y='34.0' class='lbl a-rise' style='--d:0.50s;fill:var(--n-student)'>Tokenizer compression ratio</text>
<text x='452' y='34.0' class='lbl sm a-rise' style='--d:0.60s'>how much text one token carries</text>
<circle cx='186' cy='64.0' r='4' fill='var(--n-teacher)' class='a-beat' style='--dur:2.2s;--d:0.58s'/>
<text x='200' y='68.0' class='lbl a-rise' style='--d:0.58s;fill:var(--n-teacher)'>Can 8K read 10,000 words?</text>
<text x='452' y='68.0' class='lbl sm a-rise' style='--d:0.68s'>the arithmetic, in both languages</text>
<circle cx='186' cy='98.0' r='4' fill='var(--n-loss)' class='a-beat' style='--dur:2.5s;--d:0.66s'/>
<text x='200' y='102.0' class='lbl a-rise' style='--d:0.66s;fill:var(--n-loss)'>Pruning</text>
<text x='452' y='102.0' class='lbl sm a-rise' style='--d:0.76s'>structured, and along which axis</text>
<circle cx='186' cy='132.0' r='4' fill='var(--n-kept)' class='a-beat' style='--dur:2.8s;--d:0.74s'/>
<text x='200' y='136.0' class='lbl a-rise' style='--d:0.74s;fill:var(--n-kept)'>Distillation</text>
<text x='452' y='136.0' class='lbl sm a-rise' style='--d:0.84s'>teacher frozen, student learning</text>
<circle cx='186' cy='166.0' r='4' fill='var(--n-pruned)' class='a-beat' style='--dur:1.9s;--d:0.82s'/>
<text x='200' y='170.0' class='lbl a-rise' style='--d:0.82s;fill:var(--n-pruned)'>The process, end to end</text>
<text x='452' y='170.0' class='lbl sm a-rise' style='--d:0.92s'>the five steps</text>
<circle cx='186' cy='200.0' r='4' fill='var(--n-lav)' class='a-beat' style='--dur:2.2s;--d:0.90s'/>
<text x='200' y='204.0' class='lbl a-rise' style='--d:0.90s;fill:var(--n-lav)'>Loss can be many things</text>
<text x='452' y='204.0' class='lbl sm a-rise' style='--d:1.00s'>where a loss can attach</text>
<circle cx='186' cy='234.0' r='4' fill='var(--n-data)' class='a-beat' style='--dur:2.5s;--d:0.98s'/>
<text x='200' y='238.0' class='lbl a-rise' style='--d:0.98s;fill:var(--n-data)'>What it bought</text>
<text x='452' y='238.0' class='lbl sm a-rise' style='--d:1.08s'>the numbers NVIDIA published</text>
</svg>
</div>

[TOC]

## Tokenizer compression ratio

To judge whether a tokenizer is good, look at its **compression ratio**: how much original text a single token can represent.

$$\text{compression ratio} = \frac{\#\ \text{of characters}}{\#\ \text{of tokens}}$$

Two working numbers, one per language:

- Chinese — **1.5 Chinese characters / token**
- English — **0.75 English words / token**

The unit switches between the two lines, and that is deliberate rather than sloppy: a Chinese character already carries roughly as much meaning as an English word, so the useful denominator differs by language. Written strictly in characters, English is closer to 4 characters per token; written in words, 0.75 is the number worth carrying in your head.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 282' role='img' aria-label='The same span of text divided into words and into tokens, for English and for Chinese'>
<text x='16' y='26' class='lbl sm'>one span of text, cut two ways</text>
<text x='16' y='66' class='lbl'>English</text>
<text x='16' y='84' class='lbl sm'>0.75 words / token</text>
<rect x='170.0' y='42' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:0.05s'/>
<text x='206.0' y='61' class='lbl sm mid on a-fade' style='--d:0.20s'>the</text>
<rect x='246.0' y='42' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:0.12s'/>
<text x='282.0' y='61' class='lbl sm mid on a-fade' style='--d:0.27s'>cat</text>
<rect x='322.0' y='42' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:0.19s'/>
<text x='358.0' y='61' class='lbl sm mid on a-fade' style='--d:0.34s'>sat</text>
<rect x='398.0' y='42' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:0.26s'/>
<text x='434.0' y='61' class='lbl sm mid on a-fade' style='--d:0.41s'>on</text>
<rect x='474.0' y='42' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:0.33s'/>
<text x='510.0' y='61' class='lbl sm mid on a-fade' style='--d:0.48s'>the</text>
<rect x='550.0' y='42' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:0.40s'/>
<text x='586.0' y='61' class='lbl sm mid on a-fade' style='--d:0.55s'>mat</text>
<text x='396.0' y='36' class='lbl sm mid a-fade' style='--d:0.55s'>6 words</text>
<rect x='170.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.65s'/>
<line x1='196.5' y1='70' x2='196.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:0.65s'/>
<rect x='227.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.71s'/>
<line x1='253.5' y1='70' x2='253.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:0.71s'/>
<rect x='284.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.77s'/>
<line x1='310.5' y1='70' x2='310.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:0.77s'/>
<rect x='341.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.83s'/>
<line x1='367.5' y1='70' x2='367.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:0.83s'/>
<rect x='398.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.89s'/>
<line x1='424.5' y1='70' x2='424.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:0.89s'/>
<rect x='455.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.95s'/>
<line x1='481.5' y1='70' x2='481.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:0.95s'/>
<rect x='512.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:1.01s'/>
<line x1='538.5' y1='70' x2='538.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:1.01s'/>
<rect x='569.0' y='94' width='53.0' height='28' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:1.07s'/>
<line x1='595.5' y1='70' x2='595.5' y2='94' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:1.07s'/>
<text x='396.0' y='140' class='lbl sm mid a-fade' style='--d:1.20s'>8 tokens</text>
<text x='16' y='198' class='lbl'>Chinese</text>
<text x='16' y='216' class='lbl sm'>1.5 characters / token</text>
<rect x='170.0' y='174' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:1.35s'/>
<text x='206.0' y='193' class='lbl sm mid on a-fade' style='--d:1.50s'>猫</text>
<rect x='246.0' y='174' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:1.42s'/>
<text x='282.0' y='193' class='lbl sm mid on a-fade' style='--d:1.57s'>坐</text>
<rect x='322.0' y='174' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:1.49s'/>
<text x='358.0' y='193' class='lbl sm mid on a-fade' style='--d:1.64s'>在</text>
<rect x='398.0' y='174' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:1.56s'/>
<text x='434.0' y='193' class='lbl sm mid on a-fade' style='--d:1.71s'>垫</text>
<rect x='474.0' y='174' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:1.63s'/>
<text x='510.0' y='193' class='lbl sm mid on a-fade' style='--d:1.78s'>子</text>
<rect x='550.0' y='174' width='72.0' height='28' rx='5' fill='var(--n-data)' fill-opacity='0.85' class='a-pop' style='--d:1.70s'/>
<text x='586.0' y='193' class='lbl sm mid on a-fade' style='--d:1.85s'>上</text>
<text x='396.0' y='168' class='lbl sm mid a-fade' style='--d:1.85s'>6 characters</text>
<rect x='170.0' y='226' width='110.0' height='28' rx='5' fill='var(--n-teacher)' fill-opacity='0.88' class='a-pop' style='--d:1.95s'/>
<line x1='225.0' y1='202' x2='225.0' y2='226' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:1.95s'/>
<rect x='284.0' y='226' width='110.0' height='28' rx='5' fill='var(--n-teacher)' fill-opacity='0.88' class='a-pop' style='--d:2.03s'/>
<line x1='339.0' y1='202' x2='339.0' y2='226' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:2.03s'/>
<rect x='398.0' y='226' width='110.0' height='28' rx='5' fill='var(--n-teacher)' fill-opacity='0.88' class='a-pop' style='--d:2.11s'/>
<line x1='453.0' y1='202' x2='453.0' y2='226' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:2.11s'/>
<rect x='512.0' y='226' width='110.0' height='28' rx='5' fill='var(--n-teacher)' fill-opacity='0.88' class='a-pop' style='--d:2.19s'/>
<line x1='567.0' y1='202' x2='567.0' y2='226' stroke='var(--n-edge)' stroke-width='1' class='a-fade' style='--d:2.19s'/>
<text x='396.0' y='266' class='lbl sm mid a-fade' style='--d:2.35s'>4 tokens</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> The same six units of text, divided into words and into tokens. English needs more tokens than it has words (0.75 words per token); Chinese needs fewer than it has characters (1.5 characters per token). One token is a different amount of text in each language, which is the whole content of the ratio.</div>
</div>

A higher ratio is better twice over. The same document costs fewer tokens, so it is cheaper to run and leaves more of the window for the answer; and the model sees longer stretches of real text inside a fixed context. This is why Llama 3 moved from Llama 2's 32K SentencePiece vocabulary to a 128,256-entry tiktoken-based one — Meta report **up to 15% fewer tokens** for the same text, which is a 15% discount on every prompt, forever, bought once at training time.

## Can an 8K model read a 10,000-word prompt?

> **Q.** If my input prompt is 10,000 words, and the max-len of a LLM is 8192, can this LLM correctly receive and output correctly?
>
> **A.** We can simply compute it.

Multiply the window by the ratio and you get capacity in units of original text. With 8,000 tokens as the round number for an 8K window:

| window | Chinese (× 1.5) | English (× 0.75) |
| --- | --- | --- |
| 8K | 8,000 × 1.5 = **12,000 characters** | 8,000 × 0.75 = **6,000 words** |
| 32K | 32,000 × 1.5 = **48,000 characters** | 32,000 × 0.75 = **24,000 words** |
| 128K | 128,000 × 1.5 = **192,000 characters** | 128,000 × 0.75 = **96,000 words** |

So the answer depends entirely on the language. In Chinese, an 8K window holds 12,000 characters and a 10,000-character prompt fits with room to spare — **yes**. In English, the same window holds only 6,000 words, and a 10,000-word prompt is 4,000 words too long: the model never sees the end of it, and whatever it answers is an answer to a truncated question. You need a 32K window before the prompt fits, and you want more than that, because the reply has to come out of the same budget.

<div class='lab wide' id='tok-lab'>
<div class='lab-head'><span class='name'>Lab 1 · tokenizer budget</span><span class='hint'>drag the prompt, the ratio, or switch language</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label>language</label>
<div class='seg seg-lang'>
<button type='button' data-value='en' aria-pressed='true'>English</button>
<button type='button' data-value='zh' aria-pressed='false'>Chinese</button>
</div>
</div>
<div class='ctl'>
<label for='tok-amount'>prompt length <span class='val' id='tok-amount-v'></span></label>
<input type='range' id='tok-amount' min='500' max='40000' step='100' value='10000'>
</div>
<div class='ctl'>
<label for='tok-ratio'>compression ratio <span class='val' id='tok-ratio-v'></span></label>
<input type='range' id='tok-ratio' min='0.2' max='3.0' step='0.05' value='0.75'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>tokens needed</span><span class='v' id='tok-stat-tokens'></span></div>
<div class='stat' style='--stat-hue:var(--n-data)'><span class='k'>compression ratio</span><span class='v' id='tok-stat-ratio'></span></div>
<div class='stat' style='--stat-hue:var(--n-teacher)'><span class='k'>smallest window that fits</span><span class='v' id='tok-stat-fit'></span></div>
</div>
<div class='verdict' id='tok-verdict'></div>
<svg viewBox='0 0 700 226' role='img'></svg>
<p class='cap'>Each bar is how much <b>original text</b> a context window holds at the current ratio; the dashed line is your prompt. The windows here are exact — 8,192 / 32,768 / 131,072 tokens — so at 0.75 they read 6,144 / 24,576 / 98,304 words.</p>
</div>
</div>

Llama 3 was trained on sequences of 8,192 tokens, which is exactly the 8192 in the question. Llama 3.1 raised it to 128K — the third row of the table.

## Pruning

Pruning removes weights. The choice that matters is *which shape* of weights you remove.

In practice you almost always want **structured pruning** — pruning along whole rows or columns — for two reasons:

1. **Efficiency is high.** What is left is a smaller dense matrix, and a smaller dense matmul is simply a faster matmul.
2. **Hardware support is strong.** Dense kernels are what GPUs are built for. Scatter the holes instead, and you have a sparse matrix that needs specialised kernels to realise any speedup at all — and often does not beat the dense original.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 262' role='img' aria-label='An unstructured pruning mask with scattered holes beside a structured mask with whole columns removed'>
<text x='24' y='26' class='lbl'>unstructured</text>
<text x='24' y='44' class='lbl sm'>holes anywhere — a sparse matrix</text>
<rect x='24' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.00s;'/>
<rect x='45' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.01s;'/>
<rect x='66' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.36s; --dy:9px'/>
<rect x='87' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.01s;'/>
<rect x='108' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.02s;'/>
<rect x='129' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.03s;'/>
<rect x='150' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.03s;'/>
<rect x='171' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.39s; --dy:9px'/>
<rect x='192' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.04s;'/>
<rect x='213' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.40s; --dy:9px'/>
<rect x='234' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.05s;'/>
<rect x='255' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.06s;'/>
<rect x='24' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.42s; --dy:9px'/>
<rect x='45' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.43s; --dy:9px'/>
<rect x='66' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.07s;'/>
<rect x='87' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.07s;'/>
<rect x='108' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.45s; --dy:9px'/>
<rect x='129' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.09s;'/>
<rect x='150' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.09s;'/>
<rect x='171' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.10s;'/>
<rect x='192' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.47s; --dy:9px'/>
<rect x='213' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.48s; --dy:9px'/>
<rect x='234' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.48s; --dy:9px'/>
<rect x='255' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.12s;'/>
<rect x='24' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.12s;'/>
<rect x='45' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.12s;'/>
<rect x='66' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.13s;'/>
<rect x='87' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.51s; --dy:9px'/>
<rect x='108' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.14s;'/>
<rect x='129' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.14s;'/>
<rect x='150' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.53s; --dy:9px'/>
<rect x='171' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.15s;'/>
<rect x='192' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.16s;'/>
<rect x='213' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.17s;'/>
<rect x='234' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.55s; --dy:9px'/>
<rect x='255' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.18s;'/>
<rect x='24' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.18s;'/>
<rect x='45' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.18s;'/>
<rect x='66' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.19s;'/>
<rect x='87' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.20s;'/>
<rect x='108' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.20s;'/>
<rect x='129' y='121' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.60s; --dy:9px'/>
<rect x='150' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.21s;'/>
<rect x='171' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.21s;'/>
<rect x='192' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.22s;'/>
<rect x='213' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.23s;'/>
<rect x='234' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.23s;'/>
<rect x='255' y='121' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.63s; --dy:9px'/>
<rect x='24' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.24s;'/>
<rect x='45' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.24s;'/>
<rect x='66' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.65s; --dy:9px'/>
<rect x='87' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.26s;'/>
<rect x='108' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.66s; --dy:9px'/>
<rect x='129' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.27s;'/>
<rect x='150' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.27s;'/>
<rect x='171' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.28s;'/>
<rect x='192' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.69s; --dy:9px'/>
<rect x='213' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.69s; --dy:9px'/>
<rect x='234' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.29s;'/>
<rect x='255' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.70s; --dy:9px'/>
<rect x='24' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.30s;'/>
<rect x='45' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.30s;'/>
<rect x='66' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.31s;'/>
<rect x='87' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.32s;'/>
<rect x='108' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.73s; --dy:9px'/>
<rect x='129' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.74s; --dy:9px'/>
<rect x='150' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.75s; --dy:9px'/>
<rect x='171' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.75s; --dy:9px'/>
<rect x='192' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.34s;'/>
<rect x='213' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.35s;'/>
<rect x='234' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.35s;'/>
<rect x='255' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.35s;'/>
<rect x='24' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.78s; --dy:9px'/>
<rect x='45' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.79s; --dy:9px'/>
<rect x='66' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.37s;'/>
<rect x='87' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.80s; --dy:9px'/>
<rect x='108' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.38s;'/>
<rect x='129' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.39s;'/>
<rect x='150' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.39s;'/>
<rect x='171' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.40s;'/>
<rect x='192' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.40s;'/>
<rect x='213' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.41s;'/>
<rect x='234' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.84s; --dy:9px'/>
<rect x='255' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.85s; --dy:9px'/>
<rect x='24' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.42s;'/>
<rect x='45' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.86s; --dy:9px'/>
<rect x='66' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.87s; --dy:9px'/>
<rect x='87' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.43s;'/>
<rect x='108' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.44s;'/>
<rect x='129' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.45s;'/>
<rect x='150' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.45s;'/>
<rect x='171' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.46s;'/>
<rect x='192' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.46s;'/>
<rect x='213' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.91s; --dy:9px'/>
<rect x='234' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-pop' style='--d:0.47s;'/>
<rect x='255' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-drop' style='--d:0.92s; --dy:9px'/>
<text x='384' y='26' class='lbl'>structured</text>
<text x='384' y='44' class='lbl sm'>whole columns — a smaller dense matrix</text>
<rect x='384' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.36s;'/>
<rect x='447' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.38s;'/>
<rect x='510' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.39s;'/>
<rect x='531' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='58' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.41s;'/>
<rect x='615' y='58' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.43s;'/>
<rect x='447' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.45s;'/>
<rect x='510' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.46s;'/>
<rect x='531' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='79' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.48s;'/>
<rect x='615' y='79' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.51s;'/>
<rect x='447' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.52s;'/>
<rect x='510' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.53s;'/>
<rect x='531' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='100' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.55s;'/>
<rect x='615' y='100' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='121' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.58s;'/>
<rect x='447' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='121' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.60s;'/>
<rect x='510' y='121' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.60s;'/>
<rect x='531' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='121' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.63s;'/>
<rect x='615' y='121' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.65s;'/>
<rect x='447' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.67s;'/>
<rect x='510' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.67s;'/>
<rect x='531' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='142' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.70s;'/>
<rect x='615' y='142' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.72s;'/>
<rect x='447' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.74s;'/>
<rect x='510' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.75s;'/>
<rect x='531' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='163' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.77s;'/>
<rect x='615' y='163' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.79s;'/>
<rect x='447' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.81s;'/>
<rect x='510' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.82s;'/>
<rect x='531' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='184' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.84s;'/>
<rect x='615' y='184' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<rect x='384' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='405' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:0px'/>
<rect x='426' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.87s;'/>
<rect x='447' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='468' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-21px'/>
<rect x='489' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.88s;'/>
<rect x='510' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.89s;'/>
<rect x='531' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='552' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='573' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-63px'/>
<rect x='594' y='205' width='18' height='18' rx='2' fill='var(--n-pruned)' fill-opacity='0.9' class='a-vanish' style='--d:0.91s;'/>
<rect x='615' y='205' width='18' height='18' rx='2' fill='var(--n-kept)' fill-opacity='0.85' class='a-slide' style='--d:1.15s; --dx:-84px'/>
<text x='24' y='250' class='lbl sm' style='fill:var(--n-clay)'>needs sparse kernels to go faster at all</text>
<text x='384' y='250' class='lbl sm' style='fill:var(--n-kept)'>runs faster on the GPU you already own</text>
<line x1='356' y1='16' x2='356' y2='232' stroke='var(--n-edge)' stroke-width='1.2' stroke-dasharray='4 5'/>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> Two ways to remove the same fraction of a weight matrix. Unstructured pruning leaves holes and a sparse matrix; structured pruning takes whole columns, and what remains closes up into a smaller dense matrix that needs no special kernel.</div>
</div>

The axes you can prune along are exactly the axes the architecture is built from: whole **layers** (depth), attention **heads**, **MLP neurons** in the intermediate dimension, and **embedding channels** in the residual stream itself.

<div class='lab wide' id='prune-lab'>
<div class='lab-head'><span class='name'>Lab 2 · pruning sweep</span><span class='hint'>pick an axis, then drag how much to remove</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label>prune along</label>
<div class='seg seg-axis'>
<button type='button' data-value='depth' aria-pressed='true'>layers</button>
<button type='button' data-value='heads' aria-pressed='false'>heads</button>
<button type='button' data-value='mlp' aria-pressed='false'>MLP neurons</button>
<button type='button' data-value='embed' aria-pressed='false'>channels</button>
</div>
</div>
<div class='ctl'>
<label for='prune-ratio'>fraction removed <span class='val' id='prune-ratio-v'></span></label>
<input type='range' id='prune-ratio' min='0' max='75' step='1' value='0'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>parameters left</span><span class='v' id='prune-stat-params'></span></div>
<div class='stat' style='--stat-hue:var(--n-lav)'><span class='k'>resulting shape</span><span class='v' id='prune-stat-shape'></span></div>
<div class='stat' style='--stat-hue:var(--n-kept)'><span class='k'>decode speedup</span><span class='v' id='prune-stat-speed'></span></div>
</div>
<div class='verdict' id='prune-verdict'></div>
<svg viewBox='0 0 700 292' role='img'></svg>
<p class='cap'>The top row is importance in <b>model order</b>; the bottom row is the same units <b>ranked</b>, with everything left of the cut line trimmed. Parameter counts are computed from the real Llama 3.1 8B shape, so pruning half the layers lands on 4.5B — the size NVIDIA shipped.</p>
</div>
</div>

NVIDIA's Minitron work, which produced Llama-3.1-Minitron-4B from Llama 3.1 8B, reports one rule of thumb worth stealing: for models of 15B and below, prefer **width pruning over depth pruning** — it holds accuracy better at the same size, even though depth pruning gives the bigger speedup.

## Distillation

Once the model is trimmed, it is worse. Distillation is how you make it good again, by training the small model to reproduce the behaviour of the big one instead of retraining it on raw text.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 306' role='img' aria-label='Dataset feeding a student and a frozen teacher, their logits meeting at a loss which updates only the student'>
<rect x='14' y='128' width='84' height='50' rx='9' fill='var(--n-panel-2)' stroke='var(--n-data)' stroke-width='2' class='a-pop' style='--d:0.00s'/>
<text x='56' y='158.0' class='lbl mid a-fade' style='--d:0.15s;fill:var(--n-data)'>Dataset</text>
<rect x='154' y='52' width='116' height='54' rx='9' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.35s'/>
<text x='212' y='76.0' class='lbl mid a-fade' style='--d:0.50s;fill:var(--n-student)'>Student</text>
<text x='212' y='92.0' class='lbl mid a-fade' style='--d:0.50s;fill:var(--n-student)'>Model</text>
<rect x='154' y='200' width='116' height='54' rx='9' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.35s'/>
<text x='212' y='224.0' class='lbl mid a-fade' style='--d:0.50s;fill:var(--n-teacher)'>Teacher</text>
<text x='212' y='240.0' class='lbl mid a-fade' style='--d:0.50s;fill:var(--n-teacher)'>Model</text>
<text x='212' y='269' class='lbl sm mid a-fade' style='--d:0.60s'>weights frozen</text>
<rect x='316' y='52' width='118' height='54' rx='9' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.90s'/>
<text x='375' y='76.0' class='lbl mid a-fade' style='--d:1.05s;fill:var(--n-student)'>Student</text>
<text x='375' y='92.0' class='lbl mid a-fade' style='--d:1.05s;fill:var(--n-student)'>logits</text>
<rect x='316' y='200' width='118' height='54' rx='9' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.90s'/>
<text x='375' y='224.0' class='lbl mid a-fade' style='--d:1.05s;fill:var(--n-teacher)'>Teacher</text>
<text x='375' y='240.0' class='lbl mid a-fade' style='--d:1.05s;fill:var(--n-teacher)'>logits</text>
<rect x='482' y='128' width='82' height='50' rx='9' fill='var(--n-panel-2)' stroke='var(--n-loss)' stroke-width='2' class='a-pop' style='--d:1.35s'/>
<text x='523' y='158.0' class='lbl mid a-fade' style='--d:1.50s;fill:var(--n-loss)'>Loss</text>
<rect x='596' y='128' width='92' height='50' rx='9' fill='var(--n-panel-2)' stroke='var(--n-lav)' stroke-width='2' class='a-pop' style='--d:1.70s'/>
<text x='642' y='150.0' class='lbl mid a-fade' style='--d:1.85s;fill:var(--n-lav)'>Weights</text>
<text x='642' y='166.0' class='lbl mid a-fade' style='--d:1.85s;fill:var(--n-lav)'>Update</text>
<path d='M98.0 145.0 L149.3 89.2' stroke='var(--n-data)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.15s'/>
<path d='M152.7 92.3 L154.0 84.0 L145.9 86.0' stroke='var(--n-data)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:0.60s'/>
<path d='M98.0 161.0 L149.3 216.8' stroke='var(--n-data)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.15s'/>
<path d='M145.9 220.0 L154.0 222.0 L152.7 213.7' stroke='var(--n-data)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:0.60s'/>
<path d='M270.0 79.0 L309.0 79.0' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.70s'/>
<path d='M309.0 83.6 L316.0 79.0 L309.0 74.4' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.15s'/>
<path d='M270.0 227.0 L309.0 227.0' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.70s'/>
<path d='M309.0 231.6 L316.0 227.0 L309.0 222.4' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.15s'/>
<path d='M434.0 79.0 L477.7 134.5' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.15s'/>
<path d='M474.1 137.3 L482.0 140.0 L481.3 131.7' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.60s'/>
<path d='M434.0 227.0 L477.7 171.5' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.15s'/>
<path d='M481.3 174.3 L482.0 166.0 L474.1 168.7' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.60s'/>
<path d='M564.0 153.0 L589.0 153.0' stroke='var(--n-loss)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.55s'/>
<path d='M589.0 157.6 L596.0 153.0 L589.0 148.4' stroke='var(--n-loss)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:2.00s'/>
<path d='M642 128 L642 20 L212 20 L212 52' stroke='var(--n-lav)' stroke-width='2' fill='none' stroke-linejoin='round' class='a-draw' style='--d:1.95s'/>
<path d='M207 45 L212 52 L217 45' stroke='var(--n-lav)' stroke-width='2' fill='none' stroke-linejoin='round' class='a-fade' style='--d:2.70s'/>
<path d='M642 128 L642 20 L212 20 L212 52' stroke='var(--n-lav)' stroke-width='2.4' fill='none' class='a-flow' style='--d:2.80s' opacity='0.85'/>
<text x='427' y='14' class='lbl sm mid a-fade' style='--d:2.80s;fill:var(--n-lav)'>only the student is updated</text>
<text x='375' y='40' class='lbl sm mid a-fade' style='--d:1.20s;fill:var(--n-loss)'>(vocabulary logits)</text>
<text x='166' y='196' class='lbl a-fade' style='--d:0.70s;fill:var(--n-teacher)'>❄</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> The distillation loop. One dataset goes through both models; their vocabulary logits meet at a KL loss; the update travels back to the student only. The teacher is frozen — it is a source of targets, not a thing being trained.</div>
</div>

Two points to mention:

- **The loss is a KL loss between the student's logits and the teacher's logits** — not between the student and the ground-truth next token.

$$\mathrm{KL}(P\,\|\,Q) = \sum_x p(x) \log \frac{p(x)}{q(x)}$$

- **Only the student's weights are updated.** The teacher's weights are frozen. The teacher is run in forward mode only; it is a source of targets, not a thing being trained.

<div class='sidenote'>
<span class='tag'>side note</span>
<p><b>Two different things get called “logits”.</b> The word means “the raw score before a softmax”, and a transformer has two of them.</p>
<p><b>Attention logits</b> are the attention scores — the matrix inside every head that softmax turns into attention weights:</p>
<p><b>Vocabulary logits</b> are the raw score for every possible token, produced by the LM head, before the softmax that turns them into a probability distribution over the vocabulary.</p>
<p>Distillation on “logits” means the second kind, which is why both outputs in the diagram above are labelled <i>(vocabulary logits)</i>.</p>
</div>

$$\text{attention logits} = \frac{QK^\top}{\sqrt{d_k}}, \qquad \text{attention weights} = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)$$

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 258' role='img' aria-label='Attention logits from Q K-transpose beside vocabulary logits from the LM head'>
<line x1='350' y1='14' x2='350' y2='236' stroke='var(--n-edge)' stroke-width='1.2' stroke-dasharray='4 5'/>
<text x='22' y='26' class='lbl' style='fill:var(--n-teacher)'>attention logits</text>
<text x='22' y='44' class='lbl sm'>one score per key, inside every head</text>
<rect x='30' y='60' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.98' class='a-pop' style='--d:0.05s'/>
<rect x='58' y='60' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.07s'/>
<rect x='86' y='60' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.09s'/>
<rect x='114' y='60' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.11s'/>
<rect x='142' y='60' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.13s'/>
<rect x='30' y='88' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.60' class='a-pop' style='--d:0.15s'/>
<rect x='58' y='88' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.98' class='a-pop' style='--d:0.17s'/>
<rect x='86' y='88' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.19s'/>
<rect x='114' y='88' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.21s'/>
<rect x='142' y='88' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.23s'/>
<rect x='30' y='116' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.47' class='a-pop' style='--d:0.25s'/>
<rect x='58' y='116' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.60' class='a-pop' style='--d:0.27s'/>
<rect x='86' y='116' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.98' class='a-pop' style='--d:0.29s'/>
<rect x='114' y='116' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.31s'/>
<rect x='142' y='116' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.33s'/>
<rect x='30' y='144' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.40' class='a-pop' style='--d:0.35s'/>
<rect x='58' y='144' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.47' class='a-pop' style='--d:0.37s'/>
<rect x='86' y='144' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.60' class='a-pop' style='--d:0.39s'/>
<rect x='114' y='144' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.98' class='a-pop' style='--d:0.41s'/>
<rect x='142' y='144' width='24' height='24' rx='3' fill='var(--n-grid)' fill-opacity='0.25' class='a-pop' style='--d:0.43s'/>
<rect x='30' y='172' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.35' class='a-pop' style='--d:0.45s'/>
<rect x='58' y='172' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.40' class='a-pop' style='--d:0.47s'/>
<rect x='86' y='172' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.47' class='a-pop' style='--d:0.49s'/>
<rect x='114' y='172' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.60' class='a-pop' style='--d:0.51s'/>
<rect x='142' y='172' width='24' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.98' class='a-pop' style='--d:0.53s'/>
<text x='100' y='222' class='lbl sm mid a-fade' style='--d:0.70s'>QKᵀ / √d_k</text>
<path d='M180.0 130.0 L219.0 130.0' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.80s'/>
<path d='M219.0 134.6 L226.0 130.0 L219.0 125.4' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.25s'/>
<text x='203.0' y='122.0' class='lbl sm mid a-fade' style='--d:1.20s;fill:var(--n-teacher)'>softmax</text>
<rect x='238' y='132' width='18' height='46' rx='3' fill='var(--n-teacher)' fill-opacity='0.88' class='a-grow' style='--d:1.25s'/>
<rect x='260' y='144' width='18' height='34' rx='3' fill='var(--n-teacher)' fill-opacity='0.88' class='a-grow' style='--d:1.32s'/>
<rect x='282' y='154' width='18' height='24' rx='3' fill='var(--n-teacher)' fill-opacity='0.88' class='a-grow' style='--d:1.39s'/>
<rect x='304' y='163' width='18' height='15' rx='3' fill='var(--n-teacher)' fill-opacity='0.88' class='a-grow' style='--d:1.46s'/>
<rect x='326' y='169' width='18' height='9' rx='3' fill='var(--n-teacher)' fill-opacity='0.88' class='a-grow' style='--d:1.53s'/>
<line x1='234' y1='178' x2='344' y2='178' stroke='var(--n-edge)' stroke-width='1.2'/>
<text x='288' y='198' class='lbl sm mid a-fade' style='--d:1.60s'>attention weights</text>
<text x='288' y='222' class='lbl sm mid a-fade' style='--d:1.70s'>sums to 1 over the keys</text>
<text x='378' y='26' class='lbl' style='fill:var(--n-student)'>vocabulary logits</text>
<text x='378' y='44' class='lbl sm'>one raw score per token in the whole vocabulary</text>
<rect x='378' y='62' width='104' height='44' rx='9' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.90s'/>
<text x='430' y='89.0' class='lbl mid a-fade' style='--d:1.05s;fill:var(--n-student)'>last hidden</text>
<path d='M482.0 84.0 L521.0 84.0' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.15s'/>
<path d='M521.0 88.6 L528.0 84.0 L521.0 79.4' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.60s'/>
<text x='505.0' y='76.0' class='lbl sm mid a-fade' style='--d:1.55s;fill:var(--n-student)'>lm_head</text>
<rect x='534' y='62' width='150' height='44' rx='9' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:1.35s'/>
<text x='609' y='89.0' class='lbl mid a-fade' style='--d:1.50s;fill:var(--n-student)'>128,256 scores</text>
<path d='M608.0 106.0 L608.0 131.0' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.60s'/>
<path d='M603.4 131.0 L608.0 138.0 L612.6 131.0' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:2.05s'/>
<text x='608.0' y='126.0' class='lbl sm mid a-fade' style='--d:2.00s;fill:var(--n-student)'>softmax</text>
<rect x='396' y='158' width='20' height='52' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:1.85s'/>
<rect x='428' y='177' width='20' height='33' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:1.91s'/>
<rect x='460' y='185' width='20' height='25' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:1.97s'/>
<rect x='492' y='192' width='20' height='18' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:2.03s'/>
<rect x='524' y='197' width='20' height='13' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:2.09s'/>
<rect x='556' y='200' width='20' height='10' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:2.15s'/>
<rect x='588' y='203' width='20' height='7' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:2.21s'/>
<rect x='620' y='205' width='20' height='5' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:2.27s'/>
<rect x='652' y='207' width='20' height='3' rx='3' fill='var(--n-student)' fill-opacity='0.88' class='a-grow' style='--d:2.33s'/>
<line x1='390' y1='210' x2='688' y2='210' stroke='var(--n-edge)' stroke-width='1.2'/>
<text x='538' y='232' class='lbl sm mid a-fade' style='--d:2.40s'>p(next token) — sums to 1 over the vocabulary</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 4.</span> The two things called logits. On the left, attention logits: a score per key inside every head, masked and softmaxed into attention weights. On the right, vocabulary logits: one raw score per token in the whole 128,256-entry vocabulary, softmaxed into a distribution over the next token. Distillation matches the right-hand one.</div>
</div>

<div class='lab wide' id='distill-lab'>
<div class='lab-head'><span class='name'>Lab 3 · distillation loss mixer</span><span class='hint'>train the student, warm the softmax, weigh the terms</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label for='kd-prog'>student training progress <span class='val' id='kd-prog-v'></span></label>
<input type='range' id='kd-prog' min='0' max='100' step='1' value='15'>
</div>
<div class='ctl'>
<label for='kd-temp'>temperature T <span class='val' id='kd-temp-v'></span></label>
<input type='range' id='kd-temp' min='0.5' max='6' step='0.1' value='1'>
</div>
<div class='ctl'>
<label for='kd-alpha'>α — weight on logit KL <span class='val' id='kd-alpha-v'></span></label>
<input type='range' id='kd-alpha' min='0' max='2' step='0.05' value='1'>
</div>
<div class='ctl'>
<label for='kd-beta'>β — weight on hidden-state term <span class='val' id='kd-beta-v'></span></label>
<input type='range' id='kd-beta' min='0' max='2' step='0.05' value='0.5'>
</div>
<div class='ctl'>
<label>direction</label>
<div class='seg seg-dir'>
<button type='button' data-value='sq' aria-pressed='true'>KL(student‖teacher)</button>
<button type='button' data-value='ts' aria-pressed='false'>KL(teacher‖student)</button>
</div>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-loss)'><span class='k'>KL₁ (logits)</span><span class='v' id='kd-stat-kl1'></span></div>
<div class='stat' style='--stat-hue:var(--n-lav)'><span class='k'>KL₂ (hidden states)</span><span class='v' id='kd-stat-kl2'></span></div>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>total loss L</span><span class='v' id='kd-stat-total'></span></div>
</div>
<div class='verdict' id='kd-verdict'></div>
<svg viewBox='0 0 700 250' role='img'></svg>
<p class='cap'>Teal is the frozen teacher, violet the student. Dragging <b>progress</b> moves the student's logits toward the teacher's and you can watch KL₁ fall to zero. KL₂ here is an <b>illustrative</b> decay curve, not a computed quantity — eight vocabulary entries carry no hidden states to compare.</p>
</div>
</div>

Two directions exist, and they are not the same thing:

- **KL(student ‖ teacher)** punishes the student for putting mass where the
  teacher put none.
- **KL(teacher ‖ student)** punishes it for missing mass the teacher had.

Minitron minimises the **forward** KL, teacher as $P$, and drops the
ground-truth cross-entropy term entirely. The toggle above shows the two
values apart until the student converges.

## The process, end to end

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 300' role='img' aria-label='Five steps: train the teacher, estimate importance, rank, trim, distil'>
<rect x='10' y='44' width='138' height='62' rx='9' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.00s'/>
<text x='79' y='72.0' class='lbl mid a-fade' style='--d:0.15s;fill:var(--n-teacher)'>❨1❩ Train LLM</text>
<text x='79' y='88.0' class='lbl mid a-fade' style='--d:0.15s;fill:var(--n-teacher)'>(teacher model)</text>
<rect x='168' y='20' width='222' height='134' rx='9' fill='var(--n-panel-2)' stroke='var(--n-data)' stroke-width='2' class='a-pop' style='--d:0.50s'/>
<text x='182' y='46' class='lbl a-fade' style='--d:0.65s;fill:var(--n-data)'>❨2❩ Estimate importance</text>
<text x='182' y='70' class='lbl sm a-fade' style='--d:0.73s;fill:var(--n-ink)'>of layers, heads,</text>
<text x='182' y='94' class='lbl sm a-fade' style='--d:0.81s;fill:var(--n-ink)'>embeddings, channels</text>
<text x='182' y='118' class='lbl sm a-fade' style='--d:0.89s;fill:var(--n-ink)'>① external dataset → teacher</text>
<text x='182' y='142' class='lbl sm a-fade' style='--d:0.97s;fill:var(--n-ink)'>② average activation of each</text>
<rect x='410' y='20' width='196' height='134' rx='9' fill='var(--n-panel-2)' stroke='var(--n-lav)' stroke-width='2' class='a-pop' style='--d:1.15s'/>
<text x='424' y='46' class='lbl a-fade' style='--d:1.30s;fill:var(--n-lav)'>❨3❩ Rank them</text>
<text x='430' y='72' class='lbl sm a-fade' style='--d:1.40s'>Emb 4</text>
<text x='510' y='72' class='lbl sm a-fade' style='--d:1.40s'>layer 3</text>
<text x='430' y='93' class='lbl sm a-fade' style='--d:1.49s'>Emb 2</text>
<text x='510' y='93' class='lbl sm a-fade' style='--d:1.49s'>layer 4</text>
<text x='430' y='114' class='lbl sm a-fade' style='--d:1.58s'>Emb 1</text>
<text x='510' y='114' class='lbl sm a-fade' style='--d:1.58s'>layer 2</text>
<text x='430' y='135' class='lbl sm a-fade' style='--d:1.67s'>Emb 3</text>
<text x='510' y='135' class='lbl sm a-fade' style='--d:1.67s'>layer 1</text>
<rect x='410' y='188' width='196' height='92' rx='9' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:2.00s'/>
<text x='424' y='214' class='lbl a-fade' style='--d:2.15s;fill:var(--n-student)'>❨4❩ Trim to a student</text>
<text x='430' y='240' class='lbl sm a-fade' style='--d:2.25s'>Emb 4</text>
<text x='510' y='240' class='lbl sm a-fade' style='--d:2.25s'>layer 3</text>
<text x='430' y='261' class='lbl sm a-fade' style='--d:2.35s'>Emb 2</text>
<text x='510' y='261' class='lbl sm a-fade' style='--d:2.35s'>layer 4</text>
<rect x='212' y='210' width='150' height='52' rx='9' fill='var(--n-panel-2)' stroke='var(--n-loss)' stroke-width='2' class='a-pop' style='--d:2.60s'/>
<text x='287' y='241.0' class='lbl mid a-fade' style='--d:2.75s;fill:var(--n-loss)'>❨5❩ Distillation</text>
<path d='M148.0 75.0 L161.0 75.0' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.35s'/>
<path d='M161.0 79.6 L168.0 75.0 L161.0 70.4' stroke='var(--n-teacher)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:0.80s'/>
<path d='M390.0 87.0 L403.0 87.0' stroke='var(--n-data)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.00s'/>
<path d='M403.0 91.6 L410.0 87.0 L403.0 82.4' stroke='var(--n-data)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.45s'/>
<path d='M508.0 154.0 L508.0 181.0' stroke='var(--n-lav)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.85s'/>
<path d='M503.4 181.0 L508.0 188.0 L512.6 181.0' stroke='var(--n-lav)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:2.30s'/>
<path d='M410.0 236.0 L369.0 236.0' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:2.45s'/>
<path d='M369.0 231.4 L362.0 236.0 L369.0 240.6' stroke='var(--n-student)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:2.90s'/>
</svg>
<div class='caption'><span class='caption-label'>Figure 5.</span> The five steps: train the teacher, estimate importance, rank, trim, distil. Ranking and trimming are one operation split in two — the ranking decides everything, the trim just applies it.</div>
</div>

**⟨1⟩ Train the LLM** that will be the teacher.

**⟨2⟩ Estimate importance** — of layers, heads, embeddings, and channels. How? Two moves:

1. Take an **external dataset** and run it through the **teacher** model.
2. **Count the average activation** of each unit over that data. Units that barely activate are barely contributing.

Minitron does exactly this and reports the details worth copying: a purely activation-based estimate over a **1,024-sample calibration set**, forward passes only, computing sensitivity for depth, neurons, heads and embedding channels *simultaneously*. Activations are aggregated with an **L2 norm across the batch** and a **mean across the sequence**. And a finding that saves time: doing this **once** works as well as doing it iteratively.

Depth is the exception. Layer importance measured by the increase in LM loss turns out not to track downstream accuracy well, so they rank contiguous blocks of layers by their effect on **Winogrande** accuracy instead — dropping a block, measuring, and putting it back.

**⟨3⟩ Rank them**, and **⟨4⟩ trim to a student model** by keeping the top of the ranking and discarding the tail.

**⟨5⟩ Distil**, using the untrimmed model as the teacher.

## Loss can be many things

In distillation, the KL loss is **not necessarily** the logits loss between teacher and student. The two models have the same *shape* of intermediate signals, so any pair of matching activations can be compared. The loss can also be:

- **embedding output loss**
- **MLP input loss**
- **decoder block output loss**
- **LM head loss**

Therefore the loss can be a weighted sum:

$$L = \alpha \cdot \mathrm{KL}_1 + \beta \cdot \mathrm{KL}_2 + \cdots$$

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 326' role='img' aria-label='A teacher stack and a student stack linked at four points: LM head, decoder block output, MLP input and embedding output'>
<text x='70' y='26' class='lbl mid' style='fill:var(--n-teacher)'>teacher</text>
<text x='630' y='26' class='lbl mid' style='fill:var(--n-student)'>student</text>
<rect x='10' y='52' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.00s'/>
<rect x='570' y='52' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.00s'/>
<path d='M130 74 L570 74' stroke='var(--n-loss)' stroke-width='2.2' stroke-dasharray='6 5' fill='none' class='a-draw' style='--d:0.60s'/>
<rect x='268' y='61' width='164' height='26' rx='13' fill='var(--n-panel)' stroke='var(--n-loss)' stroke-width='1.6' class='a-pop' style='--d:0.95s'/>
<text x='350' y='79' class='lbl sm mid a-fade' style='--d:1.05s;fill:var(--n-loss)'>LM head loss</text>
<rect x='10' y='118' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.12s'/>
<rect x='570' y='118' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.12s'/>
<path d='M130 140 L570 140' stroke='var(--n-loss)' stroke-width='2.2' stroke-dasharray='6 5' fill='none' class='a-draw' style='--d:0.90s'/>
<rect x='268' y='127' width='164' height='26' rx='13' fill='var(--n-panel)' stroke='var(--n-loss)' stroke-width='1.6' class='a-pop' style='--d:1.25s'/>
<text x='350' y='145' class='lbl sm mid a-fade' style='--d:1.35s;fill:var(--n-loss)'>decoder block output loss</text>
<rect x='10' y='184' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.24s'/>
<rect x='570' y='184' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.24s'/>
<path d='M130 206 L570 206' stroke='var(--n-loss)' stroke-width='2.2' stroke-dasharray='6 5' fill='none' class='a-draw' style='--d:1.20s'/>
<rect x='268' y='193' width='164' height='26' rx='13' fill='var(--n-panel)' stroke='var(--n-loss)' stroke-width='1.6' class='a-pop' style='--d:1.55s'/>
<text x='350' y='211' class='lbl sm mid a-fade' style='--d:1.65s;fill:var(--n-loss)'>MLP input loss</text>
<rect x='10' y='250' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-teacher)' stroke-width='2' class='a-pop' style='--d:0.36s'/>
<rect x='570' y='250' width='120' height='44' rx='7' fill='var(--n-panel-2)' stroke='var(--n-student)' stroke-width='2' class='a-pop' style='--d:0.36s'/>
<path d='M130 272 L570 272' stroke='var(--n-loss)' stroke-width='2.2' stroke-dasharray='6 5' fill='none' class='a-draw' style='--d:1.50s'/>
<rect x='268' y='259' width='164' height='26' rx='13' fill='var(--n-panel)' stroke='var(--n-loss)' stroke-width='1.6' class='a-pop' style='--d:1.85s'/>
<text x='350' y='277' class='lbl sm mid a-fade' style='--d:1.95s;fill:var(--n-loss)'>embedding output loss</text>
<path d='M70 96 L70 118' stroke='var(--n-edge)' stroke-width='1.6' fill='none' class='a-fade' style='--d:0.50s'/>
<path d='M70 162 L70 184' stroke='var(--n-edge)' stroke-width='1.6' fill='none' class='a-fade' style='--d:0.50s'/>
<path d='M70 228 L70 250' stroke='var(--n-edge)' stroke-width='1.6' fill='none' class='a-fade' style='--d:0.50s'/>
<path d='M630 96 L630 118' stroke='var(--n-edge)' stroke-width='1.6' fill='none' class='a-fade' style='--d:0.50s'/>
<path d='M630 162 L630 184' stroke='var(--n-edge)' stroke-width='1.6' fill='none' class='a-fade' style='--d:0.50s'/>
<path d='M630 228 L630 250' stroke='var(--n-edge)' stroke-width='1.6' fill='none' class='a-fade' style='--d:0.50s'/>
<text x='350' y='312' class='lbl mid a-fade' style='--d:2.00s;fill:var(--n-loss)'>L  =  α · KL₁  +  β · KL₂  +  …</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 6.</span> Distillation does not have to compare final logits. Anywhere the teacher and student have a matching signal is a place a loss can attach, and the total is the weighted sum of whichever ones you switch on.</div>
</div>

Which terms you switch on depends on how hard you cut. NVIDIA's rule: use **logit-only** distillation when depth is not reduced much, and **logits + intermediate state + embedding** distillation when it is. Their 4B-depth model dropped 16 of 32 layers, so it needed the full set; a width-pruned model that keeps all 32 layers can get away with logits alone.

<div class='sidenote'>
<span class='tag'>side note</span>
<p><b>MLP and FFN.</b> In transformers, the FFN is a <i>type</i> of MLP — the specific two-layer one that sits in every block.</p>
</div>

$$\mathrm{FFN}(x) = W_2\,\sigma(W_1 x + b_1) + b_2$$

An FFN does three things:

1. **Up-projection** that expands the hidden dimension, classically by 4×: $d_{\text{model}} \rightarrow d_{\text{ff}}$
2. **Non-linear activation** — GELU, ReLU, SiLU
3. **Down-projection** back: $d_{\text{ff}} \rightarrow d_{\text{model}}$

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 238' role='img' aria-label='A vector widened four times by an up-projection, bent by a non-linearity, and narrowed by a down-projection'>
<text x='16' y='26' class='lbl sm'>FFN(x) = W₂ σ(W₁x + b₁) + b₂</text>
<rect x='26' y='112' width='40' height='40' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:0.00s'/>
<text x='46' y='102' class='lbl sm mid a-fade' style='--d:0.15s'>x</text>
<text x='46' y='168' class='lbl sm mid a-fade' style='--d:0.15s'>d_model</text>
<path d='M72.0 132.0 L207.0 132.0' stroke='var(--n-lav)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:0.40s'/>
<path d='M207.0 136.6 L214.0 132.0 L207.0 127.4' stroke='var(--n-lav)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:0.85s'/>
<text x='143.0' y='124.0' class='lbl sm mid a-fade' style='--d:0.80s;fill:var(--n-lav)'>❶ up-projection  W₁  (4×)</text>
<rect x='220' y='52' width='46' height='160' rx='5' fill='var(--n-teacher)' fill-opacity='0.85' class='a-grow' style='--d:0.95s;--org:center'/>
<text x='243' y='42' class='lbl sm mid a-fade' style='--d:1.20s'>d_ff</text>
<path d='M272.0 132.0 L393.0 132.0' stroke='var(--n-sage)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:1.35s'/>
<path d='M393.0 136.6 L400.0 132.0 L393.0 127.4' stroke='var(--n-sage)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:1.80s'/>
<text x='336.0' y='124.0' class='lbl sm mid a-fade' style='--d:1.75s;fill:var(--n-sage)'>❷ non-linearity  σ</text>
<text x='336' y='154' class='lbl sm mid a-fade' style='--d:1.60s;fill:var(--n-sage)'>GELU · ReLU · SiLU</text>
<rect x='406' y='52' width='46' height='160' rx='5' fill='var(--n-teacher)' fill-opacity='0.85' class='a-grow' style='--d:1.75s;--org:center'/>
<text x='429' y='42' class='lbl sm mid a-fade' style='--d:2.00s'>d_ff</text>
<path d='M458.0 132.0 L593.0 132.0' stroke='var(--n-lav)' stroke-width='1.9' fill='none' stroke-linecap='round' class='a-draw' style='--d:2.10s'/>
<path d='M593.0 136.6 L600.0 132.0 L593.0 127.4' stroke='var(--n-lav)' stroke-width='1.9' fill='none' stroke-linejoin='round' class='a-fade' style='--d:2.55s'/>
<text x='529.0' y='124.0' class='lbl sm mid a-fade' style='--d:2.50s;fill:var(--n-lav)'>❸ down-projection  W₂</text>
<rect x='606' y='112' width='40' height='40' rx='5' fill='var(--n-student)' fill-opacity='0.88' class='a-pop' style='--d:2.60s'/>
<text x='626' y='102' class='lbl sm mid a-fade' style='--d:2.75s'>FFN(x)</text>
<text x='626' y='168' class='lbl sm mid a-fade' style='--d:2.75s'>d_model</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 7.</span> The three moves inside a plain FFN, drawn to scale: widen by 4×, bend, narrow back. The bulge in the middle is where most of a transformer's parameters live, which is why the MLP intermediate dimension is the first thing width pruning reaches for.</div>
</div>

Modern models use a **gated MLP** instead — SwiGLU:

$$\mathrm{FFN}(x) = W_{\text{down}}\big[\mathrm{SiLU}(W_{\text{gate}}\,x) \odot (W_{\text{up}}\,x)\big]$$

where $\odot$ is the element-wise product. One projection produces the signal, the other produces a gate that multiplies it position by position, so the block can suppress its own channels rather than only bending them.

The catch is arithmetic: gating needs **three** weight matrices where a plain FFN needs two. To spend the same parameters you have to shrink the expansion factor by two thirds, which is why gated models quote strange multipliers instead of a clean 4×. Llama 3 8B uses $d_{\text{model}} = 4096$ and $d_{\text{ff}} = 14336$ — a factor of 3.5, deliberately above the 8/3 break-even point.

<div class='lab wide' id='ffn-lab'>
<div class='lab-head'><span class='name'>Lab 4 · FFN and SwiGLU widths</span><span class='hint'>set the residual width and the expansion factor</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label>block</label>
<div class='seg seg-kind'>
<button type='button' data-value='swiglu' aria-pressed='true'>gated (SwiGLU)</button>
<button type='button' data-value='plain' aria-pressed='false'>plain FFN</button>
</div>
</div>
<div class='ctl'>
<label for='ffn-dmodel'>d_model <span class='val' id='ffn-dmodel-v'></span></label>
<input type='range' id='ffn-dmodel' min='512' max='8192' step='128' value='4096'>
</div>
<div class='ctl'>
<label for='ffn-mult'>expansion factor <span class='val' id='ffn-mult-v'></span></label>
<input type='range' id='ffn-mult' min='1' max='6' step='0.05' value='3.5'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>parameters</span><span class='v' id='ffn-stat-params'></span></div>
<div class='stat' style='--stat-hue:var(--n-lav)'><span class='k'>weight matrices</span><span class='v' id='ffn-stat-mats'></span></div>
<div class='stat' style='--stat-hue:var(--n-clay)'><span class='k'>cost vs plain 4×</span><span class='v' id='ffn-stat-vs'></span></div>
</div>
<div class='verdict' id='ffn-verdict'></div>
<svg viewBox='0 0 700 290' role='img'></svg>
<p class='cap'>Block heights are drawn to scale, so the 4× bulge in the middle is literal. Leave d_model at 4096 and the expansion at 3.5× and you are looking at a real Llama 3 8B block: d_ff = 14336.</p>
</div>
</div>

## What it bought

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 700 190' role='img' aria-label='MMLU, parameter count and throughput for Llama 3.1 8B and the two Minitron 4B variants'>
<text x='196' y='30' class='lbl sm'>MMLU</text>
<text x='540' y='30' class='lbl sm mid'>parameters</text>
<text x='650' y='30' class='lbl sm mid'>throughput</text>
<text x='16' y='72' class='lbl sm'>Llama 3.1 8B</text>
<rect x='196' y='52' width='300' height='24' rx='5' fill='var(--n-grid)'/>
<rect x='196' y='52' width='260.6' height='24' rx='5' fill='var(--n-teacher)' fill-opacity='0.9' class='a-wide' style='--d:0.20s'/>
<text x='464.6' y='69' class='lbl sm a-fade' style='--d:0.90s;fill:var(--n-teacher)'>69.5</text>
<text x='540' y='70' class='lbl mid a-fade' style='--d:1.00s;fill:var(--n-teacher)'>8.03B</text>
<text x='650' y='70' class='lbl mid a-fade' style='--d:1.10s;fill:var(--n-teacher)'>1.0×</text>
<text x='16' y='120' class='lbl sm'>Minitron 4B (width)</text>
<rect x='196' y='100' width='300' height='24' rx='5' fill='var(--n-grid)'/>
<rect x='196' y='100' width='226.9' height='24' rx='5' fill='var(--n-student)' fill-opacity='0.9' class='a-wide' style='--d:0.38s'/>
<text x='430.9' y='117' class='lbl sm a-fade' style='--d:1.08s;fill:var(--n-student)'>60.5</text>
<text x='540' y='118' class='lbl mid a-fade' style='--d:1.18s;fill:var(--n-student)'>4.5B</text>
<text x='650' y='118' class='lbl mid a-fade' style='--d:1.28s;fill:var(--n-student)'>1.8×</text>
<text x='16' y='168' class='lbl sm'>Minitron 4B (depth)</text>
<rect x='196' y='148' width='300' height='24' rx='5' fill='var(--n-grid)'/>
<rect x='196' y='148' width='220.1' height='24' rx='5' fill='var(--n-lav)' fill-opacity='0.9' class='a-wide' style='--d:0.56s'/>
<text x='424.1' y='165' class='lbl sm a-fade' style='--d:1.26s;fill:var(--n-lav)'>58.7</text>
<text x='540' y='166' class='lbl mid a-fade' style='--d:1.36s;fill:var(--n-lav)'>4.5B</text>
<text x='650' y='166' class='lbl mid a-fade' style='--d:1.46s;fill:var(--n-lav)'>2.7×</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 8.</span> Llama 3.1 8B against its two pruned-and-distilled 4B descendants. MMLU is 5-shot and the throughputs are measured, both reproduced from the Minitron report; retraining each 4B model took 94B tokens, a few per cent of a pre-training run. The depth-pruned variant is the faster one and the width-pruned one is the more accurate, which is the trade the axis choice buys you.</div>
</div>

The whole point of the exercise is the last column. Llama-3.1-Minitron-4B keeps most of the 8B model's MMLU while running **1.8×** faster (width-pruned) or **2.7×** faster (depth-pruned), and getting there cost **94B tokens** of distillation — against the trillions a from-scratch 4B model would need. Across the Minitron family, the authors put it at **up to 40× fewer training tokens per model**, under 3% of the original training data, and up to **16 points better MMLU than training the same size from scratch**.

Meta used the same idea for the small Llama 3.2 models: the 1B and 3B were pruned, then trained with **logits from Llama 3.1 8B and 70B as token-level targets** — teachers, in exactly the sense of the diagram above.

## Sources

- Muralidharan et al., [*Compact Language Models via Pruning and Knowledge Distillation*](https://arxiv.org/abs/2407.14679) (arXiv:2407.14679) — the importance-estimation and retraining method.
- Sreenivas et al., [*LLM Pruning and Distillation in Practice: The Minitron Approach*](https://arxiv.org/abs/2408.11796) (arXiv:2408.11796) — the Llama 3.1 8B → 4B numbers used here.
- NVIDIA, [*How to Prune and Distill Llama 3.1 8B*](https://developer.nvidia.com/blog/how-to-prune-and-distill-llama-3-1-8b-to-an-nvidia-llama-3-1-minitron-4b-model) — best practices and the teacher-correction step.
- Meta, [*Introducing Meta Llama 3*](https://ai.meta.com/blog/meta-llama-3/) — the 128,256-token vocabulary and the 15% figure.
- [RoPE and iRoPE](/blog/2026/08/22/rope-and-irope/) — my blog post on positional encoding and long context.
- Meta, [Llama 3.2 1B model card](https://huggingface.co/meta-llama/Llama-3.2-1B) — pruning plus logit distillation from the 8B and 70B.

<details class='scans'>
<summary>the original pages</summary>
<img src='/images/scratch-llama3-scan-1.jpg' alt='Handwritten notebook page 25: tokenizer compression ratio, pruning and distillation'>
<div class='caption'>Page 25 — compression ratio, the 10,000-word question, structured pruning, and the distillation loop.</div>
<img src='/images/scratch-llama3-scan-2.jpg' alt='Handwritten notebook page 26: the five-step pruning and distillation process, loss decomposition, MLP and FFN'>
<div class='caption'>Page 26 — the five steps, what the loss can attach to, and the MLP/FFN side note.</div>
</details>
