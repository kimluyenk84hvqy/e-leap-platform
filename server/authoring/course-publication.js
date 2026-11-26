import {auditLesson} from '../../assets/js/quality/quality-gate.js';
import {auditAuditorium} from '../../assets/js/authoring/auditorium-quality.js';
import {validateServerLesson} from './lessons.js';

const slots = new Map([
  ['objective-first-b2-u04-l01', 'U4.1'],
  ['objective-first-b2-u04-l02', 'U4.2']
]);

export function publicationBlockers(shellId, lesson) {
  const problems = validateServerLesson(lesson);
  if (problems.length) return problems;

  if (!slots.has(shellId) || lesson.courseProfileId !== 'objective-first-b2' ||
      lesson.lessonNumber !== slots.get(shellId)) {
    return ['The draft does not match the selected Course B2 lesson.'];
  }

  const review = lesson.assistedAuthoring;
  if (review?.teacherApproved !== true || review?.sourceVerified !== true) {
    problems.push('Original source, answers and media require teacher review.');
  }

  for (const [severity, message] of [...auditLesson(lesson), ...auditAuditorium(lesson)]) {
    if (severity === 'error') problems.push(message);
  }
  return problems;
}

export async function recordCoursePublication(sql, {ownerId, draftId, revision, shellId}) {
  const [draft] = await sql`
    SELECT lesson FROM studio_lesson_drafts_v1
    WHERE lesson_id = ${draftId} AND owner_user_id = ${ownerId} AND revision = ${revision}
  `;
  if (!draft) return {ok: false, code: 'VERSION_CONFLICT'};

  const blockers = publicationBlockers(shellId, draft.lesson);
  if (blockers.length) return {ok: false, code: 'QUALITY_GATE', blockers};

  const [saved] = await sql`
    INSERT INTO studio_course_publications_v1
      (shell_id, draft_id, draft_revision, published_by, lesson)
    SELECT ${shellId}, lesson_id, revision, owner_user_id, lesson
    FROM studio_lesson_drafts_v1
    WHERE lesson_id = ${draftId} AND owner_user_id = ${ownerId} AND revision = ${revision}
    ON CONFLICT (shell_id) DO NOTHING
    RETURNING shell_id
  `;
  if (saved) return {ok: true, shellId};

  const [existing] = await sql`
    SELECT shell_id FROM studio_course_publications_v1
    WHERE shell_id = ${shellId} AND draft_id = ${draftId}
      AND draft_revision = ${revision} AND published_by = ${ownerId}
  `;
  return existing ? {ok: true, shellId} : {ok: false, code: 'VERSION_OR_SLOT_CONFLICT'};
}
