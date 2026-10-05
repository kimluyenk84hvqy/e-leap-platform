import { getResearchDb, researchDbAvailable } from '../_research-db.js';
export default async function handler(req,res){
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!researchDbAvailable())return res.status(503).json({ok:false,error:'Live database is not configured',code:'DB_NOT_CONFIGURED'});
  try{
    const sql=getResearchDb();
    await sql`CREATE TABLE IF NOT EXISTS classes (class_id BIGSERIAL PRIMARY KEY,teacher_id TEXT NOT NULL,class_name TEXT NOT NULL,course_id TEXT,academic_year TEXT,status TEXT NOT NULL DEFAULT 'active',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS sessions (session_id BIGSERIAL PRIMARY KEY,class_id BIGINT NOT NULL,teacher_id TEXT NOT NULL,lesson_id TEXT NOT NULL,join_code TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'active',started_at TIMESTAMPTZ,ended_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS participants (participant_id BIGSERIAL PRIMARY KEY,session_id BIGINT NOT NULL,student_user_id TEXT,participant_code TEXT,display_name TEXT,joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),left_at TIMESTAMPTZ)`;
    await sql`CREATE TABLE IF NOT EXISTS events (event_id BIGSERIAL PRIMARY KEY,client_event_id TEXT UNIQUE,session_id BIGINT,teacher_id TEXT,class_id BIGINT,participant_id BIGINT,lesson_id TEXT NOT NULL,activity_id TEXT,event_type TEXT NOT NULL,answer JSONB,is_correct BOOLEAN,score DOUBLE PRECISION,occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),metadata JSONB NOT NULL DEFAULT '{}'::jsonb)`;
    await sql`CREATE TABLE IF NOT EXISTS assignments (assignment_id BIGSERIAL PRIMARY KEY,teacher_id TEXT NOT NULL,class_id BIGINT NOT NULL,resource_id TEXT NOT NULL,activity_id TEXT,title TEXT NOT NULL,prompt TEXT,rubric_id TEXT,deadline TIMESTAMPTZ,attempt_limit INTEGER,late_policy TEXT NOT NULL DEFAULT 'allow-late',status TEXT NOT NULL DEFAULT 'active',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS submissions (submission_id BIGSERIAL PRIMARY KEY,assignment_id BIGINT NOT NULL,student_code TEXT NOT NULL,student_name TEXT,response JSONB NOT NULL DEFAULT '{}'::jsonb,attempt_no INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'submitted',submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),graded_at TIMESTAMPTZ,feedback_released_at TIMESTAMPTZ,score DOUBLE PRECISION,max_score DOUBLE PRECISION,feedback TEXT,rubric_scores JSONB,grader_id TEXT,metadata JSONB NOT NULL DEFAULT '{}'::jsonb)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_assignment_student_attempt ON submissions(assignment_id,student_code,attempt_no)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id,status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id,status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_code,submitted_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_lesson_type ON events(lesson_id,event_type)`;
    return res.status(200).json({ok:true,ready:true,assessmentResearchVersion:'1.0'});
  }catch(error){console.error('E-LEAP bootstrap failed',error);return res.status(500).json({ok:false,error:'Live database bootstrap failed'});}
}
