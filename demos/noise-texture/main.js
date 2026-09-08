import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const root = document.documentElement;

/**
 * Builds a self-contained SVG document as a data: URI.
 *
 * This is the key move of the whole page. A live `filter: url(#noise)` re-runs
 * the filter graph on every paint — expensive, and in several engines on the
 * CPU. Serialising the same filter once into a background-image means the
 * browser rasterises it a single time and then treats it as an ordinary
 * tiling bitmap.
 */
function svgUri(inner, size = 220) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${size} ${size}">${inner}</svg>`;
  // encodeURIComponent, not btoa: base64 inflates by a third and these are
  // already small. The # and % must be escaped or the URI terminates early.
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Grey fractal noise. stitchTiles keeps the edges seamless when it repeats. */
function grainUri(freq = 0.8, octaves = 4) {
  return svgUri(
    `<filter id="n" x="0" y="0" width="100%" height="100%">
       <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" stitchTiles="stitch"/>
       <feColorMatrix type="saturate" values="0"/>
     </filter>
     <rect width="100%" height="100%" filter="url(#n)"/>`
  );
}

/** Long, fine fibres: turbulence stretched hard along one axis. */
function fibreUri() {
  return svgUri(
    `<filter id="f" x="0" y="0" width="100%" height="100%">
       <feTurbulence type="fractalNoise" baseFrequency="0.04 1.4" numOctaves="5" stitchTiles="stitch"/>
       <feColorMatrix type="saturate" values="0"/>
       <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
     </filter>
     <rect width="100%" height="100%" filter="url(#f)"/>`,
    300
  );
}

/**
 * A 4×4 ordered (Bayer) threshold matrix, drawn as 16 grey squares.
 *
 * Each cell holds a threshold; composited with hard-light over a gradient, a
 * pixel flips to black or white depending on whether the gradient's value at
 * that point exceeds its cell's threshold. That spatial variation is what
 * turns 2 colours into the appearance of 17 levels.
 */
function bayerUri() {
  const M = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const rects = M.flatMap((row, y) =>
    row.map((v, x) => {
      const g = Math.round((v / 16) * 255);
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${g},${g},${g})"/>`;
    })
  ).join('');
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" shape-rendering="crispEdges">${rects}</svg>`
  )}")`;
}

root.style.setProperty('--grain-url', grainUri());
root.style.setProperty('--fibre-url', fibreUri());
root.style.setProperty('--bayer-url', bayerUri());

// --- Blend-mode comparison ---------------------------------------------------
const MODES = [
  ['overlay', 'preserves hue, perturbs luminance — the right default'],
  ['soft-light', 'gentler overlay; best for subtle grain'],
  ['multiply', 'darkens everything — watch your contrast'],
  ['screen', 'lightens everything'],
  ['color-burn', 'aggressive, high contrast'],
  ['hard-light', 'harsh; useful for dithering'],
  ['luminosity', 'keeps the base colour exactly'],
  ['normal', 'just a grey film over the top'],
];

document.getElementById('blends').innerHTML = MODES.map(
  ([mode, why]) => `
    <div class="blend" style="--mode: ${mode}" title="${why}">
      <span>${mode}</span>
    </div>`
).join('');

// --- Grain controls ----------------------------------------------------------
const cells = document.querySelectorAll('.grain');

function bind(id, apply, format) {
  const el = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(el.value));
    out.textContent = format(Number(el.value));
  };
  el.addEventListener('input', update);
  update();
}

bind(
  'g-op',
  (v) => root.style.setProperty('--grain-opacity', v / 100),
  (v) => `${v}%`
);
bind(
  'g-freq',
  (v) => root.style.setProperty('--grain-url', grainUri(v / 100)),
  (v) => (v / 100).toFixed(2)
);

// Opacity is set on the pseudo-element via a variable rather than by
// regenerating the URI, so dragging the slider costs nothing.
const style = document.createElement('style');
style.textContent = '.grain::after { opacity: var(--grain-opacity, 0.42); }';
document.head.append(style);

document.getElementById('g-anim').addEventListener('change', (e) => {
  for (const c of cells) c.classList.toggle('grain--animated', e.target.checked);
});
