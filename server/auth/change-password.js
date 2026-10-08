import { ensureAuthSchema,requireAuth,requireSameOrigin,hashPassword,verifyPassword } from '../_auth.js';

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow',['POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!requireSameOrigin(req,res))return;
  try{
    const sql=await ensureAuthSchema();
    const user=await requireAuth(req,res,['teacher','admin']); if(!user)return;
    const currentPassword=String(req.body?.currentPassword||'');
    const newPassword=String(req.body?.newPassword||'');
    if(newPassword.length<10)return res.status(400).json({ok:false,error:'New password must be at least 10 characters'});
    const rows=await sql`SELECT password_hash FROM auth_users WHERE user_id=${user.user_id} LIMIT 1`;
    if(!rows[0]?.password_hash||!verifyPassword(currentPassword,rows[0].password_hash))return res.status(401).json({ok:false,error:'Current password is incorrect'});
    if(verifyPassword(newPassword,rows[0].password_hash))return res.status(400).json({ok:false,error:'Choose a different password'});
    await sql`UPDATE auth_users SET password_hash=${hashPassword(newPassword)},must_change_password=FALSE,updated_at=NOW() WHERE user_id=${user.user_id}`;
    return res.status(200).json({ok:true});
  }catch(e){console.error('change password failed',e);return res.status(500).json({ok:false,error:'Password change failed'});}
}
