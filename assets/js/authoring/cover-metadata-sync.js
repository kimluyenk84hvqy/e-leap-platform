/* Lesson metadata -> Cover defaults. Do not invent textbook topic titles.
 * A user-edited Cover slot is independent and never overwritten.
 */
const NORMAL=x=>String(x??'').trim();
const isStarterTopic=x=>!NORMAL(x)||/^new lesson$/i.test(NORMAL(x));
const isStarterUnit=x=>!NORMAL(x)||/^unit\s*2\s*[·•-]\s*lesson\s*u2\.1$/i.test(NORMAL(x));
const explicit=x=>NORMAL(x);
export function coverMetadata(lesson){
 return {unit:explicit(lesson?.lessonNumber),topic:explicit(lesson?.title),course:explicit(lesson?.courseLabel)};
}
export function syncCoverMetadata(cover,lesson,{initial=false}={}){
 if(!cover||!lesson)return false;
 const data=cover.certifiedTemplate?.family==='cover'?cover.certifiedTemplate:null;
 const metadata=coverMetadata(lesson);let changed=false;
 if(data){
  data.values=data.values||{};
  data.autoSynced=data.autoSynced||{};
  for(const key of ['unit','topic','course']){
   const previous=explicit(data.values[key]),next=metadata[key];
   const linked=data.autoSynced[key]===true;
   const starter=key==='unit'?isStarterUnit(previous):key==='topic'?isStarterTopic(previous):!previous;
   if((linked||(initial&&starter))&&previous!==next){data.values[key]=next;changed=true;}
   if(initial&&starter)data.autoSynced[key]=true;
  }
  if(changed){data.layoutReview=null;if(data.sourceReview?.required)data.sourceReview.approved=false;}
  return changed;
 }
 // Legacy first slide: fix ONLY well-known starter values, not teacher edits.
 for(const block of cover.blocks||[]){
  if(block.type!=='text')continue;
  const key=({eyebrow:'unit',display:'topic'})[block.content?.role];
  if(!key)continue;
  const previous=explicit(block.content.text),next=metadata[key];
  const starter=key==='unit'?isStarterUnit(previous):isStarterTopic(previous);
  if(starter&&previous!==next){block.content.text=next;changed=true;}
 }
 return changed;
}
export function unlinkCoverSlot(cover,key){
 if(cover?.certifiedTemplate?.family==='cover'&&['unit','topic','course'].includes(key)){
  cover.certifiedTemplate.autoSynced=cover.certifiedTemplate.autoSynced||{};
  cover.certifiedTemplate.autoSynced[key]=false;
 }
}
