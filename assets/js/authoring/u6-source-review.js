/* Teacher-only authenticated U6 source review. Never serialize source or responses
 * into Studio lesson drafts or client-accessible lesson publication.
 * UI review is not the live class runtime; no student Submit is performed here.
 */
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
export const U6_PREVIEW_ASSIGNMENT_ID = 'd763be6e-3a27-4d1a-95e0-658060610e27'; // Preview QA fixture only.
export function validateU6TeacherSource(payload) {
 const m=payload?.material;
 const labels=['A','B','C'];
 if(payload?.ok!==true || payload.reviewOnly!==true || !m || m.source_text_verified!==true || m.photo_assets_verified!==true)
  return {ok:false,error:'The source and photographs must be verified by the teacher.'};
 if(!labels.every(k=>typeof m.accounts?.[k]==='string' && m.accounts[k].trim().length>=20))
  return {ok:false,error:'A, B and C must contain the full verified texts.'};
 if(!Array.isArray(m.photo_labels)||m.photo_labels.length!==3||!Array.isArray(m.original_questions)||m.original_questions.length!==2)
  return {ok:false,error:'The original three photographs and two questions must be present.'};
 if(!Array.isArray(m.photo_assets)||m.photo_assets.length!==3||new Set(m.photo_assets.map(v=>v.assetId)).size!==3||m.photo_assets.some(v=>!validUuid(v?.assetId)))
  return {ok:false,error:'Three distinct verified photo assets are required.'};
 return {ok:true,material:m};
}
export async function fetchU6TeacherSource(assignmentId,{fetcher=fetch}={}){
 if(!validUuid(assignmentId))throw new Error('A valid assignment identifier is required.');
 const res=await fetcher('/api/research/reading-jigsaw?assignmentId='+encodeURIComponent(assignmentId),{credentials:'same-origin',cache:'no-store'});
 if(!res.ok)throw new Error(res.status===403?'This Teacher account cannot access that class.':'Unable to load verified U6 source ('+res.status+').');
 const review=validateU6TeacherSource(await res.json());
 if(!review.ok)throw new Error(review.error);
 return review.material;
}
const label=(title,placeholder,key,ans)=>'<label class="u6-review-field"><strong>'+escapeHtml(title)+'</strong><textarea data-u6-review-answer="'+escapeHtml(key)+'" placeholder="'+escapeHtml(placeholder)+'" rows="2">'+escapeHtml(ans?.[key]||'')+'</textarea></label>';
const task=(n,value)=>'<div class="u6-original-task"><b>Task '+n+' · Original textbook</b><p>'+escapeHtml(value)+'</p></div>';
const chooser=(value)=>'<div class="u6-paragraph-picker" role="group" aria-label="Choose paragraph for teacher review">'+['A','B','C'].map(k=>'<button type="button" class="studio-btn '+(k===value?'primary':'')+'" data-u6-review-account="'+k+'" aria-pressed="'+(k===value?'true':'false')+'">Paragraph '+k+'</button>').join('')+'</div>';
export function renderU6TeacherReview(screen,source,answers={},selectedAccount='A',error=''){
 const st=screen?.methodDraft?.activeStep||'read',m=source||null;
 const intro='<p class="u6-review-intro">Teacher preview · U6 “My first day”. This is not a student submission.</p>';
 if(!m)return '<section class="u6-source-preview">'+intro+'<div class="u6-source-connection"><label><b>Verified U6 Reading assignment</b><input data-u6-assignment-id value="'+escapeHtml(U6_PREVIEW_ASSIGNMENT_ID)+'" aria-label="U6 assignment identifier"></label><button type="button" class="studio-btn primary" data-u6-load-source>Load verified source</button>'+(error?'<p class="u6-review-error" role="alert">'+escapeHtml(error)+'</p>':'')+'</div></section>';
 const text=m.accounts?.[selectedAccount]||'';
 const passage='<article class="u6-source-paragraph"><div class="u6-source-paragraph-head"><strong>Paragraph '+escapeHtml(selectedAccount)+'</strong><span>Textbook p. '+escapeHtml(m.source_page)+'</span></div><p>'+escapeHtml(text)+'</p></article>';
 const photos='<div class="u6-review-photos">'+m.photo_assets.map((asset,i)=>'<figure><img loading="lazy" alt="'+escapeHtml(asset.alt||m.photo_labels[i]||'Person')+'" src="/api/research/reading-jigsaw-photo-review?assignmentId='+encodeURIComponent(m.__reviewAssignmentId||'')+'&assetId='+encodeURIComponent(asset.assetId||'')+'"><figcaption>'+escapeHtml(m.photo_labels[i]||asset.alt||'Photo '+(i+1))+'</figcaption></figure>').join('')+'</div>';
 const match='<div class="u6-original-questions">'+photos+m.original_questions.map((q,i)=>task(i+1,q)).join('')+'</div>';
 let content='';
 switch(st){
 case 'read':
  content='<p>Work in a group of three. Agree who reads A, B or C. Each student chooses a different paragraph.</p>'+chooser(selectedAccount)+passage;
  break;
 case 'clues':
  content=chooser(selectedAccount)+passage+label('School detail','Copy a short school-related phrase from your paragraph.','school',answers)+label('Time or experience clue','Quote a second useful phrase from the text.','time',answers);break;
 case 'share':
  content='<p>Explain your two clues. Listen to your teammates and record evidence from the other two paragraphs.</p>'+label('Evidence from teammate 1','Quote or paraphrase one useful clue.','peer1',answers)+label('Evidence from teammate 2','Quote or paraphrase a different clue.','peer2',answers);break;
 case 'match':
  content=match+['Mavis Carver','Anita Green','Neil Johnson'].map((p,i)=>label(p+' · Paragraph & estimated year','E.g. paragraph letter, approximate year and a reason.','match'+i,answers)).join('');break;
 case 'justify':
  content='<p>Support one match or year estimate with an exact phrase from the reading.</p>'+chooser(selectedAccount)+passage+label('Evidence · Exact quote','Copy an exact phrase.','quote',answers)+label('Why does it support your answer?','Explain the connection between this phrase and your answer.','why',answers);break;
 case 'submit':
  content='<p>Check the group answers and your quotation. Submission is not enabled in this Teacher preview.</p>'+match+'<div class="u6-review-blocked">Submit remains locked until authenticated learner role selection and Responses have passed end-to-end tests.</div>';break;
 default:content='<p>Choose a reading step.</p>';
 }
 return '<section class="u6-source-preview">'+intro+'<div class="u6-source-badge">Verified textbook source · Page '+escapeHtml(m.source_page)+'</div>'+content+'</section>';
}
