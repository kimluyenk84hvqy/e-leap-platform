/* M2 / M4 dry-run workbench for teacher-only source review drafts.
 * NOT an AI provider, source verification, or server authorization layer.
 */
import {validateProposalAgainstDraft,AI_PROPOSAL_SCHEMA} from './studio-ai-contract.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const validHash=x=>/^[0-9a-f]{64}$/i.test(String(x||''));
const str=x=>String(x??'').trim();
export function recommendTeachingMethod({screen,learnerCount=3,minutes=25}={}){
 const findings=[],warnings=[];
 if(!screen?.sourceReviewDraft)return {ok:false,method:null,findings:[],warnings:['A source-mapped review screen is required']};
 const originalTasks=(screen.blocks||[]).filter(b=>b.comboStep==='complete'&&b.type==='discussion');
 const assigned=(screen.blocks||[]).filter(b=>b.comboStep==='assigned'&&b.jigsawAssignment);
 const labels=[...new Set(assigned.map(b=>b.jigsawAssignment))];
 if(screen.sourceReviewDraft.paragraphCount!==3||labels.join(',')!=='A,B,C')
  return {ok:false,method:null,findings:[],warnings:['Jigsaw requires three independently assigned source accounts A, B and C']};
 if(originalTasks.length!==screen.sourceReviewDraft.questionCount||originalTasks.length!==2)
  return {ok:false,method:null,findings:[],warnings:['Both original textbook tasks must be retained before proposing a method']};
 if(!Number.isInteger(learnerCount)||learnerCount<3)
  return {ok:false,method:null,findings:[],warnings:['Jigsaw needs at least three learners to cover A, B and C']};
 if(!Number.isFinite(minutes)||minutes<20)
  return {ok:false,method:null,findings:[],warnings:['Insufficient lesson time for individual, expert, home, textbook tasks, and evidence']};
 findings.push('Three distinct source accounts A/B/C support information-gap reading.');
 findings.push('Each student can become an expert and teach an account to the home group.');
 findings.push('The two original textbook tasks can be completed after peer information sharing.');
 if(learnerCount%3!==0)warnings.push('Group sizes do not divide evenly by three; teacher must assign extra members without leaving an account uncovered.');
 if(!screen.sourceReviewDraft.photoAssetsVerified)warnings.push('Original photographs are not attached/verified; use the source page during review.');
 warnings.push('Source and proposed answers remain unverified. This recommendation cannot authorize publication.');
 return {ok:true,methodId:'jigsaw-reading',label:'Jigsaw Reading · Evidence & Why',findings,warnings,reviewRequired:true,canPublish:false};
}
export function previewStepInstructionEdit({draft,screenId,stepId,instruction,sourceManifestHash}={}){
 const after=str(instruction),screen=draft?.screens?.find(x=>x.id===screenId);
 const step=screen?.combo?.steps?.find(x=>x.id===stepId),errors=[];
 if(!screen?.sourceReviewDraft)errors.push('Teacher source-review screen required');
 if(!step)errors.push('Selected step is missing');
 if(after.length<12||after.length>2000)errors.push('Instruction length must be 12–2000 characters');
 if(step&&after===step.instruction)errors.push('No actual change');
 if(!validHash(sourceManifestHash))errors.push('Source fingerprint is required');
 if(errors.length)return {ok:false,errors};
 const proposal={schemaVersion:AI_PROPOSAL_SCHEMA,mode:'assistant',
  scope:{lessonId:draft.id,screenId,stepId},
  baseDraftVersion:draft.version,sourceManifestHash,
  suggestions:[{id:'step-instruction-1',kind:'suggest-instruction',targetId:screenId,
   instruction:after,sourceRefs:[],reviewStatus:'requires-teacher-approval'}]};
 const checked=validateProposalAgainstDraft(proposal,draft,{sourceManifestHash,allowedSourceIds:[]});
 if(!checked.ok)return {ok:false,errors:checked.problems};
 return {ok:true,reviewRequired:true,proposal,screenId,stepId,
  before:step.instruction,after,sourceManifestHash,baseDraftVersion:draft.version};
}
export function acceptStepInstructionEdit(preview,draft,{approved=false,currentSourceManifestHash}={}){
 if(approved!==true)return {ok:false,errors:['Explicit teacher approval required']};
 if(!preview?.ok||preview.reviewRequired!==true)return {ok:false,errors:['Validated preview required']};
 if(!validHash(currentSourceManifestHash)||currentSourceManifestHash!==preview.sourceManifestHash)
  return {ok:false,errors:['Source fingerprint changed']};
 if(draft?.status!=='draft'||draft.id!==preview.proposal.scope.lessonId||
    draft.version!==preview.baseDraftVersion)return {ok:false,errors:['Stale or non-draft lesson']};
 const checked=validateProposalAgainstDraft(preview.proposal,draft,{sourceManifestHash:currentSourceManifestHash,allowedSourceIds:[]});
 if(!checked.ok)return {ok:false,errors:checked.problems};
 const screen=draft.screens?.find(s=>s.id===preview.screenId);
 if(!screen?.sourceReviewDraft)return {ok:false,errors:['Source review screen missing']};
 const step=screen.combo?.steps?.find(s=>s.id===preview.stepId);
 if(!step||step.instruction!==preview.before)return {ok:false,errors:['Step was edited since preview']};
 const next=clone(draft),target=next.screens.find(s=>s.id===preview.screenId),chosen=target.combo.steps.find(s=>s.id===preview.stepId);
 chosen.instruction=preview.after;
 if(target.combo.activeStep===preview.stepId)target.instruction=preview.after;
 next.version=draft.version+1;
 return {ok:true,lesson:next,undo:{lessonId:draft.id,screenId:preview.screenId,stepId:preview.stepId,before:preview.before,after:preview.after,baseVersion:next.version,sourceManifestHash:currentSourceManifestHash}};
}
export function undoStepInstructionEdit(undo,draft,{currentSourceManifestHash}={}){
 if(!undo||!validHash(currentSourceManifestHash)||undo.sourceManifestHash!==currentSourceManifestHash)
  return {ok:false,errors:['Source fingerprint changed']};
 if(draft?.status!=='draft'||draft.id!==undo.lessonId||draft.version!==undo.baseVersion)
  return {ok:false,errors:['Undo version or lesson mismatch']};
 const screen=draft.screens?.find(s=>s.id===undo.screenId);
 const step=screen?.combo?.steps?.find(s=>s.id===undo.stepId);
 if(!screen?.sourceReviewDraft||!step||step.instruction!==undo.after)
  return {ok:false,errors:['Step changed after approval']};
 const next=clone(draft),target=next.screens.find(s=>s.id===undo.screenId);
 target.combo.steps.find(s=>s.id===undo.stepId).instruction=undo.before;
 if(target.combo.activeStep===undo.stepId)target.instruction=undo.before;
 next.version=draft.version+1;
 return {ok:true,lesson:next};
}
export async function fingerprintReviewSource(screen){
 if(!screen?.sourceReviewDraft||!globalThis.crypto?.subtle)throw Error('Source fingerprint unavailable');
 const packed=JSON.stringify({metadata:screen.sourceReviewDraft,blocks:screen.blocks?.map(b=>({
  type:b.type,comboStep:b.comboStep,assignment:b.jigsawAssignment||null,text:b.content?.text||null,prompt:b.activity?.prompt||null}))});
 const bytes=new TextEncoder().encode(packed);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
