import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();

if (!CSS.supports('container-type: scroll-state')) {
  warn(
    'Scroll-state container queries are not supported here, so the sticky header in section 4 will not react. Everything else works.'
  );
}

/** A sparkline path built from n pseudo-random points, normalised to a 100×40 box. */
function sparkPath(seed, n = 22) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let y = 0.5;
  const pts = Array.from({ length: n }, (_, i) => {
    y = Math.min(0.95, Math.max(0.05, y + (rnd() - 0.45) * 0.28));
    return `${((i / (n - 1)) * 100).toFixed(1)},${((1 - y) * 40).toFixed(1)}`;
  });
  return `M${pts.join(' L')}`;
}

const CELLS = [
  { k: 'frame budget', v: '16.6ms', note: 'One frame at 60fps. Everything below has to fit inside it.', extra: 'Long tasks over 50ms are what INP actually measures. Break work into rAF chunks.' },
  { k: 'compositor-only props', v: '4', note: 'transform, opacity, filter, backdrop-filter.', extra: 'Anything else re-runs layout or paint on the main thread.' },
  { k: 'gpu particles', v: '250k', note: 'Simulated in a compute pass.', extra: 'The CPU never sees a position.' },
  { k: 'draw calls', v: '1', note: 'Instanced.', extra: 'One geometry, one material, per-instance attributes.' },
  { k: 'baseline', v: '2026', note: 'Container queries, :has(), scroll timelines, view transitions, anchor positioning.', extra: 'All five shipped in every major engine. None of them need a polyfill any more.' },
  { k: 'shader compile', v: '<8ms', note: 'Cached after first use.', extra: 'Warm the pipeline during the loading screen, not on first interaction.' },
  { k: 'bundle', v: '0kb', note: 'The CSS demos on this site ship no runtime at all.', extra: 'The cheapest animation library is the one already in the browser.' },
];

const cellHTML = (c, i) => `
  <article class="cell">
    <span class="cell__k">${c.k}</span>
    <span class="cell__v">${c.v}</span>
    <p class="cell__note">${c.note}</p>
    <span class="cell__extra">${c.extra}</span>
    <svg class="cell__chart spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="${sparkPath(i * 977 + 13)}" pathLength="1" />
    </svg>
  </article>`;

document.getElementById('bento').innerHTML = CELLS.map(cellHTML).join('');
document.getElementById('resize').innerHTML = cellHTML(CELLS[4], 4);

document.getElementById('rows').innerHTML = Array.from(
  { length: 20 },
  (_, i) => `<li>Row ${String(i + 1).padStart(2, '0')} — scroll to pin the header</li>`
).join('');
