import {ELeapSubmissionService,LocalSubmissionStore} from './submissions.js';
import {normalizeAssessment,scoreText,detailText} from './grading-core.js';
import {inlineActivityControlsHTML} from './controls/control-shell.js';

export class ELeapNativeActivity{
  constructor({root,activity,events,resourceId,studentId=null,sessionId=null,context={}}){
    Object.assign(this,{root,activity,events,resourceId,studentId,sessionId,context});
    this.service=new ELeapSubmissionService({resourceId,studentId,sessionId,context,store:new LocalSubmissionStore(),events});
  }
  role(){return this.context?.role||'guest';}
  response(){
    const a=this.activity;
    if(a.type==='choose')return {kind:'choice',value:this.root.querySelector('input[name="answer"]:checked')?.value||''};
    if(a.type==='type')return {kind:'text',value:this.root.querySelector('textarea')?.value.trim()||''};
    if(a.type==='record')return {kind:'audio',value:this.root.dataset.audioRef||''};
    return {kind:'text',value:''};
  }
  valid(r){return !this.activity.submission?.required || (typeof r.value==='string'&&r.value.length>0);}
  grading(r){
    const key=this.activity.answerKey;
    if(key==null)return normalizeAssessment({},r);
    const expected=Array.isArray(key)?key:[key];
    const answered=String(r?.value??'').trim()?1:0;
    const correct=answered&&expected.map(x=>String(x).trim().toLowerCase()).includes(String(r.value).trim().toLowerCase())?1:0;
    return normalizeAssessment({correctCount:correct,answeredCount:answered,totalCount:1,score:correct,isCorrect:correct===1},r);
  }
  reset(){
    this.root.querySelectorAll('input[type="radio"],input[type="checkbox"]').forEach(x=>x.checked=false);
    this.root.querySelectorAll('textarea,input[type="text"]').forEach(x=>x.value='');
    delete this.root.dataset.audioRef;
    const rec=this.root.querySelector('[data-record-state]');if(rec)rec.textContent='No recording yet.';
    const status=this.root.querySelector('[data-status]');if(status){status.textContent=this.role()==='guest'?'Guest Practice · not saved':'Not submitted';status.title='';}
    const feedback=this.root.querySelector('[data-feedback]');if(feedback)feedback.textContent='';
  }
  async mount(){
    const a=this.activity,role=this.role(),guest=role==='guest',student=role==='student',teacher=role==='teacher'||role==='admin',presentation=this.context?.mode==='presentation';
    const objective=a.answerKey!=null;
    const controls=inlineActivityControlsHTML({
      role,
      presentation,
      capabilities:{check:objective,reset:true,reveal:objective,submit:student,score:objective}
    });
    this.root.innerHTML=`<section class="native-card"><div class="native-kicker">${a.type.toUpperCase()}</div><h2>${a.title||'Activity'}</h2><p>${a.prompt}</p><div class="native-input"></div>${controls}<div data-feedback></div></section>`;
    const input=this.root.querySelector('.native-input');
    if(a.type==='choose')input.innerHTML=a.options.map(o=>`<label class="native-option"><input type="radio" name="answer" value="${o.id}"> <span>${o.label}</span></label>`).join('');
    if(a.type==='type')input.innerHTML=`<textarea rows="5" placeholder="${a.placeholder||'Type your answer…'}"></textarea>`;
    if(a.type==='record')input.innerHTML=`<button type="button" data-record>Record response</button><small data-record-state>No recording yet. Development contract uses a local reference; production will use secure media upload.</small>`;
    if(a.type==='record')this.root.querySelector('[data-record]').onclick=()=>{this.root.dataset.audioRef=`local-audio-${Date.now()}`;this.root.querySelector('[data-record-state]').textContent='Recording reference ready.';};
    await this.events?.emit('activity.viewed',{activityId:a.id,studentId:this.studentId,sessionId:this.sessionId});
    this.root.querySelector('[data-check]')?.addEventListener('click',()=>{const r=this.response(),g=this.grading(r),status=this.root.querySelector('[data-status]');status.textContent=scoreText(g);status.title=detailText(g);});
    this.root.querySelector('[data-reset]')?.addEventListener('click',()=>this.reset());
    this.root.querySelector('[data-show-answer]')?.addEventListener('click',()=>{const key=a.answerKey,feedback=this.root.querySelector('[data-feedback]');if(key==null){if(feedback)feedback.textContent='No model answer on this activity.';return;}const vals=Array.isArray(key)?key:[key];if(feedback)feedback.textContent='Answer: '+vals.join(' / ');});
    this.root.querySelector('[data-exit-presentation]')?.addEventListener('click',()=>this.root.dispatchEvent(new CustomEvent('e-leap:exit-presentation',{bubbles:true})));
    this.root.querySelector('[data-submit]')?.addEventListener('click',async()=>{
      const r=this.response(),status=this.root.querySelector('[data-status]'),feedback=this.root.querySelector('[data-feedback]');
      if(!this.valid(r)){status.textContent='Complete the activity first';return;}
      const g=this.grading(r);
      const row=await this.service.submit(a,r);
      status.textContent=scoreText(g,{submitted:true});status.title=detailText(g);
      feedback.textContent=g.assessable?(g.isCorrect?'Correct':'Check the response and try again'):'Response saved for teacher review.';
      this.root.dispatchEvent(new CustomEvent('e-leap:submission',{bubbles:true,detail:{...row,grading:g}}));
    });
    return this;
  }
}
