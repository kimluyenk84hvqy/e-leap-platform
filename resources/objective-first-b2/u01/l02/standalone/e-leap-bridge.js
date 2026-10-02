/* E-LEAP Standalone Learning Bridge v1.0
   Portable lesson-side adapter. It never owns learner history.
   When embedded, events are forwarded to the platform host. When opened directly,
   a small local recovery log is kept for QA/offline continuity only. */
(function(){
  const cfg=window.ELEAP_LESSON_BRIDGE||{};
  const resourceId=cfg.resourceId||document.documentElement.dataset.resourceId||'unknown-resource';
  const courseId=cfg.courseId||'objective-first-b2';
  const unitId=cfg.unitId||'unit-01';
  const lessonId=cfg.lessonId||resourceId;
  const localKey='e-leap-standalone-events:'+resourceId;
  const uid=()=>globalThis.crypto?.randomUUID?.()||('evt-'+Date.now()+'-'+Math.random().toString(16).slice(2));
  const activity=()=>{
    if(window.LESSON?.activities){const n=Math.max(0,(Number(document.body.dataset.screen)||1)-1);return window.LESSON.activities[n]?.id||('screen-'+(n+1));}
    const active=document.querySelector('.screen.active'); return active?.dataset.screen ? 'screen-'+active.dataset.screen : null;
  };
  const context=()=>({mode:cfg.mode||'standalone',courseId,unitId,lessonId});
  function emit(eventType,payload={}){
    const event={eventId:uid(),eventType,occurredAt:new Date().toISOString(),resourceId,activityId:activity(),studentId:null,sessionId:null,context:context(),payload,source:'compatibility-bridge'};
    if(window.parent!==window){window.parent.postMessage({type:'e-leap:learning-event',event},location.origin);}
    else {try{const rows=JSON.parse(localStorage.getItem(localKey)||'[]');rows.push(event);localStorage.setItem(localKey,JSON.stringify(rows.slice(-250)));}catch(_){}}
    window.dispatchEvent(new CustomEvent('e-leap:lesson-event',{detail:event}));
    return event;
  }
  function snapshot(){
    const root=document.querySelector('.screen.active')||document;
    const inputs=[...root.querySelectorAll('input,textarea,select')].map((el,n)=>({name:el.name||el.id||('field-'+n),type:el.type||el.tagName.toLowerCase(),value:el.type==='checkbox'||el.type==='radio'?el.checked:el.value}));
    const selected=[...root.querySelectorAll('.selected,.matched,.answer-correct,.answer-wrong')].slice(0,80).map(el=>(el.dataset.value||el.dataset.letter||el.textContent||'').trim()).filter(Boolean);
    return {inputs,selected};
  }
  document.addEventListener('input',e=>{if(e.target.matches('input,textarea,select')) emit('response.drafted',{field:e.target.name||e.target.id||null,value:e.target.type==='password'?'[redacted]':e.target.value});},true);
  document.addEventListener('play',e=>{if(e.target.matches('audio,video'))emit('media.played',{src:e.target.currentSrc||e.target.getAttribute('src')||null});},true);
  document.addEventListener('ended',e=>{if(e.target.matches('audio,video'))emit('media.completed',{src:e.target.currentSrc||e.target.getAttribute('src')||null});},true);
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.matches('#submit,.submit,#roundSubmit')) setTimeout(()=>emit('response.submitted',{response:snapshot()}),0);
    if(b.matches('#check,[id^="check"],.item-check')) setTimeout(()=>emit('attempt.checked',{response:snapshot()}),0);
    if(b.matches('#next,#nextBtn,.navbtn,.item-tab,.round-next,.round-dot')) setTimeout(()=>emit('activity.viewed',{}),0);
  },true);
  window.addEventListener('load',()=>{emit('activity.viewed',{initial:true});});
  window.ELEAP={emit,snapshot,resourceId};
})();
