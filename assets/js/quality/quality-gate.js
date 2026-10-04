import {isObjectiveActivity,isSupportedActivity} from '../activities/activity-registry.js';
import {E_LEAP_LAYOUTS} from '../authoring/layout-registry.js';
import {isContentBlock} from '../authoring/content-block-registry.js';

const hasAnswer=(a,t)=>{if(['mcq','multi-select','true-false','listening','video-question'].includes(t))return (a.answerKey||[]).length>0;if(t==='fill')return (a.items||[]).every(x=>(x.answers||[]).length);if(t==='matching')return (a.pairs||[]).length>0;if(t==='ordering')return (a.answerKey||[]).length>0;if(t==='categorising')return (a.items||[]).every(x=>x.category);return true};
const pushDup=(issues,seen,id,where)=>{if(!id)return;if(seen.has(id))issues.push(['error',`${where}: duplicate id ${id}`]);else seen.add(id)};

export function auditLesson(lesson={}){
  const issues=[],seen=new Set();
  if(!String(lesson.title||'').trim())issues.push(['error','Lesson title is missing']);
  if(!lesson.deliveryPolicy?.id)issues.push(['warn','Delivery policy is not explicit; Practice defaults will be used.']);
  pushDup(issues,seen,lesson.id,'Lesson');
  const cover=(lesson.screens||[])[0];
  if(!cover||cover.templateId!=='lesson-cover')issues.push(['error','Slide 1 must use the official Lesson Cover template']);
  else{
    const coverText=(cover.blocks||[]).map(b=>b.content?.text||'').join(' | ');
    if(!coverText.includes('VIETNAM MILITARY MEDICAL UNIVERSITY'))issues.push(['error','Lesson Cover: VMMU institution line is missing']);
    if(!coverText.includes('FACULTY OF FOREIGN LANGUAGES'))issues.push(['error','Lesson Cover: Faculty of Foreign Languages line is missing']);
  }
  if((lesson.theme?.fontFamily||'')!=='Poppins')issues.push(['warn','Template Contract: Poppins is the default lesson font']);
  (lesson.screens||[]).forEach((s,si)=>{
    const sw=`Slide ${si+1}`;pushDup(issues,seen,s.id,sw);
    if(!String(s.title||'').trim())issues.push(['error',`${sw}: missing title`]);
    if(!E_LEAP_LAYOUTS[s.layout||'standard'])issues.push(['error',`${sw}: unsupported layout ${s.layout}`]);
    if(!(s.blocks||[]).length)issues.push(['warn',`${sw}: no content blocks`]);
    (s.blocks||[]).forEach((b,bi)=>{
      const where=`${sw}, block ${bi+1}`;pushDup(issues,seen,b.id,where);
      const content=isContentBlock(b.type),activity=isSupportedActivity(b.type);
      if(!content&&!activity)issues.push(['error',`${where}: unsupported block/activity type ${b.type||'(missing)'}`]);
      if(b.type==='image'&&!String(b.content?.alt||'').trim())issues.push(['warn',`${where}: image missing alt text`]);
      if(['image','audio','video'].includes(b.type)){
        if(!String(b.content?.src||'').trim()&&!b.content?.assetId)issues.push(['error',`${where}: ${b.type} source missing`]);
        if(String(b.content?.src||'').trim()&&!b.content?.assetId)issues.push(['info',`${where}: legacy path is supported, but new lessons should use a Media Asset ID`]);
      }
      if(['audio','video'].includes(b.type)&&!String(b.content?.transcript||b.content?.caption||'').trim())issues.push(['info',`${where}: consider transcript/caption for accessibility`]);
      if(b.activity){
        const a=b.activity;pushDup(issues,seen,a.id,`${where} activity`);
        if(!String(a.prompt||'').trim())issues.push(['error',`${where}: activity prompt missing`]);
        if(isObjectiveActivity(b.type)&&b.type!=='poll'&&!hasAnswer(a,b.type))issues.push(['error',`${where}: correct answer missing`]);
        if(isObjectiveActivity(b.type)&&Number(a.points||0)<=0)issues.push(['error',`${where}: objective activity points must be greater than 0`]);
        if(['writing','discussion','speaking-record'].includes(b.type)&&!String(a.rubric||'').trim())issues.push(['warn',`${where}: rubric/criteria missing`]);
        if(['listening','video-question'].includes(b.type)){
          if(!a.media?.assetId&&!String(a.media?.src||'').trim())issues.push(['error',`${where}: activity media source missing`]);
          if(String(a.media?.src||'').trim()&&!a.media?.assetId)issues.push(['info',`${where}: use Media Asset ID for new interactive media`]);
        }
      }
    });
  });
  if(lesson.deliveryPolicy?.id==='mock'){
    (lesson.screens||[]).forEach((s,si)=>(s.blocks||[]).forEach((b,bi)=>{if(b.activity?.policy?.studentReveal===true)issues.push(['error',`Slide ${si+1}, block ${bi+1}: Mock Test cannot reveal answers during attempt`]);}));
  }
  return issues;
}
