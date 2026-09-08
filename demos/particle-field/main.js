import { mountDemoBar, autoResize, raf, pointer } from '../../src/lib/chrome.js';
mountDemoBar();

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });
const ptr = pointer(canvas);

let W = 0;
let H = 0;
let image = null;
let pixels = null; // Uint32Array view over the ImageData — one write per particle

// --- Value noise --------------------------------------------------------------
// A hashed integer lattice with a smoothstep between corners. Cheaper than
// simplex and, for a flow field this soft, indistinguishable.
const hash = (x, y, z) => {
  let n = x * 374761393 + y * 668265263 + z * 1274126177;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
const smooth = (t) => t * t * (3 - 2 * t);

function noise(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const zf = smooth(z - zi);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), xf);
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), xf);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), xf);
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), xf);
  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf);
}

// --- Particle store -----------------------------------------------------------
// Layout: [x, y, vx, vy] × n, in one contiguous block.
let n = 40000;
let p = new Float32Array(n * 4);
let tint = new Uint32Array(n); // premultiplied ABGR, computed once per particle

function spawn() {
  if (!W) return;
  p = new Float32Array(n * 4);
  tint = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    p[o] = Math.random() * W;
    p[o + 1] = Math.random() * H;
    p[o + 2] = 0;
    p[o + 3] = 0;
    // ImageData is little-endian ABGR when viewed as Uint32.
    const t = i / n;
    const r = 120 + t * 135;
    const g = 90 + Math.sin(t * 6.28) * 90 + 60;
    const b = 220 - t * 60;
    tint[i] = (255 << 24) | (b << 16) | ((g & 255) << 8) | r;
  }
}

// The resize callback fires immediately, so it must come after spawn() and the
// buffers it touches are declared — hoisting it above would hit the TDZ.
//
// DPR is pinned to 1: this demo is fill-rate bound on the CPU, and rendering
// four times the pixels for a field of 1px points buys nothing visible.
autoResize(
  canvas,
  (w, h) => {
    W = w;
    H = h;
    image = ctx.createImageData(W, H);
    pixels = new Uint32Array(image.data.buffer);
    pixels.fill(0xff000000); // opaque black
    spawn();
  },
  1
);

// --- Controls -----------------------------------------------------------------
const params = { scale: 12, trail: 14, repel: 120 };

function bind(id, apply, format = (v) => v) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(input.value));
    out.textContent = format(input.value);
  };
  input.addEventListener('input', update);
  update();
}

bind('count', (v) => { n = v; spawn(); }, (v) => `${(v / 1000).toFixed(0)}k`);
bind('scale', (v) => (params.scale = v));
bind('trail', (v) => (params.trail = v));
bind('repel', (v) => (params.repel = v));
document.getElementById('reset').onclick = spawn;

// --- Loop ---------------------------------------------------------------------
const fpsEl = document.getElementById('fps');
let frames = 0;
let acc = 0;

raf((dt, t) => {
  if (!pixels) return;

  // Fade the previous frame in place — this is the trail, and it costs no
  // history storage. The `=== BLACK` early-out matters: most of the buffer is
  // empty, and skipping those pixels is what keeps this loop cheap.
  const decay = params.trail; // higher = shorter trail
  for (let i = 0, len = pixels.length; i < len; i++) {
    const c = pixels[i];
    if (c === 0xff000000) continue;
    const r = c & 255;
    const g = (c >>> 8) & 255;
    const b = (c >>> 16) & 255;
    pixels[i] =
      0xff000000 |
      (Math.max(0, b - ((b * decay) >> 8) - 1) << 16) |
      (Math.max(0, g - ((g * decay) >> 8) - 1) << 8) |
      Math.max(0, r - ((r * decay) >> 8) - 1);
  }

  const s = params.scale / 6000;
  const mx = ptr.x * W;
  const my = ptr.y * H;
  const repel = params.repel;
  const repelSq = 160 * 160;

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    let x = p[o];
    let y = p[o + 1];

    const a = noise(x * s, y * s, t * 0.15) * Math.PI * 4;
    let vx = p[o + 2] + Math.cos(a) * 0.28;
    let vy = p[o + 3] + Math.sin(a) * 0.28;

    // Pointer repulsion, falling off with the square of the distance.
    if (ptr.inside && repel > 0) {
      const dx = x - mx;
      const dy = y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < repelSq && d2 > 1) {
        const f = (repel * (1 - d2 / repelSq)) / d2;
        vx += dx * f;
        vy += dy * f;
      }
    }

    vx *= 0.94; // drag — without it the field accelerates forever
    vy *= 0.94;
    x += vx;
    y += vy;

    // Wrap rather than clamp, so density stays even.
    if (x < 0) x += W; else if (x >= W) x -= W;
    if (y < 0) y += H; else if (y >= H) y -= H;

    p[o] = x;
    p[o + 1] = y;
    p[o + 2] = vx;
    p[o + 3] = vy;

    pixels[(y | 0) * W + (x | 0)] = tint[i];
  }

  ctx.putImageData(image, 0, 0);

  frames++;
  acc += dt;
  if (acc >= 0.5) {
    fpsEl.textContent = `${Math.round(frames / acc)} fps · ${(n / 1000).toFixed(0)}k`;
    frames = 0;
    acc = 0;
  }
});
