import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

/* ═══════════════════════════════════════════════════════════════════════════
   Procedural "photographs".

   Everything downstream treats these as ordinary <img> elements, so swapping
   in real files changes nothing but this function.
   ═══════════════════════════════════════════════════════════════════════════ */

const W = 800;
const H = 600;

/** Deterministic PRNG, so a given photo id always paints identically. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function paint(seed) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  const r = rng(seed * 7919 + 13);
  const hue = r() * 360;

  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, `oklch(${58 + r() * 18}% 0.16 ${hue})`);
  g.addColorStop(0.55, `oklch(${34 + r() * 14}% 0.14 ${(hue + 50) % 360})`);
  g.addColorStop(1, `oklch(${14 + r() * 10}% 0.08 ${(hue + 110) % 360})`);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  // Soft light blobs, additively blended — reads as depth and haze.
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) {
    const cx = r() * W;
    const cy = r() * H;
    const rad = 40 + r() * 240;
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    rg.addColorStop(0, `oklch(${70 + r() * 22}% 0.17 ${(hue + r() * 120) % 360} / 0.2)`);
    rg.addColorStop(1, 'transparent');
    x.fillStyle = rg;
    x.fillRect(0, 0, W, H);
  }

  // A few hard shapes so there is real structure for blend modes to bite on.
  x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 7; i++) {
    x.save();
    x.translate(r() * W, r() * H);
    x.rotate(r() * Math.PI);
    x.fillStyle = `oklch(${60 + r() * 30}% 0.18 ${(hue + 180 + r() * 60) % 360} / ${0.1 + r() * 0.2})`;
    const w = 60 + r() * 260;
    x.fillRect(-w / 2, -w / 4, w, w / 2);
    x.restore();
  }

  // Grain, so the flat gradients do not band.
  const img = x.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);

  return c.toDataURL('image/jpeg', 0.86);
}

const photos = [1, 2, 3, 4, 5, 6, 7, 8].map(paint);

/** Fills any [data-photo] frame with a real <img>. */
function fill(frame, index) {
  const img = new Image();
  img.src = photos[(index - 1) % photos.length];
  img.alt = '';
  img.width = W;
  img.height = H;
  frame.append(img);
}

for (const frame of document.querySelectorAll('[data-photo]')) {
  fill(frame, Number(frame.dataset.photo));
}

// The text-clipped heading needs the same bitmap as a background.
document.getElementById('maskText').style.setProperty('--photo', `url(${photos[4]})`);

// --- Blend matrix ------------------------------------------------------------
const MODES = [
  ['normal', 'a flat colour over the top — almost never what you want'],
  ['multiply', 'darkens; keeps shadows, crushes highlights'],
  ['screen', 'lightens; keeps highlights, lifts blacks'],
  ['overlay', 'multiply in shadows, screen in highlights — contrast'],
  ['soft-light', 'a gentler overlay; the safe tinting default'],
  ['color-burn', 'aggressive darkening, heavy saturation'],
  ['hue', 'takes hue from the gradient, keeps original luminance'],
  ['luminosity', 'takes LIGHTNESS from the gradient, keeps original colour'],
];

document.getElementById('blends').innerHTML = MODES.map(
  ([mode, why]) => `
    <figure>
      <div class="frame blend-cell" style="--mode:${mode}" data-blend></div>
      <figcaption><b style="color:var(--accent-2)">${mode}</b> — ${why}</figcaption>
    </figure>`
).join('');

for (const f of document.querySelectorAll('[data-blend]')) fill(f, 6);

// --- Gallery -----------------------------------------------------------------
const gallery = document.getElementById('gallery');
gallery.innerHTML = Array.from({ length: 6 }, () => '<div class="frame"></div>').join('');
[...gallery.children].forEach((f, i) => fill(f, i + 1));

// --- Duotone controls --------------------------------------------------------
const root = document.documentElement;
const transfer = document.getElementById('duo-transfer');

/** OKLCH → 0..1 sRGB, needed because feFuncR tableValues take plain numbers. */
function oklchToRgb01(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => {
    const e = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, e));
  });
}

function updateDuotone() {
  const a = Number(document.getElementById('duo-a').value);
  const b = Number(document.getElementById('duo-b').value);

  root.style.setProperty('--duo-a', `oklch(45% 0.2 ${a})`);
  root.style.setProperty('--duo-b', `oklch(80% 0.18 ${b})`);
  document.getElementById('duo-a-out').textContent = `${a}°`;
  document.getElementById('duo-b-out').textContent = `${b}°`;

  // The SVG filter needs per-channel ramps: shadow colour at 0, highlight at 1.
  const lo = oklchToRgb01(0.32, 0.16, a);
  const hi = oklchToRgb01(0.86, 0.15, b);
  const funcs = transfer.children;
  for (let i = 0; i < 3; i++) {
    funcs[i].setAttribute('tableValues', `${lo[i].toFixed(3)} ${hi[i].toFixed(3)}`);
  }
}

for (const id of ['duo-a', 'duo-b']) {
  document.getElementById(id).addEventListener('input', updateDuotone);
}
updateDuotone();

// --- Progressive reveal ------------------------------------------------------
const prog = document.getElementById('prog');

async function loadProgressive() {
  prog.classList.remove('loaded');
  prog.innerHTML = '';

  // The placeholder: the same image at a tiny size, upscaled and blurred.
  // In production this is a ~20px inline base64 thumbnail shipped in the HTML.
  const tiny = document.createElement('canvas');
  tiny.width = 20;
  tiny.height = 15;
  const tctx = tiny.getContext('2d');
  const src = new Image();
  src.src = photos[7];
  await src.decode();
  tctx.drawImage(src, 0, 0, 20, 15);

  const ph = new Image();
  ph.className = 'ph';
  ph.src = tiny.toDataURL();
  ph.alt = '';
  prog.append(ph);

  const full = new Image();
  full.className = 'full';
  full.alt = '';
  full.src = photos[7];

  // decode() resolves when the bitmap is ready to paint. The load event fires
  // earlier, which is why blur-up implementations built on it still flash.
  await new Promise((r) => setTimeout(r, 900)); // simulate the network
  await full.decode();
  prog.append(full);
  prog.classList.add('loaded');
}

loadProgressive();
document.getElementById('reload').addEventListener('click', loadProgressive);
