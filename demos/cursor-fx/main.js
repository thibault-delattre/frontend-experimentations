import { mountDemoBar, raf, autoResize, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

/* ═══════════════════════════════════════════════════════════════════════════
   The gate.

   This runs before anything else. On a touch device, a hybrid, or for a user
   who has asked for reduced motion, none of the code below should exist at
   all — and the native cursor must be left completely untouched.
   ═══════════════════════════════════════════════════════════════════════════ */
const FINE = matchMedia('(hover: hover) and (pointer: fine)');

// --- Content that renders regardless of pointer type -------------------------

const ITEMS = [
  ['Aurora', '2026 · WebGPU'],
  ['Basalt', '2025 · Identity'],
  ['Caustic', '2025 · Shaders'],
  ['Drift', '2024 · Motion'],
];

const list = document.getElementById('list');
list.innerHTML = ITEMS.map(
  ([name, meta], i) => `
    <a class="list__row" href="#${name}" data-peek="${i}" data-cursor="link">
      <span>${name}</span><small>${meta}</small>
    </a>`
).join('');

/** Procedural preview thumbnails — no assets. */
function thumb(seed) {
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 300;
  const x = c.getContext('2d');
  const hue = (seed * 67) % 360;
  const g = x.createLinearGradient(0, 0, 400, 300);
  g.addColorStop(0, `oklch(62% 0.2 ${hue})`);
  g.addColorStop(1, `oklch(28% 0.14 ${(hue + 60) % 360})`);
  x.fillStyle = g;
  x.fillRect(0, 0, 400, 300);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    x.fillStyle = `oklch(75% 0.18 ${(hue + i * 22) % 360} / 0.14)`;
    x.beginPath();
    x.arc(Math.random() * 400, Math.random() * 300, 30 + Math.random() * 90, 0, 6.283);
    x.fill();
  }
  return c;
}
const thumbs = ITEMS.map((_, i) => thumb(i + 3));

if (!FINE.matches || reducedMotion()) {
  // Everything below is skipped. The page still works completely — every
  // effect above was an enhancement, not a mechanism.
  console.info('[cursor-fx] No fine pointer or reduced motion requested — effects disabled.');
} else {
  document.body.classList.add('cursor-on');
  start();
}

function start() {
  const dotEl = document.getElementById('cursorDot');
  const ringEl = document.getElementById('cursorRing');

  // Two positions: the dot snaps to the truth, the ring chases it.
  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const ring = { x: target.x, y: target.y };
  let vx = 0;
  let vy = 0;

  addEventListener(
    'pointermove',
    (e) => {
      vx = e.clientX - target.x;
      vy = e.clientY - target.y;
      target.x = e.clientX;
      target.y = e.clientY;

      // Context is read from the element under the pointer, walking up to the
      // nearest ancestor that declares one. Adding a new interactive element
      // needs one attribute, not a change here.
      const el = e.target.closest('[data-cursor]');
      document.body.dataset.cursor = el ? el.dataset.cursor : 'default';
    },
    { passive: true }
  );

  document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-on'));
  document.addEventListener('pointerenter', () => document.body.classList.add('cursor-on'));

  // --- Trail canvas ---------------------------------------------------------
  const trail = document.getElementById('trail');
  const tctx = trail.getContext('2d');
  const surface = trail.parentElement;
  let TW = 0;
  let TH = 0;
  autoResize(trail, (w, h) => {
    TW = w;
    TH = h;
  });

  // A fixed-length ring of past positions. Capping it is what keeps this
  // bounded — an uncapped trail grows until the frame budget dies.
  const points = [];
  const MAX_POINTS = 26;

  surface.addEventListener(
    'pointermove',
    (e) => {
      const r = surface.getBoundingClientRect();
      const dpr = trail.width / r.width;
      points.push({ x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr });
      if (points.length > MAX_POINTS) points.shift();
    },
    { passive: true }
  );
  surface.addEventListener('pointerleave', () => points.length = 0);

  // --- Spotlight ------------------------------------------------------------
  const spot = document.getElementById('spot');
  spot.addEventListener(
    'pointermove',
    (e) => {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
      spot.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true }
  );
  spot.addEventListener('pointerleave', () => {
    spot.style.setProperty('--mx', '-300px');
    spot.style.setProperty('--my', '-300px');
  });

  // --- Magnetic -------------------------------------------------------------
  const RADIUS = 110;
  const magnets = [...document.querySelectorAll('[data-magnet]')];

  // --- Hover peek -----------------------------------------------------------
  const peek = document.getElementById('peek');
  let peekOn = false;

  for (const row of list.querySelectorAll('[data-peek]')) {
    row.addEventListener('pointerenter', () => {
      peek.innerHTML = '';
      peek.append(thumbs[Number(row.dataset.peek)]);
      peek.classList.add('on');
      peekOn = true;
    });
    row.addEventListener('pointerleave', () => {
      peek.classList.remove('on');
      peekOn = false;
    });
  }

  // --- One loop for all of it ----------------------------------------------
  raf(() => {
    // The dot is written to the true position every frame — no easing. The
    // user's hand is the ground truth and any lag here reads as a fault.
    dotEl.style.translate = `${target.x}px ${target.y}px`;

    // The ring lerps. 0.15 is the sweet spot: 0.4 is barely distinguishable
    // from the dot, 0.05 feels like the page is struggling.
    ring.x += (target.x - ring.x) * 0.15;
    ring.y += (target.y - ring.y) * 0.15;
    ringEl.style.translate = `${ring.x}px ${ring.y}px`;

    // Magnets, evaluated against the true pointer.
    for (const el of magnets) {
      const r = el.getBoundingClientRect();
      const dx = target.x - (r.left + r.width / 2);
      const dy = target.y - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < RADIUS + Math.max(r.width, r.height) / 2;
      const label = el.querySelector('span');
      if (near) {
        el.style.translate = `${dx * 0.22}px ${dy * 0.22}px`;
        if (label) label.style.translate = `${dx * 0.12}px ${dy * 0.12}px`;
      } else {
        el.style.translate = '';
        if (label) label.style.translate = '';
      }
    }

    // Peek follows with a slight rotation from pointer velocity.
    if (peekOn) {
      peek.style.left = `${target.x + 130}px`;
      peek.style.top = `${target.y}px`;
      peek.style.rotate = `${Math.max(-14, Math.min(14, vx * 0.35))}deg`;
    }
    vx *= 0.9;
    vy *= 0.9;

    // Trail: fade the canvas rather than clearing, then stroke the ribbon.
    if (TW) {
      tctx.globalCompositeOperation = 'destination-out';
      tctx.fillStyle = 'rgba(0,0,0,0.12)';
      tctx.fillRect(0, 0, TW, TH);
      tctx.globalCompositeOperation = 'source-over';

      if (points.length > 1) {
        for (let i = 1; i < points.length; i++) {
          const t = i / points.length;
          tctx.beginPath();
          tctx.moveTo(points[i - 1].x, points[i - 1].y);
          tctx.lineTo(points[i].x, points[i].y);
          tctx.strokeStyle = `oklch(${60 + t * 30}% 0.2 ${200 + t * 120} / ${t})`;
          tctx.lineWidth = t * 14;
          tctx.lineCap = 'round';
          tctx.stroke();
        }
      }
    }
  });
}
