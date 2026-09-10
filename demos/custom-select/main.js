import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();
if (!CSS.supports('appearance: base-select')) warn('Customizable select is unavailable in this browser. The controls intentionally fall back to native platform selects with the same labels, values, keyboard behavior and form semantics.');
const renderer=document.getElementById('renderer');
renderer.addEventListener('change',()=>document.getElementById('rendererValue').textContent=`Submitted value: ${renderer.value}`);
