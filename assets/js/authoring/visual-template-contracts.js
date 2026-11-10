/* Template contracts used at authoring and publication boundaries.
   Teacher notes stay in screen.teacherNotes, never in student-visible fields. */
export const VISUAL_TEMPLATE_CONTRACTS={
 'lesson-cover':{family:'Cover',layout:'hero',maxBlocks:9},
 'lesson-aims':{family:'Cover',layout:'three-cards',maxBlocks:5},
 'section-divider':{family:'Sections',layout:'hero',maxBlocks:4},
 'lead-in':{family:'Warm-up',layout:'media-left',maxBlocks:4},
 'vocabulary-presentation':{family:'Vocabulary',layout:'media-right',maxBlocks:5},
 'grammar-presentation':{family:'Grammar',layout:'two-column',maxBlocks:4},
 'controlled-practice':{family:'Practice',layout:'question-options',maxBlocks:3},
 'listening-task':{family:'Listening',layout:'question-options',maxBlocks:4},
 'reading-task':{family:'Reading',layout:'reading-split',maxBlocks:4},
 'speaking-task':{family:'Speaking',layout:'speaking-prompt',maxBlocks:3},
 'consolidation':{family:'Review',layout:'three-cards',maxBlocks:4},
 'lesson-closing':{family:'Closing',layout:'hero',maxBlocks:4}
};
const AUTHORING_COPY=/\b(template\s*(?:id|code)|content mapper|developer note|teacher should|click to reveal the answer|evidence id|asset id|placeholder|insert the (?:reading|assigned)|add a short lead-in|add audio source|media library or paste)\b/i;
const BOOK_PAGE_ASSET=/(?:^|[\/_-])(?:life_page|book_page|textbook_page|page_scan)[_-]?\d{1,4}\.(?:jpe?g|png|webp)(?:[?#]|$)/i;
const FLOATING_PHRASES=/^(?:new slide|untitled slide|option [ab]|sentence with a blank|key point [123]|lesson title|what do you think\?)$/i;
const textOf=b=>[b.content?.text,b.activity?.prompt,b.content?.caption,b.content?.label].filter(x=>typeof x==='string');
export function validateVisualContracts(lesson){
 const issues=[];
 (lesson.screens||[]).forEach((slide,i)=>{
  const at='Slide '+(i+1);
  const spec=VISUAL_TEMPLATE_CONTRACTS[slide.templateId];
  if(spec&&slide.blocks?.length>spec.maxBlocks)issues.push(['error',at+': too many blocks for '+spec.family+' template ('+slide.blocks.length+'/'+spec.maxBlocks+')']);
  if(slide.audience==='teacher'||slide.audience==='internal')issues.push(['error',at+': teacher/internal notes must not be stored as a slide']);
  for(const v of [slide.title,slide.instruction,...(slide.blocks||[]).flatMap(textOf)]){
   if(typeof v!=='string')continue;
   if(AUTHORING_COPY.test(v))issues.push(['error',at+': authoring instructions or placeholders are visible to learners']);
   if(FLOATING_PHRASES.test(v.trim()))issues.push(['warn',at+': unfinished example text is still present']);
  }
  const passage=(slide.blocks||[]).filter(b=>b.type==='text').map(b=>b.content?.text||'').join('\\n');
  for(const b of slide.blocks||[]){
   const a=b.activity;if(!a?.evidenceByItem)continue;
   for(const item of a.items||[]){
    const entry=a.evidenceByItem[item.id];
    if(!entry?.quote||!entry?.why)issues.push(['error',at+': Evidence and Why are required for item '+item.id]);
    else if(!passage.includes(entry.quote))issues.push(['error',at+': Evidence text not found for item '+item.id]);
   }
  }
  for(const block of slide.blocks||[]){
   if(block.audience==='teacher'||block.audience==='internal')issues.push(['error',at+': internal-only block must be moved into teacherNotes']);
   for(const v of [block.content?.src,block.content?.assetId]){
    if(typeof v==='string'&&BOOK_PAGE_ASSET.test(v))issues.push(['error',at+': full-page textbook scan is not allowed as a slide image']);
   }
  }
 });
 return issues;
}
