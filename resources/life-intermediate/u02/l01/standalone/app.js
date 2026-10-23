(() => {
  const RESOURCE_ID = 'res-life-intermediate-u02-l01';
  const screens = [...document.querySelectorAll('.screen')];
  const screenIds = screens.map(s => s.dataset.screen);
  const activityState = new Map();
  let index = 0;
  let mode = 'teacher';
  const params = new URLSearchParams(location.search);
  const hosted = window.self !== window.top || params.get('eleapHosted') === '1';
  const qaEnabled = params.get('qa') === '1';
  if(hosted) document.body.classList.add('hosted');
  if(qaEnabled) document.body.classList.add('qa-mode');

  const activityMeta = {
    'life-intermediate-u02-l01-a01': {title:'Would You Join?',assessable:false, capabilities:['reset','submit']},
    'life-intermediate-u02-l01-a02': {title:'Reading · Crazy Competitions',assessable:true,totalCount:6,answerKey:{r1:'A',r2:'B',r3:'A',r4:'A',r5:'Both',r6:'B'},capabilities:['check','reset','reveal','submit','score']},
    'life-intermediate-u02-l01-a03': {title:'Read · Remember · Write',assessable:false, capabilities:['reset','submit']},
    'life-intermediate-u02-l01-a04': {title:'Correct the Rules',assessable:true,totalCount:3,answerKey:{q1:'Needs a change',q2:'Needs a change',q3:'Needs a change'},capabilities:['check','reset','reveal','submit','score']},
    'life-intermediate-u02-l01-a05': {title:'Explain the Rules',assessable:false, capabilities:['reset','submit']},
    'life-intermediate-u02-l01-a06': {title:'Winning and Sportspeople',assessable:false, capabilities:['reset','submit']},
    'life-intermediate-u02-l01-a07': {title:'Listening · Sports Opinions',assessable:true,totalCount:12,answerKey:{l1:'FOR',l2:'AGAINST',l3:'MIXED',la1:'1',la2:'2',la3:'1',la4:'2',la5:'1',la6:'1',la7:'3',la8:'2',la9:'3'},capabilities:['check','reset','reveal','submit','score']},
    'life-intermediate-u02-l01-a08': {title:'School Sports Decision',assessable:false, capabilities:['reset','submit']},
    'life-intermediate-u02-l01-a09': {title:'Grammar · -ing Form',assessable:true,totalCount:9,answerKey:{g1:'Cycling',g2:'watching',g3:'think',g4:'seeing',g5:'Sitting',g6:'doing',g7:'play',g8:'watch',g9:'losing'},capabilities:['check','reset','reveal','submit','score']},
    'life-intermediate-u02-l01-a10': {title:'Pronunciation · /ŋ/',assessable:true,totalCount:6,answerKey:{p1:'thing',p2:'win',p3:'bank',p4:'sing',p5:'ran',p6:'pink'},capabilities:['check','reset','reveal','submit','score']},
    'life-intermediate-u02-l01-a11': {title:'Find Your Opposite',assessable:false, capabilities:['reset','submit']},
    'life-intermediate-u02-l01-exit': {title:'Exit Ticket',assessable:false, capabilities:['reset','submit']}
  };

  function currentScreen(){ return screens[index]; }
  function currentActivityId(){ return currentScreen()?.dataset.activity || null; }
  function ensureState(id){
    if(!id) return {response:{},checked:false,revealed:false,submitted:false};
    if(!activityState.has(id)) activityState.set(id,{response:{},checked:false,revealed:false,submitted:false});
    return activityState.get(id);
  }
  function allScreensForActivity(id){ return screens.filter(s => s.dataset.activity === id); }

  function collectResponse(id=currentActivityId()){
    const response = {...ensureState(id).response};
    if(!id) return response;
    allScreensForActivity(id).forEach(screen => {
      screen.querySelectorAll('[data-field]').forEach(el => {
        const field = el.dataset.field;
        if(el.matches('textarea,input')) {
          if(el.value?.trim()) response[field]=el.value.trim();
        } else if(el.matches('button.selected,[data-value].selected')) {
          response[field]=el.dataset.value;
        }
      });
      screen.querySelectorAll('textarea:not([data-field]), input:not([data-field])').forEach((el,i)=>{
        if(el.value?.trim()) response[`${screen.dataset.screen}-open-${i+1}`]=el.value.trim();
      });
    });
    ensureState(id).response = response;
    return response;
  }

  function assessment(id=currentActivityId()){
    const meta = activityMeta[id];
    const response = collectResponse(id);
    if(!meta?.assessable) {
      return {assessable:false,totalCount:0,answeredCount:Object.keys(response).length,correctCount:null,wrongCount:null,unansweredCount:null,percentage:null};
    }
    const key=meta.answerKey||{};
    const fields=Object.keys(key);
    let correct=0, answered=0;
    fields.forEach(f=>{
      if(response[f] !== undefined && response[f] !== '') {
        answered++;
        if(String(response[f]) === String(key[f])) correct++;
      }
    });
    const total=fields.length;
    return {assessable:true,totalCount:total,answeredCount:answered,correctCount:correct,wrongCount:answered-correct,unansweredCount:total-answered,percentage:total?Math.round(correct/total*100):0};
  }

  function capabilities(id=currentActivityId()){
    const caps = activityMeta[id]?.capabilities || [];
    const c = {check:false,reset:false,reveal:false,submit:false,score:false};
    caps.forEach(k=>c[k]=true);
    return c;
  }

  function updateChrome(){
    screens.forEach((s,i)=>s.classList.toggle('active',i===index));
    const s=currentScreen();
    const label=s?.id==='hero'?'Opening':s?.id==='aims'?'Aims':s?.id==='thanks'?'End':(s?.querySelector('.screen-kicker')?.textContent?.split('·')[0]?.trim() || s?.dataset.screen);
    document.getElementById('screenLabel').textContent=label;
    document.getElementById('progressBar').style.width=`${(index)/(screens.length-1)*100}%`;
    document.getElementById('prevBtn').disabled=index===0;
    document.getElementById('nextBtn').disabled=index===screens.length-1;
    const aid=currentActivityId();
    document.getElementById('activityPill').textContent=(aid && activityMeta[aid]?.title) || label;
    updateScore();
    publishNavigation();
  }

  function goTo(target){
    let next = typeof target==='number' ? target : screenIds.indexOf(target);
    if(next<0) return false;
    index=Math.max(0,Math.min(screens.length-1,next));
    updateChrome();
    return true;
  }
  function next(){ return goTo(index+1); }
  function prev(){ return goTo(index-1); }

  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',next));
  document.getElementById('nextBtn').addEventListener('click',next);
  document.getElementById('prevBtn').addEventListener('click',prev);

  document.addEventListener('click', e=>{
    const btn=e.target.closest('[data-value]');
    if(!btn) return;
    const group=btn.closest('[data-field], .continuum, .poll, .mini-choices, .grammar-six');
    const field=btn.dataset.field || group?.dataset.field || btn.closest('[data-field]')?.dataset.field;
    if(!field) return;
    const scope = btn.closest('.screen');
    scope.querySelectorAll(`[data-field="${CSS.escape(field)}"].selected`).forEach(x=>x.classList.remove('selected'));
    if(group?.dataset.field===field) group.querySelectorAll('[data-value].selected').forEach(x=>x.classList.remove('selected'));
    btn.classList.add('selected');
    const id=scope.dataset.activity;
    if(id) ensureState(id).response[field]=btn.dataset.value;
    if(btn.closest('.poll') && !field) ensureState(id).response.poll=btn.dataset.value;
    updateScore();
  });

  document.querySelectorAll('.poll[data-field], .continuum[data-field]').forEach(group=>{
    group.querySelectorAll('[data-value]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.closest('.screen').dataset.activity;
      ensureState(id).response[group.dataset.field]=btn.dataset.value;
    }));
  });

  function clearMarks(id){
    allScreensForActivity(id).forEach(screen=>{
      screen.querySelectorAll('.correct,.wrong').forEach(x=>x.classList.remove('correct','wrong'));
    });
  }

  function check(id=currentActivityId()){
    const meta=activityMeta[id];
    const state=ensureState(id);
    if(!meta?.assessable) { state.checked=true; updateScore(); return {ok:true,assessment:assessment(id)}; }
    clearMarks(id);
    const resp=collectResponse(id);
    Object.entries(meta.answerKey).forEach(([field,answer])=>{
      const selected = allScreensForActivity(id).flatMap(s=>[...s.querySelectorAll(`[data-field="${CSS.escape(field)}"].selected, [data-field="${CSS.escape(field)}"] .selected`)]).find(Boolean);
      if(selected) selected.classList.add(String(resp[field])===String(answer)?'correct':'wrong');
    });
    state.checked=true;
    updateScore();
    return {ok:true,assessment:assessment(id)};
  }

  function reveal(id=currentActivityId()){
    const state=ensureState(id);
    state.revealed=true;
    document.body.classList.add('platform-reveal-armed');
    allScreensForActivity(id).forEach(s=>s.classList.add('revealed'));
    return true;
  }

  function reset(id=currentActivityId()){
    if(!id) return false;
    allScreensForActivity(id).forEach(screen=>{
      screen.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected','correct','wrong'));
      screen.querySelectorAll('textarea,input').forEach(x=>x.value='');
      screen.classList.remove('revealed');
    });
    activityState.set(id,{response:{},checked:false,revealed:false,submitted:false});
    document.body.classList.remove('platform-reveal-armed');
    updateScore();
    return true;
  }

  function submit(id=currentActivityId()){
    if(!id) return {ok:false,reason:'no-activity'};
    const state=ensureState(id);
    state.response=collectResponse(id);
    state.submitted=true;
    return {ok:true,resourceId:RESOURCE_ID,activityId:id,response:state.response,assessment:assessment(id),state:'submitted',timestamp:new Date().toISOString()};
  }

  function score(id=currentActivityId()){
    const a=assessment(id);
    updateScore();
    return a;
  }

  function updateScore(){
    const pill=document.getElementById('scorePill');
    const a=assessment();
    if(!a.assessable){pill.textContent='Score —';return;}
    pill.textContent=`Score ${a.correctCount}/${a.totalCount} · ${a.percentage}%`;
  }

  function activityStatePayload(){
    const id=currentActivityId();
    const st=ensureState(id);
    return {resourceId:RESOURCE_ID,activityId:id,screenId:currentScreen()?.dataset.screen,screenIndex:index,response:collectResponse(id),assessment:assessment(id),capabilities:capabilities(id),state:st.submitted?'submitted':st.revealed?'revealed':st.checked?'checked':'responding',context:{mode}};
  }

  function setMode(nextMode){
    mode=['teacher','admin','student','guest','presentation'].includes(nextMode)?nextMode:'student';
    document.body.dataset.mode=mode;
    document.querySelectorAll('.clinic-grid div').forEach(el=>{el.contentEditable=(mode==='teacher'||mode==='admin')?'true':'false';});
    const qa=document.getElementById('qaMode');
    if(qa) qa.value=mode==='admin'?'teacher':mode;
    publishContext();
    return true;
  }

  function setActivity(id){
    const i=screens.findIndex(s=>s.dataset.activity===id);
    return i>=0?goTo(i):false;
  }

  function command(action){
    switch(action){
      case 'check': check(); return true;
      case 'reset': return reset();
      case 'reveal': case 'show-answer': return reveal();
      case 'submit': return submit();
      case 'score': score(); return true;
      case 'next': return next();
      case 'previous': return prev();
      default: return false;
    }
  }

  function publishContext(){
    try{window.parent?.postMessage({type:'eleap.lesson.context',resourceId:RESOURCE_ID,mode,activityId:currentActivityId(),screenId:currentScreen()?.dataset.screen,screenIndex:index},'*');}catch(_){}
  }
  function publishNavigation(){
    publishContext();
    try{window.parent?.postMessage({type:'eleap.lesson.navigation',resourceId:RESOURCE_ID,activityId:currentActivityId(),screenId:currentScreen()?.dataset.screen,screenIndex:index},'*');}catch(_){}
  }

  window.ELEAP_LESSON_HOST_API={setMode,getMode:()=>mode,getActivityState:activityStatePayload,command,setScreen:goTo,setActivity};
  window.ELEAP_LESSON_API = window.ELEAP_LESSON_HOST_API;

  const qaMode=document.getElementById('qaMode');
  if(qaMode) qaMode.addEventListener('change',()=>setMode(qaMode.value));
  document.querySelectorAll('[data-qa]').forEach(btn=>btn.addEventListener('click',()=>{
    const a=btn.dataset.qa;
    if(a==='check')check();
    if(a==='reset')reset();
    if(a==='reveal')reveal();
    if(a==='score')alert(JSON.stringify(score(),null,2));
  }));

  window.addEventListener('message',e=>{
    const m=e.data||{};
    if(m.type==='eleap.host.mode' && m.mode) setMode(m.mode);
    if(m.type==='eleap.host.command' && m.action) command(m.action);
    if(m.type==='eleap.host.screen' && m.target!==undefined) goTo(m.target);
    if(m.type==='eleap.host.activity' && m.activityId) setActivity(m.activityId);
  });

  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    if(e.key==='ArrowRight' || e.key==='PageDown') next();
    if(e.key==='ArrowLeft' || e.key==='PageUp') prev();
  });

  setMode(hosted?'student':'teacher');
  updateChrome();
})();
