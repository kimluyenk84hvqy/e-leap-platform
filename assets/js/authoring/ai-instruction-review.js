/* E-LEAP AI dry-run preview/accept boundary.
 * No network, DOM, hidden auto-acceptance, provider calls, or persisted writes.
 * Caller MUST authenticate/authorize teacher server-side and provide trusted
 * source hash and allowed source IDs; this module cannot grant permissions.
 */
import {validateScopedInstructionProposal} from './studio-ai-contract.js';
const deepCopy=value=>JSON.parse(JSON.stringify(value));
export function previewAssistantInstruction(proposal,draft,trust={}){
 const gate=validateScopedInstructionProposal(proposal,draft,trust);
 if(!gate.ok)return {ok:false,errors:gate.problems};
 const suggestions=proposal.suggestions;
 if(suggestions.length!==1)return {ok:false,errors:['First adapter supports exactly one change per teacher review']};
 const screen=(draft.screens||[]).find(s=>s.id===proposal.scope.screenId);
 if(!screen)return {ok:false,errors:['Selected screen no longer exists']};
 const before=String(screen.instruction||''),after=suggestions[0].instruction.trim();
 if(after===before)return {ok:false,errors:['No actual instruction change proposed']};
 return {ok:true,reviewRequired:true,scope:{lessonId:draft.id,screenId:screen.id},
  before,after,baseDraftVersion:draft.version,sourceManifestHash:trust.sourceManifestHash,
  suggestionId:suggestions[0].id,reviewId:proposal.reviewId||null};
}
export function acceptAssistantInstruction(preview,draft,{approved=false,currentSourceManifestHash}={}){
 if(approved!==true)return {ok:false,errors:['Explicit teacher approval required']};
 if(!preview?.ok||preview.reviewRequired!==true)return {ok:false,errors:['Proposal not validated for review']};
 if(!/^[a-f0-9]{64}$/i.test(String(currentSourceManifestHash||''))||preview.sourceManifestHash!==currentSourceManifestHash)
  return {ok:false,errors:['Source manifest changed; regenerate proposal']};
 if(!draft||draft.status!=='draft'||draft.id!==preview.scope.lessonId||draft.version!==preview.baseDraftVersion)
  return {ok:false,errors:['Stale, published or different draft']};
 const screen=draft.screens?.find(s=>s.id===preview.scope.screenId);
 if(!screen||String(screen.instruction||'')!==preview.before)return {ok:false,errors:['Screen changed since review']};
 if(typeof preview.after!=='string'||!preview.after.trim()||preview.after.length>2000)
  return {ok:false,errors:['Invalid instruction text']};
 const next=deepCopy(draft);
 next.screens.find(s=>s.id===screen.id).instruction=preview.after;
 next.version=draft.version+1;
 const undo={lessonId:draft.id,screenId:screen.id,before:preview.before,after:preview.after,baseVersion:next.version};
 return {ok:true,lesson:next,undo,originalUnchanged:true};
}
export function undoAssistantInstruction(undo,currentDraft){
 if(!undo||!currentDraft||currentDraft.status!=='draft'||currentDraft.id!==undo.lessonId||
 currentDraft.version!==undo.baseVersion)return {ok:false,errors:['Undo target or version mismatch']};
 const screen=currentDraft.screens?.find(s=>s.id===undo.screenId);
 if(!screen||screen.instruction!==undo.after)return {ok:false,errors:['Screen changed after applying proposal']};
 const restored=deepCopy(currentDraft);
 restored.screens.find(s=>s.id===undo.screenId).instruction=undo.before;
 restored.version=currentDraft.version+1;
 return {ok:true,lesson:restored};
}
