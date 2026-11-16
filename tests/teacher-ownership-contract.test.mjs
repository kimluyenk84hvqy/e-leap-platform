import test from 'node:test';
import assert from 'node:assert/strict';
import {teacherOwnsClass} from '../server/_auth.js';

test('teacher ownership checks linked research identity AND authenticated identity',async()=>{
 const calls=[];
 const sql=async(strings,...params)=>{
  const query=strings.join('?');calls.push({query,params});
  if(query.includes('SELECT user_id FROM users WHERE external_auth_id'))return [{user_id:'research-owner-id'}];
  if(query.includes('SELECT 1 FROM classes'))return [{present:1}];
  throw Error('Unexpected SQL: '+query);
 };
 const user={user_id:'auth-owner-id',email:'test-teacher@example.invalid',role:'teacher'};
 assert.equal(await teacherOwnsClass(sql,user,'class-uuid'),true);
 const ownership=calls.find(c=>c.query.includes('SELECT 1 FROM classes'));
 assert.ok(ownership.query.includes(' OR teacher_id='));
 assert.deepEqual(ownership.params,['class-uuid','research-owner-id','auth-owner-id']);
});
test('no owner access for an unauthenticated role',async()=>{
 const sql=async()=>{throw Error('No database access should be attempted');};
 assert.equal(await teacherOwnsClass(sql,{role:'student',user_id:'student-id'},'class-id'),false);
});
