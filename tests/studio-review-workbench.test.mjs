import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendTeachingMethod,previewStepInstructionEdit,acceptStepInstructionEdit,undoStepInstructionEdit,fingerprintReviewSource} from '../assets/js/authoring/studio-review-workbench.js';
const hash='a'.repeat(64);
const make=()=>({id:'lesson-u6',status:'draft',version:3,screens:[{id:'screen-u6',instruction:'Read the text.',sourceReviewDraft:{paragraphCount:3,questionCount:2,photoAssetsVerified:false},combo:{activeStep:'expert',steps:[{id:'expert',instruction:'Discuss clues with other experts.'},{id:'complete',instruction:'Complete textbook tasks.'}]},blocks:[{type:'text',comboStep:'assigned',jigsawAssignment:'A',content:{text:'A'}},{type:'text',comboStep:'assigned',jigsawAssignment:'B',content:{text:'B'}},{type:'text',comboStep:'assigned',jigsawAssignment:'C',content:{text:'C'}},{type:'discussion',comboStep:'complete',activity:{prompt:'Task 1'}},{type:'discussion',comboStep:'complete',activity:{prompt:'Task 2'}}]}]});
test('M2 accepts 3-source reading and explicitly rejects unsuitable group/time and missing tasks',()=>{
 const draft=make(),screen=draft.screens[0];
 const good=recommendTeachingMethod({screen,learnerCount:6,minutes:30});
 assert.equal(good.ok,true);assert.equal(good.methodId,'jigsaw-reading');
 assert.equal(good.canPublish,false);assert.ok(good.warnings.some(x=>/photograph/.test(x)));
 assert.equal(recommendTeachingMethod({screen,learnerCount:2,minutes:30}).ok,false);
 assert.equal(recommendTeachingMethod({screen,learnerCount:6,minutes:10}).ok,false);
 screen.blocks.pop();assert.equal(recommendTeachingMethod({screen,learnerCount:6,minutes:30}).ok,false);
});
test('M4 preview approval undo modifies ONLY chosen step and keeps source untouched',()=>{
 const original=make(),before=JSON.stringify(original);
 const preview=previewStepInstructionEdit({draft:original,screenId:'screen-u6',stepId:'expert',instruction:'Meet expert partners and record two clues and one reason.',sourceManifestHash:hash});
 assert.equal(preview.ok,true);
 assert.equal(acceptStepInstructionEdit(preview,original,{approved:false,currentSourceManifestHash:hash}).ok,false);
 const accepted=acceptStepInstructionEdit(preview,original,{approved:true,currentSourceManifestHash:hash});
 assert.equal(accepted.ok,true);
 assert.equal(JSON.stringify(original),before);
 assert.equal(accepted.lesson.screens[0].combo.steps[0].instruction,preview.after);
 assert.equal(accepted.lesson.screens[0].combo.steps[1].instruction,'Complete textbook tasks.');
 assert.deepEqual(accepted.lesson.screens[0].blocks,original.screens[0].blocks);
 const undone=undoStepInstructionEdit(accepted.undo,accepted.lesson,{currentSourceManifestHash:hash});
 assert.equal(undone.ok,true);
 assert.equal(undone.lesson.screens[0].combo.steps[0].instruction,'Discuss clues with other experts.');
});
test('M4 rejects wrong screen, wrong step, stale version and changed source',()=>{
 const lesson=make();
 const bad=previewStepInstructionEdit({draft:lesson,screenId:'unknown',stepId:'expert',instruction:'Use two clues and share them.',sourceManifestHash:hash});
 assert.equal(bad.ok,false);
 const preview=previewStepInstructionEdit({draft:lesson,screenId:'screen-u6',stepId:'expert',instruction:'Use two clues and share them.',sourceManifestHash:hash});
 assert.equal(acceptStepInstructionEdit(preview,{...lesson,version:4},{approved:true,currentSourceManifestHash:hash}).ok,false);
 assert.equal(acceptStepInstructionEdit(preview,lesson,{approved:true,currentSourceManifestHash:'b'.repeat(64)}).ok,false);
 assert.equal(undoStepInstructionEdit({baseVersion:4},lesson,{currentSourceManifestHash:hash}).ok,false);
});
test('M4 source fingerprint changes if source content changes',async()=>{
 const lesson=make();
 const a=await fingerprintReviewSource(lesson.screens[0]);
 lesson.screens[0].blocks[0].content.text='Changed passage';
 const b=await fingerprintReviewSource(lesson.screens[0]);
 assert.notEqual(a,b);
});
