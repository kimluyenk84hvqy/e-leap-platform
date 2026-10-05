import { ensureAuthSchema,hashPassword,normalizeEmail,createSession,requireSameOrigin } from '../_auth.js';
export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow',['POST']);return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!requireSameOrigin(req,res))return;
  try{
    const sql=await ensureAuthSchema();
    const count=await sql`SELECT COUNT(*)::int AS n FROM auth_users WHERE role='admin'`;
    if(Number(count[0]?.n||0)>0)return res.status(409).json({ok:false,error:'Admin already exists'});
    const expected=process.env.E_LEAP_ADMIN_BOOTSTRAP_KEY;
    if(!expected || String(req.body?.bootstrapKey||'')!==expected)return res.status(403).json({ok:false,error:'Invalid bootstrap key'});
    const email=normalizeEmail(req.body?.email),name=String(req.body?.displayName||'E-LEAP Admin').trim(),password=String(req.body?.password||'');
    if(password.length<10)return res.status(400).json({ok:false,error:'Password must be at least 10 characters'});
    if(!email.includes('@'))return res.status(400).json({ok:false,error:'Valid email is required'});
    const passwordHash=hashPassword(password);
    const rows=await sql`INSERT INTO auth_users(email,display_name,role,password_hash) VALUES(${email},${name},'admin',${passwordHash}) RETURNING user_id,email,display_name,role,status`;
    await createSession(res,rows[0].user_id);
    return res.status(201).json({ok:true,user:rows[0]});
  }catch(e){console.error('setup-admin failed',e);return res.status(500).json({ok:false,error:'Admin setup failed'});}
}
