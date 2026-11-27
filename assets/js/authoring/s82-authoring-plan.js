export function parseSourceRange(value){
 if(value==null||value==='')return null;
 const m=/^(\d{1,4})\s*[-–]\s*(\d{1,4})$/.exec(String(value).trim());
 if(!m||Number(m[1])<1||Number(m[2])<Number(m[1])||Number(m[2])-Number(m[1])+1>12)throw Error('Select 1–12 consecutive PDF pages, e.g. 47-51.');
 return [Number(m[1]),Number(m[2])];
}

export function normalizeReviewReports(reports){
 const strings=(x,max=25)=>{if(!Array.isArray(x)||x.length>max||x.some(s=>typeof s!=='string'||!s.trim()||s.length>400))throw Error('Invalid review report entries.');return [...x];};
 if(!reports||typeof reports!=='object'||Array.isArray(reports))throw Error('Three authoring review reports are required.');
 const result={};
 for(const k of ['academic','visual','critical']){
  const r=reports[k];if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Missing '+k+' review.');
  const findings=strings(r.findings),issues=strings(r.issues);
  if(!findings.length)throw Error('Review findings are required.');
  result[k]={findings,issues};
 }
 result.critical.missingMedia=strings(reports.critical.missingMedia,30);
 return result;
}

export function validateNativeAuthoringMetadata(pkg,expected=null){
 const a=pkg?.authoring;
 if(a==null)return null; // existing native packages remain usable as review drafts
 if(a.schema!=='eleap-s82-authoring-v1'||!Number.isInteger(a.durationMinutes)||a.durationMinutes<1||a.durationMinutes>720||!Number.isInteger(a.coverCount)||a.coverCount<1||a.coverCount>12)throw Error('Invalid teaching duration or cover count.');
 const range=parseSourceRange(a.sourceRange);
 if(!range)throw Error('PDF source range is required.');
 const requestId=a.requestId==null?'':a.requestId;
 if(typeof requestId!=='string'||(requestId&&!/^[a-zA-Z0-9_-]{4,120}$/.test(requestId)))throw Error('Invalid authoring request identifier.');
 if(requestId&&(!expected||expected.requestId!==requestId||expected.durationMinutes!==a.durationMinutes||expected.coverCount!==a.coverCount||expected.sourceRange!==range.join('-')))throw Error('Authoring request mismatch. Reopen the original draft or export a new request.');
 if(!Array.isArray(a.sections)||a.sections.length<1||a.sections.length>16)throw Error('Lesson sections are required.');
 const sectionMap=new Map();
 const sections=a.sections.map(s=>{
  if(!s||typeof s.id!=='string'||!/^[a-zA-Z0-9_-]{1,30}$/.test(s.id)||sectionMap.has(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>140||!Number.isInteger(s.minutes)||s.minutes<1)throw Error('Invalid or duplicate lesson section.');
  sectionMap.set(s.id,0);return {id:s.id,title:s.title,minutes:s.minutes};
 });
 if(sections.reduce((sum,s)=>sum+s.minutes,0)!==a.durationMinutes)throw Error('Section durations do not equal lesson duration.');
 if(!Array.isArray(pkg.screens)||!pkg.screens.length)throw Error('Lesson screens required.');
 let covers=0,objective=0;
 const kinds=new Set(['mcq','multi-select','true-false','listening','video-question','fill','matching','ordering','categorising']);
 for(const [i,s] of pkg.screens.entries()){
  if(!sectionMap.has(s.sectionId)||!Number.isInteger(s.minutes)||s.minutes<0||s.minutes>120)throw Error('Invalid section or timing on slide '+(i+1)+'.');
  sectionMap.set(s.sectionId,sectionMap.get(s.sectionId)+s.minutes);
  if(s.sourcePage!=null&&(!Number.isInteger(s.sourcePage)||s.sourcePage<range[0]||s.sourcePage>range[1]))throw Error('Source page outside selected range on slide '+(i+1)+'.');
  if(s.functional?.type==='lesson-part-cover')covers++;
  for(const b of s.blocks||[]){
   if(!kinds.has(b.type))continue;
   objective++;
   const act=b.activity||{};
   let ids=['choice'];
   if(b.type==='fill'||b.type==='categorising')ids=(act.items||[]).map(x=>x.id);
   if(b.type==='matching'){
    ids=(act.pairs||[]).map(x=>x.id);
    const rights=(act.pairs||[]).map(x=>String(x.right||'').trim().toLowerCase());
    if(new Set(rights).size!==rights.length)throw Error('Ambiguous matching answers on slide '+(i+1)+'.');
   }
   if(b.type==='ordering')ids=(act.answerKey||[]).map((_,j)=>String(j));
   if(!ids.length||ids.some(id=>{const e=act.evidenceByItem?.[id];return !e||typeof e.why!=='string'||!e.why.trim()||e.why.length>700||(e.quote!=null&&(typeof e.quote!=='string'||e.quote.length>500));}))throw Error('Missing item-level Why on slide '+(i+1)+'.');
  }
 }
 if(covers!==a.coverCount)throw Error('Functional cover count does not match the lesson plan.');
 if(!objective)throw Error('Complete lesson requires native objective activities, not text alone.');
 for(const s of sections)if(sectionMap.get(s.id)!==s.minutes)throw Error('Slide timings do not match section '+s.id+'.');
 normalizeReviewReports(pkg.review?.reports);
 return {schema:a.schema,requestId,durationMinutes:a.durationMinutes,coverCount:a.coverCount,sourceRange:range.join('-'),sections};
}
