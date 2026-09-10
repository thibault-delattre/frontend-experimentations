import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

const root = document.documentElement;
const app = document.getElementById('app');

document.getElementById('bars').innerHTML = [40, 62, 48, 78, 55, 91, 70, 84]
  .map((h) => `<i style="height:${h}%"></i>`)
  .join('');

// ── Theme resolution ─────────────────────────────────────────────────────────
// The stored PREFERENCE and the resolved THEME are two different things:
// "system" is a preference that resolves to light or dark and must re-resolve
// when the OS setting changes while the page is open.
const media = matchMedia('(prefers-color-scheme: dark)');

function resolve(pref) {
  if (pref === 'contrast') return 'contrast';
  if (pref === 'system') return media.matches ? 'dark' : 'light';
  return pref;
}

function apply(pref) {
  root.dataset.pref = pref;
  root.dataset.theme = resolve(pref);
  localStorage.setItem('theme', pref);
  for (const b of document.querySelectorAll('[data-theme-btn]')) {
    b.setAttribute('aria-pressed', String(b.dataset.themeBtn === pref));
  }
  renderContrast();
}

// Re-resolve while the page is open — a user flipping their OS to dark at
// sunset should see the page follow without a reload.
media.addEventListener('change', () => {
  if (root.dataset.pref === 'system') apply('system');
});

// ── The animated swap ────────────────────────────────────────────────────────
document.getElementById('switcher').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme-btn]');
  if (!btn) return;
  const pref = btn.dataset.themeBtn;

  // The circle expands from wherever the user clicked, so the change feels
  // like it originates from their action rather than happening to the page.
  const r = btn.getBoundingClientRect();
  root.style.setProperty('--tx', `${((r.left + r.width / 2) / innerWidth) * 100}%`);
  root.style.setProperty('--ty', `${((r.top + r.height / 2) / innerHeight) * 100}%`);

  if (!document.startViewTransition || reducedMotion()) {
    apply(pref);
    return;
  }
  // Starting a transition while one is still running SKIPS the old one, and
  // its `finished` promise rejects with an AbortError. Nothing is actually
  // wrong — the newer transition wins — but an unhandled rejection surfaces as
  // a console error and trips error-reporting tools, so swallow that one case.
  const transition = document.startViewTransition(() => apply(pref));
  // BOTH promises reject when a transition is skipped, not just `finished` —
  // catching one still leaves the other unhandled.
  transition.ready.catch(() => {});
  transition.finished.catch(() => {});
});

// ── Brand hue ────────────────────────────────────────────────────────────────
// One primitive drives every tier. Because the neutrals are tinted from the
// same hue, surfaces and borders move with the accent instead of staying a
// dead grey beside a re-branded blue.
const hue = document.getElementById('hue');
const hueOut = document.getElementById('hue-out');

hue.addEventListener('input', () => {
  root.style.setProperty('--brand-h', hue.value);
  hueOut.textContent = `${hue.value}°`;
  renderContrast();
});
hueOut.textContent = `${hue.value}°`;

// ── Live contrast audit ──────────────────────────────────────────────────────
// Reading the COMPUTED value rather than the token means this measures what
// the browser actually painted, including the var() chain and any fallback.
const PAIRS = [
  ['body text on surface', '--ui-text', '--ui-surface', 4.5],
  ['muted text on surface', '--ui-text-muted', '--ui-surface', 4.5],
  ['body text on raised', '--ui-text', '--ui-raised', 4.5],
  ['accent button label', '--ui-on-accent', '--ui-accent', 4.5],
  ['danger button label', '--ui-on-accent', '--ui-danger', 4.5],
  ['border on surface', '--ui-border', '--ui-surface', 3],
];

// A throwaway element is the simplest way to force the browser to resolve an
// arbitrary colour string — including oklch() and nested var() — down to rgb.
const probe = document.createElement('span');
probe.style.display = 'none';
document.body.append(probe);

function toRgb(cssValue) {
  probe.style.color = '';
  probe.style.color = cssValue;
  const computed = getComputedStyle(probe).color;
  const m = computed.match(/[\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}

function luminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const tbody = document.getElementById('contrast');

function renderContrast() {
  const styles = getComputedStyle(app);
  tbody.innerHTML = PAIRS.map(([name, fgVar, bgVar, min]) => {
    const fg = toRgb(styles.getPropertyValue(fgVar).trim());
    const bg = toRgb(styles.getPropertyValue(bgVar).trim());
    const r = ratio(fg, bg);
    const ok = r >= min;
    return `<tr>
      <td>${name}</td>
      <td class="n">${r.toFixed(2)}:1</td>
      <td><span class="v ${ok ? 'ok' : 'no'}">${ok ? 'pass' : 'fail'} · needs ${min}</span></td>
    </tr>`;
  }).join('');
}

// The inline head script already set the theme; this just syncs the buttons
// and runs the first audit.
apply(root.dataset.pref || 'system');
