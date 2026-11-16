import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAssignedResponse} from '../server/_submission-payload-contract.js';
const assignment={resource_id:'unit6-reading',activity_id:'exercise-1'};
const answer={resourceId:'unit6-reading',activityId:'exercise-1',value:{answers:['A','C']}};
test('accepts correctly assigned response and strips spoofed scores',()=>{
 const output=validateAssignedResponse(assignment,{...answer,studentId:'somebody-else',score:100,teacherOnly:true});
 assert.deepEqual(output,{ok:true,response:answer});
});
test('rejects wrong resource, activity, blank identity and unbound assignment',()=>{
 for(const input of [
 {...answer,resourceId:'another-lesson'},
 {...answer,activityId:'exercise-2'},
 {...answer,activityId:''},
 {resourceId:answer.resourceId,activityId:answer.activityId},
 {...answer,value:null}
 ])assert.equal(validateAssignedResponse(assignment,input).ok,false);
 assert.equal(validateAssignedResponse({...assignment,activity_id:null},answer).code,'ACTIVITY_MISMATCH');
});
test('accepts an unanswered string for later teacher review, not auto-grading',()=>{
 const result=validateAssignedResponse(assignment,{...answer,value:''});
 assert.equal(result.ok,true);
 assert.equal(result.response.value,'');
});
test('rejects oversized answers',()=>{
 const result=validateAssignedResponse(assignment,{...answer,value:'x'.repeat(65000)});
 assert.equal(result.code,'RESPONSE_TOO_LARGE');
});
