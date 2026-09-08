# frontend-experimentations

A gallery of modern frontend effects — **21 self-contained pages**, one per
technique, each written to be read and copy-pasted rather than installed.

Every page lives in `demos/<slug>/` as one HTML file, one ES module and its own
inline `<style>`. Nothing is shared between demos except design tokens, so you
can lift a folder out wholesale and it will still work.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Requires Node 20+. Vite builds every `demos/*/index.html` as its own entry, so
adding a demo is: make the folder, add an entry to `src/lib/registry.js`.

---

## What's in here

### Modern CSS — no runtime at all

| Demo | Technique |
| --- | --- |
| [Scroll-Driven Animations](demos/scroll-driven/) | `animation-timeline: scroll()` / `view()`, named timelines, `animation-trigger`. Zero JavaScript on the page. |
| [View Transitions](demos/view-transitions/) | `startViewTransition()`, shared `view-transition-name` morphs, list reordering, cross-document setup. |
| [Anchor Positioning](demos/anchor-positioning/) | `anchor-name` / `position-area` / `position-try-fallbacks`, `anchor-size()`, Popover API, `@starting-style`. |
| [Liquid Glass](demos/liquid-glass/) | `backdrop-filter` + SVG `feDisplacementMap` refraction, chromatic rim, gooey merge. |
| [Kinetic Typography](demos/kinetic-type/) | Variable-font axes driven by scroll and pointer proximity, per-character stagger from one custom property. |
| [Bento Grid & Container Queries](demos/bento-grid/) | Container queries and `cqi` units, subgrid, `@container scroll-state(stuck: top)`. |
| [Modern Colour](demos/color-systems/) | OKLCH ramps, relative colour syntax, `color-mix()`, interpolation spaces, P3, `light-dark()`. |
| [Gooey Morphing](demos/gooey-morph/) | The `feGaussianBlur` + `feColorMatrix` alpha-ramp trick, turbulence displacement, film grain. |
| [CSS 3D Space](demos/css-3d/) | `perspective`, `preserve-3d`, z-layered parallax, `backface-visibility`, scroll-driven coverflow. |
| [Text Effects Lab](demos/text-effects/) | Nine headline treatments: shine, pointer spotlight mask, glitch, blur-in, neon, scramble, `@property` gradients. |

### Canvas 2D

| Demo | Technique |
| --- | --- |
| [Particle Field](demos/particle-field/) | 120k particles in a flow field from one `Float32Array`, written as raw pixels into `ImageData`. |
| [ASCII Renderer](demos/ascii-render/) | Luminance-to-glyph mapping with a measured monospace cell ratio. Works on a procedural 3D scene or your webcam. |

### WebGL & shaders — no dependencies

| Demo | Technique |
| --- | --- |
| [Fragment Shader Lab](demos/shader-lab/) | Live-editable WebGL2 harness with five presets: domain warping, SDFs, raymarching, plasma, voronoi. Recompiles as you type. |
| [Image Displacement](demos/image-displacement/) | Pointer-driven displacement, chromatic split, and four noise-map slide transitions. |

### WebGPU & Three.js

| Demo | Technique |
| --- | --- |
| [TSL Node Materials](demos/tsl-material/) | Three Shading Language — shaders as chained JS nodes compiling to WGSL or GLSL. Five materials. |
| [GPU Compute Particles](demos/gpu-particles/) | Up to 256k particles integrated in a WebGPU compute shader. Curl noise, Lorenz, vortex, gravity wells. |
| [Glass & Dispersion](demos/glass-refraction/) | Physical transmission, thickness, iridescence and chromatic dispersion over live scene content. |
| [Post-Processing Stack](demos/post-fx/) | Bloom, chromatic aberration, grain, vignette and grading as TSL nodes on one output node. |

### Motion libraries

| Demo | Technique |
| --- | --- |
| [GSAP ScrollTrigger](demos/gsap-scrolltrigger/) | Pinning, scrubbed timelines, snapping, horizontal scroll, counters, split text. |
| [Springs & Layout](demos/spring-ui/) | Motion springs, drag with release velocity, shared-layout FLIP morphing, `hover()` / `press()` gestures. |
| [Smooth Scroll & Parallax](demos/smooth-scroll/) | Lenis virtual scroll feeding parallax, velocity skew and a sticky depth stack from one rAF loop. |

---

## Conventions every demo follows

- **The comments are the tutorial.** Each page explains the technique inline,
  including the failure modes — why `overflow: hidden` breaks a scroll timeline,
  why displaced vertices light wrongly, why two glass meshes cannot refract each
  other.
- **`prefers-reduced-motion` is honoured**, and it means *less motion*, not
  *no feedback*.
- **Graceful degradation.** Features are behind `@supports` or a capability
  check; when WebGPU is absent the Three.js demos fall back to WebGL2 and say so
  on screen.
- **Dark-first**, OKLCH tokens, elevation by lightness rather than shadow.
- **No build-time magic.** No preprocessor, no CSS framework, no component
  library. What you read is what runs.

## Shared code

There is deliberately very little:

- `src/styles/base.css` — design tokens and reset.
- `src/lib/registry.js` — the demo list, used by the home page and the top bar.
- `src/lib/chrome.js` — the demo top bar, plus four helpers most canvas demos
  want: `autoResize`, `raf` (delta-clamped), `pointer`, `reducedMotion`.

## Browser support

Built against the 2026 evergreen baseline. The CSS demos degrade to a static but
correct state in older engines. WebGPU compute (`demos/gpu-particles/`) needs
Chrome, Edge, or Safari 26+; everything else runs on WebGL2.
