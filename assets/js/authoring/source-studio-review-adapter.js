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
 if(!task.passage||!task.questions.length)return {ok:false,issues:['Reading passage and questions are required'],screen:null};
 if(task.questions.some(q=>!q.prompt||q.options.length<2))
  return {ok:false,issues:['Only complete multiple-choice source questions are supported'],screen:null};
 const steps=[
  {id:'read',label:'Read',instruction:'Read the text. Locate two useful details.'},
  {id:'answer',label:'Answer',instruction:'Choose your answer and explain one reason to a partner.'},
  {id:'compare',label:'Compare',instruction:'Compare answers and identify supporting sentences.'}
 ];
 const blocks=[textBlock(task.passage,'read')];
 for(const question of task.questions){
  // Open responses preserve exact options without trusting the answer supplied in text.
  const options=question.options.map(o=>o.id+'. '+o.label).join('\n');
  blocks.push(discussion(question.id+'. '+question.prompt+'\n'+options,'answer'));
  blocks.push(discussion('Compare evidence for '+question.id+'. Which sentence supports your choice?','compare'));
 }
 const screen={
  id:uid('screen'),stage:'Reading',title,instruction:steps[0].instruction,
  templateId:'reading-task',layout:'reading-split',audience:'student',
  teacherNotes:'Source imported for review only. Verify text and answer keys against the original textbook before converting to an objective activity.',
  sourceReviewDraft:{status:'unverified',taskId:task.id,sourcePages:[...new Set([...sourcePages,task.sourcePage,...task.questions.map(q=>q.sourcePage)].filter(Number.isInteger))],questionCount:task.questions.length},
  combo:{schemaVersion:2,activeStep:'read',steps},blocks
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
