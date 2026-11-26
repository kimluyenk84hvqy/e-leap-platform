BEGIN;

CREATE TABLE IF NOT EXISTS studio_course_publications_v1 (
  shell_id text PRIMARY KEY CHECK (shell_id IN (
    'objective-first-b2-u04-l01',
    'objective-first-b2-u04-l02'
  )),
  draft_id text NOT NULL,
  draft_revision integer NOT NULL CHECK (draft_revision > 0),
  published_by text NOT NULL,
  lesson jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
