import {E_LEAP_THEME_DEFAULT} from '../theme-tokens.js';
import {normaliseDeliveryPolicy} from '../assessment-policy.js';
import {isContentBlock,createContentPayload} from './content-block-registry.js';
import {normaliseLayout} from './layout-registry.js';

export const AUTHORING_SCHEMA_VERSION='1.2';
export const clone=x=>JSON.parse(JSON.stringify(x));
export const uid=(p='x')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

export function defaultActivityPrompt(type){return ({mcq:'Choose the correct answer.','multi-select':'Choose all correct answers.','true-false':'Is the statement true or false?',fill:'Complete the sentence.',matching:'Match the items.',ordering:'Put the items in the correct order.',categorising:'Sort the items into the correct groups.',listening:'Listen and answer.','video-question':'Watch and answer.','speaking-record':'Record your response.',writing:'Write your response.',discussion:'Share your response.',poll:'Choose one option.','click-reveal':'Click to reveal.',flashcards:'Review the cards.'})[type]||'Activity';}

export function normaliseActivity(a={},type){
  a={...a,type,id:a.id||uid('activity'),prompt:a.prompt||defaultActivityPrompt(type),policy:{studentSubmit:!['click-reveal','flashcards'].includes(type),studentReveal:false,teacherReveal:true,...(a.policy||{})},points:Number.isFinite(+a.points)?+a.points:1};
  if(['mcq','multi-select','true-false','poll'].includes(type)){
    a.options=a.options?.length?a.options:(type==='true-false'?[{id:'T',label:'True'},{id:'F',label:'False'}]:[{id:'A',label:'Option A'},{id:'B',label:'Option B'}]);
    if(type!=='poll')a.answerKey=a.answerKey?.length?a.answerKey:[a.options[0].id];
  }
  if(type==='fill')a.items=a.items?.length?a.items:[{id:'1',prompt:'Sentence with a blank: _____.',answers:['answer']}];
  if(type==='matching')a.pairs=a.pairs?.length?a.pairs:[{id:'1',left:'Item 1',right:'Match 1'},{id:'2',left:'Item 2',right:'Match 2'}];
  if(type==='ordering'){a.items=a.items?.length?a.items:[{id:'1',text:'First'},{id:'2',text:'Second'}];a.answerKey=a.answerKey?.length?a.answerKey:a.items.map(x=>x.id);}
  if(type==='categorising'){a.categories=a.categories?.length?a.categories:['Group A','Group B'];a.items=a.items?.length?a.items:[{id:'1',text:'Item 1',category:a.categories[0]}];}
  if(['writing','discussion'].includes(type)){a.placeholder=a.placeholder||'Type your response here…';a.rubric=a.rubric||'';a.modelAnswer=a.modelAnswer||'';}
  if(type==='speaking-record'){a.maxSeconds=a.maxSeconds||120;a.rubric=a.rubric||'';}
  if(['listening','video-question'].includes(type)){a.media=a.media||{assetId:null,src:'',kind:type==='listening'?'audio':'video'};a.responseType=a.responseType||'mcq';a.options=a.options?.length?a.options:[{id:'A',label:'Option A'},{id:'B',label:'Option B'}];a.answerKey=a.answerKey?.length?a.answerKey:['A'];}
  if(['click-reveal','flashcards'].includes(type))a.items=a.items?.length?a.items:[{question:'Prompt',answer:'Answer'}];
  return a;
}

export function createBlock(type='text'){
  const id=uid('block');
  if(isContentBlock(type))return {id,type,...createContentPayload(type)};
  return {id,type,activity:normaliseActivity({},type),style:{}};
}

export function createScreen(stage='New slide',title='New slide'){
  return {id:uid('screen'),stage,title,instruction:'',layout:'standard',blocks:[createBlock('text')]};
}

export function legacyToBlocks(screen={}){
  if(screen.blocks?.length)return screen.blocks;
  const blocks=[];
  if(screen.media?.image)blocks.push({id:uid('block'),type:'image',content:{assetId:null,src:screen.media.image,alt:'',fit:'contain',caption:''},style:{}});
  if(screen.media?.audio)blocks.push({id:uid('block'),type:'audio',content:{assetId:null,src:screen.media.audio,label:'Listen',transcript:''},style:{}});
  if(screen.media?.video)blocks.push({id:uid('block'),type:'video',content:{assetId:null,src:screen.media.video,label:'Watch',poster:'',caption:'',transcript:''},style:{}});
  if(screen.activity)blocks.push({id:uid('block'),type:screen.activity.type||'mcq',activity:normaliseActivity(clone(screen.activity),screen.activity.type||'mcq'),style:{}});
  else if(screen.prompt||screen.question)blocks.push({id:uid('block'),type:'text',content:{text:screen.prompt||screen.question,role:'body'},style:{}});
  return blocks.length?blocks:[createBlock('text')];
}

export function ensureLessonSchema(input={}){
  const lesson=input;
  lesson.schemaVersion=AUTHORING_SCHEMA_VERSION;
  lesson.version=Number(lesson.version||1);
  lesson.deliveryPolicy=normaliseDeliveryPolicy(lesson.deliveryPolicy||{id:'practice'});
  lesson.theme={...E_LEAP_THEME_DEFAULT,...(lesson.theme||{})};
  lesson.screens=Array.isArray(lesson.screens)&&lesson.screens.length?lesson.screens:[createScreen()];
  lesson.screens.forEach((s,i)=>{
    s.id=s.id||uid('screen');s.stage=s.stage||`Slide ${i+1}`;s.title=s.title||'Untitled slide';s.instruction=s.instruction||'';s.layout=normaliseLayout(s.layout);
    if(!Array.isArray(s.blocks))s.blocks=legacyToBlocks(s);
    s.blocks.forEach(b=>{b.id=b.id||uid('block');b.type=b.type||'text';b.style=b.style||{};if(b.activity)b.activity=normaliseActivity(b.activity,b.type);});
  });
  return lesson;
}

export function createLesson(overrides={}){
  return ensureLessonSchema({schemaVersion:AUTHORING_SCHEMA_VERSION,version:1,id:uid('lesson'),deliveryPolicy:normaliseDeliveryPolicy({id:'practice'}),courseLabel:'Objective First B2',lessonNumber:'U2.1',title:'New Lesson',status:'draft',theme:clone(E_LEAP_THEME_DEFAULT),screens:[createScreen('Lead-in','Welcome to the lesson')],authoringPath:'../studio/index.html',...overrides});
}

export function duplicateLesson(source={}){
  const lesson=clone(source);lesson.id=uid('lesson');lesson.title=`${lesson.title||'Lesson'} Copy`;lesson.status='draft';lesson.version=1;
  lesson.screens?.forEach(s=>{s.id=uid('screen');s.blocks?.forEach(b=>{b.id=uid('block');if(b.activity)b.activity.id=uid('activity');});});
  return ensureLessonSchema(lesson);
}

export function parsePipeLines(value,columns=2){return String(value||'').split('\n').map(line=>{const p=line.split('|').map(x=>x.trim());while(p.length<columns)p.push('');return p.slice(0,columns)}).filter(x=>x.some(Boolean));}
