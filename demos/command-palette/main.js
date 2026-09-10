import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

const COMMANDS=[
  {id:'new',group:'Project',icon:'＋',name:'New experiment',hint:'Create an empty demo'},
  {id:'deploy',group:'Project',icon:'↑',name:'Deploy preview',hint:'Build and publish a temporary URL'},
  {id:'copy',group:'Project',icon:'⧉',name:'Copy current prompt',hint:'Copy the focused effect brief'},
  {id:'theme',group:'Appearance',icon:'◐',name:'Toggle theme',hint:'Switch between dark and light'},
  {id:'grid',group:'Appearance',icon:'⌗',name:'Show layout grid',hint:'Overlay the baseline and columns'},
  {id:'motion',group:'Accessibility',icon:'≈',name:'Reduce motion',hint:'Preview the reduced-motion mode'},
  {id:'contrast',group:'Accessibility',icon:'◒',name:'Audit contrast',hint:'Check visible foreground pairs'},
];
const palette=document.getElementById('palette'),query=document.getElementById('query'),results=document.getElementById('results'),status=document.getElementById('status');
let visible=[],active=0;
document.getElementById('launcher').addEventListener('click',open);for(const b of document.querySelectorAll('.open'))b.addEventListener('click',open);
addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette.open?palette.close():open();}});
query.addEventListener('input',()=>{active=0;render();});
query.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;paintActive();}if(e.key==='Enter'&&visible[active])run(visible[active].item);});
results.addEventListener('pointermove',e=>{const b=e.target.closest('[data-index]');if(!b)return;active=Number(b.dataset.index);paintActive();});results.addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b)run(visible[Number(b.dataset.index)].item);});
function open(){palette.showModal();query.value='';active=0;render();requestAnimationFrame(()=>query.focus());}
function score(text,needle){if(!needle)return{score:1,pos:[]};const hay=text.toLowerCase(),q=needle.toLowerCase();if(hay.startsWith(q))return{score:100-q.length,pos:[...q].map((_,i)=>i)};const word=hay.split(/\s+/).findIndex(w=>w.startsWith(q));if(word>=0){const start=hay.split(/\s+/).slice(0,word).join(' ').length+(word?1:0);return{score:75-q.length,pos:[...q].map((_,i)=>start+i)}}let at=-1,gaps=0;const pos=[];for(const c of q){const next=hay.indexOf(c,at+1);if(next<0)return null;gaps+=next-at-1;at=next;pos.push(next)}return{score:45-gaps,pos};}
function render(){visible=COMMANDS.map((item,order)=>{const match=score(`${item.name} ${item.hint}`,query.value.trim());return match&&{item,order,...match}}).filter(Boolean).sort((a,b)=>b.score-a.score||a.order-b.order);if(!visible.length){results.innerHTML='<div class="empty">No command found.<br><small>Try a shorter phrase.</small></div>';query.removeAttribute('aria-activedescendant');return;}const groups=Map.groupBy?Map.groupBy(visible,x=>x.item.group):visible.reduce((m,x)=>(m.get(x.item.group)?.push(x)||m.set(x.item.group,[x]),m),new Map());let i=0;results.innerHTML=[...groups].map(([group,items])=>`<section class="group"><h3>${group}</h3>${items.map(x=>{const index=i++;return`<button class="result" id="cmd-${x.item.id}" role="option" data-index="${index}" aria-selected="false"><span class="result__icon">${x.item.icon}</span><span>${highlight(x.item.name,x.pos)}<small>${x.item.hint}</small></span><kbd>↵</kbd></button>`}).join('')}</section>`).join('');paintActive();}
function highlight(text,pos){return[...text].map((c,i)=>pos.includes(i)?`<mark>${c}</mark>`:c).join('');}
function paintActive(){results.querySelectorAll('[role="option"]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));const el=results.querySelector(`[data-index="${active}"]`);if(el){query.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}}
function run(item){palette.close();status.textContent=`Ran: ${item.name}`;setTimeout(()=>status.textContent='',2200);}
