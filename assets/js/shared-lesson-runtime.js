import {ELeapRuntimeContext} from './runtime-context.js';
import {ELeapLearningEvents,LocalEventSink} from './learning-events.js';
import {getActivityDefinition} from './activity-registry.js';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export class ELeapSharedLessonRuntime{
  constructor({root,lesson,context={},eventSink=null}){
    if(!root) throw new Error('Runtime root is required.');
    if(!lesson?.id) throw new Error('Lesson schema requires id.');
    this.root=root; this.lesson=lesson; this.index=0;
    this.context=new ELeapRuntimeContext({...context,resourceId:lesson.resourceId||lesson.id});
    this.events=new ELeapLearningEvents({resourceId:lesson.resourceId||lesson.id,context:this.context.toJSON(),sink:eventSink||new LocalEventSink(),source:'shared-runtime'});
  }
  async mount(){
    document.documentElement.dataset.eleapRole=this.context.role;
    document.documentElement.dataset.eleapMode=this.context.mode;
    this.root.classList.add('eleap-native-runtime');
    await this.events.emit('lesson.opened',{studentId:this.context.studentId,sessionId:this.context.sessionId});
    this.render();
    window.addEventListener('pagehide',()=>this.events.emit('lesson.closed',{studentId:this.context.studentId,sessionId:this.context.sessionId}),{once:true});
    return this;
  }
  current(){return this.lesson.screens[this.index];}
  setIndex(i){if(i<0||i>=this.lesson.screens.length)return;this.index=i;this.render();}
  render(){
    const s=this.current();
    const canPresent=this.context.can('presentation:enter');
    this.root.innerHTML=`<section class="eleap-runtime-shell">
      <header class="eleap-runtime-head"><div><div class="eleap-kicker">${esc(this.lesson.courseLabel||'E-LEAP')} · ${esc(this.lesson.lessonNumber||'')}</div><h1>${esc(this.lesson.title)}</h1></div><div class="eleap-runtime-role">${esc(this.context.mode==='presentation'?'Presentation':this.context.role[0].toUpperCase()+this.context.role.slice(1))}</div></header>
      <main class="eleap-runtime-grid"><nav class="eleap-screen-nav" aria-label="Lesson sections">${this.lesson.screens.map((x,i)=>`<button data-screen="${i}" class="${i===this.index?'active':''}"><span>${String(i+1).padStart(2,'0')}</span>${esc(x.stage||x.title||'Screen')}</button>`).join('')}</nav>
      <article class="eleap-screen"><div class="eleap-screen-meta"><span>${esc(s.stage||'Lesson')}</span><span>${this.index+1} / ${this.lesson.screens.length}</span></div><h2>${esc(s.title||'')}</h2>${s.instruction?`<p class="eleap-instruction">${esc(s.instruction)}</p>`:''}<div class="eleap-activity" data-activity-id="${esc(s.activity?.id||s.id||'')}">${this.renderActivity(s.activity||s)}</div></article></main>
      <footer class="eleap-runtime-foot"><button data-prev ${this.index===0?'disabled':''}>← Previous</button><div>${canPresent?'<span class="eleap-capability-note">Teacher controls are role-bound by the shared runtime.</span>':''}</div><button data-next ${this.index===this.lesson.screens.length-1?'disabled':''}>Next →</button></footer>
    </section>`;
    this.root.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>this.setIndex(Number(b.dataset.screen)));
    this.root.querySelector('[data-prev]')?.addEventListener('click',()=>this.setIndex(this.index-1));
    this.root.querySelector('[data-next]')?.addEventListener('click',()=>this.setIndex(this.index+1));
    this.wireActivity(s.activity||s);
    this.events.emit('activity.viewed',{activityId:(s.activity||s).id||s.id,studentId:this.context.studentId,sessionId:this.context.sessionId});
  }
  renderActivity(a){
    const def=getActivityDefinition(a.type);
    if(!def) return `<div class="eleap-card"><b>Unsupported activity type:</b> ${esc(a.type||'unknown')}</div>`;
    if(a.type==='mcq'||a.type==='true-false'||a.type==='multi-select'){
      const inputType=a.type==='multi-select'?'checkbox':'radio';
      return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||'')}</p><div class="eleap-options">${(a.options||[]).map(o=>`<label data-option-id="${esc(o.id||o.value||o.label||o)}"><input type="${inputType}" name="answer" value="${esc(o.id||o.value||o.label||o)}"><span>${esc(o.label||o.value||o)}</span></label>`).join('')}</div>${this.studentActionBar(a)}</div>`;
    }
    if(a.type==='fill'||a.type==='writing') return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||'')}</p><textarea data-response rows="${a.type==='writing'?8:4}" placeholder="${esc(a.placeholder||'Type your answer…')}"></textarea>${this.studentActionBar(a)}</div>`;
    if(a.type==='click-reveal'||a.type==='flashcards') return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||'')}</p><div class="eleap-reveal-grid">${(a.items||[]).map((it,i)=>`<button data-reveal="${i}">${esc(it.front||it.question||it.prompt||('Item '+(i+1)))}</button>`).join('')}</div></div>`;
    return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||def.label)}</p><p class="eleap-muted">${esc(def.label)} uses the shared runtime contract. Renderer parity is being added template by template.</p>${this.studentActionBar(a)}</div>`;
  }
  studentActionBar(a){
    if(this.context.role==='student') return `<div class="eleap-actions"><button class="primary" data-submit>Submit</button><span data-status>Not submitted</span></div>`;
    if(this.context.role==='guest') return `<div class="eleap-actions"><span class="eleap-muted">Public practice preview</span></div>`;
    if(this.context.can('teacher:reveal')) return `<div class="eleap-actions"><button data-arm-check>Check / arm reveal</button><span data-status>Teacher mode</span></div>`;
    return '';
  }
  wireActivity(a){
    const host=this.root.querySelector('.eleap-activity');
    host?.querySelector('[data-submit]')?.addEventListener('click',async()=>{
      const response=this.collectResponse(a,host);
      host.querySelector('[data-status]').textContent='Submitted';
      await this.events.emit('response.submitted',{activityId:a.id,studentId:this.context.studentId,sessionId:this.context.sessionId,payload:{response}});
    });
    host?.querySelector('[data-arm-check]')?.addEventListener('click',()=>{
      if(!this.context.can('teacher:reveal')) return;
      host.dataset.revealArmed='1';
      host.querySelector('[data-status]').textContent='Reveal armed';
    });
    host?.querySelectorAll('[data-option-id]').forEach(label=>label.addEventListener('click',()=>{
      if(!this.context.can('teacher:reveal')||host.dataset.revealArmed!=='1') return;
      const key=new Set((a.answerKey||[]).map(String));
      const id=String(label.dataset.optionId||'');
      label.classList.add(key.has(id)?'eleap-answer-correct':'eleap-answer-incorrect');
    }));
    host?.querySelectorAll('[data-reveal]').forEach(btn=>btn.addEventListener('click',()=>{
      const teacher=this.context.can('teacher:reveal');
      const publicReveal=a.policy?.studentReveal===true;
      if(!teacher&&!publicReveal) return;
      if(teacher&&host.dataset.revealArmed!=='1') return;
      if(btn.dataset.revealed==='1')return;
      const i=Number(btn.dataset.reveal);
      const item=(a.items||[])[i]||{};
      const answer=item.answer||item.back||'';
      btn.dataset.revealed='1'; btn.insertAdjacentHTML('beforeend',`<strong class="eleap-revealed-answer">${esc(answer)}</strong>`);
    }));
  }
  collectResponse(a,host){
    if(a.type==='mcq'||a.type==='true-false') return host.querySelector('input[name="answer"]:checked')?.value||'';
    if(a.type==='multi-select') return [...host.querySelectorAll('input[name="answer"]:checked')].map(x=>x.value);
    if(a.type==='fill'||a.type==='writing') return host.querySelector('[data-response]')?.value||'';
    return null;
  }
}
