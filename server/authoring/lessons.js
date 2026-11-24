import {getResearchDb,isBoundToExpectedPreviewDatabase} from '../_research-db.js';
import {requireAuth,requireSameOrigin} from '../_auth.js';
import {courseProfileById,validateCourseIdentity} from '../../assets/js/authoring/course-profile-registry.js';
const fail=(res,status,error,code)=>res.status(status).json({ok:false,error,code});
const goodId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{4,120}$/.test(v);
export function validateServerLesson(lesson){
 const errors=[];
 if(!lesson||typeof lesson!=='object'||Array.isArray(lesson))return ['Invalid lesson object'];
 if(!goodId(lesson.id))errors.push('Invalid lesson identifier');
 if(lesson.status!=='draft')errors.push('Only draft lessons may be stored');
 if(!Array.isArray(lesson.screens)||!lesson.screens.length||lesson.screens.length>100)errors.push('Invalid slide count');
 if(typeof lesson.title!=='string'||!lesson.title.trim()||lesson.title.length>180)errors.push('Invalid lesson title');
 if(lesson.resourceBank||lesson.screens?.some(s=>s?.sourceReviewDraft||s?.resourceStage))errors.push('Restricted source-review content cannot be synchronized');
 const profile=courseProfileById(lesson.courseProfileId);
 if(!profile||profile.availability!=='active')errors.push('A valid active Course Profile ID is required');
 if(profile&&lesson.courseLabel!==profile.label)errors.push('Course name and ID mismatch');
 if(profile?.kind==='skills'&&validateCourseIdentity(lesson).some(e=>e.includes('Advanced Skills')))errors.push('Invalid Advanced Skills destination');
 if(profile?.kind!=='skills'&&lesson.advancedSkillId)errors.push('Skill path cannot be mixed with a textbook');
 try{if(JSON.stringify(lesson).length>350000)errors.push('Lesson exceeds 350 KB limit')}catch{errors.push('Lesson cannot be serialized')}
 return errors;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(!['GET','POST'].includes(req.method))return fail(res,405,'Method not allowed','METHOD');
 if(!requireSameOrigin(req,res))return;
 const user=await requireAuth(req,res,['teacher','admin']);if(!user)return;
 if(process.env.VERCEL_ENV!=='preview'||isBoundToExpectedPreviewDatabase()!==true)
  return fail(res,423,'Authoring API restricted to verified Preview database','PREVIEW_ONLY');
 try{
  const sql=getResearchDb();
  if(req.method==='GET'){
   const id=String(req.query?.id||'');
   if(id){
    if(!goodId(id))return fail(res,400,'Invalid ID','INVALID_ID');
    const rows=await sql`SELECT lesson_id,lesson,revision,updated_at FROM studio_lesson_drafts_v1
      WHERE lesson_id=${id} AND owner_user_id=${user.user_id} LIMIT 1`;
    if(!rows.length)return fail(res,404,'Draft not found','NOT_FOUND');
    return res.status(200).json({ok:true,draft:rows[0].lesson,revision:rows[0].revision,savedAt:rows[0].updated_at});
   }
   const rows=await sql`SELECT lesson_id,course_profile_id,advanced_skill_id,title,revision,updated_at
      FROM studio_lesson_drafts_v1 WHERE owner_user_id=${user.user_id}
      ORDER BY updated_at DESC LIMIT 30`;
   return res.status(200).json({ok:true,drafts:rows.map(r=>({id:r.lesson_id,courseProfileId:r.course_profile_id,advancedSkillId:r.advanced_skill_id,title:r.title,revision:r.revision,savedAt:r.updated_at}))});
  }
  const lesson=req.body?.lesson,expected=req.body?.expectedRevision;
  const problems=validateServerLesson(lesson);
  if(problems.length)return fail(res,422,problems.join('; '),'INVALID_DRAFT');
  if(!Number.isSafeInteger(expected)||expected<0)return fail(res,400,'Expected revision is required','REVISION_REQUIRED');
  const json=JSON.stringify(lesson);
  if(Buffer.byteLength(json,'utf8')>350000)return fail(res,413,'Draft exceeds 350 KB','TOO_LARGE');
  const current=await sql`SELECT owner_user_id,revision FROM studio_lesson_drafts_v1 WHERE lesson_id=${lesson.id} LIMIT 1`;
  if(current.length){
   if(String(current[0].owner_user_id)!==String(user.user_id))return fail(res,404,'Draft not found','NOT_FOUND');
   const rows=await sql`UPDATE studio_lesson_drafts_v1
     SET lesson=${json}::jsonb,title=${lesson.title},
       course_profile_id=${lesson.courseProfileId},advanced_skill_id=${lesson.advancedSkillId||null},
       revision=revision+1,updated_at=NOW()
     WHERE lesson_id=${lesson.id} AND owner_user_id=${user.user_id} AND revision=${expected}
     RETURNING revision,updated_at`;
   if(!rows.length)return fail(res,409,'Draft changed in another tab or device. Reload first.','VERSION_CONFLICT');
   return res.status(200).json({ok:true,saved:true,revision:rows[0].revision,savedAt:rows[0].updated_at});
  }
  if(expected!==0)return fail(res,409,'Draft no longer matches expected revision','VERSION_CONFLICT');
  const rows=await sql`INSERT INTO studio_lesson_drafts_v1
    (lesson_id,owner_user_id,course_profile_id,advanced_skill_id,title,lesson,revision)
    VALUES(${lesson.id},${user.user_id},${lesson.courseProfileId},${lesson.advancedSkillId||null},${lesson.title},${json}::jsonb,1)
    ON CONFLICT(lesson_id) DO NOTHING RETURNING revision,updated_at`;
  if(!rows.length)return fail(res,409,'Draft already exists. Reload first.','VERSION_CONFLICT');
  return res.status(201).json({ok:true,saved:true,revision:rows[0].revision,savedAt:rows[0].updated_at});
 }catch(error){
  console.error('Studio draft persistence failed',error?.message);
  return fail(res,500,'Draft storage unavailable','STORAGE_ERROR');
 }
}