import { mountDemoBar, raf } from '../../src/lib/chrome.js';
mountDemoBar();

/* ═══════════════════════════════════════════════════════════════════════════
   Easing functions.

   Each takes t in 0..1 and returns the eased progress. Because the SVG plot
   and the moving element are both driven by the SAME function, the graph is
   not an illustration of the motion — it IS the motion.
   ═══════════════════════════════════════════════════════════════════════════ */

const C1 = 1.70158;      // the standard "back" overshoot constant
const C3 = C1 + 1;
const C4 = (2 * Math.PI) / 3;

const EASINGS = {
  linear: [(t) => t, 'linear'],
  'ease-out (quad)': [(t) => 1 - (1 - t) ** 2, 'cubic-bezier(0.5, 1, 0.89, 1)'],
  'ease-out (cubic)': [(t) => 1 - (1 - t) ** 3, 'cubic-bezier(0.33, 1, 0.68, 1)'],
  'ease-out (quart)': [(t) => 1 - (1 - t) ** 4, 'cubic-bezier(0.25, 1, 0.5, 1)'],
  'ease-out (expo)': [(t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)), 'cubic-bezier(0.16, 1, 0.3, 1)'],
  'ease-out (circ)': [(t) => Math.sqrt(1 - (t - 1) ** 2), 'cubic-bezier(0, 0.55, 0.45, 1)'],
  'ease-in (cubic)': [(t) => t ** 3, 'cubic-bezier(0.32, 0, 0.67, 0)'],
  'ease-in (expo)': [(t) => (t === 0 ? 0 : 2 ** (10 * t - 10)), 'cubic-bezier(0.7, 0, 0.84, 0)'],
  'in-out (cubic)': [
    (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    'cubic-bezier(0.65, 0, 0.35, 1)',
  ],
  'in-out (expo)': [
    (t) =>
      t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
    'cubic-bezier(0.87, 0, 0.13, 1)',
  ],
  'back (out)': [
    (t) => 1 + C3 * (t - 1) ** 3 + C1 * (t - 1) ** 2,
    'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ],
  'back (in)': [(t) => C3 * t ** 3 - C1 * t ** 2, 'cubic-bezier(0.36, 0, 0.66, -0.56)'],
  elastic: [
    (t) => (t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * C4) + 1),
    'not expressible as a bezier — use linear()',
  ],
  bounce: [
    (t) => {
      const n = 7.5625;
      const d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
    'not expressible as a bezier — use linear()',
  ],
  'steps(8)': [(t) => Math.floor(t * 8) / 8, 'steps(8, end)'],
};

/** Samples an easing into an SVG path over a 100×100 box (y inverted). */
function plotPath(fn, samples = 90) {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const v = fn(t);
    d += `${i === 0 ? 'M' : 'L'}${(t * 100).toFixed(2)},${(100 - v * 100).toFixed(2)} `;
  }
  return d.trim();
}

const DUR = { ms: 900 };

// --- Curve grid -------------------------------------------------------------
const curvesEl = document.getElementById('curves');

curvesEl.innerHTML = Object.entries(EASINGS)
  .map(
    ([name, [fn, css]]) => `
    <div class="curve" data-easing="${name}" title="click to copy: ${css}">
      <h3>${name}</h3>
      <svg viewBox="-8 -34 116 168" aria-hidden="true">
        <rect class="box" x="0" y="0" width="100" height="100" />
        <line class="grid" x1="0" y1="50" x2="100" y2="50" />
        <path class="path" d="${plotPath(fn)}" />
        <circle class="dot" r="4" cx="0" cy="100" />
        <line class="track" x1="6" y1="126" x2="94" y2="126" />
        <circle class="runner" r="7" cx="6" cy="126" />
      </svg>
      <code>${css}</code>
    </div>`
  )
  .join('');

// Each card animates independently, so a card can be replayed without
// disturbing the others.
const cards = [...curvesEl.querySelectorAll('.curve')].map((el) => ({
  el,
  fn: EASINGS[el.dataset.easing][0],
  dot: el.querySelector('.dot'),
  runner: el.querySelector('.runner'),
  start: -1,
}));

function play(card) {
  card.start = performance.now();
}

for (const card of cards) {
  card.el.addEventListener('pointerenter', () => play(card));
  card.el.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(EASINGS[card.el.dataset.easing][1]);
      const h = card.el.querySelector('h3');
      const prev = h.textContent;
      h.textContent = 'copied ✓';
      setTimeout(() => (h.textContent = prev), 900);
    } catch {
      /* clipboard needs a secure context */
    }
    play(card);
  });
}

document.getElementById('play-all').onclick = () => cards.forEach(play);

raf(() => {
  const now = performance.now();
  for (const card of cards) {
    if (card.start < 0) continue;
    const t = Math.min(1, (now - card.start) / DUR.ms);
    const v = card.fn(t);
    card.dot.setAttribute('cx', (t * 100).toFixed(2));
    card.dot.setAttribute('cy', (100 - v * 100).toFixed(2));
    card.runner.setAttribute('cx', (6 + v * 88).toFixed(2));
    if (t >= 1) card.start = -1;
  }
});

function bind(id, apply, format) {
  const el = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(el.value));
    if (out) out.textContent = format(Number(el.value));
  };
  el.addEventListener('input', update);
  update();
}

bind('dur', (v) => (DUR.ms = v), (v) => `${v}ms`);
cards.forEach(play);

/* ═══════════════════════════════════════════════════════════════════════════
   Bezier editor
   ═══════════════════════════════════════════════════════════════════════════ */

const bez = { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 };
const bezSvg = document.getElementById('bezier');

/**
 * Evaluates a CSS cubic-bezier at time t.
 *
 * The subtlety: a CSS bezier is a parametric curve, so the x you want is not
 * the parameter s. Newton's method inverts x(s) = t first, then evaluates y at
 * that s. Skipping this and using t directly as the parameter is a common bug
 * that makes every curve subtly wrong.
 */
function cubicBezier(x1, y1, x2, y2) {
  const A = (a, b) => 1 - 3 * b + 3 * a;
  const B = (a, b) => 3 * b - 6 * a;
  const C = (a) => 3 * a;
  const calc = (s, a, b) => ((A(a, b) * s + B(a, b)) * s + C(a)) * s;
  const slope = (s, a, b) => 3 * A(a, b) * s * s + 2 * B(a, b) * s + C(a);

  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 6; i++) {
      const d = slope(s, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      s -= (calc(s, x1, x2) - t) / d;
    }
    return calc(s, y1, y2);
  };
}

function drawBezier() {
  const fn = cubicBezier(bez.x1, bez.y1, bez.x2, bez.y2);
  const px = (v) => v * 100;
  const py = (v) => 100 - v * 100;

  bezSvg.innerHTML = `
    <rect class="box" x="0" y="0" width="100" height="100" />
    <line class="grid" x1="0" y1="50" x2="100" y2="50" />
    <path class="path" d="${plotPath(fn)}" />
    <line class="handle-line" x1="0" y1="100" x2="${px(bez.x1)}" y2="${py(bez.y1)}" />
    <line class="handle-line" x1="100" y1="0" x2="${px(bez.x2)}" y2="${py(bez.y2)}" />
    <circle class="handle" data-h="1" r="6" cx="${px(bez.x1)}" cy="${py(bez.y1)}" />
    <circle class="handle" data-h="2" r="6" cx="${px(bez.x2)}" cy="${py(bez.y2)}" />`;

  const css = `cubic-bezier(${bez.x1.toFixed(2)}, ${bez.y1.toFixed(2)}, ${bez.x2.toFixed(2)}, ${bez.y2.toFixed(2)})`;
  document.getElementById('bez-css').textContent = css;

  const hints = [];
  if (bez.y1 < 0) hints.push('anticipation');
  if (bez.y2 > 1) hints.push('overshoot');
  if (bez.y1 > 1) hints.push('fast start');
  document.getElementById('bez-hint').textContent = hints.join(' + ') || 'standard';
  return fn;
}

let bezFn = drawBezier();

// Pointer handling on an SVG needs the CTM to map screen → user units;
// getBoundingClientRect alone gives the wrong scale once a viewBox is in play.
bezSvg.addEventListener('pointerdown', (e) => {
  const handle = e.target.closest('.handle');
  if (!handle) return;
  handle.setPointerCapture(e.pointerId);

  const move = (ev) => {
    const pt = bezSvg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const p = pt.matrixTransform(bezSvg.getScreenCTM().inverse());
    // X is clamped to 0..1 because time cannot run backwards. Y is left free,
    // which is exactly what produces anticipation and overshoot.
    const x = Math.min(1, Math.max(0, p.x / 100));
    const y = Math.min(1.8, Math.max(-0.8, (100 - p.y) / 100));
    if (handle.dataset.h === '1') {
      bez.x1 = x;
      bez.y1 = y;
    } else {
      bez.x2 = x;
      bez.y2 = y;
    }
    bezFn = drawBezier();
  };

  const up = () => {
    bezSvg.removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
  };
  bezSvg.addEventListener('pointermove', move);
  addEventListener('pointerup', up);
});

const bezBall = document.getElementById('bez-ball');
let bezStart = -1;
document.getElementById('bez-play').onclick = () => (bezStart = performance.now());

/* ═══════════════════════════════════════════════════════════════════════════
   Springs
   ═══════════════════════════════════════════════════════════════════════════ */

const spring = { k: 220, c: 18, m: 1 };

/**
 * Analytic solution of a damped harmonic oscillator released from rest at 0
 * heading to 1. Solving it in closed form rather than integrating means the
 * plot can be sampled at any t without simulating, which is what lets us emit
 * a CSS linear() from it.
 */
function springFn({ k, c, m }) {
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  if (zeta < 1) {
    // Underdamped: oscillates, overshooting past 1.
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  if (Math.abs(zeta - 1) < 1e-4) {
    // Critically damped: the fastest approach with no overshoot at all.
    return (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  // Overdamped: two decaying exponentials, slow and sluggish.
  const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
  return (t) => 1 - (r1 * Math.exp(r2 * t) - r2 * Math.exp(r1 * t)) / (r1 - r2);
}

/** Time at which the spring is within 0.5% of rest and stays there. */
function settleTime(fn) {
  for (let t = 0; t < 6; t += 0.01) {
    if (Math.abs(fn(t) - 1) < 0.005) {
      let stable = true;
      for (let u = t; u < t + 0.4; u += 0.02) {
        if (Math.abs(fn(u) - 1) > 0.005) {
          stable = false;
          break;
        }
      }
      if (stable) return t;
    }
  }
  return 6;
}

const springPlot = document.getElementById('spring-plot');
let springF = springFn(spring);
let springDur = 1;

function drawSpring() {
  springF = springFn(spring);
  springDur = settleTime(springF);

  // Normalise the time axis to the settle time so the whole motion fits the
  // plot, and squash the y axis so overshoot above 1 stays on screen.
  const norm = (t) => springF(t * springDur);
  let d = '';
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    d += `${i === 0 ? 'M' : 'L'}${(t * 100).toFixed(2)},${(100 - norm(t) * 100).toFixed(2)} `;
  }

  springPlot.innerHTML = `
    <rect class="box" x="0" y="0" width="100" height="100" />
    <line class="grid" x1="0" y1="0" x2="100" y2="0" />
    <path class="path" d="${d.trim()}" />`;

  const zeta = spring.c / (2 * Math.sqrt(spring.k * spring.m));
  const label =
    zeta < 0.95 ? 'underdamped — overshoots and bounces'
    : zeta > 1.05 ? 'overdamped — sluggish, never overshoots'
    : 'critically damped — fastest possible, no overshoot';
  document.getElementById('zeta').textContent = `ζ = ${zeta.toFixed(3)} · ${label}`;
  document.getElementById('settle').textContent = `settles in ${(springDur * 1000).toFixed(0)}ms`;

  // CSS linear() — the spring sampled into keypoints. This is how a real
  // spring runs with zero JavaScript.
  const pts = Array.from({ length: 26 }, (_, i) => norm(i / 25).toFixed(4)).join(', ');
  document.getElementById('linear-css').textContent =
    `animation-timing-function: linear(${pts});`;
}

bind('k', (v) => (spring.k = v), (v) => v);
bind('c', (v) => (spring.c = v), (v) => v);
bind('m', (v) => (spring.m = v / 10), (v) => (v / 10).toFixed(1));

// The three sliders each call bind's update, which only sets the value —
// redraw once after all of them are wired.
for (const id of ['k', 'c', 'm']) {
  document.getElementById(id).addEventListener('input', drawSpring);
}
drawSpring();

const springBall = document.getElementById('spring-ball');
let springStart = -1;
document.getElementById('spring-play').onclick = () => (springStart = performance.now());

/* ═══════════════════════════════════════════════════════════════════════════
   Interruption comparison
   ═══════════════════════════════════════════════════════════════════════════ */

const intEase = document.getElementById('int-ease');
const intSpring = document.getElementById('int-spring');

const easeState = { from: 0, to: 0, start: -1 };
// The spring keeps position AND velocity, which is the entire difference.
const springState = { pos: 0, vel: 0, target: 0 };

document.getElementById('interrupt').onclick = () => {
  const next = easeState.to > 0.5 ? 0 : 1;
  // The ease restarts from wherever it currently is, but with ZERO velocity —
  // all momentum is discarded, which is what the eye reads as a stutter.
  const t = easeState.start < 0 ? 1 : Math.min(1, (performance.now() - easeState.start) / 500);
  easeState.from = easeState.from + (easeState.to - easeState.from) * cubicBezier(0.33, 1, 0.68, 1)(t);
  easeState.to = next;
  easeState.start = performance.now();
  springState.target = next;
};

const outCubic = cubicBezier(0.33, 1, 0.68, 1);

raf((dt) => {
  const now = performance.now();
  const travel = (el) => el.parentElement.clientWidth - 46;

  // Bezier editor preview
  if (bezStart >= 0) {
    const t = Math.min(1, (now - bezStart) / DUR.ms);
    bezBall.style.translate = `${bezFn(t) * travel(bezBall)}px -50%`;
    if (t >= 1) bezStart = -1;
  }

  // Spring preview
  if (springStart >= 0) {
    const t = (now - springStart) / 1000;
    springBall.style.translate = `${springF(t) * travel(springBall)}px -50%`;
    if (t > springDur) springStart = -1;
  }

  // Interruption comparison
  if (easeState.start >= 0) {
    const t = Math.min(1, (now - easeState.start) / 500);
    const v = easeState.from + (easeState.to - easeState.from) * outCubic(t);
    intEase.style.translate = `${v * travel(intEase)}px -50%`;
    if (t >= 1) easeState.start = -1;
  }

  // Semi-implicit Euler. Velocity persists across retargets, so a new target
  // mid-flight is absorbed rather than restarting.
  const step = Math.min(dt, 1 / 30);
  const accel = (springState.target - springState.pos) * 180 - springState.vel * 18;
  springState.vel += accel * step;
  springState.pos += springState.vel * step;
  intSpring.style.translate = `${springState.pos * travel(intSpring)}px -50%`;
});

/* ═══════════════════════════════════════════════════════════════════════════
   steps()
   ═══════════════════════════════════════════════════════════════════════════ */

const stepBall = document.getElementById('step-ball');
const stepper = document.getElementById('stepper');
let stepStart = -1;

document.getElementById('step-play').onclick = () => (stepStart = performance.now());

raf(() => {
  if (stepStart < 0) return;
  const t = Math.min(1, (performance.now() - stepStart) / 1600);
  const v = Math.floor(t * 8) / 8;
  stepBall.style.translate = `${v * (stepBall.parentElement.clientWidth - 46)}px -50%`;
  stepper.textContent = `${Math.round(v * 8)}/8`;
  if (t >= 1) stepStart = -1;
});

// --- Copy buttons ------------------------------------------------------------
for (const btn of document.querySelectorAll('[data-copy]')) {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById(btn.dataset.copy).textContent);
      btn.textContent = 'copied ✓';
      setTimeout(() => (btn.textContent = 'copy'), 1200);
    } catch {
      /* clipboard needs a secure context */
    }
  });
}
