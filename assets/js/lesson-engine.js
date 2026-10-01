/** E-LEAP Shared Lesson Engine v0.1
 * One canonical resource may be opened inside E-LEAP or directly via standaloneUrl.
 * Legacy Golden References use an isolated compatibility adapter while their
 * approved interaction code is migrated activity-by-activity to native renderers.
 */
export class ELeapLessonEngine {
  constructor({registryUrl='../../data/resources.json'}={}){ this.registryUrl=registryUrl; this.registry=null; }
  async init(){ const r=await fetch(this.registryUrl,{cache:'no-store'}); if(!r.ok) throw new Error(`Resource registry unavailable (${r.status})`); this.registry=await r.json(); return this; }
  getResource(id){ return this.registry?.resources?.find(r=>r.id===id) ?? null; }
  resolve(id){
    const r=this.getResource(id); if(!r) throw new Error(`Unknown resource: ${id}`);
    return {resource:r, lessonData:r.source?.path, standaloneUrl:r.source?.standaloneUrl};
  }
  mountCompatibilityFrame(id, frame){
    const {resource,standaloneUrl}=this.resolve(id);
    if(!standaloneUrl) throw new Error('Standalone adapter URL missing.');
    frame.src='../../'+standaloneUrl;
    frame.title=`${resource.name} — E-LEAP lesson`;
    return resource;
  }
}
