/* Canonical activity interface v2 for AI proposals. This is deliberately a
 * *non-running* description layer: adapters do not change legacy renderers.
 */
import {TEACHING_COMBOS} from './teaching-combo-registry.js';
import {METHOD_COMBOS} from './method-combo-catalog.js';
const nonblank=x=>typeof x==='string'&&x.trim().length>4;
export const ACTIVITY_CONTRACT_VERSION='eleap-activity-v2';
export const ACTIVITY_MODES=Object.freeze(['individual','pair','group','class']);
export function normalizeActivityContract({methodId,steps,lessonId,sourceManifestHash}={}){
 const errors=[];
 if(!TEACHING_COMBOS[methodId]&&!METHOD_COMBOS[methodId])errors.push('Unknown method: '+String(methodId));
 if(!Array.isArray(steps)||steps.length<1||steps.length>12)errors.push('Invalid step count');
 if(!nonblank(lessonId))errors.push('Missing lesson ID');
 if(!/^[a-f0-9]{64}$/i.test(String(sourceManifestHash||'')))errors.push('Missing source manifest SHA-256');
 const seen=new Set();
 const normalized=[];
 for(const [i,s] of (Array.isArray(steps)?steps:[]).entries()){
  if(!s||typeof s.id!=='string'||!/^[a-z][a-z0-9_-]{1,63}$/i.test(s.id)||seen.has(s.id))errors.push('Missing or duplicate step ID at '+i);else seen.add(s.id);
  if(!ACTIVITY_MODES.includes(s?.mode))errors.push('Invalid interaction mode at '+i);
  for(const k of ['purpose','instruction','input','support','output','feedback','transition']){
   if(!nonblank(s?.[k]))errors.push('Missing '+k+' at '+i);
  }
  if(!Array.isArray(s?.sourceRefs))errors.push('Missing source reference list at '+i);
  if(!s?.outputCapture||!['text','choice','audio','group-report','teacher-observation'].includes(s.outputCapture))errors.push('Missing learner response capture at '+i);
  normalized.push({id:s?.id,mode:s?.mode,purpose:s?.purpose,instruction:s?.instruction,
   input:s?.input,support:s?.support,output:s?.output,feedback:s?.feedback,
   transition:s?.transition,outputCapture:s?.outputCapture,sourceRefs:s?.sourceRefs});
 }
 return {ok:errors.length===0,errors,contract:errors.length?null:{
  schemaVersion:ACTIVITY_CONTRACT_VERSION,methodId,lessonId,sourceManifestHash,
  steps:normalized,status:'teacher-review-required',publishable:false
 }};
}
export function reviewMethodCatalog(){
 const ids=new Set([...Object.keys(TEACHING_COMBOS),...Object.keys(METHOD_COMBOS)]);
 return [...ids].map(id=>({methodId:id,legacyRuntime:!!TEACHING_COMBOS[id],
  methodTemplate:!!METHOD_COMBOS[id],
  compatibility:TEACHING_COMBOS[id]?'needs-adapter-mapping':'review-only-no-runtime'}));
}
