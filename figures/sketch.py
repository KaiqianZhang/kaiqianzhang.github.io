"""Hand-drawn schematic figures, in the site palette.

The explanatory diagrams on this blog are drawn in a deliberately sketched
style -- wobbly outlines, drawn twice, in a handwriting face -- rather than as
crisp vector boxes. The reference is the Excalidraw look. The point is not
decoration: a diagram that is visibly drawn by hand reads as an explanation
somebody is giving you, which is the register the prose is in too, and it
signals honestly that the boxes are a story about the mechanism rather than a
measurement of it. Data figures stay crisp, because those *are* measurements.

Everything here is deterministic. The wobble comes from a seeded generator, so
regenerating a figure produces the identical file and the diff stays empty.

Primitives:
    rough_line, rough_rect, rough_arrow   -- all take a Pen for their jitter

Figures are named in FIGURES at the bottom.

Run:  python3 figures/sketch.py <name>     prints the SVG to paste
      python3 figures/sketch.py            lists the names
"""

import math
import sys

from palette import LAVENDER, BLUE, ROSE, SAGE, CLAY, INK, MARKER


class Pen:
    """A tiny deterministic generator, so a figure is reproducible."""

    def __init__(self, seed=1):
        self.s = seed & 0xFFFFFFFF

    def next(self):
        self.s = (self.s * 1664525 + 1013904223) & 0xFFFFFFFF
        return self.s / 0xFFFFFFFF

    def jit(self, amount=1.0):
        return (self.next() * 2 - 1) * amount


def _bowed(x1, y1, x2, y2, pen, bow):
    """One stroke from a to b, bowed slightly off the straight line."""
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / length, dx / length
    off = pen.jit(bow)
    mx, my = (x1 + x2) / 2 + nx * off, (y1 + y2) / 2 + ny * off
    return 'M%.1f,%.1f Q%.1f,%.1f %.1f,%.1f' % (x1, y1, mx, my, x2, y2)


def rough_line(x1, y1, x2, y2, pen, cls='sk-s', bow=1.2, passes=2):
    out = []
    for _ in range(passes):
        out.append("<path class='%s' d='%s'/>" % (
            cls, _bowed(x1 + pen.jit(0.7), y1 + pen.jit(0.7),
                        x2 + pen.jit(0.7), y2 + pen.jit(0.7), pen, bow)))
    return out


def rough_rect(x, y, w, h, pen, cls='sk-s', r=8, fill=None, passes=2):
    """A rounded rectangle that looks drawn rather than plotted."""
    out = []
    if fill:
        out.append("<rect x='%.1f' y='%.1f' width='%.1f' height='%.1f' rx='%d' "
                   "fill='%s' stroke='none'/>" % (x, y, w, h, r, fill))
    for _ in range(passes):
        j = lambda: pen.jit(0.9)
        x0, y0 = x + j(), y + j()
        x1, y1 = x + w + j(), y + h + j()
        d = ('M%.1f,%.1f ' % (x0 + r, y0) +
             'Q%.1f,%.1f %.1f,%.1f ' % ((x0 + x1) / 2, y0 + pen.jit(1.0), x1 - r, y0) +
             'Q%.1f,%.1f %.1f,%.1f ' % (x1, y0, x1, y0 + r) +
             'Q%.1f,%.1f %.1f,%.1f ' % (x1 + pen.jit(1.0), (y0 + y1) / 2, x1, y1 - r) +
             'Q%.1f,%.1f %.1f,%.1f ' % (x1, y1, x1 - r, y1) +
             'Q%.1f,%.1f %.1f,%.1f ' % ((x0 + x1) / 2, y1 + pen.jit(1.0), x0 + r, y1) +
             'Q%.1f,%.1f %.1f,%.1f ' % (x0, y1, x0, y1 - r) +
             'Q%.1f,%.1f %.1f,%.1f ' % (x0 + pen.jit(1.0), (y0 + y1) / 2, x0, y0 + r) +
             'Q%.1f,%.1f %.1f,%.1f' % (x0, y0, x0 + r, y0))
        out.append("<path class='%s' d='%s'/>" % (cls, d))
    return out


def rough_arrow(x1, y1, x2, y2, pen, cls='sk-s', bow=1.2, head=7):
    out = rough_line(x1, y1, x2, y2, pen, cls, bow)
    ang = math.atan2(y2 - y1, x2 - x1)
    for a in (ang + 2.6, ang - 2.6):
        out += rough_line(x2, y2, x2 + head * math.cos(a), y2 + head * math.sin(a),
                          pen, cls, bow=0.5, passes=1)
    return out


def text(x, y, s, cls='sk-t', anchor='middle'):
    return ["<text class='%s' x='%.1f' y='%.1f' text-anchor='%s'>%s</text>"
            % (cls, x, y, anchor, s)]


def box(x, y, w, h, label, pen, cls='sk-s', fill=None, sub=None, r=8):
    out = rough_rect(x, y, w, h, pen, cls, r, fill)
    if sub:
        out += text(x + w / 2, y + h / 2 - 2, label)
        out += text(x + w / 2, y + h / 2 + 13, sub, cls='sk-sub')
    else:
        out += text(x + w / 2, y + h / 2 + 5, label)
    return out


def svg(w, h, body, label):
    return ("<svg viewBox='0 0 %d %d' role='img' aria-label='%s'>\n  %s\n</svg>"
            % (w, h, label, '\n  '.join(body)))


# -- the figures ------------------------------------------------------------

def fig_bottleneck():
    """Attention, Figure 1: one vector for everything, versus looking back."""
    p = Pen(7)
    b = []
    src = ["L'accord", 'sur', 'la', 'zone']
    b += text(12, 22, 'before 2014', cls='sk-lbl', anchor='start')
    for i, w in enumerate(src):
        b += box(14, 38 + i * 34, 78, 26, w, p, 'sk-s2')
        b += rough_line(92, 51 + i * 34, 152, 100, p, 'sk-thin')
    b += box(152, 86, 76, 28, 'one vector', p, 'sk-mark')
    b += rough_arrow(228, 100, 262, 74, p, 'sk-thin')
    b += rough_arrow(228, 100, 262, 126, p, 'sk-thin')
    b += box(262, 60, 84, 28, 'The', p, 'sk-s3')
    b += box(262, 112, 84, 28, 'agreement', p, 'sk-s3')
    b += text(180, 188, 'the whole sentence, through one gap', cls='sk-note')

    b += rough_line(372, 26, 372, 196, p, 'sk-faint', bow=0.6, passes=1)

    b += text(396, 22, 'after 2014', cls='sk-lbl', anchor='start')
    for i, w in enumerate(src):
        b += box(398, 38 + i * 34, 78, 26, w, p, 'sk-s2')
    for i in range(4):
        b += rough_line(476, 51 + i * 34, 596, 74, p, 'sk-att')
        b += rough_line(476, 51 + i * 34, 596, 126, p, 'sk-att')
    b += box(596, 60, 108, 28, 'The', p, 'sk-s3')
    b += box(596, 112, 108, 28, 'agreement', p, 'sk-s3')
    b += text(556, 188, 'each word picks its own blend', cls='sk-note')
    return svg(720, 208, b,
               'Two ways to translate. On the left four source words funnel '
               'into a single vector and the output is written from that '
               'alone. On the right every output word is joined directly to '
               'every source word.')


def fig_loop():
    """The KV cache, Figure 1: the sequence grows by one token per call."""
    p = Pen(11)
    b = []
    rows = [['the', 'cat', 'sat'], ['the', 'cat', 'sat', 'on'],
            ['the', 'cat', 'sat', 'on', 'the'],
            ['the', 'cat', 'sat', 'on', 'the', 'mat']]
    made = ['on', 'the', 'mat', '.']
    for r, toks in enumerate(rows):
        y = 26 + r * 44
        b += text(10, y + 19, 'call %d' % (r + 1), cls='sk-lbl', anchor='start')
        for i, t in enumerate(toks):
            b += box(70 + i * 64, y, 58, 26, t, p, 'sk-s2')
        x = 70 + len(toks) * 64
        b += rough_arrow(x + 2, y + 13, x + 26, y + 13, p, 'sk-thin', head=6)
        b += box(x + 30, y, 58, 26, made[r], p, 'sk-mark')
    b += text(600, 108, 'every call is handed', cls='sk-note')
    b += text(600, 124, 'all of it again', cls='sk-note')
    return svg(720, 216, b,
               'Four calls to a model. Each row repeats every token of the row '
               'above it and adds one newly generated token at the end.')


def fig_where():
    """The KV cache, Figure 2: where the cache sits in one attention layer."""
    p = Pen(23)
    b = []
    b += text(12, 100, 'one new', cls='sk-note', anchor='start')
    b += text(12, 115, 'token', cls='sk-note', anchor='start')
    for i, (lab, y) in enumerate([('query', 40), ('key', 96), ('value', 152)]):
        b += rough_line(62, 104, 96, y + 14, p, 'sk-thin')
        b += box(96, y, 74, 28, lab, p, 'sk-s2' if i else 'sk-s3')
    b += text(133, 208, 'used once,', cls='sk-note')
    b += text(133, 223, 'then thrown away', cls='sk-note')
    b += rough_arrow(170, 110, 236, 110, p, 'sk-thin', head=6)
    b += rough_arrow(170, 166, 236, 166, p, 'sk-thin', head=6)
    b += box(236, 84, 168, 52, 'key cache', p, 'sk-s', sub='one row per token')
    b += box(236, 140, 168, 52, 'value cache', p, 'sk-s', sub='one row per token')
    b += rough_line(404, 110, 470, 66, p, 'sk-thin')
    b += rough_line(404, 166, 470, 66, p, 'sk-thin')
    b += rough_line(170, 54, 470, 60, p, 'sk-thin')
    b += box(470, 42, 96, 40, 'attention', p, 'sk-mark')
    b += rough_arrow(566, 62, 626, 62, p, 'sk-thin', head=6)
    b += text(660, 67, 'out', cls='sk-lbl')
    b += text(480, 216, 'kept for the whole conversation,', cls='sk-note')
    b += text(480, 231, 'and read in full at every step', cls='sk-note')
    return svg(720, 242, b,
               'One attention layer as a new token arrives. It is projected '
               'into a query, a key and a value. The key and value are '
               'appended to two growing stores; the query is used once and '
               'discarded.')


def fig_guests():
    """What the KV cache costs, Figure 1: shared weights, private caches."""
    p = Pen(31)
    b = []
    b += text(14, 24, 'shared by everyone', cls='sk-lbl', anchor='start')
    b += box(14, 36, 168, 148, 'model weights', p, 'sk-s3',
             sub='read once per step')
    b += text(212, 24, 'one per conversation, shared with nobody',
              cls='sk-lbl', anchor='start')
    widths = [430, 300, 496, 210]
    for i, w in enumerate(widths):
        y = 36 + i * 38
        b += rough_rect(212, y, 494, 30, p, 'sk-faint', r=6)
        b += rough_rect(214, y + 2, w, 26, p, 'sk-s', r=5, fill=LAVENDER)
        # Inside the bar, so a long one cannot push its label off the edge.
        b += text(226, y + 20, 'conversation %d' % (i + 1), cls='sk-in',
                  anchor='start')
    b += text(360, 208, 'every one of these is read on every step, too',
              cls='sk-note')
    return svg(720, 222, b,
               'One block of model weights read by every conversation, beside '
               'four separate caches of different sizes, one per conversation '
               'and usable by nobody else.')


FIGURES = {
    'bottleneck': fig_bottleneck,
    'loop': fig_loop,
    'where': fig_where,
    'guests': fig_guests,
}


if __name__ == '__main__':
    names = sys.argv[1:] or sorted(FIGURES)
    for n in names:
        print('<!-- %s -->' % n)
        print(FIGURES[n]())
        print()
