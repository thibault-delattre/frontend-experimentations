import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

// --- 02 · pointer position for the spotlight mask ----------------------------
for (const el of document.querySelectorAll('[data-pointer]')) {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  el.addEventListener('pointerleave', () => el.style.setProperty('--mx', '-999px'));
}

// --- 05 · split into words, each carrying its index ---------------------------
for (const el of document.querySelectorAll('[data-words]')) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text
    .split(/\s+/)
    .map((w, i) => `<span aria-hidden="true" style="--i:${i}">${w}</span>`)
    .join(' ');
}

// --- 08 · scramble ------------------------------------------------------------
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';

/**
 * Resolves each character from noise to its final glyph, left to right.
 * Each character gets its own start and end frame, so the resolve front
 * sweeps across the word instead of every letter settling at once.
 */
function scramble(el, text, frames = 42) {
  const queue = [...text].map((to, i) => ({
    to,
    start: Math.floor(i * 1.4 + Math.random() * 8),
    end: Math.floor(i * 1.4 + 12 + Math.random() * 14),
  }));

  let frame = 0;
  el.__stop?.();
  let raf;
  const tick = () => {
    let out = '';
    let done = 0;
    for (const q of queue) {
      if (frame >= q.end) {
        out += q.to;
        done++;
      } else if (frame >= q.start) {
        // 28% chance per frame of picking a new noise glyph — resampling every
        // frame reads as static rather than as scrambling.
        if (!q.char || Math.random() < 0.28) q.char = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        out += `<span style="color: var(--accent-2)">${q.char}</span>`;
      } else {
        out += ' ';
      }
    }
    el.innerHTML = out;
    if (done === queue.length || frame > frames + text.length * 2) return;
    frame++;
    raf = requestAnimationFrame(tick);
  };
  tick();
  el.__stop = () => cancelAnimationFrame(raf);
}

for (const el of document.querySelectorAll('[data-scramble]')) {
  const text = el.dataset.scramble;
  el.setAttribute('aria-label', text);
  const run = () => !reducedMotion() && scramble(el, text);
  el.addEventListener('pointerenter', run);
  // Run once when it first scrolls into view.
  new IntersectionObserver(
    ([e], obs) => {
      if (!e.isIntersecting) return;
      run();
      obs.disconnect();
    },
    { threshold: 0.6 }
  ).observe(el);
}
