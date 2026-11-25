// Studio preview only: references existing blocks; never copies answers or media.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mapPictureReveal(raw,screen){
 if(!raw.pictureReveal)return null;
 const {step,pairs}=raw.pictureReveal;
 if(!screen.combo?.steps.some(s=>s.id===step)||!Array.isArray(pairs)||pairs.length<2||pairs.length>12)throw Error('Invalid picture reveal group.');
 const used=new Set();return {step,pairs:pairs.map(p=>{
  const model=screen.blocks[p.model],image=p.image==null?null:screen.blocks[p.image];
  if(!Number.isInteger(p.model)||model?.type!=='writing'||model.comboStep!==step||!model.activity?.modelAnswer?.trim()||used.has(p.model)||typeof p.label!=='string'||!p.label.trim()||p.label.length>100)throw Error('Invalid picture model.');
  used.add(p.model);
  if(p.image!=null){if(!Number.isInteger(p.image)||image?.type!=='image'||image.comboStep!==step||used.has(p.image))throw Error('Invalid picture reference.');used.add(p.image);}
  return {label:p.label,modelId:model.id,imageId:image?.id||null};
 })};
}
export function activePictureGroup(screen){
 const g=screen.pictureReveal;if(!g||screen.combo?.activeStep!==g.step)return null;
 const pairs=g.pairs.map(p=>({...p,model:screen.blocks.find(b=>b.id===p.modelId),image:screen.blocks.find(b=>b.id===p.imageId)}));
 return pairs.every(p=>p.model?.type==='writing'&&p.model.comboStep===g.step&&p.model.activity?.modelAnswer?.trim()&&(!p.imageId||(p.image?.type==='image'&&p.image.comboStep===g.step)))?pairs:null;
}
const allowed=(p,role)=>['teacher','admin','presentation'].includes(role)&&p.model.activity.policy?.teacherReveal!==false;
export function renderPictureReveal(screen,role){
 const pairs=activePictureGroup(screen);if(!pairs)return '';
 const canReveal=pairs.some(p=>allowed(p,role));
 return `<section class="picture-reveal" data-picture-reveal><div class="picture-reveal-grid">${pairs.map((p,i)=>`<button type="button" data-picture-index="${i}" aria-pressed="false" class="picture-choice">${p.image?.content?.src&&/^\/api\/studio-media\?document=1&open=[0-9a-f-]+$/i.test(p.image.content.src)?`<img src="${esc(p.image.content.src)}" alt="${esc(p.image.content.alt||p.label)}" loading="lazy">`:'<span class="picture-missing">Image unavailable</span>'}<b>${esc(p.label)}</b></button>`).join('')}</div><div class="picture-reveal-controls">${canReveal?'<button type="button" class="studio-btn" data-picture-arm>Show answer</button>':''}<button type="button" class="studio-btn" data-picture-reset>Reset</button></div><div class="picture-model" aria-live="polite" hidden></div></section>`;
}
export function wirePictureReveal(host,screen,role){
 const pairs=activePictureGroup(screen);if(!host||!pairs)return;
 let armed=false;const output=host.querySelector('.picture-model');
 const clear=()=>{output.textContent='';output.hidden=true;host.querySelectorAll('[data-picture-index]').forEach(el=>el.setAttribute('aria-pressed','false'));};
 host.querySelector('[data-picture-arm]')?.addEventListener('click',()=>{armed=true;clear();});
 host.querySelector('[data-picture-reset]')?.addEventListener('click',()=>{armed=false;clear();});
 host.querySelectorAll('[data-picture-index]').forEach(el=>el.addEventListener('click',()=>{const p=pairs[Number(el.dataset.pictureIndex)];if(!p)return;clear();el.setAttribute('aria-pressed','true');if(armed&&allowed(p,role)){output.textContent=p.model.activity.modelAnswer;output.hidden=false;}}));
}

// Neutral photo selection; no labels or model answers enter this view.
export function renderPictureSelection(pairs,selected){return `<div class="picture-reveal-grid" aria-label="Choose a photo">${pairs.map((p,i)=>`<button type="button" class="picture-choice" data-ped-photo="${i}" aria-pressed="${i===selected}">Photo ${i+1}</button>`).join('')}</div>`;}
