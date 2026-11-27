export function canonicalAudioName(name,course){
 if(!['life','objective-first-b2','objective-pet-b1'].includes(course))throw Error('Select the audio textbook.');
 const m=String(name).match(/^(?:(\d{1,4})[\s_-]+)?track[\s_-]*(\d{1,4})\.(mp3|wav|m4a)$/i)||String(name).match(/^()(\d{1,4})\.(mp3|wav|m4a)$/i);
 if(!m||!Number(m[2])||(m[1]&&Number(m[1])!==Number(m[2])))throw Error('Unrecognised or conflicting track number: '+name);
 return course+'--track-'+String(Number(m[2])).padStart(3,'0')+'.'+m[3].toLowerCase();
}

export function bindTrackReferences(pkg,files){
 const copy=JSON.parse(JSON.stringify(pkg)),course=copy.courseProfileId;
 for(const s of copy.screens||[])for(const b of s.blocks||[]){
  const media=b.type==='audio'?b.content:b.type==='listening'?b.activity?.media:null;
  if(!media||media.track==null)continue;
  if(!Number.isInteger(media.track)||media.track<1||media.track>9999||!['life','objective-first-b2','objective-pet-b1'].includes(course))throw Error('Invalid course track reference.');
  const stem=course+'--track-'+String(media.track).padStart(3,'0')+'.';
  const matches=files.filter(f=>f.status==='active'&&String(f.content_type).startsWith('audio/')&&String(f.original_name).toLowerCase().startsWith(stem)&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(f.asset_id));
  if(matches.length!==1)throw Error('Track '+media.track+' for '+course+' is '+(matches.length?'ambiguous':'missing')+'.');
  if(media.assetId&&media.assetId!==matches[0].asset_id)throw Error('Track and Asset ID disagree.');
  media.assetId=matches[0].asset_id;
 }
 return copy;
}

export function courseDestination(course,number){
 const m=/^U([1-9]|1[0-2])\.([1-3])$/i.exec(String(number||''));
 const root={life:'life-intermediate','objective-first-b2':'objective-first-b2','objective-pet-b1':'objective-pet-b1'}[course];
 if(!m||!root||(course!=='life'&&Number(m[2])>2))throw Error('Unmapped course lesson.');
 return {courseId:root,lessonNumber:'U'+Number(m[1])+'.'+Number(m[2]),shellId:root+'-u'+m[1].padStart(2,'0')+'-l0'+m[2]};
}

export function createNativeLessonRequest(lesson,{brief='',includeSource=false,layouts=[],combos=[],files=[]}={}){
 if(lesson.status!=='draft'||!lesson.courseProfileId||!lesson.lessonNumber)throw Error('Set the lesson number in Properties before exporting.');
 if(!brief.trim())throw Error('Enter the teaching scope and duration.');
 const destination=courseDestination(lesson.courseProfileId,lesson.lessonNumber);
 const pages=new Map();
 if(includeSource)for(const s of lesson.screens||[]){
  const p=Number.isInteger(s.sourcePage)?s.sourcePage:Number(/^PDF page (\d+)$/.exec(s.title||'')?.[1]);
  if(!p||pages.has(p)||s.stage!=='Imported source')continue;
  pages.set(p,{pdfPage:p,text:s.blocks.filter(b=>b.type==='text').map(b=>b.content?.text||'').join('\n').slice(0,18000),verified:false});
 }
 const media=files.filter(f=>f.status==='active'&&(String(f.content_type).startsWith('image/')||String(f.original_name).startsWith(lesson.courseProfileId+'--track-'))).map(f=>({assetId:f.asset_id,name:f.original_name,mime:f.content_type}));
 return {schema:'eleap-native-authoring-request-v1',lessonId:lesson.id,courseProfileId:lesson.courseProfileId,lessonNumber:lesson.lessonNumber,destination,brief,sourcePages:[...pages.values()],sourceTextIncluded:includeSource,media,layouts,combos,
 responseContract:{schema:'eleap-native-lesson-package-v1',courseProfileId:lesson.courseProfileId,lessonNumber:lesson.lessonNumber,title:'Lesson title',assets:[],screens:[{stage:'Practice',title:'Activity title',instruction:'Complete the task.',layout:'standard',sourcePage:null,blocks:[{type:'matching',activity:{prompt:'Match each item.',pairs:[{id:'m1',left:'Example A',right:'Example B'}],evidenceByItem:{m1:{quote:'',why:'Explain the verified answer.'}}}}]}],review:{source:'Verified source details',notes:['Unverified items and missing media']}},
 rules:['Return one complete JSON object using responseContract. Example content is structural only; replace it with actual verified teaching content.','Use real native blocks: text, discussion, writing, mcq, multi-select, true-false, fill, matching, ordering, categorising, poll, image, audio, listening, video, video-question.','MCQ options use {id,label}; answerKey is an array of option IDs. Fill items use {id,prompt,answers}; matching pairs use {id,left,right}; ordering items use {id,text} plus answerKey; categorising uses categories and items {id,text,category}. Use evidenceByItem per item or choice.','Audio uses content:{track:26,label:"Track 26"} or a real assetId; listening uses activity.media:{track:26}. Never fabricate asset IDs or missing answer keys.','Image content uses existing verified assetId and alt, or packaged JPEG assets with document:UUID, name, type, base64. Do not invent images.','Use a valid layout and nonempty instruction. Use comboId only with a listed combo and a block for every step; blocks specify comboStep.','Keep learner-facing content separate from review notes; mark missing/unverified materials; no publication or teacher approval by AI.','Use at most 80 screens and 40 packaged images; preserve course identity. Include complete teaching tasks, not merely headings.']};
}
