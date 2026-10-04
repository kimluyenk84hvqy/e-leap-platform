export class UnifiedLessonControls{
  constructor({frame,role='guest',resourceId=null,onPresentationChange=null,canEdit=false}){
    this.frame=frame;this.role=role;this.resourceId=resourceId;this.onPresentationChange=onPresentationChange;this.canEdit=canEdit;this.presentation=false;this.timer=null;this.timerSeconds=30;this.responses=[];
    this.hostbar=document.querySelector('.hostbar');
    this.roleBadge=document.getElementById('roleBadge');
    this.presentationBtn=document.getElementById('presentationToggle');
    this._build();this.sync();
  }
  _build(){
    if(!this.hostbar)return;
    document.getElementById('unifiedLessonControls')?.remove();
    const wrap=document.createElement('div');wrap.id='unifiedLessonControls';wrap.className='unified-controls';
    wrap.innerHTML=`
      <button id="hostTimerBtn" type="button">⏱ Timer</button>
      <button id="hostResponsesBtn" type="button">▦ Responses <span id="hostResponseCount" class="count">0</span></button>
      <a id="hostEditBtn" href="../studio/index.html" target="_blank" rel="noopener">Edit in Studio</a>
    `;
    const spacer=this.hostbar.querySelector('.spacer');
    this.hostbar.insertBefore(wrap,spacer?.nextSibling||this.roleBadge||null);
    this.timerBtn=wrap.querySelector('#hostTimerBtn');this.responsesBtn=wrap.querySelector('#hostResponsesBtn');this.editBtn=wrap.querySelector('#hostEditBtn');this.countEl=wrap.querySelector('#hostResponseCount');
    this.timerBtn.onclick=()=>this.openTimer();this.responsesBtn.onclick=()=>this.openResponses();
    if(this.presentationBtn)this.presentationBtn.onclick=()=>this.setPresentation(!this.presentation);
    this._ensureModal();
  }
  _ensureModal(){
    if(document.getElementById('hostUtilityModal'))return;
    const modal=document.createElement('div');modal.id='hostUtilityModal';modal.className='host-modal';modal.hidden=true;
    modal.innerHTML=`<div class="host-modal-card"><button id="hostModalClose" class="host-modal-close" type="button">×</button><div id="hostModalBody"></div></div>`;
    document.body.appendChild(modal);modal.querySelector('#hostModalClose').onclick=()=>this.closeModal();modal.onclick=e=>{if(e.target===modal)this.closeModal()};
  }
  _label(){return this.presentation?'Presentation':({guest:'Guest practice',student:'Student',teacher:'Teacher',admin:'Admin'}[this.role]||'Guest practice')}
  sync(){
    const canTeach=['teacher','admin'].includes(this.role);
    if(this.roleBadge)this.roleBadge.textContent=this._label();
    if(this.presentationBtn){this.presentationBtn.hidden=!canTeach;this.presentationBtn.textContent=this.presentation?'Exit Presentation':'Presentation';this.presentationBtn.setAttribute('aria-pressed',this.presentation?'true':'false')}
    if(this.timerBtn)this.timerBtn.hidden=!canTeach;
    if(this.responsesBtn)this.responsesBtn.hidden=!canTeach;
    if(this.editBtn)this.editBtn.hidden=!(this.role==='admin'||this.canEdit);
    document.getElementById('host')?.classList.toggle('presentation',this.presentation);
  }
  setPresentation(on){if(!['teacher','admin'].includes(this.role))return;this.presentation=!!on;this.sync();this.onPresentationChange?.(this.presentation)}
  addResponse(evt){if(!evt)return;this.responses.push(evt);if(this.responses.length>200)this.responses.shift();if(this.countEl)this.countEl.textContent=String(this.responses.filter(x=>x.eventType==='response.submitted').length)}
  openResponses(){
    const body=document.getElementById('hostModalBody');const submitted=this.responses.filter(x=>x.eventType==='response.submitted');
    body.innerHTML=`<h2>Responses</h2><p class="host-muted">All submitted responses from this lesson/session appear here.</p>${submitted.length?submitted.slice().reverse().map((r,i)=>`<div class="host-response"><b>${r.context?.participantId||'Learner'}</b><span>${r.activityId||r.itemId||'Activity'}</span><small>${new Date(r.timestamp||Date.now()).toLocaleTimeString()}</small></div>`).join(''):'<div class="host-empty">No submitted responses yet.</div>'}`;
    this.openModal();
  }
  openTimer(){
    const body=document.getElementById('hostModalBody');
    body.innerHTML=`<h2>Classroom Timer</h2><div id="hostTimerDisplay" class="host-timer-display">${this.timerSeconds}</div><div class="host-timer-actions"><button data-sec="30">30s</button><button data-sec="60">60s</button><button data-sec="120">2m</button><button id="hostTimerStart">Start</button><button id="hostTimerReset">Reset</button></div>`;
    body.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{this.timerSeconds=Number(b.dataset.sec);body.querySelector('#hostTimerDisplay').textContent=this.timerSeconds});
    body.querySelector('#hostTimerStart').onclick=()=>this.startTimer(body.querySelector('#hostTimerDisplay'));
    body.querySelector('#hostTimerReset').onclick=()=>{clearInterval(this.timer);this.timer=null;this.timerSeconds=30;body.querySelector('#hostTimerDisplay').textContent='30'};
    this.openModal();
  }
  startTimer(display){clearInterval(this.timer);let left=this.timerSeconds;display.textContent=left;this.timer=setInterval(()=>{left--;display.textContent=Math.max(0,left);if(left<=0){clearInterval(this.timer);this.timer=null}},1000)}
  openModal(){const m=document.getElementById('hostUtilityModal');if(m)m.hidden=false}
  closeModal(){const m=document.getElementById('hostUtilityModal');if(m)m.hidden=true}
}
