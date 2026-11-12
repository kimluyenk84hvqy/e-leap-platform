/* Deterministic pedagogical coverage audit for E-LEAP golden examples.
 * Checks structural quality only; cannot prove source fidelity or classroom effectiveness.
 * No AI calls, DB writes, feature flags or changes to lesson renderers.
 */
export const PEDAGOGICAL_RUBRIC=['goalFit','instruction','scaffold','output','evidenceCheck','visualFeasibility'];
export const HARD_BLOCKERS=Object.freeze(['fabricated-evidence','fabricated-answer','unauthorized-reveal','no-learner-output','missing-required-source','uncleared-media','runtime-failure','visual-clipping']);
const nonblank=x=>typeof x==='string'&&x.trim().length>4;
const validId=x=>typeof x==='string'&&/^[a-z][a-z0-9-]+$/.test(x);
export function auditGoldenExample(example){
 const issues=[],warnings=[];
 if(!example||!validId(example.id))return {ok:false,issues:['Missing or invalid example ID'],warnings:[],state:'blocked'};
 if(!nonblank(example.aim))issues.push('Missing observable learning aim');
 if(!validId(example.methodId))issues.push('Missing method ID');
 if(example.status!=='template-review')issues.push('Golden example must remain teacher-review-only');
 if(!Array.isArray(example.sourceRequirements)||!example.sourceRequirements.length||example.sourceRequirements.some(x=>!nonblank(x)))issues.push('Missing or incomplete source requirements');
 if(!Array.isArray(example.steps)||example.steps.length<3||example.steps.length>9)issues.push('Teaching sequence must have 3–9 steps');
 else{
  const names=new Set(),modes=new Set();
  for(const [i,s] of example.steps.entries()){
   if(!validId(s.step)||names.has(s.step))issues.push('Invalid or duplicated step '+(i+1));else names.add(s.step);
   if(!['individual','pair','group','class'].includes(s.mode))issues.push('Invalid learner mode at '+(i+1));else modes.add(s.mode);
   for(const key of ['instruction','scaffold','output','check','transition'])if(!nonblank(s[key]))issues.push('Missing '+key+' at '+(i+1));
   if(/^(discuss|compare|listen|read|predict)[.!]?$/i.test(String(s.instruction||'').trim()))issues.push('Non-actionable learner instruction at '+(i+1));
   if(/^(thoughts|discussion|understanding|answers?)$/i.test(String(s.output||'').trim()))issues.push('Output not observable at '+(i+1));
  }
  if(!modes.has('individual'))warnings.push('No individual response before collaborative work');
  if(!modes.has('pair')&&!modes.has('group'))warnings.push('No peer interaction in sequence');
 }
 return {ok:issues.length===0,issues,warnings,state:issues.length?'blocked':'teacher-review-required'};
}
export function auditGoldenLibrary(library,{allowedMethods=[]}={}){
 if(library?.schemaVersion!=='eleap-golden-combos-v1')return {ok:false,issues:['Unsupported golden library schema'],reports:[]};
 const issues=[],seen=new Set(),reports=[];
 for(const ex of library.examples||[]){
  if(seen.has(ex?.id))issues.push('Duplicate example ID: '+ex.id);else seen.add(ex?.id);
  const audit=auditGoldenExample(ex);reports.push({id:ex?.id,...audit});
  if(!audit.ok)issues.push(ex?.id+': '+audit.issues.join('; '));
  if(allowedMethods.length&&!allowedMethods.includes(ex.methodId))issues.push('Method is not in Studio catalog: '+ex.methodId);
 }
 if(!reports.length)issues.push('No golden examples');
 return {ok:issues.length===0,issues,reports};
}
export function scorePedagogicalReview(ratings,{blockers=[]}={}){
 const scores=PEDAGOGICAL_RUBRIC.map(k=>ratings?.[k]);
 if(scores.some(v=>!Number.isInteger(v)||v<0||v>2))return {ok:false,state:'invalid',errors:['All six dimensions require a score of 0, 1 or 2']};
 if(!Array.isArray(blockers)||blockers.some(x=>!HARD_BLOCKERS.includes(x)))return {ok:false,state:'invalid',errors:['Unknown hard blocker']};
 const total=scores.reduce((a,b)=>a+b,0);
 return {ok:true,total,max:12,blockers:[...new Set(blockers)],state:blockers.length||total<=6?'blocked':total<=9?'revise':'teacher-review-required'};
}
