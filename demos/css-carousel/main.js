import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();
if (!CSS.supports('scroll-marker-group: after')) {
  warn('CSS-generated carousel controls are not available here. The semantic horizontal scroll-snap list remains fully usable with touch, a trackpad, Shift + wheel, and keyboard scrolling.');
}
