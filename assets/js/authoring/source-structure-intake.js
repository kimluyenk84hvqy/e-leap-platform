/* M1: conservative line-aware source structure intake.
 * Teacher-provided EXTRACTED TEXT only. No PDF/PPT/audio support, no AI claims.
 * Answer keys in an input never become verified by the parser.
 */
const clean=x=>String(x??'').trim();
const HEADER=/^(UNIT|LESSON|LEVEL|OBJECTIVE|TASK|PASSAGE|AUDIO|KEY[1-9][0-9]*|Q[1-9][0-9]*)\s*:\s*(.*)$/i;
const OPT=/^([A-D])[).]\s*(\S.*)$/i;
export function analyseExtractedText(text,{maxCharacters=32000}={}){
 const problems=[],unverified=[];
 if(typeof text!=='string'||text.length>maxCharacters)return {ok:false,problems:['Source text missing or exceeds maximum length']};
 const lines=text.replace(/\r\n?/g,'\n').split('\n');
 const result={schemaVersion:'eleap-source-intake-v1',inputKind:'teacher-extracted-text',verification:'unverified',unit:'',lesson:'',level:'',objectives:[],tasks:[],unparsed:[],unverified,sourceLength:text.length};
 let task=null,question=null,passageMode=false;
  for(let i=0;i<lines.length;i++){
  const line=clean(lines[i]);if(!line)continue;
  const h=HEADER.exec(line),o=OPT.exec(line);
  if(h){
   passageMode=false;
   const field=h[1].toUpperCase(),v=clean(h[2]);
   if(field==='UNIT'){result.unit=v;continue;}
   if(field==='LESSON'){result.lesson=v;continue;}
   if(field==='LEVEL'){result.level=v;continue;}
   if(field==='OBJECTIVE'){result.objectives.push({text:v,line:i+1});continue;}
   if(field==='TASK'){
    if(task){task.endLine=i;result.tasks.push(task);}
    const parts=v.split('|').map(clean);
    const id=parts[0],kind=(parts[1]||'').toLowerCase();
    task={id,title:parts.slice(2).join(' | ')||id,kind,startLine:i+1,endLine:i+1,passage:'',questions:[],audioRef:null,missing:[]};
    if(!/^\d+[a-z]?$/i.test(id)||!['reading','listening','speaking','grammar','vocabulary','writing'].includes(kind))
     task.missing.push('Task ID or kind requires teacher verification');
    question=null;continue;
   }
   if(!task){result.unparsed.push({line:i+1,text:line});continue;}
   if(field==='PASSAGE'){task.passage=v;passageMode=true;question=null;continue;}
   if(field==='AUDIO'){task.audioRef=v||null;unverified.push({kind:'audio',taskId:task.id,line:i+1,reason:'Audio reference was not opened or listened to'});question=null;continue;}
   if(/^Q\d+$/.test(field)){
    if(task.questions.some(x=>x.id===field))task.missing.push('Duplicate '+field);
    question={id:field,prompt:v,line:i+1,options:[],sourceStatus:'unverified',suppliedKey:null};
    task.questions.push(question);continue;
   }
   if(/^KEY\d+$/.test(field)){
    const q=task.questions.find(x=>x.id==='Q'+field.slice(3));
    if(q)q.suppliedKey=v;else task.missing.push('Key without matching question: '+field);
    unverified.push({kind:'answer',taskId:task.id,line:i+1,reason:'Supplied answer must be independently checked against approved source'});
    continue;
   }
  }
  if(o&&question){if(question.options.some(x=>x.id===o[1].toUpperCase()))task.missing.push('Duplicate option '+o[1]+' in '+question.id);question.options.push({id:o[1].toUpperCase(),label:o[2],line:i+1});continue;}
  if(passageMode&&task&&!question){task.passage+=(task.passage?'\n':'')+line;continue;}
  result.unparsed.push({line:i+1,text:line});
 }
 if(task){task.endLine=lines.length;result.tasks.push(task);}
 if(!result.unit)problems.push('UNIT heading missing');
 if(!result.tasks.length)problems.push('No explicit TASK headings found');
 if(result.unparsed.length)problems.push(result.unparsed.length+' unrecognized source lines require review');
 for(const t of result.tasks){
  if(!t.questions.length)t.missing.push('No source questions extracted');
  if(t.kind==='reading'&&!t.passage)t.missing.push('PASSAGE missing');
  if(t.kind==='listening'&&!t.audioRef)t.missing.push('Audio reference missing');
  for(const q of t.questions){
   if(!q.prompt)t.missing.push(q.id+' question text missing');
   if(q.options.length&&q.options.length<2)t.missing.push(q.id+' has fewer than 2 options');
   if(q.suppliedKey&&q.options.length&&!q.options.some(o=>o.id===q.suppliedKey.toUpperCase()))t.missing.push(q.id+' supplied key is outside option list');
   if(!q.suppliedKey)unverified.push({kind:'answer',taskId:t.id,questionId:q.id,reason:'No supplied answer key'});
  }
 }
 for(const t of result.tasks)for(const issue of t.missing)problems.push('Task '+t.id+': '+issue);
 return {ok:!problems.length,problems,source:result,readyForAi:false,readyForPublish:false};
}
export const SYNTHETIC_READING_FIXTURE=`UNIT: Demonstration only
LESSON: Source parsing and live interaction
LEVEL: B1
OBJECTIVE: Locate a stated fact in a short reading.
TASK: 1 | reading | Reading comprehension
PASSAGE: On Monday, Maya visited the community library. She borrowed a book about birds. On Tuesday, she returned to school.
Q1: Where did Maya go on Monday?
A) The community library
B) The sports centre
C) The hospital
KEY1: A
Q2: What was the book about?
A) Cars
B) Birds
C) Weather
KEY2: B`;
