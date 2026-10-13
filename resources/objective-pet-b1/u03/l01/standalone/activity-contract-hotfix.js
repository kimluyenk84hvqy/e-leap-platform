/* U3.1 activity contract hotfix — scoped marking + submit + activity follow + detailed responses */
(function(){
  'use strict';
  const RESOURCE_ID='res-objective-pet-b1-u03-l01';
  const p=new URLSearchParams(location.search);
  if(p.get('eleapHosted')!=='1')return;

  const role=p.get('eleapRole')||'guest';
  const uid=()=>globalThis.crypto?.randomUUID?.()||`u31-submit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let followPoll=null;
  let applyingRemoteActivity=false;
  let responsesEnhancerInstalled=false;

  function currentScreenNumber(){
    const n=Number(document.body?.dataset?.screen)||parseInt(document.getElementById('screenCounter')?.textContent||'',10);
    return Number.isFinite(n)&&n>0?n:1;
  }

  function scope(){
    const stage=document.getElementById('stage')||document;
    const activeTab=[...stage.querySelectorAll('.tab-panel.active')].find(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
    if(activeTab)return activeTab;
    const activeScreen=[...stage.querySelectorAll('.screen')].find(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
    return activeScreen||stage;
  }

  function actionButton(action){
    const root=scope();
    return [...root.querySelectorAll(`[data-action="${action}"]`)].find(b=>!b.disabled)||null;
  }

  function activityId(){
    const root=scope();
    const explicit=root.querySelector('.controls[data-controls]')?.dataset?.controls;
    if(explicit)return explicit;
    const tabKey=root.dataset?.tabPanel;
    if(tabKey)return `screen-${currentScreenNumber()}-${tabKey}`;
    return `screen-${currentScreenNumber()}`;
  }

  function snapshot(){
    const root=scope();
    const inputs=[...root.querySelectorAll('input,textarea,select')].map((el,n)=>({
      name:el.name||el.id||el.dataset?.dialogue||el.dataset?.jobAction||`field-${n+1}`,
      type:el.type||el.tagName.toLowerCase(),
      value:(el.type==='checkbox'||el.type==='radio')?Boolean(el.checked):el.value
    }));
    const selected=[...root.querySelectorAll('.selected,.placed,.answer-option,.revealed-zone')]
      .slice(0,120)
      .map(el=>(el.dataset?.value||el.dataset?.target||el.textContent||'').trim())
      .filter(Boolean);
    const zones=[...root.querySelectorAll('[data-zone]')].map((el,n)=>({
      zone:el.dataset.zone||`zone-${n+1}`,
      value:(el.dataset.value||el.querySelector('[data-target]')?.dataset?.target||el.textContent||'').trim()
    })).filter(x=>x.value);
    return {inputs,selected,zones};
  }

  function hasResponse(state=snapshot()){
    return state.inputs.some(x=>(x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!=='')||state.selected.length>0||state.zones.length>0;
  }

  function normalizeDetails(raw){
    if(!Array.isArray(raw))return [];
    return raw.map((row,i)=>{
      if(!Array.isArray(row))return {label:`Item ${i+1}`,response:String(row??''),expected:'',isCorrect:null};
      const last=row.at(-1);
      const hasBool=typeof last==='boolean';
      let label=`Item ${i+1}`,response='',expected='',isCorrect=hasBool?last:null;
      if(hasBool&&row.length>=4){
        label=String(row[0]??label);
        response=row[1]??'';
        expected=row[2]??'';
      }else if(hasBool&&row.length>=3){
        response=row[0]??'';
        expected=row[1]??'';
      }else{
        response=row[0]??'';
        expected=row[1]??'';
      }
      return {label,response:String(response??''),expected:String(expected??''),isCorrect};
    });
  }

  function collectedAssessment(){
    try{
      if(typeof window.collectActivity!=='function')return null;
      const r=window.collectActivity(activityId());
      const total=Number(r?.total),correct=Number(r?.correct);
      if(!Number.isFinite(total)||total<=0||!Number.isFinite(correct))return null;
      const details=normalizeDetails(r?.answers);
      const answered=details.length
        ? details.filter(x=>String(x.response??'').trim()!==''&&String(x.response??'').toLowerCase()!=='bank').length
        : Math.min(total,snapshot().inputs.filter(x=>String(x.value??'').trim()!=='').length+snapshot().selected.length+snapshot().zones.length);
      return {
        isCorrect:correct===total,
        score:correct/total,
        correctCount:correct,
        answeredCount:Math.min(total,answered),
        wrongCount:Math.max(0,Math.min(total,answered)-correct),
        unansweredCount:Math.max(0,total-Math.min(total,answered)),
        totalCount:total,
        details,
        source:'u3.1-collector'
      };
    }catch(_){return null;}
  }

  function assessment(){
    const direct=collectedAssessment();
    if(direct)return direct;
    const root=scope();
    const scoreBtn=actionButton('score');
    if(!scoreBtn)return null;
    const statusText=[...root.querySelectorAll('.status')].map(x=>x.textContent||'').join(' ');
    const m=statusText.match(/(\d+)\s*\/\s*(\d+)/);
    if(!m)return null;
    const correct=Number(m[1]),total=Number(m[2]);
    if(!total)return null;
    const response=snapshot();
    const answeredInputs=response.inputs.filter(x=>(x.type==='checkbox'||x.type==='radio')?x.value===true:String(x.value??'').trim()!=='').length;
    const answered=Math.min(total,answeredInputs+response.selected.length+response.zones.length);
    return {
      isCorrect:correct===total,
      score:correct/total,
      correctCount:correct,
      answeredCount:answered,
      wrongCount:Math.max(0,answered-correct),
      unansweredCount:Math.max(0,total-answered),
      totalCount:total,
      details:[],
      source:'u3.1-activity-scoped-hotfix'
    };
  }

  function capabilities(){
    const assessable=Boolean(actionButton('score'));
    return {
      check:Boolean(actionButton('check')),
      reset:Boolean(actionButton('reset')),
      reveal:Boolean(actionButton('show')),
      submit:role==='student',
      score:assessable,
      assessable
    };
  }

  function clickAction(action){
    const btn=actionButton(action);
    if(!btn)return false;
    btn.click();
    return true;
  }

  function armReveal(){
    const btn=actionButton('show');
    if(!btn)return false;
    btn.click();
    const armed=scope().querySelector('.reveal-mode');
    document.body.classList.toggle('platform-reveal-armed',Boolean(armed));
    return true;
  }

  function emitSubmit(){
    const response=snapshot();
    if(!hasResponse(response))return false;
    const grading=assessment();
    const evt={
      eventId:uid(),
      eventType:'response.submitted',
      occurredAt:new Date().toISOString(),
      resourceId:RESOURCE_ID,
      activityId:activityId(),
      context:{
        role:'student',
        sessionId:p.get('sessionId')||null,
        classId:p.get('classId')||null,
        participantId:p.get('participantId')||null,
        joinCode:p.get('joinCode')||null
      },
      payload:{
        response,
        score:grading?.score??null,
        isCorrect:grading?.isCorrect??null,
        correctCount:grading?.correctCount??null,
        answeredCount:grading?.answeredCount??null,
        wrongCount:grading?.wrongCount??null,
        unansweredCount:grading?.unansweredCount??null,
        totalCount:grading?.totalCount??null,
        details:grading?.details||[],
        source:'u3.1-activity-submit-hotfix-v2'
      }
    };
    try{window.parent.postMessage({type:'e-leap:learning-event',event:evt},location.origin);}catch(_){return false;}
    return true;
  }

  function tabKeyFromActivity(targetActivityId){
    if(!targetActivityId)return null;
    const m=String(targetActivityId).match(/^screen-(\d+)-(.+)$/);
    if(!m)return null;
    if(Number(m[1])!==currentScreenNumber())return null;
    return m[2]||null;
  }

  function applyRemoteActivity(targetActivityId){
    const key=tabKeyFromActivity(targetActivityId);
    if(!key||activityId()===targetActivityId)return false;
    const panel=document.querySelector(`[data-tab-panel="${CSS.escape(key)}"]`);
    if(!panel)return false;
    const cut=key.lastIndexOf('-');
    if(cut<1)return false;
    const groupId=key.slice(0,cut);
    const tabNo=key.slice(cut+1);
    const tabs=document.querySelector(`[data-tabs="${CSS.escape(groupId)}"]`);
    const btn=tabs?.querySelector(`button[data-tab="${CSS.escape(tabNo)}"]`);
    if(!btn)return false;
    applyingRemoteActivity=true;
    try{btn.click();return true;}finally{setTimeout(()=>{applyingRemoteActivity=false;},80);}
  }

  async function pollTeacherActivity(){
    if(role!=='student'||applyingRemoteActivity)return;
    const sessionId=p.get('sessionId');
    if(!sessionId)return;
    try{
      const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(sessionId)}&control=1`,{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)return;
      const d=await r.json();
      const targetActivity=d?.control?.activityId||null;
      if(targetActivity)applyRemoteActivity(targetActivity);
    }catch(_){}
  }

  function installActivityFollow(){
    if(role!=='student'||!p.get('sessionId')||followPoll)return;
    pollTeacherActivity();
    followPoll=setInterval(pollTeacherActivity,650);
    addEventListener('pagehide',()=>{clearInterval(followPoll);followPoll=null;},{once:true});
  }

  function parseObj(v){
    if(v&&typeof v==='object')return v;
    if(typeof v==='string'){try{return JSON.parse(v)}catch(_){return {};}}
    return {};
  }

  function detailRowsFromEvent(row){
    const meta=parseObj(row?.metadata);
    const payload=parseObj(meta?.payload);
    const details=Array.isArray(payload?.details)?payload.details:[];
    if(details.length)return details;
    const response=parseObj(row?.answer||payload?.response);
    const fallback=[];
    (response.inputs||[]).forEach((x,i)=>{
      const v=(x.type==='checkbox'||x.type==='radio')?(x.value?'selected':'not selected'):x.value;
      if(String(v??'').trim()!=='')fallback.push({label:x.name||`Field ${i+1}`,response:String(v??''),expected:'',isCorrect:null});
    });
    (response.selected||[]).forEach((v,i)=>fallback.push({label:`Selection ${i+1}`,response:String(v),expected:'',isCorrect:null}));
    (response.zones||[]).forEach((z,i)=>fallback.push({label:z.zone||`Zone ${i+1}`,response:String(z.value??''),expected:'',isCorrect:null}));
    return fallback;
  }

  function scoreText(row){
    const meta=parseObj(row?.metadata),payload=parseObj(meta?.payload);
    const score=Number(row?.score??payload?.score);
    const c=Number(payload?.correctCount),t=Number(payload?.totalCount);
    if(Number.isFinite(c)&&Number.isFinite(t)&&t>0)return `${c}/${t} (${Math.round((c/t)*100)}%)`;
    if(Number.isFinite(score))return score>=0&&score<=1?`${Math.round(score*100)}%`:String(score);
    return '—';
  }

  async function renderDetailedResponses(){
    if(!['teacher','admin'].includes(role))return;
    const sessionId=p.get('sessionId');
    if(!sessionId)return;
    let parentDoc;
    try{parentDoc=window.parent.document;}catch(_){return;}
    const body=parentDoc.getElementById('hostModalBody');
    if(!body)return;
    try{
      const [pr,er]=await Promise.all([
        fetch(`/api/research/participants?sessionId=${encodeURIComponent(sessionId)}`,{credentials:'same-origin',cache:'no-store'}),
        fetch(`/api/research/events?sessionId=${encodeURIComponent(sessionId)}`,{credentials:'same-origin',cache:'no-store'})
      ]);
      if(!pr.ok||!er.ok)return;
      const pd=await pr.json(),ed=await er.json();
      const participants=Array.isArray(pd?.participants)?pd.participants:[];
      const events=(Array.isArray(ed?.events)?ed.events:[]).filter(x=>x?.event_type==='response.submitted');
      const names=new Map(participants.map(x=>[String(x.participant_id),x.display_name||x.participant_code||`Student ${x.participant_id}`]));
      const grouped=new Map();
      for(const e of events){
        const pid=String(e.participant_id??'unknown');
        if(!grouped.has(pid))grouped.set(pid,[]);
        grouped.get(pid).push(e);
      }
      const joined=participants.length;
      const submittedPeople=[...grouped.keys()].filter(x=>x!=='unknown').length;
      const cards=[...new Set([...participants.map(x=>String(x.participant_id)),...grouped.keys()])].map(pid=>{
        const rows=(grouped.get(pid)||[]).slice().reverse();
        const name=names.get(pid)||`Student ${pid}`;
        const attempts=rows.map((r,idx)=>{
          const details=detailRowsFromEvent(r);
          const detailHtml=details.length?details.map((d,i)=>{
            const state=d.isCorrect===true?'✓ Correct':d.isCorrect===false?'✗ Wrong':'• Answer';
            const cls=d.isCorrect===true?'#18794e':d.isCorrect===false?'#b42318':'#52645e';
            const expected=d.expected?`<span style="color:#60756e"> · Key: <b>${esc(d.expected)}</b></span>`:'';
            return `<div style="display:grid;grid-template-columns:minmax(90px,.7fr) minmax(140px,1.6fr) auto;gap:10px;align-items:start;padding:8px 0;border-top:1px solid #edf2ef"><b>${esc(d.label||`Item ${i+1}`)}</b><span>${esc(d.response||'—')}${expected}</span><strong style="color:${cls};white-space:nowrap">${state}</strong></div>`;
          }).join(''):'<div class="host-muted" style="padding:8px 0">No item-level answer detail was stored for this older attempt.</div>';
          return `<details style="margin:9px 0"><summary style="cursor:pointer;font-weight:800">${esc(r.activity_id||'activity')} · Submit ${rows.length-idx} · Score ${esc(scoreText(r))}</summary><div style="margin-top:7px">${detailHtml}</div></details>`;
        }).join('');
        return `<article class="host-response-card"><div class="host-response-head"><b>${esc(name)}</b><span>${rows.length?'Submitted':'Joined · not submitted'}</span><small>${rows.length} submit${rows.length===1?'':'s'}</small></div>${attempts||'<div class="host-muted" style="margin-top:8px">No submission yet.</div>'}</article>`;
      }).join('');
      body.innerHTML=`<div class="host-modal-title-row"><div><h2>Responses · Detailed</h2><p class="host-muted">Student answers, correctness and every Submit attempt. Check and Reset do not create attempts.</p></div><span class="host-response-total">${events.length} submit${events.length===1?'':'s'}</span></div><div class="metric-row" style="margin:14px 0"><div class="metric"><b>${joined}</b><span>Joined</span></div><div class="metric"><b>${submittedPeople}</b><span>Submitted</span></div><div class="metric"><b>${Math.max(0,joined-submittedPeople)}</b><span>Not submitted</span></div></div>${cards||'<div class="host-empty">No students have joined this live session yet.</div>'}`;
    }catch(_){}
  }

  function installResponsesEnhancer(){
    if(responsesEnhancerInstalled||!['teacher','admin'].includes(role)||!p.get('sessionId'))return;
    let parentDoc;
    try{parentDoc=window.parent.document;}catch(_){return;}
    responsesEnhancerInstalled=true;
    parentDoc.addEventListener('click',(e)=>{
      if(e.target?.closest?.('#hostResponsesBtn')){
        setTimeout(renderDetailedResponses,250);
        setTimeout(renderDetailedResponses,850);
      }
    },true);
  }

  function install(){
    const api=window.ELEAP_LESSON_HOST_API;
    if(!api)return false;
    api.getActivityState=function(){
      return {
        screenNumber:currentScreenNumber(),
        activityId:activityId(),
        response:snapshot(),
        assessment:assessment(),
        capabilities:capabilities()
      };
    };
    api.command=function(action){
      if(action==='check')return clickAction('check');
      if(action==='reset'){document.body.classList.remove('platform-reveal-armed');return clickAction('reset');}
      if(action==='reveal')return ['teacher','admin'].includes(role)?armReveal():false;
      if(action==='submit'){
        if(role!=='student')return false;
        const native=actionButton('submit');
        if(native)native.click();
        return emitSubmit();
      }
      return false;
    };
    installActivityFollow();
    installResponsesEnhancer();
    window.ELEAP_U31_ACTIVITY_HOTFIX={installed:true,activityId:activityId(),activityFollow:role==='student',detailedResponses:['teacher','admin'].includes(role),at:Date.now()};
    return true;
  }

  if(!install()){
    let tries=0;
    const t=setInterval(()=>{if(install()||++tries>40)clearInterval(t);},100);
  }
})();