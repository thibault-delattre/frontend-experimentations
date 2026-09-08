import { mountDemoBar, autoResize, raf, pointer, warn } from '../../src/lib/chrome.js';
import { PRELUDE, PRESETS } from './presets.js';

mountDemoBar();

const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'high-performance' });

if (!gl) {
  warn('WebGL2 is unavailable in this browser, so the shader lab cannot run.');
  throw new Error('no webgl2');
}

// ── The fullscreen triangle ──────────────────────────────────────────────────
// No vertex buffer, no attributes: gl_VertexID generates a triangle large
// enough to cover the clip volume. Cheaper than a quad and there is no
// diagonal seam where the two halves meet.
const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const ptr = pointer(canvas);
const badge = document.getElementById('badge');
const errEl = document.getElementById('err');
const codeEl = document.getElementById('code');

let program = null;
let uniforms = {};

function compile(type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log);
  }
  return sh;
}

/**
 * Builds a program from the editable body. On failure the previous program is
 * kept, so a half-typed edit never blanks the canvas.
 */
function build(body) {
  const source = `${PRELUDE}\n${body}`;
  let vs;
  let fs;
  try {
    vs = compile(gl.VERTEX_SHADER, VERT);
    fs = compile(gl.FRAGMENT_SHADER, source);
  } catch (e) {
    // Shift reported line numbers back into the editor's coordinate space.
    const preludeLines = PRELUDE.split('\n').length;
    errEl.textContent = String(e.message)
      .replace(/ERROR: (\d+):(\d+)/g, (_, c, line) => `line ${Number(line) - preludeLines}`)
      .trim();
    return false;
  }

  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    errEl.textContent = gl.getProgramInfoLog(p);
    return false;
  }

  if (program) gl.deleteProgram(program);
  program = p;
  gl.useProgram(program);
  uniforms = Object.fromEntries(
    ['u_resolution', 'u_time', 'u_mouse', 'u_scale', 'u_speed', 'u_warp', 'u_detail'].map((n) => [
      n,
      gl.getUniformLocation(program, n),
    ])
  );
  errEl.textContent = '';
  return true;
}

// ── Presets ──────────────────────────────────────────────────────────────────
const tabs = document.getElementById('presets');
tabs.innerHTML = PRESETS.map(
  (p, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${p.name}</button>`
).join('');

tabs.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  for (const c of tabs.children) c.setAttribute('aria-pressed', String(c === b));
  codeEl.value = PRESETS[b.dataset.i].source;
  build(codeEl.value);
});

// Debounced recompile: rebuilding on every keystroke stalls on long shaders.
let debounce;
codeEl.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => build(codeEl.value), 260);
});

codeEl.value = PRESETS[0].source;
build(codeEl.value);

// ── Uniform sliders ──────────────────────────────────────────────────────────
const params = { scale: 30, speed: 0.6, warp: 70, detail: 5 };
const SLIDERS = [
  ['u1', 'scale', (v) => v],
  ['u2', 'speed', (v) => v / 100],
  ['u3', 'warp', (v) => v],
  ['u4', 'detail', (v) => v],
];
for (const [id, key, map] of SLIDERS) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}o`);
  const update = () => {
    params[key] = map(Number(input.value));
    out.textContent = typeof params[key] === 'number' ? params[key].toFixed(key === 'speed' ? 2 : 0) : params[key];
  };
  input.addEventListener('input', update);
  update();
}

// ── Render ───────────────────────────────────────────────────────────────────
let W = 1;
let H = 1;
autoResize(canvas, (w, h) => {
  W = w;
  H = h;
  gl.viewport(0, 0, w, h);
});

let frames = 0;
let acc = 0;

raf((dt, t) => {
  if (!program) return;
  gl.useProgram(program);
  gl.uniform2f(uniforms.u_resolution, W, H);
  gl.uniform1f(uniforms.u_time, t);
  // Mouse in the same aspect-corrected space the shaders use for uv.
  gl.uniform2f(uniforms.u_mouse, ptr.nx * (W / H), ptr.ny);
  gl.uniform1f(uniforms.u_scale, params.scale);
  gl.uniform1f(uniforms.u_speed, params.speed);
  gl.uniform1f(uniforms.u_warp, params.warp);
  gl.uniform1f(uniforms.u_detail, params.detail);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  frames++;
  acc += dt;
  if (acc >= 0.5) {
    badge.textContent = `${Math.round(frames / acc)} fps · ${W}×${H}`;
    frames = 0;
    acc = 0;
  }
});
