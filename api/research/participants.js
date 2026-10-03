import { getResearchDb } from '../_research-db.js';

export default async function handler(req, res) {
  try {
    const sql = getResearchDb();

    if (req.method === 'GET') {
      const sessionId = req.query?.sessionId;

      if (!sessionId) {
        return res.status(400).json({
          ok: false,
          error: 'sessionId is required'
        });
      }

      const rows = await sql`
        SELECT
          participant_id,
          session_id,
          student_user_id,
          participant_code,
          display_name,
          joined_at,
          left_at
        FROM participants
        WHERE session_id = ${sessionId}
        ORDER BY joined_at ASC
      `;

      return res.status(200).json({
        ok: true,
        participants: rows
      });
    }

    if (req.method === 'POST') {
      const {
        joinCode,
        studentUserId = null,
        participantCode = null,
        displayName = null
      } = req.body || {};

      if (!joinCode) {
        return res.status(400).json({
          ok: false,
          error: 'joinCode is required'
        });
      }

      const sessions = await sql`
        SELECT
          session_id,
          class_id,
          teacher_id,
          lesson_id,
          join_code,
          status
        FROM sessions
        WHERE join_code = ${joinCode}
        LIMIT 1
      `;

      if (sessions.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'Session not found'
        });
      }

      const session = sessions[0];

      if (session.status !== 'active') {
        return res.status(409).json({
          ok: false,
          error: 'Session is not active'
        });
      }

      if (studentUserId) {
        const existing = await sql`
          SELECT *
          FROM participants
          WHERE session_id = ${session.session_id}
            AND student_user_id = ${studentUserId}
          LIMIT 1
        `;

        if (existing.length > 0) {
          return res.status(200).json({
            ok: true,
            participant: existing[0],
            session
          });
        }
      }

      const rows = await sql`
        INSERT INTO participants (
          session_id,
          student_user_id,
          participant_code,
          display_name
        )
        VALUES (
          ${session.session_id},
          ${studentUserId},
          ${participantCode},
          ${displayName}
        )
        RETURNING
          participant_id,
          session_id,
          student_user_id,
          participant_code,
          display_name,
          joined_at,
          left_at
      `;

      return res.status(201).json({
        ok: true,
        participant: rows[0],
        session
      });
    }

    if (req.method === 'PATCH') {
      const {
        participantId,
        leave = true
      } = req.body || {};

      if (!participantId) {
        return res.status(400).json({
          ok: false,
          error: 'participantId is required'
        });
      }

      const rows = await sql`
        UPDATE participants
        SET left_at = CASE
          WHEN ${leave}
          THEN NOW()
          ELSE NULL
        END
        WHERE participant_id = ${participantId}
        RETURNING
          participant_id,
          session_id,
          student_user_id,
          participant_code,
          display_name,
          joined_at,
          left_at
      `;

      if (rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'Participant not found'
        });
      }

      return res.status(200).json({
        ok: true,
        participant: rows[0]
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('R1 participants API failed:', error);

    return res.status(500).json({
      ok: false,
      error: 'Research database unavailable'
    });
  }
}
