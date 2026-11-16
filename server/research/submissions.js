import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,studentInClass } from '../_auth.js';
import { requireSubmissionSchema } from '../_submission-schema-contract.js';

const studentSelect=(assignmentId,userId)=>assignmentId
  ? `assignment:${assignmentId}:student:${userId}`
  : `student:${userId}`;

export default async function handler(req,res){
  try{
    const sql=getResearchDb(); const user=await requireAuth(req,res); if(!user)return;
    if(!await requireSubmissionSchema(sql,res))return;
    if(req.method==='GET'){
      const assignmentId=req.query?.assignmentId;
      if(user.role==='student'){
        const rows=assignmentId
          ? await sql`SELECT s.submission_id,s.assignment_id,s.attempt_no,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN 'feedback-released' ELSE 'submitted' END AS status,
              s.submitted_at,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.graded_at ELSE NULL END AS graded_at,
              s.feedback_released_at,a.title,a.class_id,a.resource_id,a.activity_id,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.score ELSE NULL END AS score,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.max_score ELSE NULL END AS max_score,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.feedback ELSE NULL END AS feedback,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.rubric_scores ELSE NULL END AS rubric_scores
              FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
              WHERE s.assignment_id=${assignmentId} AND s.student_user_id=${user.user_id} ORDER BY s.attempt_no DESC`
          : await sql`SELECT s.submission_id,s.assignment_id,s.attempt_no,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN 'feedback-released' ELSE 'submitted' END AS status,
              s.submitted_at,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.graded_at ELSE NULL END AS graded_at,
              s.feedback_released_at,a.title,a.class_id,a.resource_id,a.activity_id,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.score ELSE NULL END AS score,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.max_score ELSE NULL END AS max_score,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.feedback ELSE NULL END AS feedback,
              CASE WHEN s.feedback_released_at IS NOT NULL THEN s.rubric_scores ELSE NULL END AS rubric_scores
              FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
              WHERE s.student_user_id=${user.user_id} ORDER BY s.submitted_at DESC LIMIT 500`;
        return res.status(200).json({ok:true,scope:studentSelect(assignmentId,user.user_id),submissions:rows});
      }
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Access denied'});

      if(assignmentId){
        const a=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`;
        if(!a.length)return res.status(404).json({ok:false,error:'Assignment not found'});
        if(!await teacherOwnsClass(sql,user,a[0].class_id))return res.status(403).json({ok:false,error:'Assignment access denied'});
        const rows=await sql`SELECT s.*,a.title,a.class_id,a.resource_id,a.activity_id,a.rubric_id,a.deadline,a.late_policy
          FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
          WHERE s.assignment_id=${assignmentId} ORDER BY s.submitted_at DESC`;
        return res.status(200).json({ok:true,scope:'assignment',submissions:rows});
      }

      const rows=user.role==='admin'
        ? await sql`SELECT s.*,a.title,a.class_id,a.resource_id,a.activity_id,a.rubric_id,a.deadline,a.late_policy
            FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
            ORDER BY s.submitted_at DESC LIMIT 1000`
        : await sql`SELECT s.*,a.title,a.class_id,a.resource_id,a.activity_id,a.rubric_id,a.deadline,a.late_policy
            FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
            WHERE a.teacher_id=${user.user_id}
            ORDER BY s.submitted_at DESC LIMIT 1000`;
      return res.status(200).json({ok:true,scope:user.role,submissions:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      if(user.role!=='student')return res.status(403).json({ok:false,error:'Student session required'});
      const {assignmentId,response={},researchConsent=false,clientRequestId}=req.body||{};
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(clientRequestId||'')))
        return res.status(400).json({ok:false,error:'A UUID clientRequestId is required',code:'REQUEST_ID_REQUIRED'});
      if(!response||typeof response!=='object'||Array.isArray(response)||JSON.stringify(response).length>64000)
        return res.status(400).json({ok:false,error:'Invalid or oversized response'});
      if(!assignmentId)return res.status(400).json({ok:false,error:'assignmentId is required'});
      const a=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} AND status='active' LIMIT 1`;
      if(!a.length)return res.status(404).json({ok:false,error:'Active assignment not found'});
      if(!await studentInClass(sql,user,a[0].class_id))return res.status(403).json({ok:false,error:'Student is not assigned to this class'});
      // Idempotence: the database MUST have the two named UNIQUE indexes
      // checked by requireSubmissionSchema. Concurrent writers race safely via
      // ON CONFLICT DO NOTHING, then inspect the request UUID or retry.
      const existing=await sql`SELECT * FROM submissions WHERE assignment_id=${assignmentId}
        AND student_user_id=${user.user_id} AND client_request_id=${clientRequestId} LIMIT 1`;
      if(existing.length)return res.status(200).json({ok:true,idempotent:true,submission:existing[0]});
      if(a[0].deadline&&a[0].late_policy==='closed'&&Date.now()>new Date(a[0].deadline).getTime())
        return res.status(403).json({ok:false,error:'Assignment deadline has passed'});
      const meta={researchConsent:Boolean(researchConsent)};
      let confirmed=null;
      for(let i=0;i<6;i++){
        const prev=await sql`SELECT COALESCE(MAX(attempt_no),0)::int AS n FROM submissions
          WHERE assignment_id=${assignmentId} AND student_user_id=${user.user_id}`;
        const attempt=Number(prev[0]?.n||0)+1;
        if(a[0].attempt_limit!=null&&attempt>Number(a[0].attempt_limit))
          return res.status(403).json({ok:false,error:'Attempt limit reached'});
        const inserted=await sql`INSERT INTO submissions(
          assignment_id,student_user_id,student_code,student_name,response,attempt_no,status,metadata,client_request_id)
          VALUES(${assignmentId},${user.user_id},${user.student_id||user.user_id},
          ${user.display_name},${response},${attempt},'submitted',${meta},${clientRequestId})
          ON CONFLICT DO NOTHING RETURNING *`;
        if(inserted.length){confirmed=inserted[0];break;}
        const duplicate=await sql`SELECT * FROM submissions WHERE assignment_id=${assignmentId}
          AND student_user_id=${user.user_id} AND client_request_id=${clientRequestId} LIMIT 1`;
        if(duplicate.length)return res.status(200).json({ok:true,idempotent:true,submission:duplicate[0]});
      }
      if(!confirmed)return res.status(409).json({ok:false,error:'Concurrent submission conflict; inspect My Submissions',code:'SUBMISSION_CONFLICT'});
      try{
        await sql`INSERT INTO events(class_id,lesson_id,activity_id,event_type,answer,metadata)
          VALUES(${a[0].class_id},${a[0].resource_id},${a[0].activity_id},'assignment.submitted',
          ${{submissionId:confirmed.submission_id,attemptNo:confirmed.attempt_no}},${meta})`;
      }catch(logError){console.warn('Non-critical submission telemetry failed',logError?.message);}
      return res.status(201).json({ok:true,submission:confirmed});
    }
    res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){console.error('submissions API failed',error);return res.status(500).json({ok:false,error:'Submissions request failed'});}
}
