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
import {TEACHING_COMBOS,createTeachingCombo,comboStep,activeComboBlocks,setComboStep} from './authoring/teaching-combo-registry.js';
import {CONTENT_SLOT_SCHEMAS,readTemplateSlots,applyMappedContent} from './authoring/content-mapper.js';
import {variantOptions,setVisualVariant} from './authoring/visual-variants.js';
import {makeLifeU12AcceptanceFixture,LIFE_U12_FIXTURE_ID} from './authoring/pilot-life-u12.js';
import {learnerBlockReady} from './authoring/learner-preview-policy.js';
import {LEARNING_ARC,phaseForScreen,lessonArcSummary} from './authoring/learning-arc.js';
import {CERTIFIED_TEMPLATES,TEMPLATE_TOKENS,makeCertifiedTemplate,changeCertifiedVariant,validateCertifiedTemplate,applyCertifiedTemplate,draftSourceFromScreen,certifiedLayoutSignature,certifiedSourceSignature} from './authoring/certified-templates.js';
import {renderCertifiedVisual,renderCertifiedEditor} from './authoring/certified-template-render.js';
import {evaluateCertifiedGates,certifiedGroupStatus} from './authoring/certification-gates.js';
import {showTemplateReviewGallery,acceptedLayoutVariants} from './authoring/template-review-gallery.js';
import {showMethodReviewGallery} from './authoring/method-review-gallery.js';
import {createMethodTemplateScreen,renderMethodTemplateCanvas,renderMethodTemplateProperties,changeMethodStep} from './authoring/method-template-builder.js';
import {METHOD_COMBOS} from './authoring/method-combo-catalog.js';
import {FUNCTION_SLIDES,createFunctionalSlide,renderFunctionalSlide,renderFunctionalSlideProps} from './authoring/functional-slide-library.js';
import {mountLayoutEditor,resetLayout,layoutSnapshot,createLayoutHistory,saveLayoutPreset,listLayoutPresets,applyLayoutPreset} from './authoring/visual-layout-editor.js';

const root=document.getElementById('studio');
let verifiedUser=null;
try{
  const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
  if(response.ok){const data=await response.json();if(['admin','teacher'].includes(data?.user?.role))verifiedUser=data.user;}
}catch(_){}
const ctx=new ELeapRuntimeContext({role:verifiedUser?.role||'guest'});
const teacherPermissions=[...(Array.isArray(verifiedUser?.permissions)?verifiedUser.permissions:[]),...(Array.isArray(verifiedUser?.capabilities)?verifiedUser.capabilities:[]),...(Array.isArray(verifiedUser?.grants)?verifiedUser.grants:[])];
const canOpenStudio=verifiedUser?.role==='admin'||(verifiedUser?.role==='teacher'&&teacherPermissions.some(p=>['content:edit','content:manage','studio:edit'].includes(typeof p==='string'?p:p?.id||p?.name)));

const qs=new URLSearchParams(location.search);
const source=qs.get('source')||'';
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const clone=modelClone;
const uid=modelUid;
const DEFAULT_THEME=E_LEAP_THEME_DEFAULT;
const THEMES=E_LEAP_THEME_PRESETS;
const LIBRARY=E_LEAP_AUTHORING_LIBRARY;
const saveService=new ELeapAuthoringSaveService();
let lesson=null, selectedScreen=0, selectedBlock=0, dirty=false, previewRole='teacher', autosaveTimer=null;
let draftKey='';
let layoutEditMode=false;
const layoutHistory=createLayoutHistory();
const certifiedQuestionIndex=new Map(),certifiedAnswers=new Set(),certifiedResponses=new Map();

if(!canOpenStudio){
  const next=encodeURIComponent(location.pathname+location.search);
  root.innerHTML=`<section class="studio-denied"><div class="studio-kicker">E-LEAP Studio</div><h1>${verifiedUser?'Studio permission required':'Sign in to E-LEAP'}</h1><p>${verifiedUser?'Your account is signed in but does not have the Studio content-edit grant. An administrator can assign this permission.':'Sign in with an Administrator account or an authorized Teacher account.'}</p>${!verifiedUser?`<a class="studio-btn primary" href="../signin.html?next=${next}">Sign in</a>`:''}<p><a href="../index.html">Back to Platform</a></p></section>`;
}else if(qs.get('view')==='methods'){
  showMethodReviewGallery(root,{backUrl:'./index.html?view=gallery'});
}else if(qs.get('view')==='gallery'){
  showTemplateReviewGallery(root,{backUrl:'./index.html?view=builder'});
}else{
  lesson=await loadLesson();
  ensureSchema();
  draftKey=`e-leap-studio-v1:${source||lesson.id||'new'}`;
  const saved=localStorage.getItem(draftKey);
  if(saved && !qs.get('fresh')){try{lesson=JSON.parse(saved);ensureSchema();}catch{}}
  render();
}

async function loadLesson(){
  if(qs.get('pilot')==='life-u12')return makeLifeU12AcceptanceFixture();
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
function currentBlock(){return currentScreen().blocks[selectedBlock]||activeComboBlocks(currentScreen())[0]||currentScreen().blocks[0]}
function markDirty(){dirty=true;status('Unsaved changes');clearTimeout(autosaveTimer);autosaveTimer=setTimeout(saveDraft,700)}
function saveDraft(){localStorage.setItem(draftKey,JSON.stringify(lesson));dirty=false;status('Saving draft…');saveService.saveDraft(lesson).then(r=>status(r.mode==='server'?'Draft saved to server':'Draft saved locally')).catch(()=>status('Draft saved locally'))}
function status(msg){const e=document.querySelector('[data-studio-status]');if(e)e.textContent=msg}

function render(){
  const s=currentScreen(); if(selectedBlock>=s.blocks.length)selectedBlock=Math.max(0,s.blocks.length-1);
  if(s.combo&&!activeComboBlocks(s).includes(s.blocks[selectedBlock]))selectedBlock=Math.max(0,s.blocks.indexOf(activeComboBlocks(s)[0]));
  root.innerHTML=`<section class="studio-shell">
    <header class="studio-topbar">
      <div class="studio-brand"><div class="studio-logo">E</div><div><b>E-LEAP Authoring Studio</b><small data-studio-status>${dirty?'Unsaved changes':'Draft ready'}</small></div></div>
      <div class="studio-top-actions">
        <a class="studio-btn primary" href="./index.html?view=gallery" target="_blank" rel="noopener">Template Gallery & Review</a><a class="studio-btn" href="./index.html?view=methods" target="_blank" rel="noopener">Teaching Combo Library</a><button class="studio-btn" data-open-template-gallery>Choose Template</button><a class="studio-btn" href="../index.html">← Platform</a><a class="studio-btn" href="?pilot=life-u12" title="Open the canonical LIFE Unit 12 acceptance draft">LIFE U12 pilot</a><button class="studio-btn" data-new>New lesson</button><button class="studio-btn" data-duplicate-lesson>Duplicate</button><button class="studio-btn" data-quality>Quality check</button><button class="studio-btn" data-export>Export JSON</button><button class="studio-btn" data-save>Save draft</button><button class="studio-btn primary" data-publish>${verifiedUser?.role==='admin'?'Publish candidate':'Request publish'}</button>
      </div>
    </header>
    <div class="studio-layout">
      <aside class="studio-left"><div class="studio-pane-head"><div><h2>Lesson</h2><small>${esc(lesson.lessonNumber||'')} · ${esc(lesson.title||'')}</small></div></div><div class="studio-arc-strip" aria-label="Lesson learning arc">${LEARNING_ARC.map(p=>`<span title="${esc(p.purpose)}" class="${phaseForScreen(s)===p.id?'active':''}">${esc(p.label)}</span>`).join('')}</div><div class="slide-list">${lesson.screens.map((x,i)=>slideItem(x,i)).join('')}</div><div class="left-footer"><button class="studio-btn primary" data-add-slide style="width:100%">+ Add slide</button></div></aside>
      <main class="studio-center"><div class="canvas-toolbar"><div class="studio-preview-modes"><b style="font-size:13px">Preview as</b>${['teacher','admin','student','guest','presentation'].map(r=>`<button class="studio-btn ${previewRole===r?'primary':''}" data-preview-role="${r}">${cap(r)}</button>`).join('')}</div><div class="studio-layout-tools">
 <button type="button" class="studio-btn ${layoutEditMode?'primary':''}" data-layout-toggle ${['student','guest','presentation'].includes(previewRole)?'disabled':''}>${layoutEditMode?'Finish layout':'Edit layout'}</button>
 ${layoutEditMode?'<button type="button" class="studio-btn" data-layout-undo>Undo</button><button type="button" class="studio-btn" data-layout-redo>Redo</button><button type="button" class="studio-btn" data-layout-reset>Reset layout</button><button type="button" class="studio-btn" data-layout-save-preset>Save as My Template</button>':''}${layoutEditMode&&listLayoutPresets(localStorage,s).length?'<select class="studio-layout-presets" data-layout-preset-select><option value="">My Templates…</option>'+listLayoutPresets(localStorage,s).map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('')+'</select>':''}
 <span class="status">${esc(s.stage)} · Slide ${selectedScreen+1}/${lesson.screens.length}</span></div></div>${renderCanvas(s)}</main>
      <aside class="studio-right"><div class="studio-pane-head"><div><h2>Properties</h2><small>${currentBlock()?cap(typeLabel(currentBlock().type)):'Slide'}</small></div></div><div class="properties">${renderProperties()}</div></aside>
    </div>
    ${renderAddDialog()}${renderQualityPanel()}
  </section>`;
  wire();
}
function slideItem(s,i){return `<button class="slide-item ${i===selectedScreen?'active':''}" data-slide="${i}"><span class="slide-thumb">${i+1}</span><span class="slide-title"><b>${esc(s.title||'Untitled')}</b><small>${esc(s.stage||'Slide')}</small></span><span class="slide-more">⋮</span></button>`}
function renderCanvas(s){if(s.functionalDraft)return renderFunctionalSlide(s,previewRole);if(s.methodDraft)return renderMethodTemplateCanvas(s,previewRole);if(s.certifiedTemplate)return renderCertifiedVisual(s,previewRole,certifiedQuestionIndex.get(s.id)||0,certifiedAnswers.has(s.id),certifiedResponses.get(s.id+':'+(certifiedQuestionIndex.get(s.id)||0))||'');const t=lesson.theme;return `<div class="canvas-wrap" style="--canvas-font:${cssFont(t.fontFamily)};--canvas-title-size:${Number(t.titleSize)||36}px;--canvas-body-size:${Number(t.bodySize)||18}px;--canvas-text:${safeColor(t.textColor,'#173f38')};--canvas-accent:${safeColor(t.accentColor,'#0d7d6d')};--canvas-bg:${safeColor(t.backgroundColor,'#fff')}"><div class="preview-strip"><b>${cap(previewRole)} preview</b><span>${esc(t.preset)} · ${esc(t.fontFamily)}</span></div><section class="lesson-canvas layout-${esc(s.layout||'standard')} template-${esc(s.templateId||'custom')} variant-${esc(s.visualVariant||'default')} preview-${esc(previewRole)}"><header class="canvas-hero"><div class="canvas-kicker">${esc(s.stage||'')}</div><h1 class="canvas-title" contenteditable="${!['student','guest','presentation'].includes(previewRole)}" data-edit="screen-title">${esc(s.title||'')}</h1><p class="canvas-instruction" contenteditable="${!['student','guest','presentation'].includes(previewRole)}" data-edit="screen-instruction">${esc(s.instruction||'')}</p></header><div class="canvas-body">${renderComboSteps(s)}${s.blocks.map((b,i)=>renderBlock(b,i)).join('')}${['student','guest','presentation'].includes(previewRole)&&!s.blocks.some(b=>(!b.comboStep||b.comboStep===comboStep(s)?.id)&&learnerBlockReady(b))?'<p class="studio-no-content">This activity is not yet available.</p>':''}${['student','guest','presentation'].includes(previewRole)?'':'<div class="add-block"><button class="studio-btn primary" data-open-library>+ Add content / activity</button></div>'}</div></section></div>`}
function renderComboSteps(s){if(!s.combo?.steps?.length)return '';return `<nav class="combo-step-nav" aria-label="Learning steps">${s.combo.steps.map((step,i)=>`<button type="button" data-combo-step="${esc(step.id)}" class="combo-step-button ${comboStep(s)?.id===step.id?'active':''}" aria-current="${comboStep(s)?.id===step.id?'step':'false'}"><small>${i+1}</small>${esc(step.label)}</button>`).join('')}</nav>`}
function slotForBlock(b){return ['image','video','audio'].includes(b.type)?'media':b.type==='vocabulary'?'word-list':b.type==='grammar-note'?'grammar':b.type==='text'?'passage':'activity'}
function renderBlock(b,i){if(b.audience==='teacher'||b.audience==='internal')return '';if(b.comboStep&&comboStep(currentScreen())?.id!==b.comboStep)return '';if(!learnerBlockReady(b)&&['student','guest','presentation'].includes(previewRole))return '';return `<section class="block ${i===selectedBlock?'selected':''}" data-slot="${slotForBlock(b)}" data-block="${i}">${blockPreview(b)}</section>`}
function allowedMediaUrl(src){const s=String(src||'').trim();return (/^https:\/\/[^\s"'<>]+$/i.test(s)||/^(?:\/(?!\/)|\.\.?\/)[^\s"'<>]+$/.test(s))?s:''}
function blockPreview(b){
  const visibleLabels=!(['student','guest','presentation'].includes(previewRole));
  if(b.type==='text')return `<div class="studio-text-role role-${esc(b.content?.role||'body')}" contenteditable="${!['student','guest','presentation'].includes(previewRole)}" data-edit="block-text">${esc(b.content?.text||'')}</div>`;
  if(b.type==='image'&&['student','guest','presentation'].includes(previewRole)&&!b.content?.src&&!b.content?.assetId)return '<div class="media-placeholder">Image unavailable</div>';
  if(b.type==='image'&&allowedMediaUrl(b.content?.src))return `<div class="block-label" ${visibleLabels?'':'hidden'}>Image</div><figure class="studio-asset"><img loading="lazy" src="${esc(allowedMediaUrl(b.content.src))}" alt="${esc(b.content?.alt||'')}"/><figcaption>${esc(b.content?.caption||'')}</figcaption></figure>`;
  if(b.type==='image')return `<div class="block-label" ${visibleLabels?'':'hidden'}>Image</div><div class="media-placeholder"><div><strong>▧ ${esc(b.content?.caption||'Image')}</strong>${b.content?.src?esc(b.content.src):(b.content?.assetId?`Asset: ${esc(b.content.assetId)}`:'Choose an image from Media Library or paste a media path.')}</div></div>`;
  if(b.type==='audio'&&['student','guest','presentation'].includes(previewRole)&&!b.content?.src&&!b.content?.assetId)return '<div class="media-placeholder">Audio unavailable</div>';
  if(b.type==='audio'&&allowedMediaUrl(b.content?.src))return `<div class="block-label" ${visibleLabels?'':'hidden'}>Audio</div><audio controls preload="none" src="${esc(allowedMediaUrl(b.content.src))}"></audio>`;
  if(b.type==='audio')return `<div class="block-label" ${visibleLabels?'':'hidden'}>Audio</div><div class="media-placeholder"><div><strong>♪ ${esc(b.content?.label||'Audio')}</strong>${b.content?.src?esc(b.content.src):(b.content?.assetId?`Asset: ${esc(b.content.assetId)}`:'Add audio source')}</div></div>`;
  if(b.type==='video'&&['student','guest','presentation'].includes(previewRole)&&!b.content?.src&&!b.content?.assetId)return '<div class="media-placeholder">Video unavailable</div>';
  if(b.type==='video'&&allowedMediaUrl(b.content?.src))return `<div class="block-label" ${visibleLabels?'':'hidden'}>Video</div><video controls preload="metadata" src="${esc(allowedMediaUrl(b.content.src))}"></video>`;
  if(b.type==='video')return `<div class="block-label" ${visibleLabels?'':'hidden'}>Video</div><div class="media-placeholder"><div><strong>▶ ${esc(b.content?.label||'Video')}</strong>${b.content?.src?esc(b.content.src):(b.content?.assetId?`Asset: ${esc(b.content.assetId)}`:'Add video source')}</div></div>`;
  if(b.type==='vocabulary')return `<div class="block-label" ${visibleLabels?'':'hidden'}>Vocabulary</div><div class="activity-card">${(b.content?.items||[]).map(x=>`<p><b>${esc(x.word)}</b> — ${esc(x.meaning)} <small>${esc(x.example||'')}</small></p>`).join('')}</div>`;
  if(b.type==='grammar-note')return `<div class="block-label" ${visibleLabels?'':'hidden'}>Grammar note</div><div class="activity-card"><h3>${esc(b.content?.rule||'Rule')}</h3><p><b>${esc(b.content?.form||'')}</b></p>${(b.content?.examples||[]).map(x=>`<p>${esc(x)}</p>`).join('')}</div>`;
  const a=b.activity||{};return `<div class="block-label" ${visibleLabels?'':'hidden'}>${esc(typeLabel(b.type))}</div><div class="activity-card"><div class="activity-prompt">${esc(a.prompt||'')}</div>${activityDemo(b.type,a)}${visibleLabels?`<div class="interaction-row">${controlChips(b.type,a).map(x=>`<span class="${x.on?'on':''}">${esc(x.label)}</span>`).join('')}</div>`:''}</div>`;
}
function activityDemo(type,a){
  if(['mcq','multi-select','true-false','poll','listening','video-question'].includes(type))return `<div class="option-list">${(a.options||[]).map(o=>`<div class="option-demo"><i>${esc(o.id||'')}</i><span>${esc(o.label||'')}</span></div>`).join('')}</div>`;
  if(type==='fill')return (a.items||[]).map(x=>{
    const e=a.evidenceByItem?.[x.id],authorised=['teacher','admin','presentation'].includes(previewRole);
    return `<div class="evidence-question"><div class="option-demo">${esc(x.prompt||'')} <b>[ answer ]</b></div>${e&&authorised?`<div class="evidence-actions"><button type="button" class="studio-btn" data-evidence-quote="${esc(e.quote)}">Evidence</button><button type="button" class="studio-btn" data-evidence-why="${esc(e.why)}">Why?</button></div>`:''}</div>`;
   }).join('')+`<div class="studio-evidence-note" aria-live="polite" hidden></div>`;
  if(type==='matching')return '<div class="option-list">'+(a.pairs||[]).map(x=>{
    const e=a.evidenceByItem?.[x.id],authorised=['teacher','admin','presentation'].includes(previewRole);
    return '<div class="evidence-question"><div class="option-demo"><b>'+esc(x.left)+'</b><span>↔ '+(authorised?esc(x.right):'?')+'</span></div>'+
      (e&&authorised?'<div class="evidence-actions"><button type="button" class="studio-btn" data-evidence-quote="'+esc(e.quote)+'">Evidence</button><button type="button" class="studio-btn" data-evidence-why="'+esc(e.why)+'">Why?</button></div>':'')+'</div>';
   }).join('')+'</div><div class="studio-evidence-note" aria-live="polite" hidden></div>';
  if(type==='ordering')return `<div class="option-list">${(a.items||[]).map((x,i)=>`<div class="option-demo"><i>${i+1}</i>${esc(x.text)}</div>`).join('')}</div>`;
  if(type==='categorising')return `<div class="option-list">${(a.categories||[]).map(c=>`<div class="option-demo"><b>${esc(c)}</b></div>`).join('')}</div>`;
  if(['writing','discussion'].includes(type))return `<div class="media-placeholder">${esc(a.placeholder||'Type response…')}</div>`;
  if(type==='speaking-record')return `<div class="media-placeholder"><div><strong>● Record response</strong>Maximum ${Number(a.maxSeconds)||120} seconds</div></div>`;
  if(['click-reveal','flashcards'].includes(type))return `<div class="option-list">${(a.items||[]).map(x=>`<div class="option-demo"><b>${esc(x.question||'')}</b><span>→ ${previewRole==='student'?'Hidden until allowed':esc(x.answer||'')}</span></div>`).join('')}</div>`;
  return `<div class="media-placeholder">Activity preview</div>`;
}
function controlChips(type,a){const objective=['mcq','multi-select','true-false','fill','matching','ordering','categorising','listening','video-question'].includes(type);const productive=['writing','discussion','speaking-record'].includes(type);const role=previewRole==='presentation'?'teacher':previewRole;const model=controlModelForRole({role,presentation:previewRole==='presentation',capabilities:{check:objective,reset:true,reveal:objective||Boolean(a?.modelAnswer||a?.answerKey),submit:objective||productive,score:objective}});return model.map(c=>({label:c.label,on:c.enabled}));}
function renderCertifiedGatePanel(screen){
 const data=screen.certifiedTemplate;if(!data)return '';
 const items=evaluateCertifiedGates(screen);
 const outcome=certifiedGroupStatus(screen);
 return '<section class="property-section cert-qa-panel"><h3>Template QA · '+esc(outcome)+'</h3>'+
 items.map(item=>'<div class="cert-qa-item"><strong>'+esc(item.label)+'</strong><span class="cert-qa-status '+esc(item.status)+'">'+esc(item.status)+'</span><p>'+esc(item.note)+'</p></div>').join('')+
 '</section>';
}
function renderCertifiedProperties(){const s=currentScreen();if(s.certifiedTemplate)return renderCertifiedEditor(s)+renderCertifiedGatePanel(s);const family=({'lesson-cover':'cover','lesson-aims':'aims','lead-in':'opener'})[s.templateId];return family?'<section class="property-section"><h3>Certified template</h3><button class="studio-btn primary" data-certify-current="'+family+'">Convert slide to certified '+family+' template</button><p class="helper">Existing source blocks are preserved. Complete the fixed template slots before publishing.</p></section>':'';}
function renderProperties(){return currentScreen().functionalDraft?`${lessonProps()}${renderFunctionalSlideProps(currentScreen())}`:currentScreen().methodDraft?`${lessonProps()}${renderMethodTemplateProperties(currentScreen())}`:`${lessonProps()}${slideProps()}${renderCertifiedProperties()}${currentScreen().certifiedTemplate?'':renderContentMapper()+blockProps()}`}
function renderContentMapper(){
  const s=currentScreen(),schema=CONTENT_SLOT_SCHEMAS[s.templateId];if(!schema)return '';
  const existing=readTemplateSlots(s);
  const fields=Object.entries(schema.slots).map(([key,slot])=>{
    const v=esc(existing[key]||'');
    return `<div class="studio-field"><label>${esc(slot.label)}</label>${['textarea','rows'].includes(slot.kind)?`<textarea data-map-key="${esc(key)}" maxlength="${slot.max}">${v}</textarea>`:`<input type="text" data-map-key="${esc(key)}" maxlength="${slot.max}" value="${v}">`}</div>`;
  }).join('');
  return `<section class="property-section studio-mapper"><h3>Fill template · ${esc(schema.label)}</h3>${fields}<button class="studio-btn primary" type="button" data-apply-mapping>Apply to slide</button><p class="helper">Teacher notes are edited separately and never inserted into learner content.</p></section>`;
}
function lessonProps(){const t=lesson.theme;return `<section class="property-section"><h3>Lesson</h3>${field('Lesson title','lesson.title',lesson.title)}<div class="field-row">${field('Course','lesson.courseLabel',lesson.courseLabel||'')}${field('Lesson no.','lesson.lessonNumber',lesson.lessonNumber||'')}</div></section><section class="property-section"><h3>Theme & typography</h3>${select('Theme preset','theme.preset',t.preset,Object.keys(THEMES))}${select('Font','theme.fontFamily',t.fontFamily,E_LEAP_ALLOWED_FONTS)}${select('Use as','lesson.deliveryPolicy',lesson.deliveryPolicy?.id||'practice',Object.keys(E_LEAP_DELIVERY_POLICIES))}<div class="field-row">${numField('Title size','theme.titleSize',t.titleSize,28,52)}${numField('Body size','theme.bodySize',t.bodySize,14,26)}</div><div class="field-row">${colorField('Text','theme.textColor',t.textColor)}${colorField('Accent','theme.accentColor',t.accentColor)}</div>${colorField('Background','theme.backgroundColor',t.backgroundColor)}<div class="token-note">Default styling is inherited by every slide. Use overrides only when necessary so lessons stay consistent.</div></section>`}
function slideProps(){const s=currentScreen();return `<section class="property-section"><h3>Current slide</h3>${select('Teaching phase','screen.learningPhase',phaseForScreen(s),LEARNING_ARC.map(p=>p.id))}${field('Stage','screen.stage',s.stage||'')}${field('Title','screen.title',s.title||'')}${area('Instruction for learners','screen.instruction',s.instruction||'')}${area('Teacher notes (not shown to learners)','screen.teacherNotes',s.teacherNotes||'')}${variantOptions(s.templateId)?select('Visual design','screen.visualVariant',s.visualVariant||Object.keys(variantOptions(s.templateId))[0],Object.keys(variantOptions(s.templateId))):select('Layout','screen.layout',s.layout||'standard',E_LEAP_LAYOUT_IDS)}<div class="studio-inline-actions"><button class="studio-btn" data-slide-up ${selectedScreen===0?'disabled':''}>↑</button><button class="studio-btn" data-slide-down ${selectedScreen===lesson.screens.length-1?'disabled':''}>↓</button><button class="studio-btn" data-duplicate-slide>Duplicate</button><button class="studio-btn danger" data-delete-slide ${lesson.screens.length===1?'disabled':''}>Delete</button></div></section>`}
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
function renderAddDialog(){return `<div class="add-panel" data-add-panel><div class="add-dialog"><div class="add-dialog-head"><div><h2>Add content or activity</h2><small>Choose a reusable E-LEAP block. Behavior comes from the shared engine.</small></div><button class="studio-btn" data-close-library>Close</button></div><div class="activity-library"><section class="library-group"><h3>Certified slide templates</h3><div class="library-grid">${Object.entries(CERTIFIED_TEMPLATES).map(([id,t])=>`<button class="library-card" data-add-certified="${id}" ${acceptedLayoutVariants(id).length?'':'disabled title="Review a layout in Template Gallery first"'}><div class="library-icon">▣</div><b>${esc(t.label)}</b><small>${acceptedLayoutVariants(id).length?esc(acceptedLayoutVariants(id).map(v=>t.variants.find(x=>x.id===v)?.label||v).join(' · ')):'Review in Template Gallery first'}</small></button>`).join('')}</div></section><section class="library-group"><h3>Lesson Cover / Consolidation / Thank You</h3><div class="library-grid">${Object.entries(FUNCTION_SLIDES).map(([key,t])=>`<button class="library-card" data-add-functional="${key}"><div class="library-icon">▣</div><b>${esc(t.label)}</b><small>${esc(t.description)}</small></button>`).join('')}</div></section><section class="library-group"><h3>Teaching combos · Warm-up / Lead-in first</h3><div class="library-grid">${['Warm-up / Lead-in','Vocabulary','Grammar','Listening','Reading','Speaking','Writing'].map(group=>Object.entries(METHOD_COMBOS).filter(([,m])=>m.group===group).map(([key,t])=>`<button class="library-card" data-add-combo="${key}"><div class="library-icon">◈</div><b>${esc(t.label)}</b><small>${esc(t.description)} · Structure only</small></button>`).join('')).join('')}</div></section><section class="library-group"><h3>Other activity templates · Draft</h3><div class="library-grid">${Object.entries(E_LEAP_SMART_TEMPLATES).filter(([key])=>!['cover','aims','leadin'].includes(key)).map(([key,t])=>`<button class="library-card" data-add-template="${key}"><div class="library-icon">✦</div><b>${esc(t.label)}</b><small>${esc(t.description)}</small></button>`).join('')}</div></section>${Object.entries(LIBRARY).map(([group,items])=>`<section class="library-group"><h3>${esc(group)}</h3><div class="library-grid">${items.map(([type,icon,label,desc])=>`<button class="library-card" data-add-type="${type}"><div class="library-icon">${icon}</div><b>${esc(label)}</b><small>${esc(desc)}</small></button>`).join('')}</div></section>`).join('')}</div></div></div>`}
function runQuality(){return auditLesson(lesson);}
function renderQualityPanel(){const issues=runQuality();const good=issues.filter(x=>x[0]==='error').length===0;return `<aside class="quality-panel" data-quality-panel><div class="quality-head"><b>Quality check</b><button class="studio-btn ghost" data-close-quality>×</button></div><div class="quality-body">${good?'<div class="quality-item ok">No blocking issues. Lesson can be staged for publishing.</div>':''}${issues.map(([k,m])=>`<div class="quality-item ${k}">${esc(m)}</div>`).join('')||'<div class="quality-item ok">All checks passed.</div>'}</div></aside>`}
function revealEvidence(quote){
  const textNode=document.querySelector('.lesson-canvas.template-reading-task .studio-text-role.role-body');
  if(!textNode)return false;
  textNode.querySelectorAll('mark.studio-evidence-highlight').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));
  textNode.normalize();
  const target=Array.from(textNode.childNodes).find(n=>n.nodeType===3&&n.textContent.includes(quote));
  if(!target)return false;
  const i=target.textContent.indexOf(quote),range=document.createRange();
  range.setStart(target,i);range.setEnd(target,i+quote.length);
  const mark=document.createElement('mark');mark.className='studio-evidence-highlight';
  range.surroundContents(mark);mark.scrollIntoView({behavior:'smooth',block:'nearest'});
  return true;
}
function wire(){
  const designCanvas=document.querySelector('.studio-center .lesson-canvas');
  mountLayoutEditor(designCanvas,currentScreen(),{
   enabled:layoutEditMode&&!['student','guest','presentation'].includes(previewRole),
   onChange:(before)=>{layoutHistory.change(currentScreen(),before);markDirty();status('Layout adjusted. Draft autosaved.');},
   onSelection:({label})=>status('Adjust: '+label+' · drag to move, corner to resize')
  });
  document.querySelector('[data-layout-toggle]')?.addEventListener('click',()=>{if(['student','guest','presentation'].includes(previewRole))return;layoutEditMode=!layoutEditMode;render()});
  document.querySelector('[data-layout-undo]')?.addEventListener('click',()=>{if(layoutHistory.undo(currentScreen())){markDirty();render();}});
  document.querySelector('[data-layout-redo]')?.addEventListener('click',()=>{if(layoutHistory.redo(currentScreen())){markDirty();render();}});
  document.querySelector('[data-layout-reset]')?.addEventListener('click',()=>{layoutHistory.change(currentScreen(),layoutSnapshot(currentScreen()));resetLayout(currentScreen());markDirty();render()});
  document.querySelector('[data-layout-save-preset]')?.addEventListener('click',()=>{
   const name=prompt('Name your visual template (positions and sizes only):');
   if(!name)return;
   if(saveLayoutPreset(localStorage,currentScreen(),name)){status('Saved My Template: '+name);render();}
   else status('Move or resize at least one region before saving a template.');
  });
  document.querySelector('[data-layout-preset-select]')?.addEventListener('change',e=>{
   const name=e.target.value;if(!name)return;
   const before=layoutSnapshot(currentScreen());
   if(applyLayoutPreset(localStorage,currentScreen(),name)){layoutHistory.change(currentScreen(),before);markDirty();render();}
  });

  const currentCertified=currentScreen().certifiedTemplate;
  if(currentCertified){
    const img=document.querySelector('.certified-canvas .cert-photo');
    if(img){
      const src=currentCertified.values.imageSrc;
      const record=loaded=>{
        if(currentScreen().certifiedTemplate!==currentCertified||currentCertified.values.imageSrc!==src)return;
        const was=currentCertified.mediaCheck?.loaded===true&&currentCertified.mediaCheck?.src===src;
        currentCertified.mediaCheck={src,loaded:Boolean(loaded)};
        if(!was&&loaded){markDirty();status('Image loaded. Quality check can validate this source.');}
        if(!loaded)status('Image failed to load. Replace the image before Publish.');
      };
      img.addEventListener('load',()=>record(img.naturalWidth>0));
      img.addEventListener('error',()=>record(false));
      if(img.complete)record(img.naturalWidth>0);
    }
    document.querySelector('[data-certify-review-source]')?.addEventListener('click',()=>{
      const data=currentScreen().certifiedTemplate;
      if(!data?.sourceReview?.required)return;
      const confirmed=confirm('Confirm every textbook activity and key idea is represented in the certified slots? Content omitted from the learner slide will not be displayed.');
      if(!confirmed)return;
      data.sourceReview={required:true,approved:true,contentSignature:JSON.stringify(data.values),sourceSignature:certifiedSourceSignature(currentScreen().blocks)};
      markDirty();render();
    });
    const visual=document.querySelector('.certified-canvas');
    if(visual){
      requestAnimationFrame(()=>{
        if(!visual.isConnected)return;
        const parts=visual.querySelectorAll('.cert-aim-card,.cert-opener-task,.cert-cover-identity,.cert-cover-content,.cert-aim-card ol,.cert-target');
        const nodes=[visual,...parts];
        const overflow=nodes.some(el=>el.scrollHeight>el.clientHeight+3||el.scrollWidth>el.clientWidth+3);
        // Layout sign-off is tied to the exact design and content; switching
        // variants or editing text invalidates the previous check automatically.
        const signature=certifiedLayoutSignature(currentCertified);
        const last=currentCertified.layoutReview;
        const changed=last?.signature!==signature||last?.passed!==!overflow;
        currentCertified.layoutReview={signature,passed:!overflow,checkedAt:new Date().toISOString()};
        if(changed)markDirty();
        if(overflow){visual.dataset.visualOverflow='true';status('Layout overflow detected: shorten content or choose another design.');}
      });
    }
  }
  document.querySelector('[data-open-template-gallery]')?.addEventListener('click',()=>document.querySelector('[data-add-panel]')?.classList.add('open'));
  document.querySelectorAll('[data-add-certified]').forEach(b=>b.onclick=()=>{
    const family=b.dataset.addCertified;
    const reviewed=acceptedLayoutVariants(family);if(!reviewed.length){status('Review and accept a layout in Template Gallery first.');return;}
    const templateId=CERTIFIED_TEMPLATES[family]?.templateId;if(!templateId)return;
    // A cover is always the first slide. Converting a matching slide keeps its source.
    // Adding an unrelated family creates only one new slide.
    const same=currentScreen().templateId===templateId;
    const index=family==='cover'?0:same?selectedScreen:-1;
    const original=index>=0?lesson.screens[index]:modelCreateScreen(family==='aims'?'Aims':'Opener','');
    const data=original.certifiedTemplate?.family===family?clone(original.certifiedTemplate):(draftSourceFromScreen(original,family)||makeCertifiedTemplate(family));
    if(!reviewed.includes(data.variant))data.variant=reviewed[0];
    const result=applyCertifiedTemplate(original,data);if(!result.ok)return;
    if(index>=0){lesson.screens[index]=result.screen;selectedScreen=index;}
    else {lesson.screens.splice(selectedScreen+1,0,result.screen);selectedScreen++;}
    selectedBlock=0;markDirty();render();
  });
  document.querySelectorAll('[data-certify-current]').forEach(b=>b.onclick=()=>{
    const data=draftSourceFromScreen(currentScreen(),b.dataset.certifyCurrent);
    const result=applyCertifiedTemplate(currentScreen(),data);if(!result.ok)return;
    lesson.screens[selectedScreen]=result.screen;markDirty();render();
  });
  document.querySelectorAll('[data-certified-variant]').forEach(b=>b.onclick=()=>{
    const next=changeCertifiedVariant(currentScreen().certifiedTemplate,b.dataset.certifiedVariant);
    if(!next)return;currentScreen().certifiedTemplate=next;markDirty();render();
  });
  document.querySelectorAll('[data-certified-slot]').forEach(el=>el.addEventListener('change',()=>{
    const data=currentScreen().certifiedTemplate;
    const key=el.dataset.certifiedSlot;
    data.values[key]=el.value;
    if(key==='imageSrc')data.mediaCheck=null;
    if(data.sourceReview?.required){data.sourceReview.approved=false;data.sourceReview.contentSignature='';}
    markDirty();render();
  }));
  document.querySelector('[data-certified-response]')?.addEventListener('input',e=>{const s=currentScreen();certifiedResponses.set(s.id+':'+(certifiedQuestionIndex.get(s.id)||0),e.target.value)});
  document.querySelector('[data-certified-reset]')?.addEventListener('click',()=>{const id=currentScreen().id;certifiedResponses.delete(id+':'+(certifiedQuestionIndex.get(id)||0));certifiedAnswers.delete(id);render()});
  document.querySelectorAll('[data-certified-question]').forEach(b=>b.onclick=()=>{
    const key=currentScreen().id;
    certifiedQuestionIndex.set(key,Number(b.dataset.certifiedQuestion));certifiedAnswers.delete(key);render();
  });
  document.querySelector('[data-certified-reveal]')?.addEventListener('click',()=>{
    if(!['teacher','admin','presentation'].includes(previewRole))return;
    const key=currentScreen().id;certifiedAnswers.has(key)?certifiedAnswers.delete(key):certifiedAnswers.add(key);render();
  });
  document.querySelectorAll('[data-combo-step]').forEach(b=>b.onclick=()=>{if(!setComboStep(currentScreen(),b.dataset.comboStep))return;const blocks=activeComboBlocks(currentScreen());selectedBlock=Math.max(0,currentScreen().blocks.indexOf(blocks[0]));markDirty();render()});
  document.querySelectorAll('[data-evidence-quote]').forEach(button=>button.addEventListener('click',()=>{
    const ok=revealEvidence(button.dataset.evidenceQuote);
    const note=document.querySelector('.studio-evidence-note');
    if(note){note.hidden=false;note.textContent=ok?'Evidence highlighted in the reading.':'Evidence source not found; review the reading text.';}
  }));
  document.querySelectorAll('[data-evidence-why]').forEach(button=>button.addEventListener('click',()=>{
    const note=document.querySelector('.studio-evidence-note');if(note){note.hidden=false;note.textContent=button.dataset.evidenceWhy;}
  }));
  document.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{selectedScreen=+b.dataset.slide;selectedBlock=0;render()});
  document.querySelectorAll('[data-block]').forEach(b=>b.onclick=e=>{if(e.target.closest('[contenteditable],[data-evidence-quote],[data-evidence-why]'))return;selectedBlock=+b.dataset.block;render()});
  document.querySelectorAll('[data-preview-role]').forEach(b=>b.onclick=()=>{previewRole=b.dataset.previewRole;certifiedAnswers.clear();render()});
  document.querySelector('[data-open-library]')?.addEventListener('click',()=>document.querySelector('[data-add-panel]').classList.add('open'));
  document.querySelector('[data-close-library]')?.addEventListener('click',()=>document.querySelector('[data-add-panel]').classList.remove('open'));
  document.querySelectorAll('[data-add-type]').forEach(b=>b.onclick=()=>{const next=newBlock(b.dataset.addType);if(currentScreen().combo)next.comboStep=comboStep(currentScreen()).id;currentScreen().blocks.splice(selectedBlock+1,0,next);selectedBlock++;markDirty();render()});
  document.querySelector('[data-apply-mapping]')?.addEventListener('click',()=>{
    const values={};document.querySelectorAll('[data-map-key]').forEach(el=>values[el.dataset.mapKey]=el.value);
    const result=applyMappedContent(currentScreen(),values);
    if(!result.ok){status(result.errors.join(' '));return;}
    lesson.screens[selectedScreen]=result.screen;markDirty();render();status('Template content updated');
  });
  document.querySelectorAll('[data-add-functional]').forEach(b=>b.onclick=()=>{const screen=createFunctionalSlide(b.dataset.addFunctional);if(!screen)return;lesson.screens.splice(selectedScreen+1,0,screen);selectedScreen++;selectedBlock=0;markDirty();render()});
  document.querySelectorAll('[data-functional-variant]').forEach(b=>b.onclick=()=>{const draft=currentScreen().functionalDraft;if(!draft||!FUNCTION_SLIDES[draft.type]?.variants.includes(b.dataset.functionalVariant))return;draft.variant=b.dataset.functionalVariant;markDirty();render()});
  document.querySelectorAll('[data-add-combo]').forEach(b=>b.onclick=()=>{const screen=createMethodTemplateScreen(b.dataset.addCombo);if(!screen){status('Method template is not available for review.');return;}lesson.screens.splice(selectedScreen+1,0,screen);selectedScreen++;selectedBlock=0;markDirty();render()});
  document.querySelectorAll('[data-method-draft-step]').forEach(b=>b.onclick=()=>{if(changeMethodStep(currentScreen(),b.dataset.methodDraftStep))render()});
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
  document.querySelector('[data-publish]')?.addEventListener('click',()=>{const blocking=runQuality().filter(x=>x[0]==='error');status(blocking.length?`Fix ${blocking.length} blocking issue(s) before publish`:(verifiedUser?.role==='admin'?'Publishing candidate…':'Publish request staged for review'));if(blocking.length){document.querySelector('[data-quality-panel]').classList.add('open')}else if(verifiedUser?.role==='admin'){saveService.publish(lesson).then(()=>status('Server acknowledged publication request. Verify the published version before sharing.')).catch(error=>{status('Publish failed: '+error.message);document.querySelector('[data-quality-panel]')?.classList.add('open')})}});
  document.querySelector('[data-new]')?.addEventListener('click',()=>{if(!confirm('Start a new lesson? Your current draft remains saved locally.'))return;lesson=modelCreateLesson();selectedScreen=selectedBlock=0;draftKey=`e-leap-studio-v1:${lesson.id}`;markDirty();render()});
  document.querySelector('[data-duplicate-lesson]')?.addEventListener('click',()=>{lesson=modelDuplicateLesson(lesson);draftKey=`e-leap-studio-v1:${lesson.id}`;markDirty();render()});
}
function renderSoft(){/* Inputs remain active; full render happens on structural actions or blur. */}
function move(arr,index,delta,after){const to=index+delta;if(to<0||to>=arr.length)return;[arr[index],arr[to]]=[arr[to],arr[index]];after();markDirty();render()}
function applyPath(path,value){
  if(path==='theme.preset'){lesson.theme=applyThemePreset(lesson.theme,value);render();return}
  if(path==='screen.visualVariant'){const result=setVisualVariant(currentScreen(),value);if(result.ok){lesson.screens[selectedScreen]=result.screen;render()}return}
  if(path==='lesson.deliveryPolicy'){lesson.deliveryPolicy=normaliseDeliveryPolicy({id:value});render();return}
  const b=currentBlock(),a=b?.activity;
  if(path==='lesson.title')lesson.title=value;else if(path==='lesson.courseLabel')lesson.courseLabel=value;else if(path==='lesson.lessonNumber')lesson.lessonNumber=value;else if(path.startsWith('theme.'))lesson.theme[path.split('.')[1]]=value;else if(path==='screen.stage')currentScreen().stage=value;else if(path==='screen.learningPhase')currentScreen().learningPhase=value;else if(path==='screen.title')currentScreen().title=value;else if(path==='screen.instruction')currentScreen().instruction=value;else if(path==='screen.teacherNotes')currentScreen().teacherNotes=value;else if(path==='screen.layout')currentScreen().layout=value;
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
