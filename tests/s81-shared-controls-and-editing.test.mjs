import test from 'node:test';
import assert from 'node:assert/strict';
import {ROLE_CONTROL_CONTRACT as c} from '../assets/js/controls/role-control-contract.js';
import {renderStudioControlDock} from '../assets/js/controls/studio-control-dock.js';
import {previewControls,renderInteractivePreview,classroomPreviewStateRole} from '../assets/js/authoring/interactive-preview.js';
import {mapFunctionalDraft,applyFunctionalContent,renderFunctionalSlide,renderFunctionalSlideProps,verifyFunctionalImageReference} from '../assets/js/authoring/functional-slide-library.js';
import {applyObjectiveContent,renderObjectiveEditor} from '../assets/js/authoring/activity-content-editor.js';
const actions=['check','reset','reveal'];
test('canonical Check extension only in Presentation; student/guest and teacher roles unchanged',()=>{
 assert.deepEqual(c.teacher.activity,actions);assert.deepEqual(c.admin.activity,actions);assert.deepEqual(c.presentation.activity,actions);
 assert.deepEqual(c.student.activity,['check','reset','submit','score']);assert.deepEqual(c.guest.activity,['check','reset','score']);assert.deepEqual(c.presentation.classroom,['exit-presentation']);
 for(const role of ['teacher','admin','presentation']){const h=renderStudioControlDock(role);for(const a of actions)assert.match(h,new RegExp(`data-studio-action="${a}"`));assert.doesNotMatch(h,/data-studio-action="submit"/);}
 for(const role of ['student','guest'])assert.equal(renderStudioControlDock(role),'');
 assert.equal(classroomPreviewStateRole('presentation'),classroomPreviewStateRole('teacher'));assert.notEqual(classroomPreviewStateRole('student'),classroomPreviewStateRole('teacher'));
});
const fill={id:'block-1',type:'fill',activity:{id:'activity-1',prompt:'Complete the gaps',items:[{id:'stable-7',prompt:'A ____ lives here.',answers:['fox']}],evidenceByItem:{'stable-7':{quote:'A fox lives here.',why:'The source identifies it.'}}}};
test('atomic fill edit preserves row identity and item-linked evidence',()=>{
 const b=structuredClone(fill);const f={prompt:'Complete the sentence.', 'row0-prompt':'A ____ lives here.','row0-answers':'fox; red fox','e0-quote':'A fox lives here.','e0-why':'The source identifies it.'};
 assert.ok(applyObjectiveContent(b,f));assert.equal(b.activity.id,'activity-1');assert.equal(b.activity.items[0].id,'stable-7');assert.deepEqual(b.activity.evidenceByItem,fill.activity.evidenceByItem);assert.deepEqual(b.activity.items[0].answers,['fox','red fox']);assert.match(renderObjectiveEditor(b),/Evidence · exact source quote/);
 const snapshot=JSON.stringify(b);assert.throws(()=>applyObjectiveContent(b,{...f,'row0-answers':''}));assert.equal(JSON.stringify(b),snapshot);
});
test('matching edit keeps stable IDs and rejects duplicate right-hand answers atomically',()=>{
 const b={type:'matching',activity:{prompt:'Match',pairs:[{id:'a9',left:'A',right:'one'},{id:'b7',left:'B',right:'two'}]}};const f={prompt:'Match the words','row0-left':'A','row0-right':'one','row1-left':'B','row1-right':'three'};assert.ok(applyObjectiveContent(b,f));assert.deepEqual(b.activity.pairs.map(x=>x.id),['a9','b7']);const prev=JSON.stringify(b);assert.throws(()=>applyObjectiveContent(b,{...f,'row1-right':'one'}));assert.equal(JSON.stringify(b),prev);
});
test('choice and ordering edits reject orphan or duplicate keys; order is explicitly editable',()=>{
 const b={type:'mcq',activity:{prompt:'Choose',options:[{id:'A',label:'One'},{id:'B',label:'Two'}],answerKey:['A']}};const f={prompt:'Choose one','row0-label':'One','row1-label':'Two',keys:'B','e0-why':'The answer follows the source.'};assert.ok(applyObjectiveContent(b,f));assert.deepEqual(b.activity.answerKey,['B']);assert.throws(()=>applyObjectiveContent(b,{...f,keys:'C'}));assert.throws(()=>applyObjectiveContent(b,{...f,keys:'A,B'}));
 const order={type:'ordering',activity:{prompt:'Order',items:[{id:'z',text:'Z'},{id:'x',text:'X'}],answerKey:['x','z']}};assert.ok(applyObjectiveContent(order,{prompt:'Order','row0-text':'Zed','row1-text':'Ex',keys:'z,x'}));assert.deepEqual(order.activity.answerKey,['z','x']);assert.throws(()=>applyObjectiveContent(order,{prompt:'Order','row0-text':'Zed','row1-text':'Ex',keys:'z,z'}));
});
test('category references validated; poll has no answer key; reveal policy preserved',()=>{
 const b={type:'categorising',activity:{prompt:'Sort',categories:['A','B'],items:[{id:'one',text:'Item',category:'A'}]}};assert.ok(applyObjectiveContent(b,{prompt:'Sort',categories:'A\nC','row0-text':'Item','row0-category':'C'}));assert.equal(b.activity.items[0].id,'one');assert.throws(()=>applyObjectiveContent(b,{prompt:'Sort',categories:'A\nC','row0-text':'Item','row0-category':'Z'}));
 const poll={type:'poll',activity:{prompt:'Choose',options:[{id:'A',label:'Yes'},{id:'B',label:'No'}]}};assert.ok(applyObjectiveContent(poll,{prompt:'Vote','row0-label':'Yes','row1-label':'No'}));assert.equal(poll.activity.answerKey,undefined);
 const f=structuredClone(fill);f.activity.policy={teacherReveal:false};assert.equal(previewControls(f,'presentation').find(x=>x.id==='reveal').enabled,false);assert.doesNotMatch(renderInteractivePreview(f,'student'),/The source identifies it/);
});
const privateImage='/api/studio-media?document=1&open=12345678-1234-1234-1234-123456789012';
function cover(){const d=mapFunctionalDraft({type:'lesson-part-cover',variant:'photo-right',values:{institution:'Institution',faculty:'Faculty',lessonCode:'U4.1',lessonTitle:'Endangered',course:'B2',lecturer:'Lecturer: Name'}});d.values.image=privateImage;d.values.imageAlt='Tiger';return {id:'cover',functionalDraft:d,blocks:[{id:'img',type:'image',content:{src:privateImage,assetId:'12345678-1234-1234-1234-123456789012',alt:'Tiger'}}]};}
test('functional Cover edit removes optional lecturer without touching image or other values',()=>{
 const s=cover(),before=structuredClone(s);assert.match(renderFunctionalSlideProps(s),/Lecturer \(optional\)/);assert.ok(applyFunctionalContent(s,{lecturer:''}));assert.doesNotMatch(renderFunctionalSlide(s,'teacher'),/Lecturer: Name/);assert.equal(s.functionalDraft.values.lecturer,'');assert.deepEqual(s.blocks,before.blocks);assert.equal(s.functionalDraft.values.lessonTitle,before.functionalDraft.values.lessonTitle);assert.equal(s.functionalDraft.publishStatus,'layout-review');
});
test('functional edit refuses invalid required text and unapproved image path, without mutation',()=>{
 const s=cover(),snapshot=JSON.stringify(s);assert.throws(()=>applyFunctionalContent(s,{institution:''}));assert.throws(()=>applyFunctionalContent(s,{image:'https://example.com/unsafe.jpg'}));assert.equal(JSON.stringify(s),snapshot);
});

test('replacement image uses owner-scoped Preview open, MIME and byte-range guard',async()=>{
 let requested=false;await verifyFunctionalImageReference(privateImage,async(url,opts)=>{requested=true;assert.equal(url,privateImage);assert.equal(opts.credentials,'same-origin');assert.equal(opts.headers.Range,'bytes=0-0');return new Response(new Uint8Array([255]),{status:206,headers:{'Content-Type':'image/jpeg'}});});assert.ok(requested);
 await assert.rejects(verifyFunctionalImageReference(privateImage,async()=>new Response('',{status:404})));await assert.rejects(verifyFunctionalImageReference(privateImage,async()=>new Response('',{headers:{'Content-Type':'application/pdf'}})));await assert.rejects(verifyFunctionalImageReference('https://example.com/x.jpg',async()=>{throw Error('must not fetch external URL')}),/existing private/);
});
