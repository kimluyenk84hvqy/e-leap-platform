import {requireAuth, requireSameOrigin} from '../_auth.js';
import {getResearchDb, isBoundToExpectedPreviewDatabase} from '../_research-db.js';
import {recordCoursePublication} from './course-publication.js';

import {courseImage, projectCourseLesson, checkCourseActivity} from './course-learner.js';

const courseSlots=['objective-first-b2-u04-l01','objective-first-b2-u04-l02'];

async function readPublication(req,res){
  const staff=await requireAuth(req,res,['admin','teacher','student']);
  if(!staff)return;
  const shellId=req.query?.shellId;
  if(!courseSlots.includes(shellId))return res.status(404).json({ok:false,error:'Unknown course lesson.'});
  try{
    const sql=getResearchDb();
    if(req.query?.summary==='1'){
      const [row]=await sql`SELECT shell_id, lesson->>'title' AS title
        FROM studio_course_publications_v1 WHERE shell_id=${shellId}`;
      return res.status(200).json({ok:true,publication:row||null});
    }
    const [row]=await sql`SELECT lesson,published_by FROM studio_course_publications_v1 WHERE shell_id=${shellId}`;
    if(!row)return res.status(404).json({ok:false,error:'This course lesson has not been published.'});
    if(req.query?.image){
      const id=req.query.image;
      if(!courseImage(row.lesson,id))return res.status(404).end();
      const [asset]=await sql`SELECT blob_path,content_type FROM studio_media_v1
        WHERE asset_id::text=${id} AND owner_id=${row.published_by} AND status='active'`;
      if(!asset||!['image/jpeg','image/png','image/webp'].includes(asset.content_type))return res.status(404).end();
      const {get}=await import('@vercel/blob');
      const file=await get(asset.blob_path,{access:'private'});
      if(!file?.stream)return res.status(404).end();
      res.setHeader('Content-Type',asset.content_type);
      res.setHeader('X-Content-Type-Options','nosniff');
      for await(const chunk of file.stream)res.write(Buffer.from(chunk));
      return res.end();
    }
    const lesson=staff.role==='student'?projectCourseLesson(row.lesson,shellId):row.lesson;
    return res.status(200).json({ok:true,lesson});
  }catch{
    return res.status(503).json({ok:false,error:'Course publication storage is unavailable.'});
  }
}

async function checkActivity(req,res){
  const student=await requireAuth(req,res,['student']);
  if(!student)return;
  const {shellId,blockId,values}=req.body||{};
  if(!courseSlots.includes(shellId)||typeof blockId!=='string'||blockId.length>120){
    return res.status(400).json({ok:false,error:'Invalid activity.'});
  }
  try{
    const sql=getResearchDb();
    const [row]=await sql`SELECT lesson FROM studio_course_publications_v1 WHERE shell_id=${shellId}`;
    const score=row&&checkCourseActivity(row.lesson,blockId,values);
    if(!score)return res.status(422).json({ok:false,error:'Activity or response is unavailable.'});
    return res.status(200).json({ok:true,score});
  }catch{
    return res.status(503).json({ok:false,error:'Activity check is unavailable.'});
  }
}

export default async function publishCourse(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET','POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ok: false, error: 'Method not allowed'});
  }
  if (!requireSameOrigin(req, res)) return;
  if (!isBoundToExpectedPreviewDatabase()) {
    return res.status(423).json({ok: false, error: 'Publication requires the verified Preview database.'});
  }
  if(req.method==='GET')return readPublication(req,res);
  if(req.body?.action==='check')return checkActivity(req,res);
  const admin = await requireAuth(req, res, ['admin']);
  if (!admin) return;

  const {draftId, revision, shellId} = req.body || {};
  if (typeof draftId !== 'string' || !/^[a-zA-Z0-9_-]{4,120}$/.test(draftId) ||
      !Number.isSafeInteger(revision) || revision < 1 ||
      !courseSlots.includes(shellId)) {
    return res.status(400).json({ok: false, error: 'A saved draft revision and a Unit 4 lesson slot are required.'});
  }

  try {
    const result = await recordCoursePublication(getResearchDb(), {
      ownerId: admin.user_id, draftId, revision, shellId
    });
    if (result.ok) return res.status(200).json(result);
    if (result.code === 'QUALITY_GATE') {
      return res.status(422).json({...result, error: result.blockers.join(' · ')});
    }
    return res.status(409).json({...result, error: 'The draft revision or course slot changed. Reopen the saved draft.'});
  } catch {
    return res.status(503).json({ok: false, error: 'Course publication storage is unavailable.'});
  }
}
