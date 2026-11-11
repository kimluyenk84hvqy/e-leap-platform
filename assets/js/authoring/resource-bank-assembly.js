/* E-LEAP Resource Bank -> Teaching Combo -> Smart Assembly (Preview).
   Media stays in browser IndexedDB. No server upload, no guest/student access to keys.
   Import is a draft; publish remains blocked by the existing quality gate.
 */
import {METHOD_COMBOS} from './method-combo-catalog.js';
const html=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
const asId=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,70);
const mediaUrls=new Map(),ui={answers:new Map(),reveals:new Set(),whys:new Set(),checks:new Map(),phase:new Map(),focus:new Map(),score:null};
const dbName='eleap-resource-bank-local-v1';
const assetKey=(pack,id)=>pack.id+':'+id;
function openDb(){return new Promise((resolve,reject)=>{
 if(!indexedDB)return reject(Error('Browser IndexedDB unavailable'));
 const req=indexedDB.open(dbName,1);
 req.onupgradeneeded=()=>req.result.createObjectStore('assets');
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
async function storeAssets(pack,zip){
 const db=await openDb();let saved=0;
 for(const [id,asset] of Object.entries(pack.assets||{})){
  if(!/^media\/[a-z0-9._-]+$/i.test(asset.path))throw Error('Unsafe asset path: '+asset.path);
  const file=zip.file(asset.path);if(!file)throw Error('Missing asset: '+asset.path);
  const blob=new Blob([await file.async('uint8array')],{type:asset.kind==='audio'?'audio/mpeg':'image/png'});
  await new Promise((resolve,reject)=>{const t=db.transaction('assets','readwrite'),req=t.objectStore('assets').put(blob,assetKey(pack,id));t.oncomplete=resolve;t.onerror=()=>reject(t.error);});
  const key=assetKey(pack,id);if(mediaUrls.has(key))URL.revokeObjectURL(mediaUrls.get(key));
  mediaUrls.set(key,URL.createObjectURL(blob));saved++;
 }
 db.close();return saved;
}
export async function rehydrateResourceBank(pack){
 if(!pack?.id)return 0;
 const db=await openDb();let loaded=0;
 for(const id of Object.keys(pack.assets||{})){
  const key=assetKey(pack,id);if(mediaUrls.has(key)){loaded++;continue}
  const blob=await new Promise((resolve,reject)=>{const t=db.transaction('assets','readonly'),q=t.objectStore('assets').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
  if(blob){mediaUrls.set(key,URL.createObjectURL(blob));loaded++;}
 }
 db.close();return loaded;
}
function validatePack(pack){
 if(pack?.schema!=='eleap-resource-pack-v1'||!pack.id||!Array.isArray(pack.screens)||!pack.screens.length)throw Error('Not an E-LEAP Resource Pack v1.');
 if(pack.screens.length>80)throw Error('Too many screens for one lesson.');
 if(!pack.assets||Object.keys(pack.assets).length>240)throw Error('Invalid media asset registry.');
 const ids=new Set();
 for(const screen of pack.screens){if(!/^[a-z0-9_-]{1,64}$/i.test(screen.id)||ids.has(screen.id))throw Error('Duplicate/invalid screen ID');ids.add(screen.id);
 if(!['cover','aims','gallery','crossword','peer','listening','discovery','practice','exit'].includes(screen.type))throw Error('Unknown slide type: '+screen.type);
 if(screen.combo&&!METHOD_COMBOS[screen.combo]&&!['institutional-cover','learning-outcomes','crossword-challenge','retrieval'].includes(screen.combo))throw Error('Unknown teaching combo '+screen.combo);
 if((screen.items||[]).length>80)throw Error('Activity exceeds per-slide limit.');
 }
 return pack;
}
export async function importResourceZip(file){
 if(!window.JSZip)throw Error('ZIP reader unavailable. Refresh with an internet connection or contact the administrator.');
 if(!file||file.size>90*1024*1024)throw Error('The ZIP must be under 90 MB.');
 const zip=await window.JSZip.loadAsync(file,{checkCRC32:true});
 const raw=zip.file('resource-pack.json');if(!raw)throw Error('resource-pack.json missing from ZIP');
 const pack=validatePack(JSON.parse(await raw.async('string')));
 await storeAssets(pack,zip);
 return pack;
}
export function resourceMediaUrl(pack,id){return mediaUrls.get(assetKey(pack,id))||'';}
export function createResourceScreens(pack){return pack.screens.map((x,i)=>({
 id:'resource-'+asId(pack.id)+'-'+asId(x.id),stage:x.type==='cover'?'Cover':x.type==='aims'?'Aims':x.type==='gallery'?'Introduction':x.type==='crossword'?'Crossword':x.type==='listening'?'Listening':x.type==='practice'?'Grammar Practice':'Learning',
 title:x.title||('Step '+(i+1)),instruction:x.instruction||'',layout:'standard',blocks:[],
 resourceStage:{packId:pack.id,screenId:x.id,comboId:x.combo,sourceStatus:pack.status||'review-required'}
}));}
function src(screen,pack){return pack?.screens?.find(x=>x.id===screen?.resourceStage?.screenId)||null}
const cls='rs';
const card=(title,body)=>'<section class="rs-panel"><h3>'+html(title)+'</h3>'+body+'</section>';
const media=(pack,id,alt='Source picture')=>{
 const url=resourceMediaUrl(pack,id);
 return url?'<img class="rs-image" src="'+html(url)+'" alt="'+html(alt)+'">':'<div class="rs-media-missing">Local image not loaded. Re-import the Resource ZIP.</div>';
};
function itemAnswerKey(screen,item){return screen.id+':'+item.id+(item.direction?':'+item.direction:'')}
function normAnswer(x){return String(x??'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase()}
function answerMatches(item,value){
 const keys=[item.answer,...(Array.isArray(item.acceptedAnswers)?item.acceptedAnswers:[])].filter(x=>x!==undefined&&x!==null);
 return keys.some(x=>normAnswer(x)===normAnswer(value));
}
function phraseWithGap(text,input){
 const t=String(text||''),m=/_{2,}|\[\s*\]|\(\s*\.\.\.\s*\)/.exec(t);
 if(!m)return '<span class="rs-question-text">'+html(t)+'</span><div class="rs-inline-gap">'+input+'</div>';
 return '<span class="rs-question-text">'+html(t.slice(0,m.index))+input+html(t.slice(m.index+m[0].length))+'</span>';
}
function questionItems(screen,source,role,{kind='practice'}={}){
 const canReveal=['teacher','admin','presentation'].includes(role);
 const canCheck=['teacher','admin','student','guest'].includes(role);
 const canEvidence=kind==='listening';
 const current=ui.focus.get(screen.id)||0,items=source.items||[],pageSize=canEvidence?3:4;
 const pages=Math.max(1,Math.ceil(items.length/pageSize)),page=Math.min(current,pages-1);
 const pageItems=items.slice(page*pageSize,(page+1)*pageSize);
 let nav='<nav class="rs-activity-nav" aria-label="Question groups"><span>Questions '+(page*pageSize+1)+'–'+Math.min(items.length,(page+1)*pageSize)+' of '+items.length+'</span>';
 for(let i=0;i<pages;i++)nav+='<button type="button" data-rs-action="page" data-rs-key="'+screen.id+'" data-rs-index="'+i+'" class="'+(i===page?'rs-current':'')+'">'+(i+1)+'</button>';
 nav+='</nav>';
 return nav+'<div class="rs-items">'+pageItems.map(item=>{
  const k=itemAnswerKey(screen,item),reveal=canReveal&&ui.reveals.has(k),val=ui.answers.get(k)||'',status=ui.checks.get(k);
  const confirmed=item.keyStatus?item.keyStatus==='VERIFIED':true;
  const answer=String(item.answer||''),scoreStatus=status===undefined?'':status?'✓ Correct':'Try again';
  const isInline=kind==='practice';
  const input='<input class="rs-answer '+(reveal?'rs-revealed':'')+'" data-rs-input="'+html(k)+'" value="'+html(reveal?answer:val)+'" '+(reveal?'readonly':'')+' aria-label="Answer '+html(item.id)+'" autocomplete="off">';
  const prompt=isInline?phraseWithGap(item.text||item.prompt,input):'<p class="rs-question-text">'+html(item.text||item.prompt)+'</p><div class="rs-answer-line">'+input+'</div>';
  const showWhy=ui.whys.has(k)&&canReveal&&confirmed;
  return '<article class="rs-item"><span class="rs-item-n">'+html(item.id)+'</span><div class="rs-item-main">'+prompt+'<div class="rs-status">'+scoreStatus+'</div><div class="rs-item-actions">'+
   (canCheck?'<button type="button" data-rs-action="check" data-rs-key="'+html(k)+'">Check</button>':'')+
   (canReveal?'<button type="button" data-rs-action="reveal" data-rs-key="'+html(k)+'">'+(reveal?'Hide answer':'Show answer')+'</button>':'')+
   '<button type="button" data-rs-action="reset" data-rs-key="'+html(k)+'">Reset</button>'+
   (canReveal&&confirmed?'<button type="button" data-rs-action="why" data-rs-key="'+html(k)+'">Why?</button>':'')+
   (canEvidence?'<button type="button" disabled title="Audio segment has not passed source verification.">Evidence · pending QA</button>':'')+
   '</div>'+(showWhy?'<p class="rs-why">'+html(item.why||'Explanation not yet approved.')+'</p>':'')+
   (!confirmed?'<small class="rs-unverified">Working answer key — awaiting source verification</small>':'')+
   '</div></article>';
 }).join('')+'</div>';
}
function crossword(screen,source,role){
 const canReveal=['teacher','admin','presentation'].includes(role),words=source.items||[];
 const chosen=Math.min(ui.focus.get(screen.id)||0,Math.max(0,words.length-1)),active=words[chosen]||null;
 if(!active)return '<p>No validated crossword entries.</p>';
 const occupied=new Map(),starts=new Map();let maxx=0,maxy=0;
 for(const w of words){const answer=String(w.answer||'').toUpperCase();
  for(let i=0;i<answer.length;i++){const x=Number(w.x||0)+(w.direction==='across'?i:0),y=Number(w.y||0)+(w.direction==='down'?i:0),key=x+','+y;
   if(!occupied.has(key))occupied.set(key,{letter:answer[i],terms:[]});
   occupied.get(key).terms.push(itemAnswerKey(screen,w));maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);
  }const start=Number(w.x||0)+','+Number(w.y||0);if(!starts.has(start))starts.set(start,[]);starts.get(start).push(w.id);
 }
 const xa=Number(active.x||0),ya=Number(active.y||0),len=String(active.answer||'').length,along=active.direction==='across';
 // Show a bounded viewport around the active clue; no 23-row micro-grid.
 const x0=Math.max(0,Math.min(xa-2,maxx-9)),x1=Math.min(maxx,Math.max(xa+(along?len:1)+1,x0+9));
 const y0=Math.max(0,Math.min(ya-3,maxy-10)),y1=Math.min(maxy,Math.max(ya+(along?1:len)+2,y0+10));
 let board='<div class="rs-cross-grid rs-cross-focus" style="grid-template-columns:repeat('+(x1-x0+1)+',minmax(24px,1fr))">';
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const key=x+','+y,c=occupied.get(key),cellActive=along?y===ya&&x>=xa&&x<xa+len:x===xa&&y>=ya&&y<ya+len;
  const shown=c?.terms.some(k=>ui.reveals.has(k))&&canReveal;
  // Learner-entered letters appear on the grid for the active word only.
  const offset=along?x-xa:y-ya,userLetters=String(ui.answers.get(itemAnswerKey(screen,active))||'').replace(/\s+/g,'').toUpperCase();
  const typed=cellActive?userLetters[offset]||'':'';
  board+='<span class="rs-cross-cell '+(c?'active':'blank')+(cellActive?' rs-cross-highlight':'')+'">'+(starts.has(key)?'<sup>'+html(starts.get(key).join('/'))+'</sup>':'')+(shown?html(c.letter):html(typed))+'</span>';
 }
 board+='</div>';
 const k=itemAnswerKey(screen,active),shown=ui.reveals.has(k)&&canReveal;
 const control='<div class="rs-cross-active"><small>'+html(active.direction.toUpperCase())+' · '+html(active.id)+' / '+words.length+'</small><p>'+html(active.clue)+'</p>'+
 '<input data-rs-input="'+html(k)+'" value="'+html(shown?active.answer:ui.answers.get(k)||'')+'" '+(shown?'readonly':'')+' placeholder="Type your word" aria-label="Crossword word '+html(active.id)+'">'+
 '<div class="rs-item-actions"><button data-rs-action="check" data-rs-key="'+html(k)+'">Check</button><button data-rs-action="reset" data-rs-key="'+html(k)+'">Reset</button>'+
 (canReveal?'<button data-rs-action="reveal" data-rs-key="'+html(k)+'">'+(shown?'Hide word':'Show word')+'</button>':'')+'</div><div class="rs-status">'+(ui.checks.get(k)===undefined?'':ui.checks.get(k)?'✓ Correct':'Try again')+'</div></div>';
 const nav='<div class="rs-cross-choices">'+words.map((w,i)=>'<button data-rs-action="focus" data-rs-key="'+screen.id+'" data-rs-index="'+i+'" class="'+(i===chosen?'rs-current':'')+'">'+html(w.id)+' '+html(w.direction==='across'?'→':'↓')+'</button>').join('')+'</div>';
 return '<div class="rs-cross-layout"><div><p class="rs-viewport-label">Digital crossword · focused view</p>'+board+'</div><div>'+nav+control+'</div></div>';
}
export function renderResourceStage(screen,pack,role='teacher'){
 const source=src(screen,pack);if(!source)return '<div class="rs-missing">Source mapping missing. Import the resource ZIP again.</div>';
 const methodId=screen.resourceStage?.comboId||source.combo;
 const heading='<div class="rs-head"><span>U5.1 · '+html(METHOD_COMBOS[methodId]?.label||methodId)+'</span><h2>'+html(source.title)+'</h2>'+(source.instruction?'<p>'+html(source.instruction)+'</p>':'')+'</div>';
 let body='';
 switch(source.type){
 case 'cover':
  body='<div class="rs-cover"><div class="rs-cover-text"><small>VIETNAM MILITARY MEDICAL UNIVERSITY</small><small>FACULTY OF FOREIGN LANGUAGES</small><div><p>UNIT 5 · U5.1</p><h1>'+html(source.title)+'</h1><h3>'+html(pack.course)+'</h3></div></div><div class="rs-cover-photo">'+(source.photoUrl?'<img class="rs-image" src="'+html(source.photoUrl)+'" alt="Yellow tram and green bus">':'')+'<div class="rs-cover-fallback" '+(source.photoUrl?'style="display:none"':'')+'>'+media(pack,source.photoAsset,'Transport')+'</div></div></div>';break;
 case 'aims':
  body='<div class="rs-aims">'+Object.entries(source.aims||{}).map(([label,arr])=>card(label.toUpperCase(),'<ol>'+arr.map(x=>'<li>'+html(x)+'</li>').join('')+'</ol>')).join('')+'</div>';break;
 case 'gallery':
  body=heading+'<div class="rs-gallery">'+(source.media||[]).map(id=>'<div class="rs-photo">'+media(pack,id,id.replace(/-/g,' '))+'</div>').join('')+'</div>';break;
 case 'crossword':
  body=heading+crossword(screen,source,role);break;
 case 'peer':
  body=heading+'<div class="rs-prompt-list">'+(source.prompts||[]).map((p,i)=>card('TASK '+(i+1),'<p>'+html(p)+'</p>')).join('')+'</div>';break;
 case 'listening':
  body=heading+(methodId==='tbl-listening'?'<div class="rs-teaching-phase">Prepare → Listen → Group task → Report → Check. Tell a partner what each traveller needs before confirming a location.</div>':'<div class="rs-teaching-phase">Predict → Listen for gist → Listen for detail → Compare → Check.</div>')+'<div class="rs-listening"><div class="rs-source-media"><audio controls preload="metadata" src="'+html(resourceMediaUrl(pack,source.audioAsset))+'"></audio><small>Original Track 22 · six conversations · Evidence clips pending source QA</small><div class="rs-sign-grid">'+(source.media||[]).map((id,i)=>'<div><span>'+String.fromCharCode(97+i)+'</span>'+media(pack,id,'Travel sign')+'</div>').join('')+'</div></div><div>'+questionItems(screen,source,role,{kind:'listening'})+'</div></div>';break;
 case 'discovery':
  body=heading+(methodId==='grammar-ppp'?'<div class="rs-teaching-phase">PRESENT → PRACTISE → PRODUCE. Start from the language pattern and check examples.</div>':'<div class="rs-teaching-phase">CONTEXT → NOTICE → DISCOVER → PAIR CHECK → PRACTISE → APPLY. Learners infer before seeing the rule.</div>')+'<div class="rs-discovery"><section>'+card('NOTICE · Original language focus',('<ol>'+(source.examples||[]).map(e=>'<li>'+html(e)+'</li>').join('')+'</ol>'))+'</section><section>'+card('DISCOVER · Work with a partner','<ol>'+(source.questions||[]).map(x=>'<li>'+html(x)+'</li>').join('')+'</ol>')+'<div class="rs-rule">'+((methodId==='grammar-ppp'||(ui.reveals.has(screen.id+':rule')&&['teacher','admin','presentation'].includes(role)))?html(source.rule):'<span>Work out the rule before revealing it.</span>')+'</div>'+(['teacher','admin','presentation'].includes(role)?'<button data-rs-action="rule" data-rs-key="'+html(screen.id+':rule')+'">Show / hide rule</button>':'')+'</section></div>';break;
 case 'practice':
  body=heading+(methodId==='grammar-ppp'?'<div class="rs-teaching-phase">PRACTISE: Complete the sentences after the rule presentation → COMPARE with a partner → PRODUCE one original example aloud.</div>':'<div class="rs-teaching-phase">TRY independently → PAIR CHECK without revealing answers → TEACHER CHECK and explain the use of need.</div>')+questionItems(screen,source,role);break;
 case 'exit':
  body=heading+'<div class="rs-prompt-list">'+(source.prompts||[]).map((x,i)=>card('RETRIEVAL '+(i+1),'<p>'+html(x)+'</p>')).join('')+'</div>';break;
 }
 return '<div class="canvas-wrap rs-wrap"><section class="lesson-canvas rs-canvas rs-'+html(source.type)+'">'+body+'</section></div>';
}
export function renderResourceProperties(screen,pack){
 const source=src(screen,pack);if(!source)return '';
 const available=[...new Set([source.combo,...Object.keys(METHOD_COMBOS).filter(id=>METHOD_COMBOS[id].group===({listening:'Listening',discovery:'Grammar',practice:'Grammar',gallery:'Speaking'}[source.type]||'none'))].filter(Boolean))];
 const usable=available.filter(id=>id===source.combo||['guided-grammar','grammar-ppp','staged-listening','tbl-listening','think-pair-share'].includes(id));
 return '<section class="property-section"><h3>Resource Bank · '+html(pack.id)+'</h3><p class="helper">Asset references are shared. Changing a method does not delete textbook content, images or answer keys.</p><p class="helper">Imported locally into this browser. No server Media Library upload.</p>'+
 '<label>Teaching Combo</label><select data-rs-combo>'+usable.map(id=>'<option value="'+html(id)+'" '+(screen.resourceStage.comboId===id?'selected':'')+'>'+html(METHOD_COMBOS[id]?.label||id)+'</option>').join('')+'</select>'+
 '<p class="helper">Source: '+html(source.id)+' · '+html(pack.status)+'</p><p class="helper">Evidence: '+html(pack.quality?.audioEvidence)+'</p></section>';
}
export function wireResourceStage({screen,pack,role,render,onModified}){
 if(!screen?.resourceStage)return;
 document.querySelectorAll('.rs-cover-photo > img').forEach(img=>img.addEventListener('error',()=>{img.style.display='none';const fallback=img.nextElementSibling;if(fallback)fallback.style.display='block';}));
 document.querySelectorAll('[data-rs-input]').forEach(e=>e.addEventListener('input',()=>{ui.answers.set(e.dataset.rsInput,e.value);ui.checks.delete(e.dataset.rsInput)}));
 document.querySelectorAll('[data-rs-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const key=btn.dataset.rsKey,action=btn.dataset.rsAction;
  const source=src(screen,pack),item=(source?.items||[]).find(x=>itemAnswerKey(screen,x)===key);
  const revealAllowed=['teacher','admin','presentation'].includes(role);
  const checkAllowed=['teacher','admin','student','guest'].includes(role);
  if(action==='reveal'||action==='rule'){if(!revealAllowed)return;ui.reveals.has(key)?ui.reveals.delete(key):ui.reveals.add(key)}
  if(action==='reset'){ui.answers.delete(key);ui.checks.delete(key);ui.reveals.delete(key);ui.whys.delete(key)}
  if(action==='why'){ui.whys.has(key)?ui.whys.delete(key):ui.whys.add(key)}
  if(action==='check'&&checkAllowed&&item){
   const norm=x=>String(x||'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
   ui.checks.set(key,norm(ui.answers.get(key))===norm(item.answer));
  }
  render();
 }));
 document.querySelectorAll('[data-rs-combo]').forEach(e=>e.addEventListener('change',()=>{
  // Teacher approval is a separate process. Switching a method in preview only
  // changes the method contract; it never silently creates missing assets.
  const id=e.value;if(!METHOD_COMBOS[id]&&id!==src(screen,pack)?.combo)return;
  screen.resourceStage.comboId=id;onModified();render();
 }));
}
