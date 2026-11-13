/* One clock for the sun, clouds, birds and lake. No independent CSS animations. */
(function () {
  'use strict';

  var banner = document.querySelector('[data-mountain-banner]');
  if (!banner) return;

  var sun = banner.querySelector('[data-mountain-sun]');
  var toggle = banner.querySelector('[data-mountain-toggle]');
  var clouds = banner.querySelector('[data-mountain-clouds]');
  var birds = banner.querySelector('[data-mountain-birds]');
  var ripples = banner.querySelector('[data-mountain-ripples]');
  var labels = toggle.dataset || {};
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var duration = 60000;
  var elapsed = duration / 2;
  var previousTime = null;
  var frame = null;
  var paused = false;
  var inView = true;

  function translate(element, x, y) {
    if (element) element.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
  }

  function draw(staticScene) {
    var clock = staticScene ? duration / 2 : elapsed;
    var progress = (clock % duration) / duration;
    // Quantize to the illustration's pixel grid; never slide a smooth vector sun.
    var x = Math.round((104 + 272 * progress) / 2) * 2;
    var y = Math.round((100 - 72 * Math.sin(Math.PI * progress)) / 2) * 2;
    translate(sun, x, y);
    // Repeated cloud tiles make the wrap invisible. All motion uses pixel steps.
    translate(clouds, staticScene ? 0 : Math.floor((clock % 240000) / 1000) * 2, 0);
    translate(birds, staticScene ? 0 : Math.round(12 * Math.sin(clock / 12000)) * 2,
      staticScene ? 0 : Math.round(2 * Math.sin(clock / 4000)) * 2);
    translate(ripples, staticScene ? 0 : Math.round(2 * Math.sin(clock / 2000)) * 2, 0);
    if (ripples) ripples.setAttribute('opacity', staticScene ? '0.65' :
      (0.5 + 0.15 * Math.sin(clock / 3000)).toFixed(2));
  }

  function shouldAnimate() {
    return !paused && !reducedMotion.matches && !document.hidden && inView;
  }

  function render(time) {
    frame = null;
    if (!shouldAnimate()) {
      previousTime = null;
      return;
    }
    if (previousTime !== null) elapsed += time - previousTime;
    previousTime = time;
    draw();
    frame = window.requestAnimationFrame(render);
  }

  function sync() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
    toggle.hidden = reducedMotion.matches;
    if (reducedMotion.matches) {
      draw(true);
    } else {
      draw();
      if (shouldAnimate()) frame = window.requestAnimationFrame(render);
    }
  }

  toggle.addEventListener('click', function () {
    paused = !paused;
    toggle.textContent = paused ? (labels.resume || 'Resume') : (labels.pause || 'Pause');
    toggle.setAttribute('aria-label', paused ? (labels.resumeLabel || 'Resume mountain animation') :
      (labels.pauseLabel || 'Pause mountain animation'));
    sync();
  });

  document.addEventListener('visibilitychange', sync);
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', sync);
  } else {
    reducedMotion.addListener(sync);
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    });
    observer.observe(banner);
  }

  sync();
}());
