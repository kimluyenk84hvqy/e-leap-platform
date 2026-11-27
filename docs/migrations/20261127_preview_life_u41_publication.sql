BEGIN;

CREATE TABLE IF NOT EXISTS studio_lesson_drafts_v1 (
  lesson_id text NOT NULL,
  owner_user_id uuid NOT NULL,
  course_profile_id text NOT NULL,
  advanced_skill_id text,
  title text NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  lesson jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (((length(lesson_id) >= 4) AND (length(lesson_id) <= 120))),
  CHECK ((revision >= 1)),
  PRIMARY KEY (lesson_id),
  FOREIGN KEY (owner_user_id) REFERENCES auth_users(user_id)
);

CREATE TABLE IF NOT EXISTS studio_media_v1 (
  asset_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  original_name text NOT NULL,
  category text NOT NULL,
  content_type text NOT NULL,
  bytes bigint NOT NULL,
  client_sha256 text NOT NULL,
  blob_path text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_id),
  UNIQUE (blob_path)
);

CREATE TABLE IF NOT EXISTS studio_course_publications_v1 (
  shell_id text PRIMARY KEY CHECK (shell_id IN (
    'objective-first-b2-u04-l01',
    'objective-first-b2-u04-l02',
    'life-intermediate-u04-l01'
  )),
  draft_id text NOT NULL,
  draft_revision integer NOT NULL CHECK (draft_revision > 0),
  published_by text NOT NULL,
  lesson jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
