/**
 * One AI prompt per demo — the brief you would hand a model to rebuild that
 * page from nothing.
 *
 * These are written to be *self-contained*: none of them refer to this repo,
 * this file, or each other, so they survive being pasted into a fresh chat.
 * Each follows the same shape, which is the actual reusable lesson here:
 *
 *   1. BUILD  — one sentence naming the artefact and the stack.
 *   2. TECHNIQUE — the specific mechanism, named. This is the part that stops
 *      a model reaching for jQuery or a component library.
 *   3. REQUIREMENTS — a numbered list, each item independently checkable.
 *   4. CONSTRAINTS — what NOT to do. Usually the highest-signal section.
 *
 * Vague prompts produce generic output. Every number, property name and
 * failure mode below is load-bearing.
 */

const SHARED_CONSTRAINTS = `
CONSTRAINTS (apply to everything):
- Vanilla HTML/CSS/JS with ES modules. No React, no Tailwind, no UI library,
  no build step required to read the result.
- Dark theme. Use OKLCH colours and CSS custom properties for every value that
  repeats. Elevation comes from lightness steps, not from stacked shadows.
- Animate only transform, opacity, filter and backdrop-filter. Anything that
  triggers layout or paint per frame is a bug.
- Honour prefers-reduced-motion: reduce. It means less motion, not no feedback.
- Comment the WHY, not the what. Explain the failure mode each technique avoids.
- Everything keyboard reachable, with visible :focus-visible rings and correct
  ARIA. Decorative elements get aria-hidden.
- Self-contained in one folder. No external assets, no CDN fonts, no images —
  generate any texture procedurally.`;

/** Composes the four sections into the final string. */
const p = (build, technique, requirements) =>
  `${build.trim()}\n\n${technique.trim()}\n\n${requirements.trim()}\n${SHARED_CONSTRAINTS}`;

export const PROMPTS = {
  // ═══ Design craft ═══════════════════════════════════════════════════════

  'type-scale': p(
    `BUILD a single-page typography system demo that shows how a page's type is
actually engineered, not chosen.`,
    `TECHNIQUE: a fluid modular scale built with clamp() and a ratio, so every
step interpolates between a mobile and a desktop size with no breakpoints.
Compute each step as clamp(minRem, calc(baseVw + offsetRem), maxRem) derived
from a ratio (1.2 minor third for UI, 1.333 perfect fourth for editorial).`,
    `REQUIREMENTS:
1. A live scale ladder from -2 to +6 steps. Sliders for base size, ratio, and
   viewport range; every specimen updates from CSS custom properties only —
   the JS writes variables, never individual styles.
2. A measure demo: the same paragraph at 30ch, 45ch, 65ch and 90ch, with a
   note that 45-75ch is the readable band and why.
3. Vertical rhythm: show a baseline grid overlay toggle, and demonstrate that
   consistent spacing comes from a spacing scale derived from line-height, not
   from arbitrary margins.
4. Demonstrate text-wrap: balance on headings and text-wrap: pretty on body,
   side by side with the unset version so the difference is visible.
5. Show font-optical-sizing, font-variation-settings on a variable font, and
   explain optical size vs. weight.
6. Show hanging-punctuation, font-feature-settings for old-style numerals and
   tabular numerals in a table, and why tabular matters for aligned figures.
7. A "before/after" panel: identical content with default browser typography
   vs. the system, so the payoff is legible at a glance.`
  ),

  'layout-primitives': p(
    `BUILD a page demonstrating six composable layout primitives that respond to
available space without a single media query.`,
    `TECHNIQUE: intrinsic layouts. Each primitive is one class doing one job,
and they nest. The responsiveness comes from flex-wrap, min(), max(), clamp()
and flex-basis rather than from breakpoints.`,
    `REQUIREMENTS — implement each with a resizable container so the behaviour
is visible without resizing the window:
1. STACK — vertical flow, spacing via .stack > * + * { margin-block-start: var(--space) }.
   Explain why the owl selector beats margins on children.
2. CLUSTER — flex-wrap + gap for tag lists and button rows that wrap gracefully.
3. SIDEBAR — flex with a fixed-basis aside and a content pane that has
   flex-basis:0; flex-grow:1; min-inline-size: 50%, so it wraps to stacked when
   the content would go below its minimum. This is the key trick: the wrap
   point is content-derived, not viewport-derived.
4. SWITCHER — a row that becomes a column all at once, using
   flex-basis: calc((var(--threshold) - 100%) * 999).
5. COVER — a hero with centred content, min-block-size, and top/bottom slots.
6. REEL — a horizontally scrolling row with scroll-snap and hidden scrollbars.
7. Also show grid auto-fit vs auto-fill with minmax(), and state plainly when
   each is correct.
8. Each primitive gets a drag handle to resize its container live.`
  ),

  elevation: p(
    `BUILD a page that teaches shadow and depth properly, contrasting naive
shadows with physically-reasoned ones.`,
    `TECHNIQUE: a single box-shadow always reads as cheap because real penumbra
is not uniform. Stack 3-5 shadows with increasing blur and decreasing opacity,
approximating the falloff of a real area light.`,
    `REQUIREMENTS:
1. Side-by-side: one flat shadow vs. a layered 5-stop shadow at the same
   apparent elevation. The difference must be obvious.
2. An elevation ramp (levels 0-5) generated from one JS function so the whole
   scale stays consistent. Expose it as CSS custom properties.
3. Light-source consistency: a scene of several cards where the shadow offset
   direction is derived from one shared --light-x/--light-y, with a draggable
   light. Every card updates together.
4. Tinted shadows: show that a pure-black shadow looks dead, and that shadows
   carrying the hue of the surface beneath them look correct. Use
   color-mix(in oklch, ...).
5. Contact shadow: a tight, dark, low-blur shadow layered under the soft one,
   showing how it anchors an object to the surface.
6. Inner shadow / inset for pressed and recessed states.
7. Dark-mode caveat: explain that shadows barely read on dark surfaces, and
   that elevation there should come from lighter surface fills plus a subtle
   top rim highlight. Demonstrate both.
8. A performance note on why animating box-shadow is slow, and the trick of
   cross-fading a pseudo-element's opacity instead.`
  ),

  'color-harmony': p(
    `BUILD an interactive palette constructor that derives an entire product
palette from a single seed hue.`,
    `TECHNIQUE: OKLCH. Because lightness is perceptually uniform, a ramp built
by stepping L produces evenly-spaced steps, which HSL cannot do. Chroma must
taper toward both ends of the ramp or the colours fall outside display gamut
and clip.`,
    `REQUIREMENTS:
1. One seed hue slider drives everything.
2. Harmony generators: complementary, split-complementary, triadic, analogous,
   tetradic — each shown as swatches with the hue maths stated.
3. A 12-step lightness ramp per palette colour, with chroma tapering as
   lightness approaches 0 or 100. Show the untapered version alongside so the
   clipping is visible.
4. Tinted neutrals: greys built by mixing a trace of the seed hue into the
   neutral ramp, next to pure greys, so the warmth difference reads.
5. Semantic role assignment: map raw ramp steps to named roles (surface,
   surface-raised, border, text, text-muted, accent, accent-hover, danger,
   success), and render a small mock UI that consumes only the roles.
6. Live contrast checking on every text/background pair. Use APCA Lc values as
   the primary readout and WCAG 2.1 ratio as secondary, flagging failures.
   State that APCA models perceived contrast better for dark themes.
7. A gamut indicator marking swatches outside sRGB, and show display-p3 output.
8. Copy-to-clipboard of the whole palette as CSS custom properties.`
  ),

  'micro-interactions': p(
    `BUILD a gallery of micro-interactions for common UI controls, where each
one demonstrates state choreography rather than decoration.`,
    `TECHNIQUE: every control has rest, hover, focus-visible, active, loading,
success and disabled states, and the transitions between them carry meaning.
Asymmetric timing is the core idea — enter fast (~150ms), settle slower
(~350ms), because that is how physical objects behave.`,
    `REQUIREMENTS:
1. A button set: primary, secondary, ghost, destructive. Each with all seven
   states, and a press that scales to ~0.97 with a spring settle.
2. A magnetic button: on pointer proximity within ~80px, the label eases
   toward the cursor at a fraction of the distance, and springs back on leave.
   Must be inert on touch devices — gate on (hover: hover).
3. A ripple from the exact click coordinates, cleaned up on animationend so
   nodes do not accumulate.
4. A toggle switch where the knob squashes and stretches along its travel.
5. A checkbox whose tick draws via stroke-dashoffset on an SVG path.
6. A text input with a floating label, an inline validation state, and a
   character counter that only appears near the limit.
7. A submit button that morphs through loading -> success -> reset, with the
   width animating and the label cross-fading.
8. A segmented control where the active pill slides between options — animate
   one shared indicator element, not each option's background.
9. State every duration in the code and justify it in a comment.`
  ),

  'noise-texture': p(
    `BUILD a page of texture techniques that make flat digital surfaces feel
material.`,
    `TECHNIQUE: SVG feTurbulence generates noise with no image asset and no
network request. Rendered once into a data-URI or an SVG filter, it can be
overlaid at low opacity to break up banding and add tactility.`,
    `REQUIREMENTS:
1. Film grain overlay: fixed-position, pointer-events:none, feTurbulence with
   type="fractalNoise", low opacity, optionally animated by stepping the seed.
   Show a gradient with and without it so the de-banding is visible.
2. Mesh gradient: 4-6 large radial-gradients at different positions, heavily
   blurred, slowly drifting. Include the performance note about doing this on
   a transformed pseudo-element rather than animating the gradient stops.
3. Ordered dithering: a Bayer-matrix pattern applied to a gradient, giving a
   retro banded look deliberately.
4. Halftone: a repeating-radial-gradient whose dot size is driven by an
   underlying luminance, plus a CSS-only version using background-blend-mode.
5. Paper/fibre texture from turbulence with high baseFrequency and a
   feColorMatrix desaturation.
6. Scanlines and CRT curvature as repeating-linear-gradient plus a subtle
   barrel-distorted overlay.
7. Grain that respects the surface beneath it via mix-blend-mode: overlay vs
   soft-light — compare both.
8. Note the real cost: SVG filters rasterise on the CPU in some engines. Give
   the guidance to bake static noise into a small tiling data-URI instead of
   filtering live.`
  ),

  'borders-glow': p(
    `BUILD a page of border and glow techniques, all of which work on rounded
corners.`,
    `TECHNIQUE: CSS cannot paint a gradient on border-width directly. The
solution is either (a) a padding-box/border-box background-clip pair, or
(b) a pseudo-element with a conic-gradient masked by
mask-composite: exclude, which leaves only the ring.`,
    `REQUIREMENTS:
1. Static gradient border on a rounded card, done with
   background: linear-gradient(var(--bg) padding-box, var(--grad) border-box).
   State the limitation: no transparency behind it.
2. The mask-composite technique: a ::before with inset:0, a conic-gradient,
   padding:1px, and
   mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
   mask-composite: exclude. Explain each line.
3. A rotating conic border, animated with an @property registered <angle> so
   the gradient angle can actually interpolate. Explain that without
   @property, gradients cannot be transitioned at all.
4. Spotlight card: a radial-gradient following the pointer, revealed only on
   the border ring, across a grid of cards using a single shared listener on
   the container.
5. Inner rim highlight: inset box-shadow at the top edge only, the detail that
   makes dark surfaces read as physical.
6. Animated dashed border via stroke-dasharray on an SVG rect with rx, which
   handles rounded corners correctly where CSS dashes do not.
7. A glow that does not blur the content: a blurred, scaled copy of the
   element behind it via a pseudo-element with filter: blur().
8. Focus ring best practice: outline with outline-offset, never a border,
   because outline does not affect layout.`
  ),

  'image-treatment': p(
    `BUILD a page of image treatment techniques for making stock or arbitrary
imagery look art-directed.`,
    `TECHNIQUE: blend modes and masks do most of the work. Generate all imagery
procedurally with canvas so the page has no external assets.`,
    `REQUIREMENTS:
1. Duotone: two ways — CSS with a colour layer at mix-blend-mode:color plus a
   grayscale filter, and SVG feComponentTransfer with per-channel tables.
   Compare fidelity.
2. A blend-mode matrix: the same image over the same colour in multiply,
   screen, overlay, soft-light, colour-burn, hue and luminosity, each labelled
   with what it is actually for.
3. Gradient masks: fading an image to nothing with
   mask-image: linear-gradient(), including the -webkit- prefix note, and a
   radial vignette mask.
4. clip-path reveals: an inset() wipe and a polygon() diagonal, animated on
   hover and on scroll entry.
5. Ken Burns: a slow scale+translate on the image with the container
   overflow:clip, with the note that the image must be oversized to avoid
   revealing edges.
6. object-fit / object-position with an explicit aspect-ratio to prevent CLS,
   plus a note that width and height attributes on <img> still matter.
7. A hover treatment that desaturates siblings and restores the hovered one,
   driven by :has() on the container so no JS is needed.
8. Progressive reveal: a blurred low-res placeholder cross-fading to the full
   image on load, using the decode() promise.`
  ),

  theming: p(
    `BUILD a theming system demo with a token architecture and an animated
theme switch.`,
    `TECHNIQUE: three token tiers. Primitives (raw scale values, theme-agnostic)
-> semantic tokens (role names that flip per theme) -> component tokens
(consumed by CSS). Components must reference only semantic or component
tokens, never primitives — that indirection is the entire point.`,
    `REQUIREMENTS:
1. Show all three tiers explicitly, with a diagram, and a mock UI (nav, cards,
   form, table, chart) that consumes only semantic tokens.
2. A theme switcher with four options: light, dark, system, and one high-
   contrast variant. Persist to localStorage, read prefers-color-scheme for
   system, and set color-scheme so form controls and scrollbars follow.
3. Prevent the flash of wrong theme: an inline blocking script in <head> that
   sets the attribute before first paint. Explain why a module script is too
   late.
4. Use light-dark() for the simple cases and show the fallback pattern.
5. Animate the switch with the View Transitions API, expanding a clip-path
   circle from the click coordinates. Fall back to a plain swap when the API
   or reduced-motion says no.
6. Demonstrate that semantic tokens allow a full rebrand by changing one hue
   variable — include a live brand-hue slider.
7. Include the accessibility check: every semantic pair must clear contrast in
   every theme, with a live readout proving it.`
  ),

  'easing-lab': p(
    `BUILD an easing and timing laboratory: every curve plotted, played and
compared, with the guidance that makes motion feel designed.`,
    `TECHNIQUE: draw each curve as an SVG path sampled from its own function,
and drive a moving element with the identical function, so the plot and the
motion are provably the same curve.`,
    `REQUIREMENTS:
1. A grid of curves: linear, the four standard cubic-beziers, ease-in/out/
   in-out for quad, cubic, quart, expo, circ, back and elastic. Each cell
   shows the plotted path, a playing dot, and the copyable cubic-bezier().
2. A draggable bezier editor with two control handles, live preview and
   copyable output.
3. Springs: a stiffness/damping/mass editor plotting the resulting curve
   (which overshoots past 1, so the plot must extend beyond the box), with the
   damping ratio classified as under/critical/over-damped.
4. Side-by-side comparison: the same movement with linear vs. ease-out vs.
   spring, so the difference is unmissable.
5. CSS linear() output for springs, so a spring can run without JS.
6. The rules, stated plainly and demonstrated: entrances ease-out, exits
   ease-in, moves ease-in-out; distance scales duration; small UI 150-250ms,
   large surfaces 300-500ms; never linear except for continuous motion like
   spinners and marquees.
7. Show the interruption problem: an ease restarted mid-flight jumps, a spring
   carries its velocity. Provide a button to interrupt both.
8. steps() for sprite/typewriter effects.`
  ),

  'loading-states': p(
    `BUILD a page covering loading, empty and error states — the screens most
products treat as an afterthought.`,
    `TECHNIQUE: the shape of a skeleton must match the content that replaces it,
or the swap causes a visible jolt. Derive skeleton dimensions from the same
tokens the real component uses.`,
    `REQUIREMENTS:
1. A card component rendered three ways from one source of truth: skeleton,
   loaded, and error. Toggle between them to prove the geometry matches.
2. Shimmer done correctly: animate a translated gradient pseudo-element, never
   background-position, and respect reduced-motion by falling back to a gentle
   opacity pulse.
3. The timing thresholds, implemented and annotated: under 100ms show nothing
   at all; 100ms-1s show a spinner; over 1s show determinate progress; and a
   minimum display time (~500ms) so a fast response does not flash the
   skeleton. Implement the "delay before showing" guard.
4. A progress bar that never lies: no fake completion, and an indeterminate
   mode when the total is genuinely unknown.
5. Optimistic UI: a like button that updates instantly and rolls back visibly
   on simulated failure.
6. Streaming/staggered content reveal as items arrive.
7. Empty states with an illustration, a one-line explanation and a primary
   action — contrasted with a bare "No data".
8. Accessibility: aria-busy, aria-live="polite" for completion, role="status",
   and the rule that a spinner needs an accessible name.`
  ),

  'cursor-fx': p(
    `BUILD a page of pointer and cursor effects, each with a correct fallback on
touch devices.`,
    `TECHNIQUE: a custom cursor is a fixed-position element eased toward the
real pointer each frame. The easing (lerp toward target at ~0.15/frame) is
what creates the sense of weight; a 1:1 follow feels broken.`,
    `REQUIREMENTS:
1. A custom cursor with a small dot that tracks exactly and a larger ring that
   lags. Hide the native cursor only where the custom one is active.
2. Context awareness: the ring grows over links, becomes a label over media,
   and collapses over text inputs — driven by data attributes on targets, not
   by a hardcoded selector list.
3. mix-blend-mode: difference on the cursor so it stays visible over any
   background. Note the stacking-context cost.
4. Magnetic buttons: elements within a radius pull the cursor and translate
   slightly toward it, both springing back on exit.
5. A trailing particle or smear trail, capped in length, drawn on a canvas
   rather than as DOM nodes.
6. A spotlight that reveals a hidden layer through a radial mask following the
   pointer.
7. An image that follows the cursor on hover over a list of links, with the
   swap and a slight rotation based on pointer velocity.
8. Non-negotiable fallbacks: gate everything behind
   matchMedia('(hover: hover) and (pointer: fine)'), keep the native cursor
   otherwise, and ensure every interaction is reachable by keyboard. A custom
   cursor must never be the only affordance.`
  ),

  // ═══ Modern CSS ═════════════════════════════════════════════════════════

  'scroll-driven': p(
    `BUILD a page demonstrating CSS scroll-driven animations with ZERO
JavaScript for the animation itself.`,
    `TECHNIQUE: animation-timeline replaces the scroll listener entirely.
scroll() binds an animation's playhead to a scroll container's progress;
view() binds it to an element's own progress through the scrollport.
animation-range windows which slice of that pass the keyframes cover.`,
    `REQUIREMENTS:
1. A fixed reading-progress bar using animation-timeline: scroll(root block)
   and a scaleX keyframe.
2. Reveal-on-enter using view() with animation-range: entry 5% entry 60%.
   Emphasise that this is scrubbed — it runs backwards when scrolling up,
   which an IntersectionObserver cannot do.
3. A three-layer parallax where each layer has a different translate distance
   over animation-range: cover.
4. A horizontally scrolling rail that declares scroll-timeline: --rail x, plus
   a progress bar OUTSIDE the rail's subtree that attaches by name. Cards use
   view(x).
5. A sticky scrollytelling section: a tall track with a sticky stage, driven
   by the track's own view() progress over the contain range.
6. animation-trigger with play-forwards/play-backwards, showing the difference
   between scroll-TRIGGERED (a normal timed animation fired at a boundary) and
   scroll-LINKED (scrubbed).
7. Every block wrapped in @supports (animation-timeline: view()) so that
   unsupporting browsers get the finished state rather than a permanent
   opacity: 0.
8. Call out the two classic traps: overflow:hidden silently creates a scroll
   container and steals the timeline (use overflow:clip), and only
   compositor-friendly properties should be animated.`
  ),

  'view-transitions': p(
    `BUILD a demo of the View Transitions API covering same-document morphs and
the cross-document setup.`,
    `TECHNIQUE: document.startViewTransition(callback) snapshots the old state,
runs the DOM mutation, snapshots the new state, and cross-fades. Elements
sharing a view-transition-name across the two snapshots are morphed instead of
faded — position, size and border-radius all interpolate.`,
    `REQUIREMENTS:
1. A card grid where clicking a card expands it into a detail view, with the
   thumbnail and title morphing into the hero image and heading.
2. CRITICAL detail to get right: assign view-transition-name to the SOURCE
   element only for the duration of the capture. Two elements may never share
   a name in the same snapshot, so naming every card up front breaks it.
   Implement the assign-then-clear pattern.
3. A sortable list where reordering morphs each row to its new position, with
   a unique view-transition-name per row.
4. Custom animations via ::view-transition-old(name) and
   ::view-transition-new(name), including one directional slide.
5. A slow-motion toggle that multiplies the transition duration, for debugging.
6. Guards: feature-detect document.startViewTransition and fall back to a
   plain update; skip the transition entirely under prefers-reduced-motion.
7. Document the cross-document (MPA) setup in a code block:
   @view-transition { navigation: auto } in both documents, matching names,
   and the same-origin requirement.
8. Explain the layering rule — that transition pseudo-elements live in a
   top-layer tree above the page.`
  ),

  'anchor-positioning': p(
    `BUILD a demo of CSS anchor positioning that replaces a JS positioning
library entirely.`,
    `TECHNIQUE: an element declares anchor-name: --x; a positioned element
references it with position-anchor and places itself using position-area or
anchor() functions. position-try-fallbacks supplies alternative placements the
browser tries in order when the preferred one would overflow.`,
    `REQUIREMENTS:
1. A tooltip tethered to a button, opening via the Popover API
   (popover + popovertarget) so it lands in the top layer with no z-index war.
2. Edge flipping: place the tooltip with position-area: block-start, then
   position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline.
   Put a trigger near each viewport edge so the flipping is observable.
3. A dropdown menu sized to its trigger using anchor-size(width), showing that
   width can be derived from the anchor.
4. A draggable anchor point with a callout tethered to it — and make the point
   that the drag handler never touches the callout, because the position is
   declarative. Give the handle keyboard controls too.
5. Entry and exit animation with @starting-style and transition-behavior:
   allow-discrete, so display:none can participate in a transition.
6. A tooltip arrow positioned with anchor() against the same anchor.
7. Feature-detect with CSS.supports('anchor-name: --a') and show a centred
   fallback, with a note on current browser support.`
  ),

  'liquid-glass': p(
    `BUILD a liquid-glass panel that genuinely refracts the content behind it,
not just a blurred glassmorphism panel.`,
    `TECHNIQUE: blur alone is glassmorphism. Refraction requires an SVG
feDisplacementMap in the backdrop-filter chain: a displacement map (a radial
or edge-weighted gradient rendered to SVG) bends the backdrop sample position,
which is what a real lens does. Chromatic aberration comes from displacing the
channels by slightly different scales.`,
    `REQUIREMENTS:
1. A busy, colourful animated backdrop — the effect is entirely a function of
   what is behind the panel, so a plain background proves nothing.
2. A draggable glass panel with backdrop-filter combining
   url(#displacement) blur() saturate().
3. Build the displacement map so distortion concentrates at the panel's edges
   and is near zero in the centre, which is how a real lens behaves. A uniform
   displacement looks like a bug.
4. Three variants to switch between: lens (strong edge refraction), chromatic
   (per-channel offset), frosted (blur-dominant).
5. A specular highlight that tracks the pointer, plus an inner rim highlight
   at the top edge and a soft outer shadow.
6. The gooey merge: a second panel showing the
   feGaussianBlur -> feColorMatrix alpha-ramp trick that makes two glass
   shapes melt together as they approach.
7. Legibility warning, demonstrated: text behind heavy distortion becomes
   unreadable at certain offsets. Show a readable configuration and state the
   contrast rule.
8. Performance: contain: strict/paint to isolate the filter's paint bounds,
   and a note that backdrop-filter is expensive and should not be applied to
   many elements or animated in size.`
  ),

  'kinetic-type': p(
    `BUILD a kinetic typography page where type responds continuously to scroll
and pointer.`,
    `TECHNIQUE: variable fonts expose continuous axes (wght, wdth, opsz, slnt).
Driving those axes from a normalised input value produces motion that no
static font can. Per-character effects come from splitting text into spans
carrying an index, then deriving each span's style from that index.`,
    `REQUIREMENTS:
1. A headline whose weight and width axes are driven by scroll velocity, eased
   so it settles smoothly rather than jittering.
2. Pointer proximity: split a headline into characters and give each a --d
   custom property holding its normalised distance from the cursor, then map
   --d to weight, scale and colour. Measure the character rectangles ONCE and
   re-measure only on resize and font load — measuring inside pointermove is
   what makes this pattern janky.
3. Per-character stagger from a single --i index, with the delay computed as
   calc(var(--i) * 40ms).
4. A seamless marquee that loops by translating -50% over a doubled content
   list, with a skew driven by scroll velocity.
5. A text-mask reveal where the fill is a gradient clipped to the glyphs.
6. Accessibility, non-negotiable: when splitting text, set aria-label to the
   original string on the container and aria-hidden on every generated span,
   so screen readers read a word and not fourteen letters.
7. Handle the web-font swap: metrics change after load, so re-measure on
   document.fonts.ready.`
  ),

  'bento-grid': p(
    `BUILD a bento-box dashboard where each cell restyles itself from its own
width rather than the viewport's.`,
    `TECHNIQUE: container queries. A component declares container-type:
inline-size, and its descendants query @container (min-width: ...). The same
component then adapts correctly in a sidebar, a modal or a full-width row —
which media queries fundamentally cannot do.`,
    `REQUIREMENTS:
1. An asymmetric bento grid with uneven column and row spans over a 4-column
   grid, using grid-template-areas or explicit spans.
2. One card component used at several sizes, whose internal layout changes at
   three container breakpoints: stacked, side-by-side, and expanded with an
   extra detail slot and a chart.
3. A resize handle on a standalone instance of the same card so a viewer can
   drag it across all three breakpoints while the window never changes size.
   This is the proof, so make it prominent.
4. Container query units: size type with cqi so it scales with the container
   rather than the viewport.
5. Named containers (container-name) and a query against a specific ancestor.
6. Subgrid: a row of cards whose internal headings and footers align across
   cards because they inherit the parent grid's tracks.
7. @container scroll-state(stuck: top) on a sticky header that restyles when
   it becomes stuck.
8. Include a plain statement of when a media query is still the right tool —
   page-level layout and device capability, not component layout.`
  ),

  'color-systems': p(
    `BUILD a page demonstrating modern CSS colour features and why they replace
hex and HSL.`,
    `TECHNIQUE: OKLCH is perceptually uniform — equal steps in L look equally
different, and changing H at fixed L and C preserves apparent brightness.
Neither is true of HSL, where yellow at 50% lightness is far brighter than
blue at 50%.`,
    `REQUIREMENTS:
1. Direct comparison: an HSL hue sweep at fixed S/L next to an OKLCH sweep at
   fixed C/L, so the brightness inconsistency of HSL is unmissable.
2. An interactive lightness ramp with hue and chroma sliders, with chroma
   tapering toward the ends of the ramp and an explanation of gamut clipping.
3. Relative colour syntax: derive hover, active and disabled variants from one
   base with oklch(from var(--base) calc(l + 0.08) c h).
4. color-mix() for tints, shades and alpha, including mixing toward a surface
   colour rather than toward white.
5. Interpolation spaces compared: the same two-stop gradient in srgb, oklab,
   oklch shorter hue and oklch longer hue, showing the grey dead zone that
   sRGB interpolation produces.
6. light-dark() with color-scheme for theme-aware values without duplicated
   blocks.
7. Wide gamut: colours only expressible in display-p3, inside
   @media (color-gamut: p3) with an sRGB fallback.
8. Accessibility: a live contrast readout on sample pairs, and a note that
   OKLCH lightness is a good proxy for contrast but not a substitute for
   measuring it.`
  ),

  'gooey-morph': p(
    `BUILD a page of gooey and morphing effects driven by SVG filters over live
DOM elements.`,
    `TECHNIQUE: the goo effect is two primitives. feGaussianBlur softens the
shapes so neighbours overlap, then feColorMatrix with a large alpha multiplier
and a negative offset (e.g. row 4: 0 0 0 19 -9) snaps the blurred alpha back
into a hard edge. Where two blurs overlap, the summed alpha crosses the
threshold and the shapes fuse.`,
    `REQUIREMENTS:
1. A metaball field of ordinary divs with border-radius:50% inside a container
   with filter: url(#goo). Critically, keep the balls close enough to actually
   merge — spread over a wide area they never touch and the effect looks like
   plain circles. Confine them to a band.
2. The pointer as an additional metaball, so it fuses with the field.
3. Annotate the feColorMatrix alpha row value by value.
4. A gooey FAB menu whose items separate out of the button on open.
5. Text distorted by feTurbulence + feDisplacementMap, animated by stepping
   baseFrequency — and only while hovered, since re-running the filter graph
   every frame is expensive.
6. A morphing blob using animated border-radius with eight values, plus the
   SVG path-morph alternative, comparing the two.
7. Performance notes: SVG filters can rasterise on the CPU, isolate them with
   will-change or contain, and never apply one to a large scrolling area.`
  ),

  'css-3d': p(
    `BUILD a page demonstrating real 3D depth using only CSS transforms — no
WebGL.`,
    `TECHNIQUE: perspective on a parent plus transform-style: preserve-3d
creates a shared 3D space where children at different translateZ values
genuinely parallax against each other, computed by the browser's perspective
matrix. Faking it with 2D offsets does not survive rotation.`,
    `REQUIREMENTS:
1. A card that tilts toward the pointer, with its title, a ring and a subtitle
   at different translateZ offsets so they parallax correctly during the tilt.
2. Keep the maximum rotation modest (~14deg) — past roughly 18deg the
   perspective distortion reads as a glitch. State this.
3. Restore the transition on pointerleave but remove it during movement, so
   tracking is instant and the return is eased.
4. A cube built from six faces with backface-visibility, rotating on drag.
5. A flip card with the correct backface handling.
6. A coverflow row where items rotate in Y based on their scroll position,
   driven by a scroll-driven animation.
7. Device orientation as the input on touch devices, where there is no hover.
8. Performance: promote with will-change sparingly, and note that
   preserve-3d flattens if any ancestor sets overflow, filter or opacity —
   the single most common reason these effects mysteriously go flat.`
  ),

  'text-effects': p(
    `BUILD a lab of nine reusable headline treatments, each a single
self-contained CSS class.`,
    `TECHNIQUE: most text effects are background-clip: text with an animated
background, or a mask-image revealing a layer. Gradients cannot be
transitioned unless their animated component is registered with @property.`,
    `REQUIREMENTS — nine independent effects, each labelled and captioned with
what it is for:
1. Gradient shine: a moving highlight swept across a gradient clipped to text.
2. Pointer spotlight: a radial mask following the cursor revealing a bright
   layer over a dim one.
3. Glitch: two offset colour copies via pseudo-elements with clip-path slices
   animated on steps().
4. Outline-to-fill on hover, using -webkit-text-stroke and a clipped fill.
5. Word-by-word blur-in with a per-word --i stagger.
6. Neon: layered text-shadow at increasing blur, plus a flicker keyframe.
7. Variable-font weight wave across characters.
8. Scramble: characters resolve from random glyphs left to right, each with
   its own start and end frame so the resolve front sweeps rather than every
   letter settling at once. Resample the noise glyph only ~30% of frames, or
   it reads as static.
9. Marquee with a velocity-driven skew.
Also: use aria-label plus aria-hidden spans whenever text is split, and give
every effect a reduced-motion path.`
  ),

  // ═══ Canvas 2D ══════════════════════════════════════════════════════════

  'particle-field': p(
    `BUILD a 2D canvas particle field of 100k+ particles advected through a flow
field, at 60fps, with no library.`,
    `TECHNIQUE: at this count, one JS object per particle destroys performance
through allocation and cache misses. Store all state in a single Float32Array
laid out as [x, y, vx, vy] per particle, and write particles directly into an
ImageData buffer viewed as a Uint32Array — one 32-bit store per particle
instead of a canvas draw call.`,
    `REQUIREMENTS:
1. A 3D value-noise function (hashed integer lattice, smoothstep interpolation)
   sampled at (x*scale, y*scale, time) to produce a flow angle. Explain why
   value noise is enough here and simplex is not needed.
2. Trails by fading the persistent pixel buffer in place each frame rather
   than clearing. Skip already-black pixels with an early-out — most of the
   buffer is empty, and that check is what keeps the fade loop cheap.
3. Pointer repulsion with inverse-square falloff, plus a drag coefficient
   without which the field accelerates forever.
4. Wrap particles at the edges rather than clamping, so density stays even.
5. Pin the canvas to devicePixelRatio 1: the demo is CPU fill-rate bound and
   4x the pixels buys nothing for 1px points. Explain the trade-off.
6. Live controls for count, flow scale, trail length and repulsion strength,
   plus an FPS readout.
7. Note the ImageData byte order is little-endian ABGR when viewed as
   Uint32Array, and pack colours accordingly.`
  ),

  'ascii-render': p(
    `BUILD an ASCII renderer that converts any canvas source — an animated 3D
scene or a webcam feed — into live text.`,
    `TECHNIQUE: draw the source into a canvas that is already only as wide as
the character grid, so the browser's native downscale does the box-averaging
for you. Then map each pixel's luminance to a glyph from a ramp ordered by ink
coverage.`,
    `REQUIREMENTS:
1. MEASURE the monospace cell aspect ratio from the rendered font rather than
   assuming 0.5 — the error compounds over a hundred rows. Re-measure on
   document.fonts.ready.
2. Beware the layout feedback loop: if the <pre> can grow its container, and
   the row count is derived from that container, the two feed each other and
   the page hangs. Give the stage a fixed height and take the <pre> out of
   flow. Also clamp the row count defensively.
3. Render the procedural source at the GRID's aspect ratio, not square, so the
   subject fills the frame instead of being cropped or letterboxed.
4. Sources: a rotating shaded torus (write into an ImageData buffer with a
   depth buffer — thousands of fillRect calls will stall the frame), a
   metaball field, and getUserMedia webcam with a graceful denial fallback.
5. Mirror the webcam; an unmirrored self-view is disorienting.
6. Use Rec.709 luminance weights (0.2126/0.7152/0.0722), not a channel mean —
   green carries most of perceived brightness.
7. Controls for columns, contrast, gamma, and several ramps including a
   70-level one and a block-character one.
8. Build the frame as ONE string and assign textContent once. Set
   font-variant-ligatures: none or a coding font will fuse pairs and shear the
   grid. Add a copy-to-clipboard button, since the output is real text.`
  ),

  // ═══ WebGL ══════════════════════════════════════════════════════════════

  'shader-lab': p(
    `BUILD a dependency-free WebGL2 fragment-shader playground with live editing
and several presets.`,
    `TECHNIQUE: render a single oversized triangle rather than a quad — it
covers the viewport with no diagonal seam, needs no vertex buffer at all
(generate positions from gl_VertexID), and costs one draw call.`,
    `REQUIREMENTS:
1. Uniforms: u_resolution, u_time, u_mouse, plus four scalar sliders.
2. A textarea that recompiles the shader on input, debounced ~250ms. On
   compile failure, KEEP the previous program so a half-typed edit never
   blanks the canvas, and print the driver's error log with line numbers
   remapped into the editor's coordinate space (subtract the prelude length).
3. A shared GLSL prelude with hash, value noise, fbm and an iq-style
   palette(t,a,b,c,d) cosine palette, so presets stay readable.
4. Five presets, each heavily commented:
   - domain warping: fbm(p + fbm(p + fbm(p))), the single most reused idea in
     procedural shading;
   - 2D signed distance fields with smooth-minimum blending, shaded BY the
     distance (contour rings, crisp outline) rather than merely thresholded;
   - raymarching with space repetition, central-difference normals and fog;
   - plasma via iterated coordinate distortion;
   - voronoi where the edge comes from (secondNearest - nearest).
5. An FPS and resolution readout.
6. Aspect-correct the coordinates as (fragCoord*2 - resolution)/resolution.y.`
  ),

  'image-displacement': p(
    `BUILD a WebGL2 image-displacement effect: pointer-driven distortion plus
noise-map slide transitions. No library.`,
    `TECHNIQUE: displacement means offsetting the texture lookup coordinate by a
value sampled from a map. Chromatic aberration means sampling R, G and B at
slightly different offsets. A dissolve means comparing the map against a
progress value to get a per-pixel threshold, so the images tear into each
other instead of cross-fading uniformly.`,
    `REQUIREMENTS:
1. Compute an object-fit: cover UV transform in the shader from the canvas and
   image aspect ratios — images never match the canvas.
2. Ease the pointer position toward its target each frame
   (p += (target - p) * 0.08). This single line is the difference between
   "expensive" and "twitchy". Do not read the raw pointer.
3. A gaussian falloff around the cursor so the push is local.
4. Four transition modes: noise dissolve, roughened directional wipe, radial
   burst from the pointer, and a vertical melt.
5. Ramp displacement up and back down across the transition (sin(p*PI)) so the
   first and last frames are pristine.
6. Keep the displacement map LOW frequency — high-frequency noise in a
   displacement map produces sparkle and aliasing.
7. Set UNPACK_FLIP_Y_WEBGL and CLAMP_TO_EDGE wrapping; displacement lookups
   routinely run past the edge and repeat wrapping causes visible seams.
8. Generate the images procedurally on canvas so there are no assets, but
   structure the code so swapping in an <img> changes nothing downstream.`
  ),

  // ═══ WebGPU / Three.js ══════════════════════════════════════════════════

  'tsl-material': p(
    `BUILD a Three.js demo of TSL (Three Shading Language) node materials
running on WebGPU with an automatic WebGL2 fallback.`,
    `TECHNIQUE: TSL expresses shaders as chained JavaScript nodes that compile
to WGSL or GLSL depending on the backend. Assigning a node to a specific
material slot (colorNode, positionNode, roughnessNode, emissiveNode) replaces
just that stage while inheriting the full PBR lighting pipeline — which a raw
ShaderMaterial forces you to reimplement.`,
    `REQUIREMENTS:
1. WebGPURenderer with await renderer.init(), and display which backend
   actually got used.
2. Five switchable materials, each demonstrating a different idea:
   - displaced fbm noise blob (positionNode + matching colour ramp);
   - iridescent fresnel driven by dot(normalWorld, viewDir);
   - procedural stripes factored into a reusable Fn();
   - topographic contour lines from fract() of a height field;
   - a UV-space grid.
3. Live uniforms via uniform(), whose .value is set directly from JS sliders.
4. A dense enough mesh (icosahedron, high detail) — vertex displacement is
   only as smooth as the tessellation.
5. State the important gotcha explicitly: displacing vertices in positionNode
   does NOT update normals, so the surface lights as if still smooth. Explain
   the fix (recompute from the noise gradient) and when to accept it.
6. Reuse a single named noise node across several slots to show that nodes are
   values and are evaluated once, not per use.
7. A table of the material slots and what each replaces.`
  ),

  'gpu-particles': p(
    `BUILD a Three.js WebGPU compute-shader particle system simulating 250k+
particles entirely on the GPU.`,
    `TECHNIQUE: instancedArray() allocates GPU storage buffers. One compute
kernel seeds them once; another advances them every frame. The render material
reads the same buffer via .toAttribute(). Positions never travel to the CPU,
which is what makes this an order of magnitude faster than a JS particle loop.`,
    `REQUIREMENTS:
1. Storage buffers for position, velocity and a per-particle random seed.
2. An init kernel distributing points uniformly INSIDE A BALL (normalize a
   random vector, scale by cbrt(random)) — a cube's corners are visibly denser.
3. An update kernel with four switchable force fields:
   - curl noise (cross of finite differences of a noise field; divergence-free
     so particles swirl without clumping). Note the differences are ~0.01, so
     the multiplier must be large or it reads as a static blob;
   - the Lorenz attractor;
   - a vortex with radial and tangential terms;
   - orbiting inverse-square gravity wells with a softened core.
4. Clamp deltaTime inside the kernel (~0.033) — a backgrounded tab resumes
   with a huge delta that flings everything to infinity in one step.
5. Pointer interaction projected onto a world-space plane, attract and repel.
6. Recycle particles that escape a radius, so the cloud does not thin out.
7. Rendering: SpriteNodeMaterial with AdditiveBlending and depthWrite:false —
   addition is commutative, so there is no sorting problem. Colour by speed. A
   round sprite cut from the quad's own UVs, no texture. Keep per-particle
   alpha low (~0.25) or dense regions blow out to a white blob.
8. Detect the absence of WebGPU and say so on screen — WebGL2 has no compute
   stage. Mention the ping-pong float-texture workaround.
9. FPS and particle-count readout.`
  ),

  'glass-refraction': p(
    `BUILD a Three.js scene showcasing physically-based glass: transmission,
dispersion and iridescence.`,
    `TECHNIQUE: MeshPhysicalMaterial's transmission renders the scene behind the
mesh into a buffer and refracts it by the index of refraction, with thickness
controlling path length and attenuation controlling absorbed colour. This is
real refraction, not a blurred backdrop.`,
    `REQUIREMENTS:
1. An environment map is mandatory — scene.environment via PMREMGenerator.
   Without one, glass renders black. Say this in a comment; it is the single
   most common failure.
2. A busy backdrop: many colourful animated shapes AND a bright high-frequency
   wall directly behind the glass. The effect is entirely a function of what
   is behind it — over an empty background a glass ball just looks like a dark
   sphere.
3. Live controls for ior, thickness, roughness, dispersion, iridescence and
   attenuation colour.
4. Three presets with physically sensible values: clear glass (ior 1.52),
   diamond (ior 2.42, high dispersion), water (ior 1.33).
5. Five switchable geometries including a flattened sphere as a lens and a
   faceted gem, showing how facets concentrate dispersion.
6. Orbit controls with damping.
7. Explain the real limitations: transmission does not refract other
   transmissive objects, it costs an extra scene render, and roughness on a
   transmissive material is expensive because it needs blurred mips.`
  ),

  'post-fx': p(
    `BUILD a Three.js post-processing stack composed as TSL nodes on a single
output node rather than as a chain of framebuffer passes.`,
    `TECHNIQUE: pass(scene, camera) yields the rendered scene as a node.
Everything downstream is ordinary arithmetic on that node, and the compiler
fuses most of the chain into one fragment shader — where the old
EffectComposer ran a full-screen pass with its own render target per effect.`,
    `REQUIREMENTS:
1. Bloom, chromatic aberration, film grain, vignette and colour grading, each
   individually toggleable. Implement toggles as a 0/1 uniform multiplying the
   effect's contribution, so switching one off costs nothing and does not
   require rebuilding the graph.
2. ORDER IS THE LESSON: bloom must run in linear HDR before tone mapping;
   grain and vignette must run after, in display space. Grain before tone
   mapping gets crushed; a vignette before it shifts hue as it darkens. State
   this explicitly.
3. Scene content with emissive values above 1.0 — with everything clamped to
   1.0 there is nothing above the bloom threshold and you get uniform haze
   instead of light. Keep emissive close to the threshold, not far past it, or
   the geometry blows out to a white blob.
4. Chromatic aberration as a RADIAL offset, zero at the centre and growing
   toward the corners, the way a real lens behaves. Keep it under ~0.005 of
   screen width.
5. Grading: saturation as a lerp between the image and its luminance,
   contrast as a scale about 0.5.
6. Three swappable scenes so the stack can be judged against different content.
7. Cost note: bloom's mip chain is roughly six extra passes; give the mobile
   guidance.`
  ),

  // ═══ Motion libraries ═══════════════════════════════════════════════════

  'gsap-scrolltrigger': p(
    `BUILD a scroll-driven page with GSAP ScrollTrigger, covering the sequencing
that native CSS scroll timelines still cannot express.`,
    `TECHNIQUE: ScrollTrigger maps a scroll range onto a timeline. scrub ties
the playhead to scroll position; pin holds an element while the page scrolls
past; snap settles to defined progress points. Timelines let many tweens share
one scroll range with independent offsets.`,
    `REQUIREMENTS:
1. A staggered card reveal with toggleActions "play none none reverse", and a
   table of what each of the four action slots means.
2. A pinned section with a scrubbed timeline (scrub: 0.8 for catch-up
   smoothing) and snap points, cross-fading captions across quarters of the
   same timeline.
3. Horizontal scroll: pin a container and translate a track by exactly its
   overflow width. Use FUNCTION values for x and end so they are recomputed on
   refresh, plus invalidateOnRefresh — this is what makes it responsive.
4. Animated counters by tweening a plain object and writing the DOM in
   onUpdate, which is how you animate anything that is not a CSS property.
5. A per-word headline reveal from behind a mask.
6. Multi-layer parallax with scrub: true.
7. Wrap everything in gsap.context() so it can be reverted on unmount, and
   show ctx.revert() as the framework cleanup pattern.
8. Call ScrollTrigger.refresh() on document.fonts.ready and on load — font
   swap changes every measured start/end position, and this one line prevents
   most "it breaks on reload halfway down the page" bugs.
9. A reduced-motion branch that skips the scrubbed motion entirely.`
  ),

  'spring-ui': p(
    `BUILD a page demonstrating spring physics, gesture handling and shared-
layout morphing with the Motion library (vanilla, not React).`,
    `TECHNIQUE: a spring has no duration. It has stiffness, damping and mass,
and it settles when the physics say so. That is why an interrupted spring
looks right — it carries its current velocity — while an interrupted ease
restarts from zero and visibly jumps.`,
    `REQUIREMENTS:
1. Side-by-side: the same travel as a spring and as a fixed 400ms ease, with a
   button to interrupt both mid-flight so the difference is undeniable.
2. Live stiffness/damping/mass/velocity controls, with the damping ratio
   computed (damping / (2*sqrt(stiffness*mass))) and classified as under-,
   critically- or over-damped.
3. Drag with momentum: capture the pointer, keep a short history of positions,
   and on release compute px/s over the last ~60ms and hand that to the spring
   as per-axis velocity. A single frame's delta is far too noisy. Add soft
   bounds where movement past the wall is damped rather than blocked.
4. Shared-layout morphing implemented as FLIP, spelled out step by step:
   measure First, set Last, apply the Invert transform, then Play it away.
   Only transform animates, so the browser never re-lays-out mid-tween.
   Implement both the expand and the collapse.
5. hover() and press() rather than raw mouse events — they ignore touch taps
   and handle pointer capture and drag-off cancellation correctly.
6. inView() plus stagger() for an entrance sequence.
7. Escape-to-close, focus handling and keyboard activation on the morph.`
  ),

  'smooth-scroll': p(
    `BUILD a smooth-scroll page with Lenis driving parallax, velocity skew and a
sticky depth stack.`,
    `TECHNIQUE: Lenis replaces the native scroll position with an eased virtual
one and exposes scroll, velocity, progress and direction in a single event.
Every derived effect should read that one event rather than adding its own
scroll listener.`,
    `REQUIREMENTS:
1. ONE requestAnimationFrame loop calling lenis.raf(time) with the raw
   millisecond timestamp. A second competing loop is the most common source of
   stutter in Lenis projects — say so.
2. Depth parallax where each layer translates by scroll * its own depth factor.
3. A velocity-driven skew on content, eased toward the target so it decays
   smoothly instead of snapping back.
4. A sticky depth stack where each card recedes in scale and brightness as the
   next arrives.
5. Programmatic scrollTo for anchors, routed through Lenis with an offset and
   a custom easing, so it shares the same feel as manual scrolling.
6. Call lenis.resize() from a ResizeObserver and on document.fonts.ready —
   layout changes invalidate the cached document height and the page stops
   short of the bottom otherwise.
7. Leave touch alone (syncTouch: false): mobile browsers already do this well,
   and overriding it costs the address-bar collapse.
8. Under prefers-reduced-motion, do not instantiate Lenis at all and say so on
   screen. Hijacked scrolling is exactly what that setting exists for.
9. Document the accessibility risks: never break keyboard scrolling, focus
   scroll-into-view, or the browser's find-in-page.`
  ),
};
