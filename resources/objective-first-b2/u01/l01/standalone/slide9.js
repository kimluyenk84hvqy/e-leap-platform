/* =========================================================
   E-LEAP U1.1 — SLIDE 9 CLEAN CONTROLLER v1.0
   Sole owner of Exercise 7 interactions.
   ========================================================= */
(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const screen=$('.screen[data-screen="9"]');
  if(!screen) return;

  const isStudent=()=>document.body.classList.contains('u11-student');
  const isTeacher=()=>document.body.classList.contains('u11-teacher') || document.body.classList.contains('presentation');
  const currentStep=()=>Number(screen.dataset.s9Step||1);

  function setFeedback(text='',kind=''){
    const box=$('#s9Feedback',screen);
    if(!box) return;
    box.textContent=text;
    box.className='s9-feedback'+(kind?` ${kind}`:'');
  }

  function disarmTeacher(){
    delete screen.dataset.s9TeacherCheck;
    const btn=$('#s9Check',screen);
    if(btn){
      btn.textContent='Check';
      btn.classList.remove('active');
    }
  }

  function clearStep1(){
    $$('.s9-student-check',screen).forEach(x=>x.checked=false);
    $$('.s9-heard-item',screen).forEach(item=>{
      item.classList.remove('revealed');
      const a=$('.s9-teacher-answer',item);
      if(a) a.textContent='';
    });
  }

  function clearStep2(){
    $$('.s9-answer-input',screen).forEach(x=>x.value='');
    $$('.s9-verb',screen).forEach(x=>x.classList.remove('paired'));
    $$('.s9-definition',screen).forEach(x=>x.classList.remove('paired'));
    $$('.s9-answer-row',screen).forEach(x=>x.classList.remove('paired'));
    $$('.s9-teacher-pair',screen).forEach(x=>x.textContent='—');
  }

  function resetCurrent(){
    disarmTeacher();
    setFeedback();
    if(currentStep()===1) clearStep1(); else clearStep2();
  }

  function setStep(step){
    screen.dataset.s9Step=String(step);
    $$('.s9-tab',screen).forEach(btn=>{
      const on=Number(btn.dataset.s9Step)===step;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-selected',on?'true':'false');
    });
    $$('[data-s9-panel]',screen).forEach(panel=>{
      panel.hidden=Number(panel.dataset.s9Panel)!==step;
    });
    const instruction=$('#s9Instruction',screen);
    if(instruction){
      instruction.textContent=step===1
        ?'Listen again to Speakers 2–5 and identify the phrasal verbs you hear.'
        :'Match phrasal verbs a–i with definitions 1–9. Type the correct definition number for each phrasal verb.';
    }
    disarmTeacher();
    setFeedback();
  }

  function applyRole(){
    const student=isStudent();
    const teacher=isTeacher();
    screen.classList.toggle('s9-student-mode',student);
    screen.classList.toggle('s9-teacher-mode',teacher);
    $$('.s9-student-check',screen).forEach(x=>x.disabled=teacher);
    $$('.s9-answer-input',screen).forEach(x=>x.disabled=teacher);
    disarmTeacher();
    setFeedback();
  }

  function studentCheckStep1(){
    const items=$$('.s9-heard-item',screen);
    let correct=0;
    items.forEach(item=>{
      const selected=$('.s9-student-check',item)?.checked||false;
      const expected=item.dataset.heard==='yes';
      if(selected===expected) correct++;
    });
    setFeedback(`You got ${correct}/${items.length} correct.`,'student-score');
  }

  function studentCheckStep2(){
    const inputs=$$('.s9-answer-input',screen);
    let correct=0;
    inputs.forEach(input=>{
      if(String(input.value).trim()===String(input.dataset.answer)) correct++;
    });
    setFeedback(`You got ${correct}/${inputs.length} correct.`,'student-score');
  }

  function armTeacher(){
    screen.dataset.s9TeacherCheck='on';
    const btn=$('#s9Check',screen);
    if(btn){
      btn.textContent='✓ Check mode ON';
      btn.classList.add('active');
    }
    setFeedback(
      currentStep()===1
        ?'Click each phrasal verb to reveal HEARD or NOT HEARD.'
        :'Click each phrasal verb a–i to reveal its matching definition and answer pair.',
      'teacher-note'
    );
  }

  function revealHeard(item){
    if(screen.dataset.s9TeacherCheck!=='on') return;
    const answer=$('.s9-teacher-answer',item);
    if(!answer) return;
    answer.textContent=item.dataset.heard==='yes'?'HEARD':'NOT HEARD';
    item.classList.add('revealed');
  }

  function revealPair(verb){
    if(screen.dataset.s9TeacherCheck!=='on') return;
    const number=String(verb.dataset.answer);
    const letter=String(verb.dataset.letter);
    const definition=$(`.s9-definition[data-number="${number}"]`,screen);
    const row=$(`.s9-answer-row[data-letter="${letter}"]`,screen);
    if(!definition||!row) return;
    verb.classList.add('paired');
    definition.classList.add('paired');
    row.classList.add('paired');
    const pair=$('.s9-teacher-pair',row);
    if(pair) pair.textContent=`${letter} = ${number}`;
  }

  $$('.s9-tab',screen).forEach(btn=>btn.addEventListener('click',()=>setStep(Number(btn.dataset.s9Step))));

  $('#s9Check',screen)?.addEventListener('click',()=>{
    if(isStudent()){
      if(currentStep()===1) studentCheckStep1(); else studentCheckStep2();
      return;
    }
    if(isTeacher()) armTeacher();
  });

  $('#s9Reset',screen)?.addEventListener('click',resetCurrent);

  $$('.s9-heard-item',screen).forEach(item=>item.addEventListener('click',e=>{
    if(!isTeacher()||currentStep()!==1) return;
    if(e.target.closest('audio')) return;
    e.preventDefault();
    revealHeard(item);
  }));

  $$('.s9-verb',screen).forEach(verb=>verb.addEventListener('click',e=>{
    if(!isTeacher()||currentStep()!==2) return;
    e.preventDefault();
    revealPair(verb);
  }));

  const roleObserver=new MutationObserver(()=>{ resetCurrent(); applyRole(); });
  roleObserver.observe(document.body,{attributes:true,attributeFilter:['class']});

  screen.dataset.s9Step='1';
  setStep(1);
  applyRole();

  window.ELEAP_U11_SLIDE9={reset:resetCurrent,setStep,applyRole};
})();
