import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';

mountDemoBar();
gsap.registerPlugin(ScrollTrigger);

// Everything below is wrapped in a context so it can be reverted wholesale —
// the pattern you need in any framework with route changes.
const ctx = gsap.context(() => {
  if (reducedMotion()) {
    // Reduced motion is not "no animation" — it is "no large positional
    // motion". Opacity fades are still fine; scrubbed parallax is not.
    gsap.set('.cards article, .pin-step, .stat', { clearProps: 'all', opacity: 1 });
    return;
  }

  // ── 01 · staggered reveal ─────────────────────────────────────────────────
  document.getElementById('cards').innerHTML = [
    ['play', 'runs the animation forwards when the trigger is entered'],
    ['pause', 'stops it where it is'],
    ['resume', 'continues from the current position'],
    ['reverse', 'runs it backwards — the usual choice for onLeaveBack'],
    ['restart', 'jumps to 0 and plays'],
    ['none', 'does nothing at this boundary'],
  ]
    .map(([k, v]) => `<article><h3><code>${k}</code></h3><p>${v}</p></article>`)
    .join('');

  gsap.from('.cards article', {
    y: 60,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
    // One tween with a stagger, not six tweens — GSAP interpolates the offset.
    stagger: 0.08,
    scrollTrigger: {
      trigger: '.cards',
      start: 'top 80%',
      // enter, leave, enterBack, leaveBack
      toggleActions: 'play none none reverse',
    },
  });

  // ── 02 · pinned, scrubbed timeline ────────────────────────────────────────
  const pinTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#pin',
      start: 'top top',
      end: '+=2600',
      pin: true,
      // A number rather than `true` adds catch-up smoothing, in seconds.
      scrub: 0.8,
      // Snap to the timeline's own progress steps when scrolling stops.
      snap: { snapTo: [0, 0.33, 0.66, 1], duration: 0.3, delay: 0.08, ease: 'power2.inOut' },
    },
  });

  const steps = gsap.utils.toArray('.pin-step');
  gsap.set(steps, { opacity: 0, y: 20 });

  pinTl
    .to('#pinArt', { rotate: 180, borderRadius: '8%', scale: 1.25, ease: 'none' }, 0)
    .to('#pinArt', { rotate: 360, borderRadius: '50%', scale: 0.85, ease: 'none' }, 0.5);

  // Cross-fade the captions across four equal quarters of the same timeline.
  steps.forEach((el, i) => {
    const at = i * 0.25;
    pinTl.to(el, { opacity: 1, y: 0, duration: 0.08 }, at);
    if (i < steps.length - 1) pinTl.to(el, { opacity: 0, y: -20, duration: 0.08 }, at + 0.2);
  });

  // ── 03 · horizontal scroll ────────────────────────────────────────────────
  const track = document.getElementById('hTrack');
  const distance = () => track.scrollWidth - innerWidth;

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#hOuter',
      start: 'top top',
      // Pin for exactly as far as the track has to travel, so the horizontal
      // motion is 1:1 with the vertical scroll.
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      // Functions are re-evaluated on refresh, which is what makes this responsive.
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // ── 04 · counters + line reveal ───────────────────────────────────────────
  const STATS = [
    [16.6, 'ms per frame at 60fps', 1],
    [250, 'k particles on the GPU', 0],
    [0, 'kb for the CSS-only demos', 0],
    [98, '% of users on evergreen browsers', 0],
  ];
  document.getElementById('stats').innerHTML = STATS.map(
    ([, label]) => `<div class="stat"><b>0</b><span>${label}</span></div>`
  ).join('');

  gsap.utils.toArray('.stat').forEach((el, i) => {
    const [target, , digits] = STATS[i];
    const value = { n: 0 };
    gsap.to(value, {
      n: target,
      duration: 1.6,
      ease: 'power2.out',
      // Tween a plain object and write the DOM in onUpdate — the standard way
      // to animate anything that is not a CSS property.
      onUpdate: () => (el.querySelector('b').textContent = value.n.toFixed(digits)),
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Per-word reveal from behind a mask.
  const headline = document.getElementById('headline');
  const text = headline.textContent.trim();
  headline.setAttribute('aria-label', text);
  headline.innerHTML = text
    .split(' ')
    .map((w) => `<span class="split-line" aria-hidden="true"><span>${w}</span></span> `)
    .join('');

  gsap.from('#headline .split-line > span', {
    yPercent: 110,
    duration: 0.8,
    ease: 'power4.out',
    stagger: 0.06,
    scrollTrigger: { trigger: headline, start: 'top 85%' },
  });

  // ── 05 · parallax ─────────────────────────────────────────────────────────
  gsap.utils.toArray('.par__l').forEach((layer) => {
    gsap.fromTo(
      layer,
      { yPercent: -12 * layer.dataset.depth * 10 },
      {
        yPercent: 12 * layer.dataset.depth * 10,
        ease: 'none',
        scrollTrigger: { trigger: '#par', start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });

  // ── Page progress ring ────────────────────────────────────────────────────
  gsap.to('#ring', {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });
});

// Fonts change metrics after first paint, which invalidates every start/end
// position ScrollTrigger measured. This one line prevents most "it works until
// I reload halfway down the page" bugs.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());

// In a framework you would call this on unmount: ctx.revert();
window.__gsapCtx = ctx;
