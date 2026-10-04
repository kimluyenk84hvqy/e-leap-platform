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
  function enforce(){
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