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
Do **not** ask how long the post should be. There is no length budget; see
*Length* below. The post takes the space the explanation needs.

**Checkpoint 2 — after research, before writing.** Come back with:

- The proposed thesis in one sentence (this becomes the subtitle).
- **A proposed section plan**: every default section marked keep or drop with
  a one-line reason, plus any extra sections worth adding. See *Deciding the
  sections* below. Ask about every drop and every addition — never silently
  do either.
- The exact figures found, named by paper and figure number, **with a sentence
  each on why that figure is the essence of its paper**. If the topic has a
  famous or frontier paper, this section is not optional — find its figure. If
  no paper has a figure that carries its argument, say so plainly and propose
  dropping the section rather than filling it with a weak one.
- **How the teaching section will teach it** — the worked example's numbers,
  and the "what it is not" contrast you found.
- The simulation idea, and the closed form it will be checked against if one
  exists.

Get a yes before writing prose. This is the checkpoint that prevents building
a post around the wrong figures or padding it with sections it does not need.

Get the plan agreed, then run to completion: write, generate figures, build, verify, commit.
**Stop before `git push`.** Show the local preview URL and let them review.

## Deciding the sections

A dropped section is always better than a padded one. Never write a section
to satisfy the template. Apply these tests at checkpoint 2 and bring the
verdicts to the user — propose, do not decide alone.

| Section | Include only if | Typical reason to drop |
|---|---|---|
| Opener: where it sits | The thing has a definite place in the architecture | Topics about training procedure, data, tokenization, evaluation, scaling laws, or theory have no block to point at |
| History (roadmap) | Almost always — motivation is the point | Only if the idea has no history worth telling |
| **What it is** | **Always. This is the section the reader came for** | — never dropped; see *The teaching section* below |
| The math | There is a formula worth deriving *that the teaching section did not already make obvious* | Empirical or engineering topics where the maths is trivial or absent — or where §2 already taught it, in which case fold the formula into §2 and drop this |
| Paper figures | **Mandatory** if the topic has a famous or frontier paper — the one everybody cites, or the one that moved the field this year. **Optional otherwise** | The topic has no landmark paper, or the papers are table-only and their figures are all minor experiments. Then say so and either drop it or substitute an original diagram |
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

## The teaching section

Section 2, straight after the history roadmap, is where the reader learns
**what the thing actually is**. It is the section they came for, it is never
dropped, and it is written before any section that depends on it.

The failure it exists to prevent: a post that explains a mechanism's history,
its cost, and its failure modes, and never quite says what it does. That post
leaves a reader able to repeat opinions about a thing they cannot describe.
Write this section and you can compress everything downstream, because the
cost and failure sections stop re-teaching the mechanism in passing.

What it has to contain, in this order:

- **The object itself.** What is stored, computed, or changed — named, with
  shapes and units where they exist. A reader should be able to say what the
  thing *is* in one sentence afterwards.
- **What it is not.** The neighbouring thing it gets confused with, and the
  asymmetry that separates them. This is usually the sharpest teaching moment
  in the whole post — *why is there no cache for the queries?* — so look for it
  deliberately rather than hoping it turns up.
- **The two regimes**, if the thing behaves differently in different phases —
  training versus inference, prefill versus decode, warm versus cold. Say it
  here, plainly, before any section reasons about it.
- **A worked example with small numbers**, computed by hand. Four tokens, two
  heads, dimension four — small enough that every quantity is on the page.
  Budget about 200 words for it and take them from the history and the
  derivations, not from the simulation.
- **Why it is allowed** — the invariant or assumption the whole thing rests
  on. Then let the reader test it: state the received rule, and let the
  invariant show where the rule is too strong.

**The animation or interactive in this section should animate the worked
example**, not float free of it. The same four tokens, the same numbers, the
same names. An animation showing a generic version of a mechanism the reader
has just been walked through concretely wastes both.

Then, downstream: anything already taught here gets *referred to*, never
re-explained. If the maths section restates the mechanism in symbols and adds
nothing, fold its one useful formula into this section and drop it — that is
the section budget the teaching section pays for itself with.

## Drawn figures are drawn by hand

Explanatory diagrams on this blog are **sketched, not plotted**. Boxes have
wobbly outlines drawn twice, arrows are slightly bowed, and the labels are in a
handwriting face. The reference is the Excalidraw look, in this site's palette
rather than Excalidraw's black.

The reason is not decoration. A diagram that visibly came from somebody's hand
reads as an explanation being given to you, which is the register the prose is
already in, and it signals honestly that the boxes are *a story about the
mechanism* rather than a measurement of one.

So the rule splits by what the figure is:

- **A schematic — something you drew to show how a thing works** — is
  hand-drawn. Generate it with `figures/sketch.py`, which provides `rough_rect`,
  `rough_line`, `rough_arrow`, `box` and `text` over a seeded `Pen`, so the
  wobble is deterministic and regenerating a figure leaves an empty diff. Add
  the figure as a function there and wrap the output in
  `<div class='sketch'>`.
- **The history roadmap** is hand-drawn too — `figures/roadmap.py` draws its
  boxes and arrows with the same primitives.
- **A measured figure stays crisp.** Anything plotting real numbers —
  matplotlib output, an interactive that computes as you drag it, a reproduced
  paper figure — keeps clean lines and the normal type. Sketching a
  measurement would be a lie about its provenance.

Two mechanical traps, both of which have bitten:

1. **Never leave a blank line inside a raw HTML block.** The Markdown parser
   treats it as a paragraph break, closes the block, and wraps the rest of your
   SVG in a `<p>`, which destroys the figure. Symptom: a figure that renders as
   a black or broken mess.
2. **Do not set `text-anchor` in CSS.** CSS beats the per-element attribute, so
   a class carrying `text-anchor: middle` silently re-centres every label
   placed with `anchor='start'` and pushes it off the edge of the viewBox. Set
   anchoring on the element.

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
3. **What it is** — the teaching section. See below; it is never dropped.
4. The math — formal, with derivations, explained in plain language. Often
   short, because section 3 has already carried the idea.
5. The essential figure(s) from the original paper(s), annotated. Mandatory
   when the topic has a landmark paper; optional otherwise.
6. Compare and contrast — takeaways, and why it matters for LLMs at large.
7. A simulation — a visualization, plus a code snippet only if it is genuinely
   short.
8. Chat This Over With Friends.
9. References.

Sections are numbered in the post; the opener is unnumbered. Renumber after
any drop so the sequence has no gaps.

**Writing style.** Write like a person explaining something to another person,
in a blog, because that is what this is. The reference for register is
<https://lsl.zone/blog/2026/a-taxonomy-of-self-evolving-agents/>. Follow John
Storey (<https://jdstorey.org/fas/stat-overview.html>) for structure — motivate
before formalizing, bold on first use of a defined term, historical narrative
with explicit temporal transitions — but take the *sentences* from the first
reference.

Four rules, and they matter more than anything else in this file, because a
post that is right and unreadable has failed.

**1. Say "I", and say it often, because it is what makes the post warm.**
This is a blog, not a paper. The first person is not a stylistic garnish to
sprinkle on the introduction and then drop — it is the main thing separating
a person teaching you something from a manual. Own the judgements, the
surprises, the mistakes and the enthusiasms:

> *I want to explain… Let me start with something that surprised me… I got
> this backwards for years… This is my favourite thing in the whole topic…
> I did not want to take that on trust, so I wrote the experiment… The part
> I did not expect is… I find this figure quietly remarkable… Let me show you
> what I mean… I should be more careful about that word…*

Use "we" for the shared walk: *we can compute this directly*, *now we can see
the waste*, *notice that we never needed the queries*. "We" puts you and the
reader on the same side of the problem, which is the whole feeling to aim for.

Aim for first person in **most paragraphs of prose**, not just the opening
and closing. If you read a section back and it could have come from
documentation, it needs an "I" in it. Figure captions are prose too: *the one
I did not expect*, *watch what happens when you*, *I have drawn this at
absurdly small scale so you can see every number* — a caption written as a
label is a missed chance to keep talking to the reader.

**2. Complete sentences, one idea each.** Every sentence gets a subject and a
verb. No telegraphic clauses, no fragments for effect, no stacking three
claims into one line with commas and dashes. Compression is the enemy here.
Compare:

> Bad: "Near 1, the hardware moves a byte per operation, on a machine built
> for three hundred operations a byte."
>
> Good: "When this ratio is close to one, the chip moves one byte of memory
> for every arithmetic operation it performs. That is a terrible trade. An
> H100 can perform about three hundred operations in the time it takes to
> fetch a single byte, so a ratio near one means the chip spends nearly all
> of its time waiting for memory and almost none of it computing."

Both say the same thing. The first records it and the second teaches it. Write
the second, every time, even though it is three times longer.

**3. Assume no background, and build up to the hard part.** The reader may
never have opened a transformer. Start from something they certainly know,
and add one idea at a time, defining each term in a sentence of its own the
first time it appears. Never use a term in the paragraph before you explain
it. If a section needs three concepts, introduce them in three separate
passes rather than one dense one. It is fine — expected, even — for the first
third of a post to be things an expert already knows.

**Keep the essential background in, even though it is not the topic.** Before
writing, list what somebody must already understand to follow this post, and
then check that the post itself supplies every item on that list. A post on
the KV cache cannot assume the reader knows what a token is, that generation
happens one token at a time, or what a key and a value are — so it teaches all
three before it needs them. This background is not padding to be trimmed when
the post runs long; it is the difference between a reader finishing with a
real understanding of language models and finishing with a memorised fact
about one buffer. Each post should leave the reader knowing more about how
LLMs work in general, not only about its own narrow subject.

The test: could a reader who has never read anything else on this blog follow
the post from the first sentence to the last without opening another tab? If
not, something essential is missing, and the fix is to add it rather than to
assume it.

**Splitting a topic across posts does not suspend this rule.** When a subject
is large enough to want two posts, each one still has to teach what its own
argument needs. A link to the companion post is an *offer of depth*, not a
substitute for explaining. So write "I have written a whole post about this,
and if you want the derivations that is where they are — but here is
everything you actually need", and then give it, building from the beginning.
Never write "read that one first": the reader is already here, and a post that
sends them away to become qualified to read it has failed at the only job it
had. The companion post is where the same material gets the full treatment,
so a compressed retelling in one post and a slow one in the other is the
correct outcome, not duplication to be trimmed.

**4. Say what it means, not only what it is.** After a fact, add the sentence
that tells the reader why to care. *In other words… The practical effect is
that… This is the part that surprised me… What this buys you is…* A fact
without its consequence is a note to yourself.

Prefer paragraphs over bullet lists for argument; use lists for enumerable
things. Ask the reader's question on their behalf and then answer it — *you
might reasonably wonder why the queries are not stored too, and the answer is
the best thing in this topic* — but do not ask rhetorical questions to sound
clever.

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
- **Never condescend, but never assume either.** Explaining something from
  the beginning is not condescension; skipping it is not respect. Treat the
  reader as intelligent and uninformed, which is the normal condition of
  someone reading about a topic for the first time. Do not apologise for the
  mathematics, and do not skip the sentence that makes it followable.

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
recap, and it does two jobs at once: it closes the post so the reader truly
has it, and it leaves them able to raise the topic with someone else and be
interesting about it.

**Write it as one or two flowing paragraphs of prose.** Not bullets, not bold
lead-ins, not a list of beats — a list reads as notes, and nobody speaks in
notes. Two paragraphs of about 120 to 150 words each is the target.

What the two paragraphs do:

- **The first carries the essence and the detail that makes it land.** Open
  with the whole idea in a sentence someone could say at a table, with no
  notation. Then give the one concrete thing — a number, a ratio, an image —
  that makes a listener look up. It must come from the post's own verified
  figures, and it should be quotable from memory.
- **The second is where the reader becomes interesting rather than merely
  informed.** The received version of this topic and why it is off; then the
  strongest fair objection to your own account, conceded plainly. Close on
  what is genuinely open, or on the thing that is more interesting than the
  myth it replaces.

Echo the post as you go, so the paragraphs double as the recap the reader
needs — but echo the *argument*, not the section list. Do not repeat figure
captions. Every sentence should survive being said out loud.

**Subtitle.** Exactly one short sentence. Eye-catching, and it must summarize
the whole post.

**Length.** **There is no time limit, and you should not impose one.** A post
is finished when a reader with no background could follow it from the first
sentence to the last, and not before. Read time is reported in the byline at
180 words per minute (`WORDS_PER_MINUTE` in `build.py`) as information for the
reader, not as a budget for you:

```sh
python3 -c "import build; p=build.Post('posts/<file>.md', build.load_config()); print(p.read_minutes)"
```

This rule replaces an earlier 5–8 minute ceiling, and it was changed for a
reason worth remembering. Trimming the KV cache post to fit that ceiling took
eight passes, and what went first was the connective tissue — the sentence
after the fact that says what the fact means, the clause that unpacks a
compressed clause, the paragraph that introduces a term before using it.
Every cut was locally defensible and the result was prose that recorded the
subject instead of teaching it. **A post that is too long is a small problem.
A post the reader cannot follow has failed completely.**

So: never cut for length. Cut only these, and only because they are bad:

1. Redundancy — the same thing said twice, in prose and again in a caption.
2. Padding — a paragraph that adds no idea, restates the previous one in
   different words, or exists because the template implied a section.

If a post runs to twenty minutes because the subject needs twenty minutes,
that is the correct length. Say so in the report and move on. If it runs long
because it is repeating itself, fix that — but fix it by deleting whole
paragraphs, never by compressing sentences, because compressing sentences is
exactly how the prose got bad the first time.

One trap: any figure measured on the blog's own posts (`figures/mindmap.py`
does this) moves when other posts change length. Re-run it and update the
numbers quoted in the prose and captions.

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
- **Check every control can actually be grabbed.** Styling a `range` input's
  *height* to make the track look thin makes the whole control that tall, and
  a three-pixel slider cannot be dragged with a mouse. Style
  `::-webkit-slider-runnable-track` and `::-moz-range-track` for the thin look
  and leave the input itself around 22px. After building any widget, check in
  the browser that `document.elementFromPoint` at each slider's centre returns
  the slider.
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

**Chrome is not data, and `#8C7BA6` is fixed.** The like button's middle heart
and the slider accent are furniture: they must look identical on every post,
forever, so they do **not** come from `figures/palette.py` and do not move
when the palette is revised. A palette sweep recoloured them to rose once and
the change was immediately noticed. If you are doing a global colour pass,
exclude these two.

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
