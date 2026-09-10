import { mountDemoBar, warn, reducedMotion } from '../../src/lib/chrome.js';
mountDemoBar();

const PAGES={foundations:{kicker:'01 · design craft',title:'Make structure feel inevitable.',body:'Typography, spacing, colour and elevation are the quiet system underneath every expressive surface.',tiles:['Type scale','Intrinsic layout','Perceptual colour']},motion:{kicker:'02 · interaction',title:'Motion explains what changed.',body:'Use transitions for continuity, springs for interruption, and no movement where feedback alone is enough.',tiles:['Easing','Gestures','Scroll timelines']},rendering:{kicker:'03 · graphics',title:'Choose the cheapest capable renderer.',body:'CSS before Canvas, Canvas before WebGL, and WebGPU only when compute or scene complexity earns it.',tiles:['Canvas 2D','WebGL shaders','WebGPU compute']},shipping:{kicker:'04 · production',title:'The fallback is part of the design.',body:'Capability checks, reduced motion, focus behavior and honest loading states are not cleanup work.',tiles:['Accessibility','Performance','Resilience']}};
const view=document.getElementById('view'),links=[...document.querySelectorAll('[data-route]')];let renderToken=0;
const keyFrom=url=>new URL(url,location.href).searchParams.get('view')||'foundations';
function markup(key){const p=PAGES[key]||PAGES.foundations;return`<span class="eyebrow">${p.kicker}</span><h2>${p.title}</h2><p>${p.body}</p><div class="tiles">${p.tiles.map((x,i)=>`<div><span class="eyebrow">0${i+1}</span><br>${x}</div>`).join('')}</div>`}
function mark(key){for(const link of links)link.setAttribute('aria-current',link.href===new URL(`?view=${key}`,location.href).href?'page':'false')}
async function render(url,{pending=true}={}){const token=++renderToken,key=keyFrom(url);mark(key);if(pending){view.innerHTML='<span class="pending">Preparing route…</span>';await new Promise(r=>setTimeout(r,340));}if(token!==renderToken)return;const update=()=>{view.innerHTML=markup(key);view.querySelector('h2').tabIndex=-1;view.querySelector('h2').focus({preventScroll:true})};if(document.startViewTransition&&!reducedMotion()){const transition=document.startViewTransition(update);await transition.updateCallbackDone}else update()}

if('navigation' in window){
  navigation.addEventListener('navigate',event=>{
    const url=new URL(event.destination.url);if(!event.canIntercept||url.origin!==location.origin||url.pathname!==location.pathname)return;
    document.documentElement.dataset.direction=event.destination.index<navigation.currentEntry.index?'back':'forward';
    event.intercept({scroll:'manual',focusReset:'manual',handler:async()=>{await render(url);event.scroll();}});
  });
}else{
  warn('The Navigation API is unavailable here. A History API adapter powers this demo; production routing would need to account for form submissions and redirects separately.');
  document.addEventListener('click',event=>{const link=event.target.closest('[data-route]');if(!link)return;event.preventDefault();history.pushState({},'',link.href);document.documentElement.dataset.direction='forward';render(location.href)});
  addEventListener('popstate',()=>{document.documentElement.dataset.direction='back';render(location.href)});
}
render(location.href,{pending:false});
