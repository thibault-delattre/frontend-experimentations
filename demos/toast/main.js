import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const TYPES = {
  saved: ['✓', 'Changes saved', 'Your experiment is up to date.'],
  synced: ['↻', 'Project synced', 'All local changes reached the remote.'],
  error: ['!', 'Could not publish', 'Check your connection and try again.'],
  action: ['↶', 'Experiment archived', 'Undo is available while this message remains.'],
  swipe: ['↔', 'Swipe me away', 'Drag horizontally or use the close button.'],
};
const stack = document.getElementById('toasts');

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-toast]');
  if (trigger) addToast(trigger.dataset.toast);
});

function addToast(kind) {
  const existing = stack.querySelector(`[data-kind="${kind}"]`);
  if (existing && kind !== 'swipe') { existing.animate([{ scale: 1 }, { scale: 1.03 }, { scale: 1 }], 220); return; }
  const [icon, title, message] = TYPES[kind];
  const toast = document.createElement('article');
  toast.className = 'toast'; toast.dataset.kind = kind; toast.tabIndex = 0;
  toast.innerHTML = `<span class="toast__icon">${icon}</span><div><strong>${title}</strong><p>${message}</p>${kind === 'action' ? '<button data-undo>Undo</button>' : ''}</div><button data-close aria-label="Dismiss notification">✕</button>`;
  stack.prepend(toast);
  while (stack.children.length > 4) removeToast(stack.lastElementChild);
  document.getElementById(kind === 'error' ? 'assertive' : 'polite').textContent = `${title}. ${message}`;

  let remaining = kind === 'error' || kind === 'action' ? Infinity : 5000;
  let started = performance.now();
  let timer = Number.isFinite(remaining) ? setTimeout(() => removeToast(toast), remaining) : 0;
  toast.addEventListener('pointerenter', pause); toast.addEventListener('focusin', pause);
  toast.addEventListener('pointerleave', resume); toast.addEventListener('focusout', (e) => { if (!toast.contains(e.relatedTarget)) resume(); });
  toast.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) removeToast(toast); if (e.target.closest('[data-undo]')) { document.getElementById('polite').textContent = 'Archive undone'; removeToast(toast); } });
  function pause() { if (!timer) return; clearTimeout(timer); timer = 0; remaining -= performance.now() - started; }
  function resume() { if (!Number.isFinite(remaining) || timer) return; started = performance.now(); timer = setTimeout(() => removeToast(toast), remaining); }
  attachSwipe(toast);
}

function removeToast(toast) { if (!toast || toast.classList.contains('removing')) return; toast.classList.add('removing'); toast.addEventListener('animationend', () => toast.remove(), { once:true }); }

function attachSwipe(toast) {
  let start = 0, last = 0, time = 0, velocity = 0;
  toast.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; toast.setPointerCapture(e.pointerId); start = last = e.clientX; time = performance.now(); });
  toast.addEventListener('pointermove', e => { if (!toast.hasPointerCapture(e.pointerId)) return; const now=performance.now(); velocity=(e.clientX-last)/Math.max(1,now-time); last=e.clientX;time=now;toast.style.setProperty('--swipe',`${e.clientX-start}px`); });
  toast.addEventListener('pointerup', e => { if (!toast.hasPointerCapture(e.pointerId)) return; const dx=e.clientX-start; toast.releasePointerCapture(e.pointerId); if(Math.abs(dx)>toast.offsetWidth*.35||Math.abs(velocity)>.75) removeToast(toast); else toast.style.removeProperty('--swipe'); });
}
