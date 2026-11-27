import {interactiveSupported, previewRows, gradePreview} from '../../assets/js/authoring/interactive-preview.js';
import {isObjectiveActivity} from '../../assets/js/activities/activity-registry.js';

const visible = block => !['teacher','internal'].includes(block.audience);
const text = value => typeof value==='string' ? value : '';
const imageId = id => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id||'');

export function courseImage(lesson, id) {
  return imageId(id) && lesson.screens.some(screen=>screen.blocks.some(block=>
    visible(block) && block.type==='image' && block.content?.assetId===id));
}

export function projectCourseLesson(lesson, shellId) {
  return {
    title:text(lesson.title), lessonNumber:text(lesson.lessonNumber),
    screens:lesson.screens.map(screen=>({
      title:text(screen.title), instruction:text(screen.instruction),
      steps:(screen.combo?.steps||[]).map(({id,label,title})=>({id,label:text(label||title)})),
      blocks:screen.blocks.filter(visible).flatMap(block=>{
        const step=text(block.comboStep);
        if(block.type==='text')return [{type:'text',step,text:text(block.content?.text)}];
        if(block.type==='image' && imageId(block.content?.assetId)){
          const query=new URLSearchParams({shellId,image:block.content.assetId});
          return [{type:'image',step,src:'/api/authoring/publish-course?'+query,alt:text(block.content.alt)}];
        }
        if(!interactiveSupported(block))return [];
        return [{
          type:'activity',step,id:text(block.id),prompt:text(block.activity.prompt),
          checkable:isObjectiveActivity(block.type),
          rows:previewRows(block).map(({prompt,options,multi},index)=>({
            id:String(index),prompt:text(prompt),multi:multi===true,
            options:options?.map(({label},optionIndex)=>({id:String(optionIndex),label:text(label)}))
          }))
        }];
      })
    }))
  };
}

export function checkCourseActivity(lesson, blockId, values) {
  const block=lesson.screens.flatMap(screen=>screen.blocks).find(block=>
    block.id===blockId && visible(block) && interactiveSupported(block) && isObjectiveActivity(block.type));
  if(!block || !values || typeof values!=='object' || Array.isArray(values))return null;
  const responses=new Map();
  for(const [index,row] of previewRows(block).entries()){
    if(!Object.hasOwn(values,index))continue;
    const value=values[index];
    const optionId=key=>typeof key==='string' && /^(0|[1-9][0-9]*)$/.test(key)
      ?row.options?.[Number(key)]?.id:undefined;
    if(row.multi){
      if(!Array.isArray(value)||value.length>row.options.length||value.some(key=>optionId(key)===undefined))return null;
      responses.set(row.id,value.map(optionId));
    }else{
      if(typeof value!=='string'||value.length>4000||
          (value && row.options && optionId(value)===undefined))return null;
      responses.set(row.id,value&&row.options?optionId(value):value);
    }
  }
  const {correctCount,answeredCount,totalCount}=gradePreview(block,responses);
  return {correctCount,answeredCount,totalCount};
}
