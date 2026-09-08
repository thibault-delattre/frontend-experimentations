import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();

if (!CSS.supports('anchor-name: --a')) {
  warn(
    'This browser does not support CSS anchor positioning yet. The popovers still open — they just stack in the centre instead of tethering. Chrome/Edge/Firefox are stable; Safari is partial.'
  );
}

// Hover-to-open on top of the click behaviour the Popover API already gives us.
const trigger = document.querySelector('[popovertarget="tip1"]');
const tip = document.getElementById('tip1');
let hoverTimer;
trigger.addEventListener('pointerenter', () => {
  clearTimeout(hoverTimer);
  tip.showPopover();
});
trigger.addEventListener('pointerleave', () => {
  hoverTimer = setTimeout(() => tip.hidePopover(), 120);
});

// --- Draggable anchor --------------------------------------------------------
// Note what this handler does NOT do: it never touches the callout. Moving the
// anchor is enough, because the callout's position is declarative.
const dot = document.getElementById('dot');
const area = dot.parentElement;

dot.addEventListener('pointerdown', (e) => {
  dot.setPointerCapture(e.pointerId);
  dot.style.cursor = 'grabbing';
});
dot.addEventListener('pointerup', (e) => {
  dot.releasePointerCapture(e.pointerId);
  dot.style.cursor = 'grab';
});
dot.addEventListener('pointermove', (e) => {
  if (!dot.hasPointerCapture(e.pointerId)) return;
  const r = area.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX - r.left, 8), r.width - 8);
  const y = Math.min(Math.max(e.clientY - r.top, 8), r.height - 8);
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
});

// Keyboard equivalent — a drag handle that only responds to a pointer is not done.
dot.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 24 : 8;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const move = moves[e.key];
  if (!move) return;
  e.preventDefault();
  const r = area.getBoundingClientRect();
  const cur = dot.getBoundingClientRect();
  dot.style.left = `${Math.min(Math.max(cur.left - r.left + move[0], 8), r.width - 8)}px`;
  dot.style.top = `${Math.min(Math.max(cur.top - r.top + move[1], 8), r.height - 8)}px`;
});
