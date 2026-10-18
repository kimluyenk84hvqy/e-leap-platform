import {UnifiedLessonControls as CoreUnifiedLessonControls} from './unified-lesson-controls-core-v2.js';

/**
 * Platform-level compatibility layer.
 * Keeps lesson-specific code thin by normalizing navigation, submit results and response shapes here.
 * Live Responses are activity-scoped: the board never accumulates scores across activities.
 */
const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const palette=['#EAF7EE','#FFF4D6','#E9F1FF','#FBE9F2','#EAF6F6','#F1ECFF','#FFF0E7','#ECF7DF','#FFEDEE','#E8F4FF','#F6E8FF','#EAF3D7'];
const asTime=(v)=>{try{return new Date(v||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}catch{return ''}};
const scorePct=(v)=>{const n=Number(v);if(!Number.isFinite(n))return '';const p=n>=0&&n<=1?n*100:n;return `${Math.round(p)}%`};

export class UnifiedLessonControls extends CoreUnifiedLessonControls{
  _currentScreenNumber(){
    try{
      const state=this._inspect?.()||null;
      const idx=Number(state?.screenIndex);
      if(Number.isFinite(idx)&&idx>=0)return idx+1;
    }catch(_){}
    return super._currentScreenNumber();
  }

  async _goToTeacherActivity(activityId){
    if(!activityId)return false;
    try{
      const current=this._currentActivityId?.();
      if(String(current||'')===String(activityId))return true;
    }catch(_){}
    return super._goToTeacherActivity(activityId);
  }

  async _goToTeacherScreen(target){
    if(!Number.isFinite(target)||target<1)return false;
    try{
      const current=this._currentScreenNumber?.();
      if(Number(current)===Number(target))return true;
      const state=this._inspect?.()||null;
      const idx=Number(state?.screenIndex);
      const api=this._api?.();
      if(Number.isFinite(idx)&&idx>=0&&api&&typeof api.setScreen==='function'){
        const ok=api.setScreen(target-1);
        if(ok!==false){
          await new Promise(r=>setTimeout(r,70));
          if(this._currentScreenNumber()===target)return true;
        }
      }
    }catch(_){}
    return super._goToTeacherScreen(target);
  }

  _command(action){
    try{
      const api=this._api?.();
      if(!api?.command)return false;
      const out=api.command(action);
      const ok=out===true || (!!out && typeof out==='object');
      if(ok && String(action||'').toLowerCase()==='submit' && out && typeof out==='object'){
        this._syncObjectSubmission(out).catch(()=>{});
      }
      return ok;
    }catch(_){return false}
  }

  async _syncObjectSubmission(state){
    if(this.role!=='student'||!this.sessionId||!state?.activityId)return false;
    let live={};
    try{live=JSON.parse(localStorage.getItem('e-leap-r4-live-context')||'{}')||{}}catch(_){}
    const a=state.assessment||{};
    const total=Number(a.totalCount),correct=Number(a.correctCount);
    const isCorrect=Number.isFinite(total)&&total>0&&Number.isFinite(correct)?correct===total:null;
    try{
      const r=await fetch('/api/research/events',{
        method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          clientEventId:`core-submit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          sessionId:this.sessionId,classId:live.classId||null,participantId:live.participantId||null,
          lessonId:this.resourceId,activityId:state.activityId,eventType:'response.submitted',
          answer:state.response??null,isCorrect,score:Number.isFinite(Number(a.score))?Number(a.score):null,
          occurredAt:new Date().toISOString(),
          metadata:{source:'platform-core-submit-bridge-v1',studentId:live.studentId||null,payload:{response:state.response??null,grading:a},context:{role:'student',sessionId:this.sessionId,participantId:live.participantId||null,classId:live.classId||null}}
        })
      });
      return r.ok;
    }catch(_){return false}
  }

  _answerText(value,depth=0){
    if(depth>5||value==null)return '';
    if(typeof value==='object'&&!Array.isArray(value)){
      const list=Array.isArray(value.fields)?value.fields:(Array.isArray(value.inputs)?value.inputs:null);
      if(list){
        const rows=list.map((v,i)=>{
          const raw=(v?.display || v?.value || v?.answer || v?.text || v);
          const t=super._answerText(raw,depth+1);
          return t?`${i+1}. ${t}`:'';
        }).filter(Boolean);
        const selected=Array.isArray(value.selected)?value.selected.map(v=>super._answerText(v,depth+1)).filter(Boolean):[];
        return [...rows,...selected.map((t,i)=>`${rows.length+i+1}. ${t}`)].join('\n');
      }
      if('input' in value){const t=super._answerText(value.input,depth+1);if(t)return t;}
      if('inputs' in value){const t=super._answerText(value.inputs,depth+1);if(t)return t;}
    }
    return super._answerText(value,depth);
  }

  _activityLabel(id,index=0){
    const s=String(id||'');
    const named=s.match(/-a0*(\d+)(?:[a-z])?[-_](.+)$/i);
    if(named){
      const title=String(named[2]||'').replace(/[-_]+/g,' ').replace(/\b(ex|exercise)\s*(\d+)\b/ig,'Exercise $2').replace(/\b\w/g,c=>c.toUpperCase());
      return `Activity ${Number(named[1])}${title?` · ${title}`:''}`;
    }
    return super._activityLabel(id,index);
  }

  _grading(row){
    let meta=row?.metadata||{};if(typeof meta==='string'){try{meta=JSON.parse(meta)}catch{meta={}}}
    const g=meta?.payload?.grading||meta?.grading||{};
    const correct=Number(g.correctCount),total=Number(g.totalCount);
    return {correct:Number.isFinite(correct)?correct:null,total:Number.isFinite(total)?total:null};
  }

  _scoreText(row){
    const g=this._grading(row);
    if(g.correct!=null&&g.total!=null&&g.total>0)return `${g.correct}/${g.total}`;
    return scorePct(row?.score);
  }

  _avgText(people){
    const gs=people.map(x=>this._grading(x.row)).filter(g=>g.correct!=null&&g.total!=null&&g.total>0);
    if(gs.length&&gs.every(g=>g.total===gs[0].total)){
      const avg=gs.reduce((s,g)=>s+g.correct,0)/gs.length;
      return `${Math.round(avg*10)/10}/${gs[0].total}`;
    }
    const vals=people.map(x=>Number(x.row?.score)).filter(Number.isFinite);
    if(!vals.length)return '';
    return scorePct(vals.reduce((a,b)=>a+b,0)/vals.length);
  }

  _soundEnabled(){try{return localStorage.getItem('eleap.responses.sound')!=='off'}catch{return true}}
  _setSoundEnabled(on){try{localStorage.setItem('eleap.responses.sound',on?'on':'off')}catch(_){}this._rbSound=!!on}
  _playResponsePop(){
    if(!this._soundEnabled())return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=this._rbAudioCtx||(this._rbAudioCtx=new Ctx());
      const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(540,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(760,ctx.currentTime+.08);g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.055,ctx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.13);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.14);
    }catch(_){}
  }

  _injectResponseBoardStyles(){
    super._injectResponseBoardStyles();
    if(document.getElementById('e-leap-response-board-v3-style'))return;
    const s=document.createElement('style');s.id='e-leap-response-board-v3-style';s.textContent=`
      .eleap-rb-toolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-left:auto}.eleap-rb-tool{min-height:38px;border:1px solid #cdded5;border-radius:999px;background:#fff;color:#245347;padding:0 12px;font:800 12px/1 system-ui;cursor:pointer}.eleap-rb-tool.is-active{background:#1d5b4c;color:#fff;border-color:#1d5b4c}.eleap-rb-activity-name{font-size:13px;font-weight:800;color:#45665c;margin-top:4px}.eleap-rb-stage.is-wordcloud{display:flex;align-items:center;justify-content:center;align-content:center;gap:16px 22px;padding:35px}.eleap-rb-word{display:inline-flex;align-items:center;justify-content:center;font-weight:950;line-height:1.02;transform:rotate(var(--r));animation:eleapWordPop .55s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d);text-shadow:0 1px 0 #fff8}.eleap-rb-stage.is-focusmode{display:grid;place-items:center}.eleap-rb-spotlight{width:min(1040px,88%);border-radius:32px;padding:34px 42px;background:#fff;box-shadow:0 25px 70px rgba(23,63,56,.17);text-align:center}.eleap-rb-spotlight-name{font-size:20px;font-weight:900;color:#60756e}.eleap-rb-spotlight-answer{font-size:clamp(34px,5vw,72px);font-weight:950;color:#123d2d;line-height:1.12;white-space:pre-line;margin:18px 0}.eleap-rb-spotlight-nav{display:flex;justify-content:center;gap:10px}.eleap-rb-spotlight-nav button{min-height:40px;border:1px solid #d2e0da;border-radius:999px;background:#fff;color:#1d5b4c;font-weight:900;padding:0 16px;cursor:pointer}@keyframes eleapWordPop{0%{opacity:0;transform:scale(.2) rotate(var(--r))}75%{opacity:1;transform:scale(1.12) rotate(var(--r))}100%{opacity:1;transform:scale(1) rotate(var(--r))}}@media(max-width:800px){.eleap-rb-toolbar{width:100%;margin-left:0}.eleap-rb-tool{flex:1}.eleap-rb-spotlight{width:95%;padding:24px 18px}.eleap-rb-spotlight-answer{font-size:30px}}
    `;document.head.appendChild(s);
  }

  _wordCloud(people){
    const stop=new Set(['the','a','an','and','or','to','of','in','on','at','is','are','am','i','you','he','she','it','we','they','yes','no']);
    const freq=new Map();
    for(const x of people){
      const raw=this._answerText(x.row?.answer).replace(/^\s*\d+\.\s*/gm,'').trim();if(!raw)continue;
      const parts=(raw.length<=42&&!raw.includes('\n'))?[raw]:raw.split(/[\n,;|·]+|\s+/).map(t=>t.trim()).filter(t=>t.length>2&&!stop.has(t.toLowerCase()));
      for(const p of parts){const k=p.toLowerCase();const hit=freq.get(k)||{text:p,count:0};hit.count++;freq.set(k,hit)}
    }
    const arr=[...freq.values()].sort((a,b)=>b.count-a.count).slice(0,45);const max=Math.max(1,...arr.map(x=>x.count));
    return arr.map((x,i)=>{const size=20+Math.round((x.count/max)*42);const r=((i%9)-4)*2.2;return `<span class="eleap-rb-word" style="font-size:${size}px;color:${['#1d5b4c','#315f8a','#8d3f69','#8a6b20','#6d4d9b','#a34f35'][i%6]};--r:${r}deg;--d:${Math.min(i,24)*22}ms" title="${x.count} response(s)">${esc(x.text)}</span>`}).join('');
  }

  _renderResponseBoard(participants,events,activityId,opts={}){
    const body=document.getElementById('hostModalBody');if(!body)return;
    const card=body.closest('.host-modal-card');if(card)card.classList.add('eleap-response-board');
    const mode=opts.mode||this._rbMode||'cards';this._rbMode=mode;
    const rows=this._activityRows(events,activityId),latest=this._latestByParticipant(rows);
    const names=new Map(participants.map(p=>[String(p.participant_id),p.display_name||p.participant_code||`Student ${p.participant_id}`]));
    const people=[...latest.entries()].map(([pid,row])=>({pid,row,name:names.get(pid)||row?.metadata?.studentName||`Student ${pid}`}));
    people.sort((a,b)=>new Date(a.row?.occurred_at||0)-new Date(b.row?.occurred_at||0));
    const average=this._avgText(people),label=this._activityLabel(activityId),waiting=Math.max(0,participants.length-people.length);
    const cards=people.map((x,i)=>{const answer=this._answerText(x.row?.answer).trim()||'Submitted';const short=answer.length>300?answer.slice(0,297)+'…':answer;const sc=this._scoreText(x.row);const rot=((i%7)-3)*.55;return `<button class="eleap-rb-card" type="button" data-rb-index="${i}" style="background:${palette[i%palette.length]};--delay:${Math.min(i,30)*24}ms;--rot:${rot}deg;--from-x:${((i%5)-2)*90}px;--from-y:${((Math.floor(i/5)%5)-2)*58}px"><div class="eleap-rb-name">${esc(x.name)}</div><div class="eleap-rb-answer">${esc(short)}</div><div class="eleap-rb-foot"><span>${esc(sc)}</span><span>${esc(asTime(x.row?.occurred_at))}</span></div></button>`}).join('');
    const wc=this._wordCloud(people);
    const focusIndex=Math.min(this._rbFocusIndex||0,Math.max(0,people.length-1));this._rbFocusIndex=focusIndex;const fx=people[focusIndex];
    const spotlight=fx?`<div class="eleap-rb-spotlight"><div class="eleap-rb-spotlight-name">${esc(fx.name)}</div><div class="eleap-rb-spotlight-answer">${esc(this._answerText(fx.row?.answer).trim()||'Submitted')}</div><div class="eleap-rb-focus-score">${esc(this._scoreText(fx.row))}</div><div class="eleap-rb-spotlight-nav"><button type="button" id="eleapRbPrevFocus">← Previous</button><button type="button" id="eleapRbNextFocus">Next →</button></div></div>`:'';
    const stage=mode==='wordcloud'?(wc||'<div class="eleap-rb-empty">No responses yet for this activity.</div>'):mode==='focus'?(spotlight||'<div class="eleap-rb-empty">No responses yet for this activity.</div>'):(cards||'<div class="eleap-rb-empty">No responses yet for this activity.</div>');
    body.innerHTML=`<div class="eleap-rb-head"><div><div class="eleap-rb-title">Live Responses</div><div class="eleap-rb-activity-name">${esc(label)}</div><div class="eleap-rb-sub">Current activity only · previous activity data stays saved in Reports/Research</div></div><div class="eleap-rb-toolbar"><button class="eleap-rb-tool ${mode==='cards'?'is-active':''}" data-rb-mode="cards">Cards</button><button class="eleap-rb-tool ${mode==='wordcloud'?'is-active':''}" data-rb-mode="wordcloud">Word Cloud</button><button class="eleap-rb-tool ${mode==='focus'?'is-active':''}" data-rb-mode="focus">Focus</button><button class="eleap-rb-tool" id="eleapRbSound">Sound ${this._soundEnabled()?'ON':'OFF'}</button></div></div><div class="eleap-rb-metrics"><span class="eleap-rb-metric"><b>${people.length}/${participants.length||people.length}</b> Submitted</span><span class="eleap-rb-metric"><b>${waiting}</b> Waiting</span>${average?`<span class="eleap-rb-metric"><b>${esc(average)}</b> Average</span>`:''}</div><div class="eleap-rb-stage ${mode==='wordcloud'?'is-wordcloud':mode==='focus'?'is-focusmode':''}">${stage}</div><div class="eleap-rb-focus" id="eleapRbFocus" hidden><button class="eleap-rb-focus-close" id="eleapRbFocusClose" type="button">×</button><div class="eleap-rb-focus-card"><div class="eleap-rb-focus-name" id="eleapRbFocusName"></div><div class="eleap-rb-focus-answer" id="eleapRbFocusAnswer"></div><div class="eleap-rb-focus-score" id="eleapRbFocusScore"></div><div class="eleap-rb-detail" id="eleapRbFocusDetail"></div></div></div>`;
    body.querySelectorAll('[data-rb-mode]').forEach(b=>b.onclick=()=>{this._rbMode=b.dataset.rbMode;this._renderResponseBoard(participants,events,activityId,{mode:this._rbMode})});
    const sound=document.getElementById('eleapRbSound');if(sound)sound.onclick=()=>{this._setSoundEnabled(!this._soundEnabled());sound.textContent=`Sound ${this._soundEnabled()?'ON':'OFF'}`;if(this._soundEnabled())this._playResponsePop()};
    const focus=document.getElementById('eleapRbFocus'),close=document.getElementById('eleapRbFocusClose');if(close)close.onclick=()=>{if(focus)focus.hidden=true};
    body.querySelectorAll('[data-rb-index]').forEach(btn=>btn.onclick=()=>{const x=people[Number(btn.dataset.rbIndex)];if(!x||!focus)return;document.getElementById('eleapRbFocusName').textContent=x.name;document.getElementById('eleapRbFocusAnswer').textContent=this._answerText(x.row?.answer).trim()||'Submitted';document.getElementById('eleapRbFocusScore').textContent=this._scoreText(x.row);document.getElementById('eleapRbFocusDetail').textContent=`${label} · Submitted ${asTime(x.row?.occurred_at)}`;focus.hidden=false;});
    const prev=document.getElementById('eleapRbPrevFocus'),next=document.getElementById('eleapRbNextFocus');if(prev)prev.onclick=()=>{this._rbFocusIndex=(this._rbFocusIndex-1+people.length)%people.length;this._renderResponseBoard(participants,events,activityId,{mode:'focus'})};if(next)next.onclick=()=>{this._rbFocusIndex=(this._rbFocusIndex+1)%people.length;this._renderResponseBoard(participants,events,activityId,{mode:'focus'})};
  }

  async openResponses(){
    if(!this.sessionId||!['teacher','admin'].includes(this.role))return super.openResponses();
    this._injectResponseBoardStyles();this._rbMode=this._rbMode||'cards';
    const load=async(playSound=false)=>{
      const [participants,events]=await Promise.all([this._participants(),this._sessionEvents()]);
      const current=this._currentActivityId()||'';
      const rows=this._activityRows(events,current),count=this._latestByParticipant(rows).size;
      if(playSound&&count>(this._rbLastCount??count))this._playResponsePop();this._rbLastCount=count;
      this._renderResponseBoard(participants,events,current,{mode:this._rbMode});
    };
    await load(false);this.openModal();clearInterval(this._rbPoll);this._rbPoll=setInterval(()=>{if(!document.getElementById('hostUtilityModal')?.hidden)load(true).catch(()=>{})},1400);
  }

  closeModal(){clearInterval(this._rbPoll);this._rbPoll=null;return super.closeModal();}
}
