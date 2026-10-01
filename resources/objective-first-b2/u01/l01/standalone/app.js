
const screens=[...document.querySelectorAll('.screen')];
let current=0;
const prev=document.getElementById('prevBtn'), next=document.getElementById('nextBtn');
const counter=document.getElementById('counter'), bar=document.getElementById('progressBar');
function stopMedia(){document.querySelectorAll('audio,video').forEach(m=>m.pause())}
function showScreen(i){
  stopMedia(); current=Math.max(0,Math.min(screens.length-1,i));
  screens.forEach((s,idx)=>s.classList.toggle('active',idx===current));
  counter.textContent=`${current+1} / ${screens.length}`;
  bar.style.width=`${((current+1)/screens.length)*100}%`;
  prev.disabled=current===0; next.disabled=current===screens.length-1;
}
prev.onclick=()=>showScreen(current-1); next.onclick=()=>showScreen(current+1);
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')showScreen(current+1);if(e.key==='ArrowLeft')showScreen(current-1)});

// Poll
document.querySelectorAll('.poll-btn').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.poll-btn').forEach(x=>x.classList.remove('selected'));
  b.classList.add('selected');
  document.getElementById('pollResult').textContent=`Selected: ${b.textContent}. Ask 1–2 students to explain why.`;
});

// Timer
let timerId=null;
document.getElementById('thinkTimer').onclick=()=>{
  clearInterval(timerId); let t=20; const d=document.getElementById('timerDisplay'); d.textContent=t;
  timerId=setInterval(()=>{t--;d.textContent=t;if(t<=0){clearInterval(timerId);d.textContent='Go!'}},1000);
};

// Support toggles
document.querySelectorAll('.support-toggle').forEach(b=>b.onclick=()=>{
  b.nextElementSibling.classList.toggle('hidden');
});

// Speaking strategy layered reveal
document.querySelectorAll('.layer-card').forEach(card=>card.onclick=()=>{
  if(!card.dataset.step){card.dataset.step="1";card.textContent=card.dataset.layerTitle;card.classList.add('revealed')}
  else if(card.dataset.step==="1"){card.dataset.step="2";card.innerHTML=`<b>${card.dataset.layerTitle}</b><br><span style="font-size:18px;font-weight:600">${card.dataset.layerSupport}</span>`}
});

// Vocabulary
const vocab={
 clothes:['T-shirts','jeans','hoodies','skirts','dresses','blazers','suits','jackets','sweaters','shorts','uniforms'],
 footwear:['sneakers','trainers','sandals','high heels','boots','flip-flops'],
 jewellery:['earrings','necklaces','bracelets','rings','watches'],
 headgear:['caps','hats','beanies','helmets','scarves','headbands'],
 materials:['cotton','wool','leather','silk','denim','linen','polyester'],
 appearance:['casual','smart','elegant','trendy','sporty','neat','fashionable']
};
function loadVocab(key){document.getElementById('vocabPanel').innerHTML=vocab[key].map(x=>`<span>${x}</span>`).join('')}
loadVocab('clothes');
document.querySelectorAll('#vocabTabs .tab').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('#vocabTabs .tab').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');loadVocab(btn.dataset.tab);
});

// Hotspots
document.querySelectorAll('.hotspot').forEach(b=>b.onclick=()=>document.getElementById('hotspotInfo').textContent=b.dataset.hotspot);

// Local answer reveals
document.querySelectorAll('.blank-reveal,.inline-blank').forEach(b=>b.onclick=()=>{
  if(!b.classList.contains('revealed')){b.textContent=b.dataset.answer;b.classList.add('revealed')}
});

// Confidence
document.querySelectorAll('.confidence button').forEach(b=>b.onclick=()=>{
  b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');
});

// Transcript tabs and clickable phrasal verbs
const speakers={
2:`I started working this year, so I’m able to get new clothes more regularly than before, when I had to <span class="phrasal-click" data-meaning="save money for something in the future">save up</span> for months. My mum thinks I should <span class="phrasal-click" data-meaning="reduce">cut down</span> the amount I spend on clothes. I don’t like to <span class="phrasal-click" data-meaning="go somewhere for entertainment / social activity">go out</span> in the same thing again. I always <span class="phrasal-click" data-meaning="wear smarter or special clothes than usual">dress up</span> when I go clubbing and try to <span class="phrasal-click" data-meaning="stay informed about something that changes quickly">keep up with</span> the latest fashions.`,
3:`Shopping for clothes isn’t really my scene. I favour the casual look. I’ve got one favourite T-shirt, which a girlfriend gave me so I would always <span class="phrasal-click" data-meaning="be easy to see or notice">stand out</span> in a crowd.`,
4:`My clothes have to be comfortable. I <span class="phrasal-click" data-meaning="put something on quickly">slip them on</span> and often <span class="phrasal-click" data-meaning="create something by combining different things">put together</span> outfits from things I find in street markets.`,
5:`I have to make an effort to look good all the time. If I see something by chance, I’m likely to <span class="phrasal-click" data-meaning="choose / decide to take">go for</span> it. I did <span class="phrasal-click" data-meaning="return something">take back</span> a jacket last week because it was badly made.`
};
function loadSpeaker(n){
 const box=document.getElementById('speakerText');box.innerHTML=speakers[n];
 box.querySelectorAll('.phrasal-click').forEach(x=>x.onclick=()=>document.getElementById('meaningBox').textContent=`${x.textContent} = ${x.dataset.meaning}`);
}
loadSpeaker(2);
document.querySelectorAll('#speakerTabs .tab').forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll('#speakerTabs .tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');loadSpeaker(btn.dataset.speaker);
});

// Hints and rules
document.querySelectorAll('.hint-btn').forEach(b=>b.onclick=()=>document.getElementById('hintBox').textContent=b.dataset.hint);
document.querySelectorAll('.rule-card').forEach(b=>b.onclick=()=>{
 const box=document.getElementById('ruleBox');box.textContent=b.dataset.rule;box.classList.remove('hidden');
});

// Challenges
document.querySelectorAll('.challenge-card').forEach(c=>c.onclick=()=>{
 if(!c.classList.contains('flipped')){c.textContent=c.dataset.back;c.classList.add('flipped')}
 else{c.textContent=c.dataset.front;c.classList.remove('flipped')}
});

showScreen(0);


// FINAL CANDIDATE: Ex7 Step 1 listening selection check
const ex7Btn=document.getElementById('checkEx7Listening');
if(ex7Btn){
  ex7Btn.addEventListener('click',()=>{
    const boxes=[...document.querySelectorAll('.candidate-grid input[type="checkbox"]')];
    let correct=0, totalCorrect=0;
    boxes.forEach(b=>{
      const should=b.dataset.correct==='true';
      if(should) totalCorrect++;
      if(b.checked===should) correct++;
      b.closest('label').style.borderColor = (b.checked===should) ? '#77ad98' : '#bf8e8e';
      b.closest('label').style.background = (b.checked===should) ? '#e8f3ee' : '#faeeee';
    });
    const perfect=correct===boxes.length;
    document.getElementById('ex7ListeningFeedback').textContent=
      perfect ? 'Correct. Now move to the matching task.' : 'Check your selection and listen again before matching.';
    document.getElementById('ex7ListeningFeedback').style.color=perfect?'#075c49':'#8a4d4d';
  });
}

// FINAL CANDIDATE: Ex7 real two-column matching
let selectedVerb=null;
document.querySelectorAll('.match-item').forEach(v=>v.addEventListener('click',()=>{
  document.querySelectorAll('.match-item').forEach(x=>x.classList.remove('selected'));
  selectedVerb=v;
  v.classList.add('selected');
  document.getElementById('matchStatus').textContent=`Selected: ${v.textContent}. Now choose a definition.`;
}));
document.querySelectorAll('.definition-item').forEach(d=>d.addEventListener('click',()=>{
  if(!selectedVerb){
    document.getElementById('matchStatus').textContent='Choose a phrasal verb first.';
    return;
  }
  d.classList.add('selected');
  const ok=selectedVerb.dataset.match===d.dataset.letter;
  if(ok){
    selectedVerb.classList.remove('selected'); d.classList.remove('selected');
    selectedVerb.classList.add('matched'); d.classList.add('matched');
    selectedVerb.disabled=true; d.disabled=true;
    document.getElementById('matchStatus').textContent='Correct match.';
    selectedVerb=null;
  }else{
    selectedVerb.classList.add('wrong'); d.classList.add('wrong');
    document.getElementById('matchStatus').textContent='Not quite. Try again.';
    setTimeout(()=>{
      selectedVerb?.classList.remove('wrong');
      d.classList.remove('wrong','selected');
    },700);
  }
}));
document.getElementById('resetMatch')?.addEventListener('click',()=>{
  selectedVerb=null;
  document.querySelectorAll('.match-item,.definition-item').forEach(x=>{
    x.disabled=false;
    x.classList.remove('selected','matched','wrong');
  });
  document.getElementById('matchStatus').textContent='Select a phrasal verb, then select its definition.';
});

// Hide / reset local inline answer controls
document.querySelectorAll('.hide-local').forEach(btn=>btn.addEventListener('click',()=>{
  const screen=btn.closest('.screen');
  screen.querySelectorAll('.inline-blank.revealed').forEach(b=>{
    b.textContent='__________';
    b.classList.remove('revealed');
  });
}));
document.querySelectorAll('.reset-local').forEach(btn=>btn.addEventListener('click',()=>{
  const screen=btn.closest('.screen');
  screen.querySelectorAll('.inline-blank').forEach(b=>{
    b.textContent='__________';
    b.classList.remove('revealed');
  });
}));


// FINAL: Guided Discovery - each question reveals only its own answer
document.querySelectorAll('.discovery-card').forEach(card=>{
  card.addEventListener('click',()=>{
    if(card.classList.contains('revealed')) return;
    const answer=card.dataset.answer;
    card.innerHTML=answer;
    card.classList.add('revealed');
  });
});

// FINAL: Exercise 7 Step 1 - check one listening item at a time
document.querySelectorAll('.item-check').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const heard=btn.dataset.heard==='yes';
    btn.textContent=heard ? 'HEARD' : 'NOT HEARD';
    btn.classList.add(heard ? 'heard' : 'not-heard');
  });
});
