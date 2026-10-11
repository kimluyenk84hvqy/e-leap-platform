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

  function norm(v){return String(v??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();}
  function expectedMatch(value,expected){const got=norm(value);return String(expected??'').split('/').map(norm).filter(Boolean).includes(got);}
  function counts(total,answered,correct,source){
    total=Math.max(0,Number(total)||0);answered=Math.max(0,Math.min(total,Number(answered)||0));correct=Math.max(0,Math.min(answered,Number(correct)||0));
    return {isCorrect:total>0&&correct===total,score:total?correct/total:null,correctCount:correct,answeredCount:answered,wrongCount:Math.max(0,answered-correct),unansweredCount:Math.max(0,total-answered),totalCount:total,source};
  }
  function getAssessmentResult(){
    const root=document.querySelector('.screen.active')||document;
    const n=Number(root.dataset.screen||document.body.dataset.screen||0);

    // U1.1 objective activities: calculate against the FULL answer key so blanks stay unanswered/0 points.
    if(n===6){
      const rows=[...root.querySelectorAll('.speaker-match>div')].filter(r=>r.querySelector('.u11-speaker-input'));
      let answered=0,correct=0;
      rows.forEach(r=>{const input=r.querySelector('.u11-speaker-input');const v=input?.value||'';if(norm(v)!=='')answered++;if(norm(v)!==''&&expectedMatch(v,r.dataset.u11Answer||''))correct++;});
      if(rows.length)return counts(rows.length,answered,correct,'u11-answer-key');
    }
    if(n===7){
      const rows=[...root.querySelectorAll('.u11-phrasal-row')].filter(r=>r.querySelector('input,textarea'));
      let answered=0,correct=0;
      rows.forEach(r=>{const input=r.querySelector('input,textarea');const v=input?.value||'';if(norm(v)!=='')answered++;if(norm(v)!==''&&expectedMatch(v,r.dataset.u11Answer||''))correct++;});
      if(rows.length)return counts(rows.length,answered,correct,'u11-answer-key');
    }
    if(n===9){
      const step=root.dataset.ex7Step||'1';
      if(step==='1'){
        const items=[...root.querySelectorAll('.candidate-item')].filter(x=>x.querySelector('input[type="checkbox"]')&&x.querySelector('.item-check'));
        if(items.length){let correct=0;items.forEach(item=>{const box=item.querySelector('input[type="checkbox"]');const exp=item.querySelector('.item-check').dataset.heard==='yes';if(Boolean(box.checked)===exp)correct++;});return counts(items.length,items.length,correct,'u11-listening-selection');}
      }else{
        const total=root.querySelectorAll('.match-item').length||9;const matched=root.querySelectorAll('.match-item.matched').length;return counts(total,matched,matched,'u11-matching');
      }
    }
    if(n===10||n===11){
      const inputs=[...root.querySelectorAll('.u11-v4-inline-input[data-expected]')];let answered=0,correct=0;
      inputs.forEach(input=>{const v=input.value||'';if(norm(v)!=='')answered++;if(norm(v)!==''&&expectedMatch(v,input.dataset.expected||''))correct++;});
      if(inputs.length)return counts(inputs.length,answered,correct,'u11-answer-key');
    }

    // Legacy result is acceptable only when it includes a real denominator; a binary whole-screen flag is not a score contract.
    const stored=window.ELEAP_LAST_RESULT;
    if(stored && Number.isFinite(stored.totalCount) && stored.totalCount>0){
      return counts(stored.totalCount,stored.answeredCount??stored.totalCount,stored.correctCount??0,'lesson-engine');
    }
    return {isCorrect:null,score:null,correctCount:null,answeredCount:null,wrongCount:null,unansweredCount:null,totalCount:null,source:null};
  }

  function checkCurrentActivity(){
    const root=document.querySelector('.screen.active')||document;
    const n=Number(root.dataset.screen||document.body.dataset.screen||0);
    if(n===7){
      const rows=[...root.querySelectorAll('.u11-phrasal-row')].filter(r=>r.querySelector('input,textarea'));
      rows.forEach(r=>{const input=r.querySelector('input,textarea');const filled=norm(input?.value)!=='';const ok=filled&&expectedMatch(input.value,r.dataset.u11Answer||'');input?.classList.remove('answer-correct','answer-wrong');if(input)input.classList.add(ok?'answer-correct':'answer-wrong');});
      return rows.length>0;
    }
    return false;
  }

  function getActivityCapabilities(){
    const root=document.querySelector('.screen.active')||document;
    const n=Number(root.dataset.screen||document.body.dataset.screen||0);
    const autoCheck=[6,7,9,10,11].includes(n);
    const hasFields=!!root.querySelector('input,textarea,select');
    const hasChoice=!!root.querySelector('.poll-btn,.confidence button,.candidate-item,.match-item,.option');
    const hasOpenResponse=hasFields||hasChoice||[12,14,15].includes(n);
    const resettable=hasOpenResponse||[3,8,13].includes(n);
    return {check:autoCheck,reset:resettable,submit:hasOpenResponse,score:autoCheck,assessable:autoCheck};
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
  window.ELEAP={emit,snapshot,resourceId,getAssessmentResult,getActivityCapabilities,checkCurrentActivity};
})();
