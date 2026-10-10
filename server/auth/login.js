import { ensureAuthSchema,normalizeEmail,verifyPassword,createSession,requireSameOrigin } from '../_auth.js';
const MAX_FAILURES=8,WINDOW_MIN=15,LOCK_MIN=15;
export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow',['POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!requireSameOrigin(req,res))return;
  try{
    const sql=await ensureAuthSchema();
    const email=normalizeEmail(req.body?.email),password=String(req.body?.password||''),expectedRole=String(req.body?.expectedRole||'').trim();
    if(!email||!password)return res.status(400).json({ok:false,error:'Email and password are required'});
    if(expectedRole && !['admin','teacher'].includes(expectedRole))return res.status(400).json({ok:false,error:'Invalid sign-in role'});
    const attempts=await sql`SELECT * FROM auth_login_attempts WHERE login_key=${email} LIMIT 1`;
    if(attempts[0]?.locked_until && new Date(attempts[0].locked_until).getTime()>Date.now())return res.status(429).json({ok:false,error:'Too many failed attempts. Try again later.'});
    const rows=await sql`SELECT user_id,email,student_id,display_name,role,status,password_hash,must_change_password FROM auth_users WHERE email=${email} LIMIT 1`;
    const u=rows[0],valid=Boolean(u&&u.status==='active'&&u.password_hash&&verifyPassword(password,u.password_hash));
    if(!valid){
      await sql`INSERT INTO auth_login_attempts(login_key,failures,window_started_at,locked_until) VALUES(${email},1,NOW(),NULL)
        ON CONFLICT(login_key) DO UPDATE SET
          failures=CASE WHEN auth_login_attempts.window_started_at < NOW()-INTERVAL '15 minutes' THEN 1 ELSE auth_login_attempts.failures+1 END,
          window_started_at=CASE WHEN auth_login_attempts.window_started_at < NOW()-INTERVAL '15 minutes' THEN NOW() ELSE auth_login_attempts.window_started_at END,
          locked_until=CASE WHEN (CASE WHEN auth_login_attempts.window_started_at < NOW()-INTERVAL '15 minutes' THEN 1 ELSE auth_login_attempts.failures+1 END) >= ${MAX_FAILURES} THEN NOW()+INTERVAL '15 minutes' ELSE NULL END`;
      return res.status(401).json({ok:false,error:'Invalid email or password'});
    }
    const adminTeacherPreview=u.role==='admin'&&expectedRole==='teacher';
    if(expectedRole && u.role!==expectedRole && !adminTeacherPreview)return res.status(403).json({ok:false,error:`This account is assigned as ${u.role}, not ${expectedRole}.`});
    if(!['admin','teacher'].includes(u.role))return res.status(403).json({ok:false,error:'Students sign in with Student ID and PIN.'});
    await sql`DELETE FROM auth_login_attempts WHERE login_key=${email}`;
    await sql`DELETE FROM auth_sessions WHERE expires_at<=NOW()`;
    await createSession(res,u.user_id);
    const {password_hash,...user}=u;
    return res.status(200).json({ok:true,user,viewRole:adminTeacherPreview?'teacher':u.role});
  }catch(e){console.error('login failed',e);return res.status(500).json({ok:false,error:'Login failed'});}
}
