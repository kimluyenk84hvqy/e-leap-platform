import {createBlock,uid} from './authoring/lesson-model.js';
const text=(value,role='body')=>{const b=createBlock('text');b.content.text=value;b.content.role=role;return b;};
const activity=(type,prompt)=>{const b=createBlock(type);b.activity.prompt=prompt;return b;};
const media=(type)=>createBlock(type);
const screen=(stage,title,instruction,blocks,layout='standard',templateId=null)=>({id:uid('screen'),stage,title,instruction,layout,templateId,blocks});
export const VMMU_INSTITUTION='VIETNAM MILITARY MEDICAL UNIVERSITY';
export const VMMU_FACULTY='FACULTY OF FOREIGN LANGUAGES';

export const E_LEAP_SMART_TEMPLATES={
  cover:{label:'Lesson cover',description:'VMMU + Faculty + Unit/Lesson + title',make:()=>screen('Cover','Lesson title','',[text(VMMU_INSTITUTION,'institution'),text(VMMU_FACULTY,'faculty'),text('Unit 2 · Lesson U2.1','eyebrow'),text('Lesson title','display'),text('Lecturer:','caption'),media('image')],'hero','lesson-cover')},
  aims:{label:'Lesson aims',description:'Three concise learning outcomes',make:()=>screen('Aims','Aims of the lesson','After the lesson, students will be able to:',[text('01 · Learning outcome','heading'),text('02 · Learning outcome','heading'),text('03 · Learning outcome','heading')],'three-cards','lesson-aims')},
  section:{label:'Section divider',description:'Reading / Grammar / Speaking section divider',make:()=>screen('Section','Section title','',[text('SECTION','eyebrow'),text('Section title','display')],'hero','section-divider')},
  leadin:{label:'Lead-in',description:'Image/video + prompt + quick question',make:()=>screen('Lead-in','Get started','Look, watch or listen and discuss.',[media('image'),text('Add a short lead-in prompt.','heading'),activity('poll','What do you think?')],'media-right','lead-in')},
  vocabulary:{label:'Vocabulary',description:'Word + meaning/IPA/audio + quick practice',make:()=>{const vocab=createBlock('vocabulary');return screen('Vocabulary','Key vocabulary','Learn the words, then practise.',[vocab,media('audio'),activity('matching','Match the words and meanings.')],'media-right','vocabulary-presentation');}},
  grammar:{label:'Grammar presentation',description:'Rule + examples + controlled practice',make:()=>{const note=createBlock('grammar-note');return screen('Grammar','Grammar focus','Study the rule and complete the task.',[note,activity('mcq','Choose the correct answer.')],'standard','grammar-presentation');}},
  controlled:{label:'Controlled practice',description:'Instruction + objective activity',make:()=>screen('Practice','Practice','Complete the activity.',[activity('mcq','Choose the correct answer.')],'question-options','controlled-practice')},
  listening:{label:'Listening task',description:'Audio + objective response',make:()=>screen('Listening','Listen and respond','Listen and answer.',[media('audio'),activity('listening','Listen and answer.')],'media-left','listening-task')},
  video:{label:'Video',description:'Large video + task',make:()=>screen('Video','Watch','Watch the video.',[media('video')],'full-media','video')},
  interactiveVideo:{label:'Interactive video',description:'Video + checkpoint question',make:()=>screen('Video','Watch and respond','Watch the video and answer.',[activity('video-question','Watch and answer.')],'media-50-50','interactive-video')},
  reading:{label:'Reading task',description:'Reading text + activity',make:()=>screen('Reading','Read and respond','Read the text and complete the task.',[text('Paste or type the reading text here.','body'),activity('mcq','Choose the correct answer.')],'reading-split','reading-task')},
  speaking:{label:'Speaking task',description:'Prompt + recording',make:()=>screen('Speaking','Speak','Prepare, then record your response.',[activity('speaking-record','Record your response.')],'speaking-prompt','speaking-task')},
  writing:{label:'Writing task',description:'Prompt + rubric + response',make:()=>screen('Writing','Write','Plan and write your response.',[activity('writing','Write your response.')],'standard','writing-task')},
  consolidation:{label:'Consolidation',description:'Review key language and learning',make:()=>screen('Review','Consolidation','Review the key points from the lesson.',[text('Key point 1','heading'),text('Key point 2','heading'),text('Key point 3','heading')],'three-cards','consolidation')},
  homework:{label:'Homework',description:'Assignment instructions',make:()=>screen('Homework','Homework','Complete the task after class.',[activity('writing','Complete the homework task.')],'standard','homework')},
  closing:{label:'Lesson closing',description:'Clean end screen',make:()=>screen('Closing','That’s all for this lesson','',[text('THAT’S ALL ABOUT','eyebrow'),text('LESSON','display')],'hero','lesson-closing')}
};
export function createSmartTemplate(key){const t=E_LEAP_SMART_TEMPLATES[key];return t?t.make():null;}
