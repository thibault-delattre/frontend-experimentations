import { FX } from './lib/fx.js';
import { DEMOS, CATEGORIES } from './lib/registry.js';

const grid = document.getElementById('prompt-grid');
const filters = document.getElementById('filters');
const search = document.getElementById('search');
const count = document.getElementById('result-count');
const empty = document.getElementById('empty');
const toast = document.getElementById('copy-toast');
const sentinel = document.getElementById('load-sentinel');

// Render two rows at a time at every responsive breakpoint.
const BATCH_SIZE = innerWidth <= 600 ? 2 : innerWidth <= 900 ? 4 : 6;
const demoBySlug = new Map(DEMOS.map((demo) => [demo.slug, demo]));
const INLINE_CATEGORIES = new Set(['craft', 'overlay', 'css', 'motion']);
const entries = Object.entries(FX).map(([key, entry], index) => {
  const slug = key.slice(0, key.indexOf('/'));
  const effectId = key.slice(key.indexOf('/') + 1);
  const demo = demoBySlug.get(slug);
  return {
    ...entry,
    key,
    slug,
    effectId,
    index,
    demo,
    category: demo?.category ?? 'craft',
    inline: INLINE_CATEGORIES.has(demo?.category),
    haystack: `${entry.title} ${entry.prompt} ${demo?.title ?? ''} ${demo?.tags?.join(' ') ?? ''}`.toLowerCase(),
  };
});

let activeCategory = 'all';
let matches = entries;
let rendered = 0;
let toastTimer;

function cardMarkup(item) {
  const category = CATEGORIES[item.category];
  const number = String(item.index + 1).padStart(3, '0');
  const words = item.prompt.trim().split(/\s+/).length;
  return `
    <article class="prompt-card" data-key="${item.key}" data-category="${item.category}"
      style="--hue:${category.hue}; --delay:${(item.index % BATCH_SIZE) * 12}ms">
      <div class="specimen specimen--${item.index % 8}" ${item.inline ? 'data-activate-preview tabindex="0" role="group" aria-label="Click to interact with this preview"' : ''}>
        ${item.inline ? '' : `<div class="specimen__poster" aria-hidden="true">
          <span class="specimen__index">FX—${number}</span>
          <span class="specimen__word">${item.title.split(/[—–-]/)[0].trim()}</span>
          <span class="specimen__orb"></span>
          <span class="specimen__rule"></span>
        </div>`}
        ${item.inline ? `<iframe
          data-preview-frame
          src="./demos/${item.slug}/index.html#fx-${item.effectId}"
          title="Interactive preview of ${item.title}"
          sandbox="allow-scripts allow-same-origin allow-forms"
        ></iframe>` : ''}
      </div>
      <div class="prompt-card__foot">
        <div class="prompt-card__name">
          <h2>${item.title}</h2>
          <span>${category.label} · ${words} words</span>
        </div>
        <a href="./demos/${item.slug}/index.html#fx-${item.effectId}" data-preview aria-label="Open full ${item.demo?.title ?? 'demo'} result">↗</a>
        <button class="copy-label" type="button" data-copy aria-label="Copy prompt for ${item.title}">
          <span>Copy</span><b aria-hidden="true">⌘C</b>
        </button>
      </div>
    </article>`;
}

function mountPreviews(scope) {
  for (const frame of scope.querySelectorAll('[data-preview-frame]')) {
    frame.parentElement.addEventListener('pointerleave', () => {
      frame.parentElement.classList.remove('is-active');
    });
  }
}

function renderNextBatch() {
  if (rendered >= matches.length) {
    sentinel.hidden = true;
    return;
  }
  const batch = matches.slice(rendered, rendered + BATCH_SIZE);
  const template = document.createElement('template');
  template.innerHTML = batch.map(cardMarkup).join('');
  mountPreviews(template.content);
  grid.append(template.content);
  rendered += batch.length;
  sentinel.hidden = rendered >= matches.length;
}

const loadObserver = new IntersectionObserver((observations) => {
  if (observations.some((observation) => observation.isIntersecting)) {
    renderNextBatch();
  }
}, { rootMargin: '120px 0px' });

function watchForMore() {
  loadObserver.unobserve(sentinel);
  if (!sentinel.hidden) loadObserver.observe(sentinel);
}

const availableCategories = [...new Set(entries.map((item) => item.category))];
filters.innerHTML = [
  ['all', `All ${entries.length}`],
  ...availableCategories.map((key) => [key, CATEGORIES[key].label]),
].map(([key, label]) => `
  <button type="button" data-category="${key}" aria-pressed="${key === 'all'}">${label}</button>
`).join('');

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  matches = entries.filter((item) =>
    (activeCategory === 'all' || item.category === activeCategory) &&
    (!query || item.haystack.includes(query))
  );
  grid.replaceChildren();
  rendered = 0;
  count.textContent = `${matches.length} prompt asset${matches.length === 1 ? '' : 's'}`;
  empty.hidden = matches.length !== 0;
  sentinel.hidden = matches.length === 0;
  renderNextBatch();
  requestAnimationFrame(watchForMore);
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  activeCategory = button.dataset.category;
  for (const item of filters.querySelectorAll('button')) {
    item.setAttribute('aria-pressed', String(item === button));
  }
  applyFilters();
});

search.addEventListener('input', applyFilters);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    search.blur();
    applyFilters();
  }
});

async function copyPrompt(card) {
  const entry = FX[card.dataset.key];
  if (!entry) return;
  try {
    await navigator.clipboard.writeText(entry.prompt.trim());
  } catch {
    const area = document.createElement('textarea');
    area.value = entry.prompt.trim();
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  document.querySelector('.prompt-card.is-copied')?.classList.remove('is-copied');
  card.classList.add('is-copied');
  card.querySelector('.copy-label span').textContent = 'Copied ✓';
  toast.textContent = `Copied “${entry.title}”`;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    card.classList.remove('is-copied');
    card.querySelector('.copy-label span').textContent = 'Copy';
    toast.classList.remove('is-visible');
  }, 1800);
}

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-copy]');
  if (button) copyPrompt(button.closest('.prompt-card'));
});

function activatePreview(specimen) {
  document.querySelector('.specimen.is-active')?.classList.remove('is-active');
  specimen.classList.add('is-active');
  specimen.querySelector('iframe')?.focus();
}

grid.addEventListener('click', (event) => {
  const specimen = event.target.closest('[data-activate-preview]');
  if (specimen) activatePreview(specimen);
});

grid.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-activate-preview]')) {
    event.preventDefault();
    activatePreview(event.target);
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('.specimen.is-active')) {
    document.querySelector('.specimen.is-active')?.classList.remove('is-active');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelector('.specimen.is-active')?.classList.remove('is-active');
  }
});

renderNextBatch();
watchForMore();
