import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass } from '../_auth.js';

const ALLOWED_DIMENSIONS=new Set(['usability','acceptance','quality','open_feedback']);

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res); if(!user)return;

    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const {classId,sessionId=null,lessonId=null,dimension,instrument='e-leap-flex-v1',items={},comment='',researchConsent=false}=req.body||{};
      if(!classId||!dimension)return res.status(400).json({ok:false,error:'classId and dimension are required'});
      if(!ALLOWED_DIMENSIONS.has(dimension))return res.status(400).json({ok:false,error:'Unsupported feedback dimension'});

      if(user.role==='student'){
        if(!await studentInClass(sql,user,classId))return res.status(403).json({ok:false,error:'Student is not assigned to this class'});
        if(dimension==='quality')return res.status(403).json({ok:false,error:'Quality evaluation is for teacher/admin reviewers'});
      }else if(['teacher','admin'].includes(user.role)){
        if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      }else return res.status(403).json({ok:false,error:'Access denied'});

      if(sessionId){
        const s=await sql`SELECT 1 FROM sessions WHERE session_id=${sessionId} AND class_id=${classId} LIMIT 1`;
        if(!s.length)return res.status(400).json({ok:false,error:'Session does not belong to this class'});
      }

      const safeItems=(items&&typeof items==='object'&&!Array.isArray(items))?items:{};
      const rows=await sql`
        INSERT INTO research_feedback(class_id,session_id,lesson_id,respondent_user_id,respondent_role,dimension,instrument,items,comment,research_consent)
        VALUES(${classId},${sessionId},${lessonId},${user.user_id},${user.role},${dimension},${instrument},${safeItems},${String(comment||'').slice(0,4000)},${Boolean(researchConsent)})
        RETURNING feedback_id,dimension,instrument,research_consent,created_at`;
      return res.status(201).json({ok:true,feedback:rows[0]});
    }

    if(req.method==='GET'){
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Teacher/Admin access required'});
      const classId=req.query?.classId||null,sessionId=req.query?.sessionId||null;
      if(classId&&!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      const rows=classId
        ? sessionId
          ? await sql`SELECT feedback_id,class_id,session_id,lesson_id,respondent_role,dimension,instrument,items,comment,research_consent,created_at FROM research_feedback WHERE class_id=${classId} AND session_id=${sessionId} ORDER BY created_at DESC`
          : await sql`SELECT feedback_id,class_id,session_id,lesson_id,respondent_role,dimension,instrument,items,comment,research_consent,created_at FROM research_feedback WHERE class_id=${classId} ORDER BY created_at DESC LIMIT 5000`
        : user.role==='admin'
          ? await sql`SELECT feedback_id,class_id,session_id,lesson_id,respondent_role,dimension,instrument,items,comment,research_consent,created_at FROM research_feedback ORDER BY created_at DESC LIMIT 5000`
          : await sql`SELECT rf.feedback_id,rf.class_id,rf.session_id,rf.lesson_id,rf.respondent_role,rf.dimension,rf.instrument,rf.items,rf.comment,rf.research_consent,rf.created_at FROM research_feedback rf JOIN classes c ON c.class_id=rf.class_id WHERE c.teacher_id=${user.user_id} ORDER BY rf.created_at DESC LIMIT 5000`;
      return res.status(200).json({ok:true,feedback:rows});
    }

    res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){console.error('research feedback failed',error);return res.status(500).json({ok:false,error:'Research feedback request failed'});}
}
