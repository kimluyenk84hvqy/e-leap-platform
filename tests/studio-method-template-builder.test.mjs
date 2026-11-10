import assert from 'node:assert/strict';
import {METHOD_COMBOS} from '../assets/js/authoring/method-combo-catalog.js';
import {createMethodTemplateScreen,changeMethodStep,methodTemplateIssues,renderMethodTemplateCanvas} from '../assets/js/authoring/method-template-builder.js';
for(const [id,spec] of Object.entries(METHOD_COMBOS)){
 const screen=createMethodTemplateScreen(id);
 assert.ok(screen, 'Method should have a safe Studio structure: '+id);
 assert.equal(screen.methodDraft.methodId,id);
 assert.equal(screen.methodDraft.steps.length,spec.steps.length);
 assert.equal(screen.blocks.length,0,'No fabricated activity or book text');
 assert.ok(screen.methodDraft.steps.every(s=>Object.keys(s.values).length===0));
 assert.ok(methodTemplateIssues(screen).length>0,'Publishing draft must fail');
 for(const role of ['student','guest','presentation']){
  const html=renderMethodTemplateCanvas(screen,role);
  assert.ok(html.includes('not yet available'),role+' must not see draft');
  assert.ok(!html.includes('Teacher-only slots'));
 }
 const html=renderMethodTemplateCanvas(screen,'teacher');
 assert.equal((html.match(/data-method-draft-step=/g)||[]).length,spec.steps.length);
 const final=spec.steps[spec.steps.length-1].id;
 assert.equal(changeMethodStep(screen,final),true);
 assert.equal(screen.methodDraft.activeStep,final);
 screen.methodDraft.publishStatus='published-verified';screen.methodDraft.sourceMapped=true;
 assert.ok(methodTemplateIssues(screen).length>0,'Client flag cannot bypass publishing gate');
}
assert.equal(createMethodTemplateScreen('not-found'),null);
console.log('29 method template Builder, empty slot, role and publish safety contracts passed.');
