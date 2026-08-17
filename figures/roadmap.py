"""Generate the history roadmap for each post.

The history section of a post is a roadmap, not prose: a spine of milestones,
each in a box, with the *reason the next one had to happen* written above the
arrow between them. The arrow labels are the load-bearing part — a history
that only lists dates has not explained anything.

This is a generator rather than hand-written SVG because the body text has to
be wrapped and centred inside each box, and doing that by hand across three
posts is how tspan positions end up wrong. Run it and paste the printed
markup into the post, between a <div class='roadmap'> and its closing tag.

Run:  python3 figures/roadmap.py [rmsnorm|prenorm|rope]
"""

import sys

from sketch import Pen, rough_rect, rough_line, rough_arrow

W = 760                 # viewBox width; the CSS scales it to the column
PAD = 6                 # left and right margin
GAP = 14                # space between boxes
BOX_PAD = 11            # text inset inside a box
BULLET_INSET = 21       # where bullet text starts inside a card
SPINE_Y = 40
BOX_TOP = 56
TITLE_DY = 21           # first baseline below the box top
LINE_H = 19.5
WHY_LINE = 18           # leading for the reason above each arrow
BODY_SIZE = 15.5

# Mean advance width of the body font, measured in the browser for Excalifont
# at the size above (0.506) and rounded up. Deliberately generous: erring high
# only wraps a word early, whereas erring low pushes a line out past the card
# it is supposed to sit inside.
CHAR_EM = 0.525


def wrap(text, width_px):
    """Greedy wrap on an estimated advance width."""
    limit = width_px / (BODY_SIZE * CHAR_EM)
    lines, cur = [], ''
    for word in text.split():
        trial = word if not cur else cur + ' ' + word
        if len(trial) <= limit:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def roadmap(stops, arrows, label):
    """stops: [(year, title, [bullets])]. arrows: the n-1 reasons between them.

    Milestones alternate above and below a spine, XMind fashion. Because they
    alternate, each card gets roughly half the width of the figure rather than
    a quarter, which is what stops the bullets wrapping into a wall of text.
    The stems then run diagonally from a card down to its dot on the spine.
    """
    n = len(stops)
    dots = [PAD + (W - 2 * PAD) * (i + 0.5) / n for i in range(n)]

    above = [i for i in range(n) if i % 2 == 0]
    below = [i for i in range(n) if i % 2 == 1]
    slots = {}
    for group in (above, below):
        if not group:
            continue
        slot = (W - 2 * PAD) / len(group)
        for k, i in enumerate(group):
            slots[i] = (PAD + slot * k + 9, slot - 18)

    wrapped = [[wrap(b, slots[i][1] - 26) for b in stops[i][2]]
               for i in range(n)]
    rows = [sum(len(w) for w in bs) for bs in wrapped]
    cardh = 46 + LINE_H * max(rows) + 12

    gap = (W - 2 * PAD) / n - 16
    why = [wrap(r, gap) for r in arrows]
    whyh = WHY_LINE * max([len(w) for w in why] or [1])

    band = whyh + 20                 # clear air between a card and the spine
    spine_y = cardh + band
    height = spine_y + band + cardh

    pen = Pen(len(stops) * 101 + len(label))
    out = ["<svg viewBox='0 0 %d %d' role='img' aria-label='%s'>"
           % (W, round(height), label)]
    out += ['  ' + l for l in rough_line(dots[0], spine_y, dots[-1], spine_y,
                                         pen, 'spine', bow=1.0, passes=1)]

    for i, reason in enumerate(arrows):
        mid = (dots[i] + dots[i + 1]) / 2
        out += ['  ' + l for l in rough_arrow(mid - 13, spine_y, mid + 13,
                                              spine_y, pen, 'head', bow=0.6,
                                              head=6)]
        # The labels live in the clear band, never in a card's row.
        for j, line in enumerate(why[i]):
            out.append("  <text class='why' x='%.1f' y='%.1f'>%s</text>"
                       % (mid, spine_y - 11 - (len(why[i]) - 1 - j) * WHY_LINE,
                          line))

    for i, (year, title, _b) in enumerate(stops):
        x, cw = slots[i]
        up = i % 2 == 0
        y = spine_y - band - cardh if up else spine_y + band
        out.append("  <g class='stop'>")
        out.append("    <rect class='hit' x='%.1f' y='%.1f' width='%.1f' "
                   "height='%.1f'/>" % (x, y, cw, cardh))
        # The dot always falls within its own card's span, so the stem can
        # drop straight down rather than cutting diagonally across the band.
        sx = min(max(dots[i], x + 16), x + cw - 16)
        out += ['    ' + l for l in rough_line(sx, y + cardh if up else y,
                                               dots[i], spine_y, pen, 'stem',
                                               bow=0.6, passes=1)]
        out.append("    <circle class='dot' cx='%.1f' cy='%.1f' r='5'/>"
                   % (dots[i], spine_y))
        out += ['    ' + l for l in rough_rect(x, y, cw, cardh, pen, 'box',
                                               r=9)]
        out.append("    <text class='yr' x='%.1f' y='%.1f'>%s</text>"
                   % (x + 14, y + 21, year))
        out.append("    <text class='stage' x='%.1f' y='%.1f'>%s</text>"
                   % (x + 14, y + 45, title))
        k = 0
        for bullet in wrapped[i]:
            for j, line in enumerate(bullet):
                yy = y + 45 + 22 + k * LINE_H
                if j == 0:
                    out.append("    <circle class='bul' cx='%.1f' cy='%.1f' "
                               "r='2'/>" % (x + 18, yy - 4))
                out.append("    <text class='body' x='%.1f' y='%.1f'>%s</text>"
                           % (x + 27, yy, line))
                k += 1
        out.append("  </g>")

    out.append('</svg>')
    return '\n'.join(out)


ROADMAPS = {

    'agentic': dict(
        label='Roadmap of the AI co-scientist: tool-using chemists in 2023, '
              'domain agents in 2024, benchmarks and generalists in 2025, and '
              'a robotic body in 2026.',
        arrows=['a demo is not a protocol',
                'nobody could score the reasoning',
                'the answer still has to be made'],
        stops=[
            ('2023', 'the tool-using chemist',
             ['Coscientist wires GPT-4 to search, code and a cloud lab',
              'it plans and runs real cross-coupling reactions']),
            ('2024', 'the domain agent',
             ['CRISPR-GPT decomposes a gene-editing experiment',
              'guide design, delivery, assay and analysis as one plan']),
            ('2025', 'benchmarks and generalists',
             ['Biomni: 150 tools, 105 packages, 59 databases',
              'Genome-Bench scores answers against 11 years of '
              'expert argument']),
            ('2026', 'a body for the agent',
             ['Qumus puts the whole loop inside a robotic minilab',
              'the first AI-created graphene, and a working transistor']),
        ]),

    'rmsnorm': dict(
        label='Roadmap of normalization: BatchNorm 2015, LayerNorm 2016, '
              'RMSNorm 2019, the default from 2023. Each step is forced by a '
              'cost of the one before it.',
        arrows=['statistics depend on the batch',
                'is the mean doing any work?',
                'same quality, less time'],
        stops=[
            ('2015', 'BatchNorm',
             ['standardize each feature across the mini-batch',
              'deep networks become trainable']),
            ('2016', 'LayerNorm',
             ['normalize each example across its own features',
              'no batch dependence, no train/test gap']),
            ('2019', 'RMSNorm',
             ['Zhang and Sennrich drop the mean subtraction',
              'only the division survives',
              '7 to 64% less running time']),
            ('2023-', 'the default',
             ['LLaMA ships it; Mistral, Qwen, Gemma follow',
              'LayerNorm becomes the exception']),
        ]),

    'prenorm': dict(
        label='Roadmap of normalizer placement: warm-up appears in 2017, the '
              'rearrangement spreads in 2018 to 2019, Xiong et al. explain it '
              'in 2020, pre-norm is the default after.',
        arrows=['nobody could say what it was for',
                'it worked, unexplained',
                'a folk remedy becomes a rule'],
        stops=[
            ('2017', 'warm-up appears',
             ['the Transformer needs a ramped learning rate',
              '4,000 steps, with no reason given']),
            ('2018-19', 'the block is rearranged',
             ['normalize before the sublayer, not after',
              'training gets stable; the folklore spreads']),
            ('2020', 'Xiong et al. explain it',
             ['post-norm gradients grow with depth at init',
              'pre-norm gradients do not',
              'so the warm-up was patching a real problem']),
            ('2020-', 'pre-norm by default',
             ['GPT-3, LLaMA, PaLM and the rest adopt it',
              'post-norm survives in a few places']),
        ]),

    'mindmap': dict(
        label='Roadmap of language modelling: counting in the 1990s, '
              'embeddings in 2013, recurrence, and attention from 2017.',
        arrows=['the counts ran out of data',
                'a word needs its context',
                'recurrence could not be parallelized'],
        stops=[
            ('1990s', 'count the n-grams',
             ['estimate the next word from how often it followed',
              'the table outgrows any corpus']),
            ('2013', 'learn the words',
             ['word2vec puts words in a vector space',
              'similar words land near each other',
              'one vector per word, whatever the sentence']),
            ('2014-16', 'read in order',
             ['recurrent networks carry a state along the sentence',
              'context at last, but strictly sequential']),
            ('2017-', 'attend to everything',
             ['the Transformer drops recurrence entirely',
              'all positions at once, so training parallelizes']),
        ]),

    'swiglu': dict(
        label='Roadmap of the feed-forward layer: a gate arrives in 2016, the '
              'Transformer ships a plain two-matrix FFN in 2017, Shazeer puts '
              'the gate inside it in 2020, and LLaMA makes that the default.',
        arrows=['built for convolutions, not attention',
                'the activation changed; the shape never did',
                'it wins, unexplained'],
        stops=[
            ('2016', 'a gate appears',
             ['Dauphin et al. multiply two linear projections',
              'one of them squashed',
              'it predates the Transformer it ends up inside']),
            ('2017', 'the plain FFN',
             ['two matrices, widened fourfold',
              'a pointwise nonlinearity between them',
              'BERT and GPT swap in GELU; the shape stands']),
            ('2020', 'Shazeer combines them',
             ['a gated linear unit inside the FFN',
              'three matrices, so the width drops to two thirds']),
            ('2023-', 'LLaMA makes it default',
             ['SwiGLU in LLaMA, Mistral, Qwen, DeepSeek',
              'Gemma keeps the GELU-gated variant']),
        ]),

    'rope': dict(
        label='Roadmap of position encoding: absolute tags in 2017, relative '
              'offsets in 2018, rotation in 2021, and no encoding at all from '
              '2022.',
        arrows=['breaks past the training length',
                'does not fit the matmul',
                'is any of it needed?'],
        stops=[
            ('2017', 'a tag you add',
             ['a sinusoidal or learned vector, added to the embedding',
              'the model is told its index and must infer distance']),
            ('2018', 'distances, not indices',
             ['Shaw et al. learn a vector per relative offset',
              'T5 cuts it to a scalar per bucket']),
            ('2021', 'rotate instead of add',
             ['Su et al. write position in as a rotation',
              'the dot product depends only on the difference',
              'nothing extra inside the matmul']),
            ('2022', 'say nothing at all',
             ['the causal mask already breaks permutation symmetry',
              'Jamba ships with no encoding; Llama 4 interleaves']),
        ]),

    'kvcache': dict(
        label='Roadmap of the KV cache: an unpublished trick in 2017, '
              'diagnosed as a bandwidth cost in 2019, named in 2022, and the '
              'thing serving systems are built around by 2023.',
        arrows=['it worked, so nobody asked what it cost',
                'a bottleneck with no name is hard to discuss',
                'and then everything was designed around it'],
        stops=[
            ('2017-', 'a trick, not a paper',
             ['keep past keys and values instead of redoing them',
              'no paper claims it as a contribution']),
            ('2019', 'Shazeer names the cost',
             ['decoding is limited by reloading K and V',
              'not by the arithmetic at all']),
            ('2022', 'it gets its name',
             ['Pope et al. write "the KV cache" as a defined term',
              'the name sticks']),
            ('2023-', 'the centre of serving',
             ['vLLM is organised around managing it',
              'it stops being an implementation detail']),
        ]),

    'kvcost': dict(
        label='Roadmap of the fight against the cost of the KV cache: '
              'multi-query attention in 2019, grouped-query in 2023, paging '
              'in 2023, and latent compression in 2024.',
        arrows=['one shared head was too few',
                'a smaller cache, still allocated badly',
                'better layout, but the tensor was still large'],
        stops=[
            ('2019', 'share one head',
             ['every query head gets the same keys and values',
              'the cache divides by the head count',
              'quality slips']),
            ('2023', 'share a few',
             ['one key-value head per group of query heads',
              'uptrained with 5% of pretraining compute',
              'Llama 3 and Mistral ship it']),
            ('2023', 'stop reserving it',
             ['hand the cache out in small blocks on demand',
              'the way an operating system pages memory',
              'nothing gets smaller']),
            ('2024', 'compress it',
             ['squeeze a token\'s keys and values into one latent',
              'reconstruct them on the way in']),
        ]),

    'attention': dict(
        label='Roadmap of attention: a fix for a bottleneck in 2014, a '
              'simpler score in 2015, the recurrence dropped in 2017, and '
              'the transformer everywhere after.',
        arrows=['the scoring network was extra machinery',
                'attention was fine; the recurrence was not',
                'quadratic cost, and a cache to feed'],
        stops=[
            ('2014', 'a fix for a bottleneck',
             ['one fixed vector could not hold a long sentence',
              'let the decoder look back at every source word']),
            ('2015', 'the score gets simpler',
             ['replace the alignment network with a dot product',
              'cheaper, and the form still used today']),
            ('2017', 'drop the recurrence',
             ['keep only attention, pointed at the sequence itself',
              'multiple heads, and the square-root scaling',
              'all positions at once, so training parallelizes']),
            ('2018-', 'everything is a transformer',
             ['BERT and GPT build on it',
              'by the 2020s hybrids swap some attention back out']),
        ]),
}


if __name__ == '__main__':
    which = sys.argv[1:] or sorted(ROADMAPS)
    for name in which:
        spec = ROADMAPS[name]
        print('<!-- %s -->' % name)
        print(roadmap(spec['stops'], spec['arrows'], spec['label']))
        print()
