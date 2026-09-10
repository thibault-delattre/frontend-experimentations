import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════════════════════════
   The card, rendered three ways from one geometry.

   Note that the skeleton is not a separate component — it is the same markup
   with the text swapped for bars of the SAME line-height. That is what keeps
   the box identical across the swap.
   ═══════════════════════════════════════════════════════════════════════════ */

const DATA = [
  {
    name: 'Priya Raman',
    meta: 'Design systems · 2h ago',
    body: 'Shipped the elevation ramp as tokens. Every card in the product now uses the same six levels instead of forty hand-tuned shadows.',
  },
  {
    name: 'Tomas Lindqvist',
    meta: 'Platform · 5h ago',
    body: 'Moved the particle sim to a compute pass. Frame time went from 31ms to 1.8ms and the main thread is now completely idle during it.',
  },
  {
    name: 'Amara Okafor',
    meta: 'Web · yesterday',
    body: 'Replaced the scroll library with native scroll-driven animations. Removed 24kB of JavaScript and the jank went with it.',
  },
];

function skeleton() {
  return `
    <article class="card" aria-busy="true">
      <div class="card__head">
        <div class="sk sk--avatar" aria-hidden="true"></div>
        <div class="card__names" aria-hidden="true">
          <div class="sk" style="width: 55%"></div>
          <div class="sk" style="width: 38%; height: 0.7rem"></div>
        </div>
      </div>
      <div class="card__body" aria-hidden="true" style="display: grid; gap: 0.42rem">
        <div class="sk"></div><div class="sk"></div><div class="sk" style="width: 72%"></div>
      </div>
      <div class="card__foot" aria-hidden="true">
        <div class="sk sk--pill"></div><div class="sk sk--pill" style="width: 4rem"></div>
      </div>
      <span class="visually-hidden" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">Loading</span>
    </article>`;
}

function loaded(d) {
  return `
    <article class="card">
      <div class="card__head">
        <div class="card__avatar real"></div>
        <div class="card__names">
          <span class="card__name">${d.name}</span>
          <span class="card__meta">${d.meta}</span>
        </div>
      </div>
      <p class="card__body" style="margin: 0">${d.body}</p>
      <div class="card__foot">
        <button type="button">Reply</button><button type="button">Share</button>
      </div>
    </article>`;
}

function errored() {
  return `
    <article class="card card--error" role="alert">
      <div class="card__head">
        <div class="card__avatar" style="background: oklch(40% 0.12 25); display: grid; place-items: center">!</div>
        <div class="card__names">
          <h4>Could not load</h4>
          <p>The request timed out after 10 seconds.</p>
        </div>
      </div>
      <p class="card__body" style="margin: 0; color: oklch(72% 0.05 25)">
        An error state should say what failed, why, and offer a way forward —
        not just render nothing.
      </p>
      <div class="card__foot"><button type="button">Retry</button><button type="button">Details</button></div>
    </article>`;
}

const cardsEl = document.getElementById('cards');

function render(state) {
  cardsEl.innerHTML = DATA.map((d) => {
    if (state === 'skeleton') return skeleton();
    if (state === 'error') return errored();
    return loaded(d);
  }).join('');
}

const stateBar = document.getElementById('stateBar');

stateBar.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  for (const b of stateBar.children) b.setAttribute('aria-pressed', String(b === btn));

  if (btn.dataset.state === 'cycle') {
    // A realistic sequence, including the minimum display time — without it a
    // fast response makes the skeleton flash and read as a glitch.
    render('skeleton');
    await sleep(1100);
    render('loaded');
    const loadedBtn = stateBar.querySelector('[data-state="loaded"]');
    for (const b of stateBar.children) b.setAttribute('aria-pressed', String(b === loadedBtn));
    return;
  }
  render(btn.dataset.state);
});

render('skeleton');

/* ═══════════════════════════════════════════════════════════════════════════
   Thresholds
   ═══════════════════════════════════════════════════════════════════════════ */

const BANDS = [
  [60, 'under 100ms', 'Perceived as instant. Show NOTHING — a spinner here is pure flicker.'],
  [600, '100ms – 1s', 'Show an indeterminate spinner, after a ~100ms delay.'],
  [2600, 'over 1s', 'Show determinate progress, or a skeleton of the real content.'],
  [9000, 'over 8s', 'Explain what is happening and offer a way out.'],
];

const thresholds = document.getElementById('thresholds');
thresholds.innerHTML = BANDS.map(
  ([ms, label, note], i) => `
    <div>
      <b>${label}</b>
      <p>${note}</p>
      <div class="slot" id="slot-${i}"></div>
      <button type="button" data-ms="${ms}" data-i="${i}"
        style="font:inherit;font-size:.76rem;background:var(--bg-2);color:var(--fg);border:1px solid var(--line);border-radius:100px;padding:.25rem .8rem;cursor:pointer;justify-self:start">
        simulate ${ms}ms
      </button>
    </div>`
).join('');

thresholds.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const ms = Number(btn.dataset.ms);
  const slot = document.getElementById(`slot-${btn.dataset.i}`);
  btn.disabled = true;

  const DELAY = 100;   // do not show anything before this
  const MIN = 500;     // once shown, keep it up at least this long
  let shownAt = 0;

  // The guard: schedule the indicator rather than showing it immediately.
  const timer = setTimeout(() => {
    shownAt = Date.now();
    slot.innerHTML =
      ms > 1000
        ? '<div class="bar" style="flex:1"><div class="bar__fill" id="tprog" style="width:0%"></div></div>'
        : '<span class="spinner" role="status" aria-label="Loading"></span><span style="color:var(--fg-faint)">Loading…</span>';

    if (ms > 1000) {
      const fill = document.getElementById('tprog');
      const start = Date.now();
      const tick = setInterval(() => {
        const p = Math.min(100, ((Date.now() - start) / ms) * 100);
        fill.style.width = `${p}%`;
        if (p >= 100) clearInterval(tick);
      }, 60);
    }
  }, DELAY);

  await sleep(ms);
  clearTimeout(timer);

  // If the indicator was shown, honour the minimum display time.
  if (shownAt) {
    const elapsed = Date.now() - shownAt;
    if (elapsed < MIN) await sleep(MIN - elapsed);
  }

  slot.innerHTML = '<span style="color: var(--accent-2)">✓ Done</span>';
  btn.disabled = false;
  setTimeout(() => (slot.innerHTML = ''), 2200);
});

/* ═══════════════════════════════════════════════════════════════════════════
   Determinate progress
   ═══════════════════════════════════════════════════════════════════════════ */

const fill = document.getElementById('determinate');
const pct = document.getElementById('pct');
const uploadBtn = document.getElementById('upload');

uploadBtn.addEventListener('click', async () => {
  uploadBtn.disabled = true;
  const bar = fill.parentElement;
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');

  for (let p = 0; p <= 100; p += 2) {
    // Uneven increments, because real uploads are uneven. A perfectly smooth
    // bar reads as fake — which it usually is.
    await sleep(20 + Math.random() * 70);
    fill.style.width = `${p}%`;
    pct.textContent = `${p}%`;
    bar.setAttribute('aria-valuenow', String(p));
  }
  pct.textContent = 'Done';
  uploadBtn.disabled = false;
  await sleep(1600);
  fill.style.width = '0%';
  pct.textContent = '0%';
});

/* ═══════════════════════════════════════════════════════════════════════════
   Optimistic UI
   ═══════════════════════════════════════════════════════════════════════════ */

const like = document.getElementById('like');
const likeCount = document.getElementById('likeCount');
const likeStatus = document.getElementById('likeStatus');
const failMode = document.getElementById('failMode');

let liked = false;
let count = 128;
let inFlight = false;

like.addEventListener('click', async () => {
  if (inFlight) return;
  inFlight = true;

  // 1 · Update immediately. The user gets feedback in the same frame as the
  // click, which is the whole point.
  const prevLiked = liked;
  const prevCount = count;
  liked = !liked;
  count += liked ? 1 : -1;
  paintLike();
  likeStatus.textContent = 'Saving…';

  await sleep(900);

  if (failMode.checked) {
    // 2 · Roll back VISIBLY. A silent revert leaves the user believing the
    // action succeeded — worse than never having been optimistic at all.
    liked = prevLiked;
    count = prevCount;
    paintLike();
    like.classList.add('rolled-back');
    setTimeout(() => like.classList.remove('rolled-back'), 450);
    likeStatus.textContent = '⚠ Could not save — reverted. Check your connection.';
  } else {
    likeStatus.textContent = '✓ Saved';
    setTimeout(() => (likeStatus.textContent = ''), 1800);
  }
  inFlight = false;
});

function paintLike() {
  like.setAttribute('aria-pressed', String(liked));
  likeCount.textContent = count;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Streaming
   ═══════════════════════════════════════════════════════════════════════════ */

const RESULTS = [
  'scroll-driven animations — 12 references',
  'container queries — 9 references',
  'view transitions — 7 references',
  'anchor positioning — 6 references',
  'TSL node materials — 5 references',
  'compute shaders — 4 references',
  'mask-composite — 3 references',
];

const streamEl = document.getElementById('stream');
document.getElementById('streamBtn').addEventListener('click', async (e) => {
  e.target.disabled = true;
  streamEl.innerHTML = '';
  streamEl.setAttribute('aria-busy', 'true');

  for (const [i, r] of RESULTS.entries()) {
    await sleep(180 + Math.random() * 320);
    const li = document.createElement('li');
    li.textContent = r;
    // The stagger is the arrival itself, not a decorative delay — each row
    // appears when its data does.
    li.style.animationDelay = '0ms';
    streamEl.append(li);
    if (i === RESULTS.length - 1) streamEl.removeAttribute('aria-busy');
  }
  e.target.disabled = false;
});
