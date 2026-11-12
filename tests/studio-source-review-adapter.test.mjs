import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceIntakeToStudioReviewScreen,verifyComboStateTraversal} from '../assets/js/authoring/source-studio-review-adapter.js';
import {SYNTHETIC_READING_FIXTURE} from '../assets/js/authoring/source-structure-intake.js';
import {ensureLessonSchema,createLesson} from '../assets/js/authoring/lesson-model.js';
import {auditLesson} from '../assets/js/quality/quality-gate.js';
test('adapter produces actual shared Studio screen with step-bound source blocks',()=>{
 const out=sourceIntakeToStudioReviewScreen(SYNTHETIC_READING_FIXTURE,{sourcePages:[141]});
 assert.equal(out.ok,true);
 assert.equal(out.screen.combo.steps.length,3);
 assert.equal(verifyComboStateTraversal(out.screen).ok,true);
 assert.equal(out.originalQuestions.length,2);
 assert.ok(out.screen.blocks.some(b=>b.comboStep==='read'&&b.type==='text'));
});
test('adapter cannot create AI-verified graded keys and blocks Publish',()=>{
 const out=sourceIntakeToStudioReviewScreen(SYNTHETIC_READING_FIXTURE);
 assert.equal(out.publishable,false);
 assert.ok(out.screen.blocks.every(b=>!b.activity?.answerKey?.length));
 const lesson=ensureLessonSchema(createLesson({screens:[...createLesson().screens,out.screen]}));
 assert.ok(auditLesson(lesson).some(([severity,message])=>severity==='error'&&message.includes('source review')));
});
test('incomplete or unsupported source cannot be inserted into Studio',()=>{
 assert.equal(sourceIntakeToStudioReviewScreen('UNIT: Test\nTASK: 1 | reading | Demo\nQ1: Why?').ok,false);
 assert.equal(sourceIntakeToStudioReviewScreen(SYNTHETIC_READING_FIXTURE.replace('reading |','listening |')).ok,false);
});
