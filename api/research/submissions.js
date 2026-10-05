import { getResearchDb } from '../_research-db.js';

async function log(sql,{assignment,submissionId,eventType,score=null,metadata={}}){
  try{
    await sql`INSERT INTO events(teacher_id,class_id,lesson_id,activity_id,event_type,answer,score,metadata)
      VALUES(${assignment.teacher_id},${assignment.class_id},${assignment.resource_id},${assignment.activity_id},${eventType},${{submissionId}},${score},${metadata})`;
  }catch(e){ console.warn('submission event log failed',e); }
}

const studentProjection = sql => sql;

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    if(req.method==='GET'){
      const {assignmentId,studentCode,teacherId}=req.query||{};
      let rows;
      if(assignmentId&&studentCode){
        rows=await sql`
          SELECT s.submission_id,s.assignment_id,s.student_code,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,
                 CASE WHEN s.status='feedback-released' THEN s.score ELSE NULL END AS score,
                 CASE WHEN s.status='feedback-released' THEN s.max_score ELSE NULL END AS max_score,
                 CASE WHEN s.status='feedback-released' THEN s.feedback ELSE NULL END AS feedback,
                 CASE WHEN s.status='feedback-released' THEN s.rubric_scores ELSE NULL END AS rubric_scores,
                 a.title,a.resource_id,a.activity_id,a.rubric_id,a.deadline
          FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
          WHERE s.assignment_id=${assignmentId} AND LOWER(s.student_code)=LOWER(${studentCode})
          ORDER BY s.attempt_no DESC`;
      }else if(studentCode){
        rows=await sql`
          SELECT s.submission_id,s.assignment_id,s.student_code,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,
                 CASE WHEN s.status='feedback-released' THEN s.score ELSE NULL END AS score,
                 CASE WHEN s.status='feedback-released' THEN s.max_score ELSE NULL END AS max_score,
                 CASE WHEN s.status='feedback-released' THEN s.feedback ELSE NULL END AS feedback,
                 CASE WHEN s.status='feedback-released' THEN s.rubric_scores ELSE NULL END AS rubric_scores,
                 a.title,a.resource_id,a.activity_id,a.rubric_id,a.deadline
          FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
          WHERE LOWER(s.student_code)=LOWER(${studentCode})
          ORDER BY s.submitted_at DESC`;
      }else if(assignmentId && teacherId){
        rows=await sql`
          SELECT s.*,a.title,a.resource_id,a.activity_id,a.rubric_id,a.deadline,a.class_id
          FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
          WHERE s.assignment_id=${assignmentId} AND a.teacher_id=${teacherId}
          ORDER BY s.submitted_at DESC`;
      }else if(teacherId){
        rows=await sql`
          SELECT s.*,a.title,a.resource_id,a.activity_id,a.rubric_id,a.deadline,a.class_id
          FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
          WHERE a.teacher_id=${teacherId}
          ORDER BY s.submitted_at DESC`;
      }else{
        return res.status(400).json({ok:false,error:'studentCode or teacherId is required'});
      }
      return res.status(200).json({ok:true,submissions:rows});
    }

    if(req.method==='POST'){
      const {assignmentId,studentCode,studentName=null,response,metadata={}}=req.body||{};
      if(!assignmentId||!studentCode||response==null) return res.status(400).json({ok:false,error:'assignmentId, studentCode and response are required'});
      const responseJson=JSON.stringify(response);
      if(responseJson.length>100000) return res.status(413).json({ok:false,error:'Submission is too large'});
      const asg=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`;
      if(!asg.length) return res.status(404).json({ok:false,error:'Assignment not found'});
      const a=asg[0];
      if(a.status!=='active') return res.status(409).json({ok:false,error:'Assignment is not active'});
      const member=await sql`
        SELECT p.participant_id
        FROM participants p JOIN sessions s ON s.session_id=p.session_id
        WHERE s.class_id=${a.class_id} AND LOWER(p.participant_code)=LOWER(${studentCode})
        LIMIT 1`;
      if(!member.length) return res.status(403).json({ok:false,error:'Student is not associated with this class'});
      const attempts=await sql`SELECT COALESCE(MAX(attempt_no),0)::int AS max_attempt FROM submissions WHERE assignment_id=${assignmentId} AND LOWER(student_code)=LOWER(${studentCode})`;
      const attemptNo=(attempts[0]?.max_attempt||0)+1;
      if(a.attempt_limit&&attemptNo>a.attempt_limit) return res.status(409).json({ok:false,error:'Attempt limit reached'});
      if(a.deadline&&a.late_policy==='closed'&&new Date(a.deadline)<new Date()) return res.status(409).json({ok:false,error:'Assignment deadline has passed'});
      if(a.deadline&&a.late_policy==='teacher-approval'&&new Date(a.deadline)<new Date()) return res.status(409).json({ok:false,error:'Late submission requires teacher approval'});
      const safeMeta={
        source:String(metadata?.source||'platform-assignment').slice(0,80),
        researchConsent:Boolean(metadata?.researchConsent),
        studentGroup:metadata?.studentGroup==null?null:String(metadata.studentGroup).slice(0,40),
        gender:metadata?.gender==null?null:String(metadata.gender).slice(0,20)
      };
      const rows=await sql`
        INSERT INTO submissions(assignment_id,student_code,student_name,response,attempt_no,status,metadata)
        VALUES(${assignmentId},${String(studentCode).slice(0,100)},${studentName==null?null:String(studentName).slice(0,200)},${response},${attemptNo},'submitted',${safeMeta})
        RETURNING *`;
      await log(sql,{assignment:a,submissionId:rows[0].submission_id,eventType:'assignment.submitted',metadata:{attemptNo,researchConsent:safeMeta.researchConsent}});
      return res.status(201).json({ok:true,submission:{submission_id:rows[0].submission_id,assignment_id:rows[0].assignment_id,attempt_no:rows[0].attempt_no,status:rows[0].status,submitted_at:rows[0].submitted_at}});
    }

    res.setHeader('Allow',['GET','POST']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){
    console.error('submissions API failed',error);
    return res.status(500).json({ok:false,error:'Research database unavailable'});
  }
}
