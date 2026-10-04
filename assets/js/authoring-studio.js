import {ELeapRuntimeContext} from './runtime-context.js';

const root=document.getElementById('studio');
const ctx=new ELeapRuntimeContext();
const qs=new URLSearchParams(location.search);
const source=qs.get('source')||'../data/runtime-lab-lesson.json';
const draftKey=`e-leap-studio-draft:${source}`;
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
let lesson=null; let selected=0; let dirty=false;

if(!ctx.can('content:edit')){
  root.innerHTML=`<section class="studio-denied"><div class="studio-kicker">E-LEAP Studio</div><h1>Editing access required</h1><p>This authoring workspace is available to Admins and Teachers with the Content Edit grant.</p><p class="studio-note">The lesson runtime remains available for teaching and preview.</p><a href="javascript:history.back()">← Back</a></section>`;
}else{
  const saved=localStorage.getItem(draftKey);
  if(saved){try{lesson=JSON.parse(saved)}catch{}}
  if(!lesson){const r=await fetch(source,{cache:'no-store'}); if(!r.ok)throw new Error('Source lesson not found'); lesson=await r.json();}
  render();
}

function save(){localStorage.setItem(draftKey,JSON.stringify(lesson));dirty=false;renderStatus('Draft saved locally');}
function renderStatus(msg){const el=document.querySelector('[data-studio-status]');if(el)el.textContent=msg;}
function render(){
  const s=lesson.screens[selected];
  root.innerHTML=`<section class="studio-shell"><header class="studio-head"><div><div class="studio-kicker">E-LEAP Studio · Authoring Foundation</div><h1>${esc(lesson.title)}</h1><div class="studio-status" data-studio-status>${dirty?'Unsaved changes':'Draft ready'}</div></div><div class="studio-actions"><a href="../engine/runtime-lab.html">Preview runtime</a><button data-save>Save draft</button><button class="primary" data-publish>${ctx.can('content:publish')?'Publish candidate':'Request publish'}</button></div></header><div class="studio-banner">Structured authoring foundation: edit content and activity data here; layout and role behavior remain controlled by the shared runtime.</div><div class="studio-grid"><aside class="studio-nav">${lesson.screens.map((x,i)=>`<button data-screen="${i}" class="${i===selected?'active':''}">${String(i+1).padStart(2,'0')} · ${esc(x.stage||x.title||'Screen')}</button>`).join('')}<div class="screen-actions"><button data-add-screen>+ Add screen</button></div></aside><section class="studio-editor"><div class="studio-card"><h2>Lesson</h2>${field('Lesson title','lesson-title',lesson.title)}${field('Course label','course-label',lesson.courseLabel||'')}${field('Lesson number','lesson-number',lesson.lessonNumber||'')}</div><div class="studio-card"><h2>Screen ${selected+1}</h2>${field('Stage','stage',s.stage||'')}${field('Screen title','screen-title',s.title||'')}${area('Instruction','instruction',s.instruction||'')}${selectField('Activity type','activity-type',s.activity?.type||'mcq',['mcq','true-false','multi-select','fill','writing','click-reveal','flashcards'])}${area('Prompt','prompt',s.activity?.prompt||'')}${answerEditor(s)}<div class="screen-actions"><button data-up ${selected===0?'disabled':''}>Move up</button><button data-down ${selected===lesson.screens.length-1?'disabled':''}>Move down</button><button data-duplicate>Duplicate</button><button class="danger" data-delete ${lesson.screens.length===1?'disabled':''}>Remove</button></div></div></section></div></section>`;
  wire();
}
function field(label,id,val){return `<div class="studio-field"><label for="${id}">${label}</label><input id="${id}" data-field="${id}" value="${esc(val)}"></div>`}
function area(label,id,val){return `<div class="studio-field"><label for="${id}">${label}</label><textarea id="${id}" data-field="${id}" rows="4">${esc(val)}</textarea></div>`}
function selectField(label,id,val,opts){return `<div class="studio-field"><label for="${id}">${label}</label><select id="${id}" data-field="${id}">${opts.map(o=>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`}
function answerEditor(s){const a=s.activity||{};if(['mcq','true-false','multi-select'].includes(a.type)){return `${area('Options (one per line: ID | Label)','options',(a.options||[]).map(o=>`${o.id||o.value||''} | ${o.label||o.value||''}`).join('\n'))}${field('Answer key (IDs, comma separated)','answer-key',(a.answerKey||[]).join(', '))}`;}if(['writing','fill'].includes(a.type))return area('Model answer','model-answer',a.modelAnswer||'');if(['click-reveal','flashcards'].includes(a.type))return area('Reveal items (Question | Answer)','reveal-items',(a.items||[]).map(x=>`${x.question||x.front||''} | ${x.answer||x.back||''}`).join('\n'));return ''}
function wire(){
  root.querySelectorAll('[data-screen]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.screen);render()});
  root.querySelector('[data-save]').onclick=save;
  root.querySelector('[data-publish]').onclick=()=>renderStatus(ctx.can('content:publish')?'Publish candidate staged for server workflow':'Publish request staged for review');
  root.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',()=>{apply(el.dataset.field,el.value);dirty=true;renderStatus('Unsaved changes')}));
  root.querySelector('[data-add-screen]').onclick=()=>{lesson.screens.push({id:`screen-${Date.now()}`,stage:'New screen',title:'New screen',instruction:'',activity:{id:`activity-${Date.now()}`,type:'mcq',prompt:'',options:[{id:'A',label:'Option A'},{id:'B',label:'Option B'}],answerKey:['A'],policy:{studentReveal:false}}});selected=lesson.screens.length-1;dirty=true;render()};
  root.querySelector('[data-duplicate]').onclick=()=>{const copy=structuredClone(lesson.screens[selected]);copy.id=`${copy.id||'screen'}-copy-${Date.now()}`;if(copy.activity)copy.activity.id=`${copy.activity.id||'activity'}-copy-${Date.now()}`;lesson.screens.splice(selected+1,0,copy);selected++;dirty=true;render()};
  root.querySelector('[data-delete]').onclick=()=>{if(lesson.screens.length<=1)return;lesson.screens.splice(selected,1);selected=Math.max(0,selected-1);dirty=true;render()};
  root.querySelector('[data-up]').onclick=()=>{if(selected<=0)return;[lesson.screens[selected-1],lesson.screens[selected]]=[lesson.screens[selected],lesson.screens[selected-1]];selected--;dirty=true;render()};
  root.querySelector('[data-down]').onclick=()=>{if(selected>=lesson.screens.length-1)return;[lesson.screens[selected+1],lesson.screens[selected]]=[lesson.screens[selected],lesson.screens[selected+1]];selected++;dirty=true;render()};
}
function apply(k,v){const s=lesson.screens[selected],a=s.activity||(s.activity={});
  if(k==='lesson-title')lesson.title=v; else if(k==='course-label')lesson.courseLabel=v; else if(k==='lesson-number')lesson.lessonNumber=v; else if(k==='stage')s.stage=v; else if(k==='screen-title')s.title=v; else if(k==='instruction')s.instruction=v; else if(k==='prompt')a.prompt=v; else if(k==='activity-type'){a.type=v;normalizeActivity(a,v);render();} else if(k==='answer-key')a.answerKey=v.split(',').map(x=>x.trim()).filter(Boolean); else if(k==='model-answer')a.modelAnswer=v; else if(k==='options')a.options=v.split('\n').map(line=>{const [id,...rest]=line.split('|');return {id:(id||'').trim(),label:rest.join('|').trim()||String(id||'').trim()}}).filter(x=>x.id); else if(k==='reveal-items')a.items=v.split('\n').map(line=>{const [q,...rest]=line.split('|');return {question:(q||'').trim(),answer:rest.join('|').trim()}}).filter(x=>x.question);
}
function normalizeActivity(a,t){a.policy=a.policy||{studentReveal:false};if(['mcq','true-false','multi-select'].includes(t)){a.options=a.options?.length?a.options:[{id:'A',label:'Option A'},{id:'B',label:'Option B'}];a.answerKey=a.answerKey?.length?a.answerKey:['A'];}if(['writing','fill'].includes(t))a.modelAnswer=a.modelAnswer||'';if(['click-reveal','flashcards'].includes(t))a.items=a.items?.length?a.items:[{question:'Question',answer:'Answer'}];}
