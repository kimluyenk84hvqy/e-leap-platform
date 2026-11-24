/* Local PDF selection and AI lesson review adapter for E-LEAP Authoring Studio.
 * PDF bytes are processed in browser memory; only extracted, consented text is sent to AI.
 * Output always remains a teacher-review draft and never publishes.
 */
import {extractLocalPdfText} from './source-pdf-local.js';
import {createLocalOcrReader} from './ocr-browser.js';
import {createLesson,createScreen,createBlock} from './lesson-model.js';
import {createCourseDraft} from './course-profile-registry.js';
let pdfJsPromise=null;
export async function pdfJs(){
 if(globalThis.pdfjsLib)return globalThis.pdfjsLib;
 if(!pdfJsPromise)pdfJsPromise=new Promise((resolve,reject)=>{
  const tag=document.createElement('script');
  tag.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  tag.crossOrigin='anonymous';tag.referrerPolicy='no-referrer';
  tag.onload=()=>{
   const library=globalThis.pdfjsLib;
   if(!library)return reject(Error('PDF reader did not load'));
   library.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
   resolve(library);
  };
  tag.onerror=()=>reject(Error('PDF library is unavailable; check the connection'));
  document.head.appendChild(tag);
 });
 return pdfJsPromise;
}
export async function inspectPdfLesson(file,{startPage=1,endPage=8}={}){
 if(!Number.isInteger(startPage)||!Number.isInteger(endPage)||startPage<1||endPage<startPage||endPage-startPage+1>12)
  throw Error('Select 1–12 consecutive pages of one lesson.');
 let reader=null;
 let scanned;
 try{
  scanned=await extractLocalPdfText(file,await pdfJs(),{
   startPage,endPage,maxPages:12,maxBytes:150*1024*1024,
   ocrPage:async(page)=>{
    if(!reader)reader=await createLocalOcrReader();
    return reader.read(page);
   }
  });
 }finally{if(reader)await reader.close()}

 const text=scanned.pages.reduce((n,p)=>n+p.text.length,0);
 if(text<160)throw Error('Very little text was extracted even after local OCR. Select the correct pages or provide better-quality scans.');
 if(text>24000)throw Error('Too much extracted text for one controlled AI batch. Select fewer pages.');
 if(scanned.pages.some(p=>p.text.length>5500))throw Error('A PDF page exceeds the AI input limit; select a smaller source segment.');
 return scanned;
}
export async function getPdfAiCapability({fetcher=fetch}={}){
 const response=await fetcher('/api/authoring/pdf-ai-build',{credentials:'same-origin',cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.ok!==true)return {configured:false,reason:data.error||'AI service cannot be reached'};
 return {configured:data.configured===true,reason:data.reason||''};
}
export async function requestPdfAiLesson({pages,courseProfileId,focus,rightsConfirmed,aiTransmissionConsent}, {fetcher=fetch}={}){
 const response=await fetcher('/api/authoring/pdf-ai-build',{
  method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({pages,courseProfileId,focus,rightsConfirmed,aiTransmissionConsent})
 });
 const body=await response.json().catch(()=>({}));
 if(!response.ok||body.ok!==true){
  const error=new Error(body.error||'AI lesson service unavailable');
  error.code=body.code||'AI_REQUEST_FAILED';throw error;
 }
 return body;
}
export function toUnverifiedLessonDraft(result,profileId,{pdfName,sourcePages}={}){
 if(!result?.ok||!Array.isArray(result.lesson?.slides)||result.lesson.slides.length<3||result.lesson.slides.length>10)
  throw Error('AI output is not a complete lesson candidate.');
 if(result.lesson.courseProfileId!==profileId)throw Error('Course identity mismatch');
 const draft=createCourseDraft(profileId,createLesson);
 draft.title=String(result.lesson.title||'Untitled draft').slice(0,140);
 draft.lessonNumber='';
 draft.screens=result.lesson.slides.map(item=>{
  const s=createScreen('AI review',String(item.title||'Slide').slice(0,130));
  s.instruction=String(item.instruction||'').slice(0,400);
  s.layout=['standard','two-column','media-left'].includes(item.layout)?item.layout:'standard';
  s.sourcePage=Number(item.sourcePage);
  s.blocks=[];
  const content=createBlock('text');content.content.text=String(item.body||'').slice(0,1400);content.content.role='body';s.blocks.push(content);
  if(item.activityKind==='discussion'){
   const discussion=createBlock('discussion');
   discussion.activity.prompt=s.instruction;
   discussion.activity.policy={...(discussion.activity.policy||{}),studentSubmit:false,studentReveal:false,teacherReveal:false};
   s.blocks.push(discussion);
  }
  return s;
 });
 draft.pdfAiReview={
  status:'teacher-review-required',sourceVerified:false,teacherApproved:false,
  pdfName:String(pdfName||'').slice(0,120),
  sourcePages:(sourcePages||[]).filter(Number.isInteger).slice(0,12),
  issues:Array.isArray(result.review?.issues)?result.review.issues.slice(0,30):[],
  missingMedia:Array.isArray(result.review?.missingMedia)?result.review.missingMedia.slice(0,30):[],
  warnings:Array.isArray(result.review?.warnings)?result.review.warnings.slice(0,30):[],
  sourceEvidence:result.lesson.slides.map(s=>({page:s.sourcePage,quote:String(s.evidence||'').slice(0,180)}))
 };
 return draft;
}