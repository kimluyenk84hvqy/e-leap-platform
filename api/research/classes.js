import { getResearchDb } from '../_research-db.js';

export default async function handler(req, res) {
  try {
    const sql = getResearchDb();

    if (req.method === 'GET') {
      const teacherId = req.query?.teacherId;

      if (teacherId) {
        const rows = await sql`
          SELECT
            class_id,
            teacher_id,
            class_name,
            course_id,
            academic_year,
            status,
            created_at,
            updated_at
          FROM classes
          WHERE teacher_id = ${teacherId}
          ORDER BY created_at DESC
        `;

        return res.status(200).json({
          ok: true,
          classes: rows
        });
      }

      const rows = await sql`
        SELECT
          class_id,
          teacher_id,
          class_name,
          course_id,
          academic_year,
          status,
          created_at,
          updated_at
        FROM classes
        ORDER BY created_at DESC
      `;

      return res.status(200).json({
        ok: true,
        classes: rows
      });
    }

    if (req.method === 'POST') {
      const {
        teacherId,
        className,
        courseId = null,
        academicYear = null
      } = req.body || {};

      if (!teacherId || !className) {
        return res.status(400).json({
          ok: false,
          error: 'teacherId and className are required'
        });
      }

      const rows = await sql`
        INSERT INTO classes (
          teacher_id,
          class_name,
          course_id,
          academic_year
        )
        VALUES (
          ${teacherId},
          ${className},
          ${courseId},
          ${academicYear}
        )
        RETURNING
          class_id,
          teacher_id,
          class_name,
          course_id,
          academic_year,
          status,
          created_at,
          updated_at
      `;

      return res.status(201).json({
        ok: true,
        class: rows[0]
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('R1 classes API failed:', error);

    return res.status(500).json({
      ok: false,
      error: 'Research database unavailable'
    });
  }
}
