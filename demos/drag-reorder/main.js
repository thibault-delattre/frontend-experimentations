import { mountDemoBar, reducedMotion } from '../../src/lib/chrome.js';

mountDemoBar();

const status = document.getElementById('dragStatus');
const announce = (message) => {
  status.textContent = '';
  requestAnimationFrame(() => (status.textContent = message));
};

function boxes(elements) {
  return new Map([...elements].map((element) => [element, element.getBoundingClientRect()]));
}

function playFlip(elements, before) {
  if (reducedMotion()) return;
  for (const element of elements) {
    const first = before.get(element);
    if (!first) continue;
    const last = element.getBoundingClientRect();
    const x = first.left - last.left;
    const y = first.top - last.top;
    if (!x && !y) continue;
    element.animate(
      [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }],
      { duration: 280, easing: 'cubic-bezier(.16, 1, .3, 1)' },
    );
  }
}

function labelOf(item) {
  return item.querySelector('strong')?.textContent.trim() ?? 'Item';
}

/**
 * Pointer-only enhancement. The DOM source is parked during the gesture and a
 * placeholder owns layout, so hit testing cannot oscillate around a moving row.
 * A marker preserves the exact origin for pointercancel/Escape.
 */
function makePointerSorter({ root, itemSelector, zoneSelector, scrollElement, onStart, onDrop }) {
  let drag = null;
  const sortableItems = () => root.querySelectorAll(`${itemSelector}:not(.drag-ghost)`);

  function moveGhost(event) {
    drag.lastPoint = { x: event.clientX, y: event.clientY };
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`;
    drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
  }

  function placeSlot(x, y) {
    const hit = document.elementFromPoint(x, y);
    // Once the slot reaches the pointer it becomes the hit target. Treat that
    // as a stable destination; interpreting it as empty list space would append
    // it to the end, then the next pointermove would pull it back again.
    if (hit === drag.slot || drag.slot.contains(hit)) return;
    const target = hit?.closest(itemSelector);
    const zone = target?.parentElement?.matches(zoneSelector)
      ? target.parentElement
      : hit?.closest(zoneSelector);
    if (!zone || !root.contains(zone)) return;

    let reference = null;
    if (target && target !== drag.source && zone.contains(target)) {
      const rect = target.getBoundingClientRect();
      reference = y < rect.top + rect.height / 2 ? target : target.nextElementSibling;
    }
    if (reference === drag.slot || (!reference && drag.slot === zone.lastElementChild)) return;

    // Keep hit-test geometry synchronous with DOM geometry. Animating the rows
    // here makes their visual midpoints drift beneath a stationary pointer,
    // which can send the placeholder back and forth between two positions.
    zone.insertBefore(drag.slot, reference);
  }

  function autoScroll() {
    if (!drag) return;
    if (scrollElement) {
      const rect = scrollElement.getBoundingClientRect();
      const edge = Math.min(62, rect.height * 0.22);
      const topStrength = Math.max(0, (rect.top + edge - drag.lastPoint.y) / edge);
      const bottomStrength = Math.max(0, (drag.lastPoint.y - (rect.bottom - edge)) / edge);
      const velocity = (bottomStrength - topStrength) * 11;
      if (velocity && drag.lastPoint.y >= rect.top && drag.lastPoint.y <= rect.bottom) {
        const previousScrollTop = scrollElement.scrollTop;
        scrollElement.scrollTop += velocity;
        if (scrollElement.scrollTop !== previousScrollTop) {
          placeSlot(drag.lastPoint.x, drag.lastPoint.y);
        }
      }
    }
    drag.frame = requestAnimationFrame(autoScroll);
  }

  function finish(commit) {
    if (!drag) return;
    const current = drag;
    drag = null;
    cancelAnimationFrame(current.frame);
    document.body.classList.remove('is-dragging');
    current.ghost.remove();

    if (commit) {
      current.slot.replaceWith(current.source);
      current.origin.remove();
      current.source.classList.remove('drag-source');
      onDrop?.(current.source, current.context);
    } else {
      current.origin.replaceWith(current.source);
      current.slot.remove();
      current.source.classList.remove('drag-source');
      announce(`Cancelled moving ${labelOf(current.source)}`);
    }
  }

  root.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.handle');
    const source = handle?.closest(itemSelector);
    if (!source || !root.contains(source) || (event.button !== 0 && event.pointerType === 'mouse')) return;

    event.preventDefault();
    sortableItems().forEach((item) => item.getAnimations().forEach((animation) => animation.finish()));
    const rect = source.getBoundingClientRect();
    const context = onStart?.(source);
    const ghost = source.cloneNode(true);
    const slot = document.createElement(source.tagName.toLowerCase());
    const origin = document.createComment('drag-origin');

    ghost.classList.add('drag-ghost');
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    ghost.querySelectorAll('button, select, input, a').forEach((element) => (element.tabIndex = -1));
    ghost.style.setProperty('--ghost-width', `${rect.width}px`);
    ghost.style.setProperty('--ghost-height', `${rect.height}px`);
    slot.className = 'drop-slot';
    slot.setAttribute('aria-hidden', 'true');
    slot.style.setProperty('--slot-height', `${rect.height}px`);

    source.before(origin, slot);
    source.classList.add('drag-source');
    source.remove();
    document.body.append(ghost);
    root.setPointerCapture(event.pointerId);

    drag = {
      pointerId: event.pointerId,
      source,
      ghost,
      slot,
      origin,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      lastPoint: { x: event.clientX, y: event.clientY },
      context,
      frame: 0,
    };
    document.body.classList.add('is-dragging');
    moveGhost(event);
    drag.frame = requestAnimationFrame(autoScroll);
  });

  root.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    moveGhost(event);
    placeSlot(event.clientX, event.clientY);
  });
  root.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    finish(true);
  });
  root.addEventListener('pointercancel', () => finish(false));
  root.addEventListener('lostpointercapture', () => finish(false));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finish(false);
    }
  });
}

const priorityList = document.getElementById('priorityList');
const updatePriorityNumbers = () => {
  [...priorityList.children].forEach((item, index) => {
    if (item.matches('.reorder-item')) item.querySelector('.position').textContent = `${index + 1}`.padStart(2, '0');
  });
};

makePointerSorter({
  root: priorityList,
  itemSelector: '.reorder-item',
  zoneSelector: '[data-dropzone]',
  scrollElement: document.querySelector('.priority-scroll'),
  onDrop(item) {
    updatePriorityNumbers();
    const position = [...priorityList.children].indexOf(item) + 1;
    announce(`Moved ${labelOf(item)} to priority ${position} of ${priorityList.children.length}`);
  },
});
updatePriorityNumbers();

const actionList = document.getElementById('actionList');
function updateMoveActions() {
  [...actionList.children].forEach((item, index, items) => {
    item.querySelector('[data-move="up"]').disabled = index === 0;
    item.querySelector('[data-move="down"]').disabled = index === items.length - 1;
    item.querySelector('.position').textContent = `${index + 1}`.padStart(2, '0');
  });
}

actionList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-move]');
  if (!button || button.disabled) return;
  const item = button.closest('.reorder-item');
  const before = boxes(actionList.children);
  if (button.dataset.move === 'up') actionList.insertBefore(item, item.previousElementSibling);
  else item.nextElementSibling.after(item);
  updateMoveActions();
  playFlip(actionList.children, before);
  const position = [...actionList.children].indexOf(item) + 1;
  announce(`Moved ${labelOf(item)} to position ${position} of ${actionList.children.length}`);
});
updateMoveActions();

const board = document.getElementById('kanbanBoard');
const undoBar = document.getElementById('undoBar');
const undoMessage = document.getElementById('undoMessage');
const storageKey = 'frontend-experimentations:kanban:v1';
const statusNames = { backlog: 'Backlog', progress: 'In progress', done: 'Done' };
let undoSnapshot = null;

function boardSnapshot() {
  return Object.fromEntries(
    [...board.querySelectorAll('.kanban-list')].map((list) => [
      list.dataset.status,
      [...list.querySelectorAll('.kanban-card')].map((card) => card.dataset.id),
    ]),
  );
}

function restoreBoard(snapshot, animate = true) {
  const before = animate ? boxes(board.querySelectorAll('.kanban-card')) : new Map();
  for (const [statusName, ids] of Object.entries(snapshot ?? {})) {
    const list = board.querySelector(`[data-status="${statusName}"]`);
    if (!list || !Array.isArray(ids)) continue;
    ids.forEach((id) => {
      const card = board.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (card) list.append(card);
    });
  }
  updateBoard();
  if (animate) playFlip(board.querySelectorAll('.kanban-card'), before);
}

function saveBoard() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(boardSnapshot()));
  } catch {
    // Storage may be blocked; the board remains usable for this session.
  }
}

function updateBoard() {
  board.querySelectorAll('.kanban-list').forEach((list) => {
    list.closest('.kanban-column').querySelector('.column-count').textContent = list.querySelectorAll('.kanban-card').length;
    list.querySelectorAll('.kanban-card').forEach((card) => {
      card.querySelector('select').value = list.dataset.status;
    });
  });
}

function offerUndo(snapshot, message) {
  undoSnapshot = snapshot;
  undoMessage.textContent = message;
  undoBar.hidden = false;
}

function buildCardControls() {
  board.querySelectorAll('.kanban-card').forEach((card) => {
    const label = labelOf(card);
    const controls = card.querySelector('.card-move');
    controls.innerHTML = `<label class="sr-only" for="move-${card.dataset.id}">Move ${label} to</label>
      <select id="move-${card.dataset.id}">
        <option value="backlog">Backlog</option>
        <option value="progress">In progress</option>
        <option value="done">Done</option>
      </select>
      <button class="action" type="button" data-move-card>Move</button>`;
  });
}

buildCardControls();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved === 'object') restoreBoard(saved, false);
} catch {
  // Ignore malformed or unavailable storage and keep the authored board.
}
updateBoard();

board.addEventListener('click', (event) => {
  const button = event.target.closest('[data-move-card]');
  if (!button) return;
  const card = button.closest('.kanban-card');
  const destination = board.querySelector(`[data-status="${card.querySelector('select').value}"]`);
  if (card.parentElement === destination) {
    announce(`${labelOf(card)} is already in ${statusNames[destination.dataset.status]}`);
    return;
  }
  const snapshot = boardSnapshot();
  const before = boxes(board.querySelectorAll('.kanban-card'));
  destination.append(card);
  updateBoard();
  playFlip(board.querySelectorAll('.kanban-card'), before);
  saveBoard();
  offerUndo(snapshot, `Moved “${labelOf(card)}”`);
  announce(`Moved ${labelOf(card)} to ${statusNames[destination.dataset.status]}`);
});

makePointerSorter({
  root: board,
  itemSelector: '.kanban-card',
  zoneSelector: '.kanban-list',
  onStart: () => boardSnapshot(),
  onDrop(card, snapshot) {
    updateBoard();
    const changed = JSON.stringify(snapshot) !== JSON.stringify(boardSnapshot());
    if (changed) {
      saveBoard();
      offerUndo(snapshot, `Moved “${labelOf(card)}”`);
    }
    const list = card.closest('.kanban-list');
    const position = [...list.querySelectorAll('.kanban-card')].indexOf(card) + 1;
    announce(`Moved ${labelOf(card)} to ${statusNames[list.dataset.status]}, position ${position}`);
  },
});

document.getElementById('undoMove').addEventListener('click', () => {
  if (!undoSnapshot) return;
  const snapshot = undoSnapshot;
  undoSnapshot = null;
  restoreBoard(snapshot);
  saveBoard();
  undoBar.hidden = true;
  announce('Last board move undone');
});
