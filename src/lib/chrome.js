import { bySlug } from './registry.js';
import { PROMPTS } from './prompts.js';

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
      .join('')}</span>
    <button class="demo-bar__prompt" type="button" data-prompt>✦ prompt</button>`;
  document.body.prepend(bar);

  mountPromptDialog(slug, demo);

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

/**
 * Builds the "✦ prompt" dialog: the brief you would hand an AI to rebuild this
 * page from nothing. Uses a native <dialog>, so Escape, focus trapping and the
 * ::backdrop all come for free.
 */
function mountPromptDialog(slug, demo) {
  const prompt = PROMPTS[slug];
  const btn = document.querySelector('[data-prompt]');
  if (!prompt) {
    btn?.remove();
    return;
  }

  const dlg = document.createElement('dialog');
  dlg.className = 'prompt-dlg';
  dlg.innerHTML = `
    <div class="prompt-dlg__head">
      <div>
        <h2>Rebuild “${demo.title}” with AI</h2>
        <p>Paste this into Claude, ChatGPT, Cursor or v0. It is written to be
           self-contained — no reference to this repo is needed.</p>
      </div>
      <button type="button" data-close aria-label="Close">✕</button>
    </div>
    <textarea class="prompt-dlg__body" readonly spellcheck="false"></textarea>
    <div class="prompt-dlg__foot">
      <span class="prompt-dlg__hint" data-count></span>
      <button type="button" data-copy class="prompt-dlg__copy">Copy prompt</button>
    </div>`;

  // textContent, never innerHTML: the prompt contains angle brackets and braces
  // that would otherwise be parsed as markup.
  const area = dlg.querySelector('textarea');
  area.value = prompt.trim();
  dlg.querySelector('[data-count]').textContent =
    `${prompt.trim().split(/\s+/).length} words · ${slug}`;

  document.body.append(dlg);

  btn.addEventListener('click', () => dlg.showModal());
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());

  // Clicking the backdrop closes. The dialog element itself is the event target
  // when the backdrop is hit, so compare against the content box.
  dlg.addEventListener('click', (e) => {
    const r = dlg.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dlg.close();
  });

  const copyBtn = dlg.querySelector('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(area.value);
    } catch {
      // Clipboard API needs a secure context; select the text so ⌘C still works.
      area.select();
    }
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => (copyBtn.textContent = 'Copy prompt'), 1400);
  });
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
