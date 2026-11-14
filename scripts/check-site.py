#!/usr/bin/env python3
"""Dependency-free checks against the actual production output, not template mocks."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public'
ORIGIN = 'https://okcomputer.cloud'
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.ids = set()
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            check(attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}')
            self.ids.add(attrs['id'])

    def select(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]

def target(url):
    path = OUT / unquote(urlsplit(url).path).lstrip('/')
    return path / 'index.html' if path.is_dir() else path

pages = {p: Document(p.read_text()) for p in OUT.rglob('*.html')}
check(len(pages) >= 25, 'Expected bilingual pages and legacy redirects')
for path, doc in pages.items():
    relative = path.relative_to(OUT).as_posix()
    url = ORIGIN + '/' + relative.removesuffix('index.html')
    source = path.read_text()
    check('{%' not in source and '{{' not in source, f'Unrendered template: {relative}')
    check(bool(doc.select('html')), f'Missing document: {relative}')
    redirect = bool(doc.select('meta', **{'http-equiv': 'refresh'}))
    if not redirect:
        check(len(doc.select('h1')) == 1, f'Expected one h1: {relative}')
        check(bool(doc.select('meta', name='description')), f'Missing description: {relative}')
        check(bool(doc.select('a', href='#main')), f'Missing skip link: {relative}')
    for tag, attrs in doc.tags:
        if tag == 'script':
            check(not attrs.get('src', '').startswith('http'), f'External JavaScript: {relative}')
        if tag == 'img':
            check(bool(attrs.get('alt')), f'Missing image alternative: {relative}')
        for key in ('href', 'src'):
            value = attrs.get(key)
            if not value:
                continue
            parsed = urlsplit(urljoin(url, value))
            if parsed.scheme not in ('http', 'https') or parsed.netloc != 'okcomputer.cloud':
                continue
            file = target(parsed.geturl())
            check(file.is_file(), f'Broken link in {relative}: {value}')
            if parsed.fragment and file in pages:
                check(unquote(parsed.fragment) in pages[file].ids,
                      f'Broken anchor in {relative}: {value}')
    if not redirect and relative.startswith(('fr/', 'en/')):
        language = relative[:2]
        check(doc.select('html')[0].get('lang', '').startswith(language), f'Wrong language: {relative}')
        for alternate in doc.select('link', rel='alternate'):
            if 'hreflang' not in alternate:
                continue
            translated = pages.get(target(alternate['href']))
            check(translated is not None, f'Missing translation: {relative}')
            if translated:
                backlinks = translated.select('link', rel='alternate')
                canonical = doc.select('link', rel='canonical')[0]['href']
                check(any(a.get('href') == canonical for a in backlinks), f'Nonreciprocal hreflang: {relative}')

legacy = []
for source in (ROOT / 'content/articles').glob('*.fr.md'):
    if not source.read_text().startswith('{'):
        continue
    meta, _ = json.JSONDecoder().raw_decode(source.read_text())
    if not meta.get('legacy'):
        continue
    legacy.append(source)
    current = OUT / 'fr/articles' / meta['slug'] / 'index.html'
    check(current.is_file(), f'Missing migrated article: {source.name}')
    for alias in meta['aliases']:
        old_url = urljoin(ORIGIN + '/fr/articles/', alias)
        page = target(old_url)
        check(page.is_file(), f'Missing old URL: {old_url}')
        if page.is_file():
            check('/fr/articles/' + meta['slug'] + '/' in unquote(page.read_text()), f'Wrong redirect: {old_url}')
check(len(legacy) == 9, 'All nine original articles must be preserved')

for name in ('fr/index.xml', 'en/index.xml', 'fr/articles/index.xml', 'en/articles/index.xml', 'feed.xml', 'index.xml', 'atom.xml', 'sitemap.xml', 'fr/sitemap.xml', 'en/sitemap.xml'):
    try:
        ET.parse(OUT / name)
    except (ET.ParseError, FileNotFoundError) as error:
        errors.append(f'Invalid or missing XML {name}: {error}')
check(len(ET.parse(OUT / 'fr/index.xml').findall('./channel/item')) >= 9, 'French feed lost posts')
for lang in ('fr', 'en'):
    homepage = (OUT / lang / 'index.html').read_text()
    check('data-mountain-study' in homepage and 'data-panorama' in homepage and 'data-alpine' in homepage,
          f'Missing {lang} sunset panorama')
    check('data-mountain-banner' not in homepage, f'Old {lang} banner still displayed')
    check('noindex' not in homepage, f'Homepage {lang} accidentally excluded from search')
    check('data-mountain-study' not in (OUT / lang / 'about/index.html').read_text(), f'Banner on {lang} About page')
check((OUT / 'CNAME').read_text().strip() == 'okcomputer.cloud', 'Custom domain changed')
check((OUT / '.nojekyll').exists(), 'Missing .nojekyll')
check((OUT / '404.html').is_file(), 'Missing GitHub Pages 404')
for alias in ('about', 'archives', 'page2'):
    check(bool(pages[OUT / alias / 'index.html'].select('meta', **{'http-equiv': 'refresh'})), f'Missing {alias} redirect')

if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} HTML pages, all local links/anchors, 9 legacy posts and redirects, bilingual metadata, feeds, sitemap, and domain.')
