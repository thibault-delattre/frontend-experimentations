/**
 * Single source of truth for the gallery.
 * The home page renders cards from this; each demo page reads its own entry
 * to build the top bar. Add a folder in demos/<slug>/ and an entry here.
 */

export const CATEGORIES = {
  craft: { label: 'Design Craft', hue: 55 },
  css: { label: 'Modern CSS', hue: 265 },
  canvas: { label: 'Canvas 2D', hue: 175 },
  webgl: { label: 'WebGL & Shaders', hue: 25 },
  webgpu: { label: 'WebGPU & Three.js', hue: 320 },
  motion: { label: 'Motion Libraries', hue: 95 },
};

export const DEMOS = [
  // --- Design craft -------------------------------------------------------
  // The unglamorous half. Nothing here is a "wow" effect; together they are
  // most of the difference between a page that looks designed and one that
  // looks assembled.
  {
    slug: 'type-scale',
    title: 'Typography System',
    category: 'craft',
    blurb:
      'A fluid modular scale, measure, vertical rhythm, optical sizing and the wrapping rules that make text look set rather than dumped.',
    tags: ['type', 'clamp()', 'rhythm'],
  },
  {
    slug: 'layout-primitives',
    title: 'Layout Primitives',
    category: 'craft',
    blurb:
      'Stack, cluster, sidebar, switcher, cover and reel — six intrinsic layouts that respond without a single media query.',
    tags: ['layout', 'flexbox', 'no media queries'],
  },
  {
    slug: 'elevation',
    title: 'Shadows, Light & Depth',
    category: 'craft',
    blurb:
      'Why one box-shadow always looks cheap: layered penumbra, a consistent light source, tinted shadows and contact occlusion.',
    tags: ['shadow', 'depth', 'craft'],
  },
  {
    slug: 'color-harmony',
    title: 'Palette Construction',
    category: 'craft',
    blurb:
      'Build a full palette from one seed hue: harmony rules, semantic roles, tinted neutrals and a live APCA contrast check.',
    tags: ['colour', 'palette', 'contrast'],
  },
  {
    slug: 'micro-interactions',
    title: 'Micro-Interactions',
    category: 'craft',
    blurb:
      'Buttons, toggles, checkboxes and inputs with real state choreography — magnetic pull, ripple, and press physics.',
    tags: ['ui', 'states', 'feedback'],
  },
  {
    slug: 'noise-texture',
    title: 'Noise & Texture',
    category: 'craft',
    blurb:
      'Grain overlays, mesh gradients, dithering, halftone and paper fibre — the cheapest way to stop a flat page looking flat.',
    tags: ['texture', 'grain', 'gradient'],
  },
  {
    slug: 'borders-glow',
    title: 'Borders & Glow',
    category: 'craft',
    blurb:
      'Gradient borders, rotating conic outlines, spotlight cards, inner rims and the mask trick that makes them all possible.',
    tags: ['border', 'mask', 'glow'],
  },
  {
    slug: 'image-treatment',
    title: 'Image Treatment',
    category: 'craft',
    blurb:
      'Duotone, blend modes, clip-path reveals, gradient masks, Ken Burns and the aspect-ratio rules that stop layout shift.',
    tags: ['image', 'blend', 'clip-path'],
  },
  {
    slug: 'theming',
    title: 'Theming & Dark Mode',
    category: 'craft',
    blurb:
      'A token architecture that survives contact with a real product, plus a theme switch that animates from the click point.',
    tags: ['tokens', 'dark mode', 'light-dark()'],
  },
  {
    slug: 'easing-lab',
    title: 'Easing & Timing',
    category: 'craft',
    blurb:
      'Every curve plotted, played and compared side by side, with the duration and easing rules that make motion feel designed.',
    tags: ['motion', 'easing', 'timing'],
  },
  {
    slug: 'loading-states',
    title: 'Loading & Empty States',
    category: 'craft',
    blurb:
      'Skeletons that match their content, progress that never lies, optimistic updates and the timing thresholds behind each.',
    tags: ['ux', 'skeleton', 'progress'],
  },
  {
    slug: 'cursor-fx',
    title: 'Cursor & Pointer',
    category: 'craft',
    blurb:
      'Custom cursors, magnetic buttons, trailing followers and blend-mode inversion — with the touch-device fallbacks.',
    tags: ['cursor', 'pointer', 'hover'],
  },

  // --- Modern CSS ---------------------------------------------------------
  {
    slug: 'scroll-driven',
    title: 'Scroll-Driven Animations',
    category: 'css',
    blurb:
      'Progress bars, parallax and reveal-on-scroll with zero JavaScript, using animation-timeline: scroll() and view().',
    tags: ['css', 'no-js', 'baseline 2025'],
  },
  {
    slug: 'view-transitions',
    title: 'View Transitions',
    category: 'css',
    blurb:
      'Morph one element into another across state changes and across documents with startViewTransition() and view-transition-name.',
    tags: ['css', 'api', 'spa + mpa'],
  },
  {
    slug: 'anchor-positioning',
    title: 'Anchor Positioning',
    category: 'css',
    blurb:
      'Tooltips and menus that tether to a trigger and flip themselves away from the viewport edge — no positioning library.',
    tags: ['css', 'popover', 'position-try'],
  },
  {
    slug: 'liquid-glass',
    title: 'Liquid Glass',
    category: 'css',
    blurb:
      'Refractive glass panels: backdrop-filter for the blur, an SVG displacement map for the lens warp, gooey filters for the merge.',
    tags: ['css', 'svg filters', 'backdrop-filter'],
  },
  {
    slug: 'kinetic-type',
    title: 'Kinetic Typography',
    category: 'css',
    blurb:
      'Variable-font weight and width driven by scroll and pointer, plus per-character stagger through a single custom property.',
    tags: ['css', 'variable fonts', 'houdini'],
  },
  {
    slug: 'bento-grid',
    title: 'Bento Grid & Container Queries',
    category: 'css',
    blurb:
      'Asymmetric bento layout where each cell restyles itself from its own width — container queries, subgrid and scroll-state.',
    tags: ['css', 'grid', 'container queries'],
  },
  {
    slug: 'color-systems',
    title: 'Modern Colour',
    category: 'css',
    blurb:
      'OKLCH ramps, relative colour syntax, color-mix(), light-dark() and wide-gamut gradients that stay perceptually even.',
    tags: ['css', 'oklch', 'p3'],
  },
  {
    slug: 'gooey-morph',
    title: 'Gooey Morphing',
    category: 'css',
    blurb:
      'The blur + contrast alpha trick that makes separate shapes melt into one another, as SVG filters over live DOM.',
    tags: ['svg', 'filters', 'blob'],
  },
  {
    slug: 'css-3d',
    title: 'CSS 3D Space',
    category: 'css',
    blurb:
      'Perspective, preserve-3d and pointer-tracked rotation: a card with real depth and a cube, all in the layout engine.',
    tags: ['css', 'transform-3d', 'no-js*'],
  },
  {
    slug: 'text-effects',
    title: 'Text Effects Lab',
    category: 'css',
    blurb:
      'Nine reusable headline treatments: gradient shine, spotlight mask, glitch, outline fill, blur-in, marquee and more.',
    tags: ['css', 'masks', 'typography'],
  },

  // --- Canvas 2D ----------------------------------------------------------
  {
    slug: 'particle-field',
    title: 'Particle Field',
    category: 'canvas',
    blurb:
      'Ten thousand particles in a flow field, deflected by the pointer. Plain 2D canvas with a typed-array particle store.',
    tags: ['canvas', 'flow field', 'typed arrays'],
  },
  {
    slug: 'ascii-render',
    title: 'ASCII Renderer',
    category: 'canvas',
    blurb:
      'Downsample any source — animation or webcam — to a luminance grid and print it back as glyphs picked by brightness.',
    tags: ['canvas', 'ascii', 'webcam'],
  },

  // --- WebGL --------------------------------------------------------------
  {
    slug: 'shader-lab',
    title: 'Fragment Shader Lab',
    category: 'webgl',
    blurb:
      'A dependency-free fullscreen shader harness: simplex noise, fbm, domain warping and live uniform controls.',
    tags: ['webgl', 'glsl', 'no deps'],
  },
  {
    slug: 'image-displacement',
    title: 'Image Displacement',
    category: 'webgl',
    blurb:
      'Hover-driven RGB-split and displacement on an image plane — the classic transition effect, written from scratch.',
    tags: ['webgl', 'glsl', 'hover'],
  },

  // --- WebGPU / Three.js --------------------------------------------------
  {
    slug: 'tsl-material',
    title: 'TSL Node Materials',
    category: 'webgpu',
    blurb:
      'Three Shading Language: write shaders as chained JavaScript nodes that compile to WGSL, with a WebGL fallback for free.',
    tags: ['three.js', 'tsl', 'webgpu'],
  },
  {
    slug: 'gpu-particles',
    title: 'GPU Compute Particles',
    category: 'webgpu',
    blurb:
      'A quarter of a million particles simulated entirely in a WebGPU compute shader — position state never leaves the GPU.',
    tags: ['webgpu', 'compute', 'tsl'],
  },
  {
    slug: 'glass-refraction',
    title: 'Glass & Dispersion',
    category: 'webgpu',
    blurb:
      'Physical transmission, thickness, iridescence and chromatic dispersion on a mesh over live scene content.',
    tags: ['three.js', 'transmission', 'pbr'],
  },
  {
    slug: 'post-fx',
    title: 'Post-Processing Stack',
    category: 'webgpu',
    blurb:
      'Bloom, chromatic aberration, film grain and vignette composed as TSL nodes on a single output node.',
    tags: ['three.js', 'postprocessing', 'tsl'],
  },

  // --- Motion libraries ---------------------------------------------------
  {
    slug: 'gsap-scrolltrigger',
    title: 'GSAP ScrollTrigger',
    category: 'motion',
    blurb:
      'Pinned sections, scrubbed timelines and horizontal scroll — the sequencing native CSS still cannot express.',
    tags: ['gsap', 'scrolltrigger', 'pin'],
  },
  {
    slug: 'spring-ui',
    title: 'Springs & Layout',
    category: 'motion',
    blurb:
      'Motion for physics-based springs, shared-layout morphing, drag with momentum and gesture-driven interfaces.',
    tags: ['motion', 'spring', 'layout'],
  },
  {
    slug: 'smooth-scroll',
    title: 'Smooth Scroll & Parallax',
    category: 'motion',
    blurb:
      'Lenis virtual scrolling wired into a depth-layered parallax scene, with velocity feeding a skew distortion.',
    tags: ['lenis', 'parallax', 'raf'],
  },
];

export const bySlug = (slug) => DEMOS.find((d) => d.slug === slug);
