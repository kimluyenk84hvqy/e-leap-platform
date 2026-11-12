/**
 * E-LEAP Unified Lesson Controls — stabilization adapter (2026-10-07)
 *
 * Keeps the locked Role Control Contract intact while adding:
 * - server-session role verification (localStorage is never final authority)
 * - automatic Follow Teacher + student navigation lock for an active live session
 * - teacher Responses summary with activity-scoped live board
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
const compact=(v)=>String(v??'').replace(/\s+/g,' ').trim();
const palette=['#EAF7EE','#FFF4D6','#E9F1FF','#FBE9F2','#EAF6F6','#F1ECFF','#FFF0E7','#ECF7DF','#FFEDEE','#E8F4FF'];

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
      pill.textContent='Waiting for teacher · locked';
      this.dock?.querySelector?.('.unified-activity')?.appendChild(pill);
    }
    this.followStatus=pill;
    this._studentFollowState=true;
    this._setStudentNavigationLock(true);
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
      const target=Number(c.screenNumber);
      this._studentFollowState=true;
      this._setStudentNavigationLock(true);
      if(this.followStatus)this.followStatus.textContent=Number.isFinite(target)&&target>0?'Following teacher · locked':'Waiting for teacher · locked';
      if(Number.isFinite(target)&&target>0)await this._goToTeacherScreen(target);
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

  _injectResponseBoardStyles(){
    if(document.getElementById('e-leap-response-board-style'))return;
    const s=document.createElement('style');
    s.id='e-leap-response-board-style';
    s.textContent=`
      .host-modal-card.eleap-response-board{width:min(1500px,97vw)!important;height:91vh!important;max-height:91vh!important;overflow:hidden!important;padding:18px 20px 20px!important;background:linear-gradient(145deg,#fbfdfc 0%,#f2f8f4 52%,#f8fbff 100%)}
      .eleap-rb-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-right:44px}.eleap-rb-title{font-size:clamp(24px,2.3vw,40px);font-weight:900;color:#123d2d;line-height:1}.eleap-rb-sub{color:#60756e;font-size:13px}.eleap-rb-select{margin-left:auto;min-height:42px;border:1px solid #cbdad2;border-radius:12px;background:#fff;padding:0 12px;font:800 13px/1 system-ui;color:#173f38;max-width:340px}.eleap-rb-metrics{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 10px}.eleap-rb-metric{display:flex;gap:6px;align-items:baseline;background:#fff;border:1px solid #deebe4;border-radius:999px;padding:7px 12px;color:#315f52;font-size:12px;font-weight:800}.eleap-rb-metric b{font-size:18px;color:#123d2d}.eleap-rb-stage{height:calc(91vh - 150px);overflow:auto;display:flex;align-content:flex-start;justify-content:center;gap:12px;flex-wrap:wrap;padding:16px 10px 28px;border-radius:18px;background:radial-gradient(circle at center,#fff 0%,#f5faf7 62%,#edf5f1 100%);border:1px solid #dce9e2}.eleap-rb-card{--rot:0deg;min-width:170px;max-width:min(360px,42vw);flex:1 1 210px;border:0;border-radius:22px;padding:14px 16px;box-shadow:0 10px 28px rgba(31,77,58,.12);color:#173f38;text-align:left;cursor:pointer;animation:eleapBurst .72s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--delay,0ms);transform:rotate(var(--rot));transition:transform .18s ease,box-shadow .18s ease}.eleap-rb-card:hover{transform:rotate(0deg) scale(1.035);box-shadow:0 16px 36px rgba(31,77,58,.18)}.eleap-rb-name{font-size:12px;font-weight:900;opacity:.62;text-transform:uppercase;letter-spacing:.03em}.eleap-rb-answer{font-size:clamp(20px,2vw,34px);font-weight:900;line-height:1.12;margin:5px 0 8px;overflow-wrap:anywhere}.eleap-rb-foot{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;opacity:.7}.eleap-rb-empty{display:grid;place-items:center;min-height:50vh;font-size:clamp(22px,2vw,34px);font-weight:900;color:#6a7d73;text-align:center;padding:30px}.eleap-rb-focus{position:absolute;inset:0;background:rgba(10,38,29,.78);display:grid;place-items:center;padding:5vw;z-index:4}.eleap-rb-focus[hidden]{display:none}.eleap-rb-focus-card{width:min(1000px,88vw);border-radius:30px;padding:30px 36px;background:#fff;box-shadow:0 30px 90px #0006;text-align:center}.eleap-rb-focus-name{font-size:clamp(20px,2vw,30px);font-weight:900;color:#60756e}.eleap-rb-focus-answer{font-size:clamp(38px,5vw,76px);font-weight:950;line-height:1.08;color:#123d2d;margin:16px 0}.eleap-rb-focus-score{font-size:clamp(18px,2vw,28px);font-weight:900;color:#315f52}.eleap-rb-focus-close{position:absolute;right:28px;top:22px;border:0;background:#fff;color:#123d2d;border-radius:999px;width:48px;height:48px;font-size:30px;font-weight:900;cursor:pointer}.eleap-rb-detail{font-size:14px;font-weight:700;color:#60756e;margin-top:12px;white-space:pre-wrap;overflow-wrap:anywhere}@keyframes eleapBurst{0%{opacity:0;transform:translate(var(--from-x,0),var(--from-y,0)) scale(.12) rotate(0deg)}70%{opacity:1;transform:translate(0,0) scale(1.04) rotate(var(--rot))}100%{opacity:1;transform:translate(0,0) scale(1) rotate(var(--rot))}}@media(max-width:800px){.host-modal-card.eleap-response-board{width:98vw!important;height:94vh!important;max-height:94vh!important;padding:14px!important}.eleap-rb-select{width:100%;max-width:none;margin-left:0}.eleap-rb-stage{height:calc(94vh - 190px)}.eleap-rb-card{min-width:145px;flex-basis:160px}.eleap-rb-answer{font-size:20px}}
    `;
    document.head.appendChild(s);
  }

  _answerText(value,depth=0){
    if(depth>4||value==null)return '';
    if(typeof value==='string'){
      const t=value.trim();
      if(!t)return '';
      if((t.startsWith('{')&&t.endsWith('}'))||(t.startsWith('[')&&t.endsWith(']'))){
        try{return this._answerText(JSON.parse(t),depth+1)||t}catch(_){return t}
      }
      return t;
    }
    if(typeof value==='number'||typeof value==='boolean')return String(value);
    if(Array.isArray(value))return value.map(v=>this._answerText(v,depth+1)).filter(Boolean).join(' · ');
    if(typeof value==='object'){
      for(const k of ['response','answer','text','value','selection','selected','choices','items','matches','payload']){
        if(k in value){const t=this._answerText(value[k],depth+1);if(t)return t}
      }
      const parts=Object.entries(value).filter(([k])=>!['grading','objective','result','metadata','score','correct','total','unanswered'].includes(k)).map(([k,v])=>{
        const t=this._answerText(v,depth+1);return t?`${k}: ${t}`:'';
      }).filter(Boolean);
      return parts.slice(0,8).join(' · ');
    }
    return '';
  }

  _activityRows(events,activityId){
    return events.filter(r=>String(r?.event_type||'')==='response.submitted'&&String(r?.activity_id||'')===String(activityId||''));
  }

  _latestByParticipant(rows){
    const map=new Map();
    for(const r of rows){
      if(r?.participant_id==null)continue;
      const key=String(r.participant_id);
      const prev=map.get(key);
      if(!prev||new Date(r.occurred_at||0)>=new Date(prev.occurred_at||0))map.set(key,r);
    }
    return map;
  }

  _renderResponseBoard(participants,events,activityId){
    const body=document.getElementById('hostModalBody');
    if(!body)return;
    const card=body.closest('.host-modal-card');
    if(card)card.classList.add('eleap-response-board');

    const activityIds=[...new Set(events.filter(r=>r?.event_type==='response.submitted'&&r?.activity_id).map(r=>String(r.activity_id)))];
    const rows=this._activityRows(events,activityId);
    const latest=this._latestByParticipant(rows);
    const names=new Map(participants.map(p=>[String(p.participant_id),p.display_name||p.participant_code||`Student ${p.participant_id}`]));
    const people=[...latest.entries()].map(([pid,row])=>({pid,row,name:names.get(pid)||row?.metadata?.studentName||`Student ${pid}`}));
    people.sort((a,b)=>new Date(a.row?.occurred_at||0)-new Date(b.row?.occurred_at||0));

    const scored=people.filter(x=>Number.isFinite(Number(x.row?.score)));
    const avg=scored.length?scored.reduce((s,x)=>s+Number(x.row.score),0)/scored.length:null;
    const correct=people.filter(x=>x.row?.is_correct===true).length;
    const activityOptions=activityIds.map(id=>`<option value="${esc(id)}" ${String(id)===String(activityId)?'selected':''}>${esc(id)}</option>`).join('');

    const clouds=people.map((x,i)=>{
      let answer=compact(this._answerText(x.row?.answer));
      if(!answer)answer='Submitted';
      const short=answer.length>150?answer.slice(0,147)+'…':answer;
      const score=Number.isFinite(Number(x.row?.score))?scoreLabel(x.row.score):(x.row?.is_correct===true?'Correct':x.row?.is_correct===false?'Check':'');
      const rot=((i%7)-3)*0.65;
      const fromX=((i%5)-2)*95;
      const fromY=((Math.floor(i/5)%5)-2)*65;
      return `<button class="eleap-rb-card" type="button" data-rb-index="${i}" style="background:${palette[i%palette.length]};--delay:${Math.min(i,30)*26}ms;--rot:${rot}deg;--from-x:${fromX}px;--from-y:${fromY}px"><div class="eleap-rb-name">${esc(x.name)}</div><div class="eleap-rb-answer">${esc(short)}</div><div class="eleap-rb-foot"><span>${esc(score)}</span><span>${esc(asTime(x.row?.occurred_at))}</span></div></button>`;
    }).join('');

    body.innerHTML=`<div class="eleap-rb-head"><div><div class="eleap-rb-title">Live Responses</div><div class="eleap-rb-sub">One activity at a time · latest Submit from each student</div></div><select class="eleap-rb-select" id="eleapRbActivity" aria-label="Activity">${activityOptions||`<option value="${esc(activityId||'')}">${esc(activityId||'Current activity')}</option>`}</select></div><div class="eleap-rb-metrics"><span class="eleap-rb-metric"><b>${people.length}</b> Submitted</span><span class="eleap-rb-metric"><b>${Math.max(0,participants.length-people.length)}</b> Waiting</span>${scored.length?`<span class="eleap-rb-metric"><b>${esc(scoreLabel(avg))}</b> Avg score</span>`:''}${people.some(x=>x.row?.is_correct!=null)?`<span class="eleap-rb-metric"><b>${correct}</b> Correct</span>`:''}</div><div class="eleap-rb-stage">${clouds||`<div class="eleap-rb-empty">No responses yet for this activity.</div>`}</div><div class="eleap-rb-focus" id="eleapRbFocus" hidden><button class="eleap-rb-focus-close" id="eleapRbFocusClose" type="button">×</button><div class="eleap-rb-focus-card"><div class="eleap-rb-focus-name" id="eleapRbFocusName"></div><div class="eleap-rb-focus-answer" id="eleapRbFocusAnswer"></div><div class="eleap-rb-focus-score" id="eleapRbFocusScore"></div><div class="eleap-rb-detail" id="eleapRbFocusDetail"></div></div></div>`;

    const select=document.getElementById('eleapRbActivity');
    if(select)select.onchange=()=>this._renderResponseBoard(participants,events,select.value);
    const focus=document.getElementById('eleapRbFocus');
    const close=document.getElementById('eleapRbFocusClose');
    if(close)close.onclick=()=>{if(focus)focus.hidden=true};
    body.querySelectorAll('[data-rb-index]').forEach(btn=>btn.onclick=()=>{
      const x=people[Number(btn.dataset.rbIndex)]; if(!x||!focus)return;
      const answer=compact(this._answerText(x.row?.answer))||'Submitted';
      document.getElementById('eleapRbFocusName').textContent=x.name;
      document.getElementById('eleapRbFocusAnswer').textContent=answer;
      document.getElementById('eleapRbFocusScore').textContent=Number.isFinite(Number(x.row?.score))?`Score ${scoreLabel(x.row.score)}`:(x.row?.is_correct===true?'Correct':x.row?.is_correct===false?'Needs review':'');
      document.getElementById('eleapRbFocusDetail').textContent=`Activity: ${activityId||'—'} · Submitted: ${asTime(x.row?.occurred_at)}`;
      focus.hidden=false;
    });
  }

  async openResponses(){
    if(!this.sessionId||!['teacher','admin'].includes(this.role))return super.openResponses();
    this._injectResponseBoardStyles();
    const [participants,events]=await Promise.all([this._participants(),this._sessionEvents()]);
    const submitted=events.filter(r=>r?.event_type==='response.submitted'&&r?.activity_id);
    const ids=[...new Set(submitted.map(r=>String(r.activity_id)))];
    const current=this._currentActivityId();
    const activityId=(current&&ids.includes(String(current)))?String(current):(ids.at(-1)||current||'');
    const body=document.getElementById('hostModalBody');
    if(!body)return super.openResponses();
    this._renderResponseBoard(participants,events,activityId);
    this.openModal();
  }
}
