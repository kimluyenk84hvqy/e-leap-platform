import test from 'node:test';
import assert from 'node:assert/strict';
import {checkCourseActivity, courseImage, projectCourseLesson} from '../server/authoring/course-learner.js';

const assetId='6f5867af-4854-43c1-93b7-75f430956483';
const lesson={title:'Endangered',lessonNumber:'U4.1',screens:[{title:'Reading',teacherNotes:'staff-only',blocks:[
  {type:'text',audience:'teacher',content:{text:'staff-only'}},
  {type:'image',content:{assetId,alt:'Animal',src:'private-path'}},
  {id:'activity',type:'fill',activity:{prompt:'Fill in',evidenceByItem:{a:{why:'staff-only'}},
    items:[{id:'a',prompt:'First',answers:['private-key']},{id:'b',prompt:'Second',answers:['other-key']}]}}
]}]};

test('learner projection includes playable fields and scoped media without private data',()=>{
  const view=projectCourseLesson(lesson,'objective-first-b2-u04-l01');
  const payload=JSON.stringify(view);
  for(const denied of ['staff-only','private-path','private-key','answers','evidenceByItem']){
    assert.equal(payload.includes(denied),false);
  }
  assert.match(view.screens[0].blocks[0].src,/shellId=objective-first-b2-u04-l01/);
  assert.equal(courseImage(lesson,assetId),true);
  assert.equal(courseImage(lesson,'00000000-0000-0000-0000-000000000000'),false);
});

test('server check returns aggregate results and counts unanswered items in the total',()=>{
  assert.deepEqual(checkCourseActivity(lesson,'activity',{0:'private-key'}),
    {correctCount:1,answeredCount:1,totalCount:2});
  assert.equal(checkCourseActivity(lesson,'unknown',{}),null);
  assert.equal(checkCourseActivity(lesson,'activity',{0:['private-key']}),null);
});
