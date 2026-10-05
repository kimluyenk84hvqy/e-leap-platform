import { getResearchDb } from '../_research-db.js';

async function log(sql,{teacherId,classId,resourceId,activityId,eventType,metadata}){
  try{
    await sql`INSERT INTO events(teacher_id,class_id,lesson_id,activity_id,event_type,metadata)
      VALUES(${teacherId},${classId},${resourceId},${activityId},${eventType},${metadata||{}})`;
  }catch(e){ console.warn('assignment event log failed',e); }
}

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    if(req.method==='GET'){
      const {teacherId,classId,studentCode}=req.query||{};
      let rows;
      if(studentCode){
        rows=await sql`
          SELECT DISTINCT a.*
          FROM assignments a
          JOIN sessions s ON s.class_id=a.class_id
          JOIN participants p ON p.session_id=s.session_id
          WHERE LOWER(p.participant_code)=LOWER(${studentCode})
            AND a.status='active'
          ORDER BY a.deadline NULLS LAST,a.created_at DESC`;
      }else if(classId && teacherId){
        rows=await sql`SELECT * FROM assignments WHERE class_id=${classId} AND teacher_id=${teacherId} ORDER BY created_at DESC`;
      }else if(teacherId){
        rows=await sql`SELECT * FROM assignments WHERE teacher_id=${teacherId} ORDER BY created_at DESC`;
      }else{
        return res.status(400).json({ok:false,error:'teacherId, studentCode, or teacherId+classId is required'});
      }
      return res.status(200).json({ok:true,assignments:rows});
    }

    if(req.method==='POST'){
      const {teacherId,classId,resourceId,activityId=null,title,prompt=null,rubricId='general-100-v1',deadline=null,attemptLimit=null,latePolicy='allow-late',status='active'}=req.body||{};
      if(!teacherId||!classId||!resourceId||!title) return res.status(400).json({ok:false,error:'teacherId, classId, resourceId and title are required'});
      if(!['draft','active','closed','archived'].includes(status)) return res.status(400).json({ok:false,error:'Invalid assignment status'});
      if(!['closed','allow-late','teacher-approval'].includes(latePolicy)) return res.status(400).json({ok:false,error:'Invalid late policy'});
      if(attemptLimit!=null && (!Number.isInteger(Number(attemptLimit)) || Number(attemptLimit)<1 || Number(attemptLimit)>50)) return res.status(400).json({ok:false,error:'attemptLimit must be an integer from 1 to 50'});
      const own=await sql`SELECT class_id FROM classes WHERE class_id=${classId} AND teacher_id=${teacherId} LIMIT 1`;
      if(!own.length) return res.status(403).json({ok:false,error:'Teacher does not own this class'});
      const rows=await sql`
        INSERT INTO assignments(teacher_id,class_id,resource_id,activity_id,title,prompt,rubric_id,deadline,attempt_limit,late_policy,status)
        VALUES(${teacherId},${classId},${resourceId},${activityId},${String(title).slice(0,200)},${prompt==null?null:String(prompt).slice(0,10000)},${rubricId},${deadline||null},${attemptLimit==null?null:Number(attemptLimit)},${latePolicy},${status})
        RETURNING *`;
      await log(sql,{teacherId,classId,resourceId,activityId,eventType:'assignment.created',metadata:{assignmentId:rows[0].assignment_id,title:rows[0].title,rubricId}});
      return res.status(201).json({ok:true,assignment:rows[0]});
    }

    if(req.method==='PATCH'){
      const {assignmentId,teacherId,title,prompt,deadline,status,rubricId,attemptLimit,latePolicy}=req.body||{};
      if(!assignmentId||!teacherId) return res.status(400).json({ok:false,error:'assignmentId and teacherId are required'});
      if(status && !['draft','active','closed','archived'].includes(status)) return res.status(400).json({ok:false,error:'Invalid assignment status'});
      if(latePolicy && !['closed','allow-late','teacher-approval'].includes(latePolicy)) return res.status(400).json({ok:false,error:'Invalid late policy'});
      if(attemptLimit!=null && (!Number.isInteger(Number(attemptLimit)) || Number(attemptLimit)<1 || Number(attemptLimit)>50)) return res.status(400).json({ok:false,error:'attemptLimit must be an integer from 1 to 50'});
      const rows=await sql`
        UPDATE assignments
        SET title=COALESCE(${title==null?null:String(title).slice(0,200)},title),
            prompt=COALESCE(${prompt==null?null:String(prompt).slice(0,10000)},prompt),
            deadline=COALESCE(${deadline??null},deadline),
            status=COALESCE(${status||null},status),
            rubric_id=COALESCE(${rubricId||null},rubric_id),
            attempt_limit=COALESCE(${attemptLimit==null?null:Number(attemptLimit)},attempt_limit),
            late_policy=COALESCE(${latePolicy||null},late_policy),
            updated_at=NOW()
        WHERE assignment_id=${assignmentId} AND teacher_id=${teacherId}
        RETURNING *`;
      if(!rows.length) return res.status(404).json({ok:false,error:'Assignment not found or not owned by teacher'});
      return res.status(200).json({ok:true,assignment:rows[0]});
    }

    res.setHeader('Allow',['GET','POST','PATCH']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){
    console.error('assignments API failed',error);
    return res.status(500).json({ok:false,error:'Research database unavailable'});
  }
}
