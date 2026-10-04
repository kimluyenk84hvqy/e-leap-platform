/** E-LEAP Shared Lesson Engine v0.2 — R1.5 role propagation */
export class ELeapLessonEngine {
  constructor({registryUrl='../../data/resources.json'}={}){this.registryUrl=registryUrl;this.registry=null;}
  async init(){const r=await fetch(this.registryUrl,{cache:'no-store'});if(!r.ok)throw new Error(`Resource registry unavailable (${r.status})`);this.registry=await r.json();return this;}
  getResource(id){return this.registry?.resources?.find(r=>r.id===id)??null;}
  resolve(id){const r=this.getResource(id);if(!r)throw new Error(`Unknown resource: ${id}`);return {resource:r,lessonData:r.source?.path,standaloneUrl:r.source?.standaloneUrl};}
  mountCompatibilityFrame(id,frame,{context={}}={}){
    const {resource,standaloneUrl}=this.resolve(id);if(!standaloneUrl)throw new Error('Standalone adapter URL missing.');
    const url=new URL('../../'+standaloneUrl,location.href);
    url.searchParams.set('eleapHosted','1');
    url.searchParams.set('eleapRole',context.role||'guest');
    url.searchParams.set('eleapMode',context.mode||'normal');
    if(context.sessionId)url.searchParams.set('sessionId',context.sessionId);
    if(context.classId)url.searchParams.set('classId',context.classId);
    if(context.participantId)url.searchParams.set('participantId',context.participantId);
    frame.src=url.pathname+url.search;frame.title=`${resource.name} — E-LEAP lesson`;return resource;
  }
}
