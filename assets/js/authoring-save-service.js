export class ELeapAuthoringSaveService{
  constructor({endpoint='/api/authoring/lessons'}={}){
    this.endpoint=endpoint;
    this.revisions=new Map();
    this.pending=Promise.resolve();
  }
  localKey(id){return `e-leap-authoring-v1.1:${id}`;}
  saveLocal(lesson){
    const record={lesson,version:Number(lesson.version||1),savedAt:new Date().toISOString()};
    localStorage.setItem(this.localKey(lesson.id),JSON.stringify(record));
    return record;
  }
  loadLocal(id){try{return JSON.parse(localStorage.getItem(this.localKey(id))||'null')}catch{return null}}
  async loadServer(id){
    const response=await fetch(`${this.endpoint}?id=${encodeURIComponent(id)}`,{credentials:'same-origin',cache:'no-store'});
    if(response.status===404)return null;
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`Server load failed (${response.status})`);
    this.revisions.set(id,Number(data.revision||0));
    return data;
  }
  async send(action,lesson){
    const snapshot=JSON.parse(JSON.stringify(lesson));
    const run=async()=>{
      const expectedRevision=this.revisions.get(snapshot.id)||0;
      const response=await fetch(this.endpoint,{
        method:'POST',credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,lesson:snapshot,expectedRevision})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok){
        const err=new Error(data.error||`Server save failed (${response.status})`);
        err.code=data.code||`HTTP_${response.status}`;
        throw err;
      }
      this.revisions.set(snapshot.id,Number(data.revision));
      return {mode:'server',...data};
    };
    // Serialize writes to prevent autosave racing Publish or a later draft.
    const result=this.pending.then(run);
    this.pending=result.catch(()=>{});
    return result;
  }
  async saveDraft(lesson){
    let local=null;
    try{local=this.saveLocal(lesson)}catch(_){}
    try{return await this.send('save-draft',lesson)}
    catch(err){
      if(err.code==='REVISION_CONFLICT')return {mode:'conflict',error:err.message,localSaved:!!local};
      return {mode:local?'local':'error',error:err.message,localSaved:!!local};
    }
  }
  async publish(lesson){
    // Only request review. Publishing to Courses must be a separate, authorized workflow.
    try{return await this.send('request-publish',lesson)}
    catch(err){return {mode:'error',error:err.message};}
  }
}
