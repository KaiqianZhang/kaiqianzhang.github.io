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
    boxh = TITLE_DY + 8 + LINE_H * max(len(w) for w in wrapped)
    height = BOX_TOP + boxh + 8

    out = ["<svg viewBox='0 0 %d %d' role='img' aria-label='%s'>"
           % (W, round(height), label)]

    # The spine runs between the first and last dot only, so it does not
    # trail off past the milestones at either end.
    out.append("  <line class='spine' x1='%.1f' y1='%d' x2='%.1f' y2='%d'/>"
               % (centres[0], SPINE_Y, centres[-1], SPINE_Y))

    for i, reason in enumerate(arrows):
        mid = (centres[i] + centres[i + 1]) / 2
        tip = mid + 9
        out.append("  <polygon class='head' points='%.1f,%d %.1f,%d %.1f,%d'/>"
                   % (tip, SPINE_Y, tip - 9, SPINE_Y - 4, tip - 9, SPINE_Y + 4))
        out.append("  <text class='why' x='%.1f' y='%d'>%s</text>"
                   % (mid, SPINE_Y - 13, reason))

    # Each milestone is one <g class='stop'> so the CSS can lift the whole
    # thing — dot, box and text together — when the mouse is over it.
    for i, (year, title, _body) in enumerate(stops):
        cx, x = centres[i], xs[i]
        out.append("  <g class='stop'>")
        out.append("    <rect class='hit' x='%.1f' y='%d' width='%.1f' "
                   "height='%.1f'/>" % (x, SPINE_Y - 10, boxw, boxh + 24))
        out.append("    <circle class='dot' cx='%.1f' cy='%d' r='4.5'/>"
                   % (cx, SPINE_Y))
        out.append("    <rect class='box' x='%.1f' y='%d' width='%.1f' "
                   "height='%.1f' rx='7'/>" % (x, BOX_TOP, boxw, boxh))
        out.append("    <text class='yr' x='%.1f' y='%.1f'>%s</text>"
                   % (cx, BOX_TOP + TITLE_DY - 12, year))
        out.append("    <text class='stage' x='%.1f' y='%.1f'>%s</text>"
                   % (cx, BOX_TOP + TITLE_DY + 2, title))
        for j, line in enumerate(wrapped[i]):
            out.append("    <text class='body' x='%.1f' y='%.1f'>%s</text>"
                       % (cx, BOX_TOP + TITLE_DY + 20 + j * LINE_H, line))
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
        label='Roadmap of the KV cache: an unpublished implementation trick '
              'in 2017, named as a bandwidth cost in 2019, shrunk by grouped '
              'heads in 2023, and paged or compressed after.',
        arrows=['the cache outgrew the arithmetic',
                'one shared head was too few',
                'a small cache, still allocated badly'],
        stops=[
            ('2017-', 'a trick, not a paper',
             'Implementations keep past keys and values instead of redoing '
             'them. No paper claims it as a contribution; the name arrives '
             'around 2022.'),
            ('2019', 'Shazeer names the cost',
             'Multi-query attention. Decoding is limited by reloading K and '
             'V, not by arithmetic, so share one KV head across all queries.'),
            ('2023', 'GQA splits the difference',
             'One KV head per group of query heads, uptrained from an MHA '
             'checkpoint with 5% of pretraining compute. Llama 3 and '
             'Mistral ship it.'),
            ('2023-', 'page it, or compress it',
             'vLLM gives the cache virtual memory and blocks. DeepSeek '
             'compresses K and V into one latent vector per token.'),
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
