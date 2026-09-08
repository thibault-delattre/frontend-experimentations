import * as THREE from 'three/webgpu';
import {
  Fn,
  time,
  uniform,
  positionLocal,
  normalLocal,
  normalWorld,
  positionWorld,
  cameraPosition,
  mx_noise_float,
  mx_fractal_noise_float,
  vec3,
  vec4,
  float,
  mix,
  uv,
  sin,
  cos,
  fract,
  abs,
  smoothstep,
  dot,
  normalize,
  pow,
} from 'three/tsl';
import { mountDemoBar, raf, pointer } from '../../src/lib/chrome.js';

mountDemoBar();

const canvas = document.getElementById('c');
const ptr = pointer(canvas);

// ── Renderer ─────────────────────────────────────────────────────────────────
// WebGPURenderer falls back to WebGL2 by itself when navigator.gpu is absent —
// the same TSL graph compiles to GLSL instead of WGSL, with no code change.
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
await renderer.init();

document.getElementById('backend').textContent =
  renderer.backend?.isWebGPUBackend ? 'WebGPU backend' : 'WebGL2 fallback';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07070c);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 5.2);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 2);
scene.add(key);
const rim = new THREE.DirectionalLight(0x66aaff, 2);
rim.position.set(-4, -1, -3);
scene.add(rim);

// ── Live uniforms ────────────────────────────────────────────────────────────
// uniform() returns a node whose .value you set from JavaScript. No location
// lookups, no per-frame setUniform calls.
const uFreq = uniform(1.5);
const uDisp = uniform(0.35);
const uSpeed = uniform(0.6);

// A shared time term, so every material below animates in step.
const t = time.mul(uSpeed);

// ── The materials ────────────────────────────────────────────────────────────

/** 1 · Displaced noise blob — vertex displacement plus a matching colour ramp. */
function noiseBlob() {
  const m = new THREE.MeshStandardNodeMaterial();

  // One noise sample reused by three slots. Nodes are values: naming one and
  // using it repeatedly compiles to a single evaluation, not three.
  const n = mx_fractal_noise_float(positionLocal.mul(uFreq).add(t), 3, 2.0, 0.5);

  m.positionNode = positionLocal.add(normalLocal.mul(n).mul(uDisp));
  m.colorNode = mix(vec3(0.05, 0.15, 0.5), vec3(0.9, 0.35, 0.15), n.mul(0.5).add(0.5));
  m.roughnessNode = n.abs().oneMinus().mul(0.7).add(0.15);
  m.metalnessNode = float(0.4);
  m.emissiveNode = vec3(0.15, 0.4, 1.0).mul(pow(n.max(0), 5).mul(2));
  return m;
}

/** 2 · Iridescent fresnel — colour that depends on the view angle. */
function iridescent() {
  const m = new THREE.MeshStandardNodeMaterial();

  // Fresnel: how grazing is this surface to the camera? 0 head-on, 1 at the rim.
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const fres = dot(normalWorld, viewDir).abs().oneMinus();

  // A thin-film style palette driven by that angle — the cosine trick again.
  const band = fres.mul(uFreq.mul(2)).add(t.mul(0.3));
  const irid = vec3(
    sin(band.mul(6.28)).mul(0.5).add(0.5),
    sin(band.mul(6.28).add(2.09)).mul(0.5).add(0.5),
    sin(band.mul(6.28).add(4.19)).mul(0.5).add(0.5)
  );

  const wobble = mx_noise_float(positionLocal.mul(uFreq.mul(2)).add(t.mul(0.5)));
  m.positionNode = positionLocal.add(normalLocal.mul(wobble).mul(uDisp.mul(0.5)));
  m.colorNode = mix(vec3(0.02, 0.02, 0.06), irid, pow(fres, 1.4));
  m.metalnessNode = float(1);
  m.roughnessNode = float(0.15);
  m.emissiveNode = irid.mul(pow(fres, 5)).mul(1.5);
  return m;
}

/** 3 · Procedural stripes — Fn() factors a shading idea into a reusable function. */
const stripes = Fn(([p, freq, width]) => {
  // fract() of a scaled coordinate is a sawtooth; smoothstep either side of it
  // gives an antialiased band without any texture.
  const s = fract(p.mul(freq));
  return smoothstep(width, width.add(0.08), abs(s.sub(0.5)).oneMinus());
});

function bandedMaterial() {
  const m = new THREE.MeshStandardNodeMaterial();
  const warp = mx_fractal_noise_float(positionLocal.mul(uFreq.mul(0.6)).add(t.mul(0.4)), 2);
  const band = stripes(positionLocal.y.add(warp.mul(uDisp.mul(3))), uFreq.mul(4), float(0.35));

  m.colorNode = mix(vec3(0.03, 0.05, 0.1), vec3(0.95, 0.75, 0.3), band);
  m.emissiveNode = vec3(1.0, 0.5, 0.1).mul(band).mul(0.6);
  m.roughnessNode = mix(float(0.9), float(0.15), band);
  m.metalnessNode = band;
  m.positionNode = positionLocal.add(normalLocal.mul(band.mul(uDisp).mul(0.25)));
  return m;
}

/** 4 · Contour lines from world-space height — an "unwrapped UV" free technique. */
function topographic() {
  const m = new THREE.MeshStandardNodeMaterial();
  const h = mx_fractal_noise_float(positionLocal.mul(uFreq).add(t.mul(0.2)), 4);
  const lines = fract(h.mul(uFreq.mul(5)));
  const edge = smoothstep(0.0, 0.06, lines).mul(smoothstep(1.0, 0.94, lines));

  m.positionNode = positionLocal.add(normalLocal.mul(h).mul(uDisp));
  m.colorNode = mix(vec3(0.9, 0.95, 1.0), vec3(0.04, 0.06, 0.12), edge);
  m.emissiveNode = vec3(0.3, 0.9, 0.8).mul(edge.oneMinus()).mul(0.8);
  m.roughnessNode = float(0.55);
  return m;
}

/** 5 · UV-space grid, to show that classic 2D shader work is unchanged. */
function uvGrid() {
  const m = new THREE.MeshStandardNodeMaterial();
  const g = uv().mul(uFreq.mul(8)).add(vec3(t, t.mul(0.5), 0).xy);
  const gx = smoothstep(0.05, 0.0, abs(fract(g.x).sub(0.5)).oneMinus().sub(0.94));
  const gy = smoothstep(0.05, 0.0, abs(fract(g.y).sub(0.5)).oneMinus().sub(0.94));
  const grid = gx.max(gy);

  m.colorNode = mix(vec3(0.02, 0.03, 0.07), vec3(0.2, 0.9, 1.0), grid);
  m.emissiveNode = vec3(0.1, 0.7, 1.0).mul(grid).mul(1.2);
  m.roughnessNode = float(0.3);
  m.metalnessNode = float(0.7);
  return m;
}

const MATERIALS = [
  ['noise blob', noiseBlob],
  ['iridescent', iridescent],
  ['banded', bandedMaterial],
  ['topographic', topographic],
  ['uv grid', uvGrid],
];

// A dense sphere: vertex displacement is only as smooth as the tessellation.
const geometry = new THREE.IcosahedronGeometry(1.5, 64);
const mesh = new THREE.Mesh(geometry, MATERIALS[0][1]());
scene.add(mesh);

// ── UI ───────────────────────────────────────────────────────────────────────
const chips = document.getElementById('materials');
chips.innerHTML = MATERIALS.map(
  ([name], i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${name}</button>`
).join('');

chips.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  for (const c of chips.children) c.setAttribute('aria-pressed', String(c === b));
  mesh.material.dispose();
  mesh.material = MATERIALS[b.dataset.i][1]();
  mesh.material.wireframe = wireOn;
});

function bind(id, node, scale, digits = 2) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    node.value = Number(input.value) * scale;
    out.textContent = node.value.toFixed(digits);
  };
  input.addEventListener('input', update);
  update();
}
bind('freq', uFreq, 0.01);
bind('disp', uDisp, 0.01);
bind('speed', uSpeed, 0.01);

let wireOn = false;
const wireBtn = document.getElementById('wire');
wireBtn.onclick = () => {
  wireOn = !wireOn;
  mesh.material.wireframe = wireOn;
  wireBtn.setAttribute('aria-pressed', String(wireOn));
};

let spinning = true;
const spinBtn = document.getElementById('spin');
spinBtn.onclick = () => {
  spinning = !spinning;
  spinBtn.setAttribute('aria-pressed', String(spinning));
};

// ── Resize & loop ────────────────────────────────────────────────────────────
const resize = () => {
  const { width, height } = canvas.getBoundingClientRect();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
};
new ResizeObserver(resize).observe(canvas);
resize();

raf((dt) => {
  if (spinning) mesh.rotation.y += dt * 0.25;
  // Ease the camera toward the pointer for a little parallax.
  camera.position.x += (ptr.nx * 1.4 - camera.position.x) * Math.min(1, dt * 3);
  camera.position.y += (ptr.ny * 1.0 - camera.position.y) * Math.min(1, dt * 3);
  camera.lookAt(0, 0, 0);
  renderer.renderAsync(scene, camera);
});
