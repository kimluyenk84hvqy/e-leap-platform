import { randomBytes } from 'node:crypto';
import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass } from '../_auth.js';
import { ensureLiveSchema } from '../_live-schema.js';
function code(){return randomBytes(5).toString('base64url').replace(/[-_]/g,'A').slice(0,6).toUpperCase();}
export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res,['teacher','admin']);
    if(!user)return;
    await ensureLiveSchema(sql);
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const {classId,lessonId}=req.body||{};
      if(!classId||!lessonId)return res.status(400).json({ok:false,error:'classId and lessonId are required'});
      if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      let joinCode=code();
      for(let i=0;i<5;i++){
        const x=await sql`SELECT 1 FROM sessions WHERE join_code=${joinCode} AND COALESCE(status,'active')='active' LIMIT 1`;
        if(!x.length)break;
        joinCode=code();
      }
      const teacherId=user.role==='admin'&&req.body?.teacherId?req.body.teacherId:user.user_id;
      const rows=await sql`INSERT INTO sessions(class_id,teacher_id,lesson_id,join_code,status,started_at,created_at)
        VALUES(${classId},${teacherId},${lessonId},${joinCode},'active',NOW(),NOW()) RETURNING *`;
      return res.status(201).json({ok:true,session:rows[0]});
    }
    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      const {sessionId,status}=req.body||{};
      if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT * FROM sessions WHERE session_id=${sessionId} LIMIT 1`;
      if(!s.length)return res.status(404).json({ok:false,error:'Session not found'});
      if(!await teacherOwnsClass(sql,user,s[0].class_id))return res.status(403).json({ok:false,error:'Session access denied'});
      const rows=await sql`UPDATE sessions SET status=${status||'ended'},ended_at=CASE WHEN ${status||'ended'}='ended' THEN NOW() ELSE ended_at END WHERE session_id=${sessionId} RETURNING *`;
      return res.status(200).json({ok:true,session:rows[0]});
    }
    if(req.method==='GET'){
      const rows=user.role==='admin'
        ?await sql`SELECT * FROM sessions ORDER BY COALESCE(created_at,NOW()) DESC LIMIT 200`
        :await sql`SELECT * FROM sessions WHERE teacher_id=${user.user_id} ORDER BY COALESCE(created_at,NOW()) DESC LIMIT 200`;
      return res.status(200).json({ok:true,sessions:rows});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){
    console.error('sessions failed',e);
    return res.status(500).json({ok:false,error:'Sessions request failed',detail:process.env.NODE_ENV==='production'?undefined:String(e?.message||e)});
  }
}
