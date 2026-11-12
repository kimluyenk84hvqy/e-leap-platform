import test from 'node:test';
import assert from 'node:assert/strict';
import {foundationPermissions,executeFoundationAction} from '../assets/js/authoring/foundation-lab-controls.js';
import {createFoundationLabModel,evaluateFoundationResponses} from '../assets/js/authoring/foundation-lab.js';
import {SYNTHETIC_READING_FIXTURE} from '../assets/js/authoring/source-structure-intake.js';
const make=(role='student')=>{const m=createFoundationLabModel(SYNTHETIC_READING_FIXTURE,{synthetic:true});m.role=role;m.originRole='teacher';m.phase=1;return m;};
test('Locked controls define permissions; no invented Submit in the lab',()=>{
 assert.equal(foundationPermissions('student',{synthetic:true,phase:1}).score,true);
 assert.equal(foundationPermissions('student',{synthetic:true,phase:1}).reveal,false);
 assert.equal(foundationPermissions('admin',{synthetic:true,phase:1}).reveal,true);
 assert.equal(foundationPermissions('presentation',{synthetic:true,phase:1}).check,false);
 assert.equal(foundationPermissions('guest',{synthetic:true,phase:1}).submit,false);
});
test('Score is hidden until student explicitly requests it and disappears on reset',()=>{
 const m=make();m.answers.set('Q1','A');
 assert.equal(m.scoreVisible,false);
 assert.equal(executeFoundationAction(m,'score'),true);assert.equal(m.scoreVisible,true);
 assert.equal(evaluateFoundationResponses(m).percentage,50);
 executeFoundationAction(m,'reset');assert.equal(m.scoreVisible,false);assert.equal(m.answers.size,0);
});
test('Admin answer reveal works and student cannot reveal',()=>{
 const m=make('admin');
 assert.equal(executeFoundationAction(m,'reveal',{questionId:'Q1'}),true);
 assert.equal(m.revealed.has('Q1'),true);
 m.role='student';m.revealed.clear();
 assert.equal(executeFoundationAction(m,'reveal',{questionId:'Q1'}),false);
});
test('Preview role cannot be silently upgraded by navigation and presentation exits',()=>{
 const m=make('guest');
 executeFoundationAction(m,'next');assert.equal(m.role,'guest');
 m.role='presentation';
 assert.equal(executeFoundationAction(m,'exit-presentation'),true);
 assert.equal(m.role,'teacher');
});
test('Unverified input may not expose Score regardless of claimed key',()=>{
 assert.equal(foundationPermissions('student',{synthetic:false,phase:1}).score,false);
});
