import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readFileSync} from 'node:fs';
import vm from 'node:vm';
import {courseProfileById} from '../assets/js/authoring/course-profile-registry.js';
import {toUnverifiedLessonDraft} from '../assets/js/authoring/pdf-ai-intake.js';
const source=readFileSync(new URL('../server/authoring/pdf-ai-build.js',import.meta.url),'utf8');
const slides=[1,2,3].map(n=>({title:'Part '+n,instruction:'Discuss part '+n,
 body:'A classroom memory from the source.',evidence:'classroom memory',sourcePage:n,activityKind:n===1?'discussion':'text',layout:'standard'}));
const pages=[1,2,3].map(n=>({page:n,text:'A classroom memory from the source. '.repeat(9)}));
const aiOutput={ok:true,lesson:{title:'School memories',courseProfileId:'objective-pet-b1',slides},
 review:{issues:['Recheck photo labels'],missingMedia:['Source photographs'],warnings:['Original textbook check required']}};
test('AI PDF review output never becomes a published lesson',()=>{
 const draft=toUnverifiedLessonDraft(aiOutput,'objective-pet-b1',{pdfName:'sample.pdf',sourcePages:[1,2,3]});
 assert.equal(draft.status,'draft');assert.equal(draft.courseProfileId,'objective-pet-b1');
 assert.equal(draft.screens.length,3);
 assert.equal(draft.pdfAiReview.teacherApproved,false);
 assert.equal(draft.pdfAiReview.sourceVerified,false);
 assert.equal(draft.pdfAiReview.sourceEvidence.length,3);
 assert.equal(draft.screens[0].blocks[1].activity.policy.studentSubmit,false);
 assert.equal(JSON.stringify(draft).includes('Original PDF bytes'),false);
 assert.throws(()=>toUnverifiedLessonDraft(aiOutput,'life'));
});
test('PDF AI endpoint rejects invalid and nonconsented sources; no invented verification',async()=>{
 const {SourceTextModule,SyntheticModule}=vm;
 if(!SourceTextModule)throw Error('Run with node --experimental-vm-modules');
 const mocks={
  '../_auth.js':{requireSameOrigin:()=>true,requireAuth:async(req,res,roles)=>{
   if(!req.actor){res.status(401).json({ok:false});return null;}
   if(!roles.includes(req.actor.role)){res.status(403).json({ok:false});return null;}
   return req.actor;
  }},
  '../_research-db.js':{isBoundToExpectedPreviewDatabase:()=>true},
  '../../assets/js/authoring/course-profile-registry.js':{courseProfileById}
 };
 const ctx=vm.createContext({process:{env:{VERCEL_ENV:'preview'}},console,AbortController,setTimeout,clearTimeout});
 const module=new SourceTextModule(source,{context:ctx,identifier:'pdf-ai-api'});
 const cache=new Map();
 await module.link(async path=>{
  if(!mocks[path])throw Error('Unknown import '+path);
  if(!cache.has(path)){const data=mocks[path];cache.set(path,new SyntheticModule(Object.keys(data),function(){for(const [k,v]of Object.entries(data))this.setExport(k,v)},{context:ctx}));}
  return cache.get(path);
 });
 await module.evaluate();
 const {default:handler,validatePdfInput,validateAcademicPlan}=module.namespace;
 const valid={courseProfileId:'objective-pet-b1',focus:'Reading',pages,rightsConfirmed:true,aiTransmissionConsent:true};
 assert.equal(validatePdfInput(valid).length,0);
 assert.ok(validatePdfInput({...valid,rightsConfirmed:false}).length>0);
 assert.ok(validatePdfInput({...valid,pages:[pages[1],pages[0]]}).length>0);
 assert.equal(validateAcademicPlan({title:'School memories',slides},pages).length,0);
 assert.ok(validateAcademicPlan({title:'School memories',slides:[...slides,{...slides[0],evidence:'invented quote'}]},pages).length>0);
 const response=()=>({statusCode:null,payload:null,setHeader(){},status(n){this.statusCode=n;return this},json(x){this.payload=x;return this}});
 let res=response();
 await handler({method:'POST',actor:{role:'student'},body:valid},res);assert.equal(res.statusCode,403);
 res=response();await handler({method:'POST',actor:{role:'teacher'},body:{...valid,aiTransmissionConsent:false}},res);assert.equal(res.statusCode,422);
 res=response();await handler({method:'POST',actor:{role:'teacher'},body:valid},res);
 assert.equal(res.statusCode,503);assert.equal(res.payload.code,'AI_NOT_CONFIGURED');
 res=response();await handler({method:'GET',actor:{role:'teacher'}},res);assert.equal(res.statusCode,200);assert.equal(res.payload.configured,false);
 res=response();await handler({method:'DELETE',actor:{role:'teacher'}},res);assert.equal(res.statusCode,405);
});
test('Studio contains PDF upload, page range and teacher consent controls',()=>{
 const studio=readFileSync(new URL('../assets/js/authoring-studio.js',import.meta.url),'utf8');
 for(const marker of ['data-pdf-ai-file','data-pdf-ai-extract','data-pdf-ai-generate','data-pdf-ai-rights','data-pdf-ai-consent','toUnverifiedLessonDraft','inspectPdfLesson'])assert.ok(studio.includes(marker),marker);
 const router=readFileSync(new URL('../api/router.js',import.meta.url),'utf8');
 assert.match(router,/authoring\/pdf-ai-build/);
});
