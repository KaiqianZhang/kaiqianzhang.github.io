"""Replace the 'What this could contribute' section of note 1, add Figure 6."""
import os, re
import numpy as np

NOTE = os.path.expanduser('~/Desktop/blog/notes/2026-09-04-regulotypes-1-overview.md')

TEACHER='var(--n-teacher)'; STUDENT='var(--n-student)'; DATA='var(--n-data)'
KEPT='var(--n-kept)'; LOSS='var(--n-loss)'; PRUNED='var(--n-pruned)'
DIM='var(--n-dim)'; EDGE='var(--n-edge)'

def S(d=None, dur=None, fill=None, stroke=None, sw=None, length=None, op=None):
    p=[]
    if d is not None: p.append('--d:%.2fs'%d)
    if dur is not None: p.append('--dur:%.2fs'%dur)
    if length is not None: p.append('--len:%.0f'%length)
    if fill is not None: p.append('fill:%s'%fill)
    if stroke is not None: p.append('stroke:%s'%stroke)
    if sw is not None: p.append('stroke-width:%s'%sw)
    if op is not None: p.append('opacity:%s'%op)
    return ';'.join(p)

def txt(x,y,s,cls='lbl',fill=None,d=0.0,anim='a-rise'):
    return "<text x='%.1f' y='%.1f' class='%s %s' style='%s'>%s</text>"%(x,y,cls,anim,S(d=d,fill=fill),s)

REPLAY = ("<button class='replay' type='button'><svg viewBox='0 0 24 24' "
          "aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/>"
          "<path d='M20.5 3.5v5h-5'/></svg>replay</button>")

def figure6():
    rng = np.random.default_rng(7)
    body = []
    # cluster boxes: (x, y, w, h)
    A  = (45.0, 100.0, 125.0, 100.0)
    B  = (186.0, 100.0, 125.0, 100.0)
    C  = (115.0, 228.0, 125.0, 100.0)
    AB = (395.0, 100.0, 266.0, 100.0)
    C1 = (465.0, 228.0, 59.0, 100.0)
    C2 = (531.0, 228.0, 59.0, 100.0)

    body.append(txt(178.0, 44.0, 'expression labels', 'lbl mid', TEACHER, 0.05, 'a-pop'))
    body.append(txt(528.0, 44.0, 'cis-effect patterns', 'lbl mid', STUDENT, 0.10, 'a-pop'))

    def pts(box, n, colour, d0, seed_shift=0):
        x, y, w, h = box
        out = []
        for k in range(n):
            px = x + 16 + rng.uniform() * (w - 32)
            py = y + 16 + rng.uniform() * (h - 32)
            out.append("<circle cx='%.1f' cy='%.1f' r='4.4' class='a-pop' style='%s'/>"
                       % (px, py, S(d=d0 + 0.018 * k, fill=colour)))
        return out

    # left panel: three labels, three groups
    rng = np.random.default_rng(7); body += pts(A, 14, TEACHER, 0.22)
    rng = np.random.default_rng(8); body += pts(B, 14, DATA, 0.30)
    rng = np.random.default_rng(9); body += pts(C, 14, PRUNED, 0.38)
    for box, col, d in ((A, TEACHER, 0.85), (B, DATA, 0.92), (C, PRUNED, 0.99)):
        x, y, w, h = box
        body.append("<rect x='%.1f' y='%.1f' width='%.1f' height='%.1f' rx='16' "
                    "class='a-draw' fill='none' stroke-dasharray='7 5' style='%s'/>"
                    % (x, y, w, h, S(d=d, dur=0.8, length=2*(w+h), stroke=col, sw='2')))
    body.append(txt(107.0, 92.0, 'label A', 'lbl sm mid', TEACHER, 1.05))
    body.append(txt(248.0, 92.0, 'label B', 'lbl sm mid', DATA, 1.10))
    body.append(txt(177.0, 348.0, 'label C', 'lbl sm mid', PRUNED, 1.15))

    # the bridge
    body.append("<path d='M317 164 L385 164' fill='none' class='a-draw' "
                "stroke-linecap='round' style='%s'/>" % S(d=1.30, dur=0.5, length=70, stroke=DIM, sw='1.6'))
    body.append("<polygon points='391,164 385,167.3 385,160.7' class='a-pop' style='%s'/>"
                % S(d=1.72, fill=DIM))
    body.append(txt(351.0, 150.0, 'same cells', 'lbl sm mid', DIM, 1.35))

    # right panel: A and B share a pattern, C splits
    rng = np.random.default_rng(7)
    for k in range(14):
        px = A[0] + 350 + 16 + rng.uniform() * (A[2] - 32)
        py = A[1] + 16 + rng.uniform() * (A[3] - 32)
        body.append("<circle cx='%.1f' cy='%.1f' r='4.4' class='a-pop' style='%s'/>"
                    % (px, py, S(d=1.85 + 0.018 * k, fill=KEPT)))
    rng = np.random.default_rng(8)
    for k in range(14):
        px = B[0] + 350 + 16 + rng.uniform() * (B[2] - 32)
        py = B[1] + 16 + rng.uniform() * (B[3] - 32)
        body.append("<circle cx='%.1f' cy='%.1f' r='4.4' class='a-pop' style='%s'/>"
                    % (px, py, S(d=1.90 + 0.018 * k, fill=KEPT)))
    rng = np.random.default_rng(9)
    SEAM = 527.5          # the gap between the two right-hand boxes
    for k in range(14):
        px = C[0] + 350 + 16 + rng.uniform() * (C[2] - 32)
        py = C[1] + 16 + rng.uniform() * (C[3] - 32)
        # No cell may sit in the gap: on the left the label is one group, so a
        # point straddling the new boundary would read as undecided rather than
        # as belonging to one of the two patterns.
        if abs(px - SEAM) < 9:
            px += 9 if px >= SEAM else -9
        colour = LOSS if px < SEAM else STUDENT
        body.append("<circle cx='%.1f' cy='%.1f' r='4.4' class='a-pop' style='%s'/>"
                    % (px, py, S(d=2.35 + 0.018 * k, fill=colour)))

    x, y, w, h = AB
    body.append("<rect x='%.1f' y='%.1f' width='%.1f' height='%.1f' rx='16' class='a-draw' "
                "fill='none' stroke-dasharray='7 5' style='%s'/>"
                % (x, y, w, h, S(d=2.55, dur=1.0, length=2*(w+h), stroke=KEPT, sw='2.2')))
    body.append(txt(528.0, 92.0, 'one pattern, two labels', 'lbl sm mid', KEPT, 2.80))
    for box, col, d in ((C1, LOSS, 3.05), (C2, STUDENT, 3.12)):
        x, y, w, h = box
        body.append("<rect x='%.1f' y='%.1f' width='%.1f' height='%.1f' rx='14' class='a-draw' "
                    "fill='none' stroke-dasharray='7 5' style='%s'/>"
                    % (x, y, w, h, S(d=d, dur=0.8, length=2*(w+h), stroke=col, sw='2.2')))
    body.append(txt(528.0, 348.0, 'two patterns, one label', 'lbl sm mid', DIM, 3.30))

    lines = ["<div class='nfig wide'>", REPLAY,
             "<svg viewBox='0 0 720 372' role='img' aria-label='The same cells grouped twice: "
             "by expression label on the left, by cis-effect pattern on the right, where two "
             "labels merge and one label splits.'>"]
    lines += [l for l in body if l.strip()]
    lines.append('</svg>')
    lines.append("<div class='caption'><span class='caption-label'>Figure 6.</span> The same "
                 "cells, grouped twice. On the left they carry three expression labels. On the "
                 "right they are grouped by estimated cis-effect pattern: labels A and B fall "
                 "together, and label C divides. Neither move is available from the expression "
                 "labels alone, and either one changes which cells should be pooled to estimate "
                 "a genetic effect. Illustrative, not a fitted example.</div>")
    lines.append('</div>')
    return '\n'.join(lines)


SECTION = """## What this could contribute

> If expression already tells us what a cell is, what scientifically useful information does organizing cells by genetic regulation add?

We do not need regulotypes to rediscover cell types that marker genes already distinguish, and I would not defend them on that ground. But a marker identifying a cell does not establish that genetic variants have the same effects in every cell carrying that marker. The question is whether organizing cells by their patterns of genetic effects reveals information that expression-based identities miss, and whether that information improves genetic prediction and disease interpretation. Five things could follow from it, none of them yet established.

### 1. Whether expression boundaries are regulatory boundaries

An expression subtype is defined by differences in expression, not by differences in genetic effect, so the two need not coincide. Two expression subtypes can share a cis-effect pattern; a single expression subtype can contain substantially different ones. Two endothelial subclusters might differ sharply in stress-response expression and still agree in their estimated cis effects, while cells inside one capillary endothelial label might not agree at all.

Regulotypes would then say both where to split an existing label and where an existing distinction is unnecessary for a particular regulatory question. That is a stronger claim than producing a finer clustering, because it tests whether the current classification is the right one for studying genetic regulation in the first place. What would settle it is showing that the regulotype organization explains reproducible genetic-effect differences beyond existing labels and expression-state representations; simply recovering known subtypes would be reassuring without being sufficient.

FIGURE6

### 2. Susceptibility to genetic variation that average expression does not reveal

Expression level and genetic effect are different quantities. Writing the conditional mean of a gene's expression in a cellular context $c$ as

$$
E[y_{ig}\\mid x,c]=m(c)+x\\,\\beta(c),
$$

with $x$ the centred effect-allele dosage, separates a baseline term $m(c)$ from the genotype-expression association $\\beta(c)$. Two contexts can agree on $m(c)$ and differ in $\\beta(c)$: they look alike in that gene's expression while differing in how strongly inherited variation moves it.

What that buys is a way to say where genetic variation matters, rather than only where a gene is expressed, and exclusive markers do not answer that question for the other genes expressed within a lineage. What would settle it is context-dependent effects predicting genotype-associated expression differences in held-out donors better than models built from expression states alone, remembering throughout that these effects are estimated across donors and not measured independently in any single cell.

### 3. Estimation that pools information by regulatory similarity

Broad cell-type pooling averages heterogeneous effects away, while subdividing repeatedly leaves groups too small to estimate anything in. Sharing information across cells and variant-gene pairs with related effect patterns is a way through that trade-off: a rare endothelial state may carry too little evidence to estimate every eQTL on its own, but if several variant-gene pairs vary together across it, a shared low-dimensional model can estimate them jointly.

The contribution would be better estimation without a separately powered eQTL analysis for every subtype, bearing in mind that more cells are not more donors and that sharing across pairs which do not in fact share structure introduces bias. What would settle it is better held-out prediction or effect recovery, with calibrated uncertainty, against broad-label, subtype-specific and continuous expression-interaction models; not merely more significant findings.

### 4. Coordinated patterns of genetic regulation across loci

Separate context-dependent eQTL analyses say where individual genetic effects vary. A joint regulotype model asks something further: whether multiple loci vary together across the same cellular contexts. If several independent variant-gene pairs consistently strengthen or weaken along one axis, that identifies a shared regulatory pattern rather than a collection of unrelated interactions, which is a relationship among genetic effects that neither cell labels nor one-locus-at-a-time analysis would expose. It is the direct consequence of organizing the effect matrix jointly.

What would settle it is the shared pattern replicating, and surviving the removal of its strongest loci. Calling it an inflammatory programme would take independent biological evidence; a latent factor or a pathway-enrichment result does not by itself establish a common mechanism.

### 5. Disease follow-up specific enough to test

"This AD-associated locus is relevant to endothelial cells" still leaves a large experimental search space. A reproducible state-dependent effect narrows it to a particular gene in a particular cellular condition, and, where the data support it, to testing a candidate allele's effect on that gene under inflammatory stimulation against baseline rather than testing an undifferentiated endothelial population. The added value is a more precise experimental hypothesis: which allele, which gene, under which condition.

This one rests on credible links to the disease association, because a state-dependent eQTL does not on its own show that the state mediates AD risk. What would settle it is independent genetic support and replication, followed ideally by an experiment confirming the predicted context dependence.
"""


def main():
    src = open(NOTE).read()

    # 1. the roadmap gloss
    old_gloss = 'claims, each with a decisive analysis'
    assert old_gloss in src
    src = src.replace(old_gloss, 'five added values, and what would show them')

    # 2. the section body, from its heading up to (not including) '## Sources'
    a = src.index('## What this could contribute')
    b = src.index('## Sources')
    section = SECTION.replace('FIGURE6', figure6())
    src = src[:a] + section + '\n' + src[b:]

    # figure captions must stay numbered 1..N with no gaps
    nums = [int(n) for n in re.findall(r"caption-label'>Figure (\d+)\.", src)]
    assert nums == list(range(1, len(nums) + 1)), nums

    open(NOTE, 'w').write(src)
    print('revised %s (%d figures)' % (NOTE, len(nums)))


main()
