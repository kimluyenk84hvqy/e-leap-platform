/**
 * E-LEAP Unified Lesson Controls — stabilization adapter (2026-10-07)
 *
 * Keeps the locked Role Control Contract intact while adding:
 * - server-session role verification (localStorage is never final authority)
 * - automatic Follow Teacher + student navigation lock for an active live session
 * - teacher Responses summary with participation + multi-attempt history
 *
 * Live Class / QR creation code is intentionally NOT modified here.
 */
import {UnifiedLessonControls as BaseUnifiedLessonControls} from './controls/host-control-shell.js';

const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>globalThis.crypto?.randomUUID?.()||`ctl-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const asTime=(v)=>{try{return new Date(v||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return ''}};
const scoreLabel=(v)=>{
  const n=Number(v);
  if(!Number.isFinite(n))return '—';
  return n>=0&&n<=1?`${Math.round(n*100)}%`:String(Math.round(n*100)/100);
};

export class UnifiedLessonControls extends BaseUnifiedLessonControls{
  constructor(opts={}){
    super(opts);
    const q=new URLSearchParams(location.search);
    this.sessionId=q.get('sessionId')||null;
    this.followEnabled=Boolean(this.sessionId&&['teacher','admin'].includes(this.role));
    this._lastTeacherScreen=null;
    this._studentFollowState=false;
    this._studentNavGuard=null;
    this._studentKeyGuard=null;
    this._followTimer=null;
    this._controlPoll=null;
    this._roleVerified=false;

    if(this.dock)this.dock.style.visibility='hidden';
    if(this.roleBadge)this.roleBadge.textContent='Verifying…';

    this._verifyServerRole().then(ok=>{
      if(!ok)return;
      if(this.dock)this.dock.style.visibility='';
      this._roleVerified=true;
      this._installLiveStabilization();
    });
  }

  async _verifyServerRole(){
    let actual='guest';
    try{
      const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
      if(r.ok){
        const d=await r.json();
        actual=d?.user?.role||'guest';
      }
    }catch(_){ actual='guest'; }

    const allowed=new Set(['guest','student','teacher','admin']);
    if(!allowed.has(actual))actual='guest';

    if(actual!==this.role){
      try{localStorage.setItem('e-leap-preview-role',actual)}catch(_){}
      location.reload();
      return false;
    }

    if(this.roleBadge){
      const labels={guest:'Guest Practice',student:'Student',teacher:'Teacher',admin:'Admin'};
      this.roleBadge.textContent=labels[this.role]||'Guest Practice';
    }
    return true;
  }

  sync(){
    super.sync();
    if(this.followBtn)this.followBtn.hidden=Boolean(this.presentation);
  }

  _installLiveStabilization(){
    if(!this.sessionId)return;
    if(['teacher','admin'].includes(this.role))this._installTeacherFollow();
    if(this.role==='student')this._installStudentFollow();
    window.addEventListener('pagehide',()=>this._stopStabilization(),{once:true});
  }

  _stopStabilization(){
    clearInterval(this._followTimer);
    clearInterval(this._controlPoll);
    this._setStudentNavigationLock(false);
  }

  _currentScreenNumber(){
    try{
      const d=this.frame?.contentDocument;
      let n=Number(d?.body?.dataset?.screen);
      if(Number.isFinite(n)&&n>0)return n;
      const active=d?.querySelector?.('.screen.active');
      n=Number(active?.dataset?.screen);
      if(Number.isFinite(n)&&n>0)return n;
      const counter=d?.querySelector?.('#classroomCounter,[data-screen-counter]')?.textContent||'';
      n=parseInt(counter,10);
      if(Number.isFinite(n)&&n>0)return n;
    }catch(_){}
    return null;
  }

  _currentActivityId(){
    try{return this._inspect()?.activityId||null}catch(_){return null}
  }

  async _postTeacherControl(eventType,answer={},activityId=null){
    try{
      const r=await fetch('/api/research/events',{
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          clientEventId:uid(),
          sessionId:this.sessionId,
          activityId:activityId||this._currentActivityId(),
          eventType,
          answer,
          metadata:{source:'e-leap-follow-teacher-v1',resourceId:this.resourceId}
        })
      });
      return r.ok;
    }catch(_){return false}
  }

  _installTeacherFollow(){
    const group=this.dock?.querySelector?.('.unified-classroom');
    if(!group||group.querySelector('#hostFollowTeacherBtn'))return;

    this.followEnabled=true;
    const btn=document.createElement('button');
    btn.id='hostFollowTeacherBtn';
    btn.type='button';
    btn.textContent='Follow Teacher · ON';
    btn.title='Live class: student slides automatically follow the teacher and student slide navigation is locked.';
    btn.disabled=true;
    const live=group.querySelector('#hostLiveBtn');
    group.insertBefore(btn,live||null);
    this.followBtn=btn;

    this._syncFollowButton();
    this._postTeacherControl('teacher.follow',{enabled:true})
      .then(()=>this._publishTeacherNavigation(true));
    this._followTimer=setInterval(()=>this._publishTeacherNavigation(false),650);
  }

  _syncFollowButton(){
    if(!this.followBtn)return;
    this.followBtn.textContent='Follow Teacher · ON';
    this.followBtn.classList.add('is-active');
    this.followBtn.setAttribute('aria-pressed','true');
    this.followBtn.disabled=true;
    this.followBtn.hidden=Boolean(this.presentation);
  }

  async _publishTeacherNavigation(force=false){
    if(!this.followEnabled)return;
    const screenNumber=this._currentScreenNumber();
    if(!screenNumber)return;
    const activityId=this._currentActivityId();
    const key=`${screenNumber}|${activityId||''}`;
    if(!force&&key===this._lastTeacherScreen)return;
    this._lastTeacherScreen=key;
    await this._postTeacherControl('teacher.navigation',{screenNumber,activityId,locked:true},activityId);
  }

  _installStudentFollow(){
    let pill=document.getElementById('hostFollowStatus');
    if(!pill){
      pill=document.createElement('span');
      pill.id='hostFollowStatus';
      pill.className='host-practice-pill';
      pill.textContent='Waiting for teacher…';
      this.dock?.querySelector?.('.unified-activity')?.appendChild(pill);
    }
    this.followStatus=pill;
    this._pollTeacherControl();
    this._controlPoll=setInterval(()=>this._pollTeacherControl(),900);
  }

  async _pollTeacherControl(){
    try{
      const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(this.sessionId)}&control=1`,{
        credentials:'same-origin',cache:'no-store'
      });
      if(!r.ok)return;
      const d=await r.json();
      const c=d?.control||{};
      const follow=Boolean(c.followEnabled&&c.screenNumber);
      this._studentFollowState=follow;
      this._setStudentNavigationLock(follow);
      if(this.followStatus)this.followStatus.textContent=follow?'Following teacher · locked':'Waiting for teacher…';
      if(follow)await this._goToTeacherScreen(Number(c.screenNumber));
    }catch(_){}
  }

  _navigationTarget(node){
    const el=node?.closest?.('#prev,#next,#classroomPrev,#classroomNext,.screen-prev,.screen-next,[data-screen-nav],[data-nav="prev"],[data-nav="next"]');
    if(!el)return null;
    if(el.closest?.('.round-controls'))return null;
    return el;
  }

  _setStudentNavigationLock(on){
    let doc=null,win=null;
    try{doc=this.frame?.contentDocument;win=this.frame?.contentWindow}catch(_){}
    if(!doc||!win)return;

    if(on&&!this._studentNavGuard){
      this._studentNavGuard=(e)=>{
        if(!this._studentFollowState||this._applyingTeacherNav)return;
        if(this._navigationTarget(e.target)){
          e.preventDefault();e.stopImmediatePropagation();
        }
      };
      this._studentKeyGuard=(e)=>{
        if(!this._studentFollowState||this._applyingTeacherNav)return;
        if(['ArrowLeft','ArrowRight','PageUp','PageDown'].includes(e.key)){
          e.preventDefault();e.stopImmediatePropagation();
        }
      };
      doc.addEventListener('click',this._studentNavGuard,true);
      win.addEventListener('keydown',this._studentKeyGuard,true);
    }else if(!on&&this._studentNavGuard){
      doc.removeEventListener('click',this._studentNavGuard,true);
      win.removeEventListener('keydown',this._studentKeyGuard,true);
      this._studentNavGuard=null;this._studentKeyGuard=null;
    }
  }

  async _goToTeacherScreen(target){
    if(!Number.isFinite(target)||target<1)return false;
    let now=this._currentScreenNumber();
    if(!now||now===target)return true;
    this._applyingTeacherNav=true;
    try{
      let guard=0;
      while(now!==target&&guard++<40){
        const d=this.frame?.contentDocument;
        const selector=target>now
          ? '#next,#classroomNext,.screen-next,[data-screen-nav="next"],[data-nav="next"]'
          : '#prev,#classroomPrev,.screen-prev,[data-screen-nav="prev"],[data-nav="prev"]';
        const candidates=[...(d?.querySelectorAll?.(selector)||[])];
        const btn=candidates.find(el=>!el.disabled&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
        if(!btn)break;
        btn.click();
        await new Promise(r=>setTimeout(r,90));
        const next=this._currentScreenNumber();
        if(!next||next===now)break;
        now=next;
      }
      return now===target;
    }catch(_){return false}
    finally{this._applyingTeacherNav=false}
  }

  async _participants(){
    if(!this.sessionId||!['teacher','admin'].includes(this.role))return [];
    try{
      const r=await fetch(`/api/research/participants?sessionId=${encodeURIComponent(this.sessionId)}`,{
        credentials:'same-origin',cache:'no-store'
      });
      if(!r.ok)return [];
      const d=await r.json();
      return Array.isArray(d?.participants)?d.participants:[];
    }catch(_){return []}
  }

  async _sessionEvents(){
    if(!this.sessionId||!['teacher','admin'].includes(this.role))return [];
    try{
      const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(this.sessionId)}`,{
        credentials:'same-origin',cache:'no-store'
      });
      if(!r.ok)return [];
      const d=await r.json();
      return Array.isArray(d?.events)?d.events:[];
    }catch(_){return []}
  }

  async openResponses(){
    if(!this.sessionId||!['teacher','admin'].includes(this.role)){
      return super.openResponses();
    }

    const [participants,sessionEvents]=await Promise.all([this._participants(),this._sessionEvents()]);
    const submitted=(this.responses||[])
      .filter(x=>x?.eventType==='response.submitted'&&x?.context?.role==='student')
      .slice()
      .sort((a,b)=>new Date(a.occurredAt||0)-new Date(b.occurredAt||0));

    const byParticipant=new Map();
    for(const row of submitted){
      const pid=String(row?.context?.participantId??row?.context?.studentId??'unknown');
      if(!byParticipant.has(pid))byParticipant.set(pid,[]);
      byParticipant.get(pid).push(row);
    }

    const activeIds=new Set();
    for(const row of sessionEvents){
      const type=String(row?.event_type||'');
      if(type.startsWith('teacher.'))continue;
      if(row?.participant_id!=null)activeIds.add(String(row.participant_id));
    }

    const people=participants.map(p=>({
      id:String(p.participant_id),
      name:p.display_name||p.participant_code||`Student ${p.participant_id}`,
      code:p.participant_code||''
    }));
    for(const [pid,rows] of byParticipant){
      if(!people.some(p=>p.id===pid)){
        people.push({id:pid,name:rows.at(-1)?.context?.studentId||'Student',code:rows.at(-1)?.context?.studentId||''});
      }
    }

    const submittedPeople=people.filter(p=>(byParticipant.get(p.id)||[]).length>0).length;
    const activePeople=people.filter(p=>activeIds.has(p.id)||(byParticipant.get(p.id)||[]).length>0).length;
    const notSubmitted=Math.max(0,people.length-submittedPeople);
    const body=document.getElementById('hostModalBody');
    if(!body)return super.openResponses();

    const cards=people.map(person=>{
      const rows=byParticipant.get(person.id)||[];
      const latest=rows.at(-1)||null;
      const scores=rows.map(r=>Number(r?.payload?.score)).filter(Number.isFinite);
      const latestScore=latest?scoreLabel(latest?.payload?.score):'—';
      const bestScore=scores.length?scoreLabel(Math.max(...scores)):'—';
      const isActive=activeIds.has(person.id)||rows.length>0;
      const state=rows.length?'Submitted':(isActive?'Active · not submitted':'Joined · not submitted');
      const history=rows.slice().reverse().map(r=>{
        const activity=r.activityId||'activity';
        const attemptNo=rows.filter(x=>(x.activityId||'activity')===activity&&new Date(x.occurredAt||0)<=new Date(r.occurredAt||0)).length;
        return `<div class="host-response-card"><div class="host-response-head"><b>${esc(activity)}</b><span>Attempt ${attemptNo}</span><small>${esc(asTime(r.occurredAt))}</small></div><div class="host-response-score">Score ${esc(scoreLabel(r?.payload?.score))}</div></div>`;
      }).join('');

      return `<article class="host-response-card">
        <div class="host-response-head">
          <b>${esc(person.name)}</b>
          <span>${esc(state)}</span>
          <small>${rows.length?`${rows.length} submit${rows.length===1?'':'s'}`:'0 submits'}</small>
        </div>
        <div class="host-response-score">Latest ${esc(latestScore)} · Best ${esc(bestScore)}${latest?.occurredAt?` · Last ${esc(asTime(latest.occurredAt))}`:''}</div>
        ${rows.length?`<details style="margin-top:9px"><summary>Attempt history</summary>${history}</details>`:''}
      </article>`;
    }).join('');

    body.innerHTML=`<div class="host-modal-title-row"><div><h2>Responses</h2><p class="host-muted">Participation and every Submit attempt are preserved. Check and Reset do not create attempts.</p></div><span class="host-response-total">${submitted.length} submit${submitted.length===1?'':'s'}</span></div>
      <div class="metric-row" style="margin:14px 0">
        <div class="metric"><b>${people.length}</b><span>Joined</span></div>
        <div class="metric"><b>${activePeople}</b><span>Active</span></div>
        <div class="metric"><b>${submittedPeople}</b><span>Submitted</span></div>
        <div class="metric"><b>${notSubmitted}</b><span>Not submitted</span></div>
      </div>
      ${cards||'<div class="host-empty">No students have joined this live session yet.</div>'}`;
    this.openModal();
  }
}
