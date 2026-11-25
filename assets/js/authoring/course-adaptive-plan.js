/* Advisory only. Never modifies source, draft, grades, or publication state. */
import {courseProfileById} from './course-profile-registry.js';
import {METHOD_COMBOS,checkMethodSource} from './method-combo-catalog.js';
import {evaluateHybridCombo} from './hybrid-pedagogy-contract.js';
const byFocus={Reading:['master-guided-reading-four-step','claim-evidence-reading','reciprocal-reading','scanning-race','jigsaw-reading'],Listening:['staged-listening','tbl-listening','listening-sequence'],Speaking:['think-pair-share','speaking-roleplay','speaking-information-gap'],Writing:['process-writing','writing-genre'],Grammar:['guided-grammar','grammar-ppp'],Vocabulary:['contextual-vocabulary','vocabulary-word-map']};
const fit={facts:'scanning-race',inference:'claim-evidence-reading',sections:'jigsaw-reading',sequence:'listening-sequence',roles:'speaking-roleplay',gap:'speaking-information-gap',genre:'writing-genre',discovery:'guided-grammar'};
const text=v=>typeof v==='string'&&v.trim().length>0;
export function suggestCoursePlan({courseProfileId,focus,paragraphCount=0,sourceVerified=false,source=null,taskKind='',minutes=null,learnerCount=null,selectedMethod=null}={}){
 const profile=courseProfileById(courseProfileId);
 if(!profile||profile.availability!=='active')return {ok:false,issues:['Select an active course profile.'],suggestions:[],canPublish:false};
 if(!Object.hasOwn(byFocus,focus))return {ok:false,issues:['Choose an instructional focus.'],suggestions:[],canPublish:false};
 const candidates=[...byFocus[focus]];
 if(focus==='Reading'&&paragraphCount===3)candidates.push('master-u6-reading-six-step'); // legacy candidate only, never automatic
 const suggestions=candidates.map((id,index)=>{
  const m=METHOD_COMBOS[id];if(!m)return null;
  const blockers=[];
  if(!source||source.sourceVerified!==true||!text(source.sourceRef))blockers.push('Verify original source and reference.');
  if(source){try{blockers.push(...checkMethodSource(id,source));}catch{blockers.push('Source structure is invalid.');}}
  else blockers.push('Provide original '+m.required.join(', ')+'.');
  if(id==='jigsaw-reading'&&(!Array.isArray(source?.sections)||source.sections.length<2||!text(source.groupTask)))blockers.push('Provide distinct sections and a sharing task.');
  if(id==='master-u6-reading-six-step'&&courseProfileId!=='life')blockers.push('Reserved for LIFE U6 verified A/B/C source.');
  if(id==='master-u6-reading-six-step')blockers.push('Use the dedicated source-review workflow for this legacy method.');
  if(m.steps.some(s=>s.mode==='group')&&(!Number.isInteger(learnerCount)||learnerCount<4))blockers.push('Confirm sufficient learners for group work.');
  if(m.steps.some(s=>s.mode==='pair')&&(!Number.isInteger(learnerCount)||learnerCount<2))blockers.push('Confirm pair work is feasible.');
  if(!Number.isFinite(minutes)||minutes<m.steps.length*2)blockers.push('Confirm sufficient time for all steps.');
  blockers.push(...evaluateHybridCombo(m).errors);
  const score=(fit[taskKind]===id?100:0)+(profile.preferredMethods.includes(id)?20:0)+(blockers.length===0?200:0)-index;
  return {id,label:m.label,requiresTextbookReview:true,canPublish:false,eligibleForTeacherReview:blockers.length===0,blockers:[...new Set(blockers)],score,steps:m.steps.map(s=>({id:s.id,label:s.label,mode:s.mode}))};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 return {ok:true,profileId:profile.id,focus,suggestions,selectedMethod,selectionPreserved:true,sourceVerified:sourceVerified===true&&source?.sourceVerified===true&&text(source?.sourceRef),canPublish:false,stages:['Academic & Pedagogy','Visual & Interaction','Critical Review & QA'].map(name=>({name,status:'awaiting source verification and teacher review'})),issues:['Recommendations only; no source or draft content changed.']};
}
