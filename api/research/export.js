import { createHmac } from 'node:crypto';
import { getResearchDb } from '../_research-db.js';
const q=v=>`"${String(v??'').replaceAll('"','""')}"`;
function pseudonym(code){
  const key=process.env.RESEARCH_PSEUDONYM_KEY||process.env.RESEARCH_DB_URL_DATABASE_URL||process.env.RESEARCH_DB_URL_POSTGRES_URL||process.env.RESEARCH_DB_URL||process.env.DATABASE_URL||process.env.POSTGRES_URL||process.env.NEON_DATABASE_URL;
  if(!key) throw new Error('Missing pseudonymization key');
  return 'P-'+createHmac('sha256',key).update(String(code||'').trim().toLowerCase()).digest('hex').slice(0,20);
}

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const kind=req.query?.kind||'submissions';
    const classId=req.query?.classId||null;
    const teacherId=req.query?.teacherId||null;
    if(!teacherId) return res.status(400).json({ok:false,error:'teacherId is required for research export'});
    if(req.query?.identified==='1') return res.status(403).json({ok:false,error:'Identified export is disabled in Research Data v1'});
    let rows=[];

    if(kind==='events'){
      const raw=classId?await sql`
        SELECT p.participant_code,e.session_id,e.class_id,e.lesson_id,e.activity_id,e.event_type,e.is_correct,e.score,e.occurred_at
        FROM events e
        JOIN sessions se ON se.session_id=e.session_id
        JOIN participants p ON p.participant_id=e.participant_id
        WHERE e.class_id=${classId} AND se.teacher_id=${teacherId}
          AND EXISTS (
            SELECT 1 FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
            WHERE a.class_id=e.class_id AND LOWER(s.student_code)=LOWER(p.participant_code)
              AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true
          )
        ORDER BY e.occurred_at`
      :await sql`
        SELECT p.participant_code,e.session_id,e.class_id,e.lesson_id,e.activity_id,e.event_type,e.is_correct,e.score,e.occurred_at
        FROM events e
        JOIN sessions se ON se.session_id=e.session_id
        JOIN participants p ON p.participant_id=e.participant_id
        WHERE se.teacher_id=${teacherId}
          AND EXISTS (
            SELECT 1 FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
            WHERE a.class_id=e.class_id AND LOWER(s.student_code)=LOWER(p.participant_code)
              AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true
          )
        ORDER BY e.occurred_at DESC LIMIT 5000`;
      rows=raw.map(({participant_code,...r})=>({research_participant_id:pseudonym(participant_code),...r}));
    }else if(kind==='submissions'){
      const raw=classId?await sql`
        SELECT s.student_code,s.submission_id,s.assignment_id,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,
               s.score,s.max_score,s.rubric_scores,a.title,a.resource_id,a.activity_id,a.rubric_id,a.class_id
        FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
        WHERE a.class_id=${classId} AND a.teacher_id=${teacherId}
          AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true
        ORDER BY s.submitted_at`
      :await sql`
        SELECT s.student_code,s.submission_id,s.assignment_id,s.attempt_no,s.status,s.submitted_at,s.graded_at,s.feedback_released_at,
               s.score,s.max_score,s.rubric_scores,a.title,a.resource_id,a.activity_id,a.rubric_id,a.class_id
        FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id
        WHERE a.teacher_id=${teacherId}
          AND COALESCE((s.metadata->>'researchConsent')::boolean,false)=true
        ORDER BY s.submitted_at DESC LIMIT 5000`;
      rows=raw.map(({student_code,...r})=>({research_participant_id:pseudonym(student_code),...r}));
    }else{
      return res.status(400).json({ok:false,error:'Unsupported export kind'});
    }

    if(req.query?.format==='csv'){
      const keys=rows[0]?Object.keys(rows[0]):[];
      const csv=[keys.map(q).join(','),...rows.map(r=>keys.map(k=>q(typeof r[k]==='object'?JSON.stringify(r[k]):r[k])).join(','))].join('\n');
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      res.setHeader('Content-Disposition',`attachment; filename=e-leap-${kind}-research.csv`);
      return res.status(200).send(csv);
    }
    return res.status(200).json({ok:true,kind,identified:false,rows});
  }catch(error){
    console.error('export API failed',error);
    return res.status(500).json({ok:false,error:'Research database unavailable'});
  }
}
