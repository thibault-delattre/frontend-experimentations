import { bySlug } from './registry.js';

/**
 * Injects the sticky top bar on a demo page.
 * The slug is inferred from the folder name so a demo never hardcodes it —
 * copy demos/<slug>/ to a new folder and it renames itself.
 */
export function mountDemoBar() {
  const slug = location.pathname.replace(/\/(index\.html)?$/, '').split('/').pop();
  const demo = bySlug(slug) ?? { title: slug, tags: [] };

  const bar = document.createElement('header');
  bar.className = 'demo-bar';
  bar.innerHTML = `
    <a class="demo-bar__back" href="../../index.html">← index</a>
    <span class="demo-bar__title">${demo.title}</span>
    <span class="demo-bar__tags">${demo.tags
      .map((t) => `<span class="tag">${t}</span>`)
      .join('')}</span>`;
  document.body.prepend(bar);

  // Demo pages don't each declare a favicon; the bar adds it.
  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.href = '../../favicon.svg';
    document.head.append(icon);
  }

  return demo;
}

/** Renders a dismissable warning when a demo needs a capability the browser lacks. */
export function warn(message) {
  const el = document.createElement('div');
  el.className = 'fallback';
  el.innerHTML = message;
  const note = document.querySelector('.note');
  if (note) note.after(el);
  else document.body.append(el);
  return el;
}

/** True when the user has asked for less motion. Honour it in every demo. */
export const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Resizes a canvas to its CSS box at the device pixel ratio (capped at 2 —
 * beyond that the fill-rate cost buys nothing visible) and calls back on change.
 */
export function autoResize(canvas, onResize, maxDpr = 2) {
  const apply = () => {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr);
    const { width, height } = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      onResize?.(w, h, dpr);
    }
  };
  new ResizeObserver(apply).observe(canvas);
  apply();
  return apply;
}

/**
 * requestAnimationFrame loop with a delta clamped to 100ms, so a backgrounded
 * tab does not resume with one enormous physics step.
 */
export function raf(fn) {
  let last = performance.now();
  let id = 0;
  let elapsed = 0;
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt;
    fn(dt, elapsed);
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

/** Normalised pointer position over an element, in 0..1 and -1..1 space. */
export function pointer(el = window) {
  const state = { x: 0.5, y: 0.5, nx: 0, ny: 0, down: false, inside: false };
  const target = el === window ? window : el;
  const rectOf = () =>
    el === window
      ? { left: 0, top: 0, width: innerWidth, height: innerHeight }
      : el.getBoundingClientRect();

  target.addEventListener('pointermove', (e) => {
    const r = rectOf();
    state.x = (e.clientX - r.left) / r.width;
    state.y = (e.clientY - r.top) / r.height;
    state.nx = state.x * 2 - 1;
    state.ny = state.y * -2 + 1;
    state.inside = true;
  });
  target.addEventListener('pointerdown', () => (state.down = true));
  addEventListener('pointerup', () => (state.down = false));
  target.addEventListener('pointerleave', () => (state.inside = false));
  return state;
}
