---
name: blog-post
description: Write a new post for the blog at ~/Desktop/blog (published at kaiqianzhang.github.io). Use when the user asks to write, draft, or add a blog post, or invokes /blog-post. Three fixed parts in ten minutes — teach the essence, survey the frontier, hand over an animated flashcard — with drawn animations and computed interactives throughout.
---

# Writing a blog post

The blog lives at `~/Desktop/blog` and publishes to
<https://kaiqianzhang.github.io> from `docs/` on `main`. Read that repo's
`README.md` before starting.

Every post has the **same three parts, in the same order, with the same
headings**. There is no section-selection step and no template to negotiate.
The work is deciding what goes inside the three parts, not what the parts are.

## The shape, which is fixed

| `##` heading | Budget | What it does |
|---|---|---|
| **Learning together** | ≤ 5 min | Teach the essence. Bullets for what matters. Leave the reader able to think about research. |
| **Inspire together** | 3–4 min | The frontier: real papers, what people are doing up to today, then concrete directions. |
| **Chat together** | ≤ 1 min | An animated flashcard of takeaways, in the words you would use with a friend. |

**Ten minutes total, hard capped.** Front matter must include
`format: three-part`, which is what turns the enforcement on:

```markdown
---
title: RoPE and iRoPE
subtitle: One sentence, shown on the index and in the RSS feed.
date: 2026-08-22
tags: llm
format: three-part
---
```

`build.py` fails the build with a per-section report if any part is out of
budget. **Do not raise the ceilings to make a draft fit** — the cap is the
format. Cut instead. In practice captions are the cheapest thing to cut and
the paper list is the most expensive, so trim captions and tighten bullets
before dropping a source.

`<svg>` is excluded from read time, so figures and interactives never count
against the budget. Prose in captions and flashcard cards does.

## What each part owes the reader

### ① Learning together

The reader is training to become an LLM researcher. They need the essence, not
completeness — **enough to think with, not everything there is**.

- Open with the mechanism in one or two sentences, then the formula that makes
  it precise. Do not warm up.
- **Bullets carry the load.** The facts a reader must leave with go in a
  bullet list, not buried in prose.
- Include **the one idea that reframes the topic** — the sentence that turns a
  pile of methods into a design surface. In the RoPE post it is *"the
  frequency spectrum is the design surface, and every long-context method is a
  decision about the slow bands."* Find that sentence. It is what makes ②
  legible and what lets a reader invent something rather than just recall it.
- **At least two animations and at least one interactive.**

### ② Inspire together

The most important part of the post, and the one to spend research effort on.
It must be **verified, insightful, and current to the day it is written**.

- Group the work by *what it does*, not chronologically. Each group gets a
  short bold header and bullets.
- Every bullet: **name, link to the actual paper, and what it actually
  claims.** Numbers where there are numbers.
- **Search for current work every time.** Training data is stale by
  definition. Find what landed in the last few months.
- Apply a **quality bar**, and drop what fails it. Single-author preprints
  benchmarking toy models against toy baselines are not frontier. Keep
  peer-reviewed work, work from serious labs, work widely adopted in practice,
  and theory with real rigour. A rejected paper is not worth naming.
- End with **`### Where this could go`** — concrete directions. The test: each
  should fall out of a *gap between two of the papers just listed*, so it is
  actionable rather than a wish. "Somebody should study X" is not a direction.
  "A *identifies* the heads, B *learns* the frequencies, nobody has joined
  them, and the detector already exists" is.
- **At least two animations.** An interactive if it earns its place.

### ③ Chat together

One minute. A `.flashcard` holding about six cards, each a question-shaped
label and an answer you could say out loud. It deals itself in on scroll and
has a *deal again* control. Keep each card to roughly 30 words — the section
has about 220 to spend.

## Figures and interactives

Both are built on `static/css/widgets.css` and `static/js/widgets.js`, shared
with the scratch notes. Read `.claude/skills/scratch-note/SKILL.md` for the
palette, the animation primitives and the mechanical traps; they apply
unchanged. What differs on the blog:

- **Type.** The hand face appears *only inside* `.nfig`, `.lab` and
  `.flashcard`. Body prose, headings and captions stay in the site's face.
  That split is deliberate and already lives in `widgets.css` — do not extend
  the hand face outward.
- **Animations must be worth watching.** The instruction is *"more fun and
  complicated — not just move when you click."* A figure that plays a reveal
  once and then sits still is not enough. Give figures **ambient motion that
  continues after the reveal**: `a-spin`, `a-sweep`, `a-flow`, `a-beat`,
  `a-travel`, `a-breathe`. The dials in the RoPE post turn forever at three
  different rates, which makes the point about frequency without a word of
  text.
- **Interactives compute, they do not illustrate.** Implement the paper's
  actual formula and let the reader drag it. A widget that moves plausibly but
  computes nothing is worse than no widget, because it teaches confidently and
  wrongly.

  **And check that the quantity on screen is the one that matters.** The first
  version of the RoPE spectrum lab counted "bands that never turn", which made
  every published fix look worse than doing nothing — a real quantity
  answering the wrong question. Before building a lab, ask which number would
  change a practitioner's decision, and show that one.

## The pipeline

1. **Research first.** ② cannot be written from memory. Search, then fetch the
   actual papers — abstract pages and HTML, not summaries of them. Note what
   each really claims and where it appeared.
2. **Find the reframing sentence** for ①, and the two-paper gaps that become
   the directions in ②.
3. **Write with a generator script.** Same rule as the scratch notes: a Python
   script in the scratchpad that emits the `.md`, prose verbatim, repetitive
   and computed SVG in loops. Keep it — the budget will make you revise.
4. **Lab behaviour goes in `static/js/blog-labs.js`**, one `init*Lab()` each.
5. **Build, and let the budget check push back.** Expect two or three trimming
   rounds. That is the format working, not a problem.

## Verification, before the push

Run all of it; fix, rebuild, and re-run whatever a fix touched.

1. **Markup** — parse every `<svg>` in the built page as XML; zero malformed.
   This is what catches the duplicate-`style` bug that silently drops a
   colour.
2. **Geometry** — in a browser, union the bounding boxes of each SVG's
   children and assert nothing escapes its `viewBox`; assert the page has no
   horizontal overflow. **Inject `.article * { animation: none !important; }`
   first** — otherwise every `getComputedStyle` recalculates against the
   ambient loops and the audit crawls to a stop.
3. **Labs** — drive every slider across its whole range, click every toggle,
   and assert no thrown errors and no readout containing `NaN`, `undefined`
   or `Infinity`.
4. **Anchors** — check each lab reproduces a known real number.
5. **Replay** — click every figure's control and the flashcard's, and assert
   the animations return to roughly zero and then finish again.
6. **Both themes**, and a regression pass over a scratch note, because the
   engine is shared.

### Two things that will fool you in the browser

- **A screenshot right after `scrollIntoView` catches the observer's replay.**
  Scrolling a figure into view *restarts* it, so a shot taken immediately
  shows a blank or half-drawn figure. Scroll, wait about three seconds, then
  shoot — and confirm with `getComputedStyle` before believing a figure is
  broken. This cost several false alarms writing the first post.
- **A backgrounded tab has no frames.** If `requestAnimationFrame` never fires
  and every `await` times out while synchronous JS still works, the tab is
  throttled, not the page. Open your own tab.

## Finishing

```sh
cd ~/Desktop/blog && python3 build.py && git add -A && git commit && git push
```

Then confirm the deploy is actually live rather than assuming it, and report:
the URL, the per-section times, the figure and lab counts, which anchors
verify, and anything left unfixed.

## The nine legacy posts

Posts written before this format have no `format:` field, are not budget
checked, and keep their old shape. Leave them alone unless asked.
