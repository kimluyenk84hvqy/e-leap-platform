(function(){
  const p=new URLSearchParams(location.search);
  const hosted=p.get('eleapHosted')==='1'||window.self!==window.top;
  if(hosted){document.documentElement.classList.add('hosted');document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('hosted'))}
  const app=()=>window.__ELEAP_APP__;
  window.ELEAP_LESSON_HOST_API={
    apiVersion:'1.1',
    resourceId:'res-objective-pet-b1-u03-l02',
    setMode(mode){return app()?.setMode?.(mode)??mode},
    getMode(){return app()?.getMode?.()||document.body?.dataset?.mode||'lesson'},
    getActivityState(){return app()?.getActivityState?.()||null},
    command(action,payload){return app()?.command?.(action,payload)},
    setScreen(target){return app()?.setScreen?.(target)??false},
    setActivity(activityId){return app()?.setActivity?.(activityId)??false},
    next(){return app()?.next?.()??false},
    previous(){return app()?.previous?.()??false},
    getResourceId(){return app()?.getResourceId?.()||this.resourceId},
    getScreenCount(){return app()?.getScreenCount?.()||0}
  };
})();
