import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass } from '../_auth.js';

async function log(sql,{teacherId,classId,resourceId,activityId,eventType,metadata}){
  try{await sql`INSERT INTO events(teacher_id,class_id,lesson_id,activity_id,event_type,metadata) VALUES(${teacherId},${classId},${resourceId},${activityId},${eventType},${metadata||{}})`;}catch(e){console.warn('assignment event log failed',e);}
}
export default async function handler(req,res){
  try{
    const sql=getResearchDb(); const user=await requireAuth(req,res); if(!user)return;
    if(req.method==='GET'){
      let rows=[];
      if(user.role==='student'){
        rows=await sql`SELECT a.* FROM assignments a JOIN auth_class_members m ON m.class_id::text=a.class_id::text WHERE m.student_user_id=${user.user_id} AND m.status='active' AND a.status='active' ORDER BY a.deadline NULLS LAST,a.created_at DESC`;
      }else if(user.role==='teacher'){
        rows=req.query?.classId?await sql`SELECT * FROM assignments WHERE class_id=${req.query.classId} AND teacher_id=${user.user_id} ORDER BY created_at DESC`:await sql`SELECT * FROM assignments WHERE teacher_id=${user.user_id} ORDER BY created_at DESC`;
      }else rows=req.query?.classId?await sql`SELECT * FROM assignments WHERE class_id=${req.query.classId} ORDER BY created_at DESC`:await sql`SELECT * FROM assignments ORDER BY created_at DESC LIMIT 1000`;
      return res.status(200).json({ok:true,assignments:rows});
    }
    if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Teacher or admin required'});
    if(!requireSameOrigin(req,res))return;
    if(req.method==='POST'){
      const {classId,resourceId,activityId=null,title,prompt=null,rubricId='general-100-v1',deadline=null,attemptLimit=null,latePolicy='allow-late',status='active'}=req.body||{};
      if(!classId||!resourceId||!title)return res.status(400).json({ok:false,error:'classId, resourceId and title are required'});
      if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      if(!['draft','active','closed','archived'].includes(status))return res.status(400).json({ok:false,error:'Invalid assignment status'});
      if(!['closed','allow-late','teacher-approval'].includes(latePolicy))return res.status(400).json({ok:false,error:'Invalid late policy'});
      if(attemptLimit!=null&&(!Number.isInteger(Number(attemptLimit))||Number(attemptLimit)<1||Number(attemptLimit)>50))return res.status(400).json({ok:false,error:'attemptLimit must be an integer from 1 to 50'});
      const teacherId=user.role==='admin'&&req.body?.teacherId?req.body.teacherId:user.user_id;
      const rows=await sql`INSERT INTO assignments(teacher_id,class_id,resource_id,activity_id,title,prompt,rubric_id,deadline,attempt_limit,late_policy,status) VALUES(${teacherId},${classId},${resourceId},${activityId},${String(title).slice(0,200)},${prompt==null?null:String(prompt).slice(0,10000)},${rubricId},${deadline||null},${attemptLimit==null?null:Number(attemptLimit)},${latePolicy},${status}) RETURNING *`;
      await log(sql,{teacherId,classId,resourceId,activityId,eventType:'assignment.created',metadata:{assignmentId:rows[0].assignment_id,title:rows[0].title,rubricId}});
      return res.status(201).json({ok:true,assignment:rows[0]});
    }
    if(req.method==='PATCH'){
      const {assignmentId,title,prompt,deadline,status,rubricId,attemptLimit,latePolicy}=req.body||{}; if(!assignmentId)return res.status(400).json({ok:false,error:'assignmentId is required'});
      const a=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`; if(!a.length)return res.status(404).json({ok:false,error:'Assignment not found'});
      if(!await teacherOwnsClass(sql,user,a[0].class_id))return res.status(403).json({ok:false,error:'Assignment access denied'});
      const rows=await sql`UPDATE assignments SET title=COALESCE(${title==null?null:String(title).slice(0,200)},title),prompt=COALESCE(${prompt==null?null:String(prompt).slice(0,10000)},prompt),deadline=COALESCE(${deadline??null},deadline),status=COALESCE(${status||null},status),rubric_id=COALESCE(${rubricId||null},rubric_id),attempt_limit=COALESCE(${attemptLimit==null?null:Number(attemptLimit)},attempt_limit),late_policy=COALESCE(${latePolicy||null},late_policy),updated_at=NOW() WHERE assignment_id=${assignmentId} RETURNING *`;
      return res.status(200).json({ok:true,assignment:rows[0]});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){console.error('assignments API failed',error);return res.status(500).json({ok:false,error:'Assignments request failed'});}
}
