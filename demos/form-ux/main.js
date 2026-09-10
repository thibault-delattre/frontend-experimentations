import { mountDemoBar, warn } from '../../src/lib/chrome.js';
mountDemoBar();
if(!CSS.supports('field-sizing: content'))warn('field-sizing is unavailable here. The controls retain useful minimum sizes and the textarea remains manually resizable through native browser behavior.');

const form=document.getElementById('profileForm'),fields=[...form.querySelectorAll('input')],formStatus=document.getElementById('formStatus');
function message(field){if(field.validity.valueMissing)return 'Enter an email address.';if(field.validity.typeMismatch)return field.type==='url'?'Include a complete URL such as https://example.com.':'Use an address in the form name@company.com.';return ''}
function validate(field){const error=document.getElementById(`${field.id}-error`),text=message(field);error.textContent=text;field.setAttribute('aria-invalid',String(!!text));return !text}
fields.forEach(field=>field.addEventListener('blur',()=>validate(field)));fields.forEach(field=>field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true')validate(field)}));
form.addEventListener('submit',event=>{event.preventDefault();const valid=fields.map(validate).every(Boolean);if(!valid){fields.find(x=>!x.validity.valid)?.focus();formStatus.textContent='Check the highlighted fields.';return}formStatus.textContent='Saved ✓';setTimeout(()=>formStatus.textContent='',1800)});

const drop=document.getElementById('drop'),input=document.getElementById('files'),fileList=document.getElementById('fileList');let selected=[];const allowed=new Set(['image/png','image/jpeg','image/webp']),limit=5*1024*1024;
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('dragging')});for(const type of ['dragleave','drop'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('dragging')});
drop.addEventListener('drop',event=>addFiles(event.dataTransfer.files));input.addEventListener('change',()=>addFiles(input.files));
function addFiles(list){for(const file of list){if(!allowed.has(file.type)||file.size>limit)continue;if(!selected.some(x=>x.name===file.name&&x.size===file.size))selected.push(file)}paintFiles()}
function paintFiles(){fileList.innerHTML=selected.map((file,i)=>`<div class="file"><span class="file__icon">▧</span><span>${escapeHtml(file.name)}<small>${formatBytes(file.size)}</small></span><button data-remove="${i}" aria-label="Remove ${escapeHtml(file.name)}">✕</button></div>`).join('')||'<span style="font-size:.75rem;color:var(--fg-faint)">No images selected</span>'}
fileList.addEventListener('click',event=>{const button=event.target.closest('[data-remove]');if(!button)return;selected.splice(Number(button.dataset.remove),1);paintFiles()});
function formatBytes(bytes){return bytes<1024*1024?`${Math.ceil(bytes/1024)} KB`:`${(bytes/1024/1024).toFixed(1)} MB`}function escapeHtml(value){const span=document.createElement('span');span.textContent=value;return span.innerHTML}paintFiles();
