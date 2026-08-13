"""Recolour the reproduced paper figures into this site's Morandi palette.

The originals live in figures/originals/ so this is reproducible from the repo.
Only hue is changed: every pixel keeps its opacity against white, so line
weights, antialiasing, text and axes are untouched. No data is altered.

Two blend models are fitted per pixel, against every known source colour C:

    toward white   p = 255 - a*(255 - C)     antialiased line and box edges
    toward black   p = b*C                   antialiased text sitting on a fill

The better fit wins, and the pixel is re-emitted with the replacement colour C'
under the same model. The second model matters whenever a figure has black
text on a coloured box: those edge pixels are blends of C with black, and
without it they keep the old hue and fringe the text.

Pixels that fit nothing well, and all near-grey pixels (black text, grey
gridlines, axes), are left alone.

Run:  python3 figures/recolor_paper_figs.py
"""

import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'originals')
OUT = os.path.join(os.path.dirname(HERE), 'static', 'images')

# The site palette. Semantics are kept consistent across every figure:
# LayerNorm is dusty blue, RMSNorm is sage green, an un-normalized baseline is
# plum. These match figures/norm_comparison.py.
LN = '#5F7396'
RMS = '#6E8C66'
BASE = '#8B7194'
PARTIAL = '#A87D76'
MARK = '#A8443E'      # annotation markers, kept salient on purpose

# Pre-norm / post-norm post. Pre-LN is blue, Post-LN is plum, and Post-LN
# rescued by warm-up is sage, held constant across both reproduced figures.
PRE = '#5F7396'
PRE2 = '#6B8FA8'
POST = '#8B7194'
POSTW = '#6E8C66'


def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)


def recolour(img, mapping, tol=45.0):
    """mapping: list of (source_hex, target_hex)."""
    a = np.asarray(img.convert('RGB')).astype(float)
    h, w, _ = a.shape
    flat = a.reshape(-1, 3)
    ink = 255.0 - flat                           # opacity-weighted colour
    # Grey pixels (gridlines, axes, text) can accidentally fit a colour
    # direction well enough to pass the residual test. Exclude them by hue.
    chromatic = (flat.max(1) - flat.min(1)) > 22

    best_res = np.full(len(ink), np.inf)
    best_coef = np.zeros(len(ink))
    best_idx = np.full(len(ink), -1)
    best_model = np.zeros(len(ink), dtype=np.int8)   # 0 = white, 1 = black

    for k, (src, _dst) in enumerate(mapping):
        c = rgb(src)
        for model, basis, obs in ((0, 255.0 - c, ink), (1, c, flat)):
            coef = (obs @ basis) / float(basis @ basis)
            resid = np.linalg.norm(obs - coef[:, None] * basis[None, :], axis=1)
            take = ((resid < best_res) & (coef > 0.04) & (coef < 1.15)
                    & chromatic)
            best_res[take] = resid[take]
            best_coef[take] = coef[take]
            best_idx[take] = k
            best_model[take] = model

    out = flat.copy()
    for k, (_src, dst) in enumerate(mapping):
        c2 = rgb(dst)
        hit = (best_idx == k) & (best_res < tol)
        white = hit & (best_model == 0)
        black = hit & (best_model == 1)
        out[white] = 255.0 - best_coef[white][:, None] * (255.0 - c2)[None, :]
        out[black] = best_coef[black][:, None] * c2[None, :]
        print('      %s -> %s  (%d px: %d edge, %d text)'
              % (_src, dst, hit.sum(), white.sum(), black.sum()))

    return Image.fromarray(
        np.clip(out, 0, 255).reshape(h, w, 3).astype(np.uint8))


def flatten(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    return Image.alpha_composite(bg, im).convert('RGB')


def trim(img, pad=12):
    a = np.asarray(img).astype(int)
    ys, xs = np.where(a.sum(2) < 720)
    return img.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0),
                     min(xs.max() + pad + 1, img.width),
                     min(ys.max() + pad + 1, img.height)))


os.makedirs(OUT, exist_ok=True)

# -- Zhang & Sennrich (2019), Figure 1(a) and 1(b) --------------------------
# The paper's motivating figure: the same runs measured in steps and in
# seconds. This is the argument RMSNorm exists to answer.
for src, dst in (('zhang2019-fig1a-loss-vs-steps.png', 'rmsnorm-loss-vs-steps.png'),
                 ('zhang2019-fig1b-loss-vs-time.png', 'rmsnorm-loss-vs-time.png')):
    print(src)
    im = flatten(os.path.join(SRC, src))
    im = recolour(im, [('#1f77b4', BASE),   # Baseline, no normalization
                       ('#ff7f0e', LN),     # LayerNorm
                       ('#ff0000', MARK)])  # the annotated loss markers
    im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(
        os.path.join(OUT, dst))

# -- Zhang & Sennrich (2019), Figure 2(a) -----------------------------------
print('zhang2019-fig2a-recall1.png')
im = flatten(os.path.join(SRC, 'zhang2019-fig2a-recall1.png'))
im = recolour(im, [('#1f77b4', BASE),      # Baseline
                   ('#ff7f0e', LN),        # LayerNorm
                   ('#2ca02c', RMS),       # RMSNorm
                   ('#d62728', PARTIAL)])  # pRMSNorm
im.resize((im.width * 3, im.height * 3), Image.LANCZOS).save(
    os.path.join(OUT, 'rmsnorm-2019-recall1.png'))

# -- Xiong et al. (2020), Figure 1, split into its two panels ---------------
print('xiong2020-fig1-preln-postln.png')
im = flatten(os.path.join(SRC, 'xiong2020-fig1-preln-postln.png'))
# Box fills sit behind black text, so they stay lighter than the line colours.
im = recolour(im, [('#a9d18e', '#8FB183'),   # Layer Norm boxes -> sage
                   ('#8faadc', '#8DA3C6'),   # FFN box -> dusty blue
                   ('#ffd966', '#C7B0D2'),   # Attention box -> lilac
                   ('#2f528f', '#4F5F7D')],  # box outlines
             tol=60)
panels = {'transformer-postln-block.png': im.crop((0, 0, 303, im.height)),
          'transformer-preln-block.png': im.crop((303, 0, im.width, im.height))}
height = max(trim(p).height for p in panels.values())
for name, panel in panels.items():
    p = trim(panel)
    canvas = Image.new('RGB', (p.width, height), 'white')
    canvas.paste(p, (0, 0))
    canvas.resize((p.width * 3, height * 3), Image.LANCZOS).save(
        os.path.join(OUT, name))

# -- Xiong et al. (2020), Figure 3(b): gradient magnitude by layer ----------
print('xiong2020-fig3b-grad-by-layer.png')
im = flatten(os.path.join(SRC, 'xiong2020-fig3b-grad-by-layer.png'))
im = recolour(im, [('#3274a1', PRE),      # Pre-LN (init)
                   ('#e1812c', POST),     # Post-LN (init)
                   ('#3a913a', POSTW)])   # Post-LN (after warm-up)
im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(
    os.path.join(OUT, 'preln-grad-by-layer.png'))

# -- Xiong et al. (2020), Figure 4(b): BLEU with and without warm-up --------
print('xiong2020-fig4b-bleu-warmup.png')
im = flatten(os.path.join(SRC, 'xiong2020-fig4b-bleu-warmup.png'))
im = recolour(im, [('#1f77b4', POST),     # Post-LN, RAdam, no warm-up
                   ('#ff7f0e', PRE2),     # Pre-LN,  RAdam, no warm-up
                   ('#2ca02c', POSTW),    # Post-LN, Adam,  with warm-up
                   ('#d62728', PRE)])     # Pre-LN,  Adam,  no warm-up
im.resize((im.width * 3, im.height * 3), Image.LANCZOS).save(
    os.path.join(OUT, 'preln-bleu-warmup.png'))

# -- Su et al. (2021), Figure 2: the long-term decay bound ------------------
print('su2021-fig2-long-term-decay.png')
im = flatten(os.path.join(SRC, 'su2021-fig2-long-term-decay.png'))
im = recolour(im, [('#5e81b5', PRE)])     # the single plotted curve
im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(
    os.path.join(OUT, 'rope-long-term-decay.png'))

# -- Mikolov et al. (2013), Figure 1 ----------------------------------------
# Pure black line art, so there is no hue to swap. Tint it instead: every
# pixel keeps its darkness and is re-emitted in the site's ink colour.
print('mikolov2013-fig1-cbow-skipgram.png')
im = flatten(os.path.join(SRC, 'mikolov2013-fig1-cbow-skipgram.png'))
a = np.asarray(im).astype(float)
alpha = (255.0 - a.mean(2, keepdims=True)) / 255.0      # 0 = white, 1 = black
ink = rgb('#4A5468')
tinted = 255.0 - alpha * (255.0 - ink)[None, None, :]
im = Image.fromarray(np.clip(tinted, 0, 255).astype(np.uint8))
im = trim(im, pad=16)
im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(
    os.path.join(OUT, 'word2vec-architectures.png'))
print('      tinted to #4A5468 (%d x %d)' % (im.width, im.height))

print('done ->', OUT)
