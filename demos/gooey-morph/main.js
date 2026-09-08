import { mountDemoBar, raf, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

// --- Metaball field -----------------------------------------------------------
const stage = document.getElementById('stage');
const COUNT = 9;

// The balls are confined to the middle band of the panel. Spread evenly over a
// wide box they would almost never come within merging distance of each other,
// and the effect would just look like circles.
const SPREAD_X = 0.42;
const SPREAD_Y = 0.7;

const balls = Array.from({ length: COUNT }, () => {
  const el = document.createElement('div');
  el.className = 'ball';
  const r = 56 + Math.random() * 60;
  el.style.width = el.style.height = `${r}px`;
  stage.append(el);
  return {
    el,
    r,
    x: 0.5 + (Math.random() - 0.5) * SPREAD_X,
    y: 0.5 + (Math.random() - 0.5) * SPREAD_Y,
    // Slow, incommensurable speeds so the field never visibly repeats.
    vx: (Math.random() - 0.5) * 0.1,
    vy: (Math.random() - 0.5) * 0.1,
  };
});

// The pointer is just another ball, which is why it merges with the rest.
const cursor = document.createElement('div');
cursor.className = 'ball ball--cursor';
cursor.style.width = cursor.style.height = '76px';
cursor.style.opacity = '0';
stage.append(cursor);

let cx = 0.5;
let cy = 0.5;
stage.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  cx = (e.clientX - r.left) / r.width;
  cy = (e.clientY - r.top) / r.height;
  cursor.style.opacity = '1';
});
stage.addEventListener('pointerleave', () => (cursor.style.opacity = '0'));

raf((dt) => {
  const { width: w, height: h } = stage.getBoundingClientRect();
  for (const b of balls) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Bounce inside the confined band rather than the whole panel.
    const mx = Math.max(b.r / 2 / w, (1 - SPREAD_X) / 2);
    const my = Math.max(b.r / 2 / h, (1 - SPREAD_Y) / 2);
    if (b.x < mx || b.x > 1 - mx) b.vx *= -1;
    if (b.y < my || b.y > 1 - my) b.vy *= -1;
    b.el.style.translate = `calc(${(b.x * w).toFixed(1)}px - 50%) calc(${(b.y * h).toFixed(1)}px - 50%)`;
  }
  cursor.style.translate = `calc(${(cx * w).toFixed(1)}px - 50%) calc(${(cy * h).toFixed(1)}px - 50%)`;
});

// --- Flowing displaced text ---------------------------------------------------
// Animating baseFrequency re-runs the whole filter graph, so it only runs while
// the pointer is actually over the headline.
const noise = document.getElementById('warp-noise');
const warped = document.querySelector('.warped');
let flowing = false;
let t = 0;

warped.addEventListener('pointerenter', () => (flowing = !reducedMotion()));
warped.addEventListener('pointerleave', () => {
  flowing = false;
  noise.setAttribute('baseFrequency', '0.012 0.03');
});

raf((dt) => {
  if (!flowing) return;
  t += dt;
  const bx = 0.008 + Math.sin(t * 0.8) * 0.006;
  const by = 0.02 + Math.cos(t * 0.6) * 0.014;
  noise.setAttribute('baseFrequency', `${bx.toFixed(4)} ${by.toFixed(4)}`);
});
