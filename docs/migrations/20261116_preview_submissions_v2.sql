-- E-LEAP PREVIEW ONLY — NOT EXECUTED
-- Target Neon project: jolly-water-29205068
-- Target branch ID: br-holy-surf-b3fhwfih
-- NEVER use on br-bitter-rice-b35yfm8y (Neon main).
-- Requires explicit review and approval before execution.
-- Migration is intentionally non-repeatable and aborts on any unexpected data.
BEGIN;

LOCK TABLE public.assignments, public.submissions IN ACCESS EXCLUSIVE MODE;

DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.assignments LIMIT 1) OR
     EXISTS (SELECT 1 FROM public.submissions LIMIT 1) THEN
    RAISE EXCEPTION 'Legacy assignment or submission table is not empty: abort migration';
  END IF;
  IF to_regclass('public.assignments_legacy_20261116') IS NOT NULL OR
     to_regclass('public.submissions_legacy_20261116') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy backup names already exist: abort migration';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE contype='f' AND confrelid IN (
      'public.assignments'::regclass,'public.submissions'::regclass)
  ) THEN RAISE EXCEPTION 'Other tables reference legacy assignment or submission schema: abort'; END IF;
END
$guard$;

ALTER TABLE public.submissions RENAME TO submissions_legacy_20261116;
ALTER TABLE public.assignments RENAME TO assignments_legacy_20261116;

CREATE TABLE public.assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(class_id),
  resource_id TEXT NOT NULL,
  activity_id TEXT,
  title TEXT NOT NULL,
  prompt TEXT,
  rubric_id TEXT,
  deadline TIMESTAMPTZ,
  attempt_limit INTEGER,
  late_policy TEXT NOT NULL DEFAULT 'closed',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assignments_class_v2 ON public.assignments(class_id,status);
CREATE INDEX idx_assignments_teacher_v2 ON public.assignments(teacher_id,created_at);

CREATE TABLE public.submissions (
  submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(assignment_id),
  student_user_id UUID NOT NULL REFERENCES public.auth_users(user_id),
  client_request_id UUID NOT NULL,
  student_code TEXT NOT NULL,
  student_name TEXT,
  response JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt_no INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  feedback_released_at TIMESTAMPTZ,
  score DOUBLE PRECISION,
  max_score DOUBLE PRECISION,
  feedback TEXT,
  rubric_scores JSONB,
  grader_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX idx_submissions_assignment_student_attempt_v2
  ON public.submissions(assignment_id,student_user_id,attempt_no);
CREATE UNIQUE INDEX idx_submissions_idempotent_v2
  ON public.submissions(assignment_id,student_user_id,client_request_id);
CREATE INDEX idx_submissions_student_v2 ON public.submissions(student_user_id,submitted_at);

COMMIT;

-- POST-VALIDATION: run independently, READ-ONLY, on Preview after approval:
-- SELECT column_name,data_type FROM information_schema.columns
--   WHERE table_name IN ('assignments','submissions') ORDER BY table_name,ordinal_position;
-- SELECT indexname,indexdef FROM pg_indexes WHERE tablename='submissions';
-- GET /api/research/bootstrap must return submissionsReady:true.
-- No automatic cleanup of legacy tables. Retain until separate approved disposal.
