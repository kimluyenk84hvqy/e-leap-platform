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
 const current=ui.focus.get(screen.id)||0,items=source.items||[],pageSize=2; // 16:9 teaching: two full-size items, never crop a question
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
  const canExplain=canReveal&&confirmed&&(!canEvidence||item.evidenceStatus==='VERIFIED');
  const showWhy=ui.whys.has(k)&&canExplain;
  return '<article class="rs-item"><span class="rs-item-n">'+html(item.id)+'</span><div class="rs-item-main">'+prompt+'<div class="rs-status">'+scoreStatus+'</div><div class="rs-item-actions">'+
   (canCheck?'<button type="button" data-rs-action="check" data-rs-key="'+html(k)+'">Check</button>':'')+
   (canReveal?'<button type="button" data-rs-action="reveal" data-rs-key="'+html(k)+'">'+(reveal?'Hide answer':'Show answer')+'</button>':'')+
   '<button type="button" data-rs-action="reset" data-rs-key="'+html(k)+'">Reset</button>'+
   (canExplain?'<button type="button" data-rs-action="why" data-rs-key="'+html(k)+'">Why?</button>':'')+
   (canEvidence?'<button type="button" disabled title="Audio segment has not passed source verification.">Evidence · pending QA</button>':'')+
   '</div>'+(showWhy?'<p class="rs-why">'+html(item.why||'Explanation not yet approved.')+'</p>':'')+
   (!confirmed?'<small class="rs-unverified">Working answer key — awaiting source verification</small>':'')+
   '</div></article>';
 }).join('')+'</div>';
}
function crossword(screen,source,role){
 const words=source.items||[],canReveal=['teacher','admin','presentation'].includes(role);
 const chosen=Math.max(0,Math.min(ui.focus.get(screen.id)||0,words.length-1)),active=words[chosen];
 if(!active)return '<p>No crossword entries have been supplied.</p>';
 const occupied=new Map(),starts=new Map();let maxx=0,maxy=0;
 for(const [idx,w] of words.entries()){
  const answer=String(w.answer||'').toUpperCase();
  for(let i=0;i<answer.length;i++){
   const x=Number(w.x||0)+(w.direction==='across'?i:0),y=Number(w.y||0)+(w.direction==='down'?i:0),key=x+','+y;
   if(!occupied.has(key))occupied.set(key,{letter:answer[i],words:[]});
   occupied.get(key).words.push(idx);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);
  }
  const start=Number(w.x||0)+','+Number(w.y||0);
  if(!starts.has(start))starts.set(start,[]);
  starts.get(start).push(idx);
 }
 const totalCols=maxx+1,totalRows=maxy+1,activeKey=itemAnswerKey(screen,active);
 let board='<div class="rs-cross-grid rs-cross-full" role="group" aria-label="Complete transport crossword" style="--rs-cross-cols:'+totalCols+';--rs-cross-rows:'+totalRows+';grid-template-columns:repeat('+totalCols+',minmax(0,1fr))">';
 for(let y=0;y<totalRows;y++)for(let x=0;x<totalCols;x++){
  const cell=occupied.get(x+','+y);
  if(!cell){board+='<span class="rs-cross-cell blank" aria-hidden="true"></span>';continue;}
  const mainIndex=cell.words.includes(chosen)?chosen:cell.words[0];
  const startIds=(starts.get(x+','+y)||[]).map(idx=>words[idx].id);
  const cellIsActive=cell.words.includes(chosen);
  // A complete board remains visible. Only the selected word is highlighted.
  const typed=cell.words.map(idx=>{
   const word=words[idx],offset=word.direction==='across'?x-Number(word.x):y-Number(word.y);
   return String(ui.answers.get(itemAnswerKey(screen,word))||'').replace(/\s+/g,'').toUpperCase()[offset]||'';
  }).find(Boolean)||'';
  const revealed=canReveal&&cell.words.some(idx=>ui.reveals.has(itemAnswerKey(screen,words[idx])));
  board+='<button type="button" data-rs-x="'+x+'" data-rs-y="'+y+'" data-rs-action="focus" data-rs-index="'+mainIndex+'" data-rs-key="'+html(screen.id)+'" class="rs-cross-cell active'+(cellIsActive?' rs-cross-highlight':'')+'" aria-label="Crossword '+html(words[mainIndex].id)+'">'+(startIds.length?'<sup>'+html(startIds.join('/'))+'</sup>':'')+'<span class="rs-cross-letter">'+html(revealed?cell.letter:typed)+'</span></button>';
 }
 board+='</div>';
 const answer=String(active.answer||''),typed=String(ui.answers.get(activeKey)||''),shown=canReveal&&ui.reveals.has(activeKey);
 const bigCells='<div class="rs-cross-zoom" aria-label="Selected word">'+Array.from({length:answer.length},(_,i)=>'<span>'+html(shown?answer[i].toUpperCase():(typed.replace(/\s+/g,'').toUpperCase()[i]||''))+'</span>').join('')+'</div>';
 const nav='<nav class="rs-cross-choices">'+words.map((w,i)=>'<button type="button" data-rs-action="focus" data-rs-key="'+html(screen.id)+'" data-rs-index="'+i+'" class="'+(i===chosen?'rs-current':'')+'">'+html(w.id)+' '+(w.direction==='across'?'→':'↓')+'</button>').join('')+'</nav>';
 const clue='<section class="rs-cross-active"><h3>'+html(active.direction==='across'?'Across':'Down')+' '+html(active.id)+'</h3><p class="rs-cross-clue">'+html(active.clue)+'</p>'+
 bigCells+'<input data-rs-input="'+html(activeKey)+'" type="text" value="'+html(shown?answer:typed)+'" '+(shown?'readonly':'')+' placeholder="Type your answer" aria-label="Word '+html(active.id)+'">'+
 '<div class="rs-item-actions">'+
 '<button type="button" data-rs-action="check" data-rs-key="'+html(activeKey)+'">Check</button><button type="button" data-rs-action="reset" data-rs-key="'+html(activeKey)+'">Reset</button>'+
 (canReveal?'<button type="button" data-rs-action="reveal" data-rs-key="'+html(activeKey)+'">'+(shown?'Hide word':'Show word')+'</button>':'')+
 '</div><p class="rs-status">'+(ui.checks.get(activeKey)===undefined?'':ui.checks.get(activeKey)?'✓ Correct':'Try again')+'</p></section>';
 return '<div class="rs-cross-layout"><div class="rs-cross-board-panel">'+board+'</div><div class="rs-cross-side">'+nav+clue+'</div></div>';
}
export function renderResourceStage(screen,pack,role='teacher'){
 const source=src(screen,pack);if(!source)return '<div class="rs-missing">Source mapping missing. Import the resource ZIP again.</div>';
 const methodId=screen.resourceStage?.comboId||source.combo;
 const heading='<div class="rs-head"><h2>'+html(source.title)+'</h2>'+(source.instruction?'<p>'+html(source.instruction)+'</p>':'')+'</div>';
 let body='';
 switch(source.type){
 case 'cover':
  body='<div class="rs-cover"><div class="rs-cover-text"><small>VIETNAM MILITARY MEDICAL UNIVERSITY</small><small>FACULTY OF FOREIGN LANGUAGES</small><div><p>UNIT 5 · U5.1</p><h1>'+html(source.title)+'</h1><h3>'+html(pack.course)+'</h3></div></div><div class="rs-cover-photo">'+(source.photoUrl?'<img class="rs-image" src="'+html(source.photoUrl)+'" alt="Yellow tram and green bus">':'')+'<div class="rs-cover-fallback" '+(source.photoUrl?'style="display:none"':'')+'>'+media(pack,source.photoAsset,'Transport')+'</div></div></div>';break;
 case 'aims':
  body='<div class="rs-aims">'+Object.entries(source.aims||{}).map(([label,arr])=>card(label.toUpperCase(),'<ol>'+arr.map(x=>'<li>'+html(x)+'</li>').join('')+'</ol>')).join('')+'</div>';break;
 case 'gallery':{
  const photos=source.media||[],active=Math.min(ui.focus.get(screen.id)||0,photos.length-1),phase=Math.min(ui.phase.get(screen.id)||0,2);
  const steps=['THINK','PAIR','SHARE'],instructions=['Look carefully. Name the transport you can see.','Compare the names with your partner. What is similar or different?','Share one word and explain your choice. Then try the original crossword.'];
  body=heading+'<nav class="rs-phase-nav">'+steps.map((x,i)=>'<button data-rs-action="phase" data-rs-key="'+html(screen.id)+'" data-rs-index="'+i+'" class="'+(phase===i?'rs-current':'')+'">'+x+'</button>').join('')+'</nav>'+
  '<p class="rs-phase-instruction">'+html(instructions[phase])+'</p><div class="rs-picture-focus">'+
  '<div class="rs-picture-feature">'+(photos[active]?media(pack,photos[active],photos[active]):'<p>Photo not available</p>')+'</div>'+
  '<div class="rs-picture-choices">'+photos.map((id,i)=>'<button data-rs-action="focus" data-rs-key="'+html(screen.id)+'" data-rs-index="'+i+'" class="'+(active===i?'rs-current':'')+'">'+media(pack,id,'Transport photo '+(i+1))+'<span>Photo '+(i+1)+'</span></button>').join('')+'</div></div>';break;
 }
 case 'crossword':
  body=heading+crossword(screen,source,role);break;
 case 'peer':
  body=heading+'<div class="rs-prompt-list">'+(source.prompts||[]).map((p,i)=>card('TASK '+(i+1),'<p>'+html(p)+'</p>')).join('')+'</div>';break;
 case 'listening':{
  const phase=ui.phase.get(screen.id)||0;
  const method=methodId==='tbl-listening'
   ?[{label:'Prepare',instruction:'Discuss what information a traveller might need.'},{label:'Listen',instruction:'Listen once and note the location or request.'},{label:'Group Task',instruction:'Compare notes with a partner before choosing an answer.'},{label:'Check',instruction:'Return to the textbook questions. Check your answers.'}]
   :[{label:'Predict',instruction:'Look at the signs and make a prediction.'},{label:'Listen',instruction:'Listen once for meaning and then for details.'},{label:'Compare',instruction:'Discuss answers with a partner without looking at the key.'},{label:'Check',instruction:'Complete the original questions; review one item at a time.'}];
  const current=method[Math.min(phase,method.length-1)];
  const flow='<nav class="rs-phase-nav">'+method.map((step,i)=>'<button type="button" data-rs-action="phase" data-rs-key="'+html(screen.id)+'" data-rs-index="'+i+'" class="'+(i===phase?'rs-current':'')+'">'+html(step.label)+'</button>').join('')+'</nav><p class="rs-phase-instruction">'+html(current.instruction)+'</p>';
  const signs='<div class="rs-sign-grid">'+(source.media||[]).map((id,i)=>'<div><span>'+String.fromCharCode(97+i)+'</span>'+media(pack,id,'Travel sign')+'</div>').join('')+'</div>';
  const audio='<div class="rs-source-media"><audio controls preload="metadata" src="'+html(resourceMediaUrl(pack,source.audioAsset))+'"></audio><small>Track 22</small></div>';
  const isListening=phase===1,showQuestions=phase===3;
  body=heading+flow+'<div class="rs-listening">'+(showQuestions?audio:phase===2?card('PAIR CHECK','<p>Tell a partner what you heard. Explain the clue that supports each answer.</p>'):card(phase===0?'LOOK & PREDICT':'LISTENING INPUT',phase===0?'<p>Where might you hear these conversations? What do these signs mean?</p>':audio))+
   (showQuestions?'<div>'+questionItems(screen,source,role,{kind:'listening'})+'</div>':isListening?signs:phase===0?signs:'<div class="rs-pair-note">Keep your original answers. You can return to the questions without losing them.</div>')+'</div>';break;
 }
 case 'discovery':{
  const phase=ui.phase.get(screen.id)||0;
  const isPPP=methodId==='grammar-ppp';
  const phases=isPPP?['Present','Practise','Produce']:['Context','Notice','Discover','Rule Check','Apply'];
  const page=Math.min(phase,phases.length-1);
  const flow='<nav class="rs-phase-nav">'+phases.map((label,i)=>'<button data-rs-action="phase" data-rs-key="'+html(screen.id)+'" data-rs-index="'+i+'" class="'+(page===i?'rs-current':'')+'">'+html(label)+'</button>').join('')+'</nav>';
  const ex=(source.examples||[]).map(x=>'<li>'+html(x)+'</li>').join('');
  const q=(source.questions||[]).map(x=>'<li>'+html(x)+'</li>').join('');
  const rule='<div class="rs-rule">'+html(source.rule)+'</div>';
  let content='';
  if(isPPP){
   content=page===0?card('PRESENT · Focus on need', '<ol>'+ex+'</ol>'+rule):
   page===1?card('PRACTISE · Find the pattern','<ol>'+q+'</ol><p>Now complete the original textbook Activity 2 on the next screen.</p>'):
   card('PRODUCE · Make it personal','<p>Tell a partner two things you need and one thing you do not need. Ask one question using <b>need</b>.</p>');
  }else{
   content=page===0?card('CONTEXT · Recall Track 22','<p>What do travellers need at the airport or hotel? Recall one conversation with your partner.</p>'):
   page===1?card('NOTICE · Language from the recording','<ol>'+ex+'</ol><p>Underline <b>need</b> and notice the words that follow it.</p>'):
   page===2?card('DISCOVER · Work with a partner','<ol>'+q+'</ol><p>Compare your ideas before your teacher confirms the rule.</p>'):
   page===3?card('RULE CHECK · Confirm the pattern',(['teacher','admin','presentation'].includes(role)&&ui.reveals.has(screen.id+':rule')?rule:'<p>Think of your own rule. Your teacher can reveal it after discussion.</p>')+
    (['teacher','admin','presentation'].includes(role)?'<button data-rs-action="rule" data-rs-key="'+html(screen.id+':rule')+'">Show / hide rule</button>':'')):
   card('Use need in real life','<p>What do you need when you travel? Tell a partner two things you need and one thing you don’t need.</p><p>Now complete Activity 2.</p>');
  }
  body=heading+flow+'<div class="rs-phase-content">'+content+'</div>';break;
 }
 case 'practice':
  body=heading+questionItems(screen,source,role);break;
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
 document.querySelectorAll('[data-rs-input]').forEach(el=>el.addEventListener('input',()=>{
  ui.answers.set(el.dataset.rsInput,el.value);ui.checks.delete(el.dataset.rsInput);
  // Update digital grid in place while typing; do not interrupt focus or playback.
  const stage=src(screen,pack);if(stage?.type==='crossword'){
   const focus=document.querySelector('.rs-cross-grid');if(!focus)return;
   const letters=el.value.replace(/\s+/g,'').toUpperCase();
   document.querySelectorAll('.rs-cross-zoom span').forEach((node,i)=>{node.textContent=letters[i]||'';});
   const words=stage.items||[],current=words[Math.max(0,Math.min(ui.focus.get(screen.id)||0,words.length-1))];
   if(current){for(let i=0;i<String(current.answer||'').length;i++){
    const x=Number(current.x||0)+(current.direction==='across'?i:0),y=Number(current.y||0)+(current.direction==='down'?i:0);
    const cell=Array.from(focus.querySelectorAll('[data-rs-x]')).find(e=>Number(e.dataset.rsX)===x&&Number(e.dataset.rsY)===y);
    if(cell){const letter=cell.querySelector('.rs-cross-letter');if(letter)letter.textContent=letters[i]||'';}
   }}
  }
 }));
 document.querySelectorAll('[data-rs-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const key=btn.dataset.rsKey,action=btn.dataset.rsAction,source=src(screen,pack);
  const item=(source?.items||[]).find(x=>itemAnswerKey(screen,x)===key);
  const canReveal=['teacher','admin','presentation'].includes(role);
  const canCheck=['teacher','admin','student','guest'].includes(role);
  if(['page','focus','phase'].includes(action)){
   const index=Math.max(0,Number(btn.dataset.rsIndex)||0);
   if(action==='phase')ui.phase.set(screen.id,index);else ui.focus.set(screen.id,index);
   render();return;
  }
  if(action==='reveal'||action==='rule'){if(!canReveal)return;ui.reveals.has(key)?ui.reveals.delete(key):ui.reveals.add(key)}
  else if(action==='reset'){ui.answers.delete(key);ui.checks.delete(key);ui.reveals.delete(key);ui.whys.delete(key)}
  else if(action==='why'){if(!canReveal||(item?.keyStatus&&item.keyStatus!=='VERIFIED')||(source?.type==='listening'&&item?.evidenceStatus!=='VERIFIED'))return;ui.whys.has(key)?ui.whys.delete(key):ui.whys.add(key)}
  else if(action==='check'&&canCheck&&item)ui.checks.set(key,answerMatches(item,ui.answers.get(key)));
  render();
 }));
 document.querySelectorAll('[data-rs-combo]').forEach(el=>el.addEventListener('change',()=>{
  const id=el.value;if(!METHOD_COMBOS[id]&&id!==src(screen,pack)?.combo)return;
  screen.resourceStage.comboId=id;ui.phase.delete(screen.id);onModified();render();
 }));
}
