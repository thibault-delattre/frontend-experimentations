import Lenis from 'lenis';
import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';

mountDemoBar();

document.getElementById('skewed').innerHTML = [
  ['velocity', 'pixels per frame, signed. Positive scrolling down.'],
  ['progress', '0 → 1 across the whole document.'],
  ['direction', '-1, 0 or 1. Useful for hiding a header only on the way down.'],
  ['isScrolling', 'true while input is active or the easing is still settling.'],
  ['scroll', 'the eased virtual position — not window.scrollY.'],
  ['limit', 'maximum scrollable distance, recalculated on resize.'],
]
  .map(([k, v]) => `<div><h4><code>${k}</code></h4><p>${v}</p></div>`)
  .join('');

const hud = document.getElementById('hud');
const parallax = [...document.querySelectorAll('[data-depth]')];
const cards = [...document.querySelectorAll('.skewed > div')];
const depthItems = [...document.querySelectorAll('.depth__item')];

// ── Reduced motion: opt out entirely ─────────────────────────────────────────
// Hijacked scrolling is exactly the kind of motion this setting exists for.
if (reducedMotion()) {
  hud.innerHTML = 'reduced motion:<br><b>smooth scroll disabled</b>';
} else {
  const lenis = new Lenis({
    // The easing applied to the virtual position each frame. The default is a
    // heavy exponential; this is a slightly quicker settle.
    lerp: 0.1,
    // Wheel multiplier under 1 makes the page feel heavier.
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    // Leave touch alone: mobile browsers already do this well, and overriding
    // it costs you the address-bar collapse.
    smoothWheel: true,
    syncTouch: false,
  });

  // ── One rAF loop for everything ────────────────────────────────────────────
  // Lenis wants the raw timestamp in milliseconds. Adding a second loop
  // elsewhere is the most common source of stutter in Lenis projects.
  function frame(time) {
    lenis.raf(time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ── Everything downstream reads the same event ─────────────────────────────
  let skew = 0;

  lenis.on('scroll', ({ scroll, velocity, progress, direction }) => {
    // 1 · parallax — translate each layer by its depth × the scroll offset.
    for (const el of parallax) {
      el.style.transform = `translate3d(0, ${(scroll * el.dataset.depth).toFixed(2)}px, 0)`;
    }

    // 2 · velocity skew, eased toward the target so it decays smoothly.
    const target = Math.max(-8, Math.min(8, velocity * 0.35));
    skew += (target - skew) * 0.15;
    const scale = 1 - Math.min(Math.abs(velocity) * 0.0015, 0.06);
    for (const c of cards) {
      c.style.transform = `skewY(${skew.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    }

    // 3 · depth stack — each sticky card recedes as the next one arrives.
    for (const item of depthItems) {
      const r = item.getBoundingClientRect();
      // How far past the sticky point this card has travelled, 0 → 1.
      const past = Math.min(1, Math.max(0, (innerHeight * 0.18 - r.top) / (r.height * 0.9)));
      item.style.transform = `scale(${(1 - past * 0.12).toFixed(3)}) translateY(${(-past * 40).toFixed(1)}px)`;
      item.style.filter = `brightness(${(1 - past * 0.45).toFixed(2)})`;
    }

    hud.innerHTML = `scroll <b>${scroll.toFixed(0)}</b><br>velocity <b>${velocity.toFixed(1)}</b><br>progress <b>${(progress * 100).toFixed(0)}%</b><br>direction <b>${direction}</b>`;
  });

  // ── Programmatic scroll ────────────────────────────────────────────────────
  // Anchors go through Lenis so they share the same easing as manual scrolling.
  for (const btn of document.querySelectorAll('.anchors button')) {
    btn.addEventListener('click', () => {
      const to = btn.dataset.to;
      lenis.scrollTo(to === 'top' ? 0 : to, {
        offset: -80,
        duration: 1.4,
        // A custom ease overrides the lerp for this one journey.
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      });
    });
  }

  // Layout changes (fonts, images, expanding sections) invalidate Lenis's cached
  // document height. Without this, the page stops short of the bottom.
  const ro = new ResizeObserver(() => lenis.resize());
  ro.observe(document.body);
  document.fonts?.ready.then(() => lenis.resize());

  window.__lenis = lenis; // handy in the console
}
