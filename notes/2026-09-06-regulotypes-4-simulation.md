---
title: 'Regulotypes Note 4 Validation: when do we recover the right map?'
subtitle: Simulation is the only setting where the true cell-resolved cis-effect matrix is known. It lets us ask not whether the code is correct, but whether the estimated map is.
date: 2026-09-06
tags: regulotype
keywords: regulotype, simulation study, null calibration, effect recovery, regulotype distances, nearest-neighbour recovery, estimability, rotation invariance, covariate-moderated priors, cell-resolved cis effects
---

<div class='nfig wide roadmap'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 412' role='img' aria-label='The eight sections of this note.'>
<text x='14.0' y='192.0' class='lbl bg a-pop' style='--d:0.00s;fill:var(--n-student)'>Recover</text>
<text x='14.0' y='214.0' class='lbl bg a-pop' style='--d:0.08s;fill:var(--n-student)'>the map</text>
<path d='M138 47.0 C134.7 47.0, 134.7 206.0, 116 206.0 C134.7 206.0, 134.7 355.0, 138 355.0' fill='none' class='a-draw' stroke-linecap='round' stroke-linejoin='round' style='--d:0.22s;--dur:0.90s;stroke:var(--n-student);stroke-width:2.4'/>
<a href='#start-with-the-null' class='rm-row'>
<rect x='128' y='30.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='47.0' r='4.0' class='a-beat' style='--d:0.45s;--dur:2.00s;fill:var(--n-data)'/>
<text x='164.0' y='52.0' class='lbl a-rise' style='--d:0.45s;fill:var(--n-data)'>Start with the null</text>
<text x='704.0' y='52.0' class='lbl sm end a-rise' style='--d:0.55s;fill:var(--n-dim)'>no cellular heterogeneity, by construction</text>
</a>
<a href='#recover-the-cell-resolved-effects' class='rm-row'>
<rect x='128' y='74.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='91.0' r='4.0' class='a-beat' style='--d:0.53s;--dur:2.00s;fill:var(--n-student)'/>
<text x='164.0' y='96.0' class='lbl a-rise' style='--d:0.53s;fill:var(--n-student)'>Recover the cell-resolved effects</text>
<text x='704.0' y='96.0' class='lbl sm end a-rise' style='--d:0.63s;fill:var(--n-dim)'>the matrix itself, and its two parts</text>
</a>
<a href='#recover-the-geometry-of-the-cells' class='rm-row'>
<rect x='128' y='118.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='135.0' r='4.0' class='a-beat' style='--d:0.61s;--dur:2.00s;fill:var(--n-teacher)'/>
<text x='164.0' y='140.0' class='lbl a-rise' style='--d:0.61s;fill:var(--n-teacher)'>Recover the geometry of the cells</text>
<text x='704.0' y='140.0' class='lbl sm end a-rise' style='--d:0.71s;fill:var(--n-dim)'>distances, and who stays a neighbour</text>
</a>
<a href='#do-not-make-u-the-primary-target' class='rm-row'>
<rect x='128' y='162.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='179.0' r='4.0' class='a-beat' style='--d:0.69s;--dur:2.00s;fill:var(--n-pruned)'/>
<text x='164.0' y='184.0' class='lbl a-rise' style='--d:0.69s;fill:var(--n-pruned)'>Do not make U the primary target</text>
<text x='704.0' y='184.0' class='lbl sm end a-rise' style='--d:0.79s;fill:var(--n-dim)'>why factor-wise error is not defined</text>
</a>
<a href='#when-should-recovery-become-possible' class='rm-row'>
<rect x='128' y='206.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='223.0' r='4.0' class='a-beat' style='--d:0.77s;--dur:2.00s;fill:var(--n-kept)'/>
<text x='164.0' y='228.0' class='lbl a-rise' style='--d:0.77s;fill:var(--n-kept)'>When should recovery become possible?</text>
<text x='704.0' y='228.0' class='lbl sm end a-rise' style='--d:0.87s;fill:var(--n-dim)'>donors, reference pairs, signal</text>
</a>
<a href='#does-expression-have-to-agree-with-the-regulotype' class='rm-row'>
<rect x='128' y='250.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='267.0' r='4.0' class='a-beat' style='--d:0.85s;--dur:2.00s;fill:var(--n-loss)'/>
<text x='164.0' y='272.0' class='lbl a-rise' style='--d:0.85s;fill:var(--n-loss)'>Does expression have to agree with the regulotype?</text>
<text x='704.0' y='272.0' class='lbl sm end a-rise' style='--d:0.95s;fill:var(--n-dim)'>two estimands</text>
</a>
<a href='#what-do-the-empirical-bayes-features-contribute' class='rm-row'>
<rect x='128' y='294.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='311.0' r='4.0' class='a-beat' style='--d:0.93s;--dur:2.00s;fill:var(--n-data)'/>
<text x='164.0' y='316.0' class='lbl a-rise' style='--d:0.93s;fill:var(--n-data)'>What do the empirical-Bayes features contribute?</text>
<text x='704.0' y='316.0' class='lbl sm end a-rise' style='--d:1.03s;fill:var(--n-dim)'>does the prior learn?</text>
</a>
<a href='#summary' class='rm-row'>
<rect x='128' y='338.0' width='576' height='34.0' rx='8' fill='transparent'/>
<circle cx='148.0' cy='355.0' r='4.0' class='a-beat' style='--d:1.01s;--dur:2.00s;fill:var(--n-student)'/>
<text x='164.0' y='360.0' class='lbl a-rise' style='--d:1.01s;fill:var(--n-student)'>Summary</text>
<text x='704.0' y='360.0' class='lbl sm end a-rise' style='--d:1.11s;fill:var(--n-dim)'>what would count as convincing</text>
</a>
</svg>
</div>

Simulation gives us something real data never will: the true cell-resolved cis-effect matrix. This makes it the cleanest place to ask whether an estimated regulotype map is actually correct.

The implementation checks in the [previous note](/notes/2026/09/05/regulotypes-3-validation/) ask whether the code performs the mathematics we intended. That is necessary, but a perfectly implemented method can still estimate the wrong object when the data are noisy or weakly informative.

That note called those checks **Level 0**, and named two levels above them: simulation recovery, where ground truth exists by construction, and held-out generalization, where it does not. This note is **Level 1**, and the gap between the two is worth stating plainly, because they fail in different ways and are repaired by different things.

* A **Level 0** failure is a bug. Something in the program is not the estimator we wrote down, and the repair is in the code.
* A **Level 1** failure need not be a bug at all. The estimator can be exactly right and still land far from the truth because the data do not contain enough information to locate it. The repair is then more donors, more reference pairs, a stronger signal &#8212; or a narrower claim.

The two are easy to confuse in one direction in particular: a Level 0 defect can produce attractive simulation results, and a correct implementation can produce disappointing ones. Only Level 0 evidence separates them, which is why it comes first.

Level 2 &#8212; everything in the [train and test note](/notes/2026/09/05/regulotypes-2-train-test/), projecting a new cis pair onto the map, locating a cell from a held-out donor, predicting in the corner where both are new &#8212; is *indirect*, because $R^{\mathrm{true}}$ is never observed in real data. Held-out prediction can say that the map is useful. It cannot say that the map is right.

Simulation lets us move to the next question.

For reference pair $s$ and cell $i$,

$$
r_{si}^{\mathrm{true}}
=
\beta_s^{\mathrm{true}}
+
(u_i^{\mathrm{true}})^{\mathsf T}
\lambda_s^{\mathrm{true}},
$$

so the generator gives us

$$
R^{\mathrm{true}}
=
\beta^{\mathrm{true}}\mathbf 1^{\mathsf T}
+
\Lambda^{\mathrm{true}}
(U^{\mathrm{true}})^{\mathsf T}.
$$

After fitting the model, we get $\hat R$. The central simulation question is therefore simple:

$$
\boxed{\hat R \stackrel{?}{\approx} R^{\mathrm{true}}.}
$$

The interesting part is deciding what &#8220;approximately&#8221; should mean.

| symbol | meaning |
| --- | --- |
| $R^{\mathrm{true}}$, $\hat R$ | the $S\times I$ cell-resolved effect matrix, as generated and as estimated |
| $\beta^{\mathrm{true}}$, $\Lambda^{\mathrm{true}}$, $U^{\mathrm{true}}$ | the generating average effects, loadings and cellular coordinates |
| $K$ | the true rank; $K=0$ is the null |
| $w_i$ | the genotype-independent expression state of cell $i$ |
| $\xi^{(u)}_{ik}$, $\xi^{(\lambda)}_{sk}$ | whether cell $i$ and pair $s$ participate in factor $k$ |
| $d_R(i,i')$ | the regulotype distance between two cells under a matrix $R$ |

One caveat sits underneath all of it. A simulation drawn from the model's own assumptions can only establish that the estimator is self-consistent; it says nothing about what happens when those assumptions are wrong. So the regimes below should not all be well-specified ones. Heavier-tailed noise than the model assumes, a truth that is dense where the prior expects sparsity, cellular structure that enters expression without entering the cis effects &#8212; each of these belongs in the same harness, run with the same metrics, precisely because the model does not cover them.

## Start with the null

The first simulation should contain no cellular heterogeneity in cis effects.

Set

$$
\lambda_{sk}^{\mathrm{true}}=0
$$

for every pair $s$ and factor $k$. Then

$$
r_{si}^{\mathrm{true}}=\beta_s^{\mathrm{true}}
$$

for every cell. The rows of $R^{\mathrm{true}}$ may have different average effects, but within a row every cell has the same effect.

This is a deliberately generous null. The data still contain everything except the thing being tested: donors still differ genetically, genes still differ in average effect, cells still differ in expression, and the residual and donor variances are still there to be soaked up. Only the interaction is absent. If a cellular map appears anyway, it did not come from the phenomenon we are claiming to measure.

A flexible latent model should not turn this into a structured cellular map.

I would inspect three quantities:

* the estimated cell-specific deviations
  $$
  \hat r_{si}-\hat\beta_s;
  $$
* the fitted regulotype distances
  $$
  d_{\hat R}(i,i');
  $$
* the improvement of $K>0$ over the matched $K=0$ model.

The three are not redundant. The first can be small on average while a handful of pairs carry large spurious deviations. The second is what any downstream clustering or reclassification would actually see. The third is the only one that asks whether the extra factor *bought* anything, and it should be judged out of sample: an added factor almost always improves in-sample fit, so an in-sample comparison is not a null test at all.

Under the null, all three should remain small. This is a calibration question, not a power question: when there is no response-defined cellular structure, the method should not manufacture one.

Two things make this harder than it sounds, and both are unsettled rather than solved.

* **Whatever decides to keep a factor is the null test.** Sequential factor addition stops on a rule, and any such rule carries a constant &#8212; a threshold on the gain in the objective, a held-out criterion, or both. Under the null that constant is the only thing standing between noise and a published map, so it has to be chosen before the null is run, not tuned until the null looks clean.
* **Over-selecting rank and retaining a false factor are different failures.** A run can choose too many factors while none of them is spurious in the sense that matters, and a run can retain a single factor that is entirely noise. They need not respond the same way to a threshold, or to sample size. Reporting them as one number hides which one is happening.

For that reason the null has to be run at more than one $(D,S)$, and the retention rate reported as a function of dimension. A false-positive rate that is acceptable at one size and does not fall as the data grow is a different, and worse, finding than a rate that simply starts too high.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 348' role='img' aria-label='Two histograms, each comparing a null simulation against a low-rank signal simulation of the same size.'>
<text x='360.0' y='34.0' class='lbl bg mid a-pop' style='--d:0.00s;fill:var(--n-ink)'>the same two quantities, under a null and under a low&#8209;rank signal</text>
<text x='195.0' y='64.0' class='lbl mid a-rise' style='--d:0.10s;fill:var(--n-ink)'>within&#8209;pair effect variation</text>
<rect x='56.0' y='233.4' width='18.0' height='16.6' rx='2' class='a-grow' style='--d:0.55s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='76.0' y='213.5' width='18.0' height='36.5' rx='2' class='a-grow' style='--d:0.59s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='96.0' y='183.6' width='18.0' height='66.4' rx='2' class='a-grow' style='--d:0.62s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='116.0' y='147.1' width='18.0' height='102.9' rx='2' class='a-grow' style='--d:0.66s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='136.0' y='108.9' width='18.0' height='141.1' rx='2' class='a-grow' style='--d:0.69s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='156.0' y='84.0' width='18.0' height='166.0' rx='2' class='a-grow' style='--d:0.73s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='176.0' y='92.3' width='18.0' height='157.7' rx='2' class='a-grow' style='--d:0.76s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='196.0' y='120.5' width='18.0' height='129.5' rx='2' class='a-grow' style='--d:0.80s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='216.0' y='153.7' width='18.0' height='96.3' rx='2' class='a-grow' style='--d:0.83s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='236.0' y='183.6' width='18.0' height='66.4' rx='2' class='a-grow' style='--d:0.87s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='256.0' y='206.8' width='18.0' height='43.2' rx='2' class='a-grow' style='--d:0.90s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='276.0' y='225.1' width='18.0' height='24.9' rx='2' class='a-grow' style='--d:0.94s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='296.0' y='236.7' width='18.0' height='13.3' rx='2' class='a-grow' style='--d:0.97s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='316.0' y='243.4' width='18.0' height='6.6' rx='2' class='a-grow' style='--d:1.01s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='59.0' y='84.0' width='12.0' height='166.0' rx='2' class='a-grow' style='--d:0.25s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='79.0' y='107.2' width='12.0' height='142.8' rx='2' class='a-grow' style='--d:0.29s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='99.0' y='147.1' width='12.0' height='102.9' rx='2' class='a-grow' style='--d:0.32s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='119.0' y='183.6' width='12.0' height='66.4' rx='2' class='a-grow' style='--d:0.35s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='139.0' y='210.2' width='12.0' height='39.8' rx='2' class='a-grow' style='--d:0.39s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='159.0' y='228.4' width='12.0' height='21.6' rx='2' class='a-grow' style='--d:0.43s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='179.0' y='238.4' width='12.0' height='11.6' rx='2' class='a-grow' style='--d:0.46s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='199.0' y='245.0' width='12.0' height='5.0' rx='2' class='a-grow' style='--d:0.49s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='219.0' y='246.7' width='12.0' height='3.3' rx='2' class='a-grow' style='--d:0.53s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='239.0' y='248.3' width='12.0' height='1.7' rx='2' class='a-grow' style='--d:0.57s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<line x1='50.0' y1='250.0' x2='340.0' y2='250.0' class='' style='--d:0.20s;stroke:var(--n-edge);stroke-width:1.4'/>
<text x='52.0' y='270.0' class='lbl sm a-rise' style='--d:1.30s;fill:var(--n-dim)'>0</text>
<text x='338.0' y='270.0' class='lbl sm end a-rise' style='--d:1.30s;fill:var(--n-dim)'>larger</text>
<text x='539.0' y='64.0' class='lbl mid a-rise' style='--d:0.16s;fill:var(--n-ink)'>pairwise regulotype distance</text>
<rect x='400.0' y='241.7' width='18.0' height='8.3' rx='2' class='a-grow' style='--d:0.85s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='420.0' y='226.8' width='18.0' height='23.2' rx='2' class='a-grow' style='--d:0.89s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='440.0' y='200.2' width='18.0' height='49.8' rx='2' class='a-grow' style='--d:0.92s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='460.0' y='163.7' width='18.0' height='86.3' rx='2' class='a-grow' style='--d:0.96s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='480.0' y='127.2' width='18.0' height='122.8' rx='2' class='a-grow' style='--d:0.99s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='500.0' y='97.3' width='18.0' height='152.7' rx='2' class='a-grow' style='--d:1.03s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='520.0' y='84.0' width='18.0' height='166.0' rx='2' class='a-grow' style='--d:1.06s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='540.0' y='94.0' width='18.0' height='156.0' rx='2' class='a-grow' style='--d:1.09s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='560.0' y='117.2' width='18.0' height='132.8' rx='2' class='a-grow' style='--d:1.13s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='580.0' y='147.1' width='18.0' height='102.9' rx='2' class='a-grow' style='--d:1.17s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='600.0' y='177.0' width='18.0' height='73.0' rx='2' class='a-grow' style='--d:1.20s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='620.0' y='203.5' width='18.0' height='46.5' rx='2' class='a-grow' style='--d:1.24s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='640.0' y='223.4' width='18.0' height='26.6' rx='2' class='a-grow' style='--d:1.27s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='660.0' y='236.7' width='18.0' height='13.3' rx='2' class='a-grow' style='--d:1.31s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<rect x='403.0' y='84.0' width='12.0' height='166.0' rx='2' class='a-grow' style='--d:0.55s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='423.0' y='133.8' width='12.0' height='116.2' rx='2' class='a-grow' style='--d:0.58s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='443.0' y='180.3' width='12.0' height='69.7' rx='2' class='a-grow' style='--d:0.62s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='463.0' y='213.5' width='12.0' height='36.5' rx='2' class='a-grow' style='--d:0.66s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='483.0' y='233.4' width='12.0' height='16.6' rx='2' class='a-grow' style='--d:0.69s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='503.0' y='241.7' width='12.0' height='8.3' rx='2' class='a-grow' style='--d:0.73s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='523.0' y='246.7' width='12.0' height='3.3' rx='2' class='a-grow' style='--d:0.76s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<rect x='543.0' y='248.3' width='12.0' height='1.7' rx='2' class='a-grow' style='--d:0.79s;--dur:0.60s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-kept)'/>
<line x1='394.0' y1='250.0' x2='684.0' y2='250.0' class='' style='--d:0.50s;stroke:var(--n-edge);stroke-width:1.4'/>
<text x='396.0' y='270.0' class='lbl sm a-rise' style='--d:1.30s;fill:var(--n-dim)'>0</text>
<text x='682.0' y='270.0' class='lbl sm end a-rise' style='--d:1.30s;fill:var(--n-dim)'>larger</text>
<rect x='268.0' y='296.0' width='14.0' height='10.0' rx='2' class='a-pop' style='--d:1.45s;fill:var(--n-kept)'/>
<text x='288.0' y='305.0' class='lbl sm a-rise' style='--d:1.45s;fill:var(--n-kept)'>null: every loading set to zero</text>
<rect x='268.0' y='316.0' width='14.0' height='10.0' rx='2' class='a-pop' style='--d:1.55s;fill:rgba(var(--n-violet-rgb), 0.42)'/>
<text x='288.0' y='325.0' class='lbl sm a-rise' style='--d:1.55s;fill:var(--n-student)'>low&#8209;rank signal, same size</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 1.</span> Under the null every cell in a row carries the same effect, so both quantities should pile up against zero &#8212; the sage distribution &#8212; while the same experiment run with a genuine rank&#8209;two signal spreads out. The failure to look for is a sage distribution that has drifted rightwards: cellular structure the model has invented rather than found. Schematic shapes, drawn to show what is being compared; they are not measured distributions.</div>
</div>

## Recover the cell-resolved effects

Under a signal simulation, the most direct target is the matrix itself.

For every pair-cell combination, compare

$$
\hat r_{si}
$$

with

$$
r_{si}^{\mathrm{true}}.
$$

A simple global error is

$$
\sqrt{
\frac{1}{SI}
\sum_{s=1}^{S}\sum_{i=1}^{I}
(\hat r_{si}-r_{si}^{\mathrm{true}})^2
}.
$$

Because genes can have different phenotype scales, I would also report the standardized error used by the regulotype distance, or an NRMSE that makes simulation settings comparable. Without normalisation, an error of a given size means something different in a gene with a large dynamic range than in a quiet one, and a grid of simulation settings cannot be read down a column.

There is a trap in this metric that is worth naming, because it points the wrong way rather than merely being imprecise. The matrix has two parts,

$$
R
=
\underbrace{\beta\mathbf 1^{\mathsf T}}_{\text{average effect}}
+
\underbrace{\Lambda U^{\mathsf T}}_{\text{contextual}},
$$

and in most realistic settings the first dominates the second in magnitude. Every comparator recovers the first, including the $K=0$ average-effect model that has no cellular map at all. So an error computed over the whole of $R$ is largely an error in $\beta$, and a fit that recovers *nothing* contextual can score better than one that recovers a real fraction of it, simply by estimating the average effects a little more stably.

The remedy is cheap: report the error in

$$
R-\beta\mathbf 1^{\mathsf T}
$$

beside the error in $R$, always, and treat any disagreement in their ordering as the finding rather than as noise. The contextual part is the entire claim of the method; it should be scored on its own.

A scatterplot of

$$
r_{si}^{\mathrm{true}}
\quad\text{versus}\quad
\hat r_{si}
$$

is useful, but it should not be the only result. A large matrix can have good global correlation while still placing some cells in the wrong neighborhoods.

This leads to the more important map-level check.

## Recover the geometry of the cells

The regulotype of cell $i$ is the column $R_{:i}$. If the goal is to organize cells by genetic response, then the relationships between columns matter directly.

For two cells $i$ and $i'$, our default distance is

$$
d_R(i,i')
=
\frac{1}{S}
\sum_{s=(v,g)}
\left(
\frac{
E[r_{si}]-E[r_{si'}]
}{s_g}
\right)^2,
$$

where $s_g$ is the scale of the molecular phenotype for gene $g$.

Note what this is not. It is not Euclidean distance between raw columns of $R$: each pair is divided by a per-gene scale before the difference is squared, and the sum is averaged over pairs rather than accumulated, so reference sets of different sizes remain comparable. It is also a quantity on posterior means, so a cell whose coordinate is poorly determined does not automatically appear far from everything.

What $s_g$ binds to is a live question rather than a detail. If it is a fixed property of the gene, distances computed in two different training partitions are on the same scale and can be compared directly. If it is fitted inside each partition, they are not, and a stability analysis that compares maps across partitions is then partly measuring the scaling rather than the map. That is a decision to make explicitly before any distance is computed, not one to discover afterwards.

In simulation we can compute both

$$
d_{R^{\mathrm{true}}}(i,i')
$$

and

$$
d_{\hat R}(i,i').
$$

I would compare them in three ways:

* correlation between true and estimated pairwise distances;
* error in the distance matrix;
* preservation of local neighborhoods, for example the fraction of true nearest regulotype neighbors recovered by $\hat R$.

They tighten in that order. A rank correlation over all pairs is dominated by the easy comparisons &#8212; cells at opposite ends of the map &#8212; and stays high even when the fine structure is wrong. An error in the distance matrix is stricter but still global. Neighbourhood recovery is local and unforgiving, and it is the only one of the three that degrades when a small number of cells are badly misplaced.

Distances have one more property that the raw factors do not: they are invariant to how the factorisation happens to be oriented. That is what makes them a legitimate target, and it is the subject of the next section.

The third metric is especially intuitive if the eventual use of $R$ is cellular reclassification. It asks whether cells that truly have similar genetic responses remain neighbors after estimation.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 530' role='img' aria-label='Two scatterplots comparing estimated with true effects and distances, and two small maps of the same cells placed by true and by estimated distances.'>
<text x='168.0' y='44.0' class='lbl bg mid a-pop' style='--d:0.00s;fill:var(--n-ink)'>A &#183; effect recovery</text>
<line x1='78.0' y1='250.0' x2='258.0' y2='250.0' class='' style='--d:0.10s;stroke:var(--n-edge);stroke-width:1.4'/>
<line x1='78.0' y1='70.0' x2='78.0' y2='250.0' class='' style='--d:0.10s;stroke:var(--n-edge);stroke-width:1.4'/>
<line x1='78.0' y1='250.0' x2='258.0' y2='70.0' class='a-draw' style='--d:0.30s;--dur:0.80s;stroke:var(--n-dim);stroke-width:1.2;opacity:0.55;stroke-dasharray:5 5'/>
<circle cx='159.4' cy='197.1' r='3.2' class='a-pop' style='--d:0.45s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='161.8' cy='177.4' r='3.2' class='a-pop' style='--d:0.47s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='169.4' cy='165.9' r='3.2' class='a-pop' style='--d:0.49s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='170.1' cy='162.4' r='3.2' class='a-pop' style='--d:0.52s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='191.4' cy='135.0' r='3.2' class='a-pop' style='--d:0.54s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='132.6' cy='201.2' r='3.2' class='a-pop' style='--d:0.56s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='94.3' cy='226.1' r='3.2' class='a-pop' style='--d:0.58s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='85.5' cy='246.4' r='3.2' class='a-pop' style='--d:0.60s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='254.8' cy='73.6' r='3.2' class='a-pop' style='--d:0.63s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='188.8' cy='143.5' r='3.2' class='a-pop' style='--d:0.65s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='106.3' cy='205.2' r='3.2' class='a-pop' style='--d:0.67s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='88.7' cy='237.7' r='3.2' class='a-pop' style='--d:0.69s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='112.2' cy='215.6' r='3.2' class='a-pop' style='--d:0.71s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='161.5' cy='163.2' r='3.2' class='a-pop' style='--d:0.74s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='157.3' cy='161.7' r='3.2' class='a-pop' style='--d:0.76s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='193.3' cy='148.4' r='3.2' class='a-pop' style='--d:0.78s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='168.0' cy='167.8' r='3.2' class='a-pop' style='--d:0.80s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='128.1' cy='212.7' r='3.2' class='a-pop' style='--d:0.82s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='257.6' cy='73.6' r='3.2' class='a-pop' style='--d:0.85s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='205.4' cy='123.3' r='3.2' class='a-pop' style='--d:0.87s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='134.7' cy='191.8' r='3.2' class='a-pop' style='--d:0.89s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='90.6' cy='226.3' r='3.2' class='a-pop' style='--d:0.91s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='215.9' cy='133.3' r='3.2' class='a-pop' style='--d:0.93s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='147.6' cy='165.1' r='3.2' class='a-pop' style='--d:0.96s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='250.4' cy='77.3' r='3.2' class='a-pop' style='--d:0.98s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='115.7' cy='212.6' r='3.2' class='a-pop' style='--d:1.00s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='241.8' cy='123.3' r='3.2' class='a-pop' style='--d:1.02s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='149.5' cy='171.4' r='3.2' class='a-pop' style='--d:1.04s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='91.1' cy='246.4' r='3.2' class='a-pop' style='--d:1.07s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='126.6' cy='218.5' r='3.2' class='a-pop' style='--d:1.09s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='93.7' cy='246.4' r='3.2' class='a-pop' style='--d:1.11s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='214.4' cy='83.3' r='3.2' class='a-pop' style='--d:1.13s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='99.2' cy='228.6' r='3.2' class='a-pop' style='--d:1.15s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='88.8' cy='233.0' r='3.2' class='a-pop' style='--d:1.18s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<text x='168.0' y='272.0' class='lbl sm mid a-rise' style='--d:1.25s;fill:var(--n-dim)'>true effect</text>
<text x='74.0' y='62.0' class='lbl sm a-rise' style='--d:1.25s;fill:var(--n-dim)'>estimated</text>
<text x='518.0' y='44.0' class='lbl bg mid a-pop' style='--d:0.05s;fill:var(--n-ink)'>B &#183; distance recovery</text>
<line x1='428.0' y1='250.0' x2='608.0' y2='250.0' class='' style='--d:0.14s;stroke:var(--n-edge);stroke-width:1.4'/>
<line x1='428.0' y1='70.0' x2='428.0' y2='250.0' class='' style='--d:0.14s;stroke:var(--n-edge);stroke-width:1.4'/>
<line x1='428.0' y1='250.0' x2='608.0' y2='70.0' class='a-draw' style='--d:0.34s;--dur:0.80s;stroke:var(--n-dim);stroke-width:1.2;opacity:0.55;stroke-dasharray:5 5'/>
<circle cx='571.5' cy='119.6' r='3.2' class='a-pop' style='--d:0.50s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='508.5' cy='165.4' r='3.2' class='a-pop' style='--d:0.52s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='462.3' cy='215.3' r='3.2' class='a-pop' style='--d:0.54s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='543.9' cy='153.0' r='3.2' class='a-pop' style='--d:0.57s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='449.0' cy='231.6' r='3.2' class='a-pop' style='--d:0.59s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='476.6' cy='199.7' r='3.2' class='a-pop' style='--d:0.61s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='602.8' cy='96.7' r='3.2' class='a-pop' style='--d:0.63s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='587.3' cy='120.2' r='3.2' class='a-pop' style='--d:0.65s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='465.9' cy='227.0' r='3.2' class='a-pop' style='--d:0.68s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='543.5' cy='136.1' r='3.2' class='a-pop' style='--d:0.70s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='446.1' cy='221.1' r='3.2' class='a-pop' style='--d:0.72s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='474.5' cy='205.1' r='3.2' class='a-pop' style='--d:0.74s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='567.1' cy='132.7' r='3.2' class='a-pop' style='--d:0.76s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='441.2' cy='224.7' r='3.2' class='a-pop' style='--d:0.79s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='444.2' cy='235.9' r='3.2' class='a-pop' style='--d:0.81s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='536.2' cy='157.7' r='3.2' class='a-pop' style='--d:0.83s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='494.9' cy='211.9' r='3.2' class='a-pop' style='--d:0.85s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='515.1' cy='164.1' r='3.2' class='a-pop' style='--d:0.87s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='531.4' cy='153.8' r='3.2' class='a-pop' style='--d:0.90s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='455.7' cy='224.7' r='3.2' class='a-pop' style='--d:0.92s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='591.5' cy='105.6' r='3.2' class='a-pop' style='--d:0.94s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='462.2' cy='221.6' r='3.2' class='a-pop' style='--d:0.96s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='561.1' cy='127.6' r='3.2' class='a-pop' style='--d:0.98s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='599.0' cy='105.0' r='3.2' class='a-pop' style='--d:1.01s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='586.8' cy='120.8' r='3.2' class='a-pop' style='--d:1.03s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='446.7' cy='233.7' r='3.2' class='a-pop' style='--d:1.05s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='435.0' cy='230.0' r='3.2' class='a-pop' style='--d:1.07s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='554.8' cy='140.5' r='3.2' class='a-pop' style='--d:1.09s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='474.3' cy='198.9' r='3.2' class='a-pop' style='--d:1.12s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='480.8' cy='211.4' r='3.2' class='a-pop' style='--d:1.14s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='459.6' cy='217.6' r='3.2' class='a-pop' style='--d:1.16s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='469.1' cy='212.8' r='3.2' class='a-pop' style='--d:1.18s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='528.7' cy='152.0' r='3.2' class='a-pop' style='--d:1.20s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<circle cx='478.4' cy='212.4' r='3.2' class='a-pop' style='--d:1.23s;fill:rgba(var(--n-teal-rgb), 0.78)'/>
<text x='518.0' y='272.0' class='lbl sm mid a-rise' style='--d:1.30s;fill:var(--n-dim)'>true distance</text>
<text x='424.0' y='62.0' class='lbl sm a-rise' style='--d:1.30s;fill:var(--n-dim)'>estimated</text>
<text x='360.0' y='316.0' class='lbl bg mid a-pop' style='--d:0.90s;fill:var(--n-ink)'>C &#183; the same cells, placed by the true map and by the estimated map</text>
<rect x='80.0' y='340.0' width='240.0' height='150.0' rx='8' class='box a-fade' style='--d:0.95s;--dur:0.50s'/>
<text x='200.0' y='510.0' class='lbl sm mid a-rise' style='--d:1.05s;fill:var(--n-teacher)'>true regulotype distances</text>
<circle cx='129.3' cy='390.6' r='4.0' class='a-pop' style='--d:1.15s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='145.9' cy='408.9' r='4.0' class='a-pop' style='--d:1.20s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='158.4' cy='380.8' r='4.0' class='a-pop' style='--d:1.25s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='135.5' cy='429.6' r='4.0' class='a-pop' style='--d:1.30s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='181.3' cy='397.9' r='3.6' class='a-pop' style='--d:1.35s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='204.2' cy='439.4' r='3.6' class='a-pop' style='--d:1.40s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='220.8' cy='417.4' r='3.6' class='a-pop' style='--d:1.45s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='237.4' cy='449.2' r='3.6' class='a-pop' style='--d:1.50s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='249.9' cy='405.2' r='3.6' class='a-pop' style='--d:1.55s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='268.6' cy='429.6' r='3.6' class='a-pop' style='--d:1.60s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='191.7' cy='371.1' r='3.6' class='a-pop' style='--d:1.65s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='225.0' cy='378.4' r='3.6' class='a-pop' style='--d:1.70s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='279.0' cy='390.6' r='3.6' class='a-pop' style='--d:1.75s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='170.9' cy='454.0' r='4.4' class='a-pop' style='--d:1.80s;fill:var(--n-loss)'/>
<ellipse cx='142.8' cy='404.6' rx='34' ry='32' fill='none' class='a-draw' stroke-linecap='round' style='--d:2.10s;--dur:0.90s;stroke:var(--n-teacher);stroke-width:1.6;opacity:0.7;stroke-dasharray:4 5'/>
<rect x='400.0' y='340.0' width='240.0' height='150.0' rx='8' class='box a-fade' style='--d:1.01s;--dur:0.50s'/>
<text x='520.0' y='510.0' class='lbl sm mid a-rise' style='--d:1.11s;fill:var(--n-student)'>estimated regulotype distances</text>
<circle cx='453.4' cy='393.0' r='4.0' class='a-pop' style='--d:1.50s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='461.8' cy='405.2' r='4.0' class='a-pop' style='--d:1.55s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='484.6' cy='379.6' r='4.0' class='a-pop' style='--d:1.60s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='457.6' cy='426.0' r='4.0' class='a-pop' style='--d:1.65s;fill:rgba(var(--n-teal-rgb), 0.85)'/>
<circle cx='495.0' cy='400.4' r='3.6' class='a-pop' style='--d:1.70s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='528.3' cy='435.7' r='3.6' class='a-pop' style='--d:1.75s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='536.6' cy='421.1' r='3.6' class='a-pop' style='--d:1.80s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='563.7' cy='450.4' r='3.6' class='a-pop' style='--d:1.85s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='567.8' cy='402.8' r='3.6' class='a-pop' style='--d:1.90s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='592.8' cy='433.3' r='3.6' class='a-pop' style='--d:1.95s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='507.5' cy='369.9' r='3.6' class='a-pop' style='--d:2.00s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='547.0' cy='380.8' r='3.6' class='a-pop' style='--d:2.05s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='592.8' cy='388.2' r='3.6' class='a-pop' style='--d:2.10s;fill:rgba(var(--n-violet-rgb), 0.52)'/>
<circle cx='561.6' cy='419.9' r='4.4' class='a-pop' style='--d:2.15s;fill:var(--n-loss)'/>
<ellipse cx='464.8' cy='404.6' rx='34' ry='32' fill='none' class='a-draw' stroke-linecap='round' style='--d:2.30s;--dur:0.90s;stroke:var(--n-teacher);stroke-width:1.6;opacity:0.7;stroke-dasharray:4 5'/>
<text x='360.0' y='420.0' class='lbl bg mid a-rise' style='--d:2.10s;fill:var(--n-dim)'>&#8594;</text>
</svg>
<div class='caption'><span class='caption-label'>Figure 2.</span> Panel A compares the estimated cell&#8209;resolved effect with the truth entry by entry; panel B does the same for distances between cells, which is a different question about the same fit. Panel C is the one that decides whether the map is usable: the teal cells stay together under both geometries, and the rose cell does not &#8212; a neighbourhood failure that either scatterplot can absorb without looking wrong. Illustrative points, not a fitted example.</div>
</div>

## Do not make U the primary target

The generator also gives us $U^{\mathrm{true}}$ and $\Lambda^{\mathrm{true}}$, so it is tempting to compare them directly with $\hat U$ and $\hat\Lambda$.

This is useful for debugging, but it is not the main scientific recovery metric.

The factorization is not unique. Rotations, sign changes and rescalings can change $U$ and $\Lambda$ while preserving

$$
R=\beta\mathbf 1^{\mathsf T}+\Lambda U^{\mathsf T}.
$$

Concretely, for any invertible $K\times K$ matrix $A$,

$$
\Lambda U^{\mathsf T}
=
(\Lambda A)(UA^{-\mathsf T})^{\mathsf T},
$$

so $(\Lambda A, UA^{-\mathsf T})$ is exactly as good a fit as $(\Lambda, U)$ and no data can prefer between them. An error computed factor by factor is therefore not even well defined until a matching rule is imposed &#8212; and the matching rule then does part of the scoring. A generous rule can hide a genuine failure by rotating into it; a strict one can report a failure where the fit is perfect.

The simulation code can match generating and estimated factors by their rank-one cis-effect components when we want to inspect factor-level recovery. But the invariant targets remain $R$, regulotype distances and later predictions.

The same argument is why a factor gets a biological name only when something withheld from the fit lines up with it. Rotation invariance is not a technicality about the optimiser; it is a statement that individual factors carry no meaning the data can defend.

## When should recovery become possible?

A useful simulation does more than show one successful example. It tells us where the method works and where it should not be trusted.

The generator lets us vary:

* donor number $D$;
* number of reference pairs $S$;
* true rank $K$;
* magnitude of cellular effect variation;
* factor sparsity;
* donor variance and residual variance;
* informativeness of cell and pair features.

I would treat $D$ and $S$ as the main axes first. Cells provide measurements at different cellular conditions, but the independent genetic samples are donors. Increasing $S$ supplies more independent cis regions from which the shared cellular structure can be learned.

The two axes buy different things, which is why neither substitutes for the other:

* **Donors** buy independent draws of genotype. Every donor contributes many cells, but those cells share one genome, so they do not multiply the genetic information &#8212; they refine where a donor's cells sit on the map. This is also why every split, every resample and every uncertainty calculation keeps a donor's measurements together.
* **Reference pairs** buy independent views of the same cellular coordinate. Each pair has its own $\beta_s$ and $\lambda_s$, but $u_i$ is shared, so $S$ is what makes the shared structure estimable at all. A one-pair study has no regulotype in any useful sense.
* **Cells** buy resolution. More metacells per donor make the coordinates finer, not the genetics stronger.

A compact experiment is therefore a grid over

$$
(D,S)
$$

and a heatmap of distance recovery or $R$-error.

Then repeat a smaller set of configurations while varying effect size and sparsity.

Two design points make this grid honest rather than decorative. It should be specified &#8212; axes, level sets, seeds, metrics &#8212; before it is run, so that the reported surface is a measurement rather than a search. And a single design point that fails to converge should not be allowed to take a whole grid with it: the failures are themselves part of the surface, and a harness that aborts on them silently reports the easy region.

This answers a practical question that the fitted map alone cannot:

How much genetic information do we need before the cellular reclassification becomes reliable?

## Does expression have to agree with the regulotype?

The simulator separately generates a genotype-independent expression state $w_i$ and a genetic-response coordinate $u_i$. Their relationship can be controlled.

This gives two useful regimes.

When $w_i$ and $u_i$ are strongly aligned, expression-defined and regulotype-defined cellular structure should largely agree.

When they are weakly related or independent, an expression representation should become a poor proxy for genetic-response structure, while the regulotype model should still recover $R^{\mathrm{true}}$ if enough genetic information is available.

The comparator in both regimes is the model handed supplied expression coordinates &#8212; expression principal components or a similar low-dimensional summary, in the style of the [context-kernel methods surveyed in the first note](/notes/2026/09/04/regulotypes-1-overview/). Under strong alignment that comparator has been given the answer, and it should win or tie; a method that could not be beaten in the regime where the competing representation is correct would be telling us something is wrong with the harness, not with the competitor.

Three things have to be controlled for the axis to mean anything.

* **The correlation must be imposed on the realised coordinate.** If it is imposed on a latent variable that is afterwards thresholded to induce sparsity, the correlation that survives into $u_i$ is attenuated, and the strongly-aligned end of the axis is never actually reached. The arm that is supposed to be hardest for the method silently becomes an easy one.
* **Rank has to be held fixed, and stated.** A scalar expression state cannot reach more than one factor, so at higher $K$ the supplied-coordinate comparator is capped by construction rather than by any property of the data. Running the alignment axis at $K=1$ is the only setting in which the comparison is unconditionally fair.
* **Alignment is a property of the truth, not of the fit.** It should be reported as the realised correlation in each simulated dataset, not as the nominal value requested from the generator.

This is one of the most important conceptual simulations. The goal is not to show that expression is uninformative. It is to show that expression similarity and genetic-response similarity are different estimands, and to identify when the distinction matters.

A claim demonstrated in one direction only is weaker than it looks. The result worth reporting is a crossing: the method ahead where the two structures differ, and behind where they coincide.

<div class='nfig wide'>
<button class='replay' type='button'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/><path d='M20.5 3.5v5h-5'/></svg>replay</button>
<svg viewBox='0 0 720 516' role='img' aria-label='Cells shaded by expression state and by response coordinate under two regimes, with schematic recovery bars beneath each.'>
<text x='186.0' y='34.0' class='lbl bg mid a-pop' style='--d:0.00s;fill:var(--n-ink)'>w and u aligned</text>
<rect x='46.0' y='52.0' width='280.0' height='118.0' rx='8' class='box a-fade' style='--d:0.10s;--dur:0.50s'/>
<text x='186.0' y='189.0' class='lbl sm mid a-rise' style='--d:0.20s;fill:var(--n-data)'>shaded by expression state w</text>
<circle cx='142.3' cy='142.4' r='4.0' class='a-pop' style='--d:0.35s;fill:rgba(var(--n-ochre-rgb), 0.45)'/>
<circle cx='223.4' cy='149.5' r='4.0' class='a-pop' style='--d:0.37s;fill:rgba(var(--n-ochre-rgb), 0.69)'/>
<circle cx='194.9' cy='123.1' r='4.0' class='a-pop' style='--d:0.39s;fill:rgba(var(--n-ochre-rgb), 0.61)'/>
<circle cx='76.4' cy='110.3' r='4.0' class='a-pop' style='--d:0.42s;fill:rgba(var(--n-ochre-rgb), 0.26)'/>
<circle cx='71.3' cy='117.0' r='4.0' class='a-pop' style='--d:0.44s;fill:rgba(var(--n-ochre-rgb), 0.25)'/>
<circle cx='79.3' cy='147.8' r='4.0' class='a-pop' style='--d:0.46s;fill:rgba(var(--n-ochre-rgb), 0.27)'/>
<circle cx='167.3' cy='81.6' r='4.0' class='a-pop' style='--d:0.48s;fill:rgba(var(--n-ochre-rgb), 0.53)'/>
<circle cx='92.7' cy='135.9' r='4.0' class='a-pop' style='--d:0.50s;fill:rgba(var(--n-ochre-rgb), 0.31)'/>
<circle cx='217.6' cy='70.7' r='4.0' class='a-pop' style='--d:0.53s;fill:rgba(var(--n-ochre-rgb), 0.67)'/>
<circle cx='205.1' cy='120.3' r='4.0' class='a-pop' style='--d:0.55s;fill:rgba(var(--n-ochre-rgb), 0.64)'/>
<circle cx='304.1' cy='151.8' r='4.0' class='a-pop' style='--d:0.57s;fill:rgba(var(--n-ochre-rgb), 0.92)'/>
<circle cx='274.9' cy='129.9' r='4.0' class='a-pop' style='--d:0.59s;fill:rgba(var(--n-ochre-rgb), 0.84)'/>
<circle cx='97.8' cy='145.4' r='4.0' class='a-pop' style='--d:0.61s;fill:rgba(var(--n-ochre-rgb), 0.32)'/>
<circle cx='138.5' cy='82.5' r='4.0' class='a-pop' style='--d:0.64s;fill:rgba(var(--n-ochre-rgb), 0.44)'/>
<circle cx='106.8' cy='103.7' r='4.0' class='a-pop' style='--d:0.66s;fill:rgba(var(--n-ochre-rgb), 0.35)'/>
<circle cx='220.5' cy='122.5' r='4.0' class='a-pop' style='--d:0.68s;fill:rgba(var(--n-ochre-rgb), 0.68)'/>
<circle cx='197.8' cy='150.3' r='4.0' class='a-pop' style='--d:0.70s;fill:rgba(var(--n-ochre-rgb), 0.61)'/>
<circle cx='76.8' cy='137.5' r='4.0' class='a-pop' style='--d:0.72s;fill:rgba(var(--n-ochre-rgb), 0.26)'/>
<circle cx='230.7' cy='117.5' r='4.0' class='a-pop' style='--d:0.75s;fill:rgba(var(--n-ochre-rgb), 0.71)'/>
<circle cx='139.9' cy='103.3' r='4.0' class='a-pop' style='--d:0.77s;fill:rgba(var(--n-ochre-rgb), 0.45)'/>
<circle cx='174.4' cy='129.0' r='4.0' class='a-pop' style='--d:0.79s;fill:rgba(var(--n-ochre-rgb), 0.55)'/>
<circle cx='259.0' cy='93.1' r='4.0' class='a-pop' style='--d:0.81s;fill:rgba(var(--n-ochre-rgb), 0.79)'/>
<circle cx='122.5' cy='104.3' r='4.0' class='a-pop' style='--d:0.83s;fill:rgba(var(--n-ochre-rgb), 0.40)'/>
<circle cx='192.2' cy='77.2' r='4.0' class='a-pop' style='--d:0.86s;fill:rgba(var(--n-ochre-rgb), 0.60)'/>
<circle cx='242.9' cy='130.1' r='4.0' class='a-pop' style='--d:0.88s;fill:rgba(var(--n-ochre-rgb), 0.75)'/>
<circle cx='305.1' cy='145.4' r='4.0' class='a-pop' style='--d:0.90s;fill:rgba(var(--n-ochre-rgb), 0.93)'/>
<rect x='46.0' y='196.0' width='280.0' height='118.0' rx='8' class='box a-fade' style='--d:0.30s;--dur:0.50s'/>
<text x='186.0' y='333.0' class='lbl sm mid a-rise' style='--d:0.40s;fill:var(--n-student)'>shaded by response coordinate u</text>
<circle cx='142.3' cy='286.4' r='4.0' class='a-pop' style='--d:0.55s;fill:rgba(var(--n-violet-rgb), 0.45)'/>
<circle cx='223.4' cy='293.5' r='4.0' class='a-pop' style='--d:0.57s;fill:rgba(var(--n-violet-rgb), 0.69)'/>
<circle cx='194.9' cy='267.1' r='4.0' class='a-pop' style='--d:0.59s;fill:rgba(var(--n-violet-rgb), 0.61)'/>
<circle cx='76.4' cy='254.3' r='4.0' class='a-pop' style='--d:0.62s;fill:rgba(var(--n-violet-rgb), 0.26)'/>
<circle cx='71.3' cy='261.0' r='4.0' class='a-pop' style='--d:0.64s;fill:rgba(var(--n-violet-rgb), 0.25)'/>
<circle cx='79.3' cy='291.8' r='4.0' class='a-pop' style='--d:0.66s;fill:rgba(var(--n-violet-rgb), 0.27)'/>
<circle cx='167.3' cy='225.6' r='4.0' class='a-pop' style='--d:0.68s;fill:rgba(var(--n-violet-rgb), 0.53)'/>
<circle cx='92.7' cy='279.9' r='4.0' class='a-pop' style='--d:0.70s;fill:rgba(var(--n-violet-rgb), 0.31)'/>
<circle cx='217.6' cy='214.7' r='4.0' class='a-pop' style='--d:0.73s;fill:rgba(var(--n-violet-rgb), 0.67)'/>
<circle cx='205.1' cy='264.3' r='4.0' class='a-pop' style='--d:0.75s;fill:rgba(var(--n-violet-rgb), 0.64)'/>
<circle cx='304.1' cy='295.8' r='4.0' class='a-pop' style='--d:0.77s;fill:rgba(var(--n-violet-rgb), 0.92)'/>
<circle cx='274.9' cy='273.9' r='4.0' class='a-pop' style='--d:0.79s;fill:rgba(var(--n-violet-rgb), 0.84)'/>
<circle cx='97.8' cy='289.4' r='4.0' class='a-pop' style='--d:0.81s;fill:rgba(var(--n-violet-rgb), 0.32)'/>
<circle cx='138.5' cy='226.5' r='4.0' class='a-pop' style='--d:0.84s;fill:rgba(var(--n-violet-rgb), 0.44)'/>
<circle cx='106.8' cy='247.7' r='4.0' class='a-pop' style='--d:0.86s;fill:rgba(var(--n-violet-rgb), 0.35)'/>
<circle cx='220.5' cy='266.5' r='4.0' class='a-pop' style='--d:0.88s;fill:rgba(var(--n-violet-rgb), 0.68)'/>
<circle cx='197.8' cy='294.3' r='4.0' class='a-pop' style='--d:0.90s;fill:rgba(var(--n-violet-rgb), 0.61)'/>
<circle cx='76.8' cy='281.5' r='4.0' class='a-pop' style='--d:0.92s;fill:rgba(var(--n-violet-rgb), 0.26)'/>
<circle cx='230.7' cy='261.5' r='4.0' class='a-pop' style='--d:0.95s;fill:rgba(var(--n-violet-rgb), 0.71)'/>
<circle cx='139.9' cy='247.3' r='4.0' class='a-pop' style='--d:0.97s;fill:rgba(var(--n-violet-rgb), 0.45)'/>
<circle cx='174.4' cy='273.0' r='4.0' class='a-pop' style='--d:0.99s;fill:rgba(var(--n-violet-rgb), 0.55)'/>
<circle cx='259.0' cy='237.1' r='4.0' class='a-pop' style='--d:1.01s;fill:rgba(var(--n-violet-rgb), 0.79)'/>
<circle cx='122.5' cy='248.3' r='4.0' class='a-pop' style='--d:1.03s;fill:rgba(var(--n-violet-rgb), 0.40)'/>
<circle cx='192.2' cy='221.2' r='4.0' class='a-pop' style='--d:1.06s;fill:rgba(var(--n-violet-rgb), 0.60)'/>
<circle cx='242.9' cy='274.1' r='4.0' class='a-pop' style='--d:1.08s;fill:rgba(var(--n-violet-rgb), 0.75)'/>
<circle cx='305.1' cy='289.4' r='4.0' class='a-pop' style='--d:1.10s;fill:rgba(var(--n-violet-rgb), 0.93)'/>
<rect x='76.0' y='391.8' width='56.0' height='70.2' rx='2' class='a-grow' style='--d:1.35s;--dur:0.70s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-student)'/>
<text x='104.0' y='480.0' class='lbl sm mid a-rise' style='--d:1.55s;fill:var(--n-student)'>regulotype</text>
<rect x='226.0' y='394.9' width='56.0' height='67.1' rx='2' class='a-grow' style='--d:1.53s;--dur:0.70s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-teacher)'/>
<text x='254.0' y='480.0' class='lbl sm mid a-rise' style='--d:1.73s;fill:var(--n-teacher)'>supplied</text>
<text x='254.0' y='494.0' class='lbl sm mid a-rise' style='--d:1.62s;fill:var(--n-teacher)'>coordinates</text>
<line x1='66.0' y1='462.0' x2='306.0' y2='462.0' class='' style='--d:1.30s;stroke:var(--n-edge);stroke-width:1.4'/>
<text x='534.0' y='34.0' class='lbl bg mid a-pop' style='--d:0.06s;fill:var(--n-ink)'>w and u independent</text>
<rect x='394.0' y='52.0' width='280.0' height='118.0' rx='8' class='box a-fade' style='--d:0.18s;--dur:0.50s'/>
<text x='534.0' y='189.0' class='lbl sm mid a-rise' style='--d:0.28s;fill:var(--n-data)'>shaded by expression state w</text>
<circle cx='490.3' cy='142.4' r='4.0' class='a-pop' style='--d:0.43s;fill:rgba(var(--n-ochre-rgb), 0.45)'/>
<circle cx='571.4' cy='149.5' r='4.0' class='a-pop' style='--d:0.45s;fill:rgba(var(--n-ochre-rgb), 0.69)'/>
<circle cx='542.9' cy='123.1' r='4.0' class='a-pop' style='--d:0.47s;fill:rgba(var(--n-ochre-rgb), 0.61)'/>
<circle cx='424.4' cy='110.3' r='4.0' class='a-pop' style='--d:0.50s;fill:rgba(var(--n-ochre-rgb), 0.26)'/>
<circle cx='419.3' cy='117.0' r='4.0' class='a-pop' style='--d:0.52s;fill:rgba(var(--n-ochre-rgb), 0.25)'/>
<circle cx='427.3' cy='147.8' r='4.0' class='a-pop' style='--d:0.54s;fill:rgba(var(--n-ochre-rgb), 0.27)'/>
<circle cx='515.3' cy='81.6' r='4.0' class='a-pop' style='--d:0.56s;fill:rgba(var(--n-ochre-rgb), 0.53)'/>
<circle cx='440.7' cy='135.9' r='4.0' class='a-pop' style='--d:0.58s;fill:rgba(var(--n-ochre-rgb), 0.31)'/>
<circle cx='565.6' cy='70.7' r='4.0' class='a-pop' style='--d:0.61s;fill:rgba(var(--n-ochre-rgb), 0.67)'/>
<circle cx='553.1' cy='120.3' r='4.0' class='a-pop' style='--d:0.63s;fill:rgba(var(--n-ochre-rgb), 0.64)'/>
<circle cx='652.1' cy='151.8' r='4.0' class='a-pop' style='--d:0.65s;fill:rgba(var(--n-ochre-rgb), 0.92)'/>
<circle cx='622.9' cy='129.9' r='4.0' class='a-pop' style='--d:0.67s;fill:rgba(var(--n-ochre-rgb), 0.84)'/>
<circle cx='445.8' cy='145.4' r='4.0' class='a-pop' style='--d:0.69s;fill:rgba(var(--n-ochre-rgb), 0.32)'/>
<circle cx='486.5' cy='82.5' r='4.0' class='a-pop' style='--d:0.72s;fill:rgba(var(--n-ochre-rgb), 0.44)'/>
<circle cx='454.8' cy='103.7' r='4.0' class='a-pop' style='--d:0.74s;fill:rgba(var(--n-ochre-rgb), 0.35)'/>
<circle cx='568.5' cy='122.5' r='4.0' class='a-pop' style='--d:0.76s;fill:rgba(var(--n-ochre-rgb), 0.68)'/>
<circle cx='545.8' cy='150.3' r='4.0' class='a-pop' style='--d:0.78s;fill:rgba(var(--n-ochre-rgb), 0.61)'/>
<circle cx='424.8' cy='137.5' r='4.0' class='a-pop' style='--d:0.80s;fill:rgba(var(--n-ochre-rgb), 0.26)'/>
<circle cx='578.7' cy='117.5' r='4.0' class='a-pop' style='--d:0.83s;fill:rgba(var(--n-ochre-rgb), 0.71)'/>
<circle cx='487.9' cy='103.3' r='4.0' class='a-pop' style='--d:0.85s;fill:rgba(var(--n-ochre-rgb), 0.45)'/>
<circle cx='522.4' cy='129.0' r='4.0' class='a-pop' style='--d:0.87s;fill:rgba(var(--n-ochre-rgb), 0.55)'/>
<circle cx='607.0' cy='93.1' r='4.0' class='a-pop' style='--d:0.89s;fill:rgba(var(--n-ochre-rgb), 0.79)'/>
<circle cx='470.5' cy='104.3' r='4.0' class='a-pop' style='--d:0.91s;fill:rgba(var(--n-ochre-rgb), 0.40)'/>
<circle cx='540.2' cy='77.2' r='4.0' class='a-pop' style='--d:0.94s;fill:rgba(var(--n-ochre-rgb), 0.60)'/>
<circle cx='590.9' cy='130.1' r='4.0' class='a-pop' style='--d:0.96s;fill:rgba(var(--n-ochre-rgb), 0.75)'/>
<circle cx='653.1' cy='145.4' r='4.0' class='a-pop' style='--d:0.98s;fill:rgba(var(--n-ochre-rgb), 0.93)'/>
<rect x='394.0' y='196.0' width='280.0' height='118.0' rx='8' class='box a-fade' style='--d:0.38s;--dur:0.50s'/>
<text x='534.0' y='333.0' class='lbl sm mid a-rise' style='--d:0.48s;fill:var(--n-student)'>shaded by response coordinate u</text>
<circle cx='490.3' cy='286.4' r='4.0' class='a-pop' style='--d:0.63s;fill:rgba(var(--n-violet-rgb), 0.33)'/>
<circle cx='571.4' cy='293.5' r='4.0' class='a-pop' style='--d:0.65s;fill:rgba(var(--n-violet-rgb), 0.27)'/>
<circle cx='542.9' cy='267.1' r='4.0' class='a-pop' style='--d:0.67s;fill:rgba(var(--n-violet-rgb), 0.48)'/>
<circle cx='424.4' cy='254.3' r='4.0' class='a-pop' style='--d:0.70s;fill:rgba(var(--n-violet-rgb), 0.59)'/>
<circle cx='419.3' cy='261.0' r='4.0' class='a-pop' style='--d:0.72s;fill:rgba(var(--n-violet-rgb), 0.53)'/>
<circle cx='427.3' cy='291.8' r='4.0' class='a-pop' style='--d:0.74s;fill:rgba(var(--n-violet-rgb), 0.29)'/>
<circle cx='515.3' cy='225.6' r='4.0' class='a-pop' style='--d:0.76s;fill:rgba(var(--n-violet-rgb), 0.82)'/>
<circle cx='440.7' cy='279.9' r='4.0' class='a-pop' style='--d:0.78s;fill:rgba(var(--n-violet-rgb), 0.38)'/>
<circle cx='565.6' cy='214.7' r='4.0' class='a-pop' style='--d:0.81s;fill:rgba(var(--n-violet-rgb), 0.90)'/>
<circle cx='553.1' cy='264.3' r='4.0' class='a-pop' style='--d:0.83s;fill:rgba(var(--n-violet-rgb), 0.51)'/>
<circle cx='652.1' cy='295.8' r='4.0' class='a-pop' style='--d:0.85s;fill:rgba(var(--n-violet-rgb), 0.25)'/>
<circle cx='622.9' cy='273.9' r='4.0' class='a-pop' style='--d:0.87s;fill:rgba(var(--n-violet-rgb), 0.43)'/>
<circle cx='445.8' cy='289.4' r='4.0' class='a-pop' style='--d:0.89s;fill:rgba(var(--n-violet-rgb), 0.30)'/>
<circle cx='486.5' cy='226.5' r='4.0' class='a-pop' style='--d:0.92s;fill:rgba(var(--n-violet-rgb), 0.81)'/>
<circle cx='454.8' cy='247.7' r='4.0' class='a-pop' style='--d:0.94s;fill:rgba(var(--n-violet-rgb), 0.64)'/>
<circle cx='568.5' cy='266.5' r='4.0' class='a-pop' style='--d:0.96s;fill:rgba(var(--n-violet-rgb), 0.49)'/>
<circle cx='545.8' cy='294.3' r='4.0' class='a-pop' style='--d:0.98s;fill:rgba(var(--n-violet-rgb), 0.27)'/>
<circle cx='424.8' cy='281.5' r='4.0' class='a-pop' style='--d:1.00s;fill:rgba(var(--n-violet-rgb), 0.37)'/>
<circle cx='578.7' cy='261.5' r='4.0' class='a-pop' style='--d:1.03s;fill:rgba(var(--n-violet-rgb), 0.53)'/>
<circle cx='487.9' cy='247.3' r='4.0' class='a-pop' style='--d:1.05s;fill:rgba(var(--n-violet-rgb), 0.64)'/>
<circle cx='522.4' cy='273.0' r='4.0' class='a-pop' style='--d:1.07s;fill:rgba(var(--n-violet-rgb), 0.44)'/>
<circle cx='607.0' cy='237.1' r='4.0' class='a-pop' style='--d:1.09s;fill:rgba(var(--n-violet-rgb), 0.72)'/>
<circle cx='470.5' cy='248.3' r='4.0' class='a-pop' style='--d:1.11s;fill:rgba(var(--n-violet-rgb), 0.63)'/>
<circle cx='540.2' cy='221.2' r='4.0' class='a-pop' style='--d:1.14s;fill:rgba(var(--n-violet-rgb), 0.85)'/>
<circle cx='590.9' cy='274.1' r='4.0' class='a-pop' style='--d:1.16s;fill:rgba(var(--n-violet-rgb), 0.43)'/>
<circle cx='653.1' cy='289.4' r='4.0' class='a-pop' style='--d:1.18s;fill:rgba(var(--n-violet-rgb), 0.31)'/>
<rect x='424.0' y='393.4' width='56.0' height='68.6' rx='2' class='a-grow' style='--d:1.45s;--dur:0.70s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-student)'/>
<text x='452.0' y='480.0' class='lbl sm mid a-rise' style='--d:1.65s;fill:var(--n-student)'>regulotype</text>
<rect x='574.0' y='443.3' width='56.0' height='18.7' rx='2' class='a-grow' style='--d:1.63s;--dur:0.70s;transform-box:fill-box;transform-origin:center bottom;fill:var(--n-teacher)'/>
<text x='602.0' y='480.0' class='lbl sm mid a-rise' style='--d:1.83s;fill:var(--n-teacher)'>supplied</text>
<text x='602.0' y='494.0' class='lbl sm mid a-rise' style='--d:1.72s;fill:var(--n-teacher)'>coordinates</text>
<line x1='414.0' y1='462.0' x2='654.0' y2='462.0' class='' style='--d:1.30s;stroke:var(--n-edge);stroke-width:1.4'/>
<text x='360.0' y='366.0' class='lbl sm mid a-rise' style='--d:1.25s;fill:var(--n-dim)'>recovery of R &#8212; taller is better, no scale intended</text>
<line x1='360.0' y1='46.0' x2='360.0' y2='344.0' class='' style='--d:0.05s;stroke:var(--n-edge);stroke-width:1;opacity:0.6'/>
<line x1='360.0' y1='380.0' x2='360.0' y2='500.0' class='' style='--d:0.05s;stroke:var(--n-edge);stroke-width:1;opacity:0.6'/>
</svg>
<div class='caption'><span class='caption-label'>Figure 3.</span> The same cells appear four times. On the left the expression state and the response coordinate vary together, so the two shadings agree and a model handed expression coordinates has everything it needs. On the right they are independent: the shadings disagree, and only the model that learns its coordinates from recurrent genetic effects should still recover the truth. The correlation has to be imposed on the realised coordinate rather than on a latent variable that is later thresholded, or the aligned arm is never actually reached. Illustrative, not measured.</div>
</div>

## What do the empirical-Bayes features contribute?

For sparse simulations, the generator also knows the true participation variables

$$
\xi^{(u)}_{ik}
\quad\text{and}\quad
\xi^{(\lambda)}_{sk}.
$$

This lets us test the part of the method that is new beyond the Gaussian-prior fit.

Use three feature settings:

* **informative**: features predict factor participation;
* **uninformative**: features are unrelated to participation;
* **permuted**: the marginal feature distribution is preserved but its relationship to participation is destroyed.

The last two are not the same test, and running only one of them leaves a gap. Uninformative features ask whether the prior is harmless when there is nothing to learn. Permuted features hold the feature distribution fixed &#8212; the same means, variances and correlations, the same number of columns, the same conditioning of the design &#8212; and destroy only the link to participation. A gain that survives permutation is not a gain from information; it is a gain from the extra flexibility of having any features at all.

Then compare the feature-moderated prior with an intercept-only prior and the Gaussian-prior baseline.

The informative prior should improve recovery when the simulated annotations truly carry information. The uninformative and permuted priors should not create a similar gain.

For sparse factors, I would additionally evaluate recovery of the participation indicators using posterior inclusion probabilities.

Both halves of this deserve a warning about what a negative result would mean. The mixing probability is a logistic function of the features, so its coefficients are estimated from the cells and pairs available &#8212; and there is a size below which an informative arm and a permuted arm are simply not distinguishable, however informative the features are. A null result at small $S$ or small $I$ is a statement about estimability, not about the prior, and it should be reported as an estimability boundary with the sample size attached. The interesting question is where that boundary sits relative to the studies we intend to run.

This is not only a prediction benchmark. It checks whether the prior learns the relationship it was designed to learn.

## Summary

Simulation gives a direct definition of a correct regulotype map.

I would call the simulation evidence convincing if the method:

* does not invent cellular effect heterogeneity under the null;
* accurately recovers the cell-resolved effects in $R$;
* preserves the true regulotype distances and local neighborhoods;
* improves as donor number, reference-pair number and signal strength increase;
* still recovers genetic-response structure when it differs from ordinary expression structure;
* and uses informative features without benefiting similarly from uninformative or permuted features.

Two conditions sit alongside those six, and are easy to lose. Each claim is reported on the contextual part of the matrix as well as on the whole of it, and each is preregistered &#8212; metric, direction and grid fixed before the runs &#8212; because a simulation harness that can be adjusted after seeing its output is a search, not a test.

These analyses answer:

$$
\boxed{\text{When the truth is known, did we recover the right cellular map?}}
$$

They still do not tell us whether a map estimated from one dataset is stable when the data used to construct it change. That is the next question.

## Sources

- Strober *et al.* SURGE: uncovering context-specific genetic-regulation of gene expression from single-cell RNA sequencing using latent-factor models. *Genome Biol* **25**, 28 (2024). [doi:10.1186/s13059-023-03152-z](https://doi.org/10.1186/s13059-023-03152-z)
- Denault *et al.* Covariate-moderated empirical Bayes matrix factorization. *NeurIPS* **38** (2025). [doi:10.52202/085713-1573](https://doi.org/10.52202/085713-1573)
- Cuomo *et al.* CellRegMap: a statistical framework for mapping context-specific regulatory variants using scRNA-seq. *Mol Syst Biol* **18**, e10663 (2022). [doi:10.15252/msb.202110663](https://doi.org/10.15252/msb.202110663) — the supplied-expression-coordinate comparator the alignment axis is run against.
- [Regulotypes Note 3 Validation: checking the implementation before checking the biology](/notes/2026/09/05/regulotypes-3-validation/) — the previous note, and the Level 0 evidence this one assumes.
- [Regulotypes Note 2 Train & Test: how the map is trained and tested](/notes/2026/09/05/regulotypes-2-train-test/) — the nested design whose held-out prediction is Level 2.
- [Regulotypes Note 1 Overview: defining cells by genetic response](/notes/2026/09/04/regulotypes-1-overview/) — where $R$, the reference variant–gene pairs and the low-rank model are defined.
