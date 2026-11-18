import { ensureAuthSchema,requireAuth,requireSameOrigin,normalizeEmail,normalizeStudentId,validStudentId,hashPassword } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=await ensureAuthSchema(); const actor=await requireAuth(req,res,['admin']); if(!actor)return;
    if(req.method==='GET'){
      const rows=await sql`SELECT user_id,email,student_id,display_name,role,status,must_change_password,(password_hash IS NOT NULL) AS credential_enrolled,created_at FROM auth_users ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json({ok:true,users:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const role=String(req.body?.role||'teacher'); if(!['admin','teacher','student'].includes(role))return res.status(400).json({ok:false,error:'Invalid role'});
      const name=String(req.body?.displayName||'').trim(); if(!name)return res.status(400).json({ok:false,error:'displayName is required'});
      const email=role==='student'?null:normalizeEmail(req.body?.email); const studentId=role==='student'?normalizeStudentId(req.body?.studentId):null;
      if(role!=='student'&&!email?.includes('@'))return res.status(400).json({ok:false,error:'Valid email is required'});
      if(role==='student'&&!studentId)return res.status(400).json({ok:false,error:'studentId is required'});
      const rawPassword=String(req.body?.password||''); if(role!=='student'&&rawPassword.length<10)return res.status(400).json({ok:false,error:'Temporary password must be at least 10 characters'});
      const passwordHash=role==='student'?null:hashPassword(rawPassword);
      const mustChange=role==='teacher';
      const rows=await sql`INSERT INTO auth_users(email,student_id,display_name,role,password_hash,must_change_password) VALUES(${email},${studentId},${name},${role},${passwordHash},${mustChange}) RETURNING user_id,email,student_id,display_name,role,status,must_change_password`;
      return res.status(201).json({ok:true,user:rows[0]});
    }
    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      const userId=String(req.body?.userId||'').trim();
      const action=String(req.body?.action||'reset-teacher-password').trim();
      if(!userId)return res.status(400).json({ok:false,error:'userId is required'});
      if(action==='change-role'||action==='set-status'){
        if(userId===String(actor.user_id))return res.status(409).json({ok:false,error:'You cannot change your own role or account status.'});
        const role=String(req.body?.role||''),status=String(req.body?.status||'');
        if(action==='change-role'&&!['admin','teacher'].includes(role))return res.status(400).json({ok:false,error:'Only Teacher and Admin roles can be exchanged.'});
        if(action==='set-status'&&!['active','inactive'].includes(status))return res.status(400).json({ok:false,error:'Invalid account status.'});
        // Serialize lifecycle changes; recheck actor authority after acquiring the lock.
        // Never change identity or class membership. Do not grant Admin before password setup.
        const results=await sql.transaction([
          sql`SELECT pg_advisory_xact_lock(724601)`,
          sql`WITH changed AS (
            UPDATE auth_users AS target SET
              role=CASE WHEN ${action}='change-role' THEN ${role} ELSE target.role END,
              status=CASE WHEN ${action}='set-status' THEN ${status} ELSE target.status END,
              updated_at=NOW()
            WHERE target.user_id=${userId} AND target.user_id<>${actor.user_id}
              AND EXISTS (SELECT 1 FROM auth_users WHERE user_id=${actor.user_id} AND role='admin' AND status='active' AND must_change_password=FALSE)
              AND (${action}='set-status' OR (target.role IN ('teacher','admin') AND target.status='active' AND target.email IS NOT NULL AND target.password_hash IS NOT NULL AND target.must_change_password=FALSE))
            RETURNING user_id,email,student_id,display_name,role,status,must_change_password
          ), revoked AS (
            DELETE FROM auth_sessions WHERE user_id IN (SELECT user_id FROM changed)
          ), linked AS (
            UPDATE users AS u SET
              role=CASE WHEN c.role='admin' THEN 'research_lead' WHEN c.role='teacher' THEN 'teacher' ELSE u.role END,
              is_active=(c.status='active'),updated_at=NOW()
            FROM changed c WHERE u.external_auth_id=c.user_id::text
          ) SELECT * FROM changed`
        ]);
        const rows=results[1];
        if(!rows.length)return res.status(409).json({ok:false,error:'Account unavailable, authority changed, or password setup must be completed first.'});
        return res.status(200).json({ok:true,user:rows[0],message:'Account updated. Existing sessions revoked.'});
      }
      if(action==='set-student-pin'){
        const studentId=normalizeStudentId(req.body?.studentId),pin=String(req.body?.pin||'');
        if(!validStudentId(studentId))return res.status(400).json({ok:false,error:'Enter a valid Student ID.'});
        if(!/^\d{6}$/.test(pin))return res.status(400).json({ok:false,error:'PIN must contain exactly 6 digits.'});
        const updated=await sql`WITH changed AS (
          UPDATE auth_users SET student_id=${studentId},password_hash=${hashPassword(pin)},updated_at=NOW()
          WHERE user_id=${userId} AND role='student' AND status='active'
          AND (student_id IS NULL OR student_id=${studentId})
          RETURNING user_id,student_id,display_name,role
        ), revoked AS (
          DELETE FROM auth_sessions WHERE user_id IN (SELECT user_id FROM changed)
        ) SELECT * FROM changed`;
        if(!updated.length)return res.status(409).json({ok:false,error:'Active student not found or existing Student ID does not match.'});
        return res.status(200).json({ok:true,user:updated[0],message:'PIN set. Student can sign in normally.'});
      }
      if(action==='reset-student-pin'){
        const rows=await sql`UPDATE auth_users SET password_hash=NULL,updated_at=NOW() WHERE user_id=${userId} AND role='student' RETURNING user_id,student_id,display_name,role`;
        if(!rows.length)return res.status(404).json({ok:false,error:'Student not found'});
        await sql`DELETE FROM auth_sessions WHERE user_id=${userId}`;
        return res.status(200).json({ok:true,user:rows[0],message:'Student PIN reset. Student must create a new PIN through class join.'});
      }
      if(action!=='reset-teacher-password')return res.status(400).json({ok:false,error:'Unsupported action'});
      const password=String(req.body?.password||'');
      if(password.length<10)return res.status(400).json({ok:false,error:'Temporary password must be at least 10 characters'});
      const rows=await sql`UPDATE auth_users SET password_hash=${hashPassword(password)},must_change_password=TRUE,updated_at=NOW() WHERE user_id=${userId} AND role='teacher' RETURNING user_id,email,display_name,role,must_change_password`;
      if(!rows.length)return res.status(404).json({ok:false,error:'Teacher not found'});
      await sql`DELETE FROM auth_sessions WHERE user_id=${userId}`;
      return res.status(200).json({ok:true,user:rows[0]});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){console.error('auth users failed',e);if(String(e?.message||'').includes('duplicate key'))return res.status(409).json({ok:false,error:'Email or Student ID already exists'});return res.status(500).json({ok:false,error:'User management failed'});}
}
