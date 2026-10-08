import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=getResearchDb(); const user=await requireAuth(req,res); if(!user)return;
    if(req.method==='GET'){
      const assignmentId=req.query?.assignmentId;
      if(user.role==='student'){
        const projection=sql`SELECT s.submission_id,s.assignment_id,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,
          CASE WHEN s.feedback_released_at IS NOT NULL THEN s.score ELSE NULL END AS score,
          CASE WHEN s.feedback_released_at IS NOT NULL THEN s.max_score ELSE NULL END AS max_score,
          CASE WHEN s.feedback_released_at IS NOT NULL THEN s.feedback ELSE NULL END AS feedback,
          CASE WHEN s.feedback_released_at IS NOT NULL THEN s.rubric_scores ELSE NULL END AS rubric_scores
          FROM submissions s`;
        const rows=assignmentId
          ? await sql`${projection} WHERE s.assignment_id=${assignmentId} AND s.student_user_id=${user.user_id} ORDER BY s.attempt_no DESC`
          : await sql`${projection} WHERE s.student_user_id=${user.user_id} ORDER BY s.submitted_at DESC LIMIT 500`;
        return res.status(200).json({ok:true,submissions:rows});
      }
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Access denied'});
      if(!assignmentId)return res.status(400).json({ok:false,error:'assignmentId is required for teacher view'});
      const a=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`; if(!a.length)return res.status(404).json({ok:false,error:'Assignment not found'});
      if(!await teacherOwnsClass(sql,user,a[0].class_id))return res.status(403).json({ok:false,error:'Assignment access denied'});
      const rows=await sql`SELECT * FROM submissions WHERE assignment_id=${assignmentId} ORDER BY submitted_at DESC`;
      return res.status(200).json({ok:true,submissions:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return; if(user.role!=='student')return res.status(403).json({ok:false,error:'Student session required'});
      const {assignmentId,response={},researchConsent=false}=req.body||{}; if(!assignmentId)return res.status(400).json({ok:false,error:'assignmentId is required'});
      const a=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} AND status='active' LIMIT 1`; if(!a.length)return res.status(404).json({ok:false,error:'Active assignment not found'});
      if(!await studentInClass(sql,user,a[0].class_id))return res.status(403).json({ok:false,error:'Student is not assigned to this class'});
      const prev=await sql`SELECT COALESCE(MAX(attempt_no),0)::int AS n FROM submissions WHERE assignment_id=${assignmentId} AND student_user_id=${user.user_id}`; const attempt=Number(prev[0]?.n||0)+1;
      if(a[0].attempt_limit!=null&&attempt>Number(a[0].attempt_limit))return res.status(403).json({ok:false,error:'Attempt limit reached'});
      if(a[0].deadline&&a[0].late_policy==='closed'&&Date.now()>new Date(a[0].deadline).getTime())return res.status(403).json({ok:false,error:'Assignment deadline has passed'});
      const meta={researchConsent:Boolean(researchConsent)};
      const rows=await sql`INSERT INTO submissions(assignment_id,student_user_id,student_code,student_name,response,attempt_no,status,metadata) VALUES(${assignmentId},${user.user_id},${user.student_id||user.user_id},${user.display_name},${response},${attempt},'submitted',${meta}) RETURNING *`;
      await sql`INSERT INTO events(class_id,lesson_id,activity_id,event_type,answer,metadata) VALUES(${a[0].class_id},${a[0].resource_id},${a[0].activity_id},'assignment.submitted',${{submissionId:rows[0].submission_id,attemptNo:attempt}},${meta})`;
      return res.status(201).json({ok:true,submission:rows[0]});
    }
    res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){console.error('submissions API failed',error);return res.status(500).json({ok:false,error:'Submissions request failed'});}
}
