/* Review-first Method Library. Method selection does not mutate a lesson.
   A complete original source must pass mapping checks before an actual lesson can be generated. */
import {METHOD_COMBOS,METHOD_GROUPS,checkMethodSource,mapMethodToStates} from './method-combo-catalog.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='eleap-method-review-v1';
const getReviews=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
export function showMethodReviewGallery(root,{backUrl='./index.html?view=gallery'}={}){
 const reviews=getReviews();let current='tbl-listening',activeStep=0;
 const selected=()=>METHOD_COMBOS[current];
 function draw(){
  const c=selected(),review=reviews[current]||{};
  root.innerHTML='<div class="studio-method-gallery">'+
   '<header class="gallery-top"><div><div class="studio-kicker">E-LEAP STUDIO · METHOD LIBRARY</div><h1>Teaching Methods & Combos</h1><p>Duyệt quy trình sư phạm trước; sau đó mới đưa học liệu của từng bài vào các ô tương ứng.</p></div>'+
   '<a class="studio-btn" href="'+esc(backUrl)+'">← Template Gallery</a></header>'+
   '<div class="gallery-layout"><aside class="gallery-list">'+
    METHOD_GROUPS.map(g=>'<section><h2>'+esc(g)+'</h2>'+Object.entries(METHOD_COMBOS).filter(([,x])=>x.group===g).map(([id,x])=>
     '<button class="gallery-item '+(current===id?'active':'')+'" data-method-select="'+esc(id)+'"><strong>'+esc(x.label)+'</strong><small>'+esc(x.description)+'</small><span>'+esc(reviews[id]?.decision==='layout-accepted'?'Đã chọn phương pháp':reviews[id]?.decision==='needs-change'?'Cần chỉnh sửa':'Chưa duyệt')+'</span></button>').join('')+'</section>').join('')+
   '</aside><main class="gallery-review"><h2>'+esc(c.label)+'</h2><p class="gallery-method-subtitle"><strong>Method:</strong> '+esc(c.method)+' · '+esc(c.description)+'</p>'+
   '<div class="gallery-method-steps">'+c.steps.map((s,i)=>'<button class="gallery-method-step '+(activeStep===i?'active':'')+'" data-method-step="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(s.label)+'</strong></button>').join('')+'</div>'+
   '<section class="gallery-method-detail"><div class="studio-kicker">LEARNER ACTIVITY '+(activeStep+1)+' / '+c.steps.length+'</div>'+
   '<h3>'+esc(c.steps[activeStep].label)+'</h3><p>'+esc(c.steps[activeStep].instruction)+'</p>'+
   '<div class="gallery-method-zone"><b>CONTENT SLOT · '+esc(c.steps[activeStep].slot)+'</b>'+
   '<p>'+esc(c.steps[activeStep].showSource?'Hiển thị đúng phần học liệu liên quan theo sách.':'Chỉ hiện hỗ trợ/hoạt động ở bước này; đáp án chính được giữ kín.')+'</p></div>'+
   '<div class="gallery-method-meta"><span>Work mode: '+esc(c.steps[activeStep].mode)+'</span><span>Answer: '+esc(c.steps[activeStep].id==='complete'?'teacher-controlled':'hidden')+'</span></div></section>'+
   '<section class="gallery-method-contract"><h3>Original-source mapping</h3><p><b>Required:</b> '+esc(c.required.join(' · '))+'</p>'+
   '<p><b>Optional scaffolding:</b> '+esc((c.optional||[]).join(' · '))+'</p>'+
   '<p class="gallery-caution">Chưa có ngữ liệu đầu vào nên đây chỉ là bản thiết kế combo. E-LEAP không tự tạo audio, câu hỏi hoặc đáp án thay cho sách. Khi thiếu tài nguyên bắt buộc, không được đánh dấu bài giảng đã hoàn thành.</p></section>'+
   '<section class="gallery-review-fields"><label>Nhận xét / điều chỉnh các bước<textarea data-method-notes rows="3" placeholder="Ví dụ: cần thêm Pair Check trước Complete...">'+esc(review.notes||'')+'</textarea></label>'+
   '<div class="gallery-actions"><button data-method-review="needs-change">Cần chỉnh sửa</button><button data-method-review="layout-accepted">Chấp nhận hướng phương pháp</button><button data-method-review="unreviewed">Bỏ đánh dấu</button></div>'+
   '<p class="gallery-caution">Đánh dấu chỉ lưu trên trình duyệt này, KHÔNG phải chứng nhận tương tác hay quyền Publish trên server.</p></section></main></div></div>';
  root.querySelectorAll('[data-method-select]').forEach(b=>b.onclick=()=>{current=b.dataset.methodSelect;activeStep=0;draw()});
  root.querySelectorAll('[data-method-step]').forEach(b=>b.onclick=()=>{activeStep=Number(b.dataset.methodStep);draw()});
  root.querySelectorAll('[data-method-review]').forEach(b=>b.onclick=()=>{
   const choice=b.dataset.methodReview,note=root.querySelector('[data-method-notes]')?.value||'';
   if(choice==='unreviewed')delete reviews[current];else reviews[current]={decision:choice,notes:note,at:new Date().toISOString()};
   localStorage.setItem(KEY,JSON.stringify(reviews));draw();
  });
  root.querySelector('[data-method-notes]')?.addEventListener('input',e=>{
   const prev=reviews[current]||{decision:'unreviewed'};
   reviews[current]={...prev,notes:e.target.value,at:new Date().toISOString()};
   localStorage.setItem(KEY,JSON.stringify(reviews));
  });
 }
 draw();
}
