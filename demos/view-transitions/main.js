import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

const ITEMS = [
  { id: 'a', title: 'Aurora', hue: 265, score: 92, text: 'Layered radial gradients drifting on a long ease. Cheap, and it reads as depth.' },
  { id: 'b', title: 'Basalt', hue: 25, score: 71, text: 'High-contrast monochrome with one hot accent. Ages better than any trend palette.' },
  { id: 'c', title: 'Caustic', hue: 190, score: 88, text: 'Refraction patterns from a noise field, sampled twice at different scales.' },
  { id: 'd', title: 'Drift', hue: 320, score: 64, text: 'Slow parallax on three planes. Movement below the threshold of noticing.' },
  { id: 'e', title: 'Ember', hue: 45, score: 79, text: 'Additive blending over a dark ground — the only way glow looks like light.' },
  { id: 'f', title: 'Fathom', hue: 230, score: 95, text: 'Depth fog, low chroma, one bright focal point. Borrowed wholesale from film.' },
];

const swatch = (hue) =>
  `linear-gradient(150deg, oklch(62% 0.2 ${hue}), oklch(38% 0.16 ${hue + 45}))`;

/**
 * Wraps a DOM mutation in a view transition, with the two guards every
 * production use needs: feature detection, and respecting reduced motion.
 */
function transition(update) {
  if (!document.startViewTransition || reducedMotion()) return update();
  return document.startViewTransition(update);
}

// --- Gallery: card ⇄ detail morph -------------------------------------------
const gallery = document.getElementById('gallery');
let openId = null;

function renderGallery() {
  if (openId) {
    const it = ITEMS.find((i) => i.id === openId);
    gallery.innerHTML = `
      <article class="detail">
        <div class="detail__img" style="--swatch:${swatch(it.hue)}; view-transition-name: hero-img"></div>
        <div class="detail__body">
          <h3 style="view-transition-name: hero-title">${it.title}</h3>
          <p class="lead">${it.text}</p>
          <button type="button" data-close>← back to grid</button>
        </div>
      </article>`;
  } else {
    gallery.innerHTML = `<div class="cards">${ITEMS.map(
      (it) => `
      <button class="card" type="button" data-open="${it.id}">
        <div class="card__img" style="--swatch:${swatch(it.hue)}"></div>
        <div class="card__body"><h3>${it.title}</h3><p>score ${it.score}</p></div>
      </button>`
    ).join('')}</div>`;
  }
}

gallery.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  const close = e.target.closest('[data-close]');
  if (!open && !close) return;

  // The name is assigned to the *source* element only for the duration of the
  // capture. Naming every card up front would break uniqueness — two elements
  // may never share a name in the same snapshot.
  if (open) {
    const card = open;
    card.querySelector('.card__img').style.viewTransitionName = 'hero-img';
    card.querySelector('h3').style.viewTransitionName = 'hero-title';
    openId = card.dataset.open;
  } else {
    openId = null;
  }
  transition(renderGallery);
});

// --- List reordering ---------------------------------------------------------
const listEl = document.getElementById('list');
let rows = [...ITEMS];

function renderList() {
  listEl.innerHTML = rows
    .map(
      (r, i) => `
      <li style="view-transition-name: row-${r.id}">
        <span style="color: var(--fg-faint); font-family: var(--font-mono)">${String(i + 1).padStart(2, '0')}</span>
        <span>${r.title}</span>
        <span class="score">${r.score}</span>
      </li>`
    )
    .join('');
}
renderList();

const resort = (fn) => transition(() => { rows = fn([...rows]); renderList(); });
document.getElementById('sort-name').onclick = () =>
  resort((r) => r.sort((a, b) => a.title.localeCompare(b.title)));
document.getElementById('sort-score').onclick = () =>
  resort((r) => r.sort((a, b) => b.score - a.score));
document.getElementById('shuffle').onclick = () =>
  resort((r) => r.sort(() => Math.random() - 0.5));

// --- Slow motion toggle ------------------------------------------------------
const slow = document.getElementById('slow');
slow.onclick = () => {
  const on = slow.getAttribute('aria-pressed') === 'true';
  slow.setAttribute('aria-pressed', String(!on));
  document.body.classList.toggle('slow', !on);
};

renderGallery();

if (!document.startViewTransition) {
  const { warn } = await import('../../src/lib/chrome.js');
  warn('This browser has no View Transitions API — the demos still work, they just cut instead of morphing.');
}
