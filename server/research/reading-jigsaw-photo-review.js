/* Authenticated staff review of U6 private textbook photos.
 * Strict assignment/class/asset check; no blob URL disclosed to browsers.
 */
import {getResearchDb} from '../_research-db.js';
import {requireAuth,teacherOwnsClass} from '../_auth.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(res,code,message)=>res.status(code).json({ok:false,error:message});
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return fail(res,405,'Method not allowed');}
  const user=await requireAuth(req,res);if(!user)return;
  if(!['teacher','admin'].includes(user.role))return fail(res,403,'Teacher role required');
  const assignmentId=String(req.query?.assignmentId||''),assetId=String(req.query?.assetId||'');
  if(!UUID.test(assignmentId)||!UUID.test(assetId))return fail(res,400,'Invalid media request');
  const sql=getResearchDb();
  const assignments=await sql`SELECT assignment_id,class_id FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`;
  if(!assignments.length)return fail(res,404,'Assignment not found');
  if(!await teacherOwnsClass(sql,user,assignments[0].class_id))return fail(res,403,'Class access denied');
  const rows=await sql`SELECT j.photo_assets,j.created_by,j.source_text_verified,j.photo_assets_verified
     FROM reading_jigsaw_materials j WHERE j.assignment_id=${assignmentId} AND j.class_id=${assignments[0].class_id} LIMIT 1`;
  if(!rows.length||!rows[0].source_text_verified||!rows[0].photo_assets_verified)return fail(res,423,'Textbook source not verified');
  const photos=rows[0].photo_assets;
  if(!Array.isArray(photos)||!photos.some(p=>p?.assetId===assetId))return fail(res,403,'Photo not in verified source');
  const media=await sql`SELECT blob_path,content_type,category FROM studio_media_v1
    WHERE asset_id::text=${assetId} AND owner_id=${String(rows[0].created_by)} AND status='active' LIMIT 1`;
  if(!media.length||!['image/jpeg','image/png','image/webp'].includes(media[0].content_type)||!['image','textbook'].includes(media[0].category))return fail(res,404,'Photo unavailable');
  const {get}=await import('@vercel/blob');
  const file=await get(media[0].blob_path,{access:'private'});
  if(!file)return fail(res,404,'Photo unavailable');
  res.setHeader('Content-Type',media[0].content_type);
  res.setHeader('Content-Disposition','inline');
  const reader=file.stream.getReader();
  while(true){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));}
  return res.end();
 }catch(error){
  console.error('U6 teacher photo review failed',error);
  if(!res.headersSent)return fail(res,500,'Photo unavailable');
  return res.end();
 }
}
