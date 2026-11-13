#!/usr/bin/env python3
"""Prove translation pairing and draft exclusion with disposable content."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
HUGO = os.environ.get('HUGO', 'hugo')
with tempfile.TemporaryDirectory(prefix='okcomputer-translations-') as directory:
    root = Path(directory)
    for name in ('layouts', 'assets', 'content', 'i18n', 'static', 'archetypes'):
        shutil.copytree(ROOT / name, root / name)
    shutil.copyfile(ROOT / 'hugo.toml', root / 'hugo.toml')
    for language in ('fr', 'en'):
        (root / f'content/articles/pair.{language}.md').write_text(
            '---\ntitle: Translation fixture\ndate: 2020-01-01\n'
            'translationKey: fixture\ndraft: false\n---\nFixture content.\n')
    (root / 'content/articles/unpublished.en.md').write_text(
        '---\ntitle: Secret draft fixture\ndate: 2020-01-02\ndraft: true\n---\nNot ready.\n')
    subprocess.run([HUGO, '--source', str(root)], check=True, capture_output=True)
    for language, other in (('fr', 'en'), ('en', 'fr')):
        page = (root / f'public/{language}/articles/pair/index.html').read_text()
        assert f'href="/{other}/articles/pair/"' in page
        assert 'class="language-unavailable"' not in page
        assert f'href="https://okcomputer.cloud/{other}/articles/pair/"' in page
        home = (root / f'public/{language}/index.html').read_text()
        archive = (root / f'public/{language}/articles/index.html').read_text()
        assert 'Translation fixture' in home and 'Translation fixture' in archive
        assert 'Secret draft fixture' not in home and 'Secret draft fixture' not in archive
    assert not (root / 'public/en/articles/unpublished/index.html').exists()
    # Confirm the documented archetype command produces a draft with a usable translation key.
    subprocess.run([HUGO, 'new', 'content', 'articles/my-next-post.fr.md', '--source', str(root)],
                   check=True, capture_output=True)
    draft = (root / 'content/articles/my-next-post.fr.md').read_text()
    assert 'draft: true' in draft and "translationKey: 'my-next-post'" in draft
print('PASS: reciprocal translations, language-specific lists, draft exclusion, and new-post archetype.')
