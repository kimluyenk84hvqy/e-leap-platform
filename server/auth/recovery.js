import { randomInt,createHash } from 'node:crypto';
import { ensureAuthSchema,requireSameOrigin,normalizeEmail,hashPassword } from '../_auth.js';

const sha256=v=>createHash('sha256').update(String(v)).digest('hex');
const CODE_TTL_MIN=15;

async function ensureRecoveryTable(sql){
  await sql`CREATE TABLE IF NOT EXISTS auth_recovery_codes (
    recovery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'password-reset',
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auth_recovery_user_created ON auth_recovery_codes(user_id,created_at DESC)`;
}

async function sendResetEmail(email,code){
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.E_LEAP_FROM_EMAIL||process.env.AUTH_FROM_EMAIL;
  if(!apiKey||!from) return {ok:false,notConfigured:true};
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:'E-LEAP password reset code',text:`Your E-LEAP password reset code is ${code}. It expires in ${CODE_TTL_MIN} minutes. If you did not request this, ignore this email.`})});
  if(!r.ok){const body=await r.text().catch(()=> '');throw new Error(`Recovery email failed (${r.status}) ${body.slice(0,120)}`);}
  return {ok:true};
}

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow',['POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!requireSameOrigin(req,res))return;
  try{
    const sql=await ensureAuthSchema(); await ensureRecoveryTable(sql);
    const action=String(req.body?.action||'request').trim();
    const email=normalizeEmail(req.body?.email);
    if(!email||!email.includes('@'))return res.status(400).json({ok:false,error:'Enter a valid email address'});
    const rows=await sql`SELECT user_id,email,role,status FROM auth_users WHERE email=${email} AND role IN ('admin','teacher') LIMIT 1`;
    const user=rows[0];
    if(action==='request'){
      if(!user||user.status!=='active')return res.status(200).json({ok:true,message:'If this email belongs to an active E-LEAP account, a reset code will be sent.'});
      const recent=await sql`SELECT created_at FROM auth_recovery_codes WHERE user_id=${user.user_id} AND created_at>NOW()-INTERVAL '60 seconds' ORDER BY created_at DESC LIMIT 1`;
      if(recent.length)return res.status(429).json({ok:false,error:'Please wait a minute before requesting another code.'});
      const code=String(randomInt(100000,1000000));
      const delivery=await sendResetEmail(email,code);
      if(delivery.notConfigured)return res.status(503).json({ok:false,error:'Email password recovery is not configured yet. Please ask an Administrator to reset your password.',code:'EMAIL_RECOVERY_NOT_CONFIGURED'});
      await sql`UPDATE auth_recovery_codes SET used_at=NOW() WHERE user_id=${user.user_id} AND used_at IS NULL`;
      await sql`INSERT INTO auth_recovery_codes(user_id,code_hash,expires_at) VALUES(${user.user_id},${sha256(code)},NOW()+INTERVAL '15 minutes')`;
      return res.status(200).json({ok:true,message:'A 6-digit reset code has been sent to your email.'});
    }
    if(action==='reset'){
      const code=String(req.body?.code||'').trim(),newPassword=String(req.body?.newPassword||'');
      if(!/^\d{6}$/.test(code))return res.status(400).json({ok:false,error:'Enter the 6-digit reset code'});
      if(newPassword.length<10)return res.status(400).json({ok:false,error:'New password must be at least 10 characters'});
      if(!user||user.status!=='active')return res.status(400).json({ok:false,error:'Reset code is invalid or expired'});
      const rec=(await sql`SELECT recovery_id,code_hash FROM auth_recovery_codes WHERE user_id=${user.user_id} AND used_at IS NULL AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1`)[0];
      if(!rec||rec.code_hash!==sha256(code))return res.status(400).json({ok:false,error:'Reset code is invalid or expired'});
      await sql`UPDATE auth_recovery_codes SET used_at=NOW() WHERE recovery_id=${rec.recovery_id}`;
      await sql`UPDATE auth_users SET password_hash=${hashPassword(newPassword)},must_change_password=FALSE,updated_at=NOW() WHERE user_id=${user.user_id}`;
      await sql`DELETE FROM auth_sessions WHERE user_id=${user.user_id}`;
      return res.status(200).json({ok:true,message:'Password reset. Sign in again with your new password.'});
    }
    return res.status(400).json({ok:false,error:'Invalid recovery action'});
  }catch(e){console.error('account recovery failed',e);return res.status(500).json({ok:false,error:'Account recovery failed'});}
}
