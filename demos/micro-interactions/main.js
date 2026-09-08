import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

// ── Ripple ───────────────────────────────────────────────────────────────────
// One delegated listener rather than one per button, and the node is removed on
// animationend — otherwise a long-lived page accumulates thousands of them.
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('[data-ripple]');
  if (!btn || btn.disabled || reducedMotion()) return;

  const r = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  // Diameter must cover the furthest corner from the click point, or the
  // ripple visibly stops short on wide buttons.
  const d = Math.max(
    Math.hypot(e.clientX - r.left, e.clientY - r.top),
    Math.hypot(r.right - e.clientX, e.clientY - r.top),
    Math.hypot(e.clientX - r.left, r.bottom - e.clientY),
    Math.hypot(r.right - e.clientX, r.bottom - e.clientY)
  );
  Object.assign(ripple.style, {
    width: `${d}px`,
    height: `${d}px`,
    left: `${e.clientX - r.left - d / 2}px`,
    top: `${e.clientY - r.top - d / 2}px`,
  });
  ripple.addEventListener('animationend', () => ripple.remove());
  btn.append(ripple);
});

// ── Magnetic buttons ─────────────────────────────────────────────────────────
// Gated on a fine pointer: on touch there is no hover to preview the pull, so
// the element would just feel like it drifts when tapped.
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion()) {
  const RADIUS = 90;
  const PULL = 0.32; // fraction of the distance — past ~0.5 it feels rubbery

  for (const el of document.querySelectorAll('[data-magnet]')) {
    const inner = el.querySelector('.magnet__inner');

    // Listen on the window, not the element: the whole point is reacting
    // BEFORE the pointer arrives, and an element only sees its own events.
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > RADIUS + Math.max(r.width, r.height) / 2) {
        el.style.translate = '';
        inner.style.translate = '';
        return;
      }
      // The button moves a little, the label a little more — the parallax
      // between them is what makes it read as magnetic rather than as drift.
      el.style.translate = `${dx * PULL * 0.5}px ${dy * PULL * 0.5}px`;
      inner.style.translate = `${dx * PULL * 0.4}px ${dy * PULL * 0.4}px`;
    };

    addEventListener('pointermove', onMove, { passive: true });
  }
}

// ── Text field ───────────────────────────────────────────────────────────────
const email = document.getElementById('email');
const count = document.getElementById('email-count');
const hint = document.getElementById('email-hint');
const MAX = 40;

email.addEventListener('input', () => {
  const n = email.value.length;
  count.textContent = `${n}/${MAX}`;
  // The counter only appears near the limit. Showing it from the first
  // keystroke is noise, and implies a limit the user did not ask about.
  count.classList.toggle('near', n >= MAX * 0.75);
  count.classList.toggle('over', n >= MAX);
  hint.textContent =
    email.validity.valid || email.value === ''
      ? 'We only use this to reply.'
      : 'That does not look like an email address yet.';
});

// ── Submit morph ─────────────────────────────────────────────────────────────
const submit = document.getElementById('submit');

submit.addEventListener('click', async () => {
  if (submit.dataset.state !== 'idle') return;
  submit.dataset.state = 'loading';
  submit.setAttribute('aria-busy', 'true');

  // A real request might return in 40ms, which would flash the spinner and
  // read as a glitch. Race the work against a floor so the state is always
  // legible.
  const work = new Promise((r) => setTimeout(r, 300 + Math.random() * 700));
  await Promise.all([work, new Promise((r) => setTimeout(r, 500))]);

  submit.dataset.state = 'done';
  submit.removeAttribute('aria-busy');
  setTimeout(() => (submit.dataset.state = 'idle'), 1400);
});

// ── Segmented control ────────────────────────────────────────────────────────
const seg = document.getElementById('seg');
const pill = seg.querySelector('.seg__pill');
const tabs = [...seg.querySelectorAll('button')];

function movePill(btn, animate = true) {
  const prev = pill.style.transition;
  if (!animate) pill.style.transition = 'none';
  pill.style.width = `${btn.offsetWidth}px`;
  pill.style.translate = `${btn.offsetLeft - 4}px 0`;
  if (!animate) {
    void pill.offsetWidth; // flush, so the next change animates again
    pill.style.transition = prev;
  }
}

function select(btn) {
  for (const t of tabs) t.setAttribute('aria-selected', String(t === btn));
  movePill(btn);
}

seg.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn) select(btn);
});

// Arrow-key navigation is expected of anything using role="tablist".
seg.addEventListener('keydown', (e) => {
  const i = tabs.indexOf(document.activeElement);
  if (i === -1) return;
  const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
  if (next === -1) return;
  e.preventDefault();
  const target = tabs[(next + tabs.length) % tabs.length];
  target.focus();
  select(target);
});

// Position without animating on first paint, and re-measure when the font
// swap changes the button widths.
movePill(tabs[0], false);
document.fonts?.ready.then(() => movePill(seg.querySelector('[aria-selected="true"]'), false));
new ResizeObserver(() => movePill(seg.querySelector('[aria-selected="true"]'), false)).observe(seg);
