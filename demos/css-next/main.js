import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();
const required=[['clip-path: shape(from 0 0, line to 100% 100%)','shape()'],['color: contrast-color(red)','contrast-color()'],['width: calc(attr(data-x type(<number>)) * 1px)','typed attr()']];
const missing=required.filter(([rule])=>!CSS.supports(rule)).map(([,name])=>name);
if(missing.length)warn(`This browser is missing ${missing.join(', ')}. Each example keeps readable content and conventional geometry as its fallback.`);
const contrast=document.getElementById('contrast'),tone=document.getElementById('tone');tone.addEventListener('input',()=>contrast.style.setProperty('--tone',tone.value));
const stagger=document.getElementById('stagger');function play(){stagger.classList.remove('play');void stagger.offsetWidth;stagger.classList.add('play')}document.getElementById('replay').addEventListener('click',play);play();
