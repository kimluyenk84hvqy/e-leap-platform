/* Source → Shared Studio schema, safe authoring draft.
 * Adapter intentionally emits only ungraded discussion and visible source text.
 * It never promotes unverified answer keys to platform scoring controls.
 */
import {createBlock,uid} from './lesson-model.js';
import {analyseExtractedText} from './source-structure-intake.js';
import {activeComboBlocks,comboStep,setComboStep} from './teaching-combo-registry.js';
const textBlock=(value,step)=>{
 const b=createBlock('text');b.content.text=value;b.content.role='body';b.comboStep=step;return b;
};
const discussion=(prompt,step)=>{
 const b=createBlock('discussion');b.activity.prompt=prompt;
 b.activity.rubric='Teacher reviews learner responses against the original source.';
 b.comboStep=step;return b;
};
export function sourceIntakeToStudioReviewScreen(text,{title='Source activity review',sourcePages=[]}={}){
 const parsed=analyseExtractedText(text);
 if(!parsed.ok)return {ok:false,issues:parsed.problems,screen:null};
 const tasks=parsed.source.tasks;
 if(tasks.length!==1||tasks[0].kind!=='reading')
  return {ok:false,issues:['Adapter supports exactly one reading task for review'],screen:null};
 const task=tasks[0];
 if((!task.passage&&!task.paragraphs?.length)||!task.questions.length)return {ok:false,issues:['Reading text and source tasks are required'],screen:null};
 if(task.questions.some(q=>!q.prompt||(q.options.length>0&&q.options.length<2)))
  return {ok:false,issues:['Question text is incomplete or objective options are invalid'],screen:null};
 const hasThreeAccounts=task.paragraphs?.length===3&&
  ['A','B','C'].every(label=>task.paragraphs.some(p=>p.label===label));
 if(task.paragraphs?.length&&!hasThreeAccounts)return {ok:false,issues:['Three-account reading requires original paragraphs A, B and C'],screen:null};
 if(hasThreeAccounts&&(task.photos?.length!==3||new Set(task.photos.map(p=>p.name.toLowerCase())).size!==3))
  return {ok:false,issues:['Three-account photo-matching requires all three original photograph captions'],screen:null};
 const steps=hasThreeAccounts?[
  {id:'look',label:'Look',instruction:'Look at the three photographs in the original book. Predict who wrote each account.'},
  {id:'read-a',label:'Read A',instruction:'Read account A. Underline details about the first school day.'},
  {id:'read-b',label:'Read B',instruction:'Read account B. Find clues about the writer’s feelings.'},
  {id:'read-c',label:'Read C',instruction:'Read account C. Find clues about the school and the writer’s feelings.'},
  {id:'complete',label:'Complete',instruction:'Complete both original Reading tasks on page 41. Explain your choices using evidence.'},
  {id:'share',label:'Share',instruction:'In groups, compare names, estimated years and textual evidence. Explain disagreements.'}
 ]:[
  {id:'read',label:'Read',instruction:'Read the text. Locate two useful details.'},
  {id:'answer',label:'Answer',instruction:'Answer the original questions and explain one reason to a partner.'},
  {id:'compare',label:'Compare',instruction:'Compare answers and identify supporting sentences.'}
 ];
 const blocks=[];
 if(hasThreeAccounts){
  blocks.push(textBlock('Photograph names in the original book: '+(task.photos||[]).map(p=>p.name).join(' · ')+'\nOpen the original page 41 to view the three photographs.','look'));
  blocks.push(discussion('Look at the three photographs. What clues might help you match each one?','look'));
  for(const p of task.paragraphs)blocks.push(textBlock('ACCOUNT '+p.label+'\n'+p.text,'read-'+p.label.toLowerCase()));
  for(const q of task.questions)blocks.push(discussion(q.id+'. '+q.prompt,'complete'));
  blocks.push(discussion('Each group member explains one account (A, B or C). Share the clues behind the matching and year estimates.','share'));
 }else{
  blocks.push(textBlock(task.passage,'read'));
  for(const q of task.questions){
   const options=q.options.map(o=>o.id+'. '+o.label).join('\n');
   blocks.push(discussion(q.id+'. '+q.prompt+(options?'\n'+options:''),'answer'));
   blocks.push(discussion('Compare evidence for '+q.id+'. Which sentence supports your choice?','compare'));
  }
 }
 const screen={
  id:uid('screen'),stage:'Reading',title,instruction:steps[0].instruction,
  templateId:'reading-task',layout:'reading-split',audience:'student',
  teacherNotes:'Source imported for review only. Verify text and answer keys against the original textbook before converting to an objective activity.',
  sourceReviewDraft:{status:'unverified',taskId:task.id,sourcePages:[...new Set([...sourcePages,task.sourcePage,...task.questions.map(q=>q.sourcePage),...(task.paragraphs||[]).map(p=>p.sourcePage)].filter(Number.isInteger))],questionCount:task.questions.length,paragraphCount:task.paragraphs?.length||0,photoLabels:task.photos?.map(p=>p.name)||[],photoAssetsVerified:false},
  combo:{schemaVersion:2,activeStep:steps[0].id,steps},blocks
 };
 return {ok:true,issues:[],screen,originalQuestions:task.questions.map(q=>({id:q.id,line:q.line,sourcePage:q.sourcePage,sourceStatus:'unverified'})),reviewRequired:true,publishable:false};
}
export function verifyComboStateTraversal(screen){
 if(!screen?.combo?.steps?.length)return {ok:false,issues:['Combo steps missing']};
 const clone=JSON.parse(JSON.stringify(screen));
 const issues=[];
 for(const step of clone.combo.steps){
  if(!setComboStep(clone,step.id))issues.push('Cannot enter '+step.id);
  if(comboStep(clone)?.id!==step.id)issues.push('Wrong active step '+step.id);
  if(!activeComboBlocks(clone).length)issues.push('Empty learner step '+step.id);
 }
 return {ok:!issues.length,issues};
}
