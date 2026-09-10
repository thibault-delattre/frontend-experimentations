import { DEMOS, CATEGORIES, RELEASED_AT } from './lib/registry.js';

const grid = document.getElementById('grid');
const filters = document.getElementById('filters');
const KEYS = {
  favorites: 'frontend-experimentations:favorites:v1',
  viewed: 'frontend-experimentations:viewed:v1',
  categories: 'frontend-experimentations:categories:v1',
};

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Storage may be denied; only persistence is lost. */ }
}

const favorites = new Set(read(KEYS.favorites, []));
const viewed = read(KEYS.viewed, {});
const categoryVisits = read(KEYS.categories, {});
const registryOrder = new Map(DEMOS.map((demo, index) => [demo.slug, index]));
let activeCategory = 'all';

function relativeTime(timestamp) {
  const time = Number(timestamp);
  if (!Number.isFinite(time) || time <= 0) return 'Not viewed yet';
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function cardMarkup(demo) {
  const favorite = favorites.has(demo.slug);
  return `
    <article class="card" data-slug="${demo.slug}" data-cat="${demo.category}"
      data-released="${RELEASED_AT[demo.slug]}"
      style="--hue:${CATEGORIES[demo.category].hue};view-transition-name:card-${demo.slug}">
      <button class="card__favorite" type="button" data-favorite
        aria-pressed="${favorite}"
        aria-label="${favorite ? 'Remove' : 'Add'} ${demo.title} ${favorite ? 'from' : 'to'} favorites"
        title="${favorite ? 'Remove from favorites' : 'Add to favorites'}">
        <span aria-hidden="true">${favorite ? '★' : '☆'}</span>
      </button>
      <a class="card__link" href="./demos/${demo.slug}/index.html">
        <span class="card__cat">${CATEGORIES[demo.category].label}</span>
        <h2 class="card__title">${demo.title}</h2>
        <p class="card__blurb">${demo.blurb}</p>
        <span class="card__meta" data-viewed>${relativeTime(viewed[demo.slug])}</span>
        <span class="card__tags">${demo.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</span>
      </a>
    </article>`;
}

grid.innerHTML = DEMOS.map(cardMarkup).join('');
const cats = [['all', { label: `All ${DEMOS.length}` }], ...Object.entries(CATEGORIES)];

function paintFilters() {
  if (!filters.children.length) {
    filters.innerHTML = cats.map(([key, category]) => `
      <button type="button" data-cat="${key}">
        <span>${category.label}</span>
        ${key === 'all' ? '' : '<small></small>'}
      </button>`).join('');
  }
  for (const button of filters.children) {
    const key = button.dataset.cat;
    button.setAttribute('aria-pressed', String(key === activeCategory));
    const lastViewed = button.querySelector('small');
    if (lastViewed) lastViewed.textContent = relativeTime(categoryVisits[key]);
  }
}

function sortedCards() {
  return [...grid.children].sort((a, b) => {
    const favoriteDelta = Number(favorites.has(b.dataset.slug)) - Number(favorites.has(a.dataset.slug));
    if (favoriteDelta) return favoriteDelta;
    const dateDelta = Date.parse(b.dataset.released) - Date.parse(a.dataset.released);
    return dateDelta || registryOrder.get(a.dataset.slug) - registryOrder.get(b.dataset.slug);
  });
}

function applyView({ animate = true } = {}) {
  const update = () => {
    for (const card of sortedCards()) {
      card.hidden = activeCategory !== 'all' && card.dataset.cat !== activeCategory;
      grid.append(card);
    }
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && document.startViewTransition && !reduce) document.startViewTransition(update);
  else update();
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  activeCategory = button.dataset.cat;
  if (activeCategory !== 'all') {
    categoryVisits[activeCategory] = Date.now();
    write(KEYS.categories, categoryVisits);
  }
  paintFilters();
  applyView();
});

grid.addEventListener('click', (event) => {
  const card = event.target.closest('.card');
  if (!card) return;
  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) {
    const { slug } = card.dataset;
    favorites.has(slug) ? favorites.delete(slug) : favorites.add(slug);
    write(KEYS.favorites, [...favorites]);
    const favorite = favorites.has(slug);
    const title = card.querySelector('.card__title').textContent;
    favoriteButton.setAttribute('aria-pressed', String(favorite));
    favoriteButton.setAttribute('aria-label', `${favorite ? 'Remove' : 'Add'} ${title} ${favorite ? 'from' : 'to'} favorites`);
    favoriteButton.title = favorite ? 'Remove from favorites' : 'Add to favorites';
    favoriteButton.firstElementChild.textContent = favorite ? '★' : '☆';
    applyView();
  } else if (event.target.closest('.card__link')) {
    viewed[card.dataset.slug] = Date.now();
    write(KEYS.viewed, viewed);
  }
});

grid.addEventListener('pointermove', (event) => {
  const card = event.target.closest('.card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  card.style.setProperty('--my', `${event.clientY - rect.top}px`);
});

function refreshRelativeTimes() {
  for (const card of grid.children) {
    card.querySelector('[data-viewed]').textContent = relativeTime(viewed[card.dataset.slug]);
  }
  paintFilters();
}

paintFilters();
applyView({ animate: false });
setInterval(refreshRelativeTimes, 60_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshRelativeTimes();
});
addEventListener('pageshow', refreshRelativeTimes);
