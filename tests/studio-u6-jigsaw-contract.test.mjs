import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceIntakeToStudioReviewScreen,verifyComboStateTraversal} from '../assets/js/authoring/source-studio-review-adapter.js';
const source=`[PDF PAGE 41 — UNVERIFIED]
UNIT: 6
TASK: 1 | reading | Three first days
PHOTO: Mavis Carver
PHOTO: Anita Green
PHOTO: Neil Johnson
PARAGRAPH A: An excited pupil visited the science lab.
PARAGRAPH B: A frightened pupil could not find a classroom.
PARAGRAPH C: A happy pupil met old friends and received homework.
Q1: Match the photographs with paragraphs A, B and C.
Q2: Write the names and estimate the years of starting secondary school.`;
test('U6 has a real jigsaw learning cycle, not serial whole-class reading',()=>{
 const result=sourceIntakeToStudioReviewScreen(source);
 assert.equal(result.ok,true);
 assert.deepEqual(result.screen.combo.steps.map(s=>s.id),['predict','assigned','expert','home','complete','evidence']);
 assert.deepEqual(result.screen.blocks.filter(b=>b.jigsawAssignment).map(b=>b.jigsawAssignment),['A','B','C']);
 assert.ok(result.screen.blocks.filter(b=>b.comboStep==='expert').length===3);
 assert.ok(result.screen.blocks.filter(b=>b.comboStep==='evidence').length===3);
 assert.equal(verifyComboStateTraversal(result.screen).ok,true);
});
test('U6 preserves both original tasks without invented source-verified keys or years',()=>{
 const r=sourceIntakeToStudioReviewScreen(source);
 assert.equal(r.originalQuestions.length,2);
 assert.equal(r.screen.sourceReviewDraft.yearEstimateIsOpenResponse,true);
 assert.ok(r.screen.blocks.every(b=>!b.activity?.answerKey?.length));
 assert.equal(r.publishable,false);
});
test('A missing photograph or source paragraph blocks review',()=>{
 assert.equal(sourceIntakeToStudioReviewScreen(source.replace('PHOTO: Anita Green\n','')).ok,false);
 assert.equal(sourceIntakeToStudioReviewScreen(source.replace('PARAGRAPH C:', 'PARAGRAPH D:')).ok,false);
});
