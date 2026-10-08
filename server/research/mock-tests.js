import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin } from '../_auth.js';

const QA_MOCK={
  id:'golden-qa-mock-001',
  title:'GOLDEN QA Mock Test',
  autoMax:4,
  answerKey:{r1:'B',r2:'C',l1:'A',l2:'B'},
  manualMax:20
};

async function ensureSchema(sql){
  await sql`CREATE TABLE IF NOT EXISTS mock_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_id TEXT NOT NULL,
    student_user_id UUID NOT NULL,
    student_code TEXT,
    student_name TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    writing_response TEXT,
    speaking_response TEXT,
    auto_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    auto_max DOUBLE PRECISION NOT NULL DEFAULT 0,
    writing_score DOUBLE PRECISION,
    speaking_score DOUBLE PRECISION,
    manual_max DOUBLE PRECISION NOT NULL DEFAULT 20,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'pending-marking',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    feedback_released_at TIMESTAMPTZ,
    grader_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mock_attempts_student ON mock_attempts(student_user_id,submitted_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mock_attempts_status ON mock_attempts(status,submitted_at)`;
}

function scoreAuto(answers={}){
  let score=0;
  for(const [k,v] of Object.entries(QA_MOCK.answerKey))if(String(answers?.[k]||'').toUpperCase()===v)score++;
  return score;
}

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res); if(!user)return;
    await ensureSchema(sql);
    if(req.method==='GET'){
      if(user.role==='student'){
        const rows=await sql`SELECT attempt_id,mock_id,auto_score,auto_max,
          CASE WHEN feedback_released_at IS NOT NULL THEN writing_score ELSE NULL END AS writing_score,
          CASE WHEN feedback_released_at IS NOT NULL THEN speaking_score ELSE NULL END AS speaking_score,
          manual_max,
          CASE WHEN feedback_released_at IS NOT NULL THEN feedback ELSE NULL END AS feedback,
          CASE WHEN feedback_released_at IS NOT NULL THEN 'feedback-released' ELSE 'submitted' END AS status,
          submitted_at,graded_at,feedback_released_at
          FROM mock_attempts WHERE student_user_id=${user.user_id} ORDER BY submitted_at DESC LIMIT 100`;
        return res.status(200).json({ok:true,mock:QA_MOCK,attempts:rows});
      }
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Access denied'});
      const rows=await sql`SELECT * FROM mock_attempts ORDER BY submitted_at DESC LIMIT 500`;
      return res.status(200).json({ok:true,mock:QA_MOCK,attempts:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      if(user.role!=='student')return res.status(403).json({ok:false,error:'Student session required'});
      const {mockId=QA_MOCK.id,answers={},writingResponse='',speakingResponse=''}=req.body||{};
      if(mockId!==QA_MOCK.id)return res.status(404).json({ok:false,error:'Mock test not found'});
      const autoScore=scoreAuto(answers);
      const rows=await sql`INSERT INTO mock_attempts(mock_id,student_user_id,student_code,student_name,answers,writing_response,speaking_response,auto_score,auto_max,manual_max,status)
        VALUES(${mockId},${user.user_id},${user.student_id||String(user.user_id)},${user.display_name||''},${answers},${String(writingResponse||'').slice(0,20000)},${String(speakingResponse||'').slice(0,20000)},${autoScore},${QA_MOCK.autoMax},${QA_MOCK.manualMax},'pending-marking') RETURNING *`;
      return res.status(201).json({ok:true,attempt:rows[0],autoScore,autoMax:QA_MOCK.autoMax});
    }
    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Teacher or admin required'});
      const {attemptId,writingScore,speakingScore,feedback='',releaseFeedback=false}=req.body||{};
      if(!attemptId)return res.status(400).json({ok:false,error:'attemptId is required'});
      const ws=Number(writingScore),ss=Number(speakingScore);
      if(!Number.isFinite(ws)||ws<0||ws>10||!Number.isFinite(ss)||ss<0||ss>10)return res.status(400).json({ok:false,error:'Writing and speaking scores must each be 0–10'});
      const status=releaseFeedback?'feedback-released':'graded';
      const rows=await sql`UPDATE mock_attempts SET writing_score=${ws},speaking_score=${ss},feedback=${String(feedback||'').slice(0,20000)},status=${status},grader_id=${user.user_id},graded_at=NOW(),feedback_released_at=CASE WHEN ${releaseFeedback} THEN NOW() ELSE feedback_released_at END WHERE attempt_id=${attemptId} RETURNING *`;
      if(!rows.length)return res.status(404).json({ok:false,error:'Mock attempt not found'});
      return res.status(200).json({ok:true,attempt:rows[0]});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){console.error('mock tests API failed',error);return res.status(500).json({ok:false,error:'Mock tests request failed'});}
}
