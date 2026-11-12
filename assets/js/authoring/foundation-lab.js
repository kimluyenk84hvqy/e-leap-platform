/* M3: Preview-only Studio foundation lab with genuine DOM interactions.
 * Synthetic answer checking is limited to a bundled synthetic fixture.
 * Teacher-supplied keys remain unverified; no upload, network, Score record,
 * submission or publishing is performed by this lab.
 */
import {analyseExtractedText,SYNTHETIC_READING_FIXTURE} from './source-structure-intake.js';
import {extractLocalPdfText} from './source-pdf-local.js';
import {foundationPermissions,executeFoundationAction} from './foundation-lab-controls.js';
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phases=['Read','Answer','Compare'];
export function createFoundationLabModel(text,{synthetic=false}={}){
 const analysis=analyseExtractedText(text);
 return {analysis,synthetic,taskIndex:0,phase:0,role:'teacher',originRole:'teacher',answers:new Map(),revealed:new Set(),check:null,scoreVisible:false};
}
export function evaluateFoundationResponses(model){
 const task=model.analysis.source?.tasks?.[model.taskIndex],qs=task?.questions||[],answered=qs.filter(q=>model.answers.has(q.id)&&model.answers.get(q.id)).length;
 if(!model.synthetic)return {checked:false,answered,total:qs.length,correct:null,reason:'Teacher-supplied keys are NOT source-verified. Only answer recording is available.'};
 const correct=qs.filter(q=>q.suppliedKey&&model.answers.get(q.id)===q.suppliedKey).length;
 return {checked:true,answered,total:qs.length,correct,percentage:qs.length?Math.round(100*correct/qs.length):0};
}
let pdfJsLoad=null;
async function loadPdfJs(){
 if(window.pdfjsLib)return window.pdfjsLib;
 if(!pdfJsLoad)pdfJsLoad=new Promise((resolve,reject)=>{
  const tag=document.createElement('script');
  tag.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  tag.crossOrigin='anonymous';tag.referrerPolicy='no-referrer';
  tag.onload=()=>{
   const lib=window.pdfjsLib;
   if(!lib)return reject(Error('PDF.js was not loaded'));
   lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
   resolve(lib);
  };
  tag.onerror=()=>reject(Error('Cannot load PDF reader; check connection'));
  document.head.appendChild(tag);
 });
 return pdfJsLoad;
}
export function mountFoundationLab(root,{role='teacher'}={}){
 if(!root)throw Error('Missing Studio root');
 let model=createFoundationLabModel(SYNTHETIC_READING_FIXTURE,{synthetic:true});
 model.role=role;model.originRole=role;
 let pdfNotice='No PDF selected. PDF parsing only extracts selectable text, not OCR.';
 const button=(label,action,disabled=false)=>'<button type="button" data-lab-action="'+action+'" '+(disabled?'disabled':'')+' class="studio-btn">'+escapeHtml(label)+'</button>';
 function draw(){
  const source=model.analysis.source,task=source?.tasks?.[model.taskIndex],qs=task?.questions||[],student=['student','guest'].includes(model.role);
  const outcome=evaluateFoundationResponses(model);
  const caps=foundationPermissions(model.role,{synthetic:model.synthetic,phase:model.phase});
  root.innerHTML='<section class="studio-shell" style="min-height:100vh;padding:20px;max-width:1100px;margin:auto">'+
  '<header><h1>E-LEAP · Foundation Lab</h1><p>Source structure + interactive activity validation · PREVIEW / NO AI / NO PUBLISH</p><a href="./index.html">← Studio</a></header>'+
  (['teacher','admin'].includes(model.role)?'<section class="property-section"><h2>M1 · Teacher-extracted text intake</h2><p>Paste extracted text or extract selectable text locally from PDF. PPT/audio understanding and key verification are not available.</p>'+
  '<label style="display:block;margin:8px 0">Extract text locally from PDF (max 25 MB, first 30 pages): <input type="file" accept="application/pdf,.pdf" data-lab-pdf></label><p role="status">'+escapeHtml(pdfNotice)+'</p>'+ '<textarea data-lab-source rows="12" style="width:100%;font:15px monospace">'+escapeHtml(currentText)+'</textarea>'+
  '<p>'+button('Analyse source','analyse')+' '+button('Load synthetic fixture','fixture')+'</p></section>'+
  '<section class="property-section"><h2>Source review</h2><p><b>Unit:</b> '+escapeHtml(source?.unit||'Missing')+' · <b>Verification:</b> UNVERIFIED</p>'+
  '<p><b>Tasks:</b> '+(source?.tasks?.length||0)+' · <b>Unverified records:</b> '+(source?.unverified?.length||0)+' · <b>Unparsed lines:</b> '+(source?.unparsed?.length||0)+'</p>'+
  (model.analysis.problems||[]).map(x=>'<p style="color:#a22525">'+escapeHtml(x)+'</p>').join('')+
  (task?.missing||[]).map(x=>'<p style="color:#a22525">Missing: '+escapeHtml(x)+'</p>').join('')+
  '<p><b>Safety:</b> No teacher-supplied answer is recognized as source-approved; incomplete text is marked for review.</p></section>':'')+
  '<section class="property-section"><h2>M3 · Real interaction sandbox</h2><p>Source-based content rendered as a three-step activity. This is NOT the published lesson player.</p>'+
  '<label>Preview role <select data-lab-role><option value="teacher" '+(model.role==='teacher'?'selected':'')+'>Teacher</option><option value="admin" '+(model.role==='admin'?'selected':'')+'>Admin</option><option value="student" '+(model.role==='student'?'selected':'')+'>Student</option><option value="guest" '+(model.role==='guest'?'selected':'')+'>Guest</option><option value="presentation" '+(model.role==='presentation'?'selected':'')+'>Presentation</option></select></label>'+
  '<nav class="combo-step-nav">'+phases.map((p,i)=>'<button type="button" class="combo-step-button '+(model.phase===i?'active':'')+'" data-lab-phase="'+i+'">'+(i+1)+'. '+p+'</button>').join('')+'</nav>'+
  (task?'<h3>'+escapeHtml(task.title)+'</h3>':'<p>Valid explicit TASK required.</p>')+
  (model.phase===0?'<p style="font-size:22px;line-height:1.6">'+escapeHtml(task?.passage||'Source passage unavailable')+'</p><p>Read the text. Underline or note information related to each question.</p>':
   model.phase===1?qs.map(q=>'<fieldset style="margin:12px 0;padding:14px;border:1px solid #acc3b0"><legend>'+escapeHtml(q.id+': '+q.prompt)+'</legend>'+
    q.options.map(o=>'<label style="display:block;padding:8px"><input type="radio" name="lab-'+escapeHtml(q.id)+'" data-lab-question="'+escapeHtml(q.id)+'" value="'+escapeHtml(o.id)+'" '+(model.answers.get(q.id)===o.id?'checked':'')+'> '+escapeHtml(o.id+'. '+o.label)+'</label>').join('')+
    ((caps.reveal&&model.revealed.has(q.id))?'<p>Verified synthetic fixture key: '+escapeHtml(q.suppliedKey)+'</p>':'')+
    (caps.reveal?button('Show answer ('+q.id+')','reveal-'+q.id):'')+'</fieldset>').join(''):
   '<p>Compare your saved choices with a partner. Explain which sentence in the reading supports each answer.</p>'+
   qs.map(q=>'<p>'+escapeHtml(q.id)+': '+escapeHtml(model.answers.get(q.id)||'Unanswered')+'</p>').join(''))+
  '<div style="display:flex;gap:8px;flex-wrap:wrap">'+button('Previous','previous',model.phase===0)+button('Next','next',model.phase===2)+(caps.check?button('Check','check'): '')+(caps.reset?button('Reset','reset'):'')+(caps.score?button('Score','score'): '')+(caps.exit?button('Exit Presentation','exit-presentation'): '')+'</div>'+
  (model.scoreVisible&&caps.score&&outcome.checked?'<p><b>Test score:</b> '+outcome.correct+'/'+outcome.total+' ('+outcome.percentage+'%). Unanswered included in denominator.</p>':
    '<p><b>Answers recorded:</b> '+outcome.answered+'/'+outcome.total+'. Correctness not checked for unverified source.</p>')+
  (model.check?'<p role="status">'+escapeHtml(model.check)+'</p>':'')+
  '<p><small>Submit/Responses/Live Class are intentionally unavailable in this isolated lab. They must be tested in the shared lesson runtime before M3 acceptance.</small></p></section></section>';
  root.querySelector('[data-lab-pdf]')?.addEventListener('change',async e=>{
   const file=e.target.files?.[0];if(!file)return;
   const status=root.querySelector('[data-lab-pdf]')?.parentElement?.nextElementSibling;
   if(status)status.textContent='Reading local PDF in this browser…';
   try{
    const reader=await loadPdfJs();
    const extracted=await extractLocalPdfText(file,reader);
    currentText=extracted.pages.map(p=>'[PDF PAGE '+p.page+' — UNVERIFIED]\n'+p.text).join('\n\n');
    model=createFoundationLabModel(currentText);model.role=role;model.originRole=role;
    pdfNotice='Loaded '+extracted.pages.length+'/'+extracted.pageCount+' pages from '+file.name+' (UNVERIFIED). '+extracted.warnings.join(' ');
    draw();
   }catch(error){pdfNotice='PDF extraction failed: '+String(error.message||error);draw();}
  });
  root.querySelector('[data-lab-action="analyse"]')?.addEventListener('click',()=>{currentText=root.querySelector('[data-lab-source]').value;model=createFoundationLabModel(currentText);model.role=role;model.originRole=role;draw();});
  root.querySelector('[data-lab-action="fixture"]')?.addEventListener('click',()=>{currentText=SYNTHETIC_READING_FIXTURE;model=createFoundationLabModel(currentText,{synthetic:true});model.role=role;model.originRole=role;draw();});
  root.querySelector('[data-lab-role]')?.addEventListener('change',e=>{model.role=e.target.value;model.revealed.clear();model.check=null;model.scoreVisible=false;draw();});
  root.querySelectorAll('[data-lab-phase]').forEach(el=>el.addEventListener('click',()=>{model.phase=Number(el.dataset.labPhase);model.check=null;model.scoreVisible=false;draw();}));
  root.querySelectorAll('[data-lab-question]').forEach(el=>el.addEventListener('change',()=>{model.answers.set(el.dataset.labQuestion,el.value);model.check=null;model.scoreVisible=false;draw();}));
  root.querySelectorAll('[data-lab-action]').forEach(el=>{const action=el.dataset.labAction;if(action==='analyse'||action==='fixture')return;el.addEventListener('click',()=>{
   executeFoundationAction(model,action.startsWith('reveal-')?'reveal':action,{questionId:action.startsWith('reveal-')?action.slice(7):null});
   draw();
  });});
 }
 let currentText=SYNTHETIC_READING_FIXTURE;
 draw();
 return {getState:()=>model};
}
