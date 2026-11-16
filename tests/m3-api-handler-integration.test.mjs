import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../server/research/submissions.js',import.meta.url),'utf8');
const {SourceTextModule,SyntheticModule}=vm;
if(!SourceTextModule)throw Error('Run with node --experimental-vm-modules');

function harness(){
 const teacher={user_id:'teacher-uuid',role:'teacher',email:'teacher@example.invalid'};
 const student={user_id:'student-uuid',student_id:'QA001',display_name:'Student QA',role:'student'};
 const outsider={user_id:'another-teacher-uuid',role:'teacher',email:'outside@example.invalid'};
 const assignment={assignment_id:'assignment-uuid',teacher_id:'teacher-uuid',class_id:'class-uuid',
  resource_id:'u6-reading',activity_id:'jigsaw-answer-1',status:'active',title:'U6 Jigsaw',
  attempt_limit:3,deadline:null,late_policy:'allow-late'};
 const submissions=[];
 let next=0;
 const sql=async(parts,...args)=>{
  const q=parts.join('?').replace(/\s+/g,' ').trim();
  if(q.includes('FROM assignments WHERE assignment_id=')&&q.includes('status='))return args[0]===assignment.assignment_id?[assignment]:[];
  if(q.includes('FROM assignments WHERE assignment_id='))return args[0]===assignment.assignment_id?[assignment]:[];
  if(q.includes('FROM reading_jigsaw_materials j LEFT JOIN reading_jigsaw_members m'))return [];
  if(q.includes('FROM auth_class_members'))return args[0]===assignment.class_id&&args[1]===student.user_id?[{one:1}]:[];
  if(q.includes('FROM users WHERE external_auth_id='))return [{user_id:teacher.user_id}];
  if(q.includes('SELECT 1 FROM classes'))return args[0]===assignment.class_id&&
    (args[1]===teacher.user_id||args[2]===teacher.user_id)?[{one:1}]:[];
  if(q.includes('SELECT COALESCE(MAX(attempt_no)'))return [{n:submissions.filter(x=>x.assignment_id===args[0]&&x.student_user_id===args[1]).length}];
  if(q.includes('FROM submissions WHERE assignment_id=')&&q.includes('client_request_id=')&&q.includes('same_payload')){
   return submissions.filter(x=>x.assignment_id===args[1]&&x.student_user_id===args[2]&&x.client_request_id===args[3])
    .map(x=>({...x,same_payload:JSON.stringify(x.response)===JSON.stringify(args[0])}));
  }
  if(q.includes('INSERT INTO submissions(')){
   const [assignmentId,userId,studentCode,studentName,response,attempt,metadata,requestId]=args;
   const status='submitted';
   if(submissions.some(x=>x.assignment_id===assignmentId&&x.student_user_id===userId&&
     (x.attempt_no===attempt||x.client_request_id===requestId)))return [];
   const row={submission_id:'receipt-'+(++next),assignment_id:assignmentId,student_user_id:userId,
    student_code:studentCode,student_name:studentName,response,attempt_no:attempt,status,
    metadata,client_request_id:requestId,submitted_at:'2026-11-16T00:00:00Z'};
   submissions.push(row);return [row];
  }
  if(q.includes('INSERT INTO events('))return [];
  if(q.includes('FROM submissions s JOIN assignments a')&&q.includes('WHERE s.assignment_id=')){
   return submissions.filter(x=>x.assignment_id===args[0]&&
     (!q.includes('s.student_user_id=')||x.student_user_id===args[1]))
     .map(x=>({...x,title:assignment.title,class_id:assignment.class_id,
      resource_id:assignment.resource_id,activity_id:assignment.activity_id}));
  }
  if(q.includes('FROM submissions s JOIN assignments a')&&q.includes('WHERE s.student_user_id=')){
   return submissions.filter(x=>x.student_user_id===args[0]);
  }
  if(q.includes('FROM submissions s JOIN assignments a')&&q.includes('JOIN classes c')){
   return args.includes(teacher.user_id)?submissions:[];
  }
  throw Error('Unexpected SQL in M3 test: '+q);
 };
 const specs={
  '../_research-db.js':{getResearchDb:()=>sql},
  '../_auth.js':{
   requireAuth:async(req,res)=>{if(!req.actor){res.status(401).json({ok:false});return null}return req.actor},
   requireSameOrigin:()=>true,
   teacherOwnsClass:async(_sql,u,classId)=>u.role==='admin'||(u.role==='teacher'&&u.user_id===teacher.user_id&&classId===assignment.class_id),
   studentInClass:async(_sql,u,classId)=>u.role==='student'&&u.user_id===student.user_id&&classId===assignment.class_id,
   ensureResearchStaffUser:async()=>teacher.user_id
  },
  '../_submission-schema-contract.js':{requireSubmissionSchema:async()=>true},
  '../_submission-payload-contract.js':{validateAssignedResponse:(a,r)=>{
   if(r.resourceId!==a.resource_id)return {ok:false,code:'RESOURCE_MISMATCH',error:'resource'};
   if(r.activityId!==a.activity_id)return {ok:false,code:'ACTIVITY_MISMATCH',error:'activity'};
   if(!Object.hasOwn(r,'value'))return {ok:false,code:'ANSWER_MISSING',error:'answer'};
   return {ok:true,response:{resourceId:a.resource_id,activityId:a.activity_id,value:r.value}};
  }}
 };
 return {teacher,student,outsider,assignment,submissions,specs};
}
async function loadHandler(h){
 const context=vm.createContext({console,Date,JSON,String,Number,Boolean,Math,Array,Object,RegExp,Error});
 const main=new SourceTextModule(source,{context,identifier:'submissions-api'});
 const modules=new Map();
 await main.link(async(specifier)=>{
  if(!h.specs[specifier])throw Error('Unsupported import '+specifier);
  if(!modules.has(specifier)){
   const values=h.specs[specifier];
   modules.set(specifier,new SyntheticModule(Object.keys(values),function(){
    for(const [key,value] of Object.entries(values))this.setExport(key,value);
   },{context,identifier:specifier}));
  }
  return modules.get(specifier);
 });
 await main.evaluate();return main.namespace.default;
}
async function call(handler,{actor,method='GET',body={},assignmentId}={}){
 const result={code:200,body:null};
 const req={actor,method,body,query:assignmentId?{assignmentId}:{},headers:{}};
 const res={status(code){result.code=code;return this},json(data){result.body=JSON.parse(JSON.stringify(data));return this},
   setHeader(){return this}};
 await handler(req,res);
 return result;
}
test('M3 API Student Submit → Teacher Responses → reload, idempotence and cross-role privacy',async()=>{
 const h=harness();const handler=await loadHandler(h);
 const response={resourceId:'u6-reading',activityId:'jigsaw-answer-1',value:{evidence:'Page 4',why:'Because...'},forgedScore:100};
 const data={assignmentId:h.assignment.assignment_id,clientRequestId:'10000000-0000-4000-8000-000000000011',response};
 const first=await call(handler,{actor:h.student,method:'POST',body:data});
 assert.equal(first.code,201);
 assert.ok(first.body.submission.submission_id);
 assert.equal(Object.hasOwn(first.body.submission.response,'forgedScore'),false);
 const duplicate=await call(handler,{actor:h.student,method:'POST',body:data});
 assert.equal(duplicate.code,200);assert.equal(duplicate.body.idempotent,true);
 assert.equal(duplicate.body.submission.submission_id,first.body.submission.submission_id);
 const tamper=await call(handler,{actor:h.student,method:'POST',body:{...data,response:{...response,value:{evidence:'changed'}}}});
 assert.equal(tamper.code,409);assert.equal(tamper.body.code,'IDEMPOTENCY_PAYLOAD_CONFLICT');
 const mismatch=await call(handler,{actor:h.student,method:'POST',body:{...data,clientRequestId:'10000000-0000-4000-8000-000000000012',response:{...response,activityId:'wrong'}}});
 assert.equal(mismatch.code,400);assert.equal(mismatch.body.code,'ACTIVITY_MISMATCH');
 const teacherRead=await call(handler,{actor:h.teacher,assignmentId:h.assignment.assignment_id});
 assert.equal(teacherRead.code,200);assert.equal(teacherRead.body.submissions.length,1);
 const teacherReload=await call(handler,{actor:h.teacher,assignmentId:h.assignment.assignment_id});
 assert.equal(teacherReload.body.submissions[0].submission_id,first.body.submission.submission_id);
 const studentReload=await call(handler,{actor:h.student,assignmentId:h.assignment.assignment_id});
 assert.equal(studentReload.code,200);assert.equal(studentReload.body.submissions.length,1);
 const guest=await call(handler,{actor:null,assignmentId:h.assignment.assignment_id});
 assert.equal(guest.code,401);
 const other=await call(handler,{actor:h.outsider,assignmentId:h.assignment.assignment_id});
 assert.equal(other.code,403);
 const teacherPosting=await call(handler,{actor:h.teacher,method:'POST',body:{...data,clientRequestId:'10000000-0000-4000-8000-000000000013'}});
 assert.equal(teacherPosting.code,403);
 assert.equal(h.submissions.length,1);
});
