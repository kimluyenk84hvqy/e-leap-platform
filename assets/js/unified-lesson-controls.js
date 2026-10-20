import {UnifiedLessonControls as V3BaseUnifiedLessonControls} from './unified-lesson-controls-v3-base.js';

/**
 * E-LEAP Classroom P0 hotfix layer — mobile controls, legacy Follow Teacher,
 * legacy Submit bridging, and Hall Presentation sizing.
 * Keeps the approved v3 Responses Board/base behavior intact.
 */
export class UnifiedLessonControls extends V3BaseUnifiedLessonControls{
  constructor(opts={}){
    super(opts);
    this._injectClassroomP0Styles();
    this._installClassroomUxPatch();
  }

  _injectClassroomP0Styles(){
    if(document.getElementById('eleap-classroom-p0-style'))return;
    const s=document.createElement('style');
    s.id='eleap-classroom-p0-style';
    s.textContent=`
      /* Student phone: Check / Reset / Submit / Score are always visible. */
      @media(max-width:900px){
        html[data-eleap-role="student"] .unified-controls{
          position:fixed!important;left:6px!important;right:6px!important;bottom:6px!important;top:auto!important;
          transform:none!important;width:auto!important;max-width:none!important;max-height:none!important;
          display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;
          padding:7px!important;overflow:visible!important;border-radius:16px!important;z-index:80!important;
        }
        html[data-eleap-role="student"] .unified-controls .unified-group{display:contents!important}
        html[data-eleap-role="student"] .unified-controls .unified-group+.unified-group{border:0!important;padding:0!important}
        html[data-eleap-role="student"] .unified-controls .dock-label,
        html[data-eleap-role="student"] .unified-controls .dock-toggle,
        html[data-eleap-role="student"] .unified-controls .host-practice-pill{display:none!important}
        html[data-eleap-role="student"] .unified-controls button{
          display:inline-flex!important;width:100%!important;min-width:0!important;min-height:48px!important;
          padding:0 4px!important;justify-content:center!important;font-size:12px!important;font-weight:900!important;
          white-space:nowrap!important;
        }
        html[data-eleap-role="student"] .unified-controls #hostSubmitBtn{
          display:inline-flex!important;visibility:visible!important;opacity:1!important;background:#1d5b4c!important;
          color:#fff!important;border-color:#1d5b4c!important;
        }
        html[data-eleap-role="student"] .unified-controls .host-score-pill{
          display:inline-flex!important;visibility:visible!important;min-height:48px!important;align-items:center!important;
          justify-content:center!important;margin:0!important;padding:0 4px!important;font-size:11px!important;font-weight:900!important;
        }
      }
      @media(max-width:420px){
        html[data-eleap-role="student"] .unified-controls button{font-size:11px!important;min-height:46px!important}
        html[data-eleap-role="student"] .unified-controls .host-score-pill{font-size:10px!important;min-height:46px!important}
      }

      /* Hall presentation: magnify the lesson viewport without changing the Student phone layout. */
      html[data-eleap-mode="presentation"] #stage{overflow:hidden!important;background:#fff!important}
      html[data-eleap-mode="presentation"] .lesson-frame{
        zoom:2!important;width:50%!important;height:50%!important;min-height:50%!important;
        transform-origin:0 0!important;background:#fff!important;
      }
      @media(min-width:1800px){
        html[data-eleap-mode="presentation"] .lesson-frame{zoom:2.35!important;width:42.553%!important;height:42.553%!important}
      }
    `;
    document.head.appendChild(s);
  }

  _installClassroomUxPatch(){
    if(this.role!=='student'||!this.sessionId)return;
    const apply=()=>{
      try{
        const d=this.frame?.contentDocument;if(!d?.head)return;
        if(d.getElementById('eleap-student-follow-lock-style'))return;
        const st=d.createElement('style');st.id='eleap-student-follow-lock-style';
        st.textContent=`#prev,#next,#classroomPrev,#classroomNext,.screen-prev,.screen-next,[data-screen-nav],[data-nav="prev"],[data-nav="next"]{display:none!important}`;
        d.head.appendChild(st);
      }catch(_){}
    };
    this.frame?.addEventListener?.('load',()=>setTimeout(apply,120));
    setTimeout(apply,180);
  }

  _domScreenNumber(){
    try{
      const d=this.frame?.contentDocument;
      const active=d?.querySelector?.('.slide.active,.screen.active,[data-slide].active,[data-screen].active');
      const n=Number(active?.dataset?.slide||active?.dataset?.screen);
      if(Number.isFinite(n)&&n>0)return n;
      const txt=d?.querySelector?.('#counter,#classroomCounter,[data-screen-counter],[data-slide-counter]')?.textContent||'';
      const m=txt.match(/\d+/);if(m)return Number(m[0]);
    }catch(_){}
    return null;
  }

  async _goToTeacherScreen(target){
    if(!Number.isFinite(target)||target<1)return false;
    const current=()=>this._domScreenNumber()||this._currentScreenNumber?.()||null;
    if(Number(current())===Number(target))return true;

    /* New lessons: use their native API first. */
    try{
      const state=this._inspect?.()||null,idx=Number(state?.screenIndex),api=this._api?.();
      if(Number.isFinite(idx)&&idx>=0&&api&&typeof api.setScreen==='function'){
        const ok=api.setScreen(target-1);
        if(ok!==false){await new Promise(r=>setTimeout(r,100));if(Number(current())===Number(target))return true;}
      }
    }catch(_){}

    /* Legacy B2/Writing lessons: deterministic DOM navigation adapter. */
    try{
      let now=Number(current()),guard=0;
      while(Number.isFinite(now)&&now!==target&&guard++<80){
        const d=this.frame?.contentDocument;if(!d)break;
        const forward=target>now;
        const selectors=forward
          ?'#next,#classroomNext,.screen-next,[data-screen-nav="next"],[data-nav="next"],button[aria-label*="Next" i]'
          :'#prev,#classroomPrev,.screen-prev,[data-screen-nav="prev"],[data-nav="prev"],button[aria-label*="Previous" i]';
        const btn=[...(d.querySelectorAll(selectors)||[])].find(el=>!el.disabled&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
        if(!btn)break;
        btn.click();
        await new Promise(r=>setTimeout(r,130));
        const next=Number(current());if(!Number.isFinite(next)||next===now)break;now=next;
      }
      if(Number(current())===Number(target))return true;
    }catch(_){}

    return super._goToTeacherScreen(target);
  }

  async _ensureLegacySubmission(state){
    if(this.role!=='student'||!this.sessionId||!state?.activityId)return false;
    let live={};try{live=JSON.parse(localStorage.getItem('e-leap-r4-live-context')||'{}')||{}}catch(_){}
    await new Promise(r=>setTimeout(r,420));
    try{
      const r=await fetch(`/api/research/events?sessionId=${encodeURIComponent(this.sessionId)}`,{credentials:'same-origin',cache:'no-store'});
      if(r.ok){
        const d=await r.json(),rows=Array.isArray(d?.events)?d.events:[];
        const cutoff=Date.now()-5000;
        const exists=rows.some(e=>String(e.event_type||e.eventType)==='response.submitted'&&String(e.activity_id||e.activityId||'')===String(state.activityId)&&(!live.participantId||String(e.participant_id||e.participantId||'')===String(live.participantId))&&new Date(e.occurred_at||e.occurredAt||0).getTime()>=cutoff);
        if(exists)return true;
      }
    }catch(_){}
    return this._syncObjectSubmission(state);
  }

  _command(action){
    try{
      const api=this._api?.();if(!api?.command)return false;
      const out=api.command(action);
      const ok=out===true||Boolean(out&&typeof out==='object');
      if(ok&&String(action||'').toLowerCase()==='submit'){
        if(out&&typeof out==='object')this._syncObjectSubmission(out).catch(()=>{});
        else{
          const state=api.getActivityState?.()||null;
          if(state)this._ensureLegacySubmission(state).catch(()=>{});
        }
      }
      return ok;
    }catch(_){return false}
  }
}
