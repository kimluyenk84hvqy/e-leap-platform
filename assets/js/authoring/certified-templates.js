/* E-LEAP Studio certified template foundation v1.
 * Slots, fixed design, interaction rules, answer policies and quality contract.
 * No textbook content is silently invented. Variants retain the same data.
 */
const field=(label,kind='text',limit=200)=>({label,kind,limit});
export const CERTIFIED_TEMPLATES={
 cover:{
  label:'Institutional Cover',templateId:'lesson-cover',
  variants:[
   {id:'photo-hero',label:'Photo Hero',description:'Full-bleed real photograph with dark-green title overlay'},
   {id:'split-editorial',label:'Split Editorial',description:'Left identity panel, right large licensed photograph'},
   {id:'framed-gallery',label:'Framed Gallery',description:'Deep-green institutional header and framed real photograph'}
  ],
  slots:{
   institution:field('Institution', 'text',100),faculty:field('Faculty','text',100),
   unit:field('Unit number','text',65),topic:field('Official unit / lesson title','text',120),
   course:field('Course / level','text',100),imageSrc:field('Real photograph URL / licensed path','asset',800)
  },
  required:['institution','faculty','unit','topic','imageSrc'],
  behaviors:['No invented activity title','Preserve official topic wording','Image is sourced separately, never a textbook page scan']
 },
 aims:{
  label:'Learning Aims · Bloom',templateId:'lesson-aims',
  variants:[
   {id:'three-cards',label:'Three Cards',description:'Knowledge · Skills · Attitudes in three fixed boxes'},
   {id:'three-pillars',label:'Three Pillars',description:'Three tall columns with numbered measurable outcomes'}
  ],
  slots:{
   knowledge1:field('Knowledge 1 · Bloom verb','textarea',200),knowledge2:field('Knowledge 2 · Bloom verb','textarea',200),
   skills1:field('Skills 1 · observable performance','textarea',200),skills2:field('Skills 2 · observable performance','textarea',200),
   attitudes1:field('Attitudes 1 · observable disposition','textarea',200),attitudes2:field('Attitudes 2 · observable disposition','textarea',200)
  },
  required:['knowledge1','knowledge2','skills1','skills2','attitudes1','attitudes2'],
  behaviors:['Exactly two outcomes per domain','All outcomes begin with an observable Bloom-style action verb']
 },
 opener:{
  label:'Opener · Elicitation',templateId:'lead-in',
  variants:[
   {id:'picture-elicitation',label:'Picture Elicitation',description:'Large real-world photo → staged guiding questions → answer reveal'},
   {id:'mystery-reveal',label:'Mystery Reveal',description:'Photo with four reveal panels → prediction → target concept'},
   {id:'hot-seat',label:'Hot Seat',description:'One learner guesses from classmates’ clues, with target word reveal'}
  ],
  slots:{
   activityNumber:field('Textbook activity no.','text',30),
   instruction:field('Learner instruction (not a question)','textarea',220),
   imageSrc:field('Real photo URL / path','asset',800),
   q1:field('Guiding question 1','textarea',220),a1:field('Answer 1','textarea',220),
   q2:field('Guiding question 2','textarea',220),a2:field('Answer 2','textarea',220),
   q3:field('Guiding question 3','textarea',220),a3:field('Answer 3','textarea',220),
   target:field('Key word / concept','text',75),
   concept:field('Short learner-friendly explanation','textarea',320)
  },
  required:['activityNumber','instruction','imageSrc','q1','a1','q2','a2','q3','a3','target','concept'],
  behaviors:['Instructions and questions have distinct fixed zones','Show answer available to Teacher/Admin/Presentation only','Target concept revealed after scaffolding questions']
 }
};
export const TEMPLATE_TOKENS=Object.freeze({
 font:"Poppins, Arial, sans-serif",green:"#154B36",greenDeep:"#0B3328",paper:"#F7FBF8",
 ink:"#142F27",lime:"#C8ED79",danger:"#C63D36",
 titlePx:44,instructionPx:28,questionPx:30,bodyPx:25,answerPx:28
});
const clone=x=>JSON.parse(JSON.stringify(x));
const isReal=s=>typeof s==='string'&&!!s.trim();
const srcBad=/\b(?:textbook|life_page|book_page|page_scan)[_-]?\d{1,4}\.(?:png|jpe?g|webp)(?:$|[?#])/i;
const instructionQuestion=/\?/;
const bloom=/^(identify|describe|explain|compare|classify|recognize|recognise|apply|use|interpret|analyse|analyze|evaluate|construct|formulate|demonstrate|produce|present|collaborate|participate|justify|support|share|reflect|respond|respect|contribute|show|select|distinguish|summarize|summarise|organize|organise|discuss)\b/i;
export function makeCertifiedTemplate(family){
 const spec=CERTIFIED_TEMPLATES[family];if(!spec)return null;
 const values=Object.fromEntries(Object.keys(spec.slots).map(k=>[k,'']));
 if(family==='cover'){values.institution='VIETNAM MILITARY MEDICAL UNIVERSITY';values.faculty='FACULTY OF FOREIGN LANGUAGES';}
 return {family,variant:spec.variants[0].id,values};
}
export function certifiedVariantOptions(family){return CERTIFIED_TEMPLATES[family]?.variants||[];}
export function changeCertifiedVariant(data,nextVariant){
 const s=CERTIFIED_TEMPLATES[data?.family];if(!s||!s.variants.some(v=>v.id===nextVariant))return null;
 return {...clone(data),variant:nextVariant};
}
export function validateCertifiedTemplate(data,{draft=false}={}){
 const spec=CERTIFIED_TEMPLATES[data?.family];if(!spec)return ['Unsupported certified template family.'];
 const v=data.values||{},issues=[];
 if(!spec.variants.some(x=>x.id===data.variant))issues.push('Unknown design variant.');
 for(const [key,slot] of Object.entries(spec.slots)){
  const value=String(v[key]??'');
  if(!draft&&spec.required.includes(key)&&!isReal(value))issues.push(slot.label+' is required.');
  if(value.length>slot.limit)issues.push(slot.label+' exceeds '+slot.limit+' characters.');
 }
 if(isReal(v.imageSrc)&&srcBad.test(v.imageSrc))issues.push('Full textbook page screenshots are not allowed.');
 if(data.family==='aims')for(const key of Object.keys(spec.slots)){
  if(isReal(v[key])&&!bloom.test(v[key].trim()))issues.push(key+': start with an observable action verb (Bloom).');
 }
 if(data.family==='opener'){
  if(instructionQuestion.test(v.instruction||''))issues.push('Separate the instruction from questions; use dedicated question slots.');
  for(const i of [1,2,3])if(isReal(v['q'+i])&&!v['q'+i].trim().endsWith('?'))issues.push('Question '+i+' needs a question mark.');
 }
 return issues;
}
export function getCertifiedTemplate(screen){return screen?.certifiedTemplate||null;}
export function applyCertifiedTemplate(screen,data){
 if(!data||!CERTIFIED_TEMPLATES[data.family])return {ok:false,error:'Unknown template.'};
 const next=clone(screen);
 next.certifiedTemplate=clone(data);
 next.templateId=CERTIFIED_TEMPLATES[data.family].templateId;
 next.layout=data.family==='cover'?'hero':data.family==='aims'?'three-cards':'media-left';
 // Legacy blocks remain in the editor as preserved source; certified projection
 // uses only the designated slots to prevent doubled learner content.
 return {ok:true,screen:next};
}
export function draftSourceFromScreen(screen,family){
 const data=makeCertifiedTemplate(family);if(!data)return null;
 const blocks=screen?.blocks||[];
 const role=r=>blocks.find(b=>b.type==='text'&&b.content?.role===r)?.content?.text||'';
 const image=blocks.find(b=>b.type==='image')?.content?.src||'';
 if(family==='cover'){
  data.values.unit=role('eyebrow')||screen?.stage||'';
  data.values.topic=role('display')||screen?.title||'';
  data.values.course=screen?.courseLabel||'';
  data.values.imageSrc=image;
 }
 if(family==='opener'){
  data.values.instruction=screen?.instruction||'';
  data.values.imageSrc=image;
  data.values.activityNumber=screen?.activityNumber||'';
 }
 if(family==='aims'){
  // Only explicitly tagged outcome slots can be transferred without guessing
  // whether a sentence belongs to Knowledge, Skills, or Attitudes.
  for(const key of ['knowledge1','knowledge2','skills1','skills2','attitudes1','attitudes2']){
   const found=blocks.find(b=>b.content?.aimSlot===key);
   if(found)data.values[key]=found.content?.text||'';
  }
 }
 return data;
}
