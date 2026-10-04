/* E-LEAP R1.5 Hosted Lesson Access Enforcer — PREVIEW FOUNDATION
   Hosted lessons inherit role from E-LEAP. They may not self-escalate role.
   Direct standalone opening remains QA/demo behavior until production auth gates it. */
(function(){
  'use strict';
  const p=new URLSearchParams(location.search);
  if(p.get('eleapHosted')!=='1')return;
  const role=['guest','student','teacher','admin'].includes(p.get('eleapRole'))?p.get('eleapRole'):'guest';
  const requestedPresentation=p.get('eleapMode')==='presentation';
  const canTeach=['teacher','admin'].includes(role);
  const allowedLessonMode=requestedPresentation&&canTeach?'presentation':(canTeach?'teacher':'student');
  window.ELEAP_HOST_CONTEXT={hosted:true,role,lessonMode:allowedLessonMode,sessionId:p.get('sessionId')||null,classId:p.get('classId')||null,participantId:p.get('participantId')||null};
  document.documentElement.dataset.eleapHosted='1';document.documentElement.dataset.eleapRole=role;
  function blockEscalation(e){
    const t=e.target.closest?.('[data-u11-mode],[data-mode]');if(!t)return;
    const target=t.dataset.u11Mode||t.dataset.mode;
    if(target==='teacher'&&!canTeach){e.preventDefault();e.stopImmediatePropagation();return;}
    if(target==='presentation'&&!canTeach){e.preventDefault();e.stopImmediatePropagation();return;}
    if(role==='guest'&&target!=='student'){e.preventDefault();e.stopImmediatePropagation();}
  }
  document.addEventListener('click',blockEscalation,true);
  function enforce(){
    // U1.1 exposes a supported mode API.
    if(window.ELEAP_U11_UI?.setMode){try{window.ELEAP_U11_UI.setMode(allowedLessonMode)}catch(_){}}
    // U1.2 can be switched through its own registered button handler after app init.
    const u12=document.querySelector(`[data-mode="${allowedLessonMode}"]`);if(u12&&!u12.classList.contains('active')){try{u12.click()}catch(_){}}
    document.querySelectorAll('[data-u11-mode],[data-mode]').forEach(b=>{
      const m=b.dataset.u11Mode||b.dataset.mode;
      const permitted=canTeach?(m==='teacher'||m==='presentation'):(m==='student');
      b.hidden=!permitted;
      b.setAttribute('aria-hidden',permitted?'false':'true');
      if(!permitted)b.tabIndex=-1;
    });
    if(!canTeach){
      document.querySelectorAll('.u11-teacher-tools,.teacher-tools,#u11Reveal,#u11Responses,#u11Lucky,#u11Timer').forEach(el=>el.hidden=true);
      document.body.classList.remove('u11-teacher','presentation','u11-reveal-mode','presentation-reveal-active');
      document.body.classList.add('u11-student');
    }
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(enforce,0));
  window.addEventListener('load',()=>{enforce();setTimeout(enforce,100)});
  new MutationObserver(()=>enforce()).observe(document.documentElement,{subtree:true,childList:true});
})();
