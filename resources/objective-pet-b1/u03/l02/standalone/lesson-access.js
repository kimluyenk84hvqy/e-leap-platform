(function(){
  const RESOURCE_ID='res-objective-pet-b1-u03-l02';
  const p=new URLSearchParams(location.search);
  const hosted=p.get('eleapHosted')==='1'||window.self!==window.top;
  if(hosted){document.documentElement.classList.add('hosted');document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('hosted'))}
  const app=()=>window.__ELEAP_APP__;
  let runtimeContext={};
  const eventId=()=>globalThis.crypto?.randomUUID?.()||`u32-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function responseForPlatform(response){
    if(!response)return null;
    if(Array.isArray(response.inputs))return response;
    if(Array.isArray(response.items))return {
      inputs:response.items.map((x,i)=>({name:x?.key||`Field ${i+1}`,type:x?.type||'text',value:x?.value??'',checked:x?.type==='checkbox'?Boolean(x?.value):undefined,display:x?.display??''})),
      raw:response
    };
    return response;
  }
  function postLearningEvent(eventType,state){
    if(!hosted||!state?.activityId)return;
    const response=responseForPlatform(state.response);
    const event={
      eventId:eventId(),eventType,occurredAt:new Date().toISOString(),resourceId:RESOURCE_ID,activityId:state.activityId,
      context:{...runtimeContext},
      payload:{response,assessment:state.assessment??null,grading:state.assessment??null,score:state.assessment?.score??null,correctCount:state.assessment?.correctCount??null,totalCount:state.assessment?.totalCount??null,answeredCount:state.assessment?.answeredCount??null,state:state.state??null,screenId:state.screenId??null,tab:state.tab??null}
    };
    try{window.parent?.postMessage({type:'e-leap:learning-event',event},location.origin)}catch(_){ }
  }
  window.addEventListener('message',ev=>{
    if(ev.source!==window.parent||ev.origin!==location.origin)return;
    if(ev.data?.type==='e-leap:runtime-context')runtimeContext={...(ev.data.context||{})};
  });
  window.addEventListener('eleap:lesson-state',ev=>{
    const d=ev.detail||{};
    if(d.reason==='response-change')postLearningEvent('response.drafted',d);
    else if(d.reason==='checked')postLearningEvent('attempt.checked',d);
    else if(d.reason==='submitted')postLearningEvent('response.submitted',d);
  });
  window.ELEAP_LESSON_HOST_API={
    apiVersion:'1.2',
    resourceId:RESOURCE_ID,
    setMode(mode){return app()?.setMode?.(mode)??mode},
    getMode(){return app()?.getMode?.()||document.body?.dataset?.mode||'lesson'},
    getActivityState(){return app()?.getActivityState?.()||null},
    command(action,payload){const r=app()?.command?.(action,payload);return r!==false&&r!=null},
    setScreen(target){return app()?.setScreen?.(target)??false},
    setActivity(activityId){return app()?.setActivity?.(activityId)??false},
    next(){return app()?.next?.()??false},
    previous(){return app()?.previous?.()??false},
    getResourceId(){return app()?.getResourceId?.()||this.resourceId},
    getScreenCount(){return app()?.getScreenCount?.()||0}
  };
  if(hosted){try{window.parent?.postMessage({type:'e-leap:request-runtime-context'},location.origin)}catch(_){ }}
})();
