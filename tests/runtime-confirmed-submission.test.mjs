import test from 'node:test';
import assert from 'node:assert/strict';
import {ConfirmedAssignmentSubmission} from '../assets/js/runtime/confirmed-assignment-submission.js';
const opts={assignmentId:'assignment-123',resourceId:'lesson-123',activityId:'activity-123',response:'A'};
const reply=(payload,ok=true,status=200)=>({ok,status,json:async()=>payload});
const good=(onPost=()=>{})=>async(url,options)=>{
 if(url==='/api/auth/me')return reply({ok:true,user:{role:'student'}});
 if(url==='/api/research/assignments')return reply({ok:true,assignments:[{assignment_id:opts.assignmentId,resource_id:opts.resourceId,activity_id:opts.activityId,status:'active'}]});
 if(url==='/api/research/submissions'){onPost(options);return reply({ok:true,submission:{submission_id:'sub-123',assignment_id:opts.assignmentId,status:'submitted',attempt_no:1}},true,201);}
 throw Error('Unexpected '+url);
};
test('P0 success requires authenticated role, exact activity assignment and server receipt',async()=>{
 let posts=0;const service=new ConfirmedAssignmentSubmission({fetchImpl:good(req=>{posts++;assert.equal(req.credentials,'same-origin');assert.equal(JSON.parse(req.body).response.activityId,opts.activityId)})});
 const result=await service.submit(opts);assert.equal(result.submissionId,'sub-123');assert.equal(posts,1);
});
test('P0 never POSTS for wrong role, missing assignment or mismatched activity',async()=>{
 for(const type of ['role','missing','mismatch']){
  let post=0;
  const fetchImpl=async(url)=>{
   if(url==='/api/auth/me')return reply({ok:true,user:{role:type==='role'?'teacher':'student'}});
   if(url==='/api/research/assignments')return reply({ok:true,assignments:type==='missing'?[]:[{assignment_id:opts.assignmentId,resource_id:opts.resourceId,activity_id:'other',status:'active'}]});
   post++;throw Error('Should not post');
  };
  await assert.rejects(()=>new ConfirmedAssignmentSubmission({fetchImpl}).submit(opts),/NOT confirmed/);
  assert.equal(post,0);
 }
});
test('P0 network failure, HTTP rejection and fake success are NOT confirmed',async()=>{
 for(const failure of ['network','http','fake']){
  let calls=0;
  const fetchImpl=good(()=>{});
  const service=new ConfirmedAssignmentSubmission({fetchImpl:async(url,o)=>{
   if(url==='/api/research/submissions'){calls++;if(failure==='network')throw Error('Network lost');if(failure==='http')return reply({ok:false,error:'Denied'},false,403);return reply({ok:true,submission:{status:'submitted'}});}
   return fetchImpl(url,o);
  }});
  await assert.rejects(()=>service.submit(opts),/NOT confirmed/);assert.equal(calls,1);
 }
});
test('P0 concurrent double-click is blocked without duplicate POST',async()=>{
 let resume;let posts=0;
 const service=new ConfirmedAssignmentSubmission({fetchImpl:async(url,o)=>{
  if(url==='/api/research/submissions'){posts++;await new Promise(resolve=>{resume=resolve;});return reply({ok:true,submission:{submission_id:'sub-1',assignment_id:opts.assignmentId,attempt_no:1,status:'submitted'}},true,201);}
  return good()(url,o);
 }});
 const first=service.submit(opts);await Promise.resolve();await Promise.resolve();
 await assert.rejects(()=>service.submit(opts),/already in progress/);
 for(let i=0;i<10&&!resume;i++)await new Promise(r=>setTimeout(r,0));
 assert.equal(posts,1);resume();await first;
});
