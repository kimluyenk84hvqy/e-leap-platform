import test from 'node:test';
import assert from 'node:assert/strict';
import {ConfirmedAssignmentSubmission} from '../assets/js/runtime/confirmed-assignment-submission.js';
const opts={assignmentId:'assignment-123',resourceId:'lesson-123',activityId:'activity-123',response:'A'};
const UUID='10000000-0000-4000-8000-000000000001';
const UUID2='10000000-0000-4000-8000-000000000002';
const reply=(payload,ok=true,status=200)=>({ok,status,json:async()=>payload});
const storage=()=>{const items=new Map();return {getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k),items};};
const client=(fetchImpl,store=storage(),factory=()=>UUID)=>{
 const service=new ConfirmedAssignmentSubmission({fetchImpl,idFactory:factory,storage:store});
 service.fingerprint=async r=>'fingerprint:'+JSON.stringify(r); // pure test substitute for WebCrypto
 return service;
};
const good=(onPost=()=>{})=>async(url,options)=>{
 if(url==='/api/auth/me')return reply({ok:true,user:{role:'student',user_id:'student-uuid'}});
 if(url==='/api/research/assignments')return reply({ok:true,assignments:[{assignment_id:opts.assignmentId,resource_id:opts.resourceId,activity_id:opts.activityId,status:'active'}]});
 if(url==='/api/research/submissions'){onPost(options);return reply({ok:true,submission:{submission_id:'sub-123',assignment_id:opts.assignmentId,status:'submitted',attempt_no:1}},true,201);}
 throw Error('Unexpected '+url);
};
test('P0 success requires student, matching assignment, UUID request and server receipt',async()=>{
 let posts=0;const service=client(good(req=>{
  posts++;assert.equal(req.credentials,'same-origin');
  assert.equal(JSON.parse(req.body).clientRequestId,UUID);
  assert.equal(JSON.parse(req.body).response.activityId,opts.activityId);
 }));
 const result=await service.submit(opts);assert.equal(result.submissionId,'sub-123');assert.equal(posts,1);
});
test('P0 fails closed on wrong role, missing assignment and mismatched activity',async()=>{
 for(const type of ['role','missing','mismatch']){
  let post=0;
  const fetchImpl=async(url)=>{
   if(url==='/api/auth/me')return reply({ok:true,user:{role:type==='role'?'teacher':'student',user_id:'student-uuid'}});
   if(url==='/api/research/assignments')return reply({ok:true,assignments:type==='missing'?[]:[{assignment_id:opts.assignmentId,resource_id:opts.resourceId,activity_id:'wrong',status:'active'}]});
   post++;throw Error('Should not POST');
  };
  await assert.rejects(()=>client(fetchImpl).submit(opts),/NOT confirmed/);
  assert.equal(post,0);
 }
});
test('P0 network, HTTP failure and fake success do not produce receipt',async()=>{
 for(const failure of ['network','http','fake']){
  let posts=0;
  const service=client(async(url,o)=>{
   if(url==='/api/research/submissions'){
    posts++;if(failure==='network')throw Error('Network lost');
    if(failure==='http')return reply({ok:false,error:'Denied'},false,403);
    return reply({ok:true,submission:{status:'submitted'}});
   }
   if(url.startsWith('/api/research/submissions?'))return reply({ok:true,submissions:[]});
   return good()(url,o);
  });
  await assert.rejects(()=>service.submit(opts),/NOT confirmed/);assert.equal(posts,1);
 }
});
test('P0 double click sends exactly one POST per pending request',async()=>{
 let resume,posts=0;
 const service=client(async(url,o)=>{
  if(url==='/api/research/submissions'){
   posts++;await new Promise(resolve=>{resume=resolve;});
   return reply({ok:true,submission:{submission_id:'sub-1',assignment_id:opts.assignmentId,attempt_no:1,status:'submitted'}},true,201);
  }
  return good()(url,o);
 });
 const first=service.submit(opts);
 await assert.rejects(()=>service.submit(opts),/already in progress/);
 for(let i=0;i<20&&!resume;i++)await new Promise(r=>setTimeout(r,0));
 assert.equal(posts,1);resume();await first;
});
test('P0 lost POST acknowledgment can be reconciled by GET using the same server UUID',async()=>{
 let posts=0;
 const service=client(async(url,o)=>{
  if(url==='/api/research/submissions'){posts++;throw Error('Post acknowledgment dropped');}
  if(url.startsWith('/api/research/submissions?'))return reply({ok:true,submissions:[{
   submission_id:'receipt-1',assignment_id:opts.assignmentId,client_request_id:UUID,attempt_no:1,status:'submitted'
  }]});
  return good()(url,o);
 });
 const r=await service.submit(opts);assert.equal(r.submissionId,'receipt-1');assert.equal(posts,1);
});
test('P0 unconfirmed request keeps UUID across retry and new instance; clears after success',async()=>{
 const store=storage();let posts=0;const seen=[];
 const fetchImpl=async(url,o)=>{
  if(url==='/api/research/submissions'){
   seen.push(JSON.parse(o.body).clientRequestId);posts++;
   if(posts===1)throw Error('Network interrupted');
   return reply({ok:true,submission:{submission_id:'receipt-2',assignment_id:opts.assignmentId,attempt_no:1,status:'submitted'}},true,201);
  }
  if(url.startsWith('/api/research/submissions?'))return reply({ok:true,submissions:[]});
  return good()(url,o);
 };
 const first=client(fetchImpl,store);
 await assert.rejects(()=>first.submit(opts),/NOT confirmed/);
 const second=client(fetchImpl,store,()=>UUID2);
 const recovered=await second.submit(opts);
 assert.equal(recovered.submissionId,'receipt-2');
 assert.deepEqual(seen,[UUID,UUID]);
 assert.equal(store.items.size,0);
});

test('browser default fetch keeps Window/global receiver (prevents Illegal invocation)',async()=>{
 const original=globalThis.fetch;
 let calls=0;
 globalThis.fetch=function(url){assert.equal(this,globalThis);assert.equal(url,'/receiver-probe');calls++;return Promise.resolve(reply({ok:true}))};
 try{
  const service=new ConfirmedAssignmentSubmission({storage:storage()});
  const result=await service.fetchImpl('/receiver-probe');
  assert.equal(result.ok,true);
  assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
});
