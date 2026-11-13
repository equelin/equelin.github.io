# OK Computer

Erwan Quélin’s lightweight technical blog: **https://okcomputer.cloud**.

Built with **Hugo 0.170.0**, a small custom layout, system fonts, and no runtime
framework. French is the default; French and English content live under `/fr/`
and `/en/`. The homepage shows the five latest articles in the selected language.

## Run locally

Install [Hugo](https://gohugo.io/installation/) **0.170.0** (standard edition is
sufficient). Python 3 is needed for the production build/check scripts; Node 22
is used for tests, not to render the site.

```sh
hugo server --buildDrafts
# Open http://localhost:1313/fr/ or http://localhost:1313/en/
```

Build the exact GitHub Pages output, including old feed URLs and the root 404:

```sh
python3 scripts/build.py
python3 scripts/check-site.py
python3 -m http.server 8080 --directory public
```

The `public/` directory is generated and ignored by Git. Set `HUGO=/path/to/hugo`
if the binary is not on your PATH. Local production previews use production
canonical/redirect URLs; `hugo server` adjusts URLs for everyday writing.

## Write a post

```sh
hugo new content articles/my-new-post.fr.md
# Or: hugo new content articles/my-new-post.en.md
```

The archetype creates a draft. Edit the Markdown and front matter:

```yaml
---
title: "A useful technical title"
date: 2026-11-13T12:00:00+01:00
draft: true
description: "One or two sentences describing what the reader will learn."
tags: [Linux, Automation]
translationKey: my-new-post
---

The problem, what I tried, and what I learned…
```

Use your actual publication date. Future-dated posts and drafts are not published.
Preview with `hugo server --buildDrafts` (add `--buildFuture` for future posts).
When ready, set `draft: false`, commit, and push to `master`.

- `description` is used for the article preview and search metadata. Otherwise,
  Hugo generates a summary from the content. Use `<!--more-->` for a manual summary.
- Fenced code blocks support syntax highlighting: use `bash`, `python`,
  `powershell`, etc. No external code embedding service is needed.
- Put images in `static/images/` and reference `/images/filename.png`, with a useful
  alternative description. Page bundles can be used later for larger articles.
- `tags` are lightweight labels, not a sprawling taxonomy/navigation system.

### Add a translation (optional)

Create `my-new-post.en.md` alongside `my-new-post.fr.md`, with the **same
`translationKey`**. The filenames can differ if you want language-specific slugs.
Keep each version’s title, description, and body in its own language.

Hugo pairs published translations automatically. The header language switch
links to the equivalent page, not an unrelated homepage. If no translation exists,
that language is visibly unavailable and the article explains why. Draft
translations are not advertised. Articles appear only in their own language’s
homepage, archive, and feed. Publishing in just one language is completely fine.

The English homepage currently points readers toward the French archive instead
of pretending the existing French posts have been translated.

## Pages and design

- `content/about.fr.md`, `content/about.en.md`: short bilingual profile and contact
  links. Add experience, a CV, or a downloadable PDF here when ready. No invented
  employment history or placeholder CV is published.
- `i18n/fr.toml`, `i18n/en.toml`: homepage introduction and interface labels.
- `assets/css/site.css`: spacing, typography, palette, responsive and print styles.
- `layouts/`: small custom Hugo templates, with no external theme dependency.
- `hugo.toml`: site URL, language settings, author, contact, and Markdown rendering.

### Mountain banner

The homepages retain the original pixel-art alpine sunset: layered snowy peaks,
pines, a lake, drifting clouds, and birds. All movement uses one playback clock.
It respects reduced motion, pauses offscreen/in background tabs, has localized
Pause/Resume controls, and remains a complete illustration without JavaScript.
Article and About pages load no animation assets or JavaScript.

- `layouts/partials/mountain-banner.html`: SVG composition and colors.
- `assets/css/mountain-banner.css`: framing and caption.
- `assets/js/mountain-banner.js`: sun orbit, clouds, birds, and lake animation.

### Dithered mountain experiment

A separate preview lives at `/fr/experiments/mountains/` and
`/en/experiments/mountains/`; the homepage is unchanged. It uses original
procedural ridges, warm ink, ordered dithering, and drifting mist on a small
Canvas 2D buffer, capped at 12 paints per second. No video or external assets.
Reduced motion, offscreen/background suspension, pause controls, and a no-JS
SVG fallback are included. Preview assets load only on these pages.

A second, full-width panorama lives at `/fr/experiments/mountains-wide/` and
`/en/experiments/mountains-wide/`. It renders outside the reading column, crops
closer on mobile, and retains the first study’s ordered dots with taller mountain
silhouettes and lighter mist. Dithering is applied at the displayed resolution
and rebuilt on resize to avoid stretching the dot pattern. Neither experiment
replaces the homepage.

A third study at `/fr/experiments/alpine-morning/` and
`/en/experiments/alpine-morning/` adds muted blue and sage inks, a light wash under
the dots, and an apricot sun. Its green link accents are scoped to the preview
through `assets/css/alpine-morning.css`. The monochrome studies stay unchanged;
all three have localized controls, reduced-motion support, and SVG fallbacks.

Edit `assets/js/mountain-preview.js`, `assets/css/mountain-preview.css`,
`layouts/partials/mountain-study.html`, and
`layouts/_default/mountain-preview.html` to experiment. The preview pages are
marked `noindex` and are intentionally absent from the main navigation.

## Migration notes

All nine original French posts retain their dates and content. They are marked
as historical material so readers do not mistake 2015 procedures for current
recommendations. Original GitHub Gists are now local, syntax-highlighted code
with source links; the LVM diagram is served locally too.

Old dated article URLs, `/about/`, `/archives/`, and `/page2/` have HTML redirects.
GitHub Pages does not support arbitrary HTTP 301 rules, so these use canonical
links and meta refresh. Relative `../../2015/...` aliases deliberately escape
the language prefix to preserve the old root-level URLs.

New feeds are `/fr/index.xml` and `/en/index.xml`. The production build also
maintains `/feed.xml`, `/index.xml`, and `/atom.xml` for existing subscribers.
Jekyll layouts, the sidebar, external fonts, social widgets, and comment embeds
have been removed. Git history retains the original site.

## Tests

Fast, dependency-free checks:

```sh
node --test _tests/*.test.cjs
python3 _tests/translations.test.py
python3 _tests/deployment.test.py
python3 scripts/build.py
python3 scripts/check-site.py
```

The site checker validates local links and anchors, all old article redirects,
reciprocal language metadata, feeds, sitemap, images, and the custom domain.
Translation tests build disposable content to verify translation pairing, draft
exclusion, and the new-post archetype.

Real-browser checks (development dependencies only):

```sh
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

These cover bilingual navigation, code/image rendering, layouts from 320px to
1280px, animation controls, reduced motion, no-JavaScript navigation, the 404,
and absence of third-party requests. Screenshots go to ignored `test-results/`.

## Deployment

`.github/workflows/pages.yml` builds and checks the site on pushes to `master`
and pull requests. Only `master` deploys the built artifact to GitHub Pages.
Hugo is version-pinned and its downloaded archive is checksum-verified.

**Preferred repository setting:** Settings → Pages → Build and deployment →
Source → **GitHub Actions**. No custom token or deployment secret is required.

For compatibility with the repository’s original branch-based Pages setting,
the deploy job first waits for GitHub’s legacy `pages build and deployment` run
for the same commit to finish. Hugo then deploys last, avoiding competing
publishers. This check is skipped automatically when the source is GitHub Actions.
The root `CNAME` is retained for the legacy setting; `static/CNAME` places the same
domain in Hugo’s build output. Keep both in sync if changing domains.

The custom domain stays **okcomputer.cloud**; no DNS change is required.
