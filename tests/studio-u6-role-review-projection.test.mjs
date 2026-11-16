import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceIntakeToStudioReviewScreen,projectJigsawRoleForReview} from '../assets/js/authoring/source-studio-review-adapter.js';
const input=`[PDF PAGE 41 — UNVERIFIED]
UNIT: 6
TASK: 1 | reading | My first day
PHOTO: Mavis Carver
PHOTO: Anita Green
PHOTO: Neil Johnson
PARAGRAPH A: ACCOUNT_ALPHA_PRIVATE_CLUE: enjoyed a science lesson.
PARAGRAPH B: ACCOUNT_BRAVO_PRIVATE_CLUE: could not find the classroom.
PARAGRAPH C: ACCOUNT_CHARLIE_PRIVATE_CLUE: met old friends.
Q1: Match the three photographs to paragraphs A, B and C.
Q2: Give names and estimated years of entering secondary school.`;
const source=sourceIntakeToStudioReviewScreen(input);
test('Teacher review simulates the assigned text for each role without exposing other account blocks',()=>{
 assert.equal(source.ok,true);
 for(const [role,expected,other] of [
  ['A','ACCOUNT_ALPHA_PRIVATE_CLUE',['ACCOUNT_BRAVO_PRIVATE_CLUE','ACCOUNT_CHARLIE_PRIVATE_CLUE']],
  ['B','ACCOUNT_BRAVO_PRIVATE_CLUE',['ACCOUNT_ALPHA_PRIVATE_CLUE','ACCOUNT_CHARLIE_PRIVATE_CLUE']],
  ['C','ACCOUNT_CHARLIE_PRIVATE_CLUE',['ACCOUNT_ALPHA_PRIVATE_CLUE','ACCOUNT_BRAVO_PRIVATE_CLUE']]
 ]){
  const result=projectJigsawRoleForReview(source.screen,{role,step:'assigned'});
  assert.equal(result.ok,true);
  assert.equal(result.publishable,false);
  assert.equal(result.screen.sourceReviewProjection.secureLearnerAccess,false);
  const rendered=JSON.stringify(result.screen.blocks);
  assert.ok(rendered.includes(expected));
  for(const fragment of other)assert.ok(!rendered.includes(fragment));
  assert.equal(result.screen.blocks.length,1);
 }
 assert.equal(source.screen.blocks.filter(b=>b.comboStep==='assigned').length,3,'Original teacher draft must remain unchanged');
});
test('Expert stage shows only the matching expert prompt; home group and source tasks remain shareable',()=>{
 for(const role of ['A','B','C']){
  const expert=projectJigsawRoleForReview(source.screen,{role,step:'expert'});
  assert.equal(expert.ok,true);
  assert.equal(expert.screen.blocks.length,1);
  assert.match(expert.screen.blocks[0].activity.prompt,new RegExp('EXPERT '+role));
  const home=projectJigsawRoleForReview(source.screen,{role,step:'home'});
  assert.equal(home.ok,true);
  assert.equal(home.screen.blocks.length,1);
  assert.match(home.screen.blocks[0].activity.prompt,/HOME GROUP/);
  const complete=projectJigsawRoleForReview(source.screen,{role,step:'complete'});
  assert.equal(complete.screen.blocks.length,2,'Both original book exercises remain available');
  assert.equal(complete.screen.blocks.every(b=>!b.activity?.answerKey?.length),true);
 }
});
test('Role projection fails closed on invalid roles, invalid steps or verified/published screens',()=>{
 assert.equal(projectJigsawRoleForReview(source.screen,{role:'Teacher',step:'assigned'}).ok,false);
 assert.equal(projectJigsawRoleForReview(source.screen,{role:'A',step:'publish'}).ok,false);
 assert.equal(projectJigsawRoleForReview({...source.screen,sourceReviewDraft:{...source.screen.sourceReviewDraft,status:'verified'}},{role:'A',step:'assigned'}).ok,false);
});
