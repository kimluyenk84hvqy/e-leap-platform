import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../server/research/reading-jigsaw-photo.js',import.meta.url),'utf8');
const html=await readFile(new URL('../reading-jigsaw.html',import.meta.url),'utf8');
const ASSIGN='10000000-0000-4000-8000-000000000001';
const CLASS='10000000-0000-4000-8000-000000000002';
const A='10000000-0000-4000-8000-000000000003';
const PHOTO='20000000-0000-4000-8000-000000000001';
function fixture(){
 const state={verified:true,assigned:true,active:true,photos:[{assetId:PHOTO,alt:'Photograph 1'}],actor:{role:'student',user_id:A}};
 const sql=async(strings,...args)=>{
  const query=strings.join('?');
  if(query.includes('FROM assignments WHERE assignment_id='))return [{assignment_id:ASSIGN,class_id:CLASS,status:state.active?'active':'draft'}];
  if(query.includes('FROM reading_jigsaw_members m JOIN reading_jigsaw_materials j'))return state.assigned?[{photo_assets:state.photos,created_by:'10000000-0000-4000-8000-000000000004',source_text_verified:state.verified,photo_assets_verified:state.verified}]:[];
  if(query.includes('FROM studio_media_v1'))return []; // no genuine images installed: must fail closed
  throw Error('Unmocked SQL '+query);
 };
 return {state,sql};
}
async function handlerFor(f){
 const ctx=vm.createContext({console,JSON,String,Array,RegExp,Error,Buffer});
 const module=new vm.SourceTextModule(source,{context:ctx});
 const imports={
  '../_research-db.js':{getResearchDb:()=>f.sql},
  '../_auth.js':{
   requireAuth:async(req,res)=>{if(!req.actor){res.status(401).json({ok:false});return null;}return req.actor;},
   studentInClass:async()=>f.state.assigned
  }
 };
 const linked=new Map();
 await module.link(async name=>{
  if(!imports[name])throw Error('unexpected import');
  if(!linked.has(name))linked.set(name,new vm.SyntheticModule(Object.keys(imports[name]),function(){
   for(const [k,v]of Object.entries(imports[name]))this.setExport(k,v);
  },{context:ctx}));
  return linked.get(name);
 });
 await module.evaluate();return module.namespace.default;
}
async function request(f,patch={}){
 const handler=await handlerFor(f),output={status:200,body:null};
 const req={method:'GET',actor:f.state.actor,query:{assignmentId:ASSIGN,assetId:PHOTO},...patch};
 const res={
  headersSent:false,setHeader(){return this;},
  status(code){output.status=code;return this;},
  json(body){output.body=body;return this;}
 };
 await handler(req,res);return output;
}
test('U6 photo viewer denies guest, teacher, unassigned learner, unverified source, wrong photo, missing private media',async()=>{
 const f=fixture();
 let result=await request(f,{actor:null});assert.equal(result.status,401);
 result=await request(f,{actor:{role:'teacher',user_id:A}});assert.equal(result.status,403);
 f.state.assigned=false;result=await request(f);assert.equal(result.status,403);f.state.assigned=true;
 f.state.verified=false;result=await request(f);assert.equal(result.status,423);f.state.verified=true;
 result=await request(f,{query:{assignmentId:ASSIGN,assetId:'20000000-0000-4000-8000-000000000999'}});assert.equal(result.status,403);
 result=await request(f);assert.equal(result.status,404);
 f.state.active=false;result=await request(f);assert.equal(result.status,403);
});
test('U6 photos render as source-linked authenticated image requests, not public blob URLs',()=>{
 assert.match(html,/id="originalPhotos"/);
 assert.match(html,/reading-jigsaw-photo\?assignmentId=/);
 assert.match(html,/encodeURIComponent\(photo\.assetId\)/);
 assert.match(html,/pictures\.length!==3/);
 assert.doesNotMatch(html,/blob\.vercel-storage\.com/);
 assert.match(source,/photo_assets_verified/);
 assert.match(source,/studentInClass/);
 assert.match(source,/owner_id=/);
 assert.match(source,/source_text_verified/);
});
