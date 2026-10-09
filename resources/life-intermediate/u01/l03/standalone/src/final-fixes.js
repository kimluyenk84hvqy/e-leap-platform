(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const status=()=>$('#status');
const answerMap={
  3:'Example: I had a bad cold last month. I had a sore throat and a cough, so I rested, drank plenty of water and took some medicine.',
  5:'Students’ own answers. Possible forms include a school registration form, job application form, passport form or visa application form.',
  6:['medical form','visa application form'],
  7:['marital status','current medications','no. of dependents','country of origin','place of birth','contact details of person in case of emergency','middle initial'],
  8:['date of birth','number','for example','et cetera','title used before a man’s name','title used before a married woman’s name','title used before a woman’s name when marital status is unknown','doctor','capital letters','lower-case letters','first letter of your middle name'],
  9:'Useful questions include: What’s your full name? Where were you born? What’s your nationality? Who can we contact in an emergency?',
  12:'Possible answers: People go to parks because they are free, healthy, relaxing and good places to exercise, meet friends or enjoy nature.',
  13:['d','b','e','a','f','c'],
  14:['2','1','5','3','4','6','7'],
  15:[
    ['very often · every weekend after lunchtime','dogs for Jasmine · beautiful trees'],
    ['every day · on sunny days at lunch break','high up · beautiful view'],
    ['when in the area','family memories · different seasons'],
    ['every day','walk through the park · spend time with friends'],
    ['about twice a week','jogging · exercise · quiet park'],
    ['quite often','wild flowers · blossom · plants']
  ],
  16:'Students’ own answers. Ask: When do you come to the park? How often do you come? Then guess the person.',
  17:'Students’ own answers. Include who the person is and why that person is a role model.',
  18:'Students’ own reflection.',
  19:'Students’ own writing. A strong response identifies the person, gives relevant personal details and clearly explains why the writer admires them.'
};

function put(el,value){if(!el)return;el.value=String(value??'');el.classList.add('note-answer');el.dispatchEvent(new Event('input',{bubbles:true}));}
function revealInPlace(){
  const screen=Number(document.body.dataset.screen||0),content=$('#content');
  if(!content)return;
  const model=answerMap[screen];
  if(model==null){const s=status();if(s)s.textContent='No fixed answer for this screen.';return;}
  if(screen===6){$$('input[data-answer-index]',content).forEach((el,i)=>put(el,model[i]));}
  else if(screen===7||screen===13||screen===14){$$('input[data-answer-index]',content).forEach((el,i)=>put(el,model[i]));}
  else if(screen===8){$$('input[data-language-index]',content).forEach(el=>put(el,model[Number(el.dataset.languageIndex)]));}
  else if(screen===15){$$('.note-row',content).forEach((row,i)=>{$$('input',row).forEach((el,j)=>put(el,model[i]?.[j]||''));row.classList.add('evidence-on');});}
  else {
    const target=$('textarea.student-answer, input.student-answer',content);
    if(target)put(target,model);
  }
  const s=status();if(s)s.textContent='Answer shown in the original response box.';
}

function enhanceFormElicitation(){
  if(Number(document.body.dataset.screen)!==6)return;
  const content=$('#content');if(!content||$('#formElicitation',content))return;
  const submit=$('#submit',content),inputs=$$('input[data-answer-index]',content);
  if(!submit||inputs.length<2)return;
  const panel=document.createElement('div');
  panel.id='formElicitation';panel.className='card';panel.style.marginTop='16px';panel.hidden=true;
  panel.innerHTML='<h3>Discuss after naming the forms</h3><div class="question-list"><div class="question"><b>1.</b> Have you ever filled in a form like this?</div><div class="question"><b>2.</b> What information did you have to give?</div></div>';
  submit.parentElement?.after(panel);
  const update=()=>{panel.hidden=!inputs.every(x=>String(x.value||'').trim());};
  inputs.forEach(x=>x.addEventListener('input',update));
  submit.addEventListener('click',()=>{update();if(!panel.hidden)panel.scrollIntoView({behavior:'smooth',block:'nearest'});});
  update();
}

function hardenMedia(){
  $$('video').forEach(v=>{
    if(v.dataset.finalMediaFix)return;v.dataset.finalMediaFix='1';v.preload='metadata';v.playsInline=true;
    v.addEventListener('error',()=>{
      const wrap=v.closest('.video-frame')||v.parentElement;
      if(wrap&&!$('.media-error',wrap)){
        const p=document.createElement('p');p.className='media-error';p.style.cssText='padding:12px;color:#fff;background:#6b2b2b;margin:0';p.textContent='Video source is not available yet. Teacher can continue with the task while the media file reconnects.';wrap.append(p);
      }
    });
  });
  $$('audio').forEach(a=>{if(a.dataset.finalMediaFix)return;a.dataset.finalMediaFix='1';a.preload='metadata';});
}

const show=$('#showAnswerBtn');
if(show)show.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();revealInPlace();},true);

const observer=new MutationObserver(()=>{enhanceFormElicitation();hardenMedia();});
observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('load',()=>{enhanceFormElicitation();hardenMedia();});
})();
