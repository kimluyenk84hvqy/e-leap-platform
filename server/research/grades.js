import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass } from '../_auth.js';
import { ensureMarkingSchema } from '../_marking-schema.js';

const RUBRICS={
  'writing-core-v1':{max:10,criteria:{task:2,organisation:2,vocabulary:2,grammar:2,style:2}},
  'speaking-core-v1':{max:10,criteria:{task:2,fluency:2,vocabulary:2,grammar:2,pronunciation:2}},
  'general-100-v1':{max:100,criteria:null}
};

function validateRubric(rubricId,rubricScores,score,maxScore){
  const rubric=RUBRICS[rubricId]||RUBRICS['general-100-v1'];
  if(rubric.criteria){
    if(!rubricScores||typeof rubricScores!=='object')return{error:'All rubric criteria are required'};
    const keys=Object.keys(rubric.criteria);
    for(const k of keys){const v=Number(rubricScores[k]);if(!Number.isFinite(v)||v<0||v>rubric.criteria[k])return{error:`Invalid score for ${k}`};}
    if(Object.keys(rubricScores).some(k=>!keys.includes(k)))return{error:'Unknown rubric criterion'};
    return{score:keys.reduce((s,k)=>s+Number(rubricScores[k]),0),maxScore:rubric.max};
  }
  const s=Number(score),m=maxScore==null?rubric.max:Number(maxScore);
  if(!Number.isFinite(s)||s<0||!Number.isFinite(m)||m<=0||s>m||m>1000)return{error:'A valid score and max score are required'};
  return{score:s,maxScore:m};
}

export default async function handler(req,res){
  try{
    if(!['POST','PATCH'].includes(req.method)){res.setHeader('Allow',['POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});}
    if(!requireSameOrigin(req,res))return;
    const sql=getResearchDb(); const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
    await ensureMarkingSchema(sql);

    const {submissionId,score=null,maxScore=null,feedback='',rubricScores=null,releaseFeedback=false,review=null}=req.body||{};
    if(!submissionId)return res.status(400).json({ok:false,error:'submissionId is required'});
    const current=await sql`SELECT s.*,a.teacher_id,a.class_id,a.resource_id,a.activity_id,a.rubric_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE s.submission_id=${submissionId} LIMIT 1`;
    if(!current.length)return res.status(404).json({ok:false,error:'Submission not found'});
    const c=current[0]; if(!await teacherOwnsClass(sql,user,c.class_id))return res.status(403).json({ok:false,error:'Submission access denied'});

    const checked=validateRubric(c.rubric_id,rubricScores,score,maxScore); if(checked.error)return res.status(400).json({ok:false,error:checked.error});
    const safeFeedback=String(feedback||'').slice(0,20000),status=releaseFeedback?'feedback-released':'graded',state=releaseFeedback?'released':'graded';
    const rows=await sql`UPDATE submissions SET score=${checked.score},max_score=${checked.maxScore},feedback=${safeFeedback},rubric_scores=${rubricScores},grader_id=${user.user_id},status=${status},graded_at=NOW(),feedback_released_at=CASE WHEN ${releaseFeedback} THEN NOW() ELSE feedback_released_at END WHERE submission_id=${submissionId} RETURNING *`;

    const r=review&&typeof review==='object'?review:{};
    const strengths=Array.isArray(r.strengths)?r.strengths.slice(0,100).map(v=>String(v).slice(0,1000)):[];
    const priorities=Array.isArray(r.priorities)?r.priorities.slice(0,100).map(v=>String(v).slice(0,1000)):[];
    const annotations=Array.isArray(r.annotations)?r.annotations.slice(0,100):[];
    const overallComment=String(r.overallComment??safeFeedback).slice(0,20000);
    const reviewRows=await sql`INSERT INTO grading_reviews(submission_id,assignment_id,class_id,reviewer_id,state,rubric_scores,overall_comment,strengths,priorities,annotations,ai_draft)
      VALUES(${submissionId},${c.assignment_id},${c.class_id},${user.user_id},${state},${rubricScores||{}},${overallComment},${strengths},${priorities},${annotations},${r.aiDraft&&typeof r.aiDraft==='object'?r.aiDraft:null})
      ON CONFLICT(submission_id) DO UPDATE SET reviewer_id=EXCLUDED.reviewer_id,state=EXCLUDED.state,rubric_scores=EXCLUDED.rubric_scores,overall_comment=EXCLUDED.overall_comment,strengths=EXCLUDED.strengths,priorities=EXCLUDED.priorities,annotations=EXCLUDED.annotations,ai_draft=COALESCE(EXCLUDED.ai_draft,grading_reviews.ai_draft),revision=grading_reviews.revision+1,updated_at=NOW()
      RETURNING *`;

    const snapshot={rubricScores:rubricScores||{},overallComment,strengths,priorities,annotations,revision:reviewRows[0]?.revision||1};
    await sql`INSERT INTO grading_history(submission_id,assignment_id,class_id,actor_user_id,action,state,score,max_score,rubric_scores,feedback,review_snapshot)
      VALUES(${submissionId},${c.assignment_id},${c.class_id},${user.user_id},${releaseFeedback?'feedback.released':'grading.saved'},${state},${checked.score},${checked.maxScore},${rubricScores||{}},${safeFeedback},${snapshot})`;
    await sql`INSERT INTO events(teacher_id,class_id,lesson_id,activity_id,event_type,answer,score,metadata) VALUES(${user.user_id},${c.class_id},${c.resource_id},${c.activity_id},${releaseFeedback?'feedback.released':'grading.saved'},${{submissionId}},${checked.score},${{rubricId:c.rubric_id,rubricScores,maxScore:checked.maxScore,feedbackLength:safeFeedback.length,reviewRevision:reviewRows[0]?.revision||1}})`;
    return res.status(200).json({ok:true,submission:rows[0],review:reviewRows[0]});
  }catch(error){console.error('grades API failed',error);return res.status(500).json({ok:false,error:'Grading request failed'});}
}
