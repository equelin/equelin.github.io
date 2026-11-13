const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '../assets/js/mountain-banner.js'), 'utf8');

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
  const layer = () => ({
    transform: 'translate(0 0)',
    setAttribute(name, value) { this[name] = value; }
  });
  const clouds = layer();
  const birds = layer();
  const ripples = layer();
  const elements = {
    '[data-mountain-sun]': sun,
    '[data-mountain-toggle]': toggle,
    '[data-mountain-clouds]': clouds,
    '[data-mountain-birds]': birds,
    '[data-mountain-ripples]': ripples
  };
  const banner = { querySelector: selector => elements[selector] || null };
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
  return { sun, clouds, birds, ripples, toggle, frames, document, motion, events, tick,
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

test('all ambient layers move on the shared clock and freeze when paused', () => {
  const state = setup();
  const snapshot = () => JSON.stringify([state.clouds, state.birds, state.ripples]);
  const initial = snapshot();
  state.tick();
  state.tick(5000);
  assert.notEqual(snapshot(), initial);
  for (const element of [state.clouds, state.birds, state.ripples]) {
    assert.ok(element.transform.match(/-?\d+/g).map(Number).every(n => n % 2 === 0));
  }
  state.events.click();
  const paused = snapshot();
  state.tick(10000);
  assert.equal(snapshot(), paused);
  assert.equal(state.frames.size, 0);
});

test('reduced motion restores the complete static illustration', () => {
  const state = setup();
  state.tick();
  state.tick(8000);
  state.motion.matches = true;
  state.events.motion();
  for (const element of [state.clouds, state.birds, state.ripples]) {
    assert.equal(element.transform, 'translate(0 0)');
  }
  assert.equal(state.ripples.opacity, '0.65');
  assert.equal(state.frames.size, 0);
});

test('cloud tiles wrap by exactly one scene width', () => {
  const state = setup();
  state.tick();
  const initial = state.clouds.transform;
  state.tick(240000);
  assert.equal(state.clouds.transform, initial);
  assert.equal(state.frames.size, 1);
});

test('pages without the banner do nothing', () => {
  const state = setup({ present: false });
  assert.equal(state.frames.size, 0);
});
