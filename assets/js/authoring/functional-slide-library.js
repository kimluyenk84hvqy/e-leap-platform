/* Additional reusable functional slide layouts.
 * CONTENT SLOT contract: empty until textbook lesson mapping.
 * Unit lesson covers are separate from the institution-wide first cover.
 */
import {comboTypographyStyle} from './combo-typography.js';
export const FUNCTION_SLIDES={
 'lesson-part-cover':{
  label:'Lesson Cover · Unit 12A / 12B',stage:'Lesson Cover',
  description:'A separate opening cover for each lesson part, with institution/faculty at the top',
  variants:['photo-right','photo-hero','photo-framed'],
  slots:['institution','faculty','lessonCode','lessonTitle','course','image']
 },
 'consolidation':{
  label:'Consolidation · Wrap-up',stage:'Consolidation',
  description:'Review learning, retrieve key ideas, quick check, reflection and transfer',
  variants:['three-panels','retrieval-board','exit-ticket'],
  slots:['title','recall','quickCheck','application','reflection','feedback']
 },
 'thank-you':{
  label:'Thank You · Lesson Closing',stage:'Thank You',
  description:'Minimal closing slide with institutional identity and visual focus',
  variants:['photo-hero','minimal-green','photo-framed'],
  slots:['institution','faculty','closingMessage','lessonCode','image']
 }
};
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>('fs-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
export function createFunctionalSlide(type){
 const spec=FUNCTION_SLIDES[type];if(!spec)return null;
 const values=Object.fromEntries(spec.slots.map(k=>[k,'']));
 // Identity is constant platform branding, not invented lesson text.
 if(['lesson-part-cover','thank-you'].includes(type)){
  values.institution='VIETNAM MILITARY MEDICAL UNIVERSITY';
  values.faculty='FACULTY OF FOREIGN LANGUAGES';
 }
 return {id:id(),stage:spec.stage,title:spec.label,templateId:'functional-slide',layout:'standard',instruction:'',blocks:[],functionalDraft:{type,variant:spec.variants[0],values,publishStatus:'layout-review',sourceMapped:false}};
}
export function functionalSlideIssues(screen){
 return screen?.functionalDraft?['Functional template is design-only until content, image and runtime QA are approved. Publish blocked.']:[];
}
export function renderFunctionalSlide(screen,role='teacher'){
 const d=screen?.functionalDraft,spec=FUNCTION_SLIDES[d?.type];if(!spec)return '';
 if(['student','guest','presentation'].includes(role))return '<div class="canvas-wrap"><section class="lesson-canvas method-draft-hidden">This lesson activity is not yet available.</section></div>';
 const v=d.values,slot=(k,label)=>'<div class="functional-slot" data-functional-slot="'+safe(k)+'"><b>'+safe(label)+'</b>'+(v[k]?'<span>'+safe(v[k])+'</span>':'<i>Reserved content space</i>')+'</div>';
 const identity='<div class="functional-identity">'+slot('institution','Institution')+slot('faculty','Faculty')+'</div>';
 let body='';
 if(d.type==='lesson-part-cover')body=identity+'<div class="functional-cover-body"><div>'+slot('lessonCode','Unit / Lesson code')+slot('lessonTitle','Lesson title')+slot('course','Course / Level')+'</div>'+slot('image','Real photo · large visual area')+'</div>';
 if(d.type==='consolidation'){
  const k=d.variant==='exit-ticket'?['quickCheck','reflection','application']:d.variant==='retrieval-board'?['recall','application','quickCheck','reflection']:['recall','quickCheck','reflection'];
  body='<div class="functional-title">'+slot('title','Consolidation / Wrap-up')+'</div><div class="functional-review-grid">'+k.map(x=>slot(x,({recall:'Recall · Key ideas',quickCheck:'Quick Check · Retrieval',application:'Apply · Transfer',reflection:'Reflection · Exit ticket'})[x])).join('')+'</div><div class="functional-review-foot">'+slot('feedback','Feedback / verified key · Teacher-controlled')+'</div>';
 }
 if(d.type==='thank-you')body=identity+'<div class="functional-thank-body">'+slot('closingMessage','Thank You / Closing message')+slot('image','Real photograph / visual')+slot('lessonCode','Lesson / Unit reference')+'</div>';
 return '<div class="canvas-wrap"><section class="lesson-canvas functional-template functional-'+safe(d.type)+' variant-'+safe(d.variant)+'" style="'+comboTypographyStyle()+'">'+body+'</section></div>';
}
export function renderFunctionalSlideProps(screen){
 const d=screen.functionalDraft,spec=FUNCTION_SLIDES[d.type];
 return '<section class="property-section"><h3>'+safe(spec.label)+'</h3><p class="helper">Template layout preview only. Activity content is mapped when the lesson is selected.</p><div class="functional-variant-options">'+spec.variants.map(v=>'<button type="button" class="studio-btn '+(d.variant===v?'primary':'')+'" data-functional-variant="'+safe(v)+'">'+safe(v.replace(/-/g,' '))+'</button>').join('')+'</div><p class="helper">Institution and faculty are fixed at the top. Lesson content, illustrations and final text stay empty until source mapping. Publish blocked.</p></section>';
}
