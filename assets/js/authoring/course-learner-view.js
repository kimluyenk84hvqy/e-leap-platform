import {normalizeAssessment, scoreText} from '../grading-core.js';

function node(tag,text){
  const item=document.createElement(tag);
  if(text)item.textContent=text;
  return item;
}

function activityForm(block,request,shellId){
  const form=node('form');
  form.append(node('h3',block.prompt));
  const rows=block.rows.map(row=>{
    const field=node('fieldset');
    if(row.prompt)field.append(node('legend',row.prompt));
    if(row.multi){
      for(const option of row.options||[]){
        const label=node('label');
        const input=node('input');
        input.type='checkbox';
        input.value=option.id;
        label.append(input,document.createTextNode(option.label));
        field.append(label);
      }
    }else if(row.options){
      const select=node('select');
      select.setAttribute('aria-label',row.prompt||block.prompt||'Answer');
      select.append(new Option('Choose…',''));
      for(const option of row.options)select.append(new Option(option.label,option.id));
      field.append(select);
    }else{
      const input=node('textarea');
      input.setAttribute('aria-label',row.prompt||block.prompt||'Response');
      input.maxLength=4000;
      field.append(input);
    }
    form.append(field);
    return [row,field];
  });
  const feedback=node('p');
  feedback.setAttribute('role','status');
  const reset=node('button','Reset');
  reset.type='reset';
  const check=node('button','Check');
  check.type='submit';
  if(block.checkable)form.append(check);
  form.append(reset,feedback);
  form.addEventListener('reset',()=>{feedback.textContent='';});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!block.checkable||check.disabled)return;
    const values=Object.fromEntries(rows.map(([row,field])=>[row.id,row.multi
      ?Array.from(field.querySelectorAll('input:checked'),input=>input.value)
      :field.querySelector('select,textarea').value]));
    check.disabled=true;
    reset.disabled=true;
    try{
      const reply=await request('/api/authoring/publish-course',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'check',shellId,blockId:block.id,values})
      });
      feedback.textContent=scoreText(normalizeAssessment(reply.score));
    }catch(error){feedback.textContent=error.message;}
    finally{check.disabled=false;reset.disabled=false;}
  });
  return form;
}

export function mountCourseLearner(root,lesson,request,shellId){
  let index=0,step='';
  const render=()=>{
    const screen=lesson.screens[index];
    const canvas=node('article');
    canvas.className='lesson-canvas';
    const back=node('a','Back to Courses');
    back.href='../index.html';
    const previous=node('button','Previous');
    const next=node('button','Next');
    previous.disabled=index===0;
    next.disabled=index===lesson.screens.length-1;
    previous.onclick=()=>{index--;step='';render();};
    next.onclick=()=>{index++;step='';render();};
    canvas.append(back,node('h1',lesson.lessonNumber+' · '+lesson.title),
      previous,node('span',' Slide '+(index+1)+'/'+lesson.screens.length+' '),next,
      node('h2',screen.title),node('p',screen.instruction));
    if(!step)step=screen.steps[0]?.id||'';
    for(const item of screen.steps){
      const button=node('button',item.label||item.id);
      button.setAttribute('aria-pressed',String(step===item.id));
      button.onclick=()=>{step=item.id;render();};
      canvas.append(button);
    }
    for(const block of screen.blocks){
      if(block.step&&block.step!==step)continue;
      if(block.type==='text')canvas.append(node('p',block.text));
      if(block.type==='image'){
        const image=node('img');
        image.src=block.src;
        image.alt=block.alt;
        canvas.append(image);
      }
      if(block.type==='activity')canvas.append(activityForm(block,request,shellId));
    }
    root.replaceChildren(canvas);
  };
  render();
}
