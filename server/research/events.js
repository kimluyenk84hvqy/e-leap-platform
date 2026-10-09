import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass } from '../_auth.js';
import { ensureLiveSchema } from '../_live-schema.js';

const CONTROL_TYPES=new Set(['teacher.follow','teacher.navigation']);
const safeObject=(v)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res);
    if(!user)return;
    await ensureLiveSchema(sql);

    if(req.method==='GET'){
      const sessionId=req.query?.sessionId;
      if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT * FROM sessions WHERE session_id=${sessionId} LIMIT 1`;
      if(!s.length)return res.status(404).json({ok:false,error:'Session not found'});
      const session=s[0];
      if(['teacher','admin'].includes(user.role)){
        if(!await teacherOwnsClass(sql,user,session.class_id))return res.status(403).json({ok:false,error:'Live responses are restricted to the class teacher'});
        const rows=await sql`SELECT * FROM events WHERE session_id=${sessionId} ORDER BY COALESCE(occurred_at,NOW())`;
        return res.status(200).json({ok:true,events:rows});
      }
      if(user.role==='student'&&String(req.query?.control||'')==='1'){
        if(!await studentInClass(sql,user,session.class_id))return res.status(403).json({ok:false,error:'Student is not a member of this class'});
        const joined=await sql`SELECT participant_id FROM participants WHERE session_id=${sessionId} AND student_user_id=${user.user_id} LIMIT 1`;
        if(!joined.length)return res.status(403).json({ok:false,error:'Student has not joined this live session'});
        const rows=await sql`SELECT event_type,answer,activity_id,occurred_at FROM events WHERE session_id=${sessionId} AND event_type IN ('teacher.follow','teacher.navigation') ORDER BY occurred_at DESC LIMIT 20`;
        let followEnabled=false,followSeen=false,screenNumber=null,activityId=null,updatedAt=null;
        for(const row of rows){
          const answer=safeObject(row.answer);
          if(updatedAt===null)updatedAt=row.occurred_at;
          if(row.event_type==='teacher.follow'&&typeof answer.enabled==='boolean'&&!followSeen){followEnabled=answer.enabled;followSeen=true;}
          if(row.event_type==='teacher.navigation'&&screenNumber===null){const n=Number(answer.screenNumber);screenNumber=Number.isFinite(n)&&n>0?n:null;activityId=answer.activityId||row.activity_id||null;}
        }
        return res.status(200).json({ok:true,control:{followEnabled,screenNumber,activityId,updatedAt}});
      }
      return res.status(403).json({ok:false,error:'Live responses are restricted to the class teacher'});
    }

    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const {sessionId,activityId=null,eventType='response.submitted',answer=null,isCorrect=null,score=null,clientEventId=null,metadata={}}=req.body||{};
      if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT * FROM sessions WHERE session_id=${sessionId} AND COALESCE(status,'active')='active' LIMIT 1`;
      if(!s.length)return res.status(404).json({ok:false,error:'Active session not found'});
      const session=s[0],safeType=String(eventType).slice(0,80),safeMeta=safeObject(metadata),safeClientId=clientEventId||`${sessionId}:${user.user_id}:${safeType}:${activityId||'activity'}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;

      if(['teacher','admin'].includes(user.role)){
        if(!CONTROL_TYPES.has(safeType))return res.status(403).json({ok:false,error:'Teacher may only publish classroom control events here'});
        if(!await teacherOwnsClass(sql,user,session.class_id))return res.status(403).json({ok:false,error:'Teacher does not own this class'});
        const rows=await sql`INSERT INTO events(client_event_id,session_id,teacher_id,class_id,participant_id,lesson_id,activity_id,event_type,answer,is_correct,score,metadata,occurred_at)
          VALUES(${safeClientId},${sessionId},${user.user_id},${session.class_id},${null},${session.lesson_id},${activityId},${safeType},${answer},${null},${null},${safeMeta},NOW())
          ON CONFLICT(client_event_id) DO UPDATE SET client_event_id=EXCLUDED.client_event_id RETURNING *`;
        return res.status(201).json({ok:true,event:rows[0]});
      }

      if(user.role!=='student')return res.status(403).json({ok:false,error:'Student session required'});
      if(CONTROL_TYPES.has(safeType))return res.status(403).json({ok:false,error:'Student cannot publish classroom controls'});
      if(!await studentInClass(sql,user,session.class_id))return res.status(403).json({ok:false,error:'Student is not a member of this class'});
      const p=await sql`SELECT participant_id FROM participants WHERE session_id=${sessionId} AND student_user_id=${user.user_id} LIMIT 1`;
      if(!p.length)return res.status(403).json({ok:false,error:'Student has not joined this live session'});
      const rows=await sql`INSERT INTO events(client_event_id,session_id,class_id,participant_id,lesson_id,activity_id,event_type,answer,is_correct,score,metadata,occurred_at)
        VALUES(${safeClientId},${sessionId},${session.class_id},${p[0].participant_id},${session.lesson_id},${activityId},${safeType},${answer},${isCorrect},${score},${safeMeta},NOW())
        ON CONFLICT(client_event_id) DO UPDATE SET client_event_id=EXCLUDED.client_event_id RETURNING *`;
      return res.status(201).json({ok:true,event:rows[0]});
    }

    res.setHeader('Allow',['GET','POST']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){
    console.error('events failed',e);
    return res.status(500).json({ok:false,error:'Events request failed',detail:process.env.NODE_ENV==='production'?undefined:String(e?.message||e)});
  }
}
