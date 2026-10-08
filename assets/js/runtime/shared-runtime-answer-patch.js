import {ELeapSharedLessonRuntime} from './shared-lesson-runtime.js';

const originalWireActivity=ELeapSharedLessonRuntime.prototype.wireActivity;

function asText(activity){
  if(activity?.modelAnswer!=null) return String(activity.modelAnswer);
  const key=activity?.answerKey;
  if(Array.isArray(key)) return key.map(String).join(' / ');
  if(key&&typeof key==='object') return Object.entries(key).map(([k,v])=>`${k}: ${v}`).join(' · ');
  return key==null?'':String(key);
}

function revealInPlace(activity,host){
  let changed=false;
  const key=activity?.answerKey;
  const response=host?.querySelector('[data-response]');
  const text=asText(activity);
  if(response&&text){response.value=text;response.classList.add('eleap-answer-in-place');changed=true;}

  if(activity?.type==='matching'&&key&&typeof key==='object'){
    host.querySelectorAll('[data-match]').forEach(el=>{
      const v=key[el.dataset.match];
      if(v!=null){el.value=String(v);el.classList.add('eleap-answer-in-place');changed=true;}
    });
  }
  if(activity?.type==='categorising'&&key&&typeof key==='object'){
    host.querySelectorAll('[data-category]').forEach(el=>{
      const v=key[el.dataset.category];
      if(v!=null){el.value=String(v);el.classList.add('eleap-answer-in-place');changed=true;}
    });
  }
  if(activity?.type==='ordering'&&Array.isArray(key)){
    const list=host.querySelector('.eleap-order-list');
    if(list){
      key.forEach(id=>{const row=list.querySelector(`[data-order-id="${CSS.escape(String(id))}"]`);if(row)list.append(row);});
      list.querySelectorAll('[data-order-id]').forEach(x=>x.classList.add('eleap-answer-in-place'));
      changed=true;
    }
  }
  host?.querySelectorAll('[data-option-id]').forEach(label=>{
    const ids=Array.isArray(key)?key:[key];
    if(ids.filter(x=>x!=null).map(String).includes(String(label.dataset.optionId||''))){label.classList.add('eleap-answer-correct');changed=true;}
  });
  return changed;
}

ELeapSharedLessonRuntime.prototype.wireActivity=function(activity,host){
  originalWireActivity.call(this,activity,host);
  if(!host) return;

  const show=host.querySelector('[data-show-answer]');
  if(show&&!show.dataset.inPlacePatch){
    show.dataset.inPlacePatch='1';
    show.addEventListener('click',event=>{
      const allowed=this.context.role==='teacher'||this.context.role==='admin'||this.context.mode==='presentation';
      if(!allowed) return;
      if(revealInPlace(activity,host)){
        event.preventDefault();event.stopImmediatePropagation();
        const st=host.querySelector('[data-status]');if(st)st.textContent='Answer shown in the response box.';
      }
    },true);
  }

  const model=host.querySelector('[data-model-answer]');
  if(model&&!model.dataset.inPlacePatch){
    model.dataset.inPlacePatch='1';
    model.addEventListener('click',event=>{
      const response=host.querySelector('[data-response]');
      const answer=asText(activity);
      if(response&&answer){
        event.preventDefault();event.stopImmediatePropagation();
        response.value=answer;response.classList.add('eleap-answer-in-place');
        const st=host.querySelector('[data-status]');if(st)st.textContent='Model answer shown in the response box.';
      }
    },true);
  }
};
