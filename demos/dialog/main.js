import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

for (const trigger of document.querySelectorAll('[data-open]')) {
  trigger.addEventListener('click', () => document.getElementById(trigger.dataset.open).showModal());
}

// A backdrop click has the dialog itself as the target. Children do not.
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    if (dialog.requestClose) dialog.requestClose();
    else dialog.close();
  });
}

const sheet = document.getElementById('sheet');
const handle = sheet.querySelector('.handle');
let startY = 0;
let lastY = 0;
let lastTime = 0;
let velocity = 0;

handle.addEventListener('pointerdown', (event) => {
  if (reducedMotion()) return;
  handle.setPointerCapture(event.pointerId);
  sheet.classList.add('dragging');
  startY = lastY = event.clientY;
  lastTime = performance.now();
});
handle.addEventListener('pointermove', (event) => {
  if (!handle.hasPointerCapture(event.pointerId)) return;
  const now = performance.now();
  velocity = (event.clientY - lastY) / Math.max(1, now - lastTime);
  lastY = event.clientY;
  lastTime = now;
  sheet.style.setProperty('--drag', `${Math.max(0, event.clientY - startY)}px`);
});
handle.addEventListener('pointerup', (event) => {
  if (!handle.hasPointerCapture(event.pointerId)) return;
  handle.releasePointerCapture(event.pointerId);
  sheet.classList.remove('dragging');
  const distance = event.clientY - startY;
  sheet.style.removeProperty('--drag');
  if (distance > sheet.offsetHeight * 0.25 || velocity > 0.7) sheet.close();
});
