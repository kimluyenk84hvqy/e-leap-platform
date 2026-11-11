/* Fixed HTML renderers for certified template families.
 * Data is always escaped. Student mode never exposes keys.
 */
import {CERTIFIED_TEMPLATES,TEMPLATE_TOKENS,validateCertifiedTemplate} from './certified-templates.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeMedia=s=>/^https:\/\/[^\s"'<>]+$/i.test(String(s||''))||/^(?:\/(?!\/)|\.\.?\/)[^\s"'<>]+$/.test(String(s||''))?String(s):'';
const photo=(src,alt,editor)=>{
 const url=safeMedia(src);
 return url?'<img class="cert-photo" loading="lazy" src="'+esc(url)+'" alt="'+esc(alt)+'">':
   '<div class="cert-photo-missing">'+(editor?'<button type="button" class="cert-photo-choose" data-certified-image-jump title="Locate the image source field">+ Add a real photo</button>':'')+'</div>';
};
const blank=x=>esc(x||'');
export function renderCertifiedVisual(s,role,qIndex=0,revealed=false,response=''){
 const data=s.certifiedTemplate||{},v=data.values||{},family=data.family,editor=['teacher','admin'].includes(role),canReveal=['teacher','admin','presentation'].includes(role);
 let inner='';
 if(family==='cover'){
  inner='<div class="cert-cover-layout"><div class="cert-cover-identity">'+
   '<div class="cert-institution">'+blank(v.institution)+'</div>'+
   '<div class="cert-faculty">'+blank(v.faculty)+'</div>'+
   '<div class="cert-cover-content"><div class="cert-unit">'+blank(v.unit)+'</div><h1>'+blank(v.topic)+'</h1><p>'+blank(v.course)+'</p></div></div>'+
   '<div class="cert-cover-photo">'+photo(v.imageSrc,v.imageAlt||v.topic,editor)+'</div></div>';
 }else if(family==='aims'){
  const group=(label,key,n)=>'<section class="cert-aim-card"><span class="cert-aim-number">'+n+'</span><h2>'+label+'</h2><ol><li>'+blank(v[key+'1'])+'</li><li>'+blank(v[key+'2'])+'</li></ol></section>';
  inner='<div class="cert-aims-head">Aims of the lesson</div><div class="cert-aims-grid">'+
   group('KNOWLEDGE','knowledge','01')+group('SKILLS','skills','02')+group('ATTITUDES','attitudes','03')+'</div>';
 }else if(family==='opener'){
  const i=Math.max(0,Math.min(2,Number(qIndex)||0)),show=revealed&&canReveal;
  const cover=data.variant==='mystery-reveal'?'<div class="cert-mystery-tiles stage-'+i+'"><span></span><span></span><span></span><span></span></div>':data.variant==='hot-seat'&&!show&&i<2?'<div class="cert-hotseat-cover">Describe it without naming it!</div>':'';
  const image='<div class="cert-opener-photo">'+photo(v.imageSrc,v.imageAlt||v.target,editor)+cover+'</div>';
  const task='<div class="cert-opener-task"><div class="cert-task-label">ACTIVITY '+blank(v.activityNumber)+'</div>'+
   '<p class="cert-instruction">'+blank(v.instruction)+'</p>'+
   '<div class="cert-question-counter">QUESTION '+(i+1)+' / 3</div>'+
   '<div class="cert-question">'+blank(v['q'+(i+1)])+'</div>'+
   '<label class="cert-answer-label">Your answer <textarea data-certified-response rows="2" placeholder="Type or discuss your answer...">'+blank(response)+'</textarea></label>'+
   (show?'<div class="cert-revealed-key">'+blank(v['a'+(i+1)])+'</div>':'')+
   '<div class="cert-opener-actions"><div class="cert-step-buttons">'+[0,1,2].map(x=>
      '<button type="button" data-certified-question="'+x+'" class="'+(x===i?'active':'')+'">'+(x+1)+'</button>').join('')+'</div>'+
    '<button type="button" data-certified-reset>Reset</button>'+ (canReveal?'<button type="button" data-certified-reveal>'+(show?'Hide answer':'Show answer')+'</button>':'')+'</div>'+
   (show&&i===2?'<div class="cert-target"><strong>'+blank(v.target)+'</strong><span>'+blank(v.concept)+'</span></div>':'')+'</div>';
  inner='<div class="cert-opener-grid">'+(data.variant==='hot-seat'?task+image:image+task)+'</div>';
 }
 const issues=validateCertifiedTemplate(data);
 const typography={
  '--cert-identity':TEMPLATE_TOKENS.coverIdentityPx+'px','--cert-faculty':TEMPLATE_TOKENS.coverFacultyPx+'px',
  '--cert-cover-unit':TEMPLATE_TOKENS.coverUnitPx+'px','--cert-cover-topic':TEMPLATE_TOKENS.coverTopicPx+'px',
  '--cert-cover-course':TEMPLATE_TOKENS.coverCoursePx+'px','--cert-aims-title':TEMPLATE_TOKENS.aimsTitlePx+'px',
  '--cert-aims-category':TEMPLATE_TOKENS.aimsCategoryPx+'px','--cert-aims-body':TEMPLATE_TOKENS.aimsBodyPx+'px',
  '--cert-opener-task':TEMPLATE_TOKENS.openerTaskPx+'px','--cert-opener-instruction':TEMPLATE_TOKENS.instructionPx+'px',
  '--cert-opener-question':TEMPLATE_TOKENS.openerQuestionPx+'px','--cert-opener-target':TEMPLATE_TOKENS.openerTargetPx+'px'
 };
 const typeStyle=Object.entries(typography).map(([name,value])=>name+':'+value).join(';');
 return '<div class="canvas-wrap certified-wrap"><section class="lesson-canvas certified-canvas certified-'+esc(family)+' design-'+esc(data.variant)+'" style="'+esc(typeStyle)+'">'+inner+'</section>'+
  (editor&&issues.length?'<div class="cert-editor-warning">'+issues.length+' slot checks incomplete. Finish Template Slots before Publish.</div>':'')+'</div>';
}
export function renderCertifiedEditor(s){
 const data=s.certifiedTemplate;
 if(!data)return '';
 const spec=CERTIFIED_TEMPLATES[data.family];if(!spec)return '';
 const options=spec.variants.map(v=>'<button class="cert-variant-choice '+(data.variant===v.id?'active':'')+
  '" type="button" data-certified-variant="'+esc(v.id)+'"><b>'+esc(v.label)+'</b><small>'+esc(v.description)+'</small></button>').join('');
 const fields=Object.entries(spec.slots).map(([key,def])=>{
  const value=blank(data.values?.[key]);
  return '<div class="studio-field"><label>'+esc(def.label)+(spec.required.includes(key)?' *':'')+'</label>'+
   (def.kind==='textarea'?'<textarea data-certified-slot="'+key+'" maxlength="'+def.limit+'">'+value+'</textarea>':
    '<input type="text" data-certified-slot="'+key+'" maxlength="'+def.limit+'" value="'+value+'">')+'</div>';
 }).join('');
 const issues=validateCertifiedTemplate(data);
 const originalSource=(s.blocks||[]).map((b,i)=>{
  const details=String(b.content?.text||b.activity?.prompt||b.content?.src||'').trim();
  return details?'<p><strong>'+esc(b.type||'block')+' '+(i+1)+'</strong>: '+esc(details.slice(0,500))+'</p>':'';
 }).filter(Boolean).join('');
 const sourcePanel=data.sourceReview?.required?'<details class="cert-original-source"><summary>Review original source blocks before approval</summary>'+originalSource+'</details>':'';
 return '<section class="property-section certified-props"><h3>'+esc(spec.label)+'</h3>'+
  '<p class="helper">Design preview only. Verify the source text and images; activity submissions are not connected to Live Class yet.</p>'+
  '<div class="cert-variant-picker">'+options+'</div><h4>Template Slots</h4>'+fields+
  sourcePanel+
  (data.sourceReview?.required?'<button type="button" class="studio-btn" data-certify-review-source>Confirm source activity mapping</button><p class="helper">Check original textbook content and all learner-facing slots before confirming.</p>':'')+
  '<p class="helper">'+(issues.length?esc(issues.join(' · ')):'Certified slot checks passed.')+'</p></section>';
}
