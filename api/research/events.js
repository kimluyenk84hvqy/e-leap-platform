import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=getResearchDb(); const user=await requireAuth(req,res); if(!user)return;
    if(req.method==='GET'){
      const sessionId=req.query?.sessionId; if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT * FROM sessions WHERE session_id=${sessionId} LIMIT 1`; if(!s.length)return res.status(404).json({ok:false,error:'Session not found'});
      if(!['teacher','admin'].includes(user.role) || !await teacherOwnsClass(sql,user,s[0].class_id))return res.status(403).json({ok:false,error:'Live responses are restricted to the class teacher'});
      const rows=await sql`SELECT * FROM events WHERE session_id=${sessionId} ORDER BY occurred_at`;
      return res.status(200).json({ok:true,events:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return; if(user.role!=='student')return res.status(403).json({ok:false,error:'Student session required'});
      const {sessionId,activityId=null,eventType='response.submitted',answer=null,isCorrect=null,score=null,clientEventId=null,metadata={}}=req.body||{};
      if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT * FROM sessions WHERE session_id=${sessionId} AND status='active' LIMIT 1`; if(!s.length)return res.status(404).json({ok:false,error:'Active session not found'});
      if(!await studentInClass(sql,user,s[0].class_id))return res.status(403).json({ok:false,error:'Student is not a member of this class'});
      const p=await sql`SELECT participant_id FROM participants WHERE session_id=${sessionId} AND student_user_id=${user.user_id} LIMIT 1`; if(!p.length)return res.status(403).json({ok:false,error:'Student has not joined this live session'});
      const safeType=String(eventType).slice(0,80); const safeMeta=(metadata&&typeof metadata==='object')?metadata:{};
      const rows=await sql`INSERT INTO events(client_event_id,session_id,class_id,participant_id,lesson_id,activity_id,event_type,answer,is_correct,score,metadata) VALUES(${clientEventId},${sessionId},${s[0].class_id},${p[0].participant_id},${s[0].lesson_id},${activityId},${safeType},${answer},${isCorrect},${score},${safeMeta}) ON CONFLICT(client_event_id) DO UPDATE SET client_event_id=EXCLUDED.client_event_id RETURNING *`;
      return res.status(201).json({ok:true,event:rows[0]});
    }
    res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){console.error('events failed',e);return res.status(500).json({ok:false,error:'Events request failed'});}
}
