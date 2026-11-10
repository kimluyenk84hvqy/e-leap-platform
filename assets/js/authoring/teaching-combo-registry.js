/* E-LEAP pedagogical combo registry. Pure lesson model builders; not teacher-facing instructions. */
import {createBlock,uid} from './lesson-model.js';

const text=(value,role='body')=>{const b=createBlock('text');b.content={...b.content,text:value,role};return b};
const activity=(type,prompt)=>{const b=createBlock(type);b.activity.prompt=prompt;return b};
const slide=(stage,title,instruction,layout,templateId,blocks)=>({
 id:uid('screen'),stage,title,instruction,layout,templateId,
 audience:'student',teacherNotes:'',blocks
});
const picture=()=>createBlock('image');
const audio=()=>createBlock('audio');

export const TEACHING_COMBOS={
 'photo-predict':{
  label:'Photo prediction',group:'Warm-up',template:'lead-in',
  description:'Observe → Predict → Share',
  build:()=>[slide('Lead-in','What do you notice?','Look at the photo. Predict what the lesson is about.','media-left','lead-in',[
   picture(),activity('discussion','What can you see? What might happen next?')])]
 },
 'vocabulary-context':{
  label:'Vocabulary in context',group:'Vocabulary',template:'vocabulary-presentation',
  description:'Notice → Match → Use',
  build:()=>{const v=createBlock('vocabulary');return [
   slide('Vocabulary','Words in context','Look at the photos. Discuss the meanings.','media-right','vocabulary-presentation',[v,picture(),activity('matching','Match each word with its meaning.')]),
   slide('Practice','Use the new words','Complete the sentences. Then compare with a partner.','question-options','controlled-practice',[activity('fill','Complete each sentence with a suitable word.')])
  ]}
 },
 'grammar-discovery':{
  label:'Guided grammar discovery',group:'Grammar',template:'grammar-presentation',
  description:'Notice → Discover → Practise',
  build:()=>{const g=createBlock('grammar-note');return [
   slide('Grammar','Discover the pattern','Read the examples. What do you notice?','two-column','grammar-presentation',[g,activity('discussion','How are the sentences formed?')]),
   slide('Grammar practice','Try it yourself','Choose the correct answer. Explain your choice.','question-options','controlled-practice',[activity('mcq','Choose the correct sentence.')])
  ]}
 },
 'reading-evidence':{
  label:'Evidence and why',group:'Reading',template:'reading-task',
  description:'Read → Locate evidence → Explain',
  build:()=>[
   slide('Reading','Read for evidence','Read the text. Find evidence for your answers.','reading-split','reading-task',[
    text('Insert the reading passage here.'),
    activity('discussion','Which line supports your answer? Why?')])
  ]
 },
 'reading-jigsaw':{
  label:'Jigsaw group reading',group:'Reading',template:'reading-task',
  description:'Expert groups → Share → Complete',
  build:()=>[
   slide('Reading','Become an expert','Read your assigned section. Find three key ideas.','reading-split','reading-task',[
    text('Insert the assigned reading sections here.'),
    activity('discussion','What are the three key ideas in your section?')]),
   slide('Reading','Teach your group','Share your findings. Complete the task together.','two-column','reading-task',[
    activity('matching','Match the information with the correct section.'),
    activity('discussion','What evidence supports your group answer?')])
  ]
 },
 'listening-3pass':{
  label:'Three-pass listening',group:'Listening',template:'listening-task',
  description:'Predict → Gist → Detail',
  build:()=>[
   slide('Listening','Before you listen','Look at the topic. Predict three words you may hear.','media-left','listening-task',[picture(),activity('discussion','What words do you expect to hear?')]),
   slide('Listening','Listen for the main idea','Listen and choose the best answer.','question-options','listening-task',[audio(),activity('listening','What is the main idea?')]),
   slide('Listening','Listen for details','Listen again. Check your answers with a partner.','question-options','listening-task',[audio(),activity('listening','Choose the correct detail.')])
  ]
 },
 'speaking-pair-share':{
  label:'Think–Pair–Share',group:'Speaking',template:'speaking-task',
  description:'Think → Discuss → Report',
  build:()=>[slide('Speaking','Think, pair and share','Think individually. Discuss with a partner. Share one idea with the class.','speaking-prompt','speaking-task',[
   activity('discussion','What is your opinion? Give one reason.')])]
 },
 'exit-ticket':{
  label:'Exit ticket',group:'Review',template:'consolidation',
  description:'Recall → Apply → Reflect',
  build:()=>[slide('Review','Before you go','Write one thing you learned and one question you still have.','standard','consolidation',[
   activity('writing','What did you learn today? How will you use it?')])]
 }
};
export const COMBO_GROUPS=[...new Set(Object.values(TEACHING_COMBOS).map(x=>x.group))];
export function createTeachingCombo(id){const c=TEACHING_COMBOS[id];return c?c.build():[];}
