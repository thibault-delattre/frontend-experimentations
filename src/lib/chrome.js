import { bySlug } from './registry.js';
import { FX } from './fx.js';

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
    <span class="demo-bar__hint">✦ hover any effect for its prompt</span>`;
  document.body.prepend(bar);

  // Deferred by one frame ON PURPOSE. mountDemoBar() is called at the TOP of
  // each demo's module, before that module renders its own content — and
  // several demos build their markup with `el.innerHTML = …`, which would wipe
  // a badge that had already been appended. Waiting a frame lets the demo's
  // synchronous setup finish first.
  requestAnimationFrame(() => mountFxPrompts(slug));

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

/* ═══════════════════════════════════════════════════════════════════════════
   PER-EFFECT PROMPTS

   The unit is a single effect, not a page: one magnetic button, one gooey
   filter, one shimmer. Any element carrying data-fx="<id>" gets its own copy
   button, and the prompt is looked up as `${slug}/${id}` in fx.js.

   That keying means an effect's prompt lives next to nothing — the HTML says
   only which effect it is, and the dictionary owns the text.
   ═══════════════════════════════════════════════════════════════════════════ */

/** One dialog for the whole page, populated on open. */
let dialog = null;

function getDialog() {
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.className = 'prompt-dlg';
  dialog.innerHTML = `
    <div class="prompt-dlg__head">
      <div>
        <h2 data-title></h2>
        <p>Paste into Claude, ChatGPT, Cursor or v0. Self-contained — it
           rebuilds <em>this one effect</em>, with no reference to this repo.</p>
      </div>
      <button type="button" data-close aria-label="Close">✕</button>
    </div>
    <textarea class="prompt-dlg__body" readonly spellcheck="false"></textarea>
    <div class="prompt-dlg__foot">
      <span class="prompt-dlg__hint" data-count></span>
      <button type="button" data-copy class="prompt-dlg__copy">Copy prompt</button>
    </div>`;
  document.body.append(dialog);

  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

  // Clicking the backdrop closes. The dialog element is itself the event
  // target when the backdrop is hit, so compare against its content box.
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });

  const copyBtn = dialog.querySelector('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    const area = dialog.querySelector('textarea');
    try {
      await navigator.clipboard.writeText(area.value);
    } catch {
      // Clipboard needs a secure context; select the text so ⌘C still works.
      area.select();
    }
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => (copyBtn.textContent = 'Copy prompt'), 1400);
  });

  return dialog;
}

function openPrompt(key, entry) {
  const dlg = getDialog();
  const text = entry.prompt.trim();
  dlg.querySelector('[data-title]').textContent = entry.title;
  // textContent/value, never innerHTML: prompts contain angle brackets and
  // braces that would otherwise be parsed as markup.
  dlg.querySelector('textarea').value = text;
  dlg.querySelector('[data-count]').textContent = `${text.split(/\s+/).length} words · ${key}`;
  dlg.showModal();
}

/**
 * Attaches a copy button to every [data-fx] element on the page.
 *
 * The button is absolutely positioned inside the host, so the host needs a
 * containing block — if it is statically positioned we promote it, which is
 * the one style this function is allowed to touch.
 */
function mountFxPrompts(slug) {
  const hosts = document.querySelectorAll('[data-fx]');
  const missing = [];

  for (const host of hosts) {
    const key = `${slug}/${host.dataset.fx}`;
    const entry = FX[key];
    if (!entry) {
      missing.push(key);
      continue;
    }

    host.classList.add('fx-host');
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fx-btn';
    btn.textContent = '✦ prompt';
    btn.title = `Copy the prompt for: ${entry.title}`;
    btn.setAttribute('aria-label', `Copy the AI prompt for ${entry.title}`);
    btn.addEventListener('click', (e) => {
      // Hosts are often themselves interactive (buttons, links, cards).
      e.preventDefault();
      e.stopPropagation();
      openPrompt(key, entry);
    });
    host.append(btn);
  }

  // A data-fx with no dictionary entry is an authoring mistake, and silently
  // rendering nothing would hide it.
  if (missing.length) {
    console.warn(`[fx] no prompt found for: ${missing.join(', ')}`);
  }
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
