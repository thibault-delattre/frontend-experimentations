import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const root = document.documentElement;

const STEPS = [-2, -1, 0, 1, 2, 3, 4, 5, 6];
const NAMES = {
  '-2': 'caption',
  '-1': 'small',
  0: 'body',
  1: 'lead',
  2: 'h3',
  3: 'h2',
  4: 'h1',
  5: 'display',
  6: 'hero',
};

const state = { base: 17, ratio: 1.2, lh: 1.65, minVw: 320, maxVw: 1240 };

/**
 * Solves the fluid-size line through two (viewport, size) points and returns
 * a clamp() whose middle term is that line.
 *
 * Everything is emitted in rem so a user's browser font-size setting still
 * scales the page. The `rem` term in the preferred value is what keeps it
 * zoomable — a pure vw value ignores user zoom and is an accessibility
 * failure, which is why the intercept is never dropped.
 */
function fluid(minPx, maxPx) {
  const { minVw, maxVw } = state;
  const slope = (maxPx - minPx) / (maxVw - minVw);
  const interceptRem = (minPx - slope * minVw) / 16;
  return {
    css: `clamp(${(minPx / 16).toFixed(3)}rem, ${interceptRem.toFixed(3)}rem + ${(slope * 100).toFixed(3)}vw, ${(maxPx / 16).toFixed(3)}rem)`,
    minPx,
    maxPx,
  };
}

function build() {
  const { base, ratio } = state;
  // The fluid range narrows as the slider drops: at 0 the type is static, at
  // 100 the smallest and largest viewports differ by a full ratio step.
  const spread = Number(document.getElementById('vw').value) / 100;

  const rows = STEPS.map((step) => {
    const target = base * ratio ** step;
    // Larger steps should move MORE between viewports — a hero headline needs
    // to shrink hard on mobile, body copy barely at all.
    const travel = spread * (0.06 + Math.max(0, step) * 0.085);
    const min = target / (1 + travel);
    const max = target * (1 + travel * 0.35);
    return { step, ...fluid(min, max) };
  });

  for (const r of rows) root.style.setProperty(`--step-${r.step}`, r.css);
  root.style.setProperty('--baseline', `${(state.lh * state.base).toFixed(2)}px`);
  return rows;
}

// --- Ladder -----------------------------------------------------------------
const ladder = document.getElementById('ladder');

function renderLadder(rows) {
  ladder.innerHTML = rows
    .slice()
    .reverse()
    .map(
      (r) => `
      <div class="rung">
        <span class="rung__meta">
          <b>${r.step > 0 ? `+${r.step}` : r.step}</b>
          ${NAMES[r.step]}<br />
          ${r.minPx.toFixed(1)}→${r.maxPx.toFixed(1)}px
        </span>
        <span class="rung__sample" style="font-size: var(--step-${r.step})"
              title="${r.css}">The quick brown fox</span>
      </div>`
    )
    .join('');
}

// --- Measure ----------------------------------------------------------------
const SAMPLE =
  'The measure is the length of a line of text, counted in characters. It is the single most under-used typographic control on the web, and the one that most reliably separates comfortable reading from work.';

document.getElementById('measures').innerHTML = [30, 45, 65, 90]
  .map((ch) => {
    const ok = ch >= 45 && ch <= 75;
    return `
      <div class="measure" data-ok="${ok}">
        <span class="measure__tag">${ch}ch — ${ok ? 'comfortable' : ch < 45 ? 'too narrow' : 'too wide'}</span>
        <p style="max-width: ${ch}ch">${SAMPLE}</p>
      </div>`;
  })
  .join('');

// --- Numerals ---------------------------------------------------------------
const FIGURES = [
  ['North America', 1148923, 4.2],
  ['Europe', 987114, 11.9],
  ['Asia Pacific', 2310087, 18.4],
  ['Latin America', 419776, 7.1],
];

document.getElementById('numerals').innerHTML = FIGURES.map(
  ([region, n, pct]) => `
    <tr>
      <td>${region}</td>
      <td class="num" style="font-variant-numeric: proportional-nums">${n.toLocaleString('en-US')} · ${pct}%</td>
      <td class="num lining">${n.toLocaleString('en-US')} · ${pct}%</td>
    </tr>`
).join('');

// --- Controls ---------------------------------------------------------------
function refresh() {
  renderLadder(build());
}

function bind(id, apply, format) {
  const el = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(el.value));
    if (out) out.textContent = format(el.value);
    refresh();
  };
  el.addEventListener('input', update);
  el.addEventListener('change', update);
  update();
}

bind('base', (v) => (state.base = v), (v) => `${v}px`);
bind('ratio', (v) => (state.ratio = v), (v) => Number(v).toFixed(3));
bind('lh', (v) => (state.lh = v / 100), (v) => (v / 100).toFixed(2));
bind('vw', () => {}, (v) => `${v}%`);

const gridBtn = document.getElementById('grid-toggle');
gridBtn.onclick = () => {
  const on = gridBtn.getAttribute('aria-pressed') === 'true';
  gridBtn.setAttribute('aria-pressed', String(!on));
  document.getElementById('rhythm').classList.toggle('show-grid', !on);
  gridBtn.textContent = on ? 'show baseline grid' : 'hide baseline grid';
};

// Clicking a ladder row copies its clamp() — the point of the whole page is
// that these values are meant to be taken.
ladder.addEventListener('click', async (e) => {
  const rung = e.target.closest('.rung__sample');
  if (!rung) return;
  try {
    await navigator.clipboard.writeText(rung.title);
    const prev = rung.textContent;
    rung.textContent = 'copied ✓';
    setTimeout(() => (rung.textContent = prev), 900);
  } catch {
    /* clipboard unavailable — the value is still in the title attribute */
  }
});
