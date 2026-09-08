import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const theme = document.getElementById('theme');
const ramp = document.getElementById('ramp');

// Lightness stops chosen the way a real design system does it: dense at the
// ends where UI needs subtle steps, sparser through the middle.
const STOPS = [97, 93, 87, 79, 70, 62, 54, 46, 38, 30, 22, 14];

function renderRamp() {
  const h = theme.style.getPropertyValue('--h') || 265;
  const c = theme.style.getPropertyValue('--c') || 0.18;
  ramp.innerHTML = STOPS.map((l) => {
    // Chroma tapers toward the extremes — full chroma at 97% or 14% lightness
    // is outside every display gamut and just clips.
    const taper = 1 - Math.abs(l - 55) / 55;
    const cc = (c * (0.35 + 0.65 * taper)).toFixed(3);
    return `<div style="--bg: oklch(${l}% ${cc} ${h})">${l}</div>`;
  }).join('');
}

function bind(id, prop, format) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    const value = format(input.value);
    theme.style.setProperty(prop, value);
    out.textContent = value;
    renderRamp();
  };
  input.addEventListener('input', update);
  update();
}

bind('hue', '--h', (v) => v);
bind('chroma', '--c', (v) => (v / 100).toFixed(2));
