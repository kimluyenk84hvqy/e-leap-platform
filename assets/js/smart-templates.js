import {createBlock,uid} from './authoring/lesson-model.js';
const text=(value,role='body')=>{const b=createBlock('text');b.content.text=value;b.content.role=role;return b;};
const activity=(type,prompt)=>{const b=createBlock(type);b.activity.prompt=prompt;return b;};
const screen=(stage,title,instruction,blocks,layout='standard')=>({id:uid('screen'),stage,title,instruction,layout,blocks});

export const E_LEAP_SMART_TEMPLATES={
  leadin:{label:'Lead-in',description:'Image or prompt + quick question',make:()=>screen('Lead-in','Get started','Look and discuss.',[text('Add a visual or short lead-in prompt.','heading'),activity('poll','What do you think?')])},
  vocabulary:{label:'Vocabulary',description:'Word presentation + quick practice',make:()=>{const vocab=createBlock('vocabulary');return screen('Vocabulary','Key vocabulary','Learn the words, then practise.',[vocab,activity('matching','Match the words and meanings.')]);}},
  grammar:{label:'Grammar presentation',description:'Rule + examples + controlled practice',make:()=>{const note=createBlock('grammar-note');return screen('Grammar','Grammar focus','Study the rule and complete the task.',[note,activity('mcq','Choose the correct answer.')]);}},
  controlled:{label:'Controlled practice',description:'Instruction + objective activity',make:()=>screen('Practice','Practice','Complete the activity.',[activity('mcq','Choose the correct answer.')],'question-options')},
  video:{label:'Interactive video',description:'Video + checkpoint question',make:()=>screen('Video','Watch and respond','Watch the video and answer.',[activity('video-question','Watch and answer.')],'media-50-50')},
  listening:{label:'Listening practice',description:'Audio + objective response',make:()=>screen('Listening','Listen and respond','Listen and answer the question.',[activity('listening','Listen and answer.')],'question-options')},
  speaking:{label:'Speaking task',description:'Prompt + recording',make:()=>screen('Speaking','Speak','Prepare, then record your response.',[activity('speaking-record','Record your response.')],'speaking-prompt')},
  writing:{label:'Writing task',description:'Prompt + rubric + response',make:()=>screen('Writing','Write','Plan and write your response.',[activity('writing','Write your response.')],'standard')}
};
export function createSmartTemplate(key){const t=E_LEAP_SMART_TEMPLATES[key];return t?t.make():null;}
