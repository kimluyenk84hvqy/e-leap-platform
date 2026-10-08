(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const SIGN_ENDPOINT='https://xfisojqahojcsfrjjxab.supabase.co/functions/v1/get-media-url';
  const PARK_PHOTO='https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Parc_G%C3%BCell_a_Barcelona_%2815%29.jpg/1280px-Parc_G%C3%BCell_a_Barcelona_%2815%29.jpg';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const mediaKey=raw=>String(raw||'').replace(/^PRIVATE_MEDIA\//,'');
  const sceneChoices={a:'A man is cycling.',b:'A woman is walking with her dog.',c:'A student is jogging.',d:"There's a large house near the park.",e:'Two people are walking down a path.',f:'A student is doing pull-ups.',g:'A tractor is cutting the grass.'};
  const correct=['b','a','d','e','c','f','g'];

  async function signed(raw){try{const r=await fetch(SIGN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:mediaKey(raw)})});if(!r.ok)return'';const d=await r.json();return d?.url||''}catch{return''}}
  function candidates(raw){const key=mediaKey(raw);return [`/media-private/${key}?v=final3`,`/api/media?pathname=${encodeURIComponent(key)}&v=final3`];}
  async function installMedia(card){
    if(!card||card.dataset.lifeMediaFinal==='1')return;card.dataset.lifeMediaFinal='1';
    const raw=card.dataset.mediaRaw,kind=card.dataset.mediaKind||(/\.mp3($|\?)/i.test(raw)?'audio':'video'),slot=$('.media-slot',card);if(!raw||!slot)return;
    const urls=candidates(raw);let signedUrl='';let attempt=0;
    const mount=()=>{const tag=kind==='audio'?'audio':'video';slot.innerHTML=`<${tag} controls ${tag==='video'?'playsinline':''} preload="metadata"></${tag}><div class="media-state">Loading ${tag}…</div>`;const el=$(tag,slot),state=$('.media-state',slot);
      const tryNext=async()=>{let url=urls[attempt++]||'';if(!url&&attempt<=urls.length+1){signedUrl=signedUrl||await signed(raw);url=signedUrl;attempt=urls.length+2;}if(!url){state.textContent='Media unavailable. Please refresh this Preview.';state.classList.add('error');return;}el.src=url;try{el.load()}catch{}state.textContent=`Loading ${tag}…`;};
      el.addEventListener('loadedmetadata',()=>{state.textContent=`${tag==='audio'?'Audio':'Video'} ready`});
      el.addEventListener('canplay',()=>{state.textContent=`${tag==='audio'?'Audio':'Video'} ready`});
      el.addEventListener('error',()=>{tryNext()});
      tryNext();
    };mount();
  }
  function mediaPass(){$$('[data-media-raw]').forEach(installMedia)}

  function realPhotoPass(){
    $$('.park-photo img').forEach(img=>{if(img.dataset.lifeReal==='1')return;img.dataset.lifeReal='1';img.src=PARK_PHOTO;img.alt='Park Güell, Barcelona';img.removeAttribute('loading')});
    $$('.section-hero.park-cover').forEach(el=>el.style.setProperty('--hero-photo',`url("${PARK_PHOTO}")`));
    $$('.thank-card').forEach(el=>el.style.setProperty('--thank-photo',`url("${PARK_PHOTO}")`));
  }

  function chip(key){return `<button type="button" draggable="true" class="drag-chip scene-chip" data-scene-chip="${key}"><b>${key}</b><span>${esc(sceneChoices[key])}</span></button>`}
  function setDrop(drop,key){const input=$('input[data-response]',drop);if(input)input.value=key;drop.dataset.value=key;drop.classList.add('filled');const val=$('.drop-value',drop);if(val)val.textContent=`${key} · ${sceneChoices[key]}`;const hint=$('.response-hint',drop);if(hint)hint.hidden=true;}
  function clearDuplicate(key,except){$$('[data-order-drop]').forEach(d=>{if(d===except||d.dataset.value!==key)return;d.dataset.value='';d.classList.remove('filled');const i=$('input[data-response]',d);if(i)i.value='';const v=$('.drop-value',d);if(v)v.textContent='';const h=$('.response-hint',d);if(h)h.hidden=false})}
  function enhanceVideoOrder(){const list=$('.scene-list');if(!list||list.dataset.dragEnhanced==='1')return;list.dataset.dragEnhanced='1';const panel=list.parentElement;const bank=document.createElement('div');bank.className='drag-bank video-order-bank';bank.innerHTML=Object.keys(sceneChoices).map(chip).join('');panel.insertBefore(bank,list);list.innerHTML=correct.map((key,i)=>`<article class="scene-row order-drop-row"><div class="scene-copy"><b>${i+1}.</b><span>Scene ${i+1}</span></div><div class="drop-box response-box" data-order-drop="${i}" data-response-box="${i}" tabindex="0"><input type="hidden" data-response="${i}" value=""><span class="drop-value"></span><small class="response-hint">Drop your answer here.</small></div><span class="answer-source" hidden>${key} · ${esc(sceneChoices[key])}</span></article>`).join('');let selected=null;$$('[data-scene-chip]',bank).forEach(c=>{c.addEventListener('dragstart',e=>{selected=c.dataset.sceneChip;e.dataTransfer?.setData('text/plain',selected)});c.addEventListener('click',()=>{selected=c.dataset.sceneChip;$$('[data-scene-chip]',bank).forEach(x=>x.classList.toggle('picked',x===c))})});$$('[data-order-drop]',list).forEach(drop=>{drop.addEventListener('dragover',e=>e.preventDefault());drop.addEventListener('drop',e=>{e.preventDefault();const key=e.dataTransfer?.getData('text/plain')||selected;if(!sceneChoices[key])return;clearDuplicate(key,drop);setDrop(drop,key)});drop.addEventListener('click',()=>{if(document.body.classList.contains('reveal-armed')||drop.classList.contains('reveal-ready')){const row=drop.closest('.scene-row'),ans=$('.answer-source',row)?.textContent||'';drop.classList.remove('wrong','right','reveal-ready');drop.classList.add('answer-mode');drop.innerHTML=`<div class="inline-correct">${esc(ans)}</div>`;return}if(selected&&sceneChoices[selected]){clearDuplicate(selected,drop);setDrop(drop,selected)}})})}

  function evidencePass(){$$('.evidence-btn').forEach(btn=>{if(btn.dataset.lifeEvidence==='1')return;btn.dataset.lifeEvidence='1';btn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const split=btn.closest('.video-split'),card=$('[data-media-kind="video"]',split),video=$('video',card);if(!video){btn.textContent='Video not ready';return;}const start=Number(btn.dataset.start)||0,end=Number(btn.dataset.end)||start+20;try{video.pause();video.currentTime=Math.min(start,Number.isFinite(video.duration)?Math.max(0,video.duration-.2):start);await video.play();btn.textContent='■ Evidence playing';const stop=()=>{if(video.currentTime>=end){video.pause();video.removeEventListener('timeupdate',stop);btn.textContent='▶ Play evidence'}};video.addEventListener('timeupdate',stop)}catch{btn.textContent='Tap video once, then Play evidence'}} ,true)})}

  function compactAnswerPass(){
    $$('.response-box.answer-mode,.drop-box.answer-mode').forEach(box=>{const ans=$('.inline-correct',box);if(ans)box.replaceChildren(ans)});
    $$('.response-box,.drop-box').forEach(box=>{if(box.querySelector('.inline-correct'))box.classList.add('answer-mode')});
  }
  function textPass(){const s3=$('body[data-screen="3"] .stage');if(s3)s3.textContent='CHECKING THE PREVIOUS LESSON';const s12=$('body[data-screen="12"] .instruction');if(s12)s12.textContent='Look at the photo and caption. Use the visual clues to discuss the place, then answer the two questions from the Student’s Book.';}
  function polishHomework(){const note=$('.workflow-note');if(note&&!note.dataset.finalised){note.dataset.finalised='1';note.innerHTML='<b>Homework flow:</b> Teacher chooses the class and deadline when assigning. Student submissions are grouped by assignment and class in Submissions. Teacher/Admin marks the form, releases score + feedback, and the learner sees the released result. Class results can then be reviewed/exported from the reporting tools.'}}
  function run(){realPhotoPass();mediaPass();enhanceVideoOrder();evidencePass();compactAnswerPass();textPass();polishHomework()}
  const mo=new MutationObserver(()=>requestAnimationFrame(run));mo.observe(document.documentElement,{subtree:true,childList:true});document.addEventListener('DOMContentLoaded',run);setInterval(run,1800);
})();