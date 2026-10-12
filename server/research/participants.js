import { ensureAuthSchema,getAuth,requireAuth,requireSameOrigin,normalizeStudentId,createSession,teacherOwnsClass,hashPassword,verifyPassword } from '../_auth.js';

async function ensureLiveJoinSchema(sql){
  // Keep QR join self-healing. A valid active session should never fail merely because
  // an older deployment created only part of the newer auth/live schema.
  await sql`CREATE TABLE IF NOT EXISTS participants (
    participant_id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    student_user_id UUID,
    participant_code TEXT,
    display_name TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ
  )`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS student_user_id UUID`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS participant_code TEXT`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS display_name TEXT`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ`;
}

async function ensureResearchStudentUser(sql,authUser){
  // The legacy Research schema still has participants.student_user_id -> users.user_id.
  // Authenticated E-LEAP students live in auth_users, so bridge the two identities instead
  // of inserting an auth_users UUID into a legacy foreign-key column.
  const externalAuthId=String(authUser.user_id);
  let rows=await sql`SELECT user_id FROM users WHERE external_auth_id=${externalAuthId} LIMIT 1`;
  if(rows.length){
    await sql`UPDATE users SET display_name=${authUser.display_name||authUser.student_id||'Student'},role='student',is_active=TRUE,updated_at=NOW() WHERE user_id=${rows[0].user_id}`;
    return rows[0].user_id;
  }
  const inserted=await sql`INSERT INTO users(external_auth_id,email,display_name,role,is_active)
    VALUES(${externalAuthId},${authUser.email||null},${authUser.display_name||authUser.student_id||'Student'},'student',TRUE)
    RETURNING user_id`;
  return inserted[0].user_id;
}

export default async function handler(req,res){
  try{
    // Always ensure the shared auth tables before any join attempt. This makes QR join
    // reliable for students who joined before the auth upgrade as well as brand-new students.
    const sql=await ensureAuthSchema();
    await ensureLiveJoinSchema(sql);

    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const joinCode=String(req.body?.joinCode||'').trim().toUpperCase();
      if(!joinCode)return res.status(400).json({ok:false,error:'Join code is required'});

      const s=await sql`SELECT * FROM sessions WHERE join_code=${joinCode} AND status='active' LIMIT 1`;
      if(!s.length)return res.status(404).json({ok:false,error:'Join code is invalid or session has ended'});

      // Preferred path: an already signed-in Student keeps the same E-LEAP identity.
      const signedIn=await getAuth(req);
      let u,studentId,displayName;

      if(signedIn?.role==='student'){
        studentId=normalizeStudentId(signedIn.student_id);
        displayName=String(signedIn.display_name||studentId||'Student').trim().slice(0,160);
        u=await sql`SELECT * FROM auth_users WHERE user_id=${signedIn.user_id} AND role='student' AND status='active' LIMIT 1`;
        if(!u.length)return res.status(403).json({ok:false,error:'Student account is not active'});
      }else{
        // QR onboarding path for both previous and first-time students.
        studentId=normalizeStudentId(req.body?.studentId||req.body?.participantCode);
        displayName=String(req.body?.displayName||'').trim().slice(0,160);
        const pin=String(req.body?.pin||'');
        if(!studentId)return res.status(400).json({ok:false,error:'Student ID is required'});
        if(pin.length<6)return res.status(400).json({ok:false,error:'Student PIN must be at least 6 characters'});

        u=await sql`SELECT * FROM auth_users WHERE student_id=${studentId} LIMIT 1`;
        if(!u.length){
          const safeName=displayName||studentId;
          u=await sql`INSERT INTO auth_users(student_id,display_name,role,password_hash,status) VALUES(${studentId},${safeName},'student',${hashPassword(pin)},'active') RETURNING *`;
          displayName=safeName;
        }else{
          if(u[0].role!=='student')return res.status(403).json({ok:false,error:'This ID is not a Student account'});
          if(u[0].status!=='active'){
            u=await sql`UPDATE auth_users SET status='active',updated_at=NOW() WHERE user_id=${u[0].user_id} RETURNING *`;
          }
          // Legacy students may exist without a PIN because older Live Class versions did not
          // create one. The first successful QR join upgrades that account by setting the PIN.
          if(!u[0].password_hash){
            u=await sql`UPDATE auth_users SET password_hash=${hashPassword(pin)},updated_at=NOW() WHERE user_id=${u[0].user_id} RETURNING *`;
          }else if(!verifyPassword(pin,u[0].password_hash)){
            return res.status(401).json({ok:false,error:'Student ID or PIN is incorrect'});
          }
          if(!displayName)displayName=String(u[0].display_name||studentId).trim().slice(0,160);
          if(displayName&&u[0].display_name!==displayName){
            u=await sql`UPDATE auth_users SET display_name=${displayName},updated_at=NOW() WHERE user_id=${u[0].user_id} RETURNING *`;
          }
        }
      }

      // Auth/class membership uses auth_users, while the legacy research participants table
      // still points to users. Keep both identities linked explicitly.
      const researchStudentUserId=await ensureResearchStudentUser(sql,u[0]);

      await sql`INSERT INTO auth_class_members(class_id,student_user_id,status)
        VALUES(${String(s[0].class_id)},${u[0].user_id},'active')
        ON CONFLICT(class_id,student_user_id) DO UPDATE SET status='active'`;

      let p=await sql`SELECT * FROM participants WHERE session_id=${s[0].session_id} AND student_user_id=${researchStudentUserId} LIMIT 1`;
      if(!p.length){
        p=await sql`INSERT INTO participants(session_id,student_user_id,participant_code,display_name)
          VALUES(${s[0].session_id},${researchStudentUserId},${studentId},${displayName}) RETURNING *`;
      }else if(p[0].left_at || p[0].display_name!==displayName || p[0].participant_code!==studentId){
        p=await sql`UPDATE participants
          SET left_at=NULL,display_name=${displayName},participant_code=${studentId}
          WHERE participant_id=${p[0].participant_id} RETURNING *`;
      }

      // First-time / signed-out QR joins become signed in automatically after a successful join.
      if(!signedIn)await createSession(res,u[0].user_id);

      return res.status(201).json({
        ok:true,
        participant:p[0],
        session:{session_id:s[0].session_id,class_id:s[0].class_id,lesson_id:s[0].lesson_id,status:s[0].status},
        user:{user_id:u[0].user_id,student_id:u[0].student_id,display_name:u[0].display_name,role:'student'}
      });
    }

    if(req.method==='GET'){
      const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
      const sessionId=req.query?.sessionId; if(!sessionId)return res.status(400).json({ok:false,error:'sessionId is required'});
      const s=await sql`SELECT class_id FROM sessions WHERE session_id=${sessionId} LIMIT 1`; if(!s.length)return res.status(404).json({ok:false,error:'Session not found'});
      if(!await teacherOwnsClass(sql,user,s[0].class_id))return res.status(403).json({ok:false,error:'Session access denied'});
      const rows=await sql`SELECT participant_id,session_id,student_user_id,participant_code,display_name,joined_at,left_at FROM participants WHERE session_id=${sessionId} ORDER BY joined_at`;
      return res.status(200).json({ok:true,participants:rows});
    }

    res.setHeader('Allow',['GET','POST']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){
    console.error('participants failed',e);
    return res.status(500).json({ok:false,error:'Unable to join this live class. Please try the QR code again.',code:'LIVE_JOIN_FAILED'});
  }
}
