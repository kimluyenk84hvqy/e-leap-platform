import test from 'node:test';
import assert from 'node:assert/strict';
import {analyseExtractedText,SYNTHETIC_READING_FIXTURE} from '../assets/js/authoring/source-structure-intake.js';
import {createFoundationLabModel,evaluateFoundationResponses} from '../assets/js/authoring/foundation-lab.js';
test('M1 extracts exact explicit task structure with line locations and flags keys unverified',()=>{
 const r=analyseExtractedText(SYNTHETIC_READING_FIXTURE);assert.equal(r.ok,true);
 assert.equal(r.source.tasks.length,1);assert.equal(r.source.tasks[0].questions.length,2);
 assert.equal(r.source.tasks[0].questions[0].options[0].label,'The community library');
 assert.equal(r.source.tasks[0].questions[0].sourceStatus,'unverified');
 assert.equal(r.readyForAi,false);assert.equal(r.readyForPublish,false);
 assert.ok(r.source.unverified.filter(x=>x.kind==='answer').length===2);
});
test('M1 fails closed on missing source task and audio reference',()=>{
 assert.equal(analyseExtractedText('UNIT: X\nQ1: Something?').ok,false);
 const r=analyseExtractedText('UNIT: X\nTASK: 2 | listening | Listen\nQ1: What?');
 assert.ok(r.source.tasks[0].missing.includes('Audio reference missing'));
});
test('M3 synthetic answers are scored with unanswered in denominator',()=>{
 const m=createFoundationLabModel(SYNTHETIC_READING_FIXTURE,{synthetic:true});
 assert.deepEqual(evaluateFoundationResponses(m).correct,0);
 m.answers.set('Q1','A');const score=evaluateFoundationResponses(m);
 assert.equal(score.correct,1);assert.equal(score.total,2);assert.equal(score.percentage,50);
});
test('M3 teacher-supplied answer keys are NEVER scored as verified',()=>{
 const m=createFoundationLabModel(SYNTHETIC_READING_FIXTURE);m.answers.set('Q1','A');
 const score=evaluateFoundationResponses(m);assert.equal(score.checked,false);assert.equal(score.correct,null);
});

test('M1 rejects task-local errors, not only document-global errors',()=>{
 const bad=analyseExtractedText('UNIT: Test\nTASK: 1 | reading | Demo\nQ1: Where?\nA) Only one\nKEY1: B');
 assert.equal(bad.ok,false);
 assert.ok(bad.problems.some(x=>x.includes('PASSAGE missing')));
 assert.ok(bad.problems.some(x=>x.includes('fewer than 2 options')));
 assert.ok(bad.problems.some(x=>x.includes('outside option list')));
});
test('M1 detects unexpected PDF page marker text as unparsed, not silently approved',()=>{
 const res=analyseExtractedText('[PDF PAGE 1 — UNVERIFIED]\nUNIT: Test\nTASK: 1 | reading | Demo\nPASSAGE: Test\nQ1: Where?\nA) A\nB) B');
 assert.equal(res.ok,false);
 assert.ok(res.problems.some(x=>/unrecognized source lines/.test(x)));
});
