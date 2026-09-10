import { DEMOS, CATEGORIES } from './lib/registry.js';

const grid = document.getElementById('grid');
const filters = document.getElementById('filters');

grid.innerHTML = DEMOS.map(
  (d) => `
  <a class="card" href="./demos/${d.slug}/index.html" data-cat="${d.category}"
     style="--hue:${CATEGORIES[d.category].hue}">
    <span class="card__cat">${CATEGORIES[d.category].label}</span>
    <h2 class="card__title">${d.title}</h2>
    <p class="card__blurb">${d.blurb}</p>
    <span class="card__tags">${d.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</span>
  </a>`
).join('');

// --- Filter chips -----------------------------------------------------------
const cats = [['all', { label: `All ${DEMOS.length}` }], ...Object.entries(CATEGORIES)];
filters.innerHTML = cats
  .map(
    ([key, c]) =>
      `<button type="button" data-cat="${key}" aria-pressed="${key === 'all'}">${c.label}</button>`
  )
  .join('');

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const cat = btn.dataset.cat;
  for (const b of filters.children) b.setAttribute('aria-pressed', String(b === btn));
  for (const card of grid.children) {
    card.hidden = cat !== 'all' && card.dataset.cat !== cat;
  }
});

// --- Pointer-tracked card glow ---------------------------------------------
// One listener on the grid rather than one per card; the shader-ish highlight
// is just two custom properties read by .card::before.
grid.addEventListener('pointermove', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
});
