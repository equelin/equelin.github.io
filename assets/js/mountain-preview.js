/* Original procedural landscape. No video, textures, framework, or external assets.
 * A low-resolution Canvas 2D buffer keeps the experiment inexpensive; stable
 * ordered dithering gives moving mist a printed appearance without random flicker.
 */
(function () {
  'use strict';
  var study = document.querySelector('[data-mountain-study]');
  if (!study) return;
  var canvas = study.querySelector('canvas');
  var context = canvas.getContext('2d');
  if (!context) return; // The SVG remains visible without Canvas or JavaScript.
  var fallback = study.querySelector('svg');
  var toggle = study.querySelector('[data-study-toggle]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var width = canvas.width, height = canvas.height;
  var pixels = context.createImageData(width, height);
  var terrain = new Float32Array(width * height);
  var thresholds = new Uint8Array(width * height);
  var bayer = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,
    12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
    3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,
    15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
  var profiles = [
    [155, 130, 142, 102, 118, 58, 100, 114, 86, 132, 124, 92, 140],
    [186, 156, 100, 136, 164, 134, 110, 155, 118, 76, 112, 160, 140],
    [208, 182, 198, 166, 123, 168, 190, 172, 194, 154, 180, 162, 203]
  ];
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function smooth(value) { value = clamp(value); return value * value * (3 - 2 * value); }
  function ridge(profile, x, layer) {
    var position = x / (width - 1) * (profile.length - 1);
    var index = Math.min(profile.length - 2, Math.floor(position));
    var fraction = position - index;
    var contour = profile[index] * (1 - fraction) + profile[index + 1] * fraction;
    return contour + Math.sin(x * .075 + layer * 4) * 3 +
      Math.sin(x * .19 + layer) * 1.8 + Math.sin(x * .43) * .7;
  }
  // Cache the still terrain. Only atmosphere and dithering are evaluated per frame.
  for (var x = 0; x < width; x++) {
    var ridges = profiles.map(function (profile, layer) { return ridge(profile, x, layer); });
    for (var y = 0; y < height; y++) {
      var index = y * width + x;
      var shade = 0;
      for (var layer = 0; layer < ridges.length; layer++) {
        var depth = y - ridges[layer];
        if (depth >= 0) {
          // Fluted rock faces: directional bands, broken by the contours.
          var face = Math.sin(x * .043 + y * .038 + layer * 2);
          var detail = Math.sin(x * .12 - y * .055) * .025;
          shade = [.23, .38, .57][layer] + face * [.045, .065, .09][layer] + detail;
          // Pale cuts just below summits suggest snow without hard vector caps.
          shade *= .55 + .45 * smooth(depth / (13 + 8 * Math.sin(x * .09)));
        }
      }
      // A pale sun, almost absorbed into the paper.
      var sun = Math.hypot(x - 552, y - 49);
      if (sun < 23) shade = .008;
      else if (sun < 25) shade += .07;
      terrain[index] = shade * smooth(x / 45) * smooth((width - 1 - x) / 45);
      thresholds[index] = bayer[(y % 8) * 8 + x % 8];
      var offset = index * 4;
      pixels.data[offset] = 113;
      pixels.data[offset + 1] = 96;
      pixels.data[offset + 2] = 77;
    }
  }
  var elapsed = 0, previous = null, lastPaint = -Infinity, frame = null;
  var paused = false, visible = true;
  var fade = new Float32Array(height);
  for (var row = 0; row < height; row++) fade[row] = 1 - smooth((row - 190) / 105);
  function draw(time) {
    for (var x = 0; x < width; x++) {
      var drift = x * .009 - time * .00011;
      var mistY = 162 + Math.sin(drift) * 17 + Math.sin(drift * .57 + 1.3) * 13;
      var mistY2 = 219 + Math.sin(x * .012 + time * .00007) * 12;
      for (var y = 0; y < height; y++) {
        var index = y * width + x;
        var distance = (y - mistY) / 24;
        var distance2 = (y - mistY2) / 20;
        // Rational falloff avoids costly per-pixel exponential/noise functions.
        var mist = .62 / (1 + distance * distance * distance * distance);
        mist += .32 / (1 + distance2 * distance2 * distance2 * distance2);
        var density = terrain[index] * (1 - Math.min(.83, mist)) * fade[y];
        pixels.data[index * 4 + 3] = density > (thresholds[index] + .5) / 64 ? 205 : 0;
      }
    }
    context.putImageData(pixels, 0, 0);
  }
  function active() { return !paused && !motion.matches && visible && !document.hidden; }
  function render(time) {
    frame = null;
    if (!active()) { previous = null; return; }
    if (previous !== null) elapsed += time - previous;
    previous = time;
    if (time - lastPaint >= 1000 / 12) { draw(elapsed); lastPaint = time; }
    frame = requestAnimationFrame(render);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previous = null;
    lastPaint = -Infinity;
    toggle.hidden = motion.matches;
    draw(motion.matches ? 0 : elapsed);
    if (active()) frame = requestAnimationFrame(render);
  }
  toggle.addEventListener('click', function () {
    paused = !paused;
    toggle.textContent = paused ? toggle.dataset.resume : toggle.dataset.pause;
    toggle.setAttribute('aria-label', paused ? toggle.dataset.resumeLabel : toggle.dataset.pauseLabel);
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  if (motion.addEventListener) motion.addEventListener('change', sync);
  else motion.addListener(sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(study);
  }
  sync();
  canvas.hidden = false;
  fallback.hidden = true;
  fallback.style.display = 'none';
}());
