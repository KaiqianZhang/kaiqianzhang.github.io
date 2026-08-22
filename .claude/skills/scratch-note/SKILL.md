---
name: scratch-note
description: Write a new Scratch Note for the site at ~/Desktop/blog (published at kaiqianzhang.github.io/notes/). Use when the user asks to turn notebook pages or scans into a scratch note, or invokes /scratch-note. Handles transcription, fact-verification against primary sources, drawn animated figures, interactive labs, building, and pushing live.
---

# Writing a scratch note

Scratch notes live at `~/Desktop/blog/notes/` and publish to
<https://kaiqianzhang.github.io/notes/> from `docs/` on `main`. Read that
repo's `README.md` first — the **Sections** section documents the machinery
this skill drives.

A scratch note is the user's own handwritten notebook page, made legible,
verified, and turned into something you can poke at. It has its own rules,
which are in this file and nowhere else; do not carry conventions in from
anything else you have written for this repo. If you find yourself deciding
what to cut, you are writing the wrong thing — see the first rule below.

## What a scratch note is, which decides everything else

**The source is a page of the user's notebook, and the page is the spec.**

That single fact settles most editorial questions, so apply it before any
other rule in this file:

- **Completeness beats selection.** The user's standing instruction is *"don't
  miss any point on my notes."* Every line, formula, arrow, side note and
  struck-through aside on the scan gets covered. A dropped point is a defect,
  however tidy dropping it would make the note.
- **The notebook's structure is the note's structure.** Follow the page's own
  order and its own headings. If the page says *Side Note*, the note gets a
  side note. If the page numbers five steps ⟨1⟩–⟨5⟩, so does the note.
- **Verification is additive, never corrective-by-stealth.** Check everything
  against primary sources and bring in real numbers, but never quietly rewrite
  what the page says. Where the page simplifies, says something dated, or is
  generous to somebody, **flag it in the note** — as a marked aside, in the
  user's own framing. See *Honest flags* below.
- **It should be fun to read.** The user asked for colour, motion, and things
  to drag. A correct note that reads like a transcript has failed half the
  job.

## Settled preferences

These are the user's decisions from previous notes. **Do not re-ask any of
them.** Ask only about the things listed under *What to ask* below.

### Placement and furniture

| Thing | Setting |
|---|---|
| Content directory | `notes/`, filename `YYYY-MM-DD-slug.md` |
| Section config | `sections[]` in `site.json`, `path: notes` |
| Categories | The fixed ten in `site.json`; pick 1–2, do not invent new ones without asking |
| Row icon | 🍦 (`post_icon` on the section) |
| Index epigraph | *"Learning for the sake of learning."* |
| Note furniture | Keywords chips, date + read-time byline, `[TOC]`, like button — all four |
| Front matter | `title`, `subtitle`, `date`, `tags`, `keywords` |

### Typography, which is deliberately split

- **The note itself** is set in Excalifont — everything except fenced code and
  MathJax, which opt back out. This is `body.notes-note`.
- **The listing and category pages** use the site's ordinary face and the
  blog's own epigraph and tag-row styling. They are navigation, not notebook.
  This is `body.notes-site` without `notes-note`.
- **The top nav** stays in the site's face (`-apple-system, Helvetica, arial,
  sans-serif`) even on a note. It is the same nav every page has.
- Title hover in a listing is the site's ordinary grey. No special colour.

### Colour

Saturated Morandi, purple-leaning, **with real contrast — never faded**. The
palette is in `static/css/notes.css` and is declared as **roles, not shades**,
so a reader learns six colours once and can read every figure without a
legend. Reuse them; do not introduce new hues per note.

| Role | Variable | Used for |
|---|---|---|
| teacher | `--n-teacher` (teal) | the frozen/large/reference thing |
| student | `--n-student` (violet) | the learning/small/proposed thing |
| loss | `--n-loss` (rose) | loss, error, the failure mode |
| pruned | `--n-pruned` (clay) | removed, inactive, discarded |
| kept | `--n-kept` (sage) | retained, always-on, the good case |
| data | `--n-data` (ochre) | inputs, datasets, the prompt |

Keywords are **coloured chips on the note** and **muted chips on the
listing**, both labelled `Keywords:`. That split is intentional: the note's
page carries meaning-bearing colour, the listing is for scanning titles.

### Figures and motion

- **At least as many animated figures as the user drew on the page.** In
  practice both notes so far shipped **eight**. Treat eight as the floor for a
  two-page spread.
- Every drawn figure on the scan gets a rendered counterpart. Extra figures
  are welcome where they earn their place — a comparison the page implies, a
  quantity the page states but does not picture.
- **Scroll-triggered and replayable.** A figure starts paused, plays when it
  scrolls into view, and has a Replay control. Nothing loops forever except
  deliberate ambient motion.
- `prefers-reduced-motion` lands on the **finished drawing**, never a blank
  stage.

### Interactive labs

- **Three to four per note.** Each maps to a distinct concept on the page.
- **Labs compute; they do not quote.** Anchor every lab on real published
  numbers and make the presets reproduce them *exactly*. Precedents:
  - Lab 2 in the LLaMA 3 note computes from the real Llama 3.1 8B shape, so
    pruning half the layers lands on 4.54B — the size NVIDIA shipped.
  - Lab 1 in the LLaMA 4 note solves per-expert size from Meta's published
    totals, so Scout reads 109 B / 17 B and Maverick 400 B / 17 B.
  - If a preset comes out at 401 B for a model the world calls 400 B, that is
    a bug. Refine the slider `step` until it lands.
- **Anything illustrative must say so in the caption.** The LLaMA 3 note's
  hidden-state KL₂ is a made-up decay curve and the caption says exactly that.
  Never let a fabricated quantity sit next to computed ones unlabelled.
- Reference model for the interaction feel:
  <https://akeylab.github.io/correlated-traits-prediction/>

### Shipping

- **Build, commit, and push live.** That is the standing instruction.
- Run the full verification below *before* pushing, not after.

## What to ask

Almost nothing. Only:

1. **Which scans**, if the invocation did not name them.
2. **Which categories**, if the material does not obviously land in one or two
   of the ten. Propose your best guess rather than asking open-ended.
3. **The title**, if the user did not give one. Match the established shape:
   `<Topic> in LLaMA<n>` — "Pruning & Distillation in LLaMA3", "Long Context &
   MoE in LLaMA4".

If the user says "grill me", use the `grill-me` skill and ask properly. If
they do not, do not manufacture a checkpoint — the preferences above are
already the answers.

## The pipeline

### 1. Read the scans

Photos of a notebook are usually rotated. Rotate them upright **first**, save
them into `static/images/` at the same time, then read the rotated copies —
you get the asset and the legible source in one step:

```python
from PIL import Image
im = Image.open(src).rotate(-90, expand=True)   # -90 for the usual orientation
im.thumbnail((1500, 1900), Image.LANCZOS)
im.save(dst, 'JPEG', quality=78, optimize=True)
```

Name them `scratch-<topic>-scan-N.jpg`. Read every rotated image with the
Read tool and confirm your transcription against it before writing anything.

### 2. Transcribe, exhaustively

Write out a checklist of **every** point on the page — every bullet, formula,
box, arrow label, marginal note, and side note. Keep it and tick it off as
you write. This is the mechanism that satisfies "don't miss any point"; doing
it from memory does not work.

### 3. Verify against primary sources

Every number, name, formula and claim. Fetch the actual paper, model card, or
release post — not a summary of it. Record the exact figures you will quote
and where each came from. Every note ends with a `## Sources` list of real
links.

### 4. Honest flags

Where verification and the page disagree, or where the source is silent, say
so in the note. Do it in a marked `<div class='sidenote'>` with a tag that
names the issue, generously and without condescension. Established examples:

- The LLaMA 3 note: the page writes KL(P‖Q) with P as the student — the
  *reverse* KL — while Minitron minimises the forward one.
- The LLaMA 4 note: MoE predates Mixtral by a long way; Scout was trained at
  256K and generalises to 10M rather than being trained there; Meta describes
  inference-time attention temperature scaling without ever naming SSMax.

Aim for two or three per note. Zero usually means you did not check hard
enough.

### 5. Write it with a generator script

**Do not hand-write hundreds of SVG elements into markdown.** Write a Python
generator in the scratchpad that emits the `.md` file, with the prose as
verbatim triple-quoted strings and the repetitive SVG built in loops. Both
existing notes were produced this way. Keep the generator; it is how the note
gets revised.

Reuse the helpers: `nfig()`, `d(seconds, fill)`, `box()`, `arrow()`, `ctl()`,
`seg()`, `stat()`, `lab()`. Copy them from a previous note's generator.

Lab behaviour goes in `static/css/notes.css` and `static/js/notes.js`,
appended alongside the existing labs — one `init*Lab()` per lab, called at the
bottom of the IIFE.

### 6. Build, verify, ship

```sh
cd ~/Desktop/blog && python3 build.py
```

## Mechanical traps

Every one of these has actually broken a note. Check them.

- **Raw HTML blocks must contain no blank lines.** The markdown parser takes a
  raw block while lines are non-blank, so one empty line inside a `<div>` ends
  it early and the rest becomes `<p>` soup. The generator should filter empty
  lines out of every emitted block.
- **One `style` attribute per element.** If a helper emits `style='--d:0.3s'`
  and you also write `style='fill:…'`, the browser keeps only the first and
  silently drops the other. This is why `d()` takes an optional `fill`.
- **Figures must be numbered 1..N with no gaps.** `check_figures()` in
  `build.py` fails the build otherwise. Renumber every caption when inserting
  a figure.
- **`$` and backticks inside raw HTML get eaten** by the math and inline-code
  extractors, which run over the whole document before block parsing. Use
  entities or unicode inside SVG.
- **Replay must destroy and rebuild the animation**, not toggle
  `animation-play-state`. Every animation is `forwards`; resuming a finished
  one holds its last frame and looks like nothing happened. The working form
  is in `play()` in `notes.js`: drop `animation` inline, force a reflow, clear
  the inline value, re-add `is-playing`.
- **Long SVG `<text>` does not wrap.** A sentence-length label will run
  straight out of the frame. Put prose in the caption, not in the drawing.
- **Scroll restoration will fight you** while verifying in a browser. Set
  `history.scrollRestoration = 'manual'` before scrolling, and do not trust a
  screenshot taken right after a navigation.

## Verification, before the push

Run all of it. Fix, rebuild, re-run anything a fix touched.

**1. Markup.** Parse every `<svg>` in the built page as XML; zero malformed.

**2. Geometry.** In a browser, force every figure to its finished state, then
for each `svg[viewBox]` compute the union bounding box of its children —
including CSS transforms — and assert nothing escapes the `viewBox` on any
side. Also assert the page itself has no horizontal overflow. This catches a
class of bug that is invisible by eye and it has caught one in every note so
far.

**3. Labs.** Drive every slider across its whole range and click every segment
button. Assert: no thrown errors, and no readout containing `NaN`,
`undefined`, or `Infinity`. A widget that is clean at its default routinely
breaks at the ends of its range.

**4. Anchors.** Assert each lab's presets reproduce the real published numbers
exactly.

**5. Replay.** Click Replay on every figure and assert the animations return
to roughly zero, then finish again.

**6. Dark mode.** Set `data-theme="dark"` and look at a figure-heavy section.

**7. Regression.** Load the *previous* note and re-run 3 and 5 on it — new
labs share `notes.js` with the old ones.

**8. Read it.** Screenshot the front matter, two or three figures and one lab.
Confirm the keywords are coloured on the note and muted on the listing.

Report findings honestly, including anything left unfixed and why. If a check
found nothing, say so plainly rather than inventing something to look
thorough.

## Finishing

Commit with a message that says what the note covers, what was verified, and
what was flagged. Push. Then confirm the deploy is actually live rather than
assuming it:

```sh
until curl -sf -o /dev/null "https://kaiqianzhang.github.io/notes/<path>/"; do sleep 5; done
diff <(curl -s https://kaiqianzhang.github.io/js/notes.js) docs/js/notes.js
git fetch -q origin && git rev-list --count origin/main..HEAD   # must be 0
```

GitHub Pages serves `main`/`docs`, so the commit *is* the deploy. Assets are
sent with `max-age=600`; if the user reports the page looking stale, that is
browser cache, not a failed push.

Finally, tell the user what shipped: the URL, the figure and lab count, the
anchors that verify, and every honest flag you raised. They will want the
flags most.
