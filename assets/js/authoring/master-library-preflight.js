/* E-LEAP Master Template Library: fail-closed compatibility audit.
 * Read-only; does not register templates, publish lessons or alter M3 controls.
 * Status describes structural compatibility ONLY, never visual/academic certification.
 */
import {E_LEAP_ACTIVITY_TYPES} from '../activity-registry.js';
import {E_LEAP_SMART_TEMPLATES} from '../smart-templates.js';
import {VISUAL_TEMPLATE_CONTRACTS} from './visual-template-contracts.js';

export const MASTER_TEMPLATE_BINDINGS = Object.freeze({
 'cover-aims': {layouts:['lesson-cover','lesson-aims'], status:'adapter-required'},
 'visual-prediction': {layouts:['lead-in'],status:'candidate'},
 'vocab-explore': {layouts:['vocabulary-presentation'],status:'candidate'},
 'interactive-practice': {layouts:['controlled-practice'],status:'candidate'},
 'audio-listening': {layouts:['listening-task'],status:'candidate'},
 'video-viewing': {layouts:[],status:'unimplemented'},
 'reading-guided': {layouts:['reading-task'],status:'candidate'},
 'reading-jigsaw': {layouts:[],status:'unimplemented'},
 'grammar-discovery': {layouts:['grammar-presentation'],status:'candidate'},
 'pronunciation-workshop': {layouts:[],status:'unimplemented'},
 'speaking-pairs': {layouts:['speaking-task'],status:'candidate'},
 'speaking-present': {layouts:['speaking-task'],status:'candidate'},
 'writing-scaffold': {layouts:[],status:'unimplemented'},
 'evidence-why': {layouts:[],status:'unimplemented'},
 'assessment-panel': {layouts:['controlled-practice'],status:'adapter-required'},
 'group-task': {layouts:[],status:'unimplemented'},
 'media-focus': {layouts:['lead-in'],status:'candidate'},
 'review-reflect': {layouts:['consolidation'],status:'candidate'}
});

const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const unique=x=>new Set(x).size===x.length;
const knownStatuses=new Set(['candidate','adapter-required','unimplemented']);

export function auditMasterLibraryCompatibility(master,options={}){
 const errors=[],warnings=[];
 if(!master||typeof master!=='object'||Array.isArray(master))
  return {ok:false,errors:['Master registry must be an object'],warnings,publicationAllowed:false};
 const templates=master.visualTemplates;
 if(!Array.isArray(templates)||!templates.length)
  errors.push('Master visualTemplates must be a nonempty array');
 else {
  const ids=templates.map(t=>t?.id);
  if(ids.some(id=>typeof id!=='string'||!id.trim())||!unique(ids))errors.push('Template IDs must be unique nonempty strings');
  for(const t of templates){
   if(!t||typeof t.id!=='string')continue;
   const match=MASTER_TEMPLATE_BINDINGS[t.id];
   if(!match){errors.push('Unmapped master template: '+t.id);continue;}
   if(!knownStatuses.has(match.status))errors.push('Invalid status for '+t.id);
   if(match.layouts.some(id=>!own(VISUAL_TEMPLATE_CONTRACTS,id)))
    errors.push('Unknown native layout for '+t.id);
   if(match.status==='unimplemented'&&match.layouts.length)
    errors.push('Unimplemented template exposes a native layout: '+t.id);
   if(match.status!=='candidate')warnings.push(t.id+' requires a renderer/adapter before use');
  }
 }
 const a=master.activityRegistry;
 if(!Array.isArray(a)||!a.length)errors.push('Master activityRegistry must be a nonempty array');
 else if(!unique(a.map(v=>v?.id))||a.some(v=>typeof v?.id!=='string'||!v.id.trim()))
  errors.push('Activity IDs must be unique nonempty strings');
 if(!Array.isArray(master.teachingCombos)||!master.teachingCombos.length)
  errors.push('Master teachingCombos must be a nonempty array');
 if(!Object.keys(E_LEAP_ACTIVITY_TYPES).length||!Object.keys(E_LEAP_SMART_TEMPLATES).length)
  errors.push('Native Studio registries are empty');
 if(options.requirePublication){
  errors.push('Publication prohibited until renderer, source, mobile/presentation, Save/Reopen, and Submit/Responses E2E evidence exist');
 }
 return {ok:errors.length===0,errors,warnings,publicationAllowed:false,
  counts:{masterTemplates:Array.isArray(templates)?templates.length:0,nativeActivities:Object.keys(E_LEAP_ACTIVITY_TYPES).length,nativeSmartTemplates:Object.keys(E_LEAP_SMART_TEMPLATES).length},
  unimplemented:Object.entries(MASTER_TEMPLATE_BINDINGS).filter(([,v])=>v.status==='unimplemented').map(([k])=>k)};
}
