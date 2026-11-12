import test from 'node:test';
import assert from 'node:assert/strict';
import {analyseExtractedText} from '../assets/js/authoring/source-structure-intake.js';
import {sourceIntakeToStudioReviewScreen,verifyComboStateTraversal} from '../assets/js/authoring/source-studio-review-adapter.js';
const fixture=`[PDF PAGE 41 — UNVERIFIED]
UNIT: 6
LESSON: Unit 6 Reading My first day
TASK: 1 | reading | Reading 1 and 2
PHOTO: Mavis Carver
PHOTO: Anita Green
PHOTO: Neil Johnson
PARAGRAPH A: On my first day at secondary school I was very excited.
PARAGRAPH B: I was eleven years old. I was frightened.
PARAGRAPH C: My first day at secondary school was fun!
Q1: Look at the three photographs and match them to the paragraphs.
Q2: Write the names and guess the years.`;
test('U6 p41 original three-account reading is parsed without invented keys',()=>{
 const parsed=analyseExtractedText(fixture);
 assert.equal(parsed.ok,true);assert.equal(parsed.source.tasks[0].paragraphs.length,3);
 assert.equal(parsed.source.tasks[0].questions.length,2);
 assert.equal(parsed.source.tasks[0].photos.length,3);
 assert.ok(parsed.source.tasks[0].questions.every(q=>q.suppliedKey===null));
});
test('U6 review adapter uses six steps and shared combo states without generated answers',()=>{
 const a=sourceIntakeToStudioReviewScreen(fixture);
 assert.equal(a.ok,true);assert.equal(a.screen.combo.steps.length,6);
 assert.equal(verifyComboStateTraversal(a.screen).ok,true);
 assert.equal(a.screen.sourceReviewDraft.photoAssetsVerified,false);
 assert.ok(a.screen.blocks.every(b=>!b.activity?.answerKey?.length));
 assert.deepEqual(a.screen.sourceReviewDraft.sourcePages,[41]);
 assert.equal(a.publishable,false);
});
test('U6 cannot silently omit source account C',()=>{
 const a=sourceIntakeToStudioReviewScreen(fixture.replace('PARAGRAPH C:', 'PARAGRAPH D:'));
 assert.equal(a.ok,false);
});
