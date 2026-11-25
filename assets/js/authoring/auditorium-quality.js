/* S3.6: Studio review only. No runtime or publication authority. Values in CSS px
 * at the 1920x1080 reference, from both U4 FINAL AUDITORIUM files. */
export const AUDITORIUM=Object.freeze({width:1920,height:1080,title:54,instruction:32,section:35,body:30,reading:29,key:30,why:29,control:21,cover:72,keyColor:'#921522',evidence:'#ffe16b',ink:'#101b16',deep:'#073326'});
export function auditoriumVariables(){return Object.entries(AUDITORIUM).filter(([k])=>!['width','height'].includes(k)).map(([k,v])=>`--aud-${k}:${typeof v==='number'?v+'px':v}`).join(';');}
const str=x=>typeof x==='string'?x.trim():'';
const normalize=x=>str(x).replace(/\s+/g,' ').toLowerCase();
const objective=new Set(['mcq','multi-select','true-false','fill','matching','ordering','categorising','listening','video-question']);
const visible=b=>!['teacher','internal'].includes(b.audience);
export function auditAuditorium(lesson={}){
 const issues=[];const add=(severity,msg)=>issues.push([severity,'Auditorium: '+msg]);
 if(lesson.theme?.fontFamily!=='Poppins')add('warn','Confirm font choice and loaded font in projection.');
 for(const [i,s] of (lesson.screens||[]).entries()){
  const loc=`Slide ${i+1}`, blocks=(s.blocks||[]).filter(visible);
  const special=s.certifiedTemplate||s.functionalDraft||s.methodDraft||s.resourceStage||s.sourceReviewDraft;
  if(special){add('info',`${loc}: specialised renderer requires its own projection review.`);continue;}
  if(!blocks.length)add('error',`${loc}: no learner-facing content.`);
  if(!str(s.instruction)&&blocks.some(b=>b.activity))add('warn',`${loc}: confirm learner-facing instructions (who, action, output).`);
  for(const [id,style] of Object.entries(s.visualLayout?.textStyles||{}))if(Number.isFinite(style.fontSize)&&style.fontSize<29)add('warn',`${loc}: small custom text override (${id}); check projected size.`);
  const steps=s.combo?.steps||[];
  for(const step of steps)if(!blocks.some(b=>b.comboStep===step.id))add('error',`${loc}: empty learner step ${step.id}.`);
  for(const [j,b] of blocks.entries()){
   const where=`${loc}, block ${j+1}`,a=b.activity||{},c=b.content||{};
   if(b.type==='image'){
    if(!str(c.src)&&!str(c.assetId))add('error',`${where}: image reference missing.`);
    else add('info',`${where}: confirm actual photo, intact crop, source rights and load.`);
   }
   if(!objective.has(b.type))continue;
   const reading=/reading/i.test([s.stage,s.learningPhase,s.templateId].join(' '));
   const evidence=a.evidenceByItem||{};
   const items=b.type==='fill'?a.items:b.type==='matching'?a.pairs:null;
   if(reading&&items?.length){
    const passage=blocks.filter(x=>x.type==='text'&&(!x.comboStep||x.comboStep===b.comboStep)).map(x=>normalize(x.content?.text)).join(' ');
    for(const item of items){const e=evidence[item.id];if(!str(e?.quote)||!str(e?.why))add('warn',`${where}, item ${item.id}: Evidence & Why needs review.`);else if(!passage.includes(normalize(e.quote)))add('warn',`${where}, item ${item.id}: quotation not found in same-step text; verify source manually.`);}
   }else if(reading&&!items)add('warn',`${where}: confirm per-question Evidence & Why in source and renderer.`);
   if(['listening','video-question'].includes(b.type))add('info',`${where}: verify playback, transcript/time anchors and learner access.`);
  }
 }
 add('info','Manual acceptance required: all tabs and reveal states at 1920×1080, readable typography, no clipping, real photos, answer placement, Evidence & Why, and all roles.');
 return issues;
}
