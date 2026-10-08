(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const RESOURCE_ID='res-life-u01-l03';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* ---------- answer UX: answers always occupy the learner response box ---------- */
  function compactAnswers(){
    $$('.answer-source:not([hidden])').forEach(x=>x.hidden=true);
    $$('.response-box.answer-mode,.drop-box.answer-mode').forEach(box=>{
      const ans=$('.inline-correct',box); if(ans&&box.children.length!==1)box.replaceChildren(ans);
    });
    $$('.inline-correct').forEach(ans=>{
      const box=ans.closest('.response-box,.drop-box');
      if(box){box.classList.add('answer-mode');box.style.minHeight='72px';}
    });
  }

  /* ---------- projector/mobile typography and requested labels ---------- */
  function textPass(){
    const n=Number(document.body.dataset.screen||0);
    if(n===3){const st=$('.stage'); if(st)st.textContent='CHECKING THE PREVIOUS LESSON';}
    if(n===7){$$('.response-hint').forEach(h=>{if(!h.textContent.trim())h.textContent='Drop your answer here.';});}
    if(n===15){const p=$('.instruction');if(p)p.textContent='Watch the video again. Student A completes the first column and Student B completes the second. Share your notes, complete the missing information, then click Play evidence to check each visitor.';}
  }

  /* ---------- media: retry direct static media, then signed private media ---------- */
  const SIGN_ENDPOINT='https://xfisojqahojcsfrjjxab.supabase.co/functions/v1/get-media-url';
  const key=raw=>String(raw||'').replace(/^PRIVATE_MEDIA\//,'');
  async function signed(raw){try{const r=await fetch(SIGN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:key(raw)})});if(!r.ok)return'';const d=await r.json();return d?.url||''}catch{return''}}
  async function remount(card){
    if(!card)return;const raw=card.dataset.mediaRaw,kind=card.dataset.mediaKind||(/\.mp3$/i.test(raw||'')?'audio':'video'),slot=$('.media-slot',card);if(!raw||!slot)return;
    const urls=[`/media-private/${key(raw)}?v=life-final4`,await signed(raw)].filter(Boolean);let i=0;
    const tag=kind==='audio'?'audio':'video';slot.innerHTML=`<${tag} controls ${tag==='video'?'playsinline':''} preload="metadata"></${tag}><div class="media-state">Loading ${tag}…</div>`;
    const el=$(tag,slot),state=$('.media-state',slot);
    const next=()=>{const url=urls[i++];if(!url){state.textContent='Media unavailable in this deployment.';state.classList.add('error');return;}el.src=url;el.load();state.textContent=`Loading ${tag}…`;};
    el.addEventListener('loadedmetadata',()=>{state.textContent=`${tag==='audio'?'Audio':'Video'} ready`});
    el.addEventListener('canplay',()=>{state.textContent=`${tag==='audio'?'Audio':'Video'} ready`});
    el.addEventListener('error',next);next();
  }
  function mediaPass(){$$('[data-media-raw]').forEach(card=>{const el=$('audio,video',card);if(!el||el.error||!el.currentSrc)remount(card)});}

  /* ---------- evidence clips on video-notes ---------- */
  function evidencePass(){
    $$('.evidence-btn').forEach(btn=>{
      if(btn.dataset.finalEvidence)return;btn.dataset.finalEvidence='1';
      btn.addEventListener('click',async e=>{
        e.preventDefault();e.stopImmediatePropagation();
        const split=btn.closest('.video-split');const video=$('video',split);if(!video){btn.textContent='Video not ready';return;}
        const start=Number(btn.dataset.start||0),end=Number(btn.dataset.end||start+20);
        try{if(video.readyState<1)await new Promise((ok,fail)=>{video.addEventListener('loadedmetadata',ok,{once:true});setTimeout(fail,2500)});video.pause();video.currentTime=Math.min(start,Math.max(0,(video.duration||start+1)-.2));await video.play();btn.textContent='■ Evidence playing';const stop=()=>{if(video.currentTime>=end){video.pause();video.removeEventListener('timeupdate',stop);btn.textContent='▶ Play evidence'}};video.addEventListener('timeupdate',stop);}catch{btn.textContent='Tap the video once, then Play evidence';}
      },true);
    });
  }

  /* ---------- Live Class / QR: use the same Neon session system as Student access + Responses ---------- */
  function parentDoc(){try{return parent!==window?parent.document:null}catch{return null}}
  function currentHostParams(){try{return new URL(parent.location.href).searchParams}catch{return new URLSearchParams()}}
  function joinUrl(code){return `${location.origin}/student-access.html?code=${encodeURIComponent(code)}`}
  function parentModal(){
    const d=parentDoc();if(!d)return null;let modal=d.getElementById('lifeNeonLiveModal');if(modal)return modal;
    modal=d.createElement('div');modal.id='lifeNeonLiveModal';modal.style.cssText='position:fixed;inset:0;z-index:10050;background:#061a2db5;display:grid;place-items:center;padding:18px';
    modal.innerHTML='<div style="width:min(720px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 24px 80px #0005;color:#071a2d;font-family:Poppins,Arial,sans-serif"><div style="display:flex;justify-content:space-between;gap:16px;align-items:start"><div><h2 style="margin:0;font-size:30px">Live Class / QR</h2><p style="margin:7px 0 0;color:#42596d">Choose a class for this session. No course or class is preselected.</p></div><button data-live-close style="border:0;background:transparent;font-size:28px">×</button></div><div data-live-body style="margin-top:18px"></div></div>';
    d.body.append(modal);modal.querySelector('[data-live-close]').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};return modal;
  }
  async function showLive(){
    const d=parentDoc();if(!d)return;const modal=parentModal(),body=modal.querySelector('[data-live-body]');const q=currentHostParams();
    const saved=(()=>{try{return JSON.parse(localStorage.getItem('e-leap-neon-live-session')||'null')}catch{return null}})();
    const activeId=q.get('sessionId');
    if(activeId&&saved?.sessionId===activeId&&saved?.joinCode){
      const link=joinUrl(saved.joinCode);body.innerHTML=`<div style="display:grid;grid-template-columns:240px 1fr;gap:20px;align-items:center"><img src="/api/qr?text=${encodeURIComponent(link)}&size=240" alt="Join QR" style="width:240px;height:240px;border:1px solid #d5e3dd;border-radius:12px"><div><div style="font-size:14px;font-weight:800;color:#5d746b">JOIN CODE</div><div style="font-size:48px;font-weight:950;letter-spacing:.08em;color:#0d5145">${esc(saved.joinCode)}</div><p style="overflow-wrap:anywhere">${esc(link)}</p><button data-copy style="padding:11px 15px;border:0;border-radius:10px;background:#173a5e;color:#fff;font-weight:900">Copy join link</button></div></div><p style="margin-top:16px;font-weight:800;color:#0d5145">Responses is now connected to this live session. Student Submit attempts will appear in the Responses board.</p>`;
      body.querySelector('[data-copy]').onclick=async e=>{await navigator.clipboard.writeText(link);e.currentTarget.textContent='Copied ✓'};return;
    }
    body.innerHTML='<p>Loading your classes…</p>';
    try{
      const r=await fetch('/api/research/classes',{credentials:'same-origin',cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not load classes');const classes=(data.classes||[]).filter(c=>c.status!=='archived');
      if(!classes.length){body.innerHTML='<p><b>No active class found.</b> Create a class first, then return here.</p>';return;}
      body.innerHTML=`<label style="display:grid;gap:7px;font-weight:900">Class<select data-class style="min-height:48px;border:2px solid #aac8bc;border-radius:10px;padding:0 12px;font:inherit"><option value="">Choose a class…</option>${classes.map(c=>`<option value="${esc(c.class_id)}">${esc(c.class_name||'Class')}</option>`).join('')}</select></label><button data-create-live style="margin-top:16px;padding:12px 18px;border:0;border-radius:11px;background:#0d5145;color:#fff;font-weight:950;font-size:17px">Create live session</button><div data-status style="margin-top:10px;font-weight:800"></div>`;
      body.querySelector('[data-create-live]').onclick=async()=>{const classId=body.querySelector('[data-class]').value,status=body.querySelector('[data-status]');if(!classId){status.textContent='Choose a class.';return;}status.textContent='Creating live session…';const rr=await fetch('/api/research/sessions',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({classId,lessonId:RESOURCE_ID})});const dd=await rr.json();if(!rr.ok){status.textContent=dd.error||'Could not create live session';return;}const s=dd.session,link=joinUrl(s.join_code);localStorage.setItem('e-leap-neon-live-session',JSON.stringify({sessionId:s.session_id,classId:s.class_id,joinCode:s.join_code,resourceId:RESOURCE_ID}));body.innerHTML=`<div style="display:grid;grid-template-columns:240px 1fr;gap:20px;align-items:center"><img src="/api/qr?text=${encodeURIComponent(link)}&size=240" alt="Join QR" style="width:240px;height:240px;border:1px solid #d5e3dd;border-radius:12px"><div><div style="font-size:14px;font-weight:800;color:#5d746b">JOIN CODE</div><div style="font-size:48px;font-weight:950;letter-spacing:.08em;color:#0d5145">${esc(s.join_code)}</div><p style="overflow-wrap:anywhere">${esc(link)}</p><button data-copy style="padding:11px 15px;border:0;border-radius:10px;background:#173a5e;color:#fff;font-weight:900">Copy join link</button><button data-enter style="margin-left:8px;padding:11px 15px;border:0;border-radius:10px;background:#6b4fd3;color:#fff;font-weight:900">Start teaching</button></div></div><p style="margin-top:16px">After students join and press Submit, their answers are grouped by this session and activity in <b>Responses</b>.</p>`;body.querySelector('[data-copy]').onclick=async e=>{await navigator.clipboard.writeText(link);e.currentTarget.textContent='Copied ✓'};body.querySelector('[data-enter]').onclick=()=>{const u=new URL(parent.location.href);u.searchParams.set('sessionId',s.session_id);u.searchParams.set('classId',s.class_id);u.searchParams.set('joinCode',s.join_code);parent.location.href=u.toString()};};
    }catch(err){body.innerHTML=`<p style="color:#8c3030"><b>Live Class could not start.</b><br>${esc(err.message||err)}</p>`;}
  }
  function installLiveButton(){const d=parentDoc();if(!d)return;const btn=d.getElementById('hostLiveBtn');if(!btn||btn.dataset.neonLive==='1')return;btn.dataset.neonLive='1';btn.removeAttribute('target');btn.removeAttribute('href');btn.style.cursor='pointer';btn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();showLive()};}

  function run(){compactAnswers();textPass();mediaPass();evidencePass();installLiveButton();}
  new MutationObserver(()=>requestAnimationFrame(run)).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',run);setInterval(run,1200);
})();
