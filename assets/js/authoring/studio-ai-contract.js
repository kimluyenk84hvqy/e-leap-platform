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
export function validateProposalAgainstDraft(proposal,draft,{sourceManifestHash,allowedSourceIds=[]}={}){
 const base=validateAiProposal(proposal,{allowedSourceIds});
 const errors=[...base.problems];
 if(!draft||draft.status!=='draft'||draft.id!==proposal?.scope?.lessonId||draft.version!==proposal?.baseDraftVersion)
  errors.push('Draft identity, status or version mismatch');
 if(!/^[a-f0-9]{64}$/i.test(String(sourceManifestHash||''))||proposal?.sourceManifestHash!==sourceManifestHash)
  errors.push('Source manifest hash mismatch');
 const screens=new Map((draft?.screens||[]).map(s=>[s.id,s]));
 if(proposal?.mode==='assistant'&&!proposal.scope?.screenId)errors.push('Assistant requires exact screen scope');
 if(proposal?.scope?.screenId&&!screens.has(proposal.scope.screenId))errors.push('Scoped screen missing');
 if(proposal?.scope?.stepId){
  const active=screens.get(proposal.scope.screenId);
  if(!active?.combo?.steps?.some(x=>x.id===proposal.scope.stepId))errors.push('Scoped step missing');
 }
 for(const suggestion of Array.isArray(proposal?.suggestions)?proposal.suggestions:[]){
  if(!suggestion||!suggestion.targetId)continue;
  const targetScreen=screens.get(suggestion.targetId);
  const matchedScreen=[...screens.values()].find(s=>(s.blocks||[]).some(b=>b.id===suggestion.targetId));
  const target=targetScreen||matchedScreen;
  if(!target)errors.push('Proposal target not found: '+suggestion.targetId);
  if(proposal.mode==='assistant'&&target?.id!==proposal.scope.screenId)
   errors.push('Proposal target outside selected screen: '+suggestion.targetId);
  if(proposal.scope?.stepId&&matchedScreen){
   const block=(matchedScreen.blocks||[]).find(b=>b.id===suggestion.targetId);
   if(block?.comboStep!==proposal.scope.stepId)errors.push('Proposal block outside selected step');
  }
 }
 return {ok:errors.length===0,problems:errors,reviewRequired:true};
}
export function validateScopedInstructionProposal(proposal,draft,{sourceManifestHash,allowedSourceIds=[]}={}){
 const review=validateProposalAgainstDraft(proposal,draft,{sourceManifestHash,allowedSourceIds});
 const issues=[...review.problems];
 if(proposal?.mode!=='assistant')issues.push('Only Assistant mode may create scoped instruction patches');
 if(proposal?.scope?.stepId)issues.push('Step instructions require a separate dedicated adapter');
 if(!proposal?.scope?.screenId)issues.push('A specific screen is required');
 for(const suggestion of Array.isArray(proposal?.suggestions)?proposal.suggestions:[]){
  if(suggestion?.kind!=='suggest-instruction')issues.push('Only instruction edits are supported in this patch adapter');
  if(suggestion?.targetId!==proposal?.scope?.screenId)issues.push('Instruction patch must target the selected screen');
  if(suggestion?.sourceRefs?.some(r=>r?.status==='verified'&&r?.reviewedBy===undefined))issues.push('Model-supplied source verification is not accepted');
 }
 return {ok:issues.length===0,problems:issues,reviewRequired:true};
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
