/* Additional reusable functional slide layouts.
 * CONTENT SLOT contract: empty until textbook lesson mapping.
 * Unit lesson covers are separate from the institution-wide first cover.
 */
import {comboTypographyStyle} from './combo-typography.js';
export const FUNCTION_SLIDES={
 'lesson-part-cover':{
  label:'Lesson Cover',stage:'Lesson Cover',
  description:'A separate opening cover for each lesson part, with institution/faculty at the top',
  variants:['photo-right','photo-hero','photo-framed'],
  slots:['institution','faculty','lessonCode','lessonTitle','course','lecturer','subtitle','image']
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
  slots:['institution','faculty','closingMessage','lessonCode','subtitle','image']
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
/* Mapped content is still a local review draft, not a publication grant. */
export function mapFunctionalDraft(raw){
 const spec=FUNCTION_SLIDES[raw?.type];
 if(!spec||!spec.variants.includes(raw.variant))throw Error('Unknown functional template.');
 const required={ 'lesson-part-cover':['institution','faculty','lessonCode','lessonTitle','course'],consolidation:['title','recall','quickCheck','application','reflection'],'thank-you':['institution','faculty','closingMessage','lessonCode']}[raw.type];
 const values={};for(const k of spec.slots){if(k==='image')continue;const v=raw.values?.[k]??'';if(typeof v!=='string'||v.length>1000||required.includes(k)&&!v.trim())throw Error('Invalid functional slot: '+k);values[k]=v;}
 return {type:raw.type,variant:raw.variant,values,sourceMapped:true,publishStatus:'layout-review'};
}
function mappedFunctional(d,role){
 const v=d.values,txt=k=>safe(v[k]),img=typeof v.image==='string'&&/^\/api\/studio-media\?document=1&open=[0-9a-f-]{36}$/i.test(v.image)?'<img class="mapped-functional-photo" src="'+safe(v.image)+'" alt="'+txt('imageAlt')+'">':'';
 const identity='<header class="mapped-functional-identity">'+txt('institution')+'<br>'+txt('faculty')+'</header>';
 let body='';
 if(d.type==='lesson-part-cover')body=identity+'<div class="mapped-functional-cover"><div><p>'+txt('lessonCode')+'</p><h1>'+txt('lessonTitle')+'</h1><p>'+txt('course')+'</p>'+(v.lecturer?.trim()?'<p>'+txt('lecturer')+'</p>':'')+(v.subtitle?.trim()?'<p>'+txt('subtitle')+'</p>':'')+'</div>'+img+'</div>';
 if(d.type==='thank-you')body=identity+'<div class="mapped-functional-cover"><div><h1>'+txt('closingMessage')+'</h1><p>'+txt('lessonCode')+'</p><p>'+txt('subtitle')+'</p></div>'+img+'</div>';
 if(d.type==='consolidation')body='<h1>'+txt('title')+'</h1><div class="mapped-functional-review">'+[['Recall','recall'],['Quick check','quickCheck'],['Apply','application'],['Reflect','reflection']].map(([l,k])=>'<section><h2>'+l+'</h2><p>'+txt(k)+'</p></section>').join('')+'</div>';
 return '<div class="canvas-wrap"><section class="lesson-canvas mapped-functional mapped-'+safe(d.type)+' '+(role==='presentation'?'mapped-auditorium':'')+'">'+body+'</section></div>';
}
export function functionalSlideIssues(screen){
 return screen?.functionalDraft?['Functional template is design-only until content, image and runtime QA are approved. Publish blocked.']:[];
}
export function renderFunctionalSlide(screen,role='teacher'){
 const d=screen?.functionalDraft,spec=FUNCTION_SLIDES[d?.type];if(!spec)return '';
 if(d.sourceMapped===true&&['teacher','admin','presentation'].includes(role))return mappedFunctional(d,role);
 if(['student','guest','presentation'].includes(role))return '<div class="canvas-wrap"><section class="lesson-canvas method-draft-hidden">This lesson activity is not yet available.</section></div>';
 const v=d.values,slot=(k,label)=>'<div class="functional-slot" data-functional-slot="'+safe(k)+'"><b>'+safe(label)+'</b>'+(v[k]?'<span>'+safe(v[k])+'</span>':'<i>Reserved content space</i>')+'</div>';
 const identity='<div class="functional-identity">'+slot('institution','Institution')+slot('faculty','Faculty')+'</div>';
 let body='';
 if(d.type==='lesson-part-cover')body=identity+'<div class="functional-cover-body"><div>'+slot('lessonCode','Unit / Lesson code')+slot('lessonTitle','Lesson title')+slot('course','Course / Level')+'</div>'+slot('image','Real photo · large visual area')+'</div>';
 if(d.type==='consolidation'){
  const k=d.variant==='exit-ticket'?['quickCheck','reflection','application','recall']:d.variant==='retrieval-board'?['recall','application','quickCheck','reflection']:['recall','quickCheck','reflection','application'];
  body='<div class="functional-title">'+slot('title','Consolidation / Wrap-up')+'</div><div class="functional-review-grid">'+k.map(x=>slot(x,({recall:'Recall · Key ideas',quickCheck:'Quick Check · Retrieval',application:'Apply · Transfer',reflection:'Reflection · Exit ticket'})[x])).join('')+'</div><div class="functional-review-foot">'+slot('feedback','Feedback / verified key · Teacher-controlled')+'</div>';
 }
 if(d.type==='thank-you')body=identity+'<div class="functional-thank-body">'+slot('closingMessage','Thank You / Closing message')+slot('image','Real photograph / visual')+slot('lessonCode','Lesson / Unit reference')+'</div>';
 return '<div class="canvas-wrap"><section class="lesson-canvas functional-template functional-'+safe(d.type)+' variant-'+safe(d.variant)+'" style="'+comboTypographyStyle()+'">'+body+'</section></div>';
}
export function renderFunctionalSlideProps(screen){
 const d=screen.functionalDraft,spec=FUNCTION_SLIDES[d.type];
 if(d.sourceMapped===true){
  const labels={institution:'Institution',faculty:'Faculty',lessonCode:'Lesson code',lessonTitle:'Lesson title',course:'Course',lecturer:'Lecturer (optional)',subtitle:'Subtitle (optional)',title:'Title',recall:'Recall',quickCheck:'Quick check',application:'Apply',reflection:'Reflect',feedback:'Feedback',closingMessage:'Closing message'};
  const fields=spec.slots.filter(k=>k!=='image').map(k=>'<div class="studio-field"><label for="functional-'+k+'">'+safe(labels[k]||k)+'</label><textarea id="functional-'+k+'" data-functional-value="'+k+'" maxlength="1000" rows="2">'+safe(d.values[k])+'</textarea></div>').join('');
  const image=spec.slots.includes('image')?'<div class="studio-field"><label for="functional-image">Existing private image path</label><input id="functional-image" data-functional-value="image" value="'+safe(d.values.image)+'"></div><div class="studio-field"><label for="functional-imageAlt">Image description</label><input id="functional-imageAlt" data-functional-value="imageAlt" maxlength="1000" value="'+safe(d.values.imageAlt)+'"></div>':'';
  return '<section class="property-section"><h3>'+safe(spec.label)+' · Edit content</h3>'+fields+image+'<button type="button" class="studio-btn primary" data-functional-apply>Apply changes</button><p class="helper" data-functional-message role="status"></p></section>';
 }
 return '<section class="property-section"><h3>'+safe(spec.label)+'</h3><p class="helper">Template layout preview only. Activity content is mapped when the lesson is selected.</p><div class="functional-variant-options">'+spec.variants.map(v=>'<button type="button" class="studio-btn '+(d.variant===v?'primary':'')+'" data-functional-variant="'+safe(v)+'">'+safe(v.replace(/-/g,' '))+'</button>').join('')+'</div><p class="helper">Institution and faculty are fixed at the top. Lesson content, illustrations and final text stay empty until source mapping. Publish blocked.</p></section>';
}

/* Atomic text/verified-reference edit of an imported functional slide. All validation
 * happens before mutation; image identity is kept in sync with its source block. */
export function applyFunctionalContent(screen,values){
 const d=screen?.functionalDraft,spec=FUNCTION_SLIDES[d?.type];
 if(!d?.sourceMapped||!spec)throw Error('Open a mapped functional slide.');
 const next=mapFunctionalDraft({...d,values:{...d.values,...values}});
 const merged={...d.values,...next.values};
 const imageBlock=(screen.blocks||[]).find(b=>b.type==='image');
 if(spec.slots.includes('image')){
  const image=String(values.image??d.values.image??'').trim();
  const imageAlt=String(values.imageAlt??d.values.imageAlt??'').trim();
  if(image&&!/^\/api\/studio-media\?document=1&open=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(image))throw Error('Use an existing private Studio image path.');
  if(image!==String(d.values.image||'')&&(!image||!imageBlock))throw Error('Select an existing image reference; do not remove the source image block.');
  if(image&&(!imageAlt||imageAlt.length>1000))throw Error('Enter a valid image description.');
  merged.image=image;merged.imageAlt=imageAlt;
 }
 if(JSON.stringify(merged)===JSON.stringify(d.values))return false;
 screen.functionalDraft={...d,values:merged,publishStatus:'layout-review'};
 if(imageBlock&&spec.slots.includes('image')&&merged.image){imageBlock.content={...imageBlock.content,src:merged.image,assetId:new URLSearchParams(merged.image.split('?')[1]).get('open'),alt:merged.imageAlt};}
 return true;
}

/* Reuse owner-scoped, verified Preview private-media open endpoint. A one-byte
 * range is enough to verify active ownership and MIME without importing a new file. */
export async function verifyFunctionalImageReference(src,fetcher=globalThis.fetch){
 if(!/^\/api\/studio-media\?document=1&open=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(src||'')))throw Error('Use an existing private Studio image path.');
 const response=await fetcher(src,{cache:'no-store',credentials:'same-origin',headers:{Range:'bytes=0-0'}});
 const valid=response.ok&&String(response.headers.get('Content-Type')||'').startsWith('image/');
 try{await response.body?.cancel()}catch(_){}
 if(!valid)throw Error('Choose an active image in your private Media Library.');
 return true;
}
