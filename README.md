# Blog

A minimal, text-first static blog. Markdown in, plain HTML out. The only hard
dependency is Python 3.

The website template is adopted from
[Gregory Gundersen](https://gregorygundersen.com/blog/) — the layout and
stylesheet follow his blog. The acknowledgement is rendered in the footer of
every page and is configurable via `credit` in `site.json`.

## The /blog-post skill

`.claude/skills/blog-post/SKILL.md` is the Claude Code skill that writes posts
for this blog: research, figures pulled from the original papers, a verified
simulation, build, and commit. It encodes the conventions below so they do not
have to be restated each time.

That file is the canonical copy. It is installed by symlinking it into the
place Claude Code looks:

```sh
mkdir -p ~/.claude/skills/blog-post
ln -s "$PWD/.claude/skills/blog-post/SKILL.md" ~/.claude/skills/blog-post/SKILL.md
```

Editing either path edits the same file, so the installed skill and the
committed one cannot drift.

## Commands

```sh
python3 build.py                 # build into ./docs
python3 build.py serve           # build, then serve at http://127.0.0.1:8000
python3 build.py serve 4000      # ...on another port
python3 build.py new "My Title"  # scaffold posts/YYYY-MM-DD-my-title.md
```

`serve` does not watch for changes — re-run it after editing.

## Layout

```
build.py            The generator. Stdlib only; uses Pygments if installed.
site.json           Title, author, nav, links, quote, tag list.
posts/              Your Markdown. Filenames must be YYYY-MM-DD-slug.md.
templates/          The HTML. Placeholders are {{ name }} and nothing else.
static/             Copied verbatim to the site root (css/, images/).
docs/               Generated output. Deleted and rebuilt every time.
                    Committed on purpose -- GitHub Pages serves it.
```

Never edit anything under `docs/` — it is wiped on each build.

## Writing a post

Create `posts/2026-08-11-my-post.md`:

```markdown
---
title: My Post
subtitle: One sentence, shown on the index and in the RSS feed.
date: 2026-08-11
tags: attention, transformer
draft: false
---

The body starts here.
```

Front matter rules:

- `title` and `date` are the only ones that really matter; `date` falls back
  to the date in the filename.
- `tags` is a comma-separated list of **slugs** from the `tags` array in
  `site.json`. A tag not listed there gets no tag page.
- `draft: true` keeps a post out of the build entirely.
- `slug:` overrides the URL slug taken from the filename.

The URL is `/blog/YYYY/MM/DD/slug/`, which is stable once published — renaming
a file after the fact breaks incoming links.

## Markdown supported

Headings, paragraphs, `**bold**`, `*italic*`, links, images, ordered and
unordered lists (one level of nesting), blockquotes, pipe tables, fenced code
blocks with language tags, footnotes (`[^id]` and `[^id]: text`), horizontal
rules, and raw HTML blocks.

Math is passed through to MathJax untouched: `$inline$` and `$$display$$`.
Anything inside backticks or a fenced block is never touched by the parser, so
code containing `$` or `*` is safe.

For a bordered, captioned figure, drop in raw HTML:

```html
<div class='figure'>
    <img src='/images/thing.png'>
    <div class='caption'>
        <span class='caption-label'>Figure 1.</span> What it shows.
    </div>
</div>
```

Images live in `static/images/` and are referenced from the site root as
`/images/...`.

## Configuration

Everything user-facing is in `site.json`:

- `title`, `author`, `email`, `description`, `keywords` — metadata and the
  landing page.
- `url` — the public origin. **Only used for absolute links in `feed.xml`**,
  so set it before you care about RSS.
- `base` — a path prefix. Leave `""` for a user site
  (`username.github.io`); set it to `"/blog"` for a project site served from
  `username.github.io/blog`.
- `nav` — the small links across the top of every blog page.
- `links` — the list on the landing page.
- `quote` — the italic epigraph above the post list.
- `credit` — the acknowledgement footer, shown on every page. Accepts raw
  HTML; set it to `""` to remove the footer entirely.
- `post_icon` — the icon before each title in the post listings. Set it to
  `""` to remove icons entirely. See below.
- `tags` — the master list. Order here is the order shown. Every tag is listed
  and gets a page even before anything is written under it; an empty one reads
  "No posts yet."

## Table of contents and read time

Put `[TOC]` on its own line anywhere in a post and it is replaced by a
contents list built from that post's `##` headings, each with a cycling
Morandi accent colour. Anchors come from the heading text, so renaming a
heading changes its link.

Read time is computed automatically from prose word count at 220 words per
minute — code blocks, display math, and raw HTML are excluded — and shown as a
byline next to the date. Aim for 5–15 minutes; check a draft's length with:

```sh
python3 -c "import build; p=build.Post('posts/<file>.md', build.load_config()); print(p.read_minutes)"
```

## Figures

`figures/norm_comparison.py` generates plots into `static/images/`.

`figures/recolor_paper_figs.py` recolours reproduced paper figures into the
site palette, reading from `figures/originals/` so it stays reproducible. It
solves for each pixel's opacity against white and re-emits it in the
replacement hue, which leaves text, axes, and gridlines untouched. If you
reproduce a figure from a paper, say so in the caption and note the
recolouring.

## The like button

Every post ends with a like button, emitted by `templates/post.html`, so posts
get it without doing anything. Three drawn hearts — white, lavender, white —
over a lowercase "like". Tapping turns all three lavender, beats them in
sequence, flips the label to "liked", and remembers the tap under
`liked:<path>` in the reader's `localStorage`.

The hearts are inline SVG rather than emoji so the middle one can be the exact
`#8C7BA6` lavender used for the theory lines in the figures.

### The shared count

Optional, and off until you deploy it. `worker/` holds a Cloudflare Worker
that keeps one integer per post in Workers KV; see `worker/README.md` for the
three commands. Once deployed, put its URL in `site.json`:

```json
"likes_endpoint": "https://blog-likes.<subdomain>.workers.dev"
```

Leave it `""` and the button still works — it just shows no number. The count
is fetched on load and updated optimistically on click, and every network call
is wrapped so a dead endpoint degrades to the local-only behaviour rather than
breaking the button.

Styling lives under `.applause` in `static/css/blog.css`; the animation stops
under `prefers-reduced-motion`.

## Post icons

Every row in a post listing is prefixed with an icon, Notion-style. The
default is `"post_icon": "🍵"` in `site.json`.

Any single post can override it from its front matter:

```markdown
---
title: My Post
icon: 🌱
---
```

The field is passed through as raw HTML, so an inline SVG works too and picks
up the green from CSS via `currentColor`:

```json
"post_icon": "<svg viewBox='0 0 16 16'><path d='M8 1.5C3.5 4.5 3 10.5 8 14.5c5-4 4.5-10 0-13z'/></svg>"
```

Size and colour are set by `.post-icon` in `static/css/blog.css`. Icons appear
on the blog index and tag pages, not on the post page itself.

## Deploying to GitHub Pages

This site is published at <https://kaiqianzhang.github.io> from the `docs/`
folder on the `main` branch. To publish a change:

```sh
python3 build.py          # regenerate docs/
git add -A
git commit -m "New post"
git push
```

GitHub rebuilds within about a minute. There is no CI step — `docs/` is the
site, which is why it is committed rather than ignored.

Two settings this depends on, both already configured:

- Settings → Pages → Source: *Deploy from a branch*, `main` / `docs`.
- `docs/.nojekyll` is written on every build so GitHub serves the HTML as-is
  instead of running it through Jekyll.

If you ever move the site to `username.github.io/something`, set
`"base": "/something"` in `site.json` first, or every internal link will 404.
