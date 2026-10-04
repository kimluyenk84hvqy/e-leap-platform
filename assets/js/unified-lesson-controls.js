/** E-LEAP Unified Lesson Controls — R4 RC1.1
 * Host-owned, role-aware actions shared by Golden References and future lessons.
 * Universal contract: Check = grade current state; Reset = clear current activity;
 * Submit = save current attempt state. Guest practice never writes learner state.
 */
import {normalizeAssessment,scoreText,detailText,AttemptTracker} from './grading-core.js';
const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const asTime=(v)=>{try{return new Date(v||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return ''}};

export class UnifiedLessonControls{
  constructor({frame,role='guest',resourceId=null,onPresentationChange=null,canEdit=false,onSubmit=null,studentId=null}={}){
    this.frame=frame;this.role=role;this.resourceId=resourceId;this.onPresentationChange=onPresentationChange;this.canEdit=canEdit;this.onSubmit=onSubmit;
    this.presentation=false;this.timer=null;this.timerSeconds=30;this.responses=[];this.lastSubmitAt=0;this.currentGrading=null;this.lastActivityId=null;this.activityCaps=null;
    this.attempts=new AttemptTracker({resourceId,role,studentId});
    this.hostbar=document.querySelector('.hostbar');this.roleBadge=document.getElementById('roleBadge');this.legacyPresentationBtn=document.getElementById('presentationToggle');
    this._build();this.sync();this._startActivitySync();
  }
  _api(){try{return this.frame?.contentWindow?.ELEAP_LESSON_HOST_API||null}catch(_){return null}}
  _build(){
    if(!this.hostbar)return;
    document.getElementById('unifiedLessonControls')?.remove();if(this.legacyPresentationBtn)this.legacyPresentationBtn.hidden=true;
    const wrap=document.createElement('div');wrap.id='unifiedLessonControls';wrap.className='unified-controls';
    wrap.innerHTML=`
      <button id="hostCheckBtn" type="button">Check</button>
      <button id="hostResetBtn" type="button">Reset</button>
      <button id="hostSubmitBtn" class="primary host-submit" type="button">Submit</button>
      <span id="hostScorePill" class="host-score-pill" hidden></span>
      <span id="hostGuestPractice" class="host-practice-pill">Guest Practice · not saved</span>
      <button id="hostPresentationBtn" class="primary" type="button">Presentation</button>
      <button id="hostTimerBtn" type="button">⏱ Timer</button>
      <button id="hostResponsesBtn" type="button">▦ Responses <span id="hostResponseCount" class="count">0</span></button>
      <a id="hostEditBtn" href="../studio/index.html" target="_blank" rel="noopener">Edit in Studio</a>`;
    const anchor=this.roleBadge||this.hostbar.querySelector('.spacer')?.nextSibling||null;this.hostbar.insertBefore(wrap,anchor);
    this.checkBtn=wrap.querySelector('#hostCheckBtn');this.resetBtn=wrap.querySelector('#hostResetBtn');this.submitBtn=wrap.querySelector('#hostSubmitBtn');this.scorePill=wrap.querySelector('#hostScorePill');this.practicePill=wrap.querySelector('#hostGuestPractice');this.presentationBtn=wrap.querySelector('#hostPresentationBtn');this.timerBtn=wrap.querySelector('#hostTimerBtn');this.responsesBtn=wrap.querySelector('#hostResponsesBtn');this.editBtn=wrap.querySelector('#hostEditBtn');this.countEl=wrap.querySelector('#hostResponseCount');
    this.checkBtn.onclick=()=>this.checkCurrent();this.resetBtn.onclick=()=>this.resetCurrent();this.submitBtn.onclick=()=>this.submitCurrent();this.presentationBtn.onclick=()=>this.setPresentation(!this.presentation);this.timerBtn.onclick=()=>this.openTimer();this.responsesBtn.onclick=()=>this.openResponses();this._ensureModal();
  }
  _ensureModal(){if(document.getElementById('hostUtilityModal'))return;const modal=document.createElement('div');modal.id='hostUtilityModal';modal.className='host-modal';modal.hidden=true;modal.innerHTML=`<div class="host-modal-card"><button id="hostModalClose" class="host-modal-close" type="button" aria-label="Close">×</button><div id="hostModalBody"></div></div>`;document.body.appendChild(modal);modal.querySelector('#hostModalClose').onclick=()=>this.closeModal();modal.onclick=e=>{if(e.target===modal)this.closeModal()};}
  _label(){return this.presentation?'Presentation':({guest:'Guest Practice',student:'Student',teacher:'Teacher',admin:'Admin'}[this.role]||'Guest Practice')}
  sync(){
    const canTeach=['teacher','admin'].includes(this.role),isStudent=this.role==='student',isGuest=this.role==='guest',practice=isStudent||isGuest;
    if(this.roleBadge){this.roleBadge.textContent=this._label();this.roleBadge.dataset.role=this.role;}if(this.legacyPresentationBtn)this.legacyPresentationBtn.hidden=true;
    if(this.checkBtn)this.checkBtn.hidden=!practice;if(this.resetBtn)this.resetBtn.hidden=!practice;if(this.submitBtn)this.submitBtn.hidden=!isStudent;if(this.practicePill)this.practicePill.hidden=!isGuest;
    if(this.presentationBtn){this.presentationBtn.hidden=!canTeach;this.presentationBtn.textContent=this.presentation?'Exit Presentation':'Presentation';this.presentationBtn.setAttribute('aria-pressed',this.presentation?'true':'false')}
    if(this.timerBtn)this.timerBtn.hidden=!canTeach;if(this.responsesBtn)this.responsesBtn.hidden=!canTeach;if(this.editBtn)this.editBtn.hidden=!(this.role==='admin'||this.canEdit);
    document.getElementById('host')?.classList.toggle('presentation',this.presentation);this._syncCount();setTimeout(()=>this._syncActivityControls(),0);
  }
  _activityCapabilities(){
    const state=this._inspect();
    const caps=state?.capabilities||{};
    return {
      activityId:state?.activityId||null,
      check:caps.check!==false && (caps.check===true || !!state?.assessment?.totalCount),
      reset:caps.reset!==false,
      submit:caps.submit!==false,
      score:caps.score!==false && (caps.score===true || !!state?.assessment?.totalCount),
      assessable:caps.assessable===true || !!state?.assessment?.totalCount
    };
  }
  _syncActivityControls(){
    if(!['student','guest'].includes(this.role))return;
    const c=this._activityCapabilities();this.activityCaps=c;
    if(this.checkBtn)this.checkBtn.hidden=!c.check;
    if(this.resetBtn)this.resetBtn.hidden=!c.reset;
    if(this.submitBtn)this.submitBtn.hidden=!(this.role==='student'&&c.submit);
    if(this.lastActivityId!==c.activityId){this.lastActivityId=c.activityId;this.currentGrading=null;if(this.scorePill){this.scorePill.hidden=true;this.scorePill.textContent='';}if(this.submitBtn){this.submitBtn.textContent='Submit';this.submitBtn.disabled=false;}}
  }
  _startActivitySync(){
    const tick=()=>{try{this._syncActivityControls()}catch(_){}};
    setTimeout(tick,120);this.activitySyncTimer=setInterval(tick,500);
    this.frame?.addEventListener?.('load',()=>setTimeout(tick,120));
  }
  setPresentation(on){if(!['teacher','admin'].includes(this.role))return;this.presentation=!!on;this.sync();this.onPresentationChange?.(this.presentation)}
  _command(action){try{return this._api()?.command?.(action)===true}catch(_){return false}}
  _inspect(){try{return this._api()?.getActivityState?.()||null}catch(_){return null}}
  _updateScore({submitted=false}={}){
    const state=this._inspect();if(!state){this.currentGrading=null;this.scorePill.hidden=true;return null;}
    const g=normalizeAssessment(state.assessment||{},state.response);this.currentGrading=g;
    if(this.scorePill){this.scorePill.hidden=false;this.scorePill.textContent=scoreText(g,{submitted});this.scorePill.title=detailText(g);}return {state,grading:g};
  }
  checkCurrent(){
    if(!['student','guest'].includes(this.role))return false;
    this._syncActivityControls();if(this.activityCaps?.check===false)return false;
    const ok=this._command('check');
    setTimeout(()=>{const out=this._updateScore();if(!out&&ok)this._showNotice('Checked','This activity does not provide an automatic score.');},80);
    return ok;
  }
  resetCurrent(){
    if(!['student','guest'].includes(this.role))return false;
    this._syncActivityControls();if(this.activityCaps?.reset===false)return false;
    const ok=this._command('reset');
    if(ok){this.currentGrading=null;if(this.scorePill){this.scorePill.hidden=true;this.scorePill.textContent='';}this.submitBtn&&(this.submitBtn.textContent='Submit');return true;}
    this._showNotice('Reset unavailable','This screen has no resettable learner response.');return false;
  }
  submitCurrent(force=false){
    if(this.role!=='student')return false;
    this._syncActivityControls();if(this.activityCaps?.submit===false)return false;
    const before=this._updateScore();
    if(!force && before?.grading?.assessable && before.grading.unansweredCount>0){
      const g=before.grading;const body=document.getElementById('hostModalBody');if(body){body.innerHTML=`<h2>Submit incomplete activity?</h2><p class="host-muted">You have answered <b>${esc(g.answeredCount)}</b> of <b>${esc(g.totalCount)}</b> questions. ${esc(g.unansweredCount)} question(s) are unanswered and will receive 0 points.</p><div class="host-confirm-actions"><button id="hostContinueWork" type="button">Continue working</button><button id="hostSubmitAnyway" class="primary" type="button">Submit anyway</button></div>`;body.querySelector('#hostContinueWork').onclick=()=>this.closeModal();body.querySelector('#hostSubmitAnyway').onclick=()=>{this.closeModal();this.submitCurrent(true)};this.openModal();return false;}
    }
    const ok=this.onSubmit?.() ?? this._command('submit');
    if(ok){
      this.lastSubmitAt=Date.now();setTimeout(()=>{const out=this._updateScore({submitted:true});const activityId=out?.state?.activityId||'activity';this.attempts.recordSubmit(activityId,out?.grading);},60);
      const old=this.submitBtn.textContent;this.submitBtn.textContent='Submitted ✓';this.submitBtn.disabled=true;setTimeout(()=>{if(this.submitBtn){this.submitBtn.textContent=old||'Submit';this.submitBtn.disabled=false}},1100);return true;
    }
    this._showNotice('Nothing to submit on this activity','Add a response first, then submit.');return false;
  }
  _showNotice(title,text){const body=document.getElementById('hostModalBody');if(!body)return;body.innerHTML=`<h2>${esc(title)}</h2><p class="host-muted">${esc(text)}</p>`;this.openModal()}
  setResponses(rows=[]){this.responses=Array.isArray(rows)?rows.filter(Boolean).slice(-500):[];this._syncCount()}
  addResponse(evt){if(!evt)return;this.responses.push(evt);if(this.responses.length>500)this.responses.shift();this._syncCount()}
  _submitted(){
    const raw=this.responses.filter(x=>x?.eventType==='response.submitted'&&x?.resourceId===this.resourceId&&x?.context?.role==='student');
    const latest=new Map();
    raw.forEach((x,i)=>{const participant=this._participant(x);const attempt=x?.payload?.attemptNo||1;const key=`${participant}::${x.activityId||'activity'}::${attempt}`;latest.set(key,{...x,__order:i});});
    return [...latest.values()].sort((a,b)=>(a.__order||0)-(b.__order||0));
  }
  _syncCount(){if(this.countEl)this.countEl.textContent=String(this._submitted().length)}
  _participant(r){return r?.context?.participantId||r?.context?.studentId||r?.studentId||'Student'}
  _responseSummary(r){const response=r?.payload?.response;if(!response)return r?.payload?.submissionType||'Submitted response';const parts=[];if(Array.isArray(response.inputs))response.inputs.filter(x=>x&&(x.value!==''&&x.value!=null||x.checked===true)).slice(0,8).forEach(x=>{const val=(x.type==='checkbox'||x.type==='radio')?(x.value===true?'Selected':x.value):x.value;parts.push(`${x.name||'Field'}: ${val}`)});if(Array.isArray(response.selected)&&response.selected.length)parts.push(`Selected: ${response.selected.slice(0,8).join(', ')}`);return parts.join(' · ')||'Submitted response'}
  openResponses(){const body=document.getElementById('hostModalBody');if(!body)return;const submitted=this._submitted().slice().reverse();const rows=submitted.map(r=>{const g=normalizeAssessment(r?.payload?.grading||{score:r?.payload?.score,correctCount:r?.payload?.correctCount,totalCount:r?.payload?.totalCount,answeredCount:r?.payload?.answeredCount},r?.payload?.response);const score=g.assessable?`<div class="host-response-score">${esc(scoreText(g,{submitted:true}))}<br><small>${esc(detailText(g))}</small></div>`:(r?.payload?.score!=null?`<div class="host-response-score">Score: ${esc(r.payload.score)}</div>`:'');return `<article class="host-response-card"><div class="host-response-head"><b>${esc(this._participant(r))}</b><span>${esc(r.activityId||'Activity')}</span><small>${esc(asTime(r.occurredAt||r.timestamp))}</small></div><div class="host-response-body">${esc(this._responseSummary(r))}</div>${score}</article>`}).join('');body.innerHTML=`<div class="host-modal-title-row"><div><h2>Responses</h2><p class="host-muted">Latest submitted states are shown per event. Repeated Submit stays in the same attempt unless a new attempt is explicitly started.</p></div><span class="host-response-total">${submitted.length} submitted</span></div>${rows||'<div class="host-empty">No student responses submitted yet.</div>'}`;this.openModal()}
  openTimer(){const body=document.getElementById('hostModalBody');if(!body)return;body.innerHTML=`<h2>Classroom Timer</h2><div id="hostTimerDisplay" class="host-timer-display">${this.timerSeconds}</div><div class="host-timer-actions"><button data-sec="30">30s</button><button data-sec="60">60s</button><button data-sec="120">2m</button><button id="hostTimerStart">Start</button><button id="hostTimerReset">Reset</button></div>`;body.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{this.timerSeconds=Number(b.dataset.sec);body.querySelector('#hostTimerDisplay').textContent=this.timerSeconds});body.querySelector('#hostTimerStart').onclick=()=>this.startTimer(body.querySelector('#hostTimerDisplay'));body.querySelector('#hostTimerReset').onclick=()=>{clearInterval(this.timer);this.timer=null;this.timerSeconds=30;body.querySelector('#hostTimerDisplay').textContent='30'};this.openModal()}
  startTimer(display){clearInterval(this.timer);let left=this.timerSeconds;display.textContent=left;this.timer=setInterval(()=>{left--;display.textContent=Math.max(0,left);if(left<=0){clearInterval(this.timer);this.timer=null}},1000)}
  openModal(){const m=document.getElementById('hostUtilityModal');if(m)m.hidden=false}closeModal(){const m=document.getElementById('hostUtilityModal');if(m)m.hidden=true}
}
