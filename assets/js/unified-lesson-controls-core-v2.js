/**
 * E-LEAP Unified Lesson Controls — platform live/follow/response adapter.
 * Platform Core owns Live Class, Follow Teacher and Responses for every lesson.
 */
import {UnifiedLessonControls as BaseUnifiedLessonControls} from './controls/host-control-shell.js';

const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const uid=()=>globalThis.crypto?.randomUUID?.()||`ctl-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const asTime=(v)=>{try{return new Date(v||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return ''}};
const scoreLabel=(v)=>{const n=Number(v);if(!Number.isFinite(n))return '—';return n>=0&&n<=1?`${Math.round(n*100)}%`:String(Math.round(n*100)/100)};
const palette=['#EAF7EE','#FFF4D6','#E9F1FF','#FBE9F2','#EAF6F6','#F1ECFF','#FFF0E7','#ECF7DF','#FFEDEE','#E8F4FF','#F6E8FF','#EAF3D7'];

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
    this._verifyServerRole().then(ok=>{if(!ok)return;if(this.dock)this.dock.style.visibility='';this._roleVerified=true;this._installLiveStabilization();});
  }

  async _verifyServerRole(){
    let actual='guest';
    try{const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});if(r.ok){const d=await r.json();actual=d?.user?.role||'guest';}}catch(_){actual='guest'}
    const allowed=new Set(['guest','student','teacher','admin']);if(!allowed.has(actual))actual='guest';
    if(actual!==this.role){try{localStorage.setItem('e-leap-preview-role',actual)}catch(_){}location.reload();return false;}
    if(this.roleBadge){const labels={guest:'Guest Practice',student:'Student',teacher:'Teacher',admin:'Admin'};this.roleBadge.textContent=labels[this.role]||'Guest Practice';}
    return true;
  }

  sync(){super.sync();if(this.followBtn)this.followBtn.hidden=Boolean(this.presentation)}
  _installLiveStabilization(){if(!this.sessionId)return;if(['teacher','admin'].includes(this.role))this._installTeacherFollow();if(this.role==='student')this._installStudentFollow();window.addEventListener('pagehide',()=>this._stopStabilization(),{once:true})}
  _stopStabilization(){clearInterval(this._followTimer);clearInterval(this._controlPoll);this._setStudentNavigationLock(false)}

  _screenFromActivityId(id){
    const s=String(id||'');
    const patterns=[/(?:^|[-_])s(?:creen)?[-_]?0*(\d+)(?:$|[-_])/i,/screen[-_]?0*(\d+)/i,/slide[-_]?0*(\d+)/i,/u\d+[a-z]*[-_]?s0*(\d+)/i];
    for(const re of patterns){const m=s.match(re);if(m){const n=Number(m[1]);if(Number.isFinite(n)&&n>0)return n;}}
    return null;
  }

  _currentScreenNumber(){
    try{
      const state=this._inspect?.()||null;
      for(const v of [state?.screenNumber,state?.screen,state?.slide,state?.response?.screenNumber,state?.response?.screen,state?.response?.slide]){const n=Number(v);if(Number.isFinite(n)&&n>0)return n;}
      const fromId=this._screenFromActivityId(state?.activityId);if(fromId)return fromId;
      const d=this.frame?.contentDocument;
      let n=Number(d?.body?.dataset?.screen||d?.body?.dataset?.slide);if(Number.isFinite(n)&&n>0)return n;
      const active=d?.querySelector?.('.screen.active,.slide.active,[data-screen].active,[data-slide].active');
      n=Number(active?.dataset?.screen||active?.dataset?.slide);if(Number.isFinite(n)&&n>0)return n;
      const counter=d?.querySelector?.('#classroomCounter,[data-screen-counter],#counter,[data-slide-counter]')?.textContent||'';
      n=parseInt(counter,10);if(Number.isFinite(n)&&n>0)return n;
    }catch(_){}
    return null;
  }

  _currentActivityId(){try{return this._inspect()?.activityId||null}catch(_){return null}}

  async _postTeacherControl(eventType,answer={},activityId=null){
    try{const r=await fetch('/api/research/events',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientEventId:uid(),sessionId:this.sessionId,activityId:activityId||this._currentActivityId(),eventType,answer,metadata:{source:'e-leap-follow-teacher-v2',resourceId:this.resourceId}})});return r.ok;}catch(_){return false}
  }

  _installTeacherFollow(){
    const group=this.dock?.querySelector?.('.unified-classroom');if(!group||group.querySelector('#hostFollowTeacherBtn'))return;
    this.followEnabled=true;const btn=document.createElement('button');btn.id='hostFollowTeacherBtn';btn.type='button';btn.textContent='Follow Teacher · ON';btn.title='Live class: student devices follow the teacher automatically.';btn.disabled=true;
    const live=group.querySelector('#hostLiveBtn');group.insertBefore(btn,live||null);this.followBtn=btn;this._syncFollowButton();this._postTeacherControl('teacher.follow',{enabled:true}).then(()=>this._publishTeacherNavigation(true));this._followTimer=setInterval(()=>this._publishTeacherNavigation(false),650);
  }
  _syncFollowButton(){if(!this.followBtn)return;this.followBtn.textContent='Follow Teacher · ON';this.followBtn.classList.add('is-active');this.followBtn.setAttribute('aria-pressed','true');this.followBtn.disabled=true;this.followBtn.hidden=Boolean(this.presentation)}

  async _publishTeacherNavigation(force=false){
    if(!this.followEnabled)return;const activityId=this._currentActivityId();const screenNumber=this._currentScreenNumber()||this._screenFromActivityId(activityId);if(!screenNumber&&!activityId)return;
    const key=`${screenNumber||''}|${activityId||''}`;if(!force&&key===this._lastTeacherScreen)return;this._lastTeacherScreen=key;
    await this._postTeacherControl('teacher.navigation',{screenNumber:screenNumber||null,activityId:activityId||null,locked:true},activityId);
  }

  _installStudentFollow(){
    let pill=document.getElementById('hostFollowStatus');if(!pill){pill=document.createElement('span');pill.id='hostFollowStatus';pill.className='host-practice-pill';pill.textContent='Waiting for teacher · locked';this.dock?.querySelector?.('.unified-activity')?.appendChild(pill);}this.followStatus=pill;this._studentFollowState=true;this._setStudentNavigationLock(true);this._pollTeacherControl();this._controlPoll=setInterval(()=>this._pollTeacherControl(),900);
  }

  async _pollTeacherControl(){
    try{
      const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(this.sessionId)}&control=1`,{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;const d=await r.json();const c=d?.control||{};const target=Number(c.screenNumber);const activityId=c.activityId||null;
      this._studentFollowState=true;this._setStudentNavigationLock(true);if(this.followStatus)this.followStatus.textContent=((Number.isFinite(target)&&target>0)||activityId)?'Following teacher · locked':'Waiting for teacher · locked';
      await this._goToTeacherLocation(Number.isFinite(target)&&target>0?target:null,activityId);
    }catch(_){}
  }

  _navigationTarget(node){const el=node?.closest?.('#prev,#next,#classroomPrev,#classroomNext,.screen-prev,.screen-next,[data-screen-nav],[data-nav="prev"],[data-nav="next"]');if(!el)return null;if(el.closest?.('.round-controls'))return null;return el;}
  _setStudentNavigationLock(on){
    let doc=null,win=null;try{doc=this.frame?.contentDocument;win=this.frame?.contentWindow}catch(_){}if(!doc||!win)return;
    if(on&&!this._studentNavGuard){
      this._studentNavGuard=(e)=>{if(!this._studentFollowState||this._applyingTeacherNav)return;if(this._navigationTarget(e.target)){e.preventDefault();e.stopImmediatePropagation();}};
      this._studentKeyGuard=(e)=>{if(!this._studentFollowState||this._applyingTeacherNav)return;if(['ArrowLeft','ArrowRight','PageUp','PageDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}};
      doc.addEventListener('click',this._studentNavGuard,true);win.addEventListener('keydown',this._studentKeyGuard,true);
    }else if(!on&&this._studentNavGuard){doc.removeEventListener('click',this._studentNavGuard,true);win.removeEventListener('keydown',this._studentKeyGuard,true);this._studentNavGuard=null;this._studentKeyGuard=null;}
  }

  async _goToTeacherActivity(activityId){
    if(!activityId)return false;try{
      const api=this._api?.();if(!api)return false;
      if(typeof api.setActivity==='function'){const ok=api.setActivity(activityId);if(ok!==false)return true;}
      if(typeof api.command==='function'){for(const [action,payload] of [['goto-activity',activityId],['goto-activity',{activityId}],['goto',{activityId}]]){try{const ok=api.command(action,payload);if(ok===true)return true;}catch(_){}}}
    }catch(_){}return false;
  }

  async _goToTeacherLocation(target,activityId){
    this._applyingTeacherNav=true;try{
      if(activityId){const movedActivity=await this._goToTeacherActivity(activityId);if(movedActivity){await new Promise(r=>setTimeout(r,60));const current=this._currentActivityId();if(String(current||'')===String(activityId))return true;}}
      const derived=target||this._screenFromActivityId(activityId);if(derived)return await this._goToTeacherScreen(derived);return false;
    }finally{this._applyingTeacherNav=false}
  }

  async _goToTeacherScreen(target){
    if(!Number.isFinite(target)||target<1)return false;
    try{
      const api=this._api?.();if(api){
        if(typeof api.setScreen==='function'){const ok=api.setScreen(target);if(ok!==false){await new Promise(r=>setTimeout(r,70));if(this._currentScreenNumber()===target)return true;}}
        if(typeof api.command==='function'){for(const payload of [target,{screenNumber:target},{screen:target}]){try{const ok=api.command('goto',payload);if(ok===true){await new Promise(r=>setTimeout(r,70));if(this._currentScreenNumber()===target)return true;}}catch(_){}}}
      }
      let now=this._currentScreenNumber();if(!now||now===target)return now===target;let guard=0;
      while(now!==target&&guard++<60){
        const d=this.frame?.contentDocument;const selector=target>now?'#next,#classroomNext,.screen-next,[data-screen-nav="next"],[data-nav="next"]':'#prev,#classroomPrev,.screen-prev,[data-screen-nav="prev"],[data-nav="prev"]';
        const candidates=[...(d?.querySelectorAll?.(selector)||[])];const btn=candidates.find(el=>!el.disabled&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');if(!btn)break;btn.click();await new Promise(r=>setTimeout(r,90));const next=this._currentScreenNumber();if(!next||next===now)break;now=next;
      }
      return now===target;
    }catch(_){return false}
  }

  async _participants(){if(!this.sessionId||!['teacher','admin'].includes(this.role))return [];try{const r=await fetch(`/api/research/participants?sessionId=${encodeURIComponent(this.sessionId)}`,{credentials:'same-origin',cache:'no-store'});if(!r.ok)return [];const d=await r.json();return Array.isArray(d?.participants)?d.participants:[]}catch(_){return []}}
  async _sessionEvents(){if(!this.sessionId||!['teacher','admin'].includes(this.role))return [];try{const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(this.sessionId)}`,{credentials:'same-origin',cache:'no-store'});if(!r.ok)return [];const d=await r.json();return Array.isArray(d?.events)?d.events:[]}catch(_){return []}}

  _injectResponseBoardStyles(){
    if(document.getElementById('e-leap-response-board-style'))return;const s=document.createElement('style');s.id='e-leap-response-board-style';s.textContent=`
      .host-modal-card.eleap-response-board{width:min(1500px,97vw)!important;height:91vh!important;max-height:91vh!important;overflow:hidden!important;padding:18px 20px 20px!important;background:linear-gradient(145deg,#fbfdfc 0%,#f2f8f4 52%,#f8fbff 100%)}
      .eleap-rb-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-right:44px}.eleap-rb-title{font-size:clamp(24px,2.3vw,40px);font-weight:900;color:#123d2d;line-height:1}.eleap-rb-sub{color:#60756e;font-size:13px}.eleap-rb-select{margin-left:auto;min-height:42px;border:1px solid #cbdad2;border-radius:12px;background:#fff;padding:0 12px;font:800 13px/1 system-ui;color:#173f38;max-width:340px}.eleap-rb-metrics{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 10px}.eleap-rb-metric{display:flex;gap:6px;align-items:baseline;background:#fff;border:1px solid #deebe4;border-radius:999px;padding:7px 12px;color:#315f52;font-size:12px;font-weight:800}.eleap-rb-metric b{font-size:18px;color:#123d2d}.eleap-rb-stage{height:calc(91vh - 150px);overflow:auto;display:flex;align-content:flex-start;justify-content:center;gap:12px;flex-wrap:wrap;padding:16px 10px 28px;border-radius:18px;background:radial-gradient(circle at center,#fff 0%,#f5faf7 62%,#edf5f1 100%);border:1px solid #dce9e2}.eleap-rb-card{--rot:0deg;min-width:190px;max-width:min(390px,44vw);flex:1 1 230px;border:0;border-radius:22px;padding:14px 16px;box-shadow:0 10px 28px rgba(31,77,58,.12);color:#173f38;text-align:left;cursor:pointer;animation:eleapBurst .72s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--delay,0ms);transform:rotate(var(--rot));transition:transform .18s ease,box-shadow .18s ease}.eleap-rb-card:hover{transform:rotate(0deg) scale(1.035);box-shadow:0 16px 36px rgba(31,77,58,.18)}.eleap-rb-name{font-size:13px;font-weight:900;opacity:.68;text-transform:uppercase;letter-spacing:.03em}.eleap-rb-answer{font-size:clamp(21px,2.1vw,36px);font-weight:900;line-height:1.18;margin:7px 0 9px;overflow-wrap:anywhere;white-space:pre-line}.eleap-rb-foot{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;opacity:.7}.eleap-rb-empty{display:grid;place-items:center;min-height:50vh;font-size:clamp(22px,2vw,34px);font-weight:900;color:#6a7d73;text-align:center;padding:30px}.eleap-rb-focus{position:absolute;inset:0;background:rgba(10,38,29,.78);display:grid;place-items:center;padding:5vw;z-index:4}.eleap-rb-focus[hidden]{display:none}.eleap-rb-focus-card{width:min(1050px,90vw);border-radius:30px;padding:30px 36px;background:#fff;box-shadow:0 30px 90px #0006;text-align:center}.eleap-rb-focus-name{font-size:clamp(20px,2vw,30px);font-weight:900;color:#60756e}.eleap-rb-focus-answer{font-size:clamp(34px,4.5vw,68px);font-weight:950;line-height:1.15;color:#123d2d;margin:16px 0;white-space:pre-line}.eleap-rb-focus-score{font-size:clamp(18px,2vw,28px);font-weight:900;color:#315f52}.eleap-rb-focus-close{position:absolute;right:28px;top:22px;border:0;background:#fff;color:#123d2d;border-radius:999px;width:48px;height:48px;font-size:30px;font-weight:900;cursor:pointer}.eleap-rb-detail{font-size:14px;font-weight:700;color:#60756e;margin-top:12px;white-space:pre-wrap;overflow-wrap:anywhere}@keyframes eleapBurst{0%{opacity:0;transform:translate(var(--from-x,0),var(--from-y,0)) scale(.12) rotate(0deg)}70%{opacity:1;transform:translate(0,0) scale(1.04) rotate(var(--rot))}100%{opacity:1;transform:translate(0,0) scale(1) rotate(var(--rot))}}@media(max-width:800px){.host-modal-card.eleap-response-board{width:98vw!important;height:94vh!important;max-height:94vh!important;padding:14px!important}.eleap-rb-select{width:100%;max-width:none;margin-left:0}.eleap-rb-stage{height:calc(94vh - 190px)}.eleap-rb-card{min-width:145px;flex-basis:160px}.eleap-rb-answer{font-size:20px}}
    `;document.head.appendChild(s);
  }

  _answerText(value,depth=0){
    if(depth>5||value==null)return '';
    if(typeof value==='string'){const t=value.trim();if(!t)return '';if((t.startsWith('{')&&t.endsWith('}'))||(t.startsWith('[')&&t.endsWith(']'))){try{return this._answerText(JSON.parse(t),depth+1)||t}catch(_){return t}}return t;}
    if(typeof value==='number'||typeof value==='boolean')return String(value);
    if(Array.isArray(value)){
      if(value.every(v=>v&&typeof v==='object'&&('value' in v||'answer' in v||'text' in v))){return value.map((v,i)=>{const t=this._answerText(v.value??v.answer??v.text,depth+1);return t?`${i+1}. ${t}`:''}).filter(Boolean).join('\n');}
      return value.map((v,i)=>{const t=this._answerText(v,depth+1);return t?`${i+1}. ${t}`:''}).filter(Boolean).join('\n');
    }
    if(typeof value==='object'){
      if(Array.isArray(value.fields)){
        const rows=value.fields.map((v,i)=>{const t=this._answerText(v?.value??v?.answer??v?.text??v,depth+1);return t?`${i+1}. ${t}`:''}).filter(Boolean);
        const selected=Array.isArray(value.selected)?value.selected.map(v=>this._answerText(v,depth+1)).filter(Boolean):[];
        if(rows.length||selected.length)return [...rows,...selected.map((t,i)=>`${rows.length+i+1}. ${t}`)].join('\n');
      }
      for(const k of ['response','answer','payload']){if(k in value){const t=this._answerText(value[k],depth+1);if(t)return t}}
      for(const k of ['text','value','selection','selected','choices','items','matches']){if(k in value){const t=this._answerText(value[k],depth+1);if(t)return t}}
      const ignored=new Set(['grading','objective','result','metadata','score','correct','total','unanswered','input','inputs','type','kind']);
      const vals=Object.entries(value).filter(([k])=>!ignored.has(String(k).toLowerCase())).map(([,v])=>this._answerText(v,depth+1)).filter(Boolean);
      return vals.map((t,i)=>`${i+1}. ${t}`).join('\n');
    }
    return '';
  }

  _activityLabel(id,index=0){const s=String(id||'');const m=s.match(/(?:a|q|s|screen|slide)[-_]?0*(\d+)/i);return m?`Activity ${Number(m[1])}`:`Activity ${index+1}`;}
  _activityRows(events,activityId){return events.filter(r=>String(r?.event_type||'')==='response.submitted'&&String(r?.activity_id||'')===String(activityId||''))}
  _latestByParticipant(rows){const map=new Map();for(const r of rows){if(r?.participant_id==null)continue;const key=String(r.participant_id),prev=map.get(key);if(!prev||new Date(r.occurred_at||0)>=new Date(prev.occurred_at||0))map.set(key,r);}return map;}

  _renderResponseBoard(participants,events,activityId){
    const body=document.getElementById('hostModalBody');if(!body)return;const card=body.closest('.host-modal-card');if(card)card.classList.add('eleap-response-board');
    const activityIds=[...new Set(events.filter(r=>r?.event_type==='response.submitted'&&r?.activity_id).map(r=>String(r.activity_id)))];const rows=this._activityRows(events,activityId);const latest=this._latestByParticipant(rows);const names=new Map(participants.map(p=>[String(p.participant_id),p.display_name||p.participant_code||`Student ${p.participant_id}`]));const people=[...latest.entries()].map(([pid,row])=>({pid,row,name:names.get(pid)||row?.metadata?.studentName||`Student ${pid}`}));people.sort((a,b)=>new Date(a.row?.occurred_at||0)-new Date(b.row?.occurred_at||0));
    const scored=people.filter(x=>Number.isFinite(Number(x.row?.score)));const avg=scored.length?scored.reduce((s,x)=>s+Number(x.row.score),0)/scored.length:null;const correct=people.filter(x=>x.row?.is_correct===true).length;const activityOptions=activityIds.map((id,i)=>`<option value="${esc(id)}" ${String(id)===String(activityId)?'selected':''}>${esc(this._activityLabel(id,i))}</option>`).join('');
    const clouds=people.map((x,i)=>{let answer=this._answerText(x.row?.answer).trim();if(!answer)answer='Submitted';const short=answer.length>260?answer.slice(0,257)+'…':answer;const score=Number.isFinite(Number(x.row?.score))?scoreLabel(x.row.score):(x.row?.is_correct===true?'Correct':x.row?.is_correct===false?'Check':'');const rot=((i%7)-3)*0.65,fromX=((i%5)-2)*95,fromY=((Math.floor(i/5)%5)-2)*65;return `<button class="eleap-rb-card" type="button" data-rb-index="${i}" style="background:${palette[i%palette.length]};--delay:${Math.min(i,30)*26}ms;--rot:${rot}deg;--from-x:${fromX}px;--from-y:${fromY}px"><div class="eleap-rb-name">${esc(x.name)}</div><div class="eleap-rb-answer">${esc(short)}</div><div class="eleap-rb-foot"><span>${esc(score)}</span><span>${esc(asTime(x.row?.occurred_at))}</span></div></button>`}).join('');
    body.innerHTML=`<div class="eleap-rb-head"><div><div class="eleap-rb-title">Live Responses</div><div class="eleap-rb-sub">Current activity · latest Submit from each student</div></div><select class="eleap-rb-select" id="eleapRbActivity" aria-label="Activity">${activityOptions||`<option value="${esc(activityId||'')}">Current activity</option>`}</select></div><div class="eleap-rb-metrics"><span class="eleap-rb-metric"><b>${people.length}</b> Submitted</span><span class="eleap-rb-metric"><b>${Math.max(0,participants.length-people.length)}</b> Waiting</span>${scored.length?`<span class="eleap-rb-metric"><b>${esc(scoreLabel(avg))}</b> Avg score</span>`:''}${people.some(x=>x.row?.is_correct!=null)?`<span class="eleap-rb-metric"><b>${correct}</b> Correct</span>`:''}</div><div class="eleap-rb-stage">${clouds||`<div class="eleap-rb-empty">No responses yet for this activity.</div>`}</div><div class="eleap-rb-focus" id="eleapRbFocus" hidden><button class="eleap-rb-focus-close" id="eleapRbFocusClose" type="button">×</button><div class="eleap-rb-focus-card"><div class="eleap-rb-focus-name" id="eleapRbFocusName"></div><div class="eleap-rb-focus-answer" id="eleapRbFocusAnswer"></div><div class="eleap-rb-focus-score" id="eleapRbFocusScore"></div><div class="eleap-rb-detail" id="eleapRbFocusDetail"></div></div></div>`;
    const select=document.getElementById('eleapRbActivity');if(select)select.onchange=()=>this._renderResponseBoard(participants,events,select.value);const focus=document.getElementById('eleapRbFocus'),close=document.getElementById('eleapRbFocusClose');if(close)close.onclick=()=>{if(focus)focus.hidden=true};body.querySelectorAll('[data-rb-index]').forEach(btn=>btn.onclick=()=>{const x=people[Number(btn.dataset.rbIndex)];if(!x||!focus)return;const answer=this._answerText(x.row?.answer).trim()||'Submitted';document.getElementById('eleapRbFocusName').textContent=x.name;document.getElementById('eleapRbFocusAnswer').textContent=answer;document.getElementById('eleapRbFocusScore').textContent=Number.isFinite(Number(x.row?.score))?`Score ${scoreLabel(x.row.score)}`:(x.row?.is_correct===true?'Correct':x.row?.is_correct===false?'Needs review':'');document.getElementById('eleapRbFocusDetail').textContent=`${this._activityLabel(activityId)} · Submitted: ${asTime(x.row?.occurred_at)}`;focus.hidden=false;});
  }

  async openResponses(){if(!this.sessionId||!['teacher','admin'].includes(this.role))return super.openResponses();this._injectResponseBoardStyles();const [participants,events]=await Promise.all([this._participants(),this._sessionEvents()]);const submitted=events.filter(r=>r?.event_type==='response.submitted'&&r?.activity_id),ids=[...new Set(submitted.map(r=>String(r.activity_id)))],current=this._currentActivityId(),activityId=(current&&ids.includes(String(current)))?String(current):(ids.at(-1)||current||'');const body=document.getElementById('hostModalBody');if(!body)return super.openResponses();this._renderResponseBoard(participants,events,activityId);this.openModal();}
}
