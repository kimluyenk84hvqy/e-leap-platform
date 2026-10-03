import { getResearchDb } from '../_research-db.js';

export default async function handler(req, res) {
  try {
    const sql = getResearchDb();

    if (req.method === 'GET') {
      const {
        sessionId,
        classId,
        teacherId,
        participantId,
        lessonId,
        activityId,
        eventType
      } = req.query || {};

      let rows;

      if (sessionId) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE session_id = ${sessionId}
          ORDER BY occurred_at ASC
        `;
      } else if (classId) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE class_id = ${classId}
          ORDER BY occurred_at ASC
        `;
      } else if (teacherId) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE teacher_id = ${teacherId}
          ORDER BY occurred_at ASC
        `;
      } else if (participantId) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE participant_id = ${participantId}
          ORDER BY occurred_at ASC
        `;
      } else if (lessonId) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE lesson_id = ${lessonId}
          ORDER BY occurred_at ASC
        `;
      } else if (activityId) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE activity_id = ${activityId}
          ORDER BY occurred_at ASC
        `;
      } else if (eventType) {
        rows = await sql`
          SELECT *
          FROM events
          WHERE event_type = ${eventType}
          ORDER BY occurred_at ASC
        `;
      } else {
        rows = await sql`
          SELECT *
          FROM events
          ORDER BY occurred_at DESC
          LIMIT 500
        `;
      }

      return res.status(200).json({
        ok: true,
        events: rows
      });
    }

    if (req.method === 'POST') {
      const {
        clientEventId = null,
        sessionId = null,
        teacherId = null,
        classId = null,
        participantId = null,
        lessonId,
        activityId = null,
        eventType,
        answer = null,
        isCorrect = null,
        score = null,
        occurredAt = null,
        metadata = {}
      } = req.body || {};

      if (!lessonId || !eventType) {
        return res.status(400).json({
          ok: false,
          error: 'lessonId and eventType are required'
        });
      }

      if (clientEventId) {
        const existing = await sql`
          SELECT event_id
          FROM events
          WHERE client_event_id = ${clientEventId}
          LIMIT 1
        `;

        if (existing.length > 0) {
          return res.status(200).json({
            ok: true,
            duplicate: true,
            eventId: existing[0].event_id
          });
        }
      }

      const rows = await sql`
        INSERT INTO events (
          client_event_id,
          session_id,
          teacher_id,
          class_id,
          participant_id,
          lesson_id,
          activity_id,
          event_type,
          answer,
          is_correct,
          score,
          occurred_at,
          metadata
        )
        VALUES (
          ${clientEventId},
          ${sessionId},
          ${teacherId},
          ${classId},
          ${participantId},
          ${lessonId},
          ${activityId},
          ${eventType},
          ${answer},
          ${isCorrect},
          ${score},
          ${occurredAt || new Date().toISOString()},
          ${metadata}
        )
        RETURNING *
      `;

      return res.status(201).json({
        ok: true,
        event: rows[0]
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('R1 events API failed:', error);

    return res.status(500).json({
      ok: false,
      error: 'Research database unavailable'
    });
  }
}
