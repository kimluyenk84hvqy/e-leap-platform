/* E-LEAP Teaching Combo Library v2.
 * A combo is ONE authored screen with several learner-facing activity states.
 * Screen.blocks contains step-bound blocks; the editor activates one step
 * at a time. No developer/teacher notes are put on the projected canvas.
 */
import {createBlock,uid} from './lesson-model.js';
const text=(value,role='body')=>{const b=createBlock('text');b.content.text=value;b.content.role=role;return b};
const activity=(type,prompt)=>{const b=createBlock(type);b.activity.prompt=prompt;return b};
const picture=()=>createBlock('image');
const audio=()=>createBlock('audio');
const vocab=()=>createBlock('vocabulary');
const grammar=()=>createBlock('grammar-note');
const state=(id,label,instruction,blocks)=>({id,label,instruction,blocks});
const sequence=(stage,title,templateId,layout,steps,teacherNotes='')=>{
 const stepDefs=[],blocks=[];
 for(const step of steps){
  stepDefs.push({id:step.id,label:step.label,instruction:step.instruction});
  for(const block of step.blocks){
   block.comboStep=step.id;
   blocks.push(block);
  }
 }
 return [{
  id:uid('screen'),stage,title,instruction:steps[0].instruction,
  layout,templateId,audience:'student',teacherNotes,
  combo:{schemaVersion:2,activeStep:stepDefs[0].id,steps:stepDefs},
  blocks
 }];
};
export const TEACHING_COMBOS={
 'photo-predict':{
  label:'Photo prediction',group:'Warm-up',template:'lead-in',
  description:'Observe → Predict → Share (one slide)',
  build:()=>sequence('Lead-in','Look · Think · Share','lead-in','media-left',[
   state('observe','Observe','Look carefully at the picture.',[picture()]),
   state('predict','Predict','What do you think is happening?',[activity('discussion','What might happen next?')]),
   state('share','Share','Tell a partner your prediction and one reason.',[activity('discussion','What clues support your prediction?')])
  ])
 },
 'vocabulary-context':{
  label:'Vocabulary in context',group:'Vocabulary',template:'vocabulary-presentation',
  description:'Notice → Match → Use (one slide)',
  build:()=>sequence('Vocabulary','Vocabulary in context','vocabulary-presentation','media-right',[
   state('notice','Notice','Look at the words and photo. Guess the meanings.',[vocab(),picture()]),
   state('match','Match','Match each word to its meaning.',[activity('matching','Match the words and meanings.')]),
   state('use','Use','Complete the sentences. Compare with a partner.',[activity('fill','Complete each sentence with a new word.')])
  ])
 },
 'grammar-discovery':{
  label:'Guided grammar discovery',group:'Grammar',template:'grammar-presentation',
  description:'Notice → Discover → Practise (one slide)',
  build:()=>sequence('Grammar','Discover the grammar','grammar-presentation','two-column',[
   state('notice','Notice','Read the examples and identify a pattern.',[grammar()]),
   state('discover','Discover','Work with a partner. Explain how the pattern works.',[activity('discussion','What is the form and meaning of this grammar?')]),
   state('practise','Practise','Choose the answer and explain your choice.',[activity('mcq','Choose the correct sentence.')])
  ])
 },
 'reading-evidence':{
  label:'Evidence and why',group:'Reading',template:'reading-task',
  description:'Read → Evidence → Explain (one slide)',
  build:()=>sequence('Reading','Find the evidence','reading-task','reading-split',[
   state('read','Read','Read the passage. Identify the main idea.',[text('')]),
   state('evidence','Evidence','Find the sentence that supports your answer.',[activity('fill','Answer the question using evidence from the reading.')]),
   state('explain','Explain','Explain why the evidence supports your answer.',[activity('discussion','Why is this evidence relevant?')])
  ])
 },
 'reading-jigsaw':{
  label:'Jigsaw group reading',group:'Reading',template:'reading-task',
  description:'Read → Expert → Share → Complete → Evidence (one slide)',
  build:()=>sequence('Reading','Jigsaw reading','reading-task','reading-split',[
   state('read','Read','Read your assigned section silently.',[text('')]),
   state('expert','Expert group','Discuss three key ideas with students who read your section.',[activity('discussion','What are the three key ideas?')]),
   state('share','Share','Teach your home group what you learned.',[activity('discussion','What did your section explain?')]),
   state('complete','Complete','Work together to complete the reading task.',[activity('matching','Match each idea with its section.')]),
   state('evidence','Evidence & Why','Find supporting sentences and explain your answers.',[activity('discussion','Which sentence supports your answer? Why?')])
  ])
 },
 'listening-3pass':{
  label:'Three-pass listening',group:'Listening',template:'listening-task',
  description:'Predict → Gist → Detail (one slide)',
  build:()=>sequence('Listening','Listen · Think · Answer','listening-task','question-options',[
   state('predict','Predict','Predict three words you may hear.',[picture(),activity('discussion','What is this listening about?')]),
   state('gist','Main idea','Listen once. Choose the main idea.',[audio(),activity('listening','What is the main idea?')]),
   state('detail','Details','Listen again and choose the correct details.',[audio(),activity('listening','Which detail did you hear?')])
  ])
 },
 'speaking-pair-share':{
  label:'Think–Pair–Share',group:'Speaking',template:'speaking-task',
  description:'Think → Pair → Share (one slide)',
  build:()=>sequence('Speaking','Think · Pair · Share','speaking-task','speaking-prompt',[
   state('think','Think','Prepare one idea and one reason.',[activity('writing','Write a short idea and one reason.')]),
   state('pair','Discuss','Share your idea with a partner. Ask a follow-up question.',[activity('discussion','What is your partner’s opinion?')]),
   state('share','Share','Tell the class one interesting idea from your pair.',[activity('discussion','What did your partner say?')])
  ])
 },
 'exit-ticket':{
  label:'Exit ticket',group:'Review',template:'consolidation',
  description:'Recall → Apply → Reflect (one slide)',
  build:()=>sequence('Review','Exit ticket','consolidation','standard',[
   state('recall','Recall','Recall one key idea from today.',[activity('writing','What is one thing you learned?')]),
   state('apply','Apply','Use the new language in your own sentence.',[activity('writing','Write a new example.')]),
   state('reflect','Reflect','Write one question you still have.',[activity('writing','What would you like to practise next?')])
  ])
 }
};
export const COMBO_GROUPS=[...new Set(Object.values(TEACHING_COMBOS).map(x=>x.group))];
export function createTeachingCombo(id){const c=TEACHING_COMBOS[id];return c?c.build():[];}
export function comboStep(screen){
 if(!screen?.combo?.steps?.length)return null;
 return screen.combo.steps.find(step=>step.id===screen.combo.activeStep)||screen.combo.steps[0];
}
export function activeComboBlocks(screen){
 const step=comboStep(screen);
 return (screen?.blocks||[]).filter(b=>!step||!b.comboStep||b.comboStep===step.id);
}
export function setComboStep(screen,id){
 const steps=screen?.combo?.steps||[];
 if(!steps.some(x=>x.id===id))return false;
 screen.combo.activeStep=id;screen.instruction=steps.find(x=>x.id===id).instruction;
 return true;
}
