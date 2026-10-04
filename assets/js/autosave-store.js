export class ELeapAutosaveStore{
  constructor({namespace='e-leap-autosave-v1'}={}){this.namespace=namespace;}
  key({lessonId,activityId,studentId,sessionId}){
    const who=studentId||sessionId||'anonymous';
    return `${this.namespace}:${lessonId}:${activityId}:${who}`;
  }
  load(meta){try{return JSON.parse(localStorage.getItem(this.key(meta))||'null');}catch{return null;}}
  save(meta,value){try{localStorage.setItem(this.key(meta),JSON.stringify({value,savedAt:new Date().toISOString()}));return true;}catch{return false;}}
  clear(meta){try{localStorage.removeItem(this.key(meta));return true;}catch{return false;}}
}
