/* Optional additional gate exclusively for AI-authored draft candidates.
 * Legacy lessons remain unchanged; never treat placeholder keys as verified.
 * Model-provided status is untrusted and must be matched with a trusted
 * server-authorized source manifest and evidence-review record.
 */
import {verifyAnswerEvidence,validateSourceManifest} from './source-evidence-gate.js';
const OBJECTIVE=new Set(['mcq','multi-select','true-false','fill','matching','ordering','categorising','listening','video-question']);
const ANSWER_STATUS=new Set(['source-verified','teacher-approved']);
export function auditAiCandidate(lesson,{sourceManifest,ownerId,evidenceRegistry={},approvedBy=null}={}){
 const failures=[];
 if(!lesson||lesson.status!=='draft')failures.push('AI candidate must remain a draft');
 if(!validateSourceManifest(sourceManifest).ok||sourceManifest?.lessonId!==lesson?.id)failures.push('Trusted lesson source manifest required');
 if(!ownerId||!approvedBy||ownerId!==approvedBy)failures.push('Authorized human approval record required');
 for(const [si,screen] of (lesson?.screens||[]).entries()){
  for(const [bi,block] of (screen.blocks||[]).entries()){
   const a=block.activity,where='Slide '+(si+1)+' block '+(bi+1);
   if(!a||!OBJECTIVE.has(block.type))continue;
   if(!ANSWER_STATUS.has(a.answerStatus))failures.push(where+': answer status has not been verified');
   if(a.sourceVerification!=='teacher-approved')failures.push(where+': teacher source verification missing');
   const refs=a.sourceQuestionIds;
   if(!Array.isArray(refs)||!refs.length)failures.push(where+': original question references missing');
   else for(const qid of refs){
    const record=evidenceRegistry[qid];
    const requiredKind=block.type==='listening'?'audio':'text';
    const result=verifyAnswerEvidence(record,sourceManifest,{ownerId,questionId:qid,requiredKind});
    if(!result.ok)failures.push(where+' / '+qid+': '+result.issues.join('; '));
   }
   if(a.policy?.studentReveal===true)failures.push(where+': student answer reveal forbidden in AI candidate');
  }
 }
 return {ok:failures.length===0,failures,state:failures.length?'blocked':'human-reviewed-candidate'};
}
