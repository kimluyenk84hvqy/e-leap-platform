(() => {
  const RESOURCE_ID='res-life-intermediate-u02-l02';
  const screens=[...document.querySelectorAll('.screen')];
  const screenIds=screens.map(s=>s.dataset.screen);
  let index=0;
  let mode='teacher';
  const state=new Map();
  const params=new URLSearchParams(location.search);
  const hosted=window.self!==window.top || params.get('eleapHosted')==='1';
  if(hosted) document.body.classList.add('hosted');

  const meta={
    'life-intermediate-u02-l02-a01':{title:'Quick Review',assessable:false},
    'life-intermediate-u02-l02-a02':{title:'Before Reading',assessable:false},
    'life-intermediate-u02-l02-a03':{title:'Reading · Paragraph Map',assessable:true,key:{pA:'2',pB:'1',pC:'4',pD:'5',pE:'3'}},
    'life-intermediate-u02-l02-a04':{title:'Vocabulary in Context',assessable:true,key:{v1:'entertainment',v2:'ring',v3:'crowd',v4:'commentator',v5:'go crazy',v6:'fans',v7:'salary'}},
    'life-intermediate-u02-l02-a05':{title:'Reading Between the Lines',assessable:true,key:{f1:'Daughter',f2:'Yolanda',f3:'Esperanza'}},
    'life-intermediate-u02-l02-a06':{title:'Respond to the Reading',assessable:false},
    'life-intermediate-u02-l02-a07':{title:'Word Focus · like',assessable:true,key:{l1:'A',l2:'C',l3:'D',l4:'B'}},
    'life-intermediate-u02-l02-a08':{title:'Questions with like',assessable:true,key:{q1:'D',q2:'C',q3:'A',q4:'B'}},
    'life-intermediate-u02-l02-a09':{title:'Ask · Answer · Follow up',assessable:false},
    'life-intermediate-u02-l02-a10':{title:'Olympic Sports',assessable:false},
    'life-intermediate-u02-l02-a11':{title:'Describe a Sport',assessable:false},
    'life-intermediate-u02-l02-a12':{title:'Find Someone Who',assessable:false},
    'life-intermediate-u02-l02-a13':{title:'Read the Adverts',assessable:false},
    'life-intermediate-u02-l02-a14':{title:'Track 015 · Order',assessable:true,key:{o1:'1',o2:'2',o3:'3'}},
    'life-intermediate-u02-l02-a15':{title:'Track 015 · Complete',assessable:true,key:{g1:'good at',g2:'what about',g3:'interested in',g4:'hate',g5:'not very',g6:'on',g7:'like to',g8a:'looks',g8b:"Why don't"}},
    'life-intermediate-u02-l02-a16':{title:'Useful Language',assessable:true,key:{cat1:'I',cat2:'R',cat3:'I',cat4:'I',cat5:'I',cat6:'R',cat7:'P',cat8:'R'}},
    'life-intermediate-u02-l02-a17':{title:'Track 016 · Silent Letters',assessable:true,key:{s1:'e',s2:'l',s3:'i',s4:'w',s5:'l',s6:'h'}},
    'life-intermediate-u02-l02-a18':{title:'Which Club?',assessable:false},
    'life-intermediate-u02-l02-a19':{title:'Create a Mini Club Advert',assessable:false},
    'life-intermediate-u02-l02-exit':{title:'Exit Ticket',assessable:false}
  };

  function capabilities(id=aid()){
    const assessable=!!meta[id]?.assessable;
    return {check:assessable,reset:!!id,reveal:assessable,submit:!!id,score:assessable};
  }
  function current(){return screens[index]}
  function aid(){return current()?.dataset.activity||null}
  function activityScreens(id){return screens.filter(s=>s.dataset.activity===id)}
  function ensure(id){
    if(!id) return {response:{},checked:false,revealed:false,submitted:false};
    if(!state.has(id)) state.set(id,{response:{},checked:false,revealed:false,submitted:false});
    return state.get(id);
  }
  function collect(id=aid()){
    const out={...ensure(id).response};
    if(!id) return out;
    activityScreens(id).forEach(screen=>{
      screen.querySelectorAll('[data-field]').forEach(el=>{
        const field=el.dataset.field;
        if(el.matches('select,input,textarea')){
          if(el.value!==undefined && el.value!=='') out[field]=el.value.trim();
        }
      });
      screen.querySelectorAll('[data-field] .selected, button.selected[data-field]').forEach(btn=>{
        const group=btn.closest('[data-field]');
        const field=btn.dataset.field||group?.dataset.field;
        if(field) out[field]=btn.dataset.value;
      });
      screen.querySelectorAll('.mini-choices[data-field]').forEach(group=>{
        const selected=group.querySelector('button.selected');
        if(selected) out[group.dataset.field]=selected.dataset.value;
      });
    });
    ensure(id).response=out;
    return out;
  }
  function assessment(id=aid()){
    const m=meta[id];
    const response=collect(id);
    if(!m?.assessable) return {assessable:false,totalCount:0,answeredCount:Object.keys(response).length,correctCount:null,percentage:null};
    const fields=Object.keys(m.key);
    let correct=0,answered=0;
    fields.forEach(f=>{
      if(response[f]!==undefined && response[f]!==''){
        answered++;
        if(String(response[f]).trim()===String(m.key[f]).trim()) correct++;
      }
    });
    return {assessable:true,totalCount:fields.length,answeredCount:answered,correctCount:correct,wrongCount:answered-correct,unansweredCount:fields.length-answered,percentage:Math.round(correct/fields.length*100)};
  }
  function clearMarks(id){activityScreens(id).forEach(s=>s.querySelectorAll('.correct,.wrong').forEach(el=>el.classList.remove('correct','wrong')))}
  function check(id=aid()){
    const m=meta[id];
    if(!m?.assessable){setStatus('Open task · no fixed score');return {ok:true,assessment:assessment(id)}}
    clearMarks(id);
    const r=collect(id);
    Object.entries(m.key).forEach(([field,answer])=>{
      activityScreens(id).forEach(screen=>{
        const select=screen.querySelector(`select[data-field="${CSS.escape(field)}"], input[data-field="${CSS.escape(field)}"], textarea[data-field="${CSS.escape(field)}"]`);
        if(select && select.value) select.classList.add(String(select.value).trim()===String(answer).trim()?'correct':'wrong');
        const group=screen.querySelector(`.mini-choices[data-field="${CSS.escape(field)}"]`);
        if(group){const btn=group.querySelector('button.selected');if(btn)btn.classList.add(String(btn.dataset.value)===String(answer)?'correct':'wrong')}
        const direct=screen.querySelector(`button.selected[data-field="${CSS.escape(field)}"]`);
        if(direct) direct.classList.add(String(direct.dataset.value)===String(answer)?'correct':'wrong');
      });
    });
    ensure(id).checked=true;updateScore();
    const a=assessment(id);setStatus(`Checked · ${a.correctCount}/${a.totalCount}`);return {ok:true,assessment:a};
  }
  function reveal(id=aid()){
    if(!id){setStatus('No activity on this screen');return false}
    activityScreens(id).forEach(s=>s.classList.add('revealed'));ensure(id).revealed=true;setStatus('Answer shown');return true;
  }
  function reset(id=aid()){
    if(!id)return false;
    activityScreens(id).forEach(screen=>{
      screen.querySelectorAll('.selected,.correct,.wrong').forEach(x=>x.classList.remove('selected','correct','wrong'));
      screen.querySelectorAll('select').forEach(x=>x.selectedIndex=0);
      screen.querySelectorAll('input,textarea').forEach(x=>x.value='');
      screen.classList.remove('revealed');
    });
    state.set(id,{response:{},checked:false,revealed:false,submitted:false});updateScore();setStatus('Reset');return true;
  }
  function score(id=aid()){
    const a=assessment(id);updateScore();setStatus(a.assessable?`Score ${a.correctCount}/${a.totalCount} · ${a.percentage}%`:'Open task · no fixed score');return a;
  }
  function setStatus(t){const el=document.getElementById('teacherToolbarStatus');if(el)el.textContent=t}
  function updateScore(){const el=document.getElementById('scorePill');if(!el)return;const a=assessment();el.textContent=a.assessable?`Score ${a.correctCount}/${a.totalCount} · ${a.percentage}%`:'Score —'}
  function updateScrollHint(){const hint=document.getElementById('scrollMoreHint'),s=current();if(!hint||!s)return;hint.classList.toggle('show',s.scrollHeight-s.clientHeight-s.scrollTop>18)}
  screens.forEach(s=>s.addEventListener('scroll',updateScrollHint,{passive:true}));
  function updateChrome(){
    screens.forEach((s,i)=>s.classList.toggle('active',i===index));
    const s=current();if(!s)return;s.scrollTop=0;
    const label=s.querySelector('.section-tag,.screen-kicker')?.textContent?.trim()||(s.id==='hero'?'Opening':s.id==='thanks'?'End':s.id);
    document.getElementById('screenLabel').textContent=label;
    document.getElementById('progressBar').style.width=`${index/(screens.length-1)*100}%`;
    document.getElementById('prevBtn').disabled=index===0;document.getElementById('nextBtn').disabled=index===screens.length-1;
    document.getElementById('activityPill').textContent=meta[aid()]?.title||label;updateScore();setStatus('Ready');publishNavigation();setTimeout(updateScrollHint,60);
  }
  function go(target){let n=typeof target==='number'?target:screenIds.indexOf(target);if(n<0)return false;index=Math.max(0,Math.min(screens.length-1,n));updateChrome();return true}
  function next(){return go(index+1)} function prev(){return go(index-1)}
  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',next));
  document.getElementById('nextBtn').addEventListener('click',next);document.getElementById('prevBtn').addEventListener('click',prev);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-value]');if(!btn)return;
    const group=btn.closest('.mini-choices[data-field]');const field=btn.dataset.field||group?.dataset.field;if(!field)return;
    const screen=btn.closest('.screen');
    if(group)group.querySelectorAll('button').forEach(x=>x.classList.remove('selected','correct','wrong'));
    else screen.querySelectorAll(`button[data-field="${CSS.escape(field)}"]`).forEach(x=>x.classList.remove('selected','correct','wrong'));
    btn.classList.add('selected');if(aid())ensure(screen.dataset.activity).response[field]=btn.dataset.value;updateScore();
  });
  document.addEventListener('change',e=>{
    const el=e.target.closest('select[data-field],input[data-field],textarea[data-field]');if(!el)return;el.classList.remove('correct','wrong');
    const screen=el.closest('.screen');if(screen?.dataset.activity)ensure(screen.dataset.activity).response[el.dataset.field]=el.value.trim();updateScore();
  });
  document.addEventListener('input',e=>{
    const el=e.target.closest('input[data-field],textarea[data-field]');if(!el)return;const screen=el.closest('.screen');if(screen?.dataset.activity)ensure(screen.dataset.activity).response[el.dataset.field]=el.value.trim();
  });
  function submit(id=aid()){
    if(!id)return {ok:false,reason:'no-activity'};
    const st=ensure(id);st.response=collect(id);st.submitted=true;
    const payload={ok:true,resourceId:RESOURCE_ID,activityId:id,screenId:current()?.dataset.screen,screenIndex:index,response:st.response,assessment:assessment(id),state:'submitted',timestamp:new Date().toISOString()};
    try{window.parent?.postMessage({type:'eleap.lesson.submission',...payload},'*')}catch(_){}setStatus('Submitted');return payload;
  }
  function activityStatePayload(){
    const id=aid(),st=ensure(id);
    return {resourceId:RESOURCE_ID,activityId:id,screenId:current()?.dataset.screen,screenIndex:index,response:collect(id),assessment:assessment(id),capabilities:capabilities(id),state:st.submitted?'submitted':st.revealed?'revealed':st.checked?'checked':'responding',context:{mode}};
  }
  function setMode(nextMode){mode=['teacher','admin','student','guest','presentation'].includes(nextMode)?nextMode:'student';document.body.dataset.mode=mode;publishContext();return true}
  function setActivity(id){const i=screens.findIndex(s=>s.dataset.activity===id);return i>=0?go(i):false}
  function command(action){switch(action){case 'check':return check();case 'reset':return reset();case 'reveal':case 'show-answer':return reveal();case 'submit':return submit();case 'score':return score();case 'next':return next();case 'previous':return prev();default:return false}}
  function publishContext(){try{window.parent?.postMessage({type:'eleap.lesson.context',resourceId:RESOURCE_ID,mode,activityId:aid(),screenId:current()?.dataset.screen,screenIndex:index,capabilities:capabilities()},'*')}catch(_){}}
  function publishNavigation(){publishContext();try{window.parent?.postMessage({type:'eleap.lesson.navigation',resourceId:RESOURCE_ID,activityId:aid(),screenId:current()?.dataset.screen,screenIndex:index},'*')}catch(_){}}
  window.ELEAP_LESSON_HOST_API={setMode,getMode:()=>mode,getActivityState:activityStatePayload,command,setScreen:go,setActivity};
  window.ELEAP_LESSON_API=window.ELEAP_LESSON_HOST_API;
  window.addEventListener('message',e=>{const m=e.data||{};if(m.type==='eleap.host.mode'&&m.mode)setMode(m.mode);if(m.type==='eleap.host.command'&&m.action)command(m.action);if(m.type==='eleap.host.screen'&&m.target!==undefined)go(m.target);if(m.type==='eleap.host.activity'&&m.activityId)setActivity(m.activityId)});

  const quickKeyData={
    hero:{title:'Opening',html:'<div class="open-task"><b>No fixed key.</b> Introduce Lesson 2 and the two sections: Bolivian wrestlers + Joining a group.</div>'},
    aims:{title:'Aims',html:'<div class="open-task">Introduce the three areas briefly; do not read every bullet.</div>'},
    recap:{title:'Quick Review',html:'<div class="keyline"><strong>Key:</strong> golfer · swimmer · runner · tennis player · athlete · racing driver · gymnast · baseball player</div>'},
    sec2c:{title:'2c · Bolivian wrestlers',html:'<div class="open-task">Section divider — no key.</div>'},
    c01:{title:'Before Reading',html:'<div class="open-task"><b>Open discussion.</b> Accept different views. Useful language: dangerous · injuries · violent · exciting · entertaining.</div>'},
    c02:{title:'Reading · Paragraph Map',html:'<div class="keyline"><strong>Key:</strong> A 2 · B 1 · C 4 · D 5 · E 3</div>'},
    c03:{title:'Vocabulary · 1–4',html:'<div class="keyline"><strong>1</strong> entertainment · <strong>2</strong> ring · <strong>3</strong> crowd · <strong>4</strong> commentator</div>'},
    c03b:{title:'Vocabulary · 5–7',html:'<div class="keyline"><strong>5</strong> go crazy · <strong>6</strong> fans · <strong>7</strong> salary</div>'},
    c04:{title:'Reading Between the Lines',html:'<div class="keyline"><strong>1</strong> one of Yolanda’s daughters · <strong>2</strong> Yolanda · <strong>3</strong> Esperanza</div>'},
    c05:{title:'Respond to the Reading',html:'<div class="open-task"><b>No single answer.</b> Check: clear opinion + reason; listener retells the partner accurately.</div>'},
    c06:{title:'Word Focus · like',html:'<div class="keyline"><strong>1 A</strong> enjoy + noun · <strong>2 C</strong> similarity · <strong>3 D</strong> future plan/ambition · <strong>4 B</strong> enjoy + -ing</div>'},
    c07:{title:'Questions with like',html:'<div class="keyline"><strong>Key:</strong> 1 D · 2 C · 3 A · 4 B</div>'},
    c08:{title:'Personal Speaking',html:'<div class="open-task"><b>Success criteria:</b><ul><li>Ask one question accurately.</li><li>Answer in a full sentence.</li><li>Ask one follow-up question.</li><li>Change roles.</li></ul></div>'},
    c09:{title:'Olympic Sports',html:'<div class="open-task">Open brainstorm. Check that the group reaches ten different sports and agrees on spelling.</div>'},
    c10:{title:'Olympic Group Decision',html:'<div class="open-task"><b>Open decision task.</b> Every learner gives a reason; group selects two activities and gives two reasons.</div>'},
    c11:{title:'Describe a Sport',html:'<div class="open-task">Check four points: what · how · where · why. Speaker talks about 60 seconds; listener asks one follow-up question.</div>'},
    sec2d:{title:'2d · Joining a group',html:'<div class="open-task">Section divider — no key.</div>'},
    d01:{title:'Find Someone Who',html:'<div class="open-task">Open survey. Learners talk to three nearby classmates and report one fact accurately.</div>'},
    d02:{title:'Read the Adverts',html:'<div class="keyline"><strong>A Running:</strong> 1, 3, 4</div><div class="keyline"><strong>B Photography:</strong> 2, 3, 4</div><div class="keyline"><strong>C Theatre:</strong> 1, 3, 4</div>'},
    d03:{title:'Track 015 · Order',html:'<div class="keyline"><strong>1</strong> Photography · <strong>2</strong> Theatre group · <strong>3</strong> Running group</div>'},
    d04:{title:'Track 015 · Complete 1–4',html:'<div class="keyline"><strong>1</strong> good at · <strong>2</strong> what about · <strong>3</strong> interested in · <strong>4</strong> hate</div>'},
    d04b:{title:'Track 015 · Complete 5–8',html:'<div class="keyline"><strong>5</strong> not very · <strong>6</strong> on · <strong>7</strong> like to · <strong>8</strong> looks / Why don’t</div>'},
    d05:{title:'Useful Language · Categories',html:'<div class="keyline"><strong>Interests & abilities:</strong> 1, 3, 4, 5</div><div class="keyline"><strong>Plans:</strong> 7</div><div class="keyline"><strong>Recommending:</strong> 2, 6, 8</div>'},
    d06:{title:'Track 016 · Silent Letters',html:'<div class="keyline"><strong>interested:</strong> e · <strong>should:</strong> l · <strong>friends:</strong> i · <strong>write:</strong> w · <strong>half:</strong> l · <strong>what:</strong> h</div>'},
    d07:{title:'Which Club?',html:'<div class="open-task">No fixed answer. Check: <b>I’d like to… / I’m interested in… / I’m good at…</b> + two reasons + one recommendation/invitation.</div>'},
    d08:{title:'Mini Club Advert',html:'<div class="open-task">Product must include: club name · meeting time · fee/membership · reason to join · contact. Pair gives a 30-second pitch.</div>'},
    exit:{title:'Exit Ticket',html:'<div class="open-task">Accept any accurate example of a use of <b>like</b>, a recommendation expression, and a justified club/sport preference.</div>'},
    thanks:{title:'Thank You',html:'<div class="open-task">Closing screen — no key.</div>'}
  };
  const readingModal=document.getElementById('readingModal');
  function openReading(){readingModal?.classList.add('open');readingModal?.setAttribute('aria-hidden','false')}
  function closeReading(){readingModal?.classList.remove('open');readingModal?.setAttribute('aria-hidden','true')}
  document.querySelectorAll('[data-reading-text]').forEach(btn=>btn.addEventListener('click',openReading));
  document.getElementById('readingClose')?.addEventListener('click',closeReading);document.getElementById('readingDone')?.addEventListener('click',closeReading);readingModal?.addEventListener('click',e=>{if(e.target===readingModal)closeReading()});
  const modal=document.getElementById('quickKeyModal');
  function openKey(){const id=current()?.dataset.screen;const data=quickKeyData[id]||{title:'Quick Key',html:'<div class="open-task">No fixed key for this screen.</div>'};document.getElementById('quickKeyTitle').textContent=data.title;document.getElementById('quickKeyBody').innerHTML=data.html;modal.classList.add('open');modal.setAttribute('aria-hidden','false')}
  function closeKey(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
  document.getElementById('teacherKeyBtn').addEventListener('click',openKey);document.getElementById('offlineGvKey').addEventListener('click',openKey);document.getElementById('quickKeyClose').addEventListener('click',closeKey);modal.addEventListener('click',e=>{if(e.target===modal)closeKey()});
  document.getElementById('offlineCheckBtn').addEventListener('click',()=>check());document.getElementById('offlineRevealBtn').addEventListener('click',()=>reveal());document.getElementById('offlineResetBtn').addEventListener('click',()=>reset());document.getElementById('teacherCheckBtn').addEventListener('click',()=>check());document.getElementById('teacherResetBtn').addEventListener('click',()=>reset());document.getElementById('teacherRevealBtn').addEventListener('click',()=>reveal());document.getElementById('teacherScoreBtn').addEventListener('click',()=>score());
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&readingModal?.classList.contains('open')){closeReading();return}
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    if(e.key==='k'||e.key==='K'){e.preventDefault();modal.classList.contains('open')?closeKey():openKey();return}
    if(e.key==='Escape'&&modal.classList.contains('open')){closeKey();return}
    if(e.key==='ArrowRight'){e.preventDefault();next();return}if(e.key==='ArrowLeft'){e.preventDefault();prev();return}
    if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();current().scrollBy({top:Math.round(current().clientHeight*.72),behavior:'smooth'});return}
    if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();current().scrollBy({top:-Math.round(current().clientHeight*.72),behavior:'smooth'});return}
  });
  setMode(hosted?'student':'teacher');updateChrome();
})();
