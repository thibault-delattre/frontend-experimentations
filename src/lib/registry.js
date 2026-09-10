/**
 * Single source of truth for the gallery.
 * The home page renders cards from this; each demo page reads its own entry
 * to build the top bar. Add a folder in demos/<slug>/ and an entry here.
 */

export const CATEGORIES = {
  craft: { label: 'Design Craft', hue: 55 },
  overlay: { label: 'Overlays & Nav', hue: 215 },
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
  {
    slug: 'form-ux',
    title: 'Form UX & Validation',
    category: 'craft',
    blurb:
      'Auto-growing fields, validation that waits for intent, accessible file drops and submit recovery without layout jumps.',
    tags: ['forms', 'field-sizing', 'validation'],
  },
  {
    slug: 'data-table',
    title: 'Data Tables & Grids',
    category: 'craft',
    blurb:
      'Semantic sorting, faceted filtering, sticky density controls and spreadsheet-style roving cell navigation.',
    tags: ['table', 'aria-sort', 'data grid'],
  },

  // --- Overlays & navigation ----------------------------------------------
  // The most-used patterns in any real product, and the ones most often
  // rebuilt badly from scratch. All four are native-first.
  {
    slug: 'dialog',
    title: 'Dialogs & Drawers',
    category: 'overlay',
    blurb:
      'Native <dialog> for free focus trapping and top-layer stacking, animated open/close, plus a drag-to-dismiss bottom sheet.',
    tags: ['dialog', 'top layer', 'focus trap'],
  },
  {
    slug: 'toast',
    title: 'Toasts & Notifications',
    category: 'overlay',
    blurb:
      'A stacking toast system with timers that pause on hover, swipe-to-dismiss, and live regions that announce without interrupting.',
    tags: ['toast', 'aria-live', 'timers'],
  },
  {
    slug: 'command-palette',
    title: 'Command Palette',
    category: 'overlay',
    blurb:
      'The ⌘K pattern: fuzzy scoring, grouped results, full keyboard control and the combobox ARIA that makes it usable.',
    tags: ['⌘K', 'combobox', 'fuzzy'],
  },
  {
    slug: 'menus',
    title: 'Menus & Disclosure',
    category: 'overlay',
    blurb:
      'Dropdowns with roving tabindex, a mega menu with safe-triangle hover intent, and always-visible implementation guidance.',
    tags: ['menu', 'roving tabindex', 'hover intent'],
  },
  {
    slug: 'interest-popovers',
    title: 'Interest Invokers & Hints',
    category: 'overlay',
    blurb:
      'Hover, focus and long-press previews declared in HTML, with native intent delays, hint popovers and anchored positioning.',
    tags: ['interestfor', 'popover=hint', 'intent'],
  },
  {
    slug: 'navigation-api',
    title: 'Navigation API Router',
    category: 'overlay',
    blurb:
      'A tiny client-side router that intercepts every navigation source, coordinates async rendering, scroll and view transitions.',
    tags: ['navigation', 'router', 'baseline 2026'],
  },
  {
    slug: 'tabs',
    title: 'Tabs & Navigation State',
    category: 'overlay',
    blurb:
      'Automatic and manual activation, shared sliding indicators, async panels and URL-addressable selection.',
    tags: ['tabs', 'roving tabindex', 'history'],
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
  {
    slug: 'css-carousel',
    title: 'CSS-Native Carousel',
    category: 'css',
    blurb:
      'Accessible next/previous buttons, markers and snapped-card state generated by CSS Overflow 5 — no carousel runtime.',
    tags: ['scroll-button()', 'scroll-marker', 'scroll snap'],
  },
  {
    slug: 'custom-select',
    title: 'Customizable Select',
    category: 'css',
    blurb:
      'Rich native selects with base-select, selectedcontent, a top-layer picker and full fallback to the platform control.',
    tags: ['base-select', 'forms', 'selectedcontent'],
  },
  {
    slug: 'css-next',
    title: 'CSS 2026 Primitives',
    category: 'css',
    blurb:
      'Responsive shape() paths, typed attr(), automatic contrast colours and index-aware choreography from the 2026 platform.',
    tags: ['shape()', 'attr()', 'contrast-color()'],
  },
  {
    slug: 'custom-highlights',
    title: 'Custom Highlight API',
    category: 'css',
    blurb:
      'Search matches, persistent annotations and overlapping text ranges styled without wrapping or mutating document content.',
    tags: ['Range', 'Highlight', 'CSS.highlights'],
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
  {
    slug: 'drag-reorder',
    title: 'Drag & Reorder',
    category: 'motion',
    blurb:
      'Stable priority sorting, explicit accessible move controls, and a persistent cross-column Kanban board with undo.',
    tags: ['drag and drop', 'kanban', 'accessibility'],
  },
];

/* Addition cohorts from repository history. Demos created in the same commit
   share a timestamp; registry order is their stable secondary order. */
const RELEASE_COHORTS = [
  { at: '2026-09-10T13:54:36+02:00', slugs: ['drag-reorder'] },
  { at: '2026-09-10T13:52:45+02:00', slugs: ['data-table'] },
  { at: '2026-09-10T13:51:07+02:00', slugs: ['tabs'] },
  { at: '2026-09-10T13:35:34+02:00', slugs: ['form-ux'] },
  { at: '2026-09-10T13:33:55+02:00', slugs: ['custom-highlights'] },
  { at: '2026-09-10T13:32:16+02:00', slugs: ['css-next'] },
  { at: '2026-09-10T13:29:11+02:00', slugs: ['css-carousel', 'custom-select', 'interest-popovers', 'navigation-api'] },
  { at: '2026-09-10T13:07:41+02:00', slugs: ['dialog', 'toast', 'command-palette', 'menus'] },
  { at: '2026-09-10T10:55:29+02:00', slugs: ['cursor-fx', 'easing-lab', 'loading-states'] },
  {
    at: '2026-09-08T16:57:16+02:00',
    slugs: ['borders-glow', 'color-harmony', 'elevation', 'image-treatment', 'layout-primitives', 'micro-interactions', 'noise-texture', 'theming', 'type-scale'],
  },
  {
    at: '2026-09-08T15:54:04+02:00',
    slugs: ['anchor-positioning', 'ascii-render', 'bento-grid', 'color-systems', 'css-3d', 'glass-refraction', 'gooey-morph', 'gpu-particles', 'gsap-scrolltrigger', 'image-displacement', 'kinetic-type', 'liquid-glass', 'particle-field', 'post-fx', 'scroll-driven', 'shader-lab', 'smooth-scroll', 'spring-ui', 'text-effects', 'tsl-material', 'view-transitions'],
  },
];

export const RELEASED_AT = Object.fromEntries(
  RELEASE_COHORTS.flatMap(({ at, slugs }) => slugs.map((slug) => [slug, at]))
);

export const bySlug = (slug) => DEMOS.find((d) => d.slug === slug);
