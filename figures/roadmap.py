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
SPINE_Y = 40
BOX_TOP = 56
TITLE_DY = 21           # first baseline below the box top
LINE_H = 14.5
BODY_SIZE = 10.5

# Mean advance width of the body font. Deliberately generous: erring high
# only wraps a word early, whereas erring low pushes a centred line out past
# the rounded rect it is supposed to sit inside.
CHAR_EM = 0.535


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
    """stops: [(year, title, body)]. arrows: the n-1 reasons between them."""
    n = len(stops)
    boxw = (W - 2 * PAD - (n - 1) * GAP) / n
    xs = [PAD + i * (boxw + GAP) for i in range(n)]
    centres = [x + boxw / 2 for x in xs]

    wrapped = [wrap(body, boxw - 2 * BOX_PAD) for _, _, body in stops]

    # The reason above each arrow has to fit the gap between two dots, or it
    # collides with its neighbour. Wrap it onto two lines when it does not.
    gap = centres[1] - centres[0] - 16 if n > 1 else W
    why = [wrap(r, gap) for r in arrows]
    why_lines = max([len(w) for w in why] or [1])

    top_pad = 12 * (why_lines - 1)
    spine_y = SPINE_Y + top_pad
    box_top = BOX_TOP + top_pad
    boxh = TITLE_DY + 8 + LINE_H * max(len(w) for w in wrapped)
    height = box_top + boxh + 8

    pen = Pen(len(stops) * 101 + len(label))
    out = ["<svg viewBox=\'0 0 %d %d\' role=\'img\' aria-label=\'%s\'>"
           % (W, round(height), label)]

    out += ['  ' + l for l in rough_line(centres[0], spine_y, centres[-1],
                                         spine_y, pen, 'spine', bow=0.8,
                                         passes=1)]

    for i, reason in enumerate(arrows):
        mid = (centres[i] + centres[i + 1]) / 2
        out += ['  ' + l for l in rough_arrow(mid - 11, spine_y, mid + 11,
                                              spine_y, pen, 'head', bow=0.5,
                                              head=6)]
        for j, line in enumerate(why[i]):
            out.append("  <text class=\'why\' x=\'%.1f\' y=\'%.1f\'>%s</text>"
                       % (mid, spine_y - 13 - (len(why[i]) - 1 - j) * 12, line))

    # Each milestone is one <g class='stop'> so the CSS can lift the whole
    # thing -- dot, box and text together -- when the mouse is over it.
    for i, (year, title, _body) in enumerate(stops):
        cx, x = centres[i], xs[i]
        out.append("  <g class=\'stop\'>")
        out.append("    <rect class=\'hit\' x=\'%.1f\' y=\'%.1f\' width=\'%.1f\' "
                   "height=\'%.1f\'/>" % (x, spine_y - 10, boxw, boxh + 24))
        out.append("    <circle class=\'dot\' cx=\'%.1f\' cy=\'%.1f\' r=\'4.5\'/>"
                   % (cx, spine_y))
        out += ['    ' + l for l in rough_rect(x, box_top, boxw, boxh, pen,
                                               'box', r=7)]
        out.append("    <text class=\'yr\' x=\'%.1f\' y=\'%.1f\'>%s</text>"
                   % (cx, box_top + TITLE_DY - 12, year))
        out.append("    <text class=\'stage\' x=\'%.1f\' y=\'%.1f\'>%s</text>"
                   % (cx, box_top + TITLE_DY + 2, title))
        for j, line in enumerate(wrapped[i]):
            out.append("    <text class=\'body\' x=\'%.1f\' y=\'%.1f\'>%s</text>"
                       % (cx, box_top + TITLE_DY + 20 + j * LINE_H, line))
        out.append("  </g>")

    out.append('</svg>')
    return '\n'.join(out)


ROADMAPS = {

    'rmsnorm': dict(
        label='Roadmap of normalization: BatchNorm 2015, LayerNorm 2016, '
              'RMSNorm 2019, the default from 2023. Each step is forced by a '
              'cost of the one before it.',
        arrows=['statistics depend on the batch',
                'is the mean doing any work?',
                'same quality, less time'],
        stops=[
            ('2015', 'BatchNorm',
             'Standardize each feature across the mini-batch. Deep networks '
             'become trainable.'),
            ('2016', 'LayerNorm',
             'Normalize each example across its own features instead. No '
             'batch dependence, no train/test gap.'),
            ('2019', 'RMSNorm',
             'Zhang and Sennrich drop the mean subtraction, keeping only '
             'the division. 7 to 64% less running time.'),
            ('2023-', 'the default',
             'LLaMA ships it; Mistral, Qwen, Gemma, DeepSeek follow. '
             'LayerNorm becomes the exception.'),
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
             'The Transformer needs a learning rate that ramps for 4,000 '
             'steps. Offered as recipe, not finding.'),
            ('2018-19', 'a quiet rearrangement',
             'Baevski and Auli, the Sparse Transformer, GPT-2: the normalizer '
             'moves into the branch. In none of them is it the headline.'),
            ('2020', 'someone works out why',
             'Xiong et al.: at initialization post-norm gradients near the '
             'output are large, so warm-up is the workaround.'),
            ('2020-', 'pre-norm by default',
             'GPT-3, LLaMA, Mistral, Qwen, Gemma, DeepSeek. Then, from 2022, '
             'people begin moving it back.'),
        ]),

    # Five stops rather than four, which is why the bodies here are terser:
    # at n=5 a box is 138px wide and holds about twenty characters a line.
    'mindmap': dict(
        label='Roadmap: counts, then vectors, then memory, then context, then '
              'all at once. Each step is forced by a failure in the one '
              'before it.',
        arrows=['no similarity', 'no order', 'embeddings still static',
                'sequential'],
        stops=[
            ('§1', 'counts', 'n-gram, NNLM 2003'),
            ('§2', 'vectors', 'Word2Vec 2013, GloVe 2014'),
            ('§3', 'memory', 'RNN 1990, LSTM 1997'),
            ('§4', 'context', 'ELMo 2018'),
            ('§5', 'all at once', 'Transformer 2017'),
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
             'Dauphin et al. multiply two linear projections, one squashed. '
             'It predates the Transformer it ends up inside.'),
            ('2017', 'the plain FFN',
             'Two matrices, widened fourfold, with a pointwise nonlinearity '
             'between them. BERT and GPT swap in GELU; the shape stands.'),
            ('2020', 'Shazeer combines them',
             'A GLU inside the FFN. Three matrices, so the hidden width '
             'shrinks to two thirds to pay for it.'),
            ('2023-', 'LLaMA makes it default',
             'SwiGLU in LLaMA, Mistral, Qwen, DeepSeek. Gemma keeps the '
             'GELU-gated variant instead.'),
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
             'A sinusoidal or learned absolute vector, added to the embedding. '
             'The model is told its index and must infer distance.'),
            ('2018', 'distances, not indices',
             'Shaw et al. learn a vector per relative offset, added inside '
             'attention. T5 cuts it to a scalar per bucket.'),
            ('2021', 'rotate instead of add',
             'Su et al. write absolute position in so the dot product depends '
             'only on the difference. Nothing extra in the matmul.'),
            ('2022', 'say nothing at all',
             'The causal mask has already broken permutation equivariance. '
             'Jamba ships with no encoding; Llama 4 interleaves.'),
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
             'Implementations keep past keys and values instead of redoing '
             'them. No paper claims it as a contribution.'),
            ('2019', 'Shazeer names the cost',
             'Incremental decoding is limited by reloading the keys and '
             'values, he argues, and not by the arithmetic at all.'),
            ('2022', 'it gets its name',
             'Pope et al. write "the KV cache" as a defined term while '
             'working out how to serve very large models. The name sticks.'),
            ('2023-', 'the centre of serving',
             'vLLM organises an entire serving system around managing it, '
             'and the cache stops being an implementation detail.'),
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
             'Multi-query attention gives every query head the same keys and '
             'values, dividing the cache by the head count. Quality slips.'),
            ('2023', 'share a few',
             'Grouped-query attention gives each group of query heads its '
             'own, uptrained from a normal checkpoint with 5% of pretraining '
             'compute. Llama 3 and Mistral ship it.'),
            ('2023', 'stop reserving it',
             'vLLM hands the cache out in small blocks as it is needed, the '
             'way an operating system pages memory. Nothing gets smaller.'),
            ('2024', 'compress it',
             'DeepSeek squeezes the keys and values of a token into one '
             'shared latent vector, and reconstructs them on the way in.'),
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
             'Bahdanau et al. let a translator look back at every source '
             'word instead of squeezing the sentence into one vector.'),
            ('2015', 'the score gets simpler',
             'Luong et al. replace the small alignment network with a plain '
             'dot product. Cheaper, and the form still used today.'),
            ('2017', 'drop the recurrence',
             'Vaswani et al. keep only attention, pointed at the sequence '
             'itself. Multiple heads, and the division by the square root '
             'of the width.'),
            ('2018-', 'everything is a transformer',
             'BERT and GPT build on it. By the 2020s, hybrids swap some '
             'attention layers out again to shrink what it must store.'),
        ]),
}


if __name__ == '__main__':
    which = sys.argv[1:] or sorted(ROADMAPS)
    for name in which:
        spec = ROADMAPS[name]
        print('<!-- %s -->' % name)
        print(roadmap(spec['stops'], spec['arrows'], spec['label']))
        print()
