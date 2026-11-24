import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {courseProfileById,validateCourseIdentity} from '../assets/js/authoring/course-profile-registry.js';
import {suggestCoursePlan} from '../assets/js/authoring/course-adaptive-plan.js';
const {SourceTextModule,SyntheticModule}=vm;
if(!SourceTextModule)throw Error('Run with node --experimental-vm-modules');
const source=await readFile(new URL('../server/authoring/lessons.js',import.meta.url),'utf8');
const example=(id='lesson-001')=>({id,title:'QA draft',status:'draft',courseProfileId:'objective-first-b2',courseLabel:'Objective First B2',courseLibraryShellId:'objective-first-b2',screens:[{id:'slide-1',title:'Title',blocks:[]}]});
function harness(){
 const user={user_id:'11111111-1111-4111-8111-111111111111',role:'teacher'},rows=new Map();
 const sql=async(parts,...params)=>{
  const q=parts.join('?').replace(/\s+/g,' ').trim();
  if(q.includes('SELECT lesson_id,lesson,revision,updated_at')){
   const row=rows.get(params[0]);return row?.owner===params[1]?[{lesson:row.lesson,revision:row.revision,updated_at:row.updated}]:[];
  }
  if(q.includes('SELECT lesson_id,course_profile_id,advanced_skill_id')){
   return [...rows.entries()].filter(([,row])=>row.owner===params[0]).map(([id,row])=>({lesson_id:id,course_profile_id:row.course,advanced_skill_id:row.skill,title:row.title,revision:row.revision,updated_at:row.updated}));
  }
  if(q.includes('SELECT owner_user_id,revision')){const row=rows.get(params[0]);return row?[{owner_user_id:row.owner,revision:row.revision}]:[];}
  if(q.startsWith('INSERT INTO studio_lesson_drafts_v1')){
   const [id,owner,course,skill,title,json]=params;if(rows.has(id))return [];
   const row={owner,course,skill,title,lesson:JSON.parse(json),revision:1,updated:new Date().toISOString()};rows.set(id,row);return [{revision:1,updated_at:row.updated}];
  }
  if(q.startsWith('UPDATE studio_lesson_drafts_v1')){
   const [json,title,course,skill,id,owner,expected]=params,row=rows.get(id);
   if(!row||row.owner!==owner||row.revision!==expected)return [];
   Object.assign(row,{lesson:JSON.parse(json),title,course,skill,revision:row.revision+1});
   return [{revision:row.revision,updated_at:row.updated}];
  }
  throw Error('Unexpected SQL '+q);
 };
 const mocks={
  '../_research-db.js':{getResearchDb:()=>sql,isBoundToExpectedPreviewDatabase:()=>true},
  '../_auth.js':{requireAuth:async(req,res,roles)=>{if(!req.actor){res.status(401).json({ok:false});return null}if(!roles.includes(req.actor.role)){res.status(403).json({ok:false});return null}return req.actor},requireSameOrigin:()=>true},
  '../../assets/js/authoring/course-profile-registry.js':{courseProfileById,validateCourseIdentity}
 };
 return {user,rows,mocks};
}
async function setup(h){
 const context=vm.createContext({process:{env:{VERCEL_ENV:'preview'}},console,Buffer});
 const module=new SourceTextModule(source,{context});
 const modules=new Map();
 await module.link(async name=>{
  if(!h.mocks[name])throw Error('Unknown module '+name);
  if(!modules.has(name)){const object=h.mocks[name];modules.set(name,new SyntheticModule(Object.keys(object),function(){for(const [key,value] of Object.entries(object))this.setExport(key,value)},{context}));}
  return modules.get(name);
 });
 await module.evaluate();return module.namespace;
}
function res(){return {code:200,body:null,status(n){this.code=n;return this},json(body){this.body=body;return this},setHeader(){return this}}}
test('Draft API: auth, tenant isolation, revision locks, restricted source and no publish',async()=>{
 const h=harness(),{default:handler,validateServerLesson}=await setup(h);
 assert.equal(validateServerLesson(example()).length,0);
 assert.ok(validateServerLesson({...example(),courseProfileId:'esp-pharmacy'}).length);
 let out=res();
 await handler({method:'POST',actor:{role:'student'},body:{lesson:example(),expectedRevision:0}},out);assert.equal(out.code,403);
 out=res();await handler({method:'POST',actor:h.user,body:{lesson:example(),expectedRevision:0}},out);assert.equal(out.code,201);assert.equal(out.body.revision,1);
 out=res();await handler({method:'POST',actor:h.user,body:{lesson:example(),expectedRevision:0}},out);assert.equal(out.code,409);
 out=res();await handler({method:'POST',actor:h.user,body:{lesson:{...example(),title:'Edited'},expectedRevision:1}},out);assert.equal(out.code,200);assert.equal(out.body.revision,2);
 out=res();await handler({method:'GET',actor:h.user,query:{id:'lesson-001'}},out);assert.equal(out.body.draft.title,'Edited');
 out=res();await handler({method:'GET',actor:h.user,query:{}},out);assert.equal(out.body.drafts.length,1);
 const outsider={role:'teacher',user_id:'22222222-2222-4222-8222-222222222222'};
 out=res();await handler({method:'GET',actor:outsider,query:{id:'lesson-001'}},out);assert.equal(out.code,404);
 out=res();await handler({method:'POST',actor:h.user,body:{lesson:{...example(),status:'published'},expectedRevision:2}},out);assert.equal(out.code,422);
 out=res();await handler({method:'POST',actor:h.user,body:{lesson:{...example(),screens:[{sourceReviewDraft:{}}]},expectedRevision:2}},out);assert.equal(out.code,422);
 out=res();await handler({method:'DELETE',actor:h.user},out);assert.equal(out.code,405);
});
test('Course-guided planning cannot simulate completed AI agents or publication',()=>{
 const plan=suggestCoursePlan({courseProfileId:'objective-pet-b1',focus:'Reading',paragraphCount:3});
 assert.equal(plan.ok,true);assert.equal(plan.canPublish,false);
 assert.ok(plan.suggestions.some(x=>x.id==='master-u6-reading-six-step'));
 assert.equal(plan.stages.length,3);assert.ok(plan.stages.every(x=>x.status.includes('awaiting')));
 assert.equal(suggestCoursePlan({courseProfileId:'esp-medicine',focus:'Reading'}).ok,false);
});
