/** E-LEAP Shared Lesson Engine v0.3 — R3B RC2 host/runtime stabilization */
export class ELeapLessonEngine {
  constructor({registryUrl='../../data/resources.json'}={}){this.registryUrl=registryUrl;this.registry=null;}
  async init(){
    const cacheKey='e-leap:resource-registry:v1.1';
    try{const r=await fetch(this.registryUrl,{cache:'no-store'});if(r.ok){this.registry=await r.json();try{sessionStorage.setItem(cacheKey,JSON.stringify(this.registry))}catch(_){}}else throw new Error(`Resource registry unavailable (${r.status});`);}catch(e){
      try{const cached=sessionStorage.getItem(cacheKey);if(cached)this.registry=JSON.parse(cached);}catch(_){ }
      if(!this.registry)throw e;
    }
    return this;
  }
  getResource(id){return this.registry?.resources?.find(r=>r.id===id)??null;}
  resolve(id){const r=this.getResource(id);if(!r)throw new Error(`Unknown resource: ${id}`);return {resource:r,lessonData:r.source?.path,standaloneUrl:r.source?.standaloneUrl};}
  mountCompatibilityFrame(id,frame,{context={},cacheBust=false}={}){
    const {resource,standaloneUrl}=this.resolve(id);if(!standaloneUrl)throw new Error('Standalone adapter URL missing.');
    const url=new URL('../../'+standaloneUrl,location.href),hostParams=new URLSearchParams(location.search);
    url.searchParams.set('eleapHosted','1');url.searchParams.set('eleapRole',context.role||'guest');url.searchParams.set('eleapMode',context.mode||'normal');
    const sessionId=context.sessionId||hostParams.get('sessionId');
    const classId=context.classId||hostParams.get('classId');
    const participantId=context.participantId||hostParams.get('participantId');
    const assignmentId=context.assignmentId||hostParams.get('assignmentId');
    if(sessionId)url.searchParams.set('sessionId',sessionId);if(classId)url.searchParams.set('classId',classId);if(participantId)url.searchParams.set('participantId',participantId);if(assignmentId)url.searchParams.set('assignmentId',assignmentId);if(cacheBust)url.searchParams.set('_retry',Date.now());
    frame.src=url.pathname+url.search;frame.title=`${resource.name} — E-LEAP lesson`;return resource;
  }
}
