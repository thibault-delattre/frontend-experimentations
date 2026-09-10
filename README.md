# frontend-experimentations

A gallery of modern frontend technique — **37 self-contained pages**, one per
topic, each written to be read and copy-pasted rather than installed.

Every page lives in `demos/<slug>/` as one HTML file, one ES module and its own
inline `<style>`. Nothing is shared between demos except design tokens, so you
can lift a folder out wholesale and it will still work.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Requires Node 20+. Vite builds every `demos/*/index.html` as its own entry, so
adding a demo is: make the folder, add an entry to `src/lib/registry.js`, add a
prompt to `src/lib/fx.js`.

---

## ✦ A dictionary of effects, each with its own AI prompt

This is what makes the repo reusable rather than just readable. The unit is a
**single effect**, not a page: one magnetic button, one gooey filter, one
shimmer. Open any demo, hover an individual effect, and a small `✦ prompt`
badge appears — click it to copy the brief that recreates *that exact thing*.

**153 effects across all 37 demos**, each individually addressable.

Paste it into Claude, ChatGPT, Cursor or v0 and you get a working,
self-contained implementation back. The prompts never reference this repo, this
file, or a neighbouring effect, so they survive being pasted into a cold chat.

**How it works.** Any element carrying `data-fx="<id>"` is resolved as
`<demo-slug>/<id>` against [`src/lib/fx.js`](src/lib/fx.js), and gets a badge
automatically. Adding a new effect to the dictionary is two steps:

```html
<div class="my-effect" data-fx="my-effect">…</div>
```

```js
// src/lib/fx.js
'my-demo/my-effect': fx('Human-readable title', `Build … The mechanism: …`),
```

A `data-fx` with no matching entry logs a console warning rather than silently
rendering nothing — an authoring mistake should be loud.

**How the prompts are written.** Each one names the *mechanism* explicitly,
because that is what decides the quality of the output. "Make a button that
reacts to the cursor" produces a hover state; "translate the element by a
fraction of the cursor's offset once inside a radius, and lerp it back on exit"
produces the actual effect. Every number, property name and failure mode in
them is load-bearing, and a shared constraints block keeps the output vanilla,
accessible and compositor-friendly.

---

## What's in here

### Design craft — the unglamorous half

Nothing here is a "wow" effect. Together they are most of the difference
between a page that looks designed and one that looks assembled.

| Demo | Technique |
| --- | --- |
| [Typography System](demos/type-scale/) | A fluid modular scale from one ratio, measure, baseline rhythm, `text-wrap: balance`/`pretty`, tabular and old-style numerals. |
| [Layout Primitives](demos/layout-primitives/) | Stack, cluster, sidebar, switcher, cover, reel — six intrinsic layouts, zero media queries, each with a live resize handle. |
| [Shadows, Light & Depth](demos/elevation/) | Why one `box-shadow` looks cheap: layered penumbra, a shared draggable light source, tinted shadows, contact shadows, dark-mode rim highlights. |
| [Palette Construction](demos/color-harmony/) | A full palette from one seed hue — harmony maths, chroma tapering, tinted neutrals, semantic roles and live APCA + WCAG contrast checks. |
| [Micro-Interactions](demos/micro-interactions/) | All seven control states, asymmetric timing, magnetic buttons, ripples, drawn ticks, a morphing submit and a sliding segmented control. |
| [Noise & Texture](demos/noise-texture/) | Grain that de-bands gradients, mesh gradients, Bayer dithering, halftone, paper fibre, CRT — and which blend mode each needs. |
| [Borders & Glow](demos/borders-glow/) | Gradient borders via `mask-composite: exclude`, rotating conic outlines with `@property`, spotlight cards, rim highlights, focus-ring rules. |
| [Image Treatment](demos/image-treatment/) | Duotone two ways, a blend-mode matrix, gradient masks, `clip-path` reveals, Ken Burns, `:has()` sibling dimming, blur-up with `decode()`. |
| [Theming & Dark Mode](demos/theming/) | A three-tier token architecture, the anti-flash inline script, a view-transition theme swap from the click point, live contrast audit. |
| [Easing & Timing](demos/easing-lab/) | Every curve plotted *and* played from the same function, a bezier editor, springs with `linear()` output, and the interruption problem. |
| [Loading & Empty States](demos/loading-states/) | Skeletons that match their content, the real timing thresholds, honest progress, optimistic UI with visible rollback, empty-state design. |
| [Cursor & Pointer](demos/cursor-fx/) | Custom cursors, context awareness, magnetic pull, a canvas trail, spotlight masks — and the touch-device gate that makes it shippable. |

### Overlays & navigation — native-first interaction patterns

| Demo | Technique |
| --- | --- |
| [Dialogs & Drawers](demos/dialog/) | Native modal focus behavior, discrete entry/exit transitions, side drawers, and a velocity-aware drag-to-dismiss sheet. |
| [Toasts & Notifications](demos/toast/) | A bounded queue, coalesced duplicates, honest pauseable timers, live-region announcements, and swipe dismissal. |
| [Command Palette](demos/command-palette/) | The ⌘K pattern with stable fuzzy scoring, highlighted matches, grouped results, and the combobox/listbox keyboard model. |
| [Menus & Disclosure](demos/menus/) | Popover action menus with roving focus, diagonal-safe mega-menu intent, and exclusive native details accordions. |

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
  other, why a skeleton that does not match its content is worse than nothing.
- **`prefers-reduced-motion` is honoured**, and it means *less motion*, not
  *no feedback*.
- **Graceful degradation.** Features sit behind `@supports` or a capability
  check; when WebGPU is absent the Three.js demos fall back to WebGL2 and say so
  on screen; the cursor demos disable themselves entirely without a fine pointer.
- **Dark-first**, OKLCH tokens, elevation by lightness rather than shadow.
- **No build-time magic.** No preprocessor, no CSS framework, no component
  library. What you read is what runs.

## Shared code

There is deliberately very little:

- `src/styles/base.css` — design tokens, reset and the prompt dialog.
- `src/lib/registry.js` — the demo list, used by the home page and the top bar.
- `src/lib/fx.js` — the effect dictionary: one AI prompt per individual effect,
  keyed `<demo-slug>/<data-fx id>`.
- `src/lib/chrome.js` — the demo top bar, the per-effect prompt badges and their
  dialog, plus four helpers most canvas demos want: `autoResize`, `raf`
  (delta-clamped), `pointer`, `reducedMotion`.

## Browser support

Built against the 2026 evergreen baseline. The CSS demos degrade to a static but
correct state in older engines. WebGPU compute (`demos/gpu-particles/`) needs
Chrome, Edge, or Safari 26+; everything else runs on WebGL2.
