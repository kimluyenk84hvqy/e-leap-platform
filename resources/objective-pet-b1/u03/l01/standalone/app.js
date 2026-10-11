
const LESSON = {
 screens: [
  ["hero","Opening","Unit 3 · What’s your job?","hero"],
  ["aims","Aims","Aims of the Lesson","aims"],
  ["s02","02","Who is working here?","warmup"],
  ["s03","03","Explore the Jobs","jobs"],
  ["s04","04","Notice the Difference","notice"],
  ["s05","05","At the Shopping Mall","listening"],
  ["s06","06","Grammar Discovery","discovery"],
  ["s07","07","Usually or Right Now?","video"],
  ["s08","08","Build the Tense Model","tenseBuild"],
  ["s09","09","Present Simple vs Present Continuous","tenseFocus"],
  ["s10","10","Shopping Mall Practice","controlled"],
  ["s11","11","Sonia: Two Lives","soniaSort"],
  ["s12","12","Speak about Sonia","soniaSpeak"],
  ["s13","13","Sonia & Granny","soniaDialogue"],
  ["s14","14","Action or State?","stateElicit"],
  ["s15","15","Before the Rule","stateCategorise"],
  ["s16","16","Build the State-Verb Model","stateBuild"],
  ["s17","17","State Verbs · Focus Mode","stateFocus"],
  ["s18","18","Error Doctor","errorDoctor"],
  ["s19","19","Professional Transfer","professional"],
  ["s20","20","Exit Ticket","exit"],
  ["thanks","End","Thank You","thanks"]
 ],
 jobs:["shop assistant","flight attendant","salesman","mechanic","website designer","hairdresser","engineer"],
 jobImgs:[
  "u3l31_job_a_shop_assistant.png","u3l31_job_b_flight_attendant.png","u3l31_job_c_salesman.png",
  "u3l31_job_d_mechanic.png","u3l31_job_e_website_designer.png","u3l31_job_f_hairdresser.png","u3l31_job_g_engineer.png"
 ]
};

const params=new URLSearchParams(location.search); 
const OFFLINE_PACKAGE = false;

const BOOK = {
 introSpeakerAnswers:["3","2","1","6","5","7","4"],
 introJobs:["shop assistant","flight attendant","salesperson","mechanic","website designer","hairdresser","engineer"],
 introActions:[
  "The shop assistant is tidying some clothes.",
  "The flight attendant is bringing the pilots some food.",
  "The salesperson is working at his computer.",
  "The mechanic is having a break.",
  "The website designer is plugging in her computer.",
  "The hairdresser is holding a mirror.",
  "The engineer is looking at a plan."
 ],
 listeningPossible:["artist","bank guard","journalist","shopper / traveller","security officer","photographer","model","police officer"],
 listeningJobs:["artist","photographer","model","journalist","bank guard"]
};

const JOB_HD=[
 "job_hd_a_shop_assistant.webp","job_hd_b_flight_attendant.webp","job_hd_c_salesperson.webp",
 "job_hd_d_mechanic.webp","job_hd_e_website_designer.webp","job_hd_f_hairdresser.webp","job_hd_g_engineer.webp"
];

let current=0, role=(params.get("role")||"teacher"), timerInt=null, timerSecs=120;
const state={};
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const stage=$("#stage");

function img(n){return `assets/images/${n}`}
function audio(n){return `assets/audio/${n}`}
function save(key,val){localStorage.setItem(`u3l31_${key}`,JSON.stringify(val))}
function load(key,def=[]){try{return JSON.parse(localStorage.getItem(`u3l31_${key}`))||def}catch{return def}}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function head(id,title,subtitle,anchor="",bookRef=""){
 return `<div class="screen-head"><div><div class="kicker">UNIT 3.1 · ${id.toUpperCase()}${bookRef?` · ${bookRef}`:""}</div><h2>${title}</h2><p>${subtitle}</p></div>${anchor?`<div class="anchor">${anchor}</div>`:""}</div>`;
}
function audioBox(src,label){
 return `<div class="audio-box"><strong>${label}</strong><audio controls preload="metadata" src="${audio(src)}"></audio></div>`;
}
function tabs(id,names){
 return `<div class="tabs" data-tabs="${id}">${names.map((n,i)=>`<button class="${i===0?'active':''}" data-tab="${i}">${n}</button>`).join("")}</div>`;
}
function tabPanels(id,htmls){
 return htmls.map((h,i)=>`<div class="tab-panel ${i===0?'active':''}" data-tab-panel="${id}-${i}">${h}</div>`).join("");
}
function controls(activity, opts={closed:true, open:false, show:true, score:true}){
 const byRole={
  student:["check","reset","submit","score"],
  teacher:["check","reset","show","presentation","timer","responses","live"],
  admin:["check","reset","show","presentation","timer","responses","live","studio"],
  guest:["check","reset","score"],
  presentation:["show","reset","exitPresentation"]
 };
 let acts=byRole[role]||byRole.student;
 if(!opts.closed) acts=acts.filter(a=>!["check","score"].includes(a));
 if(!opts.show) acts=acts.filter(a=>a!=="show");
 if(!opts.score) acts=acts.filter(a=>a!=="score");
 return `<div class="controls" data-controls="${activity}">${acts.map(a=>{
  const label={check:"Check",reset:"Reset",submit:"Submit",score:"Score",show:"Show answer",presentation:"Presentation",timer:"Timer",responses:"Responses",live:"Live Class / QR",studio:"Edit in Studio",exitPresentation:"Exit Presentation"}[a];
  return `<button data-action="${a}" class="${a==='submit'?'coral':''}">${label}</button>`;
 }).join("")}</div><div id="${activity}Status" class="status"></div><div id="${activity}Responses" class="responses hidden"></div>`;
}

function renderHero(){
 const isStudentJoin=params.get("role")==="student";
 return `<section class="screen">
  <div class="hero hero-clean-cover">
   <img class="hero-img" src="${img("hero_mall.webp")}" alt="Modern shopping mall">
   <div class="hero-overlay"></div>
   <div class="hero-copy">
    <span class="unit">UNIT 3.1</span>
    <h2>What’s your job?</h2>
    <p class="sub">Jobs · Present time · Meaning in context</p>
    <p>From what people usually do to what they are doing right now.</p>
    <div class="hero-tools hero-tools-bottom">
      <button class="hero-tool" data-hero-action="qr">⌁ Live Class / QR</button>
      <button class="hero-tool" data-hero-action="responses">▤ Responses</button>
      <button class="hero-tool" data-hero-action="timer">◷ Timer</button>
      <button class="hero-tool" data-hero-action="layout">▣ Layout</button>
      <button class="hero-tool" data-hero-action="presentation">▰ Presentation</button>
    </div>
   </div>
   ${isStudentJoin ? `<aside class="student-join-float"><div class="join-icon">✓</div><h3>Join Unit 3.1</h3><p>Enter your name to continue on your device.</p><div class="join-name"><label>Your name</label><input id="studentName" placeholder="Enter your name"></div><button id="studentReady" class="primary wide">Enter Lesson</button></aside>` : ``}
  </div>
 </section>`;
}
function renderAims(){
 return `<section class="screen aims-screen">
   <div class="aims-native">
     <div class="aims-topline"><span>UNIT 3.1</span><h1>Aims of the Lesson</h1></div>
     <div class="aims-grid">
       <article class="aim-card knowledge">
         <div class="aim-card-head"><span class="aim-icon">◉</span><h2>KNOWLEDGE</h2></div>
         <p class="aim-intro">By the end of the lesson, learners will be able to:</p>
         <div class="aim-item"><b>1</b><p><strong>Distinguish</strong> the meanings and uses of the Present Simple and Present Continuous.</p></div>
         <div class="aim-item"><b>2</b><p><strong>Identify</strong> common state verbs and their typical use.</p></div>
         <div class="aim-item"><b>3</b><p><strong>Recognise</strong> key job-related vocabulary in workplace contexts.</p></div>
       </article>
       <article class="aim-card skills">
         <div class="aim-card-head"><span class="aim-icon">⚙</span><h2>SKILLS</h2></div>
         <p class="aim-intro">By the end of the lesson, learners will be able to:</p>
         <div class="aim-item"><b>1</b><p><strong>Listen for and identify</strong> specific information about jobs and current activities.</p></div>
         <div class="aim-item"><b>2</b><p><strong>Select and justify</strong> the appropriate tense according to meaning and context.</p></div>
         <div class="aim-item"><b>3</b><p><strong>Describe and compare</strong> routines, temporary situations, and actions happening now.</p></div>
       </article>
       <article class="aim-card attitude">
         <div class="aim-card-head"><span class="aim-icon">★</span><h2>ATTITUDE</h2></div>
         <p class="aim-intro">By the end of the lesson, learners will be able to:</p>
         <div class="aim-item"><b>1</b><p><strong>Participate actively</strong> in pair and class activities.</p></div>
         <div class="aim-item"><b>2</b><p><strong>Show willingness</strong> to explain, revise, and improve answers after discussion.</p></div>
         <div class="aim-item"><b>3</b><p><strong>Build confidence</strong> in using English for familiar and professional situations.</p></div>
       </article>
     </div>
   </div>
 </section>`;
}
function renderWarmup(){
 return `<section class="screen">${head("Screen 02","Who is working here?","LOOK → THINK → EXPLAIN","EVIDENCE BEFORE ANSWER")}
 <div class="warm-layout">
  <div class="card photo-card"><img src="${img("warmup_mall.webp")}" alt="Workers in a shopping mall"></div>
  <div class="card prompt-card">
   <h3>1. Identify the jobs</h3><p>Write 1–3 jobs you can see.</p>
   <input class="input-line warm-job" placeholder="1."><input class="input-line warm-job" placeholder="2."><input class="input-line warm-job" placeholder="3.">
   <h3 style="margin-top:22px">2. Give evidence</h3><p>Choose one person and explain:</p><div class="stem">I think he/she is a … because …</div>
   <textarea id="warmEvidence" class="textarea" placeholder="Your evidence..."></textarea>
   ${controls("warm",{closed:false,show:false,score:false})}
  </div>
 </div></section>`;
}
function jobPhotoCard(i,mode){
 const letters=["a","b","c","d","e","f","g"];
 const base=`<img src="${img(JOB_HD[i])}" alt="${BOOK.introJobs[i]}"><span class="photo-letter">${letters[i]}</span>`;
 if(mode==="speaker"){
  return `<article class="job-show-card">${base}<div class="answer-slot dropzone" data-zone="jobsp-${i}" data-answer="${BOOK.introSpeakerAnswers[i]}" tabindex="0"></div></article>`;
 }
 if(mode==="job"){
  return `<article class="job-show-card">${base}<div class="answer-slot dropzone" data-zone="jobname-${i}" data-answer="${BOOK.introJobs[i]}" tabindex="0"></div></article>`;
 }
 if(mode==="action"){
  return `<article class="job-show-card action-card">${base}<textarea class="job-action-input" data-job-action="${i}" data-answer="${BOOK.introActions[i]}" placeholder="Type a full sentence..."></textarea></article>`;
 }
}
function jobGrid(mode){return `<div class="jobs-showcase-grid">${[0,1,2,3,4,5,6].map(i=>jobPhotoCard(i,mode)).join("")}</div>`;}
function renderJobs(){
 const speakers=[1,2,3,4,5,6,7].map(n=>`<div class="chip neutral-chip" draggable="true" data-id="speaker-${n}" data-target="${n}">Speaker ${n}</div>`).join("");
 const jobShuffle=[3,1,6,0,5,4,2]; const jobs=jobShuffle.map(i=>{const j=BOOK.introJobs[i];return `<div class="chip neutral-chip" draggable="true" data-id="jobword-${i}" data-target="${j}">${j}</div>`}).join("");
 return `<section class="screen">${head("Screen 03","Explore the Jobs","Keep the same seven photos while the task changes.","SOURCE p.22 · INTRODUCTION")}
 ${tabs("jobs",["1 · Listen & Match","2 · Name the Jobs","3 · What are they doing?","4 · Your choice"])}
 ${tabPanels("jobs",[
  `<div class="activity-banner"><b>Introduction · Activity 1</b><span>Listen to seven people talking about their jobs. Match the speakers to the photographs.</span></div>
   ${audioBox("intro_jobs.mp3","Audio 1.10")}
   <div class="jobs-task-layout"><div>${jobGrid("speaker")}</div><aside class="word-bank-panel"><h3>Speaker bank</h3><div class="job-word-bank">${speakers}</div></aside></div>
   ${controls("intro1")}`,
  `<div class="activity-banner"><b>Introduction · Activity 2</b><span>What do the people do? Write / match the names of their jobs.</span></div>
   <div class="jobs-task-layout"><div>${jobGrid("job")}</div><aside class="word-bank-panel"><h3>Word bank</h3><div class="job-word-bank">${jobs}</div></aside></div>
   ${controls("intro2")}`,
  `<div class="activity-banner"><b>Introduction · Activity 3</b><span>Look at the photographs again. What are the people doing?</span></div>
   ${jobGrid("action")}
   ${controls("intro3")}`,
  `<div class="activity-banner"><b>Introduction · Activity 4</b><span>Would you like to do any of these jobs? Why / Why not?</span></div>
   <div class="card your-choice-card"><h3>Your choice</h3><textarea id="jobChoice" class="textarea" placeholder="I would / wouldn’t like to be a ... because ..."></textarea></div>
   ${controls("intro4",{closed:false,show:false,score:false})}`
 ])}</section>`;
}
function renderNotice(){
 const items=[
  ["A photographer sells photographs to magazines.","usual"],
  ["The photographer is taking a photograph of the model.","now"],
  ["The thief steals things from shops.","usual"],
  ["The thief is pulling a shopping bag on wheels.","now"],
  ["The artist sells her pictures to the children’s parents.","usual"],
  ["The journalist is writing something in his notebook.","now"]
 ];
 return `<section class="screen">${head("Screen 04","Notice the Difference","Sort by meaning before naming the tense.","WHAT THEY DO ↔ WHAT THEY’RE DOING NOW")}
 <div class="sort-zones"><div class="zone"><h3>What they usually do</h3><div class="dropzone" data-zone="usual"></div></div><div class="zone blue"><h3>What they are doing now</h3><div class="dropzone" data-zone="now"></div></div></div>
 <div class="bank" id="noticeBank">${items.map((x,i)=>`<div class="chip" draggable="true" data-id="n${i}" data-answer="${x[1]}">${x[0]}</div>`).join("")}</div>
 ${controls("notice")}</section>`;
}
function renderListening(){
 const predictionChips=BOOK.listeningPossible.map((j,i)=>`<button class="prediction-chip" data-predict="${j}">${j}</button>`).join("");
 return `<section class="screen">${head("Screen 05","At the Shopping Mall","Follow the three Listening activities in the coursebook.","SOURCE p.23 · LISTENING")}
 <div class="mall-grid"><div class="card"><img class="source-img" src="${img("u3l31_img_mall_scene.webp")}" alt="Shopping mall source picture"></div>
 <div>
  ${tabs("mall",["1 · Guess the jobs","2 · Listen","3 · Listen again"])}
  ${tabPanels("mall",[
   `<div class="card"><div class="activity-banner"><b>Listening · Activity 1</b><span>Look at this picture. Can you guess what the people’s jobs are?</span></div>
    <p class="support-prompt">Choose any jobs you think you can see. This is a prediction task, so more than one answer is possible.</p>
    <div class="prediction-bank">${predictionChips}</div>
    <textarea id="mallPredict" class="textarea compact-textarea" placeholder="Optional: add another idea or explain your choice."></textarea>
    ${controls("listening1",{closed:false,show:false,score:false})}</div>`,
   `<div class="card"><div class="activity-banner"><b>Listening · Activity 2</b><span>Listen to the man talking on the phone.</span></div>
    ${audioBox("shopping_mall.mp3","Audio 1.11")}
    <div class="two-answer-grid"><label><b>What is his job?</b><input id="mallMan" class="input-line" data-answer="security officer" placeholder="Type the job"></label>
    <label><b>Who is he talking to?</b><input id="mallTo" class="input-line" data-answer="police officer" placeholder="Type the person"></label></div>
    ${controls("listening2")}</div>`,
   `<div class="card"><div class="activity-banner"><b>Listening · Activity 3</b><span>Listen again. Five of them have jobs. Write the names of their jobs.</span></div>
    ${audioBox("shopping_mall.mp3","Audio 1.11")}
    <div class="five-answer-grid">${BOOK.listeningJobs.map((a,i)=>`<label><span>${i+1}</span><input class="input-line mall-job" data-answer="${a}" placeholder="Job ${i+1}"></label>`).join("")}</div>
    ${controls("listening3")}</div>`
  ])}
 </div></div></section>`;
}
function renderDiscovery(){
 return `<section class="screen">${head("Screen 06","Grammar Spot","Use the two book examples to notice the meaning before building the rule.","SOURCE p.23 · GRAMMAR SPOT")}
 <div class="purpose-strip"><b>Why are these two sentences here?</b><span>They give one example of a usual job and one example of an action happening now.</span></div>
 <div class="discovery-row">
  <div class="quote simple"><span class="quote-label">Example A</span>I design websites.</div>
  <div class="quote cont"><span class="quote-label">Example B</span>I’m plugging in my computer.</div>
 </div>
 <div class="card grammar-rule-card">
  <h3>Complete the meaning rule</h3>
  <div class="rule-question"><span>1. We use the</span><select data-answer="present simple"><option value="">Choose</option><option>present simple</option><option>present continuous</option></select><span>to talk about what we usually do.</span></div>
  <div class="rule-question"><span>2. We use the</span><select data-answer="present continuous"><option value="">Choose</option><option>present simple</option><option>present continuous</option></select><span>to talk about what we’re doing now.</span></div>
  <div class="micro-check"><b>Quick pair check:</b> Which example is “usual” and which is “now”? Point to A or B and give one reason.</div>
 </div>${controls("grammarSpot")}</section>`;
}
function renderVideo(){
 const media=OFFLINE_PACKAGE
   ? `<video class="offline-video" controls preload="metadata"><source src="assets/video/present_simple_vs_continuous.mp4" type="video/mp4"></video>`
   : `<div id="videoHosted" class="player"><iframe src="https://www.youtube.com/embed/IL9ImXyvL-E?rel=0&modestbranding=1" title="Present Simple vs Present Continuous" allowfullscreen></iframe></div>`;
 return `<section class="screen">${head("Screen 07","Watch and Confirm","Use the video only to confirm the rule learners have just discovered.","VIDEO CHECK · EXTENSION")}
 <div class="video-flow">
  <div class="video-step"><span>1</span><div><b>Predict</b><p>Present Simple = usual. Present Continuous = now. Is that your rule?</p></div></div>
  <div class="video-step"><span>2</span><div><b>Watch</b><p>Listen for examples that confirm or change your rule.</p></div></div>
  <div class="video-step"><span>3</span><div><b>Check</b><p>After watching, choose Yes / Partly / No and revise one idea if necessary.</p></div></div>
 </div>
 <div class="card video-card">${media}${OFFLINE_PACKAGE?`<p class="note">Offline licensed copy supplied by the course owner.</p>`:`<p class="note">Online version uses the source YouTube video and does not rehost it.</p>`}</div>
 <div class="card post-video-card"><h3>Did the video confirm your rule?</h3><div class="choice-row" data-q="videoPoll"><button data-v="Yes">Yes</button><button data-v="Partly">Partly</button><button data-v="No">No</button></div><textarea id="videoReflection" class="textarea compact-textarea" placeholder="One thing I would keep / change is ..."></textarea></div>
 ${controls("videoCheck",{closed:false,show:false,score:false})}</section>`;
}
const tenseItems=[
 ["psm","habits, facts and routines","simple-meaning"],
 ["psf","S + V(s/es)","simple-form"],
 ["pst","usually · often · every day","simple-time"],
 ["pse","A photographer sells photographs.","simple-example"],
 ["pcm","actions happening now / around now / temporary situations","cont-meaning"],
 ["pcf","S + am/is/are + V-ing","cont-form"],
 ["pct","now · at the moment · this week","cont-time"],
 ["pce","The photographer is taking a photograph.","cont-example"]
];
function renderTenseBuild(){
 return `<section class="screen">${head("Screen 08","Present Simple vs Present Continuous","Drag the key ideas into the correct places. Then submit your model.","BUILD THE MODEL · GOLDEN LAYOUT")}
 <div class="model-grid tense-grid signature-model">
  <article class="model-panel simple"><h3>Present Simple</h3>
   <div class="drop-row"><span>Meaning / Use</span><div class="dropzone" data-zone="simple-meaning"></div></div>
   <div class="drop-row"><span>Form</span><div class="dropzone" data-zone="simple-form"></div></div>
   <div class="drop-row"><span>Time clues</span><div class="dropzone" data-zone="simple-time"></div></div>
   <div class="drop-row"><span>Example</span><div class="dropzone" data-zone="simple-example"></div></div>
  </article>
  <article class="model-panel cont"><h3>Present Continuous</h3>
   <div class="drop-row"><span>Meaning / Use</span><div class="dropzone" data-zone="cont-meaning"></div></div>
   <div class="drop-row"><span>Form</span><div class="dropzone" data-zone="cont-form"></div></div>
   <div class="drop-row"><span>Time clues</span><div class="dropzone" data-zone="cont-time"></div></div>
   <div class="drop-row"><span>Example</span><div class="dropzone" data-zone="cont-example"></div></div>
  </article>
 </div>
 <div class="bank-wrap"><div class="bank-title">DRAG LABELS</div><div id="tenseBank" class="bank signature-bank">${tenseItems.map(x=>`<div class="chip neutral-chip" draggable="true" data-id="${x[0]}" data-answer="${x[2]}">${x[1]}</div>`).join("")}</div></div>
 <div class="teacher-prompt"><b>Teaching flow:</b> learners build → Submit → Responses → discuss one disagreement → Show answer box by box.</div>${controls("tenseBuild")}</section>`;
}
function renderTenseFocus(){
 return `<section class="screen">${head("Screen 09","Present Simple vs Present Continuous","Final editorial model after discussion.","MEANING FIRST. TENSE SECOND.")}
 <div class="card focus-model">
  <div class="row"><div></div><div class="cell ps" style="font-weight:900;font-size:24px">Present Simple</div><div class="cell pc" style="font-weight:900;font-size:24px">Present Continuous</div></div>
  <div class="row"><div class="cell label">Meaning / Use</div><div class="cell ps">habits, facts and routines</div><div class="cell pc">actions happening now / around now; temporary situations</div></div>
  <div class="row"><div class="cell label">Form</div><div class="cell ps">S + V(s/es)</div><div class="cell pc">S + am/is/are + V-ing</div></div>
  <div class="row"><div class="cell label">Time clues</div><div class="cell ps">usually · often · every day</div><div class="cell pc">now · at the moment · this week</div></div>
  <div class="row"><div class="cell label">Example</div><div class="cell ps">A photographer sells photographs.</div><div class="cell pc">The photographer is taking a photograph.</div></div>
 </div>${controls("tenseFocus",{closed:false,show:false,score:false})}</section>`;
}
const practice=[
 ["The security officer ___ to a police officer.","is talking"],
 ["The model ___ (stand) by a fountain.","is standing"],
 ["The photographer ___ (sell) his photographs to magazines.","sells"],
 ["The thief ___ (pull) a shopping bag on wheels.","is pulling"],
 ["The thief ___ (steal) things from shops.","steals"],
 ["The bank guard ___ (not look) at the thief.","isn’t looking"],
 ["The bank guard never ___ (do) anything, because he’s lazy.","does"],
 ["The photographer ___ (take) a photograph of the model.","is taking"],
 ["The artist ___ (sell) her pictures to the children’s parents.","sells"],
 ["The thief ___ (not steal) anything at the moment.","isn’t stealing"],
 ["The journalist ___ (write) something in his notebook.","is writing"]
];
function renderControlled(){
 const renderPracticeSentence=(x,i)=>{
   const parts=x[0].split("___");
   const before=parts[0]||"", after=parts[1]||"";
   return `<div class="practice-item inline-blank-item"><strong class="practice-letter">${String.fromCharCode(97+i)}.</strong><div class="practice-sentence inline-sentence">${before}<span class="inline-answer-cluster"><button class="practice-inline-show" type="button" data-practice-show="${i}">Show</button><input class="practice-answer inline-blank-input" data-practice="${i}" data-answer="${x[1]}" placeholder="type your answer"></span>${after}</div></div>`;
 };
 const panels=[[0,4],[4,8],[8,11]].map(([a,b])=>`<div class="practice-list compact-practice">${practice.slice(a,b).map((x,k)=>renderPracticeSentence(x,a+k)).join("")}</div>`);
 return `<section class="screen">${head("Screen 10","Present Simple and Present Continuous","Look again at the shopping mall. Put the verbs in the correct form.","SOURCE p.23 · LANGUAGE FOCUS · ACTIVITY 1")}
 <div class="tense-reminder"><span class="ps-reminder">Present Simple</span><span class="pc-reminder">Present Continuous</span></div>
 ${tabs("practice",["a–d","e–h","i–k"])}${tabPanels("practice",panels)}${controls("practice")}</section>`;
}
const soniaItems=[
 ["She cycles to school.","usual"],
 ["She is working in a hotel.","week"],
 ["She does lessons all day.","usual"],
 ["She isn’t going to school.","week"],
 ["She studies at home in the evening.","usual"],
 ["She is having meals with her colleagues.","week"],
 ["She plays volleyball after school.","usual"],
 ["She isn’t doing any homework.","week"],
 ["She does not wear her best skirt every day.","usual"],
 ["She is speaking French with hotel guests.","week"]
];
function renderSoniaSort(){
 return `<section class="screen">${head("Screen 11","Sonia: Two Lives","Make sentences about Sonia using the Present Simple or Present Continuous.","SOURCE p.24 · LANGUAGE FOCUS · ACTIVITY 2")}
 <div class="sonia-context-card">
   <div class="sonia-context-main"><b>Meet Sonia.</b> Sonia is an English schoolgirl. She’s fifteen. <b>This week she’s doing work experience in a hotel.</b></div>
   <div class="sonia-book-examples">
     <div><span>Usually</span><strong>She cycles to school.</strong></div>
     <div><span>This week only</span><strong>She isn’t going to school.</strong></div>
   </div>
 </div>
 <div class="sonia-layout"><div class="sonia-photos"><img src="${img("u3l31_img_sonia_school.webp")}" alt="Sonia at school"><img src="${img("u3l31_img_sonia_hotel.webp")}" alt="Sonia doing work experience in a hotel"></div>
 <div><div class="sort-zones"><div class="zone"><h3>What does Sonia usually do / not do?</h3><div class="dropzone" data-zone="usual"></div></div><div class="zone blue"><h3>What is Sonia doing / not doing this week?</h3><div class="dropzone" data-zone="week"></div></div></div><div class="bank sonia-full-bank" id="soniaBank">${soniaItems.map((x,i)=>`<div class="chip sonia-sentence-chip" draggable="true" data-id="so${i}" data-answer="${x[1]}">${x[0]}</div>`).join("")}</div>${controls("soniaSort")}</div></div></section>`;
}
function renderSoniaSpeak(){
 return `<section class="screen">${head("Screen 12","Speak about Sonia","Compare Sonia’s usual school life with her work-experience week.","ACTIVITY 2 · SPEAKING EXTENSION")}
 <div class="sonia-context-strip"><b>Sonia is 15.</b> She normally goes to school, but <b>this week she is doing work experience in a hotel.</b></div>
 <div class="sonia-source-pairs">
   <div class="pair-head">usually</div><div class="pair-head week-head">this week only</div>
   <div>cycle to school</div><div>not go to school</div>
   <div>do lessons all day</div><div>not do any homework</div>
   <div>study at home in the evening</div><div>work in a hotel</div>
   <div>play volleyball after school</div><div>have meals with her colleagues</div>
   <div>not wear her best skirt every day</div><div>speak French with hotel guests</div>
 </div>
 <div class="source-example-line"><b>Book examples:</b> “She cycles to school.” → “She isn’t going to school.”</div>
 <div class="speak-cards"><div class="speak-card"><div class="kicker">YOUR CONTRAST 1</div><p class="stem">Sonia usually …, but this week she is / isn’t …</p><textarea id="soniaSpeak1" class="textarea" placeholder="Build one clear contrast sentence."></textarea></div><div class="speak-card"><div class="kicker">YOUR CONTRAST 2</div><p class="stem">She usually …, but this week …</p><textarea id="soniaSpeak2" class="textarea" placeholder="Build another contrast sentence."></textarea></div></div>
 <div class="teacher-prompt"><b>Partner check:</b> Which part describes Sonia’s normal routine? Which part describes this temporary week?</div>${controls("soniaSpeak",{closed:false,show:false,score:false})}</section>`;
}
const dialogueAnswers=["am not going","am doing","am working","are not working","am helping","like","prefer","are staying","understand","get up","am starting","am looking forward to"];
function dialogueRows(){
 const rows=[
  ["Sonia","Hi, Granny. How are you?"],
  ["Granny","Oh, not bad. How’s school?"],
  ["Sonia",`I <input data-dialogue="0"> to school this week.`],
  ["Granny","Why not? Are you ill?"],
  ["Sonia",`No, I <input data-dialogue="1"> work experience. I <input data-dialogue="2"> in a hotel.`],
  ["Granny",`I hope you <input data-dialogue="3"> in the kitchen. You’re not good at cooking!`],
  ["Sonia",`No, I’m not in the kitchen. I <input data-dialogue="4"> the receptionist and the manager.`],
  ["Granny","Is that nice?"],
  ["Sonia",`Yes. I <input data-dialogue="5"> working with the manager, but I <input data-dialogue="6"> helping the receptionist because I can talk to the guests.`],
  ["Sonia",`Some French people <input data-dialogue="7"> in the hotel. I <input data-dialogue="8"> almost everything they say.`],
  ["Sonia",`When I go to school, I <input data-dialogue="9"> at half past seven, but this week I <input data-dialogue="10"> work at seven o’clock.`],
  ["Sonia",`Oh, yes. I <input data-dialogue="11"> it.`]
 ];
 return `<div class="dialogue-table">${rows.map(([sp,text])=>`<div class="speaker">${sp}:</div><div class="utterance">${text}</div>`).join("")}</div>`;
}
function renderSoniaDialogue(){
 return `<section class="screen">${head("Screen 13","Sonia & Granny","Complete the telephone conversation, then listen and check.","SOURCE p.24 · LANGUAGE FOCUS · ACTIVITY 3")}
 <div class="sonia-context-strip"><b>Context:</b> Sonia is fifteen and normally goes to school. This week she is doing work experience in a hotel. Now she is phoning her granny.</div>
 ${tabs("dialogue",["Predict","Complete","Listen & Check"])}
 ${tabPanels("dialogue",[
  `<div class="card predict-card"><h3>Before you complete the dialogue</h3><p class="large-prompt">What do you predict Sonia will say about <b>school</b>, <b>the hotel</b>, and <b>the weekend</b>?</p><div class="prediction-stems"><span>School: …</span><span>Hotel: …</span><span>Weekend: …</span></div><textarea id="soniaPredict" class="textarea compact-textarea" placeholder="Write 1–3 short predictions."></textarea></div>`,
  `<div class="activity-banner"><b>Activity 3 · Complete</b><span>Use the verbs in the box. Change the form when necessary.</span></div><div class="verb-bank-line">do · not go · get up · help · like · prefer · look forward to · start · stay · understand · work · not work</div>${dialogueRows()}`,
  `<div class="activity-banner"><b>Audio 1.12 · Listen and check</b><span>Keep the full conversation visible while you listen.</span></div>${audioBox("sonia_granny.mp3","Audio 1.12")}${dialogueRows()}`
 ])}${controls("dialogue")}</section>`;
}
const stateElicit=[
 ["A doctor is examining a patient.","action"],["Dr Lan knows the patient’s history.","state"],["A nurse is checking a monitor.","action"],["Dr Lan understands the main concern.","state"]
];
function renderStateElicit(){
 return `<section class="screen">${head("Screen 14","Action or State?","Use meaning to prepare for the State Verbs Grammar Spot.","GRAMMAR SPOT · STATE VERBS")}
 <div class="elicit-grid">${stateElicit.map((x,i)=>`<div class="elicit-card" data-elicit="${i}" data-answer="${x[1]}"><p>${x[0]}</p><div class="binary"><button data-v="action">Observable action</button><button data-v="state">State</button></div></div>`).join("")}</div>
 <div class="teacher-prompt"><b>Ask:</b> Can you actually see someone “knowing”? Is this an action in progress, or a state?</div>${controls("stateElicit")}</section>`;
}
const stateCat=[
 ["is examining","action"],["knows","state"],["is checking","action"],["understands","state"],["thinks (opinion)","state"],["is thinking about","action"]
];
function renderStateCat(){
 return `<section class="screen">${head("Screen 15","Before the Rule","Sort the meaning — not just the verb form.","NOTICE THE MEANING")}
 <div class="sort-zones"><div class="zone blue"><h3>Action in progress</h3><div class="dropzone" data-zone="action"></div></div><div class="zone"><h3>State</h3><div class="dropzone" data-zone="state"></div></div></div>
 <div class="bank" id="stateCatBank">${stateCat.map((x,i)=>`<div class="chip" draggable="true" data-id="sc${i}" data-answer="${x[1]}">${x[0]}</div>`).join("")}</div>
 <div class="teacher-prompt"><b>Key question:</b> What changes when <i>think</i> means an opinion, compared with an active process of thinking?</div>${controls("stateCategorise")}</section>`;
}
const stateModelItems=[
 ["sv1","like","feel"],["sv2","prefer","feel"],["sv3","know","know"],["sv4","understand","know"],["sv5","believe","belief"],["sv6","think (opinion)","belief"],["sv7","want","want"],["sv8","are not","rule1"],["sv9","simple","rule2"]
];
function renderStateBuild(){
 return `<section class="screen">${head("Screen 16","Build the State-Verb Model","Construct the concept from meaning, not a memorised list.","MEANING MATTERS.")}
 <div class="state-layout"><div><div class="state-grid"><div class="state-card"><h3>Feeling / Preference</h3><div class="dropzone" data-zone="feel"></div></div><div class="state-card"><h3>Knowing / Understanding</h3><div class="dropzone" data-zone="know"></div></div><div class="state-card"><h3>Belief / Opinion</h3><div class="dropzone" data-zone="belief"></div></div><div class="state-card"><h3>Wanting</h3><div class="dropzone" data-zone="want"></div></div></div>
 <div class="rule-builder"><div>State verbs <span class="dropzone inline" data-zone="rule1"></span> normally used in continuous tenses.</div><div>We usually use the <span class="dropzone inline" data-zone="rule2"></span> form for these meanings.</div></div></div>
 <aside class="card"><div class="kicker">LABEL BANK</div><div class="bank" id="stateBuildBank" style="box-shadow:none;padding:0">${stateModelItems.map(x=>`<div class="chip" draggable="true" data-id="${x[0]}" data-answer="${x[2]}">${x[1]}</div>`).join("")}</div></aside></div>
 <div class="teacher-prompt"><b>Teacher sequence:</b> Responses → select disagreement → justify → Show answer → Screen 17.</div>${controls("stateBuild")}</section>`;
}
function renderStateFocus(){
 return `<section class="screen">${head("Screen 17","State Verbs","Final knowledge map after discussion.","MEANING MATTERS.")}
 <div class="state-focus"><div class="center"><h3>STATE VERBS</h3><span>states rather than observable actions</span></div><div class="sf-grid"><article><h3>Feeling / Preference</h3><p><b>like</b> · <b>prefer</b></p></article><article><h3>Knowing / Understanding</h3><p><b>know</b> · <b>understand</b></p></article><article><h3>Belief / Opinion</h3><p><b>believe</b> · <b>think*</b></p></article><article><h3>Wanting</h3><p><b>want</b></p></article></div><div class="rule-summary"><div><b>Rule:</b> These meanings are not normally used in continuous tenses.</div><div><b>Use:</b> We usually use the simple form.</div></div><div class="think-note"><b>* think = opinion / belief in this use.</b><br>Compare: She <b>thinks</b> the patient needs observation. / She <b>is thinking about</b> the next step.</div></div>
 ${controls("stateFocus",{closed:false,show:false,score:false})}</section>`;
}
const errors=[
 ["I’m not believing you can fly a plane.","I don’t believe you can fly a plane."],
 ["Are those jeans new? I’m liking them very much.","Are those jeans new? I like them very much."],
 ["We’re thinking this CD is very expensive.","We think this CD is very expensive."],
 ["Are you wanting some coffee?","Do you want some coffee?"],
 ["I can’t phone you because I’m not knowing your number.","I can’t phone you because I don’t know your number."],
 ["The teacher is speaking quickly and I’m not understanding what she’s saying.","The teacher is speaking quickly and I don’t understand what she’s saying."],
 ["My friends are watching a pop programme on TV but I’m not liking it, so I’m listening to my MP3 player.","My friends are watching a pop programme on TV but I don’t like it, so I’m listening to my MP3 player."]
];
function renderErrorDoctor(){
 return `<section class="screen">${head("Screen 18","Error Doctor","Correct the mistakes in the State Verbs Grammar Spot.","SOURCE p.24 · GRAMMAR SPOT · a–g")}
 <div class="error-list">${errors.map((x,i)=>`<div class="error-row"><div class="sentence"><b>${String.fromCharCode(97+i)}.</b> ${x[0]}</div><input data-error="${i}" data-answer="${x[1]}" placeholder="Correct the sentence"><textarea class="textarea" style="min-height:70px;margin-top:8px" placeholder="Why? (pair explanation — not auto-scored)"></textarea></div>`).join("")}</div>
 ${controls("errorDoctor")}</section>`;
}
function renderProfessional(){
 const qs=[
  ["Dr Minh usually ___ patients in the outpatient clinic.","sees","is seeing"],
  ["Right now, he ___ a patient’s test results.","reviews","is reviewing"],
  ["Dr Lan ___ the patient needs more observation.","thinks","is thinking"]
 ];
 return `<section class="screen">${head("Screen 19","Professional Transfer","Apply the grammar to a clinical work context.","PROFESSIONAL CONTEXT · B1 LANGUAGE")}
 <div class="med-grid">${qs.map((q,i)=>`<div class="med-card"><div class="kicker">CASE ${i+1}</div><p style="font-size:21px;font-weight:850">${q[0]}</p><select data-med="${i}" data-answer="${i===0?q[1]:i===1?q[2]:q[1]}"><option value="">Choose</option><option>${q[1]}</option><option>${q[2]}</option></select></div>`).join("")}</div>
 <div class="card" style="margin-top:16px"><h3>Professional speaking extension</h3><p class="stem">Usually, I … . Right now / this week, I am … .</p><textarea id="professionalOpen" class="textarea" placeholder="Make one true sentence about your professional life."></textarea><p class="note">Teacher/peer response — not fake auto-scored.</p></div>${controls("professional")}</section>`;
}
function renderExit(){
 return `<section class="screen">${head("Screen 20","Exit Ticket","Evidence of learning + reflection.","ONE MINUTE · THREE PIECES OF EVIDENCE")}
 <div class="exit-grid"><div class="exit-card"><h3>1. Choose the correct form</h3><p>Dr Lan usually <select id="exit1" data-answer="works"><option value="">Choose</option><option>works</option><option>is working</option></select> in the outpatient clinic.</p></div><div class="exit-card"><h3>2. Correct the state verb</h3><p>I’m understanding the problem.</p><input id="exit2" class="input-line" data-answer="I understand the problem." placeholder="Correct sentence"></div><div class="exit-card"><h3>3. Professional sentence</h3><textarea id="exitOpen" class="textarea" placeholder="Today / this week, I am ..."></textarea></div><div class="exit-card"><h3>Today I can…</h3><div class="scale" id="exitScale"><button data-v="1">1</button><button data-v="2">2</button><button data-v="3">3</button><button data-v="4">4</button><button data-v="5">5</button></div><p class="note">1 = need support · 5 = confident</p></div></div>${controls("exit")}</section>`;
}
function renderThanks(){
 const src=img("thank_you.webp");
 return `<section class="screen">${head("End","Thank You","You’ve completed Unit 3.1.")}${document.querySelector?`<img class="thanks-img" src="${src}" alt="Thank You">`:""}</section>`;
}

const renderers={hero:renderHero,aims:renderAims,warmup:renderWarmup,jobs:renderJobs,notice:renderNotice,listening:renderListening,discovery:renderDiscovery,video:renderVideo,tenseBuild:renderTenseBuild,tenseFocus:renderTenseFocus,controlled:renderControlled,soniaSort:renderSoniaSort,soniaSpeak:renderSoniaSpeak,soniaDialogue:renderSoniaDialogue,stateElicit:renderStateElicit,stateCategorise:renderStateCat,stateBuild:renderStateBuild,stateFocus:renderStateFocus,errorDoctor:renderErrorDoctor,professional:renderProfessional,exit:renderExit,thanks:renderThanks};

function render(){
 const [id,label,title,type]=LESSON.screens[current];
 const roleSel=document.getElementById("roleSelect"); if(roleSel)roleSel.value=role;
 $("#screenTitle").textContent=title;
 $("#screenCounter").textContent=`${current+1} / ${LESSON.screens.length}`;
 $("#progressBar").style.width=`${(current+1)/LESSON.screens.length*100}%`;
 $("#prevBtn").disabled=current===0; $("#nextBtn").disabled=current===LESSON.screens.length-1;
 stage.innerHTML=renderers[type]();
 bindCommon();
 installPerItemReveals();
 bindHeroLaunch();
 renderNav();
 setupVideoMode();
}
function bindCommon(){
 $$("[data-go-next]").forEach(b=>b.onclick=()=>go(current+1));
 $$("[data-tabs]").forEach(t=>{
  const id=t.dataset.tabs;
  t.querySelectorAll("button").forEach(b=>b.onclick=()=>{t.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b)); $$(`[data-tab-panel^="${id}-"]`).forEach(p=>p.classList.remove("active")); $(`[data-tab-panel="${id}-${b.dataset.tab}"]`).classList.add("active")})
 });
 $$(".choice-row button,.binary button,#exitScale button").forEach(b=>b.onclick=()=>{const p=b.parentElement;p.querySelectorAll("button").forEach(x=>x.classList.remove("selected","active"));b.classList.add("selected","active")});
 $$(".prediction-chip").forEach(b=>b.onclick=()=>b.classList.toggle("selected"));
 $$("[data-dialogue]").forEach(el=>el.addEventListener("input",()=>{$$(`[data-dialogue="${el.dataset.dialogue}"]`).forEach(other=>{if(other!==el)other.value=el.value})}));
 $$('[data-practice-show]').forEach(btn=>{
   btn.onclick=e=>{e.stopPropagation(); const idx=btn.dataset.practiceShow; const input=stage.querySelector(`[data-practice="${idx}"]`); if(input && btn.closest('.reveal-mode')) fillAnswer(input,input.dataset.answer);};
 });
 setupDnD();
 $$(".controls button").forEach(b=>b.onclick=()=>handleAction(b));
}
function setupDnD(){
 let selected=null;
 $$(".chip").forEach(ch=>{
  ch.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",ch.dataset.id);selected=ch.dataset.id});
  ch.addEventListener("click",()=>{selected=ch.dataset.id;$$(".chip").forEach(x=>x.classList.toggle("selected",x===ch))});
  ch.addEventListener("dblclick",()=>{const bank=ch.closest(".screen").querySelector(".bank");if(bank)bank.appendChild(ch)})
 });
 $$(".dropzone").forEach(z=>{
  z.addEventListener("dragover",e=>{e.preventDefault();z.classList.add("dragover")});z.addEventListener("dragleave",()=>z.classList.remove("dragover"));
  z.addEventListener("drop",e=>{e.preventDefault();z.classList.remove("dragover");const id=e.dataTransfer.getData("text/plain");const c=$(`.chip[data-id="${id}"]`);if(c)z.appendChild(c)});
  z.addEventListener("click",()=>{if(!selected)return;const c=$(`.chip[data-id="${selected}"]`);if(c){z.appendChild(c);c.classList.remove("selected");selected=null}})
 });
}
function getActivity(){const [screenId,,,type]=LESSON.screens[current];return {id:type,screenId,type}}
function status(activity,msg){const e=$(`#${activity}Status`);if(e)e.textContent=msg}
function normalize(s){return String(s||"").trim().toLowerCase().replace(/[’']/g,"'").replace(/\s+/g," ")}
function collectTypeClosed(type){
 let total=0,correct=0,answers=[];
 if(["notice","soniaSort","stateCategorise","tenseBuild","stateBuild"].includes(type)){
  $$(".chip").forEach(c=>{total++;const zone=c.parentElement.classList.contains("dropzone")?c.parentElement.dataset.zone:"bank";const ok=zone===c.dataset.answer;if(ok)correct++;answers.push([c.dataset.id,zone,c.dataset.answer,ok])});
 } else if(type==="discovery"){
  [["d1","simple"],["d2","cont"]].forEach(([q,a])=>{total++;const b=$(`[data-q="${q}"] button.selected`);const v=b?.dataset.v;const ok=v===a;if(ok)correct++;answers.push([q,v,a,ok])});
 } else if(type==="jobs"){
  $$(".job-name").forEach(i=>{total++;const ok=normalize(i.value)===normalize(i.dataset.answer);if(ok)correct++;answers.push([i.value,i.dataset.answer,ok])});
 } else if(type==="listening"){
  const arr=[[$("#mallMan"),"security officer"],[$("#mallTo"),"police officer"],...$$(".mall-job").map(x=>[x,x.dataset.answer])];
  arr.forEach(([i,a])=>{total++;const ok=normalize(i?.value).includes(normalize(a));if(ok)correct++;answers.push([i?.value,a,ok])});
 } else if(type==="controlled"){
  $$("[data-practice]").forEach(i=>{total++;const ok=normalize(i.value)===normalize(i.dataset.answer);if(ok)correct++;answers.push([i.value,i.dataset.answer,ok])});
 } else if(type==="soniaDialogue"){
  $$("[data-dialogue]").forEach((i,idx)=>{total++;const a=dialogueAnswers[idx];const ok=normalize(i.value)===normalize(a);if(ok)correct++;answers.push([i.value,a,ok])});
 } else if(type==="stateElicit"){
  $$(".elicit-card").forEach(c=>{total++;const v=c.querySelector("button.selected")?.dataset.v;const ok=v===c.dataset.answer;if(ok)correct++;answers.push([v,c.dataset.answer,ok])});
 } else if(type==="errorDoctor"){
  $$("[data-error]").forEach(i=>{total++;const ok=normalize(i.value)===normalize(i.dataset.answer);if(ok)correct++;answers.push([i.value,i.dataset.answer,ok])});
 } else if(type==="professional"){
  $$("[data-med]").forEach(i=>{total++;const ok=normalize(i.value)===normalize(i.dataset.answer);if(ok)correct++;answers.push([i.value,i.dataset.answer,ok])});
 } else if(type==="exit"){
  const arr=[[$("#exit1"),"works"],[$("#exit2"),"I understand the problem."]];
  arr.forEach(([i,a])=>{total++;const ok=normalize(i?.value)===normalize(a);if(ok)correct++;answers.push([i?.value,a,ok])});
 }
 return {total,correct,answers};
}

function activeControlActivity(btn=null){
 const wrap=btn?.closest?.("[data-controls]");
 return wrap?.dataset?.controls || getActivity().id;
}
function collectActivity(activity){
 let total=0,correct=0,answers=[];
 const okText=(v,a)=>normalize(v)===normalize(a);

 if(activity==="intro1"){
   $$('[data-tab-panel="jobs-0"] .answer-slot').forEach((z,i)=>{total++;const chip=z.querySelector(".chip");const v=chip?.dataset.target||"";const a=BOOK.introSpeakerAnswers[i];const ok=v===a;if(ok)correct++;answers.push([v,a,ok])});
   return {total,correct,answers};
 }
 if(activity==="intro2"){
   $$('[data-tab-panel="jobs-1"] .answer-slot').forEach((z,i)=>{total++;const chip=z.querySelector(".chip");const v=chip?.dataset.target||"";const a=BOOK.introJobs[i];const ok=okText(v,a);if(ok)correct++;answers.push([v,a,ok])});
   return {total,correct,answers};
 }
 if(activity==="intro3"){
   $$('[data-tab-panel="jobs-2"] [data-job-action]').forEach((el,i)=>{total++;const ok=okText(el.value,BOOK.introActions[i]);if(ok)correct++;answers.push([el.value,BOOK.introActions[i],ok])});
   return {total,correct,answers};
 }
 if(activity==="listening1"||activity==="intro4"||activity==="videoCheck")return {total:0,correct:0,answers:[]};
 if(activity==="listening2"){
   [["#mallMan","security officer"],["#mallTo","police officer"]].forEach(([q,a])=>{const el=$(q);total++;const ok=normalize(el?.value).includes(normalize(a));if(ok)correct++;answers.push([el?.value,a,ok])});return {total,correct,answers};
 }
 if(activity==="listening3"){
   $$(".mall-job").forEach((el,i)=>{total++;const a=BOOK.listeningJobs[i];const ok=okText(el.value,a);if(ok)correct++;answers.push([el.value,a,ok])});return {total,correct,answers};
 }
 if(activity==="grammarSpot"){
   $$(".grammar-rule-card select").forEach(el=>{total++;const ok=okText(el.value,el.dataset.answer);if(ok)correct++;answers.push([el.value,el.dataset.answer,ok])});return {total,correct,answers};
 }
 return collectTypeClosed(getActivity().type);
}

function mark(activity){
 const r=collectActivity(activity);
 const type=getActivity().type;
 if(["notice","soniaSort","stateCategorise","tenseBuild","stateBuild"].includes(type)){
  $$(".chip").forEach(c=>{const zone=c.parentElement.classList.contains("dropzone")?c.parentElement.dataset.zone:"bank";c.classList.remove("correct","wrong");c.classList.add(zone===c.dataset.answer?"correct":"wrong")});
 }
 return r;
}
function showAnswers(type){
 const {id}=getActivity();
 $$(".inline-reveal-btn,.zone-reveal-btn").forEach(b=>b.classList.add("reveal-pulse"));
 status(id,"Reveal mode: click “Show answer” beside the specific box you want to reveal.");
}
async function submitActivity(activity){
 const r=collectActivity(activity);
 const openFields={};
 const scope=stage.querySelector(`[data-controls="${activity}"]`)?.closest(".tab-panel") || stage;
 scope.querySelectorAll("textarea,input:not([type=hidden]),select").forEach((el,idx)=>{
   const key=el.id||el.dataset.practice||el.dataset.dialogue||el.dataset.error||el.dataset.med||el.dataset.jobAction||("field_"+idx);
   if(el.value!==undefined && String(el.value).trim()!=="")openFields[key]=String(el.value).trim();
 });
 scope.querySelectorAll(".choice-row,.binary,#exitScale,.prediction-bank").forEach((row,idx)=>{
   const sels=[...row.querySelectorAll("button.selected")].map(b=>b.dataset.v||b.dataset.predict||b.textContent.trim());
   if(sels.length)openFields["choice_"+idx]=sels;
 });
 const rec={lesson_id:"u3l31",activity,role,student_name:localStorage.getItem("u3l31_student_name")||"",screen_type:getActivity().type,correct:r.correct,total:r.total,responses:openFields,submitted_at:new Date().toISOString(),online:navigator.onLine};
 const all=load("submissions",[]);all.push(rec);save("submissions",all);
 if(!OFFLINE_PACKAGE && /^https?:$/.test(location.protocol)){
   try{await fetch("/api/responses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(rec)});}catch(e){}
 }
 status(activity,`Submitted${r.total?` · ${r.correct}/${r.total}`:""}.`);
}
function resetCurrent(){render()}
async function responsesActivity(activity){
 if(["teacher","admin"].includes(role)){
   await renderResponsesBoard(activity); openPanel("responsesBoard");
 } else status(activity,"Responses Board is Teacher/Admin only.");
}
function handleAction(btn){
 const a=btn.dataset.action, activity=activeControlActivity(btn), type=getActivity().type;
 if(a==="check"){const r=mark(activity);status(activity,r.total?`Check: ${r.correct}/${r.total}.`:"Open task: review through peer / teacher feedback.");}
 if(a==="reset")resetCurrent();
 if(a==="submit")submitActivity(activity);
 if(a==="score"){const r=collectActivity(activity);status(activity,r.total?`Score: ${r.correct}/${r.total} (${Math.round(r.correct/r.total*100)}%).`:"This open task is not auto-scored.");}
 if(a==="show")toggleRevealMode(btn,activity);
 if(a==="responses")responsesActivity(activity);
 if(a==="timer")toggleTimer();
 if(a==="live"){setupQR();openPanel("qrPanel")}
 if(a==="studio")showPlatform("Edit in Studio");
 if(a==="presentation")enterPresentation();
 if(a==="exitPresentation")exitPresentation();
}
function setupVideoMode(){}
function syncNetwork(){
 const on=navigator.onLine;$("#netBadge").textContent=on?"ONLINE":"OFFLINE";$("#netBadge").classList.toggle("offline",!on);setupVideoMode();
}
function go(i){current=Math.max(0,Math.min(LESSON.screens.length-1,i));render();window.scrollTo({top:0,behavior:"smooth"})}
$("#prevBtn").onclick=()=>go(current-1);$("#nextBtn").onclick=()=>go(current+1);
$("#roleSelect").onchange=e=>{role=e.target.value;render()};
$("#menuBtn").onclick=()=>$("#drawer").classList.add("open");$("#closeDrawer").onclick=()=>$("#drawer").classList.remove("open");
function renderNav(){const nav=$("#navList");nav.innerHTML=LESSON.screens.map((s,i)=>`<button class="nav-item ${i===current?'current':''}" data-i="${i}"><span class="nav-num">${s[1]}</span><span>${s[2]}</span></button>`).join("");nav.querySelectorAll("button").forEach(b=>b.onclick=()=>{$("#drawer").classList.remove("open");go(+b.dataset.i)})}
function toggleTimer(){const p=$("#timerPanel");p.classList.toggle("hidden");}
function drawTimer(){const m=String(Math.floor(timerSecs/60)).padStart(2,"0"),s=String(timerSecs%60).padStart(2,"0");$("#timerValue").textContent=`${m}:${s}`}
$("#timerPanel").addEventListener("click",e=>{const m=e.target.dataset.min;if(m){clearInterval(timerInt);timerSecs=+m*60;drawTimer();timerInt=setInterval(()=>{timerSecs--;drawTimer();if(timerSecs<=0){clearInterval(timerInt)}},1000)}});
$("#timerStop").onclick=()=>{clearInterval(timerInt);$("#timerPanel").classList.add("hidden")};
function showPlatform(title){$("#platformTitle").textContent=title;$("#platformPanel").classList.remove("hidden")}$("#closePlatform").onclick=()=>$("#platformPanel").classList.add("hidden");
addEventListener("online",syncNetwork);addEventListener("offline",syncNetwork);
syncNetwork();drawTimer();render();


/* =========================================================
   RC1.2: Adaptive View / QR / Responses Board
   ========================================================= */
const viewBtn=document.getElementById("viewBtn");
const qrBtn=document.getElementById("qrBtn");
const responsesBtn=document.getElementById("responsesBtn");
const viewPanel=document.getElementById("viewPanel");
const qrPanel=document.getElementById("qrPanel");
const responsesBoard=document.getElementById("responsesBoard");

function openPanel(id){
  const el=document.getElementById(id);
  if(el)el.classList.remove("hidden");
}
function closePanel(id){
  const el=document.getElementById(id);
  if(el)el.classList.add("hidden");
}
document.addEventListener("click",e=>{
  const c=e.target.closest("[data-close]");
  if(c)closePanel(c.dataset.close);
});
if(viewBtn)viewBtn.onclick=()=>openPanel("viewPanel");
if(qrBtn)qrBtn.onclick=()=>{setupQR();openPanel("qrPanel")};
if(responsesBtn)responsesBtn.onclick=()=>{
  if(!["teacher","admin"].includes(role)){
    showPlatform("Responses Board");
    document.querySelector("#platformPanel p").textContent="Responses Board is available to Teacher/Admin. Switch QA Role to Teacher or Admin to inspect local submissions.";
    return;
  }
  renderResponsesBoard();
  openPanel("responsesBoard");
};

function setView(mode){
  document.body.classList.remove("view-projector","view-compact");
  if(mode==="projector")document.body.classList.add("view-projector");
  if(mode==="compact")document.body.classList.add("view-compact");
  localStorage.setItem("u3l31_view",mode);
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===mode));
}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>setView(b.dataset.view));
setView(localStorage.getItem("u3l31_view")||"auto");

function setupQR(){
  const isHosted=/^https?:$/.test(location.protocol);
  const hosted=document.getElementById("qrHosted");
  const local=document.getElementById("qrLocal");
  const share=document.getElementById("shareUrl");
  const qrImage=document.getElementById("qrImage");
  const copyBtn=document.getElementById("copyLinkBtn");
  const openBtn=document.getElementById("openLinkBtn");

  if(!isHosted){
    hosted.classList.add("hidden");
    local.classList.remove("hidden");
    if(qrImage){ qrImage.removeAttribute("src"); qrImage.alt=""; }
    if(share) share.textContent="";
    if(copyBtn) copyBtn.disabled=true;
    if(openBtn) openBtn.disabled=true;
    return;
  }

  hosted.classList.remove("hidden");
  local.classList.add("hidden");

  const liveUrl=new URL(location.href);
  liveUrl.searchParams.set("role","student");
  liveUrl.hash="";
  const studentUrl=liveUrl.toString();

  share.textContent=studentUrl;
  qrImage.alt="Student join QR code";
  qrImage.src="https://quickchart.io/qr?size=320&margin=2&text="+encodeURIComponent(studentUrl);
  qrImage.onerror=()=>{
    qrImage.style.display="none";
    share.textContent=studentUrl+" — QR image could not load; use Copy link.";
  };

  copyBtn.disabled=false;
  openBtn.disabled=false;
  copyBtn.onclick=async()=>{
    try{
      await navigator.clipboard.writeText(studentUrl);
      copyBtn.textContent="Copied!";
      setTimeout(()=>copyBtn.textContent="Copy link",1400);
    }catch{
      copyBtn.textContent="Copy unavailable";
    }
  };
  openBtn.onclick=()=>window.open(studentUrl,"_blank","noopener");
}

/* =========================================================
   RC2: stable controls, in-place reveal, responses, presentation
   ========================================================= */
function enterPresentation(){
 document.body.classList.add("presentation-mode");
 if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
 status(activeControlActivity(),"Presentation mode.");
}
function exitPresentation(){
 document.body.classList.remove("presentation-mode");
 if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
}
function toggleRevealMode(btn,activity){
 const scope=btn.closest(".tab-panel")||btn.closest(".screen")||stage;
 const on=!scope.classList.contains("reveal-mode");
 scope.classList.toggle("reveal-mode",on);
 status(activity,on?"Answer reveal is ON. Click the small Show button or the answer box you want to reveal.":"Answer reveal is OFF.");
}
function fillAnswer(el,answer){
 if(!el||!answer)return;
 if(el.tagName==="SELECT"){
   const opt=[...el.options].find(o=>normalize(o.value)===normalize(answer)||normalize(o.textContent)===normalize(answer));
   if(opt)el.value=opt.value;
 }else el.value=answer;
 el.classList.add("revealed-answer");
 el.dispatchEvent(new Event("input",{bubbles:true}));
}
function installInputReveal(el,answer){
 if(!el||!answer||el.dataset.revealInstalled)return;
 el.dataset.revealInstalled="1";
 const btn=document.createElement("button");btn.type="button";btn.className="mini-show";btn.textContent="Show";
 btn.onclick=e=>{e.stopPropagation();fillAnswer(el,answer)};
 if(el.classList.contains("practice-answer")){
   return;
 }else{
   el.insertAdjacentElement("afterend",btn);
 }
 el.addEventListener("click",()=>{const scope=el.closest(".reveal-mode");if(scope&&["teacher","admin","presentation"].includes(role))fillAnswer(el,answer)});
}
function installZoneReveal(zone,answerFn){
 if(!zone||zone.dataset.revealInstalled)return;
 zone.dataset.revealInstalled="1";
 const btn=document.createElement("button");btn.type="button";btn.className="mini-show zone-show";btn.textContent="Show";
 const reveal=()=>{
  const scope=zone.closest(".tab-panel")||zone.closest(".screen");
  if(!scope?.classList.contains("reveal-mode"))return;
  answerFn();
  zone.classList.add("revealed-zone");
 };
 btn.onclick=e=>{e.stopPropagation();reveal()};
 zone.insertAdjacentElement("afterend",btn);
 zone.addEventListener("click",()=>{if(["teacher","admin","presentation"].includes(role))reveal()});
}
function installPerItemReveals(){
 if(!["teacher","admin","presentation"].includes(role))return;
 stage.querySelectorAll("input[data-answer],textarea[data-answer],select[data-answer]").forEach(el=>installInputReveal(el,el.dataset.answer));
 stage.querySelectorAll("[data-dialogue]").forEach((el,i)=>installInputReveal(el,dialogueAnswers[+el.dataset.dialogue]));

 // Screen 03 speaker / job drag boxes
 $$('[data-tab-panel="jobs-0"] .answer-slot').forEach((z,i)=>installZoneReveal(z,()=>{
   const chip=$(`[data-tab-panel="jobs-0"] .chip[data-target="${BOOK.introSpeakerAnswers[i]}"]`);
   if(chip)z.appendChild(chip);
 }));
 $$('[data-tab-panel="jobs-1"] .answer-slot').forEach((z,i)=>installZoneReveal(z,()=>{
   const chip=[...$$('[data-tab-panel="jobs-1"] .chip')].find(c=>normalize(c.dataset.target)===normalize(BOOK.introJobs[i]));
   if(chip)z.appendChild(chip);
 }));

 // Generic semantic drag/drop boxes
 const type=getActivity().type;
 if(["notice","soniaSort","stateCategorise","tenseBuild","stateBuild"].includes(type)){
   $$(".dropzone[data-zone]").forEach(z=>installZoneReveal(z,()=>{
     const expected=[...$$(".chip[data-answer]")].filter(c=>c.dataset.answer===z.dataset.zone);
     expected.forEach(c=>z.appendChild(c));
   }));
 }

 // State elicitation buttons: reveal selects only correct option in that card.
 if(type==="stateElicit"){
   $$(".elicit-card").forEach(card=>{
     if(card.dataset.revealInstalled)return;card.dataset.revealInstalled="1";
     const btn=document.createElement("button");btn.className="mini-show";btn.textContent="Show";btn.type="button";
     btn.onclick=()=>{if(!card.closest(".reveal-mode"))return;card.querySelectorAll(".binary button").forEach(b=>b.classList.toggle("answer-option",b.dataset.v===card.dataset.answer))};
     card.appendChild(btn);
   });
 }
}

async function fetchSharedResponses(){
 if(OFFLINE_PACKAGE||!/^https?:$/.test(location.protocol))return load("submissions",[]);
 try{
   const r=await fetch("/api/responses?lesson_id=u3l31",{cache:"no-store"});
   if(r.ok){const data=await r.json();if(Array.isArray(data.responses))return data.responses}
 }catch(e){}
 return load("submissions",[]);
}
async function renderResponsesBoard(activityFilter=null){
 const all=await fetchSharedResponses();
 const filter=document.getElementById("responseFilter");
 const acts=[...new Set(all.map(x=>x.activity).filter(Boolean))].sort();
 filter.innerHTML='<option value="all">All activities</option>'+acts.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join("");
 if(activityFilter&&acts.includes(activityFilter))filter.value=activityFilter;
 const scored=all.filter(x=>Number(x.total)>0);
 $("#metricSubmissions").textContent=all.length;$("#metricActivities").textContent=acts.length;
 $("#metricAvg").textContent=scored.length?Math.round(scored.reduce((s,x)=>s+(Number(x.correct)/Number(x.total)*100),0)/scored.length)+"%":"—";
 const q=($("#responseSearch").value||"").toLowerCase(),f=filter.value;
 const rows=all.filter(x=>(f==="all"||x.activity===f)&&(!q||JSON.stringify(x).toLowerCase().includes(q))).slice().reverse();
 $("#responseCards").innerHTML=rows.map(r=>`<article class="response-card"><div class="response-card-head"><div><h3>${esc(r.activity||"activity")}</h3><div class="response-meta">${esc(r.student_name||r.role||"learner")} · ${esc(r.submitted_at||r.created_at||"")}</div></div>${Number(r.total)>0?`<span class="response-score">${r.correct}/${r.total} · ${Math.round(r.correct/r.total*100)}%</span>`:""}</div><div class="response-body">${Object.entries(r.responses||{}).map(([k,v])=>`<div class="response-field"><b>${esc(k)}</b><span>${esc(Array.isArray(v)?v.join(", "):typeof v==="object"?JSON.stringify(v):v)}</span></div>`).join("")}</div></article>`).join("");
 $("#emptyResponses").classList.toggle("hidden",rows.length>0);
}
$("#refreshResponses").onclick=()=>renderResponsesBoard();
$("#responseFilter").onchange=()=>renderResponsesBoard();
$("#responseSearch").oninput=()=>renderResponsesBoard();
$("#exportResponses").onclick=async()=>{
 const data=JSON.stringify(await fetchSharedResponses(),null,2);const blob=new Blob([data],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="U3.1_RESPONSES.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),800);
};

function bindHeroLaunch(){
 if(getActivity().type!=="hero")return;
 const start=$("#heroStart"),confirm=$("#confirmJoined");
 if(confirm&&start){confirm.onclick=()=>{confirm.classList.add("confirmed");confirm.textContent="✓ Students joined";start.disabled=false};start.onclick=()=>go(current+1)}
 $("#openOfflineClass")?.addEventListener("click",()=>go(current+1));
 $("#studentReady")?.addEventListener("click",()=>{const n=$("#studentName")?.value.trim();if(n)localStorage.setItem("u3l31_student_name",n);role="student";$("#roleSelect").value="student";go(current+1)});
 $$("[data-hero-action]").forEach(b=>b.onclick=()=>{const a=b.dataset.heroAction;if(a==="qr"){setupQR();openPanel("qrPanel")}if(a==="responses"){renderResponsesBoard();openPanel("responsesBoard")}if(a==="timer")toggleTimer();if(a==="layout")openPanel("viewPanel");if(a==="presentation")enterPresentation()});
}
