"""Measure a post against the four Storey traits worth copying.

What is worth copying from him is clarity, not register: short paragraphs, no
hedging, and a short declarative sentence before the equation rather than
after it. His "we will assume" is textbook convention and reads as a lecture,
so this checks the opposite — that the editorial "we" has stayed out.

Paragraph length and hedging are reported; the sentence-before-the-equation
habit is a judgement call and has to be read.

    python3 figures/style_check.py posts/*.md
    python3 figures/style_check.py --paras posts/x.md   # list the long ones

Prose only: figures, widget scripts, code fences, display maths, tables and
reference lists are all stripped first, so the numbers describe what a reader
actually reads.
"""

import glob
import io
import re
import sys

# "rather than" is a contrast, not a hedge, and "the sort of thing that" is
# idiom — an earlier version of this list caught both and reported four times
# the real number. Modals are left out too: "every token that might come next"
# is correct usage, not softening.
HEDGES = (r'\b(perhaps|arguably|somewhat|fairly|quite|I think|it seems|'
          r'probably|may well|tends to|more or less|in some sense|'
          r'to some extent|reasonably|a bit)\b'
          r'|\brather\b(?!\s+than)')

# "Chat This Over With Friends" is deliberately two paragraphs of 120-150
# words, so its paragraphs are exempt from the over-90 count.
CHAT = 'Chat This Over With Friends'


def prose(path):
    """Every paragraph a reader reads, with the furniture removed."""
    raw = io.open(path, encoding='utf-8').read().split('---', 2)[2]
    raw = re.sub(r'<script>.*?</script>', '', raw, flags=re.S)
    raw = re.sub(r"<div class='[^']*'>.*?\n</div>", '', raw, flags=re.S)
    raw = re.sub(r'```.*?```', '', raw, flags=re.S)

    out, in_chat = [], False
    for block in raw.split('\n\n'):
        b = block.strip()
        if not b:
            continue
        if b.startswith('#'):
            in_chat = CHAT in b
            continue
        if b.startswith(('$$', '[', '<', '-', '|', '>')) or re.match(r'^\d+\.', b):
            continue
        out.append((' '.join(b.split()), in_chat))
    return out


def report(path, show_paras=False):
    paras = prose(path)
    body = [p for p, _ in paras]
    lens = [len(p.split()) for p in body] or [0]
    long_ones = [(p, len(p.split())) for p, chat in paras
                 if len(p.split()) > 90 and not chat]
    text = ' '.join(body)
    hedges = re.findall(HEDGES, text, re.I)
    # A blog post has one author. Quotations keep their own "we" — Shazeer's
    # "We offer no explanation", Barbero's "we argue" — so drop quoted spans
    # before counting, inline ones included, not just blockquotes.
    unquoted = re.sub(r'[“"][^“”"]{0,400}[”"]', ' ', text)
    editorial_we = len(re.findall(r'\b(we|us|our)\b', unquoted, re.I))
    name = path.split('/')[-1][11:-3]
    flags = ''.join([
        ' ' if sorted(lens)[len(lens) // 2] <= 60 else '!',
        ' ' if not long_ones else '!',
        ' ' if len(hedges) <= 2 else '!',
        ' ' if editorial_we == 0 else '!',
    ])
    print('%-24s median %3d   over-90 %2d   hedges %2d   we %2d   %s'
          % (name, sorted(lens)[len(lens) // 2], len(long_ones),
             len(hedges), editorial_we, flags))
    if show_paras:
        for p, n in long_ones:
            print('    [%d] %s...' % (n, p[:150]))
        if hedges:
            print('    hedges:', ', '.join(sorted(set(h.lower() for h in hedges))))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    show = '--paras' in sys.argv
    files = []
    for a in args:
        files.extend(sorted(glob.glob(a)))
    for f in files or sorted(glob.glob('posts/*.md')):
        report(f, show)
