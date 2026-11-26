export class ELeapAuthoringSaveService{
 constructor({endpoint='/api/authoring/lessons',fetcher=(...args)=>globalThis.fetch(...args)}={}){this.endpoint=endpoint;this.fetcher=fetcher;}
 localKey(id){return 'e-leap-authoring-v1.1:'+id;}
 saveLocal(lesson){const record={lesson,version:Number(lesson.version||1),savedAt:new Date().toISOString()};localStorage.setItem(this.localKey(lesson.id),JSON.stringify(record));return record;}
 loadLocal(id){try{return JSON.parse(localStorage.getItem(this.localKey(id))||'null')}catch{return null}}
 async request(url,options={}){
  const response=await this.fetcher(url,{credentials:'same-origin',cache:'no-store',...options});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.ok!==true){const error=new Error(body.error||'Studio server request failed');error.code=body.code||'SERVER_ERROR';error.status=response.status;throw error;}
  return body;
 }
 async listDrafts(){return (await this.request(this.endpoint)).drafts||[];}
 async loadDraft(id){if(!/^[a-zA-Z0-9_-]{4,120}$/.test(id))throw Error('Invalid lesson ID');return this.request(this.endpoint+'?id='+encodeURIComponent(id));}
 async saveDraft(lesson,{expectedRevision=0}={}){
  this.saveLocal(lesson);
  if(lesson?.resourceBank||lesson?.screens?.some(s=>s.sourceReviewDraft||s.resourceStage))return {mode:'local',restricted:true};
  const response=await this.request(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson,expectedRevision})});
  if(response.saved!==true||!Number.isSafeInteger(response.revision))throw Error('Server did not confirm saving the draft.');
  return {mode:'server',revision:response.revision,savedAt:response.savedAt};
 }
 async publishCourse({draftId,revision,shellId}){
  return this.request('/api/authoring/publish-course',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({draftId,revision,shellId})
  });
 }
 async publish(){throw new Error('Restricted or unverified lessons cannot be published; Studio Quality Gate and server publication are not yet accepted.');}
}