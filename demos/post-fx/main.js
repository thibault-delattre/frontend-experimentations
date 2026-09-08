import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import {
  pass,
  uniform,
  vec2,
  vec3,
  vec4,
  float,
  screenUV,
  mix,
  dot,
  length,
  smoothstep,
  fract,
  sin,
  time,
  mx_noise_float,
  positionLocal,
  normalLocal,
} from 'three/tsl';
import { mountDemoBar, raf } from '../../src/lib/chrome.js';

mountDemoBar();

const canvas = document.getElementById('c');

const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
await renderer.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04050a);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 1.5, 8);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

scene.add(new THREE.AmbientLight(0x334466, 1));
const key = new THREE.DirectionalLight(0xffffff, 2);
key.position.set(4, 6, 3);
scene.add(key);

// ── Content: three swappable scenes ──────────────────────────────────────────
// Bloom only exists if something is brighter than 1.0, so every scene here has
// emissive values pushed well past it. That is the point of an HDR pipeline.
const groups = {};

function makeNeon() {
  const g = new THREE.Group();
  const geo = new THREE.TorusKnotGeometry(1.2, 0.28, 260, 40);
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.2, metalness: 0.9 });
  const n = mx_noise_float(positionLocal.mul(2).add(time.mul(0.4)));
  mat.colorNode = mix(vec3(0.02, 0.05, 0.12), vec3(0.1, 0.3, 0.6), n);
  // Emissive above 1.0 — this is what bloom picks up. Kept close to the
  // threshold rather than far past it, so the geometry stays readable instead
  // of blowing out to a white blob.
  mat.emissiveNode = mix(vec3(0.1, 0.6, 1.5), vec3(1.6, 0.25, 0.9), n.mul(0.5).add(0.5)).mul(0.9);
  g.add(new THREE.Mesh(geo, mat));

  for (let i = 0; i < 40; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicNodeMaterial({
        color: new THREE.Color().setHSL((i / 40) * 0.6 + 0.5, 1, 0.6).multiplyScalar(2.2),
      })
    );
    const a = (i / 40) * Math.PI * 2;
    s.position.set(Math.cos(a) * 3.4, Math.sin(a * 3) * 1.2, Math.sin(a) * 3.4);
    g.add(s);
  }
  return g;
}

function makeGrid() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.35, metalness: 0.8 });
  const h = mx_noise_float(positionLocal.mul(0.6).add(time.mul(0.25)));
  mat.positionNode = positionLocal.add(normalLocal.mul(h).mul(0.5));
  mat.emissiveNode = vec3(0.2, 1.2, 1.6).mul(h.max(0).pow(3)).mul(3);
  mat.colorNode = vec3(0.02, 0.03, 0.06);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(18, 18, 200, 200), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1.5;
  g.add(plane);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 64),
    new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(1, 0.35, 0.15).multiplyScalar(3) })
  );
  sun.position.set(0, 1.6, -9);
  g.add(sun);
  return g;
}

function makeSwarm() {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.16, 0);
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.1, metalness: 1 });
  mat.emissiveNode = vec3(1.4, 0.6, 2.0);
  const mesh = new THREE.InstancedMesh(geo, mat, 300);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 3;
    m.makeTranslation(Math.cos(a) * r, (Math.random() - 0.5) * 5, Math.sin(a) * r);
    mesh.setMatrixAt(i, m);
  }
  g.add(mesh);
  return g;
}

groups.neon = makeNeon();
groups.grid = makeGrid();
groups.swarm = makeSwarm();

let current = 'neon';
scene.add(groups.neon);

// ── Post-processing graph ────────────────────────────────────────────────────
const u = {
  bloomOn: uniform(1),
  bloomStr: uniform(0.55),
  bloomRad: uniform(0.6),
  bloomThr: uniform(0.88),
  caOn: uniform(1),
  ca: uniform(0.4),
  grainOn: uniform(1),
  grain: uniform(0.12),
  vigOn: uniform(1),
  vig: uniform(0.55),
  gradeOn: uniform(1),
  sat: uniform(1.15),
  con: uniform(1.08),
};

const scenePass = pass(scene, camera);
const colour = scenePass.getTextureNode();

// --- 1 · chromatic aberration, sampled from the scene texture ----------------
// Radial offset: zero in the centre, growing toward the corners, the way a real
// lens behaves. Done by re-sampling the pass at three shifted UVs.
const centred = screenUV.sub(0.5);
const caOffset = centred.mul(u.ca.mul(0.02).mul(u.caOn));
const aberrated = vec3(
  colour.sample(screenUV.add(caOffset)).r,
  colour.sample(screenUV).g,
  colour.sample(screenUV.sub(caOffset)).b
);

// --- 2 · bloom, in linear HDR, before anything else ---------------------------
const glow = bloom(colour, u.bloomStr, u.bloomRad, u.bloomThr);
let out = aberrated.add(glow.rgb.mul(u.bloomOn));

// --- 3 · grade: saturation is a lerp toward luminance, contrast a scale about 0.5
const lum = dot(out, vec3(0.2126, 0.7152, 0.0722));
const graded = mix(vec3(lum), out, u.sat).sub(0.5).mul(u.con).add(0.5);
out = mix(out, graded, u.gradeOn);

// --- 4 · vignette -------------------------------------------------------------
const vignette = smoothstep(0.9, 0.25, length(centred).mul(1.4));
out = out.mul(mix(float(1), vignette, u.vig.mul(u.vigOn)));

// --- 5 · grain, last, in display space ---------------------------------------
// A hash of screen position and time. Signed, so it neither darkens nor
// brightens the image on average.
const noise = fract(sin(dot(screenUV.mul(vec2(1920, 1080)).add(time.mul(120)), vec2(12.9898, 78.233))).mul(43758.5453));
out = out.add(noise.sub(0.5).mul(u.grain.mul(u.grainOn).mul(0.2)));

// PostProcessing was renamed RenderPipeline in r183; the old name still works
// but logs a deprecation warning.
const post = new THREE.RenderPipeline(renderer);
post.outputNode = vec4(out, 1);

// ── UI ───────────────────────────────────────────────────────────────────────
const scenes = document.getElementById('scenes');
scenes.innerHTML = Object.keys(groups)
  .map((k, i) => `<button type="button" data-k="${k}" aria-pressed="${i === 0}">${k}</button>`)
  .join('');
scenes.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.dataset.k === current) return;
  for (const c of scenes.children) c.setAttribute('aria-pressed', String(c === b));
  scene.remove(groups[current]);
  current = b.dataset.k;
  scene.add(groups[current]);
});

function slider(id, node, scale, digits = 2) {
  const input = document.getElementById(id);
  const out2 = document.getElementById(`${id}-out`);
  const update = () => {
    node.value = Number(input.value) * scale;
    out2.textContent = node.value.toFixed(digits);
  };
  input.addEventListener('input', update);
  update();
}
slider('b-str', u.bloomStr, 0.01);
slider('b-rad', u.bloomRad, 0.01);
slider('b-thr', u.bloomThr, 0.01);
slider('ca', u.ca, 0.01);
slider('grain', u.grain, 0.01);
slider('vig', u.vig, 0.01);
slider('sat', u.sat, 0.01);
slider('con', u.con, 0.01);

// Toggles multiply their effect's contribution by 0 or 1, so switching one off
// costs nothing at runtime but does not require rebuilding the graph either.
const toggle = (id, node) => {
  const el = document.getElementById(id);
  el.addEventListener('change', () => (node.value = el.checked ? 1 : 0));
};
toggle('t-bloom', u.bloomOn);
toggle('t-ca', u.caOn);
toggle('t-grain', u.grainOn);
toggle('t-vig', u.vigOn);
toggle('t-grade', u.gradeOn);

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
  groups[current].rotation.y += dt * 0.12;
  controls.update();
  // post.render() replaces renderer.render() — the pass node draws the scene.
  post.render();
});
