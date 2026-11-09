import { getResearchDb, researchDbAvailable } from '../_research-db.js';
import { requireAuth, requireSameOrigin } from '../_auth.js';

const MAX_BYTES=1_500_000;
const validateId=id=>typeof id==='string' && id.length>=1 && id.length<=150 && /^[a-zA-Z0-9][a-zA-Z0-9:_./-]*$/.test(id);
async function ensureStore(sql){
  await sql`CREATE TABLE IF NOT EXISTS authoring_lessons (
    lesson_id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL,
    content JSONB NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    workflow TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_authoring_lessons_owner ON authoring_lessons(owner_id,updated_at DESC)`;
}
function publicRecord(row){return {id:row.lesson_id,lesson:row.content,revision:row.revision,workflow:row.workflow,updatedAt:row.updated_at};}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  if(!['GET','POST'].includes(req.method)){
    res.setHeader('Allow',['GET','POST']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  if(!researchDbAvailable())return res.status(503).json({ok:false,error:'Lesson database is not configured',code:'DB_NOT_CONFIGURED'});
  if(req.method==='POST'&&!requireSameOrigin(req,res))return;
  try{
    // Browser preview role flags must never grant server write access.
    const user=await requireAuth(req,res,['admin','teacher']);
    if(!user)return;
    const sql=getResearchDb();
    await ensureStore(sql);
    if(req.method==='GET'){
      const id=String(req.query?.id||'');
      if(!validateId(id))return res.status(400).json({ok:false,error:'Valid lesson id required'});
      const rows=user.role==='admin'
        ? await sql`SELECT lesson_id,content,revision,workflow,updated_at FROM authoring_lessons WHERE lesson_id=${id} LIMIT 1`
        : await sql`SELECT lesson_id,content,revision,workflow,updated_at FROM authoring_lessons WHERE lesson_id=${id} AND owner_id=${user.user_id} LIMIT 1`;
      if(!rows.length)return res.status(404).json({ok:false,error:'Draft not found'});
      return res.status(200).json({ok:true,...publicRecord(rows[0])});
    }
    const action=String(req.body?.action||'');
    if(!['save-draft','request-publish'].includes(action))return res.status(400).json({ok:false,error:'Unsupported action'});
    const lesson=req.body?.lesson;
    if(!lesson||typeof lesson!=='object'||Array.isArray(lesson)||!validateId(lesson.id)||!Array.isArray(lesson.screens))
      return res.status(400).json({ok:false,error:'Invalid lesson data'});
    if(lesson.screens.length>300)return res.status(413).json({ok:false,error:'Too many slides'});
    const content=JSON.stringify(lesson);
    if(Buffer.byteLength(content,'utf8')>MAX_BYTES)return res.status(413).json({ok:false,error:'Lesson exceeds size limit; store media separately'});
    const expectedRevision=Number(req.body?.expectedRevision);
    if(!Number.isInteger(expectedRevision)||expectedRevision<0)return res.status(400).json({ok:false,error:'Valid expectedRevision is required'});
    const id=lesson.id;
    const workflow=action==='request-publish'?'review-requested':'draft';
    let rows=[];
    if(expectedRevision===0){
      rows=await sql`INSERT INTO authoring_lessons(lesson_id,owner_id,content,revision,workflow)
        VALUES(${id},${user.user_id},${content}::jsonb,1,${workflow})
        ON CONFLICT(lesson_id) DO NOTHING
        RETURNING lesson_id,content,revision,workflow,updated_at`;
    }else{
      rows=await sql`UPDATE authoring_lessons SET content=${content}::jsonb,revision=revision+1,
        workflow=${workflow},updated_at=NOW()
        WHERE lesson_id=${id} AND revision=${expectedRevision}
        AND (owner_id=${user.user_id} OR ${user.role==='admin'})
        RETURNING lesson_id,content,revision,workflow,updated_at`;
    }
    if(!rows.length){
      // Avoid revealing the existence/ownership of another teacher's lesson.
      return res.status(409).json({ok:false,error:'Draft was changed elsewhere or is not available to this account',code:'REVISION_CONFLICT'});
    }
    return res.status(200).json({ok:true,...publicRecord(rows[0])});
  }catch(err){console.error('Authoring persistence failure',err);
    return res.status(500).json({ok:false,error:'Could not save or load lesson'});
  }
}
