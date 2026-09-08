import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

/**
 * Generates a layered shadow for an elevation level.
 *
 * The shape of the curve is the whole point: blur grows geometrically while
 * per-stop alpha stays roughly constant, so the accumulated darkness falls off
 * the way a real penumbra does. `y` tracks blur at about half its rate, which
 * is what makes higher elevations read as further from the surface rather than
 * merely blurrier.
 */
function elevation(level, { hue = 265, chroma = 0.03, lightness = 25 } = {}) {
  if (level === 0) return 'none';

  const stops = 3 + level;                 // more stops as the object rises
  const spread = 1.6 ** level;             // overall scale of the whole stack
  const shadows = [];

  for (let i = 0; i < stops; i++) {
    const blur = 2 ** i * spread;
    const y = blur * 0.55;
    // Alpha decays slightly with each stop so the outermost ring is the
    // faintest; without the decay the stack looks like a uniform grey halo.
    const alpha = (0.055 * (1 - i / (stops * 1.8))).toFixed(4);
    shadows.push(
      `0 ${y.toFixed(1)}px ${blur.toFixed(1)}px oklch(${lightness}% ${chroma} ${hue} / ${alpha})`
    );
  }

  // The contact shadow: tight, unblurred, comparatively dark. It is what
  // anchors the object to the surface, and it barely changes with elevation.
  shadows.unshift(`0 1px 2px oklch(${lightness}% ${chroma} ${hue} / 0.16)`);
  return shadows.join(',\n  ');
}

// --- Ramp -------------------------------------------------------------------
const ramp = document.getElementById('ramp');
ramp.innerHTML = Array.from({ length: 6 }, (_, level) => {
  const css = elevation(level);
  return `<div class="card" style="box-shadow: ${css}" title="${css}">
            <span style="display:grid;gap:.3rem;text-align:center">
              <b style="font-size:1.1rem">${level}</b>
              <span style="font-size:.68rem;opacity:.6;font-family:var(--font-mono)">
                ${['flush', 'card', 'button', 'menu', 'modal', 'dragged'][level]}
              </span>
            </span>
          </div>`;
}).join('');

// Clicking a level copies its CSS — these are meant to be taken.
ramp.addEventListener('click', async (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  try {
    await navigator.clipboard.writeText(`box-shadow:\n  ${card.title};`);
    card.animate([{ scale: 1 }, { scale: 0.95 }, { scale: 1 }], { duration: 260 });
  } catch {
    /* clipboard needs a secure context; the value is on the title attribute */
  }
});

// --- Draggable light --------------------------------------------------------
const light = document.getElementById('light');
const scene = document.getElementById('scene');
const root = document.documentElement;

function place(nx, ny) {
  // Clamped to the scene so the light can never be dragged out of reach.
  const x = Math.min(Math.max(nx, 0), 1);
  const y = Math.min(Math.max(ny, 0), 1);
  root.style.setProperty('--light-x', x.toFixed(3));
  root.style.setProperty('--light-y', y.toFixed(3));
  light.style.left = `calc(${(x * 100).toFixed(2)}% - 15px)`;
  light.style.top = `calc(${(y * 100).toFixed(2)}% - 15px)`;

  const h = y < 0.34 ? 'top' : y > 0.66 ? 'bottom' : 'middle';
  const v = x < 0.34 ? 'left' : x > 0.66 ? 'right' : 'centre';
  light.setAttribute('aria-valuetext', `${v} ${h}`);
}

place(0.5, 0.08);

light.addEventListener('pointerdown', (e) => {
  light.setPointerCapture(e.pointerId);
  e.preventDefault();
});

light.addEventListener('pointermove', (e) => {
  if (!light.hasPointerCapture(e.pointerId)) return;
  const r = scene.getBoundingClientRect();
  place((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});

light.addEventListener('pointerup', (e) => light.releasePointerCapture(e.pointerId));

// A drag handle that only works with a pointer is not finished.
light.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 0.12 : 0.04;
  const moves = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  const move = moves[e.key];
  if (!move) return;
  e.preventDefault();
  const cur = {
    x: Number(getComputedStyle(root).getPropertyValue('--light-x')),
    y: Number(getComputedStyle(root).getPropertyValue('--light-y')),
  };
  place(cur.x + move[0], cur.y + move[1]);
});
