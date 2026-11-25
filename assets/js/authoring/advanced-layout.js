/* Presentation-only projection. Preserve block identity, visibility and original task order. */
const sourceTypes=new Set(['text','image','audio','video']);
const headingLine=b=>String(b.content?.text||'').split('\n')[0].trim();
const groupedText=b=>b.type==='text'&&String(b.content?.text||'').includes('\n')&&/^[A-Z][A-Z &/–-]{3,55}$/.test(headingLine(b));
export function renderReadingRegions(screen,renderBlock,fallback){
 const context=`${screen.stage||''} ${screen.templateId||''}`;
 const reading=/reading/i.test(context),writing=/writing/i.test(context);
 const active=screen.combo?.steps?.find(s=>s.id===screen.combo.activeStep);
 // The picture-reveal renderer owns its own source/task relationship.
 if(screen.pictureReveal?.step&&screen.pictureReveal.step===active?.id)return fallback(screen);
 const visible=(screen.blocks||[]).map((b,i)=>({b,i,html:renderBlock(b,i)})).filter(x=>x.html);
 // Group only independently titled text blocks; never infer groups from arbitrary prose.
 if(/language bank/i.test(active?.label||'')&&visible.length>=2&&visible.length<=4&&visible.every(x=>groupedText(x.b)))return `<div class="aud-language-grid" data-columns="${visible.length}" role="group" aria-label="Language bank">${visible.map(x=>`<section class="aud-language-card">${x.html}</section>`).join('')}</div>`;
 // Compact independent runs without reordering blocks or splitting a task's controls.
 if(!reading&&!writing){
  const gridTypes=new Set(['fill','mcq','multi-select','true-false','writing','discussion','poll']);
  const chunks=[];let run=[];let kind='';let grouped=false;
  function flush(){if(run.length>1){grouped=true;chunks.push(`<div class="aud-compact-grid aud-compact-${kind}">${run.map(x=>x.html).join('')}</div>`);}else if(run.length)chunks.push(run[0].html);run=[];kind='';}
  for(const x of visible){const k=x.b.type==='image'?'images':gridTypes.has(x.b.type)?'tasks':'';if(!k){flush();chunks.push(x.html);continue;}if(k!==kind){flush();kind=k;}run.push(x);}
  flush();
  // A leading photo plus support/tasks can use two independently scrolling regions.
  if(visible[0]?.b.type==='image'&&visible.filter(x=>x.b.type==='image').length===1&&visible.length>=3&&visible.slice(1).some(x=>gridTypes.has(x.b.type))){return `<div class="aud-reading-regions aud-picture-task-regions"><section class="aud-reading-region aud-reading-source" aria-label="Image" tabindex="0">${visible[0].html}</section><section class="aud-reading-region aud-reading-task" aria-label="Learning tasks" tabindex="0">${visible.slice(1).map(x=>x.html).join('')}</section></div>`;}
  return grouped?`<div class="aud-compact-content">${chunks.join('')}</div>`:fallback(screen);
 }
 let source=[],task=[];
 if(reading){for(const x of visible)(sourceTypes.has(x.b.type)?source:task).push(x.html);}
 else{
  // Split only a leading run of reference blocks, never move a later block across a task.
  const boundary=visible.findIndex(x=>!sourceTypes.has(x.b.type));
  if(boundary<=0||visible.slice(boundary).some(x=>sourceTypes.has(x.b.type)))return fallback(screen);
  source=visible.slice(0,boundary).map(x=>x.html);task=visible.slice(boundary).map(x=>x.html);
 }
 if(!source.length||!task.length)return fallback(screen);
 return `<div class="aud-reading-regions${writing?' aud-writing-regions':''}"><section class="aud-reading-region aud-reading-source" aria-label="${writing?'Writing support':'Reading passage'}" tabindex="0">${source.join('')}</section><section class="aud-reading-region aud-reading-task" aria-label="Learning tasks" tabindex="0">${task.join('')}</section></div>`;
}
