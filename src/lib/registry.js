/**
 * Single source of truth for the gallery.
 * The home page renders cards from this; each demo page reads its own entry
 * to build the top bar. Add a folder in demos/<slug>/ and an entry here.
 */

export const CATEGORIES = {
  css: { label: 'Modern CSS', hue: 265 },
  canvas: { label: 'Canvas 2D', hue: 175 },
  webgl: { label: 'WebGL & Shaders', hue: 25 },
  webgpu: { label: 'WebGPU & Three.js', hue: 320 },
  motion: { label: 'Motion Libraries', hue: 95 },
};

export const DEMOS = [
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
