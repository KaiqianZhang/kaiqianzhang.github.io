---
name: blog-post
description: Write a new post for the blog at ~/Desktop/blog (published at kaiqianzhang.github.io). Use when the user asks to write, draft, or add a blog post, or invokes /blog-post. Handles research, figures pulled from original papers, a verified simulation, building, and committing.
---

# Writing a blog post

The blog lives at `~/Desktop/blog` and publishes to
<https://kaiqianzhang.github.io> from `docs/` on `main`. Read that repo's
`README.md` before starting — it documents the generator, front matter, and
figure pipeline.

## Two checkpoints, then run

Do not write the post in one shot. There are exactly two places to stop.

**Checkpoint 1 — on activation.** If the topic came with the invocation, do
not re-ask it. Ask only what you cannot infer, in one round:

- Tag (current tags are in `site.json`; today: `llm`, `uncat`). Offer to add a
  new one.
- Publish or keep as `draft: true`.
- Post icon, only if they want something other than the 🍵 default.

**Checkpoint 2 — after research, before writing.** Come back with:

- The proposed thesis in one sentence (this becomes the subtitle).
- **A proposed section plan**: every default section marked keep or drop with
  a one-line reason, plus any extra sections worth adding. See *Deciding the
  sections* below. Ask about every drop and every addition — never silently
  do either.
- The exact figures found, named by paper and figure number, **with a sentence
  each on why that figure is the essence of its paper**. If no paper has a
  figure that carries its argument, say so plainly and propose dropping that
  section rather than filling it with a weak one.
- The simulation idea, and the closed form it will be checked against if one
  exists.

Get a yes before writing prose. This is the checkpoint that prevents building
a post around the wrong figures or padding it with sections it does not need.

**Checkpoint 3 — length, immediately after the plan is agreed.** By this point
you know how much material there is, so ask:

> Is this a long post?

If no, it targets **5–8 minutes** and you trim to that. If yes, ask whether
they want **15 minutes or longer**, take the answer as the ceiling, and record
it as `length: long` in the front matter. Ask this every time; do not infer it
from how much research turned up. A large pile of material is a reason to ask,
not a licence to assume.

After that, run to completion: write, generate figures, build, verify, commit.
**Stop before `git push`.** Show the local preview URL and let them review.

## Deciding the sections

A dropped section is always better than a padded one. Never write a section
to satisfy the template. Apply these tests at checkpoint 2 and bring the
verdicts to the user — propose, do not decide alone.

| Section | Include only if | Typical reason to drop |
|---|---|---|
| Opener: where it sits | The thing has a definite place in the architecture | Topics about training procedure, data, tokenization, evaluation, scaling laws, or theory have no block to point at |
| History (roadmap) | Almost always — motivation is the point | Only if the idea has no history worth telling |
| The math | There is a formula worth deriving | Empirical or engineering topics where the maths is trivial or absent |
| Paper figures | A paper has a figure that *carries its argument* | The papers are table-only or their figures are all minor experiments. Say so and offer to drop it or substitute an original diagram |
| Compare and contrast | The topic is genuinely X versus Y | A single-subject topic has nothing to contrast. Offer to drop it, or to replace it with something that fits — "When to use it", "How it fails", "What it costs" |
| Simulation | Nearly always — usually the most valuable section | Nothing simulable; then propose a worked example by hand, or an ablation, instead |
| Chat This Over With Friends, References | Always | — |

Also **actively look for sections worth adding**, and propose them with a
reason. Do not limit yourself to this list:

- Common misconceptions, or the explanation everyone repeats that is wrong
- How it is actually implemented — fused kernels, numerics, what runs in fp32
- Failure modes: when it breaks, and what that looks like
- Why the obvious alternative does not work
- A worked example computed by hand
- What is still unsettled

Bring the whole plan at once — keeps, drops, and additions — so the user sees
the shape of the post before any prose exists.

## The figure rule

This is the rule most easily got wrong, and the one that matters most.

> Use the figure that carries the paper's argument. Not a minor benchmark, not
> a side experiment that happens to be convenient, not something merely tidy.

Ask of every candidate: *if a reader saw only this figure, would they
understand why the paper exists?* If not, it is the wrong figure. A neat
side-by-side of two unimportant plots is worse than one essential plot.

Then write about the essence of the paper around it — the argument the figure
is making — not about the benchmark's details. Never pad with unimportant
things.

Figures must be the real ones from the original papers. Get them from the
arXiv source tarball, which contains the vector originals:

```sh
curl -sL -A "Mozilla/5.0" "https://arxiv.org/e-print/<id>" -o p.tar.gz
mkdir -p src && tar xzf p.tar.gz -C src
grep -rn -A12 'begin{figure' src/*.tex     # find captions and file names
pdftoppm -png -r 150 -singlefile src/<fig>.pdf out
```

Always read the `.tex` captions to get the figure number right, and count
`\begin{figure}` occurrences to number them correctly. Render the image and
**look at it** before choosing it.

Side-by-side panels need matching aspect ratios — check with PIL and re-render
at whatever DPI makes the heights equal. Splitting a two-panel paper figure
into its halves is fine and often better, since each half can then be
annotated separately.

## Fixed conventions

**Structure.** The default shape, not a form to fill in:

1. An unnumbered opener showing *where* the thing sits in the architecture.
2. History — **as a roadmap, not prose**. See *The history roadmap* below.
3. The math — formal, with derivations, explained in plain language.
4. The essential figure(s) from the original paper(s), annotated.
5. Compare and contrast — takeaways, and why it matters for LLMs at large.
6. A simulation — a visualization, plus a code snippet only if it is genuinely
   short.
7. Chat This Over With Friends.
8. References.

Sections are numbered in the post; the opener is unnumbered. Renumber after
any drop so the sequence has no gaps.

**Writing style.** Follow John Storey
(<https://jdstorey.org/fas/stat-overview.html>): motivate before formalizing,
plain declarative sentences, bold on first use of a defined term, historical
narrative with explicit temporal transitions, minimal hedging. Prefer
paragraphs over bullet lists for argument; use lists for enumerable things.

**Tone.** A university research professor teaching you — patient, and
genuinely interested in the material. Concretely, that means:

- **Say why before what.** Set up the problem the reader is about to watch
  someone solve, then solve it. A professor motivates; a reference work
  states.
- **Slow down at the hard step, not everywhere.** Take the difficult line of a
  derivation and walk it out; do not pad the easy ones out of politeness.
  Patience is spent where it is needed.
- **Address the reader.** "Notice that", "follow the grey column", "read the
  axis label" — the register of someone standing at a board pointing at
  things, not of a paper's abstract.
- **Be candid about what is unsettled**, what the field got wrong, and what
  you yourself got wrong. The best teachers say "nobody checked this for three
  years" and "this is easy to tell backwards".
- **Let the interest show.** A sentence may be delighted by its subject. What
  it may not be is pleased with itself — no showing off, no rhetorical
  questions asked to be clever, no jokes at the reader's expense.
- **Never condescend.** The reader is a capable graduate student, not a
  novice. Do not over-explain what they already know, and do not apologise for
  the mathematics.

**Headings.** Literary. Carry an image, and let the sentence have some
rhythm — a heading may be long if the length earns it. The image should be
*true*: it has to encode what the section actually shows, so that it reads as
apt once the section is read, not merely decorative.

- Good: "Seven Years of Subtracting a Ghost" (the mean is ~0 in a wide model),
  "What the Clock Knew and the Counter Did Not" (wall-clock time versus
  training steps), "Watching a Difference Vanish into Width" (the gap shrinks
  as 1/2d), "The Arithmetic of an Absence", "A Ledger of What Was Kept and
  What Was Sold", "Two Small Rooms in Every Layer"
- Too plain: "History", "The Math", "Comparison", "Results"
- Too flat and understated: "What Was Given Up", "Two Ways of Counting", "The
  Long Life of an Assumption" — correct but drab, no image
- Wrong kind of clever: puns, and anything that announces its own importance
  ("The Figure That Started It")

The test: read the finished section, then re-read its heading. The image
should land — you should be able to point at the thing in the section that the
image was about. If you cannot, the heading is decoration and needs replacing.
Write the headings *after* the sections for this reason, not before.

Keep the register consistent across the post — one drab heading in a literary
set is more noticeable than a whole drab set — and check that no two headings
say the same thing. Two headings are fixed names rather than literary ones,
whatever the register: **"Chat This Over With Friends"** and, always last,
**"References"**.

This register is settled and confirmed. Do not drift back toward plain
functional labels or toward flat understatement in later posts.

**Chat This Over With Friends.** This replaces what would otherwise be a
recap, and it is not one. A recap lists what the post covered; this section
hands the reader what they need to talk about the topic confidently to
someone else — what to lead with, which detail makes a listener look up, and
what they can now correct. Write it as things to *say*, in full sentences a
person could speak, not as findings to enumerate.

The shape that works, in bold lead-ins:

- **The one-line version.** What you open with. One or two sentences, no
  notation, understandable to someone who has not read the post.
- **The detail that lands.** The number or fact that makes a listener sit up.
  Concrete, quotable, and drawn from the post's own verified figures.
- **What most people get wrong.** The received version of this topic, and why
  it is off. This is what makes the reader interesting rather than merely
  informed.
- **If someone pushes back.** The strongest fair objection, conceded honestly.
  Being able to say where your own claim is weak is what separates confidence
  from bluster — and it usually comes straight from the skeptic agent's
  report.
- Optionally one more: the part worth stealing, the thing nobody expects, or
  the one-line mechanism worth remembering.

Do not repeat figure captions here, and do not restate every section. Three
to five beats, each one sayable out loud.

**Subtitle.** Exactly one short sentence. Eye-catching, and it must summarize
the whole post.

**Length.** **5–8 minutes by default**, measured at a deliberately
**conservative** 180 words per minute (`WORDS_PER_MINUTE` in `build.py`).
General blog convention is 200–265, but these posts carry derivations, figures
to study and code to read, and nobody reads a derivation at cruising speed. Do
not raise the number to make a post fit.

A post may exceed 8 minutes only if checkpoint 3 established it as a long
post. Mark those `length: long` in the front matter so the ceiling is a
recorded decision rather than something that crept up. Check with:

```sh
python3 -c "import build; p=build.Post('posts/<file>.md', build.load_config()); print(p.read_minutes)"
```

Over budget — 8 minutes normally, or whatever checkpoint 3 agreed — trim,
**in this order**:

1. Redundancy — anything stated twice in prose and again in a caption.
2. **History.** It is a roadmap; keep it minimal. Prose around it should be
   only what the boxes cannot hold.
3. **The math.** Compress derivations to the load-bearing steps and shorten
   the surrounding commentary.

Rewording does not cut. A sentence rewritten more tightly saves five words;
reaching 15 minutes from 19 needs paragraphs deleted, so delete them and say
in the report exactly what went.

A survey post whose subject *is* the history — the mindmap post is the
standing example — is exempt from any ceiling. Nothing else is.

One trap: any figure measured on the blog's own posts (`figures/mindmap.py`
does this) moves when you trim other posts. Re-run it and update the numbers
quoted in the prose and captions.

**The history roadmap.** Section 1 is not paragraphs of dates. It is a
horizontal spine of four milestones, each in a rounded box holding two or
three sentences, with **the reason the next milestone had to happen written
above the arrow between them**. Those arrow labels are the load-bearing part:
a history that only lists dates has explained nothing.

Generate it, do not hand-write the SVG — the body text has to be wrapped and
centred inside each box, and doing that by hand is how tspan positions end up
wrong:

```sh
python3 figures/roadmap.py <name>     # add the spec to ROADMAPS first
```

Paste the output inside a `<div class='roadmap'>`. Keep to four stops; five
leaves boxes too narrow to hold a sentence. After the roadmap, write only the
prose the boxes cannot carry — a quoted hypothesis, a correction, a pointer
forward. Two or three short paragraphs, not a section.

Verify in a browser before committing: load the page and check that no
`text` element overflows its `rect.box` and no arrow label is wider than the
gap between two dots.

**Motion and interaction.** Every post carries **at least five** animated or
interactive pieces. This is a floor, not a target, and they must earn their
place — each one has to show something a static image cannot.

- **The simulation section is always interactive or animated** where the thing
  being simulated has a parameter worth moving. A static plot of a simulation
  is a last resort, and if you fall back to one, say why in the report.
- **Give an interactive more than one control** whenever a second one is
  meaningful. One slider shows a curve moving; two show how two effects trade
  off against each other, which is usually the actual lesson. Label what each
  one does and print the number it produces.
- **Prefer the ambitious version.** 3-D, rotatable views, things that animate
  on their own, things that respond to the mouse. The rotary dials and the
  sliding window are the standard to beat, not to match.
- **The history roadmap animates on hover** — this is automatic from the CSS,
  and it counts as one of the five.
- Vanilla JS and inline SVG only, no libraries. Honour
  `prefers-reduced-motion`: self-running animation stops, interaction stays.
- Every number an interactive prints must be computed, not tabulated. The same
  rigour rule applies — an interactive that lies is worse than a static image
  that does not.

Which form fits which idea:

- *Animation* when the point is a relationship that **holds while something
  else changes** — the RoPE wedge staying rigid while both hands turn, the
  word2vec window sliding along a sentence. Inline SVG plus a CSS keyframe,
  no JavaScript needed.
- *Sliders* when the point is how a quantity **responds to a parameter** — a
  spectral radius swinging a gradient between vanishing and exploding, a
  temperature swinging perplexity between 1 and V. Use the `.knob` pattern in
  `blog.css`: `range` inputs, an inline SVG the script redraws, and a readout
  underneath saying what the number *means*, not just what it is.
- *A rotatable 3-D view* when the idea is geometric and a projection hides it
  — which normalization does, and which the reader will otherwise take on
  faith. Project by hand; there is no library.

Keep the maths in a widget closed-form so it cannot disagree with the post's
own figures, and check it with `node -e` before shipping — the same numbers
should come out of the widget and the Python. A static plot is still right
when the point is *measured* data rather than a formula.

**Table of contents.** Put `[TOC]` on its own line after the intro.

**Like button.** Every post ends with one, emitted by `templates/post.html` —
do **not** add the markup to a post's Markdown, and do not remove it. Three
drawn hearts (white, lavender, white) over a lowercase "like"; tapping turns
all three lavender and beats them in sequence. A reader's own tap lives in
their `localStorage`. A shared count is optional and comes from the Cloudflare
Worker in `worker/`, switched on by `likes_endpoint` in `site.json`; with it
empty the button still works and simply shows no number. Verify it survived
the build by grepping the generated page for `applause-btn`.

**Colour.** **Lavender-proned Morandi**: muted, slightly dusty, low
saturation, built around a lavender primary and weighted toward violet and
blue. **No grey ever carries meaning** — grey is for gridlines, axes and rules
only. This is settled; do not drift toward brighter or more saturated
palettes, and never fall back to matplotlib defaults.

The second half of the rule matters as much as the first: **different series
must actually contrast.** The palette this replaced had plum and lavender at
dE76 = 6.5, which is two curves a reader cannot tell apart. Separate in
lightness as well as hue, so a figure survives greyscale and the common
colour-vision deficiencies.

| | Hex | L* | Use |
|---|---|---|---|
| lavender | `#8C77BC` | 54 | primary — first series, main curve |
| blue | `#3E6491` | 42 | what it is compared against |
| rose | `#C48BAC` | 64 | third series |
| sage | `#6E8C66` | 55 | a rescued or corrected variant |
| clay | `#B07E55` | 57 | fourth series |
| ink | `#22253E` | 16 | fifth series, or emphasis |
| marker | `#A8443E` | 43 | annotation only, deliberately salient |
| gridlines | `#DEDAD4` | — | never a data colour |

Import these from `figures/palette.py` rather than retyping hexes — it applies
to matplotlib figures, inline SVG, animations, interactive widgets and
recoloured paper figures alike. Running that file prints the separation matrix
and asserts every pair is at least dE 26; check any new colour against it
before using one. Hold colour semantics constant across every figure in a
post — if a method is lavender in one it is lavender in all of them.

Recolour reproduced paper figures with `figures/recolor_paper_figs.py`. Add
the original to `figures/originals/` first so it stays reproducible, and note
the recolouring in the caption. Check the output by eye: coloured fills with
black text need the black-blend model, and near-grey gridlines must not be
tinted.

## Rigour

- **Never invent a number.** Every figure, output, or statistic in the post
  must come from code that was actually run, or from a source that was read.
- Prefer a claim you can check against a closed form, then show the simulation
  landing on it. That is the strongest kind of section 5.
- Verify adoption and "who uses what" claims with a web search; they date
  quickly.
- Do not repeat a paper's headline number without its context. State the
  caveat plainly instead — a modest honest claim beats an impressive wrong
  one.
- Read the paper's own words for its central hypothesis and quote it rather
  than paraphrasing it into something stronger.

## Verify with parallel agents

Once the post is written and built, **always** run a verification pass using
several agents at once. The user has asked for this explicitly; it is part of
the skill, not an optional extra. Launch them in a single message so they run
concurrently, each with one lens and a clear instruction to report findings
rather than edit:

1. **Facts.** Every factual claim: names, dates, affiliations, venue, arXiv
   ids, version numbers, "who uses what" claims, and any quoted sentence from
   a paper checked against the actual paper. The `report-fact-checker` agent
   type suits this.
2. **Mathematics.** Re-derive every derivation independently from scratch.
   Check each formula against the source paper's notation. Confirm stated
   identities actually hold, symbolically or numerically.
3. **Numbers and reproducibility.** Re-run every script in `figures/`. Confirm
   each number quoted in the prose matches what the code prints, and that
   claimed agreement between theory and simulation is real.
4. **Figures and attribution.** Every figure number, paper, and caption claim
   against the actual rendered image — does the image show what the caption
   says? Are colours described correctly? Is the recolouring noted? Do all
   `src` paths resolve?
5. **Style and structure.** Storey style, one-sentence subtitle, read time in
   range, sequential figure numbering, working TOC anchors, and any claim made
   twice. Check the headings specifically: is every one literary and
   image-bearing, is each image actually true of its section, is the register
   consistent, and are "Chat This Over With Friends" and "References" the
   last two, under their fixed names?
6. **The skeptic.** One agent whose only job is to argue the post is wrong,
   overclaims, or misleads. Ask it specifically for the strongest objection a
   domain expert would raise.

Then:

- **Do not take agent output at face value.** Check each reported issue
  yourself before changing anything; agents produce confident false positives.
- Fix what is genuinely wrong, rebuild, and re-verify anything a fix touched.
- **Report every finding to the user honestly**, including ones left unfixed
  and why. If a verifier found nothing, say that plainly rather than inventing
  something to look thorough.

## Finishing

```sh
cd ~/Desktop/blog
python3 build.py
```

Mechanical checks before committing:

- Every `<img src=...>` resolves to a file in `docs/`.
- Figures numbered sequentially with no duplicates.
- TOC anchors all resolve to real heading ids.
- No stray backticks or null placeholders in the rendered article.
- Read time in range.

Serve locally with `python3 build.py serve`, commit with a descriptive
message, and stop. Report the preview URL, the verification results, and wait
for the user to approve the push.
