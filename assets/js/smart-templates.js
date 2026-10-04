const id=(p='x')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const text=(value,role='body')=>({id:id('block'),type:'text',content:{text:value,role},style:{}});
const activity=(type,prompt)=>({id:id('block'),type,activity:{id:id('activity'),type,prompt,points:1,policy:{}},style:{}});
export const E_LEAP_SMART_TEMPLATES={
 leadin:{label:'Lead-in',description:'Image or prompt + quick question',make:()=>({id:id('screen'),stage:'Lead-in',title:'Get started',instruction:'Look and discuss.',layout:'standard',blocks:[text('Add a visual or short lead-in prompt.','heading'),activity('poll','What do you think?')]})},
 vocabulary:{label:'Vocabulary',description:'Word presentation + quick practice',make:()=>({id:id('screen'),stage:'Vocabulary',title:'Key vocabulary',instruction:'Learn the words, then practise.',layout:'standard',blocks:[{id:id('block'),type:'vocabulary',content:{items:[{word:'Word',meaning:'Meaning',example:'Example sentence.'}]},style:{}},activity('matching','Match the words and meanings.')]})},
 grammar:{label:'Grammar presentation',description:'Rule + examples + controlled practice',make:()=>({id:id('screen'),stage:'Grammar',title:'Grammar focus',instruction:'Study the rule and complete the task.',layout:'standard',blocks:[{id:id('block'),type:'grammar-note',content:{rule:'Grammar rule',form:'Form / pattern',examples:['Example sentence.']},style:{}},activity('mcq','Choose the correct answer.')]})},
 controlled:{label:'Controlled practice',description:'Instruction + objective activity',make:()=>({id:id('screen'),stage:'Practice',title:'Practice',instruction:'Complete the activity.',layout:'standard',blocks:[activity('mcq','Choose the correct answer.')]})},
 video:{label:'Interactive video',description:'Video + checkpoint question',make:()=>({id:id('screen'),stage:'Video',title:'Watch and respond',instruction:'Watch the video and answer.',layout:'standard',blocks:[activity('video-question','Watch and answer.')]})},
 speaking:{label:'Speaking task',description:'Prompt + recording',make:()=>({id:id('screen'),stage:'Speaking',title:'Speak',instruction:'Prepare, then record your response.',layout:'standard',blocks:[activity('speaking-record','Record your response.')]})},
 writing:{label:'Writing task',description:'Prompt + rubric + response',make:()=>({id:id('screen'),stage:'Writing',title:'Write',instruction:'Plan and write your response.',layout:'standard',blocks:[activity('writing','Write your response.')]})}
};
export function createSmartTemplate(key){const t=E_LEAP_SMART_TEMPLATES[key];return t?t.make():null;}
