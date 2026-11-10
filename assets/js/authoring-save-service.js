export class ELeapAuthoringSaveService{
  constructor({endpoint='/api/authoring/lessons'}={}){this.endpoint=endpoint;}
  localKey(id){return `e-leap-authoring-v1.1:${id}`;}
  saveLocal(lesson){const record={lesson,version:Number(lesson.version||1),savedAt:new Date().toISOString()};localStorage.setItem(this.localKey(lesson.id),JSON.stringify(record));return record;}
  loadLocal(id){try{return JSON.parse(localStorage.getItem(this.localKey(id))||'null')}catch{return null}}
  async saveDraft(lesson){const local=this.saveLocal(lesson);try{const r=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save-draft',lesson})});if(r.ok)return {mode:'server',...(await r.json())};}catch(_){}return {mode:'local',...local};}
  async publish(lesson){const r=await fetch(this.endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'publish',lesson})});if(!r.ok){let detail='';try{detail=(await r.json())?.error||''}catch{}throw new Error(detail||('Server rejected Publish (HTTP '+r.status+'). No publication was confirmed.'));}const result=await r.json();if(!result||result.ok===false||result.published===false||!((result.published===true)||['published','approved'].includes(String(result.status||'').toLowerCase())))throw new Error('Publication not explicitly confirmed by server. A successful HTTP request is not proof of publication.');return {mode:'server',...result};}
}
