import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOpenedAssignment} from '../assets/js/runtime/active-assignment-context.js';
const id='5356ec9a-5e82-4087-a2c1-b5d7932f709e';
const now=Date.parse('2026-11-16T12:00:00Z');
const lesson={id:'u6-reading',resourceId:'u6-reading'};
const activity={id:'exercise-1'};
const active={assignmentId:id,resourceId:'u6-reading',activityId:'exercise-1',startedAt:'2026-11-16T11:00:00Z'};
test('matches exact assigned resource and activity only',()=>{
 assert.equal(resolveOpenedAssignment({lesson,activity,active,now}),id);
 assert.equal(resolveOpenedAssignment({lesson,activity:{id:'exercise-2'},active,now}),null);
 assert.equal(resolveOpenedAssignment({lesson:{id:'other'},activity,active,now}),null);
});
test('rejects stale, future or malformed assignment links',()=>{
 assert.equal(resolveOpenedAssignment({lesson,activity,active:{...active,assignmentId:'wrong'},now}),null);
 assert.equal(resolveOpenedAssignment({lesson,activity,active:{...active,startedAt:'2026-11-15T10:00:00Z'},now}),null);
 assert.equal(resolveOpenedAssignment({lesson,activity,active:{...active,startedAt:'2026-11-17T10:00:00Z'},now}),null);
});
