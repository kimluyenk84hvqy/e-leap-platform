import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass } from '../_auth.js';
const RUBRICS={'writing-core-v1':{max:10,criteria:{task:2,organisation:2,vocabulary:2,grammar:2,style:2}},'speaking-core-v1':{max:10,criteria:{task:2,fluency:2,vocabulary:2,grammar:2,pronunciation:2}},'general-100-v1':{max:100,criteria:null}};
function validateRubric(rubricId,rubricScores,score,maxScore){const rubric=RUBRICS[rubricId]||RUBRICS['general-100-v1'];if(rubric.criteria){if(!rubricScores||typeof rubricScores!=='object')return{error:'All rubric criteria are required'};const keys=Object.keys(rubric.criteria);for(const k of keys){const v=Number(rubricScores[k]);if(!Number.isFinite(v)||v<0||v>rubric.criteria[k])return{error:`Invalid score for ${k}`};}if(Object.keys(rubricScores).some(k=>!keys.includes(k)))return{error:'Unknown rubric criterion'};return{score:keys.reduce((s,k)=>s+Number(rubricScores[k]),0),maxScore:rubric.max};}const s=Number(score),m=maxScore==null?rubric.max:Number(maxScore);if(!Number.isFinite(s)||s<0||!Number.isFinite(m)||m<=0||s>m||m>1000)return{error:'A valid score and max score are required'};return{score:s,maxScore:m};}
export default async function handler(req,res){
  try{
    if(!['POST','PATCH'].includes(req.method)){res.setHeader('Allow',['POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});}
    if(!requireSameOrigin(req,res))return; const sql=getResearchDb(); const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
    const {submissionId,score=null,maxScore=null,feedback='',rubricScores=null,releaseFeedback=false}=req.body||{}; if(!submissionId)return res.status(400).json({ok:false,error:'submissionId is required'});
    const current=await sql`SELECT s.*,a.teacher_id,a.class_id,a.resource_id,a.activity_id,a.rubric_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE s.submission_id=${submissionId} LIMIT 1`; if(!current.length)return res.status(404).json({ok:false,error:'Submission not found'});
    const c=current[0]; if(!await teacherOwnsClass(sql,user,c.class_id))return res.status(403).json({ok:false,error:'Submission access denied'});
    const checked=validateRubric(c.rubric_id,rubricScores,score,maxScore); if(checked.error)return res.status(400).json({ok:false,error:checked.error});
    const safeFeedback=String(feedback||'').slice(0,20000),status=releaseFeedback?'feedback-released':'graded';
    const rows=await sql`UPDATE submissions SET score=${checked.score},max_score=${checked.maxScore},feedback=${safeFeedback},rubric_scores=${rubricScores},grader_id=${user.user_id},status=${status},graded_at=COALESCE(graded_at,NOW()),feedback_released_at=CASE WHEN ${releaseFeedback} THEN NOW() ELSE feedback_released_at END WHERE submission_id=${submissionId} RETURNING *`;
    await sql`INSERT INTO events(teacher_id,class_id,lesson_id,activity_id,event_type,answer,score,metadata) VALUES(${user.user_id},${c.class_id},${c.resource_id},${c.activity_id},${releaseFeedback?'feedback.released':'grading.saved'},${{submissionId}},${checked.score},${{rubricId:c.rubric_id,rubricScores,maxScore:checked.maxScore,feedbackLength:safeFeedback.length}})`;
    return res.status(200).json({ok:true,submission:rows[0]});
  }catch(error){console.error('grades API failed',error);return res.status(500).json({ok:false,error:'Grading request failed'});}
}
