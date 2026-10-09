(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const lesson=window.LESSON;
const params=new URLSearchParams(location.search);
const role=(params.get('eleapRole')||params.get('role')||localStorage.getItem('e-leap-preview-role')||'teacher').toLowerCase();
const isTeacher=['teacher','admin'].includes(role)||params.get('eleapMode')==='presentation';
let index=0,selectedChip=null,activeGroup=0;
const content=$('#content'),title=$('#title'),stageLabel=$('#stageLabel'),instruction=$('#instruction'),counter=$('#counter'),status=$('#status'),nav=$('#nav');
const parkImg='https://commons.wikimedia.org/wiki/Special:Redirect/file/Park-G%C3%BCell.jpg?width=1600';
const localParkVideo='/api/media?pathname=life-intermediate/u01/l03/assets/media/my-local-park.mp4';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const slug=s=>String(s||'').trim().toLowerCase();

const instructions={
 s01:'Life A2–B1 · Unit 1 Lifestyle',
 s02:'By the end of the lesson, students will be able to:',
 s03:'Type a complete answer in the box and submit it.',
 s04:'',
 s06:'First identify the two forms. After the teacher reveals the form names, use the eliciting questions that appear below.',
 s05:'Now discuss your own experience of filling in forms and submit one short response.',
 s07:'Drag and drop the headings into the right boxes and submit your answers.',
 s08:'Work through all three groups from Exercise 3b. Submit before the teacher reveals the answers.',
 s10:'Work in pairs. Decide what information a new-student form needs, then prepare the form.',
 s10p:'Exchange your form with another pair and review it using all three textbook questions.',
 s10h:'Homework from Unit 1E: write a form for new students at VMMU.',
 s11:'',
 s12:'Look at the photo and caption, then discuss the two textbook questions.',
 s13:'Match the six bold words/phrases to definitions a–f.',
 s14:'Watch the video and number a–g in the order you see them.',
 s15:'Work in pairs. Student A completes column 1; Student B completes column 2.',
 s15p:'Share your notes, complete the other column, then watch again and check all answers.',
 s16:'Cover the notes. Student A chooses one person; Student B asks the two questions and guesses the person.',
 s16r:'Change roles and repeat Exercise 6.',
 s17:'Extension from the lesson PPT: think of a role model and tell your partner about that person.',
 s18:'Review the language and skills from Unit 1E and 1F.',
 s19:'Write your own paragraph and submit it by the deadline.',
 s20:'Thank you for your work today.'
};

const formHeadings=['First Name','Middle Name','Surname','Title','Age','Date of Birth','Address','Postcode','Telephone Number','Gender','Email Address','First Language','Nationality','Interest','Emergency Contact'];
const matchHeadings=['Marital status','Current medications','No. of dependents','Country of origin','Place of birth','Contact details of person in case of emergency','Middle initial'];
const matchQuestions=['Are you married, single or divorced?','Do you take any pills or medicine?','How many children do you have?','What country were you born in?','What city/town were you born in?','Who can we call in your family if you need help?','What is the first letter of your middle name?'];
const languageItems=[
 ['DOB','Date of Birth'],['No.','number'],['e.g.','for example'],['etc.','et cetera'],
 ['Mr','title used before a man’s name'],['Mrs','title used before a married woman’s name'],['Ms','title used before a woman’s name when marital status is unknown'],['Dr','Doctor'],
 ["Which form doesn't want lower-case letters?",'Form B'],['PLEASE USE CAPITAL LETTERS','write in capital letters'],['What should you avoid on Form B?','lower-case letters']
];
const vocabRows=[
 ['I like coming to the park no matter what the weather is like.','d'],
 ['Parents push their young children in prams.','b'],
 ["There’s a great view from the top of the hill.",'e'],
 ["We often come to the park when we’re in the area.",'a'],
 ["There’s a nice walkway round the park.",'f'],
 ['In the spring, there are beautiful flowers on the ground and blossom on the trees.','c']
];
const vocabDefs={a:'a region or part of a town',b:'it has four wheels and you move babies or small children in it',c:'flowers that grow on trees',d:"it isn't important and it doesn't change my decision",e:'what you can see around you',f:'another word for a path or small road only for people'};
const orderRows=['A man is cycling.','A woman is walking with her dog.','A student is jogging.','There’s a large house near the park.','Two people are walking down a path.','A student is doing pull-ups.','A tractor is cutting the grass.'];
const orderAnswers=['2','1','5','3','4','6','7'];
const noteRows=[
 ['Person 1','very often · every weekend after lunchtime','dogs for Jasmine · beautiful trees'],
 ['Person 2','every day · sunny days at lunch break','high up · beautiful view'],
 ['Person 3','when in the area','family memories · different seasons'],
 ['Person 4','every day','walk through the park · friends'],
 ['Person 5','about twice a week','jogging · exercise · quiet park'],
 ['Person 6','quite often','wild flowers · blossom · plants']
];

function submitHTML(label='Submit answers'){return `<div class="submit-row"><button id="submit" class="submit" type="button">${label}</button><span class="inline-submit-status" aria-live="polite"></span></div>`;}
function responseHTML(id='response',rows=6,placeholder='Type your answer here...'){return `<div class="response-shell"><textarea id="${id}" class="long-response student-answer" rows="${rows}" placeholder="${esc(placeholder)}"></textarea><div class="hint">Your response stays in this box.</div>${submitHTML()}</div>`;}
function photo(url,caption,alt='Photograph'){return `<div class="photo-card"><img src="${url}" alt="${esc(alt)}" onerror="this.src='https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=85'"><div class="photo-caption">${caption}</div></div>`;}
function video(src){return `<div class="video-frame"><video controls playsinline preload="metadata" data-local-park-video><source src="${src}" type="video/mp4"><p>Your browser cannot play this video.</p></video></div><div class="video-fallback">Lesson video · My local park</div>`;}
function cardQuestions(items){return `<div class="question-list">${items.map((q,i)=>`<div class="question"><b>${i+1}.</b> ${q}</div>`).join('')}</div>`;}

function renderNav(){nav.innerHTML=lesson.activities.map((a,i)=>`<button data-nav="${i}" class="${i===index?'active':''}"><span>${String(i+1).padStart(2,'0')}</span>${esc(a.stage)}</button>`).join('');$$('[data-nav]',nav).forEach(b=>b.onclick=()=>go(Number(b.dataset.nav)));}
function go(i){if(i<0||i>=lesson.activities.length)return;index=i;activeGroup=0;selectedChip=null;render();}

function formsIdentifyHTML(){return `<div class="forms-preview"><div class="mock-form"><h3>FORM A</h3>${['Title','First name','Middle initial','Surname','Address','Postcode','Gender','No. of dependents','Country of origin','First language','Current occupation','Do you smoke?','Current medications','Details of past surgery or operations'].map(x=>`<div class="form-line">${x}</div>`).join('')}<div class="identify-row"><input data-answer-index="0" class="student-answer" placeholder="Type the name of Form A..."></div></div><div class="mock-form visa"><h3>FORM B · PLEASE USE CAPITAL LETTERS</h3>${['Passport no.','Place of birth','Nationality','Marital status','Qualifications (degree, etc.)','Have you visited this country before?','Emergency contact'].map(x=>`<div class="form-line">${x}</div>`).join('')}<div class="identify-row"><input data-answer-index="1" class="student-answer" placeholder="Type the name of Form B..."></div></div></div>${submitHTML()}<div id="formElicitation" hidden style="margin-top:18px"><div class="card"><h3>Now connect the forms to your own experience</h3>${cardQuestions(['What kinds of forms do you sometimes fill in?','Think of a form you filled in. What information did you write?'])}</div></div>`;}
function dragMatchHTML(){return `<div class="drag-layout"><div class="card"><h3>Heading bank</h3><div class="bank">${matchHeadings.map((x,i)=>`<button type="button" draggable="true" class="drag-chip" data-chip="${i}" data-value="${esc(slug(x))}">${esc(x)}</button>`).join('')}</div></div><div class="card"><div class="drop-list">${matchQuestions.map((q,i)=>`<div><div class="drop-row"><div class="drop-question"><b>${i+1}.</b> ${esc(q)}</div><div class="dropzone" data-drop="${i}"><input data-answer-index="${i}" class="student-answer" readonly></div></div><div class="drop-help">Drop your answer here.</div></div>`).join('')}</div>${submitHTML()}</div></div>`;}
function groupedLanguageHTML(){const groups=[[0,4],[4,8],[8,11]],labels=['1–4','5–8','9–11'];const [a,b]=groups[activeGroup];return `<div class="card"><div class="group-tabs">${labels.map((x,i)=>`<button type="button" data-group="${i}" class="${i===activeGroup?'active':''}">${x}</button>`).join('')}</div><div class="form-language-list">${languageItems.slice(a,b).map((x,j)=>{const n=a+j;return `<div class="form-language-row"><b>${n+1}</b><span>${esc(x[0])}</span><input data-language-index="${n}" data-answer-index="${j}" class="student-answer" placeholder="Type your answer..."></div>`}).join('')}</div>${submitHTML()}</div>`;}
function formBuilderHTML(){return `<div class="form-builder"><div class="card label-bank"><h3>Information bank</h3><div class="bank">${formHeadings.map((x,i)=>`<button type="button" draggable="true" class="drag-chip" data-chip="${i}" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div><p class="drop-help" style="text-align:left;margin-top:12px">List the information you need, then prepare the form.</p></div><div><div class="student-form">${Array.from({length:10},(_,i)=>`<div class="form-field"><div class="form-title-drop dropzone" data-drop="${i}"><input class="label-value student-answer" readonly aria-label="Form heading ${i+1}"></div><input class="student-answer" placeholder="Example / instruction for this field..."></div>`).join('')}</div>${submitHTML('Submit your form')}</div></div>`;}
function peerReviewHTML(){return `<div class="grid-2"><div class="card"><h3>Exchange your form with another pair</h3><p>Read their form carefully. Use all three questions from Exercise 5.</p>${cardQuestions(['Is their form easy to fill in?','Do you know what to write in each part?','Would you change anything on the form?'])}</div><div class="card"><textarea id="peerReview" class="long-response student-answer" style="min-height:300px" placeholder="Write your review and suggestions here..."></textarea>${submitHTML('Submit peer review')}</div></div>`;}
function formHomeworkHTML(){return `<div class="homework-shell"><div class="card"><h3>Homework · Unit 1E</h3><p><b>Write a form for new students at VMMU.</b></p><p>Include clear headings and enough information for a new student to know what to write.</p><textarea id="formHomework" class="long-response student-answer" style="min-height:320px" placeholder="Draft your form here: headings, instructions and fields..."></textarea>${submitHTML('Submit Unit 1E homework')}</div><div class="rubric"><h3>Checklist</h3><div class="check-item">Clear headings</div><div class="check-item">Useful personal information</div><div class="check-item">Easy to fill in</div><div class="check-item">Appropriate form language</div></div></div>`;}
function dragVocabHTML(){return `<div class="drag-layout"><div class="card"><h3>Definitions a–f</h3><div class="bank">${Object.entries(vocabDefs).map(([k,v])=>`<button type="button" draggable="true" class="drag-chip" data-chip="${k}" data-value="${k}"><b>${k}.</b> ${esc(v)}</button>`).join('')}</div></div><div class="card"><div class="drop-list">${vocabRows.map((r,i)=>`<div><div class="drop-row"><div class="drop-question"><b>${i+1}.</b> ${esc(r[0])}</div><div class="dropzone" data-drop="${i}"><input data-answer-index="${i}" class="student-answer" readonly></div></div><div class="drop-help">Drop your answer here.</div></div>`).join('')}</div>${submitHTML()}</div></div>`;}
function videoOrderHTML(){return `<div class="video-task"><div>${video(localParkVideo)}</div><div class="scroll-panel"><h3>Number a–g in the order you see them</h3>${orderRows.map((x,i)=>`<div class="order-row"><b>${String.fromCharCode(97+i)}.</b><span>${esc(x)}</span><input data-answer-index="${i}" class="student-answer" inputmode="numeric" maxlength="1" placeholder="1–7"></div>`).join('')}${submitHTML()}</div></div>`;}
function videoNotesHTML(){return `<div class="video-task"><div>${video(localParkVideo)}</div><div class="scroll-panel"><h3>Pair work · split the table</h3><div class="review"><b>Student A:</b> complete column 1 (When / how often).<br><b>Student B:</b> complete column 2 (Why / detail).</div><div class="notes-grid">${noteRows.map((r,i)=>`<div class="note-row" data-note="${i}"><b>${r[0]}</b><input class="student-answer" data-note-col="when" placeholder="Column 1"><input class="student-answer" data-note-col="why" placeholder="Column 2"></div>`).join('')}</div>${submitHTML()}</div></div>`;}
function shareCheckHTML(){return `<div class="video-task"><div>${video(localParkVideo)}</div><div class="scroll-panel"><h3>Exercise 5 · Share and check</h3><div class="question-list"><div class="question"><b>1.</b> Share your notes with your partner.</div><div class="question"><b>2.</b> Complete the other column.</div><div class="question"><b>3.</b> Watch the video again and check all your answers.</div></div><textarea id="noteCorrections" class="long-response student-answer" style="min-height:180px;margin-top:12px" placeholder="Write any corrections or missing details here..."></textarea>${submitHTML('Submit checked notes')}</div></div>`;}
function rolePlayHTML(swap=false){return `<div class="grid-2"><div class="role-card"><h3>${swap?'Student B → A role':'Student A'}</h3><p>Choose one person in the video but don’t tell your partner.</p><textarea class="student-answer" id="roleA" placeholder="Notes for the chosen person..."></textarea></div><div class="role-card"><h3>${swap?'Student A → B role':'Student B'}</h3><p>Ask:</p><div class="question">When do you come to the park?</div><div class="question">How often do you come?</div><p>Listen and guess which person your partner chose.</p><textarea class="student-answer" id="roleB" placeholder="Your guess and evidence..."></textarea></div></div>${submitHTML(swap?'Submit second-round notes':'Submit pair notes')}`;}
function homeworkHTML(){const deadline='8:00 p.m. · 12 Oct 2026';return `<div class="homework-shell"><div class="card"><div class="deadline">Deadline: ${deadline}</div><h3>Write a short paragraph to describe a person you admire.</h3><textarea id="homeworkText" class="student-answer" placeholder="Write your paragraph here..."></textarea>${submitHTML('Submit homework')}<div id="homeworkApiStatus" class="status" style="text-align:left;margin-top:9px"></div></div><div class="rubric"><h3>Writing marking · 10 points</h3><div class="rubric-grid"><span>Task achievement</span><b>2</b><span>Organisation</span><b>2</b><span>Vocabulary</span><b>2</b><span>Grammar</span><b>2</b><span>Style</span><b>2</b></div>${isTeacher?`<div class="teacher-homework-actions"><button id="assignHomework" class="primary" type="button">Assign homework</button><button id="openSubmissions" type="button">Open submissions</button><button id="exportHomework" type="button">Export class CSV</button></div>`:''}</div></div>`;}

function screenHTML(a){switch(a.id){
case's01':return `<div class="cover"><div class="cover-copy"><div class="big-unit">UNIT <span class="orange">1</span></div><p><span class="orange">1E</span> · PERSONAL INFORMATION<br><span class="orange">1F</span> · MY LOCAL PARK</p><div class="deadline">Life A2–B1</div></div>${photo(parkImg,'Unit 1 · Lifestyle · Life A2–B1','Park landscape')}</div>`;
case's02':return `<div class="grid-3"><div class="card aim-card"><h3>Knowledge</h3><ul><li>Personal-information vocabulary and collocations</li><li>Main ideas and details</li><li>Accurate form completion</li></ul></div><div class="card aim-card"><h3>Skills</h3><ul><li>Fill in forms correctly</li><li>Use collocations in speaking and writing</li><li>Produce a short self-introduction</li></ul></div><div class="card aim-card"><h3>Attitudes</h3><ul><li>Participate actively</li><li>Share personal views confidently</li></ul></div></div>`;
case's03':return `<div class="card"><h2>Previous lesson: health problems</h2><p class="question">Describe one health problem you have had or are suffering from.</p>${responseHTML('healthResponse',7,'Type a full answer here...')}</div>`;
case's04':return `<div class="cover"><div class="cover-copy"><div class="unit-code">UNIT 1E</div><p>PERSONAL<br><span class="orange">INFORMATION</span></p></div>${photo('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=85','Personal information · forms · accurate details','Forms')}</div>`;
case's06':return formsIdentifyHTML();
case's05':return `<div class="grid-2"><div class="card">${cardQuestions(['What kinds of forms do you sometimes fill in?','Think of a form you filled in. What information did you write?'])}</div><div class="card discussion-box"><textarea id="formDiscussion" class="student-answer" placeholder="Type one short response here..."></textarea>${submitHTML()}</div></div>`;
case's07':return dragMatchHTML();
case's08':return groupedLanguageHTML();
case's10':return formBuilderHTML();
case's10p':return peerReviewHTML();
case's10h':return formHomeworkHTML();
case's11':return `<div class="park-cover"><div><div class="unit-code">UNIT 1F</div><h2>MY LOCAL PARK</h2><p style="font-size:22px;font-weight:800">Video · vocabulary · speaking</p></div>${photo(parkImg,'Park Güell · Barcelona','Park Güell')}</div>`;
case's12':return `<div class="grid-2">${photo(parkImg,'Park Güell, in Barcelona, is famous for its art and a great place to meet friends.','Park Güell')}<div class="card"><h3>Before you watch</h3>${cardQuestions(['Where is your nearest park?','Why do people like going there?'])}${responseHTML('parkLeadIn',4,'Write brief ideas here...')}</div></div>`;
case's13':return dragVocabHTML();
case's14':return videoOrderHTML();
case's15':return videoNotesHTML();
case's15p':return shareCheckHTML();
case's16':return rolePlayHTML(false);
case's16r':return rolePlayHTML(true);
case's17':return `<div class="card"><h3>Think of a role model in your life or for other people</h3>${cardQuestions(['Who is this person?','Is the person in your family, in sport or on TV?','Why is he or she a role model?'])}<textarea id="roleModel" class="long-response student-answer" placeholder="Make notes here..."></textarea>${submitHTML()}</div>`;
case's18':return `<div class="checklist"><div class="check-item"><b>Vocabulary</b><br>personal details · path · blossom · pram · view · walkway</div><div class="check-item"><b>Grammar</b><br>Wh-questions for personal information</div><div class="check-item"><b>Listening</b><br>specific details and places in nature</div><div class="check-item"><b>Writing</b><br>filling in forms and giving personal details</div><div class="check-item"><b>Speaking</b><br>your local area or favourite park</div><div class="check-item"><b>Reflection</b><br>What do you still want to practise?</div></div>`;
case's19':return homeworkHTML();
case's20':return `<div class="end-screen"><div><h2>UNIT 1E & 1F<br>COMPLETE</h2><p>Personal Information · My Local Park</p></div>${photo(parkImg,'Life A2–B1 · Unit 1 Lifestyle','Park')}</div>`;
default:return '<div class="card">Screen unavailable.</div>';}}

function wireDragDrop(){const chips=$$('.drag-chip',content),drops=$$('.dropzone',content);chips.forEach(ch=>{ch.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',ch.dataset.value||ch.textContent.trim());e.dataTransfer.setData('chip-id',ch.dataset.chip||'');});ch.onclick=()=>{chips.forEach(x=>x.classList.remove('selected'));selectedChip=ch;ch.classList.add('selected');status.textContent='Answer selected. Click the target box.';};});drops.forEach(d=>{d.addEventListener('dragover',e=>e.preventDefault());d.addEventListener('drop',e=>{e.preventDefault();place(d,e.dataTransfer.getData('text/plain'),e.dataTransfer.getData('chip-id'));});d.onclick=()=>{if(selectedChip)place(d,selectedChip.dataset.value||selectedChip.textContent.trim(),selectedChip.dataset.chip||'');};});function place(d,val,chipId){const input=$('input',d);if(!input)return;input.value=val;d.classList.add('filled');const chip=chips.find(x=>String(x.dataset.chip)===String(chipId));if(chip)chip.classList.add('used');selectedChip=null;status.textContent='';}}
function wireGroups(){$$('[data-group]',content).forEach(b=>b.onclick=()=>{activeGroup=Number(b.dataset.group);content.innerHTML=screenHTML(lesson.activities[index]);wireCurrent();});}
function collect(){return $$('.student-answer',content).map((el,i)=>({name:el.id||el.dataset.answerIndex||el.dataset.languageIndex||i,value:el.value}));}
function showInlineSubmit(msg,cls='success'){const el=$('.inline-submit-status',content);if(el){el.textContent=msg;el.className='inline-submit-status '+cls;}status.textContent=msg;}
function submitCurrent(){const a=lesson.activities[index],vals=collect();if(vals.length&&!vals.some(x=>String(x.value||'').trim())){showInlineSubmit('Add an answer before submitting.','error');return;}showInlineSubmit('Submitted ✓');if(a.id==='s19')submitHomeworkApi();}
function reveal(){const a=lesson.activities[index];if(!isTeacher){status.textContent='Show answer is available to Teacher / Presentation only.';return;}
 if(a.id==='s06'){const ins=$$('input[data-answer-index]',content);['medical form','visa application form'].forEach((v,i)=>{if(ins[i]){ins[i].value=v;ins[i].classList.add('note-answer');}});const q=$('#formElicitation');if(q)q.hidden=false;}
 else if(a.id==='s07'){$$('input[data-answer-index]',content).forEach((inp,i)=>{inp.value=slug(matchHeadings[i]);inp.closest('.dropzone')?.classList.add('filled');});}
 else if(a.id==='s08'){$$('input[data-language-index]',content).forEach(inp=>{const i=Number(inp.dataset.languageIndex);inp.value=languageItems[i][1];inp.classList.add('note-answer');});}
 else if(a.id==='s13'){$$('input[data-answer-index]',content).forEach((inp,i)=>{inp.value=vocabRows[i][1];inp.closest('.dropzone')?.classList.add('filled');});}
 else if(a.id==='s14'){$$('input[data-answer-index]',content).forEach((inp,i)=>{inp.value=orderAnswers[i];inp.closest('.order-row')?.classList.add('answer');});}
 else if(a.id==='s15'){$$('.note-row',content).forEach((row,i)=>{const inputs=$$('input',row);if(inputs[0]){inputs[0].value=noteRows[i][1];inputs[0].classList.add('note-answer');}if(inputs[1]){inputs[1].value=noteRows[i][2];inputs[1].classList.add('note-answer');}});}
 else{status.textContent='Open-response activity: discuss student responses rather than replacing them with one fixed answer.';return;}status.textContent='Answers revealed in place.';}
function reset(){content.innerHTML=screenHTML(lesson.activities[index]);status.textContent='';wireCurrent();}

async function assignHomework(){const classId=params.get('classId'),box=$('#homeworkApiStatus');if(!classId){box.textContent='Open this lesson from a Live Class so classId is available.';box.className='status error';return;}const task=lesson.activities.find(x=>x.id==='s19');box.textContent='Creating assignment…';try{const r=await fetch('/api/research/assignments',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({classId,resourceId:lesson.resourceId,activityId:'s19',title:'Life Unit 1E–1F Homework',prompt:task?.prompt||'',rubricId:'writing-core-v1',deadline:lesson.deadline,attemptLimit:1,latePolicy:'allow-late',status:'active'})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Assignment could not be created');box.textContent='Homework assigned ✓ · Deadline 8:00 p.m. 12 Oct 2026';box.className='status success';}catch(e){box.textContent=e.message;box.className='status error';}}
async function findHomeworkAssignment(){try{const r=await fetch('/api/research/assignments',{credentials:'same-origin'});if(!r.ok)return null;const d=await r.json();return (d.assignments||[]).find(x=>x.resource_id===lesson.resourceId&&x.activity_id==='s19'&&x.status==='active')||null;}catch{return null;}}
async function submitHomeworkApi(){if(role!=='student')return;const box=$('#homeworkApiStatus'),text=$('#homeworkText')?.value.trim();if(!text)return;const a=await findHomeworkAssignment();if(!a){if(box)box.textContent='Submitted to Responses. No active homework assignment is linked yet.';return;}try{const r=await fetch('/api/research/submissions',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignmentId:a.assignment_id,response:{text},researchConsent:false})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Homework submission failed');if(box){box.textContent='Homework submitted ✓';box.className='status success';}}catch(e){if(box){box.textContent=e.message;box.className='status error';}}}
function openSubmissions(){const code=params.get('joinCode')||params.get('code')||'';const u=new URL('/teacher-live.html',location.origin);if(params.get('classId'))u.searchParams.set('classId',params.get('classId'));u.searchParams.set('lesson',lesson.resourceId);if(code)u.searchParams.set('code',code);window.open(u,'_blank');}
function exportHomework(){const classId=params.get('classId');if(!classId){status.textContent='Open from a Live Class to export this class.';return;}location.href=`/api/research/export?kind=submissions&classId=${encodeURIComponent(classId)}&format=csv`;}
function wireMedia(){$$('video,audio',content).forEach(m=>{m.addEventListener('error',()=>{status.textContent='Media source is unavailable on this deployment.';});});}
function wireCurrent(){wireDragDrop();wireGroups();wireMedia();$('#submit',content)?.addEventListener('click',submitCurrent);$('#assignHomework',content)?.addEventListener('click',assignHomework);$('#openSubmissions',content)?.addEventListener('click',openSubmissions);$('#exportHomework',content)?.addEventListener('click',exportHomework);$('#showAnswerBtn').hidden=!isTeacher;$('#responsesBtn').hidden=!isTeacher;}
function render(){const a=lesson.activities[index];document.body.dataset.screen=String(index+1);stageLabel.textContent=a.stage;title.textContent=a.title;instruction.textContent=instructions[a.id]||'';counter.textContent=`${index+1} / ${lesson.activities.length}`;content.innerHTML=screenHTML(a);$('#prev').disabled=index===0;$('#next').disabled=index===lesson.activities.length-1;status.textContent='';renderNav();wireCurrent();window.dispatchEvent(new CustomEvent('e-leap:screen-changed',{detail:{screen:index+1,activityId:a.id}}));}

$('#prev').onclick=()=>go(index-1);$('#next').onclick=()=>go(index+1);$('#showAnswerBtn').onclick=reveal;$('#resetBtn').onclick=reset;$('#responsesBtn').onclick=()=>openSubmissions();$('#roleBadge').textContent=isTeacher?(params.get('eleapMode')==='presentation'?'Presentation':'Teacher'):'Student';
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;const type=String(e.data?.type||'').toLowerCase();const action=String(e.data?.action||e.data?.command||'').toLowerCase();if(type.includes('show-answer')||action==='show-answer'||action==='showanswer')reveal();if(type.includes('reset')||action==='reset')reset();});
render();
})();
