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
const chooser=(value)=>'<div class="u6-paragraph-picker" role="group" aria-label="Choose a paragraph to review as Teacher">'+['A','B','C'].map(k=>'<button type="button" class="studio-btn '+(k===value?'primary':'')+'" data-u6-review-account="'+k+'" aria-pressed="'+(k===value?'true':'false')+'">Paragraph '+k+'</button>').join('')+'</div>';
/* Exact six-step Student QA baseline in reading-jigsaw.html. Do NOT silently publish
 * the separate proposed six-step method until its authenticated runtime exists.
 * ID maps let existing methodDraft screens remain valid without losing their saves.
 */
export const U6_STUDENT_PARITY_STEPS=Object.freeze([
 {id:'read',label:'Look & Predict',studentStage:'predict'},
 {id:'clues',label:'Individual Reading',studentStage:'assigned'},
 {id:'share',label:'Expert Group',studentStage:'expert'},
 {id:'match',label:'Home Group',studentStage:'home'},
 {id:'justify',label:'Original Tasks',studentStage:'complete'},
 {id:'submit',label:'Evidence & Why / Submit',studentStage:'evidence'}
]);
export function renderU6TeacherReview(screen,source,answers={},selectedAccount='A',error=''){
 const st=screen?.methodDraft?.activeStep||'read',m=source||null;
 const intro='<p class="u6-review-intro">Teacher source review · same activity order as the existing Student QA lesson · NOT PUBLISHED</p>';
 if(!m)return '<section class="u6-source-preview">'+intro+'<div class="u6-source-connection"><label><b>Verified U6 Reading assignment</b><input data-u6-assignment-id value="'+escapeHtml(U6_PREVIEW_ASSIGNMENT_ID)+'" aria-label="U6 assignment identifier"></label><button type="button" class="studio-btn primary" data-u6-load-source>Load verified source</button>'+(error?'<p class="u6-review-error" role="alert">'+escapeHtml(error)+'</p>':'')+'</div></section>';
 const text=m.accounts?.[selectedAccount]||'';
 const passage='<article class="u6-source-paragraph"><div class="u6-source-paragraph-head"><strong>Paragraph '+escapeHtml(selectedAccount)+'</strong><span>Textbook p. '+escapeHtml(m.source_page)+'</span></div><p>'+escapeHtml(text)+'</p></article>';
 const photos='<div class="u6-review-photos" aria-label="Three original textbook photographs">'+m.photo_assets.map((asset,i)=>'<figure><img loading="lazy" alt="'+escapeHtml(asset.alt||m.photo_labels[i]||'Person')+'" src="/api/research/reading-jigsaw-photo-review?assignmentId='+encodeURIComponent(m.__reviewAssignmentId||'')+'&assetId='+encodeURIComponent(asset.assetId||'')+'"><figcaption>'+escapeHtml(m.photo_labels[i]||asset.alt||'Photo '+(i+1))+'</figcaption></figure>').join('')+'</div>';
 const questions='<div class="u6-original-questions">'+m.original_questions.map((q,i)=>task(i+1,q)).join('')+'</div>';
 let content='';
 switch(st){
 case 'read':
  content='<h2>Look at the three photographs</h2>'+photos+task(1,m.original_questions[0])+label('My first prediction','I think ... because ...','prediction',answers);break;
 case 'clues':
  content='<h2>Read one account</h2><p>Teacher review: switch between A, B and C. In the existing Student lesson, each learner sees only the account assigned to them.</p>'+chooser(selectedAccount)+passage+label('Clue 1 from my account','Copy a short clue from this paragraph.','individual1',answers)+label('Clue 2 from my account','Copy another useful clue.','individual2',answers);break;
 case 'share':
  content='<h2>Expert Group</h2><p>Meet readers of the same account. Compare your clues and identify the writer’s feelings and a possible time clue.</p>'+chooser(selectedAccount)+passage+label('Our best text evidence','Quote the most useful phrase.','expertEvidence',answers)+label('Why does it matter?','What do the feeling and time clues suggest?','expertWhy',answers);break;
 case 'match':
  content='<h2>Home Group</h2><p>Return to a group with readers A, B and C. Teach one another. Listen and record one useful clue from each partner.</p>'+label('Partner 1 · New information','What evidence did your partner share?','partner1',answers)+label('Partner 2 · New information','Record a different clue.','partner2',answers);break;
 case 'justify':
  content='<h2>Complete both textbook tasks</h2>'+photos+questions+['Mavis Carver','Anita Green','Neil Johnson'].map((p,i)=>label(p+' · paragraph and estimated starting year','Choose paragraph A/B/C, estimate the year and record one supporting detail.','match'+i,answers)).join('');break;
 case 'submit':
  content='<h2>Evidence & Why</h2><p>Use a quotation from your own paragraph to explain your match. Review the group answers before submitting.</p>'+chooser(selectedAccount)+passage+label('Which person matches this account?','Write the matching name.','photoName',answers)+label('Evidence · Exact quotation','Copy a short phrase from the source text.','quote',answers)+label('Why?','Explain why that phrase supports the match.','why',answers)+label('Estimated year','Estimate a year or period.','year',answers)+'<div class="u6-review-blocked">Teacher preview only. Actual learner Submit is in the existing authenticated Student activity; this Studio review does not submit or alter Responses.</div>';break;
 default:content='<p>Select one of the six review steps.</p>';
 }
 return '<section class="u6-source-preview">'+intro+'<div class="u6-source-badge">Verified textbook source · Page '+escapeHtml(m.source_page)+'</div>'+content+'</section>';
}
