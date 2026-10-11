export class ELeapAuthoringSaveService{
  constructor({endpoint='/api/authoring/lessons'}={}){this.endpoint=endpoint;}
  localKey(id){return `e-leap-authoring-v1.1:${id}`;}
  saveLocal(lesson){const record={lesson,version:Number(lesson.version||1),savedAt:new Date().toISOString()};localStorage.setItem(this.localKey(lesson.id),JSON.stringify(record));return record;}
  loadLocal(id){try{return JSON.parse(localStorage.getItem(this.localKey(id))||'null')}catch{return null}}
  async saveDraft(lesson){const local=this.saveLocal(lesson);try{const r=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save-draft',lesson})});if(r.ok)return {mode:'server',...(await r.json())};}catch(_){}return {mode:'local',...local};}
  async publish(lesson){try{const r=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'publish',lesson})});if(r.ok)return {mode:'server',...(await r.json())};}catch(_){}return {mode:'staged-local',lessonId:lesson.id,version:Number(lesson.version||1)};}
}
