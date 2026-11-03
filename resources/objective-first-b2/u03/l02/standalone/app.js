
const screens=[...document.querySelectorAll('.screen')];let current=0,revealArmed=false;const status=document.getElementById('status');
const notes=["Cover: establish an adult B2 travel context.", "Goals: knowledge, communication and exam outcomes.", "Retrieval from U3.1 travel phrasal verbs.", "Activity 1: full source recording → match meanings → build semantic system.", "Task-first grammar discovery for obligation and crucial contrasts.", "Main communicative outcome: group travel plan and presentation.", "Accuracy repair after communicative use.", "Apply obligation/necessity to life situations.", "Extend the same rules-and-choices system to permission and register.", "Exam Folder divider.", "Word Formation strategy, prefixes and suffixes.", "Paper 1 Part 3 source text: A Distinguished Map-maker.", "Key Word Transformation strategy and source practice.", "Transition to new grammar area: location and movement.", "Prepositions: concept → controlled practice → map communication.", "Integrated synthesis by meaning.", "Exit ticket checks meaning, accuracy, exam skill and functional use.", "Thank You."];
function dots(){const d=document.getElementById('dots');screens.forEach((_,i)=>{const x=document.createElement('span');x.className='dot'+(i===0?' on':'');d.appendChild(x)})}dots();
function stopMedia(){document.querySelectorAll('audio,video').forEach(m=>{try{m.pause();}catch(e){}});if('speechSynthesis' in window)speechSynthesis.cancel();}
function paint(){document.getElementById('revealBtn').classList.toggle('armed',revealArmed);document.getElementById('revealBtn').textContent=revealArmed?'Show answer · ON':'Show answer';document.getElementById('showHint').classList.toggle('on',revealArmed);document.querySelectorAll('.screen.active .reveal-target').forEach(x=>x.classList.toggle('answer-ready',revealArmed));}
function go(n){stopMedia();current=Math.max(0,Math.min(screens.length-1,n));screens.forEach((s,i)=>s.classList.toggle('active',i===current));document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('on',i===current));status.textContent=`${current+1} / ${screens.length}`;document.getElementById('prev').disabled=current===0;document.getElementById('next').disabled=current===screens.length-1;revealArmed=false;paint();screens[current].scrollTop=0;location.hash=screens[current].dataset.id}
document.getElementById('prev').onclick=()=>go(current-1);document.getElementById('next').onclick=()=>go(current+1);
document.querySelectorAll('[data-tabs]').forEach(group=>{const root=group.closest('.screen');group.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{stopMedia();group.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');root.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));paint();})});
document.getElementById('revealBtn').onclick=()=>{revealArmed=!revealArmed;paint();};
document.addEventListener('click',e=>{const t=e.target.closest('.reveal-target');if(!revealArmed||!t||e.target.closest('button,audio,video'))return;t.classList.toggle('revealed');const ctl=t.querySelector('input,select,textarea');const ans=t.dataset.answer||'';if(ctl&&ans&&(!ctl.value||ctl.tagName==='TEXTAREA')){const fill=ans.split(' / ')[0];if(ctl.tagName==='SELECT'){ctl.value=fill;}else{ctl.value=fill;}}});
document.getElementById('resetBtn').onclick=()=>{stopMedia();const s=screens[current];s.querySelectorAll('input,textarea').forEach(x=>x.value='');s.querySelectorAll('select').forEach(x=>x.selectedIndex=0);s.querySelectorAll('.revealed').forEach(x=>x.classList.remove('revealed'));s.querySelectorAll('[style*="outline"]').forEach(x=>x.style.outline='');const tabs=s.querySelectorAll('.tab'), panels=s.querySelectorAll('.panel');if(tabs.length){tabs.forEach((x,i)=>x.classList.toggle('active',i===0));panels.forEach((x,i)=>x.classList.toggle('active',i===0));}revealArmed=false;paint();};
document.getElementById('checkBtn').onclick=()=>{const s=screens[current];let total=0,good=0;s.querySelectorAll('.reveal-target[data-answer]').forEach(it=>{const ctl=it.querySelector('input,select');if(!ctl)return;total++;const val=(ctl.value||'').trim().toLowerCase().replace(/\s+/g,' ');const acc=(it.dataset.answer||'').toLowerCase().split('/').map(x=>x.trim());const ok=acc.includes(val);it.style.outline=ok?'3px solid #5ba064':'3px solid #c86a5f';if(ok)good++;});status.textContent=total?`${good}/${total} correct`:`${current+1} / ${screens.length}`;};
const drawer=document.getElementById('drawer');document.getElementById('teacherBtn').onclick=()=>{document.getElementById('teacherText').innerHTML=`<p>${notes[current]||''}</p>`;drawer.classList.add('show')};document.getElementById('drawerClose').onclick=()=>drawer.classList.remove('show');
let tint=null,remain=60;const timer=document.getElementById('timer'),num=document.getElementById('timerNum');document.getElementById('timerBtn').onclick=()=>timer.classList.add('show');timer.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{clearInterval(tint);remain=Number(b.dataset.sec);const draw=()=>num.textContent=`${String(Math.floor(remain/60)).padStart(2,'0')}:${String(remain%60).padStart(2,'0')}`;draw();tint=setInterval(()=>{remain--;draw();if(remain<=0)clearInterval(tint)},1000)});document.getElementById('timerClose').onclick=()=>timer.classList.remove('show');
function speakUS(text){if(!('speechSynthesis' in window)){alert('Practice voice is not available in this browser.');return;}stopMedia();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.92;const vv=speechSynthesis.getVoices();u.voice=vv.find(v=>/en-US/i.test(v.lang)&&/natural|samantha|ava|jenny|aria|zira|google us english/i.test(v.name))||vv.find(v=>/en-US/i.test(v.lang))||null;speechSynthesis.speak(u)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-speak]');if(b){e.stopPropagation();speakUS(b.dataset.speak)}});
window.addEventListener('load',()=>{const idx=screens.findIndex(s=>'#'+s.dataset.id===location.hash);go(idx>=0?idx:0)});


// Revised 4: Evidence = source micro-clip; WHY = transcript of the same clip.
document.addEventListener('click',e=>{
  const eb=e.target.closest('.evidence-btn');
  if(eb){
    e.stopPropagation();
    const row=eb.closest('.extract-row, .capture-box, .reveal-target');
    if(!row)return;
    document.querySelectorAll('.evidence-audio-wrap.show').forEach(x=>{if(!row.contains(x))x.classList.remove('show')});
    document.querySelectorAll('.evidence-panel.show').forEach(x=>{if(!row.contains(x))x.classList.remove('show')});
    const p=row.querySelector('.evidence-panel'), w=row.querySelector('.evidence-audio-wrap'), a=w&&w.querySelector('audio');
    if(p)p.classList.add('show');
    if(w)w.classList.toggle('show');
    if(a){document.querySelectorAll('audio').forEach(x=>{if(x!==a){try{x.pause()}catch(_){}}});a.currentTime=0;a.play().catch(()=>{});}
    return;
  }
  const wb=e.target.closest('.why-btn');
  if(wb){
    e.stopPropagation();
    const row=wb.closest('.extract-row, .capture-box, .reveal-target'); if(!row)return;
    const p=row.querySelector('.evidence-panel'), t=row.querySelector('.why-text');
    if(p)p.classList.add('show'); if(t)t.classList.toggle('show'); return;
  }
});


// E-LEAP hosted facade (integration-only; lesson content unchanged)
(function(){
  const RESOURCE_ID='res-objective-first-b2-u03-l02';
  const ACTIVITY_MAP={"s03":{"default":"res-objective-first-b2-u03-l02-a01-review"},"s04":{"listen":"res-objective-first-b2-u03-l02-a02a-listen","build":"res-objective-first-b2-u03-l02-a02b-build"},"s05":{"task":"res-objective-first-b2-u03-l02-a03a-task","elicit":"res-objective-first-b2-u03-l02-a03b-elicit","apply":"res-objective-first-b2-u03-l02-a03c-apply"},"s06":{"choose":"res-objective-first-b2-u03-l02-a04a-choose","build":"res-objective-first-b2-u03-l02-a04b-build","present":"res-objective-first-b2-u03-l02-a04c-present"},"s07":{"default":"res-objective-first-b2-u03-l02-a05-accuracy"},"s08":{"default":"res-objective-first-b2-u03-l02-a06-life"},"s09":{"task":"res-objective-first-b2-u03-l02-a07a-task","pattern":"res-objective-first-b2-u03-l02-a07b-pattern","use":"res-objective-first-b2-u03-l02-a07c-use"},"s11":{"strategy":"res-objective-first-b2-u03-l02-a08a-strategy","prefix":"res-objective-first-b2-u03-l02-a08b-prefix","suffix":"res-objective-first-b2-u03-l02-a08c-suffix"},"s12":{"default":"res-objective-first-b2-u03-l02-a09-wordformation-reading"},"s13":{"strategy":"res-objective-first-b2-u03-l02-a10a-kwt-strategy","practice":"res-objective-first-b2-u03-l02-a10b-kwt-practice"},"s15":{"concept":"res-objective-first-b2-u03-l02-a11a-prep-concept","practice":"res-objective-first-b2-u03-l02-a11b-prep-practice","map":"res-objective-first-b2-u03-l02-a11c-prep-map"},"s16":{"default":"res-objective-first-b2-u03-l02-a12-meaning-form"},"s17":{"default":"res-objective-first-b2-u03-l02-a13-exit"}};
  let mode='student';
  function activeTabId(){const s=screens[current];const b=s?.querySelector('.tab.active');return b?.dataset?.tab||'default'}
  function activityId(){const sid=screens[current]?.dataset?.id||'';const map=ACTIVITY_MAP[sid];return map?(map[activeTabId()]||map.default||Object.values(map)[0]):null}
  function activeRoot(){const s=screens[current];return s?.querySelector('.panel.active')||s}
  function snapshot(){const root=activeRoot();if(!root)return {inputs:[]};const inputs=[...root.querySelectorAll('input,select,textarea')].map((x,i)=>({name:x.name||x.id||`field-${i+1}`,type:(x.type||x.tagName||'text').toLowerCase(),value:(x.type==='checkbox'||x.type==='radio')?(x.checked?x.value||true:''):x.value,checked:(x.type==='checkbox'||x.type==='radio')?!!x.checked:undefined}));return {inputs}}
  function grade(mark=false){const root=activeRoot();if(!root)return null;let total=0,correct=0,answered=0;root.querySelectorAll('.reveal-target[data-answer]').forEach(it=>{const ctl=it.querySelector('input,select');if(!ctl)return;total++;const val=(ctl.value||'').trim().toLowerCase().replace(/\s+/g,' ');if(val)answered++;const acc=(it.dataset.answer||'').toLowerCase().split('/').map(x=>x.trim());const ok=acc.includes(val);if(ok)correct++;if(mark)it.style.outline=ok?'3px solid #5ba064':'3px solid #c86a5f'});if(!total)return null;return {correctCount:correct,totalCount:total,answeredCount:answered,percentage:Math.round(correct/total*100),score:correct/total}}
  function setMode(m){mode=String(m||'student').toLowerCase();document.body.classList.remove('teacher','admin','student','guest','presentation');document.body.classList.add(mode);document.body.dataset.mode=mode;return true}
  function setScreen(target){let idx=-1;if(typeof target==='number')idx=target;else{const t=String(target||'');idx=screens.findIndex(s=>s.dataset.id===t||'#'+s.dataset.id===t)}if(idx<0||idx>=screens.length)return false;go(idx);return true}
  function setActivity(id){for(const [sid,tabs] of Object.entries(ACTIVITY_MAP)){for(const [tab,aid] of Object.entries(tabs)){if(aid===id){if(!setScreen(sid))return false;if(tab!=='default'){const s=screens[current],b=s.querySelector(`.tab[data-tab="${tab}"]`);if(b)b.click()}return true}}}return false}
  function state(){const sid=screens[current]?.dataset?.id||null;const a=grade(false);return {resourceId:RESOURCE_ID,activityId:activityId(),screen:{id:sid,index:current,tab:activeTabId()},response:snapshot(),assessment:a,state:{revealArmed,mode},capabilities:{check:true,reset:true,reveal:true,submit:true,score:true,next:true,previous:true}}}
  function command(action){const key=String(action||'').toLowerCase();if(key==='check'){document.getElementById('checkBtn')?.click();return state()}if(key==='reset'){document.getElementById('resetBtn')?.click();return state()}if(key==='reveal'||key==='show-answer'){if(!revealArmed)document.getElementById('revealBtn')?.click();return state()}if(key==='submit'){return state()}if(key==='score'){grade(true);return state()}if(key==='next'){go(current+1);return state()}if(key==='previous'){go(current-1);return state()}return false}
  window.ELEAPApp={setMode,getMode:()=>mode,getActivityState:state,command,setScreen,setActivity,getResourceId:()=>RESOURCE_ID,getScreenCount:()=>screens.length};
  window.dispatchEvent(new CustomEvent('ELEAP_APP_READY'));
})();
