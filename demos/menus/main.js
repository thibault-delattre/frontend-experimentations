import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const trigger=document.getElementById('more'),menu=document.getElementById('actions'),items=[...menu.querySelectorAll('[role="menuitem"]')];let current=0;
function focusAt(index){current=(index+items.length)%items.length;items.forEach((x,i)=>x.tabIndex=i===current?0:-1);items[current].focus();}
menu.addEventListener('toggle',()=>{if(menu.matches(':popover-open'))requestAnimationFrame(()=>focusAt(0));});
menu.addEventListener('keydown',e=>{const keys={ArrowDown:current+1,ArrowUp:current-1,Home:0,End:items.length-1};if(e.key in keys){e.preventDefault();focusAt(keys[e.key]);}else if(e.key==='Escape'){menu.hidePopover();trigger.focus();}else if(e.key.length===1){const at=items.findIndex(x=>x.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));if(at>=0)focusAt(at);}});items.forEach((x,i)=>{x.tabIndex=i? -1:0;});

const DATA={platform:[['Design systems','Tokens and components'],['Motion','Springs and timelines'],['Shaders','WebGL and WebGPU']],resources:[['Dictionary','Browse every effect'],['Prompts','Copy implementation briefs'],['Notes','Failure modes explained']],company:[['About','Why this lab exists'],['Research','Platform investigations'],['Contact','Share an experiment']]};
const nav=document.querySelector('.nav'),mega=document.getElementById('mega'),triggers=[...nav.querySelectorAll('[data-mega]')];let closeTimer=0,last={x:0,y:0};
function openMega(button){clearTimeout(closeTimer);triggers.forEach(x=>x.setAttribute('aria-expanded',String(x===button)));mega.innerHTML=DATA[button.dataset.mega].map(([a,b])=>`<a href="#">${a}<small>${b}</small></a>`).join('');mega.classList.add('open');}
function scheduleClose(event){const r=mega.getBoundingClientRect(),toward=event.clientY<r.top&&Math.abs(event.clientX-last.x)<Math.max(40,r.width*.35);clearTimeout(closeTimer);closeTimer=setTimeout(closeMega,toward?420:120);last={x:event.clientX,y:event.clientY};}
function closeMega(){mega.classList.remove('open');triggers.forEach(x=>x.setAttribute('aria-expanded','false'));}
triggers.forEach(b=>{b.addEventListener('pointerenter',()=>openMega(b));b.addEventListener('pointerleave',scheduleClose);b.addEventListener('focus',()=>openMega(b));});mega.addEventListener('pointerenter',()=>clearTimeout(closeTimer));mega.addEventListener('pointerleave',scheduleClose);nav.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMega();document.activeElement?.blur();}});
