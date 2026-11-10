import assert from 'node:assert/strict';
import {TEACHING_COMBOS,createTeachingCombo,comboStep,setComboStep,activeComboBlocks} from '../assets/js/authoring/teaching-combo-registry.js';
import {validateVisualContracts} from '../assets/js/authoring/visual-template-contracts.js';

for(const [id,combo] of Object.entries(TEACHING_COMBOS)){
 const screens=createTeachingCombo(id);
 assert.equal(screens.length,1,id+' must be ONE screen, never one screen per step');
 const screen=screens[0],steps=screen.combo.steps;
 assert.ok(steps.length>=3,id+' must contain pedagogical progression');
 assert.equal(comboStep(screen).id,steps[0].id);
 const blockIds=new Set(screen.blocks.map(b=>b.id));
 assert.equal(blockIds.size,screen.blocks.length,id+' must have unique blocks');
 for(const step of steps){
  assert.equal(setComboStep(screen,step.id),true);
  const active=activeComboBlocks(screen);
  assert.ok(active.length>=1,id+' step '+step.id+' is empty');
  assert.ok(active.every(b=>b.comboStep===step.id));
  assert.equal(screen.instruction,step.instruction);
  assert.ok(step.instruction.length>12,'learner step instruction must be meaningful');
 }
 assert.equal(setComboStep(screen,'not-a-step'),false);
 const issues=validateVisualContracts({screens});
 assert.ok(!issues.some(([severity,msg])=>severity==='error'&&/too many blocks|unknown state|combo state/.test(msg)),id+' state contract failed: '+JSON.stringify(issues));
}
const jigsaw=createTeachingCombo('reading-jigsaw')[0];
assert.deepEqual(jigsaw.combo.steps.map(s=>s.id),['read','expert','share','complete']);
const broken=createTeachingCombo('reading-jigsaw')[0];
broken.combo.steps[0].instruction='';
assert.ok(validateVisualContracts({screens:[broken]}).some(([k,m])=>k==='error'&&/combo state/.test(m)));
console.log('All 8 multi-state teaching combo contracts passed.');
