import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

// --- Sample content ---------------------------------------------------------
document.getElementById('cluster').innerHTML = [
  'flex-wrap', 'gap', 'no media queries', 'intrinsic', 'container-aware',
  'min-inline-size', 'flex-basis', 'auto-fit', 'subgrid', 'owl selector',
  'aspect-ratio', 'clamp()',
]
  .map((t) => `<span class="chip">${t}</span>`)
  .join('');

document.getElementById('reel').innerHTML = Array.from(
  { length: 8 },
  (_, i) => `
    <div class="box" style="aspect-ratio: 4/3; display: grid; place-items: center">
      <b style="font-size: 1.6rem">${String(i + 1).padStart(2, '0')}</b>
    </div>`
).join('');

// --- Live width readout on every resizable shell ----------------------------
// The label is the whole point of the exercise: without a number on screen it
// is hard to tell whether a layout changed at 480px or 620px.
const shells = document.querySelectorAll('.rs');

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const w = Math.round(entry.contentRect.width);
    entry.target.dataset.w = `${w}px`;
  }
});

for (const el of shells) observer.observe(el);

// Nudge affordance: many people never notice the native resize corner, so
// give each shell a one-time hint that fades after the first interaction.
let hinted = false;
for (const el of shells) {
  el.addEventListener(
    'pointerdown',
    () => {
      if (hinted) return;
      hinted = true;
      document.getElementById('hint')?.remove();
    },
    { once: true }
  );
}

const hint = document.createElement('div');
hint.id = 'hint';
hint.textContent = '↘ drag the corner of any dashed box';
hint.style.cssText = `
  position: fixed; left: 50%; bottom: 1.4rem; translate: -50% 0; z-index: 90;
  font-family: var(--font-mono); font-size: 0.75rem; color: var(--bg-0);
  background: var(--accent-2); padding: 0.4rem 0.9rem; border-radius: 100px;
  pointer-events: none;`;
document.body.append(hint);
setTimeout(() => hint.remove(), 6000);
