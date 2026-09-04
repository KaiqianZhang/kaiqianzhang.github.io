---
title: 'Regulotypes: redefining cells by what genetics does in them'
subtitle: We sort cells by what they look like, then ask whether the genetics agrees. This note argues for the other order, and works out what is actually new about it.
date: 2026-09-04
tags: regulotype
keywords: regulotype, cis-regulatory effects, single-cell genetics, eQTL, cell state, blood-brain barrier, Alzheimer's disease, latent context, matrix factorization
---

<p class='lede'>Genetics has spent twenty years building a catalogue of which inherited differences change which genes, and the catalogue records one number for each entry. This note is about the fact that one number cannot be right. The effect of an inherited difference depends on the cell it lands in, and the usual analysis averages that dependence away before anyone looks at it. The alternative is to describe a cell by what genetics does inside it, and that description is what I am calling a <b>regulotype</b>.</p>

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 392' role='img' aria-label='The seven sections of this note.'>
<text x='14.0' y='184.0' class='lbl bg a-pop' style='--d:0.00s;fill:var(--n-student)'>Note</text>
<text x='14.0' y='206.0' class='lbl bg a-pop' style='--d:0.08s;fill:var(--n-student)'>one</text>
<path d='M138 54.0 C134.7 54.0, 134.7 190.0, 116 190.0 C134.7 190.0, 134.7 318.0, 138 318.0' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.22s;--dur:0.90s;stroke:var(--n-student);stroke-width:2.4'/>
<a href='#two-cells-that-look-the-same-and-are-not' class='rm-row'>
<rect x='128' y='32.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='49.0' r='4.0' class='a-beat' style='--d:0.45s;--dur:2.00s;fill:var(--n-student)'/>
<text x='164.0' y='54.0' class='lbl a-rise' style='--d:0.45s;fill:var(--n-student)'>Two cells that look the same</text>
<text x='704.0' y='54.0' class='lbl sm end a-rise' style='--d:0.55s;fill:var(--n-dim)'>the whole idea, in one picture</text>
</a>
<a href='#why-one-gene-is-not-enough' class='rm-row'>
<rect x='128' y='76.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='93.0' r='4.0' class='a-beat' style='--d:0.52s;--dur:2.00s;fill:var(--n-teacher)'/>
<text x='164.0' y='98.0' class='lbl a-rise' style='--d:0.52s;fill:var(--n-teacher)'>Why one gene is not enough</text>
<text x='704.0' y='98.0' class='lbl sm end a-rise' style='--d:0.62s;fill:var(--n-dim)'>a number is not a description</text>
</a>
<a href='#the-trouble-with-sorting-cells-first' class='rm-row'>
<rect x='128' y='120.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='137.0' r='4.0' class='a-beat' style='--d:0.59s;--dur:2.00s;fill:var(--n-loss)'/>
<text x='164.0' y='142.0' class='lbl a-rise' style='--d:0.59s;fill:var(--n-loss)'>The trouble with sorting first</text>
<text x='704.0' y='142.0' class='lbl sm end a-rise' style='--d:0.69s;fill:var(--n-dim)'>no level of sorting is the right one</text>
</a>
<a href='#inverting-the-order' class='rm-row'>
<rect x='128' y='164.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='181.0' r='4.0' class='a-beat' style='--d:0.66s;--dur:2.00s;fill:var(--n-kept)'/>
<text x='164.0' y='186.0' class='lbl a-rise' style='--d:0.66s;fill:var(--n-kept)'>Inverting the order</text>
<text x='704.0' y='186.0' class='lbl sm end a-rise' style='--d:0.76s;fill:var(--n-dim)'>let the genetics do the sorting</text>
</a>
<a href='#is-this-not-already-done' class='rm-row'>
<rect x='128' y='208.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='225.0' r='4.0' class='a-beat' style='--d:0.73s;--dur:2.00s;fill:var(--n-data)'/>
<text x='164.0' y='230.0' class='lbl a-rise' style='--d:0.73s;fill:var(--n-data)'>Is this not already done?</text>
<text x='704.0' y='230.0' class='lbl sm end a-rise' style='--d:0.83s;fill:var(--n-dim)'>conceded, in detail, then the gap</text>
</a>
<a href='#but-surely-the-contribution-is-limited' class='rm-row'>
<rect x='128' y='252.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='269.0' r='4.0' class='a-beat' style='--d:0.80s;--dur:2.00s;fill:var(--n-pruned)'/>
<text x='164.0' y='274.0' class='lbl a-rise' style='--d:0.80s;fill:var(--n-pruned)'>Surely it is limited?</text>
<text x='704.0' y='274.0' class='lbl sm end a-rise' style='--d:0.90s;fill:var(--n-dim)'>the objection that turns around</text>
</a>
<a href='#what-would-make-this-fail' class='rm-row'>
<rect x='128' y='296.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='313.0' r='4.0' class='a-beat' style='--d:0.87s;--dur:2.00s;fill:var(--n-dim)'/>
<text x='164.0' y='318.0' class='lbl a-rise' style='--d:0.87s;fill:var(--n-dim)'>What would make this fail</text>
<text x='704.0' y='318.0' class='lbl sm end a-rise' style='--d:0.97s;fill:var(--n-dim)'>three ways to be wrong</text>
</a>
</svg>
</div>

## Two cells that look the same and are not

Every person carries two copies of each gene, and people differ from one another at single letters of DNA. Suppose that near gene A there is one such letter that varies between people, and that carrying one version rather than the other makes gene A somewhat more active. That is an inherited effect on gene A, and it is the kind of thing genetics has been cataloguing since the early 2000s.

The catalogue records one number for that effect. The trouble is that the number is not the same everywhere. Every cell in your body carries the same DNA, so the letter is identical in all of them, and yet in one cell it raises gene A considerably and in another it does almost nothing. What differs is not the DNA but the cellular setting the DNA is sitting in.

Now take two genes at once, A and B, each with its own nearby varying letter, and consider two cells from the same person. In the first, the letter near A has a large effect and the letter near B has none. In the second, the reverse. Ask how much A and how much B each cell is producing and the two cells can look identical. Ask instead what the inherited differences are doing in them and they are opposites.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 442' role='img' aria-label='Two cells with identical gene levels and opposite genetic effects.'>
<text x='14.0' y='96.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>how much</text>
<text x='14.0' y='114.0' class='lbl sm a-rise' style='--d:0.08s;fill:var(--n-dim)'>is made</text>
<text x='14.0' y='284.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>what the</text>
<text x='14.0' y='302.0' class='lbl sm a-rise' style='--d:0.08s;fill:var(--n-dim)'>letter does</text>
<rect x='64.0' y='44.0' width='264.0' height='172.0' rx='14' class='box a-pop' style='--d:0.10s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='64.0' y='232.0' width='264.0' height='172.0' rx='14' class='box a-pop' style='--d:0.10s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='196.0' y='32.0' class='lbl bg mid a-pop' style='--d:0.05s;fill:var(--n-ink)'>cell 1</text>
<rect x='110.0' y='122.0' width='66.0' height='74.0' rx='3' class='a-grow' style='--d:0.45s;--dur:0.60s;fill:var(--n-teacher);transform-origin:143.0px 196.0px'/>
<text x='143.0' y='216.0' class='lbl sm mid a-rise' style='--d:0.55s;fill:var(--n-dim)'>gene A</text>
<rect x='110.0' y='304.0' width='66.0' height='80.0' rx='3' class='a-grow' style='--d:0.95s;--dur:0.60s;fill:var(--n-kept);transform-origin:143.0px 384.0px'/>
<text x='143.0' y='404.0' class='lbl sm mid a-rise' style='--d:1.05s;fill:var(--n-dim)'>gene A</text>
<rect x='228.0' y='142.0' width='66.0' height='54.0' rx='3' class='a-grow' style='--d:0.55s;--dur:0.60s;fill:var(--n-teacher);transform-origin:261.0px 196.0px'/>
<text x='261.0' y='216.0' class='lbl sm mid a-rise' style='--d:0.65s;fill:var(--n-dim)'>gene B</text>
<rect x='228.0' y='377.0' width='66.0' height='7.0' rx='3' class='a-grow' style='--d:1.05s;--dur:0.60s;fill:var(--n-pruned);transform-origin:261.0px 384.0px'/>
<text x='261.0' y='404.0' class='lbl sm mid a-rise' style='--d:1.15s;fill:var(--n-dim)'>gene B</text>
<path d='M84.0 196.0 L308.0 196.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.35s;--dur:0.50s;stroke:var(--n-edge);stroke-width:1.4'/>
<path d='M84.0 384.0 L308.0 384.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.85s;--dur:0.50s;stroke:var(--n-edge);stroke-width:1.4'/>
<rect x='392.0' y='44.0' width='264.0' height='172.0' rx='14' class='box a-pop' style='--d:0.30s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='392.0' y='232.0' width='264.0' height='172.0' rx='14' class='box a-pop' style='--d:0.30s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='524.0' y='32.0' class='lbl bg mid a-pop' style='--d:0.25s;fill:var(--n-ink)'>cell 2</text>
<rect x='438.0' y='122.0' width='66.0' height='74.0' rx='3' class='a-grow' style='--d:0.65s;--dur:0.60s;fill:var(--n-teacher);transform-origin:471.0px 196.0px'/>
<text x='471.0' y='216.0' class='lbl sm mid a-rise' style='--d:0.75s;fill:var(--n-dim)'>gene A</text>
<rect x='438.0' y='377.0' width='66.0' height='7.0' rx='3' class='a-grow' style='--d:1.15s;--dur:0.60s;fill:var(--n-pruned);transform-origin:471.0px 384.0px'/>
<text x='471.0' y='404.0' class='lbl sm mid a-rise' style='--d:1.25s;fill:var(--n-dim)'>gene A</text>
<rect x='556.0' y='142.0' width='66.0' height='54.0' rx='3' class='a-grow' style='--d:0.75s;--dur:0.60s;fill:var(--n-teacher);transform-origin:589.0px 196.0px'/>
<text x='589.0' y='216.0' class='lbl sm mid a-rise' style='--d:0.85s;fill:var(--n-dim)'>gene B</text>
<rect x='556.0' y='304.0' width='66.0' height='80.0' rx='3' class='a-grow' style='--d:1.25s;--dur:0.60s;fill:var(--n-kept);transform-origin:589.0px 384.0px'/>
<text x='589.0' y='404.0' class='lbl sm mid a-rise' style='--d:1.35s;fill:var(--n-dim)'>gene B</text>
<path d='M412.0 196.0 L636.0 196.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.55s;--dur:0.50s;stroke:var(--n-edge);stroke-width:1.4'/>
<path d='M412.0 384.0 L636.0 384.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.05s;--dur:0.50s;stroke:var(--n-edge);stroke-width:1.4'/>
<text x='360.0' y='130.0' class='lbl bg mid a-pop' style='--d:1.55s;fill:var(--n-teacher)'>=</text>
<text x='360.0' y='318.0' class='lbl bg mid a-pop' style='--d:1.75s;fill:var(--n-loss)'>&#8800;</text>
<text x='360.0' y='424.0' class='lbl mid a-pop' style='--d:1.95s;fill:var(--n-student)'>same contents, opposite genetics</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> Two cells from one person. Above, how much of each gene is made: the same in both. Below, what the inherited letter beside each gene does to it: strong in one cell and absent in the other, and the reverse next door. The upper description cannot separate these cells; the lower one calls them opposites.</div>
</div>

That second description is the regulotype: a cell described by the list of effects that inherited differences have inside it, one number for each variant and gene considered. Two cells share a regulotype when the same inherited differences do the same thing in them, whatever their ordinary contents look like.

The reason to care is that this is the description a disease study actually needs. Genetic studies of Alzheimer's disease have found seventy-five regions of the genome that matter, and for most of them nobody knows which gene is affected or in which cells. If a risk variant acts only in a restricted cellular condition, and every cell was averaged together before anyone looked, the signal was gone before the analysis began.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 392' role='img' aria-label='A grid of variant-gene pairs by cells; one column is highlighted as a regulotype.'>
<text x='24.0' y='46.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>one row for each inherited letter and the gene beside it</text>
<text x='24.0' y='103.0' class='lbl sm a-rise' style='--d:0.15s;fill:var(--n-ink)'>letter 1 &#183; gene A</text>
<rect x='244.0' y='78.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.45s;fill:rgba(var(--n-violet-rgb), 0.84);stroke:var(--n-edge)'/>
<rect x='352.0' y='78.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.70s;fill:rgba(var(--n-teal-rgb), 0.15);stroke:var(--n-edge)'/>
<text x='24.0' y='143.0' class='lbl sm a-rise' style='--d:0.20s;fill:var(--n-ink)'>letter 2 &#183; gene B</text>
<rect x='244.0' y='118.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.51s;fill:rgba(var(--n-violet-rgb), 0.14);stroke:var(--n-edge)'/>
<rect x='352.0' y='118.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.76s;fill:rgba(var(--n-teal-rgb), 0.80);stroke:var(--n-edge)'/>
<text x='24.0' y='183.0' class='lbl sm a-rise' style='--d:0.25s;fill:var(--n-ink)'>letter 3 &#183; gene C</text>
<rect x='244.0' y='158.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.57s;fill:rgba(var(--n-violet-rgb), 0.54);stroke:var(--n-edge)'/>
<rect x='352.0' y='158.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.82s;fill:rgba(var(--n-teal-rgb), 0.50);stroke:var(--n-edge)'/>
<text x='24.0' y='223.0' class='lbl sm a-rise' style='--d:0.30s;fill:var(--n-ink)'>letter 4 &#183; gene D</text>
<rect x='244.0' y='198.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.63s;fill:rgba(var(--n-violet-rgb), 0.18);stroke:var(--n-edge)'/>
<rect x='352.0' y='198.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.88s;fill:rgba(var(--n-teal-rgb), 0.68);stroke:var(--n-edge)'/>
<text x='24.0' y='263.0' class='lbl sm a-rise' style='--d:0.35s;fill:var(--n-ink)'>letter 5 &#183; gene E</text>
<rect x='244.0' y='238.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.69s;fill:rgba(var(--n-violet-rgb), 0.72);stroke:var(--n-edge)'/>
<rect x='352.0' y='238.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.94s;fill:rgba(var(--n-teal-rgb), 0.20);stroke:var(--n-edge)'/>
<text x='24.0' y='303.0' class='lbl sm a-rise' style='--d:0.40s;fill:var(--n-ink)'>letter 6 &#183; gene F</text>
<rect x='244.0' y='278.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.75s;fill:rgba(var(--n-violet-rgb), 0.26);stroke:var(--n-edge)'/>
<rect x='352.0' y='278.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:1.00s;fill:rgba(var(--n-teal-rgb), 0.62);stroke:var(--n-edge)'/>
<text x='24.0' y='343.0' class='lbl sm a-rise' style='--d:0.45s;fill:var(--n-ink)'>letter 7 &#183; gene G</text>
<rect x='244.0' y='318.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:0.81s;fill:rgba(var(--n-violet-rgb), 0.42);stroke:var(--n-edge)'/>
<rect x='352.0' y='318.0' width='88.0' height='32.0' rx='5' class='box a-pop' style='--d:1.06s;fill:rgba(var(--n-teal-rgb), 0.38);stroke:var(--n-edge)'/>
<text x='288.0' y='64.0' class='lbl mid a-pop' style='--d:0.25s;fill:var(--n-ink)'>cell 1</text>
<text x='396.0' y='64.0' class='lbl mid a-pop' style='--d:0.35s;fill:var(--n-ink)'>cell 2</text>
<rect x='476.0' y='72.0' width='220.0' height='278.0' rx='12' class='box a-pop' style='--d:1.30s;fill:none;stroke:var(--n-student)'/>
<text x='586.0' y='138.0' class='lbl mid a-pop' style='--d:1.45s;fill:var(--n-student)'>a column is</text>
<text x='586.0' y='166.0' class='lbl bg mid a-pop' style='--d:1.52s;fill:var(--n-student)'>the regulotype</text>
<text x='586.0' y='194.0' class='lbl mid a-pop' style='--d:1.59s;fill:var(--n-student)'>of that cell</text>
<text x='586.0' y='250.0' class='lbl sm mid a-rise' style='--d:1.75s;fill:var(--n-dim)'>two columns can</text>
<text x='586.0' y='270.0' class='lbl sm mid a-rise' style='--d:1.80s;fill:var(--n-dim)'>be compared;</text>
<text x='586.0' y='290.0' class='lbl sm mid a-rise' style='--d:1.85s;fill:var(--n-dim)'>one number cannot</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> Widen the same picture to many independent regions of the genome and each cell becomes a column, with one number for every inherited letter and the gene beside it. Darker means a larger effect. That column is the regulotype, and two of them can be compared &mdash; which is what a single number could never support.</div>
</div>

The cost of that averaging is easy to state and easy to underestimate. A study that reports one number per variant and gene is reporting a weighted average over whatever cells happened to be in the sample. When the underlying effects point in the same direction, the average is a fair summary and nothing is lost. When they point in opposite directions, the average is close to zero, and the honest conclusion drawn from it — that the inherited difference does nothing — is exactly wrong.

<div class='lab wide' id='rg-avg-lab'>
<div class='lab-head'><span class='name'>Lab 1 &middot; what one number hides</span><span class='hint'>drag the two effects apart and watch the reported value</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label for='rg-e1'>effect in setting 1 <span class='val' id='rg-e1-v'></span></label>
<input type='range' id='rg-e1' min='-1' max='1' step='0.01' value='0.85'>
</div>
<div class='ctl'>
<label for='rg-e2'>effect in setting 2 <span class='val' id='rg-e2-v'></span></label>
<input type='range' id='rg-e2' min='-1' max='1' step='0.01' value='-0.75'>
</div>
<div class='ctl'>
<label for='rg-mix'>share of cells in setting 1 <span class='val' id='rg-mix-v'></span></label>
<input type='range' id='rg-mix' min='0' max='1' step='0.01' value='0.5'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-loss)'><span class='k'>the one number reported</span><span class='v' id='rg-stat-avg'></span></div>
<div class='stat' style='--stat-hue:var(--n-kept)'><span class='k'>missed in setting 1</span><span class='v' id='rg-stat-miss1'></span></div>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>missed in setting 2</span><span class='v' id='rg-stat-miss2'></span></div>
</div>
<div class='verdict' id='rg-avg-verdict'></div>
<svg viewBox='0 0 700 250' role='img'></svg>
<p class='cap'>Set the true effect in two cellular settings and the share of cells in each. The dashed line is what a study reporting a single effect per variant and gene would publish. Everything here is a weighted average and nothing is fitted &mdash; the truth is whatever you set it to.</p>
</div>
</div>

## Why one gene is not enough

One gene gives one number per cell, and a single number is not a description. It cannot separate two cells in any way that means something, because almost any two cells will differ a little on one measurement, and there is no way to tell a real difference from noise.

Width is what makes this work. Take many independent regions of the genome, one nominated variant and one gene from each, and every cell acquires a column of numbers rather than a single one. Columns can be compared. Two cells are alike when the same inherited differences do the same thing across the whole reference set, and that is a statement with enough content to sort cells by.

Sharing the reference set across cells is also what makes the problem solvable at all. Any one variant carries very little information, because the only thing that varies is which version each person inherited. Pooling across many regions is what turns a set of individually hopeless estimates into a usable coordinate system.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 380' role='img' aria-label='Two scatter plots of the same cells, with two highlighted cells adjacent in one and distant in the other.'>
<rect x='48.0' y='66.0' width='280.0' height='258.0' rx='14' class='box a-pop' style='--d:0.08s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='188.0' y='48.0' class='lbl mid a-pop' style='--d:0.04s;fill:var(--n-teacher)'>sorted by appearance</text>
<path d='M118.0 74.0 L118.0 316.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.20s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M56.0 130.5 L320.0 130.5' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.20s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M188.0 74.0 L188.0 316.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.20s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M56.0 195.0 L320.0 195.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.20s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M258.0 74.0 L258.0 316.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.20s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M56.0 259.5 L320.0 259.5' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.20s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<circle cx='112.5' cy='221.2' r='5.5' class='a-pop' style='--d:0.35s;fill:var(--n-dim)'/>
<circle cx='140.8' cy='147.0' r='5.5' class='a-pop' style='--d:0.37s;fill:var(--n-dim)'/>
<circle cx='173.8' cy='247.3' r='5.5' class='a-pop' style='--d:0.39s;fill:var(--n-dim)'/>
<circle cx='206.9' cy='173.2' r='5.5' class='a-pop' style='--d:0.41s;fill:var(--n-dim)'/>
<circle cx='235.2' cy='229.9' r='5.5' class='a-pop' style='--d:0.43s;fill:var(--n-dim)'/>
<circle cx='131.4' cy='186.3' r='5.5' class='a-pop' style='--d:0.45s;fill:var(--n-dim)'/>
<circle cx='192.7' cy='129.6' r='5.5' class='a-pop' style='--d:0.47s;fill:var(--n-dim)'/>
<circle cx='225.8' cy='273.5' r='5.5' class='a-pop' style='--d:0.49s;fill:var(--n-dim)'/>
<circle cx='159.7' cy='199.4' r='5.5' class='a-pop' style='--d:0.51s;fill:var(--n-dim)'/>
<circle cx='254.1' cy='160.1' r='5.5' class='a-pop' style='--d:0.53s;fill:var(--n-dim)'/>
<circle cx='98.3' cy='160.1' r='5.5' class='a-pop' style='--d:0.55s;fill:var(--n-dim)'/>
<circle cx='273.0' cy='212.4' r='5.5' class='a-pop' style='--d:0.57s;fill:var(--n-dim)'/>
<circle cx='211.6' cy='216.8' r='5.5' class='a-pop' style='--d:0.59s;fill:var(--n-dim)'/>
<circle cx='150.2' cy='273.5' r='5.5' class='a-pop' style='--d:0.61s;fill:var(--n-dim)'/>
<circle cx='244.6' cy='120.9' r='5.5' class='a-pop' style='--d:0.63s;fill:var(--n-dim)'/>
<circle cx='173.8' cy='199.4' r='11.0' class='a-pop' style='--d:0.95s;fill:var(--n-student)'/>
<text x='173.8' y='204.4' class='lbl sm mid on a-pop' style='--d:1.02s'>1</text>
<circle cx='183.3' cy='208.1' r='11.0' class='a-pop' style='--d:0.95s;fill:var(--n-kept)'/>
<text x='183.3' y='213.1' class='lbl sm mid on a-pop' style='--d:1.02s'>2</text>
<rect x='392.0' y='66.0' width='280.0' height='258.0' rx='14' class='box a-pop' style='--d:0.63s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='532.0' y='48.0' class='lbl mid a-pop' style='--d:0.59s;fill:var(--n-student)'>sorted by genetic response</text>
<path d='M462.0 74.0 L462.0 316.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M400.0 130.5 L664.0 130.5' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M532.0 74.0 L532.0 316.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M400.0 195.0 L664.0 195.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M602.0 74.0 L602.0 316.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<path d='M400.0 259.5 L664.0 259.5' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.40s;stroke:var(--n-grid);stroke-width:1.0'/>
<circle cx='456.5' cy='221.2' r='5.5' class='a-pop' style='--d:0.90s;fill:var(--n-dim)'/>
<circle cx='484.8' cy='147.0' r='5.5' class='a-pop' style='--d:0.92s;fill:var(--n-dim)'/>
<circle cx='517.8' cy='247.3' r='5.5' class='a-pop' style='--d:0.94s;fill:var(--n-dim)'/>
<circle cx='550.9' cy='173.2' r='5.5' class='a-pop' style='--d:0.96s;fill:var(--n-dim)'/>
<circle cx='579.2' cy='229.9' r='5.5' class='a-pop' style='--d:0.98s;fill:var(--n-dim)'/>
<circle cx='475.4' cy='186.3' r='5.5' class='a-pop' style='--d:1.00s;fill:var(--n-dim)'/>
<circle cx='536.7' cy='129.6' r='5.5' class='a-pop' style='--d:1.02s;fill:var(--n-dim)'/>
<circle cx='569.8' cy='273.5' r='5.5' class='a-pop' style='--d:1.04s;fill:var(--n-dim)'/>
<circle cx='503.7' cy='199.4' r='5.5' class='a-pop' style='--d:1.06s;fill:var(--n-dim)'/>
<circle cx='598.1' cy='160.1' r='5.5' class='a-pop' style='--d:1.08s;fill:var(--n-dim)'/>
<circle cx='442.3' cy='160.1' r='5.5' class='a-pop' style='--d:1.10s;fill:var(--n-dim)'/>
<circle cx='617.0' cy='212.4' r='5.5' class='a-pop' style='--d:1.12s;fill:var(--n-dim)'/>
<circle cx='555.6' cy='216.8' r='5.5' class='a-pop' style='--d:1.14s;fill:var(--n-dim)'/>
<circle cx='494.2' cy='273.5' r='5.5' class='a-pop' style='--d:1.16s;fill:var(--n-dim)'/>
<circle cx='588.6' cy='120.9' r='5.5' class='a-pop' style='--d:1.18s;fill:var(--n-dim)'/>
<circle cx='451.8' cy='260.4' r='11.0' class='a-pop' style='--d:1.50s;fill:var(--n-student)'/>
<text x='451.8' y='265.4' class='lbl sm mid on a-pop' style='--d:1.57s'>1</text>
<circle cx='612.2' cy='134.0' r='11.0' class='a-pop' style='--d:1.50s;fill:var(--n-kept)'/>
<text x='612.2' y='139.0' class='lbl sm mid on a-pop' style='--d:1.57s'>2</text>
<text x='360.0' y='360.0' class='lbl mid a-pop' style='--d:2.10s;fill:var(--n-ink)'>the same fifteen cells, arranged twice</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> The same fifteen cells, arranged twice. On the left they are placed by how similar their contents are, and cells 1 and 2 sit almost on top of one another. On the right they are placed by how similarly inherited differences act in them, and the same two cells are as far apart as the map allows. Neither arrangement is wrong; they are answers to different questions.</div>
</div>

Which brings up the constraint that governs everything else in this project. The number of independent observations for a genetic question is the number of **people**, not the number of cells. A person's cells all carry the same DNA, so measuring more of them sharpens the picture of what is happening inside that person and adds nothing to the genetic sample size. Cells buy resolution. Only people buy evidence.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 376' role='img' aria-label='Three people with many cells each, then the same cells split into smaller groups; the number of people is unchanged.'>
<text x='24.0' y='40.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>three people, many cells each</text>
<rect x='40.0' y='58.0' width='196.0' height='118.0' rx='12' class='box a-pop' style='--d:0.10s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='138.0' y='50.0' class='lbl sm mid a-pop' style='--d:0.06s;fill:var(--n-data)'>person 1</text>
<circle cx='64.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.30s;fill:var(--n-teacher)'/>
<circle cx='86.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.31s;fill:var(--n-teacher)'/>
<circle cx='108.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.32s;fill:var(--n-teacher)'/>
<circle cx='130.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.34s;fill:var(--n-teacher)'/>
<circle cx='152.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.35s;fill:var(--n-teacher)'/>
<circle cx='174.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.36s;fill:var(--n-teacher)'/>
<circle cx='196.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.37s;fill:var(--n-teacher)'/>
<circle cx='218.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.38s;fill:var(--n-teacher)'/>
<circle cx='64.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.40s;fill:var(--n-teacher)'/>
<circle cx='86.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.41s;fill:var(--n-teacher)'/>
<circle cx='108.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.42s;fill:var(--n-teacher)'/>
<circle cx='130.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.43s;fill:var(--n-teacher)'/>
<circle cx='152.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.44s;fill:var(--n-teacher)'/>
<circle cx='174.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.46s;fill:var(--n-teacher)'/>
<circle cx='196.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.47s;fill:var(--n-teacher)'/>
<circle cx='218.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.48s;fill:var(--n-teacher)'/>
<circle cx='64.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.49s;fill:var(--n-teacher)'/>
<circle cx='86.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.50s;fill:var(--n-teacher)'/>
<circle cx='108.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.52s;fill:var(--n-teacher)'/>
<circle cx='130.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.53s;fill:var(--n-teacher)'/>
<circle cx='152.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.54s;fill:var(--n-teacher)'/>
<circle cx='174.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.55s;fill:var(--n-teacher)'/>
<circle cx='196.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.56s;fill:var(--n-teacher)'/>
<circle cx='218.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.58s;fill:var(--n-teacher)'/>
<rect x='264.0' y='58.0' width='196.0' height='118.0' rx='12' class='box a-pop' style='--d:0.20s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='362.0' y='50.0' class='lbl sm mid a-pop' style='--d:0.16s;fill:var(--n-data)'>person 2</text>
<circle cx='288.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.40s;fill:var(--n-teacher)'/>
<circle cx='310.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.41s;fill:var(--n-teacher)'/>
<circle cx='332.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.42s;fill:var(--n-teacher)'/>
<circle cx='354.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.44s;fill:var(--n-teacher)'/>
<circle cx='376.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.45s;fill:var(--n-teacher)'/>
<circle cx='398.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.46s;fill:var(--n-teacher)'/>
<circle cx='420.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.47s;fill:var(--n-teacher)'/>
<circle cx='442.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.48s;fill:var(--n-teacher)'/>
<circle cx='288.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.50s;fill:var(--n-teacher)'/>
<circle cx='310.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.51s;fill:var(--n-teacher)'/>
<circle cx='332.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.52s;fill:var(--n-teacher)'/>
<circle cx='354.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.53s;fill:var(--n-teacher)'/>
<circle cx='376.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.54s;fill:var(--n-teacher)'/>
<circle cx='398.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.56s;fill:var(--n-teacher)'/>
<circle cx='420.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.57s;fill:var(--n-teacher)'/>
<circle cx='442.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.58s;fill:var(--n-teacher)'/>
<circle cx='288.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.59s;fill:var(--n-teacher)'/>
<circle cx='310.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.60s;fill:var(--n-teacher)'/>
<circle cx='332.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.62s;fill:var(--n-teacher)'/>
<circle cx='354.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.63s;fill:var(--n-teacher)'/>
<circle cx='376.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.64s;fill:var(--n-teacher)'/>
<circle cx='398.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.65s;fill:var(--n-teacher)'/>
<circle cx='420.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.66s;fill:var(--n-teacher)'/>
<circle cx='442.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.68s;fill:var(--n-teacher)'/>
<rect x='488.0' y='58.0' width='196.0' height='118.0' rx='12' class='box a-pop' style='--d:0.30s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='586.0' y='50.0' class='lbl sm mid a-pop' style='--d:0.26s;fill:var(--n-data)'>person 3</text>
<circle cx='512.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.50s;fill:var(--n-teacher)'/>
<circle cx='534.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.51s;fill:var(--n-teacher)'/>
<circle cx='556.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.52s;fill:var(--n-teacher)'/>
<circle cx='578.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.54s;fill:var(--n-teacher)'/>
<circle cx='600.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.55s;fill:var(--n-teacher)'/>
<circle cx='622.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.56s;fill:var(--n-teacher)'/>
<circle cx='644.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.57s;fill:var(--n-teacher)'/>
<circle cx='666.0' cy='84.0' r='6.5' class='a-pop' style='--d:0.58s;fill:var(--n-teacher)'/>
<circle cx='512.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.60s;fill:var(--n-teacher)'/>
<circle cx='534.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.61s;fill:var(--n-teacher)'/>
<circle cx='556.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.62s;fill:var(--n-teacher)'/>
<circle cx='578.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.63s;fill:var(--n-teacher)'/>
<circle cx='600.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.64s;fill:var(--n-teacher)'/>
<circle cx='622.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.66s;fill:var(--n-teacher)'/>
<circle cx='644.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.67s;fill:var(--n-teacher)'/>
<circle cx='666.0' cy='112.0' r='6.5' class='a-pop' style='--d:0.68s;fill:var(--n-teacher)'/>
<circle cx='512.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.69s;fill:var(--n-teacher)'/>
<circle cx='534.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.70s;fill:var(--n-teacher)'/>
<circle cx='556.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.72s;fill:var(--n-teacher)'/>
<circle cx='578.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.73s;fill:var(--n-teacher)'/>
<circle cx='600.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.74s;fill:var(--n-teacher)'/>
<circle cx='622.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.75s;fill:var(--n-teacher)'/>
<circle cx='644.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.76s;fill:var(--n-teacher)'/>
<circle cx='666.0' cy='140.0' r='6.5' class='a-pop' style='--d:0.78s;fill:var(--n-teacher)'/>
<text x='24.0' y='224.0' class='lbl sm a-rise' style='--d:1.05s;fill:var(--n-dim)'>split them finer and the cells divide, but the people do not</text>
<rect x='40.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.20s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='54.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.35s;fill:var(--n-pruned)'/>
<circle cx='70.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.36s;fill:var(--n-pruned)'/>
<circle cx='86.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.37s;fill:var(--n-pruned)'/>
<circle cx='54.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.38s;fill:var(--n-pruned)'/>
<circle cx='70.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.39s;fill:var(--n-pruned)'/>
<circle cx='86.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.40s;fill:var(--n-pruned)'/>
<circle cx='54.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.41s;fill:var(--n-pruned)'/>
<circle cx='70.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.42s;fill:var(--n-pruned)'/>
<rect x='104.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.25s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='118.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.40s;fill:var(--n-pruned)'/>
<circle cx='134.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.41s;fill:var(--n-pruned)'/>
<circle cx='150.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.42s;fill:var(--n-pruned)'/>
<circle cx='118.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.43s;fill:var(--n-pruned)'/>
<circle cx='134.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.44s;fill:var(--n-pruned)'/>
<circle cx='150.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.45s;fill:var(--n-pruned)'/>
<circle cx='118.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.46s;fill:var(--n-pruned)'/>
<circle cx='134.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.47s;fill:var(--n-pruned)'/>
<rect x='168.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.30s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='182.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.45s;fill:var(--n-pruned)'/>
<circle cx='198.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.46s;fill:var(--n-pruned)'/>
<circle cx='214.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.47s;fill:var(--n-pruned)'/>
<circle cx='182.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.48s;fill:var(--n-pruned)'/>
<circle cx='198.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.49s;fill:var(--n-pruned)'/>
<circle cx='214.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.50s;fill:var(--n-pruned)'/>
<circle cx='182.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.51s;fill:var(--n-pruned)'/>
<circle cx='198.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.52s;fill:var(--n-pruned)'/>
<rect x='264.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.28s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='278.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.43s;fill:var(--n-pruned)'/>
<circle cx='294.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.44s;fill:var(--n-pruned)'/>
<circle cx='310.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.45s;fill:var(--n-pruned)'/>
<circle cx='278.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.46s;fill:var(--n-pruned)'/>
<circle cx='294.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.47s;fill:var(--n-pruned)'/>
<circle cx='310.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.48s;fill:var(--n-pruned)'/>
<circle cx='278.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.49s;fill:var(--n-pruned)'/>
<circle cx='294.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.50s;fill:var(--n-pruned)'/>
<rect x='328.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.33s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='342.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.48s;fill:var(--n-pruned)'/>
<circle cx='358.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.49s;fill:var(--n-pruned)'/>
<circle cx='374.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.50s;fill:var(--n-pruned)'/>
<circle cx='342.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.51s;fill:var(--n-pruned)'/>
<circle cx='358.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.52s;fill:var(--n-pruned)'/>
<circle cx='374.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.53s;fill:var(--n-pruned)'/>
<circle cx='342.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.54s;fill:var(--n-pruned)'/>
<circle cx='358.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.55s;fill:var(--n-pruned)'/>
<rect x='392.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.38s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='406.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.53s;fill:var(--n-pruned)'/>
<circle cx='422.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.54s;fill:var(--n-pruned)'/>
<circle cx='438.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.55s;fill:var(--n-pruned)'/>
<circle cx='406.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.56s;fill:var(--n-pruned)'/>
<circle cx='422.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.57s;fill:var(--n-pruned)'/>
<circle cx='438.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.58s;fill:var(--n-pruned)'/>
<circle cx='406.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.59s;fill:var(--n-pruned)'/>
<circle cx='422.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.60s;fill:var(--n-pruned)'/>
<rect x='488.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.36s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='502.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.51s;fill:var(--n-pruned)'/>
<circle cx='518.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.52s;fill:var(--n-pruned)'/>
<circle cx='534.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.53s;fill:var(--n-pruned)'/>
<circle cx='502.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.54s;fill:var(--n-pruned)'/>
<circle cx='518.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.55s;fill:var(--n-pruned)'/>
<circle cx='534.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.56s;fill:var(--n-pruned)'/>
<circle cx='502.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.57s;fill:var(--n-pruned)'/>
<circle cx='518.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.58s;fill:var(--n-pruned)'/>
<rect x='552.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.41s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='566.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.56s;fill:var(--n-pruned)'/>
<circle cx='582.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.57s;fill:var(--n-pruned)'/>
<circle cx='598.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.58s;fill:var(--n-pruned)'/>
<circle cx='566.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.59s;fill:var(--n-pruned)'/>
<circle cx='582.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.60s;fill:var(--n-pruned)'/>
<circle cx='598.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.61s;fill:var(--n-pruned)'/>
<circle cx='566.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.62s;fill:var(--n-pruned)'/>
<circle cx='582.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.63s;fill:var(--n-pruned)'/>
<rect x='616.0' y='244.0' width='58.0' height='76.0' rx='9' class='box a-pop' style='--d:1.46s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<circle cx='630.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.61s;fill:var(--n-pruned)'/>
<circle cx='646.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.62s;fill:var(--n-pruned)'/>
<circle cx='662.0' cy='262.0' r='5.0' class='a-pop' style='--d:1.63s;fill:var(--n-pruned)'/>
<circle cx='630.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.64s;fill:var(--n-pruned)'/>
<circle cx='646.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.65s;fill:var(--n-pruned)'/>
<circle cx='662.0' cy='282.0' r='5.0' class='a-pop' style='--d:1.66s;fill:var(--n-pruned)'/>
<circle cx='630.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.67s;fill:var(--n-pruned)'/>
<circle cx='646.0' cy='302.0' r='5.0' class='a-pop' style='--d:1.68s;fill:var(--n-pruned)'/>
<text x='360.0' y='356.0' class='lbl mid a-pop' style='--d:2.05s;fill:var(--n-loss)'>the number of independent genomes is still three</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 4.</span> Cells multiply and people do not. Sorting the same measurements more finely divides each person&#39;s cells into smaller piles, which sharpens what can be said about that person, and leaves the number of independent genomes exactly where it started. This is the constraint that makes finer and finer labelling stop working.</div>
</div>

## The trouble with sorting cells first

The standard approach sorts cells into named types, averages within each type, and then looks for genetic effects inside each average. The difficulty is choosing how finely to sort, and there is now good evidence that no choice is right.

A study of inflammatory bowel disease published in 2026 measured this directly. Pooling all cells together found the largest number of genes with a detectable effect — about three quarters of everything it found. But close to a third of the individual effects appeared **only** after cells were split by type, and were invisible in the pool. Splitting further does not fix this, because it runs into the constraint from the previous section: in that same study, once cells were divided into types, more than half of the types were left with fewer than a hundred cells per person.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 324' role='img' aria-label='Three horizontal bars showing 77.1 percent, 29.3 percent and 57 percent.'>
<text x='360.0' y='40.0' class='lbl mid a-pop' style='--d:0.05s;fill:var(--n-ink)'>the same study, counted two ways</text>
<text x='34.0' y='76.0' class='lbl sm a-rise' style='--d:0.30s;fill:var(--n-ink)'>genes with an effect found when all cells are pooled</text>
<rect x='34.0' y='88.0' width='420.0' height='26.0' rx='6' class='box a-pop' style='--d:0.35s;fill:var(--n-grid);stroke:none'/>
<rect x='34.0' y='88.0' width='323.8' height='26' rx='6' class='a-wide' style='--d:0.45s;--dur:0.9s;fill:var(--n-teacher);transform-origin:34.0px 101.0px'/>
<text x='470.0' y='108.0' class='lbl bg a-pop' style='--d:0.85s;fill:var(--n-teacher)'>77.1%</text>
<text x='34.0' y='150.0' class='lbl sm a-rise' style='--d:0.60s;fill:var(--n-ink)'>effects visible only after cells are split by type</text>
<rect x='34.0' y='162.0' width='420.0' height='26.0' rx='6' class='box a-pop' style='--d:0.65s;fill:var(--n-grid);stroke:none'/>
<rect x='34.0' y='162.0' width='123.1' height='26' rx='6' class='a-wide' style='--d:0.75s;--dur:0.9s;fill:var(--n-student);transform-origin:34.0px 175.0px'/>
<text x='470.0' y='182.0' class='lbl bg a-pop' style='--d:1.15s;fill:var(--n-student)'>29.3%</text>
<text x='34.0' y='224.0' class='lbl sm a-rise' style='--d:0.90s;fill:var(--n-ink)'>cell types left with under 100 cells per person</text>
<rect x='34.0' y='236.0' width='420.0' height='26.0' rx='6' class='box a-pop' style='--d:0.95s;fill:var(--n-grid);stroke:none'/>
<rect x='34.0' y='236.0' width='239.4' height='26' rx='6' class='a-wide' style='--d:1.05s;--dur:0.9s;fill:var(--n-loss);transform-origin:34.0px 249.0px'/>
<text x='470.0' y='256.0' class='lbl bg a-pop' style='--d:1.45s;fill:var(--n-loss)'>57.0%</text>
<rect x='556.0' y='72.0' width='148.0' height='206.0' rx='12' class='box a-pop' style='--d:1.55s;fill:none;stroke:var(--n-dim)'/>
<text x='630.0' y='116.0' class='lbl sm mid a-rise' style='--d:1.65s;fill:var(--n-dim)'>coarse and fine</text>
<text x='630.0' y='138.0' class='lbl sm mid a-rise' style='--d:1.70s;fill:var(--n-dim)'>each find things</text>
<text x='630.0' y='160.0' class='lbl sm mid a-rise' style='--d:1.75s;fill:var(--n-dim)'>the other misses,</text>
<text x='630.0' y='188.0' class='lbl sm mid a-rise' style='--d:1.82s;fill:var(--n-loss)'>so every choice</text>
<text x='630.0' y='210.0' class='lbl sm mid a-rise' style='--d:1.87s;fill:var(--n-loss)'>of level throws</text>
<text x='630.0' y='232.0' class='lbl sm mid a-rise' style='--d:1.92s;fill:var(--n-loss)'>something away</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 5.</span> The resolution trade-off, in one published study. Pooling all cells finds the most genes with a detectable effect. Splitting by type reveals a large minority of effects that pooling cannot see. And splitting is self-limiting: most of the resulting types are left with too few cells per person to support an estimate. Counts from Alegbe <i>et al.</i> 2026.</div>
</div>

So the two directions are both real. Coarse grouping finds more in total; fine grouping finds things the coarse grouping cannot see; and every level of sorting discards whatever the other level would have found. A recent evaluation of this trade-off put it plainly: progress requires both high resolution and large sample size, and in practice the two are inversely related, because the finer the grouping, the fewer measurements support each group.

This is usually described as a practical annoyance. It is better understood as a sign that sorting first is the wrong move. If no level of a sorting scheme is correct, the problem may be the scheme.

<div class='lab wide' id='rg-split-lab'>
<div class='lab-head'><span class='name'>Lab 2 &middot; what splitting buys, and what it cannot</span><span class='hint'>sort the same cells more finely and watch two things diverge</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label for='rg-donors'>people in the study <span class='val' id='rg-donors-v'></span></label>
<input type='range' id='rg-donors' min='20' max='1500' step='1' value='424'>
</div>
<div class='ctl'>
<label for='rg-cells'>cells measured per person <span class='val' id='rg-cells-v'></span></label>
<input type='range' id='rg-cells' min='100' max='20000' step='10' value='3500'>
</div>
<div class='ctl'>
<label for='rg-groups'>groups they are sorted into <span class='val' id='rg-groups-v'></span></label>
<input type='range' id='rg-groups' min='1' max='80' step='1' value='7'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>cells per person, largest group</span><span class='v' id='rg-stat-largest'></span></div>
<div class='stat' style='--stat-hue:var(--n-kept)'><span class='k'>groups above the floor</span><span class='v' id='rg-stat-usable'></span></div>
<div class='stat' style='--stat-hue:var(--n-data)'><span class='k'>independent genomes</span><span class='v' id='rg-stat-genomes'></span></div>
</div>
<div class='verdict' id='rg-split-verdict'></div>
<svg viewBox='0 0 700 250' role='img'></svg>
<p class='cap'>Division, and nothing else. Real taxonomies are lopsided, so the groups here follow a decaying share rather than an even split, which is the honest case. The hundred-cell line is the threshold Alegbe <i>et al.</i> report against. Watch the third number while you move the third slider: it never changes.</p>
</div>
</div>

## Inverting the order

The proposal is to reverse the two steps. Rather than sorting cells by appearance and then asking whether the genetics respects the sorting, let the genetic effects do the sorting, and use appearance afterwards to describe what the resulting groups turned out to be.

Concretely: fit one model across all cells at once, with no supplied labels entering it, that estimates for each cell a position in a low-dimensional space and for each variant-gene pair how strongly its effect responds to movement in that space. The product of the two gives the effect of every variant in every cell, which is the matrix of regulotypes. The next note works through the model itself; what matters here is the ordering.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 404' role='img' aria-label='Two three-step workflows, one above the other, with the first and last steps exchanged.'>
<text x='24.0' y='54.0' class='lbl a-pop' style='--d:0.05s;fill:var(--n-teacher)'>the usual order</text>
<rect x='24.0' y='70.0' width='196.0' height='88.0' rx='12' class='box a-pop' style='--d:0.20s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='122.0' y='106.0' class='lbl sm mid a-rise' style='--d:0.28s;fill:var(--n-ink)'>measure what</text>
<text x='122.0' y='128.0' class='lbl sm mid a-rise' style='--d:0.33s;fill:var(--n-ink)'>cells look like</text>
<path d='M224.0 114.0 L270.0 114.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.50s;--dur:0.70s;stroke:var(--n-teacher);stroke-width:2.2'/>
<polygon points='276.0,114.0 270.0,117.3 270.0,110.7' class='a-pop' style='--d:0.99s;fill:var(--n-teacher)'/>
<rect x='256.0' y='70.0' width='196.0' height='88.0' rx='12' class='box a-pop' style='--d:0.38s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='354.0' y='106.0' class='lbl sm mid a-rise' style='--d:0.46s;fill:var(--n-ink)'>sort them into</text>
<text x='354.0' y='128.0' class='lbl sm mid a-rise' style='--d:0.51s;fill:var(--n-ink)'>groups</text>
<path d='M456.0 114.0 L502.0 114.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.68s;--dur:0.70s;stroke:var(--n-teacher);stroke-width:2.2'/>
<polygon points='508.0,114.0 502.0,117.3 502.0,110.7' class='a-pop' style='--d:1.17s;fill:var(--n-teacher)'/>
<rect x='488.0' y='70.0' width='196.0' height='88.0' rx='12' class='box a-pop' style='--d:0.56s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='586.0' y='106.0' class='lbl sm mid a-rise' style='--d:0.64s;fill:var(--n-ink)'>test the genetics</text>
<text x='586.0' y='128.0' class='lbl sm mid a-rise' style='--d:0.69s;fill:var(--n-ink)'>inside each group</text>
<text x='24.0' y='216.0' class='lbl a-pop' style='--d:0.90s;fill:var(--n-student)'>the other order</text>
<rect x='24.0' y='232.0' width='196.0' height='88.0' rx='12' class='box a-pop' style='--d:1.05s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='122.0' y='268.0' class='lbl sm mid a-rise' style='--d:1.13s;fill:var(--n-ink)'>measure what the</text>
<text x='122.0' y='290.0' class='lbl sm mid a-rise' style='--d:1.18s;fill:var(--n-ink)'>genetics does</text>
<path d='M224.0 276.0 L270.0 276.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.35s;--dur:0.70s;stroke:var(--n-student);stroke-width:2.2'/>
<polygon points='276.0,276.0 270.0,279.3 270.0,272.7' class='a-pop' style='--d:1.84s;fill:var(--n-student)'/>
<rect x='256.0' y='232.0' width='196.0' height='88.0' rx='12' class='box a-pop' style='--d:1.23s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='354.0' y='268.0' class='lbl sm mid a-rise' style='--d:1.31s;fill:var(--n-ink)'>let that sort them</text>
<text x='354.0' y='290.0' class='lbl sm mid a-rise' style='--d:1.36s;fill:var(--n-ink)'>into groups</text>
<path d='M456.0 276.0 L502.0 276.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.53s;--dur:0.70s;stroke:var(--n-student);stroke-width:2.2'/>
<polygon points='508.0,276.0 502.0,279.3 502.0,272.7' class='a-pop' style='--d:2.02s;fill:var(--n-student)'/>
<rect x='488.0' y='232.0' width='196.0' height='88.0' rx='12' class='box a-pop' style='--d:1.41s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='586.0' y='268.0' class='lbl sm mid a-rise' style='--d:1.49s;fill:var(--n-ink)'>describe the groups</text>
<text x='586.0' y='290.0' class='lbl sm mid a-rise' style='--d:1.54s;fill:var(--n-ink)'>by how they look</text>
<text x='360.0' y='384.0' class='lbl mid a-pop' style='--d:1.95s;fill:var(--n-ink)'>nothing about the measurements changes; only which one sorts</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 6.</span> The two orders. Above, the usual one: appearance defines the groups, and genetics is tested inside them. Below, the proposal: genetics defines the groups, and appearance is used afterwards to say what they turned out to be. The measurements are identical in both rows. Only the question asked first has changed.</div>
</div>

One honesty note, because the claim is easy to overstate. Measurements are built by grouping small numbers of physically similar cells together, and cells that are similar in that sense are usually of the same type. Cell type therefore re-enters through the back door regardless of intention. The defensible claim is not that cell type is absent; it is that **no supplied annotation enters the model**. That distinction matters, because it converts a potential weakness into a test: if the fitted map recovers the known groupings without ever being shown them, the method is finding real structure. That is a result worth having, and it is the first thing this design should be asked to prove.


## Is this not already done?

Mostly, yes, and the honest version of this section is longer than the dishonest one.

That genetic effects vary along continuous cellular axes is established, not proposed. CellRegMap tests for it along axes you supply. PICALO invents the axis that makes the most effects look context-dependent, from bulk tissue. SURGE learns the axes and the per-pair responses jointly at cell resolution, and states in its own paper that it identifies contexts whose interaction with genotype explains the most variation in expression — which is the inversion described above, already published. SURGE is also the likelihood this project builds on, so there is no version of this where that claim is mine.

Two more concessions, both of which I only learned by checking. The per-cell effect estimate is not new: Nathan and colleagues computed an effect for every single cell in 2022 and plotted it, and CellRegMap returns the same object as a downstream step. And factorising a matrix of genetic effect sizes is not new either: sn-spMF did it in 2020, across forty-nine tissues, from the same laboratory that later produced SURGE.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 474' role='img' aria-label='A grid of methods placed by coordinate source and resolution, with one position highlighted.'>
<text x='262.0' y='44.0' class='lbl sm mid a-rise' style='--d:0.05s;fill:var(--n-dim)'>supplied by</text>
<text x='262.0' y='64.0' class='lbl sm mid a-rise' style='--d:0.05s;fill:var(--n-dim)'>the analyst</text>
<text x='434.0' y='44.0' class='lbl sm mid a-rise' style='--d:0.11s;fill:var(--n-dim)'>learned from</text>
<text x='434.0' y='64.0' class='lbl sm mid a-rise' style='--d:0.11s;fill:var(--n-dim)'>appearance</text>
<text x='606.0' y='44.0' class='lbl sm mid a-rise' style='--d:0.17s;fill:var(--n-dim)'>learned from</text>
<text x='606.0' y='64.0' class='lbl sm mid a-rise' style='--d:0.17s;fill:var(--n-dim)'>genetic effects</text>
<text x='160.0' y='134.0' class='lbl sm end a-rise' style='--d:0.20s;fill:var(--n-ink)'>tissues</text>
<path d='M176.0 92.0 L692.0 92.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.25s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<text x='160.0' y='208.0' class='lbl sm end a-rise' style='--d:0.26s;fill:var(--n-ink)'>whole samples</text>
<path d='M176.0 166.0 L692.0 166.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.30s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<text x='160.0' y='282.0' class='lbl sm end a-rise' style='--d:0.32s;fill:var(--n-ink)'>given cell types</text>
<path d='M176.0 240.0 L692.0 240.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.35s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<text x='160.0' y='356.0' class='lbl sm end a-rise' style='--d:0.38s;fill:var(--n-ink)'>single cells</text>
<path d='M176.0 314.0 L692.0 314.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.40s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<path d='M176.0 388.0 L692.0 388.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.50s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<path d='M176.0 92.0 L176.0 388.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.30s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<path d='M348.0 92.0 L348.0 388.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.35s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<path d='M520.0 92.0 L520.0 388.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.40s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<path d='M692.0 92.0 L692.0 388.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.45s;--dur:0.50s;stroke:var(--n-grid);stroke-width:1.2'/>
<circle cx='202.0' cy='114.0' r='4.0' class='a-pop' style='--d:0.85s;fill:var(--n-teacher)'/>
<text x='212.0' y='119.0' class='lbl sm a-rise' style='--d:0.89s;fill:var(--n-ink)'>GTEx interaction</text>
<circle cx='546.0' cy='114.0' r='4.0' class='a-pop' style='--d:0.97s;fill:var(--n-data)'/>
<text x='556.0' y='119.0' class='lbl sm a-rise' style='--d:1.01s;fill:var(--n-ink)'>sn-spMF 2020</text>
<circle cx='546.0' cy='188.0' r='4.0' class='a-pop' style='--d:1.07s;fill:var(--n-data)'/>
<text x='556.0' y='193.0' class='lbl sm a-rise' style='--d:1.11s;fill:var(--n-ink)'>PICALO 2024</text>
<circle cx='202.0' cy='262.0' r='4.0' class='a-pop' style='--d:1.05s;fill:var(--n-teacher)'/>
<text x='212.0' y='267.0' class='lbl sm a-rise' style='--d:1.09s;fill:var(--n-ink)'>FastGxC 2026</text>
<circle cx='546.0' cy='262.0' r='4.0' class='a-pop' style='--d:1.17s;fill:var(--n-data)'/>
<text x='556.0' y='267.0' class='lbl sm a-rise' style='--d:1.21s;fill:var(--n-ink)'>airpart 2022</text>
<circle cx='202.0' cy='336.0' r='4.0' class='a-pop' style='--d:1.15s;fill:var(--n-teacher)'/>
<text x='212.0' y='341.0' class='lbl sm a-rise' style='--d:1.19s;fill:var(--n-ink)'>CellRegMap 2022</text>
<circle cx='202.0' cy='360.0' r='4.0' class='a-pop' style='--d:1.23s;fill:var(--n-teacher)'/>
<text x='212.0' y='365.0' class='lbl sm a-rise' style='--d:1.27s;fill:var(--n-ink)'>Nathan 2022</text>
<circle cx='374.0' cy='336.0' r='4.0' class='a-pop' style='--d:1.21s;fill:var(--n-pruned)'/>
<text x='384.0' y='341.0' class='lbl sm a-rise' style='--d:1.25s;fill:var(--n-ink)'>LIVI 2026</text>
<circle cx='546.0' cy='336.0' r='4.0' class='a-pop' style='--d:1.27s;fill:var(--n-data)'/>
<text x='556.0' y='341.0' class='lbl sm a-rise' style='--d:1.31s;fill:var(--n-ink)'>SURGE 2024</text>
<rect x='532.0' y='347.0' width='148.0' height='30.0' rx='8' class='box a-pop' style='--d:1.35s;fill:var(--n-student);stroke:none'/>
<text x='606.0' y='368.0' class='lbl sm mid on a-pop' style='--d:1.41s'>this work</text>
<text x='360.0' y='428.0' class='lbl mid a-pop' style='--d:2.30s;fill:var(--n-dim)'>the idea has been walking down this column for six years</text>
<text x='360.0' y='452.0' class='lbl mid a-pop' style='--d:2.40s;fill:var(--n-student)'>the bottom rung is where a map, not a test, would sit</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 7.</span> Where the cellular coordinates come from, against the resolution at which an answer is delivered. Methods that learn their coordinates from genetic effects occupy the right-hand column and have been descending it since 2020. At single cells the column is occupied by a method that returns a hypothesis test. The position marked here is the one this project is aimed at, and it is empty because nobody has delivered a map at that resolution &mdash; not because the idea is unfamiliar.</div>
</div>
<div class='lab wide' id='rg-ladder-lab'>
<div class='lab-head'><span class='name'>Lab 3 &middot; the landscape, one method at a time</span><span class='hint'>where the coordinates come from, and what you get back</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label>pick a method</label>
<div class='seg seg-method'>
<button type='button' data-value='cellregmap' aria-pressed='false'>CellRegMap</button>
<button type='button' data-value='nathan' aria-pressed='false'>Nathan 2022</button>
<button type='button' data-value='fastgxc' aria-pressed='false'>FastGxC</button>
<button type='button' data-value='livi' aria-pressed='false'>LIVI</button>
<button type='button' data-value='snspmf' aria-pressed='false'>sn-spMF</button>
<button type='button' data-value='picalo' aria-pressed='false'>PICALO</button>
<button type='button' data-value='surge' aria-pressed='true'>SURGE</button>
<button type='button' data-value='ours' aria-pressed='false'>this work</button>
</div>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-teacher)'><span class='k'>cellular coordinates</span><span class='v' id='rg-stat-coord'></span></div>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>resolution delivered</span><span class='v' id='rg-stat-res'></span></div>
<div class='stat' style='--stat-hue:var(--n-data)'><span class='k'>what comes out</span><span class='v' id='rg-stat-out'></span></div>
</div>
<div class='verdict' id='rg-ladder-verdict'></div>
<svg viewBox='0 0 700 250' role='img'></svg>
<p class='cap'>Every row is a fact from the cited paper rather than a judgement. The column on the right is the one that matters: a method either hands back a hypothesis test or hands back an object you can put something new onto.</p>
</div>
</div>

The difference between a test and a map is the whole argument for building this. A test tells you that a variant behaves differently in different cells. It does not tell you which cells, it does not let you compare two cells, and it gives you nothing to put a new variant onto. A map does all three, and the third is the one that matters for disease: given a risk variant nobody has seen before, a map returns the cellular conditions in which that variant is predicted to act, which is a specification for an experiment.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 396' role='img' aria-label='Three labelled boxes with arrows pointing onto a fitted map of cells.'>
<rect x='236.0' y='84.0' width='250.0' height='208.0' rx='14' class='box a-pop' style='--d:0.10s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='361.0' y='66.0' class='lbl mid a-pop' style='--d:0.05s;fill:var(--n-student)'>the fitted map</text>
<circle cx='295.1' cy='208.2' r='5.5' class='a-pop' style='--d:0.30s;fill:var(--n-dim)'/>
<circle cx='319.8' cy='151.0' r='5.5' class='a-pop' style='--d:0.32s;fill:var(--n-dim)'/>
<circle cx='348.6' cy='228.3' r='5.5' class='a-pop' style='--d:0.34s;fill:var(--n-dim)'/>
<circle cx='377.5' cy='171.2' r='5.5' class='a-pop' style='--d:0.36s;fill:var(--n-dim)'/>
<circle cx='402.2' cy='214.9' r='5.5' class='a-pop' style='--d:0.38s;fill:var(--n-dim)'/>
<circle cx='311.6' cy='181.3' r='5.5' class='a-pop' style='--d:0.40s;fill:var(--n-dim)'/>
<circle cx='365.1' cy='137.6' r='5.5' class='a-pop' style='--d:0.42s;fill:var(--n-dim)'/>
<circle cx='394.0' cy='248.5' r='5.5' class='a-pop' style='--d:0.44s;fill:var(--n-dim)'/>
<circle cx='336.3' cy='191.4' r='5.5' class='a-pop' style='--d:0.46s;fill:var(--n-dim)'/>
<circle cx='418.7' cy='161.1' r='5.5' class='a-pop' style='--d:0.48s;fill:var(--n-dim)'/>
<circle cx='282.7' cy='161.1' r='5.5' class='a-pop' style='--d:0.50s;fill:var(--n-dim)'/>
<circle cx='435.2' cy='201.4' r='5.5' class='a-pop' style='--d:0.52s;fill:var(--n-dim)'/>
<circle cx='381.6' cy='204.8' r='5.5' class='a-pop' style='--d:0.54s;fill:var(--n-dim)'/>
<circle cx='328.0' cy='248.5' r='5.5' class='a-pop' style='--d:0.56s;fill:var(--n-dim)'/>
<circle cx='410.4' cy='130.9' r='5.5' class='a-pop' style='--d:0.58s;fill:var(--n-dim)'/>
<rect x='44.0' y='104.0' width='168.0' height='56.0' rx='10' class='box a-pop' style='--d:0.95s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='128.0' y='124.0' class='lbl sm mid a-rise' style='--d:1.01s;fill:var(--n-ink)'>a gene the map</text>
<text x='128.0' y='144.0' class='lbl sm mid a-rise' style='--d:1.05s;fill:var(--n-ink)'>was not built from</text>
<path d='M220.0 130.0 L221.8 128.2' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.13s;--dur:0.70s;stroke:var(--n-teacher);stroke-width:2.2'/>
<polygon points='226.0,124.0 224.1,130.6 219.4,125.9' class='a-pop' style='--d:1.62s;fill:var(--n-teacher)'/>
<rect x='44.0' y='206.0' width='168.0' height='56.0' rx='10' class='box a-pop' style='--d:1.25s;fill:var(--n-panel);stroke:var(--n-kept)'/>
<text x='128.0' y='226.0' class='lbl sm mid a-rise' style='--d:1.31s;fill:var(--n-ink)'>a person the map</text>
<text x='128.0' y='246.0' class='lbl sm mid a-rise' style='--d:1.35s;fill:var(--n-ink)'>has never seen</text>
<path d='M220.0 232.0 L225.2 195.9' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.43s;--dur:0.70s;stroke:var(--n-kept);stroke-width:2.2'/>
<polygon points='226.0,190.0 228.4,196.4 221.9,195.5' class='a-pop' style='--d:1.92s;fill:var(--n-kept)'/>
<rect x='44.0' y='308.0' width='168.0' height='56.0' rx='10' class='box a-pop' style='--d:1.55s;fill:var(--n-panel);stroke:var(--n-data)'/>
<text x='128.0' y='328.0' class='lbl sm mid a-rise' style='--d:1.61s;fill:var(--n-ink)'>an Alzheimer&#39;s</text>
<text x='128.0' y='348.0' class='lbl sm mid a-rise' style='--d:1.65s;fill:var(--n-ink)'>risk variant</text>
<path d='M220.0 334.0 L225.5 262.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.73s;--dur:0.70s;stroke:var(--n-data);stroke-width:2.2'/>
<polygon points='226.0,256.0 228.8,262.2 222.2,261.7' class='a-pop' style='--d:2.22s;fill:var(--n-data)'/>
<text x='620.0' y='150.0' class='lbl sm mid a-rise' style='--d:1.95s;fill:var(--n-dim)'>a test tells you</text>
<text x='620.0' y='172.0' class='lbl sm mid a-rise' style='--d:2.00s;fill:var(--n-dim)'>that a place exists</text>
<text x='620.0' y='212.0' class='lbl sm mid a-rise' style='--d:2.10s;fill:var(--n-student)'>a map tells you</text>
<text x='620.0' y='234.0' class='lbl sm mid a-rise' style='--d:2.15s;fill:var(--n-student)'>where it is, and</text>
<text x='620.0' y='256.0' class='lbl sm mid a-rise' style='--d:2.20s;fill:var(--n-student)'>lets you go back</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 8.</span> What a map allows that a test does not. Once the coordinates exist, three things can be placed onto them: a gene the map was not built from, a person the map has never seen, and a disease-associated variant, which returns the cellular conditions in which that variant is predicted to act. The third is the reason for the first two.</div>
</div>

## But surely the contribution is limited?

The sharpest objection runs like this. Many cell types are defined by genes that are simply switched off everywhere else. Where that is true, the existing labels are correct, there is nothing to rediscover, and so the contribution must be small.

The first part is right, and I would concede it before being asked. Where types differ by genes that are on in one and off in another, the labels are already good. What follows from that, though, is not that the exercise is pointless — it is that the map should **reproduce** those labels. Recovering a known grouping the model was never shown is evidence the method works.

The second part is also right and carries a real cost. A gene switched off in a cell tells you nothing about genetics in that cell, so the reference set has to be genes expressed broadly across whatever cells are being compared. Fitting across all cells at once, rather than within one compartment, shrinks that set — and since the reference set is the resource this method is most sensitive to, that is a genuine price to pay for the annotation-free design.


The conclusion is where the objection turns around. The genes that define labels and the genes that carry genetic information are close to disjoint sets. A marker gene is useful for identity **precisely because** it is off almost everywhere, and a cell in which a gene is off contributes nothing about that gene's genetics. A broadly expressed gene with a moderate inherited effect contributes information from every cell, and its effect can be turned up or down by the cellular environment with no visible change in what the cell looks like at all.

So the regime in which labels work well is the regime in which genetic information is scarcest, and the regime in which labels are useless is the one where the genetics is richest. The objection identifies exactly the part of the problem that is already solved, and it is the part that carries the least genetics.


## What would make this fail

Three things, stated now rather than discovered later.

**If the map is reproducible but turns out to be the appearance map.** Then the two geometries agree, supplied labels were sufficient all along, and the honest report is that they are. This is worth knowing and nobody has measured it for any tissue, so it is a publishable outcome rather than a wasted one — but it removes the reason to prefer this method.

**If predicting genes and people the model never saw is no better than ignoring cells entirely.** This is the one that stops the project. If a map built on training data cannot beat a single average effect when tested on held-out genes in held-out people, then there is no cellular variation worth modelling, and everything downstream is decoration.

**If independent disease variants do not converge.** The eventual payoff is asking whether risk variants at unrelated places in the genome act in the same cellular condition. If they scatter, the answer is that vascular genetics is locus-by-locus, which is a finding, but a much smaller one.

There is also a constraint that is not a failure mode so much as a precondition, and it is quantitative. The cells this project is ultimately aimed at — the ones lining the blood vessels of the brain — make up somewhere between four and eight parts in a thousand of what a standard brain experiment recovers, which works out at fifty to ninety per person. The largest study of its kind, at 424 people, tested them and reported that it could not interpret the result because they were undersampled. That is not a modelling problem and no method fixes it. Enrichment before sequencing does, and enrichment has so far been run on thirty people, in a cohort where more than a thousand already have their genomes sequenced. The missing step is a single experiment, and note four returns to it.


<div class='figure'>
<img src='/images/regulotype-figure1.png' alt='A five-panel figure: two cells with identical contents and opposite genetic responses; a cell as a column of effects; the same cells arranged by appearance and by genetic response; the resolution trade-off; and the landscape of methods with one empty position.'>
<div class='caption'>
<span class='caption-label'>Figure 9.</span> The five panels above, assembled as they would appear in a paper. This is a sketch of a figure, not a result: no panel contains data from any analysis, and the two panels showing arrangements of cells are drawn rather than computed. Panel <b>c</b> reports published counts from Alegbe <i>et al.</i> 2026, and panel <b>e</b> places published methods by what their own papers say they do.
</div>
</div>

## Sources

The claims above are drawn from the following. Where a number appears in the text, it comes from the paper's own reporting rather than from any analysis of mine; this note contains no results.

- Alegbe *et al.* "Cell-type-resolved genetic variation shapes inflammatory bowel disease risk." *Nature* **656**, 129–139 (2026). [doi:10.1038/s41586-026-10627-z](https://doi.org/10.1038/s41586-026-10627-z) — the resolution comparison, and the count of cell types left under a hundred cells per person.
- Reales, Pullin, Manipur, Vigorito & Wallace. "Design and interpretation of eQTL-GWAS colocalisation studies." *PLoS Genetics* **22**, e1012141 (2026). [doi:10.1371/journal.pgen.1012141](https://doi.org/10.1371/journal.pgen.1012141) — granularity and sample size as an inverse relationship.
- Kang, Raveane, Nathan, Soranzo & Raychaudhuri. "Methods and Insights from Single-Cell Expression Quantitative Trait Loci." *Annual Review of Genomics and Human Genetics* **24**, 277–303 (2023). [doi:10.1146/annurev-genom-101422-100437](https://doi.org/10.1146/annurev-genom-101422-100437) — the canonical statement that the right resolution is not knowable in advance.
- Strober *et al.* "SURGE: uncovering context-specific genetic-regulation of gene expression from single-cell RNA sequencing using latent-factor models." *Genome Biology* **25**, 28 (2024). [doi:10.1186/s13059-023-03152-z](https://doi.org/10.1186/s13059-023-03152-z) — the likelihood this project builds on.
- Cuomo, Heinen, Vagiaki, Horta, Marioni & Stegle. "CellRegMap." *Molecular Systems Biology* **18**, e10663 (2022). [doi:10.15252/msb.202110663](https://doi.org/10.15252/msb.202110663) — heterogeneity along a supplied representation.
- Vochteloo *et al.* "PICALO." *Genome Biology* **25**, 29 (2024). [doi:10.1186/s13059-023-03151-0](https://doi.org/10.1186/s13059-023-03151-0) — latent interaction components, from bulk tissue.
- Nathan *et al.* "Single-cell eQTL models reveal dynamic T cell state dependence of disease loci." *Nature* **606**, 120–128 (2022). [doi:10.1038/s41586-022-04713-1](https://doi.org/10.1038/s41586-022-04713-1) — per-cell effects computed and plotted; and independent variants at one gene with opposing state relationships.
- He *et al.* "sn-spMF: matrix factorization informs tissue-specific genetic regulation of gene expression." *Genome Biology* **21**, 235 (2020). [doi:10.1186/s13059-020-02129-6](https://doi.org/10.1186/s13059-020-02129-6) — factorising an effect-size matrix, across tissues.
- Krockenberger *et al.* "FastGxC." *Cell Genomics* **6**, 101250 (2026). [doi:10.1016/j.xgen.2026.101250](https://doi.org/10.1016/j.xgen.2026.101250) — supplied, discrete contexts.
- Vagiaki, Heinen, Saraswat, Clarke & Stegle. "Mapping *trans*-eQTLs at single-cell resolution using Latent Interaction Variational Inference." bioRxiv (2026). [doi:10.64898/2026.02.04.703363](https://doi.org/10.64898/2026.02.04.703363) — a preprint, and the closest current work on learning state without using genotypes.
- Gilad & Battle. "Beyond the baseline: mapping the context-specific regulatory landscape of disease." *Trends in Genetics* **42**, 324–338 (2026). [doi:10.1016/j.tig.2026.01.010](https://doi.org/10.1016/j.tig.2026.01.010) — a review of the field by two of the people closest to it.
- Fujita *et al.* "Cell subtype-specific effects of genetic variation in the Alzheimer's disease brain." *Nature Genetics* **56**, 605–614 (2024). [doi:10.1038/s41588-024-01685-y](https://doi.org/10.1038/s41588-024-01685-y) — 424 people, and the statement that endothelial cells were undersampled.
- Schwartzentruber *et al.* "Genome-wide meta-analysis, fine-mapping and integrative prioritization implicate new Alzheimer's disease risk genes." *Nature Genetics* **53**, 392–402 (2021). [doi:10.1038/s41588-020-00776-w](https://doi.org/10.1038/s41588-020-00776-w) — that a colocalisation may be missing simply because the relevant context was never assayed.
- Bellenguez *et al.* "New insights into the genetic etiology of Alzheimer's disease and related dementias." *Nature Genetics* **54**, 412–436 (2022). [doi:10.1038/s41588-022-01024-z](https://doi.org/10.1038/s41588-022-01024-z) — seventy-five risk loci.
- Sun *et al.* "Single-nucleus multiregion transcriptomic analysis of brain vasculature in Alzheimer's disease." *Nature Neuroscience* **26**, 970–982 (2023). [doi:10.1038/s41593-023-01334-3](https://doi.org/10.1038/s41593-023-01334-3) — vascular nuclei per person, without enrichment.
- Reid *et al.* "Human brain vascular multi-omics elucidates disease-risk associations." *Neuron* **113**, 3143–3161.e5 (2025). [doi:10.1016/j.neuron.2025.07.001](https://doi.org/10.1016/j.neuron.2025.07.001) — vascular enrichment, on thirty people.
- Rockman. "Reverse engineering the genotype–phenotype map with natural genetic variation." *Nature* **456**, 738–744 (2008). [doi:10.1038/nature07633](https://doi.org/10.1038/nature07633) — where the idea that each inherited difference is a randomised perturbation is stated, and stated better than I would state it.

The word *regulotype* has no use in the published literature. It does appear once earlier, in a lapsed patent application filed in 2002 by Regulome Corporation, where it names an individual's set of accessible regulatory sites — a catalogue of which switches are open, rather than a measure of what each one does. The sense used here is different, and the earlier one is worth acknowledging.
