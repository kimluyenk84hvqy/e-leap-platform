/** E-LEAP M3: authorized Preview HTTP E2E acceptance.
 * Run only with isolated synthetic account/assignment environment variables.
 * Credentials are read from environment; never printed or committed.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

const must=(key)=>{const value=process.env[key];if(!value)throw Error('Missing QA environment variable: '+key);return value;};
if(process.env.ELEAP_QA_CONFIRM!=='PREVIEW_SYNTHETIC_ONLY')throw Error('Explicit Preview QA opt-in required');
const base=new URL(must('ELEAP_QA_PREVIEW_URL'));
assert.equal(base.protocol,'https:','QA requires HTTPS');
assert.match(base.hostname,/^e-leap-platform-[a-z0-9-]+\.vercel\.app$/,'Only immutable Vercel Preview deployments are allowed');
if(base.pathname!=='/'||base.search||base.hash)throw Error('Use a deployment origin, not an arbitrary path');
const assignmentId=must('ELEAP_QA_ASSIGNMENT_ID');
const resourceId=must('ELEAP_QA_RESOURCE_ID');
const activityId=must('ELEAP_QA_ACTIVITY_ID');
const teacherEmail=must('ELEAP_QA_TEACHER_EMAIL'),teacherPassword=must('ELEAP_QA_TEACHER_PASSWORD');
const studentId=must('ELEAP_QA_STUDENT_ID'),studentPin=must('ELEAP_QA_STUDENT_PIN');

async function request(path,{method='GET',body,cookie}={}){
 const response=await fetch(new URL(path,base),{
  method,redirect:'manual',headers:{
   ...(body?{'Content-Type':'application/json',Origin:base.origin}:{}),
   ...(cookie?{Cookie:cookie}:{})
  },
  ...(body?{body:JSON.stringify(body)}:{})
 });
 let json={};
 try{json=await response.json()}catch{throw Error('Unexpected non-JSON response on '+path+' (HTTP '+response.status+')');}
 return {status:response.status,data:json,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const health=await request('/api/research/bootstrap');
assert.equal(health.status,200);
assert.equal(health.data.previewDatabaseBindingVerified,true,'Refuse a Preview deployment not bound to Neon Preview');
assert.equal(health.data.submissionsReady,true,'Schema gate must be READY');
const teacher=await request('/api/auth/login',{method:'POST',
 body:{email:teacherEmail,password:teacherPassword,expectedRole:'teacher'}});
assert.equal(teacher.status,200,'Teacher authentication failed');
assert.equal(teacher.data.user?.role,'teacher');
assert.ok(teacher.cookie,'Teacher session cookie missing');
const student=await request('/api/auth/student',{method:'POST',body:{studentId,pin:studentPin}});
assert.equal(student.status,200,'Student authentication failed');
assert.equal(student.data.user?.role,'student');
assert.ok(student.cookie,'Student session cookie missing');
const assigned=await request('/api/research/assignments',{cookie:student.cookie});
assert.equal(assigned.status,200);
assert.ok(assigned.data.assignments?.some(a=>a.assignment_id===assignmentId&&
 a.resource_id===resourceId&&a.activity_id===activityId&&a.status==='active'),'QA assignment not accessible to Student');
const requestId=randomUUID();
const answer={resourceId,activityId,value:{qa:'synthetic',value:'answer-a'}};
const payload={assignmentId,clientRequestId:requestId,response:answer};
const first=await request('/api/research/submissions',{method:'POST',cookie:student.cookie,body:payload});
assert.equal(first.status,201,'Initial Student POST not committed');
assert.ok(first.data.submission?.submission_id,'No server receipt');
const receipt=first.data.submission.submission_id;
const replay=await request('/api/research/submissions',{method:'POST',cookie:student.cookie,body:payload});
assert.equal(replay.status,200,'Identical replay should return stored receipt');
assert.equal(replay.data.idempotent,true);
assert.equal(replay.data.submission.submission_id,receipt);
const changed=await request('/api/research/submissions',{method:'POST',cookie:student.cookie,
 body:{...payload,response:{...answer,value:{qa:'synthetic',value:'tampered-answer'}}}});
assert.equal(changed.status,409,'Changed payload with reused request ID MUST fail');
assert.equal(changed.data.code,'IDEMPOTENCY_PAYLOAD_CONFLICT');
const wrong=await request('/api/research/submissions',{method:'POST',cookie:student.cookie,
 body:{...payload,clientRequestId:randomUUID(),response:{...answer,activityId:'wrong-activity'}}});
assert.equal(wrong.status,400);
assert.equal(wrong.data.code,'ACTIVITY_MISMATCH');
const studentRead=await request('/api/research/submissions?assignmentId='+encodeURIComponent(assignmentId),{cookie:student.cookie});
assert.equal(studentRead.status,200);
assert.ok(studentRead.data.submissions?.some(x=>x.submission_id===receipt),'Student reload lost the receipt');
const teacherRead=await request('/api/research/submissions?assignmentId='+encodeURIComponent(assignmentId),{cookie:teacher.cookie});
assert.equal(teacherRead.status,200);
assert.ok(teacherRead.data.submissions?.some(x=>x.submission_id===receipt),'Teacher cannot read Student receipt');
const teacherReload=await request('/api/research/submissions?assignmentId='+encodeURIComponent(assignmentId),{cookie:teacher.cookie});
assert.equal(teacherReload.status,200);
assert.ok(teacherReload.data.submissions?.some(x=>x.submission_id===receipt),'Teacher reload lost receipt');
console.log('PASS Preview HTTP auth → Student assignment → Submit → same-ID replay → tampered replay denied → teacher Responses → reload');
console.log(JSON.stringify({previewBinding:true,firstStatus:201,replayStatus:200,tamperStatus:409,wrongActivityStatus:400,studentReadStatus:200,teacherReadStatus:200,teacherReloadStatus:200}));
