/* E-LEAP Hosted Lesson Access Enforcer — R3B RC3
   Hosted lessons inherit role/mode from the platform. Runtime context may change
   (Teacher <-> Presentation) without allowing role escalation. */
(function(){
  'use strict';
  const p=new URLSearchParams(location.search); if(p.get('eleapHosted')!=='1')return;
  const roles=['guest','student','teacher','admin'];
  let role=roles.includes(p.get('eleapRole'))?p.get('eleapRole'):'guest';
  let requestedPresentation=p.get('eleapMode')==='presentation';
  let canTeach=['teacher','admin'].includes(role);
  let allowedLessonMode=requestedPresentation&&canTeach?'presentation':(canTeach?'teacher':'student');
  function publishContext(extra={}){window.ELEAP_HOST_CONTEXT={hosted:true,role,lessonMode:allowedLessonMode,sessionId:extra.sessionId??p.get('sessionId')??null,classId:extra.classId??p.get('classId')??null,participantId:extra.participantId??p.get('participantId')??null};document.documentElement.dataset.eleapHosted='1';document.documentElement.dataset.eleapRole=role;document.documentElement.dataset.eleapMode=allowedLessonMode;}
  publishContext();
  function blockEscalation(e){const t=e.target.closest?.('[data-u11-mode],[data-mode]');if(!t)return;const target=t.dataset.u11Mode||t.dataset.mode;if(!canTeach&&target!=='student'){e.preventDefault();e.stopImmediatePropagation();}}
  document.addEventListener('click',blockEscalation,true);
  function hideLegacyControls(){
    let st=document.getElementById('eleapHostedControlStyle');
    if(!st){st=document.createElement('style');st.id='eleapHostedControlStyle';st.textContent=`html[data-eleap-hosted="1"] .u11-header-right,html[data-eleap-hosted="1"] header .modes,html[data-eleap-hosted="1"] .teacher-tools,html[data-eleap-hosted="1"] #exitPresentation,html[data-eleap-hosted="1"] .u11-actionbar{display:none!important}`;document.head.appendChild(st);}
  }
  function clickFirstVisible(selectors){
    const list=[...document.querySelectorAll(selectors)];
    const el=list.find(x=>{const cs=getComputedStyle(x);const r=x.getBoundingClientRect();return !x.disabled&&cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0});
    if(el){el.click();return true}return false;
  }
  function clickFirstExisting(selectors){const el=[...document.querySelectorAll(selectors)].find(x=>!x.disabled);if(el){el.click();return true}return false;}
  function currentActivityId(){
    const n=Number(document.body?.dataset?.screen)||1;
    try{return window.LESSON?.activities?.[Math.max(0,n-1)]?.id||('screen-'+n)}catch(_){return 'screen-'+n}
  }
  const attemptState=new Map();
  function attemptFor(id){if(!attemptState.has(id))attemptState.set(id,{attemptNo:1,submitCount:0});return attemptState.get(id)}
  function activityState(){
    let response=null,assessment=null,capabilities=null;
    try{response=window.ELEAP?.snapshot?.()||null}catch(_){}
    try{assessment=window.ELEAP?.getAssessmentResult?.()||null}catch(_){}
    try{capabilities=window.ELEAP?.getActivityCapabilities?.()||null}catch(_){}
    return {activityId:currentActivityId(),response,assessment,capabilities};
  }
  window.ELEAP_LESSON_HOST_API={
    setMode(mode){allowedLessonMode=(mode==='presentation'&&canTeach)?'presentation':(canTeach?'teacher':'student');publishContext();enforce();return true},
    getMode(){return allowedLessonMode},
    getActivityState(){return activityState()},
    command(action){
      if(action==='timer'){if(window.ELEAP_U11_UI?.openTimer){window.ELEAP_U11_UI.openTimer();return true}return clickFirstVisible('#timer,#u11Timer')}
      if(action==='responses'){if(window.ELEAP_U11_UI?.openResponses){window.ELEAP_U11_UI.openResponses();return true}return clickFirstVisible('#responses,#u11Responses')}
      if(action==='reveal'){if(window.ELEAP_U11_UI?.revealNext){window.ELEAP_U11_UI.revealNext();return true}return clickFirstExisting('#reveal,#u11Reveal')}
      if(action==='submit'){
        /* A top-level Submit saves the WHOLE current activity state.
           Item-level controls such as U1.2 #roundSubmit remain Check-like practice controls. */
        try{
          if(window.ELEAP?.snapshot && window.ELEAP?.emit){
            const state=activityState();
            const response=state.response;
            const hasInputs=Array.isArray(response?.inputs) && response.inputs.some(x=>x&&((x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!==''));
            const hasSelected=Array.isArray(response?.selected) && response.selected.length>0;
            if(!hasInputs && !hasSelected) return false;
            const a=attemptFor(state.activityId);a.submitCount++;
            const r=state.assessment||{};
            window.ELEAP.emit('response.submitted',{
              response,
              isCorrect:r?.isCorrect??null,
              score:r?.score??null,
              correctCount:r?.correctCount??null,
              answeredCount:r?.answeredCount??null,
              wrongCount:r?.wrongCount??null,
              unansweredCount:r?.unansweredCount??null,
              totalCount:r?.totalCount??null,
              grading:r,
              attemptNo:a.attemptNo,
              submitCount:a.submitCount,
              submissionType:'host-unified-submit'
            },r);
            return true;
          }
        }catch(_){}
        return false;
      }
      if(action==='check'){
        const n=Number(document.body?.dataset?.screen)||1;
        if(n===7 && window.ELEAP?.checkCurrentActivity){try{return window.ELEAP.checkCurrentActivity()===true}catch(_){}}
        if(clickFirstExisting('#check,#s9Check,#u11Check')) return true;
        return Boolean(window.ELEAP?.getAssessmentResult);
      }
      if(action==='reset'){
        if(clickFirstExisting('#reset,#s9Reset,#u11Reset,#resetMatch')) return true;
        if(window.ELEAP_U11_SLIDE9?.reset){try{window.ELEAP_U11_SLIDE9.reset();return true}catch(_){}}
        if(window.ELEAP_U11_UI?.resetScreen){try{window.ELEAP_U11_UI.resetScreen();return true}catch(_){}}
        return false;
      }
      return false;
    }
  };
  function enforce(){
    hideLegacyControls();
    // Use a programmatic mode API. Do not click hidden/disabled legacy buttons.
    if(window.ELEAP_U11_UI?.setMode){try{window.ELEAP_U11_UI.setMode(allowedLessonMode)}catch(_){}}
    if(window.ELEAP_LESSON_MODE_API?.setMode){try{window.ELEAP_LESSON_MODE_API.setMode(allowedLessonMode)}catch(_){}}
    document.querySelectorAll('[data-u11-mode],[data-mode]').forEach(b=>{b.hidden=true;b.disabled=true;b.setAttribute('aria-hidden','true');b.tabIndex=-1;});
    if(document.body){document.body.dataset.eleapRole=role;document.body.dataset.eleapHosted='1';}
    if(!canTeach){document.querySelectorAll('.u11-teacher-tools,.teacher-tools,#u11Reveal,#u11Responses,#u11Lucky,#u11Timer').forEach(el=>el.hidden=true);document.body.classList.remove('u11-teacher','teacher','presentation','u11-reveal-mode','presentation-reveal-active');document.body.classList.add('u11-student');}
  }
  window.addEventListener('message',(ev)=>{if(ev.origin!==location.origin)return;const msg=ev.data;if(!msg||msg.type!=='e-leap:runtime-context'||!msg.context)return;const c=msg.context;const nextRole=roles.includes(c.role)?c.role:role;if(nextRole!==role)return;requestedPresentation=c.mode==='presentation';canTeach=['teacher','admin'].includes(role);allowedLessonMode=requestedPresentation&&canTeach?'presentation':(canTeach?'teacher':'student');publishContext(c);enforce();});
  window.addEventListener('DOMContentLoaded',()=>setTimeout(enforce,0));
  window.addEventListener('load',()=>{enforce();setTimeout(enforce,100)});
  // Do not observe/re-enforce every DOM mutation: legacy lessons re-render often and that can create feedback loops/freeze.
  try{window.parent.postMessage({type:'e-leap:request-runtime-context'},location.origin)}catch(_){ }
})();