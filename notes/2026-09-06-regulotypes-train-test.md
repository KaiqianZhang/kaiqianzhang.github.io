---
title: 'Regulotypes: how the map is trained and tested'
subtitle: A regulotype map is estimated from a set of donors and cis variant–gene pairs. To test whether it represents reusable genetic-response structure, we need to know how to place a new cis effect and a new cell onto the same map.
date: 2026-09-06
tags: regulotype
keywords: regulotype, train-test design, held-out prediction, transfer across genes, transfer across donors, nested evaluation, cis-regulatory effects, cell-resolved cis effects, latent factor model, blood-brain barrier
---

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 316' role='img' aria-label='The six sections of this note.'>
<text x='14.0' y='151.0' class='lbl bg a-pop' style='--d:0.00s;fill:var(--n-student)'>Train</text>
<text x='14.0' y='173.0' class='lbl bg a-pop' style='--d:0.08s;fill:var(--n-student)'>&amp; test</text>
<path d='M138 47.0 C134.7 47.0, 134.7 157.0, 116 157.0 C134.7 157.0, 134.7 267.0, 138 267.0' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.22s;--dur:0.90s;stroke:var(--n-student);stroke-width:2.4'/>
<a href='#learning-the-reference-map' class='rm-row'>
<rect x='128' y='30.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='47.0' r='4.0' class='a-beat' style='--d:0.45s;--dur:2.00s;fill:var(--n-data)'/>
<text x='164.0' y='52.0' class='lbl a-rise' style='--d:0.45s;fill:var(--n-data)'>Learning the reference map</text>
<text x='704.0' y='52.0' class='lbl sm end a-rise' style='--d:0.55s;fill:var(--n-dim)'>the training block, and what it fits</text>
</a>
<a href='#projecting-a-new-cis-pair' class='rm-row'>
<rect x='128' y='74.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='91.0' r='4.0' class='a-beat' style='--d:0.53s;--dur:2.00s;fill:var(--n-student)'/>
<text x='164.0' y='96.0' class='lbl a-rise' style='--d:0.53s;fill:var(--n-student)'>Projecting a new cis pair</text>
<text x='704.0' y='96.0' class='lbl sm end a-rise' style='--d:0.63s;fill:var(--n-dim)'>a held-out pair becomes a new row</text>
</a>
<a href='#locating-cells-from-a-new-donor' class='rm-row'>
<rect x='128' y='118.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='135.0' r='4.0' class='a-beat' style='--d:0.61s;--dur:2.00s;fill:var(--n-teacher)'/>
<text x='164.0' y='140.0' class='lbl a-rise' style='--d:0.61s;fill:var(--n-teacher)'>Locating cells from a new donor</text>
<text x='704.0' y='140.0' class='lbl sm end a-rise' style='--d:0.71s;fill:var(--n-dim)'>a held-out cell becomes a new column</text>
</a>
<a href='#putting-the-two-projections-together' class='rm-row'>
<rect x='128' y='162.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='179.0' r='4.0' class='a-beat' style='--d:0.69s;--dur:2.00s;fill:var(--n-pruned)'/>
<text x='164.0' y='184.0' class='lbl a-rise' style='--d:0.69s;fill:var(--n-pruned)'>Putting the two projections together</text>
<text x='704.0' y='184.0' class='lbl sm end a-rise' style='--d:0.79s;fill:var(--n-dim)'>the 2&#215;2 design, read in order</text>
</a>
<a href='#what-is-actually-predicted' class='rm-row'>
<rect x='128' y='206.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='223.0' r='4.0' class='a-beat' style='--d:0.77s;--dur:2.00s;fill:var(--n-kept)'/>
<text x='164.0' y='228.0' class='lbl a-rise' style='--d:0.77s;fill:var(--n-kept)'>What is actually predicted?</text>
<text x='704.0' y='228.0' class='lbl sm end a-rise' style='--d:0.87s;fill:var(--n-dim)'>a cis effect, then a genotype</text>
</a>
<a href='#summary' class='rm-row'>
<rect x='128' y='250.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='267.0' r='4.0' class='a-beat' style='--d:0.85s;--dur:2.00s;fill:var(--n-loss)'/>
<text x='164.0' y='272.0' class='lbl a-rise' style='--d:0.85s;fill:var(--n-loss)'>Summary</text>
<text x='704.0' y='272.0' class='lbl sm end a-rise' style='--d:0.95s;fill:var(--n-dim)'>the whole mechanism as one matrix</text>
</a>
</svg>
</div>

In the [previous note](/notes/2026/09/04/regulotypes/), I defined the regulotype of a cell as its cis-effect profile across a reference set of variant–gene pairs.

| symbol | meaning |
| --- | --- |
| $s=(v,g)$ | a reference pair: variant $v$ and the gene $g$ nominated for it |
| $i$ | a cell, in practice a within-donor metacell |
| $d(i)$ | the donor that measurement $i$ came from |
| $x_{d(i)v}$ | that donor's allele dosage at $v$ |
| $\beta_s$ | the average cis effect of pair $s$ across cells |
| $u_i$ | the cellular coordinate of cell $i$, shared across pairs |
| $\lambda_s$ | how pair $s$ responds to those coordinates |
| $r_{si}$ | the cis effect of pair $s$ in cell $i$, per effect allele |
| $R$ | the $S\times I$ matrix collecting every $r_{si}$ |
| $m_{ig}$, $b_{d(i)g}$ | the genotype-independent mean, and the donor $\times$ gene random intercept |

For pair $s=(v,g)$ and cell $i$, the cell-resolved cis effect is

$$
r_{si}=\beta_s+u_i^{\mathsf T}\lambda_s.
$$

Collecting these effects gives

$$
R=\beta\mathbf 1^\mathsf T+\Lambda U^\mathsf T.
$$

The two dimensions of $R$ have different meanings:

* a **row** $R_{s:}$ describes one variant–gene pair across cells;
* a **column** $R_{:i}$ describes one cell across variant–gene pairs.

This matrix view also gives a simple way to think about training and testing. A new variant–gene pair should add a **row** to $R$; a cell from a new donor should add a **column**. Once both operations are defined, we can ask what happens when the row and column are both new.

## Learning the reference map

The observation model for a nominated cis pair $s=(v,g)$ is

$$
y_{ig}
=
m_{ig}
+
b_{d(i)g}
+
x_{d(i)v}
\left(
\beta_s+u_i^\mathsf T\lambda_s
\right)
+
\epsilon_{ig}.
$$

Here $x_{d(i)v}$ is the allele dosage of donor $d(i)$. The term in parentheses is therefore the effect of one additional effect allele in the cellular condition represented by $i$:

$$
r_{si}=\beta_s+u_i^\mathsf T\lambda_s.
$$

The important sharing occurs through $u_i$. The same cellular coordinate is used for many approximately independent cis pairs, while each pair gets its own average effect $\beta_s$ and loading $\lambda_s$.

Using a set of **training donors** and **coordinate-training genes**, we estimate

$$
\hat\beta,\qquad
\hat\Lambda,\qquad
\hat U_{\text{train}},
$$

and therefore

$$
\boxed{
\hat R_{\text{train}}
=
\hat\beta\mathbf 1^\mathsf T
+
\hat\Lambda\hat U_{\text{train}}^\mathsf T.
}
$$

This is the reference regulotype map.

Although the model is written in terms of $U$ and $\Lambda$, their orientation is not unique: rotations and rescalings can change the factors without changing $R$. This is why the stable objects for later evaluation are the cell-resolved effects in $R$, distances between its columns, and predictions made from them.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 344' role='img' aria-label='A heatmap of the fitted regulotype matrix with one column and one row highlighted, and an empty row and empty column waiting to be filled.'>
<text x='390.0' y='30.0' class='lbl bg mid a-pop' style='--d:0.02s;fill:var(--n-ink)'>the fitted regulotype map  R</text>
<rect x='210.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.12s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.28)'/>
<rect x='210.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.12s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.39)'/>
<rect x='210.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.13s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.11)'/>
<rect x='210.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.13s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.85)'/>
<rect x='210.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.14s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.26)'/>
<rect x='210.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.14s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.88)'/>
<rect x='210.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.14s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.55)'/>
<rect x='210.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.15s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.34)'/>
<rect x='210.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.15s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.29)'/>
<rect x='230.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.15s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.28)'/>
<rect x='230.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.15s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.11)'/>
<rect x='230.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.16s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.17)'/>
<rect x='230.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.16s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.24)'/>
<rect x='230.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.17s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.21)'/>
<rect x='230.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.17s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.67)'/>
<rect x='230.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.17s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.21)'/>
<rect x='230.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.18s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.54)'/>
<rect x='230.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.18s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.39)'/>
<rect x='250.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.18s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.22)'/>
<rect x='250.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.18s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.11)'/>
<rect x='250.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.19s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.13)'/>
<rect x='250.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.19s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.10)'/>
<rect x='250.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.20s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.13)'/>
<rect x='250.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.20s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.44)'/>
<rect x='250.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.20s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.14)'/>
<rect x='250.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.21s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.37)'/>
<rect x='250.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.21s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.31)'/>
<rect x='270.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.21s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.10)'/>
<rect x='270.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.21s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.20)'/>
<rect x='270.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.22s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.11)'/>
<rect x='270.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.22s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.19)'/>
<rect x='270.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.23s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.17)'/>
<rect x='270.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.23s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.41)'/>
<rect x='270.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.23s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.20)'/>
<rect x='270.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.24s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.25)'/>
<rect x='270.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.24s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.25)'/>
<rect x='290.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.24s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.46)'/>
<rect x='290.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.24s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.30)'/>
<rect x='290.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.25s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.17)'/>
<rect x='290.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.25s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.56)'/>
<rect x='290.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.26s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.31)'/>
<rect x='290.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.26s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.26)'/>
<rect x='290.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.26s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.31)'/>
<rect x='290.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.27s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.48)'/>
<rect x='290.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.27s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.37)'/>
<rect x='310.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.27s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.14)'/>
<rect x='310.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.27s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.21)'/>
<rect x='310.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.28s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.13)'/>
<rect x='310.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.28s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.10)'/>
<rect x='310.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.29s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.22)'/>
<rect x='310.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.29s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.27)'/>
<rect x='310.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.29s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.15)'/>
<rect x='310.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.30s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.15)'/>
<rect x='310.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.30s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.21)'/>
<rect x='330.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.30s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.14)'/>
<rect x='330.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.30s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.20)'/>
<rect x='330.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.31s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.14)'/>
<rect x='330.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.31s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.13)'/>
<rect x='330.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.32s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.22)'/>
<rect x='330.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.32s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.24)'/>
<rect x='330.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.32s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.14)'/>
<rect x='330.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.33s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.13)'/>
<rect x='330.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.33s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.20)'/>
<rect x='350.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.33s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.29)'/>
<rect x='350.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.33s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.31)'/>
<rect x='350.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.34s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.18)'/>
<rect x='350.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.34s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.20)'/>
<rect x='350.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.35s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.35)'/>
<rect x='350.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.35s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.21)'/>
<rect x='350.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.35s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.22)'/>
<rect x='350.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.36s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.22)'/>
<rect x='350.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.36s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.13)'/>
<rect x='370.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.36s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.16)'/>
<rect x='370.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.36s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.21)'/>
<rect x='370.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.37s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.16)'/>
<rect x='370.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.37s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.23)'/>
<rect x='370.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.38s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.26)'/>
<rect x='370.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.38s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.12)'/>
<rect x='370.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.38s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.11)'/>
<rect x='370.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.39s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.16)'/>
<rect x='370.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.39s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.16)'/>
<rect x='390.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.39s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.40)'/>
<rect x='390.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.39s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.38)'/>
<rect x='390.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.40s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.23)'/>
<rect x='390.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.40s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.13)'/>
<rect x='390.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.41s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.47)'/>
<rect x='390.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.41s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.19)'/>
<rect x='390.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.41s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.19)'/>
<rect x='390.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.42s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.42)'/>
<rect x='390.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.42s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.16)'/>
<rect x='410.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.42s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.27)'/>
<rect x='410.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.42s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.20)'/>
<rect x='410.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.43s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.13)'/>
<rect x='410.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.43s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.71)'/>
<rect x='410.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.44s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.10)'/>
<rect x='410.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.44s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.31)'/>
<rect x='410.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.44s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.37)'/>
<rect x='410.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.45s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.11)'/>
<rect x='410.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.45s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.20)'/>
<rect x='430.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.45s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.13)'/>
<rect x='430.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.45s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.16)'/>
<rect x='430.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.46s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.18)'/>
<rect x='430.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.46s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.51)'/>
<rect x='430.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.47s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.26)'/>
<rect x='430.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.47s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.33)'/>
<rect x='430.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.47s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.25)'/>
<rect x='430.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.48s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.27)'/>
<rect x='430.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.48s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.11)'/>
<rect x='450.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.48s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.10)'/>
<rect x='450.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.48s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.13)'/>
<rect x='450.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.49s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.18)'/>
<rect x='450.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.49s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.55)'/>
<rect x='450.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.50s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.24)'/>
<rect x='450.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.50s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.35)'/>
<rect x='450.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.50s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.28)'/>
<rect x='450.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.51s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.25)'/>
<rect x='450.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.51s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.12)'/>
<rect x='470.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.51s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.18)'/>
<rect x='470.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.51s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.13)'/>
<rect x='470.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.52s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.16)'/>
<rect x='470.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.52s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.66)'/>
<rect x='470.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.53s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.18)'/>
<rect x='470.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.53s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.37)'/>
<rect x='470.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.53s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.34)'/>
<rect x='470.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.54s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.19)'/>
<rect x='470.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.54s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.15)'/>
<rect x='490.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.54s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.30)'/>
<rect x='490.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.54s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.28)'/>
<rect x='490.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.55s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.23)'/>
<rect x='490.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.55s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.35)'/>
<rect x='490.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.56s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.41)'/>
<rect x='490.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.56s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.37)'/>
<rect x='490.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.56s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.16)'/>
<rect x='490.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.57s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.43)'/>
<rect x='490.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.57s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.17)'/>
<rect x='510.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.57s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.25)'/>
<rect x='510.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.57s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.24)'/>
<rect x='510.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.58s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.22)'/>
<rect x='510.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.58s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.44)'/>
<rect x='510.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.59s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.37)'/>
<rect x='510.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.59s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.40)'/>
<rect x='510.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.59s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.21)'/>
<rect x='510.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.60s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.41)'/>
<rect x='510.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.60s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.15)'/>
<rect x='530.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.60s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.43)'/>
<rect x='530.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.60s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.36)'/>
<rect x='530.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.61s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.28)'/>
<rect x='530.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.61s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.34)'/>
<rect x='530.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.62s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.53)'/>
<rect x='530.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.62s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.50)'/>
<rect x='530.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.62s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.15)'/>
<rect x='530.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.63s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.61)'/>
<rect x='530.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.63s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.25)'/>
<rect x='550.0' y='64.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.63s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.32)'/>
<rect x='550.0' y='84.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.63s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.26)'/>
<rect x='550.0' y='104.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.64s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.26)'/>
<rect x='550.0' y='124.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.64s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.61)'/>
<rect x='550.0' y='144.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.65s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.45)'/>
<rect x='550.0' y='164.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.65s;--dur:0.42s;fill:rgba(var(--n-blue-rgb), 0.65)'/>
<rect x='550.0' y='184.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.65s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.30)'/>
<rect x='550.0' y='204.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.66s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.59)'/>
<rect x='550.0' y='224.0' width='18.6' height='18.6' rx='2' class=' a-pop' style='--d:0.66s;--dur:0.42s;fill:rgba(var(--n-red-rgb), 0.24)'/>
<text x='52.0' y='154.0' class='lbl sm mid a-fade' transform='rotate(-90 52 154.0)' style='--d:0.20s;fill:var(--n-dim)'>reference pairs  s</text>
<text x='390.0' y='322.0' class='lbl sm mid a-fade' style='--d:0.24s;fill:var(--n-dim)'>cells / metacells  i  &#8594;</text>
<rect x='327.4' y='61.4' width='23.8' height='183.8' rx='4' class=' a-draw' style='--d:1.15s;--dur:0.85s;fill:none;stroke:var(--n-teacher);stroke-width:2.6'/>
<text x='340.0' y='52.0' class='lbl sm mid a-rise' style='--d:1.35s;fill:var(--n-teacher)'>one cell&#39;s regulotype</text>
<rect x='207.4' y='141.4' width='363.8' height='23.8' rx='4' class=' a-draw' style='--d:1.60s;--dur:0.85s;fill:none;stroke:var(--n-student);stroke-width:2.6'/>
<text x='200.0' y='158.0' class='lbl sm end a-rise' style='--d:1.80s;fill:var(--n-student)'>one pair&#39;s profile</text>
<rect x='210.0' y='254.0' width='360.0' height='20.0' rx='4' class=' a-fade' stroke-dasharray='6 5' style='--d:2.15s;--dur:0.55s;fill:none;stroke:var(--n-data);stroke-width:2.2'/>
<line x1='210.0' y1='254.0' x2='210.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='230.0' y1='254.0' x2='230.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='250.0' y1='254.0' x2='250.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='270.0' y1='254.0' x2='270.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='290.0' y1='254.0' x2='290.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='310.0' y1='254.0' x2='310.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='330.0' y1='254.0' x2='330.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='350.0' y1='254.0' x2='350.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='370.0' y1='254.0' x2='370.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='390.0' y1='254.0' x2='390.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='410.0' y1='254.0' x2='410.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='430.0' y1='254.0' x2='430.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='450.0' y1='254.0' x2='450.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='470.0' y1='254.0' x2='470.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='490.0' y1='254.0' x2='490.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='510.0' y1='254.0' x2='510.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='530.0' y1='254.0' x2='530.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='550.0' y1='254.0' x2='550.0' y2='274.0' class='a-fade' style='--d:2.25s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<text x='390.0' y='290.0' class='lbl sm mid a-rise' style='--d:2.30s;fill:var(--n-data)'>new cis pair  &#8594;  a new row</text>
<rect x='580.0' y='64.0' width='20.0' height='180.0' rx='4' class=' a-fade' stroke-dasharray='6 5' style='--d:2.55s;--dur:0.55s;fill:none;stroke:var(--n-data);stroke-width:2.2'/>
<line x1='580.0' y1='64.0' x2='600.0' y2='64.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='84.0' x2='600.0' y2='84.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='104.0' x2='600.0' y2='104.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='124.0' x2='600.0' y2='124.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='144.0' x2='600.0' y2='144.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='164.0' x2='600.0' y2='164.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='184.0' x2='600.0' y2='184.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='204.0' x2='600.0' y2='204.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<line x1='580.0' y1='224.0' x2='600.0' y2='224.0' class='a-fade' style='--d:2.65s;stroke:var(--n-data);stroke-width:0.7;opacity:0.45'/>
<text x='600.0' y='148.0' class='lbl sm a-rise' style='--d:2.70s;fill:var(--n-data)'>new donor cell</text>
<text x='600.0' y='164.0' class='lbl sm a-rise' style='--d:2.78s;fill:var(--n-data)'>&#8594;  a new column</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> Rows are reference variant&#8211;gene pairs, columns are cells; red means the effect allele raises the target gene and blue lowers it. The teal outline is one column, $R_{:i}$, and the violet outline is one row, $R_{s:}$. The two dashed slots are what the rest of the note fills in: a held-out pair arrives as a row, a cell from a held-out donor arrives as a column. Simulated from the model at rank two.</div>
</div>

## Projecting a new cis pair

Suppose a variant–gene pair $s^\ast$ was not used to estimate the reference coordinates.

The cellular coordinates

$$
\hat U_{\text{train}}
$$

are now kept fixed. We fit the new pair and estimate

$$
\hat\beta_{s^\ast},
\qquad
\hat\lambda_{s^\ast}.
$$

Its predicted effect in cell $i$ is

$$
\hat r_{s^\ast i}
=
\hat\beta_{s^\ast}
+
\hat u_i^\mathsf T\hat\lambda_{s^\ast}.
$$

Across all training cells,

$$
\hat R_{s^\ast:}
=
\left(
\hat r_{s^\ast1},
\ldots,
\hat r_{s^\ast I}
\right).
$$

The result is a new row of $R$.

$$
\boxed{
\text{new pair}
\rightarrow
(\hat\beta_{s^\ast},\hat\lambda_{s^\ast})
\rightarrow
\text{new row}.
}
$$

The logic is useful: the new pair did not help determine the cellular coordinate system. We are instead asking whether its genetic effect can be described over a map learned from other cis regions.

This is transfer across genes.

## Locating cells from a new donor

The reverse operation starts with a new donor.

These cells were absent when $U_{\text{train}}$ was estimated, so they have no coordinates yet. Consequently, they also have no columns in $R$.

The quantities learned from the training donors remain fixed, including the pair-side parameters and fitted prior functions. For a new cell $j$, we infer

$$
\hat u_j^{\text{test}}
$$

using the **coordinate-training genes** measured in that donor, their corresponding genotypes, and the covariates and cellular features permitted by the model.

Expression of the genes reserved for final testing is not used here.

Once the coordinate has been inferred,

$$
\boxed{
\hat R_{:j}^{\text{test}}
=
\hat\beta+
\hat\Lambda\hat u_j^{\text{test}}.
}
$$

The result is a new column of $R$:

$$
\boxed{
\text{new cell}
\rightarrow
\hat u_j^{\text{test}}
\rightarrow
\text{new column}.
}
$$

This step is the bridge I find most important to keep straight. A held-out cell is not matched to an existing regulotype. Instead, the training genes locate the cell on the learned response coordinates; those coordinates then imply its cis-effect profile.

This is transfer across donors.

## Putting the two projections together

Genes and donors are held out separately.

Let the donors be divided into

$$
D_{\mathrm{train}}
\quad\text{and}\quad
D_{\mathrm{test}},
$$

and approximately independent cis regions into

$$
S_{\mathrm{coordinate}}
\quad\text{and}\quad
S_{\mathrm{test}}.
$$

This produces a useful $2\times2$ design:

|                     | Coordinate-training genes | Test genes          |
| ------------------- | ------------------------- | ------------------- |
| **Training donors** | Learn the map             | Project new rows    |
| **Test donors**     | Infer new columns         | Evaluate prediction |

The four blocks should be read in order.

**Training donors × coordinate-training genes.**
Estimate the reference cellular coordinates and cis-effect structure:

$$
\hat U_{\mathrm{train}},
\qquad
\hat\Lambda_{\mathrm{coordinate}},
\qquad
\hat\beta_{\mathrm{coordinate}}.
$$

**Training donors × test genes.**
Keep $U_{\mathrm{train}}$ fixed and estimate

$$
\hat\beta_{\mathrm{test}},
\qquad
\hat\lambda_{\mathrm{test}}.
$$

This tells us how a held-out cis pair varies over the learned map.

**Test donors × coordinate-training genes.**
Keep the learned global structure fixed and infer

$$
\hat U_{\mathrm{test}}.
$$

This tells us where cells from a held-out donor lie on the same map.

**Test donors × test genes.**
Nothing new is fitted using the test-gene expression in this block. Instead, we combine the test-pair parameters from the top-right with the test-cell coordinate from the bottom-left:

$$
\boxed{
\hat r_{s^\ast i}
=
\hat\beta_{s^\ast}
+
(\hat u_i^{\mathrm{test}})^\mathsf T
\hat\lambda_{s^\ast}.
}
$$

This predicts the cis effect of a held-out pair in a held-out donor.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 456' role='img' aria-label='A two by two grid of donors against genes, with arrows from the top-left block to the top-right and bottom-left blocks, meeting in the bottom-right.'>
<line x1='150' y1='249' x2='680' y2='249' class='grid a-fade' style='--d:0.10s'/>
<line x1='420' y1='58' x2='420' y2='442' class='grid a-fade' style='--d:0.10s'/>
<text x='265.0' y='44.0' class='lbl sm mid a-rise' style='--d:0.14s;fill:var(--n-dim)'>coordinate-training genes</text>
<text x='565.0' y='44.0' class='lbl sm mid a-rise' style='--d:0.18s;fill:var(--n-dim)'>test genes</text>
<text x='160.0' y='130.0' class='lbl sm end a-rise' style='--d:0.22s;fill:var(--n-dim)'>training</text>
<text x='160.0' y='146.0' class='lbl sm end a-rise' style='--d:0.22s;fill:var(--n-dim)'>donors</text>
<text x='160.0' y='360.0' class='lbl sm end a-rise' style='--d:0.26s;fill:var(--n-dim)'>test</text>
<text x='160.0' y='376.0' class='lbl sm end a-rise' style='--d:0.26s;fill:var(--n-dim)'>donors</text>
<rect x='170.0' y='72.0' width='190.0' height='124.0' rx='14' class='box a-pop' style='--d:0.45s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='170.0' y='72.0' width='190.0' height='30.0' rx='14' class=' a-pop' style='--d:0.51s;--dur:0.45s;fill:var(--n-data)'/>
<rect x='170.0' y='88.0' width='190.0' height='14.0' rx='0' class=' a-pop' style='--d:0.51s;--dur:0.45s;fill:var(--n-data)'/>
<text x='265.0' y='92.0' class='lbl on mid a-fade' style='--d:0.57s;fill:var(--n-on-fill)'>learn the map</text>
<text x='265.0' y='130.0' class='lbl sm mid a-rise' style='--d:0.63s;fill:var(--n-ink)'>estimate  U,  &#923;,  &#946;</text>
<text x='265.0' y='154.0' class='lbl sm mid a-rise' style='--d:0.69s;fill:var(--n-dim)'>this is the reference R</text>
<text x='265.0' y='178.0' class='lbl sm mid a-rise' style='--d:0.75s;fill:var(--n-dim)'>nothing here is held out</text>
<path d='M360.0 150.0 L464.0 150.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:1.45s;--dur:0.55s;--len:104;stroke:var(--n-student);stroke-width:2'/>
<polygon points='470.0,150.0 464.0,153.3 464.0,146.7' class='a-pop' style='--d:1.92s;fill:var(--n-student)'/>
<text x='420.0' y='104.0' class='lbl sm mid a-rise' style='--d:1.55s;fill:var(--n-student)'>fix U,</text>
<text x='420.0' y='120.0' class='lbl sm mid a-rise' style='--d:1.60s;fill:var(--n-student)'>estimate</text>
<text x='420.0' y='136.0' class='lbl sm mid a-rise' style='--d:1.65s;fill:var(--n-student)'>the new pair</text>
<rect x='470.0' y='72.0' width='190.0' height='124.0' rx='14' class='box a-pop' style='--d:1.80s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='470.0' y='72.0' width='190.0' height='30.0' rx='14' class=' a-pop' style='--d:1.86s;--dur:0.45s;fill:var(--n-student)'/>
<rect x='470.0' y='88.0' width='190.0' height='14.0' rx='0' class=' a-pop' style='--d:1.86s;--dur:0.45s;fill:var(--n-student)'/>
<text x='565.0' y='92.0' class='lbl on mid a-fade' style='--d:1.92s;fill:var(--n-on-fill)'>project new rows</text>
<text x='565.0' y='130.0' class='lbl sm mid a-rise' style='--d:1.98s;fill:var(--n-ink)'>fit  &#946;,  &#955;  for  s*</text>
<text x='565.0' y='154.0' class='lbl sm mid a-rise' style='--d:2.04s;fill:var(--n-dim)'>the coordinates</text>
<text x='565.0' y='178.0' class='lbl sm mid a-rise' style='--d:2.10s;fill:var(--n-dim)'>are not re-estimated</text>
<path d='M220.0 196.0 L220.0 296.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:2.55s;--dur:0.55s;--len:100;stroke:var(--n-teacher);stroke-width:2'/>
<polygon points='220.0,302.0 223.3,296.0 216.7,296.0' class='a-pop' style='--d:3.02s;fill:var(--n-teacher)'/>
<text x='232.0' y='236.0' class='lbl sm a-rise' style='--d:2.65s;fill:var(--n-teacher)'>fix the pair-side</text>
<text x='232.0' y='252.0' class='lbl sm a-rise' style='--d:2.70s;fill:var(--n-teacher)'>structure, infer a new u</text>
<rect x='170.0' y='302.0' width='190.0' height='124.0' rx='14' class='box a-pop' style='--d:2.90s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='170.0' y='302.0' width='190.0' height='30.0' rx='14' class=' a-pop' style='--d:2.96s;--dur:0.45s;fill:var(--n-teacher)'/>
<rect x='170.0' y='318.0' width='190.0' height='14.0' rx='0' class=' a-pop' style='--d:2.96s;--dur:0.45s;fill:var(--n-teacher)'/>
<text x='265.0' y='322.0' class='lbl on mid a-fade' style='--d:3.02s;fill:var(--n-on-fill)'>infer new columns</text>
<text x='265.0' y='360.0' class='lbl sm mid a-rise' style='--d:3.08s;fill:var(--n-ink)'>locate each new cell</text>
<text x='265.0' y='384.0' class='lbl sm mid a-rise' style='--d:3.14s;fill:var(--n-dim)'>using training genes</text>
<text x='265.0' y='408.0' class='lbl sm mid a-rise' style='--d:3.20s;fill:var(--n-dim)'>only</text>
<path d='M565.0 196.0 L565.0 296.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:3.55s;--dur:0.50s;--len:100;stroke:var(--n-student);stroke-width:2'/>
<polygon points='565.0,302.0 568.3,296.0 561.7,296.0' class='a-pop' style='--d:3.97s;fill:var(--n-student)'/>
<text x='577.0' y='244.0' class='lbl sm a-rise' style='--d:3.62s;fill:var(--n-student)'>carry  &#946;, &#955;</text>
<path d='M360.0 364.0 L464.0 364.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:3.55s;--dur:0.50s;--len:104;stroke:var(--n-teacher);stroke-width:2'/>
<polygon points='470.0,364.0 464.0,367.3 464.0,360.7' class='a-pop' style='--d:3.97s;fill:var(--n-teacher)'/>
<text x='420.0' y='350.0' class='lbl sm mid a-rise' style='--d:3.62s;fill:var(--n-teacher)'>carry  u</text>
<rect x='470.0' y='302.0' width='190.0' height='124.0' rx='14' class='box a-pop' style='--d:3.95s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='470.0' y='302.0' width='190.0' height='30.0' rx='14' class=' a-pop' style='--d:4.01s;--dur:0.45s;fill:var(--n-kept)'/>
<rect x='470.0' y='318.0' width='190.0' height='14.0' rx='0' class=' a-pop' style='--d:4.01s;--dur:0.45s;fill:var(--n-kept)'/>
<text x='565.0' y='322.0' class='lbl on mid a-fade' style='--d:4.07s;fill:var(--n-on-fill)'>evaluate</text>
<text x='565.0' y='360.0' class='lbl sm mid a-rise' style='--d:4.13s;fill:var(--n-ink)'>the new row meets</text>
<text x='565.0' y='384.0' class='lbl sm mid a-rise' style='--d:4.19s;fill:var(--n-dim)'>the new column</text>
<text x='565.0' y='408.0' class='lbl sm mid a-rise' style='--d:4.25s;fill:var(--n-dim)'>nothing is fitted here</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> Donors split top to bottom, cis regions split left to right, and the four blocks are read in the order they appear. The top-left block is the only one that estimates the map. The violet arrow carries $\hat U_{\text{train}}$ to the right and returns $(\hat\beta_{s^\ast},\hat\lambda_{s^\ast})$; the teal arrow carries the pair-side structure downwards and returns $\hat u^{\text{test}}$. They meet in the bottom-right, where nothing new is fitted.</div>
</div>

## What is actually predicted?

The quantity

$$
\hat r_{si}
$$

is an estimated **cis effect per effect allele**. It is not the realized genetic contribution to expression.

For test pair $s=(v,g)$, the held-out donor carries genotype

$$
x_{d(i)v}.
$$

The predicted genotype-dependent component is therefore

$$
\boxed{
\hat h^{\mathrm{gen}}_{ig}
=
x_{d(i)v}E[\hat r_{si}].
}
$$

The expression of the test gene is then used to evaluate this prediction.

The complete flow is

$$
\text{training donors + training genes}
\longrightarrow
\text{reference map},
$$

$$
\text{training donors + test gene}
\longrightarrow
\text{new row},
$$

$$
\text{test donor + training genes}
\longrightarrow
\text{new column},
$$

and finally

$$
\boxed{
\text{test donor + test gene}
\longrightarrow
\text{held-out genetic prediction}.
}
$$

The separation between the last two steps is important. Training genes are allowed to answer

> Where does this new cell lie on the regulotype map?

The test gene is reserved for the different question

> Given that position, can we predict how this allele acts in the cell?

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 330' role='img' aria-label='A left to right flow: a held-out cell is located on the map, combined with a held-out pair to give a cis effect, multiplied by genotype to give a prediction, and only then compared with the observed expression.'>
<text x='115.0' y='32.0' class='lbl mid a-pop' style='--d:0.06s;fill:var(--n-teacher)'>locate the cell</text>
<text x='360.0' y='32.0' class='lbl mid a-pop' style='--d:0.10s;fill:var(--n-student)'>predict the cis effect</text>
<text x='605.0' y='32.0' class='lbl mid a-pop' style='--d:0.14s;fill:var(--n-kept)'>predict the expression</text>
<rect x='20.0' y='54.0' width='190.0' height='252.0' rx='14' class='box a-pop' style='--d:0.08s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='265.0' y='54.0' width='190.0' height='252.0' rx='14' class='box a-pop' style='--d:0.13s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<rect x='510.0' y='54.0' width='190.0' height='252.0' rx='14' class='box a-pop' style='--d:0.18s;--dur:0.55s;fill:var(--n-panel);stroke:var(--n-edge)'/>
<text x='115.0' y='80.0' class='lbl sm mid a-rise' style='--d:0.30s;fill:var(--n-dim)'>training-gene expression</text>
<rect x='43.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.36s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.58)'/>
<rect x='64.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.41s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.29)'/>
<rect x='85.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.46s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<rect x='106.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.51s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.59)'/>
<rect x='127.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.56s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<rect x='148.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.61s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.18)'/>
<rect x='169.0' y='90.0' width='18.0' height='18.0' rx='3' class=' a-pop' style='--d:0.66s;--dur:0.40s;fill:rgba(var(--n-teal-rgb), 0.57)'/>
<rect x='70.0' y='122.0' width='90.0' height='26.0' rx='8' class=' a-pop' style='--d:0.78s;--dur:0.45s;fill:var(--n-data)'/>
<text x='115.0' y='140.0' class='lbl sm on mid a-fade' style='--d:0.86s;fill:var(--n-on-fill)'>genotype  x</text>
<path d='M115.0 154.0 L115.0 176.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:0.95s;--dur:0.45s;--len:22;stroke:var(--n-dim);stroke-width:1.6'/>
<polygon points='115.0,182.0 118.3,176.0 111.7,176.0' class='a-pop' style='--d:1.33s;fill:var(--n-dim)'/>
<rect x='45.0' y='190.0' width='140.0' height='92.0' rx='8' class=' a-pop' style='--d:1.20s;--dur:0.50s;fill:var(--n-panel-2);stroke:var(--n-edge);stroke-width:1.2'/>
<circle cx='76.6' cy='262.8' r='3.2' class='a-pop' style='--d:1.30s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='120.2' cy='265.0' r='3.2' class='a-pop' style='--d:1.32s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='112.3' cy='231.0' r='3.2' class='a-pop' style='--d:1.34s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='149.1' cy='270.9' r='3.2' class='a-pop' style='--d:1.36s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='99.6' cy='269.8' r='3.2' class='a-pop' style='--d:1.38s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='165.6' cy='212.8' r='3.2' class='a-pop' style='--d:1.40s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='127.8' cy='250.8' r='3.2' class='a-pop' style='--d:1.42s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='167.3' cy='247.9' r='3.2' class='a-pop' style='--d:1.44s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='71.7' cy='235.8' r='3.2' class='a-pop' style='--d:1.46s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='114.2' cy='236.0' r='3.2' class='a-pop' style='--d:1.48s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='169.1' cy='225.2' r='3.2' class='a-pop' style='--d:1.50s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='82.4' cy='237.6' r='3.2' class='a-pop' style='--d:1.52s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='131.7' cy='267.6' r='3.2' class='a-pop' style='--d:1.54s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='124.7' cy='219.3' r='3.2' class='a-pop' style='--d:1.56s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='165.7' cy='235.4' r='3.2' class='a-pop' style='--d:1.58s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='135.7' cy='234.3' r='3.2' class='a-pop' style='--d:1.60s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='81.6' cy='249.9' r='3.2' class='a-pop' style='--d:1.62s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='146.9' cy='213.7' r='3.2' class='a-pop' style='--d:1.64s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='110.3' cy='226.1' r='3.2' class='a-pop' style='--d:1.66s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='76.1' cy='215.9' r='3.2' class='a-pop' style='--d:1.68s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='169.6' cy='263.7' r='3.2' class='a-pop' style='--d:1.70s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='101.1' cy='253.2' r='3.2' class='a-pop' style='--d:1.72s;fill:var(--n-dim);opacity:0.42'/>
<circle cx='128.0' cy='226.0' r='9.5' class='a-glow' style='--d:1.95s;--dur:2.20s;fill:var(--n-data);opacity:0.30'/>
<circle cx='128.0' cy='226.0' r='5.4' class='a-pop' style='--d:1.90s;fill:var(--n-data)'/>
<text x='115.0' y='300.0' class='lbl sm mid a-rise' style='--d:2.05s;fill:var(--n-teacher)'>u  &#8211;  where this cell sits</text>
<path d='M212.0 180.0 L257.0 180.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:2.15s;--dur:0.50s;--len:45;stroke:var(--n-dim);stroke-width:1.8'/>
<polygon points='263.0,180.0 257.0,183.3 257.0,176.7' class='a-pop' style='--d:2.57s;fill:var(--n-dim)'/>
<text x='360.0' y='80.0' class='lbl sm mid a-rise' style='--d:2.30s;fill:var(--n-dim)'>the new pair, held fixed</text>
<rect x='300.0' y='92.0' width='50.0' height='30.0' rx='8' class=' a-pop' style='--d:2.40s;--dur:0.45s;fill:var(--n-student)'/>
<text x='325.0' y='112.0' class='lbl on mid a-fade' style='--d:2.48s;fill:var(--n-on-fill)'>&#946;</text>
<rect x='370.0' y='92.0' width='50.0' height='30.0' rx='8' class=' a-pop' style='--d:2.44s;--dur:0.45s;fill:var(--n-student)'/>
<text x='395.0' y='112.0' class='lbl on mid a-fade' style='--d:2.52s;fill:var(--n-on-fill)'>&#955;</text>
<path d='M360.0 130.0 L360.0 152.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:2.60s;--dur:0.42s;--len:22;stroke:var(--n-dim);stroke-width:1.6'/>
<polygon points='360.0,158.0 363.3,152.0 356.7,152.0' class='a-pop' style='--d:2.96s;fill:var(--n-dim)'/>
<text x='360.0' y='184.0' class='lbl bg mid a-pop' style='--d:2.75s;fill:var(--n-ink)'>r  =  &#946;  +  u &#183; &#955;</text>
<rect x='290.0' y='212.0' width='140.0' height='14.0' rx='7' class=' a-fade' style='--d:2.85s;--dur:0.40s;fill:var(--n-panel-2);stroke:var(--n-edge);stroke-width:1.2'/>
<rect x='360.0' y='212.0' width='62.0' height='14.0' rx='7' class=' a-wide' style='--d:2.95s;--dur:0.70s;fill:var(--n-student)'/>
<line x1='360.0' y1='208' x2='360.0' y2='230' class='a-fade' style='--d:2.88s;stroke:var(--n-dim);stroke-width:1.2'/>
<text x='360.0' y='250.0' class='lbl sm mid a-rise' style='--d:3.05s;fill:var(--n-dim)'>the cis effect in this cell</text>
<text x='360.0' y='268.0' class='lbl sm mid a-rise' style='--d:3.10s;fill:var(--n-dim)'>per effect allele</text>
<path d='M457.0 180.0 L502.0 180.0' fill='none' class='a-draw' stroke-linecap='round' style='--d:3.20s;--dur:0.50s;--len:45;stroke:var(--n-dim);stroke-width:1.8'/>
<polygon points='508.0,180.0 502.0,183.3 502.0,176.7' class='a-pop' style='--d:3.62s;fill:var(--n-dim)'/>
<text x='605.0' y='80.0' class='lbl sm mid a-rise' style='--d:3.35s;fill:var(--n-dim)'>&#215;  the donor&#39;s genotype</text>
<text x='605.0' y='116.0' class='lbl bg mid a-pop' style='--d:3.45s;fill:var(--n-ink)'>h  =  x &#183; r</text>
<line x1='530' y1='268.0' x2='680' y2='268.0' class='a-fade' style='--d:3.50s;stroke:var(--n-edge);stroke-width:1.4'/>
<rect x='552.0' y='194.0' width='44.0' height='74.0' rx='4' class=' a-grow' style='--d:3.60s;--dur:0.65s;fill:var(--n-kept)'/>
<text x='574.0' y='286.0' class='lbl sm mid a-rise' style='--d:3.75s;fill:var(--n-kept)'>predicted</text>
<rect x='624.0' y='206.0' width='44.0' height='62.0' rx='4' class=' a-grow' style='--d:4.20s;--dur:0.65s;fill:var(--n-loss)'/>
<text x='646.0' y='286.0' class='lbl sm mid a-rise' style='--d:4.40s;fill:var(--n-loss)'>observed</text>
<path d='M574 186 L574 176 L646 176 L646 198' fill='none' class='a-draw' stroke-linecap='round' style='--d:4.55s;--dur:0.70s;--len:110;stroke:var(--n-dim);stroke-width:1.4'/>
<text x='605.0' y='166.0' class='lbl sm mid a-rise' style='--d:4.75s;fill:var(--n-dim)'>evaluate only here</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> One held-out cell, followed all the way through. Its coordinate-training genes and its donor genotype give $\hat u_i^{\mathrm{test}}$; the held-out pair contributes $(\hat\beta_{s^\ast},\hat\lambda_{s^\ast})$, which were estimated elsewhere and are not touched here; together they give $\hat r_{s^\ast i}$, an effect per effect allele. Multiplying by $x_{d(i)v}$ turns it into $\hat h^{\mathrm{gen}}_{ig}$. The rose bar is the test gene&#39;s measured expression, which enters at the last step and nowhere before it. Illustrative values, not a fitted example.</div>
</div>

## Summary

The simplest way for me to remember the training and testing mechanism is to think about extending $R$.

* Training donors and coordinate-training genes estimate the reference $R$.
* A new variant–gene pair is projected with $U$ fixed and becomes a **new row**.
* A cell from a new donor is located using coordinate-training genes and becomes a **new column**.
* The new row and new column meet in the test-donor × test-gene block.
* Their intersection gives a predicted cell-resolved cis effect,
  $$
  \hat r_{si}.
  $$
* Combining this effect with the held-out donor's genotype gives the predicted genetic component,
  $$
  \hat h^{\mathrm{gen}}_{ig}.
  $$
* Test-gene expression is kept out of the preceding steps and used to evaluate the prediction.

Or, visually,

$$
\boxed{
\begin{array}{c|cc}
&
\text{training genes}
&
\text{test genes}
\\
\hline
\text{training donors}
&
\text{learn }R
&
\text{add rows}
\\
\text{test donors}
&
\text{add columns}
&
\text{evaluate}
\end{array}
}
$$

This gives the scaffold for everything that comes next. Before asking whether the estimated regulotype map is biologically interesting, the first task is to make sure that the mathematics and implementation producing each part of this diagram are correct.

## Sources

- Strober *et al.* SURGE: uncovering context-specific genetic-regulation of gene expression from single-cell RNA sequencing using latent-factor models. *Genome Biol* **25**, 28 (2024). [doi:10.1186/s13059-023-03152-z](https://doi.org/10.1186/s13059-023-03152-z)
- Denault *et al.* Covariate-moderated empirical Bayes matrix factorization. *NeurIPS* **38** (2025). [doi:10.52202/085713-1573](https://doi.org/10.52202/085713-1573)
- Cuomo *et al.* CellRegMap: a statistical framework for mapping context-specific regulatory variants using scRNA-seq. *Mol Syst Biol* **18**, e10663 (2022). [doi:10.15252/msb.202110663](https://doi.org/10.15252/msb.202110663)
