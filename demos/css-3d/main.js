import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

// --- Pointer tilt -------------------------------------------------------------
const tilt = document.getElementById('tilt');
const scene = tilt.parentElement;
const MAX = 14; // degrees — past ~18 the perspective distortion reads as a glitch

scene.addEventListener('pointermove', (e) => {
  const r = tilt.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  tilt.classList.add('is-live');
  // Y rotation follows horizontal movement, X rotation is inverted so the card
  // leans *towards* the cursor rather than away from it.
  tilt.style.setProperty('--ry', `${(px - 0.5) * 2 * MAX}deg`);
  tilt.style.setProperty('--rx', `${(0.5 - py) * 2 * MAX}deg`);
  tilt.style.setProperty('--mx', `${px * 100}%`);
  tilt.style.setProperty('--my', `${py * 100}%`);
});

scene.addEventListener('pointerleave', () => {
  // Dropping is-live restores the transition, which eases the card back.
  tilt.classList.remove('is-live');
  tilt.style.setProperty('--rx', '0deg');
  tilt.style.setProperty('--ry', '0deg');
});

// Device orientation on mobile, where there is no hover.
if (matchMedia('(hover: none)').matches && window.DeviceOrientationEvent) {
  addEventListener('deviceorientation', (e) => {
    tilt.style.setProperty('--ry', `${Math.max(-MAX, Math.min(MAX, (e.gamma ?? 0) / 3))}deg`);
    tilt.style.setProperty('--rx', `${Math.max(-MAX, Math.min(MAX, -((e.beta ?? 45) - 45) / 3))}deg`);
  });
}

// --- Coverflow items ----------------------------------------------------------
document.getElementById('flow').innerHTML = Array.from(
  { length: 9 },
  (_, i) => `<div class="flow__item" style="--h:${(i * 41) % 360}">${String(i + 1).padStart(2, '0')}</div>`
).join('');
