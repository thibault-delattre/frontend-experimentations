import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();

const supported=Object.hasOwn(HTMLButtonElement.prototype,'interestForElement');
if(!supported){
  warn('Interest invokers are not supported here, so this page installs a small hover/focus fallback. Long-press and native intent timing require a supporting browser.');
  for(const source of document.querySelectorAll('[interestfor]')){
    const target=document.getElementById(source.getAttribute('interestfor'));let timer=0;
    const show=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!target.matches(':popover-open'))target.showPopover()},300)};
    const hide=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(target.matches(':popover-open'))target.hidePopover()},180)};
    source.addEventListener('pointerenter',show);source.addEventListener('pointerleave',hide);source.addEventListener('focus',show);source.addEventListener('blur',hide);target.addEventListener('pointerenter',()=>clearTimeout(timer));target.addEventListener('pointerleave',hide);
  }
}

// Invoker commands are newer than popover itself. Preserve click behavior when
// the declarative command surface is absent.
if(!('commandForElement' in HTMLButtonElement.prototype)){
  const button=document.getElementById('notifications'),panel=document.getElementById('notification-panel');
  button.addEventListener('click',()=>panel.togglePopover());
}
