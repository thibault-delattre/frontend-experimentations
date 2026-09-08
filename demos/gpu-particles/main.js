import * as THREE from 'three/webgpu';
import {
  Fn,
  If,
  instanceIndex,
  instancedArray,
  uniform,
  hash,
  deltaTime,
  time,
  vec2,
  vec3,
  vec4,
  float,
  uv,
  mix,
  length,
  normalize,
  cross,
  smoothstep,
  mx_noise_vec3,
  sin,
  cos,
  clamp,
  max,
} from 'three/tsl';
import { mountDemoBar, raf, pointer, warn } from '../../src/lib/chrome.js';

mountDemoBar();

const canvas = document.getElementById('c');
const ptr = pointer(canvas);

const renderer = new THREE.WebGPURenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
await renderer.init();

const isWebGPU = Boolean(renderer.backend?.isWebGPUBackend);
if (!isWebGPU) {
  warn(
    'Compute shaders require WebGPU, and this browser fell back to WebGL2. The scene will render but the simulation will not advance. Try Chrome, Edge, or Safari 26+.'
  );
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04040a);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 0, 14);

// ── Simulation state ─────────────────────────────────────────────────────────
// Sized for the maximum; the count uniform below limits how many are drawn, so
// changing it never reallocates a buffer.
const MAX = 262144; // 2^18

const positions = instancedArray(MAX, 'vec3');
const velocities = instancedArray(MAX, 'vec3');
const seeds = instancedArray(MAX, 'float');

// ── Uniforms shared by both stages ───────────────────────────────────────────
const uMode = uniform(0);
const uForce = uniform(0.8);
const uDamp = uniform(0.96);
const uSize = uniform(0.06);
const uPointer = uniform(new THREE.Vector3());
const uAttract = uniform(1);
// Bumped on respawn so recycled particles do not all land on the same point.
const uSeed = uniform(1);

/** Three decorrelated hashes from one index — the standard GPU RNG trick. */
const rand3 = (i) => vec3(hash(i.mul(3)), hash(i.mul(3).add(1)), hash(i.mul(3).add(2)));

// ── Kernel 1 · seed the buffers (dispatched once) ────────────────────────────
const initCompute = Fn(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  const s = seeds.element(instanceIndex);

  // Uniform inside a ball, not a cube: a cube's corners are visibly denser.
  const r = rand3(instanceIndex).sub(0.5).mul(2);
  p.assign(normalize(r.add(0.0001)).mul(hash(instanceIndex).pow(1 / 3).mul(6)));
  v.assign(vec3(0));
  s.assign(hash(instanceIndex.add(9973)));
})().compute(MAX);

await renderer.computeAsync(initCompute);

// ── Kernel 2 · advance one step (dispatched every frame) ─────────────────────
const updateCompute = Fn(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  const s = seeds.element(instanceIndex);

  // A fixed cap on dt: a backgrounded tab resumes with a huge delta that would
  // otherwise fling every particle to infinity in one step.
  const dt = clamp(deltaTime, float(0), float(0.033));
  const force = vec3(0).toVar();

  // --- mode 0 · curl noise --------------------------------------------------
  // The curl of a noise field is divergence-free, so particles swirl forever
  // without clumping or leaving voids. Approximated by finite differences.
  If(uMode.equal(0), () => {
    const e = float(0.12);
    const q = p.mul(0.42).add(vec3(0, 0, time.mul(0.1)));
    const n1 = mx_noise_vec3(q);
    const n2 = mx_noise_vec3(q.add(vec3(e, 0, 0)));
    const n3 = mx_noise_vec3(q.add(vec3(0, e, 0)));
    // The differences are on the order of 0.01, so the multiplier has to be
    // large for this to read as motion rather than a slow drift.
    const curl = cross(n2.sub(n1), n3.sub(n1)).mul(900);
    force.assign(curl);
  });

  // --- mode 1 · Lorenz attractor -------------------------------------------
  If(uMode.equal(1), () => {
    const sc = float(0.12);
    const x = p.x.div(sc);
    const y = p.y.div(sc);
    const z = p.z.div(sc).add(25);
    force.assign(
      vec3(
        y.sub(x).mul(10),
        x.mul(float(28).sub(z)).sub(y),
        x.mul(y).sub(z.mul(8 / 3))
      ).mul(sc).mul(0.35)
    );
    // The attractor is its own velocity field, so damp hard toward it.
    v.mulAssign(0.86);
  });

  // --- mode 2 · vortex ------------------------------------------------------
  If(uMode.equal(2), () => {
    const radial = vec3(p.x, 0, p.z);
    const r = max(length(radial), 0.001);
    const tangent = vec3(radial.z.negate(), 0, radial.x).div(r);
    force.assign(
      tangent.mul(float(9).div(r.add(1)))          // swirl, stronger near the axis
        .add(radial.div(r).mul(r.sub(5).mul(-0.6))) // pull toward a radius of 5
        .add(vec3(0, p.y.mul(-1.2), 0))             // flatten toward the plane
    );
  });

  // --- mode 3 · orbiting gravity wells -------------------------------------
  If(uMode.equal(3), () => {
    const acc = vec3(0).toVar();
    for (let i = 0; i < 3; i++) {
      const a = time.mul(0.3 + i * 0.11).add(i * 2.1);
      const well = vec3(cos(a).mul(4.5), sin(a.mul(1.3)).mul(3), sin(a).mul(4.5));
      const d = well.sub(p);
      const r2 = d.dot(d).add(1.2); // softened core — no singularity
      acc.addAssign(d.div(r2.sqrt().mul(r2)).mul(45));
    }
    force.assign(acc);
  });

  // --- pointer interaction (all modes) --------------------------------------
  const toPtr = uPointer.sub(p);
  const pd2 = toPtr.dot(toPtr).add(0.6);
  force.addAssign(toPtr.div(pd2).mul(uAttract).mul(40));

  // A per-particle speed multiplier keeps the flow from looking like one sheet.
  v.addAssign(force.mul(uForce).mul(dt).mul(s.mul(0.6).add(0.7)));
  v.mulAssign(uDamp);
  p.addAssign(v.mul(dt));

  // Recycle anything that escapes, rather than letting the cloud thin out.
  If(length(p).greaterThan(26), () => {
    p.assign(normalize(rand3(instanceIndex).sub(0.5).add(uSeed.mul(0.017).sin())).mul(2));
    v.assign(vec3(0));
  });
})().compute(MAX);

// ── Render material ──────────────────────────────────────────────────────────
const material = new THREE.SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// The draw stage reads the very same buffers the compute stage wrote.
material.positionNode = positions.toAttribute();
material.scaleNode = vec2(uSize, uSize);

const vel = velocities.toAttribute();
const speed = length(vel);

// Colour by speed: slow particles cool and dim, fast ones hot and bright.
const heat = smoothstep(0, 6, speed);
const tint = mix(vec3(0.12, 0.35, 1.0), vec3(1.0, 0.55, 0.15), heat).add(
  vec3(0.6, 0.9, 1.0).mul(heat.pow(4))
);

// A soft round sprite, cut from the quad's own UVs. No texture needed.
const d = length(uv().sub(0.5));
const alpha = smoothstep(0.5, 0.06, d);

material.colorNode = vec4(tint, alpha.mul(0.28));

const particles = new THREE.Sprite(material);
particles.count = MAX; // any Object3D with .count is drawn instanced
particles.frustumCulled = false;
scene.add(particles);

// ── UI ───────────────────────────────────────────────────────────────────────
const MODES = ['curl noise', 'lorenz', 'vortex', 'gravity wells'];
const modes = document.getElementById('modes');
modes.innerHTML = MODES.map(
  (m, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${m}</button>`
).join('');
modes.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  for (const c of modes.children) c.setAttribute('aria-pressed', String(c === b));
  uMode.value = Number(b.dataset.i);
});

function bind(id, apply, format) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(input.value));
    out.textContent = format(Number(input.value));
  };
  input.addEventListener('input', update);
  update();
}

// Counts are powers of two so the dispatch stays workgroup-aligned.
const countFor = (v) => Math.min(2 ** (11 + v), MAX); // 4k … 256k
let drawCount = MAX;
bind(
  'count',
  (v) => {
    drawCount = countFor(v);
    particles.count = drawCount;
  },
  (v) => `${(countFor(v) / 1024).toFixed(0)}k`
);
bind('force', (v) => (uForce.value = v / 100), (v) => (v / 100).toFixed(2));
bind('damp', (v) => (uDamp.value = v / 100), (v) => (v / 100).toFixed(2));
bind('size', (v) => (uSize.value = v / 100), (v) => (v / 100).toFixed(2));

document.getElementById('reset').onclick = () => {
  uSeed.value = (uSeed.value * 7919 + 13) % 100000;
  renderer.computeAsync(initCompute);
};

const attractBtn = document.getElementById('attract');
attractBtn.onclick = () => {
  const on = attractBtn.getAttribute('aria-pressed') === 'true';
  attractBtn.setAttribute('aria-pressed', String(!on));
  uAttract.value = on ? -1 : 1;
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

const statEl = document.getElementById('stat');
const raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const raycaster = new THREE.Raycaster();
const hit = new THREE.Vector3();

let frames = 0;
let acc = 0;
let orbit = 0;

raf((dt) => {
  // Project the pointer onto the z = 0 plane so it is a real world-space force.
  raycaster.setFromCamera(new THREE.Vector2(ptr.nx, ptr.ny), camera);
  if (raycaster.ray.intersectPlane(raycastPlane, hit)) uPointer.value.copy(hit);

  orbit += dt * 0.08;
  camera.position.set(Math.sin(orbit) * 15, Math.sin(orbit * 0.6) * 3.5, Math.cos(orbit) * 15);
  camera.lookAt(0, 0, 0);

  if (isWebGPU) renderer.compute(updateCompute);
  renderer.render(scene, camera);

  frames++;
  acc += dt;
  if (acc >= 0.5) {
    statEl.innerHTML = `<b>${Math.round(frames / acc)}</b> fps<br><b>${(drawCount / 1024).toFixed(0)}k</b> particles<br>${
      isWebGPU ? 'WebGPU compute' : 'WebGL2 — no compute'
    }`;
    frames = 0;
    acc = 0;
  }
});
