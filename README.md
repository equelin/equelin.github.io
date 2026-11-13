# OK Computer

Personal Jekyll blog, published with GitHub Pages at https://okcomputer.cloud.

## Mountain banner

The homepage has an original SVG pixel landscape with a sun crossing the valley
on a 60-second loop. No framework, video, external artwork, or build dependency
is required. The SVG stays visible without JavaScript.

- `_includes/mountain-banner.html`: stepped mountains, sun, and pause control.
- `public/css/mountain-banner.css`: palette, spacing, and responsive sizing.
- `public/js/mountain-banner.js`: orbit and playback behaviour.

Enable it on a page with `mountain_banner: true` in its front matter; remove that
line from `index.html` to disable it. Banner assets load only on enabled pages.
The existing article layouts are otherwise unchanged.

The animation respects reduced-motion preferences, pauses outside the viewport
and in background tabs, and has a keyboard-accessible Pause / Resume button.
Change `duration` in the script to adjust its speed; change the colour rules in
the stylesheet to adjust the palette. Keep the SVG and the script's static sun
position in sync if editing the composition.

Run the dependency-free animation tests with Node.js:

```sh
node --test _tests/mountain-banner.test.cjs
```

Publish using the usual Git workflow: review changes, commit, then push the
publishing branch to GitHub. No DNS or certificate changes are required.
