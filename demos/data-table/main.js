import { mountDemoBar } from '../../src/lib/chrome.js';

mountDemoBar();

const liveRegion = document.getElementById('tableStatus');
function announce(message) {
  liveRegion.textContent = '';
  requestAnimationFrame(() => (liveRegion.textContent = message));
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const compare = (a, b, key) =>
  typeof a[key] === 'number' ? a[key] - b[key] : collator.compare(a[key], b[key]);

/* Semantic sorting, selection, density, and contextual bulk actions. */
const PROJECTS = [
  ['p-104', 'Anchor Lab', 'live', 'Ada', 96, 8],
  ['p-105', 'Shader Notes', 'draft', 'Lin', 82, 33],
  ['p-106', 'Motion Tokens', 'live', 'Mara', 91, 19],
  ['p-107', 'Form Patterns', 'live', 'Sami', 88, 4],
  ['p-108', 'Canvas Trails', 'draft', 'Ivo', 74, 51],
  ['p-109', 'Colour Audit', 'live', 'Noa', 98, 2],
  ['p-110', 'Navigation Study', 'draft', 'Mara', 86, 12],
  ['p-111', 'Type Specimen', 'live', 'Ada', 93, 27],
].map(([id, name, status, owner, score, updated], index) => ({
  id, name, status, owner, score, updated, index,
}));

const projectShell = document.getElementById('projectTable');
const projectBody = document.getElementById('projectRows');
const selectAll = document.getElementById('selectAll');
const selected = new Set();
let projectRows = [...PROJECTS];
let projectSort = { key: 'updated', direction: 'ascending' };

function updateSelection() {
  const visibleIds = projectRows.map((row) => row.id);
  const visibleSelected = visibleIds.filter((id) => selected.has(id)).length;
  selectAll.checked = visibleSelected === visibleIds.length && visibleIds.length > 0;
  selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visibleIds.length;
  document.getElementById('bulkBar').hidden = selected.size === 0;
  document.getElementById('selectionCount').textContent = `${selected.size} selected`;
}

function renderProjects() {
  const direction = projectSort.direction === 'ascending' ? 1 : -1;
  projectRows.sort((a, b) => direction * (compare(a, b, projectSort.key) || a.index - b.index));
  projectBody.innerHTML = projectRows.map((row) => `<tr>
    <td><input type="checkbox" data-select="${row.id}" aria-label="Select ${row.name}" ${selected.has(row.id) ? 'checked' : ''}></td>
    <th scope="row">${row.name}</th>
    <td><span class="status-pill" style="--status:${row.status === 'live' ? 'var(--accent-2)' : 'var(--fg-faint)'}">${row.status}</span></td>
    <td>${row.owner}</td><td>${row.score}</td><td>${row.updated}d ago</td>
  </tr>`).join('');
  document.getElementById('projectCount').textContent = `${projectRows.length} rows`;
  updateSelection();
}

projectShell.querySelector('thead').addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort]');
  if (!button) return;
  const sameColumn = projectSort.key === button.dataset.sort;
  projectSort = {
    key: button.dataset.sort,
    direction: sameColumn && projectSort.direction === 'ascending' ? 'descending' : 'ascending',
  };
  projectShell.querySelectorAll('th[aria-sort]').forEach((header) => {
    header.setAttribute('aria-sort', header.contains(button) ? projectSort.direction : 'none');
  });
  renderProjects();
});

projectBody.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-select]');
  if (!checkbox) return;
  if (checkbox.checked) selected.add(checkbox.dataset.select);
  else selected.delete(checkbox.dataset.select);
  updateSelection();
});

selectAll.addEventListener('change', () => {
  projectRows.forEach((row) => selectAll.checked ? selected.add(row.id) : selected.delete(row.id));
  renderProjects();
  announce(selectAll.checked ? `Selected all ${projectRows.length} projects` : 'Selection cleared');
});

document.getElementById('density').addEventListener('click', (event) => {
  const dense = projectShell.classList.toggle('dense');
  event.currentTarget.setAttribute('aria-pressed', String(dense));
  event.currentTarget.textContent = dense ? 'Comfortable rows' : 'Compact rows';
});

document.getElementById('bulkBar').addEventListener('click', async (event) => {
  const action = event.target.closest('[data-bulk]')?.dataset.bulk;
  if (!action) return;
  if (action === 'clear') {
    selected.clear();
    renderProjects();
    announce('Selection cleared');
  } else if (action === 'archive') {
    const total = selected.size;
    projectRows = projectRows.filter((row) => !selected.has(row.id));
    selected.clear();
    renderProjects();
    announce(`Archived ${total} project${total === 1 ? '' : 's'}`);
  } else {
    const ids = [...selected].join(', ');
    try { await navigator.clipboard.writeText(ids); } catch { /* Clipboard may be unavailable locally. */ }
    announce(`Exported ${selected.size} project IDs`);
  }
});
renderProjects();

/* Rule-based querying with typed operators and local saved views. */
const ACCOUNTS = [
  ['Northstar', 'Enterprise', 92, 180, 12], ['Orbit', 'Pro', 58, 32, 4],
  ['Kindred', 'Enterprise', 67, 240, 37], ['Parcel', 'Starter', 81, 8, 18],
  ['Lattice', 'Pro', 74, 64, 9], ['Daybreak', 'Enterprise', 49, 320, 3],
  ['Mosaic', 'Starter', 88, 14, 42], ['Helio', 'Pro', 63, 91, 28],
].map(([account, plan, health, seats, renewal]) => ({ account, plan, health, seats, renewal }));

const fields = {
  plan: { label: 'Plan', type: 'enum', values: ['Starter', 'Pro', 'Enterprise'] },
  health: { label: 'Health', type: 'number' },
  seats: { label: 'Seats', type: 'number' },
  renewal: { label: 'Renewal in days', type: 'number' },
};
const operators = {
  enum: [['eq', 'is'], ['neq', 'is not']],
  number: [['lt', 'less than'], ['lte', 'at most'], ['gte', 'at least'], ['gt', 'greater than']],
};
const builtInViews = [
  { id: 'needs-attention', name: 'Needs attention', mode: 'all', rules: [{ field: 'health', op: 'lt', value: '65' }] },
  { id: 'enterprise-renewals', name: 'Enterprise renewals', mode: 'all', rules: [{ field: 'plan', op: 'eq', value: 'Enterprise' }, { field: 'renewal', op: 'lte', value: '30' }] },
];
const savedKey = 'frontend-experimentations:table-views:v1';
let rules = [{ field: 'health', op: 'lt', value: '70' }];
let customViews = loadViews();

function loadViews() {
  try {
    const value = JSON.parse(localStorage.getItem(savedKey));
    return Array.isArray(value) ? value.filter((view) => view?.name && Array.isArray(view.rules)) : [];
  } catch { return []; }
}
function persistViews() {
  try { localStorage.setItem(savedKey, JSON.stringify(customViews)); } catch { /* Non-fatal. */ }
}
function optionsMarkup(values, selected) {
  return values.map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
}
function defaultRule(field = 'health') {
  const config = fields[field];
  return { field, op: operators[config.type][0][0], value: config.type === 'enum' ? config.values[0] : '50' };
}

function renderRules() {
  const container = document.getElementById('rules');
  if (!rules.length) {
    container.innerHTML = '<p class="eyebrow">No conditions — showing every account</p>';
    return;
  }
  container.innerHTML = rules.map((rule, index) => {
    const config = fields[rule.field];
    const fieldOptions = Object.entries(fields).map(([value, item]) => `<option value="${value}" ${value === rule.field ? 'selected' : ''}>${item.label}</option>`).join('');
    const valueControl = config.type === 'enum'
      ? `<select class="rule-value" data-part="value">${config.values.map((value) => `<option ${value === rule.value ? 'selected' : ''}>${value}</option>`).join('')}</select>`
      : `<input class="rule-value" data-part="value" type="number" value="${rule.value}" aria-label="Filter value">`;
    return `<div class="rule" data-rule="${index}"><select data-part="field" aria-label="Field">${fieldOptions}</select><select data-part="op" aria-label="Operator">${optionsMarkup(operators[config.type], rule.op)}</select>${valueControl}<button class="action action--quiet remove-rule" data-remove aria-label="Remove condition">×</button></div>`;
  }).join('');
}

function matchesRule(account, rule) {
  const actual = account[rule.field];
  if (rule.op === 'eq') return actual === rule.value;
  if (rule.op === 'neq') return actual !== rule.value;
  const expected = Number(rule.value);
  if (!Number.isFinite(expected)) return true;
  if (rule.op === 'lt') return actual < expected;
  if (rule.op === 'lte') return actual <= expected;
  if (rule.op === 'gte') return actual >= expected;
  return actual > expected;
}

function renderQueryResults() {
  const mode = document.getElementById('matchMode').value;
  const filtered = ACCOUNTS.filter((account) => !rules.length || (mode === 'all'
    ? rules.every((rule) => matchesRule(account, rule))
    : rules.some((rule) => matchesRule(account, rule))));
  document.getElementById('queryRows').innerHTML = filtered.length ? filtered.map((row) => `<tr><th scope="row">${row.account}</th><td>${row.plan}</td><td>${row.health}</td><td>${row.seats}</td><td>${row.renewal}d</td></tr>`).join('') : '<tr class="empty-row"><td colspan="5">No account matches this query. Adjust or remove a condition.</td></tr>';
  document.getElementById('queryCount').textContent = `${filtered.length} of ${ACCOUNTS.length}`;
}

function renderSavedViews() {
  const container = document.getElementById('savedViews');
  container.replaceChildren();
  [...builtInViews, ...customViews].forEach((view) => {
    const chip = document.createElement('span');
    chip.className = 'view-chip';
    const load = document.createElement('button');
    load.type = 'button'; load.dataset.loadView = view.id; load.textContent = view.name;
    chip.append(load);
    if (!builtInViews.includes(view)) {
      const remove = document.createElement('button');
      remove.type = 'button'; remove.dataset.removeView = view.id; remove.setAttribute('aria-label', `Delete ${view.name}`); remove.textContent = '×';
      chip.append(remove);
    }
    container.append(chip);
  });
}

document.getElementById('rules').addEventListener('input', updateRule);
document.getElementById('rules').addEventListener('change', updateRule);
function updateRule(event) {
  const row = event.target.closest('[data-rule]');
  if (!row) return;
  const rule = rules[Number(row.dataset.rule)];
  if (event.target.dataset.part === 'field') Object.assign(rule, defaultRule(event.target.value));
  else if (event.target.dataset.part) rule[event.target.dataset.part] = event.target.value;
  if (event.type === 'change' && event.target.dataset.part === 'field') renderRules();
  renderQueryResults();
}
document.getElementById('rules').addEventListener('click', (event) => {
  const row = event.target.closest('[data-rule]');
  if (!event.target.closest('[data-remove]') || !row) return;
  rules.splice(Number(row.dataset.rule), 1); renderRules(); renderQueryResults();
});
document.getElementById('addRule').addEventListener('click', () => { rules.push(defaultRule()); renderRules(); renderQueryResults(); });
document.getElementById('clearRules').addEventListener('click', () => { rules = []; renderRules(); renderQueryResults(); announce('All query conditions cleared'); });
document.getElementById('matchMode').addEventListener('change', renderQueryResults);
document.getElementById('savedViews').addEventListener('click', (event) => {
  const loadId = event.target.dataset.loadView;
  const removeId = event.target.dataset.removeView;
  if (loadId) {
    const view = [...builtInViews, ...customViews].find((item) => item.id === loadId);
    if (!view) return;
    rules = structuredClone(view.rules); document.getElementById('matchMode').value = view.mode;
    renderRules(); renderQueryResults(); announce(`Loaded ${view.name} view`);
  } else if (removeId) {
    customViews = customViews.filter((view) => view.id !== removeId); persistViews(); renderSavedViews();
  }
});
document.getElementById('saveView').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('viewName');
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  customViews.push({ id: `view-${Date.now()}`, name, mode: document.getElementById('matchMode').value, rules: structuredClone(rules) });
  persistViews(); renderSavedViews(); input.value = ''; announce(`Saved ${name} view`);
});
renderRules(); renderQueryResults(); renderSavedViews();

/* Fixed-height row virtualization with overscan and complete row metadata. */
const TOTAL_ROWS = 10000;
const ROW_HEIGHT = 42;
const OVERSCAN = 5;
const viewport = document.getElementById('virtualViewport');
const spacer = document.getElementById('virtualSpacer');
const actors = ['A. Chen', 'M. Diallo', 'N. Rossi', 'S. Kumar', 'I. Novak'];
const events = ['Permission updated', 'Export completed', 'Session revoked', 'Webhook delivered', 'Member invited'];
const regions = ['eu-west', 'us-east', 'ap-south'];
spacer.style.height = `${TOTAL_ROWS * ROW_HEIGHT}px`;
let virtualFrame = 0;

function renderVirtualRows() {
  virtualFrame = 0;
  const visible = Math.ceil(viewport.clientHeight / ROW_HEIGHT);
  const start = Math.max(0, Math.floor(viewport.scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(TOTAL_ROWS, start + visible + OVERSCAN * 2);
  const fragment = document.createDocumentFragment();
  for (let index = start; index < end; index += 1) {
    const row = document.createElement('div');
    row.className = 'virtual-row'; row.setAttribute('role', 'row'); row.setAttribute('aria-rowindex', String(index + 2));
    row.style.transform = `translateY(${index * ROW_HEIGHT}px)`;
    row.innerHTML = `<span role="cell">${String(index + 1).padStart(5, '0')}</span><span role="cell">${events[index % events.length]}</span><span role="cell">${actors[(index * 7) % actors.length]}</span><span role="cell">${regions[index % regions.length]}</span><span role="cell">${18 + (index * 13) % 380}ms</span>`;
    fragment.append(row);
  }
  spacer.replaceChildren(fragment);
  document.getElementById('mountedCount').textContent = `${end - start} DOM rows / ${TOTAL_ROWS.toLocaleString()}`;
}
viewport.addEventListener('scroll', () => {
  if (!virtualFrame) virtualFrame = requestAnimationFrame(renderVirtualRows);
});
document.getElementById('jumpForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const target = Math.max(1, Math.min(TOTAL_ROWS, Number(document.getElementById('jumpRow').value) || 1));
  viewport.scrollTop = (target - 1) * ROW_HEIGHT;
  renderVirtualRows(); viewport.focus(); announce(`Jumped to row ${target}`);
});
renderVirtualRows();

/* Roving grid navigation with an explicit, reversible edit mode. */
const grid = document.getElementById('editableGrid');
const gridCells = [...grid.querySelectorAll('[role="gridcell"]')];
const columnCount = 4;
let editing = null;
gridCells.forEach((cell) => cell.setAttribute('aria-readonly', 'false'));

function focusGridCell(index) {
  const next = Math.max(0, Math.min(gridCells.length - 1, index));
  gridCells.forEach((cell, cellIndex) => (cell.tabIndex = cellIndex === next ? 0 : -1));
  gridCells[next].focus();
}
function endEdit(commit, move = 0) {
  if (!editing) return;
  const { cell, original, control } = editing;
  const index = gridCells.indexOf(cell);
  const value = commit ? control.value.trim() || original : original;
  editing = null; cell.classList.remove('is-editing'); cell.textContent = value; cell.focus();
  announce(commit ? `Saved ${value}` : `Edit cancelled; restored ${original}`);
  if (move) focusGridCell(index + move);
}
function startEdit(cell, initialValue) {
  if (editing) return;
  const original = cell.textContent.trim();
  const type = cell.dataset.type;
  const control = type === 'status' ? document.createElement('select') : document.createElement('input');
  if (type === 'status') {
    ['Planned', 'In progress', 'Blocked', 'Done'].forEach((value) => control.add(new Option(value, value)));
  } else control.type = type === 'number' ? 'number' : 'text';
  control.value = initialValue ?? original;
  control.setAttribute('aria-label', `Edit cell, previous value ${original}`);
  cell.textContent = ''; cell.append(control); cell.classList.add('is-editing'); editing = { cell, original, control };
  control.focus(); if (control.select) control.select();
  control.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); endEdit(false); }
    else if (event.key === 'Enter') { event.preventDefault(); endEdit(true); }
    else if (event.key === 'Tab') { event.preventDefault(); endEdit(true, event.shiftKey ? -1 : 1); }
  });
}
grid.addEventListener('dblclick', (event) => {
  const cell = event.target.closest('[role="gridcell"]'); if (cell) startEdit(cell);
});
grid.addEventListener('keydown', (event) => {
  if (editing) return;
  const index = gridCells.indexOf(document.activeElement);
  if (index < 0) return;
  const row = Math.floor(index / columnCount);
  let next = index;
  if (event.key === 'ArrowRight') next = Math.min(index + 1, row * columnCount + columnCount - 1);
  else if (event.key === 'ArrowLeft') next = Math.max(index - 1, row * columnCount);
  else if (event.key === 'ArrowDown') next = Math.min(index + columnCount, gridCells.length - 1);
  else if (event.key === 'ArrowUp') next = Math.max(index - columnCount, 0);
  else if (event.key === 'Home') next = event.ctrlKey ? 0 : row * columnCount;
  else if (event.key === 'End') next = event.ctrlKey ? gridCells.length - 1 : row * columnCount + columnCount - 1;
  else if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); startEdit(gridCells[index]); return; }
  else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); startEdit(gridCells[index], event.key); return; }
  else return;
  event.preventDefault(); focusGridCell(next);
});
