---
title: 'The regulotype model, and the plan'
subtitle: One equation in four pieces, only the last of which is new; what may and may not be read off the answer; and the eight steps between here and a result.
date: 2026-09-05
tags: regulotype
keywords: regulotype, cis-regulatory effects, low-rank model, identifiability, rotation invariance, empirical Bayes, single-cell genetics, project plan
---

<p class='lede'>The previous note argued for letting genetic effects, rather than appearance, decide how cells are grouped. This one says how. The model is one equation with four pieces, three of which everybody already fits; the fourth is a <b>multiplication</b>, and every difficulty in the project follows from having to estimate both of its factors at once.</p>

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 342' role='img' aria-label='The six sections of this note.'>
<text x='14.0' y='159.0' class='lbl bg a-pop' style='--d:0.00s;fill:var(--n-student)'>Note</text>
<text x='14.0' y='181.0' class='lbl bg a-pop' style='--d:0.08s;fill:var(--n-student)'>two</text>
<path d='M138 52.0 C134.7 52.0, 134.7 165.0, 116 165.0 C134.7 165.0, 134.7 272.0, 138 272.0' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.22s;--dur:0.90s;stroke:var(--n-student);stroke-width:2.4'/>
<a href='#the-measurement' class='rm-row'>
<rect x='128' y='30.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='47.0' r='4.0' class='a-beat' style='--d:0.45s;--dur:2.00s;fill:var(--n-data)'/>
<text x='164.0' y='52.0' class='lbl a-rise' style='--d:0.45s;fill:var(--n-data)'>The measurement</text>
<text x='704.0' y='52.0' class='lbl sm end a-rise' style='--d:0.55s;fill:var(--n-dim)'>what a single number stands for</text>
</a>
<a href='#the-four-terms' class='rm-row'>
<rect x='128' y='74.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='91.0' r='4.0' class='a-beat' style='--d:0.52s;--dur:2.00s;fill:var(--n-student)'/>
<text x='164.0' y='96.0' class='lbl a-rise' style='--d:0.52s;fill:var(--n-student)'>The four terms</text>
<text x='704.0' y='96.0' class='lbl sm end a-rise' style='--d:0.62s;fill:var(--n-dim)'>the equation, one piece at a time</text>
</a>
<a href='#the-matrix-and-what-may-be-read-from-it' class='rm-row'>
<rect x='128' y='118.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='135.0' r='4.0' class='a-beat' style='--d:0.59s;--dur:2.00s;fill:var(--n-teacher)'/>
<text x='164.0' y='140.0' class='lbl a-rise' style='--d:0.59s;fill:var(--n-teacher)'>The matrix</text>
<text x='704.0' y='140.0' class='lbl sm end a-rise' style='--d:0.69s;fill:var(--n-dim)'>and what may be read from it</text>
</a>
<a href='#where-measured-features-enter' class='rm-row'>
<rect x='128' y='162.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='179.0' r='4.0' class='a-beat' style='--d:0.66s;--dur:2.00s;fill:var(--n-kept)'/>
<text x='164.0' y='184.0' class='lbl a-rise' style='--d:0.66s;fill:var(--n-kept)'>Where features enter</text>
<text x='704.0' y='184.0' class='lbl sm end a-rise' style='--d:0.76s;fill:var(--n-dim)'>the prior, not the likelihood</text>
</a>
<a href='#how-it-is-fitted' class='rm-row'>
<rect x='128' y='206.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='223.0' r='4.0' class='a-beat' style='--d:0.73s;--dur:2.00s;fill:var(--n-pruned)'/>
<text x='164.0' y='228.0' class='lbl a-rise' style='--d:0.73s;fill:var(--n-pruned)'>How it is fitted</text>
<text x='704.0' y='228.0' class='lbl sm end a-rise' style='--d:0.83s;fill:var(--n-dim)'>freeze one side, solve the other</text>
</a>
<a href='#the-plan' class='rm-row'>
<rect x='128' y='250.0' width='576' height='34' rx='8' fill='transparent'/>
<circle cx='148.0' cy='267.0' r='4.0' class='a-beat' style='--d:0.80s;--dur:2.00s;fill:var(--n-loss)'/>
<text x='164.0' y='272.0' class='lbl a-rise' style='--d:0.80s;fill:var(--n-loss)'>The plan</text>
<text x='704.0' y='272.0' class='lbl sm end a-rise' style='--d:0.90s;fill:var(--n-dim)'>eight steps, and what kills each</text>
</a>
</svg>
</div>

## The measurement

Start from one number: how much of one gene one cell is making. Everything below is an account of where that number comes from.

Three things are known before any modelling. Which version of the nearby variant that person inherited, written as 0, 1 or 2 copies. Which person the cell came from. And whatever else was measured about the cell that has nothing to do with genetics.


## The four terms

Write the measurement as a sum of four pieces.

**What the cell would make anyway.** Its baseline, before any inherited difference is considered: what kind of cell it is, how much material it contains, how the sample was handled. This is the largest of the four and the least interesting.

**What is particular to this person.** Every cell from one person shares that person's genome, their age, their history. That common shift has to be accounted for, or cells from the same person will be mistaken for independent evidence.

**The average effect of the variant.** The number the catalogue records: how much the gene moves per inherited copy, taken across all cells at once. It is the same number in every cell, which is exactly the assumption this project drops.

**And how that effect shifts with the cell.** Each cell has a position, and each variant-and-gene pair has a response — how strongly, and in which direction, its effect changes as you move across positions. The two are multiplied together. This is the only new term.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 344' role='img' aria-label='Four boxes summed, with the fourth highlighted as the new term.'>
<text x='24.0' y='40.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>how much of one gene one cell makes, in four pieces</text>
<rect x='24.0' y='96.0' width='156.0' height='96.0' rx='12' class='box a-pop' style='--d:0.20s;fill:var(--n-panel);stroke:var(--n-data)'/>
<text x='102.0' y='134.0' class='lbl sm mid a-rise' style='--d:0.26s;fill:var(--n-ink)'>what the cell would</text>
<text x='102.0' y='156.0' class='lbl sm mid a-rise' style='--d:0.30s;fill:var(--n-ink)'>make anyway</text>
<text x='186.0' y='150.0' class='lbl bg mid a-pop' style='--d:0.36s;fill:var(--n-dim)'>+</text>
<text x='102.0' y='218.0' class='lbl sm mid a-rise' style='--d:0.40s;fill:var(--n-dim)'>the baseline:</text>
<text x='102.0' y='238.0' class='lbl sm mid a-rise' style='--d:0.43s;fill:var(--n-dim)'>everything not about</text>
<text x='102.0' y='258.0' class='lbl sm mid a-rise' style='--d:0.46s;fill:var(--n-dim)'>this variant</text>
<rect x='192.0' y='96.0' width='156.0' height='96.0' rx='12' class='box a-pop' style='--d:0.48s;fill:var(--n-panel);stroke:var(--n-pruned)'/>
<text x='270.0' y='134.0' class='lbl sm mid a-rise' style='--d:0.54s;fill:var(--n-ink)'>what is particular</text>
<text x='270.0' y='156.0' class='lbl sm mid a-rise' style='--d:0.58s;fill:var(--n-ink)'>to this person</text>
<text x='354.0' y='150.0' class='lbl bg mid a-pop' style='--d:0.64s;fill:var(--n-dim)'>+</text>
<text x='270.0' y='218.0' class='lbl sm mid a-rise' style='--d:0.68s;fill:var(--n-dim)'>one shift per person</text>
<text x='270.0' y='238.0' class='lbl sm mid a-rise' style='--d:0.71s;fill:var(--n-dim)'>per gene, because</text>
<text x='270.0' y='258.0' class='lbl sm mid a-rise' style='--d:0.74s;fill:var(--n-dim)'>cells from one</text>
<text x='270.0' y='278.0' class='lbl sm mid a-rise' style='--d:0.77s;fill:var(--n-dim)'>person are alike</text>
<rect x='360.0' y='96.0' width='156.0' height='96.0' rx='12' class='box a-pop' style='--d:0.76s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='438.0' y='134.0' class='lbl sm mid a-rise' style='--d:0.82s;fill:var(--n-ink)'>the average effect</text>
<text x='438.0' y='156.0' class='lbl sm mid a-rise' style='--d:0.86s;fill:var(--n-ink)'>of the letter</text>
<text x='522.0' y='150.0' class='lbl bg mid a-pop' style='--d:0.92s;fill:var(--n-dim)'>+</text>
<text x='438.0' y='218.0' class='lbl sm mid a-rise' style='--d:0.96s;fill:var(--n-dim)'>the same number in</text>
<text x='438.0' y='238.0' class='lbl sm mid a-rise' style='--d:0.99s;fill:var(--n-dim)'>every cell &#8212;</text>
<text x='438.0' y='258.0' class='lbl sm mid a-rise' style='--d:1.02s;fill:var(--n-dim)'>the old catalogue</text>
<rect x='528.0' y='96.0' width='156.0' height='96.0' rx='12' class='box a-pop' style='--d:1.04s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='606.0' y='134.0' class='lbl sm mid a-rise' style='--d:1.10s;fill:var(--n-ink)'>and how that effect</text>
<text x='606.0' y='156.0' class='lbl sm mid a-rise' style='--d:1.14s;fill:var(--n-ink)'>shifts with the cell</text>
<text x='606.0' y='218.0' class='lbl sm mid a-rise' style='--d:1.24s;fill:var(--n-dim)'>the new term:</text>
<text x='606.0' y='238.0' class='lbl sm mid a-rise' style='--d:1.27s;fill:var(--n-dim)'>position multiplied</text>
<text x='606.0' y='258.0' class='lbl sm mid a-rise' style='--d:1.30s;fill:var(--n-dim)'>by response</text>
<rect x='528.0' y='88.0' width='164.0' height='112.0' rx='14' class='box a-pop' style='--d:1.45s;fill:none;stroke:var(--n-student)'/>
<text x='360.0' y='322.0' class='lbl sm mid a-pop' style='--d:1.70s;fill:var(--n-ink)'>only the fourth term is new; the first three are the model everyone already fits</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> How much of one gene one cell makes, in four pieces. The first three are the model that has been fitted for twenty years: a baseline, a shift for the person, and one average effect for the variant. Only the fourth is new, and it is a product &mdash; where the cell sits, multiplied by how strongly this pair responds to sitting there.</div>
</div>

Written out, the cell-resolved effect of a variant on a gene is the average effect plus the position multiplied by the response. The first three terms are the model that has been fitted for twenty years. The fourth is the whole proposal.

Two things follow immediately. Because the last term is a product, neither factor can be measured without the other: a cell's position is only meaningful given the responses, and a response is only estimable given the positions. And because it is a product, an effect can change sign across cells — the same allele raising a gene in one and lowering it in another — which is the case a single average number cannot represent at all.

<div class='lab wide' id='rg2-build-lab'>
<div class='lab-head'><span class='name'>Lab 1 &middot; build one row</span><span class='hint'>set the average effect and the response, and read off the rest</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label for='rg2-beta'>average effect of the variant <span class='val' id='rg2-beta-v'></span></label>
<input type='range' id='rg2-beta' min='-1' max='1' step='0.01' value='0.35'>
</div>
<div class='ctl'>
<label for='rg2-lam'>how strongly the pair responds to position <span class='val' id='rg2-lam-v'></span></label>
<input type='range' id='rg2-lam' min='-1' max='1' step='0.01' value='0.45'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-loss)'><span class='k'>the one number reported</span><span class='v' id='rg2-stat-avg'></span></div>
<div class='stat' style='--stat-hue:var(--n-clay)'><span class='k'>effect in the lowest cell</span><span class='v' id='rg2-stat-lo'></span></div>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>effect in the highest cell</span><span class='v' id='rg2-stat-hi'></span></div>
</div>
<div class='verdict' id='rg2-build-verdict'></div>
<svg viewBox='0 0 700 250' role='img'></svg>
<p class='cap'>One row of the matrix, drawn across forty cells whose position runs from one end of the map to the other. The dashed line is the average effect &mdash; the number a study would publish. Push the response past the average and the bars cross zero: the same allele now raises the gene in some cells and lowers it in others. Arithmetic only; nothing here is fitted.</p>
</div>
</div>

## The matrix, and what may be read from it

Collect the cell-resolved effects into a grid: one row per variant-and-gene pair, one column per cell. That grid is the object the whole project is about. A column is one cell's regulotype. A row is one pair's profile across cells.

The grid is built from three pieces. A column of average effects, repeated across every cell. A table of responses, one row per pair. And a table of positions, one column per cell. Multiply the second by the third, add the first, and the grid appears.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 293' role='img' aria-label='Three small matrices combining into the full effect matrix.'>
<text x='24.0' y='44.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>the matrix of regulotypes, assembled from three pieces</text>
<g class='a-fade' style='--d:0.30s'><rect x='34.0' y='92.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.19'/><rect x='34.0' y='107.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.51'/><rect x='34.0' y='122.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.42'/><rect x='34.0' y='137.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.33'/><rect x='34.0' y='152.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.24'/><rect x='34.0' y='167.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.55'/><rect x='34.0' y='182.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.46'/><rect x='34.0' y='197.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.37'/><rect x='34.0' y='212.0' width='14.4' height='14.4' fill='var(--n-teal)' opacity='0.28'/></g>
<text x='41.5' y='80.0' class='lbl mid a-pop' style='--d:0.36s;fill:var(--n-teacher)'>&#946;</text>
<text x='41.5' y='265.0' class='lbl sm mid a-rise' style='--d:0.43s;fill:var(--n-dim)'>effect</text>
<text x='41.5' y='247.0' class='lbl sm mid a-rise' style='--d:0.40s;fill:var(--n-dim)'>average</text>
<text x='88.0' y='165.5' class='lbl bg mid a-pop' style='--d:0.55s;fill:var(--n-dim)'>+</text>
<g class='a-fade' style='--d:0.65s'><rect x='126.0' y='92.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.19'/><rect x='141.0' y='92.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.42'/><rect x='126.0' y='107.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.51'/><rect x='141.0' y='107.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.33'/><rect x='126.0' y='122.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.42'/><rect x='141.0' y='122.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.24'/><rect x='126.0' y='137.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.33'/><rect x='141.0' y='137.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.55'/><rect x='126.0' y='152.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.24'/><rect x='141.0' y='152.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.46'/><rect x='126.0' y='167.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.55'/><rect x='141.0' y='167.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.37'/><rect x='126.0' y='182.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.46'/><rect x='141.0' y='182.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.28'/><rect x='126.0' y='197.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.37'/><rect x='141.0' y='197.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.19'/><rect x='126.0' y='212.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.28'/><rect x='141.0' y='212.0' width='14.4' height='14.4' fill='var(--n-violet)' opacity='0.51'/></g>
<text x='141.0' y='80.0' class='lbl mid a-pop' style='--d:0.70s;fill:var(--n-student)'>&#923;</text>
<text x='141.0' y='247.0' class='lbl sm mid a-rise' style='--d:0.74s;fill:var(--n-dim)'>response</text>
<text x='176.0' y='165.5' class='lbl bg mid a-pop' style='--d:0.85s;fill:var(--n-dim)'>&#215;</text>
<g class='a-fade' style='--d:0.95s'><rect x='196.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.19'/><rect x='211.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.42'/><rect x='226.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.24'/><rect x='241.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.46'/><rect x='256.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.28'/><rect x='271.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.51'/><rect x='286.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.33'/><rect x='301.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.55'/><rect x='316.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.37'/><rect x='331.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.19'/><rect x='346.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.42'/><rect x='361.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.24'/><rect x='376.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.46'/><rect x='391.0' y='92.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.28'/><rect x='196.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.51'/><rect x='211.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.33'/><rect x='226.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.55'/><rect x='241.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.37'/><rect x='256.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.19'/><rect x='271.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.42'/><rect x='286.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.24'/><rect x='301.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.46'/><rect x='316.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.28'/><rect x='331.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.51'/><rect x='346.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.33'/><rect x='361.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.55'/><rect x='376.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.37'/><rect x='391.0' y='107.0' width='14.4' height='14.4' fill='var(--n-clay)' opacity='0.19'/></g>
<text x='301.0' y='80.0' class='lbl mid a-pop' style='--d:1.00s;fill:var(--n-pruned)'>U&#8242;</text>
<text x='301.0' y='142.0' class='lbl sm mid a-rise' style='--d:1.04s;fill:var(--n-dim)'>where each cell sits</text>
<text x='426.0' y='165.5' class='lbl bg mid a-pop' style='--d:1.15s;fill:var(--n-dim)'>=</text>
<g class='a-fade' style='--d:1.30s'><rect x='446.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='461.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='476.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='491.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='506.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='521.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.44)'/><rect x='536.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.58)'/><rect x='551.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.52)'/><rect x='566.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='581.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='596.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='611.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='626.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='641.0' y='92.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.44)'/><rect x='446.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='461.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='476.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='491.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='506.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.85)'/><rect x='521.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='536.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='551.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='566.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='581.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='596.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='611.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='626.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.85)'/><rect x='641.0' y='107.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='446.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='461.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='476.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='491.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='506.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.78)'/><rect x='521.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='536.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='551.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.43)'/><rect x='566.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='581.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='596.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='611.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='626.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.78)'/><rect x='641.0' y='122.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='446.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.80)'/><rect x='461.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.37)'/><rect x='476.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.22)'/><rect x='491.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.53)'/><rect x='506.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='521.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.72)'/><rect x='536.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.34)'/><rect x='551.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.25)'/><rect x='566.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.80)'/><rect x='581.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.37)'/><rect x='596.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.22)'/><rect x='611.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.53)'/><rect x='626.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='641.0' y='137.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.72)'/><rect x='446.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='461.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='476.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.29)'/><rect x='491.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='506.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.84)'/><rect x='521.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='536.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='551.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='566.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='581.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='596.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.29)'/><rect x='611.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='626.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.84)'/><rect x='641.0' y='152.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='446.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.31)'/><rect x='461.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='476.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.36)'/><rect x='491.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='506.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.60)'/><rect x='521.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.66)'/><rect x='536.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='551.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.65)'/><rect x='566.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.31)'/><rect x='581.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='596.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.36)'/><rect x='611.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='626.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.60)'/><rect x='641.0' y='167.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.66)'/><rect x='446.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.70)'/><rect x='461.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.30)'/><rect x='476.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.17)'/><rect x='491.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.61)'/><rect x='506.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='521.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.75)'/><rect x='536.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.25)'/><rect x='551.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.16)'/><rect x='566.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.70)'/><rect x='581.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.30)'/><rect x='596.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.17)'/><rect x='611.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.61)'/><rect x='626.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='641.0' y='182.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.75)'/><rect x='446.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='461.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='476.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='491.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='506.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='521.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.44)'/><rect x='536.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.58)'/><rect x='551.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.52)'/><rect x='566.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='581.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='596.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='611.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='626.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='641.0' y='197.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.44)'/><rect x='446.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='461.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='476.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='491.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='506.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.85)'/><rect x='521.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='536.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='551.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='566.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='581.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='596.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='611.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='626.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-violet-rgb), 0.85)'/><rect x='641.0' y='212.0' width='14.4' height='14.4' fill='rgba(var(--n-clay-rgb), 0.64)'/></g>
<text x='551.0' y='80.0' class='lbl bg mid a-pop' style='--d:1.36s;fill:var(--n-student)'>R</text>
<text x='551.0' y='247.0' class='lbl sm mid a-rise' style='--d:1.42s;fill:var(--n-dim)'>one column per cell</text>
<text x='551.0' y='265.0' class='lbl sm mid a-rise' style='--d:1.45s;fill:var(--n-dim)'>one row per pair</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> The matrix assembled. A column of average effects, the same in every cell; a table of responses, one row per pair; a table of positions, one column per cell. Multiply the last two, add the first, and every cell-resolved effect appears at once. Simulated from the model.</div>
</div>

Now the caveat that governs every interpretation. **The positions and the responses are not unique.** Rotate the positions, rotate the responses to match, and every number in the grid is unchanged. There is no fact of the matter about which direction is the first axis, so no axis can be given a name, and no factor can be given a biological interpretation.

What survives rotation is the grid itself, the distances between its columns, and predictions in data the model never saw. Those three are what may be reported. Everything in this project that looks like an interpretation is an interpretation of one of them.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 408' role='img' aria-label='Two rotated coordinate frames producing the same effect matrix twice.'>
<text x='360.0' y='40.0' class='lbl mid a-pop' style='--d:0.05s;fill:var(--n-ink)'>two different answers, one identical matrix</text>
<text x='24.0' y='120.0' class='lbl sm a-rise' style='--d:0.12s;fill:var(--n-dim)'>one solution</text>
<rect x='180.0' y='72.0' width='112.0' height='112.0' rx='12' class='box a-pop' style='--d:0.18s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<path d='M236.0 128.0 L268.9 116.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.35s;--dur:0.70s;stroke:var(--n-student);stroke-width:2.4'/>
<polygon points='275.5,113.6 270.2,119.6 267.6,112.4' class='a-pop' style='--d:0.84s;fill:var(--n-student)'/>
<path d='M236.0 128.0 L224.0 95.1' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.45s;--dur:0.70s;stroke:var(--n-kept);stroke-width:2.4'/>
<polygon points='221.6,88.5 227.6,93.8 220.4,96.4' class='a-pop' style='--d:0.94s;fill:var(--n-kept)'/>
<text x='236.0' y='200.0' class='lbl sm mid a-rise' style='--d:0.60s;fill:var(--n-dim)'>the coordinates</text>
<text x='360.0' y='134.0' class='lbl bg mid a-pop' style='--d:0.70s;fill:var(--n-dim)'>&#8594;</text>
<g class='a-fade' style='--d:0.80s'><rect x='420.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='434.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='448.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='462.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='476.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='490.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.44)'/><rect x='504.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.58)'/><rect x='518.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.52)'/><rect x='532.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='546.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='560.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='574.0' y='84.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='420.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='434.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='448.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='462.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='476.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.85)'/><rect x='490.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='504.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='518.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='532.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='546.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='560.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='574.0' y='98.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='420.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='434.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='448.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='462.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='476.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.78)'/><rect x='490.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='504.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='518.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.43)'/><rect x='532.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='546.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='560.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='574.0' y='112.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='420.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.80)'/><rect x='434.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.37)'/><rect x='448.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.22)'/><rect x='462.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.53)'/><rect x='476.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='490.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.72)'/><rect x='504.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.34)'/><rect x='518.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.25)'/><rect x='532.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.80)'/><rect x='546.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.37)'/><rect x='560.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.22)'/><rect x='574.0' y='126.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.53)'/><rect x='420.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='434.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='448.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.29)'/><rect x='462.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='476.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.84)'/><rect x='490.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='504.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='518.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='532.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='546.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='560.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.29)'/><rect x='574.0' y='140.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='420.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.31)'/><rect x='434.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='448.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.36)'/><rect x='462.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='476.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.60)'/><rect x='490.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.66)'/><rect x='504.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='518.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.65)'/><rect x='532.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.31)'/><rect x='546.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='560.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.36)'/><rect x='574.0' y='154.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='420.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.70)'/><rect x='434.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.30)'/><rect x='448.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.17)'/><rect x='462.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.61)'/><rect x='476.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='490.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.75)'/><rect x='504.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.25)'/><rect x='518.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.16)'/><rect x='532.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.70)'/><rect x='546.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.30)'/><rect x='560.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.17)'/><rect x='574.0' y='168.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.61)'/></g>
<text x='504.0' y='200.0' class='lbl mid a-pop' style='--d:0.90s;fill:var(--n-student)'>R</text>
<text x='24.0' y='270.0' class='lbl sm a-rise' style='--d:0.82s;fill:var(--n-dim)'>another solution</text>
<rect x='180.0' y='222.0' width='112.0' height='112.0' rx='12' class='box a-pop' style='--d:0.88s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<path d='M236.0 278.0 L253.5 247.7' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.05s;--dur:0.70s;stroke:var(--n-student);stroke-width:2.4'/>
<polygon points='257.0,241.6 256.8,249.6 250.2,245.8' class='a-pop' style='--d:1.54s;fill:var(--n-student)'/>
<path d='M236.0 278.0 L205.7 260.5' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.15s;--dur:0.70s;stroke:var(--n-kept);stroke-width:2.4'/>
<polygon points='199.6,257.0 207.6,257.2 203.8,263.8' class='a-pop' style='--d:1.64s;fill:var(--n-kept)'/>
<text x='236.0' y='350.0' class='lbl sm mid a-rise' style='--d:1.30s;fill:var(--n-dim)'>the coordinates</text>
<text x='360.0' y='284.0' class='lbl bg mid a-pop' style='--d:1.40s;fill:var(--n-dim)'>&#8594;</text>
<g class='a-fade' style='--d:1.50s'><rect x='420.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='434.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='448.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='462.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='476.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='490.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.44)'/><rect x='504.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.58)'/><rect x='518.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.52)'/><rect x='532.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='546.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.55)'/><rect x='560.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.35)'/><rect x='574.0' y='234.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.12)'/><rect x='420.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='434.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='448.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='462.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='476.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.85)'/><rect x='490.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='504.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='518.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='532.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='546.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='560.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.28)'/><rect x='574.0' y='248.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='420.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='434.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='448.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='462.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='476.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.78)'/><rect x='490.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='504.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='518.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.43)'/><rect x='532.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='546.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.50)'/><rect x='560.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='574.0' y='262.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.30)'/><rect x='420.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.80)'/><rect x='434.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.37)'/><rect x='448.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.22)'/><rect x='462.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.53)'/><rect x='476.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='490.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.72)'/><rect x='504.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.34)'/><rect x='518.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.25)'/><rect x='532.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.80)'/><rect x='546.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.37)'/><rect x='560.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.22)'/><rect x='574.0' y='276.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.53)'/><rect x='420.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='434.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='448.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.29)'/><rect x='462.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='476.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.84)'/><rect x='490.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.64)'/><rect x='504.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='518.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.39)'/><rect x='532.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='546.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.48)'/><rect x='560.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.29)'/><rect x='574.0' y='290.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.38)'/><rect x='420.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.31)'/><rect x='434.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='448.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.36)'/><rect x='462.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='476.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.60)'/><rect x='490.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.66)'/><rect x='504.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.58)'/><rect x='518.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.65)'/><rect x='532.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.31)'/><rect x='546.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.47)'/><rect x='560.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.36)'/><rect x='574.0' y='304.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.90)'/><rect x='420.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.70)'/><rect x='434.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.30)'/><rect x='448.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.17)'/><rect x='462.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.61)'/><rect x='476.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.90)'/><rect x='490.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.75)'/><rect x='504.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.25)'/><rect x='518.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-clay-rgb), 0.16)'/><rect x='532.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.70)'/><rect x='546.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.30)'/><rect x='560.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.17)'/><rect x='574.0' y='318.0' width='13.4' height='13.4' fill='rgba(var(--n-violet-rgb), 0.61)'/></g>
<text x='504.0' y='350.0' class='lbl mid a-pop' style='--d:1.60s;fill:var(--n-student)'>R</text>
<text x='360.0' y='386.0' class='lbl sm mid a-pop' style='--d:1.90s;fill:var(--n-loss)'>so nothing here interprets an axis &#8212; only R, distances on it, and predictions</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> Two different answers, one identical matrix. The arrows are the coordinate directions; rotating them, and rotating the responses to match, leaves every effect unchanged. There is no fact about which direction is first, so no axis has a meaning and no factor has a biological interpretation. Only the matrix, distances on it, and predictions survive.</div>
</div>
<div class='lab wide' id='rg2-rot-lab'>
<div class='lab-head'><span class='name'>Lab 2 &middot; rotate the answer</span><span class='hint'>watch both halves move while the answer stays still</span></div>
<div class='lab-body'>
<div class='controls'>
<div class='ctl'>
<label for='rg2-theta'>rotate the answer <span class='val' id='rg2-theta-v'></span></label>
<input type='range' id='rg2-theta' min='0' max='360' step='1' value='0'>
</div>
</div>
<div class='readout'>
<div class='stat' style='--stat-hue:var(--n-clay)'><span class='k'>one cell&#39;s position</span><span class='v' id='rg2-stat-u'></span></div>
<div class='stat' style='--stat-hue:var(--n-student)'><span class='k'>one pair&#39;s response</span><span class='v' id='rg2-stat-l'></span></div>
<div class='stat' style='--stat-hue:var(--n-teacher)'><span class='k'>the effect they produce</span><span class='v' id='rg2-stat-r'></span></div>
</div>
<div class='verdict' id='rg2-rot-verdict'></div>
<svg viewBox='0 0 700 250' role='img'></svg>
<p class='cap'>Rotating the positions and the responses together leaves every effect exactly where it was. The two left panels turn; the matrix does not. This is why no axis in this model can be named, and why only the matrix, distances on it, and held-out predictions are ever interpreted.</p>
</div>
</div>

## Where measured features enter

There are two places a measurement about a cell could be used, and the difference matters.

It could enter the **likelihood** — the part that says what the data should look like. That is where genotype, the phenotype, and ordinary technical covariates go.

Or it could enter the **prior** — the part that says what is plausible before the data speaks. That is where cellular features and pair annotations go: a cell's measured properties adjust how likely it is that the cell participates in a given factor at all, and a pair's annotations do the same on the other side.

The distinction is not bookkeeping. A feature in the likelihood that is wrong will bias the answer. A feature in the prior that is wrong costs precision and is overridden by enough data. That is the safer place to put a guess, and it is where this model puts them.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 400' role='img' aria-label='Two lanes, likelihood and prior, feeding into the fitted coordinates.'>
<text x='24.0' y='40.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>measured features do not predict the answer; they say what is likely before the data speaks</text>
<rect x='24.0' y='86.0' width='240.0' height='108.0' rx='12' class='box a-pop' style='--d:0.15s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='144.0' y='76.0' class='lbl mid a-pop' style='--d:0.10s;fill:var(--n-teacher)'>the likelihood</text>
<circle cx='48.0' cy='118.0' r='4.0' class='a-pop' style='--d:0.30s;fill:var(--n-teacher)'/>
<text x='62.0' y='123.0' class='lbl sm a-rise' style='--d:0.33s;fill:var(--n-ink)'>genotype dosage</text>
<circle cx='48.0' cy='144.0' r='4.0' class='a-pop' style='--d:0.38s;fill:var(--n-teacher)'/>
<text x='62.0' y='149.0' class='lbl sm a-rise' style='--d:0.41s;fill:var(--n-ink)'>the phenotype</text>
<circle cx='48.0' cy='170.0' r='4.0' class='a-pop' style='--d:0.46s;fill:var(--n-teacher)'/>
<text x='62.0' y='175.0' class='lbl sm a-rise' style='--d:0.49s;fill:var(--n-ink)'>the covariates</text>
<path d='M268.0 140.0 L350.5 205.6' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.75s;--dur:0.70s;stroke:var(--n-teacher);stroke-width:2.2'/>
<polygon points='356.0,210.0 348.1,208.7 352.9,202.6' class='a-pop' style='--d:1.24s;fill:var(--n-teacher)'/>
<rect x='24.0' y='250.0' width='240.0' height='108.0' rx='12' class='box a-pop' style='--d:0.75s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='144.0' y='240.0' class='lbl mid a-pop' style='--d:0.70s;fill:var(--n-student)'>the prior</text>
<circle cx='48.0' cy='282.0' r='4.0' class='a-pop' style='--d:0.90s;fill:var(--n-student)'/>
<text x='62.0' y='287.0' class='lbl sm a-rise' style='--d:0.93s;fill:var(--n-ink)'>cellular features</text>
<circle cx='48.0' cy='308.0' r='4.0' class='a-pop' style='--d:0.98s;fill:var(--n-student)'/>
<text x='62.0' y='313.0' class='lbl sm a-rise' style='--d:1.01s;fill:var(--n-ink)'>pair annotations</text>
<path d='M268.0 304.0 L351.2 215.1' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.35s;--dur:0.70s;stroke:var(--n-student);stroke-width:2.2'/>
<polygon points='356.0,210.0 354.0,217.7 348.4,212.5' class='a-pop' style='--d:1.84s;fill:var(--n-student)'/>
<rect x='360.0' y='168.0' width='200.0' height='92.0' rx='12' class='box a-pop' style='--d:1.30s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='460.0' y='202.0' class='lbl sm mid a-rise' style='--d:1.36s;fill:var(--n-ink)'>the fitted</text>
<text x='460.0' y='226.0' class='lbl sm mid a-rise' style='--d:1.40s;fill:var(--n-ink)'>coordinates and loadings</text>
<text x='596.0' y='196.0' class='lbl sm a-rise' style='--d:1.55s;fill:var(--n-dim)'>a feature that</text>
<text x='596.0' y='216.0' class='lbl sm a-rise' style='--d:1.60s;fill:var(--n-dim)'>is wrong costs</text>
<text x='596.0' y='236.0' class='lbl sm a-rise' style='--d:1.65s;fill:var(--n-dim)'>precision, not</text>
<text x='596.0' y='256.0' class='lbl sm a-rise' style='--d:1.70s;fill:var(--n-loss)'>correctness</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 4.</span> The two places a measurement could be used. Genotype, the phenotype and technical covariates enter the likelihood, where being wrong biases the answer. Cellular features and pair annotations enter the prior, where being wrong costs precision and is overridden by enough data. The second is the safer place for a guess.</div>
</div>

## How it is fitted

Since neither factor of the product can be measured without the other, the fit alternates. Hold the positions still and solve for the responses, which is an ordinary problem. Hold the responses still and solve for the positions, which is also an ordinary problem. Repeat until nothing moves.

This is standard, and it has two standard consequences. The answer depends on where you start, so the fit is run repeatedly from different starting points and the best is kept. And the objective must never get worse from one round to the next — if it does, the implementation is wrong, and that is a check rather than a hope.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 348' role='img' aria-label='A four-step loop alternating between solving for positions and for responses.'>
<text x='24.0' y='40.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>neither side can be measured without the other, so each is solved with the other held still</text>
<rect x='212.0' y='42.0' width='176.0' height='60.0' rx='12' class='box a-pop' style='--d:0.25s;fill:var(--n-panel);stroke:var(--n-pruned)'/>
<text x='300.0' y='68.0' class='lbl sm mid a-rise' style='--d:0.31s;fill:var(--n-ink)'>freeze where the</text>
<text x='300.0' y='90.0' class='lbl sm mid a-rise' style='--d:0.35s;fill:var(--n-ink)'>cells sit</text>
<rect x='330.0' y='160.0' width='176.0' height='60.0' rx='12' class='box a-pop' style='--d:0.47s;fill:var(--n-panel);stroke:var(--n-student)'/>
<text x='418.0' y='186.0' class='lbl sm mid a-rise' style='--d:0.53s;fill:var(--n-ink)'>solve for how each</text>
<text x='418.0' y='208.0' class='lbl sm mid a-rise' style='--d:0.57s;fill:var(--n-ink)'>pair responds</text>
<rect x='212.0' y='278.0' width='176.0' height='60.0' rx='12' class='box a-pop' style='--d:0.69s;fill:var(--n-panel);stroke:var(--n-kept)'/>
<text x='300.0' y='304.0' class='lbl sm mid a-rise' style='--d:0.75s;fill:var(--n-ink)'>freeze the</text>
<text x='300.0' y='326.0' class='lbl sm mid a-rise' style='--d:0.79s;fill:var(--n-ink)'>responses</text>
<rect x='94.0' y='160.0' width='176.0' height='60.0' rx='12' class='box a-pop' style='--d:0.91s;fill:var(--n-panel);stroke:var(--n-teacher)'/>
<text x='182.0' y='186.0' class='lbl sm mid a-rise' style='--d:0.97s;fill:var(--n-ink)'>solve for where</text>
<text x='182.0' y='208.0' class='lbl sm mid a-rise' style='--d:1.01s;fill:var(--n-ink)'>the cells sit</text>
<path d='M 362.5 89.9 A 118.0 118.0 0 0 1 400.1 127.5' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.45s;--dur:0.50s;stroke:var(--n-dim);stroke-width:1.8'/>
<path d='M 400.1 252.5 A 118.0 118.0 0 0 1 362.5 290.1' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.67s;--dur:0.50s;stroke:var(--n-dim);stroke-width:1.8'/>
<path d='M 237.5 290.1 A 118.0 118.0 0 0 1 199.9 252.5' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.89s;--dur:0.50s;stroke:var(--n-dim);stroke-width:1.8'/>
<path d='M 199.9 127.5 A 118.0 118.0 0 0 1 237.5 89.9' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:1.11s;--dur:0.50s;stroke:var(--n-dim);stroke-width:1.8'/>
<text x='300.0' y='184.0' class='lbl sm mid a-rise' style='--d:1.35s;fill:var(--n-dim)'>until nothing</text>
<text x='300.0' y='204.0' class='lbl sm mid a-rise' style='--d:1.40s;fill:var(--n-dim)'>moves</text>
<text x='560.0' y='150.0' class='lbl sm a-rise' style='--d:1.55s;fill:var(--n-dim)'>each half is an</text>
<text x='560.0' y='170.0' class='lbl sm a-rise' style='--d:1.60s;fill:var(--n-dim)'>ordinary problem;</text>
<text x='560.0' y='190.0' class='lbl sm a-rise' style='--d:1.65s;fill:var(--n-dim)'>the product is</text>
<text x='560.0' y='210.0' class='lbl sm a-rise' style='--d:1.70s;fill:var(--n-loss)'>not</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 5.</span> The fit alternates because the new term is a product. Freeze the positions and the responses are an ordinary problem; freeze the responses and the positions are too. Neither is hard alone; only together. The loop runs until nothing moves, from several starting points, with the objective checked for going backwards.</div>
</div>

## The plan

Eight steps. Each has to establish something, and each can fail.

**1. Build the estimator and show it reproduces the published method it extends.** Done. Turning off the new prior and the new term must recover the existing method's answer, and it does.

**2. Recover a known truth.** Done in simulation, where the positions and responses are chosen in advance and the fit is asked to find them. This is the only setting in which the answer is known, which is why it comes before everything else.

**3. Transfer to genes and people the model never saw.** Next, and the subject of the following note. The map is built on some regions of the genome in some people; the test is whether it predicts genotype-dependent expression for *other* regions in *other* people.

**4. Beat the comparator that actually matters.** Not a plain average effect, which is table stakes, but effect variation along supplied expression coordinates. If a map built from genetics cannot beat a map built from appearance, the premise of the first note is wrong.

**5. Recover a perturbation the model was never shown.** Fit a map on data where cells were experimentally stimulated, without telling it which cells were stimulated, and ask whether an axis recovers the stimulus. This is the strongest external check available and it can end the project in months rather than years.

**6. Fit the tissue.** Blocked, and honestly so: the vascular cells of the brain are a fraction of a per cent of what a standard experiment recovers, and the enrichment protocols that fix this have not been run on a genotyped cohort at scale.

**7. Place the disease variants.** With the map built from regions that exclude the one being placed, and oriented to the risk-increasing allele.

**8. Ask whether independent loci converge.** Against a matched null, because with few coordinates some convergence is guaranteed by construction. This is the question the whole thing is for.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 424' role='img' aria-label='Eight numbered steps with their status.'>
<text x='24.0' y='40.0' class='lbl sm a-rise' style='--d:0.05s;fill:var(--n-dim)'>eight steps, and what each has to establish</text>
<circle cx='38.0' cy='74.0' r='12.0' class='a-pop' style='--d:0.20s;fill:var(--n-kept)'/>
<text x='38.0' y='79.0' class='lbl sm mid on a-pop' style='--d:0.24s'>1</text>
<path d='M38.0 86.0 L38.0 104.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.26s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='72.0' class='lbl a-rise' style='--d:0.24s;fill:var(--n-kept)'>Build the estimator</text>
<text x='62.0' y='92.0' class='lbl sm a-rise' style='--d:0.28s;fill:var(--n-dim)'>matches the published method it extends</text>
<text x='704.0' y='79.0' class='lbl sm end a-rise' style='--d:0.30s;fill:var(--n-kept)'>done</text>
<circle cx='38.0' cy='116.0' r='12.0' class='a-pop' style='--d:0.29s;fill:var(--n-kept)'/>
<text x='38.0' y='121.0' class='lbl sm mid on a-pop' style='--d:0.33s'>2</text>
<path d='M38.0 128.0 L38.0 146.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.35s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='114.0' class='lbl a-rise' style='--d:0.33s;fill:var(--n-kept)'>Recover a known truth</text>
<text x='62.0' y='134.0' class='lbl sm a-rise' style='--d:0.37s;fill:var(--n-dim)'>simulated data where the answer is known</text>
<text x='704.0' y='121.0' class='lbl sm end a-rise' style='--d:0.39s;fill:var(--n-kept)'>done</text>
<circle cx='38.0' cy='158.0' r='12.0' class='a-pop' style='--d:0.38s;fill:var(--n-student)'/>
<text x='38.0' y='163.0' class='lbl sm mid on a-pop' style='--d:0.42s'>3</text>
<path d='M38.0 170.0 L38.0 188.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.44s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='156.0' class='lbl a-rise' style='--d:0.42s;fill:var(--n-student)'>Transfer out of sample</text>
<text x='62.0' y='176.0' class='lbl sm a-rise' style='--d:0.46s;fill:var(--n-dim)'>new genes, new people, nested partitions</text>
<text x='704.0' y='163.0' class='lbl sm end a-rise' style='--d:0.48s;fill:var(--n-dim)'>next</text>
<circle cx='38.0' cy='200.0' r='12.0' class='a-pop' style='--d:0.47s;fill:var(--n-student)'/>
<text x='38.0' y='205.0' class='lbl sm mid on a-pop' style='--d:0.51s'>4</text>
<path d='M38.0 212.0 L38.0 230.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.53s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='198.0' class='lbl a-rise' style='--d:0.51s;fill:var(--n-student)'>Beat the real comparator</text>
<text x='62.0' y='218.0' class='lbl sm a-rise' style='--d:0.55s;fill:var(--n-dim)'>supplied expression coordinates, not just an average</text>
<text x='704.0' y='205.0' class='lbl sm end a-rise' style='--d:0.57s;fill:var(--n-dim)'>next</text>
<circle cx='38.0' cy='242.0' r='12.0' class='a-pop' style='--d:0.56s;fill:var(--n-dim)'/>
<text x='38.0' y='247.0' class='lbl sm mid on a-pop' style='--d:0.60s'>5</text>
<path d='M38.0 254.0 L38.0 272.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.62s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='240.0' class='lbl a-rise' style='--d:0.60s;fill:var(--n-dim)'>Recover an applied perturbation</text>
<text x='62.0' y='260.0' class='lbl sm a-rise' style='--d:0.64s;fill:var(--n-dim)'>a map fitted blind to the stimulus</text>
<text x='704.0' y='247.0' class='lbl sm end a-rise' style='--d:0.66s;fill:var(--n-dim)'>planned</text>
<circle cx='38.0' cy='284.0' r='12.0' class='a-pop' style='--d:0.65s;fill:var(--n-loss)'/>
<text x='38.0' y='289.0' class='lbl sm mid on a-pop' style='--d:0.69s'>6</text>
<path d='M38.0 296.0 L38.0 314.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.71s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='282.0' class='lbl a-rise' style='--d:0.69s;fill:var(--n-loss)'>Fit the tissue</text>
<text x='62.0' y='302.0' class='lbl sm a-rise' style='--d:0.73s;fill:var(--n-dim)'>vascular cells, once enrichment exists at scale</text>
<text x='704.0' y='289.0' class='lbl sm end a-rise' style='--d:0.75s;fill:var(--n-loss)'>blocked</text>
<circle cx='38.0' cy='326.0' r='12.0' class='a-pop' style='--d:0.74s;fill:var(--n-dim)'/>
<text x='38.0' y='331.0' class='lbl sm mid on a-pop' style='--d:0.78s'>7</text>
<path d='M38.0 338.0 L38.0 356.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.80s;--dur:0.30s;stroke:var(--n-edge);stroke-width:1.6'/>
<text x='62.0' y='324.0' class='lbl a-rise' style='--d:0.78s;fill:var(--n-dim)'>Place the disease variants</text>
<text x='62.0' y='344.0' class='lbl sm a-rise' style='--d:0.82s;fill:var(--n-dim)'>leave-one-region-out, oriented to risk</text>
<text x='704.0' y='331.0' class='lbl sm end a-rise' style='--d:0.84s;fill:var(--n-dim)'>planned</text>
<circle cx='38.0' cy='368.0' r='12.0' class='a-pop' style='--d:0.83s;fill:var(--n-dim)'/>
<text x='38.0' y='373.0' class='lbl sm mid on a-pop' style='--d:0.87s'>8</text>
<text x='62.0' y='366.0' class='lbl a-rise' style='--d:0.87s;fill:var(--n-dim)'>Ask whether they converge</text>
<text x='62.0' y='386.0' class='lbl sm a-rise' style='--d:0.91s;fill:var(--n-dim)'>against a matched null</text>
<text x='704.0' y='373.0' class='lbl sm end a-rise' style='--d:0.93s;fill:var(--n-dim)'>planned</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 6.</span> The eight steps, what each has to establish, and where the work currently stands. Steps 1 and 2 are done. Steps 3 and 4 are the subject of the next note. Step 6 is blocked on data that does not yet exist, and saying so is part of the plan rather than an embarrassment to it.</div>
</div>

<div class='figure'>
<img src='/images/regulotype-figure2.png' alt='A five-panel figure: the four terms of the model; the matrix assembled from average effects, responses and positions; two different solutions giving one identical matrix; where measured features enter; and the eight-step plan.'>
<div class='caption'>
<span class='caption-label'>Figure 7.</span> The model as a single figure: the four terms (<b>a</b>), the matrix assembled from average effects, responses and positions (<b>b</b>), two different solutions producing one identical matrix (<b>c</b>), the two places a measured feature could enter (<b>d</b>), and the eight steps (<b>e</b>). A sketch, not a result; the matrices are simulated from the model.
</div>
</div>

Steps 3, 4 and 5 are all versions of one question, and it is the question a reader should be asking by now: if cells are reclassified by genetic response, how would anyone know the classification is real? The next note is about nothing else.


## Sources

This note describes a model rather than a result, so it cites the work it builds on rather than evidence.

- Strober *et al.* "SURGE: uncovering context-specific genetic-regulation of gene expression from single-cell RNA sequencing using latent-factor models." *Genome Biology* **25**, 28 (2024). [doi:10.1186/s13059-023-03152-z](https://doi.org/10.1186/s13059-023-03152-z) &mdash; the observation model and the alternating fit.
- Wang &amp; Stephens. "Empirical Bayes matrix factorization." *Journal of Machine Learning Research* **22**(120), 1&ndash;40 (2021). [jmlr.org/papers/v22/20-589.html](https://jmlr.org/papers/v22/20-589.html) &mdash; estimating the prior from the data rather than tuning it.
- Denault, Tayeb, Carbonetto, Willwerscheid &amp; Stephens. "Covariate-moderated empirical Bayes matrix factorization." *Advances in Neural Information Processing Systems* **38** (2025). [doi:10.52202/085713-1573](https://doi.org/10.52202/085713-1573) &mdash; letting measured features enter the prior, which is the form used here.
- Cuomo, Heinen, Vagiaki, Horta, Marioni &amp; Stegle. "CellRegMap: a statistical framework for mapping context-specific regulatory variants using scRNA-seq." *Molecular Systems Biology* **18**, e10663 (2022). [doi:10.15252/msb.202110663](https://doi.org/10.15252/msb.202110663) &mdash; the supplied-coordinate comparator named in step 4.
- Nathan *et al.* "Single-cell eQTL models reveal dynamic T cell state dependence of disease loci." *Nature* **606**, 120&ndash;128 (2022). [doi:10.1038/s41586-022-04713-1](https://doi.org/10.1038/s41586-022-04713-1) &mdash; published human evidence of independent variants at one gene with opposing state relationships, which is the sign change the fourth term allows.
