import {mapFunctionalDraft} from './functional-slide-library.js';
import {createComposite} from './composite-slide.js';
import {normalizeReviewReports} from './s82-authoring-plan.js';
/* Draft-only validation. No grant of publication or learner access. */
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const unique=a=>Array.isArray(a)&&a.length>0&&a.every(x=>typeof x==='string'&&x.trim())&&new Set(a).size===a.length;
export function validateNativePackage(pkg,target){
 if(pkg?.schema!=='eleap-native-lesson-package-v1'||String(pkg.lessonNumber).toLowerCase()!==String(target.lessonNumber).toLowerCase())throw Error('Lesson identity mismatch.');
 if(pkg.courseProfileId&&pkg.courseProfileId!==target.courseProfileId)throw Error('Course identity mismatch.');
 if(typeof pkg.title!=='string'||!pkg.title.trim()||pkg.title.length>140)throw Error('Invalid title.');
 if(!Array.isArray(pkg.screens)||!pkg.screens.length||pkg.screens.length>80)throw Error('Invalid screens.');
 for(const s of pkg.screens){
  if(!Array.isArray(s.blocks)||(!s.blocks.length&&!s.functional)||s.blocks.length>80)throw Error('Invalid blocks.');
  if(s.functional){if(s.composite||s.comboId||s.certified)throw Error('Conflicting functional template.');mapFunctionalDraft(s.functional);if(s.blocks.some(b=>b.type!=='image')||s.blocks.length>1)throw Error('Functional slide only accepts one image block.');if(s.functional.type==='consolidation'&&s.blocks.length)throw Error('Consolidation has no image slot.');if(s.functional.type==='lesson-part-cover'&&s.blocks.length!==1)throw Error('Cover image required.');}
  if(s.composite)createComposite(s);
  if(s.certified&&s.comboId)throw Error('Conflicting template types.');
  if(s.comboId==='video-before-while-after'&&!s.blocks.some(b=>b.comboStep==='while'&&(b.type==='video'||b.type==='video-question')))throw Error('While Viewing requires video.');
  for(const b of s.blocks){const a=b.activity||{};
   if(['fill','matching','ordering','categorising'].includes(b.type)&&!unique((a.items||a.pairs||[]).map(x=>x.id)))throw Error('Invalid or duplicate item ID.');
   if(a.answerKey&&!unique(a.answerKey))throw Error('Duplicate or invalid answer key.');
   if(b.type==='ordering'&&(a.answerKey?.length!==a.items.length||!a.answerKey.every(k=>a.items.some(x=>x.id===k))))throw Error('Invalid ordering key.');
   if(b.type==='categorising'&&(!unique(a.categories)||a.items.some(x=>!a.categories.includes(x.category))))throw Error('Invalid categories.');
   if(['audio','video','listening','video-question'].includes(b.type)&&!uuid((['audio','video'].includes(b.type)?b.content:a.media)?.assetId))throw Error('Private media ID required.');
  }
 }
 return pkg.title;
}
/* Package review is provenance, never an approval grant. Keep only bounded
 * plain-text source statements and notes; do not copy caller-supplied status. */
export function nativeSourceReview(pkg){
 const r=pkg?.review;
 if(r==null)return null;
 if(typeof r!=='object'||Array.isArray(r))throw Error('Invalid package review.');
 const text=(v,n)=>{if(typeof v!=='string'||v.length>n||!v.trim())throw Error('Invalid package review text.');return v;};
 const source=r.source==null?'':text(r.source,2000);
 const notes=r.notes==null?[]:r.notes;
 if(!Array.isArray(notes)||notes.length>40)throw Error('Invalid package review notes.');
 return {source,notes:notes.map(v=>text(v,2000)),...(r.reports?{reports:normalizeReviewReports(r.reports)}:{}),status:'teacher-review-required'};
}
export async function resolvePrivateMedia(screens,fetcher=globalThis.fetch){
 const refs=[];for(const s of screens)for(const b of s.blocks){if(['audio','video'].includes(b.type))refs.push([b.content,b.type]);if(b.type==='image'&&uuid(b.content?.assetId))refs.push([b.content,'image']);if(['listening','video-question'].includes(b.type))refs.push([b.activity.media,b.type==='listening'?'audio':'video']);}
 if(!refs.length)return;
 const response=await fetcher('/api/studio-media',{cache:'no-store'});const body=await response.json();if(!response.ok||!body.ok||!Array.isArray(body.files))throw Error('Media library unavailable.');
 for(const [ref,kind] of refs)if(!uuid(ref.assetId)||!body.files.some(f=>f.asset_id===ref.assetId&&f.status==='active'&&f.content_type?.startsWith(kind+'/')))throw Error('Media missing or wrong type.');
 for(const [ref] of refs)ref.src='/api/studio-media?document=1&open='+encodeURIComponent(ref.assetId);
}
/* Use only existing draft content; it is not independent source verification.
 * Never infer that multiple screens constitute independent Jigsaw accounts. */
export function sourceFromNativeDraft(lesson,focus){
 const screens=(lesson?.screens||[]).filter(s=>String(s.stage||'').toLowerCase().includes(String(focus).toLowerCase()));
 if(!screens.length)return null;
 const pages=[...new Set(screens.map(s=>s.sourcePage).filter(Number.isInteger))];
 const result={sourceVerified:false,sourceRef:pages.map(p=>'p. '+p).join(', '),passage:'',questions:[]};
 const texts=[];
 for(const s of screens)for(const b of s.blocks||[]){const a=b.activity||{},ref=Number.isInteger(s.sourcePage)?'p. '+s.sourcePage:undefined;
  if(b.type==='text'&&b.content?.text)texts.push(b.content.text);
  if(b.type==='audio'&&b.content?.src)result.audioSrc=b.content.src;
  if(b.type==='listening'&&a.media?.src)result.audioSrc=a.media.src;
  if(b.type==='video'&&b.content?.src)result.videoSrc=b.content.src;
  if(b.type==='video-question'&&a.media?.src)result.videoSrc=a.media.src;
  if(b.type==='fill')for(const x of a.items||[])result.questions.push({text:x.prompt,answers:x.answers,evidenceQuote:a.evidenceByItem?.[x.id]?.quote,why:a.evidenceByItem?.[x.id]?.why,sourceRef:ref});
  if(['mcq','multi-select','true-false','listening','video-question'].includes(b.type))result.questions.push({text:a.prompt,answers:(a.answerKey||[]).map(k=>a.options?.find(o=>o.id===k)?.label||k),sourceRef:ref});
  if(b.type==='matching')for(const x of a.pairs||[])result.questions.push({text:x.left,answers:[x.right],evidenceQuote:a.evidenceByItem?.[x.id]?.quote,why:a.evidenceByItem?.[x.id]?.why,sourceRef:ref});
 }
 result.passage=[...new Set(texts)].join('\n');
 return result;
}
