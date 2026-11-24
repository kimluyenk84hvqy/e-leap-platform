/* Course-scale batch planning with bounded, teacher-confirmed page ranges.
 * A plan never dispatches paid AI requests or claims textbook segmentation.
 */
export function parseLessonRanges(text,{maxJobs=3,maxPagesPerJob=12,totalPages=null}={}){
 const raw=String(text||'').trim();
 const result={ok:false,jobs:[],errors:[],totalPages};
 if(!raw){result.errors.push('Enter page ranges such as 1-4; 5-8.');return result;}
 const parts=raw.split(';').map(x=>x.trim()).filter(Boolean);
 if(parts.length>maxJobs){result.errors.push('A batch may contain at most '+maxJobs+' lessons.');return result;}
 let endOfPrevious=0;
 for(let i=0;i<parts.length;i++){
  const m=/^(\d+)\s*-\s*(\d+)$/.exec(parts[i]);
  if(!m){result.errors.push('Invalid page range: '+parts[i]);continue;}
  const start=Number(m[1]),end=Number(m[2]);
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<1||end<start||
     end-start+1>maxPagesPerJob||(totalPages!==null&&end>totalPages)){
   result.errors.push('Range '+parts[i]+' is outside the allowed pages.');continue;
  }
  if(start<=endOfPrevious){result.errors.push('Page ranges must be ordered and not overlap.');continue;}
  endOfPrevious=end;
  result.jobs.push({index:i+1,startPage:start,endPage:end,pageCount:end-start+1,
   status:'pending',teacherSourceReviewRequired:true});
 }
 result.ok=result.errors.length===0&&result.jobs.length>0;
 if(!result.ok)result.jobs=[];
 return result;
}
export function validateBatchForPaidRun(plan,{confirmed=false,providerConfigured=false,budgetVerified=false}={}){
 const errors=[];
 if(!plan?.ok||!Array.isArray(plan.jobs)||!plan.jobs.length)errors.push('Create a valid batch plan.');
 if(!confirmed)errors.push('Teacher must review the page ranges and confirm the batch.');
 if(!providerConfigured)errors.push('AI provider is not configured.');
 if(!budgetVerified)errors.push('An externally enforced AI spend budget must be verified.');
 return {allowed:errors.length===0,errors};
}
export async function runLessonBatch(plan,{extract,generate,onUpdate=()=>{},signal}={}){
 if(!plan?.ok||!Array.isArray(plan.jobs))throw Error('Invalid lesson batch');
 if(typeof extract!=='function'||typeof generate!=='function')throw Error('Batch workers are required');
 const records=[];
 for(const job of plan.jobs){
  if(signal?.aborted){records.push({job,status:'cancelled'});break;}
  onUpdate({job,status:'extracting'});
  let text;
  try{
   text=await extract(job);
   if(!Array.isArray(text?.pages)||!text.pages.length)throw Error('No extracted pages');
   if(signal?.aborted){records.push({job,status:'cancelled'});break;}
   onUpdate({job,status:'generating'});
   const generated=await generate({...job,pages:text.pages});
   if(!generated?.ok)throw Error('AI lesson generation was not accepted');
   records.push({job,status:'review-required',result:generated});
   onUpdate({job,status:'review-required'});
  }catch(error){
   records.push({job,status:'blocked',error:String(error?.message||error)});
   onUpdate({job,status:'blocked'});
   break; // Fail closed: do not charge for following units after one failure.
  }
 }
 return {records,completed:records.filter(x=>x.status==='review-required').length,
  halted:records.some(x=>x.status==='blocked'||x.status==='cancelled')};
}

/* Conservative source-completeness gate. A teacher specifies how many
 * separately labelled reading passages the original pages contain.
 * OCR is never automatically treated as verified even if labels match.
 */
export function assessExtractedSource(pages,{expectedPassages=0}={}){
 const errors=[],warnings=[];
 if(!Array.isArray(pages)||!pages.length)return {ok:false,errors:['No extracted source'],warnings};
 const text=pages.map(p=>String(p.text||'')).join('\n');
 const ocrPages=pages.filter(p=>p.method==='local-ocr');
 if(ocrPages.length)warnings.push('OCR used on '+ocrPages.length+' page(s). Verify every paragraph, original question and media.');
 if(expectedPassages){
  if(!Number.isInteger(expectedPassages)||expectedPassages<1||expectedPassages>6)
   errors.push('Invalid expected reading passage count.');
  else {
   const labels=[...text.matchAll(/(?:^|\n)\s*([A-F])\s*(?=\n|$)/g)].map(m=>m[1]);
   const found=new Set(labels);
   for(let i=0;i<expectedPassages;i++)if(!found.has('ABCDEF'[i]))
    errors.push('Passage '+('ABCDEF'[i])+' is not reliably detected in the extracted text.');
  }
 }
 if(!text.trim())errors.push('Empty source text');
 return {ok:errors.length===0,errors,warnings,sourceVerified:false};
}
