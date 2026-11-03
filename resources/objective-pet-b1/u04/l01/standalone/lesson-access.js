(function(){
  const RESOURCE_ID='res-objective-pet-b1-u04-l01';
  const p=new URLSearchParams(location.search);
  const hosted=p.get('eleapHosted')==='1'||window.self!==window.top;
  if(hosted){
    document.documentElement.classList.add('hosted');
    document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('hosted'));
  }
  const app=()=>window.ELEAPApp;
  let runtimeContext={};
  const eventId=()=>globalThis.crypto?.randomUUID?.()||`u41-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function responseForPlatform(response){
    if(!response)return null;
    if(Array.isArray(response.inputs))return response;
    if(response && typeof response==='object')return {
      inputs:Object.entries(response).map(([name,value])=>({name,type:typeof value==='boolean'?'checkbox':'text',value,checked:typeof value==='boolean'?value:undefined})),
      raw:response
    };
    return response;
  }
  function postLearningEvent(eventType,state){
    if(!hosted||!state?.activityId)return;
    const a=state.assessment||{};
    const event={eventId:eventId(),eventType,occurredAt:new Date().toISOString(),resourceId:RESOURCE_ID,activityId:state.activityId,
      context:{...runtimeContext},payload:{response:responseForPlatform(state.response),assessment:state.assessment??null,grading:state.assessment??null,
      score:a.percentage??a.score??null,correctCount:a.correctCount??null,totalCount:a.totalCount??null,answeredCount:a.answeredCount??null,state:state.state??null,
      screenId:state.screen?.id??null,screenIndex:state.screen?.index??null,tab:state.screen?.tab??null}};
    try{window.parent?.postMessage({type:'e-leap:learning-event',event},location.origin)}catch(_){ }
  }
  window.addEventListener('message',ev=>{
    if(ev.source!==window.parent||ev.origin!==location.origin)return;
    const d=ev.data||{};
    if(d.type==='e-leap:runtime-context'){runtimeContext={...(d.context||{})};return;}
    if(d.type==='ELEAP_COMMAND'&&d.action)window.ELEAP_LESSON_HOST_API.command(d.action,d.payload);
    if(d.type==='ELEAP_SET_MODE')window.ELEAP_LESSON_HOST_API.setMode(d.mode);
    if(d.type==='ELEAP_SET_SCREEN')window.ELEAP_LESSON_HOST_API.setScreen(d.target);
    if(d.type==='ELEAP_SET_ACTIVITY')window.ELEAP_LESSON_HOST_API.setActivity(d.activityId);
  });
  window.ELEAP_LESSON_HOST_API={
    apiVersion:'1.2',resourceId:RESOURCE_ID,
    setMode(mode){const r=app()?.setMode?.(mode);return r!==false},
    getMode(){return app()?.getMode?.()||document.body?.dataset?.mode||'student'},
    getActivityState(){return app()?.getActivityState?.()||null},
    command(action,payload){
      const key=String(action||'').toLowerCase();
      const r=app()?.command?.(action,payload);
      if(r===false||r==null)return false;
      const state=app()?.getActivityState?.()||r;
      if(key==='check')postLearningEvent('attempt.checked',state);
      else if(key==='submit')postLearningEvent('response.submitted',state);
      return true;
    },
    setScreen(target){const r=app()?.setScreen?.(target);return r!==false&&r!=null},
    setActivity(activityId){const r=app()?.setActivity?.(activityId);return r!==false&&r!=null},
    next(){const r=app()?.command?.('next');return r!==false&&r!=null},
    previous(){const r=app()?.command?.('previous');return r!==false&&r!=null},
    getResourceId(){return RESOURCE_ID},
    getScreenCount(){return window.LESSON?.screens?.length||0}
  };
  window.ELEAPLesson=window.ELEAP_LESSON_HOST_API;
  window.addEventListener('ELEAP_APP_READY',()=>{
    try{window.parent?.postMessage({type:'ELEAP_LESSON_READY',resourceId:RESOURCE_ID},location.origin)}catch(_){ }
    if(hosted){try{window.parent?.postMessage({type:'e-leap:request-runtime-context'},location.origin)}catch(_){ }}
  });
})();
