import {ELeapRuntimeContext} from './runtime-context.js';
import {E_LEAP_ACTIVITY_TYPES,E_LEAP_AUTHORING_LIBRARY} from './activity-registry.js';
import {E_LEAP_THEME_DEFAULT,E_LEAP_THEME_PRESETS,E_LEAP_ALLOWED_FONTS,applyThemePreset} from './theme-tokens.js';
import {E_LEAP_SMART_TEMPLATES,createSmartTemplate} from './smart-templates.js';
import {normaliseDeliveryPolicy,E_LEAP_DELIVERY_POLICIES} from './assessment-policy.js';
import {auditLesson} from './quality-gate.js';
import {ELeapAuthoringSaveService} from './authoring-save-service.js';
import {controlModelForRole} from './controls/control-shell.js';
import {createLesson as modelCreateLesson,ensureLessonSchema as modelEnsureLessonSchema,createScreen as modelCreateScreen,createBlock as modelCreateBlock,normaliseActivity as modelNormaliseActivity,defaultActivityPrompt,legacyToBlocks as modelLegacyToBlocks,clone as modelClone,uid as modelUid,parsePipeLines,duplicateLesson as modelDuplicateLesson} from './authoring/lesson-model.js';
import {E_LEAP_LAYOUT_IDS} from './authoring/layout-registry.js';

const root=document.getElementById('studio');
const ctx=new ELeapRuntimeContext();
const qs=new URLSearchParams(location.search);
const source=qs.get('source')||'';
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const clone=modelClone;
const uid=modelUid;
const DEFAULT_THEME=E_LEAP_THEME_DEFAULT;
const THEMES=E_LEAP_THEME_PRESETS;
const LIBRARY=E_LEAP_AUTHORING_LIBRARY;
const saveService=new ELeapAuthoringSaveService();
let lesson=null, selectedScreen=0, selectedBlock=0, dirty=false, previewRole='student', autosaveTimer=null;
let draftKey='';

if(!ctx.can('content:edit')){
  root.innerHTML=`<section class="studio-denied"><div class="studio-kicker">E-LEAP Studio</div><h1>Editing access required</h1><p>This workspace is available to Admins and Teachers with Content Edit permission.</p><a href="javascript:history.back()">← Back</a></section>`;
}else{
  lesson=await loadLesson();
  ensureSchema();
  draftKey=`e-leap-studio-v1:${source||lesson.id||'new'}`;
  const saved=localStorage.getItem(draftKey);
  if(saved && !qs.get('fresh')){try{lesson=JSON.parse(saved);ensureSchema();}catch{}}
  render();
}

async function loadLesson(){
  if(source){
    try{const r=await fetch(source,{cache:'no-store'});if(r.ok)return await r.json();}catch{}
  }
  return modelCreateLesson();
}
function ensureSchema(){lesson=modelEnsureLessonSchema(lesson);}
function legacyToBlocks(s){return modelLegacyToBlocks(s);}
function newScreen(stage='New slide',title='New slide'){return modelCreateScreen(stage,title);}
function newBlock(type){return modelCreateBlock(type);}
function normaliseActivity(a={},type){return modelNormaliseActivity(a,type);}
function defaultPrompt(type){return defaultActivityPrompt(type);}
function currentScreen(){return lesson.screens[selectedScreen]}
function currentBlock(){return currentScreen().blocks[selectedBlock]||currentScreen().blocks[0]}
function markDirty(){dirty=true;status('Unsaved changes');clearTimeout(autosaveTimer);autosaveTimer=setTimeout(saveDraft,700)}
function saveDraft(){localStorage.setItem(draftKey,JSON.stringify(lesson));dirty=false;status('Saving draft…');saveService.saveDraft(lesson).then(r=>status(r.mode==='server'?'Draft saved to server':'Draft saved locally')).catch(()=>status('Draft saved locally'))}
function status(msg){const e=document.querySelector('[data-studio-status]');if(e)e.textContent=msg}

function render(){
  const s=currentScreen(); if(selectedBlock>=s.blocks.length)selectedBlock=Math.max(0,s.blocks.length-1);
  root.innerHTML=`<section class="studio-shell">
    <header class="studio-topbar">
      <div class="studio-brand"><div class="studio-logo">E</div><div><b>E-LEAP Authoring Studio</b><small data-studio-status>${dirty?'Unsaved changes':'Draft ready'}</small></div></div>
      <div class="studio-top-actions">
        <button class="studio-btn" data-new>New lesson</button><button class="studio-btn" data-duplicate-lesson>Duplicate</button><button class="studio-btn" data-quality>Quality check</button><button class="studio-btn" data-export>Export JSON</button><button class="studio-btn" data-save>Save draft</button><button class="studio-btn primary" data-publish>${ctx.can('content:publish')?'Publish candidate':'Request publish'}</button>
      </div>
    </header>
    <div class="studio-layout">
      <aside class="studio-left"><div class="studio-pane-head"><div><h2>Lesson</h2><small>${esc(lesson.lessonNumber||'')} · ${esc(lesson.title||'')}</small></div></div><div class="slide-list">${lesson.screens.map((x,i)=>slideItem(x,i)).join('')}</div><div class="left-footer"><button class="studio-btn primary" data-add-slide style="width:100%">+ Add slide</button></div></aside>
      <main class="studio-center"><div class="canvas-toolbar"><div class="studio-preview-modes"><b style="font-size:13px">Preview as</b>${['teacher','admin','student','guest','presentation'].map(r=>`<button class="studio-btn ${previewRole===r?'primary':''}" data-preview-role="${r}">${cap(r)}</button>`).join('')}</div><div class="status">${esc(s.stage)} · Slide ${selectedScreen+1}/${lesson.screens.length}</div></div>${renderCanvas(s)}</main>
      <aside class="studio-right"><div class="studio-pane-head"><div><h2>Properties</h2><small>${currentBlock()?cap(typeLabel(currentBlock().type)):'Slide'}</small></div></div><div class="properties">${renderProperties()}</div></aside>
    </div>
    ${renderAddDialog()}${renderQualityPanel()}
  </section>`;
  wire();
}
function slideItem(s,i){return `<button class="slide-item ${i===selectedScreen?'active':''}" data-slide="${i}"><span class="slide-thumb">${i+1}</span><span class="slide-title"><b>${esc(s.title||'Untitled')}</b><small>${esc(s.stage||'Slide')}</small></span><span class="slide-more">⋮</span></button>`}
function renderCanvas(s){const t=lesson.theme;return `<div class="canvas-wrap" style="--canvas-font:${cssFont(t.fontFamily)};--canvas-title-size:${Number(t.titleSize)||36}px;--canvas-body-size:${Number(t.bodySize)||18}px;--canvas-text:${safeColor(t.textColor,'#173f38')};--canvas-accent:${safeColor(t.accentColor,'#0d7d6d')};--canvas-bg:${safeColor(t.backgroundColor,'#fff')}"><div class="preview-strip"><b>${cap(previewRole)} preview</b><span>${esc(t.preset)} · ${esc(t.fontFamily)}</span></div><section class="lesson-canvas layout-${esc(s.layout||'standard')} template-${esc(s.templateId||'custom')}"><header class="canvas-hero"><div class="canvas-kicker">${esc(s.stage||'')}</div><h1 class="canvas-title" contenteditable="true" data-edit="screen-title">${esc(s.title||'')}</h1><p class="canvas-instruction" contenteditable="true" data-edit="screen-instruction">${esc(s.instruction||'')}</p></header><div class="canvas-body">${s.blocks.map((b,i)=>renderBlock(b,i)).join('')}<div class="add-block"><button class="studio-btn primary" data-open-library>+ Add content / activity</button></div></div></section></div>`}
function renderBlock(b,i){return `<section class="block ${i===selectedBlock?'selected':''}" data-block="${i}">${blockPreview(b)}</section>`}
function blockPreview(b){
  if(b.type==='text')return `<div class="block-label">Text</div><div class="studio-text-role role-${esc(b.content?.role||'body')}" contenteditable="true" data-edit="block-text">${esc(b.content?.text||'')}</div>`;
  if(b.type==='image')return `<div class="block-label">Image</div><div class="media-placeholder"><div><strong>▧ ${esc(b.content?.caption||'Image')}</strong>${b.content?.src?esc(b.content.src):(b.content?.assetId?`Asset: ${esc(b.content.assetId)}`:'Choose an image from Media Library or paste a media path.')}</div></div>`;
  if(b.type==='audio')return `<div class="block-label">Audio</div><div class="media-placeholder"><div><strong>♪ ${esc(b.content?.label||'Audio')}</strong>${b.content?.src?esc(b.content.src):(b.content?.assetId?`Asset: ${esc(b.content.assetId)}`:'Add audio source')}</div></div>`;
  if(b.type==='video')return `<div class="block-label">Video</div><div class="media-placeholder"><div><strong>▶ ${esc(b.content?.label||'Video')}</strong>${b.content?.src?esc(b.content.src):(b.content?.assetId?`Asset: ${esc(b.content.assetId)}`:'Add video source')}</div></div>`;
  if(b.type==='vocabulary')return `<div class="block-label">Vocabulary</div><div class="activity-card">${(b.content?.items||[]).map(x=>`<p><b>${esc(x.word)}</b> — ${esc(x.meaning)} <small>${esc(x.example||'')}</small></p>`).join('')}</div>`;
  if(b.type==='grammar-note')return `<div class="block-label">Grammar note</div><div class="activity-card"><h3>${esc(b.content?.rule||'Rule')}</h3><p><b>${esc(b.content?.form||'')}</b></p>${(b.content?.examples||[]).map(x=>`<p>${esc(x)}</p>`).join('')}</div>`;
  const a=b.activity||{};return `<div class="block-label">${esc(typeLabel(b.type))}</div><div class="activity-card"><div class="activity-prompt">${esc(a.prompt||'')}</div>${activityDemo(b.type,a)}<div class="interaction-row">${controlChips(b.type,a).map(x=>`<span class="${x.on?'on':''}">${esc(x.label)}</span>`).join('')}</div></div>`;
}
function activityDemo(type,a){
  if(['mcq','multi-select','true-false','poll','listening','video-question'].includes(type))return `<div class="option-list">${(a.options||[]).map(o=>`<div class="option-demo"><i>${esc(o.id||'')}</i><span>${esc(o.label||'')}</span></div>`).join('')}</div>`;
  if(type==='fill')return (a.items||[]).map(x=>`<div class="option-demo">${esc(x.prompt||'')} <b>[ answer ]</b></div>`).join('');
  if(type==='matching')return `<div class="option-list">${(a.pairs||[]).map(x=>`<div class="option-demo"><b>${esc(x.left)}</b><span>↔ ${esc(x.right)}</span></div>`).join('')}</div>`;
  if(type==='ordering')return `<div class="option-list">${(a.items||[]).map((x,i)=>`<div class="option-demo"><i>${i+1}</i>${esc(x.text)}</div>`).join('')}</div>`;
  if(type==='categorising')return `<div class="option-list">${(a.categories||[]).map(c=>`<div class="option-demo"><b>${esc(c)}</b></div>`).join('')}</div>`;
  if(['writing','discussion'].includes(type))return `<div class="media-placeholder">${esc(a.placeholder||'Type response…')}</div>`;
  if(type==='speaking-record')return `<div class="media-placeholder"><div><strong>● Record response</strong>Maximum ${Number(a.maxSeconds)||120} seconds</div></div>`;
  if(['click-reveal','flashcards'].includes(type))return `<div class="option-list">${(a.items||[]).map(x=>`<div class="option-demo"><b>${esc(x.question||'')}</b><span>→ ${previewRole==='student'?'Hidden until allowed':esc(x.answer||'')}</span></div>`).join('')}</div>`;
  return `<div class="media-placeholder">Activity preview</div>`;
}
function controlChips(type,a){const objective=['mcq','multi-select','true-false','fill','matching','ordering','categorising','listening','video-question'].includes(type);const productive=['writing','discussion','speaking-record'].includes(type);const role=previewRole==='presentation'?'teacher':previewRole;const model=controlModelForRole({role,presentation:previewRole==='presentation',capabilities:{check:objective,reset:true,reveal:objective||Boolean(a?.modelAnswer||a?.answerKey),submit:objective||productive,score:objective}});return model.map(c=>({label:c.label,on:c.enabled}));}
function renderProperties(){return `${lessonProps()}${slideProps()}${blockProps()}`}
function lessonProps(){const t=lesson.theme;return `<section class="property-section"><h3>Lesson</h3>${field('Lesson title','lesson.title',lesson.title)}<div class="field-row">${field('Course','lesson.courseLabel',lesson.courseLabel||'')}${field('Lesson no.','lesson.lessonNumber',lesson.lessonNumber||'')}</div></section><section class="property-section"><h3>Theme & typography</h3>${select('Theme preset','theme.preset',t.preset,Object.keys(THEMES))}${select('Font','theme.fontFamily',t.fontFamily,E_LEAP_ALLOWED_FONTS)}${select('Use as','lesson.deliveryPolicy',lesson.deliveryPolicy?.id||'practice',Object.keys(E_LEAP_DELIVERY_POLICIES))}<div class="field-row">${numField('Title size','theme.titleSize',t.titleSize,28,52)}${numField('Body size','theme.bodySize',t.bodySize,14,26)}</div><div class="field-row">${colorField('Text','theme.textColor',t.textColor)}${colorField('Accent','theme.accentColor',t.accentColor)}</div>${colorField('Background','theme.backgroundColor',t.backgroundColor)}<div class="token-note">Default styling is inherited by every slide. Use overrides only when necessary so lessons stay consistent.</div></section>`}
function slideProps(){const s=currentScreen();return `<section class="property-section"><h3>Current slide</h3>${field('Stage','screen.stage',s.stage||'')}${field('Title','screen.title',s.title||'')}${area('Instruction','screen.instruction',s.instruction||'')}${select('Layout','screen.layout',s.layout||'standard',E_LEAP_LAYOUT_IDS)}<div class="studio-inline-actions"><button class="studio-btn" data-slide-up ${selectedScreen===0?'disabled':''}>↑</button><button class="studio-btn" data-slide-down ${selectedScreen===lesson.screens.length-1?'disabled':''}>↓</button><button class="studio-btn" data-duplicate-slide>Duplicate</button><button class="studio-btn danger" data-delete-slide ${lesson.screens.length===1?'disabled':''}>Delete</button></div></section>`}
function blockProps(){const b=currentBlock();if(!b)return '';let body=`<section class="property-section"><h3>Selected block</h3><div class="helper">${esc(typeLabel(b.type))}</div>`;
  if(b.type==='text')body+=area('Text','block.content.text',b.content?.text||'')+select('Text role','block.content.role',b.content?.role||'body',['institution','faculty','eyebrow','display','h1','h2','instruction','body','answer','caption']);
  else if(b.type==='image')body+=field('Media Asset ID','block.content.assetId',b.content?.assetId||'')+field('Media path / URL','block.content.src',b.content?.src||'')+field('Alt text','block.content.alt',b.content?.alt||'')+field('Caption','block.content.caption',b.content?.caption||'')+select('Fit','block.content.fit',b.content?.fit||'contain',['contain','cover']);
  else if(b.type==='audio')body+=field('Media Asset ID','block.content.assetId',b.content?.assetId||'')+field('Audio path / URL','block.content.src',b.content?.src||'')+field('Label','block.content.label',b.content?.label||'')+area('Transcript (optional)','block.content.transcript',b.content?.transcript||'');
  else if(b.type==='video')body+=field('Media Asset ID','block.content.assetId',b.content?.assetId||'')+field('Video path / URL','block.content.src',b.content?.src||'')+field('Label','block.content.label',b.content?.label||'')+field('Poster path (optional)','block.content.poster',b.content?.poster||'')+field('Caption','block.content.caption',b.content?.caption||'');
  else if(b.type==='vocabulary')body+=area('Items: word | meaning | example','block.vocabulary', (b.content?.items||[]).map(x=>`${x.word} | ${x.meaning} | ${x.example||''}`).join('\n'));
  else if(b.type==='grammar-note')body+=field('Rule','block.content.rule',b.content?.rule||'')+field('Form','block.content.form',b.content?.form||'')+area('Examples (one per line)','block.grammarExamples',(b.content?.examples||[]).join('\n'));
  else body+=activityProps(b);
  body+=`<div class="studio-block-actions"><button class="studio-btn" data-block-up ${selectedBlock===0?'disabled':''}>↑</button><button class="studio-btn" data-block-down ${selectedBlock===currentScreen().blocks.length-1?'disabled':''}>↓</button><button class="studio-btn" data-duplicate-block>Duplicate</button><button class="studio-btn danger" data-delete-block ${currentScreen().blocks.length===1?'disabled':''}>Delete</button></div></section>`;return body;}
function activityProps(b){const a=b.activity||{};let out=area('Prompt','activity.prompt',a.prompt||'')+numField('Points','activity.points',a.points||1,0,100);
  if(['mcq','multi-select','true-false','poll','listening','video-question'].includes(b.type))out+=area('Options: ID | Label','activity.options',(a.options||[]).map(o=>`${o.id} | ${o.label}`).join('\n'))+(b.type!=='poll'?field('Correct answer IDs','activity.answerKey',(a.answerKey||[]).join(', ')):'');
  if(b.type==='fill')out+=area('Items: prompt | accepted answer(s separated by ;)','activity.fillItems',(a.items||[]).map(x=>`${x.prompt} | ${(x.answers||[]).join('; ')}`).join('\n'));
  if(b.type==='matching')out+=area('Pairs: left | right','activity.pairs',(a.pairs||[]).map(x=>`${x.left} | ${x.right}`).join('\n'));
  if(b.type==='ordering')out+=area('Correct order (one item per line)','activity.orderItems',(a.items||[]).map(x=>x.text).join('\n'));
  if(b.type==='categorising')out+=area('Categories (one per line)','activity.categories',(a.categories||[]).join('\n'))+area('Items: item | category','activity.categoryItems',(a.items||[]).map(x=>`${x.text} | ${x.category}`).join('\n'));
  if(['writing','discussion'].includes(b.type))out+=field('Placeholder','activity.placeholder',a.placeholder||'')+area('Rubric / teacher criteria','activity.rubric',a.rubric||'')+area('Model answer (optional)','activity.modelAnswer',a.modelAnswer||'');
  if(b.type==='speaking-record')out+=numField('Max seconds','activity.maxSeconds',a.maxSeconds||120,15,600)+area('Rubric / teacher criteria','activity.rubric',a.rubric||'');
  if(['listening','video-question'].includes(b.type))out+=field('Media Asset ID','activity.media.assetId',a.media?.assetId||'')+field(b.type==='listening'?'Audio path / URL':'Video path / URL','activity.media.src',a.media?.src||'');
  if(['click-reveal','flashcards'].includes(b.type))out+=area('Cards: prompt | answer','activity.revealItems',(a.items||[]).map(x=>`${x.question||''} | ${x.answer||''}`).join('\n'));
  out+=`<div class="helper">Controls are inherited from the activity type. Objective activities automatically use Check · Reset · Submit · Score; productive activities use Reset · Submit · Review.</div>`;return out;}
function field(label,path,val){return `<div class="studio-field"><label>${esc(label)}</label><input data-path="${esc(path)}" value="${esc(val??'')}"></div>`}
function numField(label,path,val,min,max){return `<div class="studio-field"><label>${esc(label)}</label><input type="number" min="${min}" max="${max}" data-path="${esc(path)}" value="${Number(val)||0}"></div>`}
function colorField(label,path,val){return `<div class="studio-field"><label>${esc(label)}</label><input type="color" data-path="${esc(path)}" value="${safeColor(val,'#000000')}"></div>`}
function area(label,path,val){return `<div class="studio-field"><label>${esc(label)}</label><textarea data-path="${esc(path)}">${esc(val??'')}</textarea></div>`}
function select(label,path,val,opts){return `<div class="studio-field"><label>${esc(label)}</label><select data-path="${esc(path)}">${opts.map(o=>`<option value="${esc(o)}" ${String(o)===String(val)?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`}
function renderAddDialog(){return `<div class="add-panel" data-add-panel><div class="add-dialog"><div class="add-dialog-head"><div><h2>Add content or activity</h2><small>Choose a reusable E-LEAP block. Behavior comes from the shared engine.</small></div><button class="studio-btn" data-close-library>Close</button></div><div class="activity-library"><section class="library-group"><h3>Smart templates</h3><div class="library-grid">${Object.entries(E_LEAP_SMART_TEMPLATES).map(([key,t])=>`<button class="library-card" data-add-template="${key}"><div class="library-icon">✦</div><b>${esc(t.label)}</b><small>${esc(t.description)}</small></button>`).join('')}</div></section>${Object.entries(LIBRARY).map(([group,items])=>`<section class="library-group"><h3>${esc(group)}</h3><div class="library-grid">${items.map(([type,icon,label,desc])=>`<button class="library-card" data-add-type="${type}"><div class="library-icon">${icon}</div><b>${esc(label)}</b><small>${esc(desc)}</small></button>`).join('')}</div></section>`).join('')}</div></div></div>`}
function runQuality(){return auditLesson(lesson);}
function renderQualityPanel(){const issues=runQuality();const good=issues.filter(x=>x[0]==='error').length===0;return `<aside class="quality-panel" data-quality-panel><div class="quality-head"><b>Quality check</b><button class="studio-btn ghost" data-close-quality>×</button></div><div class="quality-body">${good?'<div class="quality-item ok">No blocking issues. Lesson can be staged for publishing.</div>':''}${issues.map(([k,m])=>`<div class="quality-item ${k}">${esc(m)}</div>`).join('')||'<div class="quality-item ok">All checks passed.</div>'}</div></aside>`}
function wire(){
  document.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{selectedScreen=+b.dataset.slide;selectedBlock=0;render()});
  document.querySelectorAll('[data-block]').forEach(b=>b.onclick=e=>{if(e.target.closest('[contenteditable]'))return;selectedBlock=+b.dataset.block;render()});
  document.querySelectorAll('[data-preview-role]').forEach(b=>b.onclick=()=>{previewRole=b.dataset.previewRole;render()});
  document.querySelector('[data-open-library]')?.addEventListener('click',()=>document.querySelector('[data-add-panel]').classList.add('open'));
  document.querySelector('[data-close-library]')?.addEventListener('click',()=>document.querySelector('[data-add-panel]').classList.remove('open'));
  document.querySelectorAll('[data-add-type]').forEach(b=>b.onclick=()=>{currentScreen().blocks.splice(selectedBlock+1,0,newBlock(b.dataset.addType));selectedBlock++;markDirty();render()});
  document.querySelectorAll('[data-add-template]').forEach(b=>b.onclick=()=>{const s=createSmartTemplate(b.dataset.addTemplate);if(!s)return;lesson.screens.splice(selectedScreen+1,0,s);selectedScreen++;selectedBlock=0;markDirty();render()});
  document.querySelectorAll('[data-path]').forEach(el=>el.addEventListener('input',()=>{applyPath(el.dataset.path,el.type==='number'?Number(el.value):el.value);markDirty();renderSoft()}));
  document.querySelectorAll('[contenteditable][data-edit]').forEach(el=>el.addEventListener('blur',()=>{const key=el.dataset.edit;if(key==='screen-title')currentScreen().title=el.textContent.trim();if(key==='screen-instruction')currentScreen().instruction=el.textContent.trim();if(key==='block-text')currentBlock().content.text=el.textContent.trim();markDirty();render()}));
  document.querySelector('[data-add-slide]')?.addEventListener('click',()=>{lesson.screens.splice(selectedScreen+1,0,newScreen());selectedScreen++;selectedBlock=0;markDirty();render()});
  document.querySelector('[data-duplicate-slide]')?.addEventListener('click',()=>{const c=clone(currentScreen());c.id=uid('screen');c.blocks.forEach(b=>{b.id=uid('block');if(b.activity)b.activity.id=uid('activity')});lesson.screens.splice(selectedScreen+1,0,c);selectedScreen++;markDirty();render()});
  document.querySelector('[data-delete-slide]')?.addEventListener('click',()=>{if(lesson.screens.length<=1)return;lesson.screens.splice(selectedScreen,1);selectedScreen=Math.max(0,selectedScreen-1);selectedBlock=0;markDirty();render()});
  document.querySelector('[data-slide-up]')?.addEventListener('click',()=>move(lesson.screens,selectedScreen,-1,()=>selectedScreen--));
  document.querySelector('[data-slide-down]')?.addEventListener('click',()=>move(lesson.screens,selectedScreen,1,()=>selectedScreen++));
  document.querySelector('[data-duplicate-block]')?.addEventListener('click',()=>{const c=clone(currentBlock());c.id=uid('block');if(c.activity)c.activity.id=uid('activity');currentScreen().blocks.splice(selectedBlock+1,0,c);selectedBlock++;markDirty();render()});
  document.querySelector('[data-delete-block]')?.addEventListener('click',()=>{if(currentScreen().blocks.length<=1)return;currentScreen().blocks.splice(selectedBlock,1);selectedBlock=Math.max(0,selectedBlock-1);markDirty();render()});
  document.querySelector('[data-block-up]')?.addEventListener('click',()=>move(currentScreen().blocks,selectedBlock,-1,()=>selectedBlock--));
  document.querySelector('[data-block-down]')?.addEventListener('click',()=>move(currentScreen().blocks,selectedBlock,1,()=>selectedBlock++));
  document.querySelector('[data-save]')?.addEventListener('click',saveDraft);
  document.querySelector('[data-export]')?.addEventListener('click',exportJSON);
  document.querySelector('[data-quality]')?.addEventListener('click',()=>document.querySelector('[data-quality-panel]').classList.add('open'));
  document.querySelector('[data-close-quality]')?.addEventListener('click',()=>document.querySelector('[data-quality-panel]').classList.remove('open'));
  document.querySelector('[data-publish]')?.addEventListener('click',()=>{const blocking=runQuality().filter(x=>x[0]==='error');status(blocking.length?`Fix ${blocking.length} blocking issue(s) before publish`:(ctx.can('content:publish')?'Publishing candidate…':'Publish request staged for review'));if(blocking.length){document.querySelector('[data-quality-panel]').classList.add('open')}else if(ctx.can('content:publish')){saveService.publish(lesson).then(r=>status(r.mode==='server'?'Published as a new version':'Publish candidate staged locally'))}});
  document.querySelector('[data-new]')?.addEventListener('click',()=>{if(!confirm('Start a new lesson? Your current draft remains saved locally.'))return;lesson=modelCreateLesson();selectedScreen=selectedBlock=0;draftKey=`e-leap-studio-v1:${lesson.id}`;markDirty();render()});
  document.querySelector('[data-duplicate-lesson]')?.addEventListener('click',()=>{lesson=modelDuplicateLesson(lesson);draftKey=`e-leap-studio-v1:${lesson.id}`;markDirty();render()});
}
function renderSoft(){/* Inputs remain active; full render happens on structural actions or blur. */}
function move(arr,index,delta,after){const to=index+delta;if(to<0||to>=arr.length)return;[arr[index],arr[to]]=[arr[to],arr[index]];after();markDirty();render()}
function applyPath(path,value){
  if(path==='theme.preset'){lesson.theme=applyThemePreset(lesson.theme,value);render();return}
  if(path==='lesson.deliveryPolicy'){lesson.deliveryPolicy=normaliseDeliveryPolicy({id:value});render();return}
  const b=currentBlock(),a=b?.activity;
  if(path==='lesson.title')lesson.title=value;else if(path==='lesson.courseLabel')lesson.courseLabel=value;else if(path==='lesson.lessonNumber')lesson.lessonNumber=value;else if(path.startsWith('theme.'))lesson.theme[path.split('.')[1]]=value;else if(path==='screen.stage')currentScreen().stage=value;else if(path==='screen.title')currentScreen().title=value;else if(path==='screen.instruction')currentScreen().instruction=value;else if(path==='screen.layout')currentScreen().layout=value;
  else if(path==='block.content.text')b.content.text=value;else if(path==='block.content.role')b.content.role=value;else if(path.startsWith('block.content.'))b.content[path.split('.')[2]]=value;
  else if(path==='block.vocabulary')b.content.items=parseLines(value,3).map(x=>({word:x[0],meaning:x[1],example:x[2]}));else if(path==='block.grammarExamples')b.content.examples=value.split('\n').map(x=>x.trim()).filter(Boolean);
  else if(path==='activity.prompt')a.prompt=value;else if(path==='activity.points')a.points=Number(value)||0;else if(path==='activity.placeholder')a.placeholder=value;else if(path==='activity.rubric')a.rubric=value;else if(path==='activity.modelAnswer')a.modelAnswer=value;else if(path==='activity.maxSeconds')a.maxSeconds=Number(value)||120;
  else if(path==='activity.options')a.options=parseLines(value,2).map((x,i)=>({id:x[0]||String.fromCharCode(65+i),label:x[1]||x[0]}));else if(path==='activity.answerKey')a.answerKey=value.split(',').map(x=>x.trim()).filter(Boolean);
  else if(path==='activity.fillItems')a.items=parseLines(value,2).map((x,i)=>({id:String(i+1),prompt:x[0],answers:(x[1]||'').split(';').map(y=>y.trim()).filter(Boolean)}));else if(path==='activity.pairs')a.pairs=parseLines(value,2).map((x,i)=>({id:String(i+1),left:x[0],right:x[1]}));
  else if(path==='activity.orderItems'){a.items=value.split('\n').map((x,i)=>({id:String(i+1),text:x.trim()})).filter(x=>x.text);a.answerKey=a.items.map(x=>x.id)}else if(path==='activity.categories')a.categories=value.split('\n').map(x=>x.trim()).filter(Boolean);else if(path==='activity.categoryItems')a.items=parseLines(value,2).map((x,i)=>({id:String(i+1),text:x[0],category:x[1]}));
  else if(path==='activity.media.assetId'){a.media=a.media||{};a.media.assetId=value||null}else if(path==='activity.media.src'){a.media=a.media||{};a.media.src=value}else if(path==='activity.revealItems')a.items=parseLines(value,2).map(x=>({question:x[0],answer:x[1]}));
}
function parseLines(value,n){return parsePipeLines(value,n)}
function exportJSON(){const blob=new Blob([JSON.stringify(lesson,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${(lesson.lessonNumber||'lesson').replace(/[^a-z0-9._-]+/gi,'-')}-lesson.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function typeLabel(type){return E_LEAP_ACTIVITY_TYPES[type]?.label||({'text':'Text','image':'Image','audio':'Audio','video':'Video','vocabulary':'Vocabulary','grammar-note':'Grammar note'}[type]||type)}
function cap(s){return String(s||'').replace(/(^|[-_ ])\w/g,m=>m.toUpperCase())}
function safeColor(v,f){return /^#[0-9a-f]{6}$/i.test(String(v||''))?v:f}
function cssFont(v){return /[^a-zA-Z0-9 -]/.test(String(v||''))?'Poppins,Inter,sans-serif':`"${v}",Poppins,Inter,sans-serif`}
