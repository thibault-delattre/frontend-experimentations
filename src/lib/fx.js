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

  /* ═══ image-treatment ═════════════════════════════════════════════════ */

  'image-treatment/duotone': fx(
    'Duotone image, two ways',
    `Build a duotone treatment mapping an image's shadows to one colour and its
highlights to another. Implement BOTH approaches and explain the difference.

1. CSS: filter: grayscale(1) contrast(1.25) on the image, then a
   ::after overlay carrying a two-stop linear-gradient with
   mix-blend-mode: color. 'color' takes hue and chroma from the top layer and
   luminance from below, which is exactly a duotone.
2. SVG: an feColorMatrix that converts to luminance, then feComponentTransfer
   with a per-channel 'table' of two values — the shadow colour at 0 and the
   highlight colour at 1.

The SVG version is more faithful because it remaps each channel independently
rather than compositing a flat colour on top; the CSS version is one line and
needs no filter definition. Make both hues adjustable.`
  ),

  'image-treatment/blend-modes': fx(
    'Blend-mode reference matrix',
    `Build a grid showing the SAME image under the same gradient overlay in
eight different mix-blend-mode values, each labelled with what it is actually
for — not just what it looks like.

Cover: normal, multiply (darkens, keeps shadows), screen (lightens, lifts
blacks), overlay (multiply in shadows, screen in highlights — contrast),
soft-light (a gentler overlay, the safe tinting default), color-burn
(aggressive, heavy saturation), hue (hue from the overlay, luminance from the
image), luminosity (lightness from the overlay, colour from the image).

The practical point to state: overlay and soft-light perturb luminance while
preserving the underlying colour, which is what you want for tinting and
texture. multiply and screen shift the whole surface darker or lighter and will
quietly break your contrast ratios.

Each cell needs isolation: isolate or the blend escapes to the page behind it.`
  ),

  'image-treatment/gradient-mask': fx(
    'Fading an image out with a gradient mask',
    `Build an image that fades smoothly to nothing at its lower edge, and a
second one with a radial vignette mask.

The mechanism: mask-image takes the ALPHA of a gradient as a stencil. Unlike a
gradient overlay painted in the page's background colour, a mask lets whatever
is actually behind the image show through — so it works on any background,
including a photo or a gradient.

  mask-image: linear-gradient(to bottom, #000 35%, transparent 95%);
  -webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent 95%);

Write BOTH the prefixed and unprefixed properties. Omitting the -webkit- form
makes older Safari show the image completely unmasked — a silent failure, not a
visible error, which is why it survives review so often.`
  ),

  'image-treatment/clip-reveal': fx(
    'clip-path reveal on hover',
    `Build two image reveals driven by clip-path: a straight inset() wipe and a
diagonal polygon() sweep.

The mechanism: clip-path is compositor-friendly, so animating it is cheap —
unlike animating width/height, which forces layout on every frame.

  img { clip-path: inset(0 100% 0 0); transition: clip-path .8s cubic-bezier(.16,1,.3,1); }
  :hover img, :focus-within img { clip-path: inset(0 0 0 0); }

Requirements:
- Include :focus-within alongside :hover and make the container focusable, so
  the reveal is reachable by keyboard rather than being mouse-only.
- For the polygon variant, keep the SAME NUMBER OF POINTS in both states or the
  browser cannot interpolate and the shape will snap instead of animating.`
  ),

  'image-treatment/ken-burns': fx(
    'Ken Burns slow zoom',
    `Build a slow, continuous zoom-and-pan across a still image.

The mechanism and its one gotcha: the image must START oversized. Animate scale
from about 1.15 to 1.32 with a small translate. If you begin at scale 1, ANY
translate immediately drags the image's own edge into frame and exposes the
container's background — which is the single most common bug in this effect.

  .ken img { scale: 1.15; transform-origin: 60% 40%; animation: ken 18s ease-in-out infinite alternate; }
  @keyframes ken { from { scale: 1.15; translate: 0 0; } to { scale: 1.32; translate: -3% 2%; } }

Use 'alternate' so it reverses rather than jumping back. Put overflow: clip on
the container, offset transform-origin away from centre so the motion has a
direction, and keep it slow — 15-20s. Disable entirely under
prefers-reduced-motion.`
  ),

  'image-treatment/has-sibling-dim': fx(
    'Gallery that dims siblings on hover, no JavaScript',
    `Build an image gallery where hovering one item desaturates and darkens all
the others.

The mechanism: :has() lets the CONTAINER ask whether it contains a hovered
child, so the parent can restyle all its children. Before :has() this required
a mouseenter listener and a class toggle on the parent.

  .gallery:has(.item:hover) .item        { filter: grayscale(1) brightness(.55); }
  .gallery:has(.item:hover) .item:hover  { filter: none; scale: 1.03; }

Order matters: the general rule dims everything, then the more specific
:hover rule restores the hovered one.

Transition filter and scale together (~400ms) so the change reads as one
gesture. Add :focus-within alongside :hover for keyboard parity.`
  ),

  'image-treatment/blur-up': fx(
    'Progressive blur-up image loading',
    `Build a blur-up placeholder: a tiny blurred thumbnail that cross-fades to
the full image once it is ready.

The mechanism, and the detail that matters: wait on img.decode(), NOT the load
event. 'load' fires before the bitmap is decoded and ready to paint, so
implementations built on it still flash a blank frame on slower devices.

  const full = new Image();
  full.src = src;
  await full.decode();          // resolves only when paintable
  wrapper.classList.add('loaded');

The placeholder is the same image at ~20px wide, upscaled and blurred
(filter: blur(18px); scale: 1.1 — the scale hides the blur's soft edges). In
production ship it as an inline base64 data URI in the HTML so it needs no
request at all.

Cross-fade with opacity on both layers, and reserve the box with aspect-ratio
so nothing shifts when the image arrives.`
  ),

  /* ═══ cursor-fx ═══════════════════════════════════════════════════════ */

  'cursor-fx/custom-cursor': fx(
    'Custom cursor with a lagging ring',
    `Build a custom cursor: a small dot that tracks the pointer exactly, and a
larger ring that lags behind it.

The mechanism: the dot is written to the true pointer position every frame with
no easing — the user's hand is the ground truth and any lag there reads as a
fault. The ring lerps toward the target:

  ring.x += (pointer.x - ring.x) * 0.15;

That 0.15 IS the effect. At 0.4 the ring is indistinguishable from the dot; at
0.05 the page feels like it is struggling.

Requirements:
- Context awareness driven by a data-cursor attribute read from
  e.target.closest('[data-cursor]') — so adding a new interactive element means
  adding one attribute, not editing the cursor code.
- mix-blend-mode: difference keeps the ring visible over any background. Note
  that it forces a stacking context and a compositing pass.
- Over text inputs, HIDE the custom cursor and restore the native I-beam. You
  cannot type accurately without a real caret.
- Scope cursor: none to the elements you have replaced, never to body — if the
  script fails to load, a global rule leaves the user with no cursor at all.
- Gate the whole thing behind '(hover: hover) and (pointer: fine)'.`
  ),

  'cursor-fx/magnetic-cursor-button': fx(
    'Buttons that pull toward the cursor',
    `Build buttons that are attracted to the cursor as it approaches, with the
label moving further than the button itself.

The mechanism: on each frame, compute the vector from the button's centre to
the pointer. Inside a radius (~110px plus half the button's size), translate the
button by vector * 0.22 and its inner label by a further vector * 0.12. That
PARALLAX between shell and label is what makes it read as magnetic attraction
rather than the whole element sliding around.

Outside the radius, clear both transforms and let a CSS transition (~450ms,
ease-out) carry them home.

Listen on the window, not the element — the point is reacting before the
pointer arrives, and an element only receives its own events. Gate behind
'(hover: hover) and (pointer: fine)' and disable under prefers-reduced-motion.`
  ),

  'cursor-fx/cursor-trail': fx(
    'Canvas ribbon trail following the cursor',
    `Build a glowing ribbon that trails behind the cursor across a panel.

The mechanism: keep a FIXED-LENGTH array of recent pointer positions (~26) and
shift the oldest out as new ones arrive. Draw it on a canvas as connected
segments whose width and alpha ramp from 0 at the tail to full at the head.

Draw on a canvas, not with DOM nodes — a DOM trail creates and destroys dozens
of elements per second and the compositor will make you pay for it.

Fade the canvas instead of clearing it, using
globalCompositeOperation = 'destination-out' with a low-alpha fill. That decays
old pixels without touching the ones being drawn this frame, which is what
gives the trail its soft tail for free.

Store points in canvas pixel space (multiply by devicePixelRatio) or the trail
drifts away from the cursor on retina displays.`
  ),

  'cursor-fx/spotlight-reveal': fx(
    'Spotlight revealing a hidden layer',
    `Build two stacked layers where the top one is visible only inside a circle
following the pointer.

The mechanism: mask-image with a radial-gradient whose centre is driven by
--mx/--my custom properties written on pointermove.

  .top {
    mask-image: radial-gradient(circle 110px at var(--mx) var(--my), #000 0%, transparent 100%);
    -webkit-mask-image: radial-gradient(circle 110px at var(--mx) var(--my), #000 0%, transparent 100%);
  }

Because it is a mask rather than an overlay, the revealed layer can be
anything — an image, a video, live text.

Park the centre far off-element on pointerleave so the reveal disappears
cleanly. Write custom properties rather than restyling the whole mask string,
and both prefixed and unprefixed forms.`
  ),

  'cursor-fx/hover-peek': fx(
    'Image preview following the cursor over a list',
    `Build a list of links where hovering a row shows a preview image that
follows the cursor and tilts with pointer velocity.

The mechanism: a fixed-position preview element, positioned near the pointer
each frame, with a rotation derived from horizontal pointer VELOCITY (the
per-frame delta, damped toward zero) rather than from position. That is what
makes it feel like it has weight instead of being pinned.

  peek.style.rotate = clamp(-14, vx * 0.35, 14) + 'deg';
  vx *= 0.9;   // damp each frame so it settles when the pointer stops

Requirements:
- Swap the image on pointerenter per row; fade and scale it in.
- The rows must remain real links with a visible hover state. The peek is an
  enhancement, never the only affordance.
- Gate behind '(hover: hover) and (pointer: fine)'.`
  ),

  /* ═══ theming ═════════════════════════════════════════════════════════ */

  'theming/token-tiers': fx(
    'Three-tier design token architecture',
    `Explain and implement a token architecture that survives a real product.

Three tiers:
1. PRIMITIVES — raw scale values, theme-agnostic. --blue-500 means one specific
   colour in every theme, forever.
2. SEMANTIC — role names that repoint per theme: --ui-surface, --ui-text,
   --ui-accent, --ui-border, --ui-danger.
3. COMPONENT — consumption. Components reference ONLY tier 2.

The one rule that makes it work: a component may NEVER reference a primitive.
The moment a card says background: var(--grey-0) it is hardcoded to light mode
and no amount of theming will move it.

Demonstrate the payoff with a single --brand-h hue variable that re-themes the
entire mock UI, including the neutrals — tint the greys with a trace of the
brand hue (chroma ~0.004-0.02) so they belong to the palette instead of sitting
dead beside it.`
  ),

  'theming/theme-switcher': fx(
    'Theme switcher with no flash of wrong theme',
    `Build a light/dark/system theme switcher that persists across reloads.

THE CRITICAL PART: prevent the flash of wrong theme with a SYNCHRONOUS INLINE
script in <head>, before any stylesheet. A module script is deferred and runs
after first paint, so the user sees a flash of the wrong theme before it
applies.

  <script>
    const s = localStorage.getItem('theme') || 'system';
    const dark = s === 'dark' ||
      (s === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  </script>

Also:
- Distinguish the stored PREFERENCE from the resolved THEME. "system" must
  re-resolve when the OS setting changes while the page is open — listen for
  change on the media query.
- Set color-scheme per theme, or form controls, scrollbars and the canvas
  behind the page keep rendering for the opposite theme.
- Note that dark mode is not an inversion: elevation there needs a lighter fill
  plus a 1px top rim highlight, not a bigger shadow.
- If you animate the swap with startViewTransition, catch the rejection on the
  returned transition's 'finished' promise. Switching again while one is still
  running skips the old transition and rejects that promise with an AbortError;
  unhandled, it shows up as a console error every time a user clicks quickly.`
  ),

  'theming/view-transition-theme': fx(
    'Theme swap that expands from the click point',
    `Animate a theme change so the new theme washes over the page from wherever
the user clicked.

The mechanism: wrap the theme change in document.startViewTransition(), then
animate ONLY the new snapshot with an expanding clip-path circle centred on the
click coordinates. Leaving the old snapshot static underneath is what makes it
read as the new theme being revealed, rather than a cross-fade.

  ::view-transition-old(root) { animation: none; }
  ::view-transition-new(root) { animation: reveal .55s ease-out; }
  @keyframes reveal {
    from { clip-path: circle(0%   at var(--tx) var(--ty)); }
    to   { clip-path: circle(150% at var(--tx) var(--ty)); }
  }

Write --tx/--ty as percentages from the click position before starting the
transition. 150% guarantees the circle covers the furthest corner.

Feature-detect startViewTransition and fall back to an instant swap; skip the
animation entirely under prefers-reduced-motion.`
  ),

  'theming/contrast-audit': fx(
    'Live contrast audit of your own tokens',
    `Build a table that measures the real contrast ratio of every text/background
pair in a themed UI, and flags failures.

The mechanism worth knowing: to resolve an arbitrary CSS colour — including
oklch() and a nested var() chain — to concrete RGB, assign it to a throwaway
element's color and read getComputedStyle back. The browser does the conversion
for you, and you measure what was ACTUALLY PAINTED rather than what you think
the token holds.

  probe.style.color = getComputedStyle(app).getPropertyValue('--ui-text');
  const rgb = getComputedStyle(probe).color.match(/[\\d.]+/g).map(Number);

Then compute WCAG 2.1 relative luminance and the (L1+0.05)/(L2+0.05) ratio,
and check each pair against its target (4.5:1 body text, 3:1 for borders and
large text).

Recompute on every theme change. A theme is not finished until every pair
passes in every theme.`
  ),

  /* ═══ type-scale ══════════════════════════════════════════════════════ */

  'type-scale/fluid-scale': fx(
    'Fluid modular type scale with clamp()',
    `Build a type scale where every size interpolates smoothly between a mobile
and a desktop viewport, with NO breakpoints.

The mechanism: each size is clamp(min, preferred, max) where the preferred term
is the straight line through both endpoints. Solve for it once:

  slope     = (maxSize - minSize) / (maxVw - minVw)
  intercept = minSize - slope * minVw
  preferred = intercept + slope * 100vw

Generate every step from ONE ratio (1.2 minor third for UI, 1.333 perfect
fourth for editorial) as base * ratio^step, and emit them as custom properties.

Two things that matter:
- Keep the rem intercept in the preferred term. A pure vw value ignores the
  user's browser font-size setting and is an accessibility failure.
- Scale the FLUID RANGE with the step: a hero headline should shrink hard on
  mobile, body copy barely at all. A single travel factor for every step makes
  small text illegible or huge text absurd.`
  ),

  'type-scale/measure': fx(
    'Line length (measure) as a real constraint',
    `Build a demonstration of measure — the number of characters per line — at
30ch, 45ch, 65ch and 90ch, each labelled with why it does or does not work.

The rule: 45-75 characters is the comfortable band. Below ~45 the eye returns
too often and reading becomes choppy; above ~75 it loses its place travelling
back to the start of the next line.

Set it with max-width in ch units so the constraint tracks the actual font
rather than a guessed pixel width. Note that ch is the width of the "0" glyph,
so it is an approximation that varies by typeface — verify with real copy.

Flag each sample as comfortable or not, and colour the marker accordingly, so
the band is visible rather than asserted.`
  ),

  'type-scale/vertical-rhythm': fx(
    'Vertical rhythm from a baseline unit',
    `Build a text block whose vertical spacing is all derived from one baseline
unit, with a toggleable baseline-grid overlay to prove it.

The mechanism: set --baseline to line-height x font-size. Body line-height is
exactly one baseline; headings occupy an integer multiple; every gap between
blocks is a multiple. Spacing then comes from a rule, not from a decision per
element.

  .rhythm > * + * { margin-block-start: var(--baseline); }
  .rhythm p  { line-height: var(--baseline); }
  .rhythm h4 { line-height: calc(var(--baseline) * 2); }

Render the grid overlay as a repeating-linear-gradient on a pseudo-element with
pointer-events: none.

State the honest payoff: not mystical alignment, but that you stop deciding
every gap, and the page stops having eleven slightly different spacings nobody
chose on purpose.`
  ),

  'type-scale/text-wrap': fx(
    'text-wrap: balance and pretty',
    `Demonstrate the two wrapping properties that fix the ugliest typographic
defaults, side by side with the unset version.

- text-wrap: balance evens out line lengths across a short block. Use it on
  HEADINGS. It is capped at a handful of lines because the algorithm is
  expensive, so it is not for body copy.
- text-wrap: pretty is the body-copy one. It prevents orphans — a single short
  word stranded alone on the final line — and improves the rag, without trying
  to equalise line lengths.

Build two identical cards, one unset and one with balance on the heading and
pretty on the paragraph, with a heading long enough to wrap to three lines and
a paragraph that would otherwise orphan its last word.

Both are progressive enhancements: unsupporting browsers simply wrap normally,
so no @supports guard is needed.`
  ),

  'type-scale/numerals': fx(
    'Tabular and old-style numerals',
    `Demonstrate font-variant-numeric, and when each setting is correct.

- TABULAR figures share one advance width, so digits align in columns. Mandatory
  for tables, prices, timers, and any number that updates in place — without
  them a changing figure makes the layout jitter as digit widths change.
- PROPORTIONAL figures are spaced like letters. Correct in running prose.
- OLD-STYLE (lowercase) figures have ascenders and descenders and sit at
  x-height, so they blend into a sentence instead of shouting.
- LINING figures are uniform cap-height. Correct in UI and headings.

  .table  { font-variant-numeric: lining-nums tabular-nums; }
  .prose  { font-variant-numeric: oldstyle-nums proportional-nums; }

Build a data table showing proportional vs tabular in adjacent columns so the
misalignment is directly visible, plus a sentence comparing old-style and
lining inline. Note it requires a font that ships the relevant glyph sets.`
  ),

  /* ═══ layout-primitives ═══════════════════════════════════════════════ */

  'layout-primitives/stack': fx(
    'The Stack — vertical flow with one gap',
    `Build a layout primitive that applies consistent vertical spacing between
children and nothing else.

The mechanism is the owl selector:

  .stack > * { margin-block: 0; }
  .stack > * + * { margin-block-start: var(--space); }

Because it targets only elements PRECEDED by a sibling, the first child never
contributes a stray gap at the top of its container, and you never need
:last-child { margin: 0 } to clean up the bottom.

Why this beats gap in some cases: it composes through nesting and works on
elements that are not flex/grid children, and individual children can override
--space to create a deliberate exception without breaking the rule.

Keep the primitive doing ONE job — no padding, no colours, no widths. That is
what lets it nest inside every other layout.`
  ),

  'layout-primitives/cluster': fx(
    'The Cluster — things that wrap gracefully',
    `Build a layout primitive for groups of items of unknown count and length —
tag lists, button rows, metadata — that wrap onto new lines without looking
broken.

  .cluster { display: flex; flex-wrap: wrap; gap: var(--space); align-items: center; }

That is the whole thing. The value is in what it avoids: with gap handling both
axes, wrapped rows are spaced identically to the first row, which margin-based
approaches get wrong (they leave a doubled or missing gap on wrap).

Add a justify-content option for alignment, and note that align-items: center
is what keeps mixed-height items (a tag next to a button) visually related.

Demonstrate with 12+ items in a resizable container so the wrapping is visible.`
  ),

  'layout-primitives/sidebar': fx(
    'The Sidebar — wrapping driven by content, not viewport',
    `Build a two-pane layout where the aside wraps to full width when the main
pane can no longer meet its minimum — with NO media query.

The mechanism, and it is the one that justifies this whole approach:

  .sidebar { display: flex; flex-wrap: wrap; gap: var(--space); }
  .sidebar > :first-child { flex-basis: 16rem; flex-grow: 1; }
  .sidebar > :last-child  {
    flex-basis: 0;
    flex-grow: 999;            /* take all remaining space when it fits */
    min-inline-size: 55%;      /* …until this cannot be met, then wrap */
  }

flex-grow: 999 makes the main pane absorb all free space. min-inline-size sets
the point at which flex-wrap gives up and moves the aside to its own line.

The breakpoint is therefore a property of the CONTENT, so the same component
behaves correctly in a modal, a column, or full-width — which a media query
fundamentally cannot do, because it only knows the viewport.

Demonstrate inside a resizable container, not by resizing the window.`
  ),

  'layout-primitives/switcher': fx(
    'The Switcher — row to column, all at once',
    `Build a layout that flips from a single row to a stacked column in ONE
step, with no half-wrapped intermediate state where two items share a line and
a third sits alone.

The mechanism:

  .switcher > * {
    flex-grow: 1;
    flex-basis: calc((var(--threshold) - 100%) * 999);
  }

When the container is narrower than --threshold the expression is a large
positive number, so every item demands a full line. When it is wider the value
goes negative, is clamped to zero, and the items share one line. The 999
multiplier just saturates it past any realistic size, so there is no in-between.

Note the limitation: it works cleanly up to about four or five items; beyond
that use a grid. And --threshold is a length, not a breakpoint — it describes
how much room the content needs.`
  ),

  'layout-primitives/cover': fx(
    'The Cover — vertical centring with slots',
    `Build a hero layout with an optional header, a vertically centred principal
element, and an optional footer, with a guaranteed minimum height.

The mechanism: auto margins in flexbox absorb ALL remaining free space, so a
single margin-block: auto on the centred child pushes the others to the edges
regardless of how many there are.

  .cover { display: flex; flex-direction: column; min-block-size: 22rem; padding: var(--space); }
  .cover > * { margin-block: var(--space); }
  .cover > :first-child:not(.centre) { margin-block-start: 0; }
  .cover > :last-child:not(.centre)  { margin-block-end: 0; }
  .cover > .centre { margin-block: auto; }

Use min-block-size, never height, so the layout still grows if the content
exceeds it. Padding must be on the container so the centred child is centred
within the padded box.`
  ),

  'layout-primitives/reel': fx(
    'The Reel — horizontal scroll with snap',
    `Build a horizontally scrolling row of items with scroll snapping.

  .reel {
    display: flex; gap: var(--space);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
  }
  .reel > * { flex: 0 0 14rem; scroll-snap-align: start; }

Details that matter:
- overscroll-behavior-x: contain stops an overscroll at the end of the reel from
  triggering the browser's back-navigation gesture — the single most annoying
  bug in horizontal carousels on trackpads.
- flex: 0 0 <size> prevents items from shrinking to fit, which is what makes it
  scroll rather than compress.
- Keep the native scrollbar or provide visible controls. Hiding the scrollbar
  with no other affordance leaves keyboard and unfamiliar users stuck.
- The container must be focusable or contain focusable children so it can be
  scrolled with a keyboard.`
  ),

  'layout-primitives/autofit-autofill': fx(
    'Grid auto-fit vs auto-fill',
    `Demonstrate the difference between auto-fit and auto-fill, which is
invisible until there are fewer items than would fill a row.

  repeat(auto-fit,  minmax(11rem, 1fr))   /* empty tracks COLLAPSE  */
  repeat(auto-fill, minmax(11rem, 1fr))   /* empty tracks are KEPT  */

With auto-fit the leftover tracks collapse to zero and the existing items
stretch to fill the row. With auto-fill the empty tracks are retained, so items
keep their natural size and the row ends with empty space.

When to use which:
- auto-fit for galleries and dashboards, where filling the row looks intentional.
- auto-fill for product grids and card lists, where a single stretched card
  looks wrong and consistent item size matters more.

Demonstrate with THREE items in a wide resizable container — with a full row of
items the two are identical and the demo proves nothing.`
  ),

  /* ═══ color-harmony ═══════════════════════════════════════════════════ */

  'color-harmony/harmony-schemes': fx(
    'Colour harmony schemes as hue arithmetic',
    `Build a generator producing complementary, split-complementary, triadic,
analogous and tetradic palettes from one seed hue.

The mechanism is plain arithmetic on the hue angle — complementary is h+180,
triadic h+120/h+240, analogous h±30, tetradic h+90/h+180/h+270.

The part that actually matters: keep LIGHTNESS AND CHROMA FIXED while only the
hue moves. That is what makes the results feel like one family. This works in
OKLCH and not in HSL, because rotating HSL's hue at fixed lightness changes
apparent brightness dramatically — yellow at 50% reads far brighter than blue
at 50%.

Then vary lightness deliberately ACROSS the set (e.g. 72/60/48/82) so it reads
as a usable palette with hierarchy rather than four equally loud colours
competing for attention.`
  ),

  'color-harmony/oklch-ramp': fx(
    'A perceptual lightness ramp with chroma tapering',
    `Build a 12-step lightness ramp in OKLCH, and demonstrate why chroma must
taper toward both ends.

The mechanism: the sRGB gamut narrows to a point at both extremes of lightness.
Full chroma at 95% or 10% lightness simply does not exist — the browser clips
it, and the top and bottom of the ramp turn to mud with adjacent steps becoming
indistinguishable.

  const taper = l => 0.3 + 0.7 * (1 - (Math.abs(l - 55) / 55) ** 1.5);
  chroma = baseChroma * taper(lightness);

Render the tapered ramp directly above an untapered one so the clipping is
visible rather than asserted.

Also detect and mark out-of-gamut steps: convert OKLCH to linear sRGB
(OKLab matrices) and flag any channel outside 0..1. Space the lightness stops
densely at the ends where UI needs fine steps and sparsely through the middle.`
  ),

  'color-harmony/tinted-neutrals': fx(
    'Tinted neutrals instead of pure grey',
    `Demonstrate why pure grey looks dead beside a saturated brand colour, and
how to fix it.

The mechanism: mix a trace of the brand hue into the entire neutral ramp — a
chroma of roughly 0.004 to 0.02 in OKLCH. Far too little to read as coloured,
but enough that the greys belong to the same family as the accents.

  --grey-900: oklch(17% 0.014 var(--brand-h));

Build two ramps stacked — pure grey (chroma 0) and tinted — with a slider for
the tint amount so the difference can be swept from none to obvious. Start it
around 0.015.

The practical consequence: because the neutrals derive from the same
--brand-h as the accents, changing that one variable re-themes surfaces,
borders and text together instead of leaving dead grey next to a new brand
colour.`
  ),

  'color-harmony/semantic-roles': fx(
    'Mapping a ramp to semantic roles',
    `Build the indirection layer between a colour ramp and the components that
consume it.

The mechanism: components reference ROLES, never ramp steps. Define surface,
surface-raised, border, text, text-muted, accent, accent-hover, on-accent,
danger and success, each pointing at a step. Then build a small mock UI — nav,
cards, form, table, chart — that consumes only the role names.

Why: it is what allows a full re-theme by changing one hue variable, and what
stops "the blue one" being hardcoded in forty components. A component that says
background: var(--grey-0) is hardcoded to light mode forever.

Include a copy-to-clipboard that emits the whole thing as CSS custom
properties, with the primitives and the semantic roles in separate labelled
blocks.`
  ),

  'color-harmony/apca-contrast': fx(
    'Live APCA and WCAG contrast checking',
    `Build a live contrast audit for every text/background pair in a palette,
reporting both APCA and WCAG 2.1.

Implement APCA (W3C draft 0.1.9). Unlike WCAG's symmetric ratio, APCA is
POLARITY-AWARE — dark-on-light and light-on-dark are computed with different
exponents, because the eye does not treat them the same. That asymmetry is
exactly what WCAG 2.1 misses, and why dark themes routinely "pass" WCAG while
being genuinely hard to read.

  Y = 0.2126729*R^2.4 + 0.7151522*G^2.4 + 0.072175*B^2.4   (per channel, sRGB)
  clamp very dark values: y > 0.022 ? y : y + (0.022 - y)**1.414
  normal polarity (dark text on light): (Ybg^0.56 - Ytxt^0.57) * 1.14 - 0.027
  reverse polarity (light text on dark): (Ybg^0.65 - Ytxt^0.62) * 1.14 + 0.027

Report |Lc|. Thresholds: Lc 90 small body text, 75 larger body, 60 headlines,
45 large/non-essential, 30 the floor for anything that must be perceived at all
including borders and disabled states. Show WCAG alongside, since audits still
require it.`
  ),

  /* ═══ easing-lab ══════════════════════════════════════════════════════ */

  'easing-lab/easing-curves': fx(
    'Easing curves plotted and played from one function',
    `Build a grid of easing curves where each cell plots the curve AND drives a
moving element with the identical function, so the graph provably is the motion.

The mechanism: define each easing as a plain JS function t => eased. Sample it
into an SVG path for the plot, and call the same function each frame to
position the runner.

  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n, v = fn(t);
    d += (i ? 'L' : 'M') + (t * 100) + ',' + (100 - v * 100) + ' ';
  }

Cover linear, ease-out/in/in-out for quad, cubic, quart, expo and circ, plus
back, elastic, bounce and steps().

Critical detail: do NOT clip the SVG to the unit box. back, elastic and bounce
overshoot past 1 and dip below 0, and that overshoot is the entire
information — clipping it makes them look identical to a plain ease. Use a
viewBox with generous padding and draw the unit box as a dashed rect.

Show the copyable cubic-bezier() under each, and note which curves cannot be
expressed as a bezier at all.`
  ),

  'easing-lab/bezier-editor': fx(
    'Draggable cubic-bezier editor',
    `Build an interactive cubic-bezier(x1,y1,x2,y2) editor with two draggable
control handles and a live preview.

The mechanism that is easy to get wrong: a CSS cubic-bezier is a PARAMETRIC
curve, so the x you want is not the parameter s. You must invert x(s)=t first —
Newton's method, ~6 iterations — then evaluate y at that s. Using t directly as
the parameter makes every curve subtly wrong.

  let s = t;
  for (let i=0;i<6;i++){ const d = slope(s,x1,x2); if(Math.abs(d)<1e-6) break;
    s -= (calc(s,x1,x2) - t) / d; }
  return calc(s,y1,y2);

Constraints on the handles: clamp X to 0..1 (time cannot run backwards) but
leave Y unbounded — that is precisely how you get anticipation (y1 < 0, the
element pulls back before moving) and overshoot (y2 > 1).

For SVG pointer handling use createSVGPoint + getScreenCTM().inverse();
getBoundingClientRect alone gives the wrong scale once a viewBox is involved.`
  ),

  'easing-lab/spring-curve': fx(
    'Spring physics plotted, with CSS linear() output',
    `Build a spring editor with stiffness/damping/mass controls that plots the
resulting curve and emits a CSS linear() timing function.

The mechanism: solve the damped harmonic oscillator ANALYTICALLY rather than
integrating, so it can be sampled at any t. Three regimes by damping ratio
zeta = c / (2*sqrt(k*m)):

  zeta < 1  underdamped:  1 - e^(-zeta*w0*t) * (cos(wd*t) + (zeta*w0/wd)*sin(wd*t))
  zeta = 1  critically damped: 1 - e^(-w0*t) * (1 + w0*t)
  zeta > 1  overdamped: two decaying exponentials

where w0 = sqrt(k/m) and wd = w0*sqrt(1-zeta^2).

Report the damping ratio and classify it — underdamped bounces, critically
damped is the fastest approach with no overshoot, overdamped is sluggish.

Compute the settle time (first t where |x-1| < 0.005 and stays there), then
sample the curve into ~26 keypoints and emit
linear(0, 0.32, 0.66, …) — which runs a real spring in pure CSS with no
JavaScript at all.`
  ),

  'easing-lab/interruption': fx(
    'Why springs survive interruption and eases do not',
    `Build a side-by-side demo proving the practical difference between an
eased transition and a spring when the target changes mid-flight.

Set up two elements moving between the same two points, one driven by a
cubic-bezier over a fixed duration and one by a spring. Provide a button that
retargets both, and invite the user to hammer it.

The mechanism:
- The EASE restarts from its current position with ZERO velocity. All momentum
  is discarded, which the eye reads as a stutter.
- The SPRING keeps both position AND velocity as state, so a new target is
  absorbed smoothly. Integrate with semi-implicit Euler:

    const a = (target - pos) * stiffness - vel * damping;
    vel += a * dt;
    pos += vel * dt;

Clamp dt (~1/30) so a backgrounded tab does not resume with one enormous step.

This is the single strongest practical argument for springs on anything a user
can interrupt — drags, toggles, anything gesture-driven.`
  ),

  'easing-lab/steps-timing': fx(
    'steps() for discrete motion',
    `Demonstrate the steps() timing function and when it is the correct choice.

The mechanism: steps(n, end) holds each value rather than interpolating, so
motion advances in visible jumps.

  animation-timing-function: steps(8, end);

Correct for anything genuinely discrete: sprite-sheet animation, typewriter
text, segment counters, a clock's second hand, deliberately low-framerate
"stop motion" motion.

The jump-terms matter: 'end' (default) holds the start value and jumps at the
end of each interval; 'start' jumps immediately; 'jump-none' includes both
endpoints across n-1 jumps, which is what you want for a progress counter that
must show both 0 and 100.

Build a runner advancing in 8 discrete steps with a live counter, and contrast
it with the same movement under a smooth ease so the difference is explicit.`
  ),

  /* ═══ css-3d ══════════════════════════════════════════════════════════ */

  'css-3d/tilt-card': fx(
    'Pointer-tilted card with z-layered parallax',
    `Build a card that tilts toward the pointer, with its internal elements at
different depths so they parallax correctly during the tilt.

The mechanism, and the line everyone forgets:

  .scene { perspective: 900px; }                  /* on the PARENT */
  .card  { transform-style: preserve-3d;          /* on the card   */
           transform: rotateX(var(--rx)) rotateY(var(--ry)); }
  .layer { transform: translateZ(60px); }         /* real depth    */

Without transform-style: preserve-3d the children collapse onto the card's flat
face and the parallax disappears entirely. That single declaration is the whole
difference between real depth and a fake.

Requirements:
- JavaScript writes only --rx and --ry. Everything else is CSS.
- Cap rotation at ~14deg. Past roughly 18deg the perspective distortion stops
  reading as tilt and starts reading as a glitch.
- Remove the transition while the pointer is moving (so tracking is immediate)
  and restore it on pointerleave (so the return eases).
- Invert the X rotation so the card leans TOWARD the cursor, not away.
- Warn: preserve-3d is flattened by any ancestor with overflow, filter or
  opacity — the usual reason these effects mysteriously go flat.`
  ),

  'css-3d/css-cube': fx(
    'A real cube from six CSS faces',
    `Build a rotating 3D cube using only CSS transforms.

The mechanism: each face is rotated into its plane, then pushed outward along
its own local Z by half the edge length.

  .face { position: absolute; inset: 0; }
  .f1 { transform: rotateY(  0deg) translateZ(var(--half)); }
  .f2 { transform: rotateY( 90deg) translateZ(var(--half)); }
  .f3 { transform: rotateY(180deg) translateZ(var(--half)); }
  .f4 { transform: rotateY(-90deg) translateZ(var(--half)); }
  .f5 { transform: rotateX( 90deg) translateZ(var(--half)); }
  .f6 { transform: rotateX(-90deg) translateZ(var(--half)); }

The order matters: rotate THEN translate, because translateZ is applied in the
already-rotated local space. Reversing them puts every face in the wrong place.

The container needs transform-style: preserve-3d and an ancestor with
perspective. Use backface-visibility: hidden for opaque faces, or keep them
semi-transparent to show the construction.

State the limitation: CSS 3D has no z-buffer, so intersecting geometry sorts by
paint order, not depth.`
  ),

  'css-3d/flip-card': fx(
    'Flip card with correct backface handling',
    `Build a card that flips to reveal its reverse side.

The mechanism:

  .scene { perspective: 1200px; }
  .card  { position: relative; transform-style: preserve-3d;
           transition: transform .7s cubic-bezier(.65,0,.35,1); }
  .scene:hover .card, .scene:focus-within .card { transform: rotateY(180deg); }
  .face  { position: absolute; inset: 0; backface-visibility: hidden; }
  .back  { transform: rotateY(180deg); }

backface-visibility: hidden is the load-bearing line. Without it BOTH faces
render throughout the flip and you see the front's mirror image bleeding
through the back.

Requirements:
- Include :focus-within and make the card focusable (tabindex="0"), or the flip
  is mouse-only.
- Both faces must be absolutely positioned in the same box, or the card is
  twice as tall as it should be.
- Content on the back is still in the accessibility tree while hidden — if that
  matters, toggle inert or aria-hidden alongside the flip.`
  ),

  'css-3d/coverflow': fx(
    'Scroll-driven 3D coverflow',
    `Build a horizontally scrolling row where each item rotates in 3D according
to its position in the scrollport — no JavaScript.

The mechanism: a scroll-driven animation on the horizontal axis, where each
item's own progress through the scroller drives a 3D keyframe.

  .flow { perspective: 1200px; overflow-x: auto; scroll-snap-type: x mandatory; }
  .item {
    transform-style: preserve-3d;
    animation: flow linear both;
    animation-timeline: view(x);
    animation-range: cover;
  }
  @keyframes flow {
    0%   { transform: rotateY( 52deg) scale(.8) translateZ(-90px); opacity:.4; }
    50%  { transform: rotateY(  0deg) scale(1.06) translateZ(60px); opacity: 1; }
    100% { transform: rotateY(-52deg) scale(.8) translateZ(-90px); opacity:.4; }
  }

view(x) is what ties it to horizontal position. Because it is scrubbed, it runs
correctly in both directions with no listener.

Guard with @supports (animation-timeline: view()) so unsupporting browsers get
a plain flat row rather than items frozen at 40% opacity.`
  ),

  /* ═══ gooey-morph ═════════════════════════════════════════════════════ */

  'gooey-morph/metaballs': fx(
    'Metaballs that fuse, from plain DOM elements',
    `Build a field of circles that melt into one another as they approach, using
an SVG filter over ordinary divs.

The mechanism — two primitives and one magic number:

  <filter id="goo">
    <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur"/>
    <feColorMatrix in="blur" mode="matrix" result="goo"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12"/>
    <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
  </filter>

The blur softens the edges so neighbours overlap; the alpha row (0 0 0 26 -12)
multiplies alpha by 26 and subtracts 12, which is a very steep ramp — anything
below ~0.46 goes transparent, anything above goes opaque. Blurred edges
therefore snap back to a hard outline, and where two blurs OVERLAP the summed
alpha crosses the threshold and the shapes read as one.

The practical trap: stdDeviation sets the merge REACH. Spread the circles over
a wide container and they never come within range, so the effect looks like
plain circles and you will think the filter is broken. Confine them to a band
roughly 40% of the container's width.

Make the pointer an additional metaball so it fuses with the field.`
  ),

  'gooey-morph/gooey-menu': fx(
    'Gooey FAB menu',
    `Build a floating action button whose menu items separate out of it like
drops of liquid.

The mechanism: all items start stacked underneath the trigger at a small scale.
On open they translate outward to their positions and scale to 1. The parent
carries filter: url(#goo), so during the transition the items are still close
enough to the trunk for the alpha threshold to fuse them — producing the
stretching neck that sells the effect.

Open state without JavaScript: drive it from :hover and :focus-within on the
container, so it is keyboard-accessible for free.

  .fab:hover .item, .fab:focus-within .item { scale: 1; }
  .fab:hover .item:nth-of-type(1) { translate: -140px 0; }

Two gotchas: text inside a gooey subtree renders through the alpha threshold
and turns to mush, so keep labels outside the filtered element or on a sibling
layer above it. And give each item a real aria-label, since the icons are
glyphs.`
  ),

  'gooey-morph/blob-morph': fx(
    'Organic blob from animated border-radius',
    `Build a continuously morphing organic blob shape — with no SVG and no path
interpolation.

The mechanism: the eight-value form of border-radius. Four horizontal radii, a
slash, then four vertical radii, animated between three states:

  @keyframes morph {
    0%,100% { border-radius: 60% 40% 55% 45% / 45% 55% 45% 55%; rotate: 0deg; }
    33%     { border-radius: 35% 65% 40% 60% / 62% 38% 62% 38%; rotate: 120deg; }
    66%     { border-radius: 55% 45% 68% 32% / 35% 62% 38% 65%; rotate: 240deg; }
  }

Adding a slow rotate on top means the silhouette never repeats visibly, because
the shape cycle and the rotation cycle are out of phase.

This is far cheaper than an SVG path morph and it composites, whereas animating
a path's 'd' attribute repaints. Fill it with a conic-gradient so the rotation
is visible in the surface as well as the outline.`
  ),

  'gooey-morph/displaced-text': fx(
    'Liquid text via turbulence displacement',
    `Build a headline whose letterforms ripple and flow.

The mechanism: feTurbulence generates a noise field, and feDisplacementMap uses
its R and G channels as per-pixel x/y offsets into the source graphic.

  <filter id="warp">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="18"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>

Animating baseFrequency makes it flow — but that re-runs the ENTIRE filter
graph every frame, which is expensive and often CPU-bound. Drive it only on
hover, and reset to a static value on leave. Do not animate it ambiently.

An anisotropic baseFrequency (low x, higher y) gives horizontal liquid smear;
equal values give an even wobble. Keep 'scale' under about 20 or the glyphs
stop being readable as letters.`
  ),

  'gooey-morph/grain-overlay': fx(
    'Film grain over a gradient',
    `Build a grain overlay that stops a large flat gradient from banding.

The mechanism: high-frequency fractal noise, desaturated, composited over the
surface.

  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>

Apply it on a pseudo-element with mix-blend-mode: overlay at roughly 30%
opacity and pointer-events: none. Overlay perturbs luminance while preserving
the underlying hue, which is what grain should do — multiply or screen would
shift the whole surface darker or lighter and quietly break your contrast.

Oversize the overlay (inset: -50%) if you intend to animate its position, so
translating it never exposes an edge.

For anything large or scrolling, rasterise the filter once into a tiling data:
URI instead of leaving a live filter attached — SVG filters run on the CPU in
several engines.`
  ),

  /* ═══ liquid-glass ════════════════════════════════════════════════════ */

  'liquid-glass/glass-panel': fx(
    'Liquid glass panel that genuinely refracts',
    `Build a draggable glass panel that BENDS the content behind it, not merely
blurs it.

The mechanism: blur alone is glassmorphism and reads as frosted plastic. Real
glass refracts, which requires an SVG feDisplacementMap inside the
backdrop-filter chain:

  backdrop-filter: url(#glass-warp) blur(2px) saturate(160%) brightness(1.06);

Build the displacement map so distortion concentrates at the EDGES and is near
zero in the centre — that is how a real lens behaves. A radial gradient
rendered to SVG and fed to feDisplacementMap gives exactly that; a uniform
turbulence field makes the panel look like a bug rather than glass.

Also required to read as glass:
- A specular highlight tracking the pointer (radial-gradient, mix-blend-mode: overlay).
- An inset top rim highlight and a darker bottom rim.
- Two opposing chromatic inset shadows (warm one side, cool the other) for
  edge dispersion.

Put it over BUSY content — over a flat background the effect is invisible and
proves nothing.

Performance and support: contain: paint to bound the rasterisation, never stack
these, and note that Safari does not apply SVG filter references in
backdrop-filter, so ship a plain blur as the -webkit- fallback.`
  ),

  'liquid-glass/gooey-merge': fx(
    'Glass shapes that melt together',
    `Build two or more shapes that fuse into a single fluid outline as they
approach — the "liquid" half of the Liquid Glass language.

The mechanism: feGaussianBlur softens the edges, then feColorMatrix applies a
steep alpha ramp that snaps everything above a threshold back to opaque. Where
two blurred edges overlap, their summed alpha crosses that threshold and the
shapes become one.

  <feGaussianBlur stdDeviation="14" result="blur"/>
  <feColorMatrix in="blur" mode="matrix"
    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12" result="goo"/>
  <feBlend in="SourceGraphic" in2="goo"/>

stdDeviation controls the merge distance: shapes fuse when the gap between them
is under roughly twice that value. Too small and nothing merges; too large and
everything becomes one puddle.

Animate the shapes' positions so they pass through each other, and note that
the filter must live on the PARENT, not the shapes.`
  ),

  'liquid-glass/glass-variants': fx(
    'Frosted vs lens vs chromatic glass',
    `Build a switcher between three distinct glass treatments so the differences
are directly comparable, each as one backdrop-filter chain:

1. FROSTED — blur-dominant, no displacement. Cheap, well supported, reads as
   plastic. This is ordinary glassmorphism.
     backdrop-filter: blur(20px) saturate(150%);
2. LENS — a radial displacement map producing strong edge refraction and a
   clear centre, like a convex lens.
     backdrop-filter: url(#glass-lens) blur(1px) saturate(180%);
3. CHROMATIC — displacement plus opposing warm/cool inset shadows on the left
   and right edges, simulating dispersion through a thick edge.

Build the lens map with feImage carrying an inline SVG radial gradient: mid-grey
(no displacement) in the centre, shifting toward the channel extremes at the
rim. Grey is the neutral value because feDisplacementMap treats 0.5 as zero
offset — which is why a black-to-white gradient pushes hard in both directions
and a grey-centred one does not.

State the legibility caveat: text behind heavy distortion becomes unreadable at
certain offsets, so put a near-solid layer behind anything that must be read.`
  ),

  /* ═══ scroll-driven ═══════════════════════════════════════════════════ */

  'scroll-driven/scroll-progress-bar': fx(
    'Reading progress bar with no JavaScript',
    `Build a fixed progress bar at the top of the page that fills as the user
scrolls — with zero JavaScript.

The mechanism: animation-timeline: scroll() binds an animation's playhead to a
scroll container's progress instead of to the clock.

  .progress {
    position: fixed; inset: 0 0 auto; height: 3px;
    transform-origin: 0 50%; scale: 0 1;
    animation: grow linear both;
    animation-timeline: scroll(root block);
  }
  @keyframes grow { to { scale: 1 1; } }

scroll(root block) targets the document's block-axis scroll. Use scale rather
than width — scale is composited, width triggers layout on every frame.

Wrap it in @supports (animation-timeline: scroll()) so unsupporting browsers do
not get a bar permanently stuck at zero width. Mark it aria-hidden; it is
decorative and duplicates information the scrollbar already conveys.`
  ),

  'scroll-driven/reveal-on-scroll': fx(
    'Scrubbed reveal-on-enter',
    `Build content that fades and slides in as it enters the viewport — and,
crucially, runs BACKWARDS when scrolling back up.

The mechanism: animation-timeline: view() measures the element against the
scrollport. animation-range selects which slice of that pass the keyframes
cover.

  .reveal {
    animation: reveal linear both;
    animation-timeline: view();
    animation-range: entry 5% entry 60%;
  }
  @keyframes reveal { from { opacity: 0; transform: translateY(48px); filter: blur(6px); } }

The ranges are entry / contain / cover / exit. 'entry' runs from the element's
leading edge touching the scrollport to it being fully inside.

This is SCRUBBED, tied to position — which an IntersectionObserver fundamentally
cannot do, since that only fires at a threshold and then plays on a clock.

Guard with @supports (animation-timeline: view()), or unsupporting browsers
leave the content stuck at the 'from' state — permanently invisible.`
  ),

  'scroll-driven/scroll-parallax': fx(
    'Multi-layer parallax, CSS only',
    `Build a depth parallax where several layers travel at different rates as
the section crosses the viewport.

The mechanism: every layer shares animation-timeline: view() with
animation-range: cover (the whole time any part of the element is visible), but
each translates a different distance via its own custom property.

  .layer { animation: rise linear both; animation-timeline: view(); animation-range: cover; }
  @keyframes rise { from { translate: 0 var(--shift); } to { translate: 0 calc(var(--shift) * -1); } }

Layers are oversized (inset: -20% 0) so their edges never enter frame.

The trap worth stating: overflow: hidden on an ancestor makes it a scroll
container and can capture the timeline you meant to reach. Use overflow: clip,
which clips without creating a scroll container.

Animate translate only. Anything that triggers layout will drop frames on the
scroll thread.`
  ),

  'scroll-driven/named-scroll-timeline': fx(
    'Named scroll timeline shared across the DOM',
    `Build a horizontally scrolling rail with a progress bar that lives OUTSIDE
the rail's subtree.

The mechanism: a scroller can publish a named timeline that any element may
attach to by name, which decouples the indicator from the thing it measures.

  .rail  { overflow-x: auto; scroll-timeline: --rail x; }
  .meter { animation: grow linear both; animation-timeline: --rail; }

Without the name you would have to nest the bar inside the scroller, where it
would scroll away with the content.

Items inside the rail use view(x) so their own animations are driven by the
horizontal axis rather than the page's vertical scroll.

Add scroll-snap-type: x mandatory and overscroll-behavior-x: contain — the
latter stops an overscroll at the end from triggering browser
back-navigation.`
  ),

  'scroll-driven/sticky-scrollytelling': fx(
    'Sticky scrollytelling stage',
    `Build the "element transforms while the page scrolls past it" pattern — a
tall track containing a sticky stage.

The mechanism: the TRACK provides the scroll distance; the STAGE sticks inside
it; the track's own view() progress over its 'contain' range drives the
animation.

  .track { height: 300vh; position: relative; }
  .stage { position: sticky; top: 12vh; height: 76vh; overflow: clip; }
  .thing {
    animation: spin linear both;
    animation-timeline: view(root);
    animation-range: contain;
  }

'contain' is the phase during which the element is entirely within the
scrollport — exactly the window in which the stage is stuck, which is why it is
the right range here.

Track height controls pacing: 300vh means the animation takes two extra
viewport-heights of scrolling. Keep it under about 400vh or the section feels
like it has trapped the user.`
  ),

  /* ═══ view-transitions ════════════════════════════════════════════════ */

  'view-transitions/shared-element-morph': fx(
    'Card that morphs into a detail view',
    `Build a grid of cards where clicking one expands it into a detail view,
with the thumbnail and title MORPHING into the hero image and heading.

The mechanism: document.startViewTransition(cb) snapshots the page, runs cb to
mutate the DOM, snapshots again, and cross-fades. Any element carrying a
matching view-transition-name in BOTH snapshots is morphed instead — position,
size and border-radius all interpolate.

THE CRITICAL DETAIL: two elements may never share a view-transition-name in the
same snapshot. Naming every card up front therefore breaks it immediately.
Assign the name to the source element only for the duration of the capture:

  card.querySelector('img').style.viewTransitionName = 'hero-img';
  document.startViewTransition(() => render());   // clear it in the next render

Also:
- Give morphing images object-fit: cover on ::view-transition-old/new(name), or
  they squash while resizing between two aspect ratios.
- Text that changes size looks better cross-faded than scaled.
- Feature-detect startViewTransition and fall back to a plain update; skip the
  transition entirely under prefers-reduced-motion.`
  ),

  'view-transitions/list-reorder': fx(
    'Animated list reordering',
    `Build a sortable list where changing the sort order animates every row to
its new position.

The mechanism: give each row a view-transition-name derived from a STABLE ID —
never the array index, which changes under the row as it moves and produces
either no animation or the wrong one.

  <li style="view-transition-name: row-{item.id}">

Then wrap the sort in startViewTransition and re-render. The browser matches
old and new snapshots by name and FLIPs each row for you; you write no
animation code at all.

Requirements:
- Sort buttons for several keys plus a shuffle, so the reordering is arbitrary.
- ::view-transition-group(*) to set a shared duration and easing.
- A slow-motion toggle that multiplies the duration — invaluable for debugging,
  since transitions are otherwise too fast to inspect.
- Note the scaling limit: every named element is captured separately, so a list
  of hundreds of rows will be slow. Virtualise or paginate first.
- Catch the rejections. Re-sorting while a transition is still running skips
  the old one, and BOTH its 'ready' and 'finished' promises reject with an
  AbortError. Unhandled, every impatient click logs a console error:
    const t = document.startViewTransition(update);
    t.ready.catch(() => {}); t.finished.catch(() => {});`
  ),

  'view-transitions/cross-document': fx(
    'Cross-document view transitions (MPA)',
    `Set up view transitions between two real page navigations in a plain
multi-page site — no router, no framework, no JavaScript.

The mechanism: opt in from CSS in BOTH documents.

  @view-transition { navigation: auto; }

Then give the shared element the same view-transition-name on both pages, and
the browser morphs it across the navigation.

Requirements and constraints:
- Same-origin only.
- Both the outgoing and incoming document must opt in; one alone does nothing.
- To vary the transition by which link was clicked, use the 'pageswap' event on
  the way out and 'pagereveal' on the way in — set or clear
  view-transition-name there, and read the navigation's destination URL to
  decide.
- Interactive elements are frozen during the transition, and very large pages
  produce large snapshots that can cause visible jank.
- Because it is CSS-driven, it degrades to an ordinary navigation in browsers
  without support.`
  ),

  /* ═══ anchor-positioning ══════════════════════════════════════════════ */

  'anchor-positioning/flipping-tooltip': fx(
    'Tooltip that flips away from the viewport edge',
    `Build a tooltip tethered to a button that repositions itself when it would
overflow the viewport — replacing a JS positioning library entirely.

The mechanism:

  .trigger { anchor-name: --trigger; }
  .tip {
    position: fixed;
    position-anchor: --trigger;
    position-area: block-start center;                       /* preferred */
    position-try-fallbacks: flip-block, flip-inline;         /* retries   */
  }

position-area is a 3x3 grid around the anchor. When the preferred placement
overflows, the browser tries each fallback in order and uses the first that
fits. No scroll listener, no resize observer, no getBoundingClientRect.

Pair it with the Popover API (popover + popovertarget) so it lands in the top
layer — no z-index war, plus light-dismiss and focus management for free.

Animate open/close with @starting-style and
transition-behavior: allow-discrete, since popovers toggle display and there is
otherwise no 'from' frame to animate out of.

Requires position: absolute or fixed. Feature-detect with
CSS.supports('anchor-name: --a') and provide a centred fallback.`
  ),

  'anchor-positioning/anchor-size-menu': fx(
    'Dropdown sized from its trigger',
    `Build a dropdown menu that is exactly as wide as the button that opens it,
at any breakpoint, with no JavaScript measurement.

The mechanism: anchor-size() reads the anchor element's dimensions and can be
used in any length slot.

  .trigger { anchor-name: --select; }
  .menu {
    position: fixed;
    position-anchor: --select;
    position-area: block-end span-inline-end;
    width: anchor-size(width);
    position-try-fallbacks: flip-block;
  }

Previously this required a ResizeObserver on the trigger and a JS write to the
menu's width on every change. Now the relationship is declarative, so it stays
correct through font swaps, container queries and text changes automatically.

anchor-size() also accepts height, block and inline. Combine with min()/max()
to clamp — width: max(anchor-size(width), 12rem) gives "at least as wide as the
trigger, but never uselessly narrow".`
  ),

  'anchor-positioning/moving-anchor': fx(
    'Callout tethered to a draggable point',
    `Build a draggable dot with a label tethered to it that follows
automatically, and flips to the other side near the edge.

The point of the exercise: the drag handler NEVER touches the callout. It moves
only the dot. The callout's position is declarative, so it follows for free.

  .dot     { anchor-name: --spot; }
  .callout {
    position: absolute;
    position-anchor: --spot;
    left: calc(anchor(right) + 12px);
    top: anchor(center);
    translate: 0 -50%;
    position-try-fallbacks: --left-side;
  }
  @position-try --left-side {
    left: auto; right: calc(anchor(left) + 12px);
  }

anchor() resolves an edge of the anchor's box in any length slot, so an element
can span BETWEEN two anchors by taking each edge from a different anchor() call.

Implement the drag with setPointerCapture, and give the handle arrow-key
support — a drag affordance that only responds to a pointer is unfinished.`
  ),

  /* ═══ kinetic-type ════════════════════════════════════════════════════ */

  'kinetic-type/variable-font-scroll': fx(
    'Variable font axes driven by scroll',
    `Build a headline whose weight, width and slant animate as it crosses the
viewport.

The mechanism: a variable font is a continuous design space, not a set of cuts,
so font-variation-settings is animatable and interpolates without the popping
you get when swapping static weights. Drive it from a scroll-driven animation:

  @keyframes fatten {
    0%   { font-variation-settings: 'wght' 100,  'wdth' 151, 'slnt' 0; }
    50%  { font-variation-settings: 'wght' 1000, 'wdth' 25,  'slnt' -10; }
    100% { font-variation-settings: 'wght' 200,  'wdth' 120, 'slnt' 0; }
  }
  h2 { animation: fatten linear both; animation-timeline: view(); animation-range: cover; }

The performance caveat, stated plainly: animating font-variation-settings
triggers layout on every frame. That is acceptable on one headline and is not
acceptable on a paragraph — for long text, animate transform instead.

Prefer the registered shorthands (font-weight, font-stretch) where they exist:
they interpolate identically and inherit properly.`
  ),

  'kinetic-type/per-char-stagger': fx(
    'Per-character stagger from a single custom property',
    `Build a headline where each character animates in sequence, using one CSS
custom property and no timeline library.

The mechanism: JavaScript does exactly one thing — wrap each character in a
span and set --i to its index. The entire stagger is then arithmetic in CSS:

  span { animation: wave 2.4s ease-in-out infinite; animation-delay: calc(var(--i) * 60ms); }

No per-glyph animation objects, no library, no timeline.

ACCESSIBILITY IS NOT OPTIONAL HERE: splitting text into spans destroys it for
screen readers, which will announce fourteen separate letters. Put the original
string in aria-label on the container and mark every generated span
aria-hidden="true". Show this in the code.

Also re-run any measurement on document.fonts.ready — the web font swap changes
glyph metrics after first paint.`
  ),

  'kinetic-type/pointer-proximity-type': fx(
    'Letters that react to cursor proximity',
    `Build a headline where each character's weight, width and colour respond to
how close the cursor is to it.

The mechanism: give each glyph a normalised distance --d (0 = under the cursor,
1 = far), and map everything from that single number:

  span {
    font-variation-settings: 'wght' calc(200 + (1 - var(--d)) * 800);
    color: oklch(calc(70% + (1 - var(--d)) * 25%) ...);
    transition: font-variation-settings .25s, color .25s;
  }

THE PERFORMANCE POINT: measure each character's rectangle ONCE, cache the
centres, and re-measure only on resize and on document.fonts.ready. Calling
getBoundingClientRect inside pointermove — once per glyph, per event — is what
makes every naive implementation of this janky.

Reset --d to 1 for all glyphs on pointerleave, or the last hovered state sticks.

Gate behind (hover: hover) and honour prefers-reduced-motion.`
  ),

  'kinetic-type/velocity-marquee': fx(
    'Seamless marquee skewed by scroll velocity',
    `Build an infinite horizontal marquee that skews in response to scroll speed.

Two mechanisms:
1. SEAMLESS LOOP: duplicate the content list, then translate the track by
   exactly -50%. Because the second copy is identical, the wrap is invisible.
     @keyframes marquee { to { translate: -50% 0; } }
   Use linear timing — any ease makes the seam visible as a stutter.
2. VELOCITY SKEW: read scrollY inside a requestAnimationFrame loop and diff it
   against the previous frame, rather than in a scroll handler. Clamp the
   delta, then ease the skew toward that target so it decays smoothly instead
   of snapping back:
     skew += (target - skew) * 0.12;
     track.style.setProperty('--skew', skew);

Reading scroll position in rAF rather than in a scroll listener keeps the work
off the scroll thread, which is what stops this from causing the very jank it
is meant to express.`
  ),

  /* ═══ bento-grid ══════════════════════════════════════════════════════ */

  'bento-grid/bento-layout': fx(
    'Asymmetric bento grid',
    `Build a bento-box dashboard: a grid of tiles with deliberately uneven sizes
that still reads as ordered.

The mechanism: a fixed column count with per-tile span values, so the rhythm is
intentional rather than emergent.

  .bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
           grid-auto-rows: minmax(140px, auto); }
  .bento > :nth-child(1) { grid-column: span 2; grid-row: span 2; }
  .bento > :nth-child(2) { grid-column: span 2; }

What makes it look designed rather than random: vary the spans but keep the
GAP and the corner radius constant, and make sure the largest tile carries the
most important content. A bento where every tile is a different size and none
is emphasised is just noise.

Collapse to two columns below ~780px with the spans reset, or the tiles become
unreadable slivers. Pair it with container queries so each tile restyles from
its own width.`
  ),

  'bento-grid/container-query-card': fx(
    'One card, three layouts, from container queries',
    `Build a single card component that changes its internal layout based on ITS
OWN width, not the viewport's.

The mechanism:

  .cell { container-type: inline-size; container-name: cell; }
  @container cell (min-width: 260px) { .note  { display: block; } }
  @container cell (min-width: 340px) { .chart { display: block; } }
  @container cell (min-width: 520px) { .cell  { grid-template-columns: 1fr auto; } }

This is what a media query fundamentally cannot do: the same component in a
sidebar, a modal and a full-width row adapts correctly with no props, no
variants, and no knowledge of where it was placed.

Also use container query UNITS — 1cqi is 1% of the container's inline size, so
font-size: clamp(1.4rem, 11cqi, 3.4rem) scales type with the box rather than
the window.

Demonstrate it with a resize: horizontal handle on a standalone instance, so a
viewer can drag one card across all three breakpoints while the window never
changes size. That is the proof; make it prominent.`
  ),

  'bento-grid/subgrid-alignment': fx(
    'Subgrid so card internals align across cards',
    `Build a row of cards whose headings, bodies and footers line up across
cards even when the content lengths differ.

The mechanism: the card opts into its PARENT's row tracks rather than defining
its own.

  .row  { display: grid; grid-template-columns: repeat(3, 1fr); }
  .card { grid-row: span 3; display: grid; grid-template-rows: subgrid; }

Now every card's title occupies row 1, body row 2, footer row 3 — sized by the
tallest across all cards. Without subgrid each card lays out independently, so
a two-line title in one card pushes its body down while its neighbours' stay
put, and the footers never align.

Requirements:
- grid-row: span N on the child must match the number of rows it consumes.
- align-self: end on the footer so it sits at the bottom of its track.
- Collapse to one column on narrow screens, where the alignment is moot.`
  ),

  'bento-grid/scroll-state-query': fx(
    'Sticky header that knows it is stuck',
    `Build a sticky header that changes appearance — gains a shadow and a
border — only once it has actually become stuck.

The mechanism: scroll-state container queries. The scroll container declares
itself queryable, and descendants ask about its scroll state.

  .scroller { container-type: scroll-state; overflow-y: auto; }
  @container scroll-state(stuck: top) {
    .sticky-head { box-shadow: 0 8px 20px rgb(0 0 0 / .35); border-bottom-color: …; }
  }

This used to require a zero-height sentinel element above the header plus an
IntersectionObserver to detect when it scrolled out — a well-known hack that
this replaces entirely.

Other states worth mentioning: scroll-state(scrollable: top/bottom) for
"is there more content in this direction", useful for fading scroll affordances,
and scroll-state(snapped: x/y).

Transition the shadow and border so the change is not abrupt, and feature-detect
with CSS.supports('container-type: scroll-state').`
  ),

  /* ═══ color-systems ═══════════════════════════════════════════════════ */

  'color-systems/oklch-ramp': fx(
    'Why OKLCH beats HSL for ramps',
    `Build a side-by-side comparison proving OKLCH's perceptual uniformity.

The demonstration: an HSL hue sweep at fixed saturation and lightness next to
an OKLCH sweep at fixed chroma and lightness. In HSL, yellow at 50% lightness
is dramatically brighter than blue at 50% — the "lightness" is a geometric
construct, not a perceptual one. In OKLCH the whole sweep holds one apparent
brightness.

That single property is what makes generated palettes tractable: equal steps in
L look like equal steps, so a ramp needs no hand-tuning, and rotating H to
re-theme does not silently change contrast.

  oklch(L C H)   L 0-100%   C 0-~0.4   H 0-360deg

Add an interactive lightness ramp with hue and chroma sliders, and taper chroma
toward both ends — full chroma at 95% or 10% lightness is outside every display
gamut and clips, turning the ends of the ramp to mud.`
  ),

  'color-systems/relative-color-syntax': fx(
    'Relative colour syntax for derived states',
    `Build hover, active, disabled and border variants derived from ONE base
colour, so a runtime brand colour still produces a coherent set.

The mechanism: relative colour syntax decomposes an existing colour into
channel keywords you can do arithmetic on.

  --base:     oklch(62% 0.2 265);
  --hover:    oklch(from var(--base) calc(l + 0.08) c h);
  --pressed:  oklch(from var(--base) calc(l * 0.55) c h);
  --muted:    oklch(from var(--base) l calc(c * 0.25) h);
  --opposite: oklch(from var(--base) l c calc(h + 180));

This is the feature that makes a CMS-supplied or user-chosen brand colour
usable: you no longer need to ship five hand-picked hex values per theme,
because every state is a function of one input.

Contrast it with color-mix(), which blends toward another colour rather than
transforming channels — color-mix(in oklch, var(--base), white 60%) for tints,
and note that mixing toward the SURFACE colour rather than pure white keeps
tints in the palette's family.`
  ),

  'color-systems/gradient-interpolation': fx(
    'Gradient interpolation space',
    `Demonstrate that the same two-colour gradient looks completely different
depending on the interpolation space.

Build four gradients with IDENTICAL endpoints:

  linear-gradient(90deg in srgb,             red, blue)
  linear-gradient(90deg in oklab,            red, blue)
  linear-gradient(90deg in oklch,            red, blue)
  linear-gradient(90deg in oklch longer hue, red, blue)

The sRGB one drives through a desaturated grey in the middle — the "dead zone"
that has made two-colour gradients look cheap for twenty years, because sRGB
interpolates channel values rather than perceptual attributes.

oklab keeps chroma up through the middle. oklch interpolates hue directly, so
it travels around the colour wheel. 'longer hue' takes the long way round,
producing a full rainbow between two adjacent colours.

State the practical default: use 'in oklab' for a natural blend between two
arbitrary colours, and 'in oklch' when you want the hue path itself to be part
of the design.`
  ),

  'color-systems/wide-gamut-p3': fx(
    'Wide-gamut P3 colour with an sRGB fallback',
    `Build swatches that use colours which simply do not exist in sRGB, with a
correct fallback.

The mechanism: declare the sRGB value first, then override inside a gamut media
query. The cascade does the rest — a browser or display without P3 never sees
the second declaration.

  .swatch { background: rgb(255 0 80); }
  @media (color-gamut: p3) {
    .swatch { background: color(display-p3 1 0 0.31); }
  }

On a P3 display the difference in saturation is obvious; on sRGB the two are
identical, which is exactly the desired behaviour.

Also worth covering: oklch() can express out-of-sRGB colours directly, and the
browser gamut-maps them — meaning two different high-chroma OKLCH values can
render identically on an sRGB screen. Detect it by converting to linear sRGB
and checking whether any channel falls outside 0..1, and mark such swatches so
the clipping is visible rather than surprising.`
  ),

  /* ═══ particle-field ══════════════════════════════════════════════════ */

  'particle-field/flow-field-particles': fx(
    '100k canvas particles in a flow field',
    `Build a 2D canvas particle system running 100,000+ particles at 60fps with
no library.

The mechanisms, all of which matter at this count:

1. ONE typed array, no objects. Store state as [x, y, vx, vy] per particle in a
   single Float32Array. 100k particle objects means 100k allocations for the GC
   to walk; one contiguous block stays in cache.
2. WRITE PIXELS, NOT SHAPES. Get an ImageData once, view its buffer as a
   Uint32Array, and write one 32-bit value per particle. fillRect per particle
   costs a state change each time. Note that the byte order is little-endian
   ABGR when viewed as Uint32.
3. TRAILS WITH NO HISTORY. Fade the persistent pixel buffer in place each frame
   rather than clearing it. Crucially, early-out on already-black pixels — most
   of the buffer is empty and skipping those is what keeps the fade cheap.
4. Pin the canvas to devicePixelRatio 1. This is CPU fill-rate bound and 4x the
   pixels buys nothing for 1px points.

The field itself: sample 3D value noise (hashed integer lattice, smoothstep
interpolation) at (x*scale, y*scale, time) for an angle, accelerate along it,
and apply drag — without drag the field accelerates forever. Wrap at the edges
rather than clamping so density stays even.`
  ),

  /* ═══ ascii-render ════════════════════════════════════════════════════ */

  'ascii-render/ascii-renderer': fx(
    'Live ASCII renderer for any canvas source',
    `Build a renderer that converts a live source — an animated canvas or a
webcam feed — into text, every frame.

The core idea: draw the source into a canvas that is ALREADY only as wide as
the character grid. The browser's native downscale does the box-averaging for
you in C++, so you never average pixels in JavaScript.

Then map each pixel's luminance to a glyph from a ramp ordered by ink coverage.
Use Rec.709 weights (0.2126R + 0.7152G + 0.0722B), not a channel mean — green
carries most of perceived brightness, and a flat average collapses reds and
blues into the same glyph.

Three traps that will bite you:
1. MEASURE the monospace cell aspect ratio from the rendered font rather than
   assuming 0.5. The error compounds over a hundred rows. Re-measure on
   document.fonts.ready.
2. If the output element can grow its container, and the row count derives from
   that container, the two feed each other and the page HANGS. Give the stage a
   fixed height, take the output out of flow, and clamp the row count.
3. Set font-variant-ligatures: none, or a coding font fuses pairs like != and
   shears the entire grid.

Build the frame as ONE string and assign textContent once. Since the output is
real text it stays selectable and copyable.`
  ),

  /* ═══ shader-lab ══════════════════════════════════════════════════════ */

  'shader-lab/fullscreen-shader-harness': fx(
    'Dependency-free WebGL2 fullscreen shader harness',
    `Build a minimal WebGL2 harness for running a fullscreen fragment shader,
with live editing and no libraries.

The mechanism: render a SINGLE OVERSIZED TRIANGLE, not a quad. It covers the
whole clip volume with no diagonal seam between two triangles, needs no vertex
buffer at all, and costs one draw call. Generate the positions from gl_VertexID:

  void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }
  // then: gl.drawArrays(gl.TRIANGLES, 0, 3);

Uniforms: u_resolution, u_time, u_mouse plus a few scalars — that set covers
most shader toys.

For live editing, the detail that matters: on a failed compile, KEEP THE
PREVIOUS PROGRAM. A half-typed edit must never blank the canvas. Print the
driver's error log and remap its line numbers back into the editor's
coordinate space by subtracting the length of any prelude you prepend.

Aspect-correct coordinates as (gl_FragCoord.xy * 2.0 - u_resolution) /
u_resolution.y, so the shape of the output does not depend on the window.`
  ),

  'shader-lab/shader-techniques': fx(
    'The four procedural shader techniques worth knowing',
    `Write four commented GLSL fragment shaders, each demonstrating one
foundational technique. Assume a fullscreen quad with u_resolution, u_time and
u_mouse available, plus hash/value-noise/fbm helpers.

1. DOMAIN WARPING — feed fbm's own output back in as its input coordinate:
   fbm(p + fbm(p + fbm(p))). One level gives flow; two gives the marbled,
   cloudy structure behind most "organic" shaders. Iñigo Quílez's single most
   reused idea.

2. SIGNED DISTANCE FIELDS — describe shapes by distance to their surface, then
   SHADE BY THAT DISTANCE rather than merely thresholding it: contour rings via
   cos(k*d), a crisp outline via smoothstep on abs(d), and glow via exp(-k*d).
   Use a smooth-minimum to blend shapes so they melt together:
     float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.);
       return mix(b,a,h)-k*h*(1.-h); }

3. RAYMARCHING — march along the view ray in steps of the SDF's value until you
   hit something. Full 3D with no geometry. Get normals from central
   differences of the field, repeat space with mod() to tile infinitely, and
   apply exponential fog. Understep slightly (d += s * 0.85) when the surface
   is displaced, or you punch through it.

4. VORONOI — the cell EDGE is the difference between the nearest and
   second-nearest feature point (d2 - d1), not the distance itself. Animate the
   feature points to make the cells drift.`
  ),

  /* ═══ image-displacement ══════════════════════════════════════════════ */

  'image-displacement/displacement-transition': fx(
    'WebGL image displacement and dissolve transitions',
    `Build a WebGL2 image viewer with pointer-driven distortion and noise-map
slide transitions. No library.

Three stacked mechanisms, each a few lines of GLSL:

1. DISPLACE — offset the texture lookup by a value read from a map:
     float d = texture(u_disp, uv).r;
     vec2 uvA = uv + normal * (d - 0.5) * strength;
2. CHROMATIC SPLIT — sample R, G and B at slightly different offsets. This
   reads as "lens", not "glitch", as long as it stays small.
3. DISSOLVE — compare the map against the transition progress to get a
   PER-PIXEL threshold, so the images tear into each other rather than
   cross-fading uniformly:
     float m = smoothstep(d - 0.08, d + 0.08, progress);

The details that decide whether it feels expensive:
- EASE THE POINTER. p += (target - p) * 0.08 each frame. Reading the raw
  pointer is the whole difference between "weighty" and "twitchy".
- Ramp displacement up and back down across the transition (sin(p * PI)) so the
  first and last frames are pristine.
- Keep the displacement map LOW FREQUENCY — high-frequency noise produces
  sparkle and aliasing.
- Compute an object-fit: cover UV transform from the canvas and image aspect
  ratios; images never match the canvas.
- Set UNPACK_FLIP_Y_WEBGL and CLAMP_TO_EDGE — displaced lookups routinely run
  past the edge, and repeat wrapping causes visible seams.`
  ),

  /* ═══ tsl-material ════════════════════════════════════════════════════ */

  'tsl-material/tsl-node-material': fx(
    'Three.js TSL node materials',
    `Build a Three.js scene using TSL (Three Shading Language) node materials on
WebGPURenderer, with automatic WebGL2 fallback.

The mechanism: TSL expresses shaders as chained JavaScript nodes that compile to
WGSL or GLSL depending on the active backend — one source, both renderers.

Assigning a node to a specific material SLOT replaces only that stage while
inheriting the entire PBR pipeline (lighting, shadows, tone mapping, fog),
which a raw ShaderMaterial forces you to reimplement from scratch:

  const n = mx_fractal_noise_float(positionLocal.mul(freq).add(time), 3);
  material.positionNode  = positionLocal.add(normalLocal.mul(n).mul(0.3));
  material.colorNode     = mix(vec3(0.05,0.15,0.5), vec3(0.9,0.35,0.15), n);
  material.roughnessNode = n.abs().oneMinus();
  material.emissiveNode  = vec3(0.15,0.4,1).mul(n.max(0).pow(5));

Use uniform(x) for live values — it returns a node whose .value you set from
JavaScript, with no location lookups.

Two things to state:
- await renderer.init() before rendering, and report which backend was actually
  selected.
- THE GOTCHA: displacing vertices in positionNode does NOT update normals, so
  the surface lights as if still smooth. Either recompute them from the noise
  gradient or accept the softer look — but say which and why.

Tessellate densely; vertex displacement is only as smooth as the mesh.`
  ),

  /* ═══ gpu-particles ═══════════════════════════════════════════════════ */

  'gpu-particles/gpu-compute-particles': fx(
    'A quarter-million particles in a WebGPU compute shader',
    `Build a Three.js WebGPU particle system simulating 250k+ particles entirely
on the GPU.

The mechanism: instancedArray() allocates GPU storage buffers. One compute
kernel seeds them once, another advances them each frame, and the render
material reads the SAME buffer via .toAttribute(). Positions never travel to
the CPU — which is what makes this an order of magnitude faster than a JS loop.

  const positions  = instancedArray(COUNT, 'vec3');
  const velocities = instancedArray(COUNT, 'vec3');
  const update = Fn(() => {
    const p = positions.element(instanceIndex);
    const v = velocities.element(instanceIndex);
    v.addAssign(force(p).mul(deltaTime));
    v.mulAssign(damping);
    p.addAssign(v.mul(deltaTime));
  })().compute(COUNT);
  material.positionNode = positions.toAttribute();

Non-obvious requirements:
- Seed uniformly INSIDE A BALL: normalize a random vector and scale by
  cbrt(random). A cube's corners are visibly denser.
- CLAMP deltaTime inside the kernel (~0.033). A backgrounded tab resumes with
  one enormous step and flings every particle to infinity.
- Curl noise: the cross product of finite differences of a noise field is
  divergence-free, so particles swirl without clumping. The differences are on
  the order of 0.01, so the multiplier must be LARGE or it reads as a static
  blob.
- Render with AdditiveBlending and depthWrite:false — addition is commutative,
  so there is no sorting problem. Keep per-particle alpha low (~0.25) or dense
  regions blow out to white.
- WebGL2 has no compute stage. Detect the fallback and say so on screen.`
  ),

  /* ═══ glass-refraction ════════════════════════════════════════════════ */

  'glass-refraction/physical-glass': fx(
    'Physically-based glass: transmission and dispersion',
    `Build a Three.js scene with genuinely refractive glass using
MeshPhysicalMaterial's transmission.

  const glass = new THREE.MeshPhysicalMaterial({
    transmission: 1, ior: 1.52, thickness: 1.5, roughness: 0.04,
    dispersion: 0.45, iridescence: 0.2, metalness: 0, clearcoat: 1,
    attenuationColor: new THREE.Color(0x88ccff), attenuationDistance: 2.5,
  });

What each parameter physically means: transmission is the fraction of light
passing through rather than reflecting (NOT opacity — transmitted light still
refracts and tints); ior is how sharply light bends (water 1.33, glass 1.5,
diamond 2.42); thickness drives both bending and how strongly attenuationColor
accumulates via Beer-Lambert absorption; dispersion splits wavelengths, which
is the rainbow in a prism.

TWO THINGS THAT WILL WASTE YOUR AFTERNOON:
1. An environment map is MANDATORY. scene.environment via PMREMGenerator.
   Without one, glass renders black.
2. The effect is entirely a function of what is BEHIND it. Over an empty
   background a glass ball just looks like a dark sphere. Put busy,
   high-frequency, brightly coloured content directly behind it.

Costs: transmission renders the opaque scene to an offscreen buffer first, so
it is a second pass; roughness needs a blurred mip chain; dispersion costs
three samples instead of one. And transmissive objects cannot refract EACH
OTHER — they are excluded from the buffer they read.`
  ),

  /* ═══ post-fx ═════════════════════════════════════════════════════════ */

  'post-fx/tsl-post-processing': fx(
    'Post-processing stack as TSL nodes',
    `Build a Three.js post-processing chain — bloom, chromatic aberration, film
grain, vignette and colour grading — composed as nodes on a single output node
rather than as a chain of framebuffer passes.

  const scenePass = pass(scene, camera);
  const colour    = scenePass.getTextureNode();
  const glow      = bloom(colour, strength, radius, threshold);
  let out = colour.add(glow);
  // …everything downstream is ordinary arithmetic on colour
  post.outputNode = vec4(out, 1);

The old EffectComposer ran a full-screen pass with its own render target per
effect; here the compiler fuses most of the chain into one fragment shader.

ORDER IS THE ENTIRE LESSON:
- Bloom must run in LINEAR HDR, BEFORE tone mapping. With values clamped to 1.0
  there is nothing above the threshold, so you get a uniform haze instead of
  light. Scene content must have emissive values above 1.0 — but keep them
  close to the threshold, not far past it, or geometry blows out to a white
  blob.
- Grain and vignette must run AFTER, in display space. Grain before tone
  mapping gets crushed by it; a vignette before it shifts hue as it darkens.

Chromatic aberration must be RADIAL — zero at the centre, growing toward the
corners, like a real lens. Keep it under ~0.005 of screen width.

Grading: saturation is mix(vec3(luminance), colour, amount); contrast is a
scale about 0.5.

Implement toggles as a 0/1 uniform multiplying each effect's contribution, so
switching one off needs no graph rebuild.`
  ),

  /* ═══ gsap-scrolltrigger ══════════════════════════════════════════════ */

  'gsap-scrolltrigger/gsap-stagger-reveal': fx(
    'Staggered reveal with toggleActions',
    `Build a staggered card reveal with GSAP ScrollTrigger that plays forward on
enter and reverses on the way back up.

  gsap.from('.card', {
    y: 60, opacity: 0, duration: 0.7, ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.cards', start: 'top 80%',
                     toggleActions: 'play none none reverse' },
  });

toggleActions takes FOUR values, in order: onEnter, onLeave, onEnterBack,
onLeaveBack. Each is one of play / pause / resume / reverse / restart / none.
'play none none reverse' is the sensible default — animate in on the way down,
animate back out on the way up, ignore the other two boundaries.

stagger: 0.08 produces ONE tween with an interpolated offset, not N tweens.

'start: top 80%' reads as "when the trigger's top hits 80% down the viewport".

Note when NOT to use GSAP for this: if all you need is a scrubbed reveal, a CSS
scroll-driven animation does it with zero JavaScript and cannot jank. Reach for
ScrollTrigger when you need real sequencing, pinning or snapping.`
  ),

  'gsap-scrolltrigger/gsap-pin-scrub': fx(
    'Pinned section with a scrubbed timeline',
    `Build a section that pins in place while a timeline scrubs through several
stages as the user scrolls.

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#pin', start: 'top top', end: '+=2600',
      pin: true,
      scrub: 0.8,
      snap: { snapTo: [0, .33, .66, 1], duration: .3, ease: 'power2.inOut' },
    },
  });
  tl.to('.art', { rotate: 180, scale: 1.25, ease: 'none' }, 0)
    .to('.art', { rotate: 360, scale: 0.85, ease: 'none' }, 0.5);

Details that matter:
- scrub as a NUMBER (0.8) adds that many seconds of catch-up smoothing; scrub:
  true welds it to the scrollbar and feels mechanical.
- Use ease: 'none' on scrubbed tweens. The scroll position is already the
  easing; adding another makes the motion feel like it is fighting you.
- The third argument to .to() is the position parameter — absolute time on the
  timeline, which is how several tweens overlap on one scroll range.
- anticipatePin: 1 avoids a one-frame jump on fast scrolls.
- Pinning changes document height, so call ScrollTrigger.refresh() after fonts
  load or layout changes.`
  ),

  'gsap-scrolltrigger/gsap-horizontal-scroll': fx(
    'Horizontal scroll driven by vertical scrolling',
    `Build a horizontally scrolling section: pin a container and translate an
inner track sideways as the page scrolls down.

  const distance = () => track.scrollWidth - innerWidth;
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#outer', start: 'top top',
      end: () => '+=' + distance(),
      pin: true, scrub: 1,
      invalidateOnRefresh: true,
    },
  });

THE KEY DETAIL: pass x and end as FUNCTIONS, and set invalidateOnRefresh: true.
Function values are re-evaluated on every refresh, so the travel distance
recalculates on resize. Hardcode them and the section breaks the moment the
viewport changes — the single most common bug in this pattern.

Setting end to exactly the track's overflow width makes the horizontal motion
1:1 with vertical scroll, so it feels like direct manipulation rather than a
ratio.

Accessibility: pinning hijacks scrolling, so keep the section short, never trap
focus inside it, and provide a reduced-motion path that leaves the track as a
normal horizontally-scrollable region.`
  ),

  'gsap-scrolltrigger/gsap-counters': fx(
    'Animated counters and split-text reveal',
    `Build numbers that count up when they scroll into view, and a headline that
reveals word by word from behind a mask.

COUNTERS — the general technique for animating anything that is not a CSS
property: tween a plain object and write the DOM in onUpdate.

  const value = { n: 0 };
  gsap.to(value, {
    n: target, duration: 1.6, ease: 'power2.out',
    onUpdate: () => el.textContent = value.n.toFixed(digits),
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });

Use font-variant-numeric: tabular-nums on the element, or the layout jitters as
digit widths change during the count.

SPLIT TEXT — wrap each word in an inner span inside an overflow:hidden outer
span, then animate yPercent from 110 to 0 so the words rise out from behind the
mask:

  gsap.from('.line > span', { yPercent: 110, duration: .8, ease: 'power4.out', stagger: .06 });

Accessibility: set aria-label to the original string on the container and mark
the generated spans aria-hidden, or a screen reader announces fragments.`
  ),

  /* ═══ spring-ui ═══════════════════════════════════════════════════════ */

  'spring-ui/spring-vs-ease': fx(
    'Spring vs fixed-duration easing',
    `Build a side-by-side comparison of a spring and a fixed-duration ease
travelling the same distance, with live stiffness/damping/mass controls.

The conceptual point: a spring has NO DURATION. It has stiffness, damping and
mass, and it settles when the physics say so. That is why an interrupted spring
looks right and an interrupted ease does not — the spring carries its current
velocity into the new target, while the ease restarts from zero velocity and
visibly stutters.

  animate(el, { x: target }, { type: spring, stiffness: 260, damping: 20, mass: 1 });
  animate(el, { x: target }, { duration: 0.4, ease: [0.4, 0, 0.2, 1] });

Compute and display the damping ratio, which classifies the whole behaviour:

  zeta = damping / (2 * Math.sqrt(stiffness * mass))

zeta < 1 underdamped (overshoots and bounces), zeta = 1 critically damped (the
fastest approach with no overshoot), zeta > 1 overdamped (sluggish).

Give the user a button that retargets BOTH mid-flight, so the difference is
demonstrated rather than asserted.

Sensible UI defaults: stiffness 300, damping 30, mass 1 — then adjust damping
first. Bounce belongs on playful things, never on a menu someone is waiting for.`
  ),

  'spring-ui/drag-with-momentum': fx(
    'Drag with release momentum',
    `Build a draggable element that carries its throw velocity into a spring
when released.

The mechanism that makes it feel physical: keep a SHORT HISTORY of pointer
positions (about six samples) and compute velocity over roughly the last 60ms
on release. A single frame's delta is far too noisy to use.

  const first = samples[0], last = samples.at(-1);
  const dt = (last.t - first.t) / 1000;
  const vx = (last.x - first.x) / dt;       // px per second

Then hand that to the spring as a per-axis initial velocity:

  animate(el, { x: 0, y: 0 }, {
    type: spring, stiffness: 180, damping: 16,
    x: { velocity: vx }, y: { velocity: vy },
  });

Other requirements:
- setPointerCapture on pointerdown so the drag survives the pointer leaving the
  element.
- SOFT BOUNDS: past the wall, movement is damped (multiply the excess by ~0.35)
  rather than hard-clamped. Hard clamping feels broken; rubber-banding reads as
  a limit.
- touch-action: none on the handle, or the browser scrolls instead of dragging.
- Cancel any in-flight animation on pointerdown so it does not fight the
  pointer.`
  ),

  'spring-ui/flip-layout-morph': fx(
    'Shared-layout morphing with FLIP',
    `Build a grid of tiles where clicking one expands it into a large overlay,
morphing smoothly from its original position.

The mechanism is FLIP, and it is worth spelling out because it is the
foundation of every shared-layout animation:

  F — FIRST:  measure the element where it is now (getBoundingClientRect).
  L — LAST:   apply the final layout and measure again.
  I — INVERT: apply a transform that puts it visually back at First.
  P — PLAY:   animate that transform away to identity.

  const first = tile.getBoundingClientRect();
  // …move it to its final position/size…
  const last = clone.getBoundingClientRect();
  clone.style.transformOrigin = 'top left';
  clone.style.transform =
    'translate(' + (first.left-last.left) + 'px,' + (first.top-last.top) + 'px)' +
    ' scale(' + (first.width/last.width) + ',' + (first.height/last.height) + ')';
  animate(clone, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, { type: spring, stiffness: 220, damping: 26 });

Only TRANSFORM animates, so the browser never re-lays-out mid-tween — which is
why FLIP is smooth where animating width/height is not.

Implement the collapse as the same procedure in reverse. Add a scrim, Escape to
close, and restore focus to the originating tile.`
  ),

  'spring-ui/hover-press-gestures': fx(
    'hover() and press() gesture handlers',
    `Build interactive elements using proper gesture handlers rather than raw
mouse events, with the Motion library.

  hover(el, (element) => {
    animate(element, { scale: 1.08 }, { type: spring, stiffness: 400, damping: 20 });
    return () => animate(element, { scale: 1 }, { type: spring, stiffness: 300, damping: 22 });
  });

  press(el, (element) => {
    animate(element, { scale: 0.94 }, { type: spring, stiffness: 700, damping: 30 });
    return () => animate(element, { scale: 1 }, { type: spring, stiffness: 500, damping: 18 });
  });

Why these beat mouseenter/mousedown:
- hover() ignores touch taps. Bind mouseenter and a tap on a phone leaves the
  element stuck in its hover state until you tap elsewhere.
- press() handles pointer capture and cancels correctly when the pointer is
  dragged OFF the element before release — the behaviour a real button has.
- Both return a cleanup function, and the callback returns its own "end"
  handler, so state cannot leak.

Note the asymmetric springs above: enter/press is stiffer and faster than the
return. That asymmetry is what makes it feel responsive rather than springy.`
  ),

  /* ═══ smooth-scroll ═══════════════════════════════════════════════════ */

  'smooth-scroll/lenis-parallax': fx(
    'Lenis smooth scroll driving depth parallax',
    `Build a smooth-scrolling page with Lenis where multiple layers translate at
different rates.

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  function frame(time) { lenis.raf(time); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  lenis.on('scroll', ({ scroll }) => {
    for (const layer of layers)
      layer.style.transform =
        'translate3d(0,' + (scroll * layer.dataset.depth) + 'px,0)';
  });

Rules that decide whether this works or ruins the page:
- ONE requestAnimationFrame loop calling lenis.raf(time) with the RAW
  millisecond timestamp. A second competing loop is the most common source of
  stutter in Lenis projects.
- Derive every effect from the single 'scroll' event rather than adding more
  scroll listeners.
- syncTouch: false — mobile browsers already scroll well, and overriding it
  costs the address-bar collapse.
- Call lenis.resize() from a ResizeObserver and on document.fonts.ready, or the
  cached document height goes stale and the page stops short of the bottom.
- Under prefers-reduced-motion, do not instantiate Lenis AT ALL. Hijacked
  scrolling is exactly what that setting exists for.
- Be honest about the cost: it breaks find-in-page, scroll restoration and
  native anchor jumps, and it is incompatible with CSS scroll-driven
  animations, which read the real scroll offset.`
  ),

  'smooth-scroll/velocity-skew': fx(
    'Content that skews with scroll velocity',
    `Build content that leans into the scroll — a small skew proportional to
scroll speed, decaying back to zero when it stops.

The mechanism: read velocity from the scroll event (or diff scrollY inside a
rAF loop), clamp it, and EASE the skew toward that target rather than setting
it directly:

  const target = Math.max(-8, Math.min(8, velocity * 0.35));
  skew += (target - skew) * 0.15;
  el.style.transform = 'skewY(' + skew + 'deg)';

The easing is what makes it decay smoothly instead of snapping back the instant
scrolling stops.

Pair it with a slight scale-down at high velocity for a sense of inertia:
scale = 1 - min(abs(velocity) * 0.0015, 0.06).

Keep the maximum skew SMALL — 8 degrees is plenty. Past about 12 the text
becomes hard to read and it stops reading as physics and starts reading as a
broken transform. Add will-change: transform on the skewed element, and skip
the effect entirely under prefers-reduced-motion.`
  ),

  'smooth-scroll/sticky-depth-stack': fx(
    'Sticky cards that recede as the next arrives',
    `Build a stack of full-height cards that stick in place and recede in scale
and brightness as the following card scrolls over them.

The mechanism: each card is position: sticky inside its own tall track. As it
passes its sticky point, compute how far past it has travelled and map that to
scale and brightness:

  const r = card.getBoundingClientRect();
  const past = clamp((stickyTop - r.top) / (r.height * 0.9), 0, 1);
  card.style.transform = 'scale(' + (1 - past * 0.12) + ') translateY(' + (-past * 40) + 'px)';
  card.style.filter = 'brightness(' + (1 - past * 0.45) + ')';

Each card needs its own track element (not siblings in one container), or they
all stick at the same offset and overlap immediately.

Keep the scale reduction modest (~12%) and the brightness drop noticeable —
brightness does more of the perceptual work than scale, because it reads as
distance and shadow rather than as the card simply shrinking.

This can be done entirely in CSS with animation-timeline: view() if you are not
already using a smooth-scroll library — which is the better option when
available.`
  ),

  'smooth-scroll/lenis-scrollto': fx(
    'Programmatic scrolling that matches the manual feel',
    `Build anchor navigation that scrolls through the smooth-scroll library
rather than the browser, so programmatic and manual scrolling share one feel.

  lenis.scrollTo(target, {
    offset: -80,                 // clear a sticky header
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),   // expo-out
  });

Why not native: CSS scroll-behavior: smooth uses the browser's own curve and
duration, which will visibly differ from the library's easing — and with a
virtual scroll position active, a native jump fights the library outright and
can leave the two out of sync.

The offset parameter is what stops the target landing underneath a sticky
header, which is otherwise a permanent papercut.

Accessibility, and this is the part usually missed: programmatic scrolling does
not move FOCUS. After scrolling to a section, call focus() on it (adding
tabindex="-1" if it is not natively focusable), or keyboard users are moved
visually while their focus stays behind, and the next Tab jumps them back.`
  ),

  /* ═══ overlays & navigation ═══════════════════════════════════════════ */

  'dialog/modal-dialog': fx(
    'Native modal with animated entry and exit',
    `Build an accessible confirmation modal with the native <dialog> element.

Use showModal(), not an open attribute, so the browser moves the dialog to the
top layer, makes the rest of the document inert, traps focus, supports Escape,
and restores focus to the opener. Put action buttons in <form method="dialog">
so their value becomes dialog.returnValue without custom click handlers.

Animate opacity, translate and scale. The non-obvious mechanism is to include
'display ... allow-discrete' and 'overlay ... allow-discrete' in the transition
so the closing dialog remains rendered long enough for its exit to play. Use
@starting-style around dialog:open for the entry frame. Clicking the backdrop
may requestClose(), but clicks on dialog children must not. Keep an explicit
close button and never remove the native Escape behavior.`
  ),

  'dialog/side-drawer': fx(
    'Side drawer with native modal behavior',
    `Build a settings drawer that enters from the inline-end edge while using a
real modal <dialog>. Position it with inset: 0 0 0 auto, height: 100dvh,
max-height: none and margin: 0. Animate translate from 100% to zero, plus the
discrete display and overlay properties so both opening and closing animate.

The drawer must use showModal() because a fixed div with a large z-index does
not make background content inert, contain Tab, respond correctly to Escape,
or restore focus. Use logical inline concepts in the explanation, constrain its
width to min(430px, 92vw), and retain visible focus rings for every field and
button. Under reduced motion, make the transition effectively instant.`
  ),

  'dialog/drag-sheet': fx(
    'Velocity-aware drag-to-dismiss bottom sheet',
    `Build a mobile bottom sheet from a modal <dialog>, with a visible drag
handle. During pointerdown call setPointerCapture. On pointermove write only a
non-negative --drag custom property and use it in translate, so the sheet
follows the finger on the compositor without layout reads every frame.

On release dismiss when either distance exceeds 25% of sheet height OR downward
velocity exceeds 0.7 px/ms; otherwise remove --drag and let CSS spring it home.
Compute velocity from the last pointer sample and elapsed milliseconds, not
from total distance, so a short flick works. Disable transitions only while
actively dragging. Do not start the gesture for reduced-motion users, and keep
normal close buttons, Escape, focus containment, and focus restoration.`
  ),

  'toast/toast-stack': fx(
    'Bounded toast queue with duplicate coalescing',
    `Build a bottom-end toast queue where new notices arrive nearest the viewport
edge. Cap the visible stack at four. When an event with the same semantic key
already exists, pulse or update that toast instead of adding a duplicate.

Each toast needs a title, concise message and explicit dismiss button. Keep the
container pointer-events:none and restore pointer-events on each toast so the
stack does not block the page. Animate new items with opacity plus translate
and remove only after the exit animation ends. Announce routine status through
a persistent aria-live="polite" region; use assertive only for time-sensitive
failures. Do not put live-region semantics on the entire changing stack because
reordering it causes repeated announcements.`
  ),

  'toast/pause-timer': fx(
    'Toast timer that pauses for attention',
    `Build an auto-dismiss toast with a five-second visual progress line. Pause
both the CSS animation and JavaScript removal timer on hover AND focus-within.
Track remaining milliseconds: on pause, clearTimeout and subtract performance.now
minus the last start; on resume, start a new timeout for exactly the remainder.
Merely pausing the CSS bar while the JS timeout continues is a dishonest UI.

Never auto-dismiss errors or a toast containing an action such as Undo. Every
toast needs an always-available close button. Reduced motion should remove the
animated countdown rather than removing the notification or its controls.`
  ),

  'toast/swipe-dismiss': fx(
    'Swipe-to-dismiss toast with a commitment threshold',
    `Build a toast that can be dragged horizontally with Pointer Events. Capture
the pointer, translate by the live delta, and dismiss only when absolute drag
distance exceeds 35% of the toast width OR release velocity exceeds 0.75 px/ms.
Otherwise remove the inline offset so it settles back.

Do not start a drag from an action or close button. Direction should be free so
the gesture works on either viewport edge and in either writing direction.
Keep a keyboard-accessible close button because swipe is an enhancement, not
the only path. Remove the node after its exit animation rather than immediately,
and protect against starting removal twice.`
  ),

  'command-palette/command-shell': fx(
    'Accessible command palette shell',
    `Build a Command-K / Control-K command palette using a native <dialog>, a
text input with role="combobox", and a results container with role="listbox".
DOM focus must remain in the input while ArrowUp/ArrowDown change a single
aria-activedescendant that points to the selected role="option". Enter executes
it and Escape uses the dialog's native close behavior.

Use event.metaKey OR event.ctrlKey so the shortcut is cross-platform and call
preventDefault to avoid browser conflicts. Scroll the active option with
scrollIntoView({block:'nearest'}). On every open, clear the query, render all
commands, and focus the input on the next animation frame. Report execution in
a polite live region after closing.`
  ),

  'command-palette/fuzzy-search': fx(
    'Stable fuzzy command scoring',
    `Build a small dependency-free fuzzy search for a command palette. Normalize
case and assign tiers: exact prefix scores highest, prefix of any word next,
then an ordered-character match. For the fuzzy tier, walk the query characters
through the candidate and penalize gaps between matches. A missing character
rejects the candidate.

Return both score and matched character indexes so the UI can wrap only the
evidence in <mark>. Preserve original command order as a secondary sort key so
equal scores never jump randomly while typing. Search both command name and
description, but highlight only indexes that fall within the visible name.
Render a useful no-results recovery message rather than a blank panel.`
  ),

  'command-palette/command-states': fx(
    'Grouped command results and execution feedback',
    `Build command results grouped by user intent such as Project, Appearance,
and Accessibility. Filtering must remove empty group headings. Every option
has an icon, action label, one-line consequence, and optional shortcut, while
the whole row remains the single interactive target.

Pointer hover updates the same active index used by keyboard navigation—never
maintain separate hover and keyboard selections. After execution, close the
palette and announce "Ran: [command]" in an aria-live="polite" status node.
For zero matches show a compact empty state that suggests shortening the query.
Do not navigate in this reusable example; inject an execute callback so a host
application owns side effects.`
  ),

  'menus/roving-menu': fx(
    'Popover action menu with roving tabindex',
    `Build an action menu using a popover element with role="menu", opened by a
button with aria-haspopup="menu" and popovertarget. Anchor it below the trigger
with CSS anchor positioning and flip-block fallback.

Inside, use roving tabindex: exactly one role="menuitem" has tabindex=0 and all
others -1. Arrow keys wrap, Home/End jump, printable characters typeahead by
label, and Escape hides the popover then returns focus to its trigger. Focus the
first item after the popover toggle event and a requestAnimationFrame. Use
:focus for the active row because script deliberately moves focus. The Popover
API should own top-layer stacking and light-dismiss; do not recreate those with
document click listeners.`
  ),

  'menus/safe-triangle': fx(
    'Mega menu with diagonal hover forgiveness',
    `Build a desktop mega menu whose panel does not collapse while the pointer
moves diagonally from a navigation trigger into the panel. Track recent pointer
coordinates. On trigger leave, compare the pointer trajectory with the panel's
near edge; if it is moving toward the panel, delay closure about 400ms,
otherwise close after about 120ms. Cancel the timer on panel enter.

Do not make hover the only interaction: focus opens the corresponding panel,
aria-expanded reflects state, Escape closes, and all destinations are ordinary
links. On narrow screens avoid hover dependence and present a stable stacked or
disclosure layout. Keep the forgiveness delay bounded—this solves accidental
closure, not sluggish navigation.`
  ),

  /* ═══ 2026 platform primitives ═══════════════════════════════════════ */

  'css-carousel/scroll-buttons': fx(
    'CSS-generated carousel controls',
    `Build a semantic horizontal carousel from a list and CSS only. The list is
an overflow-x:auto scroll container with scroll-snap-type:inline mandatory;
each item uses scroll-snap-align:center. Generate previous and next controls
with ::scroll-button(inline-start) and ::scroll-button(inline-end), providing
both visible content and an accessible name through the content property's
string/alt syntax.

Position the generated buttons over the scroller with CSS anchor positioning.
Style their :disabled state—the browser owns boundary detection and disables
them at the first and last page. Use logical directions, not left/right, so the
control follows writing mode. The fallback must remain an ordinary scrollable
snap list; never hide overflow or require generated buttons to reach content.`
  ),

  'css-carousel/scroll-markers': fx(
    'Native carousel markers with current-target state',
    `Add direct navigation markers to a CSS scroll-snap carousel without
JavaScript. Set scroll-marker-group:after on the scroller, create one marker per
item with item::scroll-marker, and supply an accessible name using content with
alt text sourced from a data-label attribute. Lay out ::scroll-marker-group as
a centered row.

Style the current marker using ::scroll-marker:target-current. Animate its
width and color but keep all markers large enough to perceive and focus. Explain
that the browser updates current state from the eventual scroll target and owns
the focus-group keyboard behavior. Do not duplicate state in aria-selected or
an IntersectionObserver. Keep native scrolling as the unsupported fallback.`
  ),

  'css-carousel/snapped-state': fx(
    'Card styling driven by snapped scroll state',
    `Build carousel cards whose visual emphasis follows which card is snapped,
using scroll-state container queries instead of a scroll listener. Each item
declares container-type:scroll-state. Give the resting card slightly reduced
opacity, scale and saturation, then restore them inside:
  @container scroll-state(snapped: inline) { .card { ... } }

Pair this with scroll-snap-align and a modest transition. The state must remain
purely decorative—content and controls cannot disappear simply because support
is missing. Avoid aggressive scaling that changes the perceived snap geometry,
and remove the transition under prefers-reduced-motion.`
  ),

  'custom-select/rich-options': fx(
    'Rich options in a native customizable select',
    `Build a native <select> whose options contain a decorative swatch, primary
label and short supporting line. Opt both the control and ::picker(select) into
appearance:base-select. Style option:hover, option:focus, option:checked and
option::checkmark while preserving the platform's keyboard selection and form
submission.

Every option needs an explicit value so rich text cannot change submitted data.
Decorative icons use aria-hidden. Do not put buttons, links or other interactive
content inside options. Include @supports or capability messaging and ensure
unsupported browsers still receive a labeled, functional native select with
plain option text—the enhancement may disappear, but selection cannot.`
  ),

  'custom-select/selected-content': fx(
    'Separate closed and open select presentations',
    `Build a customizable select whose first child is an inert <button> holding
<selectedcontent>. Explain and demonstrate that selectedcontent receives a
clone of the selected option, which can be styled differently from the option
inside the open picker. Hide secondary descriptions and shortcut labels only
inside selectedcontent so the closed control stays compact while picker rows
retain decision-making context.

Do not add event handlers or focusable children to the inner button; native
select behavior owns it. Use explicit option values. Note the important data
model caveat: later DOM mutations to the original selected option are not
automatically reflected until selection changes, because the browser cloned
the subtree rather than moving it.`
  ),

  'custom-select/adaptive-picker': fx(
    'Top-layer select picker with intrinsic-width reveal',
    `Build an icon-first native select picker that expands to reveal option text
when hovered or when an option receives :focus-visible. Use
appearance:base-select, target the top-layer surface with ::picker(select), and
animate width toward calc-size(auto, size + .5rem) where supported. The focus
selector belongs on the select via :has(option:focus-visible), so keyboard and
pointer users get the same reveal.

Animate picker entry/exit with opacity and translate plus display/overlay
allow-discrete, and use @starting-style for the opening frame. Rotate
::picker-icon when select:open. Provide a stable min-width fallback when
calc-size or customizable selects are unavailable, and make all motion instant
under prefers-reduced-motion.`
  ),

  'interest-popovers/profile-preview': fx(
    'Declarative link preview from user interest',
    `Build a link that reveals a contextual preview when a user shows interest
through hover, keyboard focus or supported touch intent. Give the link
interestfor="preview-id" and the target id="preview-id" popover="hint". Add
interest-delay-start around 450ms so moving through dense prose does not erupt
with previews, and a shorter end delay so the pointer can cross into the card.

Anchor the hint near its invoker with position-area, animate its discrete
top-layer entry/exit, and keep the link's href fully functional—activation must
still navigate. Preview content supplements rather than duplicates the target
page. Feature-detect interestForElement and provide hover+focus JS fallback,
while stating that fallback cannot faithfully reproduce native long-press.`
  ),

  'interest-popovers/warm-intent': fx(
    'Warm intent delays across related previews',
    `Build a dense row of interest invokers where the first preview waits long
enough to prove intent, but moving among related items feels immediate. Apply a
default interest-delay-start of about 450ms. When the container :has() any
child matching :interest-source, reduce sibling start delays to about 80ms.
Retain a short interest-delay-end so users can move into interactive preview
content without crossing a disappearing gap.

Each target is popover="hint", so opening one hint replaces the prior hint but
does not dismiss an unrelated auto popover. Focus must trigger the same previews
as pointer dwell. Avoid a zero initial delay: it creates noisy, involuntary UI
and makes users steer around triggers.`
  ),

  'interest-popovers/dual-popover': fx(
    'One control with a hint and an action popover',
    `Build one button with two declarative relationships: interestfor points to
a small popover="hint" tooltip, while commandfor plus
command="toggle-popover" controls a richer popover="auto" panel on activation.
Showing interest must not consume the click, and opening the auto panel must not
close the hint merely because it appeared—the hint popover type exists for this
layering case.

Position the hint above and panel below the same invoker using anchor positioning.
Keep the hint nonessential and the activated panel fully operable by keyboard.
Feature-detect commandForElement and add only a click/togglePopover fallback;
do not rebuild light-dismiss, Escape or top-layer stacking in JavaScript.`
  ),

  'navigation-api/unified-navigation': fx(
    'Client-side routing from one navigation event',
    `Build a tiny client-side router with the Navigation API. Listen once to
window.navigation's navigate event. Exit early when event.canIntercept is false,
the destination is cross-origin, or its pathname is outside the app. For an
eligible URL call event.intercept({ handler }), parse route state from
event.destination.url and render it.

This handler must cover links, history traversal and navigation.navigate calls
without a document-level click trap. Keep real href values so open-in-new-tab,
copy-link and no-JavaScript navigation remain meaningful. Include a small
History API fallback with click and popstate handling, explicitly noting that it
does not cover every navigation source the native API sees.`
  ),

  'navigation-api/async-transition': fx(
    'Async route rendering coordinated with View Transitions',
    `Build an intercepted Navigation API route whose URL commits immediately,
shows a pending state, awaits asynchronous data and then swaps content inside
document.startViewTransition(). Await transition.updateCallbackDone before
performing work that assumes the new DOM exists. Use a monotonically increasing
render token or AbortController so a slow older route cannot overwrite a newer
navigation.

Set intercept options to manual scroll and focus reset when the application
owns those behaviors. After rendering, move focus to the new page heading with
tabindex=-1 and preventScroll, then call the NavigateEvent's scroll() method at
the correct readiness point. Skip the visual transition under reduced motion;
never skip the route or focus update.`
  ),

  'navigation-api/traversal-direction': fx(
    'History-aware route transition direction',
    `Build spatial route transitions that distinguish forward navigation from
back traversal. During a Navigation API navigate event, compare
event.destination.index with navigation.currentEntry.index before interception.
Write data-direction="back" or "forward" on the root. Use that attribute to
swap the old/new View Transition keyframes: forward content exits inline-start
and enters from inline-end; back does the reverse.

Keep distances modest, pair exit with faster ease-in and entry with slower
ease-out, and animate a named route container rather than the entire document.
History direction is supporting information, never the only indication of
location. Reduce all transition duration effectively to zero for users who
prefer reduced motion.`
  ),

  'css-next/responsive-shape': fx(
    'Responsive paths with CSS shape()',
    `Build a responsive decorative panel using clip-path:shape(). Use the CSS
command syntax—start with 'from', then line and curve commands, and close the
path. Define every control point in percentages so the path follows the box at
any aspect ratio; demonstrate that calc() and custom properties may be used in
coordinates, unlike the quoted SVG syntax consumed by path().

Create a hover or focus morph by keeping both shapes' command structures
compatible and transitioning clip-path. Content must remain readable when the
entire declaration is unsupported: start from ordinary border-radius geometry,
then apply shape() inside @supports. Keep the hit target stable and remove the
morph transition under prefers-reduced-motion.`
  ),

  'css-next/typed-attr': fx(
    'Data attributes consumed as typed CSS values',
    `Build progress rows whose source values live only in data-progress HTML
attributes. Parse each value with attr(data-progress type(<number>), 0), store
it in --progress, and calculate width as calc(var(--progress) * 1%). Show a
second element parsing an angle attribute with type(<angle>) or the deg unit.

Include a fallback value in attr() for missing or invalid data. Keep semantic
visible text or a real progress element because generated styling is not an
accessible value. Explain that typed attr() avoids JavaScript copying data into
inline styles but does not turn data-* into application state. Provide a static
width fallback before the enhanced declaration.`
  ),

  'css-next/contrast-color': fx(
    'Foreground chosen with contrast-color()',
    `Build a live colour card controlled by an input type=color. JavaScript only
writes one --surface token. CSS uses background:var(--surface) and
color:contrast-color(var(--surface)) so the browser chooses black or white from
the computed background.

Put a conventional foreground declaration immediately before the enhanced one
as fallback. Explicitly warn that contrast-color() only chooses between black
and white; some mid-tone colours may still be poor for small WCAG text, and the
function does not replace a real contrast audit. Use it for user-selected or
unbounded colours, not as an excuse to abandon curated semantic token pairs.`
  ),

  'css-next/sibling-stagger': fx(
    'Automatic stagger from sibling-index()',
    `Build a row of items that enters sequentially without nth-child selectors,
inline --i values or JavaScript-authored indexes. On each child set
--i:sibling-index() and --count:sibling-count(), then calculate animation-delay
as calc((var(--i) - 1) * 55ms). Use --count for one additional structural value,
such as distributing hue or normalizing position.

Add a replay button that only removes and restores a class; it must never count
the elements. Demonstrate that inserting or reordering a sibling automatically
recalculates choreography. Provide a no-delay fallback, cap total stagger for
long collections, and zero both duration and delay under reduced motion.`
  ),

  'custom-highlights/search-ranges': fx(
    'Search highlighting without wrapper elements',
    `Build in-document search with the CSS Custom Highlight API. Walk only text
nodes under the searchable article using TreeWalker and NodeFilter.SHOW_TEXT.
For every case-insensitive match create a Range with offsets local to that text
node. Put all ranges into one Highlight and register it as
CSS.highlights.set('search-results', highlight); style it with
::highlight(search-results).

On each query change delete the prior named highlight before rebuilding it,
handle overlapping-search policy explicitly, and announce the match count in a
polite output. Do not replace innerHTML or wrap matches in mark elements—the
point is preserving DOM identity, event listeners, selection and layout. Keep
the unmodified article readable when CSS.highlights is absent.`
  ),

  'custom-highlights/persistent-annotations': fx(
    'Persistent user annotations with Range and Highlight',
    `Build a prose annotator where users select text and press one of three
colour buttons. On activation verify selection.rangeCount, reject a collapsed
selection or one outside the article, clone the Range, then collapse the native
selection. Store annotation metadata separately from rendering.

Group saved ranges by colour into named Highlight objects registered through
CSS.highlights; style each group with ::highlight(). Render a separate notes
list with quoted text and accessible remove buttons. Removing a note rebuilds
only its colour group. Prevent pointerdown on palette buttons from clearing the
selection before click. Never inject spans into the article and escape selected
text before displaying it as HTML.`
  ),

  'custom-highlights/highlight-hit-test': fx(
    'Hit-testing semantic text highlight layers',
    `Enhance a Custom Highlight API annotator with hover inspection using
CSS.highlights.highlightsFromPoint(clientX, clientY). For every returned result,
read its ranges and convert each Range to text. Show those labels in a
pointer-events:none tooltip following the pointer; hide it when no registered
highlight is under the coordinate or the pointer leaves the article.

Feature-detect highlightsFromPoint separately because it is newer and less
widely supported than CSS.highlights itself. Multiple highlights may overlap,
so never assume a single result. The tooltip is supplementary: annotations and
their notes list must remain understandable without hover or hit-testing.`
  ),

  'form-ux/content-sized-fields': fx(
    'Auto-growing fields with field-sizing',
    `Build a message composer textarea and compact tag input using
field-sizing:content. The textarea needs a useful min-height and capped
max-height so it grows with content but becomes internally scrollable before it
takes over the page. The short input needs min-width for its empty placeholder
and max-width for long text.

Do not mirror content into a hidden sizing element or run an input resize
handler. Retain resize or ordinary platform sizing as the unsupported fallback.
Keep labels programmatic, do not let the send button shrink, and test long
unbroken strings, placeholder geometry, zoom and mobile keyboard input.`
  ),

  'form-ux/intent-validation': fx(
    'Validation that waits for user intent',
    `Build a form using native required, type=email and type=url constraints.
Style :user-invalid and :user-valid rather than :invalid, because untouched
required fields must not appear wrong on page load. Give every field a stable
error slot linked by aria-describedby so messages do not shift the form.

On blur, map ValidityState flags to specific recovery instructions and mirror
failure with aria-invalid. During input, revalidate only a field already shown
as invalid; do not shout at every keystroke. On submit validate all controls,
focus the first invalid one and publish a summary in aria-live=polite. Native
constraints remain the source of truth even when using novalidate to replace
the browser tooltip presentation.`
  ),

  'form-ux/accessible-file-drop': fx(
    'Accessible drag-and-drop file input',
    `Build an image drop zone backed by a real input type=file with multiple and
accept attributes. Its visible label must activate the native picker; drag and
drop is only an enhancement. Prevent default on dragenter/dragover/drop, show a
dragging state, and pass both dropped FileList and input.files through the same
validation function.

Allow only PNG, JPEG and WebP up to 5MB, deduplicate by name plus size, and list
accepted files with human-readable size and a per-file remove button. Announce
list changes through a polite live region. Do not hide the input with
display:none, do not trust accept as validation, do not read full file contents
unless previews are requested, and revoke any object URLs when removed.`
  ),

  'tabs/automatic-tabs': fx(
    'Automatic tabs with a shared sliding indicator',
    `Build a horizontal tabs widget for preloaded, instant panels. Use buttons
with role=tab inside role=tablist, associated to role=tabpanel elements through
aria-controls and aria-labelledby. Exactly one tab has aria-selected=true and
tabindex=0; the rest have tabindex=-1. Left/Right wrap, Home/End jump, and focus
automatically activates because panel switching has no latency.

Use one absolutely positioned indicator behind every tab. Measure the selected
button's offset and width into custom properties, remeasure with ResizeObserver
and document.fonts.ready, and suppress its transition during first placement.
Hide inactive panels with hidden. Do not animate individual backgrounds, and
leave Up/Down untouched so horizontal tablists do not steal page scrolling.`
  ),

  'tabs/manual-async-tabs': fx(
    'Manual tabs for asynchronous panels',
    `Build tabs whose panels require asynchronous loading. Arrow keys move only
roving focus; Enter or Space commits aria-selected and starts the request. This
manual activation is required because fetching on every focus move makes
keyboard exploration painfully slow.

Show a stable pending state in the newly selected panel, use an incrementing
request token or AbortController so stale responses cannot overwrite a newer
selection, and retain panel dimensions while loading. Click activates directly.
Keep focus on the tab after activation and make the panel itself tabindex=0
when its first meaningful content is not otherwise focusable.`
  ),

  'tabs/url-tabs': fx(
    'URL-addressable tab state',
    `Add deep-linking to a tabset whose panels are meaningful enough to share.
On selection write a stable section key to URLSearchParams and call
history.replaceState when switching is merely local state, or pushState when
each selection should be a Back-button step. On initial load and popstate, map
the parameter back to a known tab and activate it without writing history again.

Ignore unknown values and preserve unrelated query parameters. The tab widget's
ARIA state remains the source of rendered selection; the URL is serialization,
not a second independent state machine. Do not use hash links unless the page
also wants native fragment scrolling and :target behavior.`
  ),

  'data-table/semantic-sort': fx(
    'Semantic table sorting with aria-sort',
    `Build a semantic HTML data table with sortable column headers. Put a real
button inside each sortable <th scope=col>. Only the active header carries
aria-sort=ascending or descending; all others are none. Clicking the same
header toggles direction, while choosing another starts with its sensible
default direction.

Use Intl.Collator for locale-aware strings, numeric subtraction for numbers,
and original row index as a stable tie-breaker. Re-render tbody but never
recreate the header or focused sort button. Keep row headers as <th scope=row>.
A reading-oriented table must not adopt role=grid or make every cell focusable.`
  ),

  'data-table/faceted-filter': fx(
    'Composable search and facet filtering',
    `Build table filtering from one immutable source array. A type=search query
and single-select status chips compose with AND logic; changing either runs the
same filter-sort-render pipeline. Set aria-pressed on facet buttons and announce
the result count through a polite live region without announcing every row.

When no row matches, render one table row whose cell spans every column and
explains that both filters apply. Preserve header geometry and controls rather
than collapsing the table. Search normalized text across only useful fields,
keep sorting active after filtering, and debounce only if work is actually
expensive—instant local arrays do not need artificial latency.`
  ),

  'data-table/roving-data-grid': fx(
    'Spreadsheet-style roving data grid',
    `Build an application-like data grid with role=grid, role=row wrappers,
columnheader cells, and gridcell cells. Exactly one gridcell has tabindex=0.
Arrow keys move within row/column bounds, Home/End move to row edges, and
Control+Home/End move to the first or last cell. Update tabindex and real DOM
focus together, scrolling the destination into view when needed.

Explain the cost: screen readers enter application navigation mode, so every
cell must be reachable and announced. Use this only for spreadsheet-like
interaction; an ordinary report belongs in a semantic <table>. If a cell enters
edit mode, Enter/F2 must suspend grid arrows and Escape must restore them.`
  ),

  'drag-reorder/priority-sort': fx(
    'Stable priority list with placeholder and edge scrolling',
    `Build a production sortable priority list with a dedicated handle and
Pointer Events. On pointerdown capture the pointer on a stable list root, record
the source's rectangle, insert a same-height placeholder, park the real source
outside layout, and render a fixed pointer-events:none ghost at the measured
width. Move only the placeholder while dragging; use elementFromPoint and each
row's vertical midpoint to choose its position. This prevents the source row
from oscillating under the pointer.

When the pointer enters a 60px band at the top or bottom of the scroll viewport,
run requestAnimationFrame edge scrolling with speed proportional to proximity,
and repeat hit testing as content moves. On drop replace the placeholder with
the real node. On pointercancel or Escape restore it at an origin marker. Apply
touch-action:none only to handles and announce the committed position in a live
region. Keep rows unanimated during hit-testing: animated transforms change
visual midpoints and can make a stationary pointer oscillate between two slots.
Provide separate non-drag controls for keyboard and assistive tech.`
  ),

  'drag-reorder/explicit-reorder': fx(
    'Accessible explicit reorder controls',
    `Build an ordered list whose rows expose visible Move up and Move down
buttons instead of requiring a hidden keyboard drag mode. Disable Move up on
the first row and Move down on the last. When activated, move the real DOM node
one position, immediately recalculate boundary states and visible ordinal
numbers, keep focus on the same button, and announce the item's new position
through an aria-live region.

Animate only visual continuity with FLIP: record row boxes, mutate DOM order,
then animate old-minus-new translation back to zero. Respect reduced motion.
Use native buttons with specific accessible names such as “Move Reports up” so
the operation also works with keyboard, touch, switch access, and voice control.
Do not use deprecated aria-grabbed or aria-dropeffect attributes.`
  ),

  'drag-reorder/kanban-board': fx(
    'Persistent cross-column Kanban with undo',
    `Build a three-column Kanban board for Backlog, In progress, and Done. Cards
can be pointer-dragged within and across columns using a fixed ghost and stable
same-size placeholder. Empty columns remain generous drop zones. Keep cards
unanimated while hit-testing so visual and layout geometry cannot diverge.
Commit real DOM order on drop, update column counts, and announce the destination
and position. Give every card an explicit native
select plus Move button as the keyboard, touch, voice, and assistive-technology
alternative to dragging.

Serialize ordered card IDs per status to localStorage after every committed
move and restore only known IDs on load. Before each move, capture a complete
board snapshot. Show a visible Undo action that restores the latest snapshot,
persists it, updates controls and counts, and animates the reversal. Treat
storage failure as non-fatal. Support pointercancel and Escape rollback, use
touch-action:none only on drag handles, and avoid deprecated drag ARIA states.`
  ),
};
