BEGIN;

ALTER TABLE studio_course_publications_v1
  DROP CONSTRAINT studio_course_publications_v1_shell_id_check,
  ADD CONSTRAINT studio_course_publications_v1_shell_id_check CHECK (shell_id IN (
    'objective-first-b2-u04-l01',
    'objective-first-b2-u04-l02',
    'life-intermediate-u04-l01'
  ));

COMMIT;
