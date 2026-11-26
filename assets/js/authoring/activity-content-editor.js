/* Edit imported objective rows without regenerating stable IDs or losing Evidence links. */
const choice=new Set(['mcq','multi-select','true-false','poll','listening','video-question']);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const field=(label,key,value,max=1800)=>`<div class="studio-field"><label for="objective-${esc(key)}">${esc(label)}</label><textarea id="objective-${esc(key)}" data-objective-field="${esc(key)}" maxlength="${max}" rows="2">${esc(value)}</textarea></div>`;
export const hasObjectiveEditor=b=>!!b?.activity&&(choice.has(b.type)||['fill','matching','ordering','categorising'].includes(b.type));
function evidenceFields(a,key,i){const e=a.evidenceByItem?.[key]||{};return field('Evidence · exact source quote',`e${i}-quote`,e.quote,500)+field('Why? · explanation',`e${i}-why`,e.why,700);}
export function renderObjectiveEditor(b){
 if(!hasObjectiveEditor(b))return '';
 const a=b.activity,t=b.type;let html=field('Question / prompt','prompt',a.prompt);
 if(choice.has(t)){
  html+=(a.options||[]).map((o,i)=>field(`Option ${o.id}`,`row${i}-label`,o.label,500)).join('');
  if(t!=='poll')html+=field('Correct answer ID(s), separated by commas','keys',(a.answerKey||[]).join(', '),600)+evidenceFields(a,'choice',0);
 }else if(t==='fill'||t==='matching'){
  const rows=t==='fill'?a.items:a.pairs;
  html+=(rows||[]).map((x,i)=>`<fieldset><legend>Item ${i+1}</legend>${t==='fill'?field('Question',`row${i}-prompt`,x.prompt)+field('Accepted answers (separate alternatives with ;)',`row${i}-answers`,(x.answers||[]).join('; '),3000):field('Left',`row${i}-left`,x.left,500)+field('Right',`row${i}-right`,x.right,500)}${evidenceFields(a,x.id,i)}</fieldset>`).join('');
 }else if(t==='ordering'){
  html+=(a.items||[]).map((x,i)=>field(`Item ${x.id}`,`row${i}-text`,x.text,1000)).join('')+field('Correct order · item IDs separated by commas','keys',(a.answerKey||[]).join(', '),600);
 }else{
  html+=field('Categories · one per line','categories',(a.categories||[]).join('\n'),3000)+(a.items||[]).map((x,i)=>`<fieldset><legend>Item ${i+1}</legend>${field('Item',`row${i}-text`,x.text,1000)}${field('Correct category',`row${i}-category`,x.category,300)}</fieldset>`).join('');
 }
 return `<section data-objective-editor><h4>Edit question, answer and evidence</h4>${html}<button type="button" class="studio-btn primary" data-objective-apply>Apply question changes</button><p data-objective-message role="status"></p></section>`;
}
function checked(value,max,label,{optional=false}={}){const s=String(value??'').trim();if(s.length>max||(!optional&&!s))throw Error('Invalid '+label+'.');return s;}
function keys(value,ids,{single=false,complete=false}={}){const out=String(value??'').split(',').map(x=>x.trim()).filter(Boolean);if(!out.length||new Set(out).size!==out.length||out.some(k=>!ids.includes(k))||(single&&out.length!==1)||(complete&&out.length!==ids.length))throw Error('Answer IDs must refer to existing items.');return out;}
export function applyObjectiveContent(block,fields){
 if(!hasObjectiveEditor(block))throw Error('Select an objective activity.');
 const t=block.type,a=structuredClone(block.activity);a.prompt=checked(fields.prompt,1800,'question prompt');
 const evidence=(id,i)=>{
  const quote=checked(fields[`e${i}-quote`],500,'evidence',{optional:true}),why=checked(fields[`e${i}-why`],700,'explanation',{optional:true});
  if(quote&&!why)throw Error('Evidence requires a Why explanation.');
  if(quote||why){a.evidenceByItem||={};a.evidenceByItem[id]={...a.evidenceByItem[id],quote,why};}
  else if(a.evidenceByItem)delete a.evidenceByItem[id];
 };
 if(choice.has(t)){
  a.options=a.options.map((o,i)=>({...o,label:checked(fields[`row${i}-label`],500,'option')}));
  if(t!=='poll'){a.answerKey=keys(fields.keys,a.options.map(x=>x.id),{single:t!=='multi-select'});evidence('choice',0);}
 }else if(t==='fill'){
  a.items=a.items.map((x,i)=>{const answers=String(fields[`row${i}-answers`]??'').split(';').map(y=>y.trim()).filter(Boolean);if(!answers.length||answers.length>10||answers.some(y=>y.length>300))throw Error('Each item needs valid accepted answers.');evidence(x.id,i);return {...x,prompt:checked(fields[`row${i}-prompt`],1800,'item prompt'),answers};});
 }else if(t==='matching'){
  a.pairs=a.pairs.map((x,i)=>{evidence(x.id,i);return {...x,left:checked(fields[`row${i}-left`],500,'left item'),right:checked(fields[`row${i}-right`],500,'right item')};});
  if(new Set(a.pairs.map(x=>x.right.toLowerCase())).size!==a.pairs.length)throw Error('Matching requires unique right-hand answers.');
 }else if(t==='ordering'){
  a.items=a.items.map((x,i)=>({...x,text:checked(fields[`row${i}-text`],1000,'ordering item')}));a.answerKey=keys(fields.keys,a.items.map(x=>x.id),{complete:true});
 }else{
  const cats=String(fields.categories??'').split('\n').map(x=>x.trim()).filter(Boolean);if(cats.length<2||new Set(cats).size!==cats.length||cats.some(x=>x.length>300))throw Error('Enter at least two distinct categories.');a.categories=cats;
  a.items=a.items.map((x,i)=>{const category=checked(fields[`row${i}-category`],300,'category');if(!cats.includes(category))throw Error('Each category must match an existing category.');return {...x,text:checked(fields[`row${i}-text`],1000,'item'),category};});
 }
 if(JSON.stringify(a)===JSON.stringify(block.activity))return false;
 block.activity=a;return true;
}
