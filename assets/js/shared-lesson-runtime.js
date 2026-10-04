import {ELeapRuntimeContext} from './runtime-context.js';
import {ELeapLearningEvents,LocalEventSink} from './learning-events.js';
import {getActivityDefinition} from './activity-registry.js';

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

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
  roleLabel(){return this.context.mode==='presentation'?'Presentation':this.context.role[0].toUpperCase()+this.context.role.slice(1);}
  studioLink(){
    if(!this.context.can('content:edit')) return '';
    const href=this.lesson.authoringPath||'../studio/index.html';
    return `<a class="eleap-studio-link" href="${esc(href)}">Edit in Studio</a>`;
  }
  render(){
    const s=this.current();
    const canPresent=this.context.can('presentation:enter');
    this.root.innerHTML=`<section class="eleap-runtime-shell">
      <header class="eleap-runtime-head"><div><div class="eleap-kicker">${esc(this.lesson.courseLabel||'E-LEAP')} · ${esc(this.lesson.lessonNumber||'')}</div><h1>${esc(this.lesson.title)}</h1></div><div class="eleap-runtime-head-actions">${this.studioLink()}<div class="eleap-runtime-role">${esc(this.roleLabel())}</div></div></header>
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
      return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||'')}</p><div class="eleap-options">${(a.options||[]).map(o=>`<label data-option-id="${esc(o.id||o.value||o.label||o)}"><input type="${inputType}" name="answer" value="${esc(o.id||o.value||o.label||o)}"><span>${esc(o.label||o.value||o)}</span></label>`).join('')}</div>${this.choiceActionBar(a)}</div>`;
    }
    if(a.type==='fill'||a.type==='writing'){
      const teacherView=this.context.role==='teacher'||this.context.role==='admin';
      const responseArea=teacherView
        ? `<div class="eleap-teacher-response-board" data-response-board><strong>Responses</strong><p class="eleap-muted">Student responses will appear here during a live session.</p></div>`
        : `<textarea data-response rows="${a.type==='writing'?8:4}" placeholder="${esc(a.placeholder||'Type your answer…')}"></textarea>`;
      return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||'')}</p>${responseArea}${this.responseActionBar(a)}</div>`;
    }
    if(a.type==='click-reveal'||a.type==='flashcards') return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||'')}</p><div class="eleap-reveal-grid">${(a.items||[]).map((it,i)=>`<button data-reveal="${i}">${esc(it.front||it.question||it.prompt||('Item '+(i+1)))}</button>`).join('')}</div>${this.revealActionBar(a)}</div>`;
    return `<div class="eleap-card"><p class="eleap-question">${esc(a.prompt||def.label)}</p><p class="eleap-muted">${esc(def.label)} uses the shared runtime contract. Renderer parity is being added template by template.</p>${this.choiceActionBar(a)}</div>`;
  }
  choiceActionBar(a){
    if(this.context.role==='student') return `<div class="eleap-actions"><button class="primary" data-submit>Submit</button><span data-status>Not submitted</span></div>`;
    if(this.context.role==='guest') return `<div class="eleap-actions"><button class="primary" data-guest-check>Check answer</button><span data-status>Public practice · progress is not saved</span></div>`;
    if(this.context.can('teacher:reveal')) return `<div class="eleap-actions"><button data-arm-check>Check / arm reveal</button><span data-status>Teacher mode</span></div>`;
    return '';
  }
  revealActionBar(a){
    if(this.context.can('teacher:reveal')) return `<div class="eleap-actions"><button data-arm-check>Arm reveal</button><span data-status>Teacher mode</span></div>`;
    if(this.context.role==='student' && a.policy?.studentReveal===true) return `<div class="eleap-actions"><span class="eleap-muted">Tap a card to reveal</span></div>`;
    if(this.context.role==='guest' && (a.policy?.guestReveal===true||a.policy?.publicPracticeReveal===true)) return `<div class="eleap-actions"><button class="primary" data-guest-reveal>Show answer</button><span data-status>Public practice · answer can be viewed</span></div>`;
    const msg=this.context.role==='guest'?'Answer reveal is not available in this public activity.':'Answer reveal is controlled by the teacher.';
    return `<div class="eleap-actions"><span class="eleap-muted">${esc(msg)}</span></div>`;
  }
  responseActionBar(a){
    if(this.context.role==='student') return `<div class="eleap-actions"><button class="primary" data-submit>Submit</button><span data-status>Not submitted</span></div>`;
    if(this.context.role==='guest'){
      const hasModel=Boolean(a.modelAnswer || (Array.isArray(a.answerKey)&&a.answerKey.length));
      const compare=hasModel?'<button data-model-answer>Compare with model answer</button>':'';
      return `<div class="eleap-actions"><button class="primary" data-guest-finish>Finish practice</button>${compare}<span data-status>Public practice · response is not saved</span></div>`;
    }
    if(this.context.role==='teacher'||this.context.role==='admin'){
      const hasModel=Boolean(a.modelAnswer || (Array.isArray(a.answerKey)&&a.answerKey.length));
      const modelBtn=hasModel?'<button data-model-answer>Show model answer</button>':'';
      return `<div class="eleap-actions">${modelBtn}<span data-status>Teacher mode · responses will appear in Responses</span></div>`;
    }
    return '';
  }
  wireActivity(a){
    const host=this.root.querySelector('.eleap-activity');
    host?.querySelector('[data-submit]')?.addEventListener('click',async()=>{
      const response=this.collectResponse(a,host);
      host.querySelector('[data-status]').textContent='Submitted';
      await this.events.emit('response.submitted',{activityId:a.id,studentId:this.context.studentId,sessionId:this.context.sessionId,payload:{response}});
    });
    host?.querySelector('[data-guest-check]')?.addEventListener('click',()=>{
      const response=this.collectResponse(a,host);
      const keys=(a.answerKey||[]).map(String);
      let ok=false;
      if(Array.isArray(response)) ok=response.length===keys.length&&response.map(String).sort().join('|')===keys.slice().sort().join('|');
      else ok=keys.includes(String(response));
      host.querySelector('[data-status]').textContent=response===''||response==null?'Choose an answer first':(ok?'Correct':'Not quite · try again');
      host.querySelectorAll('[data-option-id]').forEach(label=>{
        const id=String(label.dataset.optionId||'');
        if(String(response)===id || (Array.isArray(response)&&response.map(String).includes(id))) label.classList.toggle('eleap-answer-correct',ok);
      });
    });
    host?.querySelector('[data-guest-finish]')?.addEventListener('click',()=>{
      const response=this.collectResponse(a,host);
      host.querySelector('[data-status]').textContent=String(response||'').trim()?'Practice completed · not saved':'Write a response first';
    });
    host?.querySelector('[data-arm-check]')?.addEventListener('click',()=>{
      if(!this.context.can('teacher:reveal')) return;
      host.dataset.revealArmed='1';
      host.querySelector('[data-status]').textContent='Reveal armed';
    });
    host?.querySelector('[data-guest-reveal]')?.addEventListener('click',()=>{
      host.dataset.guestRevealArmed='1';
      host.querySelector('[data-status]').textContent='Tap the card to show the answer';
    });
    host?.querySelector('[data-model-answer]')?.addEventListener('click',(e)=>{
      const allowed=['guest','teacher','admin'].includes(this.context.role);
      if(!allowed) return;
      const answer=a.modelAnswer || (Array.isArray(a.answerKey)?a.answerKey.join(' / '):'');
      if(!answer) return;
      let box=host.querySelector('[data-model-answer-box]');
      if(!box){
        box=document.createElement('div');
        box.setAttribute('data-model-answer-box','1');
        box.className='eleap-model-answer';
        box.innerHTML=`<strong>Model answer</strong><p>${esc(answer)}</p>`;
        const actions=host.querySelector('.eleap-actions');
        actions?.before(box);
      } else { box.hidden=!box.hidden; }
      e.currentTarget.textContent=box.hidden?(this.context.role==='guest'?'Compare with model answer':'Show model answer'):'Hide model answer';
    });
    host?.querySelectorAll('[data-option-id]').forEach(label=>label.addEventListener('click',()=>{
      if(!this.context.can('teacher:reveal')||host.dataset.revealArmed!=='1') return;
      const key=new Set((a.answerKey||[]).map(String));
      const id=String(label.dataset.optionId||'');
      label.classList.add(key.has(id)?'eleap-answer-correct':'eleap-answer-incorrect');
    }));
    host?.querySelectorAll('[data-reveal]').forEach(btn=>btn.addEventListener('click',()=>{
      const teacher=this.context.can('teacher:reveal');
      const studentPublic=this.context.role==='student'&&a.policy?.studentReveal===true;
      const guestPublic=this.context.role==='guest'&&(a.policy?.guestReveal===true||a.policy?.publicPracticeReveal===true);
      if(!teacher&&!studentPublic&&!guestPublic) return;
      if(teacher&&host.dataset.revealArmed!=='1') return;
      if(guestPublic&&host.dataset.guestRevealArmed!=='1') return;
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
