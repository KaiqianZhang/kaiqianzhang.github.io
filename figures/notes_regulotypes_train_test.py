"""Generator for notes/2026-09-06-regulotypes-train-test.md.

The prose is the user's draft, verbatim.  Only the four drawn figures (a
roadmap and Figures 1-3) are synthesised here, plus the notation table and the
Sources list the user asked for.
"""
import math
import os
import re

import numpy as np

OUT = os.path.expanduser('~/Desktop/blog/notes/2026-09-06-regulotypes-train-test.md')

# ---------------------------------------------------------------------------
# helpers -- copied conventions from the 2026-09-04 note's markup
# ---------------------------------------------------------------------------

def sty(**kw):
    """One style attribute per element; everything animation-related goes here."""
    parts = []
    for k, v in kw.items():
        if v is None:
            continue
        parts.append('%s:%s' % (k.replace('_', '-').replace('--', '--'), v))
    return ';'.join(parts)


def S(d=None, dur=None, fill=None, stroke=None, sw=None, length=None,
      op=None, org=None, dx=None, dy=None):
    p = []
    if d is not None:
        p.append('--d:%.2fs' % d)
    if dur is not None:
        p.append('--dur:%.2fs' % dur)
    if length is not None:
        p.append('--len:%.0f' % length)
    if org is not None:
        p.append('--org:%s' % org)
    if dx is not None:
        p.append('--dx:%s' % dx)
    if dy is not None:
        p.append('--dy:%s' % dy)
    if fill is not None:
        p.append('fill:%s' % fill)
    if stroke is not None:
        p.append('stroke:%s' % stroke)
    if sw is not None:
        p.append('stroke-width:%s' % sw)
    if op is not None:
        p.append('opacity:%s' % op)
    return ';'.join(p)


def txt(x, y, s, cls='lbl', fill=None, d=0.0, anim='a-rise', dur=None):
    return ("<text x='%.1f' y='%.1f' class='%s %s' style='%s'>%s</text>"
            % (x, y, cls, anim, S(d=d, dur=dur, fill=fill), s))


def rect(x, y, w, h, rx=0, cls='box', fill=None, stroke=None, sw=None,
         d=0.0, anim='a-pop', dur=None, extra=''):
    return ("<rect x='%.1f' y='%.1f' width='%.1f' height='%.1f' rx='%s' "
            "class='%s %s'%s style='%s'/>"
            % (x, y, w, h, rx, cls, anim, extra,
               S(d=d, dur=dur, fill=fill, stroke=stroke, sw=sw)))


def line(x1, y1, x2, y2, stroke='var(--n-dim)', sw='1.6', d=0.0, dur=0.7,
         cls='a-draw', dash=None):
    ln = math.hypot(x2 - x1, y2 - y1)
    extra = " stroke-dasharray='%s'" % dash if dash else ''
    return ("<path d='M%.1f %.1f L%.1f %.1f' fill='none' class='%s' "
            "stroke-linecap='round'%s style='%s'/>"
            % (x1, y1, x2, y2, cls, extra,
               S(d=d, dur=dur, length=max(ln, 12), stroke=stroke, sw=sw)))


def head(x, y, direction, fill='var(--n-dim)', d=0.0, size=6.0):
    """A small triangular arrowhead at (x, y) pointing 'r', 'l', 'd' or 'u'."""
    h = size
    w = size * 0.55
    if direction == 'r':
        pts = [(x, y), (x - h, y + w), (x - h, y - w)]
    elif direction == 'l':
        pts = [(x, y), (x + h, y + w), (x + h, y - w)]
    elif direction == 'd':
        pts = [(x, y), (x + w, y - h), (x - w, y - h)]
    else:
        pts = [(x, y), (x + w, y + h), (x - w, y + h)]
    return ("<polygon points='%s' class='a-pop' style='%s'/>"
            % (' '.join('%.1f,%.1f' % p for p in pts), S(d=d, fill=fill)))


def arrow(x1, y1, x2, y2, stroke='var(--n-dim)', sw='1.8', d=0.0, dur=0.6,
          direction=None):
    if direction is None:
        direction = ('r' if x2 > x1 else 'l') if abs(x2 - x1) > abs(y2 - y1) \
            else ('d' if y2 > y1 else 'u')
    back = {'r': (-6, 0), 'l': (6, 0), 'd': (0, -6), 'u': (0, 6)}[direction]
    return [line(x1, y1, x2 + back[0], y2 + back[1], stroke, sw, d, dur),
            head(x2, y2, direction, stroke, d + dur * 0.85)]


REPLAY = ("<button class='replay' type='button'><svg viewBox='0 0 24 24' "
          "aria-hidden='true'><path d='M20.5 12a8.5 8.5 0 1 1-2.5-6'/>"
          "<path d='M20.5 3.5v5h-5'/></svg>replay</button>")


def nfig(body, w, h, alt, caption=None, cls='nfig wide'):
    """Emit a figure block with no blank lines inside it (the parser trap)."""
    lines = ["<div class='%s'>" % cls, REPLAY,
             "<svg viewBox='0 0 %d %d' role='img' aria-label='%s'>" % (w, h, alt)]
    lines += [l for l in body if l and l.strip()]
    lines.append('</svg>')
    if caption:
        lines.append(caption)
    lines.append('</div>')
    return '\n'.join(lines) + '\n'


def cap(n, text):
    return ("<div class='caption'><span class='caption-label'>Figure %d.</span> %s</div>"
            % (n, text))


TEACHER = 'var(--n-teacher)'   # cell side: columns, u, U
STUDENT = 'var(--n-student)'   # pair side: rows, beta, lambda
DATA = 'var(--n-data)'         # held out / new
KEPT = 'var(--n-kept)'         # the prediction
LOSS = 'var(--n-loss)'         # the observed test-gene expression
PRUNED = 'var(--n-pruned)'     # held fixed
DIM = 'var(--n-dim)'
INK = 'var(--n-ink)'
PANEL = 'var(--n-panel)'
EDGE = 'var(--n-edge)'

LAM = '&#923;'      # Lambda
lam = '&#955;'      # lambda
BET = '&#946;'      # beta
TIMES = '&#215;'
RARR = '&#8594;'
ENDASH = '&#8211;'
APOS = '&#39;'
CDOT = '&#183;'

# ---------------------------------------------------------------------------
# roadmap
# ---------------------------------------------------------------------------

SECTIONS = [
    ('Learning the reference map', 'the training block, and what it fits', DATA),
    ('Projecting a new cis pair', 'a held-out pair becomes a new row', STUDENT),
    ('Locating cells from a new donor', 'a held-out cell becomes a new column', TEACHER),
    ('Putting the two projections together', 'the 2' + TIMES + '2 design, read in order', PRUNED),
    ('What is actually predicted?', 'a cis effect, then a genotype', KEPT),
    ('Summary', 'the whole mechanism as one matrix', LOSS),
]


def slugify(text):
    text = re.sub(r'<[^>]+>', '', text).strip().lower()
    text = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
    return re.sub(r'[\s_]+', '-', text).strip('-') or 'section'


def roadmap():
    body = []
    y0, step, rh = 30.0, 44.0, 34.0
    n = len(SECTIONS)
    first_c = y0 + rh / 2
    last_c = y0 + (n - 1) * step + rh / 2
    mid = (first_c + last_c) / 2
    body.append(txt(14.0, mid - 6, 'Train', 'lbl bg', STUDENT, 0.00, 'a-pop'))
    body.append(txt(14.0, mid + 16, '&amp; test', 'lbl bg', STUDENT, 0.08, 'a-pop'))
    body.append(
        "<path d='M138 %.1f C134.7 %.1f, 134.7 %.1f, 116 %.1f "
        "C134.7 %.1f, 134.7 %.1f, 138 %.1f' fill='none' class='a-draw' "
        "stroke-linecap='round' stroke-linejoin='round' style='%s'/>"
        % (first_c, first_c, mid, mid, mid, last_c, last_c,
           S(d=0.22, dur=0.90, stroke=STUDENT, sw='2.4')))
    for k, (name, gloss, colour) in enumerate(SECTIONS):
        y = y0 + k * step
        c = y + rh / 2
        dot = 0.45 + 0.08 * k
        body.append("<a href='#%s' class='rm-row'>" % slugify(name))
        body.append("<rect x='128' y='%.1f' width='576' height='%.1f' rx='8' "
                    "fill='transparent'/>" % (y, rh))
        body.append("<circle cx='148.0' cy='%.1f' r='4.0' class='a-beat' "
                    "style='%s'/>" % (c, S(d=dot, dur=2.00, fill=colour)))
        body.append(txt(164.0, c + 5, name, 'lbl', colour, dot))
        body.append(txt(704.0, c + 5, gloss, 'lbl sm end', DIM, dot + 0.10))
        body.append('</a>')
    height = int(y0 + n * step + 22)
    return nfig(body, 720, height,
                'The six sections of this note.', None, 'nfig wide roadmap')


# ---------------------------------------------------------------------------
# Figure 1 -- the fitted R and its two extension operations
# ---------------------------------------------------------------------------

def figure1():
    rng = np.random.default_rng(11)
    S_, I_, K = 9, 18, 2
    U = rng.normal(size=(I_, K))
    U[:, 0] = np.sort(U[:, 0])                  # a smooth first coordinate
    Lam = rng.normal(scale=0.9, size=(S_, K))
    beta = rng.normal(scale=0.45, size=S_)
    R = beta[:, None] + Lam @ U.T
    R = R / np.abs(R).max()

    cell = 20.0
    x0, y0 = 210.0, 64.0
    hi_col, hi_row = 6, 4
    body = []

    body.append(txt(390.0, 30.0, 'the fitted regulotype map  R', 'lbl bg mid',
                    INK, 0.02, 'a-pop'))

    # heat cells, swept left to right
    for j in range(I_):
        for s in range(S_):
            v = float(R[s, j])
            rgb = 'var(--n-red-rgb)' if v >= 0 else 'var(--n-blue-rgb)'
            a = min(0.88, 0.10 + 0.78 * abs(v))
            body.append(rect(x0 + j * cell, y0 + s * cell, cell - 1.4, cell - 1.4,
                             2, 'a-pop' if False else '', 'rgba(%s, %.2f)' % (rgb, a),
                             None, None, 0.12 + 0.030 * j + 0.004 * s, 'a-pop', 0.42))

    mw, mh = I_ * cell, S_ * cell

    # axis labels
    body.append("<text x='52.0' y='%.1f' class='lbl sm mid a-fade' "
                "transform='rotate(-90 52 %.1f)' style='%s'>reference pairs  s</text>"
                % (y0 + mh / 2, y0 + mh / 2, S(d=0.20, fill=DIM)))
    body.append(txt(390.0, 322.0, 'cells / metacells  i  ' + RARR, 'lbl sm mid',
                    DIM, 0.24, 'a-fade'))

    # highlighted column -- one cell's regulotype
    cx = x0 + hi_col * cell
    body.append(rect(cx - 2.6, y0 - 2.6, cell + 3.8, mh + 3.8, 4, '', 'none',
                     TEACHER, '2.6', 1.15, 'a-draw', 0.85))
    body.append(txt(cx + cell / 2, 52.0, 'one cell' + APOS + 's regulotype',
                    'lbl sm mid', TEACHER, 1.35))

    # highlighted row -- one pair's cell-resolved profile
    ry = y0 + hi_row * cell
    body.append(rect(x0 - 2.6, ry - 2.6, mw + 3.8, cell + 3.8, 4, '', 'none',
                     STUDENT, '2.6', 1.60, 'a-draw', 0.85))
    body.append(txt(200.0, ry + cell / 2 + 4, 'one pair' + APOS + 's profile',
                    'lbl sm end', STUDENT, 1.80))

    # the empty new row
    nry = y0 + mh + 10
    body.append(rect(x0, nry, mw, cell, 4, '', 'none', DATA, '2.2',
                     2.15, 'a-fade', 0.55, extra=" stroke-dasharray='6 5'"))
    for j in range(0, I_):
        body.append("<line x1='%.1f' y1='%.1f' x2='%.1f' y2='%.1f' class='a-fade' "
                    "style='%s'/>" % (x0 + j * cell, nry, x0 + j * cell, nry + cell,
                                      S(d=2.25, stroke=DATA, sw='0.7', op='0.45')))
    body.append(txt(390.0, nry + 36.0, 'new cis pair  ' + RARR + '  a new row',
                    'lbl sm mid', DATA, 2.30))

    # the empty new column
    ncx = x0 + mw + 10
    body.append(rect(ncx, y0, cell, mh, 4, '', 'none', DATA, '2.2',
                     2.55, 'a-fade', 0.55, extra=" stroke-dasharray='6 5'"))
    for s in range(0, S_):
        body.append("<line x1='%.1f' y1='%.1f' x2='%.1f' y2='%.1f' class='a-fade' "
                    "style='%s'/>" % (ncx, y0 + s * cell, ncx + cell, y0 + s * cell,
                                      S(d=2.65, stroke=DATA, sw='0.7', op='0.45')))
    body.append(txt(600.0, y0 + mh / 2 - 6, 'new donor cell', 'lbl sm', DATA, 2.70))
    body.append(txt(600.0, y0 + mh / 2 + 10, RARR + '  a new column', 'lbl sm',
                    DATA, 2.78))

    caption = cap(1,
        'Rows are reference variant' + ENDASH + 'gene pairs, columns are cells; red means the '
        'effect allele raises the target gene and blue lowers it. The teal outline is one '
        'column, $R_{:i}$, and the violet outline is one row, $R_{s:}$. The two dashed slots '
        'are what the rest of the note fills in: a held-out pair arrives as a row, a cell from '
        'a held-out donor arrives as a column. Simulated from the model at rank two.')
    return nfig(body, 720, 344,
                'A heatmap of the fitted regulotype matrix with one column and one row '
                'highlighted, and an empty row and empty column waiting to be filled.',
                caption)


# ---------------------------------------------------------------------------
# Figure 2 -- the nested train/test design, built in four stages
# ---------------------------------------------------------------------------

def figure2():
    body = []
    bw, bh = 190.0, 124.0
    lx, rx = 170.0, 470.0
    ty, by = 72.0, 302.0
    lc, rc = lx + bw / 2, rx + bw / 2
    tc, bc = ty + bh / 2, by + bh / 2

    # frame
    body.append("<line x1='150' y1='249' x2='680' y2='249' class='grid a-fade' "
                "style='%s'/>" % S(d=0.10))
    body.append("<line x1='420' y1='58' x2='420' y2='442' class='grid a-fade' "
                "style='%s'/>" % S(d=0.10))

    body.append(txt(lc, 44.0, 'coordinate-training genes', 'lbl sm mid', DIM, 0.14))
    body.append(txt(rc, 44.0, 'test genes', 'lbl sm mid', DIM, 0.18))
    body.append(txt(160.0, tc - 4, 'training', 'lbl sm end', DIM, 0.22))
    body.append(txt(160.0, tc + 12, 'donors', 'lbl sm end', DIM, 0.22))
    body.append(txt(160.0, bc - 4, 'test', 'lbl sm end', DIM, 0.26))
    body.append(txt(160.0, bc + 12, 'donors', 'lbl sm end', DIM, 0.26))

    def block(x, y, colour, title, lines, d):
        out = [rect(x, y, bw, bh, 14, 'box', PANEL, EDGE, None, d, 'a-pop', 0.55),
               rect(x, y, bw, 30, 14, '', colour, None, None, d + 0.06, 'a-pop', 0.45),
               rect(x, y + 16, bw, 14, 0, '', colour, None, None, d + 0.06, 'a-pop', 0.45),
               txt(x + bw / 2, y + 20, title, 'lbl on mid', 'var(--n-on-fill)',
                   d + 0.12, 'a-fade')]
        for k, ln in enumerate(lines):
            out.append(txt(x + bw / 2, y + 58 + k * 24, ln, 'lbl sm mid',
                           INK if k == 0 else DIM, d + 0.18 + 0.06 * k))
        return out

    # stage 1 -- learn the map
    body += block(lx, ty, DATA, 'learn the map',
                  ['estimate  U,  ' + LAM + ',  ' + BET,
                   'this is the reference R',
                   'nothing here is held out'], 0.45)

    # stage 2 -- across genes
    body += arrow(lx + bw, tc + 16, rx, tc + 16, STUDENT, '2', 1.45, 0.55)
    body.append(txt(420.0, tc - 30, 'fix U,', 'lbl sm mid', STUDENT, 1.55))
    body.append(txt(420.0, tc - 14, 'estimate', 'lbl sm mid', STUDENT, 1.60))
    body.append(txt(420.0, tc + 2, 'the new pair', 'lbl sm mid', STUDENT, 1.65))
    body += block(rx, ty, STUDENT, 'project new rows',
                  ['fit  ' + BET + ',  ' + lam + '  for  s*',
                   'the coordinates',
                   'are not re-estimated'], 1.80)

    # stage 3 -- across donors
    body += arrow(lc - 45, ty + bh, lc - 45, by, TEACHER, '2', 2.55, 0.55)
    body.append(txt(lc - 33, tc + 102, 'fix the pair-side', 'lbl sm', TEACHER, 2.65))
    body.append(txt(lc - 33, tc + 118, 'structure, infer a new u', 'lbl sm', TEACHER, 2.70))
    body += block(lx, by, TEACHER, 'infer new columns',
                  ['locate each new cell',
                   'using training genes',
                   'only'], 2.90)

    # stage 4 -- the two meet
    body += arrow(rc, ty + bh, rc, by, STUDENT, '2', 3.55, 0.5)
    body.append(txt(rc + 12, tc + 110, 'carry  ' + BET + ', ' + lam, 'lbl sm',
                    STUDENT, 3.62))
    body += arrow(lx + bw, bc, rx, bc, TEACHER, '2', 3.55, 0.5)
    body.append(txt(420.0, bc - 14, 'carry  u', 'lbl sm mid', TEACHER, 3.62))
    body += block(rx, by, KEPT, 'evaluate',
                  ['the new row meets',
                   'the new column',
                   'nothing is fitted here'], 3.95)

    caption = cap(2,
        'Donors split top to bottom, cis regions split left to right, and the four blocks are '
        'read in the order they appear. The top-left block is the only one that estimates the '
        'map. The violet arrow carries $\\hat U_{\\text{train}}$ to the right and returns '
        '$(\\hat\\beta_{s^\\ast},\\hat\\lambda_{s^\\ast})$; the teal arrow carries the '
        'pair-side structure downwards and returns $\\hat u^{\\text{test}}$. They meet in the '
        'bottom-right, where nothing new is fitted.')
    return nfig(body, 720, 456,
                'A two by two grid of donors against genes, with arrows from the '
                'top-left block to the top-right and bottom-left blocks, meeting in the '
                'bottom-right.', caption)


# ---------------------------------------------------------------------------
# Figure 3 -- from cell location to held-out genetic prediction
# ---------------------------------------------------------------------------

def figure3():
    rng = np.random.default_rng(4)
    body = []
    py, ph = 54.0, 252.0
    p1, p2, p3 = 20.0, 265.0, 510.0
    pw = 190.0
    c1, c2, c3 = p1 + pw / 2, p2 + pw / 2, p3 + pw / 2

    body.append(txt(c1, 32.0, 'locate the cell', 'lbl mid', TEACHER, 0.06, 'a-pop'))
    body.append(txt(c2, 32.0, 'predict the cis effect', 'lbl mid', STUDENT, 0.10, 'a-pop'))
    body.append(txt(c3, 32.0, 'predict the expression', 'lbl mid', KEPT, 0.14, 'a-pop'))
    for k, px in enumerate((p1, p2, p3)):
        body.append(rect(px, py, pw, ph, 14, 'box', PANEL, EDGE, None,
                         0.08 + 0.05 * k, 'a-pop', 0.55))

    # -- panel 1: training-gene expression + genotype -> u
    body.append(txt(c1, 80.0, 'training-gene expression', 'lbl sm mid', DIM, 0.30))
    for j in range(7):
        a = 0.18 + 0.62 * abs(float(rng.normal()))
        body.append(rect(43.0 + j * 21, 90.0, 18, 18, 3, '',
                         'rgba(var(--n-teal-rgb), %.2f)' % min(a, 0.85),
                         None, None, 0.36 + 0.05 * j, 'a-pop', 0.40))
    body.append(rect(70.0, 122.0, 90.0, 26.0, 8, '', DATA, None, None, 0.78,
                     'a-pop', 0.45))
    body.append(txt(115.0, 140.0, 'genotype  x', 'lbl sm on mid',
                    'var(--n-on-fill)', 0.86, 'a-fade'))
    body += arrow(115.0, 154.0, 115.0, 182.0, DIM, '1.6', 0.95, 0.45)

    # the coordinate panel
    body.append(rect(45.0, 190.0, 140.0, 92.0, 8, '', 'var(--n-panel-2)', EDGE,
                     '1.2', 1.20, 'a-pop', 0.5))
    pts = rng.uniform(size=(22, 2))
    for k, (a, b) in enumerate(pts):
        body.append("<circle cx='%.1f' cy='%.1f' r='3.2' class='a-pop' style='%s'/>"
                    % (56 + a * 118, 200 + b * 72,
                       S(d=1.30 + 0.02 * k, fill=DIM, op='0.42')))
    hx, hy = 128.0, 226.0
    body.append("<circle cx='%.1f' cy='%.1f' r='9.5' class='a-glow' style='%s'/>"
                % (hx, hy, S(d=1.95, dur=2.2, fill=DATA, op='0.30')))
    body.append("<circle cx='%.1f' cy='%.1f' r='5.4' class='a-pop' style='%s'/>"
                % (hx, hy, S(d=1.90, fill=DATA)))
    body.append(txt(c1, 300.0, 'u  ' + ENDASH + '  where this cell sits', 'lbl sm mid',
                    TEACHER, 2.05))

    body += arrow(212.0, 180.0, 263.0, 180.0, DIM, '1.8', 2.15, 0.5)

    # -- panel 2: the new pair, held fixed
    body.append(txt(c2, 80.0, 'the new pair, held fixed', 'lbl sm mid', DIM, 2.30))
    body.append(rect(300.0, 92.0, 50.0, 30.0, 8, '', STUDENT, None, None, 2.40,
                     'a-pop', 0.45))
    body.append(txt(325.0, 112.0, BET, 'lbl on mid', 'var(--n-on-fill)', 2.48, 'a-fade'))
    body.append(rect(370.0, 92.0, 50.0, 30.0, 8, '', STUDENT, None, None, 2.44,
                     'a-pop', 0.45))
    body.append(txt(395.0, 112.0, lam, 'lbl on mid', 'var(--n-on-fill)', 2.52, 'a-fade'))
    body += arrow(c2, 130.0, c2, 158.0, DIM, '1.6', 2.60, 0.42)
    body.append(txt(c2, 184.0, 'r  =  ' + BET + '  +  u ' + CDOT + ' ' + lam,
                    'lbl bg mid', INK, 2.75, 'a-pop'))
    body.append(rect(290.0, 212.0, 140.0, 14.0, 7, '', 'var(--n-panel-2)', EDGE,
                     '1.2', 2.85, 'a-fade', 0.4))
    body.append(rect(c2, 212.0, 62.0, 14.0, 7, '', STUDENT, None, None, 2.95,
                     'a-wide', 0.70))
    body.append("<line x1='%.1f' y1='208' x2='%.1f' y2='230' class='a-fade' "
                "style='%s'/>" % (c2, c2, S(d=2.88, stroke=DIM, sw='1.2')))
    body.append(txt(c2, 250.0, 'the cis effect in this cell', 'lbl sm mid', DIM, 3.05))
    body.append(txt(c2, 268.0, 'per effect allele', 'lbl sm mid', DIM, 3.10))

    body += arrow(457.0, 180.0, 508.0, 180.0, DIM, '1.8', 3.20, 0.5)

    # -- panel 3: multiply by genotype, then reveal what is observed
    body.append(txt(c3, 80.0, TIMES + '  the donor' + APOS + 's genotype', 'lbl sm mid',
                    DIM, 3.35))
    body.append(txt(c3, 116.0, 'h  =  x ' + CDOT + ' r', 'lbl bg mid', INK, 3.45, 'a-pop'))
    base = 268.0
    body.append("<line x1='530' y1='%.1f' x2='680' y2='%.1f' class='a-fade' "
                "style='%s'/>" % (base, base, S(d=3.50, stroke=EDGE, sw='1.4')))
    body.append(rect(552.0, base - 74, 44.0, 74.0, 4, '', KEPT, None, None, 3.60,
                     'a-grow', 0.65))
    body.append(txt(574.0, base + 18, 'predicted', 'lbl sm mid', KEPT, 3.75))
    body.append(rect(624.0, base - 62, 44.0, 62.0, 4, '', LOSS, None, None, 4.20,
                     'a-grow', 0.65))
    body.append(txt(646.0, base + 18, 'observed', 'lbl sm mid', LOSS, 4.40))
    body.append("<path d='M574 186 L574 176 L646 176 L646 198' fill='none' "
                "class='a-draw' stroke-linecap='round' style='%s'/>"
                % S(d=4.55, dur=0.7, length=110, stroke=DIM, sw='1.4'))
    body.append(txt(605.0, 166.0, 'evaluate only here', 'lbl sm mid',
                    DIM, 4.75))

    caption = cap(3,
        'One held-out cell, followed all the way through. Its coordinate-training genes and '
        'its donor genotype give $\\hat u_i^{\\mathrm{test}}$; the held-out pair contributes '
        '$(\\hat\\beta_{s^\\ast},\\hat\\lambda_{s^\\ast})$, which were estimated elsewhere and '
        'are not touched here; together they give $\\hat r_{s^\\ast i}$, an effect per effect '
        'allele. Multiplying by $x_{d(i)v}$ turns it into $\\hat h^{\\mathrm{gen}}_{ig}$. The '
        'rose bar is the test gene' + APOS + 's measured expression, which enters at the last '
        'step and nowhere before it. Illustrative values, not a fitted example.')
    return nfig(body, 720, 330,
                'A left to right flow: a held-out cell is located on the map, combined with a '
                'held-out pair to give a cis effect, multiplied by genotype to give a '
                'prediction, and only then compared with the observed expression.', caption)


# ---------------------------------------------------------------------------
# the note
# ---------------------------------------------------------------------------

FRONT = """---
title: 'Regulotypes: how the map is trained and tested'
subtitle: A regulotype map is estimated from a set of donors and cis variant–gene pairs. To test whether it represents reusable genetic-response structure, we need to know how to place a new cis effect and a new cell onto the same map.
date: 2026-09-06
tags: regulotype
keywords: regulotype, train-test design, held-out prediction, transfer across genes, transfer across donors, nested evaluation, cis-regulatory effects, cell-resolved cis effects, latent factor model, blood-brain barrier
---
"""

LEAD = """
In the [previous note](/notes/2026/09/04/regulotypes/), I defined the regulotype of a cell as its cis-effect profile across a reference set of variant–gene pairs.
"""

NOTATION = """
| symbol | meaning |
| --- | --- |
| $s=(v,g)$ | a reference pair: variant $v$ and the gene $g$ nominated for it |
| $i$ | a cell, in practice a within-donor metacell |
| $d(i)$ | the donor that measurement $i$ came from |
| $x_{d(i)v}$ | that donor's allele dosage at $v$ |
| $\\beta_s$ | the average cis effect of pair $s$ across cells |
| $u_i$ | the cellular coordinate of cell $i$, shared across pairs |
| $\\lambda_s$ | how pair $s$ responds to those coordinates |
| $r_{si}$ | the cis effect of pair $s$ in cell $i$, per effect allele |
| $R$ | the $S\\times I$ matrix collecting every $r_{si}$ |
| $m_{ig}$, $b_{d(i)g}$ | the genotype-independent mean, and the donor $\\times$ gene random intercept |
"""

BODY_1 = """
For pair $s=(v,g)$ and cell $i$, the cell-resolved cis effect is

$$
r_{si}=\\beta_s+u_i^{\\mathsf T}\\lambda_s.
$$

Collecting these effects gives

$$
R=\\beta\\mathbf 1^\\mathsf T+\\Lambda U^\\mathsf T.
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
\\left(
\\beta_s+u_i^\\mathsf T\\lambda_s
\\right)
+
\\epsilon_{ig}.
$$

Here $x_{d(i)v}$ is the allele dosage of donor $d(i)$. The term in parentheses is therefore the effect of one additional effect allele in the cellular condition represented by $i$:

$$
r_{si}=\\beta_s+u_i^\\mathsf T\\lambda_s.
$$

The important sharing occurs through $u_i$. The same cellular coordinate is used for many approximately independent cis pairs, while each pair gets its own average effect $\\beta_s$ and loading $\\lambda_s$.

Using a set of **training donors** and **coordinate-training genes**, we estimate

$$
\\hat\\beta,\\qquad
\\hat\\Lambda,\\qquad
\\hat U_{\\text{train}},
$$

and therefore

$$
\\boxed{
\\hat R_{\\text{train}}
=
\\hat\\beta\\mathbf 1^\\mathsf T
+
\\hat\\Lambda\\hat U_{\\text{train}}^\\mathsf T.
}
$$

This is the reference regulotype map.

Although the model is written in terms of $U$ and $\\Lambda$, their orientation is not unique: rotations and rescalings can change the factors without changing $R$. This is why the stable objects for later evaluation are the cell-resolved effects in $R$, distances between its columns, and predictions made from them.
"""

BODY_2 = """
## Projecting a new cis pair

Suppose a variant–gene pair $s^\\ast$ was not used to estimate the reference coordinates.

The cellular coordinates

$$
\\hat U_{\\text{train}}
$$

are now kept fixed. We fit the new pair and estimate

$$
\\hat\\beta_{s^\\ast},
\\qquad
\\hat\\lambda_{s^\\ast}.
$$

Its predicted effect in cell $i$ is

$$
\\hat r_{s^\\ast i}
=
\\hat\\beta_{s^\\ast}
+
\\hat u_i^\\mathsf T\\hat\\lambda_{s^\\ast}.
$$

Across all training cells,

$$
\\hat R_{s^\\ast:}
=
\\left(
\\hat r_{s^\\ast1},
\\ldots,
\\hat r_{s^\\ast I}
\\right).
$$

The result is a new row of $R$.

$$
\\boxed{
\\text{new pair}
\\rightarrow
(\\hat\\beta_{s^\\ast},\\hat\\lambda_{s^\\ast})
\\rightarrow
\\text{new row}.
}
$$

The logic is useful: the new pair did not help determine the cellular coordinate system. We are instead asking whether its genetic effect can be described over a map learned from other cis regions.

This is transfer across genes.

## Locating cells from a new donor

The reverse operation starts with a new donor.

These cells were absent when $U_{\\text{train}}$ was estimated, so they have no coordinates yet. Consequently, they also have no columns in $R$.

The quantities learned from the training donors remain fixed, including the pair-side parameters and fitted prior functions. For a new cell $j$, we infer

$$
\\hat u_j^{\\text{test}}
$$

using the **coordinate-training genes** measured in that donor, their corresponding genotypes, and the covariates and cellular features permitted by the model.

Expression of the genes reserved for final testing is not used here.

Once the coordinate has been inferred,

$$
\\boxed{
\\hat R_{:j}^{\\text{test}}
=
\\hat\\beta+
\\hat\\Lambda\\hat u_j^{\\text{test}}.
}
$$

The result is a new column of $R$:

$$
\\boxed{
\\text{new cell}
\\rightarrow
\\hat u_j^{\\text{test}}
\\rightarrow
\\text{new column}.
}
$$

This step is the bridge I find most important to keep straight. A held-out cell is not matched to an existing regulotype. Instead, the training genes locate the cell on the learned response coordinates; those coordinates then imply its cis-effect profile.

This is transfer across donors.

## Putting the two projections together

Genes and donors are held out separately.

Let the donors be divided into

$$
D_{\\mathrm{train}}
\\quad\\text{and}\\quad
D_{\\mathrm{test}},
$$

and approximately independent cis regions into

$$
S_{\\mathrm{coordinate}}
\\quad\\text{and}\\quad
S_{\\mathrm{test}}.
$$

This produces a useful $2\\times2$ design:

|                     | Coordinate-training genes | Test genes          |
| ------------------- | ------------------------- | ------------------- |
| **Training donors** | Learn the map             | Project new rows    |
| **Test donors**     | Infer new columns         | Evaluate prediction |

The four blocks should be read in order.

**Training donors × coordinate-training genes.**
Estimate the reference cellular coordinates and cis-effect structure:

$$
\\hat U_{\\mathrm{train}},
\\qquad
\\hat\\Lambda_{\\mathrm{coordinate}},
\\qquad
\\hat\\beta_{\\mathrm{coordinate}}.
$$

**Training donors × test genes.**
Keep $U_{\\mathrm{train}}$ fixed and estimate

$$
\\hat\\beta_{\\mathrm{test}},
\\qquad
\\hat\\lambda_{\\mathrm{test}}.
$$

This tells us how a held-out cis pair varies over the learned map.

**Test donors × coordinate-training genes.**
Keep the learned global structure fixed and infer

$$
\\hat U_{\\mathrm{test}}.
$$

This tells us where cells from a held-out donor lie on the same map.

**Test donors × test genes.**
Nothing new is fitted using the test-gene expression in this block. Instead, we combine the test-pair parameters from the top-right with the test-cell coordinate from the bottom-left:

$$
\\boxed{
\\hat r_{s^\\ast i}
=
\\hat\\beta_{s^\\ast}
+
(\\hat u_i^{\\mathrm{test}})^\\mathsf T
\\hat\\lambda_{s^\\ast}.
}
$$

This predicts the cis effect of a held-out pair in a held-out donor.
"""

BODY_3 = """
## What is actually predicted?

The quantity

$$
\\hat r_{si}
$$

is an estimated **cis effect per effect allele**. It is not the realized genetic contribution to expression.

For test pair $s=(v,g)$, the held-out donor carries genotype

$$
x_{d(i)v}.
$$

The predicted genotype-dependent component is therefore

$$
\\boxed{
\\hat h^{\\mathrm{gen}}_{ig}
=
x_{d(i)v}E[\\hat r_{si}].
}
$$

The expression of the test gene is then used to evaluate this prediction.

The complete flow is

$$
\\text{training donors + training genes}
\\longrightarrow
\\text{reference map},
$$

$$
\\text{training donors + test gene}
\\longrightarrow
\\text{new row},
$$

$$
\\text{test donor + training genes}
\\longrightarrow
\\text{new column},
$$

and finally

$$
\\boxed{
\\text{test donor + test gene}
\\longrightarrow
\\text{held-out genetic prediction}.
}
$$

The separation between the last two steps is important. Training genes are allowed to answer

> Where does this new cell lie on the regulotype map?

The test gene is reserved for the different question

> Given that position, can we predict how this allele acts in the cell?
"""

BODY_4 = """
## Summary

The simplest way for me to remember the training and testing mechanism is to think about extending $R$.

* Training donors and coordinate-training genes estimate the reference $R$.
* A new variant–gene pair is projected with $U$ fixed and becomes a **new row**.
* A cell from a new donor is located using coordinate-training genes and becomes a **new column**.
* The new row and new column meet in the test-donor × test-gene block.
* Their intersection gives a predicted cell-resolved cis effect,
  $$
  \\hat r_{si}.
  $$
* Combining this effect with the held-out donor's genotype gives the predicted genetic component,
  $$
  \\hat h^{\\mathrm{gen}}_{ig}.
  $$
* Test-gene expression is kept out of the preceding steps and used to evaluate the prediction.

Or, visually,

$$
\\boxed{
\\begin{array}{c|cc}
&
\\text{training genes}
&
\\text{test genes}
\\\\
\\hline
\\text{training donors}
&
\\text{learn }R
&
\\text{add rows}
\\\\
\\text{test donors}
&
\\text{add columns}
&
\\text{evaluate}
\\end{array}
}
$$

This gives the scaffold for everything that comes next. Before asking whether the estimated regulotype map is biologically interesting, the first task is to make sure that the mathematics and implementation producing each part of this diagram are correct.

## Sources

- Strober *et al.* SURGE: uncovering context-specific genetic-regulation of gene expression from single-cell RNA sequencing using latent-factor models. *Genome Biol* **25**, 28 (2024). [doi:10.1186/s13059-023-03152-z](https://doi.org/10.1186/s13059-023-03152-z)
- Denault *et al.* Covariate-moderated empirical Bayes matrix factorization. *NeurIPS* **38** (2025). [doi:10.52202/085713-1573](https://doi.org/10.52202/085713-1573)
- Cuomo *et al.* CellRegMap: a statistical framework for mapping context-specific regulatory variants using scRNA-seq. *Mol Syst Biol* **18**, e10663 (2022). [doi:10.15252/msb.202110663](https://doi.org/10.15252/msb.202110663)
"""


def main():
    parts = [FRONT, roadmap(), LEAD, NOTATION, BODY_1, figure1(),
             BODY_2, figure2(), BODY_3, figure3(), BODY_4]
    # Every part must be separated by a blank line. Without one, build.py's
    # raw-HTML branch takes lines until the first blank and swallows the prose
    # that follows a figure verbatim.
    doc = '\n\n'.join(p.strip('\n') for p in parts if p.strip()) + '\n'

    # the roadmap anchors must resolve against the headings actually present
    heads = {slugify(h) for h in re.findall(r'^##\s+(.+)$', doc, flags=re.M)}
    for name, _, _ in SECTIONS:
        assert slugify(name) in heads, 'dead roadmap anchor: %s' % name

    # figure numbers must be 1..N with no gaps
    nums = [int(n) for n in re.findall(r"caption-label'>Figure (\d+)\.", doc)]
    assert nums == list(range(1, len(nums) + 1)), nums

    with open(OUT, 'w') as fh:
        fh.write(doc)
    print('wrote %s  (%d lines, %d figures)'
          % (OUT, doc.count('\n'), len(nums)))


if __name__ == '__main__':
    main()
