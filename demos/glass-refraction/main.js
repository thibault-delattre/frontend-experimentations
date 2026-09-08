import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mountDemoBar, raf } from '../../src/lib/chrome.js';

mountDemoBar();

const canvas = document.getElementById('c');

const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
await renderer.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.6, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 14;

// ── Environment ──────────────────────────────────────────────────────────────
// Transmission and reflection both sample scene.environment. Without one, glass
// renders black — this is the most common "my glass is invisible" cause.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.8;

// ── Something to refract ─────────────────────────────────────────────────────
// Glass is only interesting over busy content: the effect *is* the distortion
// of what is behind it.
const backdrop = new THREE.Group();
scene.add(backdrop);

const shapes = [
  new THREE.TorusKnotGeometry(0.35, 0.12, 90, 12),
  new THREE.IcosahedronGeometry(0.36, 0),
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.ConeGeometry(0.35, 0.7, 32),
];

for (let i = 0; i < 34; i++) {
  const geo = shapes[i % shapes.length];
  const mat = new THREE.MeshStandardNodeMaterial({
    color: new THREE.Color().setHSL((i * 0.11) % 1, 0.7, 0.55),
    roughness: 0.25,
    metalness: 0.35,
    emissive: new THREE.Color().setHSL((i * 0.11) % 1, 0.9, 0.2),
    emissiveIntensity: 0.4,
  });
  const m = new THREE.Mesh(geo, mat);
  const a = (i / 34) * Math.PI * 2;
  const r = 2.6 + (i % 3) * 0.9;
  m.position.set(Math.cos(a) * r, ((i % 7) - 3) * 0.55, Math.sin(a) * r - 1.5);
  m.rotation.set(Math.random() * 6, Math.random() * 6, 0);
  m.userData.spin = 0.15 + Math.random() * 0.5;
  backdrop.add(m);
}

const grid = new THREE.GridHelper(30, 40, 0x334466, 0x1a2233);
grid.position.y = -3;
scene.add(grid);

// A bright, high-frequency wall directly behind the glass. Without something
// like this the mesh mostly refracts empty background and reads as a dark ball
// — the effect is entirely a function of what is behind it.
function backdropTexture(size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = '#0b0b16';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 26; i++) {
    const hue = (i * 37) % 360;
    x.strokeStyle = `oklch(68% 0.22 ${hue})`;
    x.lineWidth = 6 + (i % 4) * 8;
    x.beginPath();
    x.moveTo(-50, (i / 26) * size + 20);
    x.bezierCurveTo(size * 0.3, (i / 26) * size - 180, size * 0.7, (i / 26) * size + 220, size + 50, (i / 26) * size);
    x.stroke();
  }
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `oklch(72% 0.2 ${(i * 53) % 360} / 0.8)`;
    x.beginPath();
    x.arc(Math.random() * size, Math.random() * size, 6 + Math.random() * 22, 0, 6.283);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(26, 16),
  new THREE.MeshBasicNodeMaterial({ map: backdropTexture() })
);
wall.position.set(0, 0, -7);
scene.add(wall);

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 6, 4);
scene.add(key);

// ── The glass ────────────────────────────────────────────────────────────────
const glass = new THREE.MeshPhysicalNodeMaterial({
  transmission: 1,
  ior: 1.52,
  thickness: 1.5,
  roughness: 0.04,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  dispersion: 0.45,
  iridescence: 0.2,
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [100, 480],
  attenuationColor: new THREE.Color().setHSL(205 / 360, 0.6, 0.7),
  attenuationDistance: 2.5,
  // Transparent + depthWrite:false would sort badly here; transmission handles
  // the see-through part itself, so the mesh stays a normal opaque draw.
  side: THREE.FrontSide,
});

const GEOMETRIES = {
  sphere: () => new THREE.IcosahedronGeometry(1.5, 24),
  torus: () => new THREE.TorusKnotGeometry(1.05, 0.38, 220, 48),
  prism: () => new THREE.CylinderGeometry(1.3, 1.3, 1.8, 3, 1),
  gem: () => new THREE.OctahedronGeometry(1.6, 0),
  lens: () => new THREE.SphereGeometry(1.6, 96, 96).scale(1, 1, 0.35),
};

const hero = new THREE.Mesh(GEOMETRIES.sphere(), glass);
scene.add(hero);

// ── UI ───────────────────────────────────────────────────────────────────────
const shapeBar = document.getElementById('shapes');
shapeBar.innerHTML = Object.keys(GEOMETRIES)
  .map((k, i) => `<button type="button" data-k="${k}" aria-pressed="${i === 0}">${k}</button>`)
  .join('');
shapeBar.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  for (const c of shapeBar.children) c.setAttribute('aria-pressed', String(c === b));
  hero.geometry.dispose();
  hero.geometry = GEOMETRIES[b.dataset.k]();
});

const sliders = {};
function bind(id, apply, format) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(input.value));
    out.textContent = format(Number(input.value));
  };
  input.addEventListener('input', update);
  sliders[id] = { input, update };
  update();
}

bind('ior', (v) => (glass.ior = v / 100), (v) => (v / 100).toFixed(2));
bind('thick', (v) => (glass.thickness = v / 100), (v) => (v / 100).toFixed(2));
bind('rough', (v) => (glass.roughness = v / 100), (v) => (v / 100).toFixed(2));
bind('disp', (v) => (glass.dispersion = v / 100), (v) => (v / 100).toFixed(2));
bind('irid', (v) => (glass.iridescence = v / 100), (v) => (v / 100).toFixed(2));
bind('tint', (v) => glass.attenuationColor.setHSL(v / 360, 0.6, 0.7), (v) => `${v}°`);

/** Applies a set of slider values at once, so presets go through the same path. */
function applyPreset(values, btnId) {
  for (const [id, value] of Object.entries(values)) {
    sliders[id].input.value = value;
    sliders[id].update();
  }
  for (const b of document.querySelectorAll('.chips button[id^="preset-"]')) {
    b.setAttribute('aria-pressed', String(b.id === btnId));
  }
}

document.getElementById('preset-glass').onclick = () =>
  applyPreset({ ior: 152, thick: 150, rough: 4, disp: 45, irid: 20, tint: 205 }, 'preset-glass');
document.getElementById('preset-diamond').onclick = () =>
  applyPreset({ ior: 242, thick: 220, rough: 0, disp: 180, irid: 5, tint: 45 }, 'preset-diamond');
document.getElementById('preset-water').onclick = () =>
  applyPreset({ ior: 133, thick: 90, rough: 38, disp: 10, irid: 60, tint: 190 }, 'preset-water');

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
  backdrop.rotation.y += dt * 0.06;
  for (const m of backdrop.children) {
    m.rotation.x += dt * m.userData.spin;
    m.rotation.y += dt * m.userData.spin * 0.7;
  }
  hero.rotation.y += dt * 0.18;
  hero.rotation.x = Math.sin(performance.now() * 0.0002) * 0.25;
  controls.update();
  renderer.render(scene, camera);
});
