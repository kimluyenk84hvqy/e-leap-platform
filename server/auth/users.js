import { ensureAuthSchema,requireAuth,requireSameOrigin,normalizeEmail,normalizeStudentId,hashPassword } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=await ensureAuthSchema(); const actor=await requireAuth(req,res,['admin']); if(!actor)return;
    if(req.method==='GET'){
      const rows=await sql`SELECT user_id,email,student_id,display_name,role,status,must_change_password,created_at FROM auth_users ORDER BY created_at DESC LIMIT 500`;
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
      const password=String(req.body?.password||'');
      if(!userId||password.length<10)return res.status(400).json({ok:false,error:'userId and a temporary password of at least 10 characters are required'});
      const rows=await sql`UPDATE auth_users SET password_hash=${hashPassword(password)},must_change_password=TRUE,updated_at=NOW() WHERE user_id=${userId} AND role='teacher' RETURNING user_id,email,display_name,role,must_change_password`;
      if(!rows.length)return res.status(404).json({ok:false,error:'Teacher not found'});
      await sql`DELETE FROM auth_sessions WHERE user_id=${userId}`;
      return res.status(200).json({ok:true,user:rows[0]});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){console.error('auth users failed',e);if(String(e?.message||'').includes('duplicate key'))return res.status(409).json({ok:false,error:'Email or Student ID already exists'});return res.status(500).json({ok:false,error:'User management failed'});}
}
