-- U6 Jigsaw scope. Execute only on Neon Preview br-holy-surf-b3fhwfih after preflight.
-- Never on Neon main, GitHub main or Vercel Production.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE IF NOT EXISTS public.reading_jigsaw_materials (
 assignment_id UUID PRIMARY KEY REFERENCES public.assignments(assignment_id) ON DELETE CASCADE,
 class_id UUID NOT NULL REFERENCES public.classes(class_id),
 accounts JSONB NOT NULL,
 photo_labels JSONB NOT NULL,
 photo_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
 original_questions JSONB NOT NULL,
 source_page INTEGER NOT NULL,
 source_text_verified BOOLEAN NOT NULL DEFAULT FALSE,
 photo_assets_verified BOOLEAN NOT NULL DEFAULT FALSE,
 created_by UUID NOT NULL REFERENCES public.auth_users(user_id),
 reviewed_by UUID REFERENCES public.auth_users(user_id),
 reviewed_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT reading_jigsaw_three_accounts CHECK (jsonb_typeof(accounts)='object' AND accounts ?& ARRAY['A','B','C'])
);
CREATE TABLE IF NOT EXISTS public.reading_jigsaw_members (
 assignment_id UUID NOT NULL REFERENCES public.reading_jigsaw_materials(assignment_id) ON DELETE CASCADE,
 class_id UUID NOT NULL REFERENCES public.classes(class_id),
 student_user_id UUID NOT NULL REFERENCES public.auth_users(user_id),
 account CHAR(1) NOT NULL CHECK (account IN ('A','B','C')),
 assigned_by UUID NOT NULL REFERENCES public.auth_users(user_id),
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY (assignment_id,student_user_id)
);
CREATE INDEX IF NOT EXISTS idx_reading_jigsaw_members_class ON public.reading_jigsaw_members(class_id,account);
COMMIT;