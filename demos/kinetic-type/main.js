import { mountDemoBar, raf } from '../../src/lib/chrome.js';
mountDemoBar();

/**
 * Splits an element's text into per-character spans carrying an index.
 * Accessibility: the visible spans are hidden from assistive tech and the
 * original string is restored as a label, so the heading still reads as
 * "KINETIC MOTION" and not as fourteen separate letters.
 */
function splitChars(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars = [...text].map((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.setProperty('--i', i);
    span.setAttribute('aria-hidden', 'true');
    el.append(span);
    return span;
  });
  return chars;
}

for (const el of document.querySelectorAll('[data-split]')) {
  const chars = splitChars(el);
  if (el.hasAttribute('data-proximity')) attachProximity(el, chars);
}

/**
 * Writes a normalised distance (--d, 0 = under the cursor, 1 = far) onto every
 * glyph. Rects are measured once and re-measured only on resize — measuring
 * inside pointermove is what makes this pattern janky in most implementations.
 */
function attachProximity(el, chars) {
  let centres = [];
  const measure = () => {
    const base = el.getBoundingClientRect();
    centres = chars.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    });
  };
  measure();
  new ResizeObserver(measure).observe(el);
  addEventListener('load', measure); // web font swap changes metrics

  const RADIUS = 260;
  el.addEventListener('pointermove', (e) => {
    const base = el.getBoundingClientRect();
    const px = e.clientX - base.left;
    const py = e.clientY - base.top;
    centres.forEach((c, i) => {
      const d = Math.hypot(c.x - px, c.y - py) / RADIUS;
      chars[i].style.setProperty('--d', Math.min(d, 1).toFixed(3));
    });
  });
  el.addEventListener('pointerleave', () => {
    for (const c of chars) c.style.setProperty('--d', 1);
  });
}

// --- Marquee -----------------------------------------------------------------
const track = document.getElementById('track');
const WORDS = ['VARIABLE', 'KINETIC', 'AXIS', 'STAGGER', 'VELOCITY', 'GLYPH'];
// Doubled so the -50% keyframe loops seamlessly.
track.innerHTML = [...WORDS, ...WORDS]
  .map((w) => `<span>${w}</span><span>·</span>`)
  .join('');

// Scroll velocity → skew, eased back to rest. Reading scrollY in rAF rather
// than in a scroll handler keeps this off the scroll thread.
let lastY = scrollY;
let skew = 0;
raf(() => {
  const delta = scrollY - lastY;
  lastY = scrollY;
  const target = Math.max(-12, Math.min(12, delta * 0.35));
  skew += (target - skew) * 0.12;
  track.style.setProperty('--skew', skew.toFixed(2));
});
