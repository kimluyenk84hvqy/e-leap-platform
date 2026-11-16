import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../server/research/reading-jigsaw.js',import.meta.url),'utf8');
const ID='10000000-0000-4000-8000-000000000001',CLASS='10000000-0000-4000-8000-000000000002';
const uu={teacher:'10000000-0000-4000-8000-000000000003',A:'10000000-0000-4000-8000-000000000004',B:'10000000-0000-4000-8000-000000000005',outsider:'10000000-0000-4000-8000-000000000006'};
function fixture(){
 const state={verified:false,photos:false,assets:[],material:true,group:{[uu.A]:'A',[uu.B]:'B'}};
 const assignment={assignment_id:ID,class_id:CLASS,resource_id:'qa-u6-reading',activity_id:'qa-evidence-why',status:'active'};
 const passages={A:'SYNTHETIC PRIVATE ALPHA ACCOUNT text for QA.',B:'SYNTHETIC PRIVATE BRAVO ACCOUNT text for QA.',C:'SYNTHETIC PRIVATE CHARLIE ACCOUNT text for QA.'};
 const sql=async(strings,...args)=>{
  const q=strings.join('?').replace(/\s+/g,' ').trim();
  if(q.includes('FROM assignments WHERE assignment_id='))return args[0]===ID?[assignment]:[];
  if(q.includes('SELECT m.account,j.accounts->>m.account')){
    const label=state.group[args[1]];
    if(!state.material||!label)return [];
    return [{account:label,passage:passages[label],photo_labels:['Mavis','Anita','Neil'],photo_assets:state.assets,
      original_questions:['Match photos','Estimate year'],source_page:41,
      source_text_verified:state.verified,photo_assets_verified:state.photos}];
  }
  if(q.includes('SELECT * FROM reading_jigsaw_materials'))return state.material?[{...state,accounts:passages}]:[];
  if(q.includes('FROM reading_jigsaw_members WHERE assignment_id='))return Object.entries(state.group).map(([student_user_id,account])=>({student_user_id,account}));
  if(q.includes('SELECT 1 FROM auth_class_members'))return args[1]===uu.A||args[1]===uu.B?[{yes:1}]:[];
  if(q.includes('INSERT INTO reading_jigsaw_members(')){
   state.group[args[2]]=args[3];return [{student_user_id:args[2],account:args[3]}];
  }
  if(q.includes('SELECT photo_assets FROM reading_jigsaw_materials'))return state.material?[{photo_assets:state.assets}]:[];
  if(q.includes('UPDATE reading_jigsaw_materials')){state.verified=true;state.photos=true;return [{assignment_id:ID,source_text_verified:true,photo_assets_verified:true}]}
  if(q.includes('INSERT INTO reading_jigsaw_materials')){state.material=true;state.verified=false;state.photos=false;return [{assignment_id:ID,source_text_verified:false,photo_assets_verified:false}]}
  throw Error('Unsupported QA query: '+q);
 };
 return {state,assignment,passages,sql};
}
async function handlerFor(f){
 const ctx=vm.createContext({console,Date,JSON,String,Number,Array,Object,RegExp,Error});
 const main=new vm.SourceTextModule(source,{context:ctx,identifier:'jigsaw-api'});
 const modules={
  '../_research-db.js':{getResearchDb:()=>f.sql},
  '../_auth.js':{
   requireAuth:async(req,res)=>{if(!req.actor){res.status(401).json({ok:false});return null}return req.actor},
   requireSameOrigin:()=>true,
   teacherOwnsClass:async(_sql,user,classId)=>user.role==='teacher'&&user.user_id===uu.teacher&&classId===CLASS,
   studentInClass:async(_sql,user,classId)=>user.role==='student'&&[uu.A,uu.B].includes(user.user_id)&&classId===CLASS
  }
 };
 const linked=new Map();
 await main.link(async name=>{
  if(!modules[name])throw Error('Unexpected import '+name);
  if(!linked.has(name)){
   linked.set(name,new vm.SyntheticModule(Object.keys(modules[name]),function(){
    for(const [k,v] of Object.entries(modules[name]))this.setExport(k,v);
   },{context:ctx,identifier:name}));
  }
  return linked.get(name);
 });
 await main.evaluate();return main.namespace.default;
}
async function request(handler,actor,{method='GET',action,account,studentUserId,confirmSourceText,confirmOriginalPhotos}={}){
 const out={status:200,data:null};
 const req={method,actor,query:{assignmentId:ID},body:{assignmentId:ID,action,account,studentUserId,confirmSourceText,confirmOriginalPhotos},headers:{}};
 const res={status(code){out.status=code;return this},json(data){out.data=JSON.parse(JSON.stringify(data));return this},setHeader(){return this}};
 await handler(req,res);return out;
}
const teacher={role:'teacher',user_id:uu.teacher},studentA={role:'student',user_id:uu.A},studentB={role:'student',user_id:uu.B},outsider={role:'student',user_id:uu.outsider};
test('Jigsaw role-bound API fails closed until teacher verifies text and 3 media assets',async()=>{
 const f=fixture(),handler=await handlerFor(f);
 assert.equal((await request(handler,studentA)).status,423);
 assert.equal((await request(handler,studentB)).status,423);
 assert.equal((await request(handler,outsider)).status,403);
 const verifyMissing=await request(handler,teacher,{method:'POST',action:'verify',confirmSourceText:true,confirmOriginalPhotos:true});
 assert.equal(verifyMissing.status,409);
 assert.equal(verifyMissing.data.code,'PHOTO_ASSETS_MISSING');
 f.state.assets=[{assetId:'private-A',alt:'Mavis'},{assetId:'private-B',alt:'Anita'},{assetId:'private-C',alt:'Neil'}];
 const approved=await request(handler,teacher,{method:'POST',action:'verify',confirmSourceText:true,confirmOriginalPhotos:true});
 assert.equal(approved.status,200);
 const a=await request(handler,studentA),b=await request(handler,studentB);
 assert.equal(a.status,200);assert.equal(b.status,200);
 assert.equal(a.data.account,'A');assert.equal(b.data.account,'B');
 assert.equal(a.data.passage,f.passages.A);
 assert.equal(b.data.passage,f.passages.B);
 assert.ok(!JSON.stringify(a.data).includes('SYNTHETIC PRIVATE BRAVO ACCOUNT'));
 assert.ok(!JSON.stringify(b.data).includes('SYNTHETIC PRIVATE ALPHA ACCOUNT'));
 assert.ok(!JSON.stringify(a.data).includes('SYNTHETIC PRIVATE CHARLIE ACCOUNT'));
 assert.equal(Object.hasOwn(a.data,'accounts'),false,'Do not return full source object to learner');
});
test('Only owning teacher can assign active classroom Student; no client role override',async()=>{
 const f=fixture(),handler=await handlerFor(f);
 assert.equal((await request(handler,studentA,{method:'POST',action:'assign',studentUserId:uu.A,account:'C'})).status,403);
 assert.equal((await request(handler,{role:'teacher',user_id:uu.outsider},{method:'POST',action:'assign',studentUserId:uu.A,account:'C'})).status,403);
 assert.equal((await request(handler,teacher,{method:'POST',action:'assign',studentUserId:uu.outsider,account:'C'})).status,403);
 assert.equal((await request(handler,teacher,{method:'POST',action:'assign',studentUserId:uu.A,account:'C'})).status,200);
 assert.equal(f.state.group[uu.A],'C');
});
