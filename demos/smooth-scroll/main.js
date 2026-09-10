import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';

mountDemoBar();
gsap.registerPlugin(ScrollTrigger);

const telemetry = document.getElementById('telemetry');
telemetry.innerHTML = [
  ['velocity', 'Signed eased speed becomes an input for motion, blur, skew, or timeScale.'],
  ['direction', 'A stable −1 or 1 can reveal navigation on intent instead of raw wheel noise.'],
  ['progress', 'One normalized 0 → 1 value drives page indicators without another listener.'],
  ['scroll', 'Every downstream effect reads the same eased position and the same frame.'],
].map(([key, value]) => `<article><code>${key}</code><p>${value}</p></article>`).join('');

const scrollNav = document.getElementById('scrollNav');
const status = document.getElementById('scrollStatus');
const parallaxLayers = [...document.querySelectorAll('[data-depth]')];
const telemetryCards = [...telemetry.children];
const reduce = reducedMotion();
let lenis = null;
let sequenceProgress = 0;

function announce(message) {
  status.textContent = '';
  requestAnimationFrame(() => (status.textContent = message));
}

/* Canvas sequence: procedural here, identical playhead architecture to images. */
const canvas = document.getElementById('sequenceCanvas');
const context = canvas.getContext('2d');
const frameLabel = document.getElementById('sequenceFrame');
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSequence(sequenceProgress);
}
function drawSequence(progress) {
  sequenceProgress = Math.max(0, Math.min(1, progress));
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);
  const background = context.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, Math.max(width, height) * .7);
  background.addColorStop(0, `hsl(${245 + sequenceProgress * 80} 55% 18%)`);
  background.addColorStop(1, '#090b12');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const radius = Math.min(width, height) * (.15 + sequenceProgress * .14);
  const centerX = width * (.32 + sequenceProgress * .36);
  const centerY = height * (.52 + Math.sin(sequenceProgress * Math.PI * 2) * .08);
  const orb = context.createRadialGradient(centerX - radius * .3, centerY - radius * .35, radius * .05, centerX, centerY, radius);
  orb.addColorStop(0, `hsl(${42 + sequenceProgress * 110} 95% 78%)`);
  orb.addColorStop(.48, `hsl(${292 - sequenceProgress * 90} 82% 56%)`);
  orb.addColorStop(1, 'rgb(16 17 35 / 0)');
  context.fillStyle = orb;
  context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2); context.fill();

  context.save(); context.translate(centerX, centerY); context.rotate(sequenceProgress * Math.PI * 3);
  for (let ring = 0; ring < 5; ring += 1) {
    context.strokeStyle = `hsl(${190 + ring * 24} 90% 72% / ${.5 - ring * .065})`;
    context.lineWidth = 1.2;
    context.beginPath(); context.ellipse(0, 0, radius * (1.2 + ring * .2), radius * (.32 + ring * .09), ring * .38, 0, Math.PI * 2); context.stroke();
  }
  context.restore();
  const frame = Math.round(sequenceProgress * 119) + 1;
  frameLabel.textContent = `${String(frame).padStart(3, '0')} / 120`;
}
new ResizeObserver(resizeCanvas).observe(canvas);

function scrollToTarget(target) {
  const destination = target === 'top' ? 0 : target;
  if (lenis) {
    lenis.scrollTo(destination, { offset: -92, duration: 1.25, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)) });
  } else if (destination === 0) {
    scrollTo({ top: 0, behavior: 'auto' });
  } else {
    document.querySelector(destination)?.scrollIntoView();
  }
  announce(`Scrolling to ${target === 'top' ? 'top' : document.querySelector(target)?.dataset.chapter ?? target}`);
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-to]');
  if (button) scrollToTarget(button.dataset.to);
});

if (reduce) {
  drawSequence(.5);
  scrollNav.style.setProperty('--page-progress', '0');
} else {
  lenis = new Lenis({ lerp: .1, wheelMultiplier: 1, touchMultiplier: 1.5, smoothWheel: true, syncTouch: false });

  // Official Lenis + GSAP bridge: one ticker, milliseconds into Lenis, then
  // ScrollTrigger updates from Lenis's eased scroll event.
  lenis.on('scroll', ScrollTrigger.update);
  const updateLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(updateLenis);
  gsap.ticker.lagSmoothing(0);

  const marqueeRows = gsap.utils.toArray('.marquee-row');
  const marqueeTweens = [
    gsap.to(marqueeRows[0], { xPercent: -50, duration: 18, repeat: -1, ease: 'none' }),
    gsap.fromTo(marqueeRows[1], { xPercent: -50 }, { xPercent: 0, duration: 21, repeat: -1, ease: 'none' }),
  ];
  const setMarqueeSpeed = marqueeTweens.map((tween) => gsap.quickTo(tween, 'timeScale', { duration: .55, ease: 'power2.out' }));
  let skew = 0;

  lenis.on('scroll', ({ scroll, velocity, progress, direction }) => {
    parallaxLayers.forEach((layer) => {
      layer.style.transform = `translate3d(0, ${(scroll * Number(layer.dataset.depth)).toFixed(2)}px, 0)`;
    });
    const targetSkew = gsap.utils.clamp(-7, 7, velocity * .32);
    skew += (targetSkew - skew) * .18;
    const scale = 1 - Math.min(Math.abs(velocity) * .0012, .045);
    telemetryCards.forEach((card) => (card.style.transform = `skewY(${skew.toFixed(2)}deg) scale(${scale.toFixed(3)})`));
    const marqueeSpeed = gsap.utils.clamp(.65, 3.8, .65 + Math.abs(velocity) * .08);
    setMarqueeSpeed.forEach((setSpeed) => setSpeed(marqueeSpeed));
    scrollNav.classList.toggle('is-hidden', direction === 1 && velocity > .45);
    if (direction === -1 || Math.abs(velocity) < .15) scrollNav.classList.remove('is-hidden');
    scrollNav.style.setProperty('--page-progress', progress.toFixed(4));
  });

  const animationContext = gsap.context(() => {
    gsap.utils.toArray('.parallax-card').forEach((card, index) => {
      const art = card.querySelector('.media-art');
      const frame = card.querySelector('.media-window');
      gsap.fromTo(art, { yPercent: -8 - index * 2 }, { yPercent: 8 + index * 2, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: .7 } });
      gsap.fromTo(frame, { clipPath: 'inset(10% 0 10% 0 round 16px)' }, { clipPath: 'inset(0% 0 0% 0 round 16px)', ease: 'none', scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 48%', scrub: true } });
    });

    ScrollTrigger.create({ trigger: '.sequence', start: 'top top+=64', end: 'bottom bottom', scrub: true, onUpdate: (self) => drawSequence(self.progress) });

    const depthCards = gsap.utils.toArray('.depth-card');
    depthCards.slice(0, -1).forEach((card, index) => {
      gsap.to(card, { scale: .94 - index * .012, filter: 'brightness(.72) saturate(.82)', ease: 'none', scrollTrigger: { trigger: depthCards[index + 1], start: 'top bottom', end: 'top 18%', scrub: .45 } });
    });

    gsap.utils.toArray('[data-chapter]').forEach((chapter) => {
      ScrollTrigger.create({ trigger: chapter, start: 'top center', end: 'bottom center', onToggle: (self) => { if (self.isActive) document.getElementById('activeChapter').textContent = chapter.dataset.chapter; } });
    });
  });

  const resizeObserver = new ResizeObserver(() => lenis.resize());
  resizeObserver.observe(document.body);
  document.fonts?.ready.then(() => { lenis.resize(); ScrollTrigger.refresh(); });
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  window.__smoothScrollCleanup = () => {
    animationContext.revert(); resizeObserver.disconnect(); gsap.ticker.remove(updateLenis); lenis.destroy();
  };
  window.__lenis = lenis;
}
