(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RAW_ROOT='https://raw.githubusercontent.com/kimluyenk84hvqy/e-leap-platform/marking-center-v1/media-private/';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const sceneChoices={
    a:'A man is cycling.',
    b:'A woman is walking with her dog.',
    c:'A student is jogging.',
    d:"There's a large house near the park.",
    e:'Two people are walking down a path.',
    f:'A student is doing pull-ups.',
    g:'A tractor is cutting the grass.'
  };
  const correct=['b','a','d','e','c','f','g'];

  function rawUrl(card){
    const raw=String(card?.dataset?.mediaRaw||'').replace(/^PRIVATE_MEDIA\//,'');
    return raw?RAW_ROOT+raw.split('/').map(encodeURIComponent).join('/'):'';
  }
  function addMediaFallback(root=document){
    $$('[data-media-raw]',root).forEach(card=>{
      const el=$('audio,video',card); if(!el||el.dataset.lifeFallbackBound)return;
      el.dataset.lifeFallbackBound='1';
      const fallback=()=>{
        const u=rawUrl(card); if(!u||el.dataset.lifeRawFallback==='1')return;
        el.dataset.lifeRawFallback='1'; el.src=u; try{el.load()}catch(_){ }
        const st=$('.media-state',card); if(st)st.textContent='Media ready · backup source';
      };
      el.addEventListener('error',fallback,{once:true});
      setTimeout(()=>{if((el.readyState||0)===0)fallback()},4500);
    });
  }

  function chip(key){return `<button type="button" draggable="true" class="drag-chip scene-chip" data-scene-chip="${key}"><b>${key}</b><span>${esc(sceneChoices[key])}</span></button>`}
  function setDrop(drop,key){
    const input=$('input[data-response]',drop); if(input)input.value=key;
    drop.dataset.value=key; drop.classList.add('filled');
    const val=$('.drop-value',drop); if(val)val.textContent=`${key} · ${sceneChoices[key]}`;
    const hint=$('.response-hint',drop); if(hint)hint.hidden=true;
  }
  function clearDuplicate(key,except){
    $$('[data-order-drop]').forEach(d=>{if(d===except)return;if(d.dataset.value===key){d.dataset.value='';d.classList.remove('filled');const i=$('input[data-response]',d);if(i)i.value='';const v=$('.drop-value',d);if(v)v.textContent='';const h=$('.response-hint',d);if(h)h.hidden=false}})
  }
  function enhanceVideoOrder(){
    const list=$('.scene-list'); if(!list||list.dataset.dragEnhanced==='1')return;
    list.dataset.dragEnhanced='1';
    const panel=list.parentElement;
    const bank=document.createElement('div'); bank.className='drag-bank video-order-bank'; bank.innerHTML=Object.keys(sceneChoices).map(chip).join('');
    panel.insertBefore(bank,list);
    list.innerHTML=correct.map((key,i)=>`<article class="scene-row order-drop-row"><div class="scene-copy"><b>${i+1}.</b><span>Scene ${i+1}</span></div><div class="drop-box response-box" data-order-drop="${i}" data-response-box="${i}" tabindex="0"><input type="hidden" data-response="${i}" value=""><span class="drop-value"></span><small class="response-hint">Drop your answer here.</small></div><span class="answer-source" hidden>${key} · ${esc(sceneChoices[key])}</span></article>`).join('');
    let selected=null;
    $$('[data-scene-chip]',bank).forEach(c=>{
      c.addEventListener('dragstart',e=>{selected=c.dataset.sceneChip;e.dataTransfer?.setData('text/plain',selected)});
      c.addEventListener('click',()=>{selected=c.dataset.sceneChip;$$('[data-scene-chip]',bank).forEach(x=>x.classList.toggle('picked',x===c))});
    });
    $$('[data-order-drop]',list).forEach(drop=>{
      drop.addEventListener('dragover',e=>e.preventDefault());
      drop.addEventListener('drop',e=>{e.preventDefault();const key=e.dataTransfer?.getData('text/plain')||selected;if(!sceneChoices[key])return;clearDuplicate(key,drop);setDrop(drop,key)});
      drop.addEventListener('click',()=>{
        if(document.body.classList.contains('reveal-armed')||drop.classList.contains('reveal-ready')){
          const row=drop.closest('.scene-row'),ans=$('.answer-source',row)?.textContent||'';
          drop.classList.remove('wrong','right','reveal-ready');drop.classList.add('answer-mode');drop.innerHTML=`<div class="inline-correct">${esc(ans)}</div>`;return;
        }
        if(selected&&sceneChoices[selected]){clearDuplicate(selected,drop);setDrop(drop,selected)}
      });
    });
  }

  function polishHomework(){
    const note=$('.workflow-note'); if(note&&!note.dataset.finalised){note.dataset.finalised='1';note.innerHTML='<b>Marking & return:</b> submissions are grouped by class and assignment in Submissions. Teacher marks each form in Marking Center, releases score + feedback to the learner, and can review the class submission/score list before export.'}
  }
  function run(){addMediaFallback(document);enhanceVideoOrder();polishHomework()}
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',run);
  document.addEventListener('error',e=>{const el=e.target;if(!(el instanceof HTMLMediaElement))return;const card=el.closest('[data-media-raw]');const u=rawUrl(card);if(u&&el.dataset.lifeRawFallback!=='1'){el.dataset.lifeRawFallback='1';el.src=u;try{el.load()}catch(_){}}},true);
})();