(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const role=()=>localStorage.getItem('e-leap-preview-role')||'guest';
  const ACTIVE_KEY='e-leap-active-assignment-v1';
  const EVENTS_KEY='e-leap-learning-events';
  const api=async(path,options={})=>{const r=await fetch(`/api/research${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||`Request failed (${r.status})`);return d};
  const readEvents=()=>{try{return JSON.parse(localStorage.getItem(EVENTS_KEY)||'[]')}catch{return[]}};
  const readActive=()=>{try{return JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null')}catch{return null}};
  const writeActive=v=>{try{if(v)localStorage.setItem(ACTIVE_KEY,JSON.stringify(v));else localStorage.removeItem(ACTIVE_KEY)}catch{}};
  function begin(a){writeActive({assignmentId:String(a.assignment_id),resourceId:String(a.resource_id),startedAt:new Date().toISOString()})}
  function evidence(a){
    const active=readActive();
    const start=active&&String(active.assignmentId)===String(a.assignment_id)?new Date(active.startedAt||0).getTime():0;
    const rows=readEvents().filter(e=>String(e?.resourceId||'')===String(a.resource_id)&&new Date(e?.occurredAt||0).getTime()>=start);
    const submits=rows.filter(e=>e?.eventType==='response.submitted');
    const checks=rows.filter(e=>e?.eventType==='attempt.checked');
    const latestScore=[...submits,...checks].map(e=>Number(e?.payload?.score??e?.payload?.grading?.score)).filter(Number.isFinite).at(-1);
    return {kind:'interactive-lesson',resourceId:a.resource_id,activityId:a.activity_id||null,startedAt:active?.startedAt||null,completedAt:new Date().toISOString(),eventCount:rows.length,submitCount:submits.length,latestScore:Number.isFinite(latestScore)?latestScore:null,events:rows.slice(-120).map(e=>({eventId:e.eventId,eventType:e.eventType,occurredAt:e.occurredAt,activityId:e.activityId||null,payload:e.payload||{}}))};
  }
  async function submitAssignment(a,btn){
    const proof=evidence(a);
    if(!proof.eventCount){alert('Open the lesson and complete the homework before submitting it.');return}
    if(!confirm(`Submit “${a.title}” now? This creates one homework attempt.`))return;
    btn.disabled=true;const old=btn.textContent;btn.textContent='Submitting…';
    try{
      await api('/submissions',{method:'POST',body:JSON.stringify({assignmentId:a.assignment_id,response:proof})});
      writeActive(null);btn.textContent='Submitted';
      document.querySelector('#mainNav [data-nav="assignments"]')?.click();
    }catch(e){btn.disabled=false;btn.textContent=old;alert(e.message)}
  }
  async function decorate(){
    if(role()!=='student')return;
    const title=document.getElementById('pageTitle')?.textContent||'';
    if(!['My Assignments','Homework'].includes(title))return;
    let asgs=[];try{asgs=(await api('/assignments')).assignments||[]}catch{return}
    const cards=[...document.querySelectorAll('#content .assignment-card')];
    cards.forEach((card,i)=>{
      const a=asgs[i];if(!a||card.dataset.assignmentBridge==='1')return;card.dataset.assignmentBridge='1';
      const open=card.querySelector('button.btn:not([data-do]),button[data-open-lesson]');
      if(open&&/open lesson/i.test(open.textContent||''))open.addEventListener('click',()=>begin(a),{capture:true});
      const due=a.deadline?new Date(a.deadline).getTime():null,closed=due&&Date.now()>due&&a.late_policy==='closed';
      if(closed)return;
      const submit=document.createElement('button');submit.type='button';submit.className='btn primary';submit.textContent='Submit Homework';submit.dataset.assignmentSubmit='1';submit.onclick=()=>submitAssignment(a,submit);
      const doBtn=card.querySelector('[data-do]');if(doBtn)doBtn.before(submit);else card.append(submit);
    });
  }
  let t=null;const obs=new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>decorate().catch(console.warn),100)});obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});setTimeout(()=>decorate().catch(console.warn),350);
})();
