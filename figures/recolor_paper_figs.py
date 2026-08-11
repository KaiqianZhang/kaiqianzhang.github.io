"""Recolour the reproduced paper figures into this site's Morandi palette.

The originals live in figures/originals/ so this is reproducible from the repo.
Only hue is changed: every pixel keeps its opacity against white, so line
weights, antialiasing, text and axes are untouched. No data is altered.

Each line-plot pixel is a blend of one pure series colour C with the white
background:  p = 255 - a*(255 - C).  For each pixel we solve for `a` against
every known source colour by least squares, keep the best fit if its residual
is small, and re-emit the pixel with the replacement colour C':
    p' = 255 - a*(255 - C')
Pixels that fit nothing well (black text, grey gridlines) are left alone.

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
# taupe. These match figures/norm_comparison.py.
LN = '#8896AB'
RMS = '#7E9B76'
BASE = '#B0A79B'
PARTIAL = '#BC9A93'


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
    best_alpha = np.zeros(len(ink))
    best_idx = np.full(len(ink), -1)

    for k, (src, _dst) in enumerate(mapping):
        d = 255.0 - rgb(src)                     # direction for this series
        denom = float(d @ d)
        alpha = (ink @ d) / denom
        resid = np.linalg.norm(ink - alpha[:, None] * d[None, :], axis=1)
        take = (resid < best_res) & (alpha > 0.04) & (alpha < 1.15) & chromatic
        best_res[take] = resid[take]
        best_alpha[take] = alpha[take]
        best_idx[take] = k

    out = ink.copy()
    for k, (_src, dst) in enumerate(mapping):
        sel = (best_idx == k) & (best_res < tol)
        if not sel.any():
            continue
        out[sel] = best_alpha[sel][:, None] * (255.0 - rgb(dst))[None, :]
        print('      %s -> %s  (%d px)' % (_src, dst, sel.sum()))

    return Image.fromarray(
        np.clip(255.0 - out, 0, 255).reshape(h, w, 3).astype(np.uint8))


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

# -- Ba, Kiros & Hinton (2016), Figure 1(a) ---------------------------------
print('ba2016-fig1a-recall1.png')
im = flatten(os.path.join(SRC, 'ba2016-fig1a-recall1.png'))
im = recolour(im, [('#0000ff', LN),        # Order-Embedding + LN
                   ('#008000', BASE)])     # Order-Embedding (no norm)
im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(
    os.path.join(OUT, 'layernorm-2016-recall1.png'))

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
im = recolour(im, [('#a9d18e', '#A3BC97'),   # Layer Norm boxes -> sage
                   ('#8faadc', '#A9B7CB'),   # FFN box -> dusty blue
                   ('#ffd966', '#DFCCA3'),   # Attention box -> sand
                   ('#2f528f', '#6E7C93')],  # box outlines
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

print('done ->', OUT)
