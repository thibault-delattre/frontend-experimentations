import { mountDemoBar, autoResize, raf, warn } from '../../src/lib/chrome.js';
mountDemoBar();

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', { antialias: false });
if (!gl) {
  warn('WebGL2 is unavailable, so this demo cannot run.');
  throw new Error('no webgl2');
}

// ── Shaders ──────────────────────────────────────────────────────────────────
const VERT = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_a;       // current slide
uniform sampler2D u_b;       // incoming slide
uniform sampler2D u_disp;    // displacement map (fbm noise)
uniform vec2  u_res;         // canvas size in px
uniform vec2  u_img;         // source image size in px
uniform vec2  u_pointer;     // eased pointer, 0..1
uniform float u_strength;    // pointer displacement amount
uniform float u_split;       // chromatic aberration amount
uniform float u_progress;    // 0..1 slide transition
uniform int   u_mode;

// object-fit: cover, as a UV transform.
vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rs = res.x / res.y;
  float ri = img.x / img.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = coverUV(v_uv, u_res, u_img);
  float d = texture(u_disp, uv * 1.2).r;

  // --- pointer-driven local push -------------------------------------------
  vec2 toP = v_uv - u_pointer;
  toP.x *= u_res.x / u_res.y;                       // circular, not elliptical
  float falloff = exp(-dot(toP, toP) * 14.0);       // gaussian around the cursor
  vec2 push = normalize(toP + 1e-6) * falloff * u_strength * (0.4 + d * 0.6);

  // --- transition mask ------------------------------------------------------
  float p = u_progress;
  float mask;
  if (u_mode == 0) {
    // Noise dissolve: the map IS the per-pixel threshold.
    mask = smoothstep(d - 0.12, d + 0.12, p * 1.24 - 0.12);
  } else if (u_mode == 1) {
    // Directional wipe, roughened by the map so the edge is not a straight line.
    float t = v_uv.x * 0.8 + d * 0.25;
    mask = smoothstep(t - 0.1, t + 0.1, p * 1.3 - 0.1);
  } else if (u_mode == 2) {
    // Radial burst from the pointer.
    float r = length(toP) * 0.8 + d * 0.2;
    mask = smoothstep(r - 0.12, r + 0.12, p * 1.4 - 0.1);
  } else {
    // Pixel melt: strong vertical displacement that peaks mid-transition.
    float melt = sin(p * 3.14159);
    push.y -= melt * (0.15 + d * 0.5);
    mask = smoothstep(0.45, 0.55, p);
  }

  // Displacement peaks in the middle of the transition and returns to zero,
  // so both the start and end frames are pristine.
  float tw = sin(clamp(p, 0.0, 1.0) * 3.14159) * 0.28;
  vec2 uvA = uv + push + vec2((d - 0.5) * tw, (d - 0.5) * tw * 0.6);
  vec2 uvB = uv + push - vec2((d - 0.5) * tw, (d - 0.5) * tw * 0.6);

  // --- chromatic split ------------------------------------------------------
  // Offset direction is the displacement itself, so the fringing follows the
  // distortion rather than sitting on a fixed axis.
  vec2 dir = push * 0.6 + vec2(tw * 0.5, 0.0);
  float s = u_split * (0.3 + falloff + tw);

  vec3 ca = vec3(
    texture(u_a, uvA + dir * s).r,
    texture(u_a, uvA).g,
    texture(u_a, uvA - dir * s).b
  );
  vec3 cb = vec3(
    texture(u_b, uvB + dir * s).r,
    texture(u_b, uvB).g,
    texture(u_b, uvB - dir * s).b
  );

  vec3 col = mix(ca, cb, clamp(mask, 0.0, 1.0));

  // A hint of grain to hide banding in the gradients.
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;

  fragColor = vec4(col, 1.0);
}`;

function makeProgram(vs, fs) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

const program = makeProgram(VERT, FRAG);
gl.useProgram(program);
const U = (n) => gl.getUniformLocation(program, n);

// ── Procedural "photographs" ─────────────────────────────────────────────────
// Swap this for an <img> load and nothing downstream changes.
const IMG_W = 1280;
const IMG_H = 720;

function makeSlide(hue, label, variant) {
  const c = document.createElement('canvas');
  c.width = IMG_W;
  c.height = IMG_H;
  const x = c.getContext('2d');

  const g = x.createLinearGradient(0, 0, IMG_W, IMG_H);
  g.addColorStop(0, `oklch(58% 0.22 ${hue})`);
  g.addColorStop(0.55, `oklch(34% 0.18 ${hue + 40})`);
  g.addColorStop(1, `oklch(18% 0.1 ${hue + 80})`);
  x.fillStyle = g;
  x.fillRect(0, 0, IMG_W, IMG_H);

  x.globalCompositeOperation = 'lighter';
  if (variant === 0) {
    for (let i = 0; i < 90; i++) {
      const r = 40 + Math.random() * 260;
      const rg = x.createRadialGradient(Math.random() * IMG_W, Math.random() * IMG_H, 0, Math.random() * IMG_W, Math.random() * IMG_H, r);
      rg.addColorStop(0, `oklch(70% 0.2 ${hue + Math.random() * 90} / 0.22)`);
      rg.addColorStop(1, 'transparent');
      x.fillStyle = rg;
      x.fillRect(0, 0, IMG_W, IMG_H);
    }
  } else if (variant === 1) {
    x.strokeStyle = `oklch(85% 0.16 ${hue + 60} / 0.28)`;
    for (let i = 0; i < 60; i++) {
      x.lineWidth = 1 + Math.random() * 8;
      x.beginPath();
      x.moveTo(0, Math.random() * IMG_H);
      x.bezierCurveTo(IMG_W * 0.3, Math.random() * IMG_H, IMG_W * 0.7, Math.random() * IMG_H, IMG_W, Math.random() * IMG_H);
      x.stroke();
    }
  } else {
    for (let i = 0; i < 26; i++) {
      x.fillStyle = `oklch(${50 + Math.random() * 40}% 0.2 ${hue + Math.random() * 120} / 0.18)`;
      const w = 60 + Math.random() * 420;
      x.fillRect(Math.random() * IMG_W, Math.random() * IMG_H, w, w * (0.3 + Math.random()));
    }
  }
  x.globalCompositeOperation = 'source-over';

  x.fillStyle = 'oklch(100% 0 0 / 0.9)';
  x.font = '700 120px ui-sans-serif, system-ui, sans-serif';
  x.textBaseline = 'middle';
  x.fillText(label, 70, IMG_H - 110);
  return c;
}

/** A smooth fbm noise texture — the displacement map. Low frequency on purpose. */
function makeNoise(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const img = x.createImageData(size, size);
  const hash = (i, j) => {
    let n = i * 374761393 + j * 668265263;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const noise = (px, py) => {
    const xi = Math.floor(px), yi = Math.floor(py);
    const xf = smooth(px - xi), yf = smooth(py - yi);
    const l = (a, b, t) => a + (b - a) * t;
    return l(
      l(hash(xi, yi), hash(xi + 1, yi), xf),
      l(hash(xi, yi + 1), hash(xi + 1, yi + 1), xf),
      yf
    );
  };
  for (let y = 0; y < size; y++) {
    for (let x2 = 0; x2 < size; x2++) {
      let v = 0;
      let a = 0.5;
      let f = 4 / size;
      for (let o = 0; o < 5; o++) {
        v += noise(x2 * f, y * f) * a;
        f *= 2;
        a *= 0.5;
      }
      const i = (y * size + x2) * 4;
      const c8 = Math.min(255, Math.max(0, v * 300));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = c8;
      img.data[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

function upload(source, unit) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // WebGL's texture origin is bottom-left; every canvas and image is top-left.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Displacement lookups routinely run past the edge — clamp, or you get seams.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

const SLIDES = [
  makeSlide(265, 'AURORA', 0),
  makeSlide(25, 'EMBER', 1),
  makeSlide(180, 'CAUSTIC', 2),
  makeSlide(320, 'DRIFT', 0),
];
const textures = SLIDES.map((s, i) => upload(s, i));
upload(makeNoise(), 7);

gl.uniform1i(U('u_disp'), 7);
gl.uniform2f(U('u_img'), IMG_W, IMG_H);

// ── Interaction ──────────────────────────────────────────────────────────────
const stage = document.getElementById('stage');
const cursorEl = document.getElementById('cursor');

const state = {
  from: 0,
  to: 0,
  progress: 1,
  strength: 0.7,
  split: 0.3,
  mode: 0,
  px: 0.5, py: 0.5,   // eased pointer
  tx: 0.5, ty: 0.5,   // raw pointer target
  boost: 0,           // extra displacement while dragging
};

stage.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  state.tx = (e.clientX - r.left) / r.width;
  state.ty = (e.clientY - r.top) / r.height;
  cursorEl.style.left = `${e.clientX - r.left}px`;
  cursorEl.style.top = `${e.clientY - r.top}px`;
});
stage.addEventListener('pointerdown', () => (state.boost = 1));
addEventListener('pointerup', () => (state.boost = 0));

const dots = document.getElementById('dots');
dots.innerHTML = SLIDES.map(
  (_, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="Slide ${i + 1}"></button>`
).join('');

function goTo(i) {
  if (i === state.to || state.progress < 1) return;
  state.from = state.to;
  state.to = i;
  state.progress = 0;
  for (const b of dots.children) b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i));
}
dots.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) goTo(Number(b.dataset.i));
});

const bind = (id, key, map) => {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    state[key] = map(Number(input.value));
    out.textContent = input.value;
  };
  input.addEventListener('input', update);
  update();
};
bind('amount', 'strength', (v) => v / 100);
bind('split', 'split', (v) => v / 100);
document.getElementById('mode').addEventListener('change', (e) => (state.mode = Number(e.target.value)));

// ── Loop ─────────────────────────────────────────────────────────────────────
let W = 1;
let H = 1;
autoResize(canvas, (w, h) => {
  W = w;
  H = h;
  gl.viewport(0, 0, w, h);
});

raf((dt) => {
  // Easing the pointer is what makes the distortion feel heavy rather than
  // twitchy. One line, and it is the whole difference.
  state.px += (state.tx - state.px) * Math.min(1, dt * 6);
  state.py += (state.ty - state.py) * Math.min(1, dt * 6);
  state.progress = Math.min(1, state.progress + dt * 0.85);

  gl.useProgram(program);
  gl.uniform1i(U('u_a'), state.from);
  gl.uniform1i(U('u_b'), state.to);
  gl.uniform2f(U('u_res'), W, H);
  gl.uniform2f(U('u_pointer'), state.px, 1 - state.py); // flip: GL origin is bottom-left
  gl.uniform1f(U('u_strength'), state.strength * (0.12 + state.boost * 0.2));
  gl.uniform1f(U('u_split'), state.split * 0.6);
  // Ease the transition progress — a linear dissolve reads as a crossfade.
  const p = state.progress;
  gl.uniform1f(U('u_progress'), p * p * (3 - 2 * p));
  gl.uniform1i(U('u_mode'), state.mode);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
});

// Auto-advance until the visitor takes over.
let auto = setInterval(() => goTo((state.to + 1) % SLIDES.length), 5200);
stage.addEventListener('pointerdown', () => clearInterval(auto), { once: true });
dots.addEventListener('click', () => clearInterval(auto), { once: true });
