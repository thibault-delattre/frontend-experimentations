import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const glass = document.getElementById('glass');
const stage = glass.parentElement;

// --- Drag ---------------------------------------------------------------------
// Position is written as a translate so the element never leaves the compositor.
let x = 0;
let y = 0;
let dragging = false;
let ox = 0;
let oy = 0;

const apply = () => {
  glass.style.translate = `calc(-50% + ${x}px) calc(-50% + ${y}px)`;
};

glass.addEventListener('pointerdown', (e) => {
  dragging = true;
  ox = e.clientX - x;
  oy = e.clientY - y;
  glass.setPointerCapture(e.pointerId);
});

glass.addEventListener('pointermove', (e) => {
  // Specular highlight follows the cursor whether dragging or not.
  const r = glass.getBoundingClientRect();
  glass.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  glass.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);

  if (!dragging) return;
  const s = stage.getBoundingClientRect();
  const half = { w: r.width / 2, h: r.height / 2 };
  x = Math.min(Math.max(e.clientX - ox, -s.width / 2 + half.w), s.width / 2 - half.w);
  y = Math.min(Math.max(e.clientY - oy, -s.height / 2 + half.h), s.height / 2 - half.h);
  apply();
});

const endDrag = () => (dragging = false);
glass.addEventListener('pointerup', endDrag);
glass.addEventListener('pointercancel', endDrag);

// --- Variant switcher ---------------------------------------------------------
const variants = document.getElementById('variants');
const classes = ['is-lens', 'is-chromatic', 'is-frosted'];
variants.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  for (const b of variants.children) b.setAttribute('aria-pressed', String(b === btn));
  glass.classList.remove(...classes);
  if (btn.dataset.v) glass.classList.add(btn.dataset.v);
});
