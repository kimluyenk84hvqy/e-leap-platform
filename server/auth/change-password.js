import { ensureAuthSchema,requireAuth,requireSameOrigin,hashPassword,verifyPassword,clearSessionCookie } from '../_auth.js';

const PIN_RE=/^\d{6}$/;

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow',['POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!requireSameOrigin(req,res))return;
  try{
    const sql=await ensureAuthSchema();
    const user=await requireAuth(req,res,['teacher','admin','student']); if(!user)return;
    const currentPassword=String(req.body?.currentPassword||'');
    const newPassword=String(req.body?.newPassword||'');
    if(user.role==='student'){
      if(!PIN_RE.test(newPassword))return res.status(400).json({ok:false,error:'New PIN must contain exactly 6 digits'});
    }else if(newPassword.length<10){
      return res.status(400).json({ok:false,error:'New password must be at least 10 characters'});
    }
    const rows=await sql`SELECT password_hash FROM auth_users WHERE user_id=${user.user_id} LIMIT 1`;
    if(!rows[0]?.password_hash||!verifyPassword(currentPassword,rows[0].password_hash))return res.status(401).json({ok:false,error:user.role==='student'?'Current PIN is incorrect':'Current password is incorrect'});
    if(verifyPassword(newPassword,rows[0].password_hash))return res.status(400).json({ok:false,error:user.role==='student'?'Choose a different PIN':'Choose a different password'});
    await sql`UPDATE auth_users SET password_hash=${hashPassword(newPassword)},must_change_password=FALSE,updated_at=NOW() WHERE user_id=${user.user_id}`;
    await sql`DELETE FROM auth_sessions WHERE user_id=${user.user_id}`;
    clearSessionCookie(res);
    return res.status(200).json({ok:true,reauthenticate:true});
  }catch(e){console.error('change password failed',e);return res.status(500).json({ok:false,error:'Password/PIN change failed'});}
}
