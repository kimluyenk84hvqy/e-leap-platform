import {EXPANDED_METHOD_COMBOS} from './method-combo-expansions.js';
import {hybridStepContract,evaluateHybridCombo} from './hybrid-pedagogy-contract.js';
/* E-LEAP evidence-informed method/teaching combo contracts.
 * Design adaptation; source materials always remain authoritative.
 * Do NOT call a filled activity "ready" without supplied original items.
 */
const step=(id,label,instruction,slot,mode,showSource=false)=>({id,label,instruction,slot,mode,showSource});
export const METHOD_COMBOS={
 ...EXPANDED_METHOD_COMBOS,
 'tbl-listening':{
  label:'Task-Based Listening',group:'Listening',method:'Task-Based Learning + staged listening',
  sourceLabels:['British Council: task cycle','British Council: listening framework'],
  description:'Prepare → Listen & Discover → Group Task → Report → Complete & Check → Reflect',
  required:['audioSrc','questions'],optional:['transcript','photoSrc','leadQuestions','gistQuestion','groupTask','reportPrompt','reflection'],
  steps:[
   step('prepare','Prepare','Look at the picture. Predict what you may hear.','leadQuestions','pair'),
   step('listen','Listen & Discover','Listen for the main idea. Compare your predictions.','gistQuestion','individual'),
   step('task','Group Task','Listen again. Work in pairs or groups and pool your information.','groupTask','group'),
   step('report','Report','Share your group answer and explain your reasons.','reportPrompt','group'),
   step('complete','Complete & Check','Complete the original listening questions. Check answers with your teacher.','questions','class',true),
   step('reflect','Reflect','Discuss what helped you understand the recording.','reflection','pair')
  ]
 },
 'staged-listening':{
  label:'Gist → Detail → Peer Check',group:'Listening',method:'Pre/While/Post listening',
  description:'Predict → Gist → Detail → Peer Check → Complete → Follow-up',
  required:['audioSrc','questions'],optional:['photoSrc','transcript','leadQuestions','gistQuestion','reflection'],
  steps:[
   step('predict','Predict','Look and predict the topic.','leadQuestions','pair'),
   step('gist','Listen for gist','Listen once for the main idea.','gistQuestion','individual'),
   step('detail','Listen for details','Listen again. Note key information.','questions','individual'),
   step('compare','Peer Check','Compare what you heard with a partner.','questions','pair'),
   step('complete','Complete & Check','Answer every original question. Check with your teacher.','questions','class',true),
   step('follow','Follow-up','Discuss what you learned.','reflection','pair')
  ]
 },
 'jigsaw-reading':{
  label:'Jigsaw Reading · Evidence & Why',group:'Reading',method:'Collaborative jigsaw / communicative reading',
  description:'Read → Expert Group → Share → Complete + Evidence & Why',
  required:['passage','questions'],optional:['sections','groupTask','reflection'],
  steps:[
   step('read','Read','Read your assigned section and identify key ideas.','sections','individual',true),
   step('expert','Expert Group','Discuss your section with students who read the same part.','groupTask','group'),
   step('share','Share','Teach your home group; then put the text away and recall the information.','groupTask','group'),
   step('complete','Complete & Check','Complete all original questions. Find evidence and explain why.','questions','class',true)
  ]
 },
 'guided-grammar':{
  label:'Guided Discovery Grammar',group:'Grammar',method:'Inductive guided discovery',
  description:'Context → Notice → Discover → Pair Check → Practise → Apply',
  required:['examples','grammarTarget','questions'],optional:['context','rule','application'],
  steps:[
   step('context','Context','Read the situation and notice the meaning.','context','pair'),
   step('notice','Notice','Find the target expressions in the examples.','examples','individual',true),
   step('discover','Discover','Work out the grammar pattern and meaning.','rule','pair'),
   step('peer','Pair Check','Compare your rule with your partner.','rule','pair'),
   step('practise','Practise & Check','Complete the textbook task; explain your choices.','questions','class',true),
   step('apply','Apply','Use this grammar to talk about your life.','application','pair')
  ]
 },
 'contextual-vocabulary':{
  label:'Vocabulary in Context',group:'Vocabulary',method:'Contextualized presentation and retrieval',
  description:'Elicit → Meaning → Form & Pronunciation → Match → Use',
  required:['items','questions'],optional:['photoSrc','context','application'],
  steps:[
   step('elicit','Elicit','Look at the situation and guess the meaning.','context','pair'),
   step('meaning','Meaning','Match words to pictures or definitions.','items','pair',true),
   step('form','Pronunciation','Listen, repeat and notice word form.','items','individual',true),
   step('practice','Practise','Complete the original vocabulary activity.','questions','pair',true),
   step('use','Use','Make a sentence using the new words.','application','pair')
  ]
 },
 'think-pair-share':{
  label:'Think–Pair–Share',group:'Speaking',method:'Collaborative rehearsal',
  description:'Think → Plan → Pair → Share → Feedback',
  required:['speakingPrompt'],optional:['languageSupport','model','criteria'],
  steps:[
   step('think','Think','Prepare an idea and a supporting reason.','speakingPrompt','individual'),
   step('plan','Plan','Organize your points and useful expressions.','languageSupport','individual'),
   step('pair','Pair','Explain your idea to a partner and ask a question.','speakingPrompt','pair'),
   step('share','Share','Report your partner’s idea to the group.','speakingPrompt','group'),
   step('feedback','Feedback','Reflect on clarity and language use.','criteria','class')
  ]
 },
 'process-writing':{
  label:'Process Writing',group:'Writing',method:'Plan–Draft–Revise–Edit–Share',
  description:'Analyse → Brainstorm → Plan → Draft → Peer Review → Final',
  required:['writingPrompt'],optional:['model','outline','criteria','languageSupport'],
  steps:[
   step('analyse','Analyse','Read the task and examine a model if available.','model','pair'),
   step('ideas','Brainstorm','Generate ideas with a partner.','writingPrompt','pair'),
   step('plan','Plan','Organize your ideas before writing.','outline','individual'),
   step('draft','Draft','Write your first version.','writingPrompt','individual'),
   step('review','Peer Review','Exchange drafts and give specific feedback.','criteria','pair'),
   step('final','Final Writing','Revise your text and submit a final draft.','writingPrompt','individual')
  ]
 }
};
export const METHOD_GROUPS=[...new Set(Object.values(METHOD_COMBOS).map(c=>c.group))];
const nonblank=v=>typeof v==='string'&&v.trim().length>0;
export function checkMethodSource(id,source={}){
 const method=METHOD_COMBOS[id];if(!method)return ['Unknown method combo.'];
 const issues=[];
 for(const key of method.required){
  const v=source[key];
  if(key==='questions'){
   if(!Array.isArray(v)||!v.length)issues.push('Original textbook questions are required; no questions may be invented.');
   else for(const [i,q] of v.entries())if(!nonblank(q.text)||!Array.isArray(q.answers)||!q.answers.length)issues.push('Question '+(i+1)+' requires original text and verified answer(s).');
  }else if(['items','sections','events'].includes(key)){
   if(!Array.isArray(v)||!v.length)issues.push('Original '+key+' must contain at least one item.');
   else if(v.some(item=>!nonblank(typeof item==='string'?item:item?.text||item?.content||item?.label)))issues.push('Original '+key+' includes a blank item.');
  }else if(!nonblank(v))issues.push('Missing original '+key+'.');
 }
 if(method.group==='Reading'&&Array.isArray(source.questions)){
  source.questions.forEach((q,i)=>{
   if(!nonblank(q.evidenceQuote))issues.push('Reading question '+(i+1)+' needs verified evidence text or a precise source locator.');
   if(!nonblank(q.why))issues.push('Reading question '+(i+1)+' needs a source-grounded Why explanation.');
  });
 }
 if(Array.isArray(source.questions)&&Number.isInteger(source.expectedQuestionCount)&&source.questions.length!==source.expectedQuestionCount)issues.push('Question count mismatch: source requires '+source.expectedQuestionCount+' but provided '+source.questions.length+'.');
 if(source.audioSrc&&!/^(https:\/\/|\/(?!\/)|\.\.?\/)/i.test(source.audioSrc))issues.push('Audio must use a valid HTTPS URL or relative path.');
 if(id.includes('listening')&&Array.isArray(source.questions)&&!source.questions.every(q=>q.sourceRef))issues.push('Every listening question needs a textbook source reference.');
 return issues;
}
export function mapMethodToStates(id,source={}){
 const method=METHOD_COMBOS[id];if(!method)return {ok:false,errors:['Unknown teaching method.']};
 const errors=checkMethodSource(id,source);
 errors.push(...evaluateHybridCombo(method).errors);
 if(errors.length)return {ok:false,errors};
 const questionForReview=q=>({
  id:q.id??null,text:q.text,
  ...(Array.isArray(q.options)?{options:q.options.map(o=>typeof o==='string'?o:{id:o.id,label:o.label})}:{})
 });
 // Never serialize an answer key, Evidence/Why, the unseen A/B side or an
 // unapproved transcript into a learner-renderable method state.
 const states=method.steps.map(step=>{
  const hiddenSource=!step.showSource;
  const sensitiveSplit=step.slot==='sections';
  const material=hiddenSource||sensitiveSplit?null:
   step.slot==='questions'?source.questions.map(questionForReview):
   step.slot==='transcript'?null:(source[step.slot]??null);
  return {
   ...hybridStepContract(step),
   material,
   media:step.slot==='audioSrc'?(source.audioSrc||null):null,
   transcript:null,
   answerPolicy:'hidden',
   requiresServerIssuedRoleGrants:true,
   privateSourceRequired:sensitiveSplit||step.slot==='transcript'
  };
 });
 return {ok:true,id,label:method.label,states,originalQuestionCount:source.questions?.length||0,sourceRefs:source.sourceRefs||[],status:'needs-teacher-review'};
}
