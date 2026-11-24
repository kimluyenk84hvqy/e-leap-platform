/* E-LEAP ChatGPT-Assisted Authoring Bridge v1.
 * Explicit file handoff: no ChatGPT account/session/API access from the site.
 * The current Teacher starts a request and verifies every imported result.
 */
export const REQUEST_SCHEMA='e-leap-chatgpt-review-request-v1';
export const RESPONSE_SCHEMA='e-leap-chatgpt-lesson-response-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const text=(value,max=2000)=>typeof value==='string'?value.slice(0,max):'';
const identifier=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{4,120}$/.test(value);
export function reviewSourceSlides(lesson){
 return (lesson?.screens||[]).slice(0,60).map((slide,index)=>({
  index,title:text(slide.title,140),stage:text(slide.stage,100),
  instruction:text(slide.instruction,500),
  sourcePage:Number.isInteger(slide.sourcePage)?slide.sourcePage:null,
  blocks:(slide.blocks||[]).slice(0,16).map(b=>({
   type:text(b.type,30),
   text:text(b.content?.text||b.activity?.prompt||b.content?.transcript||'',1800),
   options:Array.isArray(b.activity?.options)?b.activity.options.slice(0,8).map(x=>text(x.label,220)):undefined
  }))
 }));
}
export function createReviewRequest(lesson,{requestId,sourcePages=[],includeSource=false}={}){
 if(!identifier(lesson?.id)||!identifier(lesson?.courseProfileId)||!identifier(requestId))throw Error('Lesson, Course Profile and review request identifiers are required');
 if(lesson.status!=='draft')throw Error('Only draft lessons can be submitted for review');
 if(!Array.isArray(lesson.screens)||!lesson.screens.length||lesson.screens.length>80)throw Error('Invalid lesson screens');
 const pages=includeSource&&Array.isArray(sourcePages)?sourcePages.slice(0,12).map(p=>({
  page:p.page,text:text(p.text,5500),verified:false
 })).filter(p=>Number.isInteger(p.page)&&p.page>0):[];
 return {schema:REQUEST_SCHEMA,requestId,lessonId:lesson.id,courseProfileId:lesson.courseProfileId,
  lessonTitle:text(lesson.title,140),courseLabel:text(lesson.courseLabel,140),
  stage:'AI Academic → AI Visual → Independent Critical Reviewer',
  constraints:{
   noInventedSource:true,noInventedAnswerKeys:true,noAssumedMedia:true,
   originalTextMustBeVerified:true,teacherApprovalRequired:true,
   liveQARequired:true,studentFacingContentOnly:true
  },
  source:{
   lessonScreens:reviewSourceSlides(lesson),pages,sourceTextIncluded:pages.length>0,
   warnings:['PDF OCR is not verified','Compare every task, photograph and audio with original textbook']
  },
  responseContract:{
   schema:RESPONSE_SCHEMA,requestId,courseProfileId:lesson.courseProfileId,
   title:'New Lesson',
   slides:[{
    title:'Teaching stage',stage:'Read',instruction:'Read and find one piece of evidence.',
    sourcePage:pages[0]?.page||null,sourceEvidence:'',
    layout:'standard',
    blocks:[{type:'text',text:'Learner-facing content only'}]
   }],
   reviews:{
    academic:{findings:['...'],issues:['...']},
    visual:{findings:['...'],issues:['...']},
    critical:{findings:['...'],issues:['...'],missingMedia:['...']}
   }
  },
  instructionForChatGPT:'Complete three separately critical reviews and return ONLY one valid JSON object following responseContract. Do not invent answers, audio, photographs, pages or exact quotations. Preserve requestId and courseProfileId. All claims remain unverified until teacher checks them.'
 };
}
function cleanString(x,max=2000){return typeof x==='string'&&x.length<=max&&x.trim().length>0}
const allowedLayouts=new Set(['standard','two-column','media-left']);
const allowedBlockTypes=new Set(['text','discussion']);
function validReview(report){
 return report&&typeof report==='object'&&Array.isArray(report.findings)&&report.findings.length<=25&&report.findings.every(x=>typeof x==='string'&&x.length<=400)&&
  Array.isArray(report.issues)&&report.issues.length<=25&&report.issues.every(x=>typeof x==='string'&&x.length<=400);
}
export function validateChatGPTResponse(response,request,{maxSlides=60}={}){
 const issues=[];
 if(!response||typeof response!=='object'||Array.isArray(response))return ['Invalid AI response'];
 if(response.schema!==RESPONSE_SCHEMA)issues.push('Wrong response schema');
 if(response.requestId!==request?.requestId)issues.push('Review request ID mismatch');
 if(response.courseProfileId!==request?.courseProfileId)issues.push('Course Profile ID mismatch');
 if(!cleanString(response.title,140))issues.push('Lesson title is missing or too long');
 if(!Array.isArray(response.slides)||response.slides.length<1||response.slides.length>maxSlides)issues.push('Invalid slide count');
 else for(let i=0;i<response.slides.length;i++){
  const s=response.slides[i];
  if(!s||!cleanString(s.title,140)||!cleanString(s.stage,100)||!cleanString(s.instruction,500))issues.push('Invalid slide '+(i+1));
  if(!allowedLayouts.has(s?.layout))issues.push('Unsupported layout on slide '+(i+1));
  if(!Array.isArray(s?.blocks)||!s.blocks.length||s.blocks.length>16)issues.push('Invalid slide blocks '+(i+1));
  else for(const b of s.blocks){
   if(!allowedBlockTypes.has(b?.type)||!cleanString(b?.text,1800))issues.push('Invalid block content on slide '+(i+1));
   if(b?.answerKey||b?.correctAnswer||b?.media?.src)issues.push('Unverified answer/media in slide '+(i+1));
  }
  if(s.sourcePage!==null&&s.sourcePage!==undefined&&(!Number.isInteger(s.sourcePage)||s.sourcePage<1))issues.push('Invalid page reference on slide '+(i+1));
  if(s.sourceEvidence!==undefined&&typeof s.sourceEvidence!=='string')issues.push('Invalid evidence on slide '+(i+1));
  if((request?.source?.pages||[]).length&&(!Number.isInteger(s.sourcePage)||!cleanString(s.sourceEvidence,300)))
   issues.push('Source page and exact evidence are required on slide '+(i+1));
  const pages=request?.source?.pages||[];
  if(s.sourceEvidence&&pages.length){
   const cited=pages.find(p=>p.page===s.sourcePage);
   const normalize=x=>String(x||'').replace(/\s+/g,' ').toLocaleLowerCase();
   if(!cited||!normalize(cited.text).includes(normalize(s.sourceEvidence)))issues.push('Unverified evidence on cited page '+(i+1));
  }
 }
 if(!response.reviews||!['academic','visual','critical'].every(k=>validReview(response.reviews[k])))issues.push('All three review reports are required');
 if(response.reviews?.critical?.missingMedia&&!Array.isArray(response.reviews.critical.missingMedia))issues.push('Invalid missing media report');
 if(Array.isArray(response.reviews?.critical?.missingMedia)&&!response.reviews.critical.missingMedia.every(x=>typeof x==='string'&&x.length<=400))issues.push('Invalid missing media entries');
 if(Array.isArray(response.reviews?.critical?.missingMedia)&&response.reviews.critical.missingMedia.length>30)issues.push('Too many missing media items');
 if(JSON.stringify(response).length>350000)issues.push('Response size limit exceeded');
 return issues;
}
export function importChatGPTResponse(lesson,response,request,{createScreen,createBlock}={}){
 const issues=validateChatGPTResponse(response,request);
 if(issues.length)return {ok:false,issues};
 if(!lesson||lesson.status!=='draft'||lesson.id!==request.lessonId||lesson.courseProfileId!==request.courseProfileId)
  return {ok:false,issues:['Review does not belong to the active draft']};
 if(typeof createScreen!=='function'||typeof createBlock!=='function')throw Error('Studio factories required');
 const previous={
  title:lesson.title,screens:clone(lesson.screens),
  assistedAuthoring:clone({...lesson.assistedAuthoring,history:[]})
 };
 const screens=response.slides.map(item=>{
  const s=createScreen(item.stage,item.title);
  s.instruction=item.instruction;s.layout=item.layout;s.blocks=[];
  if(Number.isInteger(item.sourcePage))s.sourcePage=item.sourcePage;
  s.sourceEvidence=text(item.sourceEvidence||'',300);
  for(const b of item.blocks){
   const block=createBlock(b.type);
   if(b.type==='text'){block.content=block.content||{};block.content.text=b.text;block.content.role='body';}
   else {
    block.activity.prompt=b.text;
    block.activity.policy={...(block.activity.policy||{}),studentSubmit:false,studentReveal:false,teacherReveal:false};
   }
   s.blocks.push(block);
  }
  return s;
 });
 const history=(lesson.assistedAuthoring?.history||[]).slice(-4);
 history.push({revision:Number(lesson.assistedAuthoring?.revision||0),snapshot:previous});
 const review=clone(response.reviews);
 const next={...lesson,title:response.title,screens,
  assistedAuthoring:{
   schema:'e-leap-chatgpt-revision-v1',
   revision:Number(lesson.assistedAuthoring?.revision||0)+1,
   status:'teacher-review-required',teacherApproved:false,sourceVerified:false,
   pendingReviewId:request.requestId,
   reviews:review,
   history,
   evidence:response.slides.map(s=>({page:s.sourcePage||null,quote:text(s.sourceEvidence||'',300)}))
  }
 };
 return {ok:true,lesson:next,issues:[],revision:next.assistedAuthoring.revision};
}
export function revertChatGPTRevision(lesson){
 const stack=lesson?.assistedAuthoring?.history;
 if(!Array.isArray(stack)||!stack.length)return {ok:false,issues:['No previous revision to restore']};
 const original=stack[stack.length-1].snapshot;
 if(!original||!Array.isArray(original.screens))return {ok:false,issues:['Invalid revision snapshot']};
 const next=clone(lesson);
 next.title=original.title;next.screens=original.screens;
 next.assistedAuthoring={...(original.assistedAuthoring||{}),
  history:stack.slice(0,-1),status:'teacher-review-required',teacherApproved:false,sourceVerified:false};
 return {ok:true,lesson:next};
}
export function recordTeacherReview(lesson,{verifiedSource=false,verifiedMedia=false,verifiedActivities=false,comment=''}={}){
 if(!lesson?.assistedAuthoring?.reviews)throw Error('No three-AI review is available');
 if(!verifiedSource||!verifiedMedia||!verifiedActivities)throw Error('Review all source, media and activities before approving');
 if(!cleanString(comment,2000))throw Error('A substantive teacher review note is required');
 const next=clone(lesson);
 next.assistedAuthoring={...next.assistedAuthoring,status:'teacher-approved-for-preview',
  teacherApproved:true,sourceVerified:true,approval:{comment:text(comment,2000),at:new Date().toISOString(),
   checks:{verifiedSource:true,verifiedMedia:true,verifiedActivities:true}}};
 return next; // NOT a publish action; role and final runtime QA still apply.
}
