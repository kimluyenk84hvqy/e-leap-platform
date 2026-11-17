// U6-only, role-bound private media stream; never expose Vercel Blob paths or all-account text.
import {getResearchDb} from '../_research-db.js';
import {requireAuth,studentInClass} from '../_auth.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(res,code,message)=>res.status(code).json({ok:false,error:message});
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return fail(res,405,'Method not allowed');}
  const user=await requireAuth(req,res);if(!user)return;
  // Photographs are shared in the home group, but original A/B/C passages remain isolated.
  if(user.role!=='student')return fail(res,403,'Student login required');
  const assignmentId=String(req.query?.assignmentId||''),assetId=String(req.query?.assetId||'');
  if(!UUID.test(assignmentId)||!UUID.test(assetId))return fail(res,400,'Invalid media request');
  const sql=getResearchDb();
  const assignments=await sql`SELECT assignment_id,class_id,status FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`;
  if(!assignments.length)return fail(res,404,'Assignment not found');
  const assignment=assignments[0];
  if(assignment.status!=='active'||!await studentInClass(sql,user,assignment.class_id))
   return fail(res,403,'Reading access denied');
  const rows=await sql`SELECT j.photo_assets,j.created_by,j.source_text_verified,j.photo_assets_verified
   FROM reading_jigsaw_members m JOIN reading_jigsaw_materials j
   ON j.assignment_id=m.assignment_id AND j.class_id=m.class_id
   WHERE m.assignment_id=${assignmentId} AND m.student_user_id=${user.user_id}
   AND m.class_id=${assignment.class_id} AND m.account IN ('A','B','C') LIMIT 1`;
  if(!rows.length)return fail(res,403,'Reading account not assigned');
  const source=rows[0];
  if(!source.source_text_verified||!source.photo_assets_verified)
   return fail(res,423,'Textbook photographs awaiting teacher review');
  const photos=source.photo_assets;
  if(!Array.isArray(photos)||photos.length!==3||!photos.some(a=>a?.assetId===assetId))
   return fail(res,403,'Photo is not assigned to this Reading');
  const media=await sql`SELECT blob_path,content_type,category FROM studio_media_v1
   WHERE asset_id::text=${assetId} AND owner_id=${String(source.created_by)}
     AND status='active' LIMIT 1`;
  if(!media.length||!['image/jpeg','image/png','image/webp'].includes(media[0].content_type)
    ||!['image','textbook'].includes(media[0].category))
   return fail(res,404,'Verified Reading photograph unavailable');
  const {get}=await import('@vercel/blob');
  const file=await get(media[0].blob_path,{access:'private'});
  if(!file)return fail(res,404,'Photograph unavailable');
  res.setHeader('Content-Type',media[0].content_type);
  res.setHeader('Content-Disposition','inline');
  const reader=file.stream.getReader();
  while(true){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));}
  return res.end();
 }catch(error){
  console.error('U6 photo delivery failed',error);
  if(!res.headersSent)return fail(res,500,'Photograph unavailable');
  return res.end();
 }
}
