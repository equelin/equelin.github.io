/* A sixty-second sun crossing. Everything else in the landscape stays still. */
(function () {
  'use strict';

  var banner = document.querySelector('[data-mountain-banner]');
  if (!banner) return;

  var sun = banner.querySelector('[data-mountain-sun]');
  var toggle = banner.querySelector('[data-mountain-toggle]');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var duration = 60000;
  var elapsed = duration / 2;
  var previousTime = null;
  var frame = null;
  var paused = false;
  var inView = true;

  function draw() {
    var progress = (elapsed % duration) / duration;
    // Quantize to the illustration's pixel grid; never slide a smooth vector sun.
    var x = Math.round((104 + 272 * progress) / 2) * 2;
    var y = Math.round((100 - 72 * Math.sin(Math.PI * progress)) / 2) * 2;
    sun.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
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
      sun.setAttribute('transform', 'translate(240 28)');
    } else {
      draw();
      if (shouldAnimate()) frame = window.requestAnimationFrame(render);
    }
  }

  toggle.addEventListener('click', function () {
    paused = !paused;
    toggle.textContent = paused ? 'Resume' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Resume mountain animation' : 'Pause mountain animation');
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
