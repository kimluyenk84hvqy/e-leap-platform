import { createHmac } from 'node:crypto';
import { getResearchDb } from '../_research-db.js';
import { requireAuth,teacherOwnsClass } from '../_auth.js';
const q=v=>`"${String(v??'').replaceAll('"','""')}"`;
function pseudonym(code){const key=process.env.RESEARCH_PSEUDONYM_KEY||process.env.E_LEAP_SESSION_SECRET;if(!key)throw new Error('Missing RESEARCH_PSEUDONYM_KEY');return'P-'+createHmac('sha256',key).update(String(code||'').trim().toLowerCase()).digest('hex').slice(0,20);}
export default async function handler(req,res){
  try{
    if(req.method!=='GET'){res.setHeader('Allow',['GET']);return res.status(405).json({ok:false,error:'Method not allowed'});}
    const sql=getResearchDb(); const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
    const kind=req.query?.kind||'submissions',classId=req.query?.classId||null;
    if(req.query?.identified==='1')return res.status(403).json({ok:false,error:'Identified export is disabled'});
    if(classId&&!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class export access denied'});
    let rows=[];
    if(kind==='submissions'){
      const raw=classId?await sql`SELECT s.student_code,s.submission_id,s.assignment_id,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,s.score,s.max_score,s.rubric_scores,a.title,a.resource_id,a.activity_id,a.rubric_id,a.class_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE a.class_id=${classId} AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true ORDER BY s.submitted_at`:user.role==='admin'?await sql`SELECT s.student_code,s.submission_id,s.assignment_id,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,s.score,s.max_score,s.rubric_scores,a.title,a.resource_id,a.activity_id,a.rubric_id,a.class_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE COALESCE((s.metadata->>'researchConsent')::boolean,false)=true ORDER BY s.submitted_at DESC LIMIT 5000`:await sql`SELECT s.student_code,s.submission_id,s.assignment_id,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,s.score,s.max_score,s.rubric_scores,a.title,a.resource_id,a.activity_id,a.rubric_id,a.class_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE a.teacher_id=${user.user_id} AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true ORDER BY s.submitted_at DESC LIMIT 5000`;
      rows=raw.map(({student_code,...r})=>({research_participant_id:pseudonym(student_code),...r}));
    }else if(kind==='events'){
      const raw=classId?await sql`SELECT p.participant_code,e.session_id,e.class_id,e.lesson_id,e.activity_id,e.event_type,e.is_correct,e.score,e.occurred_at FROM events e JOIN sessions se ON se.session_id=e.session_id JOIN participants p ON p.participant_id=e.participant_id WHERE e.class_id=${classId} AND EXISTS(SELECT 1 FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE a.class_id=e.class_id AND s.student_user_id=p.student_user_id AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true) ORDER BY e.occurred_at`:user.role==='admin'?await sql`SELECT p.participant_code,e.session_id,e.class_id,e.lesson_id,e.activity_id,e.event_type,e.is_correct,e.score,e.occurred_at FROM events e JOIN participants p ON p.participant_id=e.participant_id ORDER BY e.occurred_at DESC LIMIT 5000`:await sql`SELECT p.participant_code,e.session_id,e.class_id,e.lesson_id,e.activity_id,e.event_type,e.is_correct,e.score,e.occurred_at FROM events e JOIN sessions se ON se.session_id=e.session_id JOIN participants p ON p.participant_id=e.participant_id WHERE se.teacher_id=${user.user_id} ORDER BY e.occurred_at DESC LIMIT 5000`;
      rows=raw.map(({participant_code,...r})=>({research_participant_id:pseudonym(participant_code),...r}));
    }else return res.status(400).json({ok:false,error:'Unsupported export kind'});
    if(req.query?.format==='csv'){const keys=rows[0]?Object.keys(rows[0]):[];const csv=[keys.map(q).join(','),...rows.map(r=>keys.map(k=>q(typeof r[k]==='object'?JSON.stringify(r[k]):r[k])).join(','))].join('\n');res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename=e-leap-${kind}-research.csv`);return res.status(200).send(csv);}
    return res.status(200).json({ok:true,kind,identified:false,rows});
  }catch(error){console.error('export API failed',error);return res.status(500).json({ok:false,error:'Research export failed'});}
}
