import {UnifiedLessonControls as CoreUnifiedLessonControls} from './unified-lesson-controls-core-v2.js';

/**
 * Platform-level compatibility layer.
 * Keeps lesson-specific code thin by normalizing navigation and response shapes here.
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

  async _goToTeacherScreen(target){
    if(!Number.isFinite(target)||target<1)return false;
    try{
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
