import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();

// @property is what makes the rotating conic border possible at all. Without
// it the gradient snaps rather than interpolating, so say so rather than
// letting the demo look broken.
if (!CSS.supports('background', 'paint(x)') && !('registerProperty' in CSS)) {
  warn(
    'This browser does not support @property, so the rotating conic border in section 3 will jump instead of animating. Everything else works.'
  );
}

const CARDS = [
  ['Delegated', 'One pointermove listener on the grid, not one per card.'],
  ['Two layers', 'The surface wash and the border ring share --mx/--my.'],
  ['Masked ring', 'Same gradient, clipped to the edge with mask-composite.'],
  ['Cheap', 'Custom properties only — no per-frame style recalculation.'],
  ['Composited', 'Only opacity transitions; the gradients never re-layout.'],
  ['Scales', 'Add a hundred cards and the cost is unchanged.'],
];

const grid = document.getElementById('spotGrid');
grid.innerHTML = CARDS.map(
  ([title, body]) => `
    <div class="spot">
      <span class="spot__glow"></span>
      <span class="spot__ring"></span>
      <b>${title}</b>
      <span>${body}</span>
    </div>`
).join('');

// One listener for the whole grid. Writing two custom properties is far
// cheaper than touching any layout-affecting style, and the gradients pick the
// values up without any JS involvement in the paint.
grid.addEventListener('pointermove', (e) => {
  const card = e.target.closest('.spot');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
});
