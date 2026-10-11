import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass } from '../_auth.js';
import { ensureMarkingSchema } from '../_marking-schema.js';

const STATES=new Set(['ai-draft','in-review','graded','released']);
const arr=v=>Array.isArray(v)?v.slice(0,100):[];
const txt=(v,n=20000)=>v==null?null:String(v).slice(0,n);

async function authorizedSubmission(sql,user,submissionId){
  const rows=await sql`SELECT s.*,a.class_id,a.teacher_id,a.resource_id,a.activity_id,a.rubric_id,a.title AS assignment_title,a.prompt AS assignment_prompt
    FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
    WHERE s.submission_id=${submissionId} LIMIT 1`;
  if(!rows.length)return {error:'Submission not found',status:404};
  if(!await teacherOwnsClass(sql,user,rows[0].class_id))return {error:'Submission access denied',status:403};
  return {row:rows[0]};
}

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
    await ensureMarkingSchema(sql);

    if(req.method==='GET'){
      const assignmentId=req.query?.assignmentId||null;
      const classId=req.query?.classId||null;
      const submissionId=req.query?.submissionId||null;
      if(submissionId){
        const a=await authorizedSubmission(sql,user,submissionId); if(a.error)return res.status(a.status).json({ok:false,error:a.error});
        const review=await sql`SELECT * FROM grading_reviews WHERE submission_id=${submissionId} LIMIT 1`;
        const history=await sql`SELECT grading_history_id,action,state,score,max_score,rubric_scores,feedback,review_snapshot,created_at,actor_user_id FROM grading_history WHERE submission_id=${submissionId} ORDER BY created_at DESC LIMIT 100`;
        return res.status(200).json({ok:true,submission:a.row,review:review[0]||null,history});
      }
      if(assignmentId){
        const asg=await sql`SELECT * FROM assignments WHERE assignment_id=${assignmentId} LIMIT 1`; if(!asg.length)return res.status(404).json({ok:false,error:'Assignment not found'});
        if(!await teacherOwnsClass(sql,user,asg[0].class_id))return res.status(403).json({ok:false,error:'Assignment access denied'});
        const rows=await sql`SELECT s.*,g.state AS review_state,g.updated_at AS review_updated_at,g.revision AS review_revision
          FROM submissions s LEFT JOIN grading_reviews g ON g.submission_id=s.submission_id
          WHERE s.assignment_id=${assignmentId}
          ORDER BY s.student_name ASC,s.attempt_no DESC,s.submitted_at DESC`;
        return res.status(200).json({ok:true,assignment:asg[0],submissions:rows});
      }
      if(!classId)return res.status(400).json({ok:false,error:'classId, assignmentId or submissionId is required'});
      if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      const assignments=await sql`SELECT a.*,
        COUNT(s.submission_id)::int AS submissions_count,
        COUNT(s.submission_id) FILTER (WHERE g.submission_id IS NULL)::int AS needs_marking,
        COUNT(s.submission_id) FILTER (WHERE g.state='ai-draft')::int AS ai_drafted,
        COUNT(s.submission_id) FILTER (WHERE g.state='in-review')::int AS in_review,
        COUNT(s.submission_id) FILTER (WHERE g.state='graded')::int AS graded,
        COUNT(s.submission_id) FILTER (WHERE g.state='released')::int AS released
        FROM assignments a
        LEFT JOIN submissions s ON s.assignment_id=a.assignment_id
        LEFT JOIN grading_reviews g ON g.submission_id=s.submission_id
        WHERE a.class_id=${classId}
        GROUP BY a.assignment_id ORDER BY a.created_at DESC`;
      return res.status(200).json({ok:true,assignments});
    }

    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      const {submissionId,state='in-review',rubricScores={},overallComment='',strengths=[],priorities=[],annotations=[],aiDraft=null}=req.body||{};
      if(!submissionId)return res.status(400).json({ok:false,error:'submissionId is required'});
      if(!STATES.has(state))return res.status(400).json({ok:false,error:'Invalid marking state'});
      if(state==='released')return res.status(400).json({ok:false,error:'Use the grades API to release official feedback'});
      const a=await authorizedSubmission(sql,user,submissionId); if(a.error)return res.status(a.status).json({ok:false,error:a.error});
      const r=a.row;
      const cleanReview={rubricScores:rubricScores&&typeof rubricScores==='object'?rubricScores:{},overallComment:txt(overallComment)||'',strengths:arr(strengths).map(v=>txt(v,1000)),priorities:arr(priorities).map(v=>txt(v,1000)),annotations:arr(annotations),aiDraft:aiDraft&&typeof aiDraft==='object'?aiDraft:null};
      const rows=await sql`INSERT INTO grading_reviews(submission_id,assignment_id,class_id,reviewer_id,state,rubric_scores,overall_comment,strengths,priorities,annotations,ai_draft)
        VALUES(${submissionId},${r.assignment_id},${r.class_id},${user.user_id},${state},${cleanReview.rubricScores},${cleanReview.overallComment},${cleanReview.strengths},${cleanReview.priorities},${cleanReview.annotations},${cleanReview.aiDraft})
        ON CONFLICT(submission_id) DO UPDATE SET reviewer_id=EXCLUDED.reviewer_id,state=EXCLUDED.state,rubric_scores=EXCLUDED.rubric_scores,overall_comment=EXCLUDED.overall_comment,strengths=EXCLUDED.strengths,priorities=EXCLUDED.priorities,annotations=EXCLUDED.annotations,ai_draft=COALESCE(EXCLUDED.ai_draft,grading_reviews.ai_draft),revision=grading_reviews.revision+1,updated_at=NOW()
        RETURNING *`;
      await sql`INSERT INTO grading_history(submission_id,assignment_id,class_id,actor_user_id,action,state,rubric_scores,feedback,review_snapshot)
        VALUES(${submissionId},${r.assignment_id},${r.class_id},${user.user_id},'draft.saved',${state},${cleanReview.rubricScores},${cleanReview.overallComment},${cleanReview})`;
      return res.status(200).json({ok:true,review:rows[0]});
    }

    res.setHeader('Allow',['GET','PATCH']); return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){console.error('marking API failed',error);return res.status(500).json({ok:false,error:'Marking request failed'});}
}
