/**
 * THE EFFECT DICTIONARY.
 *
 * One entry per individual effect — a single button, a single filter, a single
 * shader — keyed `<demo-slug>/<data-fx value>`. An element on a demo page
 * carrying data-fx="magnetic-button" resolves to `micro-interactions/magnetic-button`.
 *
 * Each prompt recreates THAT ONE THING and nothing else. They are deliberately
 * standalone: no reference to this repo, no dependency on a neighbouring
 * effect, no shared setup assumed. Paste one into a cold chat and you get back
 * a working, self-contained implementation.
 *
 * The recurring lesson in how these are written: name the MECHANISM. "Make a
 * button that reacts to the cursor" produces a hover state; "translate the
 * element by a fraction of the cursor's offset once inside a radius, and lerp
 * it back on exit" produces the actual effect.
 */

const TAIL = `
Constraints: vanilla HTML/CSS/JS, no framework and no library. Animate only
transform/opacity/filter. Honour prefers-reduced-motion. Keyboard accessible
with a visible :focus-visible ring. Give me one self-contained snippet I can
paste directly into a page, with the non-obvious lines commented.`;

/** Builds an entry. `p` is the body; the shared constraints are appended. */
const fx = (title, p) => ({ title, prompt: `${p.trim()}\n${TAIL}` });

export const FX = {
  /* ═══ micro-interactions ══════════════════════════════════════════════ */

  'micro-interactions/button-primary': fx(
    'Primary button — full state choreography',
    `Build a single primary button with ALL SEVEN states: rest, hover,
focus-visible, active, loading, success, disabled.

The mechanism that matters is ASYMMETRIC TIMING. Transitions into a state run
fast (~140ms) and transitions back out run slow (~340ms), because physical
objects respond instantly to force and settle gradually. Implement this by
setting the slow duration as the default on the element and overriding it with
the fast duration inside :active.

Requirements:
- Press scales the button to 0.97 and lifts on release.
- Hover raises it slightly and adds a coloured glow shadow tinted with the
  button's own hue — not a black shadow.
- :focus-visible uses outline with outline-offset, never border, so the ring
  cannot affect layout.
- :disabled drops opacity and sets cursor: not-allowed, and must not respond to
  hover or active.
- State every duration in a comment and justify it.`
  ),

  'micro-interactions/button-destructive': fx(
    'Destructive button — visual weight for danger',
    `Build a destructive/danger button that reads as dangerous without being
loud enough to dominate the interface.

Requirements:
- A red fill, but pick it in OKLCH at a lightness that keeps the label at 4.5:1
  contrast — most "danger red" buttons fail contrast on their own label.
- The hover state gets BRIGHTER, not darker. A destructive action that dims on
  hover reads as disabled.
- The press should feel heavier than a normal button: scale slightly less
  (0.98) and take slightly longer to settle, so it feels consequential.
- Include a variant that requires a second click to confirm, where the label
  swaps to "Are you sure?" and the button widens to fit, with the width
  animating and the two labels cross-fading in the same grid cell so nothing
  jumps.`
  ),

  'micro-interactions/ripple': fx(
    'Click ripple from the exact pointer position',
    `Build a material-style ripple that expands from the EXACT coordinates of
the click, not from the centre of the element.

The mechanism:
- On pointerdown, measure the element's bounding rect and compute the click
  position relative to it.
- The ripple's diameter must be the distance from the click point to the
  FURTHEST CORNER, computed as the max of the four corner distances. Using the
  element's width instead makes the ripple visibly stop short on wide buttons
  clicked near an edge.
- Absolutely position a circle at that point, sized to that diameter, and
  animate scale + opacity.

Critical: remove the ripple node on its animationend event. Without that, a
long-lived page accumulates thousands of dead DOM elements.

Use ONE delegated listener on a container for all ripples rather than one
listener per button. The host needs overflow: hidden and position: relative.`
  ),

  'micro-interactions/magnetic-button': fx(
    'Magnetic button — proximity pull',
    `Build a button that is attracted to the cursor before the cursor reaches it.

The mechanism:
- Listen for pointermove on the WINDOW, not on the button. The whole point is
  reacting before the pointer arrives, and an element only receives its own
  events.
- Each frame, compute the vector from the button's centre to the cursor. If the
  distance is within a radius (~90-110px plus half the button's size), translate
  the button by that vector times ~0.22.
- Translate the button's LABEL by a further ~0.12 of the same vector. That
  parallax between shell and label is what makes it read as magnetic attraction
  rather than the whole thing sliding.
- On exit, clear the transforms and let a CSS transition ease them back
  (~450ms with an ease-out curve).

Non-negotiable: gate the entire effect behind
matchMedia('(hover: hover) and (pointer: fine)'). On touch there is no hover to
preview the pull, so the button just appears to drift when tapped.`
  ),

  'micro-interactions/toggle-switch': fx(
    'Toggle switch with a squashing knob',
    `Build an iOS-style toggle switch from a native <input type="checkbox"> with
appearance: none, so keyboard operation, form participation and screen-reader
semantics all survive.

Requirements:
- The track and knob are the element and its ::after; drive the whole thing
  from --w/--h/--pad custom properties so one size change rescales it.
- The knob travels via translate, and its distance is computed from those
  variables rather than hardcoded.
- SECONDARY MOTION is the detail that sells it: while :active, squash the knob
  along its direction of travel (scale 1.18 on x, 0.9 on y). Real objects
  deform under acceleration.
- The knob's travel uses a spring-like curve — supply it as a CSS linear()
  timing function so it overshoots slightly and settles, with no JavaScript.
- :focus-visible ring on the track with outline-offset.`
  ),

  'micro-interactions/animated-checkbox': fx(
    'Checkbox with a self-drawing tick',
    `Build a checkbox whose tick draws itself stroke by stroke.

The mechanism: the tick is an inline SVG <path>. Set stroke-dasharray to the
path's total length and stroke-dashoffset to that same value, which hides it
entirely. On :checked, transition stroke-dashoffset to 0 — the stroke appears
to be drawn.

Requirements:
- Built on a real <input type="checkbox"> that is visually hidden but still
  focusable (do NOT use display:none, which removes it from the tab order).
  Style an adjacent span as the visible box.
- Delay the tick draw ~40ms behind the box's fill colour change, so the box
  fills and then the tick lands, rather than both happening at once.
- The box scales down slightly on :active.
- Focus ring driven by input:focus-visible + .box.`
  ),

  'micro-interactions/floating-label-input': fx(
    'Text field with floating label and honest validation',
    `Build a text input whose label floats up into the field when the field has
content or focus.

Two mechanisms:
1. The float is pure CSS, no JavaScript state. Put the label AFTER the input in
   the DOM and use ':placeholder-shown' — the label lifts when the input is
   focused or is not showing its placeholder. Give the input placeholder=" "
   (a single space) so :placeholder-shown behaves.
2. Validation uses ':user-invalid', NOT ':invalid'. :invalid matches an empty
   required field on page load and shouts at the user before they have typed
   anything; :user-invalid only applies after real interaction.

Requirements:
- The input needs top padding to make room for the floated label.
- A character counter that is invisible until ~75% of maxlength is used, then
  fades in, then turns red at the limit. A counter shown from the first
  keystroke is noise.
- Focus state: coloured border plus a soft ring via box-shadow.`
  ),

  'micro-interactions/submit-morph': fx(
    'Submit button that morphs idle → loading → success',
    `Build a submit button that morphs through three states without any layout
jump.

The mechanism: place all three labels (text, spinner, checkmark) in the SAME
CSS grid cell using 'grid-area: 1 / 1', and cross-fade between them with
opacity + scale. Because they are stacked rather than sequential, swapping them
cannot reflow anything. Animate the button's min-width so it contracts to a
circle for the loading and success states.

Requirements:
- A data-state attribute drives which label is visible.
- MINIMUM DISPLAY TIME: race the actual work against a ~500ms floor before
  showing success. A request returning in 40ms would otherwise flash the
  spinner and read as a glitch. Show how to implement the race.
- Set aria-busy while loading and clear it after.
- Auto-reset to idle after ~1.4s of success.`
  ),

  'micro-interactions/segmented-control': fx(
    'Segmented control with a sliding indicator',
    `Build a segmented control (a pill-shaped row of options) where the active
indicator SLIDES between options.

The mechanism that matters: use ONE shared indicator element whose position and
width are written on selection, from the target button's offsetLeft and
offsetWidth. Animating each option's own background instead produces a
cross-fade — the eye reads that as two separate things appearing and
disappearing, not as one thing moving.

Requirements:
- On first paint, position the indicator WITHOUT animating (temporarily disable
  the transition, set position, force a reflow, restore it). Otherwise the
  indicator visibly flies in from the left on load.
- Re-measure on resize and after document.fonts.ready — a web-font swap changes
  the button widths and leaves the indicator misaligned.
- Proper semantics: role="tablist"/role="tab" with aria-selected, plus
  ArrowLeft/ArrowRight keyboard navigation that moves focus and selection.`
  ),

  /* ═══ text-effects ════════════════════════════════════════════════════ */

  'text-effects/shine': fx(
    'Gradient shine sweeping across text',
    `Build a headline with a highlight that sweeps continuously across it.

The mechanism: a linear-gradient wider than the text (background-size: 250%)
with a bright band in the middle, clipped to the glyphs with
background-clip: text + color: transparent. Animate background-position to slide
the band through.

Requirements:
- Include the -webkit-background-clip prefix; without it the effect silently
  fails in some engines and the text renders invisible.
- The gradient should be dim → bright → dim so the highlight reads as a
  specular sweep rather than a colour change.
- Loop with a linear timing function — this is continuous motion, so any ease
  makes it visibly stutter at the seam.`
  ),

  'text-effects/spotlight': fx(
    'Text revealed by a spotlight following the cursor',
    `Build a headline that is dim by default, where a bright coloured version is
revealed only in a circle following the pointer.

The mechanism: two stacked copies of the text. The base is dim with a subtle
-webkit-text-stroke. A ::after pseudo-element carries the same string via
content: attr(data-text), painted with a bright gradient clipped to the glyphs,
and is masked by a radial-gradient whose centre is set from --mx/--my custom
properties written on pointermove.

Requirements:
- Write BOTH mask-image and -webkit-mask-image.
- Park the mask centre far off-element (e.g. -999px) on pointerleave so the
  reveal disappears.
- Write the custom properties, not inline styles for the gradient — the browser
  can then update the mask without recomputing the whole background.
- Keep the text in a real text node so it stays selectable and accessible; the
  duplicate in ::after is decorative.`
  ),

  'text-effects/fill-on-hover': fx(
    'Outlined text that fills on hover',
    `Build a headline rendered as an outline that fills with colour on hover,
left to right.

The mechanism: -webkit-text-stroke draws the outline and color: transparent
hides the fill. A background gradient clipped to the text provides the fill, and
you animate background-size from 0% to 100% width. Because the background is
clipped to the glyphs, the fill appears to sweep through the letterforms.

Requirements:
- background-repeat: no-repeat, or the fill tiles instead of sweeping.
- Transition background-size with an ease-out over ~600ms.
- Include :focus-within alongside :hover so it is reachable by keyboard.
- Note that -webkit-text-stroke is unprefixed nowhere and is still the only way
  to do this; provide a fallback colour for engines without it.`
  ),

  'text-effects/glitch': fx(
    'Glitch text with RGB channel separation',
    `Build a glitching headline with red and cyan copies tearing away from the
base text at random intervals.

The mechanism: two pseudo-elements holding the same string via
content: attr(data-text), one tinted red and one cyan, stacked exactly over the
original. Each is animated with clip-path: inset() values that expose only a
random horizontal BAND, and translated a few pixels sideways. Because the band
changes per keyframe, different slices of the text appear displaced.

Requirements:
- Use steps() timing so the glitch snaps between states rather than sliding
  smoothly, which is what makes it read as digital corruption.
- The two pseudo-elements need DIFFERENT animation durations (e.g. 2.6s and
  2.1s) so they desynchronise and the pattern never visibly repeats.
- Keep the element quiet most of the time — the glitch should occupy only the
  last ~12% of the keyframe timeline. A constantly glitching headline is
  unreadable and exhausting.`
  ),

  'text-effects/blur-in': fx(
    'Word-by-word blur-in on scroll',
    `Build a headline whose words fade in from a blur, one after another, as it
scrolls into view — and which plays BACKWARDS when scrolling back up.

The mechanism: CSS scroll-driven animation with animation-timeline: view(). The
stagger is NOT a delay — delays do not exist on a scroll timeline. Instead give
each word a different animation-range, offset by its index:
  animation-range: entry calc(10% + var(--i) * 6%) entry calc(45% + var(--i) * 6%);

Requirements:
- JavaScript's only job is to wrap each word in a span and set --i. Everything
  else is CSS.
- ACCESSIBILITY: splitting text destroys it for screen readers. Put the original
  string in aria-label on the container and mark every generated span
  aria-hidden="true".
- Wrap the whole thing in @supports (animation-timeline: view()) so browsers
  without support show the finished text rather than leaving it at opacity: 0
  forever.`
  ),

  'text-effects/neon': fx(
    'Neon sign text with flicker',
    `Build text that glows like a neon tube.

The mechanism: stacked text-shadows at increasing blur radius and decreasing
opacity — typically four layers from 4px to ~72px. A single large shadow reads
as a smudge; the stack reproduces the falloff of real emitted light.

Requirements:
- This ONLY works on a dark background. Glow is additive light, and there is
  nothing to add to on white. Say so and provide a dark ground.
- The text colour itself should be near-white with a trace of the glow hue, not
  the glow colour — a real tube's core is blown out.
- Add an irregular flicker keyframe: mostly steady, with brief dips at
  unpredictable percentages. An evenly pulsing neon sign looks like a CSS demo;
  a real one is broken.
- Respect prefers-reduced-motion by dropping the flicker and keeping the glow.`
  ),

  'text-effects/duotone-split': fx(
    'Text split into two colours by a hard line',
    `Build a headline sliced horizontally into two colours by a hard edge.

The mechanism: a ::after pseudo-element with the same string via
content: attr(data-text), positioned exactly over the original in a different
colour, then cut with clip-path: polygon() so only the top portion shows.
Offsetting it by 1-2px along the cut creates a subtle print-misregistration
feel.

Requirements:
- The clip percentage should be adjustable via a custom property.
- Keep the base text as a real text node for selection and accessibility; the
  pseudo-element is decorative.
- Show a variant where the split line is diagonal rather than horizontal.`
  ),

  'text-effects/scramble': fx(
    'Text that resolves from scrambled characters',
    `Build text that resolves from random glyphs into the real string, left to
right.

The mechanism that makes it look right:
- Give EACH character its own start frame and end frame, offset by its index.
  The result is a resolve "front" sweeping across the word, rather than every
  letter settling simultaneously.
- Resample each unresolved character's noise glyph only ~28% of frames. Picking
  a new random glyph every single frame reads as static noise, not as
  scrambling — this one number is the difference.
- Before its start frame a character renders as a space; after its end frame it
  is final; in between it is noise.

Requirements:
- Drive it with requestAnimationFrame and a frame counter, not setInterval.
- Cancel any in-flight animation before starting a new one, or two runs fight
  over the same element.
- Tint the unresolved glyphs a different colour so the resolve front is visible.
- Put the real string in aria-label and mark the animating output aria-hidden.`
  ),

  'text-effects/animated-gradient-text': fx(
    'Text filled with a rotating conic gradient',
    `Build a headline filled with a conic gradient whose angle rotates
continuously.

The mechanism — and this is the whole lesson: a custom property holding an
angle CANNOT be animated unless it is registered. Declare it with @property:

  @property --a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }

Without that registration the browser treats --a as an opaque string and jumps
straight from 0deg to 360deg with nothing in between. With it, the value is
typed and interpolates.

Requirements:
- conic-gradient(from var(--a), …) as the background, clipped to the glyphs with
  background-clip: text and color: transparent.
- Animate --a from 0deg to 360deg with linear timing.
- Include the -webkit-background-clip prefix.
- Pick gradient stops that return to the starting colour so the loop is seamless.`
  ),

  /* ═══ borders-glow ════════════════════════════════════════════════════ */

  'borders-glow/gradient-border-clip': fx(
    'Gradient border via background-clip',
    `Build a rounded card with a gradient border, using the two-background
technique.

The mechanism: CSS cannot paint a gradient into border-width. Instead set a
TRANSPARENT border, then give the element two background layers — the solid
fill clipped to padding-box, and the gradient clipped to border-box. The
transparent border reveals the gradient underneath.

  border: 2px solid transparent;
  background:
    linear-gradient(var(--bg), var(--bg)) padding-box,
    linear-gradient(135deg, …)            border-box;

State the limitation clearly: the card can never be transparent, because the
padding-box layer must be opaque to hide the gradient behind the content. If
you need see-through, the mask-composite technique is required instead.`
  ),

  'borders-glow/gradient-border-mask': fx(
    'Gradient border via mask-composite (the general solution)',
    `Build a rounded card with a gradient border that works over ANY background,
including a transparent card.

The mechanism: a pseudo-element covering the card, painted with the gradient,
then masked so only the ring survives. Two mask layers are composited with
'exclude', which subtracts the inner region from the whole box:

  &::before {
    content: ''; position: absolute; inset: 0;
    border-radius: inherit;
    padding: 2px;                                  /* = border width */
    background: linear-gradient(135deg, …);
    mask: linear-gradient(#000 0 0) content-box,   /* inner region */
          linear-gradient(#000 0 0);               /* whole box    */
    mask-composite: exclude;                       /* whole − inner */
    -webkit-mask-composite: xor;                   /* Safari's older keyword */
    pointer-events: none;
  }

Explain every line. Use border-radius: inherit so the ring's curvature stays
locked to the card's, and pointer-events: none so the overlay never eats clicks.`
  ),

  'borders-glow/conic-rotate': fx(
    'Rotating conic gradient border',
    `Build a card with a light that travels continuously around its border.

The mechanism — and this is the entire lesson: a custom property holding an
angle cannot be animated unless it is REGISTERED with @property. Unregistered,
the browser treats it as an opaque string and jumps from 0deg to 360deg with
nothing in between.

  @property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
  @keyframes spin { to { --angle: 360deg; } }

Requirements:
- conic-gradient(from var(--angle), …) with mostly-transparent stops and one
  bright arc, so it reads as a single travelling highlight rather than a
  spinning colour wheel.
- Confine it to the border ring using the mask-composite exclude technique.
- Add a second, blurred copy behind the card (filter: blur, z-index: -1) as the
  glow. It must be a SEPARATE element — a filter on the card itself would blur
  the content too.`
  ),

  'borders-glow/spotlight-grid': fx(
    'Spotlight cards following the pointer',
    `Build a grid of cards where a soft light follows the cursor across them,
lighting both the card surface and its border.

The mechanism:
- ONE delegated pointermove listener on the grid container, not one per card.
  On move, find the card under the pointer and write two custom properties
  (--mx, --my) holding the pointer position relative to that card.
- The surface wash is a radial-gradient positioned at var(--mx) var(--my).
- The border highlight is the SAME gradient on a second layer, clipped to the
  edge with the mask-composite exclude trick.

Why it stays fast: JavaScript only writes two custom properties. It never
touches a layout-affecting style, and the gradients repaint without any
per-frame style recalculation. Adding a hundred cards costs nothing extra.

Fade the effect in/out with opacity on container hover so cards are calm at rest.`
  ),

  'borders-glow/rim-highlight': fx(
    'Rim highlight for dark-mode depth',
    `Build a dark card that reads as a physical raised surface.

The mechanism: on a near-black page a drop shadow has nothing to darken, so
elevation must come from a LIGHTER FILL plus a one-pixel lit edge along the
top. That inset top highlight is what does almost all the work:

  box-shadow:
    inset 0  1px 0 oklch(100% 0 0 / 0.11),   /* lit top edge   */
    inset 0 -1px 0 oklch(0%   0 0 / 0.30),   /* shaded bottom  */
    0 1px 2px  oklch(0% 0 0 / 0.5),
    0 8px 22px oklch(0% 0 0 / 0.3);

Show three cards side by side — border only, plus lighter fill, and the full
treatment — so the contribution of each layer is visible. Add a subtle vertical
gradient to the fill so the surface is not perfectly flat.`
  ),

  'borders-glow/marching-dashes': fx(
    'Animated dashed border on rounded corners',
    `Build a drop-zone with a dashed border whose dashes march around the
perimeter.

The mechanism: do NOT use CSS 'border: dashed'. It cannot be animated, and it
renders the dash pattern badly around rounded corners. Instead overlay an SVG
<rect> with an rx matching the card's border-radius, and animate
stroke-dashoffset:

  rect { fill: none; stroke-width: 2; stroke-dasharray: 10 8; rx: 16; }
  @keyframes march { to { stroke-dashoffset: -18; } }

The offset must equal the sum of the dasharray values (10 + 8) for a seamless
loop — any other value visibly jumps at the end of each cycle.

Size the rect with width/height of calc(100% - 2px) and x/y of 1 so the stroke
is not clipped at the edges. Set pointer-events: none on the SVG.`
  ),

  'borders-glow/glow-behind': fx(
    'Glow that does not blur the content',
    `Build a card with a coloured glow around it that intensifies on hover.

The mechanism people get wrong: applying filter: blur() to the element blurs its
TEXT as well. Instead put a blurred, slightly scaled copy BEHIND it:

  .card { position: relative; }
  .card::before {
    content: ''; position: absolute; inset: 0; z-index: -1;
    border-radius: inherit;
    background: linear-gradient(135deg, …);
    filter: blur(22px);
    opacity: .5; scale: .94;
    transition: opacity .4s, scale .4s;
  }
  .card:hover::before { opacity: .9; scale: 1.04; }

The card itself needs an opaque background so the blurred layer does not show
through the middle. Animate only opacity and scale — both composited.`
  ),

  'borders-glow/focus-ring': fx(
    'A focus ring that cannot shift layout',
    `Demonstrate the correct way to draw a keyboard focus ring, contrasted with
the common mistake.

WRONG: changing 'border' on focus. A border participates in layout, so the
element's box changes size and the button visibly jumps when focused.

RIGHT: 'outline' with 'outline-offset'. Outline is painted outside the box and
takes part in no layout calculation, so it cannot move anything. outline-offset
gives it breathing room without needing a wrapper element.

  button:focus-visible { outline: 2px solid <accent>; outline-offset: 3px; }

Requirements:
- Use :focus-visible, not :focus, so the ring appears for keyboard users but not
  on mouse click.
- Never write 'outline: none' without providing a replacement indicator.
- Build two buttons side by side, one with each approach, so the jump is
  observable when tabbing between them.`
  ),

  /* ═══ elevation ═══════════════════════════════════════════════════════ */

  'elevation/layered-shadow': fx(
    'Layered shadow that reads as real depth',
    `Build a card with a shadow that looks physically plausible rather than
cheap.

The mechanism: a single box-shadow approximates penumbra with a straight ramp,
which the eye reads as fake. Real penumbra is dark and sharp near the object and
soft and faint further away. Stack 5-6 shadows whose BLUR ROUGHLY DOUBLES and
whose opacity slightly decreases at each step:

  box-shadow:
    0  1px  1px oklch(25% .03 265 / .07),
    0  2px  2px oklch(25% .03 265 / .07),
    0  4px  4px oklch(25% .03 265 / .07),
    0  8px  8px oklch(25% .03 265 / .07),
    0 16px 16px oklch(25% .03 265 / .07),
    0 32px 32px oklch(25% .03 265 / .05);

Show a flat single-shadow card next to a layered one at the same apparent
height so the difference is unmissable. Use a light background — shadows are a
light-mode phenomenon.`
  ),

  'elevation/elevation-ramp': fx(
    'A generated six-level elevation scale',
    `Build a function that generates a consistent elevation scale, and render
levels 0-5 as swatches.

The mechanism: generate every level from ONE function rather than hand-tuning
each, so the scale stays internally consistent. For level n: use 3+n stops,
scale the whole stack by ~1.6^n, let blur grow geometrically while the vertical
offset tracks at about half that rate (which is what makes higher levels read as
further from the surface rather than merely blurrier), and decay per-stop alpha
slightly so the outermost ring is faintest.

Always prepend a tight, comparatively dark contact shadow (0 1px 2px) that
barely changes with elevation — it is what anchors the object to the page.

Expose the results as CSS custom properties, and map levels to MEANING, not
taste: 0 flush, 1 cards, 2 raised buttons, 3 dropdowns, 4 modals, 5 dragged.
Components at the same importance get the same level.`
  ),

  'elevation/light-source': fx(
    'One shared light source across many elements',
    `Build a scene of several cards whose shadows all derive from a single,
draggable light position.

The mechanism: store the light as two custom properties on a common ancestor
(--light-x, --light-y, normalised 0-1). Every card computes its own offset from
those in calc(), so moving the light moves every shadow coherently:

  --dx: calc((0.5 - var(--light-x)) * 60px);
  --dy: calc((0.5 - var(--light-y)) * 60px);
  box-shadow:
    calc(var(--dx) * .1) calc(var(--dy) * .1) 2px  …,
    calc(var(--dx) * .3) calc(var(--dy) * .3) 6px  …,
    var(--dx) var(--dy) 34px …;

Why it matters: shadows pointing in inconsistent directions are the clearest
sign an interface's shadows were tuned one component at a time.

Make the light draggable with pointer capture, AND operable with arrow keys —
a drag handle that only responds to a pointer is unfinished.`
  ),

  'elevation/tinted-shadow': fx(
    'Shadows are not black',
    `Demonstrate why a pure-black shadow looks wrong, and what to use instead.

The mechanism: a black shadow desaturates whatever it falls on, so it reads as
dirt rather than as an absence of light. A real shadow carries the hue of the
surface beneath it. Build the shadow colour from that surface's hue at low
lightness — e.g. oklch(45% 0.16 <surface-hue> / 0.16) — or derive it with
color-mix(in oklch, <surface>, black).

Show two identical cards on a saturated background, one with a black shadow and
one with a hue-matched shadow, so the difference is directly comparable. Keep
everything else identical.`
  ),

  'elevation/contact-shadow': fx(
    'The contact shadow that grounds an object',
    `Demonstrate the contact shadow: the small detail that decides whether an
element rests on the page or floats above it.

The mechanism: soft, wide shadows alone make a card appear to hover a
centimetre off the surface. Adding ONE tight, dark, barely-blurred shadow
directly beneath it anchors it:

  0 1px 2px oklch(25% .03 265 / 0.28)   /* ← the contact shadow */

Build two cards with identical soft shadow stacks, one with the contact shadow
and one without, labelled "floating" and "resting". The change is a single line
and the perceptual difference is large — that contrast is the point of the
demo.`
  ),

  'elevation/inset-pressed': fx(
    'Pressed and recessed states with inset shadows',
    `Build a button that physically depresses when pressed, and a recessed
"well" container.

The mechanism: inset shadows invert the elevation logic. A raised control has an
outer shadow and no inner one; a pressed control loses the outer shadow and
gains an inner one, and shifts down by 1px:

  button        { box-shadow: 0 1px 1px …, 0 2px 4px …; }
  button:active { translate: 0 1px; box-shadow: inset 0 2px 4px …; }

For a permanently recessed well (a track, an input, a code block), use a
slightly darker fill plus a soft inset shadow at the top edge only, which is
where a real recess would catch shade.

Keep the press transition fast (~120ms) — a slow depression feels broken.`
  ),

  'elevation/dark-elevation': fx(
    'Elevation in dark mode',
    `Demonstrate why a light-mode shadow scale fails on a dark surface, and what
replaces it.

The mechanism: on a near-black page a shadow has nothing left to darken, so it
barely registers. Dark-mode elevation comes from two things instead — a LIGHTER
SURFACE FILL as the element rises, and a one-pixel RIM HIGHLIGHT along the top
edge that reads as an edge catching light.

Build three cards to compare:
1. Dark fill + a big shadow (barely reads — this is the reused light-mode scale)
2. Lighter fill only (better, but flat and the edges are ambiguous)
3. Lighter fill + inset top highlight + a tight shadow (correct)

  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 0.07),   /* the rim — this is the one */
    0 1px 2px  oklch(0% 0 0 / 0.4),
    0 8px 20px oklch(0% 0 0 / 0.35);`
  ),

  'elevation/animate-elevation': fx(
    'Animating elevation without repainting',
    `Build a card that rises on hover, WITHOUT animating box-shadow.

The mechanism: box-shadow is not a compositor property, so transitioning it
forces the browser to repaint the element every frame. Instead put the raised
shadow on a pseudo-element and cross-fade its opacity — visually identical,
runs entirely on the GPU:

  .card { position: relative; transition: translate .25s; }
  .card::after {
    content: ''; position: absolute; inset: 0; border-radius: inherit;
    box-shadow: /* the RAISED shadow */;
    opacity: 0; transition: opacity .25s;
    pointer-events: none;
  }
  .card:hover { translate: 0 -4px; }
  .card:hover::after { opacity: 1; }

The card keeps its resting shadow as a normal box-shadow; only the difference
is cross-faded. Explain why opacity and transform are the only two properties
that get a free ride on the compositor.`
  ),

  /* ═══ loading-states ══════════════════════════════════════════════════ */

  'loading-states/skeleton-card': fx(
    'Skeleton that matches its loaded content exactly',
    `Build a card component rendered three ways from one source of truth:
skeleton, loaded, and error — and make the geometry identical across all three.

The mechanism that matters: the skeleton is NOT a separate component. It is the
same markup with the text swapped for bars of the SAME line-height, and the
avatar swapped for a circle of the SAME diameter. Drive both from shared custom
properties (--avatar, --line-h) so they cannot drift apart.

Why: a skeleton whose bars are a different height from the text, or whose card
is shorter than the loaded one, produces a visible jolt at exactly the moment
the user starts reading. That jolt is worse than showing nothing at all.

Requirements:
- A toggle to flip between the three states so the geometry can be compared.
- Bars at varying widths (100%, 100%, ~70%) so the last line looks like a real
  ragged line ending, not a solid block.
- aria-busy="true" on the container, and aria-hidden on the skeleton bars —
  announcing twelve empty grey boxes is worse than announcing nothing.`
  ),

  'loading-states/shimmer': fx(
    'Skeleton shimmer that does not repaint',
    `Build the sweeping shimmer highlight that travels across skeleton
placeholders.

The mechanism: a pseudo-element carrying a
linear-gradient(90deg, transparent, white/7%, transparent), translated from
-100% to 100%. Animate TRANSLATE, never background-position — background-position
repaints the element every frame, while a transform is composited.

  .sk::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, oklch(100% 0 0 / .07) 50%, transparent);
    translate: -100% 0;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { to { translate: 100% 0; } }

The host needs overflow: hidden and position: relative.

Under prefers-reduced-motion, replace the sweep with a slow opacity pulse
rather than removing the feedback entirely — the user still needs to know
something is loading.`
  ),

  'loading-states/load-thresholds': fx(
    'Loading indicators with delay and minimum display time',
    `Implement the two guards that turn flickering loading states into something
that reads as deliberate.

1. DELAY BEFORE SHOWING (~100ms). Do not show a spinner immediately — schedule
   it. If the response arrives first, cancel the timer and the user never sees
   a flash.
2. MINIMUM DISPLAY TIME (~500ms). Once the indicator IS shown, keep it up for a
   floor duration. Otherwise a response arriving 30ms later makes it blink out
   and read as a glitch.

  let shownAt = 0;
  const timer = setTimeout(() => { show(); shownAt = Date.now(); }, 100);
  const data = await work();
  clearTimeout(timer);
  if (shownAt) {
    const elapsed = Date.now() - shownAt;
    if (elapsed < 500) await sleep(500 - elapsed);
    hide();
  }

Also encode the perceptual bands: under 100ms show nothing; 100ms-1s a spinner;
over 1s determinate progress or a skeleton; over ~8s explain and offer a way
out. Build a demo with a button per band that simulates that duration.`
  ),

  'loading-states/progress-determinate': fx(
    'Progress that never lies',
    `Build both a determinate and an indeterminate progress bar, and be explicit
about when each is honest.

Determinate: only when you genuinely know the total. Animate width, expose
role="progressbar" with aria-valuenow/valuemin/valuemax updated as it moves.
Advance it in UNEVEN increments with small random pauses — real transfers are
uneven, and a perfectly smooth bar reads as fake because it usually is.

Indeterminate: when the total is unknown. A shuttle that travels across the
track and never claims a percentage:

  .bar--indet .fill { width: 35%; animation: shuttle 1.5s ease-in-out infinite; }
  @keyframes shuttle { 0% { translate: -100% 0; } 100% { translate: 340% 0; } }

State the rule plainly: never fake a percentage. Users notice a bar that parks
at 90%, and afterwards they distrust every progress bar you show them.`
  ),

  'loading-states/optimistic-like': fx(
    'Optimistic UI with a visible rollback',
    `Build a like/favourite button that updates instantly and reconciles with
the server afterwards.

The mechanism has two halves, and the second is the one everyone skips:
1. On click, update the count and pressed state IMMEDIATELY — same frame as the
   click. Snapshot the previous values first.
2. If the request fails, restore the snapshot AND make the reversion VISIBLE —
   a shake animation plus an explanatory message. A silent revert leaves the
   user believing the action succeeded, which is worse than never having been
   optimistic at all.

Requirements:
- Guard against double-submits while a request is in flight.
- A checkbox to force the simulated request to fail, so the rollback path is
  demonstrable rather than theoretical.
- Announce the outcome through a role="status" aria-live="polite" region.
- Use aria-pressed on the button for its toggle state.`
  ),

  'loading-states/streaming-list': fx(
    'Streaming results as they arrive',
    `Build a result list that renders items incrementally as they arrive rather
than waiting for the complete set.

The mechanism: append each item as its data resolves, with a short entrance
animation. The stagger is the ARRIVAL itself — do not add artificial
animation-delay per item, because that fakes a rhythm the data does not have
and delays content the user could already be reading.

  li { animation: arrive .45s cubic-bezier(.16,1,.3,1) both; }
  @keyframes arrive { from { opacity: 0; translate: 0 12px; } }

Requirements:
- aria-busy="true" on the list while items are still arriving, cleared on the
  last one.
- Reserve nothing — the list grows downward, so arriving items must not push
  already-read content around.
- Simulate irregular arrival intervals so it behaves like a real stream.`
  ),

  'loading-states/empty-state': fx(
    'An empty state worth designing',
    `Build three empty states, contrasting a bare one with two well-designed
ones.

The rule: an empty state must answer three questions — what would be here, why
it is not here, and what to do about it. "No data" answers none of them.

Build:
1. A bare "No data" for comparison.
2. A first-run empty state: a simple inline SVG illustration, a heading naming
   what is missing, one sentence explaining the precondition, and a primary
   action button.
3. A no-search-results state: quote the actual query back, and offer a concrete
   next step ("clear the 3 active filters") rather than "try again".

Keep the illustration as inline SVG using currentColor at low opacity so it
inherits the theme. Constrain the copy to ~32ch so it reads as a caption, not a
paragraph.`
  ),

  /* ═══ noise-texture ═══════════════════════════════════════════════════ */

  'noise-texture/film-grain': fx(
    'Film grain that de-bands gradients',
    `Build a reusable grain overlay whose real job is removing the visible
banding in 8-bit CSS gradients.

The mechanism: SVG feTurbulence generates noise with no image asset and no
network request. Desaturate it with feColorMatrix, then overlay it at low
opacity — it dithers the gradient's step boundaries so the eye averages them
back to smooth.

  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>

CRITICAL for performance: do NOT leave a live filter: url(#n) on a large or
scrolling element — SVG filters rasterise on the CPU in several engines.
Serialise the filter ONCE into a data: URI and use it as an ordinary tiling
background-image. Show how to build that URI with encodeURIComponent.

stitchTiles="stitch" is what makes the noise tile seamlessly. Blend with
mix-blend-mode: overlay so it perturbs luminance without shifting hue.

Show a banded gradient with and without the overlay, side by side.`
  ),

  'noise-texture/mesh-gradient': fx(
    'Animated mesh gradient backdrop',
    `Build a soft, slowly drifting multi-colour mesh gradient background.

The mechanism: four to six oversized radial-gradients at different positions,
layered in one background, then heavily blurred (filter: blur(48px)) so they
melt into each other.

The performance point: animate a TRANSFORM on the blurred layer, never the
gradient stop positions. Moving the stops repaints the entire surface every
frame; translating and rotating a composited layer costs nothing.

  .mesh__layer {
    position: absolute; inset: -40%;      /* oversized so edges never show */
    filter: blur(48px) saturate(150%);
    background: radial-gradient(...), radial-gradient(...), ...;
    animation: drift 22s ease-in-out infinite alternate;
    will-change: transform;
  }
  @keyframes drift { to { transform: translate3d(6%, -5%, 0) scale(1.2) rotate(12deg); } }

inset: -40% matters — at inset: 0 the blurred edges reveal the container's
corners. Pair it with a grain overlay, because a large blurred gradient bands
badly on its own.`
  ),

  'noise-texture/bayer-dither': fx(
    'Ordered (Bayer) dithering',
    `Build a deliberately dithered gradient using a 4x4 Bayer threshold matrix.

The mechanism: a Bayer matrix holds 16 thresholds arranged so that neighbouring
cells differ maximally. Tiled at 4px over a gradient and composited with
hard-light, each pixel flips to light or dark depending on whether the
gradient's value at that point exceeds its cell's threshold. That spatial
variation is what turns two colours into the appearance of seventeen levels.

  const M = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];

Generate it as a 4x4 SVG of 16 grey squares (value/16 * 255) serialised to a
data: URI, with shape-rendering="crispEdges" so the cells do not antialias.
Apply with background-size: 4px 4px and mix-blend-mode: hard-light.

This is the opposite intent to grain: banding on purpose, for a retro look, and
unlike a bitmap it scales to any size.`
  ),

  'noise-texture/halftone': fx(
    'Halftone dot screen',
    `Build a print-style halftone dot screen over an image or gradient.

The mechanism: a repeating-radial-gradient of hard-edged dots, tiled small
(~7px), rotated off-axis, and composited with color-burn.

  background-image: radial-gradient(circle at center, black 0 32%, transparent 34%);
  background-size: 7px 7px;
  rotate: 15deg;
  mix-blend-mode: color-burn;

The 15deg rotation is not decorative. Real print screens are set off-axis
(15deg/45deg) precisely so the dot rosette does not align with the grid beneath
it and produce moiré — the identical reasoning applies to a pixel grid.

Oversize the overlay (inset: -30%) so rotating it does not expose the corners.`
  ),

  'noise-texture/paper-fibre': fx(
    'Paper fibre texture',
    `Build a warm paper surface with visible fibre, using no image assets.

The mechanism: feTurbulence with a STRONGLY ANISOTROPIC baseFrequency — a very
low value on x and a high one on y (e.g. "0.04 1.4") stretches the noise into
long fine fibres rather than isotropic speckle. Desaturate it, lower its alpha
with feComponentTransfer, and multiply it over a warm off-white.

  <feTurbulence type="fractalNoise" baseFrequency="0.04 1.4" numOctaves="5" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>

Serialise to a data: URI and apply as a background-image with
mix-blend-mode: multiply at ~55% opacity.

The point to make: no single fibre is visible. It is the ABSENCE of a perfectly
flat field that reads as material.`
  ),

  'noise-texture/crt-scanlines': fx(
    'CRT scanlines and vignette',
    `Build a CRT monitor effect: scanlines, phosphor glow and a curved vignette.

Three layers:
1. Scanlines — a repeating-linear-gradient of a 1px dark band every 3px, on a
   pseudo-element with pointer-events: none.
   repeating-linear-gradient(to bottom, oklch(0% 0 0 / .35) 0 1px, transparent 1px 3px)
2. Vignette — a radial-gradient that is transparent to ~55% then darkens hard
   toward the corners, simulating the tube's curvature.
3. Phosphor glow on the text — a green foreground with a matching text-shadow
   at ~10px blur, which is what makes it read as EMITTED light rather than
   printed ink.

Keep the scanline period at 3px or larger; at 2px it aliases badly on
non-integer device pixel ratios and produces a shimmering moiré when the page
scrolls.`
  ),
};
