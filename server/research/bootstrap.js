import { getResearchDb,researchDbAvailable } from '../_research-db.js';
import { ensureAuthSchema,requireAuth,requireSameOrigin } from '../_auth.js';
export default async function handler(req,res){
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!researchDbAvailable())return res.status(503).json({ok:false,error:'Live database is not configured',code:'DB_NOT_CONFIGURED'});
  try{
    if(req.method==='GET'){
      const sql=getResearchDb(); await sql`SELECT 1`; return res.status(200).json({ok:true,ready:true,assessmentResearchVersion:'1.1',authAccessVersion:'1.0'});
    }
    if(!requireSameOrigin(req,res))return;
    const sql=await ensureAuthSchema();
    const admins=await sql`SELECT COUNT(*)::int AS n FROM auth_users WHERE role='admin'`;
    if(Number(admins[0]?.n||0)>0){const user=await requireAuth(req,res,['admin']);if(!user)return;}
    await sql`CREATE TABLE IF NOT EXISTS classes (class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),teacher_id UUID NOT NULL,class_name TEXT NOT NULL,course_id TEXT,academic_year TEXT,status TEXT NOT NULL DEFAULT 'active',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS sessions (session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),class_id UUID NOT NULL,teacher_id UUID NOT NULL,lesson_id TEXT NOT NULL,join_code TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active',started_at TIMESTAMPTZ,ended_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS participants (participant_id BIGSERIAL PRIMARY KEY,session_id UUID NOT NULL,student_user_id UUID,participant_code TEXT,display_name TEXT,joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),left_at TIMESTAMPTZ)`;
    await sql`CREATE TABLE IF NOT EXISTS events (event_id BIGSERIAL PRIMARY KEY,client_event_id TEXT UNIQUE,session_id UUID,teacher_id UUID,class_id UUID,participant_id BIGINT,lesson_id TEXT NOT NULL,activity_id TEXT,event_type TEXT NOT NULL,answer JSONB,is_correct BOOLEAN,score DOUBLE PRECISION,occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),metadata JSONB NOT NULL DEFAULT '{}'::jsonb)`;
    await sql`CREATE TABLE IF NOT EXISTS assignments (assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),teacher_id UUID NOT NULL,class_id UUID NOT NULL,resource_id TEXT NOT NULL,activity_id TEXT,title TEXT NOT NULL,prompt TEXT,rubric_id TEXT,deadline TIMESTAMPTZ,attempt_limit INTEGER,late_policy TEXT NOT NULL DEFAULT 'allow-late',status TEXT NOT NULL DEFAULT 'active',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS submissions (submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),assignment_id UUID NOT NULL,student_user_id UUID,student_code TEXT NOT NULL,student_name TEXT,response JSONB NOT NULL DEFAULT '{}'::jsonb,attempt_no INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'submitted',submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),graded_at TIMESTAMPTZ,feedback_released_at TIMESTAMPTZ,score DOUBLE PRECISION,max_score DOUBLE PRECISION,feedback TEXT,rubric_scores JSONB,grader_id UUID,metadata JSONB NOT NULL DEFAULT '{}'::jsonb)`;
    await sql`CREATE TABLE IF NOT EXISTS research_feedback (feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),class_id UUID NOT NULL,session_id UUID,lesson_id TEXT,respondent_user_id UUID NOT NULL,respondent_role TEXT NOT NULL,dimension TEXT NOT NULL,instrument TEXT NOT NULL DEFAULT 'e-leap-flex-v1',items JSONB NOT NULL DEFAULT '{}'::jsonb,comment TEXT,research_consent BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_assignment_student_attempt ON submissions(assignment_id,student_code,attempt_no)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id,status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_student_user ON submissions(student_user_id,submitted_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_research_feedback_class ON research_feedback(class_id,created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_research_feedback_session ON research_feedback(session_id,created_at)`;
    return res.status(200).json({ok:true,ready:true,assessmentResearchVersion:'1.1',authAccessVersion:'1.0'});
  }catch(error){console.error('E-LEAP bootstrap failed',error);return res.status(500).json({ok:false,error:'Live database bootstrap failed'});}
}
