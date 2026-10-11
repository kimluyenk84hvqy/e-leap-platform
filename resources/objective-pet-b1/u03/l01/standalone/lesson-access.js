/* E-LEAP U3.1 hosted access adapter.
   The platform owns role-aware controls; the lesson owns content, activity state,
   answer keys and Next/Previous navigation. Standalone QA controls remain available
   only when the lesson is opened outside the platform host. */
(function(){
  'use strict';
  const p=new URLSearchParams(location.search);
  if(p.get('eleapHosted')!=='1')return;

  const allowedRoles=['guest','student','teacher','admin'];
  let hostRole=allowedRoles.includes(p.get('eleapRole'))?p.get('eleapRole'):'guest';
  let canTeach=['teacher','admin'].includes(hostRole);
  let hostMode=(p.get('eleapMode')==='presentation'&&canTeach)?'presentation':(canTeach?'teacher':'student');

  function publishContext(extra={}){
    window.ELEAP_HOST_CONTEXT={
      hosted:true,
      role:hostRole,
      lessonMode:hostMode,
      sessionId:extra.sessionId??p.get('sessionId')??null,
      classId:extra.classId??p.get('classId')??null,
      participantId:extra.participantId??p.get('participantId')??null,
      joinCode:extra.joinCode??p.get('joinCode')??null
    };
    document.documentElement.dataset.eleapHosted='1';
    document.documentElement.dataset.eleapRole=hostRole;
    document.documentElement.dataset.eleapMode=hostMode;
  }

  function installHostedStyle(){
    if(document.getElementById('eleapU31HostedStyle'))return;
    const s=document.createElement('style');
    s.id='eleapU31HostedStyle';
    s.textContent=`
      html[data-eleap-hosted="1"] .top-actions .role-label,
      html[data-eleap-hosted="1"] #viewBtn,
      html[data-eleap-hosted="1"] #qrBtn,
      html[data-eleap-hosted="1"] #responsesBtn,
      html[data-eleap-hosted="1"] .controls,
      html[data-eleap-hosted="1"] [data-hero-action],
      html[data-eleap-hosted="1"] .mini-show,
      html[data-eleap-hosted="1"] #qrPanel,
      html[data-eleap-hosted="1"] #responsesBoard,
      html[data-eleap-hosted="1"] #timerPanel,
      html[data-eleap-hosted="1"] #platformPanel {display:none!important;}
      html[data-eleap-hosted="1"] .topbar{padding-right:18px;}
      html[data-eleap-hosted="1"] .top-actions{gap:8px;}
      html[data-eleap-hosted="1"] body.platform-reveal-armed input[data-answer],
      html[data-eleap-hosted="1"] body.platform-reveal-armed textarea[data-answer],
      html[data-eleap-hosted="1"] body.platform-reveal-armed select[data-answer],
      html[data-eleap-hosted="1"] body.platform-reveal-armed [data-dialogue],
      html[data-eleap-hosted="1"] body.platform-reveal-armed .answer-slot,
      html[data-eleap-hosted="1"] body.platform-reveal-armed .dropzone[data-zone],
      html[data-eleap-hosted="1"] body.platform-reveal-armed .elicit-card {outline:2px solid rgba(111,175,104,.46);outline-offset:3px;cursor:pointer;}
    `;
    document.head.appendChild(s);
  }

  function setLessonRole(){
    const next=hostMode==='presentation'?'presentation':(canTeach?hostRole:'student');
    try{
      if(typeof role!=='undefined')role=next;
      const sel=document.getElementById('roleSelect');if(sel)sel.value=next;
      if(typeof render==='function')render();
    }catch(_){ }
    document.body.dataset.eleapRole=hostRole;
    document.body.dataset.eleapHosted='1';
  }

  function visibleActivityRoot(){return document.getElementById('stage')||document;}
  function activityMeta(){
    try{
      if(typeof getActivity==='function')return getActivity();
    }catch(_){ }
    return {id:'screen-'+(Number(document.body.dataset.screen)||1),screenId:null,type:null};
  }
  function actionButton(action){
    const root=visibleActivityRoot();
    return [...root.querySelectorAll(`[data-action="${action}"]`)].find(b=>!b.disabled)||null;
  }
  function snapshot(){
    const root=visibleActivityRoot();
    const inputs=[...root.querySelectorAll('input,textarea,select')].map((el,n)=>({
      name:el.name||el.id||el.dataset?.dialogue||`field-${n}`,
      type:el.type||el.tagName.toLowerCase(),
      value:(el.type==='checkbox'||el.type==='radio')?Boolean(el.checked):el.value
    }));
    const selected=[...root.querySelectorAll('.selected,.placed,.answer-option,.revealed-zone')]
      .slice(0,120).map(el=>(el.dataset?.value||el.dataset?.target||el.textContent||'').trim()).filter(Boolean);
    return {inputs,selected};
  }
  function hasResponse(state=snapshot()){
    return state.inputs.some(x=>(x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!=='')||state.selected.length>0;
  }
  function capabilities(){
    return {
      check:Boolean(actionButton('check')),
      reset:Boolean(actionButton('reset')),
      reveal:Boolean(actionButton('show')),
      submit:Boolean(actionButton('submit')),
      score:Boolean(actionButton('score')),
      assessable:Boolean(actionButton('score'))
    };
  }
  function assessment(){
    const root=visibleActivityRoot();
    const scoreBtn=actionButton('score');
    if(!scoreBtn)return null;
    const statusText=[...root.querySelectorAll('.status')].map(x=>x.textContent||'').join(' ');
    const m=statusText.match(/(\d+)\s*\/\s*(\d+)/);
    if(!m)return null;
    const correct=Number(m[1]),total=Number(m[2]);
    if(!total)return null;
    const response=snapshot();
    const answered=response.inputs.filter(x=>(x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!=='').length||total;
    return {isCorrect:correct===total,score:correct/total,correctCount:correct,answeredCount:Math.min(answered,total),wrongCount:Math.max(0,Math.min(answered,total)-correct),unansweredCount:Math.max(0,total-answered),totalCount:total,source:'u3.1-lesson-engine'};
  }
  function armReveal(){
    const btn=actionButton('show');
    if(!btn)return false;
    btn.click();
    const armed=visibleActivityRoot().querySelector('.reveal-mode');
    document.body.classList.toggle('platform-reveal-armed',Boolean(armed));
    return true;
  }
  function clickAction(action){const b=actionButton(action);if(!b)return false;b.click();return true;}

  window.ELEAP_LESSON_HOST_API={
    setMode(mode){
      hostMode=(mode==='presentation'&&canTeach)?'presentation':(canTeach?'teacher':'student');
      publishContext();setLessonRole();
      return true;
    },
    getMode(){return hostMode;},
    getActivityState(){const a=activityMeta();return {activityId:a.screenId||a.id||'u3l31',response:snapshot(),assessment:assessment(),capabilities:capabilities()};},
    command(action){
      if(action==='check')return clickAction('check');
      if(action==='reset'){document.body.classList.remove('platform-reveal-armed');return clickAction('reset');}
      if(action==='reveal')return canTeach?armReveal():false;
      if(action==='submit')return hostRole==='student'&&hasResponse()?clickAction('submit'):false;
      return false;
    }
  };

  function enforce(){installHostedStyle();publishContext();setLessonRole();}
  window.addEventListener('message',(ev)=>{
    if(ev.origin!==location.origin)return;
    const msg=ev.data;if(!msg||msg.type!=='e-leap:runtime-context'||!msg.context)return;
    if(msg.context.role&&msg.context.role!==hostRole)return;
    hostMode=(msg.context.mode==='presentation'&&canTeach)?'presentation':(canTeach?'teacher':'student');
    publishContext(msg.context);setLessonRole();
  });
  document.addEventListener('click',e=>{
    if(!document.body.classList.contains('platform-reveal-armed'))return;
    const target=e.target.closest('input[data-answer],textarea[data-answer],select[data-answer],[data-dialogue],.answer-slot,.dropzone[data-zone],.elicit-card');
    if(!target||!canTeach)return;
    const scope=target.closest('.tab-panel')||target.closest('.screen');
    scope?.classList.add('reveal-mode');
  },true);
  window.addEventListener('DOMContentLoaded',()=>setTimeout(enforce,0));
  window.addEventListener('load',()=>{enforce();setTimeout(enforce,120)});
  enforce();
  try{window.parent.postMessage({type:'e-leap:request-runtime-context'},location.origin)}catch(_){ }
})();