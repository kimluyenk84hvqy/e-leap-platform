/* Pure, side-effect-free draft proposal boundary.
 * No provider calls, storage, tokens, or modifications to published lessons.
 * Input is untrusted, including all model-supplied citations and verification flags.
 */
export const AI_PROPOSAL_SCHEMA='studio-ai-proposal-v1';
export const AI_MODES=Object.freeze(['auto-designer','assistant']);
export const AI_SUGGESTION_KINDS=Object.freeze(['suggest-activity','suggest-scaffold','suggest-instruction','suggest-combo','suggest-layout']);
const id=x=>typeof x==='string'&&x.length>=1&&x.length<=120&&/^[a-zA-Z0-9_-]+$/.test(x);
const text=x=>typeof x==='string'&&x.trim().length>0&&x.length<=2000;
export function validateAiProposal(input,{allowedSourceIds=[],maxSuggestions=24}={}){
 const problems=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,problems:['Invalid proposal object']};
 if(input.schemaVersion!==AI_PROPOSAL_SCHEMA)problems.push('Unsupported proposal schema');
 if(!AI_MODES.includes(input.mode))problems.push('Unknown AI mode');
 if(!input.scope||!id(input.scope.lessonId))problems.push('Valid target lesson is required');
 else for(const k of ['screenId','stepId'])if(input.scope[k]!==null&&input.scope[k]!==undefined&&!id(input.scope[k]))problems.push('Invalid scope '+k);
 if(!Number.isSafeInteger(input.baseDraftVersion)||input.baseDraftVersion<1)problems.push('Invalid draft version');
 if(!Array.isArray(input.suggestions)||input.suggestions.length<1||input.suggestions.length>maxSuggestions)problems.push('Invalid suggestion count');
 else{
  const seen=new Set(),sourceSet=new Set(allowedSourceIds);
  for(const s of input.suggestions){
   if(!s||!id(s.id)||seen.has(s.id))problems.push('Invalid or duplicate suggestion ID');
   else seen.add(s.id);
   if(!AI_SUGGESTION_KINDS.includes(s?.kind))problems.push('Unsupported suggestion kind');
   if(!id(s?.targetId))problems.push('Invalid suggestion target');
   if(!text(s?.instruction))problems.push('Missing or oversized instruction');
   if(s?.expectedOutput!==undefined&&s?.expectedOutput!==null&&!text(s.expectedOutput))problems.push('Invalid expected output');
   if(s?.languageSupport!==undefined&&s?.languageSupport!==null&&!text(s.languageSupport))problems.push('Invalid language support');
   if(s?.reviewStatus!=='requires-teacher-approval')problems.push('Teacher approval is mandatory');
   if(!Array.isArray(s?.sourceRefs)||s.sourceRefs.length>20)problems.push('Invalid source references');
   else for(const ref of s.sourceRefs){
    if(!ref||!id(ref.assetId)||!sourceSet.has(ref.assetId)||typeof ref.locator!=='string'||ref.locator.length>240)problems.push('Unrecognized source reference');
   }
  }
 }
 return {ok:problems.length===0,problems};
}
export function draftProposalOnly(proposal,draft,{allowedSourceIds=[]}={}){
 const validation=validateAiProposal(proposal,{allowedSourceIds});
 if(!validation.ok)return {ok:false,problems:validation.problems};
 if(draft?.status!=='draft'||draft?.id!==proposal.scope.lessonId||draft?.version!==proposal.baseDraftVersion)
  return {ok:false,problems:['Draft identity, status or version mismatch']};
 if(proposal.mode==='assistant'&&!proposal.scope.screenId)
  return {ok:false,problems:['Assistant requests must be screen-scoped']};
 // Review-only: this function deliberately never mutates draft or applies suggestions.
 return {ok:true,reviewRequired:true,proposal,originalDraft:draft};
}
