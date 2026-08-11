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

After that, run to completion: write, generate figures, build, verify, commit.
**Stop before `git push`.** Show the local preview URL and let them review.

## Deciding the sections

A dropped section is always better than a padded one. Never write a section
to satisfy the template. Apply these tests at checkpoint 2 and bring the
verdicts to the user — propose, do not decide alone.

| Section | Include only if | Typical reason to drop |
|---|---|---|
| Opener: where it sits | The thing has a definite place in the architecture | Topics about training procedure, data, tokenization, evaluation, scaling laws, or theory have no block to point at |
| History | Almost always — motivation is the point | Only if the idea has no history worth telling |
| The math | There is a formula worth deriving | Empirical or engineering topics where the maths is trivial or absent |
| Paper figures | A paper has a figure that *carries its argument* | The papers are table-only or their figures are all minor experiments. Say so and offer to drop it or substitute an original diagram |
| Compare and contrast | The topic is genuinely X versus Y | A single-subject topic has nothing to contrast. Offer to drop it, or to replace it with something that fits — "When to use it", "How it fails", "What it costs" |
| Simulation | Nearly always — usually the most valuable section | Nothing simulable; then propose a worked example by hand, or an ablation, instead |
| Recap, References | Always | — |

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
2. History — why it exists, what current models do.
3. The math — formal, with derivations, explained in plain language.
4. The essential figure(s) from the original paper(s), annotated.
5. Compare and contrast — takeaways, and why it matters for LLMs at large.
6. A simulation — a visualization, plus a code snippet only if it is genuinely
   short.
7. Recap.
8. References.

Sections are numbered in the post; the opener is unnumbered. Renumber after
any drop so the sequence has no gaps.

**Writing style.** Follow John Storey
(<https://jdstorey.org/fas/stat-overview.html>): motivate before formalizing,
plain declarative sentences, bold on first use of a defined term, historical
narrative with explicit temporal transitions, minimal hedging. Prefer
paragraphs over bullet lists for argument; use lists for enumerable things.

**Headings.** Evocative rather than functional — "The Arithmetic of an
Absence", not "The Math". The recap section is plainly titled "Recap".

**Subtitle.** Exactly one short sentence. Eye-catching, and it must summarize
the whole post.

**Length.** 5–15 minutes. Check with:

```sh
python3 -c "import build; p=build.Post('posts/<file>.md', build.load_config()); print(p.read_minutes)"
```

Over 15, trim — cut redundancy first, especially anything stated twice in
prose and again in a caption.

**Table of contents.** Put `[TOC]` on its own line after the intro.

**Colour.** Deeper Morandi tones weighted toward blue and purple, no greys.
The palette is defined in `figures/norm_comparison.py` and
`figures/recolor_paper_figs.py`; reuse those constants. Hold colour semantics
constant across every figure in a post, including reproduced ones — if a
method is blue in one figure it is blue in all of them.

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
5. **Style and structure.** Storey style, one-sentence subtitle, arty headings
   with a plain "Recap", read time in range, sequential figure numbering,
   working TOC anchors, and any claim made twice.
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
