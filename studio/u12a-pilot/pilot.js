import { ELeapRuntimeContext } from '/assets/js/runtime-context.js';
import { act4, buildLesson, passage, reports, sourceHash } from './data.js';

const root = document.querySelector('#pilot');
const ctx = new ELeapRuntimeContext();
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[char]);
const configuration = {warmup:'picture',leadIn:'picture',reading:'jigsaw'};
const answers = new Map();
const revealed = new Set();
const checked = new Set();
const explanations = new Map();
let lesson = buildLesson(configuration);
let current = 'cover';
let selectedPart = 0;
let evidenceText = '';
let timer = null;
let presenting = false;
let verified = false;

if (!ctx.can('content:edit') || !ctx.can('teacher:reveal')) {
  const next = encodeURIComponent(location.pathname);
  root.innerHTML = `<h1>Editing access required</h1><p>Sign in as an Admin or Teacher with Content Edit permission.</p><a href="/signin.html?next=${next}">Sign in</a>`;
} else {
  render();
}

function evidenceMarkup(text) {
  const index = evidenceText ? text.indexOf(evidenceText) : -1;
  if(index < 0) return escape(text);
  return escape(text.slice(0,index)) + '<mark>' + escape(evidenceText) + '</mark>' + escape(text.slice(index+evidenceText.length));
}

function render() {
  clearInterval(timer);
  const step = lesson.find(s => s.id === current);
  const index = lesson.indexOf(step);
  const passageScroll = root.querySelector('.passage')?.scrollTop ?? 0;
  const workScroll = root.querySelector('.reading-work')?.scrollTop ?? 0;
  const audio = root.querySelector('audio');
  const audioTime = audio?.currentTime ?? 0;
  const audioLoop = audio?.loop ?? false;
  const audioSrc = audio?.getAttribute('src');
  const media = step.image ? `<img class="lesson-image" src="${escape(step.image)}" alt="${escape(step.title)} illustration">` : '';
  const task = `<div class="${step.reading?'reading-work':''}">
    ${step.audio ? `<audio controls preload="none" src="${escape(step.audio)}"></audio>${step.id==='act9'?'<label><input id="loop" type="checkbox"> Loop audio</label>':''}` : ''}
    ${step.notes ? `<div class="note-grid">${step.notes.map(([heading,...lines])=>`<section class="card"><h2>${escape(heading)}</h2>${lines.map(line=>`<p>${escape(line)}</p>`).join('')}</section>`).join('')}</div>` : ''}
    ${step.report ? renderReport(step) : ''}
    ${(step.items??[]).map((item,i)=>renderItem(step,item,i)).join('')}
  </div>`;
  root.innerHTML = `
    ${presenting?'':`<details class="panel" open><summary>Build this lesson</summary><div class="setup">
      <label>Life source PDF<input id="source" type="file" accept="application/pdf,.pdf"></label>
      <label>Warm-up<select id="warmup"><option value="picture">Picture Detective</option><option value="hot-seat">Hot Seat</option><option value="mime">Mime and Guess</option></select></label>
      <label>Lead-in<select id="lead-in"><option value="picture">Picture and predict</option><option value="audio">Predict and listen</option></select></label>
      <label>Reading<select id="reading"><option value="jigsaw">Jigsaw Reading</option><option value="scan">Skim–Scan–Justify</option></select></label>
      <button type="button" class="primary" data-action="build">Apply combos</button>
      <p id="source-status" role="status">${verified?'PDF verified · Life pp. 141–145':'Source ready · Life pp. 141–145. Select the original PDF to verify it.'}</p>
    </div></details>
    <nav class="nav" aria-label="Lesson steps">${lesson.map((s,i)=>`<button type="button" data-step="${s.id}" aria-pressed="${s===step}">${i+1}. ${escape(s.title)}</button>`).join('')}</nav>`}
    <div class="toolbar">
      <div class="action-row"><button data-action="prev" ${index===0?'disabled':''}>Previous</button>
      <button data-action="next" ${index===lesson.length-1?'disabled':''}>Next</button><span>${index+1} / ${lesson.length}</span></div>
      <div class="action-row">${!presenting&&step.timer?`<button data-action="timer">Timer</button><output id="time">${step.timer}s</output>`:''}
      ${!presenting&&step.items?.length&&!step.open?'<button data-action="check">Check</button>':''}
      ${(step.items?.length||step.report)?'<button data-action="reset">Reset</button>':''}
      <button data-action="presentation">${presenting?'Exit Presentation':'Presentation'}</button></div>
    </div>
    <h1>${escape(step.title)}</h1><p class="instruction">${escape(step.instruction)}</p>
    ${step.reading?`<div class="split"><article class="passage" tabindex="0" aria-label="What if article">
      ${passage.map((part,i)=>`<section id="part-${i}"><b>Part ${i+1}</b><p>${evidenceMarkup(part)}</p></section>`).join('')}
    </article>${task}</div>`:media&& !step.hero?`<div class="with-image">${media}${task}</div>`:media+task}
  `;
  if(!presenting){
    root.querySelector('#warmup').value=configuration.warmup;
    root.querySelector('#reading').value=configuration.reading;
    root.querySelector('#lead-in').value=configuration.leadIn;
  }
  const newAudio = root.querySelector('audio');
  if(newAudio && newAudio.getAttribute('src')===audioSrc){
    newAudio.currentTime=audioTime;
    newAudio.loop=audioLoop;
    const loop=root.querySelector('#loop');
    if(loop) loop.checked=audioLoop;
  }
  const pane = root.querySelector('.passage');
  if(pane) pane.scrollTop=passageScroll;
  const work = root.querySelector('.reading-work');
  if(work) work.scrollTop=workScroll;
}

function renderReport(step) {
  const list=step.report==='return'?reports:[reports[selectedPart]];
  return `${step.report==='return'?'':`<div class="action-row">${reports.map((_,i)=>`<button data-part="${i}" aria-pressed="${i===selectedPart}">Part ${i+1}</button>`).join('')}</div>`}
  ${list.map(([title,prompt,frame,key,evidence],i)=>{
    const id='report-'+(step.report==='return'?i:selectedPart);
    return `<section class="card"><h2>${escape(title)}</h2><p class="prompt">${escape(prompt)}</p><p>${escape(frame)}</p>
      <textarea data-answer="${id}" aria-label="Report notes">${escape(answers.get(id))}</textarea>
      ${revealed.has(id)?`<div class="key">Model response · ${escape(key)}</div>`:''}
      <div class="action-row"><button data-report-key="${id}">Show answer</button><button data-report-evidence="${escape(evidence)}">Evidence</button><button data-report-why="${id}">Why</button></div>
      ${explanations.has(id)?'<p>The report uses the passage to answer the guiding questions for this part.</p>':''}</section>`;
  }).join('')}`;
}

function renderItem(step,item,i) {
  const id=step.id+'-'+i;
  const selected=answers.get(id);
  const shown=revealed.has(id);
  const open=step.open;
  const normalise=value=>String(value??'').toLowerCase().trim().replace(/[’‘]/g,"'").replace(/[.!?]+$/,'').replace(/\s*\/\s*/g,' / ');
  const feedback=checked.has(step.id)&&!open
    ? selected ? (normalise(selected)===normalise(item.key)?'Matches the key':'Compare your response with the key') : 'No response yet'
    : '';
  return `<section class="card"><label class="prompt" id="label-${id}" for="answer-${id}">${i+1}. ${escape(item.prompt)}</label>
    <div class="answer-slot" aria-labelledby="label-${id}">
      ${item.options.length?`<div class="options">${item.options.map(option=>`<button data-answer-option="${id}" data-value="${escape(option)}" aria-pressed="${selected===option}" class="${shown&&option===item.key?'key':''}">${escape(option)}${shown&&option===item.key?' ✓':''}</button>`).join('')}</div>`:
      shown?`<div class="key">${open?'Model response':'Key'} · ${escape(item.key)}</div>`:`<textarea id="answer-${id}" data-answer="${id}">${escape(selected)}</textarea>`}
      ${shown&&selected?`<small>Your answer · ${escape(selected)}</small>`:''}
    </div>
    ${feedback?`<p role="status">${feedback}</p>`:''}
    <div class="action-row"><button data-key="${id}">${shown?'Hide answer':'Show answer'}</button><button data-evidence="${id}">Evidence</button><button data-why="${id}">Why</button></div>
    ${explanations.has(id)?`<p><b>${explanations.get(id)==='why'?'Why':'Evidence'}</b> · ${escape(explanations.get(id)==='why'?item.why:item.evidence)}</p>`:''}
  </section>`;
}

function go(id) {
  current=id;
  evidenceText='';
  render();
  window.scrollTo({top:0});
}

function toggle(set,key){ if(set.has(key)) set.delete(key); else set.add(key); }
function focusEvidence(text){
  evidenceText=text;
  render();
  const mark=root.querySelector('.passage mark');
  if(mark) mark.scrollIntoView({block:'nearest'});
}

root.addEventListener('input',event=>{
  if(event.target.dataset.answer) answers.set(event.target.dataset.answer,event.target.value);
});

root.addEventListener('change',async event=>{
  if(event.target.id==='loop') root.querySelector('audio').loop=event.target.checked;
  if(event.target.id!=='source') return;
  const file=event.target.files[0];
  if(!file) return;
  const status=root.querySelector('#source-status');
  try {
    if(file.size>8_000_000) throw Error('Select the original Life pp. 141–145 PDF (under 8 MB).');
    const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
    verified=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')===sourceHash;
    status.textContent=verified?'PDF verified · Life pp. 141–145. Apply your combo choices.':'This pilot recognises the original Life pp. 141–145 PDF only.';
  } catch(error){verified=false;status.textContent=error.message;}
});

root.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button) return;
  const d=button.dataset;
  const step=lesson.find(s=>s.id===current);
  const index=lesson.indexOf(step);
  if(d.step) return go(d.step);
  if(d.action==='prev'&&index>0) return go(lesson[index-1].id);
  if(d.action==='next'&&index<lesson.length-1) return go(lesson[index+1].id);
  if(d.action==='presentation'){presenting=!presenting;return render();}
  if(d.action==='check'){checked.add(current);return render();}
  if(d.action==='reset'){
    checked.delete(current);
    const isCurrent=id=>id.startsWith(current+'-')||(step.report&&id.startsWith('report-'));
    for(const id of [...answers.keys()]) if(isCurrent(id)) answers.delete(id);
    for(const id of [...revealed]) if(isCurrent(id)) revealed.delete(id);
    for(const id of [...explanations.keys()]) if(isCurrent(id)) explanations.delete(id);
    evidenceText='';
    return render();
  }
  if(d.action==='build'){
    configuration.warmup=root.querySelector('#warmup').value;
    configuration.reading=root.querySelector('#reading').value;
    configuration.leadIn=root.querySelector('#lead-in').value;
    for(const id of [...answers.keys()]) if(id.startsWith('warm-up-')||id.startsWith('lead-in-')) answers.delete(id);
    for(const id of [...revealed]) if(id.startsWith('warm-up-')||id.startsWith('lead-in-')) revealed.delete(id);
    for(const id of [...explanations.keys()]) if(id.startsWith('warm-up-')||id.startsWith('lead-in-')) explanations.delete(id);
    checked.delete('warm-up');
    checked.delete('lead-in');
    lesson=buildLesson(configuration);
    return go(lesson.some(s=>s.id===current)?current:'act3');
  }
  if(d.action==='timer'){
    clearInterval(timer);
    let remaining=step.timer;
    const output=root.querySelector('#time');
    output.textContent=remaining+'s';
    timer=setInterval(()=>{output.textContent=--remaining+'s';if(!remaining)clearInterval(timer);},1000);
    return;
  }
  if(d.part!==undefined){
    selectedPart=Number(d.part);
    evidenceText='';
    render();
    document.getElementById('part-'+selectedPart)?.scrollIntoView({block:'nearest'});
    return;
  }
  if(d.answerOption){answers.set(d.answerOption,d.value);return render();}
  if(d.key||d.reportKey){toggle(revealed,d.key||d.reportKey);return render();}
  if(d.reportEvidence)return focusEvidence(d.reportEvidence);
  if(d.reportWhy){if(explanations.has(d.reportWhy))explanations.delete(d.reportWhy);else explanations.set(d.reportWhy,'why');return render();}
  if(d.why){explanations.set(d.why,'why');return render();}
  if(d.evidence){
    explanations.set(d.evidence,'evidence');
    const item=step.items[Number(d.evidence.split('-').at(-1))];
    return focusEvidence(item.evidence);
  }
});
