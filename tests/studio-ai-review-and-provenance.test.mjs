import test from 'node:test';
import assert from 'node:assert/strict';
import {previewAssistantInstruction,acceptAssistantInstruction,undoAssistantInstruction} from '../assets/js/authoring/ai-instruction-review.js';
import {auditAiCandidate} from '../assets/js/authoring/ai-candidate-gate.js';
const H='a'.repeat(64);
const sourceManifest={lessonId:'lesson-1',assets:[{assetId:'book-1',ownerId:'teacher-1',sha256:H,kind:'pdf',status:'teacher-approved',rights:'restricted'}]};
const makeLesson=()=>({id:'lesson-1',status:'draft',version:3,screens:[{id:'screen-1',title:'Lead in',instruction:'Read the passage.',blocks:[]},{id:'screen-2',title:'Reading',instruction:'Compare.',blocks:[]}]});
const proposal=()=>({schemaVersion:'studio-ai-proposal-v1',mode:'assistant',scope:{lessonId:'lesson-1',screenId:'screen-1',stepId:null},baseDraftVersion:3,sourceManifestHash:H,suggestions:[{id:'change-1',kind:'suggest-instruction',targetId:'screen-1',instruction:'Read the passage. Underline two supporting reasons.',sourceRefs:[{assetId:'book-1',locator:'p34'}],reviewStatus:'requires-teacher-approval'}]});
const trust={sourceManifestHash:H,allowedSourceIds:['book-1']};
test('teacher may preview, accept, undo one scoped instruction; unrelated slide untouched',()=>{
 const original=makeLesson();const snapshot=JSON.stringify(original);
 const p=previewAssistantInstruction(proposal(),original,trust);
 assert.equal(p.ok,true);
 assert.equal(acceptAssistantInstruction(p,original,{approved:false,currentSourceManifestHash:H}).ok,false);
 const accepted=acceptAssistantInstruction(p,original,{approved:true,currentSourceManifestHash:H});
 assert.equal(accepted.ok,true);
 assert.equal(accepted.lesson.screens[1].instruction,'Compare.');
 assert.equal(original.screens[0].instruction,'Read the passage.');
 assert.equal(JSON.stringify(original),snapshot);
 assert.equal(accepted.lesson.version,4);
 const restored=undoAssistantInstruction(accepted.undo,accepted.lesson);
 assert.equal(restored.ok,true);assert.equal(restored.lesson.screens[0].instruction,'Read the passage.');
});
test('fail closed for wrong source, target, and stale copy',()=>{
 const original=makeLesson();
 assert.equal(previewAssistantInstruction(proposal(),original,{...trust,sourceManifestHash:'b'.repeat(64)}).ok,false);
 assert.equal(previewAssistantInstruction({...proposal(),suggestions:[{...proposal().suggestions[0],targetId:'screen-2'}]},original,trust).ok,false);
 const p=previewAssistantInstruction(proposal(),original,trust);
 assert.equal(acceptAssistantInstruction(p,{...original,version:4},{approved:true,currentSourceManifestHash:H}).ok,false);
 assert.equal(acceptAssistantInstruction(p,original,{approved:true,currentSourceManifestHash:'b'.repeat(64)}).ok,false);
});
test('AI draft with default answer key cannot pass verified evidence gate',()=>{
 const lesson=makeLesson();lesson.screens[0].blocks=[{type:'mcq',activity:{prompt:'Choose the answer',answerKey:['A'],options:[{id:'A',label:'Option A'},{id:'B',label:'Option B'}]}}];
 const check=auditAiCandidate(lesson,{sourceManifest,ownerId:'teacher-1',approvedBy:'teacher-1'});
 assert.equal(check.ok,false);assert.ok(check.failures.some(x=>/answer status/.test(x)));
});
test('AI answer gate accepts only independently teacher-reviewed evidence metadata',()=>{
 const lesson=makeLesson();lesson.screens[0].blocks=[{type:'mcq',activity:{prompt:'Which is mentioned?',answerKey:['A'],answerStatus:'teacher-approved',sourceVerification:'teacher-approved',sourceQuestionIds:['q1'],options:[{id:'A',label:'Item A'},{id:'B',label:'Item B'}]}}];
 const evidenceRegistry={q1:{questionId:'q1',assetId:'book-1',answer:'A',answerStatus:'teacher-approved',locator:'p.34 paragraph B',sourceExcerpt:'Text A',reviewedBy:'teacher-1',reviewedAt:'2026-11-12'}};
 assert.equal(auditAiCandidate(lesson,{sourceManifest,ownerId:'teacher-1',approvedBy:'teacher-1',evidenceRegistry}).ok,true);
 assert.equal(auditAiCandidate(lesson,{sourceManifest,ownerId:'teacher-1',approvedBy:'teacher-2',evidenceRegistry}).ok,false);
});
