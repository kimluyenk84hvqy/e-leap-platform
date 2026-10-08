(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const SIGN_ENDPOINT='https://xfisojqahojcsfrjjxab.supabase.co/functions/v1/get-media-url';
  const HOLLAND_PARK='https://commons.wikimedia.org/wiki/Special:Redirect/file/20060330-011-holland-park-pond.jpg?width=1600';
  const key=raw=>String(raw||'').replace(/^PRIVATE_MEDIA\//,'');
  async function signed(raw){try{const r=await fetch(SIGN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:key(raw)})});if(!r.ok)return'';const d=await r.json();return d?.url||''}catch{return''}}

  function keepAnswerInsideBox(){
    $$('.answer-source').forEach(x=>x.hidden=true);
    $$('.response-box .inline-correct,.drop-box .inline-correct').forEach(ans=>{
      const box=ans.closest('.response-box,.drop-box');
      if(!box)return;
      box.classList.add('answer-mode');
      if(box.children.length!==1)box.replaceChildren(ans);
    });
  }

  async function repairMedia(card){
    if(!card||card.dataset.v5Repair==='1')return;
    card.dataset.v5Repair='1';
    const raw=card.dataset.mediaRaw,kind=card.dataset.mediaKind||(/\.mp3$/i.test(raw||'')?'audio':'video');
    const slot=$('.media-slot',card);if(!raw||!slot)return;
    const direct=`/media-private/${key(raw)}?v=life-final-v5`;
    const urls=[direct];const s=await signed(raw);if(s)urls.push(s);
    let i=0;
    const mount=()=>{
      const url=urls[i++];
      if(!url){slot.innerHTML='<div class="media-error"><b>Media is not available in this Preview yet.</b><br>Refresh after the newest deployment is Ready.</div>';return;}
      const tag=kind==='audio'?'audio':'video';
      slot.innerHTML=`<${tag} controls ${tag==='video'?'playsinline':''} preload="metadata" src="${url}"></${tag}><div class="media-state">Loading ${tag}…</div>`;
      const el=$(tag,slot),state=$('.media-state',slot);
      el.addEventListener('loadedmetadata',()=>state.textContent=kind==='audio'?'Audio ready':'Video ready',{once:true});
      el.addEventListener('canplay',()=>state.textContent=kind==='audio'?'Audio ready':'Video ready',{once:true});
      el.addEventListener('error',mount,{once:true});
    };
    mount();
  }

  function mediaPass(){
    $$('[data-media-raw]').forEach(card=>{
      const el=$('audio,video',card);
      if(!el||el.error||!el.currentSrc)repairMedia(card);
    });
  }

  function imagePass(){
    const n=Number(document.body.dataset.screen||0);
    if(n===12||n===20){
      const img=$('.park-photo img');
      if(img&&img.dataset.v5Photo!=='1'){
        img.dataset.v5Photo='1';img.src=HOLLAND_PARK;img.alt='Holland Park, Kensington, London';
        const cap=img.closest('figure')?.querySelector('figcaption');
        if(cap)cap.textContent='Holland Park, Kensington, London · a real urban green space with mature trees and a pond.';
      }
      if(n===20){
        const card=$('.thank-card');if(card)card.style.setProperty('--thank-photo',`url("${HOLLAND_PARK}")`);
      }
    }
  }

  function textPass(){
    const n=Number(document.body.dataset.screen||0);
    if(n===3){const st=$('.stage');if(st)st.textContent='CHECKING THE PREVIOUS LESSON';}
    if(n===7){$$('.response-hint').forEach(h=>h.textContent='Drop your answer here.');}
  }

  function qrFallbackPass(){
    const docs=[document];try{if(parent&&parent!==window)docs.push(parent.document)}catch{}
    docs.forEach(d=>d.querySelectorAll('img[alt*="QR"],img[id*="Qr"],img[id*="QR"]').forEach(img=>{
      if(img.dataset.v5Qr==='1')return;img.dataset.v5Qr='1';
      img.addEventListener('error',()=>{
        const src=img.getAttribute('src')||'';const m=src.match(/[?&]text=([^&]+)/);if(!m)return;
        let text='';try{text=decodeURIComponent(m[1])}catch{text=m[1]}
        const size=Math.max(180,Math.round(img.getBoundingClientRect().width||240));
        const fallback=`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=1&data=${encodeURIComponent(text)}`;
        if(!img.dataset.v5Fallback){img.dataset.v5Fallback='1';img.src=fallback;}
      });
    }));
  }

  function evidencePass(){
    $$('.evidence-btn').forEach(btn=>{
      if(btn.dataset.v5Evidence==='1')return;btn.dataset.v5Evidence='1';
      btn.addEventListener('click',async e=>{
        e.preventDefault();e.stopImmediatePropagation();
        const split=btn.closest('.video-split'),video=$('video',split);if(!video){btn.textContent='Video not ready';return;}
        const start=Number(btn.dataset.start||0),end=Number(btn.dataset.end||start+20);
        try{
          if(video.readyState<1)await new Promise((resolve,reject)=>{video.addEventListener('loadedmetadata',resolve,{once:true});setTimeout(()=>reject(new Error('timeout')),3500)});
          video.pause();video.currentTime=Math.min(start,Math.max(0,(video.duration||start+1)-.2));await video.play();
          btn.textContent='■ Evidence playing';
          const stop=()=>{if(video.currentTime>=end){video.pause();video.removeEventListener('timeupdate',stop);btn.textContent='▶ Play evidence'}};
          video.addEventListener('timeupdate',stop);
        }catch{btn.textContent='Tap the video once, then Play evidence';}
      },true);
    });
  }

  function run(){keepAnswerInsideBox();textPass();imagePass();mediaPass();evidencePass();qrFallbackPass();}
  new MutationObserver(()=>requestAnimationFrame(run)).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',run);setInterval(run,1400);
})();
