import {UnifiedLessonControls as CoreUnifiedLessonControls} from './unified-lesson-controls-core-v2.js';

/**
 * Platform-level compatibility layer.
 * Keeps lesson-specific code thin by normalizing navigation, submit results and response shapes here.
 */
export class UnifiedLessonControls extends CoreUnifiedLessonControls{
  _currentScreenNumber(){
    try{
      const state=this._inspect?.()||null;
      const idx=Number(state?.screenIndex);
      if(Number.isFinite(idx)&&idx>=0)return idx+1;
    }catch(_){}
    return super._currentScreenNumber();
  }

  async _goToTeacherActivity(activityId){
    if(!activityId)return false;
    try{
      const current=this._currentActivityId?.();
      if(String(current||'')===String(activityId))return true;
    }catch(_){}
    return super._goToTeacherActivity(activityId);
  }

  async _goToTeacherScreen(target){
    if(!Number.isFinite(target)||target<1)return false;
    try{
      const current=this._currentScreenNumber?.();
      if(Number(current)===Number(target))return true;
      const state=this._inspect?.()||null;
      const idx=Number(state?.screenIndex);
      const api=this._api?.();
      if(Number.isFinite(idx)&&idx>=0&&api&&typeof api.setScreen==='function'){
        const ok=api.setScreen(target-1);
        if(ok!==false){
          await new Promise(r=>setTimeout(r,70));
          if(this._currentScreenNumber()===target)return true;
        }
      }
    }catch(_){}
    return super._goToTeacherScreen(target);
  }

  _command(action){
    try{
      const api=this._api?.();
      if(!api?.command)return false;
      const out=api.command(action);
      const ok=out===true || (!!out && typeof out==='object');
      if(ok && String(action||'').toLowerCase()==='submit' && out && typeof out==='object'){
        this._syncObjectSubmission(out).catch(()=>{});
      }
      return ok;
    }catch(_){return false}
  }

  async _syncObjectSubmission(state){
    if(this.role!=='student'||!this.sessionId||!state?.activityId)return false;
    let live={};
    try{live=JSON.parse(localStorage.getItem('e-leap-r4-live-context')||'{}')||{}}catch(_){}
    const a=state.assessment||{};
    const total=Number(a.totalCount),correct=Number(a.correctCount);
    const isCorrect=Number.isFinite(total)&&total>0&&Number.isFinite(correct)?correct===total:null;
    try{
      const r=await fetch('/api/research/events',{
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          clientEventId:`core-submit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          sessionId:this.sessionId,
          classId:live.classId||null,
          participantId:live.participantId||null,
          lessonId:this.resourceId,
          activityId:state.activityId,
          eventType:'response.submitted',
          answer:state.response??null,
          isCorrect,
          score:Number.isFinite(Number(a.score))?Number(a.score):null,
          occurredAt:new Date().toISOString(),
          metadata:{
            source:'platform-core-submit-bridge-v1',
            studentId:live.studentId||null,
            payload:{response:state.response??null,grading:a},
            context:{role:'student',sessionId:this.sessionId,participantId:live.participantId||null,classId:live.classId||null}
          }
        })
      });
      return r.ok;
    }catch(_){return false}
  }

  _answerText(value,depth=0){
    if(depth>5||value==null)return '';
    if(typeof value==='object'&&!Array.isArray(value)){
      const list=Array.isArray(value.fields)?value.fields:(Array.isArray(value.inputs)?value.inputs:null);
      if(list){
        const rows=list.map((v,i)=>{
          const raw=(v?.display || v?.value || v?.answer || v?.text || v);
          const t=super._answerText(raw,depth+1);
          return t?`${i+1}. ${t}`:'';
        }).filter(Boolean);
        const selected=Array.isArray(value.selected)?value.selected.map(v=>super._answerText(v,depth+1)).filter(Boolean):[];
        return [...rows,...selected.map((t,i)=>`${rows.length+i+1}. ${t}`)].join('\n');
      }
      if('input' in value){
        const t=super._answerText(value.input,depth+1);
        if(t)return t;
      }
      if('inputs' in value){
        const t=super._answerText(value.inputs,depth+1);
        if(t)return t;
      }
    }
    return super._answerText(value,depth);
  }
}
