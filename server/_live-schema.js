export async function ensureLiveSchema(sql){
  await sql`CREATE TABLE IF NOT EXISTS classes (
    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    class_name TEXT NOT NULL,
    course_id TEXT,
    academic_year TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    lesson_id TEXT NOT NULL,
    join_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS participants (
    participant_id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    student_user_id UUID,
    participant_code TEXT,
    display_name TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE IF NOT EXISTS events (
    event_id BIGSERIAL PRIMARY KEY,
    client_event_id TEXT UNIQUE,
    session_id UUID,
    teacher_id UUID,
    class_id UUID,
    participant_id BIGINT,
    lesson_id TEXT NOT NULL,
    activity_id TEXT,
    event_type TEXT NOT NULL,
    answer JSONB,
    is_correct BOOLEAN,
    score DOUBLE PRECISION,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  )`;

  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS course_id TEXT`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year TEXT`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS teacher_id UUID`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS lesson_id TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS join_code TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`;

  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS student_user_id UUID`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS participant_code TEXT`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS display_name TEXT`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ`;

  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS client_event_id TEXT`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS teacher_id UUID`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS class_id UUID`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS participant_id BIGINT`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS lesson_id TEXT`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS activity_id TEXT`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS answer JSONB`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_correct BOOLEAN`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS score DOUBLE PRECISION`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_events_client_event_id ON events(client_event_id) WHERE client_event_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id,occurred_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id,joined_at)`;
}
