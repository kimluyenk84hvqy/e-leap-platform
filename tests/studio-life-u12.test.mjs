import assert from 'node:assert/strict';
import {makeLifeU12AcceptanceFixture,lifeU12FixtureCoverage,LIFE_U12_FIXTURE_ID} from '../assets/js/authoring/pilot-life-u12.js';
import {auditLesson} from '../assets/js/quality-gate.js';
import {learnerBlockReady} from '../assets/js/authoring/learner-preview-policy.js';
import {validateVisualContracts} from '../assets/js/authoring/visual-template-contracts.js';

const lesson=makeLifeU12AcceptanceFixture();
const coverage=lifeU12FixtureCoverage(lesson);
assert.equal(lesson.id,LIFE_U12_FIXTURE_ID);
assert.ok(coverage.slides>=20,'Opener, A and B require a full test sample');
for(const stage of ['Opener','12A','12B']){
 assert.ok(coverage.sections.includes(stage),stage+' missing');
}
assert.equal(coverage.withoutSource,0,'All slide content must trace to the original book/PPT');
assert.deepEqual(coverage.audioTracks,[93,95,96]);
assert.ok(coverage.missingMedia.length>0,'Audio/photos intentionally unlinked before private upload');
assert.equal(lesson.screens[0].templateId,'lesson-cover');
const evidenceScreen=lesson.screens.find(s=>s.title==='Find your evidence');
assert.ok(evidenceScreen,'Reading Evidence screen missing');
const passage=evidenceScreen.blocks.find(b=>b.type==='text')?.content?.text||'';
const evidenceActivity=evidenceScreen.blocks.find(b=>b.activity?.evidenceByItem)?.activity;
assert.equal(Object.keys(evidenceActivity?.evidenceByItem||{}).length,6);
for(const entry of Object.values(evidenceActivity.evidenceByItem)){
 assert.ok(passage.includes(entry.quote),'Evidence must locate a real passage span');
 assert.ok(entry.why.length>15,'Why must explain the answer');
}
const jigsaw=lesson.screens.find(s=>s.combo?.steps?.length===4);
assert.ok(jigsaw,'Reading Jigsaw combo missing');
assert.equal(jigsaw.templateId,'reading-task');
assert.deepEqual(jigsaw.combo.steps.map(s=>s.id),['read','expert','share','complete']);
assert.ok(jigsaw.blocks.some(b=>b.type==='text'&&!b.comboStep&&learnerBlockReady(b)),
 'Reading summary must remain visible on every Jigsaw stage');
const matching=jigsaw.blocks.find(b=>b.comboStep==='complete'&&b.type==='matching');
assert.equal(matching.activity.pairs.length,4,'Four reading expert sections must be matched');
assert.equal(Object.keys(matching.activity.evidenceByItem||{}).length,4,'Evidence–Why must be integrated into all four Complete items');
const jigsawReading=jigsaw.blocks.find(b=>b.type==='text').content.text;
for(const item of Object.values(matching.activity.evidenceByItem))assert.ok(jigsawReading.includes(item.quote)&&item.why.length>12);
const grammar=lesson.screens.find(s=>s.combo?.steps?.length===3&&s.templateId==='grammar-presentation');
assert.ok(grammar,'Grammar Discovery combo missing');
assert.deepEqual(grammar.combo.steps.map(s=>s.id),['notice','discover','practise']);
const mcq=grammar.blocks.find(b=>b.comboStep==='practise'&&b.type==='mcq');
assert.ok(learnerBlockReady(mcq));
assert.deepEqual(mcq.activity.answerKey,['B']);
assert.equal(validateVisualContracts(lesson).filter(([kind])=>kind==='error').length,0,
 'U12 fixture must pass reusable visual and combo contracts');
for(const slide of lesson.screens){
 assert.equal(slide.audience,'student');
 assert.ok(slide.sourceRefs.bookPages.length,'Missing source reference');
 assert.ok(!slide.blocks.some(b=>/life_page_|book_page_|page_scan/i.test(b.content?.src||'')));
 assert.ok(!slide.blocks.some(b=>b.type==='text'&&/teacher should|template id|developer note/i.test(b.content?.text||'')));
}
const issues=auditLesson(lesson);
assert.ok(issues.some(([severity,message])=>severity==='error'&&/source missing/.test(message)),
 'Pilot must BLOCK Publish until real licensed media is connected');
console.log('LIFE U12 Pilot coverage',JSON.stringify({
 slides:coverage.slides,sections:coverage.sections,missingMedia:coverage.missingMedia.length,
 qualityErrors:issues.filter(([k])=>k==='error').length
}));
