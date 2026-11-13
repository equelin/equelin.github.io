const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '../public/js/mountain-banner.js'), 'utf8');

function setup({ reduced = false, present = true } = {}) {
  const frames = new Map();
  const events = {};
  let nextFrame = 0;
  let visibilityCallback;
  let time = 0;
  const sun = {
    position: 'translate(240 28)',
    setAttribute(name, value) { if (name === 'transform') this.position = value; }
  };
  const toggle = {
    hidden: true,
    addEventListener(name, callback) { events.click = callback; },
    setAttribute(name, value) { this[name] = value; }
  };
  const banner = { querySelector: selector => selector === '[data-mountain-sun]' ? sun : toggle };
  const motion = {
    matches: reduced,
    addEventListener(name, callback) { events.motion = callback; }
  };
  const document = {
    hidden: false,
    querySelector: () => present ? banner : null,
    addEventListener(name, callback) { events[name] = callback; }
  };
  const window = {
    matchMedia: () => motion,
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
    IntersectionObserver: function (callback) {
      visibilityCallback = callback;
      this.observe = () => {};
    }
  };
  runInNewContext(source, { window, document, IntersectionObserver: window.IntersectionObserver });
  function tick(delta = 0) {
    time += delta;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(time));
  }
  return { sun, toggle, frames, document, motion, events, tick,
    visibility: visible => visibilityCallback([{ isIntersecting: visible }]) };
}

test('sun moves on a two-unit pixel grid, with one animation loop', () => {
  const state = setup();
  state.tick();
  state.tick(5000);
  assert.notEqual(state.sun.position, 'translate(240 28)');
  const coordinates = state.sun.position.match(/\d+/g).map(Number);
  assert.ok(coordinates.every(value => value % 2 === 0));
  assert.equal(state.frames.size, 1);
});

test('pause and resume preserve the sun position', () => {
  const state = setup();
  state.tick();
  state.tick(3000);
  state.events.click();
  const paused = state.sun.position;
  state.tick(5000);
  assert.equal(state.sun.position, paused);
  assert.equal(state.toggle.textContent, 'Resume');
  assert.equal(state.frames.size, 0);
  state.events.click();
  state.tick();
  state.tick(3000);
  assert.notEqual(state.sun.position, paused);
  assert.equal(state.toggle.textContent, 'Pause');
});

test('reduced motion starts static with no loop or pause button', () => {
  const state = setup({ reduced: true });
  assert.equal(state.sun.position, 'translate(240 28)');
  assert.equal(state.toggle.hidden, true);
  assert.equal(state.frames.size, 0);
});

test('changing motion preferences applies immediately', () => {
  const state = setup();
  state.motion.matches = true;
  state.events.motion();
  assert.equal(state.frames.size, 0);
  assert.equal(state.toggle.hidden, true);
  assert.equal(state.sun.position, 'translate(240 28)');
  state.motion.matches = false;
  state.events.motion();
  assert.equal(state.frames.size, 1);
  assert.equal(state.toggle.hidden, false);
});

test('offscreen and hidden tabs stop work without jumping on return', () => {
  const state = setup();
  state.tick();
  state.tick(3000);
  const before = state.sun.position;
  state.visibility(false);
  assert.equal(state.frames.size, 0);
  state.tick(60000);
  state.visibility(true);
  state.tick();
  assert.equal(state.sun.position, before);
  state.document.hidden = true;
  state.events.visibilitychange();
  assert.equal(state.frames.size, 0);
  state.document.hidden = false;
  state.events.visibilitychange();
  assert.equal(state.frames.size, 1);
});

test('repeated visibility events never create duplicate loops', () => {
  const state = setup();
  for (let i = 0; i < 10; i++) state.visibility(true);
  assert.equal(state.frames.size, 1);
});

test('the full orbit loops back behind the mountains', () => {
  const state = setup();
  state.tick();
  state.tick(30000);
  assert.equal(state.sun.position, 'translate(104 100)');
  state.tick(30000);
  assert.equal(state.sun.position, 'translate(240 28)');
});

test('pages without the banner do nothing', () => {
  const state = setup({ present: false });
  assert.equal(state.frames.size, 0);
});
