#!/usr/bin/env python3
"""Static site generator for a minimal, text-first blog.

Usage:
    python3 build.py                 Build the site into ./site
    python3 build.py serve [port]    Build, then serve ./site on localhost
    python3 build.py new "A Title"   Scaffold a new post in ./posts

Only the standard library is required. If Pygments is installed, fenced code
blocks are syntax highlighted; otherwise they are rendered as plain <pre>.
"""

import html
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(ROOT, 'posts')
TEMPLATES_DIR = os.path.join(ROOT, 'templates')
STATIC_DIR = os.path.join(ROOT, 'static')
OUT_DIR = os.path.join(ROOT, 'site')

try:
    from pygments import highlight as _pyg_highlight
    from pygments.formatters import HtmlFormatter
    from pygments.lexers import get_lexer_by_name, guess_lexer
    HAS_PYGMENTS = True
except ImportError:                                   # pragma: no cover
    HAS_PYGMENTS = False


# ---------------------------------------------------------------------------
# Tiny template engine: {{ key }} substitution, nothing more.
# ---------------------------------------------------------------------------

_TEMPLATE_CACHE = {}


def template(name):
    if name not in _TEMPLATE_CACHE:
        with open(os.path.join(TEMPLATES_DIR, name), encoding='utf-8') as f:
            _TEMPLATE_CACHE[name] = f.read()
    return _TEMPLATE_CACHE[name]


def render(text, **values):
    def sub(match):
        key = match.group(1)
        if key not in values:
            raise KeyError('template placeholder {{ %s }} has no value' % key)
        return str(values[key])
    return re.sub(r'\{\{\s*(\w+)\s*\}\}', sub, text)


# ---------------------------------------------------------------------------
# Markdown. A deliberate subset: headings, paragraphs, emphasis, links, images,
# lists, blockquotes, tables, fenced code, footnotes, raw HTML, and $math$.
# ---------------------------------------------------------------------------

PLACEHOLDER = '\x00%d\x00'
PLACEHOLDER_RE = re.compile('\x00(\\d+)\x00')
PLACEHOLDER_ONLY_RE = re.compile('^\\s*\x00\\d+\x00\\s*$')

BLOCK_TAGS = ('div', 'p', 'table', 'figure', 'img', 'ul', 'ol', 'pre',
              'blockquote', 'section', 'hr', 'h1', 'h2', 'h3', 'h4', 'iframe',
              'video', 'span', 'a', 'svg', 'details')


class Markdown:

    def __init__(self):
        self.stash = []
        self.footnotes = []          # (id, html) in order of definition

    # -- helpers ----------------------------------------------------------

    def _stash(self, text):
        self.stash.append(text)
        return PLACEHOLDER % (len(self.stash) - 1)

    def _unstash(self, text):
        # Stashed content can itself contain placeholders (e.g. a footnote
        # body holding inline code), so loop until the text stops changing.
        for _ in range(10):
            new = PLACEHOLDER_RE.sub(lambda m: self.stash[int(m.group(1))], text)
            if new == text:
                return new
            text = new
        return text

    # -- entry point ------------------------------------------------------

    def convert(self, text):
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        text = self._extract_code_blocks(text)
        # Math and inline code are protected before footnotes are pulled out,
        # so that a footnote body gets the same treatment as body text.
        text = self._extract_math(text)
        text = self._extract_inline_code(text)
        text = self._extract_footnote_defs(text)
        body = self._blocks(text)
        return self._unstash(body)

    def footnotes_html(self):
        if not self.footnotes:
            return ''
        items = []
        for fid, body in self.footnotes:
            items.append(
                "    <li id='fn:%s'>%s <a href='#fnref:%s'>&#8617;</a></li>"
                % (fid, self._inline(body), fid))
        return ("<div class='footnotes'>\n  <ol>\n%s\n  </ol>\n</div>"
                % '\n'.join(self._unstash(i) for i in items))

    # -- protected spans --------------------------------------------------

    def _extract_code_blocks(self, text):
        def repl(match):
            lang = (match.group(1) or '').strip()
            code = match.group(2)
            return '\n' + self._stash(highlight_code(code, lang)) + '\n'
        return re.sub(r'^```([^\n]*)\n(.*?)^```[ \t]*$', repl, text,
                      flags=re.DOTALL | re.MULTILINE)

    def _extract_footnote_defs(self, text):
        lines = text.split('\n')
        kept, i = [], 0
        while i < len(lines):
            m = re.match(r'^\[\^([^\]]+)\]:\s*(.*)$', lines[i])
            if not m:
                kept.append(lines[i])
                i += 1
                continue
            fid, body = m.group(1), [m.group(2)]
            i += 1
            # Indented continuation lines belong to the same footnote.
            while i < len(lines) and re.match(r'^(\s{2,}|\t)\S', lines[i]):
                body.append(lines[i].strip())
                i += 1
            self.footnotes.append((fid, ' '.join(body).strip()))
            kept.append('')
        return '\n'.join(kept)

    def _extract_math(self, text):
        text = re.sub(r'\$\$(.+?)\$\$',
                      lambda m: self._stash('$$%s$$' % m.group(1)),
                      text, flags=re.DOTALL)
        return re.sub(r'(?<!\\)\$([^\$\n]+?)(?<!\\)\$',
                      lambda m: self._stash('$%s$' % m.group(1)), text)

    def _extract_inline_code(self, text):
        return re.sub(
            r'`([^`\n]+)`',
            lambda m: self._stash('<code>%s</code>' % html.escape(m.group(1))),
            text)

    # -- block level ------------------------------------------------------

    def _blocks(self, text):
        lines = text.split('\n')
        out, i = [], 0
        while i < len(lines):
            line = lines[i]

            if not line.strip():
                i += 1
                continue

            # A stashed block (fenced code, display math) standing alone is
            # already final HTML and must not be wrapped in a paragraph.
            if PLACEHOLDER_ONLY_RE.match(line):
                out.append(line.strip())
                i += 1
                continue

            m = re.match(r'^(#{1,6})\s+(.*)$', line)
            if m:
                level, title = len(m.group(1)), m.group(2).strip()
                out.append("<h%d id='%s'>%s</h%d>"
                           % (level, slugify(title), self._inline(title), level))
                i += 1
                continue

            if re.match(r'^\s*(\*\s*){3,}$|^\s*(-\s*){3,}$|^\s*(_\s*){3,}$', line):
                out.append('<hr>')
                i += 1
                continue

            if line.lstrip().startswith('>'):
                block, i = self._take_while(
                    lines, i, lambda l: l.strip().startswith('>') or l.strip())
                inner = '\n'.join(re.sub(r'^\s*>\s?', '', l) for l in block)
                out.append('<blockquote>\n%s\n</blockquote>'
                           % Markdown._sub_render(self, inner))
                continue

            if re.match(r'^\s*([*+-]|\d+\.)\s+', line):
                listhtml, i = self._list(lines, i)
                out.append(listhtml)
                continue

            if line.lstrip().startswith('|'):
                tablehtml, i = self._table(lines, i)
                if tablehtml:
                    out.append(tablehtml)
                    continue

            if re.match(r'^\s*<(%s)\b' % '|'.join(BLOCK_TAGS), line):
                block, i = self._take_while(lines, i, lambda l: l.strip())
                out.append('\n'.join(block))
                continue

            block, i = self._take_while(
                lines, i,
                lambda l: (l.strip()
                           and not PLACEHOLDER_ONLY_RE.match(l)
                           and not re.match(
                               r'^(#{1,6}\s|\s*>|\s*([*+-]|\d+\.)\s|\s*\|)', l)))
            out.append('<p>%s</p>' % self._inline(' '.join(
                l.strip() for l in block)))

        return '\n'.join(out)

    def _sub_render(self, text):
        """Render nested block content without re-stashing."""
        return self._blocks(text)

    @staticmethod
    def _take_while(lines, i, predicate):
        block = []
        while i < len(lines) and predicate(lines[i]):
            block.append(lines[i])
            i += 1
        return block, i

    def _list(self, lines, i):
        ordered = bool(re.match(r'^\s*\d+\.\s+', lines[i]))

        def same_kind(line):
            """True if `line` opens an item of this list's own kind."""
            m = re.match(r'^(\s*)([*+-]|\d+\.)\s+', line)
            return bool(m) and bool(re.match(r'\d+\.', m.group(2))) == ordered

        base_indent = len(lines[i]) - len(lines[i].lstrip())
        items, i = [], i
        while i < len(lines):
            line = lines[i]
            if not line.strip():
                # A blank line ends the list unless the next line continues it
                # with an item of the same kind. A switch from bullets to
                # numbers starts a new list.
                if i + 1 < len(lines) and same_kind(lines[i + 1]):
                    i += 1
                    continue
                break
            m = re.match(r'^(\s*)([*+-]|\d+\.)\s+(.*)$', line)
            if m and len(m.group(1)) <= base_indent:
                if not same_kind(line):
                    break
                items.append([m.group(3)])
                i += 1
            elif items and (m or line.startswith(' ' * (base_indent + 1))):
                items[-1].append(line.strip())      # nested or wrapped text
                i += 1
            else:
                break
        tag = 'ol' if ordered else 'ul'
        rendered = []
        for parts in items:
            nested = [p for p in parts[1:] if re.match(r'^([*+-]|\d+\.)\s+', p)]
            plain = [p for p in parts[1:] if p not in nested]
            body = self._inline(' '.join([parts[0]] + plain))
            if nested:
                sub_tag = 'ol' if re.match(r'^\d+\.', nested[0]) else 'ul'
                sub_items = ''.join(
                    '<li>%s</li>' % self._inline(
                        re.sub(r'^([*+-]|\d+\.)\s+', '', n)) for n in nested)
                body += '<%s>%s</%s>' % (sub_tag, sub_items, sub_tag)
            rendered.append('  <li>%s</li>' % body)
        return '<%s>\n%s\n</%s>' % (tag, '\n'.join(rendered), tag), i

    def _table(self, lines, i):
        block, j = self._take_while(lines, i,
                                    lambda l: l.strip().startswith('|'))
        if len(block) < 2 or not re.match(r'^\s*\|[\s:|-]+\|\s*$', block[1]):
            return None, i
        def cells(row):
            return [c.strip() for c in row.strip().strip('|').split('|')]
        head = ''.join('<th>%s</th>' % self._inline(c) for c in cells(block[0]))
        body = []
        for row in block[2:]:
            body.append('<tr>%s</tr>' % ''.join(
                '<td>%s</td>' % self._inline(c) for c in cells(row)))
        return ('<table>\n<thead><tr>%s</tr></thead>\n<tbody>\n%s\n</tbody>\n'
                '</table>' % (head, '\n'.join(body))), j

    # -- inline level -----------------------------------------------------

    def _inline(self, text):
        text = re.sub(r'!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)',
                      lambda m: "<img src='%s' alt='%s'%s>" % (
                          m.group(2), html.escape(m.group(1)),
                          " title='%s'" % html.escape(m.group(3))
                          if m.group(3) else ''),
                      text)
        text = re.sub(r'\[\^([^\]]+)\]',
                      lambda m: ("<sup id='fnref:%s' class='footnote'>"
                                 "<a href='#fn:%s'>%s</a></sup>"
                                 % (m.group(1), m.group(1),
                                    self._footnote_number(m.group(1)))),
                      text)
        text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)',
                      lambda m: "<a href='%s'%s>%s</a>" % (
                          m.group(2),
                          " title='%s'" % html.escape(m.group(3))
                          if m.group(3) else '',
                          m.group(1)),
                      text)
        text = re.sub(r'\*\*(\S(?:.*?\S)?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'(?<![\w\\])__(\S(?:.*?\S)?)__(?!\w)',
                      r'<strong>\1</strong>', text)
        text = re.sub(r'(?<![\*\w])\*(\S(?:.*?\S)?)\*(?!\*)', r'<em>\1</em>',
                      text)
        text = re.sub(r'(?<![\w\\_])_(\S(?:.*?\S)?)_(?!\w)', r'<em>\1</em>',
                      text)
        text = re.sub(r'~~(\S(?:.*?\S)?)~~', r'<del>\1</del>', text)
        return text

    def _footnote_number(self, fid):
        for n, (existing, _) in enumerate(self.footnotes, start=1):
            if existing == fid:
                return n
        return fid


def highlight_code(code, lang):
    code = code.rstrip('\n')
    if HAS_PYGMENTS:
        try:
            lexer = get_lexer_by_name(lang) if lang else guess_lexer(code)
        except Exception:
            lexer = None
        if lexer is not None:
            return _pyg_highlight(
                code, lexer, HtmlFormatter(cssclass='highlight', nowrap=False))
    return "<div class='highlight'><pre>%s</pre></div>" % html.escape(code)


# Muted Morandi tones, cycled across the table of contents. Deeper than a
# pastel so the accent bars read at small sizes, weighted toward blue/purple.
TOC_COLOURS = ['#5F7396', '#7E6B91', '#6E8C66', '#A87D76',
               '#6B8FA8', '#8C6A9E', '#5F8A8B', '#9C7B62']

WORDS_PER_MINUTE = 220


def reading_time(body):
    """Whole minutes, from prose only. Code, math and raw HTML are skipped."""
    text = re.sub(r'```.*?```', '', body, flags=re.DOTALL)
    text = re.sub(r'\$\$.*?\$\$', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    return max(1, round(len(text.split()) / WORDS_PER_MINUTE))


def insert_toc(content):
    """Replace a [TOC] marker with a contents list built from the h2s."""
    marker = '<p>[TOC]</p>'
    if marker not in content:
        return content
    items = []
    for n, m in enumerate(re.finditer(r"<h2 id='([^']*)'>(.*?)</h2>", content)):
        label = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        items.append(
            "        <li style='border-left-color: %s'>"
            "<a href='#%s'>%s</a></li>"
            % (TOC_COLOURS[n % len(TOC_COLOURS)], m.group(1), label))
    if not items:
        return content.replace(marker, '')
    toc = ("<nav class='toc'>\n    <p class='toc-head'>Contents</p>\n"
           "    <ul>\n%s\n    </ul>\n</nav>" % '\n'.join(items))
    return content.replace(marker, toc)


def slugify(text):
    # Drop protected spans (code, math) so their stash index cannot leak into
    # the anchor as a stray number.
    text = PLACEHOLDER_RE.sub('', text)
    text = re.sub(r'<[^>]+>', '', text).strip().lower()
    text = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
    return re.sub(r'[\s_]+', '-', text).strip('-') or 'section'


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------

class Post:

    def __init__(self, path, config):
        with open(path, encoding='utf-8') as f:
            raw = f.read()
        meta, body = split_front_matter(raw, path)

        name = os.path.basename(path)[:-3]
        m = re.match(r'^(\d{4})-(\d{2})-(\d{2})-(.+)$', name)
        if not m:
            raise ValueError('%s: filename must be YYYY-MM-DD-slug.md' % name)
        self.slug = meta.get('slug', m.group(4))
        self.date = parse_date(meta.get('date') or '-'.join(m.groups()[:3]),
                               path)

        self.title = meta.get('title', self.slug.replace('-', ' ').title())
        self.subtitle = meta.get('subtitle', '')
        self.icon = meta.get('icon', '')     # overrides site.json post_icon
        self.draft = str(meta.get('draft', '')).lower() in ('true', 'yes', '1')
        self.tags = [t.strip() for t in meta.get('tags', '').split(',')
                     if t.strip()]

        self.read_minutes = reading_time(body)

        md = Markdown()
        self.content = md.convert(body)
        self.footnotes = md.footnotes_html()
        self.content = insert_toc(self.content)

        self.url = '%s/blog/%s/%s/' % (config['base'],
                                       self.date.strftime('%Y/%m/%d'),
                                       self.slug)
        self.out_path = os.path.join(
            OUT_DIR, 'blog', self.date.strftime('%Y'), self.date.strftime('%m'),
            self.date.strftime('%d'), self.slug, 'index.html')

    @property
    def date_display(self):
        return self.date.strftime('%d %B %Y')


def split_front_matter(raw, path):
    if not raw.startswith('---'):
        return {}, raw
    end = raw.find('\n---', 3)
    if end == -1:
        raise ValueError('%s: front matter is missing its closing ---' % path)
    meta = {}
    for line in raw[3:end].strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' not in line:
            raise ValueError('%s: bad front matter line %r' % (path, line))
        key, value = line.split(':', 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    body = raw[end + 4:]
    return meta, body.lstrip('\n')


def parse_date(value, path):
    for fmt in ('%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            return datetime.strptime(str(value).strip(), fmt)
        except ValueError:
            continue
    raise ValueError('%s: cannot parse date %r' % (path, value))


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

def load_config():
    with open(os.path.join(ROOT, 'site.json'), encoding='utf-8') as f:
        config = json.load(f)
    config.setdefault('base', '')
    config['base'] = config['base'].rstrip('/')
    config['url'] = config.get('url', '').rstrip('/')
    return config


def tag_name(config, slug):
    for tag in config['tags']:
        if tag['slug'] == slug:
            return tag['name']
    return slug.replace('-', ' ').capitalize()


def credit_html(config, wrapped=True):
    """The template acknowledgement. Empty string removes it everywhere."""
    text = config.get('credit', '').strip()
    if not text:
        return ''
    if not wrapped:
        return "\t\t<div class='credit'>%s</div>" % text
    return "    <div class='credit'>\n        <div class='wrap'>%s</div>\n    </div>" % text


def nav_html(config):
    return '\n'.join(
        "        <li><a href='%s'>%s</a></li>"
        % (absolute(config, item['url']), item['name'])
        for item in config['nav'])


def absolute(config, url):
    if url.startswith(('http://', 'https://', 'mailto:')):
        return url
    return config['base'] + url


def tag_nav_html(config, posts, active=None):
    """Every configured tag is listed, whether or not it has posts yet."""
    items = []
    for tag in config['tags']:
        cls = " class='active'" if tag['slug'] == active else ''
        items.append("        <li><a href='%s/blog/tags/%s/'%s>%s</a></li>"
                     % (config['base'], tag['slug'], cls, tag['name']))
    return '\n'.join(items)


def post_icon_html(config, post):
    """Emoji or raw SVG, shown before the title. Empty string omits it."""
    icon = post.icon or config.get('post_icon', '')
    if not icon.strip():
        return ''
    return "<span class='post-icon'>%s</span>" % icon


def post_rows(config, posts):
    rows = []
    for n, post in enumerate(posts, start=1):
        rows.append(render(template('post_row.html'),
                           url=post.url,
                           icon=post_icon_html(config, post),
                           title=html.escape(post.title),
                           date=post.date_display,
                           subtitle=html.escape(post.subtitle),
                           index=n))
    return '\n'.join(rows)


def page(config, body, page_title, description, head_extra=''):
    return render(template('base.html'),
                  lang=config['lang'],
                  page_title=html.escape(page_title),
                  site_title=html.escape(config['title']),
                  description=html.escape(description),
                  keywords=html.escape(config.get('keywords', '')),
                  author=html.escape(config['author']),
                  base=config['base'],
                  nav=nav_html(config),
                  head_extra=head_extra,
                  body=body,
                  credit=credit_html(config))


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def build():
    config = load_config()

    posts = []
    for name in sorted(os.listdir(POSTS_DIR)):
        if name.endswith('.md') and not name.startswith('.'):
            posts.append(Post(os.path.join(POSTS_DIR, name), config))
    drafts = [p for p in posts if p.draft]
    posts = sorted((p for p in posts if not p.draft),
                   key=lambda p: (p.date, p.slug), reverse=True)

    if os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR)

    # Static assets.
    for entry in os.listdir(STATIC_DIR):
        src = os.path.join(STATIC_DIR, entry)
        dst = os.path.join(OUT_DIR, entry)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    pygments_css = (HtmlFormatter(style='friendly').get_style_defs('.highlight')
                    if HAS_PYGMENTS else '/* Pygments is not installed. */')
    write(os.path.join(OUT_DIR, 'css', 'pygments.css'), pygments_css)

    # Landing page.
    links = '\n'.join(
        "			<li><a href='%s'%s>%s</a></li>"
        % (absolute(config, link['url']),
           " target='_blank'" if link['url'].startswith('http') else '',
           link['name'])
        for link in config['links'])
    write(os.path.join(OUT_DIR, 'index.html'),
          render(template('landing.html'),
                 lang=config['lang'],
                 site_title=html.escape(config['title']),
                 description=html.escape(config['description']),
                 author=html.escape(config['author']),
                 email=html.escape(config['email']),
                 base=config['base'],
                 links=links,
                 credit=credit_html(config, wrapped=False)))

    # Blog index.
    quote = config.get('quote') or {}
    quote_author = ''
    if quote.get('author'):
        name = html.escape(quote['author'])
        link = (quote.get('link') or '').strip()
        # An attribution without a source stays plain text rather than
        # becoming a link to nowhere.
        quote_author = ("<a href='%s' target='_blank'>%s</a>" % (link, name)
                        if link else '<p>%s</p>' % name)
    index_body = render(template('index.html'),
                        quote_text=html.escape(quote.get('text', '')),
                        quote_author=quote_author,
                        tag_nav=tag_nav_html(config, posts),
                        posts=post_rows(config, posts))
    write(os.path.join(OUT_DIR, 'blog', 'index.html'),
          page(config, index_body, config['title'], config['description']))

    # Posts.
    for post in posts:
        tags = ', '.join(
            "<a href='%s/blog/tags/%s/'>%s</a>"
            % (config['base'], slug, html.escape(tag_name(config, slug)))
            for slug in post.tags) or '&mdash;'
        body = render(template('post.html'),
                      title=html.escape(post.title),
                      subtitle=html.escape(post.subtitle),
                      date=post.date_display,
                      read_time='%d min read' % post.read_minutes,
                      tags=tags,
                      content=post.content,
                      footnotes=post.footnotes,
                      base=config['base'])
        write(post.out_path,
              page(config, body, '%s | %s' % (post.title, config['title']),
                   post.subtitle or config['description']))

    # Tag pages.
    for tag in config['tags']:
        tagged = [p for p in posts if tag['slug'] in p.tags]
        body = render(template('tag.html'),
                      tag_name=html.escape(tag['name']),
                      count=len(tagged),
                      tag_nav=tag_nav_html(config, posts, active=tag['slug']),
                      posts=(post_rows(config, tagged) if tagged else
                             "            <p class='post-subtitle'>"
                             'No posts yet.</p>'),
                      base=config['base'])
        write(os.path.join(OUT_DIR, 'blog', 'tags', tag['slug'], 'index.html'),
              page(config, body, '%s | %s' % (tag['name'], config['title']),
                   'Posts tagged %s.' % tag['name']))

    # RSS feed.
    items = []
    for post in posts[:25]:
        items.append(render(
            template('feed_item.xml'),
            title=html.escape(post.title),
            url=config['url'] + post.url,
            pubdate=post.date.replace(tzinfo=timezone.utc).strftime(
                '%a, %d %b %Y %H:%M:%S +0000'),
            subtitle=html.escape(post.subtitle)))
    write(os.path.join(OUT_DIR, 'feed.xml'),
          render(template('feed.xml'),
                 site_title=html.escape(config['title']),
                 url=config['url'],
                 description=html.escape(config['description']),
                 lang=config['lang'],
                 items='\n'.join(items)))

    # GitHub Pages: do not run the output through Jekyll.
    write(os.path.join(OUT_DIR, '.nojekyll'), '')

    print('Built %d post%s into %s'
          % (len(posts), '' if len(posts) == 1 else 's',
             os.path.relpath(OUT_DIR, ROOT)))
    for post in posts:
        print('  %s  %s' % (post.date.strftime('%Y-%m-%d'), post.url))
    for draft in drafts:
        print('  (draft, skipped) %s' % draft.slug)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def new_post(title):
    today = datetime.now().strftime('%Y-%m-%d')
    slug = slugify(title)
    path = os.path.join(POSTS_DIR, '%s-%s.md' % (today, slug))
    if os.path.exists(path):
        sys.exit('%s already exists.' % path)
    write(path, '---\n'
                'title: %s\n'
                'subtitle: One sentence describing the post.\n'
                'date: %s\n'
                'tags: uncat\n'
                'draft: true\n'
                '---\n\n'
                'Write here.\n' % (title, today))
    print('Created %s' % os.path.relpath(path, ROOT))


def serve(port):
    import http.server
    import socketserver
    build()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=OUT_DIR, **kw)

        def log_message(self, fmt, *args):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', port), Handler) as httpd:
        print('\nServing %s at http://127.0.0.1:%d/  (Ctrl-C to stop)'
              % (os.path.relpath(OUT_DIR, ROOT), port))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped.')


def main():
    args = sys.argv[1:]
    if not args:
        build()
    elif args[0] == 'serve':
        serve(int(args[1]) if len(args) > 1 else 8000)
    elif args[0] == 'new':
        if len(args) < 2:
            sys.exit('Usage: python3 build.py new "Post Title"')
        new_post(' '.join(args[1:]))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
