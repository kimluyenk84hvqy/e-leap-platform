/* E-LEAP 29 method template integration – AUTHORING REVIEW ONLY.
 * No textbook answers, source segments, transcript, model or instructions are
 * inserted when a teacher chooses a method. All source data is server-side
 * authoring responsibility; unpublished draft is never learner-accessible.
 */
import {METHOD_COMBOS} from './method-combo-catalog.js';
import {hybridStepContract,evaluateHybridCombo} from './hybrid-pedagogy-contract.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>('method-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
const slotsFor=s=>[...new Set(hybridStepContract(s).requiredSlots)];
const noStudentContent=role=>['student','guest','presentation'].includes(String(role||'').toLowerCase());
export function createMethodTemplateScreen(id){
 const method=METHOD_COMBOS[id];
 if(!method)return null;
 const qa=evaluateHybridCombo(method);
 if(!qa.ok)return null;
 return {
  id:uid(),stage:method.group,title:method.label,templateId:'method-template',
  layout:'standard',instruction:'',teacherNotes:'',blocks:[],
  methodDraft:{
   methodId:id,schemaVersion:1,activeStep:method.steps[0].id,
   publishStatus:'template-only',sourceMapped:false,
   steps:method.steps.map(step=>({
    id:step.id,label:step.label,mode:step.mode,sourceSlot:step.slot,
    pedagogicalPurpose:hybridStepContract(step).pedagogicalPurpose,
    placeholders:slotsFor(step),values:{},sourceRef:null
   }))
  }
 };
}
export function selectedMethodStep(screen){
 const m=screen?.methodDraft;
 return m?.steps?.find(s=>s.id===m.activeStep)||m?.steps?.[0]||null;
}
export function changeMethodStep(screen,id){
 if(!screen?.methodDraft?.steps?.some(s=>s.id===id))return false;
 screen.methodDraft.activeStep=id;
 return true;
}
export function methodTemplateIssues(screen){
 const draft=screen?.methodDraft;
 if(!draft)return [];
 const issues=[];
 if(!METHOD_COMBOS[draft.methodId])issues.push('Method is not available in the approved catalog.');
 if(!Array.isArray(draft.steps)||!draft.steps.length)issues.push('Method steps missing.');
 if(draft.publishStatus!=='published-verified'||draft.sourceMapped!==true)
  issues.push('Method template has no verified textbook content or runtime acceptance; do not publish.');
 // Review-only placeholders cannot be mistaken for actual lesson content.
 if(draft.steps?.some(s=>Object.keys(s.values||{}).length>0)&&draft.sourceMapped!==true)
  issues.push('Unreviewed slot content exists without textbook mapping approval.');
 return issues;
}
export function renderMethodTemplateCanvas(screen,role='teacher'){
 const draft=screen.methodDraft,step=selectedMethodStep(screen),student=noStudentContent(role);
 if(student)return '<div class="canvas-wrap"><section class="lesson-canvas method-draft-hidden"><p class="studio-no-content">This lesson activity is not yet available.</p></section></div>';
 if(!step)return '';
 const mk=(k,label)=>'<div class="method-slot"><strong>'+esc(label)+'</strong><span>Reserved content space</span></div>';
 const slots=step.placeholders||[];
 const labels={instruction:'Instruction',guidedSteps:'Guided Steps',workedExample:'Worked Example',sentenceSupport:'Sentence Support',sourceMaterial:'Text / Audio / Image',learnerResponse:'Individual Response',peerTask:'Pair / Group Task',reportShare:'Share / Report',feedback:'Feedback / Check',answerKey:'Teacher Answer',evidence:'Evidence',why:'Why'};
 const learnerSlots=slots.filter(x=>!['answerKey','evidence','why'].includes(x));
 const teacherSlots=slots.filter(x=>['answerKey','evidence','why'].includes(x));
 return '<div class="canvas-wrap"><section class="lesson-canvas method-template-canvas">'+
  '<div class="method-draft-heading"><small>'+esc(screen.stage)+' · TEMPLATE STRUCTURE · NOT PUBLISHED</small><h1>'+esc(screen.title)+'</h1></div>'+
  '<nav class="combo-step-nav">'+draft.steps.map((s,i)=>'<button type="button" data-method-draft-step="'+esc(s.id)+'" class="combo-step-button '+(s.id===step.id?'active':'')+'"><small>'+String(i+1)+'</small>'+esc(s.label)+'</button>').join('')+'</nav>'+
  '<div class="method-draft-detail"><strong>'+esc(step.label)+' · '+esc(step.mode)+'</strong><p>'+esc(step.pedagogicalPurpose)+'</p></div>'+
  '<div class="method-slot-grid">'+learnerSlots.map(k=>mk(k,labels[k]||k)).join('')+'</div>'+
  (teacherSlots.length?'<div class="method-teacher-reserved"><b>Teacher-only slots – not exposed to learners</b><div>'+teacherSlots.map(k=>mk(k,labels[k]||k)).join('')+'</div></div>':'')+
  '</section></div>';
}
export function renderMethodTemplateProperties(screen){
 const m=screen.methodDraft,step=selectedMethodStep(screen);
 if(!m)return '';
 const spec=METHOD_COMBOS[m.methodId];
 return '<section class="property-section"><h3>Teaching Combo · Structure Review</h3>'+
  '<p class="helper">'+esc(spec?.description||'')+'</p>'+
  '<p class="helper">This is an empty authoring template. Every slot is populated later from the selected textbook activity; no answers or learner instructions are generated now.</p>'+
  '<p><b>Current node:</b> '+esc(step?.label||'')+' · '+esc(step?.mode||'')+'</p>'+
  '<p><b>Original source slot:</b> '+esc(step?.sourceSlot||'')+'</p>'+
  '<p><b>Status:</b> Awaiting source mapping and runtime QA; Publish blocked.</p></section>';
}
