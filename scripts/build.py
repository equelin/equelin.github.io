#!/usr/bin/env python3
"""Build Hugo and retain the old root-level feeds and GitHub Pages 404."""
import os
from pathlib import Path
import shutil
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'public'
subprocess.run([os.environ.get('HUGO', 'hugo'), '--gc', '--minify',
                '--cleanDestinationDir'], cwd=ROOT, check=True)

# GitHub Pages only consults /404.html, not the language-specific versions.
shutil.copyfile(OUTPUT / 'fr/404.html', OUTPUT / '404.html')

# Keep existing subscriptions alive. New subscribers use /fr/index.xml or /en/index.xml.
ATOM = 'http://www.w3.org/2005/Atom'
ET.register_namespace('atom', ATOM)
for filename in ('index.xml', 'feed.xml'):
    rss = ET.parse(OUTPUT / 'fr/index.xml')
    rss.find(f'./channel/{{{ATOM}}}link').set('href', f'https://okcomputer.cloud/{filename}')
    rss.write(OUTPUT / filename, encoding='utf-8', xml_declaration=True)

channel = ET.parse(OUTPUT / 'fr/index.xml').find('channel')
ET.register_namespace('', ATOM)
feed = ET.Element(f'{{{ATOM}}}feed')

def element(parent, name, text=None, **attrs):
    node = ET.SubElement(parent, f'{{{ATOM}}}{name}', attrs)
    node.text = text
    return node

from email.utils import parsedate_to_datetime
items = channel.findall('item')
element(feed, 'title', channel.findtext('title'))
element(feed, 'id', 'https://okcomputer.cloud/')
element(feed, 'link', href='https://okcomputer.cloud/atom.xml', rel='self')
element(feed, 'link', href=channel.findtext('link'))
element(feed, 'updated', parsedate_to_datetime(items[0].findtext('pubDate')).isoformat()
        if items else '2015-01-01T00:00:00+00:00')
author = element(feed, 'author')
element(author, 'name', 'Erwan Quélin')
for item in items:
    entry = element(feed, 'entry')
    element(entry, 'title', item.findtext('title'))
    element(entry, 'id', item.findtext('guid'))
    element(entry, 'link', href=item.findtext('link'))
    element(entry, 'updated', parsedate_to_datetime(item.findtext('pubDate')).isoformat())
    element(entry, 'content', item.findtext('description'), type='html')
ET.ElementTree(feed).write(OUTPUT / 'atom.xml', encoding='utf-8', xml_declaration=True)
print('Built public/ with legacy RSS/Atom feeds and root 404.')
