import { animate, hover, press, inView, stagger, spring } from 'motion';
import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';

mountDemoBar();

// ── 01 · spring vs easing ────────────────────────────────────────────────────
const ballSpring = document.getElementById('ballSpring');
const ballEase = document.getElementById('ballEase');
const settleEl = document.getElementById('settle');

const cfg = { stiffness: 260, damping: 20, mass: 1, velocity: 0 };
let at = 0;

function knob(id, key, scale = 1, digits = 0) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    cfg[key] = Number(input.value) * scale;
    out.textContent = cfg[key].toFixed(digits);
    describe();
  };
  input.addEventListener('input', update);
  update();
}

/** Reports whether the current values under-, over- or critically damp. */
function describe() {
  const critical = 2 * Math.sqrt(cfg.stiffness * cfg.mass);
  const ratio = cfg.damping / critical;
  settleEl.textContent =
    ratio < 0.95 ? `underdamped — bounces (ζ=${ratio.toFixed(2)})`
    : ratio > 1.05 ? `overdamped — sluggish (ζ=${ratio.toFixed(2)})`
    : `critically damped (ζ=${ratio.toFixed(2)})`;
}

knob('stiff', 'stiffness');
knob('damp', 'damping');
knob('mass', 'mass', 0.1, 1);
knob('vel', 'velocity');

document.getElementById('launch').onclick = () => {
  const distance = ballSpring.parentElement.clientWidth - 76;
  at = at ? 0 : distance;

  // A spring takes no duration. Interrupting it mid-flight preserves the
  // current velocity, which is exactly why it survives being retargeted.
  animate(ballSpring, { x: at }, { type: spring, ...cfg });

  // The ease restarts from zero velocity every time — the visible difference.
  animate(ballEase, { x: at }, { duration: 0.4, ease: [0.4, 0, 0.2, 1] });
};

// ── 02 · drag with momentum ──────────────────────────────────────────────────
const puck = document.getElementById('puck');
const arena = document.getElementById('arena');

let dragging = false;
let ox = 0;
let oy = 0;
let x = 0;
let y = 0;
// A short history is enough to get a stable release velocity; a single frame's
// delta is far too noisy.
let samples = [];

puck.addEventListener('pointerdown', (e) => {
  dragging = true;
  puck.setPointerCapture(e.pointerId);
  ox = e.clientX - x;
  oy = e.clientY - y;
  samples = [];
  // Stop whatever animation is running so it does not fight the pointer.
  animate(puck, { x, y, scale: 1.08 }, { duration: 0 });
  animate(puck, { scale: 1.08 }, { type: spring, stiffness: 400, damping: 25 });
});

puck.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  x = e.clientX - ox;
  y = e.clientY - oy;
  // Soft bounds: past the wall, movement is halved rather than blocked.
  const bx = arena.clientWidth / 2 - 48;
  const by = arena.clientHeight / 2 - 48;
  if (Math.abs(x) > bx) x = Math.sign(x) * (bx + (Math.abs(x) - bx) * 0.35);
  if (Math.abs(y) > by) y = Math.sign(y) * (by + (Math.abs(y) - by) * 0.35);

  puck.style.transform = `translate(${x}px, ${y}px) scale(1.08)`;
  samples.push({ x, y, t: performance.now() });
  if (samples.length > 6) samples.shift();
});

function release(e) {
  if (!dragging) return;
  dragging = false;
  puck.releasePointerCapture?.(e.pointerId);

  // Velocity over the last ~60ms of samples, in px/s.
  const first = samples[0];
  const last = samples.at(-1);
  const dt = last && first ? (last.t - first.t) / 1000 : 0;
  const vx = dt > 0 ? (last.x - first.x) / dt : 0;
  const vy = dt > 0 ? (last.y - first.y) / dt : 0;

  x = 0;
  y = 0;
  // Handing the measured velocity to the spring is what makes the throw read as
  // a throw rather than a snap. Per-property options let x and y each carry
  // their own component of the release velocity.
  animate(
    puck,
    { x: 0, y: 0, scale: 1 },
    {
      type: spring,
      stiffness: 180,
      damping: 16,
      mass: 1,
      x: { velocity: vx },
      y: { velocity: vy },
    }
  );
}
puck.addEventListener('pointerup', release);
puck.addEventListener('pointercancel', release);

// ── 03 · shared layout (FLIP) ────────────────────────────────────────────────
const TILES = [
  ['Aurora', 265], ['Ember', 25], ['Caustic', 190], ['Drift', 320],
  ['Fathom', 230], ['Basalt', 60], ['Prism', 145], ['Verge', 300],
];
const tiles = document.getElementById('tiles');
tiles.innerHTML = TILES.map(
  ([n, h]) => `<div class="tile" style="--h:${h}" tabindex="0" role="button">${n}</div>`
).join('');

let open = null;

function expand(tile) {
  if (open) return;

  // F — where it is now.
  const first = tile.getBoundingClientRect();

  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.append(scrim);
  animate(scrim, { opacity: 1 }, { duration: 0.25 });

  const clone = tile.cloneNode(true);
  clone.className = 'expanded';
  clone.style.background = getComputedStyle(tile).background;
  document.body.append(clone);
  tile.style.visibility = 'hidden';

  // L — where it should end up.
  const w = Math.min(innerWidth * 0.86, 620);
  const h = Math.min(innerHeight * 0.7, 460);
  Object.assign(clone.style, {
    left: `${(innerWidth - w) / 2}px`,
    top: `${(innerHeight - h) / 2}px`,
    width: `${w}px`,
    height: `${h}px`,
  });
  const last = clone.getBoundingClientRect();

  // I — invert: place it back over the original with a transform...
  const invert = {
    x: first.left - last.left,
    y: first.top - last.top,
    scaleX: first.width / last.width,
    scaleY: first.height / last.height,
  };
  clone.style.transformOrigin = 'top left';
  clone.style.transform = `translate(${invert.x}px, ${invert.y}px) scale(${invert.scaleX}, ${invert.scaleY})`;

  // P — ...then play the transform away. Only transform animates, so the
  // browser never re-lays-out during the tween.
  animate(
    clone,
    { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    reducedMotion() ? { duration: 0 } : { type: spring, stiffness: 220, damping: 26 }
  );

  open = { tile, clone, scrim };
  clone.onclick = collapse;
  scrim.onclick = collapse;
  addEventListener('keydown', onEsc);
}

function collapse() {
  if (!open) return;
  const { tile, clone, scrim } = open;
  open = null;
  removeEventListener('keydown', onEsc);

  // Run the same FLIP in reverse: measure the target, animate the delta.
  const target = tile.getBoundingClientRect();
  const current = clone.getBoundingClientRect();

  animate(scrim, { opacity: 0 }, { duration: 0.2 }).then(() => scrim.remove());
  animate(
    clone,
    {
      x: target.left - current.left,
      y: target.top - current.top,
      scaleX: target.width / current.width,
      scaleY: target.height / current.height,
    },
    reducedMotion() ? { duration: 0 } : { type: spring, stiffness: 260, damping: 30 }
  ).then(() => {
    clone.remove();
    tile.style.visibility = '';
  });
}

const onEsc = (e) => e.key === 'Escape' && collapse();

tiles.addEventListener('click', (e) => {
  const t = e.target.closest('.tile');
  if (t) expand(t);
});
tiles.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    expand(e.target.closest('.tile'));
  }
});

// ── 04 · gestures ────────────────────────────────────────────────────────────
const [hoverEl, pressEl, bothEl] = document.getElementById('gest').children;

// hover() fires on real hover only — it ignores touch taps, which is the bug
// you get for free with mouseenter.
hover(hoverEl, (el) => {
  animate(el, { scale: 1.08, rotate: -2 }, { type: spring, stiffness: 400, damping: 20 });
  return () => animate(el, { scale: 1, rotate: 0 }, { type: spring, stiffness: 300, damping: 22 });
});

// press() handles pointer capture and cancels correctly when you drag off.
press(pressEl, (el) => {
  animate(el, { scale: 0.94 }, { type: spring, stiffness: 700, damping: 30 });
  return () => animate(el, { scale: 1 }, { type: spring, stiffness: 500, damping: 18 });
});

hover(bothEl, (el) => {
  animate(el, { scale: 1.06 }, { type: spring, stiffness: 400, damping: 20 });
  return () => animate(el, { scale: 1 }, { type: spring, stiffness: 300, damping: 22 });
});
press(bothEl, (el) => {
  animate(el, { scale: 0.92, rotate: 3 }, { type: spring, stiffness: 700, damping: 30 });
  return () => animate(el, { scale: 1.06, rotate: 0 }, { type: spring, stiffness: 500, damping: 18 });
});

// ── 05 · inView + stagger ────────────────────────────────────────────────────
const stag = document.getElementById('stag');
stag.innerHTML = [
  'inView() is an IntersectionObserver with a nicer shape',
  'it returns a cleanup function, so it is safe in effects',
  'the callback may return a second function for "on leave"',
  'stagger() is a delay *function*, not a loop',
  'stagger(0.06, { from: "center" }) ripples outward',
  'all of it compiles to WAAPI where the browser can take it',
]
  .map((t) => `<li>${t}</li>`)
  .join('');

inView(
  stag,
  () => {
    animate(
      stag.children,
      { opacity: [0, 1], y: [24, 0], filter: ['blur(6px)', 'blur(0px)'] },
      { duration: 0.6, delay: stagger(0.07), ease: [0.16, 1, 0.3, 1] }
    );
  },
  { amount: 0.3 }
);
