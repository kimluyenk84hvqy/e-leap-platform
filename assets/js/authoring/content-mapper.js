/* E-LEAP Studio Content Mapper v1.
 * Explicit content slots, no generative guessing and no book-page screenshots.
 * A single mapped slide is stable across course collections.
 */
const short=(label,max=280)=>({label,kind:'text',max});
const long=(label,max=3000)=>({label,kind:'textarea',max});
const media=(label)=>({label,kind:'asset',max:800});
const itemList=(label)=>({label,kind:'rows',max:3000});
export const CONTENT_SLOT_SCHEMAS={
 'lesson-cover':{
  label:'Lesson cover',
  slots:{title:short('Lesson title',100),unit:short('Unit / lesson',90),imageSrc:media('Cover image URL or path')},
  defaults:{title:'',unit:''}
 },
 'lead-in':{
  label:'Warm-up / Lead-in',
  slots:{title:short('Slide title',90),instruction:short('Instruction for learners',210),imageSrc:media('Photo URL or path'),prompt:short('Question for learners',250)}
 },
 'vocabulary-presentation':{
  label:'Vocabulary',
  slots:{title:short('Slide title',90),instruction:short('Instruction for learners',210),items:itemList('Word | Meaning | Example (one per line)'),imageSrc:media('Supporting photo URL or path')}
 },
 'grammar-presentation':{
  label:'Grammar discovery',
  slots:{title:short('Slide title',90),instruction:short('Instruction for learners',210),rule:short('Grammar rule',280),form:short('Grammar form',200),examples:long('Examples (one per line)',950),prompt:short('Learner question',250)}
 },
 'reading-task':{
  label:'Reading',
  slots:{title:short('Slide title',90),instruction:short('Learner instruction',210),passage:long('Reading passage',5000),prompt:short('Reading task / question',280)}
 },
 'listening-task':{
  label:'Listening',
  slots:{title:short('Slide title',90),instruction:short('Learner instruction',210),audioSrc:media('Audio URL or path'),prompt:short('Listening question',250)}
 },
 'speaking-task':{
  label:'Speaking',
  slots:{title:short('Slide title',90),instruction:short('Learner instruction',210),prompt:short('Discussion question',300)}
 },
 'controlled-practice':{
  label:'Practice',
  slots:{title:short('Slide title',90),instruction:short('Learner instruction',210),prompt:short('Practice question',300)}
 }
};
const INTERNAL=/\b(?:teacher should|insert the (?:reading|assigned)|template id|developer note|content mapper|evidence id|paste or type|add a short lead-in)\b/i;
const PAGE_IMAGE=/(?:life_page|book_page|textbook_page|page_scan)[_-]?\d{1,4}\.(?:png|jpe?g|webp)(?:$|[?#])/i;
const nonempty=x=>typeof x==='string'&&x.trim()!=='';
const primary=(s,type)=>s.blocks?.find(b=>b.type===type);
const firstActivity=s=>s.blocks?.find(b=>b.activity);
const cleanLines=s=>String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
export function readTemplateSlots(screen){
 const data={title:screen.title||'',instruction:screen.instruction||''};
 const image=primary(screen,'image'),audio=primary(screen,'audio');
 if(image)data.imageSrc=image.content?.src||'';
 if(audio)data.audioSrc=audio.content?.src||'';
 const vocab=primary(screen,'vocabulary');
 if(vocab)data.items=(vocab.content?.items||[]).map(x=>[x.word,x.meaning,x.example].join(' | ')).join('\n');
 const grammar=primary(screen,'grammar-note');
 if(grammar){data.rule=grammar.content?.rule||'';data.form=grammar.content?.form||'';data.examples=(grammar.content?.examples||[]).join('\n');}
 if(screen.templateId==='reading-task')data.passage=primary(screen,'text')?.content?.text||'';
 data.prompt=firstActivity(screen)?.activity?.prompt||'';
 if(screen.templateId==='lesson-cover')data.unit=(screen.blocks||[]).find(b=>b.content?.role==='eyebrow')?.content?.text||'';
 return data;
}
export function validateMapping(templateId,values){
 const schema=CONTENT_SLOT_SCHEMAS[templateId];if(!schema)return ['This template does not support slot mapping yet.'];
 const errors=[];
 for(const [key,def] of Object.entries(schema.slots)){
  const value=String(values[key]??'');
  if(value.length>def.max)errors.push(def.label+' exceeds '+def.max+' characters.');
  if(INTERNAL.test(value))errors.push(def.label+' contains editor-only instructions.');
  if((key==='imageSrc'||key==='audioSrc')&&PAGE_IMAGE.test(value))errors.push('Full textbook page screenshots cannot be used as slide images.');
 }
 if(values.items&&templateId==='vocabulary-presentation'){
  const rows=cleanLines(values.items);
  if(rows.length>8)errors.push('Keep at most 8 words on one vocabulary slide.');
  rows.forEach((x,i)=>{const p=x.split('|').map(z=>z.trim());if(p.length<2||!p[0]||!p[1])errors.push('Vocabulary row '+(i+1)+' must contain Word | Meaning.')});
 }
 return errors;
}
export function applyMappedContent(screen,input){
 const errors=validateMapping(screen.templateId,input);
 if(errors.length)return {ok:false,errors,screen};
 const next=JSON.parse(JSON.stringify(screen));
 const set=(type,update)=>{const b=primary(next,type);if(b)update(b)};
 const put=(k)=>nonempty(input[k])?String(input[k]).trim():null;
 if(put('title')!==null)next.title=put('title');
 if(put('instruction')!==null)next.instruction=put('instruction');
 if(put('imageSrc')!==null)set('image',b=>{b.content={...b.content,src:put('imageSrc'),assetId:null};});
 if(put('audioSrc')!==null){
  set('audio',b=>{b.content={...b.content,src:put('audioSrc'),assetId:null};});
  const listening=primary(next,'listening');
  if(listening){listening.activity.media={...(listening.activity.media||{}),src:put('audioSrc'),assetId:null,kind:'audio'};}
 }
 if(put('unit')!==null){
  const b=(next.blocks||[]).find(b=>b.content?.role==='eyebrow');if(b)b.content.text=put('unit');
 }
 if(put('items')!==null)set('vocabulary',b=>{
  b.content.items=cleanLines(input.items).map(x=>{
   const [word,meaning,...example]=x.split('|').map(z=>z.trim());
   return {word,meaning,example:example.join(' | ')};
  });
 });
 if(['rule','form','examples'].some(k=>put(k)!==null))set('grammar-note',b=>{
  for(const key of ['rule','form'])if(put(key)!==null)b.content[key]=put(key);
  if(put('examples')!==null)b.content.examples=cleanLines(input.examples);
 });
 if(put('passage')!==null&&next.templateId==='reading-task')set('text',b=>{b.content.text=put('passage')});
 if(put('prompt')!==null){
  const b=firstActivity(next);if(b)b.activity.prompt=put('prompt');
 }
 next.teacherNotes=screen.teacherNotes||'';
 return {ok:true,errors:[],screen:next};
}
