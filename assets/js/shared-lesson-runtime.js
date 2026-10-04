import {ELeapRuntimeContext} from './runtime-context.js';
import {ELeapLearningEvents,LocalEventSink} from './learning-events.js';
import {getActivityDefinition} from './activity-registry.js';
import {ELeapAutosaveStore} from './autosave-store.js';
import {ELeapMediaResolver} from './media-resolver.js';
import {normalizeAssessment,scoreText,detailText} from './grading-core.js';
import {inlineActivityControlsHTML} from './controls/control-shell.js';

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

export class ELeapSharedLessonRuntime{
  constructor({root,lesson,context={},eventSink=null}){
    if(!root) throw new Error('Runtime root is required.');
    if(!lesson?.id) throw new Error('Lesson schema requires id.');
    this.root=root; this.lesson=lesson; this.index=0;
    this.context=new ELeapRuntimeContext({...context,resourceId:lesson.resourceId||lesson.id});
    this.events=new ELeapLearningEvents({resourceId:lesson.resourceId||lesson.id,context:this.context.toJSON(),sink:eventSink||new LocalEventSink(),source:'shared-runtime'});
    this.autosave=new ELeapAutosaveStore();
    this.media=new ELeapMediaResolver({basePath:'..'});
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
      <article class="eleap-screen"><div class="eleap-screen-meta"><span>${esc(s.stage||'Lesson')}</span><span>${this.index+1} / ${this.lesson.screens.length}</span></div><h2>${esc(s.title||'')}</h2>${s.instruction?`<p class="eleap-instruction">${esc(s.instruction)}</p>`:''}${this.renderScreenBody(s)}</article></main>
      <footer class="eleap-runtime-foot"><button data-prev ${this.index===0?'disabled':''}>← Previous</button><div>${canPresent?'<span class="eleap-capability-note">Teacher controls are role-bound by the shared runtime.</span>':''}</div><button data-next ${this.index===this.lesson.screens.length-1?'disabled':''}>Next →</button></footer>
    </section>`;
    this.root.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>this.setIndex(Number(b.dataset.screen)));
    this.root.querySelector('[data-prev]')?.addEventListener('click',()=>this.setIndex(this.index-1));
    this.root.querySelector('[data-next]')?.addEventListener('click',()=>this.setIndex(this.index+1));
    const activities=this.screenActivities(s);
    if(activities.length){
      activities.forEach(({activity,index})=>{
        const host=this.root.querySelector(`[data-block-activity="${index}"]`)||this.root.querySelector('.eleap-activity');
        if(host) this.wireActivity(activity,host);
        this.events.emit('activity.viewed',{activityId:activity.id||s.id,studentId:this.context.studentId,sessionId:this.context.sessionId});
      });
    }else{
      this.wireActivity(s.activity||s,this.root.querySelector('.eleap-activity'));
      this.events.emit('activity.viewed',{activityId:(s.activity||s).id||s.id,studentId:this.context.studentId,sessionId:this.context.sessionId});
    }
  }
  screenActivities(s){
    if(Array.isArray(s.blocks)) return s.blocks.map((b,index)=>({block:b,index,activity:b.activity?this.normalizeAuthoredActivity(b.activity,b.type):null})).filter(x=>x.activity);
    return [];
  }
  renderScreenBody(s){
    if(!Array.isArray(s.blocks)||!s.blocks.length) return `<div class="eleap-activity" data-activity-id="${esc(s.activity?.id||s.id||'')}">${this.renderActivity(s.activity||s)}</div>`;
    return `<div class="eleap-authored-blocks">${s.blocks.map((b,index)=>this.renderAuthoredBlock(b,index)).join('')}</div>`;
  }
  renderAuthoredBlock(b,index){
    const c=b.content||{};
    if(b.type==='text') return `<section class="eleap-content-block eleap-text-block">${c.role==='h1'?`<h2>${esc(c.text||'')}</h2>`:c.role==='h2'?`<h3>${esc(c.text||'')}</h3>`:`<p>${esc(c.text||'')}</p>`}</section>`;
    if(b.type==='image') return `<section class="eleap-content-block">${this.media.render({type:'image',src:c.src,alt:c.alt,title:c.caption})}</section>`;
    if(b.type==='audio') return `<section class="eleap-content-block">${this.media.render({type:'audio',src:c.src,title:c.label})}${c.transcript?`<details class="eleap-transcript"><summary>Transcript</summary><p>${esc(c.transcript)}</p></details>`:''}</section>`;
    if(b.type==='video') return `<section class="eleap-content-block">${this.media.render({type:'video',src:c.src,poster:c.poster,title:c.caption||c.label})}</section>`;
    if(b.type==='vocabulary') return `<section class="eleap-content-block eleap-card"><div class="eleap-vocab-grid">${(c.items||[]).map(x=>`<article><strong>${esc(x.word||'')}</strong><span>${esc(x.meaning||'')}</span>${x.example?`<small>${esc(x.example)}</small>`:''}</article>`).join('')}</div></section>`;
    if(b.type==='grammar-note') return `<section class="eleap-content-block eleap-card"><h3>${esc(c.rule||'Grammar')}</h3>${c.form?`<p><strong>${esc(c.form)}</strong></p>`:''}${(c.examples||[]).map(x=>`<p>${esc(x)}</p>`).join('')}</section>`;
    if(b.activity){const a=this.normalizeAuthoredActivity(b.activity,b.type);return `<section class="eleap-activity eleap-authored-activity" data-block-activity="${index}" data-activity-id="${esc(a.id||b.id||'')}">${this.renderActivity(a)}</section>`;}
    return '';
  }
  normalizeAuthoredActivity(a,type){
    const out={...a,type:type||a.type};
    if(out.media && !Array.isArray(out.media)){
      const m=out.media;
      if(m.src) out.media=[{type:m.kind||((out.type==='listening')?'audio':(out.type==='video-question'?'video':'image')),src:m.src,title:m.title||''}];
    }
    if(out.type==='matching' && Array.isArray(out.pairs)){
      out.items=out.pairs.map((p,i)=>({id:p.id||String(i+1),label:p.left}));
      out.choices=out.pairs.map((p,i)=>({id:p.id||String(i+1),label:p.right}));
      out.answerKey=Object.fromEntries(out.pairs.map((p,i)=>[p.id||String(i+1),p.id||String(i+1)]));
    }
    if(out.type==='categorising'){
      out.categories=(out.categories||[]).map(c=>typeof c==='string'?{id:c,label:c}:c);
      out.items=(out.items||[]).map((x,i)=>({id:x.id||String(i+1),label:x.label||x.text||'',category:x.category}));
      out.answerKey=Object.fromEntries(out.items.map(x=>[x.id,x.category]));
    }
    if(out.type==='ordering'){
      out.items=(out.items||[]).map((x,i)=>({id:x.id||String(i+1),label:x.label||x.text||String(x)}));
      out.answerKey=out.answerKey?.length?out.answerKey:out.items.map(x=>x.id);
    }
    if(out.type==='fill' && Array.isArray(out.items)){
      /* Shared runtime v1 uses a single response field. Multiple fill items stay assessable in Studio/next renderer; preserve first prompt/answers for backward-compatible runtime preview. */
      if(out.items[0]){out.prompt=out.items.length===1?(out.items[0].prompt||out.prompt):out.prompt;out.answerKey=out.items[0].answers||out.answerKey;}
    }
    return out;
  }
  renderActivity(a){
    const def=getActivityDefinition(a.type);
    if(!def) return `<div class="eleap-card"><b>Unsupported activity type:</b> ${esc(a.type||'unknown')}</div>`;
    const media=(a.media||[]).map(m=>this.media.render(m)).join('');
    if(a.type==='mcq'||a.type==='true-false'||a.type==='multi-select'||a.type==='poll'){
      const inputType=a.type==='multi-select'?'checkbox':'radio';
      return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'')}</p><div class="eleap-options">${(a.options||[]).map(o=>`<label data-option-id="${esc(o.id||o.value||o.label||o)}"><input type="${inputType}" name="answer" value="${esc(o.id||o.value||o.label||o)}"><span>${esc(o.label||o.value||o)}</span></label>`).join('')}</div>${a.type==='poll'?this.pollActionBar(a):this.choiceActionBar(a)}</div>`;
    }
    if(a.type==='fill'||a.type==='writing'||a.type==='discussion'){
      const teacherView=this.context.role==='teacher'||this.context.role==='admin';
      const responseArea=teacherView
        ? `<div class="eleap-teacher-response-board" data-response-board><strong>Responses</strong><p class="eleap-muted">Student responses will appear here during a live session.</p></div>`
        : `<textarea data-response rows="${a.type==='writing'||a.type==='discussion'?8:4}" placeholder="${esc(a.placeholder||'Type your answer…')}"></textarea>`;
      return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'')}</p>${responseArea}${this.responseActionBar(a)}</div>`;
    }
    if(a.type==='click-reveal'||a.type==='flashcards') return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'')}</p><div class="eleap-reveal-grid">${(a.items||[]).map((it,i)=>`<button data-reveal="${i}">${esc(it.front||it.question||it.prompt||('Item '+(i+1)))}</button>`).join('')}</div>${this.revealActionBar(a)}</div>`;
    if(a.type==='matching'){
      const choices=(a.choices||a.rightItems||[]);
      return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'Match the items.')}</p><div class="eleap-match-list">${(a.items||a.leftItems||[]).map((it,i)=>`<label class="eleap-match-row"><span>${esc(it.label||it.left||it.prompt||('Item '+(i+1)))}</span><select data-match="${esc(it.id||i)}"><option value="">Choose…</option>${choices.map(c=>`<option value="${esc(c.id||c.value||c.label||c)}">${esc(c.label||c.value||c)}</option>`).join('')}</select></label>`).join('')}</div>${this.choiceActionBar(a)}</div>`;
    }
    if(a.type==='ordering'){
      return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'Put the items in order.')}</p><ol class="eleap-order-list">${(a.items||[]).map((it,i)=>`<li data-order-id="${esc(it.id||i)}"><span>${esc(it.label||it.value||it)}</span><span class="eleap-order-buttons"><button type="button" data-move-up="${i}" aria-label="Move up">↑</button><button type="button" data-move-down="${i}" aria-label="Move down">↓</button></span></li>`).join('')}</ol>${this.choiceActionBar(a)}</div>`;
    }
    if(a.type==='categorising'){
      return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'Sort each item into a category.')}</p><div class="eleap-category-list">${(a.items||[]).map((it,i)=>`<label class="eleap-match-row"><span>${esc(it.label||it.value||it)}</span><select data-category="${esc(it.id||i)}"><option value="">Choose…</option>${(a.categories||[]).map(c=>`<option value="${esc(c.id||c.value||c.label||c)}">${esc(c.label||c.value||c)}</option>`).join('')}</select></label>`).join('')}</div>${this.choiceActionBar(a)}</div>`;
    }
    if(a.type==='listening'||a.type==='video-question'){
      const m=a.media?.[0]||{type:a.type==='listening'?'audio':'video',src:a.src||a.audioSrc||a.videoSrc,title:a.mediaTitle||''};
      return `<div class="eleap-card">${this.media.render(m)}<p class="eleap-question">${esc(a.prompt||'')}</p>${this.renderEmbeddedResponse(a)}</div>`;
    }
    if(a.type==='speaking-record') return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||'')}</p>${this.renderSpeakingRecorder(a)}</div>`;
    return `<div class="eleap-card">${media}<p class="eleap-question">${esc(a.prompt||def.label)}</p><p class="eleap-muted">${esc(def.label)} uses the shared runtime contract.</p>${this.choiceActionBar(a)}</div>`;
  }
  renderEmbeddedResponse(a){
    const mode=a.responseType||'mcq';
    if(mode==='writing'||mode==='fill'){
      const teacherView=this.context.role==='teacher'||this.context.role==='admin';
      const area=teacherView?`<div class="eleap-teacher-response-board"><strong>Responses</strong><p class="eleap-muted">Responses appear here during a live session.</p></div>`:`<textarea data-response rows="4" placeholder="${esc(a.placeholder||'Type your answer…')}"></textarea>`;
      return `${area}${this.responseActionBar(a)}`;
    }
    const inputType=mode==='multi-select'?'checkbox':'radio';
    return `<div class="eleap-options">${(a.options||[]).map(o=>`<label data-option-id="${esc(o.id||o.value||o.label||o)}"><input type="${inputType}" name="answer" value="${esc(o.id||o.value||o.label||o)}"><span>${esc(o.label||o.value||o)}</span></label>`).join('')}</div>${this.choiceActionBar(a)}`;
  }
  renderSpeakingRecorder(a){
    if(this.context.role==='teacher'||this.context.role==='admin') return `<div class="eleap-teacher-response-board"><strong>Recorded responses</strong><p class="eleap-muted">Student recordings will appear here during a live session.</p></div>`;
    if(this.context.role==='guest') return `<div class="eleap-recorder"><button type="button" data-record-start>Record practice</button><button type="button" data-record-stop disabled>Stop</button><audio data-record-preview controls hidden></audio><span data-status>Practice recording is not saved.</span></div>`;
    return `<div class="eleap-recorder"><button type="button" data-record-start>Record</button><button type="button" data-record-stop disabled>Stop</button><audio data-record-preview controls hidden></audio><button class="primary" type="button" data-submit-recording disabled>Submit recording</button><span data-status>Ready</span></div>`;
  }
  pollActionBar(a){
    return inlineActivityControlsHTML({
      role:this.context.role,
      presentation:this.context.mode==='presentation',
      capabilities:{check:false,reset:true,reveal:false,submit:this.context.role==='student',score:false}
    });
  }
  choiceActionBar(a){
    const objective=a.answerKey!=null;
    return inlineActivityControlsHTML({
      role:this.context.role,
      presentation:this.context.mode==='presentation',
      capabilities:{check:objective,reset:true,reveal:objective,submit:this.context.role==='student',score:objective}
    });
  }
  revealActionBar(a){
    const hasAnswer=Boolean(a.modelAnswer||a.answerKey||(a.items||[]).some(x=>x.answer||x.back));
    return inlineActivityControlsHTML({
      role:this.context.role,
      presentation:this.context.mode==='presentation',
      capabilities:{check:false,reset:true,reveal:hasAnswer,submit:false,score:false}
    });
  }
  responseActionBar(a){
    const objective=a.answerKey!=null;
    const hasModel=Boolean(a.modelAnswer||a.answerKey);
    return inlineActivityControlsHTML({
      role:this.context.role,
      presentation:this.context.mode==='presentation',
      capabilities:{check:objective,reset:true,reveal:hasModel,submit:this.context.role==='student',score:objective}
    });
  }
  gradeActivity(a,response){
    const norm=v=>String(v??'').trim().toLowerCase();
    let total=0,answered=0,correct=0;
    const key=a.answerKey;
    if(a.type==='mcq'||a.type==='true-false'||a.type==='video-question'||a.type==='listening'){
      const keys=Array.isArray(key)?key:[key];
      if(keys.filter(v=>v!=null).length){total=1;answered=norm(response)?1:0;correct=answered&&keys.some(k=>norm(k)===norm(response))?1:0;}
    }else if(a.type==='multi-select'&&Array.isArray(key)){
      total=key.length||1;const vals=Array.isArray(response)?response:[];answered=vals.length;correct=vals.filter(v=>key.map(norm).includes(norm(v))).length;
    }else if((a.type==='matching'||a.type==='categorising')&&key&&typeof key==='object'&&!Array.isArray(key)){
      const entries=Object.entries(key);total=entries.length;entries.forEach(([k,v])=>{const got=response?.[k];if(norm(got)){answered++;if(norm(got)===norm(v))correct++;}});
    }else if(a.type==='ordering'&&Array.isArray(key)){
      total=key.length;const vals=Array.isArray(response)?response:[];answered=Math.min(vals.length,total);correct=key.reduce((n,v,i)=>n+(norm(vals[i])===norm(v)?1:0),0);
    }else if((a.type==='fill'||a.type==='writing'||a.type==='discussion')&&key!=null){
      const keys=Array.isArray(key)?key:[key];total=1;answered=norm(response)?1:0;correct=answered&&keys.some(k=>norm(k)===norm(response))?1:0;
    }
    if(!total)return normalizeAssessment({score:null},{value:response});
    return normalizeAssessment({correctCount:correct,answeredCount:answered,totalCount:total,isCorrect:correct===total,score:correct/total},response);
  }
  setGradeStatus(host,g,{submitted=false}={}){
    const st=host?.querySelector('[data-status]');if(!st)return;st.textContent=scoreText(g,{submitted});st.title=detailText(g);
  }
  resetActivity(){this.render();}
  wireActivity(a,host=this.root.querySelector('.eleap-activity')){
    this.restoreAutosave(a,host);
    host?.querySelector('[data-response]')?.addEventListener('input',(e)=>this.saveAutosave(a,e.target.value));
    host?.querySelectorAll('[data-move-up],[data-move-down]').forEach(btn=>btn.addEventListener('click',()=>{
      const li=btn.closest('[data-order-id]'); if(!li) return;
      if(btn.hasAttribute('data-move-up')&&li.previousElementSibling) li.parentElement.insertBefore(li,li.previousElementSibling);
      if(btn.hasAttribute('data-move-down')&&li.nextElementSibling) li.parentElement.insertBefore(li.nextElementSibling,li);
    }));
    this.wireRecorder(a,host);
    host?.querySelector('[data-check]')?.addEventListener('click',()=>{
      const response=this.collectResponse(a,host);const g=this.gradeActivity(a,response);this.setGradeStatus(host,g);
    });
    host?.querySelector('[data-reset]')?.addEventListener('click',()=>this.resetActivity());
    host?.querySelector('[data-show-answer]')?.addEventListener('click',()=>{
      if(!(this.context.role==='teacher'||this.context.role==='admin'||this.context.mode==='presentation')) return;
      const labels=new Map((a.options||[]).map(o=>[String(o.id||o.value||o.label||o),String(o.label||o.value||o)]));
      const key=a.answerKey;
      let answer='';
      if(a.modelAnswer) answer=String(a.modelAnswer);
      else if(Array.isArray(key)) answer=key.map(x=>labels.get(String(x))||String(x)).join(' / ');
      else if(key&&typeof key==='object') answer=Object.entries(key).map(([k,v])=>`${k}: ${v}`).join(' · ');
      else if(key!=null) answer=labels.get(String(key))||String(key);
      const st=host?.querySelector('[data-status]');if(st)st.textContent=answer?`Answer: ${answer}`:'No model answer on this activity';
      host?.querySelectorAll('[data-option-id]').forEach(label=>{const ids=Array.isArray(key)?key:[key];if(ids.filter(x=>x!=null).map(String).includes(String(label.dataset.optionId||'')))label.classList.add('eleap-answer-correct');});
      host?.querySelectorAll('[data-reveal]').forEach(btn=>{if(btn.dataset.revealed==='1')return;const i=Number(btn.dataset.reveal);const item=(a.items||[])[i]||{};const val=item.answer||item.back||'';btn.dataset.revealed='1';btn.insertAdjacentHTML('beforeend',`<strong class="eleap-revealed-answer">${esc(val)}</strong>`);});
    });
    host?.querySelector('[data-exit-presentation]')?.addEventListener('click',()=>{this.root.dispatchEvent(new CustomEvent('e-leap:exit-presentation',{bubbles:true}));});
    host?.querySelector('[data-submit]')?.addEventListener('click',async()=>{
      const response=this.collectResponse(a,host);const g=this.gradeActivity(a,response);
      if(g.assessable&&g.unansweredCount>0&&!globalThis.confirm(`You have answered ${g.answeredCount} of ${g.totalCount} questions. ${g.unansweredCount} question(s) are unanswered and will receive 0 points. Submit anyway?`))return;
      this.setGradeStatus(host,g,{submitted:true});
      await this.events.emit('response.submitted',{activityId:a.id,studentId:this.context.studentId,sessionId:this.context.sessionId,payload:{response,grading:g,score:g.score,correctCount:g.correctCount,answeredCount:g.answeredCount,wrongCount:g.wrongCount,unansweredCount:g.unansweredCount,totalCount:g.totalCount,attemptNo:1,submissionType:'shared-runtime'}});
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
  autosaveMeta(a){return {lessonId:this.lesson.id,activityId:a.id||this.current()?.id,studentId:this.context.studentId,sessionId:this.context.sessionId};}
  saveAutosave(a,value){
    if(this.context.role!=='student') return;
    this.autosave.save(this.autosaveMeta(a),value);
    this.events.emit('response.autosaved',{activityId:a.id,studentId:this.context.studentId,sessionId:this.context.sessionId,payload:{length:String(value||'').length}});
  }
  restoreAutosave(a,host){
    if(this.context.role!=='student') return;
    const box=host?.querySelector('[data-response]'); if(!box) return;
    const saved=this.autosave.load(this.autosaveMeta(a)); if(saved?.value!=null){box.value=saved.value; const st=host.querySelector('[data-status]'); if(st) st.textContent='Draft restored';}
  }
  wireRecorder(a,host){
    const start=host?.querySelector('[data-record-start]'), stop=host?.querySelector('[data-record-stop]'), preview=host?.querySelector('[data-record-preview]'), submit=host?.querySelector('[data-submit-recording]');
    if(!start||!stop||!preview) return;
    let recorder=null,chunks=[],blob=null,stream=null;
    start.addEventListener('click',async()=>{
      if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){const st=host.querySelector('[data-status]'); if(st) st.textContent='Recording is not supported on this browser.'; return;}
      try{stream=await navigator.mediaDevices.getUserMedia({audio:true}); recorder=new MediaRecorder(stream); chunks=[]; recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data); recorder.onstop=()=>{blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'}); preview.src=URL.createObjectURL(blob); preview.hidden=false; if(submit) submit.disabled=false; stream?.getTracks().forEach(t=>t.stop()); const st=host.querySelector('[data-status]'); if(st) st.textContent=this.context.role==='guest'?'Practice recording ready · not saved':'Recording ready';}; recorder.start(); start.disabled=true; stop.disabled=false; const st=host.querySelector('[data-status]'); if(st) st.textContent='Recording…'; await this.events.emit('recording.started',{activityId:a.id,studentId:this.context.studentId,sessionId:this.context.sessionId});}catch{const st=host.querySelector('[data-status]'); if(st) st.textContent='Microphone permission is required.';}
    });
    stop.addEventListener('click',()=>{if(recorder?.state==='recording') recorder.stop(); start.disabled=false; stop.disabled=true;});
    submit?.addEventListener('click',async()=>{if(!blob)return; const st=host.querySelector('[data-status]'); if(st) st.textContent='Submitted'; await this.events.emit('recording.submitted',{activityId:a.id,studentId:this.context.studentId,sessionId:this.context.sessionId,payload:{size:blob.size,type:blob.type}});});
  }
  collectResponse(a,host){
    if(a.type==='mcq'||a.type==='true-false'||a.type==='poll') return host.querySelector('input[name="answer"]:checked')?.value||'';
    if(a.type==='multi-select') return [...host.querySelectorAll('input[name="answer"]:checked')].map(x=>x.value);
    if(a.type==='fill'||a.type==='writing'||a.type==='discussion'||a.type==='listening'||a.type==='video-question') return host.querySelector('[data-response]')?.value||host.querySelector('input[name="answer"]:checked')?.value||'';
    if(a.type==='matching') return Object.fromEntries([...host.querySelectorAll('[data-match]')].map(x=>[x.dataset.match,x.value]));
    if(a.type==='categorising') return Object.fromEntries([...host.querySelectorAll('[data-category]')].map(x=>[x.dataset.category,x.value]));
    if(a.type==='ordering') return [...host.querySelectorAll('[data-order-id]')].map(x=>x.dataset.orderId);
    return null;
  }
}
