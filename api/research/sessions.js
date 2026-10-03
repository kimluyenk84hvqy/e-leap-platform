import { getResearchDb } from '../_research-db.js';

function makeJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default async function handler(req, res) {
  try {
    const sql = getResearchDb();

    if (req.method === 'GET') {
      const classId = req.query?.classId;
      const teacherId = req.query?.teacherId;
      const status = req.query?.status;

      let rows;

      if (classId) {
        rows = await sql`
          SELECT
            session_id,
            class_id,
            teacher_id,
            lesson_id,
            join_code,
            status,
            started_at,
            ended_at,
            created_at
          FROM sessions
          WHERE class_id = ${classId}
          ORDER BY created_at DESC
        `;
      } else if (teacherId) {
        rows = await sql`
          SELECT
            session_id,
            class_id,
            teacher_id,
            lesson_id,
            join_code,
            status,
            started_at,
            ended_at,
            created_at
          FROM sessions
          WHERE teacher_id = ${teacherId}
          ORDER BY created_at DESC
        `;
      } else if (status) {
        rows = await sql`
          SELECT
            session_id,
            class_id,
            teacher_id,
            lesson_id,
            join_code,
            status,
            started_at,
            ended_at,
            created_at
          FROM sessions
          WHERE status = ${status}
          ORDER BY created_at DESC
        `;
      } else {
        rows = await sql`
          SELECT
            session_id,
            class_id,
            teacher_id,
            lesson_id,
            join_code,
            status,
            started_at,
            ended_at,
            created_at
          FROM sessions
          ORDER BY created_at DESC
        `;
      }

      return res.status(200).json({
        ok: true,
        sessions: rows
      });
    }

    if (req.method === 'POST') {
      const {
        classId,
        teacherId,
        lessonId,
        status = 'active'
      } = req.body || {};

      if (!classId || !teacherId || !lessonId) {
        return res.status(400).json({
          ok: false,
          error: 'classId, teacherId and lessonId are required'
        });
      }

      let joinCode = makeJoinCode();

      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await sql`
          SELECT session_id
          FROM sessions
          WHERE join_code = ${joinCode}
          LIMIT 1
        `;

        if (existing.length === 0) break;

        joinCode = makeJoinCode();
      }

      const startedAt =
        status === 'active' ? new Date().toISOString() : null;

      const rows = await sql`
        INSERT INTO sessions (
          class_id,
          teacher_id,
          lesson_id,
          join_code,
          status,
          started_at
        )
        VALUES (
          ${classId},
          ${teacherId},
          ${lessonId},
          ${joinCode},
          ${status},
          ${startedAt}
        )
        RETURNING
          session_id,
          class_id,
          teacher_id,
          lesson_id,
          join_code,
          status,
          started_at,
          ended_at,
          created_at
      `;

      return res.status(201).json({
        ok: true,
        session: rows[0]
      });
    }

    if (req.method === 'PATCH') {
      const {
        sessionId,
        status
      } = req.body || {};

      if (!sessionId || !status) {
        return res.status(400).json({
          ok: false,
          error: 'sessionId and status are required'
        });
      }

      const endedAt =
        status === 'ended' ? new Date().toISOString() : null;

      const rows = await sql`
        UPDATE sessions
        SET
          status = ${status},
          ended_at = CASE
            WHEN ${status} = 'ended'
            THEN ${endedAt}
            ELSE ended_at
          END
        WHERE session_id = ${sessionId}
        RETURNING
          session_id,
          class_id,
          teacher_id,
          lesson_id,
          join_code,
          status,
          started_at,
          ended_at,
          created_at
      `;

      if (rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'Session not found'
        });
      }

      return res.status(200).json({
        ok: true,
        session: rows[0]
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('R1 sessions API failed:', error);

    return res.status(500).json({
      ok: false,
      error: 'Research database unavailable'
    });
  }
}
