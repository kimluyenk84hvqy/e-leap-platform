/* E-LEAP Source/Evidence gate v2 — deterministic, fail-closed, no model calls.
 * A model-produced "verified" label has no authority. Trust only independently
 * reviewed records carried by the server's authorized manifest.
 */
export const SOURCE_STATUSES=Object.freeze(['pending','extracted','source-reviewed','teacher-approved']);
export const ANSWER_STATUSES=Object.freeze(['placeholder','ai-suggested','source-verified','teacher-approved']);
const id=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(x);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
export function validateSourceManifest(manifest){
 const issues=[];
 if(!manifest||typeof manifest!=='object'||!Array.isArray(manifest.assets))return {ok:false,issues:['Source manifest assets missing']};
 if(!id(manifest.lessonId))issues.push('Invalid lesson ID');
 const seen=new Set();
 for(const a of manifest.assets){
  if(!id(a?.assetId)||seen.has(a.assetId))issues.push('Invalid/duplicate assetId');else seen.add(a.assetId);
  if(!sha(a?.sha256))issues.push('Missing content hash');
  if(!['pdf','pptx','docx','text','audio','image'].includes(a?.kind))issues.push('Unsupported asset kind');
  if(!SOURCE_STATUSES.includes(a?.status))issues.push('Unsupported source status');
  if(!id(a?.ownerId))issues.push('Source ownership not established');
  if(!['cleared','restricted','unknown'].includes(a?.rights))issues.push('Source rights status missing');
 }
 return {ok:issues.length===0,issues};
}
export function canUseSource(manifest,assetId,ownerId,{needTeacherApproval=false}={}){
 if(!validateSourceManifest(manifest).ok||!id(ownerId))return false;
 const a=manifest.assets.find(x=>x.assetId===assetId);
 return !!a&&a.ownerId===ownerId&&a.rights!=='unknown'&&
  (needTeacherApproval?a.status==='teacher-approved':['source-reviewed','teacher-approved'].includes(a.status));
}
export function verifyAnswerEvidence(record,manifest,{ownerId,questionId,requiredKind='text'}={}){
 const issues=[];
 if(!id(questionId)||record?.questionId!==questionId)issues.push('Question ID mismatch');
 if(!id(record?.assetId)||!canUseSource(manifest,record.assetId,ownerId,{needTeacherApproval:true}))issues.push('Source not teacher-approved or inaccessible');
 if(!['source-verified','teacher-approved'].includes(record?.answerStatus))issues.push('Answer is unverified');
 if(!record?.answer||typeof record.answer!=='string'||!record.answer.trim())issues.push('Verified answer is missing');
 if(typeof record?.locator!=='string'||!record.locator.trim()||record.locator.length>240)issues.push('Precise evidence locator missing');
 if(requiredKind==='audio'){
  if(!Number.isFinite(record?.startSeconds)||!Number.isFinite(record?.endSeconds)||record.startSeconds<0||record.endSeconds<=record.startSeconds)issues.push('Invalid verified audio boundaries');
 }else if(requiredKind==='text'){
  if(typeof record?.sourceExcerpt!=='string'||!record.sourceExcerpt.trim())issues.push('Verified source excerpt missing');
 }
 // This checks authoritative review metadata, not semantic truth.
 if(record?.reviewedBy!==ownerId||!record?.reviewedAt)issues.push('Human evidence review missing');
 return {ok:issues.length===0,issues};
}
export function evidenceForLearner(record,role){
 if(!['teacher','admin','presentation'].includes(role))return null;
 if(!record||!['source-verified','teacher-approved'].includes(record.answerStatus)||!record.reviewedBy)return null;
 return {questionId:record.questionId,answer:record.answer,locator:record.locator,why:record.why||null};
}
