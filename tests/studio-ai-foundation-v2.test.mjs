import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSourceManifest,canUseSource,verifyAnswerEvidence,evidenceForLearner} from '../assets/js/authoring/source-evidence-gate.js';
import {normalizeActivityContract} from '../assets/js/authoring/canonical-activity-contract.js';
import {validateProposalAgainstDraft} from '../assets/js/authoring/studio-ai-contract.js';
const H='a'.repeat(64);
const manifest={lessonId:'lesson-1',assets:[{assetId:'book-1',ownerId:'teacher-1',sha256:H,kind:'pdf',status:'teacher-approved',rights:'restricted'}]};
const draft={id:'lesson-1',version:5,status:'draft',screens:[{id:'screen-1',combo:{steps:[{id:'read'}]},blocks:[{id:'block-1',comboStep:'read'}]},{id:'screen-2',blocks:[]}]};
const p={schemaVersion:'studio-ai-proposal-v1',mode:'assistant',scope:{lessonId:'lesson-1',screenId:'screen-1',stepId:'read'},baseDraftVersion:5,sourceManifestHash:H,suggestions:[{id:'change-1',kind:'suggest-instruction',targetId:'block-1',instruction:'Underline two supporting reasons.',reviewStatus:'requires-teacher-approval',sourceRefs:[{assetId:'book-1',locator:'p.34'}]}]};
test('valid source manifest and strict source owner permission',()=>{
 assert.equal(validateSourceManifest(manifest).ok,true);
 assert.equal(canUseSource(manifest,'book-1','teacher-1'),true);
 assert.equal(canUseSource(manifest,'book-1','teacher-2'),false);
});
test('source-approved metadata does not permit invented keys without human evidence approval',()=>{
 const rec={questionId:'q1',assetId:'book-1',answerStatus:'ai-suggested',answer:'A',locator:'p34',sourceExcerpt:'A',reviewedBy:'teacher-1',reviewedAt:'2026-11-12'};
 assert.equal(verifyAnswerEvidence(rec,manifest,{ownerId:'teacher-1',questionId:'q1'}).ok,false);
 assert.equal(evidenceForLearner(rec,'teacher'),null);
 const approved={...rec,answerStatus:'teacher-approved'};
 assert.equal(verifyAnswerEvidence(approved,manifest,{ownerId:'teacher-1',questionId:'q1'}).ok,true);
 assert.equal(evidenceForLearner(approved,'student'),null);
});
test('AI Assistant target, step and source version are bound',()=>{
 assert.equal(validateProposalAgainstDraft(p,draft,{sourceManifestHash:H,allowedSourceIds:['book-1']}).ok,true);
 assert.equal(validateProposalAgainstDraft({...p,sourceManifestHash:'b'.repeat(64)},draft,{sourceManifestHash:H,allowedSourceIds:['book-1']}).ok,false);
 assert.equal(validateProposalAgainstDraft({...p,suggestions:[{...p.suggestions[0],targetId:'screen-2'}]},draft,{sourceManifestHash:H,allowedSourceIds:['book-1']}).ok,false);
 assert.equal(validateProposalAgainstDraft({...p,suggestions:[{...p.suggestions[0],targetId:'missing-block'}]},draft,{sourceManifestHash:H,allowedSourceIds:['book-1']}).ok,false);
 assert.equal(validateProposalAgainstDraft(p,{...draft,version:6},{sourceManifestHash:H,allowedSourceIds:['book-1']}).ok,false);
});
test('canonical activity blocks empty source or missing capture',()=>{
 const step={id:'read',mode:'individual',purpose:'Find text support',instruction:'Underline two reasons in paragraph A.',input:'Original paragraph A',support:'Look for because',output:'Two reasons recorded',feedback:'Compare to the verified passage',transition:'Share with your partner',outputCapture:'text',sourceRefs:['book-1']};
 assert.equal(normalizeActivityContract({methodId:'reading-jigsaw',lessonId:'lesson-1',sourceManifestHash:H,steps:[step]}).ok,true);
 assert.equal(normalizeActivityContract({methodId:'reading-jigsaw',lessonId:'lesson-1',sourceManifestHash:H,steps:[{...step,outputCapture:null}]}).ok,false);
});
