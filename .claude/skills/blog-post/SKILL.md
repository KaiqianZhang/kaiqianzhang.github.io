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

| Part | Budget | What it does |
|---|---|---|
| *(the roadmap)* | — | A braced tree of the whole post, before the first heading. |
| **Learning together** | ≤ 5 min | Teach the essence. Bullets for what matters. Ends with a bulleted recap. |
| **Inspire together** | 3–4 min | The frontier: real papers, what people are doing up to today, then concrete directions. |
| **Chat together** | ≤ 1 min | An animated flashcard of takeaways, in the words you would use with a friend. |
| **References** | not counted | Every work the post cites, linked to the paper itself. |

### The roadmap

**Every post opens with one**, above the first `##`. It is a braced tree: the
title on the left, a trunk brace out to the three sections, and a second brace
from each section to the four or five ideas it covers, with the minutes on a
badge beside each section name. Colour-code the branches — one hue per section
— and give each a beating dot so the tree is alive before anything scrolls.

Three things it took a rebuild to get right:

- **Do not number it as a figure.** It is wayfinding, like a contents list.
  Numbering it pushes every real figure along by one, and `check_figures`
  makes you renumber every caption.
- **It gets no caption.** The tree explains itself, and a caption is the only
  part of it that would count against the ten minutes.
- **Split the title across two short lines.** At the heading type size one
  long line runs past the trunk brace and collides with it. Measure the gap
  rather than eyeballing it: the label's right edge against the brace's left.

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
- **Build the chain; do not assert the result.** Assume no background. Every
  step the reader needs must be on the page, in order, each one earning the
  next. The first draft of the RoPE post said "rotating both and taking the
  dot product leaves a rotation by n−m" and stopped there — true, and useless
  to anyone who did not already know it. What was missing was the chain
  underneath: an attention score is one number per pair of tokens; that number
  is a dot product; **a dot product only cares about the angle between two
  vectors**; so spin the query by its position and the key by its position,
  and the angle between them shifts by exactly their distance. Four steps, and
  the last one is the delight. Find that chain before writing, and check it by
  reading the section as somebody who knows nothing.
- **Bullets carry the load.** The facts a reader must leave with go in a
  bullet list, not buried in prose.
- Include **the one idea that reframes the topic** — the sentence that turns a
  pile of methods into a design surface. In the RoPE post it is *"the
  frequency spectrum is the design surface, and every long-context method is a
  decision about the slow bands."* Find that sentence. It is what makes ②
  legible and what lets a reader invent something rather than just recall it.
- **At least two animations and at least one interactive.**
- **Close with a bulleted recap** under `### What to carry into the next part`
  — four or five lines, each a single claim, no new material. It is the hinge
  into the frontier: a reader who skips straight to ② should still be able to
  follow it from these lines alone.

  Write the recap *before* the final trim, then use it to find what the prose
  no longer has to say. In the RoPE post it made a whole closing paragraph and
  two bullets redundant, which is most of what paid for it.

### ② Inspire together

The most important part of the post, and the one to spend research effort on.
It must be **verified, insightful, and current to the day it is written**.

- Group the work by *what it does*, not chronologically. Each group gets a
  short bold header.
- **Every group opens with a bridge**: one or two sentences, in first person,
  saying why anyone tried this and what it cost. Bullets alone are clear and
  read like a related-work section — nothing in a bare list explains why the
  next idea happened, and no sentence has a person behind it. The bridge is
  what makes the section writing rather than a bibliography.

  *"The first instinct was to squeeze: if a model only saw positions up to
  4,096, map 32,768 down into that range and nothing is unfamiliar. It works,
  and pays for safety in the wrong currency."*

  Bridges are not free, and they should not be. Let them carry the *why* and
  then cut the same amount out of the bullets, which no longer have to explain
  themselves. A single-bullet group can put its bridge on the header line.
- **Bullets carry judgment, not just description.** Say which one actually
  gets used, which result is sharpest, which you would read first — each tied
  to evidence already in the bullet: adoption, a venue, a number. *"the one
  that actually ships … Llama 3.1 uses it, the strongest endorsement here."*
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

### References

**Every post ends with `## References`.** No exceptions, including posts that
are not about papers — a post adapting somebody else's idea credits them here
too.

- **List every work the post cites**, in the order the post meets it, and link
  the **paper itself** rather than a summary, a blog post about it, or a
  search result.
- **Verify every link before pushing.** A 404 in a reference list is worse
  than no reference list. Check the fetched page's title actually matches the
  work you are citing.
- **Never invent an author line.** If you are not certain of the authors, cite
  the lab or the title alone. "Cohere, 2025" is honest; a guessed *et al.* is
  not.
- Say so when a method has **no paper** — several widely used tricks were only
  ever forum posts, and that is worth telling the reader.
- A one-clause note after each entry, saying why it is there, is worth its
  space. It is what makes the list usable rather than decorative.
- **It costs nothing against the budget.** `prose_minutes` in `build.py`
  strips a trailing `## References` section from the read time, because a
  bibliography is looked up rather than read start to finish. This is why the
  rule is affordable on a ten-minute post — do not "make room" for references
  by cutting the writing.

## Voice

The house style is **Lil'Log** — [Lilian Weng's blog](https://lilianweng.github.io/)
— carrying first person and warmth. If the voice has gone fuzzy, read one of
her posts before writing.

What to take from her:

- **Motivation before mechanism.** Open by saying why the problem matters and
  what breaks without it, then build the machinery. Never open with a
  definition.
- **Descriptive headings, hierarchically nested.** A heading names what the
  section is about, never a joke or a tease. Sections narrow progressively:
  a broad framing section, then the specific methods inside it.
- **Bold on first introduction of a term; italics for contrast.** A reader
  scanning for where a concept is defined should land on the bold.
- **Notation is defined before it is used**, and every symbol in a formula is
  named in the prose around it.
- **Bullets enumerate; prose argues.** A bare list of papers reads like a
  related-work section, which is what the bridges exist to prevent.
- **Honest about difficulty.** *"It is hard to specify X"* beats hedging.
  Where something failed, say so, and say what it taught.
- **Varied rhythm.** Dense technical passages punctuated by a short sentence
  or a concrete analogy. Three long sentences in a row means breaking one.
- **Captions carry a takeaway, not a label**, and credit the source whenever
  a figure is reproduced or adapted from a paper.
- **Every claim links its paper**, author–year, inline.
- **No hype.** No *revolutionary*, no *game-changing*, no exclamation marks.
  The results are interesting enough without adjectives.

Where we **deliberately depart** from her: she keeps first person almost
entirely out of a post until a closing appeal. We do not.

- **Write in first person, and keep it.** These are one person explaining
  something they find interesting, not a survey with the author sanded off.
  Aim for a dozen or more `I`s across ten minutes, placed where they carry
  weight rather than sprinkled:
  - the opening claim — *"I still think it is the prettiest idea in the
    modern transformer"*
  - the place the topic gets uncomfortable — *"here is the part I find
    uncomfortable"*
  - what surprised you — *"the fix I did not see coming"*
  - judgments in ② — *"if you read one paper here, I would make it this one"*
  - limits you chose — *"I stopped at band 24 because band 56 turns three
    thousand times slower"*
- **Warm, not chummy.** Write to one curious reader you like and respect.
  Second person is welcome — *"the part I want you to hold on to"*. Say what
  took you a long time to understand; that is where the warmth comes from,
  and it is also true.
- **Never condescend.** No *simply*, no *obviously*, no *of course*, no *just*.
  If a step is easy, the reader will find it easy without being told.
- **An `I` that replaces an impersonal construction costs nothing**, which
  matters because the budget is tight. An `I` that adds a clause has to be
  paid for like anything else.

## Figures and interactives

Both are built on `static/css/widgets.css` and `static/js/widgets.js`. The
repo `README.md` documents that engine — the `a-*` primitives, the colour
roles, and what `window.W` provides. Read it before drawing anything.

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
3. **Write with a generator script.** A Python script in the scratchpad that
   emits the `.md`: prose verbatim in triple-quoted strings, repetitive and
   computed SVG built in loops. Keep it — the budget will make you revise, and
   hand-editing hundreds of SVG elements does not survive that.
4. **Lab behaviour goes in `static/js/blog-labs.js`**, one `init*Lab()` each.
5. **Build, and let the budget check push back.** Expect two or three trimming
   rounds. That is the format working, not a problem.
6. **Draw the roadmap once the trimming has settled.** It names what the
   sections actually ended up covering, so drawing it early means drawing it
   twice.

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
6. **Both themes.** And if a fix touched `widgets.css` or `widgets.js`, load a
   page from the other section too — that engine is shared, so a change there
   reaches further than the post you are working on.

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
