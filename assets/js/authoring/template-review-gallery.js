/* E-LEAP visual review gallery. Deliberately separate from lesson authoring.
 * Review decisions are local UI annotations, NOT server certification.
 */
import {CERTIFIED_TEMPLATES,makeCertifiedTemplate,changeCertifiedVariant} from './certified-templates.js';
import {renderCertifiedVisual} from './certified-template-render.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='eleap-certified-layout-review-v1';
const all=Object.entries(CERTIFIED_TEMPLATES).flatMap(([family,t])=>t.variants.map(v=>({family,...v,groupLabel:t.label})));
const sample=family=>{
 const d=makeCertifiedTemplate(family);
 if(family==='cover')Object.assign(d.values,{unit:'UNIT 12',topic:'NATURE',course:'LIFE · A2–B1',imageAlt:'Nature photograph'});
 if(family==='aims')Object.assign(d.values,{
  knowledge1:'Identify key weather phenomena.',knowledge2:'Describe how extreme weather develops.',
  skills1:'Interpret information from a short text.',skills2:'Explain ideas with supporting evidence.',
  attitudes1:'Collaborate respectfully with peers.',attitudes2:'Demonstrate curiosity about nature.'
 });
 if(family==='opener')Object.assign(d.values,{
  activityNumber:'1',instruction:'Look at the picture and answer the questions.',
  imageAlt:'Extreme weather photograph',q1:'What can you see?',a1:'Dark clouds.',
  q2:'What is happening?',a2:'A strong storm is forming.',
  q3:'What is this kind of storm called?',a3:'A tornado.',
  target:'tornado',concept:'A violently rotating column of air reaching the ground.'
 });
 return d;
};
function readReviews(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
export function acceptedLayoutVariants(family){const reviews=readReviews();return (CERTIFIED_TEMPLATES[family]?.variants||[]).filter(v=>reviews[family+':'+v.id]?.decision==='layout-accepted').map(v=>v.id);}
export function showTemplateReviewGallery(root,{backUrl='./index.html'}={}){
 let selected=all[0],q=0,visibleAnswer=false,reviews=readReviews(),photoSrc='',status='all';
 const template=()=>{const data=changeCertifiedVariant(sample(selected.family),selected.id);data.values.imageSrc=photoSrc;return data;};
 const count=()=>all.filter(a=>reviews[a.family+':'+a.id]?.decision==='layout-accepted').length;
 function draw(){
  const filtered=all.filter(x=>status==='all'||x.family===status);
  const key=selected.family+':'+selected.id,record=reviews[key]||{};
  root.innerHTML='<section class="studio-gallery">'+
   '<header class="gallery-top"><div><div class="studio-kicker">E-LEAP STUDIO · TEMPLATE REVIEW</div><h1>Template Gallery & Review</h1><p>Xem và duyệt bố cục trước khi dùng mẫu cho bài giảng. Đang xem '+count()+' / '+all.length+' mẫu được chấp nhận bố cục tại trình duyệt này.</p></div><a class="studio-btn" href="'+esc(backUrl)+'">← Lesson Builder</a></header>'+
   '<nav class="gallery-controls">'+['all','cover','aims','opener'].map(f=>'<button data-gallery-filter="'+f+'" class="'+(status===f?'active':'')+'">'+({all:'All templates',cover:'Cover · 3',aims:'Aims · 2',opener:'Opener · 3'}[f])+'</button>').join('')+'<span>Click a design below to compare</span></nav>'+
   '<div class="gallery-layout"><aside class="gallery-list">'+
   ['cover','aims','opener'].map(f=>'<section><h2>'+esc(CERTIFIED_TEMPLATES[f].label)+'</h2>'+
    filtered.filter(x=>x.family===f).map(x=>{const r=reviews[x.family+':'+x.id]||{};return '<button type="button" class="gallery-item '+(selected.family===x.family&&selected.id===x.id?'active':'')+'" data-gallery-select="'+esc(x.family+':'+x.id)+'"><strong>'+esc(x.label)+'</strong><small>'+esc(x.description)+'</small><span>'+esc(r.decision==='layout-accepted'?'Bố cục đã được chọn':r.decision==='needs-change'?'Cần sửa':'Chưa duyệt')+'</span></button>'}).join('')+'</section>').join('')+
   '</aside><main class="gallery-review"><div class="gallery-preview-head"><div><h2>'+esc(selected.groupLabel)+' · '+esc(selected.label)+'</h2><p>'+esc(selected.description)+'</p></div><span class="gallery-status">'+esc(record.decision==='layout-accepted'?'Đã chấp nhận bố cục':record.decision==='needs-change'?'Cần sửa':'Chưa duyệt')+'</span></div>'+
   '<div class="gallery-demo">'+renderCertifiedVisual({certifiedTemplate:template()},'teacher',q,visibleAnswer)+'</div>'+
   (selected.family==='opener'?'<div class="gallery-demo-controls"><button data-gallery-question="0">Question 1</button><button data-gallery-question="1">Question 2</button><button data-gallery-question="2">Question 3</button><button data-gallery-answer>'+(visibleAnswer?'Hide answer':'Show answer')+'</button></div>':'')+
   '<div class="gallery-review-fields"><label>Ảnh minh họa của chị (HTTPS URL hoặc đường dẫn có sẵn trên website)<input data-gallery-photo placeholder="Dán đường dẫn ảnh thật nếu muốn thử bố cục với ảnh" value="'+esc(photoSrc)+'"></label>'+
   '<label>Nhận xét về bố cục / kích thước chữ / tương tác<textarea data-gallery-notes rows="3" placeholder="Ví dụ: ảnh nên lớn hơn, phần Questions cần tăng chữ...">'+esc(record.notes||'')+'</textarea></label>'+
   '<div class="gallery-actions"><button data-gallery-decision="needs-change">Cần chỉnh sửa</button><button data-gallery-decision="layout-accepted">Chấp nhận bố cục</button><button data-gallery-decision="unreviewed">Bỏ đánh dấu</button></div>'+
   '<p class="gallery-caution">Lưu ý: Chấp nhận bố cục chỉ ghi nhận ý kiến trên trình duyệt này, KHÔNG phải nghiệm thu chức năng, không tự động Publish và chưa đồng bộ sang tài khoản khác. Ảnh mặc định là ô dành cho ảnh thật, không phải ảnh đã được cấp quyền.</p>'+
   '</div></main></div></section>';
  root.querySelectorAll('[data-gallery-filter]').forEach(b=>b.onclick=()=>{status=b.dataset.galleryFilter;draw()});
  root.querySelectorAll('[data-gallery-select]').forEach(b=>b.onclick=()=>{const [family,id]=b.dataset.gallerySelect.split(':');selected=all.find(x=>x.family===family&&x.id===id);q=0;visibleAnswer=false;photoSrc='';draw()});
  root.querySelectorAll('[data-gallery-question]').forEach(b=>b.onclick=()=>{q=+b.dataset.galleryQuestion;visibleAnswer=false;draw()});
  root.querySelector('[data-gallery-answer]')?.addEventListener('click',()=>{visibleAnswer=!visibleAnswer;draw()});
  root.querySelector('[data-gallery-photo]')?.addEventListener('change',e=>{photoSrc=e.target.value.trim();draw()});
  root.querySelectorAll('[data-gallery-decision]').forEach(b=>b.onclick=()=>{
   const key=selected.family+':'+selected.id,decision=b.dataset.galleryDecision;
   const notes=root.querySelector('[data-gallery-notes]')?.value||'';
   if(decision==='unreviewed')delete reviews[key];else reviews[key]={decision,notes,at:new Date().toISOString()};
   localStorage.setItem(KEY,JSON.stringify(reviews));draw();
  });
 }
 draw();
}
