import { DEMOS, CATEGORIES } from './lib/registry.js';
import { PROMPTS } from './lib/prompts.js';

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
    <button class="card__prompt" type="button" data-prompt="${d.slug}"
            title="Copy the AI prompt that rebuilds this demo">✦ prompt</button>
  </a>`
).join('');

// --- Copy the AI prompt straight from a card --------------------------------
// The button sits inside an <a>, so the click must be stopped from navigating.
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-prompt]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const prompt = PROMPTS[btn.dataset.prompt];
  if (!prompt) return;
  try {
    await navigator.clipboard.writeText(prompt.trim());
    btn.textContent = 'copied ✓';
  } catch {
    btn.textContent = 'open the demo →';
  }
  setTimeout(() => (btn.textContent = '✦ prompt'), 1500);
});

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
