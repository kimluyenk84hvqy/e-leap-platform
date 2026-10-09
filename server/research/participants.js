import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,normalizeStudentId,createSession,teacherOwnsClass,hashPassword,verifyPassword,ensureAuthSchema } from '../_auth.js';
import { ensureLiveSchema } from '../_live-schema.js';
export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    await ensureAuthSchema();
    await ensureLiveSchema(sql);
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const joinCode=String(req.body?.joinCode||'').trim().toUpperCase(),studentId=normalizeStudentId(req.body?.studentId||req.body?.participantCode),displayName=String(req.body?.displayName||'Student').trim().slice(0,160),pin=String(req.body?.pin||'');
      if(!joinCode||!studentId||!pin)return res.status(400).json({ok:false,error:'joinCode, studentId and PIN are required'});
      if(pin.length<6)return res.status(400).json({ok:false,error:'Student PIN must be at least 6 characters'});
      const s=await sql`SELECT * FROM sessions WHERE join_code=${joinCode} AND COALESCE(status,'active')='active' LIMIT 1`;
      if(!s.length)return res.status(404).json({ok:false,error:'Join code is invalid or session has ended'});
      let u=await sql`SELECT * FROM auth_users WHERE student_id=${studentId} AND role='student' LIMIT 1`;
      if(!u.length){u=await sql`INSERT INTO auth_users(student_id,display_name,role,password_hash) VALUES(${studentId},${displayName},'student',${hashPassword(pin)}) RETURNING *`;}
      else{
        if(!u[0].password_hash||!verifyPassword(pin,u[0].password_hash))return res.status(401).json({ok:false,error:'Student ID or PIN is incorrect'});
        if(displayName&&u[0].display_name!==displayName)u=await sql`UPDATE auth_users SET display_name=${displayName},updated_at=NOW() WHERE user_id=${u[0].user_id} RETURNING *`;
      }
      await sql`INSERT INTO auth_class_members(class_id,student_user_id,status) VALUES(${String(s[0].class_id)},${u[0].user_id},'active') ON CONFLICT(class_id,student_user_id) DO UPDATE SET status='active'`;
      let p=await sql`SELECT * FROM participants WHERE session_id=${s[0].session_id} AND student_user_id=${u[0].user_id} LIMIT 1`;
      if(!p.length)p=await sql`INSERT INTO participants(session_id,student_user_id,participant_code,display_name,joined_at) VALUES(${s[0].session_id},${u[0].user_id},${studentId},${displayName},NOW()) RETURNING *`;
      await createSession(res,u[0].user_id);
      return res.status(201).json({ok:true,participant:p[0],session:{session_id:s[0].session_id,class_id:s[0].class_id,lesson_id:s[0].lesson_id,status:s[0].status},user:{user_id:u[0].user_id,student_id:u[0].student_id,display_name:u[0].display_name,role:'student'}});
    }
    if(req.method==='GET'){
      const user=await requireAuth(req,res,['teacher','admin']);
      if(!user)return;
      const sessionId=req.query?.sessionId;
      if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT class_id FROM sessions WHERE session_id=${sessionId} LIMIT 1`;
      if(!s.length)return res.status(404).json({ok:false,error:'Session not found'});
      if(!await teacherOwnsClass(sql,user,s[0].class_id))return res.status(403).json({ok:false,error:'Session access denied'});
      const rows=await sql`SELECT participant_id,session_id,student_user_id,participant_code,display_name,joined_at,left_at FROM participants WHERE session_id=${sessionId} ORDER BY COALESCE(joined_at,NOW())`;
      return res.status(200).json({ok:true,participants:rows});
    }
    res.setHeader('Allow',['GET','POST']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){
    console.error('participants failed',e);
    return res.status(500).json({ok:false,error:'Participants request failed',detail:process.env.NODE_ENV==='production'?undefined:String(e?.message||e)});
  }
}
