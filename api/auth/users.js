import { ensureAuthSchema,requireAuth,requireSameOrigin,normalizeEmail,normalizeStudentId,hashPassword } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=await ensureAuthSchema(); const actor=await requireAuth(req,res,['admin']); if(!actor)return;
    if(req.method==='GET'){
      const rows=await sql`SELECT user_id,email,student_id,display_name,role,status,created_at FROM auth_users ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json({ok:true,users:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const role=String(req.body?.role||'teacher'); if(!['admin','teacher','student'].includes(role))return res.status(400).json({ok:false,error:'Invalid role'});
      const name=String(req.body?.displayName||'').trim(); if(!name)return res.status(400).json({ok:false,error:'displayName is required'});
      const email=role==='student'?null:normalizeEmail(req.body?.email); const studentId=role==='student'?normalizeStudentId(req.body?.studentId):null;
      if(role!=='student'&&!email?.includes('@'))return res.status(400).json({ok:false,error:'Valid email is required'});
      if(role==='student'&&!studentId)return res.status(400).json({ok:false,error:'studentId is required'});
      const rawPassword=String(req.body?.password||''); if(role!=='student'&&rawPassword.length<10)return res.status(400).json({ok:false,error:'Password must be at least 10 characters'});
      const passwordHash=role==='student'?null:hashPassword(rawPassword);
      const rows=await sql`INSERT INTO auth_users(email,student_id,display_name,role,password_hash) VALUES(${email},${studentId},${name},${role},${passwordHash}) RETURNING user_id,email,student_id,display_name,role,status`;
      return res.status(201).json({ok:true,user:rows[0]});
    }
    res.setHeader('Allow',['GET','POST']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){console.error('auth users failed',e);if(String(e?.message||'').includes('duplicate key'))return res.status(409).json({ok:false,error:'Email or Student ID already exists'});return res.status(500).json({ok:false,error:'User management failed'});}
}
