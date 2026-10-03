/* =========================================================
   E-LEAP U1.1 — FINAL CONTROL & INTERACTION LAYER v3.0
   Objective First B2 · Unit 1.1 Fashion Matters

   Goals
   - Student / Teacher / Presentation role-aware controls
   - Teacher tools aligned with U1.2: Timer / Responses / Lucky No. / Reveal next
   - Check / Reset works consistently
   - Teacher Check => cumulative click-to-reveal mode
   - Student answers never auto-reveal open-ended suggested answers
   - Screen 9 Step 1 / Step 2 tabs
   - Homework response + Suggested answer
   - Student recording on speaking tasks
   ========================================================= */

(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  let mode='teacher';
  let timerInt=null;
  let revealMode=false;
  let recorder=null;
  let recordingStream=null;
  let recordingChunks=[];
  let recordingUrl=null;

  const state={
    vocabExtra:{},
    vocabMini:'',
    screen1:'',
    screen2:{},
    screen5:'',
    screen6:{},
    screen7:{},
    screen12:'',
    screen13:{},
    screen14:{},
    submitted:{}
  };

  const suggested={
    1:[
      'Clothes can communicate personality, identity, mood, social role or occasion.',
      'Example: Someone wearing a suit may want to look formal or professional.'
    ],
    2:[
      'Fashion is important to me because it helps me express my personality.',
      'I prefer comfortable, casual clothes such as jeans, T-shirts and trainers.',
      'Sometimes I have to wear clothes I do not really like for formal events or school/work requirements.'
    ],
    3:[
      '<b>Give a reason</b><br>Because… / The main reason is that…',
      '<b>Give an example</b><br>For example… / For instance…',
      '<b>Add a contrast</b><br>However… / Unlike… / In the past…, but now…',
      '<b>Give an opinion</b><br>Personally, I think… / To me,…'
    ],
    4:{
      clothes:'Example: cardigan / coat / blouse',
      footwear:'Example: loafers / slippers',
      jewellery:'Example: brooch / pendant',
      headgear:'Example: beret / visor',
      materials:'Example: velvet / nylon',
      appearance:'Example: stylish / scruffy / well-dressed',
      mini:'Example: My classmate is wearing a smart jacket, dark jeans and trainers. He looks casual but fashionable.'
    },
    5:[
      '1a: striped top, jeans, sneakers',
      '1b: leather outfit, boots, helmet',
      '2a: bright colourful clothes and many accessories; creative/unusual style',
      '2b: jeans, T-shirt and flip-flops; simple/natural/relaxed style',
      '3a: suit and tie; smart/formal style',
      '3b: red sweater and jeans; casual style',
      '4a: black dress and white hat; fashionable/confident style',
      '4b: coat and scarf; warm/simple/calm style'
    ],
    6:{
      'Speaker 2':'2a',
      'Speaker 3':'1a',
      'Speaker 4':'4b',
      'Speaker 5':'3a'
    },
    7:{},
    8:[
      '<b>A phrasal verb</b> is a verb together with an adverb or preposition that changes its meaning.',
      '<b>Two-part:</b> verb + adverb/preposition.<br><b>Three-part:</b> verb + adverb + preposition.',
      '<b>Word order:</b> some two-part phrasal verbs can be separated; three-part phrasal verbs are not separated in the patterns taught here.'
    ],
    13:[
      'Example: suit · scarf · fashionable',
      'Example: save up · stand out',
      'Example: dress up',
      'Example: You could wear what makes you feel confident.'
    ],
    14:[
      'Example: stand out = be easy to see or notice.',
      'Example: I can now identify and use several phrasal verbs in context.',
      'Example: I still need to practise phrasal-verb word order and natural use.'
    ],
    15:`<b>Suggested answer</b>
      <p>Dear Emma,</p>
      <p>I think you should wear clothes that make you feel comfortable and confident. You do not need to <b>keep up with</b> every new fashion. If you are going somewhere special, you could <b>dress up</b>, but you can still choose an outfit that suits your own style.</p>
      <p>You could also <b>put together</b> an outfit with one unusual item if you want to <b>stand out</b>. The most important thing is to feel like yourself.</p>
      <p>Best wishes</p>`
  };

  function activeScreen(){return $('.screen.active');}
  function screenNo(){return Number(activeScreen()?.dataset.screen||0);}

  function stopAllMedia(){
    $$('audio,video').forEach(m=>{
      try{m.pause();}catch(_){}
    });
  }

  function esc(v){
    return String(v??'').replace(
      /[&<>\"]/g,
      m=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '\"':'&quot;'
      }[m]||m)
    );
  }

  function feedbackTone(ok){
    try{
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)return;

      const c=new C();
      const g=c.createGain();

      g.connect(c.destination);

      g.gain.setValueAtTime(.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.13,c.currentTime+.015);
      g.gain.exponentialRampToValueAtTime(
        .0001,
        c.currentTime+(ok?.34:.28)
      );

      (ok?[659.25,783.99]:[220,174.61]).forEach((f,n)=>{
        const o=c.createOscillator();

        o.type=ok?'sine':'triangle';

        o.frequency.setValueAtTime(
          f,
          c.currentTime+n*.11
        );

        o.connect(g);

        o.start(c.currentTime+n*.11);
        o.stop(c.currentTime+n*.11+.18);
      });

      setTimeout(()=>c.close(),650);

    }catch(_){}
  }

  function showToast(text,kind='good'){
    const s=activeScreen();

    if(!s)return;

    $('.u11-toast',s)?.remove();

    const d=document.createElement('div');

    d.className=`u11-toast ${kind}`;
    d.textContent=text;

    s.appendChild(d);

    setTimeout(()=>d.remove(),2500);
  }


  /* =========================================================
     HEADER
     ========================================================= */

  function buildHeader(){
    const topbar=$('.topbar');

    if(!topbar)return;

    $('.u11-header-right')?.remove();
    $('.review-badge')?.remove();

    const right=document.createElement('div');

    right.className='u11-header-right';

    right.innerHTML=`
      <div class="u11-modes">
        <button
          type="button"
          data-u11-mode="student">
          Student
        </button>

        <button
          type="button"
          data-u11-mode="teacher"
          class="active">
          Teacher
        </button>

        <button
          type="button"
          data-u11-mode="presentation">
          Presentation
        </button>
      </div>

      <div class="u11-teacher-tools">

        <button
          type="button"
          id="u11Timer">
          ⏱ Timer
        </button>

        <button
          type="button"
          id="u11Responses">
          ▦ Responses
        </button>

        <button
          type="button"
          id="u11Lucky">
          ★ Lucky No.
        </button>

        <button
          type="button"
          id="u11Reveal">
          Reveal next
        </button>

      </div>
    `;

    topbar.appendChild(right);

    $$('[data-u11-mode]',right)
      .forEach(
        b=>b.onclick=
          ()=>setMode(
            b.dataset.u11Mode
          )
      );
  }


  /* =========================================================
     MODAL
     ========================================================= */

  function buildModal(){
    $('.u11-modal')?.remove();

    const m=
      document.createElement('div');

    m.className='u11-modal';

    m.innerHTML=`
      <div class="u11-modalbox">

        <button
          class="u11-close"
          id="u11CloseModal">
          ×
        </button>

        <div id="u11ModalBody"></div>

      </div>
    `;

    document.body.appendChild(m);

    $('#u11CloseModal').onclick=
      ()=>m.classList.remove('show');

    m.onclick=e=>{
      if(e.target===m){
        m.classList.remove('show');
      }
    };
  }

  function modal(html){
    $('#u11ModalBody').innerHTML=html;
    $('.u11-modal').classList.add('show');
  }


  /* =========================================================
     TIMER
     ========================================================= */

  function openTimer(){

    modal(`
      <h2>Classroom Timer</h2>

      <p class="u11-timer-note">
        Choose a duration first.
      </p>

      <div
        class="u11-timerbig"
        id="u11Clock">
        --:--
      </div>

      <div class="u11-timer-presets">

        <button data-sec="30">
          30 sec
        </button>

        <button data-sec="60">
          1 min
        </button>

        <button data-sec="90">
          90 sec
        </button>

        <button data-sec="120">
          2 min
        </button>

        <button data-sec="180">
          3 min
        </button>

      </div>

      <div class="u11-custom-time">

        <label>
          Custom seconds
        </label>

        <input
          id="u11CustomSeconds"
          type="number"
          min="5"
          max="1800"
          step="5"
          placeholder="e.g. 45">

        <button id="u11SetCustom">
          Set
        </button>

      </div>

      <div class="u11-timercontrols">

        <button
          id="u11TStart"
          disabled>
          Start / Pause
        </button>

        <button
          id="u11TReset"
          disabled>
          Reset
        </button>

      </div>
    `);

    let selected=null;
    let left=0;
    let running=false;

    const draw=()=>{
      $('#u11Clock').textContent=
        selected===null
          ?'--:--'
          :`${String(
              Math.floor(left/60)
            ).padStart(2,'0')}:${String(
              left%60
            ).padStart(2,'0')}`;
    };

    const choose=n=>{
      selected=n;
      left=n;
      running=false;

      if(timerInt){
        clearInterval(timerInt);
      }

      $('#u11TStart').disabled=false;
      $('#u11TReset').disabled=false;

      draw();
    };

    $$('[data-sec]')
      .forEach(
        b=>b.onclick=
          ()=>choose(
            Number(b.dataset.sec)
          )
      );

    $('#u11SetCustom').onclick=()=>{

      const n=
        Number(
          $('#u11CustomSeconds').value
        );

      if(
        Number.isFinite(n) &&
        n>=5
      ){
        choose(
          Math.min(n,1800)
        );
      }
    };

    $('#u11TStart').onclick=()=>{

      if(selected===null)return;

      running=!running;

      if(timerInt){
        clearInterval(timerInt);
      }

      if(running){

        timerInt=setInterval(
          ()=>{

            if(left>0){

              left--;
              draw();

            }else{

              clearInterval(timerInt);
              running=false;

              feedbackTone(true);
            }

          },
          1000
        );
      }
    };

    $('#u11TReset').onclick=()=>{

      if(selected===null)return;

      if(timerInt){
        clearInterval(timerInt);
      }

      running=false;
      left=selected;

      draw();
    };
  }


  /* =========================================================
     RESPONSES
     ========================================================= */

  function collectResponses(){

    const s=activeScreen();

    if(!s)return[];

    const out=[];

    const poll=
      $('.poll-btn.selected',s);

    if(poll){
      out.push(
        `Quick choice: ${poll.textContent.trim()}`
      );
    }

    $$(
      'textarea,input.u11-student-input',
      s
    ).forEach((x,n)=>{

      if(x.value.trim()){

        out.push(
          `Response ${n+1}: ${x.value.trim()}`
        );
      }
    });

    const matched=
      $$('.match-item.matched',s).length;

    if(matched){
      out.push(
        `Correct matches: ${matched}/9`
      );
    }

    return out;
  }

  function openResponses(){

    const rs=
      collectResponses();

    modal(`
      <h2>Responses</h2>

      <div class="u11-tabs">

        <button class="active">
          By option
        </button>

        <button>
          All
        </button>

        <button>
          Spotlight
        </button>

      </div>

      <p>
        <b>
          Names hidden by default
          in classroom display.
        </b>
      </p>

      ${
        (
          rs.length
            ?rs
            :['No response yet.']
        )
        .map(
          (r,n)=>`
            <div class="u11-response-card">
              Response ${n+1}:
              ${esc(r)}
            </div>
          `
        )
        .join('')
      }
    `);
  }


  /* =========================================================
     ROLE MODE
     ========================================================= */

  function setMode(m){

    mode=m;
    revealMode=false;

    document.body.classList.remove(
      'u11-student',
      'u11-teacher',
      'presentation',
      'u11-reveal-mode'
    );

    if(m==='student'){
      document.body.classList.add(
        'u11-student'
      );
    }

    if(m==='teacher'){
      document.body.classList.add(
        'u11-teacher'
      );
    }

    if(m==='presentation'){
      document.body.classList.add(
        'presentation'
      );
    }

    $$('[data-u11-mode]')
      .forEach(
        b=>b.classList.toggle(
          'active',
          b.dataset.u11Mode===m
        )
      );

    stopAllMedia();

    decorateCurrentScreen();
  }


  /* =========================================================
     RECORDING
     ========================================================= */

  function stopRecorderCleanup(){

    if(
      recorder &&
      recorder.state!=='inactive'
    ){
      try{
        recorder.stop();
      }catch(_){}
    }

    if(recordingStream){

      recordingStream
        .getTracks()
        .forEach(
          t=>t.stop()
        );

      recordingStream=null;
    }

    recorder=null;
    recordingChunks=[];
  }

  function recordingWidget(key){

    return `
      <div
        class="u11-record"
        data-record-key="${key}">

        <button
          type="button"
          class="u11-record-start">
          ● Record
        </button>

        <button
          type="button"
          class="u11-record-stop"
          disabled>
          ■ Stop
        </button>

        <span class="u11-record-status">
          Ready
        </span>

        <audio
          class="u11-record-playback"
          controls
          hidden>
        </audio>

      </div>
    `;
  }

  function wireRecording(root){

    $$('.u11-record',root)
      .forEach(box=>{

        if(
          box.dataset.wired==='1'
        ){
          return;
        }

        box.dataset.wired='1';

        const start=
          $('.u11-record-start',box);

        const stop=
          $('.u11-record-stop',box);

        const status=
          $('.u11-record-status',box);

        const audio=
          $('.u11-record-playback',box);

        start.onclick=async()=>{

          if(
            !navigator.mediaDevices?.getUserMedia ||
            !window.MediaRecorder
          ){
            status.textContent=
              'Recording is not supported in this browser.';

            return;
          }

          stopRecorderCleanup();

          try{

            recordingStream=
              await navigator
                .mediaDevices
                .getUserMedia(
                  {audio:true}
                );

            recordingChunks=[];

            recorder=
              new MediaRecorder(
                recordingStream
              );

            recorder.ondataavailable=e=>{

              if(e.data.size){
                recordingChunks.push(
                  e.data
                );
              }
            };

            recorder.onstop=()=>{

              const blob=
                new Blob(
                  recordingChunks,
                  {
                    type:
                      recordingChunks[0]
                        ?.type ||
                      'audio/webm'
                  }
                );

              if(recordingUrl){
                URL.revokeObjectURL(
                  recordingUrl
                );
              }

              recordingUrl=
                URL.createObjectURL(blob);

              audio.src=recordingUrl;
              audio.hidden=false;

              status.textContent=
                'Recorded';

              if(recordingStream){

                recordingStream
                  .getTracks()
                  .forEach(
                    t=>t.stop()
                  );

                recordingStream=null;
              }
            };

            recorder.start();

            start.disabled=true;
            stop.disabled=false;

            status.textContent=
              'Recording…';

          }catch(e){

            status.textContent=
              'Microphone permission was not granted.';
          }
        };

        stop.onclick=()=>{

          if(
            recorder &&
            recorder.state!=='inactive'
          ){
            recorder.stop();
          }

          start.disabled=false;
          stop.disabled=true;
        };
      });
  }


  /* =========================================================
     REVEAL MODE
     ========================================================= */

  function enterRevealMode(){

    if(mode==='student'){

      showToast(
        'Teacher reveal is available in Teacher or Presentation mode.',
        'try'
      );

      return;
    }

    revealMode=true;

    document.body.classList.add(
      'u11-reveal-mode'
    );

    const b=
      $('.u11-actionbar .u11-check');

    if(b){

      b.textContent=
        '✓ Reveal mode ON';

      b.classList.add(
        'reveal-on'
      );
    }

    showToast(
      'Reveal mode is ON. Click answer boxes one by one.',
      'good'
    );
  }

  function revealTarget(el){

    if(
      !revealMode ||
      mode==='student'
    ){
      return false;
    }

    if(
      el.classList.contains(
        'u11-revealed'
      )
    ){
      return true;
    }

    const answer=
      el.dataset.u11Answer;

    if(!answer){
      return false;
    }

    let box=
      $('.u11-revealed-answer',el);

    if(!box){

      box=
        document.createElement('div');

      box.className=
        'u11-revealed-answer';

      el.appendChild(box);
    }

    box.innerHTML=answer;

    el.classList.add(
      'u11-revealed'
    );

    feedbackTone(true);

    return true;
  }

  document.addEventListener(
    'click',
    e=>{

      const target=
        e.target.closest(
          '[data-u11-answer]'
        );

      if(!target)return;

      if(
        mode==='student' ||
        !revealMode
      ){

        if(
          target.matches(
            '.discovery-card,'+
            '.challenge-card,'+
            '.layer-card'
          )
        ){
          e.preventDefault();
          e.stopImmediatePropagation();
        }

        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      revealTarget(target);

    },
    true
  );


  /* =========================================================
     RESET
     ========================================================= */

  function resetScreen(){

    const s=activeScreen();

    if(!s)return;

    revealMode=false;

    document.body.classList.remove(
      'u11-reveal-mode'
    );

    $$('.u11-revealed',s)
      .forEach(x=>{

        x.classList.remove(
          'u11-revealed',
          'u11-answer-correct',
          'u11-answer-wrong'
        );

        $('.u11-revealed-answer',x)
          ?.remove();
      });

    $$(
      '.u11-student-input,textarea',
      s
    ).forEach(
      x=>x.value=''
    );

    $$(
      '.poll-btn.selected,'+
      '.confidence button.selected',
      s
    ).forEach(
      x=>x.classList.remove(
        'selected'
      )
    );

    const pr=
      $('#pollResult',s);

    if(pr){
      pr.textContent=
        'Choose one option, then explain your choice.';
    }

    $$('.support',s)
      .forEach(
        x=>x.classList.add(
          'hidden'
        )
      );

    $$(
      '.inline-blank.revealed,'+
      '.blank-reveal.revealed',
      s
    ).forEach(x=>{

      x.classList.remove(
        'revealed'
      );

      x.textContent=
        '__________';
    });

    $$('.item-check',s)
      .forEach(x=>{

        x.textContent='check';

        x.classList.remove(
          'heard',
          'not-heard'
        );
      });

    $$(
      '.candidate-grid input[type="checkbox"]',
      s
    ).forEach(
      x=>x.checked=false
    );

    $$('.candidate-item',s)
      .forEach(
        x=>x.classList.remove(
          'u11-answer-correct',
          'u11-answer-wrong'
        )
      );

    $$(
      '.match-item,'+
      '.definition-item',
      s
    ).forEach(x=>{

      x.disabled=false;

      x.classList.remove(
        'selected',
        'matched',
        'wrong'
      );
    });

    const ms=
      $('#matchStatus',s);

    if(ms){
      ms.textContent=
        'Select a phrasal verb, then select its definition.';
    }

    $$('.challenge-card',s)
      .forEach(c=>{

        if(c.dataset.front){
          c.textContent=
            c.dataset.front;
        }

        c.classList.remove(
          'flipped'
        );
      });

    $$('.discovery-card',s)
      .forEach(c=>{

        if(
          c.dataset.u11OriginalHtml
        ){
          c.innerHTML=
            c.dataset.u11OriginalHtml;
        }

        c.classList.remove(
          'revealed'
        );
      });

    $$('.layer-card',s)
      .forEach(c=>{

        if(
          c.dataset.u11OriginalHtml
        ){
          c.innerHTML=
            c.dataset.u11OriginalHtml;
        }

        c.classList.remove(
          'revealed'
        );

        delete c.dataset.step;
      });

    $('.u11-suggested-answer',s)
      ?.classList.remove(
        'show'
      );

    $('.u11-toast',s)
      ?.remove();

    stopRecorderCleanup();

    decorateCurrentScreen();
  }


  /* =========================================================
     INPUT HELPERS
     ========================================================= */

  function addInput(
    container,
    key,
    placeholder='Type your answer here…',
    record=false
  ){

    if(
      $('.u11-open-response',container)
    ){
      return;
    }

    const d=
      document.createElement('div');

    d.className=
      'u11-open-response';

    d.innerHTML=`
      <textarea
        class="u11-student-input"
        data-state-key="${key}"
        placeholder="${placeholder}">
      </textarea>

      ${
        record
          ?recordingWidget(key)
          :''
      }
    `;

    container.appendChild(d);

    wireRecording(d);
  }


  /* =========================================================
     SCREEN 1
     ========================================================= */

  function augment1(s){

    const poll=
      $('.poll-card',s);

    if(poll){

      addInput(
        poll,
        'screen1',
        'Explain your choice in 1–2 sentences…',
        true
      );

      poll.dataset.u11Answer=
        suggested[1].join('<br>');

      poll.classList.add(
        'u11-reveal-target'
      );
    }
  }


  /* =========================================================
     SCREEN 2
     ========================================================= */

  function augment2(s){

    $$('.question-card',s)
      .forEach((q,n)=>{

        addInput(
          q,
          `s2-${n}`,
          'Type your answer…',
          true
        );

        q.dataset.u11Answer=
          suggested[2][n];

        q.classList.add(
          'u11-reveal-target'
        );
      });
  }


  /* =========================================================
     SCREEN 3
     ========================================================= */

  function augment3(s){

    $$('.layer-card',s)
      .forEach((c,n)=>{

        if(
          !c.dataset.u11OriginalHtml
        ){
          c.dataset.u11OriginalHtml=
            c.innerHTML;
        }

        c.dataset.u11Answer=
          suggested[3][n];

        c.classList.add(
          'u11-reveal-target'
        );
      });
  }


  /* =========================================================
     SCREEN 4
     ========================================================= */

  function currentVocabKey(){

    return (
      $('#vocabTabs .tab.active')
        ?.dataset.tab ||
      'clothes'
    );
  }

  function refreshVocabExtras(s){

    $('.u11-vocab-extra',s)
      ?.remove();

    const key=
      currentVocabKey();

    const panel=
      $('#vocabPanel',s);

    if(!panel)return;

    const d=
      document.createElement('div');

    d.className=
      'u11-vocab-extra u11-reveal-target';

    d.dataset.u11Answer=
      suggested[4][key] ||
      'Teacher accepts an appropriate additional example.';

    d.innerHTML=`
      <label>
        Add one more example of your own
      </label>

      <input
        class="u11-student-input"
        data-vocab-key="${key}"
        placeholder="Type one more word…">
    `;

    panel.after(d);

    const inp=
      $('input',d);

    inp.value=
      state.vocabExtra[key]||'';

    inp.oninput=
      ()=>state.vocabExtra[key]=
        inp.value;
  }

  function augment4(s){

    refreshVocabExtras(s);

    const mini=
      $('.mini-task',s);

    if(
      mini &&
      !$('.u11-mini-response',s)
    ){

      const d=
        document.createElement('div');

      d.className=
        'u11-mini-response u11-reveal-target';

      d.dataset.u11Answer=
        suggested[4].mini;

      d.innerHTML=`
        <textarea
          class="u11-student-input"
          placeholder="Describe one classmate…">
        </textarea>

        ${recordingWidget('s4-mini')}
      `;

      mini.after(d);

      wireRecording(d);
    }

    $$('#vocabTabs .tab',s)
      .forEach(
        btn=>btn.addEventListener(
          'click',
          ()=>setTimeout(
            ()=>refreshVocabExtras(s),
            0
          )
        )
      );
  }


  /* =========================================================
     SCREEN 5
     ========================================================= */

  function augment5(s){

    $$('.hotspot',s)
      .forEach((h,n)=>{

        h.dataset.u11Answer=
          esc(
            h.dataset.hotspot ||
            suggested[5][n]
          );

        h.classList.add(
          'u11-reveal-target'
        );
      });

    const support=
      $('.support-box',s);

    if(support){

      addInput(
        support,
        'screen5',
        'Describe and compare one pair of photos…',
        true
      );
    }
  }


  /* =========================================================
     SCREEN 6
     ========================================================= */

  function augment6(s){

    $$('.speaker-match>div',s)
      .forEach(row=>{

        if(
          $('.u11-speaker-input',row)
        ){
          return;
        }

        const txt=
          row.childNodes[0]
            ?.textContent
            .trim() ||
          row.textContent
            .trim()
            .split('?')[0]
            .trim();

        const old=
          $('.blank-reveal',row);

        const ans=
          old?.dataset.answer ||
          suggested[6][txt] ||
          '';

        if(old){
          old.style.display='none';
        }

        const inp=
          document.createElement(
            'input'
          );

        inp.className=
          'u11-student-input u11-speaker-input';

        inp.placeholder=
          'Type photo label';

        row.appendChild(inp);

        row.dataset.u11Answer=
          esc(ans);

        row.classList.add(
          'u11-reveal-target'
        );
      });
  }


  /* =========================================================
     SCREEN 7
     ========================================================= */

  function buildPhrasalMeaningGrid(s){

    $('.u11-phrasal-grid',s)
      ?.remove();

    const spans=
      $$('.phrasal-click',s);

    if(!spans.length)return;

    const grid=
      document.createElement('div');

    grid.className=
      'u11-phrasal-grid';

    spans.forEach(sp=>{

      const row=
        document.createElement('div');

      row.className=
        'u11-phrasal-row u11-reveal-target';

      row.dataset.u11Answer=
        esc(
          sp.dataset.meaning ||
          ''
        );

      row.innerHTML=`
        <b>
          ${esc(sp.textContent)}
        </b>

        <input
          class="u11-student-input"
          placeholder="Type an equivalent meaning…">
      `;

      grid.appendChild(row);
    });

    $('#meaningBox',s)
      ?.after(grid);
  }

  function augment7(s){

    buildPhrasalMeaningGrid(s);

    $$('#speakerTabs .tab',s)
      .forEach(
        btn=>btn.addEventListener(
          'click',
          ()=>setTimeout(
            ()=>buildPhrasalMeaningGrid(s),
            0
          )
        )
      );
  }


  /* =========================================================
     SCREEN 8
     ========================================================= */

  function augment8(s){

    $$('.discovery-card',s)
      .forEach((c,n)=>{

        if(
          !c.dataset.u11OriginalHtml
        ){
          c.dataset.u11OriginalHtml=
            c.innerHTML;
        }

        c.dataset.u11Answer=
          suggested[8][n];

        c.classList.add(
          'u11-reveal-target'
        );
      });
  }


  /* =========================================================
     SCREEN 9
     ========================================================= */

  function augment9(s){

    const steps=
      $$('.ex7-step',s);

    if(
      steps.length>=2 &&
      !$('.ex7-step-tabs',s)
    ){

      const tabs=
        document.createElement('div');

      tabs.className=
        'ex7-step-tabs';

      tabs.innerHTML=`
        <button
          class="ex7-step-tab active"
          data-step="0">
          Step 1
        </button>

        <button
          class="ex7-step-tab"
          data-step="1">
          Step 2
        </button>
      `;

      steps[0]
        .parentNode
        .insertBefore(
          tabs,
          steps[0]
        );

      const inst=
        $('.instruction',s);

      const texts=[
        'Listen again to Speakers 2–5 and identify the phrasal verbs you hear. Check the items one by one.',
        'Match the nine target phrasal verbs to definitions a–i.'
      ];

      const activate=n=>{

        steps.forEach(
          (x,k)=>x.classList.toggle(
            'ex7-active',
            k===n
          )
        );

        $$('.ex7-step-tab',tabs)
          .forEach(
            (b,k)=>b.classList.toggle(
              'active',
              k===n
            )
          );

        s.dataset.ex7Step=
          String(n+1);

        if(inst){
          inst.textContent=
            texts[n];
        }
      };

      $$('.ex7-step-tab',tabs)
        .forEach(
          b=>b.onclick=
            ()=>activate(
              Number(
                b.dataset.step
              )
            )
        );

      activate(0);
    }
  }


  /* =========================================================
     SCREEN 12
     ========================================================= */

  function augment12(s){

    const p=
      $('.big-prompt',s);

    if(
      p &&
      !$('.u11-speaking-response',s)
    ){

      const d=
        document.createElement('div');

      d.className=
        'u11-speaking-response';

      d.innerHTML=`
        <textarea
          class="u11-student-input"
          placeholder="Optional notes before speaking…">
        </textarea>

        ${recordingWidget('screen12')}
      `;

      p.after(d);

      wireRecording(d);
    }
  }


  /* =========================================================
     SCREEN 13
     ========================================================= */

  function augment13(s){

    $$('.challenge-card',s)
      .forEach((c,n)=>{

        if(
          !c.dataset.u11OriginalHtml
        ){
          c.dataset.u11OriginalHtml=
            c.innerHTML;
        }

        c.dataset.u11Answer=
          esc(
            c.dataset.back ||
            suggested[13][n]
          );

        c.classList.add(
          'u11-reveal-target'
        );

        if(
          !c.nextElementSibling
            ?.classList
            .contains(
              'u11-challenge-input'
            )
        ){

          const i=
            document.createElement(
              'input'
            );

          i.className=
            'u11-student-input u11-challenge-input';

          i.placeholder=
            'Type your answer…';

          c.after(i);
        }
      });
  }


  /* =========================================================
     SCREEN 14
     ========================================================= */

  function augment14(s){

    $$('.exit-grid>div',s)
      .forEach((box,n)=>{

        box.dataset.u11Answer=
          suggested[14][n];

        box.classList.add(
          'u11-reveal-target'
        );
      });
  }


  /* =========================================================
     SCREEN 15
     ========================================================= */

  function augment15(s){

    const card=
      $('.homework-card',s);

    if(
      !card ||
      $('.u11-homework-response',card)
    ){
      return;
    }

    const d=
      document.createElement('div');

    d.className=
      'u11-homework-response';

    d.innerHTML=`
      <label class="u11-homework-label">
        Your response
      </label>

      <textarea
        id="u11HomeworkText"
        class="u11-homework-textarea"
        placeholder="Type your response here…">
      </textarea>

      <div class="u11-homework-actions">

        <button
          type="button"
          class="u11-homework-submit"
          id="u11HomeworkSubmit">
          Submit
        </button>

        <button
          type="button"
          id="u11SuggestedAnswer">
          Suggested answer
        </button>

      </div>

      <div
        class="u11-suggested-answer"
        id="u11SuggestedPanel">

        ${suggested[15]}

      </div>
    `;

    card.appendChild(d);

    $('#u11HomeworkSubmit').onclick=
      e=>{

        if(
          !$('#u11HomeworkText')
            .value
            .trim()
        ){

          showToast(
            'Type your response before submitting.',
            'try'
          );

          return;
        }

        e.currentTarget.textContent=
          'Submitted ✓';

        e.currentTarget.classList.add(
          'submitted'
        );

        state.submitted[15]=true;
      };

    $('#u11SuggestedAnswer').onclick=
      ()=>{

        $('#u11SuggestedPanel')
          .classList.toggle(
            'show'
          );
      };
  }


  /* =========================================================
     CHECK
     ========================================================= */

  function checkFixedStudent(n){

    const s=activeScreen();

    if(!s)return;

    let ok=true;
    let any=false;

    if(n===6){

      $$('.speaker-match>div',s)
        .forEach(row=>{

          const input=
            $('.u11-speaker-input',row);

          if(!input)return;

          any=true;

          const exp=
            (
              row.dataset.u11Answer ||
              ''
            ).toLowerCase();

          const got=
            input.value
              .trim()
              .toLowerCase();

          const good=
            got===exp;

          ok=ok&&good;

          input.classList.toggle(
            'answer-correct',
            good
          );

          input.classList.toggle(
            'answer-wrong',
            !good
          );
        });

    }else if(n===9){

      const step=
        s.dataset.ex7Step ||
        '1';

      if(step==='1'){

        $$('.candidate-item',s)
          .forEach(item=>{

            const box=
              $('input[type="checkbox"]',item);

            const btn=
              $('.item-check',item);

            if(
              !box ||
              !btn
            ){
              return;
            }

            any=true;

            const exp=
              btn.dataset.heard==='yes';

            const good=
              box.checked===exp;

            ok=ok&&good;

            item.classList.toggle(
              'u11-answer-correct',
              good
            );

            item.classList.toggle(
              'u11-answer-wrong',
              !good
            );
          });

      }else{

        any=true;

        ok=
          $$('.match-item.matched',s)
            .length===9;
      }

    }else{

      showToast(
        'Submitted for teacher review.',
        'good'
      );

      state.submitted[n]=true;

      return;
    }

    if(any){

      showToast(
        ok
          ?'✓ Correct!'
          :'Try again — check the highlighted answer(s).',
        ok
          ?'good'
          :'try'
      );

      feedbackTone(ok);

      window.ELEAP_LAST_RESULT={
        activityId:String(n),
        isCorrect:ok,
        score:ok?1:0,
        checkedAt:
          new Date().toISOString()
      };
    }
  }

  function handleCheck(){

    const n=
      screenNo();

    if(mode==='student'){

      checkFixedStudent(n);

    }else{

      enterRevealMode();
    }
  }


  /* =========================================================
     REVEAL NEXT
     ========================================================= */

  function revealNext(){

    if(mode==='student'){

      showToast(
        'Teacher reveal is available in Teacher or Presentation mode.',
        'try'
      );

      return;
    }

    if(!revealMode){
      enterRevealMode();
    }

    const s=
      activeScreen();

    const next=
      $(
        '[data-u11-answer]:not(.u11-revealed)',
        s
      );

    if(next){

      revealTarget(next);

      next.scrollIntoView({
        block:'nearest',
        behavior:'smooth'
      });

    }else{

      showToast(
        'No more teacher answers to reveal on this screen.',
        'good'
      );
    }
  }


  /* =========================================================
     ACTION BAR
     ========================================================= */

  function decorateActionBar(){

    const s=
      activeScreen();

    if(!s)return;

    $('.u11-actionbar',s)
      ?.remove();

    const n=
      screenNo();

    if(n===16){
      return;
    }

    const bar=
      document.createElement('div');

    bar.className=
      'u11-actionbar';

    if(n===15){

      bar.innerHTML=`
        <button
          type="button"
          id="u11Reset">
          Reset
        </button>
      `;

    }else{

      bar.innerHTML=`
        <button
          type="button"
          class="u11-check"
          id="u11Check">
          Check
        </button>

        <button
          type="button"
          id="u11Reset">
          Reset
        </button>
      `;
    }

    s.appendChild(bar);

    $('#u11Check',bar)
      ?.addEventListener(
        'click',
        handleCheck
      );

    $('#u11Reset',bar)
      ?.addEventListener(
        'click',
        resetScreen
      );
  }


  /* =========================================================
     DECORATE CURRENT SCREEN
     ========================================================= */

  function decorateCurrentScreen(){

    const s=
      activeScreen();

    if(!s)return;

    const n=
      screenNo();

    if(n===1)augment1(s);
    if(n===2)augment2(s);
    if(n===3)augment3(s);
    if(n===4)augment4(s);
    if(n===5)augment5(s);
    if(n===6)augment6(s);
    if(n===7)augment7(s);
    if(n===8)augment8(s);
    if(n===9)augment9(s);
    if(n===12)augment12(s);
    if(n===13)augment13(s);
    if(n===14)augment14(s);
    if(n===15)augment15(s);

    decorateActionBar();
  }


  /* =========================================================
     OBSERVE SCREEN CHANGES
     ========================================================= */

  function installObserver(){

    const ob=
      new MutationObserver(
        ms=>{

          if(
            ms.some(
              m=>
                m.type==='attributes' &&
                m.attributeName==='class' &&
                m.target
                  .classList
                  .contains('screen')
            )
          ){

            revealMode=false;

            document.body
              .classList
              .remove(
                'u11-reveal-mode'
              );

            stopAllMedia();

            setTimeout(
              decorateCurrentScreen,
              0
            );
          }
        }
      );

    $$('.screen')
      .forEach(
        s=>ob.observe(
          s,
          {
            attributes:true,
            attributeFilter:['class']
          }
        )
      );
  }


  /* =========================================================
     INIT
     ========================================================= */

  buildHeader();
  buildModal();

  $('#u11Timer').onclick=
    openTimer;

  $('#u11Responses').onclick=
    openResponses;

  $('#u11Lucky').onclick=
    ()=>modal(`
      <h2>Lucky Number</h2>

      <div class="u11-lucky">
        ${
          Math.floor(
            Math.random()*24
          )+1
        }
      </div>

      <p style="text-align:center">
        Use for random participation.
      </p>
    `);

  $('#u11Reveal').onclick=
    revealNext;

  installObserver();

  setMode('teacher');

  document.addEventListener(
    'keydown',
    e=>{

      if(e.key==='Escape'){

        $('.u11-modal')
          ?.classList
          .remove('show');
      }
    }
  );

  window.ELEAP_U11_UI={
    setMode,
    openTimer,
    openResponses,
    revealNext,
    resetScreen,
    decorateCurrentScreen
  };

})();

/* =========================================================
   E-LEAP U1.1 — FINAL CORRECTION v4.0
   Fixes:
   S03 Student typing
   S08 Student typing + teacher reveal layout
   S09 role separation + teacher matching reveal + reset
   S10/S11 real Student input + Teacher reveal
   S12 Teacher suggested answer
   S15 Suggested answer Teacher-only
   Action bar overlay
   Teacher controls audit
   ========================================================= */

(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  const screen=()=>$('.screen.active');

  const screenNo=()=>Number(
    screen()?.dataset.screen||0
  );

  const isStudent=()=>
    document.body.classList.contains(
      'u11-student'
    );

  const isTeacher=()=>
    document.body.classList.contains(
      'u11-teacher'
    ) ||
    document.body.classList.contains(
      'presentation'
    );

  const revealIsOn=()=>
    document.body.classList.contains(
      'u11-reveal-mode'
    );


  /* =======================================================
     HELPERS
     ======================================================= */

  function normalise(v){
    return String(v||'')
      .toLowerCase()
      .replace(/[’‘]/g,"'")
      .replace(/[^a-z0-9' ]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function matchesAnswer(value,expected){

    const got=normalise(value);

    const options=
      String(expected||'')
        .split('/')
        .map(x=>normalise(x))
        .filter(Boolean);

    return options.some(
      x=>x===got
    );
  }

  function toast(text,type='good'){

    const s=screen();

    if(!s)return;

    $('.u11-v4-toast',s)?.remove();

    const d=
      document.createElement('div');

    d.className=
      `u11-v4-toast ${type}`;

    d.textContent=text;

    s.appendChild(d);

    setTimeout(
      ()=>d.remove(),
      2500
    );
  }

  function makeRevealAnswer(
    target,
    html
  ){

    if(!target)return;

    let answer=
      $('.u11-v4-answer',target);

    if(!answer){

      answer=
        document.createElement('div');

      answer.className=
        'u11-v4-answer';

      target.appendChild(answer);
    }

    answer.innerHTML=html;

    target.classList.add(
      'u11-v4-revealed'
    );
  }


  /* =======================================================
     SLIDE 3
     STUDENT TYPES INTO EACH STRATEGY CARD
     ======================================================= */

  function fixSlide3(){

    const s=
      $('.screen[data-screen="3"]');

    if(!s)return;

    $$('.layer-card',s)
      .forEach((card,n)=>{

        if(
          $('.u11-v4-card-response',card)
        ){
          return;
        }

        const wrap=
          document.createElement('div');

        wrap.className=
          'u11-v4-card-response';

        wrap.innerHTML=`
          <textarea
            class="u11-v4-input"
            placeholder="Type your response here…"
            aria-label="Speaking strategy response ${n+1}">
          </textarea>
        `;

        card.appendChild(wrap);
      });
  }


  /* =======================================================
     SLIDE 8
     STUDENT TYPES INTO EACH DISCOVERY CARD
     ======================================================= */

  function fixSlide8(){

    const s=
      $('.screen[data-screen="8"]');

    if(!s)return;

    $$('.discovery-card',s)
      .forEach((card,n)=>{

        if(
          $('.u11-v4-card-response',card)
        ){
          return;
        }

        const wrap=
          document.createElement('div');

        wrap.className=
          'u11-v4-card-response';

        wrap.innerHTML=`
          <textarea
            class="u11-v4-input"
            placeholder="Type your answer first…"
            aria-label="Guided discovery response ${n+1}">
          </textarea>
        `;

        card.appendChild(wrap);
      });
  }


  /* =======================================================
     PREVENT LEGACY DIRECT REVEAL
     Student must NEVER click the original card
     and immediately see teacher answer.
     ======================================================= */

  document.addEventListener(
    'click',
    e=>{

      if(!isStudent())return;

      if(
        e.target.closest(
          '.u11-v4-input,'+
          '.u11-student-input,'+
          'textarea,input'
        )
      ){
        return;
      }

      const legacy=
        e.target.closest(
          '.layer-card,'+
          '.discovery-card,'+
          '.inline-blank,'+
          '.item-check'
        );

      if(legacy){

        e.preventDefault();
        e.stopImmediatePropagation();
      }

    },
    true
  );


  /* =======================================================
     SLIDE 9 — STEP 1
     Student: choose checkboxes
     Teacher: Check => click each whole item =>
              HEARD / NOT HEARD
     ======================================================= */

  function fixSlide9Step1(){

    const s=
      $('.screen[data-screen="9"]');

    if(!s)return;

    $$('.candidate-item',s)
      .forEach(item=>{

        const legacy=
          $('.item-check',item);

        if(!legacy)return;

        const heard=
          legacy.dataset.heard==='yes';

        item.dataset.u11V4Heard=
          heard?'yes':'no';
      });
  }


  /* =======================================================
     SLIDE 9 — STEP 2
     Teacher Check => click left verb.
     Correct definition on right lights up.
     Previous answers remain visible.
     ======================================================= */

  document.addEventListener(
    'click',
    e=>{

      if(
        screenNo()!==9 ||
        !isTeacher() ||
        !revealIsOn()
      ){
        return;
      }

      const verb=
        e.target.closest(
          '.match-item'
        );

      if(!verb)return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const letter=
        verb.dataset.match;

      if(!letter)return;

      const definition=
        $(
          `.definition-item[data-letter="${letter}"]`,
          screen()
        );

      if(!definition)return;

      verb.classList.add(
        'u11-v4-match-source'
      );

      definition.classList.add(
        'u11-v4-match-answer'
      );

      if(
        !$('.u11-v4-answer-label',definition)
      ){

        const tag=
          document.createElement('span');

        tag.className=
          'u11-v4-answer-label';

        tag.textContent=
          '✓ ANSWER';

        definition.appendChild(tag);
      }

    },
    true
  );


  /* =======================================================
     SLIDE 9 — STEP 1 TEACHER REVEAL
     ======================================================= */

  document.addEventListener(
    'click',
    e=>{

      if(
        screenNo()!==9 ||
        !isTeacher() ||
        !revealIsOn()
      ){
        return;
      }

      const item=
        e.target.closest(
          '.candidate-item'
        );

      if(
        !item ||
        !item.closest(
          '.candidate-grid'
        )
      ){
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      const heard=
        item.dataset.u11V4Heard==='yes';

      makeRevealAnswer(
        item,
        heard
          ?'<b>HEARD ✓</b>'
          :'<b>NOT HEARD</b>'
      );

    },
    true
  );


  /* =======================================================
     SLIDE 9 REAL RESET
     Calls original matching reset so its private
     selectedVerb variable is cleared too.
     ======================================================= */

  document.addEventListener(
    'click',
    e=>{

      if(
        e.target.id!=='u11Reset'
      ){
        return;
      }

      const n=
        screenNo();

      setTimeout(
        ()=>{

          if(n===9){

            $('#resetMatch')
              ?.click();

            const s=
              $('.screen[data-screen="9"]');

            $(
              '#matchStatus',
              s
            )?.replaceChildren(
              document.createTextNode(
                'Select a phrasal verb, then select its definition.'
              )
            );

            $$('.candidate-item',s)
              .forEach(item=>{

                item.classList.remove(
                  'u11-answer-correct',
                  'u11-answer-wrong',
                  'u11-v4-revealed'
                );

                $('.u11-v4-answer',item)
                  ?.remove();

                const cb=
                  $('input[type="checkbox"]',item);

                if(cb){
                  cb.checked=false;
                }
              });

            $$(
              '.match-item,'+
              '.definition-item',
              s
            ).forEach(x=>{

              x.disabled=false;

              x.classList.remove(
                'selected',
                'matched',
                'wrong',
                'u11-v4-match-source',
                'u11-v4-match-answer'
              );

              $('.u11-v4-answer-label',x)
                ?.remove();
            });
          }

          /*
            S3 / S8:
            reset in the previous layer restores
            original HTML, so rebuild Student inputs.
          */

          if(n===3){
            fixSlide3();
          }

          if(n===8){
            fixSlide8();
          }

          applyRoleRules();

        },
        30
      );

    },
    true
  );


  /* =======================================================
     SLIDE 10–11
     Replace old clickable-answer buttons with genuine
     STUDENT INPUTS.
     Teacher Check => click answer field to reveal.
     ======================================================= */

  function convertInlineAnswers(
    number
  ){

    const s=
      $(
        `.screen[data-screen="${number}"]`
      );

    if(!s)return;

    $$('.inline-blank',s)
      .forEach((old,n)=>{

        if(
          old.dataset.u11V4Converted==='1'
        ){
          return;
        }

        const expected=
          old.dataset.answer||'';

        const shell=
          document.createElement('span');

        shell.className=
          'u11-v4-inline-shell';

        shell.dataset.u11Answer=
          expected;

        shell.innerHTML=`
          <input
            type="text"
            class="u11-v4-inline-input"
            data-expected="${expected.replace(/"/g,'&quot;')}"
            aria-label="Answer ${n+1}"
            placeholder="Type…">
        `;

        old.replaceWith(shell);
      });
  }


  /* =======================================================
     STUDENT CHECK FOR SLIDE 10–11
     Does not reveal answer.
     ======================================================= */

  function checkInlineStudent(){

    const s=screen();

    if(!s)return;

    const inputs=
      $$('.u11-v4-inline-input',s);

    if(!inputs.length)return;

    let all=true;
    let completed=true;

    inputs.forEach(input=>{

      const value=
        input.value.trim();

      if(!value){
        completed=false;
        all=false;
      }

      const ok=
        value &&
        matchesAnswer(
          value,
          input.dataset.expected
        );

      input.classList.remove(
        'u11-v4-correct',
        'u11-v4-wrong'
      );

      input.classList.add(
        ok
          ?'u11-v4-correct'
          :'u11-v4-wrong'
      );

      all=all&&ok;
    });

    if(!completed){

      toast(
        'Complete all the answers first.',
        'try'
      );

    }else if(all){

      toast(
        '✓ Correct!',
        'good'
      );

    }else{

      toast(
        'Try again — check the highlighted answer(s).',
        'try'
      );
    }
  }


  /* =======================================================
     Override STUDENT Check on S10/S11.
     Teacher Check continues to use Reveal mode.
     ======================================================= */

  document.addEventListener(
    'click',
    e=>{

      if(
        e.target.id!=='u11Check' ||
        !isStudent()
      ){
        return;
      }

      if(
        screenNo()===10 ||
        screenNo()===11
      ){

        e.preventDefault();
        e.stopImmediatePropagation();

        checkInlineStudent();
      }

    },
    true
  );


  /* =======================================================
     SLIDE 12
     Teacher Check should SHOW suggested answer immediately.
     ======================================================= */

  const slide12Answer=`
    <b>Suggested answer</b><br>
    If I were Emma, I would wear clothes that make me
    feel comfortable and confident. She could
    <b>dress up</b> for special occasions, but she
    does not need to <b>keep up with</b> every new
    fashion. She could also <b>put together</b> an
    outfit that suits her personality.
  `;

  function revealSlide12(){

    const s=
      $('.screen[data-screen="12"]');

    if(!s)return;

    let panel=
      $('.u11-v4-s12-answer',s);

    if(!panel){

      panel=
        document.createElement('div');

      panel.className=
        'u11-v4-s12-answer';

      panel.innerHTML=
        slide12Answer;

      $('.advice-layout',s)
        ?.after(panel);
    }

    panel.classList.add(
      'show'
    );
  }

  document.addEventListener(
    'click',
    e=>{

      if(
        e.target.id!=='u11Check' ||
        screenNo()!==12 ||
        !isTeacher()
      ){
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      document.body.classList.add(
        'u11-reveal-mode'
      );

      e.target.textContent=
        '✓ Answer shown';

      e.target.classList.add(
        'reveal-on'
      );

      revealSlide12();

    },
    true
  );


  /* =======================================================
     SLIDE 15
     Suggested answer = TEACHER / PRESENTATION ONLY
     Student never sees teacher model answer.
     ======================================================= */

  function applySlide15Role(){

    const s=
      $('.screen[data-screen="15"]');

    if(!s)return;

    const button=
      $('#u11SuggestedAnswer',s);

    const panel=
      $('#u11SuggestedPanel',s);

    if(!button)return;

    if(isStudent()){

      button.style.display='none';

      panel?.classList.remove(
        'show'
      );

    }else{

      button.style.display='';
    }
  }


  /* =======================================================
     ROLE RULES
     Hide legacy teacher controls from Student.
     ======================================================= */

  function applyRoleRules(){

    /*
      S9 old per-item teacher checks
      are not needed anymore.
    */

    $$(
      '.screen[data-screen="9"] .item-check'
    ).forEach(
      x=>x.style.display='none'
    );

    /*
      Old Hide answers / Reset controls on S10/S11
      are teacher-era legacy controls.
      Use the standard bottom Check / Reset instead.
    */

    $$(
      '.screen[data-screen="10"] .mini-controls,'+
      '.screen[data-screen="11"] .mini-controls'
    ).forEach(
      x=>x.style.display='none'
    );

    applySlide15Role();
  }


  /* =======================================================
     AUDIT / REPAIR TEACHER TOOL BUTTONS
     ======================================================= */

  function auditTeacherTools(){

    const tools=[
      ['u11Timer','Timer'],
      ['u11Responses','Responses'],
      ['u11Lucky','Lucky No.'],
      ['u11Reveal','Reveal next']
    ];

    tools.forEach(
      ([id,label])=>{

        const b=$(`#${id}`);

        if(!b){
          console.warn(
            `E-LEAP U1.1: ${label} control missing`
          );
        }
      }
    );

    /*
      Student must never see teacher toolbar.
    */

    const toolbar=
      $('.u11-teacher-tools');

    if(toolbar){

      toolbar.setAttribute(
        'aria-label',
        'Teacher controls'
      );
    }
  }


  /* =======================================================
     RE-APPLY AFTER MODE / SCREEN CHANGE
     ======================================================= */

  function applyFixes(){

    fixSlide3();
    fixSlide8();

    fixSlide9Step1();

    convertInlineAnswers(10);
    convertInlineAnswers(11);

    applyRoleRules();

    auditTeacherTools();
  }


  const bodyObserver=
    new MutationObserver(
      ()=>{

        setTimeout(
          applyFixes,
          0
        );
      }
    );

  bodyObserver.observe(
    document.body,
    {
      attributes:true,
      attributeFilter:['class']
    }
  );


  $$('.screen')
    .forEach(
      s=>{

        new MutationObserver(
          ms=>{

            if(
              ms.some(
                m=>
                  m.type==='attributes' &&
                  m.attributeName==='class'
              )
            ){
              setTimeout(
                applyFixes,
                0
              );
            }
          }
        ).observe(
          s,
          {
            attributes:true,
            attributeFilter:['class']
          }
        );
      }
    );


  /* Initial correction */

  setTimeout(
    applyFixes,
    30
  );

})();
