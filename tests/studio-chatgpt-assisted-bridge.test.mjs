import test from 'node:test';
import assert from 'node:assert/strict';
import {createLesson,createScreen,createBlock} from '../assets/js/authoring/lesson-model.js';
import {
 createReviewRequest,validateChatGPTResponse,importChatGPTResponse,
 revertChatGPTRevision,recordTeacherReview,REQUEST_SCHEMA,RESPONSE_SCHEMA
} from '../assets/js/authoring/chatgpt-authoring-bridge.js';
const sourcePages=[{page:40,text:'Read the passage and find details about an unexpected school journey.'},{page:41,text:'A helpful friend asked a good question about school life.'}];
function lesson(){
 const x=createLesson({courseProfileId:'objective-first-b2',courseLabel:'Objective First B2'});
 x.courseProfileId='objective-first-b2';x.courseLabel='Objective First B2';x.status='draft';
 x.screens=[createScreen('Cover','My first lesson')];
 return x;
}
function request(x){
 return createReviewRequest(x,{requestId:'review-12345678',sourcePages,includeSource:true});
}
function response(req){
 return {schema:RESPONSE_SCHEMA,requestId:req.requestId,courseProfileId:req.courseProfileId,
  title:'School journey — revised',
  slides:[
   {title:'Look for main ideas',stage:'Reading',instruction:'Read and underline the main idea.',
    layout:'standard',sourcePage:40,sourceEvidence:'unexpected school journey',
    blocks:[{type:'text',text:'Read the text carefully.'},{type:'discussion',text:'Discuss your evidence with a partner.'}]},
   {title:'Evidence and why',stage:'Group work',instruction:'Share one idea and explain why.',
    layout:'two-column',sourcePage:41,sourceEvidence:'A helpful friend',
    blocks:[{type:'text',text:'Compare your responses with your group.'}]}
  ],
  reviews:{
   academic:{findings:['Check language level'],issues:['Review source activity 2']},
   visual:{findings:['Use large text'],issues:['Confirm projection legibility']},
   critical:{findings:['Student prompts are concise'],issues:['Teacher must verify correct answers'],missingMedia:['Audio track']}
  }
 };
}
test('AI handoff exports stable IDs, sanitized data, and consent-scoped page text',()=>{
 const x=lesson();const r=request(x);assert.equal(r.schema,REQUEST_SCHEMA);
 assert.equal(r.requestId,'review-12345678');assert.equal(r.courseProfileId,'objective-first-b2');
 assert.equal(r.source.pages.length,2);assert.equal(r.responseContract.schema,RESPONSE_SCHEMA);
 const without=createReviewRequest(x,{requestId:'review-12345678',sourcePages,includeSource:false});
 assert.equal(without.source.pages.length,0);assert.equal(without.source.sourceTextIncluded,false);
 const serialized=JSON.stringify(r);assert.ok(!serialized.includes('password'));
 assert.ok(!serialized.includes('accessToken'));assert.equal(x.screens.length,1);
});
test('Three-AI response imports into draft; retains revision and blocks auto publish',()=>{
 const x=lesson(),q=request(x),a=response(q);
 assert.deepEqual(validateChatGPTResponse(a,q),[]);
 const original=JSON.stringify(x);
 const out=importChatGPTResponse(x,a,q,{createScreen,createBlock});
 assert.equal(out.ok,true);assert.equal(out.lesson.screens.length,2);
 assert.equal(out.lesson.assistedAuthoring.revision,1);
 assert.equal(out.lesson.assistedAuthoring.teacherApproved,false);
 assert.equal(out.lesson.assistedAuthoring.status,'teacher-review-required');
 assert.equal(out.lesson.screens[0].blocks[1].activity.policy.studentSubmit,false);
 assert.equal(JSON.stringify(x),original,'Source draft must not be mutated');
 assert.equal(out.lesson.assistedAuthoring.history.length,1);
 const rollback=revertChatGPTRevision(out.lesson);
 assert.equal(rollback.ok,true);assert.equal(rollback.lesson.screens.length,1);
 assert.equal(rollback.lesson.assistedAuthoring.teacherApproved,false);
});
test('Import refuses wrong course, wrong review ID, missing critique, invented citation and answer key',()=>{
 const x=lesson(),q=request(x),a=response(q);
 for(const bad of [
  {...a,courseProfileId:'life'},
  {...a,requestId:'review-unrelated'},
  {...a,reviews:{...a.reviews,critical:null}},
  {...a,slides:[{...a.slides[0],sourceEvidence:'an invented source statement'}]},
  {...a,slides:[{...a.slides[0],blocks:[{type:'mcq',text:'Fake multiple choice',answerKey:'A'}]}]},
  {...a,slides:[{...a.slides[0],sourcePage:41}]},
  {...a,slides:[{...a.slides[0],sourceEvidence:''}]},
  {...a,reviews:{...a.reviews,critical:{...a.reviews.critical,missingMedia:[{unsafe:'bad'}]}}}
 ]){
  const out=importChatGPTResponse(x,bad,q,{createScreen,createBlock});
  assert.equal(out.ok,false);
 }
 const altered={...x,id:'lesson-other'};
 assert.equal(importChatGPTResponse(altered,a,q,{createScreen,createBlock}).ok,false);
});
test('Explicit teacher checks and substantive note required; approval remains preview only',()=>{
 const x=lesson(),q=request(x),a=response(q);
 const draft=importChatGPTResponse(x,a,q,{createScreen,createBlock}).lesson;
 assert.throws(()=>recordTeacherReview(draft,{verifiedSource:true,verifiedMedia:false,verifiedActivities:true,comment:'Checked source.'}));
 assert.throws(()=>recordTeacherReview(draft,{verifiedSource:true,verifiedMedia:true,verifiedActivities:true,comment:''}));
 const approved=recordTeacherReview(draft,{verifiedSource:true,verifiedMedia:true,verifiedActivities:true,comment:'Checked all source passages, answers and audio against the book.'});
 assert.equal(approved.assistedAuthoring.teacherApproved,true);
 assert.equal(approved.assistedAuthoring.status,'teacher-approved-for-preview');
 assert.equal(approved.status,'draft');
 assert.equal(draft.assistedAuthoring.teacherApproved,false);
});
test('Studio wires copy/download, JSON file/paste, import, revision, teacher QA controls',async()=>{
 const fs=await import('node:fs/promises');
 const s=await fs.readFile(new URL('../assets/js/authoring-studio.js',import.meta.url),'utf8');
 for(const marker of ['data-chatgpt-send','data-chatgpt-download','data-chatgpt-response','data-chatgpt-import','data-chatgpt-file','data-chatgpt-revert','data-chatgpt-approve','e-leap-chatgpt-review-request:','runQuality()']){
  assert.ok(s.includes(marker),marker);
 }
});
