import { mountDemoBar, raf, warn } from '../../src/lib/chrome.js';
mountDemoBar();

const out = document.getElementById('out');
const src = document.getElementById('src');
const sctx = src.getContext('2d', { willReadFrequently: true });
const video = document.getElementById('cam');
const stage = out.parentElement;

const params = { cols: 120, contrast: 1.3, gamma: 1, ramp: ' .:-=+*#%@', colour: false, source: 'torus' };

// --- Measure the real character cell aspect ratio ----------------------------
// Guessing 0.5 is close but wrong for most fonts, and the error compounds over
// a hundred rows. Measure once from the actual rendered font.
function cellAspect() {
  const probe = document.createElement('span');
  probe.textContent = 'M'.repeat(50);
  probe.style.cssText =
    'position:absolute;visibility:hidden;white-space:pre;font-family:var(--font-mono);line-height:1;font-size:20px';
  document.body.append(probe);
  const r = probe.getBoundingClientRect();
  probe.remove();
  return r.width / 50 / r.height; // width ÷ height of one cell
}
let ASPECT = cellAspect();

// --- Offscreen sources --------------------------------------------------------
// The procedural sources render into a canvas that MATCHES THE GRID'S ASPECT
// RATIO. Rendering a square source and then fitting it into a wide grid would
// either crop the subject or leave it small and letterboxed; matching the
// aspect up front means the drawImage below is a straight 1:1 fit.
const scene = document.createElement('canvas');
const cx = scene.getContext('2d');

let sceneImg = null;
let scenePix = null;
let zbuf = null;

/** Reallocates the work buffers only when the target aspect actually changes. */
function ensureScene(w, h) {
  if (scene.width === w && scene.height === h) return;
  scene.width = w;
  scene.height = h;
  sceneImg = cx.createImageData(w, h);
  scenePix = new Uint32Array(sceneImg.data.buffer);
  zbuf = new Float32Array(w * h);
}

// The classic donut, written straight into an ImageData buffer with its own
// depth buffer. Painting ~30 000 points with fillRect would cost a state change
// each time and stall the frame; writing bytes costs nothing per point.
function drawTorus(t) {
  const W = scene.width;
  const H = scene.height;
  scenePix.fill(0xff000000);
  zbuf.fill(0);

  const A = t * 0.9;
  const B = t * 0.5;
  const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
  // Scale from the smaller dimension so the donut always fits, whatever the
  // grid's aspect.
  const k = Math.min(W, H) * 0.44;
  const cxp = W / 2;
  const cyp = H / 2;

  for (let th = 0; th < 6.283; th += 0.04) {
    const ct = Math.cos(th), st = Math.sin(th);
    for (let ph = 0; ph < 6.283; ph += 0.01) {
      const cp = Math.cos(ph), sp = Math.sin(ph);
      const circleX = 2 + ct;                    // R2 + r·cosθ
      const x = circleX * (cB * cp + sA * sB * sp) - st * cA * sB;
      const y = circleX * (sB * cp - sA * cB * sp) + st * cA * cB;
      const ooz = 1 / (5 + cA * circleX * sp + st * sA);

      // Lambertian term against a fixed light direction. Negative = facing away.
      const lum = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);
      if (lum <= 0) continue;

      const px = (cxp + k * ooz * x * 1.6) | 0;
      const py = (cyp - k * ooz * y * 1.6) | 0;
      if (px < 0 || px >= W || py < 0 || py >= H) continue;

      // Depth test: the torus self-occludes, and 1/z is larger when nearer.
      const i = py * W + px;
      if (ooz <= zbuf[i]) continue;
      zbuf[i] = ooz;

      const v = Math.min(255, lum * 230) | 0;
      scenePix[i] = 0xff000000 | (Math.min(255, v * 1.15) << 16) | (v << 8) | ((v * 0.7) | 0);
    }
  }
  cx.putImageData(sceneImg, 0, 0);
}

function drawMetaballs(t) {
  const W = scene.width;
  const H = scene.height;
  cx.fillStyle = '#000';
  cx.fillRect(0, 0, W, H);
  cx.globalCompositeOperation = 'lighter';
  const k = Math.min(W, H);
  for (let i = 0; i < 7; i++) {
    const a = t * (0.3 + i * 0.11) + i;
    const x = W / 2 + Math.cos(a) * (W * 0.3 - i * 4);
    const y = H / 2 + Math.sin(a * 1.3) * (H * 0.3 - i * 4);
    const r = k * (0.2 + Math.sin(t + i) * 0.07);
    const g = cx.createRadialGradient(x, y, 0, x, y, r);
    const hue = [255, 180, 120][i % 3];
    g.addColorStop(0, `rgb(${hue} ${255 - hue} 220)`);
    g.addColorStop(1, 'rgb(0 0 0)');
    cx.fillStyle = g;
    cx.beginPath();
    cx.arc(x, y, r, 0, 6.283);
    cx.fill();
  }
  cx.globalCompositeOperation = 'source-over';
}

// --- Webcam -------------------------------------------------------------------
let camReady = false;
async function startCam() {
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    await video.play();
    camReady = true;
  } catch {
    warn('Camera access was denied or unavailable — falling back to the torus.');
    params.source = 'torus';
    syncButtons();
  }
}

// --- The ASCII pass -----------------------------------------------------------
function render(t) {
  const cols = params.cols;
  const box = stage.getBoundingClientRect();
  if (!box.width || !box.height || !ASPECT) return;

  // A cell is `size` tall and `size * ASPECT` wide, so filling the box means
  //   size  = width / (cols * ASPECT)
  //   rows  = height / size = cols * ASPECT * height / width
  // Clamped, because a bad ASPECT would otherwise turn the inner loop into a hang.
  const rows = Math.min(400, Math.max(8, Math.round(cols * ASPECT * (box.height / box.width))));

  if (src.width !== cols || src.height !== rows) {
    src.width = cols;
    src.height = rows;
  }

  // Pick and draw the source. Procedural scenes are rendered at the grid's own
  // aspect (about 8 device pixels per cell — more than enough detail for a
  // glyph), so the fit below is exact and nothing is cropped or letterboxed.
  let source = scene;
  if (params.source === 'webcam' && camReady) {
    source = video;
  } else {
    ensureScene(Math.round(cols * 8), Math.round(rows * 8));
    if (params.source === 'metaballs') drawMetaballs(t);
    else drawTorus(t);
  }

  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  // `cover`: the procedural sources already match, and the webcam's 4:3 should
  // crop rather than letterbox.
  const scale = Math.max(cols / sw, rows / sh);
  const dw = sw * scale;
  const dh = sh * scale;

  sctx.fillStyle = '#000';
  sctx.fillRect(0, 0, cols, rows);
  sctx.save();
  if (params.source === 'webcam') {
    // Mirror the camera — an unmirrored self-view is disorienting.
    sctx.translate(cols, 0);
    sctx.scale(-1, 1);
  }
  sctx.drawImage(source, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
  sctx.restore();

  const data = sctx.getImageData(0, 0, cols, rows).data;
  const ramp = params.ramp;
  const last = ramp.length - 1;
  const invGamma = 1 / params.gamma;

  let text = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Rec.709 luminance: green dominates perceived brightness.
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      let v = (lum - 0.5) * params.contrast + 0.5;
      v = v <= 0 ? 0 : v >= 1 ? 1 : v ** invGamma;
      const ch = ramp[Math.round(v * last)];
      text += params.colour && ch !== ' '
        ? `<span style="color:rgb(${r} ${g} ${b})">${ch}</span>`
        : ch;
    }
    text += '\n';
  }

  // One write per frame. Per-cell DOM would be ~10 000 nodes at these settings.
  if (params.colour) out.innerHTML = text;
  else out.textContent = text;

  // Size the type so the grid exactly fills the stage.
  out.style.fontSize = `${box.width / (cols * ASPECT)}px`;
}

// --- Controls -----------------------------------------------------------------
function bind(id, apply, format) {
  const input = document.getElementById(id);
  const o = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(input.value));
    o.textContent = format(input.value);
  };
  input.addEventListener('input', update);
  update();
}
bind('cols', (v) => (params.cols = v), (v) => v);
bind('contrast', (v) => (params.contrast = v / 100), (v) => (v / 100).toFixed(2));
bind('gamma', (v) => (params.gamma = v / 100), (v) => (v / 100).toFixed(2));

function groupToggle(containerId, onPick) {
  const el = document.getElementById(containerId);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    for (const c of el.children) c.setAttribute('aria-pressed', String(c === b));
    onPick(b);
  });
}
groupToggle('ramps', (b) => (params.ramp = b.dataset.ramp));
groupToggle('sources', (b) => {
  params.source = b.dataset.src;
  if (params.source === 'webcam' && !camReady) startCam();
});

function syncButtons() {
  for (const b of document.getElementById('sources').children) {
    b.setAttribute('aria-pressed', String(b.dataset.src === params.source));
  }
}

const colourBtn = document.getElementById('colour');
colourBtn.onclick = () => {
  params.colour = !params.colour;
  colourBtn.setAttribute('aria-pressed', String(params.colour));
};

document.getElementById('copy').onclick = async () => {
  await navigator.clipboard.writeText(out.textContent);
  const b = document.getElementById('copy');
  b.textContent = 'copied';
  setTimeout(() => (b.textContent = 'copy frame'), 1200);
};

// Fonts load after first paint and change the cell metrics.
document.fonts?.ready.then(() => (ASPECT = cellAspect()));

raf((dt, t) => render(t));
