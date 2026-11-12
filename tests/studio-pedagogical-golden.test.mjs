import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEACHING_COMBOS} from '../assets/js/authoring/teaching-combo-registry.js';
import {auditGoldenExample,auditGoldenLibrary,scorePedagogicalReview,PEDAGOGICAL_RUBRIC} from '../assets/js/authoring/pedagogical-golden-audit.js';
const library=JSON.parse(readFileSync(new URL('../assets/data/studio-golden-combos-v1.json',import.meta.url),'utf8'));
test('golden library: valid and mapped to existing runtime methods',()=>{
 const result=auditGoldenLibrary(library,{allowedMethods:Object.keys(TEACHING_COMBOS).concat('process-writing')});
 assert.equal(result.ok,true,JSON.stringify(result.issues));
 assert.equal(library.examples.length,7);
 assert.ok(result.reports.every(x=>x.state==='teacher-review-required'));
});
test('golden library cannot masquerade as sourced textbook answer',()=>{
 assert.match(library.sourcePolicy,/No example contains verified textbook answers/);
 assert.ok(library.examples.every(x=>x.status==='template-review'&&x.sourceRequirements.length>0));
});
test('structural audit blocks missing learner output',()=>{
 const broken=structuredClone(library.examples[0]);broken.steps[1].output='';
 assert.equal(auditGoldenExample(broken).ok,false);
});
test('structural audit blocks vague step instruction',()=>{
 const broken=structuredClone(library.examples[0]);broken.steps[1].instruction='Discuss.';
 assert.equal(auditGoldenExample(broken).ok,false);
});
test('pedagogical rubric rejects fabricated evidence even at full score',()=>{
 const perfect=Object.fromEntries(PEDAGOGICAL_RUBRIC.map(x=>[x,2]));
 assert.equal(scorePedagogicalReview(perfect).state,'teacher-review-required');
 assert.equal(scorePedagogicalReview(perfect,{blockers:['fabricated-evidence']}).state,'blocked');
});
test('teacher rubric rejects incomplete dimensions and scores under threshold',()=>{
 assert.equal(scorePedagogicalReview({}).ok,false);
 const low=Object.fromEntries(PEDAGOGICAL_RUBRIC.map(x=>[x,1]));
 assert.equal(scorePedagogicalReview(low).state,'blocked');
});
