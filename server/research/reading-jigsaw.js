import {getResearchDb} from '../_research-db.js';
import {requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass} from '../_auth.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LABELS=['A','B','C'];
const safeText=v=>typeof v==='string'?v.trim():'';
const validMaterial=m=>m&&typeof m==='object'&&
 Object.keys(m.accounts||{}).sort().join(',')==='A,B,C'&&
 LABELS.every(k=>safeText(m.accounts[k]).length>=20&&m.accounts[k].length<=10000)&&
 Array.isArray(m.photoLabels)&&m.photoLabels.length===3&&
 m.photoLabels.every(s=>safeText(s).length>0&&s.length<=100)&&
 (!m.photoAssets || (Array.isArray(m.photoAssets)&&m.photoAssets.length===3&&
  m.photoAssets.every(a=>a&&safeText(a.assetId).length>0&&safeText(a.alt).length>0)))&&
 Array.isArray(m.originalQuestions)&&m.originalQuestions.length===2&&
 m.originalQuestions.every(q=>safeText(q).length>=10&&q.length<=500)&&
 Number.isInteger(m.sourcePage)&&m.sourcePage>0;
export default async function handler(req,res){
 try{
  const sql=getResearchDb();
  const user=await requireAuth(req,res);if(!user)return;
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(req.method==='POST'&&!requireSameOrigin(req,res))return;
  const assignmentId=String(req.method==='GET'?req.query?.assignmentId:req.body?.assignmentId||'');
  if(!UUID.test(assignmentId))return res.status(400).json({ok:false,code:'INVALID_ASSIGNMENT',error:'Valid assignment ID is required'});
  const a=await sql`SELECT assignment_id,class_id,resource_id,activity_id,status FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`;
  if(!a.length)return res.status(404).json({ok:false,error:'Assignment not found'});
  const assignment=a[0],isStaff=['teacher','admin'].includes(user.role);
  if(isStaff){
   if(!await teacherOwnsClass(sql,user,assignment.class_id))return res.status(403).json({ok:false,error:'Class access denied'});
  }else if(!await studentInClass(sql,user,assignment.class_id)){
   return res.status(403).json({ok:false,error:'Not a member of this class'});
  }
  if(req.method==='GET'){
   if(isStaff){
    const material=await sql`SELECT * FROM reading_jigsaw_materials WHERE assignment_id=${assignmentId} LIMIT 1`;
    const members=await sql`SELECT student_user_id,account,assigned_at FROM reading_jigsaw_members WHERE assignment_id=${assignmentId} ORDER BY account,assigned_at`;
    const roster=await sql`SELECT u.user_id,u.display_name,u.student_id FROM auth_class_members m
      JOIN auth_users u ON u.user_id=m.student_user_id
      WHERE m.class_id=${String(assignment.class_id)} AND m.status='active' AND u.role='student' AND u.status='active'
      ORDER BY u.display_name`;
    return res.status(200).json({ok:true,reviewOnly:true,
      assignment:{assignmentId,resourceId:assignment.resource_id,activityId:assignment.activity_id},
      material:material[0]||null,members,roster});
   }
   if(assignment.status!=='active')return res.status(403).json({ok:false,error:'Assignment is not active'});
   const rows=await sql`SELECT m.account,j.accounts->>m.account AS passage,j.photo_labels,j.photo_assets,j.original_questions,
       j.source_page,j.source_text_verified,j.photo_assets_verified
       FROM reading_jigsaw_members m JOIN reading_jigsaw_materials j ON j.assignment_id=m.assignment_id
       WHERE m.assignment_id=${assignmentId} AND m.student_user_id=${user.user_id} AND m.class_id=${assignment.class_id} LIMIT 1`;
   if(!rows.length)return res.status(403).json({ok:false,code:'READING_NOT_ASSIGNED',error:'Reading account not assigned'});
   const r=rows[0];
   if(!r.source_text_verified||!r.photo_assets_verified)
    return res.status(423).json({ok:false,code:'SOURCE_REVIEW_REQUIRED',error:'Teacher must verify the original text and images'});
   return res.status(200).json({ok:true,assignmentId,resourceId:assignment.resource_id,activityId:assignment.activity_id,
    account:r.account,passage:r.passage,
    photoLabels:r.photo_labels,originalQuestions:r.original_questions,sourcePage:r.source_page,
    photoAssets:r.photo_assets,
    evidencePrompt:'Quote a short phrase from YOUR account. Explain why it supports your answer.',
    note:'Only your assigned account is released for individual and expert reading.'});
  }
  if(!isStaff)return res.status(403).json({ok:false,code:'FORBIDDEN',error:'Teacher role required'});
  const action=String(req.body?.action||'');
  if(action==='draft'){
   const material=req.body?.material;
   if(!validMaterial(material))return res.status(400).json({ok:false,code:'INVALID_SOURCE',error:'Three complete accounts, three photo labels and two original questions are required'});
   // Neon SQL parameters for JS arrays are PostgreSQL arrays, NOT JSONB.
   // Serialize the real textbook source explicitly before storing JSONB columns.
   const accountsJson=JSON.stringify(material.accounts);
   const labelsJson=JSON.stringify(material.photoLabels);
   const photosJson=JSON.stringify(material.photoAssets||[]);
   const questionsJson=JSON.stringify(material.originalQuestions);
   const rows=await sql`INSERT INTO reading_jigsaw_materials(assignment_id,class_id,accounts,photo_labels,photo_assets,original_questions,source_page,created_by)
     VALUES(${assignmentId},${assignment.class_id},${accountsJson}::jsonb,${labelsJson}::jsonb,${photosJson}::jsonb,${questionsJson}::jsonb,${material.sourcePage},${user.user_id})
     ON CONFLICT(assignment_id) DO UPDATE SET accounts=EXCLUDED.accounts,photo_labels=EXCLUDED.photo_labels,
      photo_assets=EXCLUDED.photo_assets,
      original_questions=EXCLUDED.original_questions,source_page=EXCLUDED.source_page,
      source_text_verified=FALSE,photo_assets_verified=FALSE,reviewed_by=NULL,reviewed_at=NULL,updated_at=NOW()
     RETURNING assignment_id,source_text_verified,photo_assets_verified`;
   return res.status(200).json({ok:true,reviewOnly:true,material:rows[0]});
  }
  if(action==='assign'){
   const studentUserId=String(req.body?.studentUserId||''),account=String(req.body?.account||'');
   if(!UUID.test(studentUserId)||!LABELS.includes(account))return res.status(400).json({ok:false,error:'Valid Student UUID and A/B/C account required'});
   const member=await sql`SELECT 1 FROM auth_class_members m JOIN auth_users u ON u.user_id=m.student_user_id
     WHERE m.class_id=${String(assignment.class_id)} AND m.student_user_id=${studentUserId} AND m.status='active'
      AND u.role='student' AND u.status='active' LIMIT 1`;
   if(!member.length)return res.status(403).json({ok:false,code:'NOT_CLASS_STUDENT',error:'Student is not enrolled in this class'});
   const rows=await sql`INSERT INTO reading_jigsaw_members(assignment_id,class_id,student_user_id,account,assigned_by)
     VALUES(${assignmentId},${assignment.class_id},${studentUserId},${account},${user.user_id})
     ON CONFLICT(assignment_id,student_user_id) DO UPDATE SET account=EXCLUDED.account,assigned_by=EXCLUDED.assigned_by,assigned_at=NOW()
     RETURNING student_user_id,account`;
   return res.status(200).json({ok:true,member:rows[0]});
  }
  if(action==='verify'){
   // This action is an explicit authenticated teacher attestation.
   if(req.body?.confirmSourceText!==true||req.body?.confirmOriginalPhotos!==true)
    return res.status(400).json({ok:false,code:'REVIEW_CONFIRMATION_REQUIRED',error:'Verify against textbook and original photo assets first'});
   // Three source-matched media assets are required before a teacher can attest
   // to photograph verification. Labels alone do not constitute uploaded images.
   const media=await sql`SELECT photo_assets FROM reading_jigsaw_materials WHERE assignment_id=${assignmentId} LIMIT 1`;
   if(!media.length)return res.status(404).json({ok:false,error:'Reading material is missing'});
   const photos=media[0].photo_assets;
   if(!Array.isArray(photos)||photos.length!==3||
     photos.some(a=>!a||!UUID.test(String(a.assetId||''))||!safeText(a.alt))||
     new Set(photos.map(a=>a.assetId)).size!==3)
     return res.status(409).json({ok:false,code:'PHOTO_ASSETS_MISSING',error:'Link three distinct original photograph IDs from Media Library before verification'});
   // Never attest photo IDs on faith: all assets must exist, be active private images,
   // and belong to the teacher who originally supplied this U6 source.
   const owner=await sql`SELECT created_by FROM reading_jigsaw_materials WHERE assignment_id=${assignmentId} LIMIT 1`;
   if(!owner.length)return res.status(404).json({ok:false,error:'Reading source missing'});
   for(const photo of photos){
     const verified=await sql`SELECT asset_id FROM studio_media_v1
       WHERE asset_id::text=${photo.assetId} AND owner_id=${String(owner[0].created_by)}
       AND status='active' AND category IN ('image','textbook')
       AND content_type IN ('image/jpeg','image/png','image/webp') LIMIT 1`;
     if(!verified.length)
       return res.status(409).json({ok:false,code:'PHOTO_ASSET_NOT_VERIFIED',error:'One or more original photograph assets are unavailable in the teacher Media Library'});
   }
   const rows=await sql`UPDATE reading_jigsaw_materials
    SET source_text_verified=TRUE,photo_assets_verified=TRUE,reviewed_by=${user.user_id},reviewed_at=NOW(),updated_at=NOW()
    WHERE assignment_id=${assignmentId} RETURNING assignment_id,source_text_verified,photo_assets_verified`;
   if(!rows.length)return res.status(404).json({ok:false,error:'Reading material is missing'});
   return res.status(200).json({ok:true,material:rows[0]});
  }
  return res.status(400).json({ok:false,error:'Unknown Jigsaw action'});
 }catch(error){console.error('Jigsaw API failed',error);return res.status(500).json({ok:false,error:'Reading service unavailable'});}
}
