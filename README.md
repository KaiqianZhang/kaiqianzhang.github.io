# Blog

A minimal, text-first static blog, modelled on the layout of
[gregorygundersen.com/blog](https://gregorygundersen.com/blog/). Markdown in,
plain HTML out. The only hard dependency is Python 3.

## Commands

```sh
python3 build.py                 # build into ./site
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
site/               Generated output. Deleted and rebuilt every time.
```

Never edit anything under `site/` — it is wiped on each build.

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
- `tags` — the master list. Order here is the order shown; only tags with at
  least one published post are displayed.

## Deploying to GitHub Pages

The output in `site/` is fully static, so anything that serves files will do.
For GitHub Pages:

1. Push this repository to GitHub.
2. Settings → Pages → build from a branch.
3. Either point Pages at the `docs/` folder and change `OUT_DIR` in
   `build.py` to `docs`, or push the contents of `site/` to a `gh-pages`
   branch.

`site/.nojekyll` is written on every build so GitHub Pages serves the HTML
as-is rather than running it through Jekyll.

If you deploy to `username.github.io/blog` rather than a user site, set
`"base": "/blog"` in `site.json` first, or every internal link will 404.
