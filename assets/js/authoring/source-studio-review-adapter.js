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
  {id:'predict',label:'Look & predict',instruction:'Look at the three people in the original book. Predict who could have written A, B and C. Give one reason.'},
  {id:'assigned',label:'Individual reading',instruction:'Work in a group of three. Student 1 reads A; Student 2 reads B; Student 3 reads C. Read ONLY your assigned account and note two clues.'},
  {id:'expert',label:'Expert group',instruction:'Meet students who read your SAME account. Agree on the writer’s feelings, two text clues and one possible time clue.'},
  {id:'home',label:'Home group',instruction:'Return to your group of three. Each student TEACHES their account while the other two listen and record the clues.'},
  {id:'complete',label:'Original tasks',instruction:'Complete BOTH Reading exercises 1 and 2 from page 41. Match accounts to photos, then write names and estimated years.'},
  {id:'evidence',label:'Evidence & Why',instruction:'Compare all three answers. For each match quote one short clue and explain why it supports your choice. Give reasons for year estimates.'}
 ]:[
  {id:'read',label:'Read',instruction:'Read the text. Locate two useful details.'},
  {id:'answer',label:'Answer',instruction:'Answer the original questions and explain one reason to a partner.'},
  {id:'compare',label:'Compare',instruction:'Compare answers and identify supporting sentences.'}
 ];
 const blocks=[];
 if(hasThreeAccounts){
  blocks.push(textBlock('Use the three original photographs on page 41: '+(task.photos||[]).map(p=>p.name).join(' · ')+'.','predict'));
  blocks.push(discussion('Which account could belong to each person? Predict; do not decide yet.','predict'));
  // The text is kept in the common Studio screen, but separate source-labelled
  // blocks carry assignment metadata. The teacher assigns A, B or C and checks
  // reading access on the learner delivery surface before live classroom use.
  for(const p of task.paragraphs){
   const block=textBlock('ACCOUNT '+p.label+'\n'+p.text,'assigned');
   block.jigsawAssignment=p.label;block.sourcePage=p.sourcePage;blocks.push(block);
   const expert=discussion('EXPERT '+p.label+': What feelings and events are stated? Quote two short text clues and propose a possible time clue.','expert');
   expert.jigsawAssignment=p.label;blocks.push(expert);
  }
  blocks.push(discussion('HOME GROUP: Student A, then B, then C teaches their account. Each listener records two new clues.','home'));
  for(const q of task.questions)blocks.push(discussion(q.id+'. '+q.prompt,'complete'));
  for(const p of task.paragraphs){
   blocks.push(discussion('ACCOUNT '+p.label+': Which person matches it? Evidence: quote a short phrase. Why does that clue support your match? What is your estimated year, and why?','evidence'));
  }
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
  sourceReviewDraft:{status:'unverified',taskId:task.id,sourcePages:[...new Set([...sourcePages,task.sourcePage,...task.questions.map(q=>q.sourcePage),...(task.paragraphs||[]).map(p=>p.sourcePage)].filter(Number.isInteger))],questionCount:task.questions.length,paragraphCount:task.paragraphs?.length||0,photoLabels:task.photos?.map(p=>p.name)||[],photoAssetsVerified:false,jigsawGroupSize:3,assignments:['A','B','C'],tasksMustRemainOriginal:true,yearEstimateIsOpenResponse:true},
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
