# OK Computer

Personal Jekyll blog, published with GitHub Pages at https://okcomputer.cloud.

## Mountain banner

The homepage has an original SVG pixel-art alpine sunset: shaded snowy peaks,
layered pine forests, a lake with shimmering light, drifting clouds, and birds.
The sun crosses the valley on a 60-second loop; the clouds tile seamlessly over
four minutes. All movement shares one playback clock. No framework, video,
external artwork, or build dependency is required. The full illustration stays
visible without JavaScript.

- `_includes/mountain-banner.html`: layered illustration, SVG palette, and pause control.
- `public/css/mountain-banner.css`: palette, spacing, and responsive sizing.
- `public/js/mountain-banner.js`: orbit and playback behaviour.

Enable it on a page with `mountain_banner: true` in its front matter; remove that
line from `index.html` to disable it. Banner assets load only on enabled pages.
The existing article layouts are otherwise unchanged.

The animation respects reduced-motion preferences, pauses outside the viewport
and in background tabs, and has a keyboard-accessible Pause / Resume button.
Change `duration` in the script to adjust the sun's speed; edit SVG fills and
gradient stops in the include to adjust the landscape palette. The stylesheet
controls framing and the caption. Keep the SVG and the script's static layer
positions in sync if editing the composition.

Run the dependency-free animation tests with Node.js:

```sh
node --test _tests/mountain-banner.test.cjs
```

Publish using the usual Git workflow: review changes, commit, then push the
publishing branch to GitHub. No DNS or certificate changes are required.
