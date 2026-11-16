import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceIntakeToStudioReviewScreen} from '../assets/js/authoring/source-studio-review-adapter.js';
const source=`[PDF PAGE 41 — UNVERIFIED]
UNIT: 6
TASK: 1 | reading | My first day
PHOTO: Mavis Carver
PHOTO: Anita Green
PHOTO: Neil Johnson
PARAGRAPH A: Early secondary school included a science lab, and the girls were addressed by surname.
PARAGRAPH B: A boy who was eleven felt frightened and lost in the playground on his first day.
PARAGRAPH C: The pupils visited art rooms, computer rooms and a sports ground, then received homework.
Q1: Match each account to one of the three photographs.
Q2: Give the names and estimate the year each pupil started secondary school.`;
test('each account requires both Evidence and Why for photo matching and open estimated year',()=>{
 const draft=sourceIntakeToStudioReviewScreen(source);
 assert.equal(draft.ok,true);
 const blocks=draft.screen.blocks.filter(b=>b.comboStep==='evidence');
 assert.deepEqual(blocks.map(b=>b.jigsawEvidence.account),['A','B','C']);
 for(const b of blocks){
  assert.equal(b.jigsawEvidence.requiresEvidence,true);
  assert.equal(b.jigsawEvidence.requiresWhy,true);
  assert.equal(b.jigsawEvidence.openYearEstimate,true);
  assert.equal(b.jigsawEvidence.teacherReviewRequired,true);
  assert.ok(!b.activity?.answerKey?.length);
  assert.match(b.activity.prompt,/Reading 1/);
  assert.match(b.activity.prompt,/Reading 2/);
 }
 assert.equal(draft.publishable,false);
});
