/* U3.1 activity contract hotfix — scoped marking + platform submit bridge + activity follow */
(function(){
  'use strict';
  const RESOURCE_ID='res-objective-pet-b1-u03-l01';
  const p=new URLSearchParams(location.search);
  if(p.get('eleapHosted')!=='1')return;

  const role=p.get('eleapRole')||'guest';
  const uid=()=>globalThis.crypto?.randomUUID?.()||`u31-submit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let followPoll=null;
  let applyingRemoteActivity=false;

  function currentScreenNumber(){
    const n=Number(document.body?.dataset?.screen)||parseInt(document.getElementById('screenCounter')?.textContent||'',10);
    return Number.isFinite(n)&&n>0?n:1;
  }

  function scope(){
    const stage=document.getElementById('stage')||document;
    const activeTab=[...stage.querySelectorAll('.tab-panel.active')].find(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
    if(activeTab)return activeTab;
    const activeScreen=[...stage.querySelectorAll('.screen')].find(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
    return activeScreen||stage;
  }

  function actionButton(action){
    const root=scope();
    return [...root.querySelectorAll(`[data-action="${action}"]`)].find(b=>!b.disabled)||null;
  }

  function activityId(){
    const root=scope();
    const explicit=root.querySelector('.controls[data-controls]')?.dataset?.controls;
    if(explicit)return explicit;
    const tabKey=root.dataset?.tabPanel;
    if(tabKey)return `screen-${currentScreenNumber()}-${tabKey}`;
    return `screen-${currentScreenNumber()}`;
  }

  function snapshot(){
    const root=scope();
    const inputs=[...root.querySelectorAll('input,textarea,select')].map((el,n)=>({
      name:el.name||el.id||el.dataset?.dialogue||el.dataset?.jobAction||`field-${n}`,
      type:el.type||el.tagName.toLowerCase(),
      value:(el.type==='checkbox'||el.type==='radio')?Boolean(el.checked):el.value
    }));
    const selected=[...root.querySelectorAll('.selected,.placed,.answer-option,.revealed-zone')]
      .slice(0,120)
      .map(el=>(el.dataset?.value||el.dataset?.target||el.textContent||'').trim())
      .filter(Boolean);
    const zones=[...root.querySelectorAll('[data-zone]')].map((el,n)=>({
      zone:el.dataset.zone||`zone-${n}`,
      value:(el.dataset.value||el.querySelector('[data-target]')?.dataset?.target||el.textContent||'').trim()
    })).filter(x=>x.value);
    return {inputs,selected,zones};
  }

  function hasResponse(state=snapshot()){
    return state.inputs.some(x=>(x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!=='')||state.selected.length>0||state.zones.length>0;
  }

  function assessment(){
    const root=scope();
    const scoreBtn=actionButton('score');
    if(!scoreBtn)return null;
    const statusText=[...root.querySelectorAll('.status')].map(x=>x.textContent||'').join(' ');
    const m=statusText.match(/(\d+)\s*\/\s*(\d+)/);
    if(!m)return null;
    const correct=Number(m[1]),total=Number(m[2]);
    if(!total)return null;
    const response=snapshot();
    const answeredInputs=response.inputs.filter(x=>(x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!=='').length;
    const answered=Math.min(total,answeredInputs+response.selected.length+response.zones.length);
    return {
      isCorrect:correct===total,
      score:correct/total,
      correctCount:correct,
      answeredCount:answered,
      wrongCount:Math.max(0,answered-correct),
      unansweredCount:Math.max(0,total-answered),
      totalCount:total,
      source:'u3.1-activity-scoped-hotfix'
    };
  }

  function capabilities(){
    const assessable=Boolean(actionButton('score'));
    return {
      check:Boolean(actionButton('check')),
      reset:Boolean(actionButton('reset')),
      reveal:Boolean(actionButton('show')),
      submit:role==='student',
      score:assessable,
      assessable
    };
  }

  function clickAction(action){
    const btn=actionButton(action);
    if(!btn)return false;
    btn.click();
    return true;
  }

  function armReveal(){
    const btn=actionButton('show');
    if(!btn)return false;
    btn.click();
    const armed=scope().querySelector('.reveal-mode');
    document.body.classList.toggle('platform-reveal-armed',Boolean(armed));
    return true;
  }

  function emitSubmit(){
    const response=snapshot();
    if(!hasResponse(response))return false;
    const grading=assessment();
    const evt={
      eventId:uid(),
      eventType:'response.submitted',
      occurredAt:new Date().toISOString(),
      resourceId:RESOURCE_ID,
      activityId:activityId(),
      context:{
        role:'student',
        sessionId:p.get('sessionId')||null,
        classId:p.get('classId')||null,
        participantId:p.get('participantId')||null,
        joinCode:p.get('joinCode')||null
      },
      payload:{
        response,
        score:grading?.score??null,
        isCorrect:grading?.isCorrect??null,
        correctCount:grading?.correctCount??null,
        answeredCount:grading?.answeredCount??null,
        wrongCount:grading?.wrongCount??null,
        unansweredCount:grading?.unansweredCount??null,
        totalCount:grading?.totalCount??null,
        source:'u3.1-activity-submit-hotfix'
      }
    };
    try{window.parent.postMessage({type:'e-leap:learning-event',event:evt},location.origin);}catch(_){return false;}
    return true;
  }

  function tabKeyFromActivity(targetActivityId){
    if(!targetActivityId)return null;
    const m=String(targetActivityId).match(/^screen-(\d+)-(.+)$/);
    if(!m)return null;
    if(Number(m[1])!==currentScreenNumber())return null;
    return m[2]||null;
  }

  function applyRemoteActivity(targetActivityId){
    const key=tabKeyFromActivity(targetActivityId);
    if(!key||activityId()===targetActivityId)return false;
    const panel=document.querySelector(`[data-tab-panel="${CSS.escape(key)}"]`);
    if(!panel)return false;
    const cut=key.lastIndexOf('-');
    if(cut<1)return false;
    const groupId=key.slice(0,cut);
    const tabNo=key.slice(cut+1);
    const tabs=document.querySelector(`[data-tabs="${CSS.escape(groupId)}"]`);
    const btn=tabs?.querySelector(`button[data-tab="${CSS.escape(tabNo)}"]`);
    if(!btn)return false;
    applyingRemoteActivity=true;
    try{btn.click();return true;}finally{setTimeout(()=>{applyingRemoteActivity=false;},80);}
  }

  async function pollTeacherActivity(){
    if(role!=='student'||applyingRemoteActivity)return;
    const sessionId=p.get('sessionId');
    if(!sessionId)return;
    try{
      const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(sessionId)}&control=1`,{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      const targetActivity=d?.control?.activityId||null;
      if(targetActivity)applyRemoteActivity(targetActivity);
    }catch(_){}
  }

  function installActivityFollow(){
    if(role!=='student'||!p.get('sessionId')||followPoll)return;
    pollTeacherActivity();
    followPoll=setInterval(pollTeacherActivity,650);
    addEventListener('pagehide',()=>{clearInterval(followPoll);followPoll=null;},{once:true});
  }

  function install(){
    const api=window.ELEAP_LESSON_HOST_API;
    if(!api)return false;
    api.getActivityState=function(){
      return {
        screenNumber:currentScreenNumber(),
        activityId:activityId(),
        response:snapshot(),
        assessment:assessment(),
        capabilities:capabilities()
      };
    };
    api.command=function(action){
      if(action==='check')return clickAction('check');
      if(action==='reset'){document.body.classList.remove('platform-reveal-armed');return clickAction('reset');}
      if(action==='reveal')return ['teacher','admin'].includes(role)?armReveal():false;
      if(action==='submit'){
        if(role!=='student')return false;
        const native=actionButton('submit');
        if(native)native.click();
        return emitSubmit();
      }
      return false;
    };
    installActivityFollow();
    window.ELEAP_U31_ACTIVITY_HOTFIX={installed:true,activityId:activityId(),activityFollow:role==='student',at:Date.now()};
    return true;
  }

  if(!install()){
    let tries=0;
    const t=setInterval(()=>{if(install()||++tries>40)clearInterval(t);},100);
  }
})();