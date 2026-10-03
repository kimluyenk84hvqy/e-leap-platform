import { getResearchDb } from '../_research-db.js';

export default async function handler(req, res) {
  try {
    const sql = getResearchDb();

    if (req.method === 'GET') {
      const {
        userId,
        externalAuthId,
        email,
        role
      } = req.query || {};

      let rows;

      if (userId) {
        rows = await sql`
          SELECT
            user_id,
            external_auth_id,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
          FROM users
          WHERE user_id = ${userId}
          LIMIT 1
        `;
      } else if (externalAuthId) {
        rows = await sql`
          SELECT
            user_id,
            external_auth_id,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
          FROM users
          WHERE external_auth_id = ${externalAuthId}
          LIMIT 1
        `;
      } else if (email) {
        rows = await sql`
          SELECT
            user_id,
            external_auth_id,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;
      } else if (role) {
        rows = await sql`
          SELECT
            user_id,
            external_auth_id,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
          FROM users
          WHERE role = ${role}
          ORDER BY display_name ASC
        `;
      } else {
        rows = await sql`
          SELECT
            user_id,
            external_auth_id,
            email,
            display_name,
            role,
            is_active,
            created_at,
            updated_at
          FROM users
          ORDER BY created_at DESC
        `;
      }

      return res.status(200).json({
        ok: true,
        users: rows
      });
    }

    if (req.method === 'POST') {
      const {
        externalAuthId = null,
        email = null,
        displayName,
        role
      } = req.body || {};

      if (!displayName || !role) {
        return res.status(400).json({
          ok: false,
          error: 'displayName and role are required'
        });
      }

      const allowedRoles = [
        'research_lead',
        'teacher',
        'student'
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid role'
        });
      }

      if (externalAuthId) {
        const existing = await sql`
          SELECT *
          FROM users
          WHERE external_auth_id = ${externalAuthId}
          LIMIT 1
        `;

        if (existing.length > 0) {
          return res.status(200).json({
            ok: true,
            user: existing[0]
          });
        }
      }

      if (email) {
        const existing = await sql`
          SELECT *
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;

        if (existing.length > 0) {
          return res.status(200).json({
            ok: true,
            user: existing[0]
          });
        }
      }

      const rows = await sql`
        INSERT INTO users (
          external_auth_id,
          email,
          display_name,
          role
        )
        VALUES (
          ${externalAuthId},
          ${email},
          ${displayName},
          ${role}
        )
        RETURNING
          user_id,
          external_auth_id,
          email,
          display_name,
          role,
          is_active,
          created_at,
          updated_at
      `;

      return res.status(201).json({
        ok: true,
        user: rows[0]
      });
    }

    if (req.method === 'PATCH') {
      const {
        userId,
        displayName,
        role,
        isActive
      } = req.body || {};

      if (!userId) {
        return res.status(400).json({
          ok: false,
          error: 'userId is required'
        });
      }

      const rows = await sql`
        UPDATE users
        SET
          display_name = COALESCE(${displayName}, display_name),
          role = COALESCE(${role}, role),
          is_active = COALESCE(${isActive}, is_active),
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING
          user_id,
          external_auth_id,
          email,
          display_name,
          role,
          is_active,
          created_at,
          updated_at
      `;

      if (rows.length === 0) {
        return res.status(404).json({
          ok: false,
          error: 'User not found'
        });
      }

      return res.status(200).json({
        ok: true,
        user: rows[0]
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('R1 users API failed:', error);

    return res.status(500).json({
      ok: false,
      error: 'Research database unavailable'
    });
  }
}
