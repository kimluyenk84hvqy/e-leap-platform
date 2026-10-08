import { ensureAuthSchema,normalizeStudentId,validStudentId,hashPassword,verifyPassword,createSession,requireSameOrigin,requireAuth,teacherOwnsClass } from '../_auth.js';

const PIN_RE=/^\d{6}$/;
const safeName=v=>String(v||'').trim().replace(/\s+/g,' ').slice(0,120);

export default async function handler(req,res){
  try{
    const sql=await ensureAuthSchema();
    if(req.method==='GET'){
      const user=await requireAuth(req,res,['student']); if(!user)return;
      const memberships=await sql`
        SELECT m.class_id,m.status,m.joined_at,c.class_name,c.course_id,c.academic_year
        FROM auth_class_members m LEFT JOIN classes c ON c.class_id::text=m.class_id
        WHERE m.student_user_id=${user.user_id} AND m.status='active'
        ORDER BY m.joined_at DESC`;
      return res.status(200).json({ok:true,user,memberships});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      const studentId=normalizeStudentId(req.body?.studentId),pin=String(req.body?.pin||''),fullName=safeName(req.body?.fullName),classId=String(req.body?.classId||'').trim();
      if(!validStudentId(studentId))return res.status(400).json({ok:false,error:'Enter a valid Student ID.'});
      if(!PIN_RE.test(pin))return res.status(400).json({ok:false,error:'PIN must contain exactly 6 digits.'});
      const rows=await sql`SELECT user_id,student_id,display_name,role,status,password_hash FROM auth_users WHERE student_id=${studentId} LIMIT 1`;
      let user=rows[0],created=false;
      if(user){
        if(user.role!=='student'||user.status!=='active')return res.status(403).json({ok:false,error:'This Student ID cannot sign in.'});
        if(!user.password_hash)return res.status(409).json({ok:false,error:'PIN setup is required through a class join.',code:'PIN_SETUP_REQUIRED'});
        if(!verifyPassword(pin,user.password_hash))return res.status(401).json({ok:false,error:'Student ID or PIN is incorrect.'});
      }else{
        if(!classId)return res.status(404).json({ok:false,error:'Student account not found. Join your class once with its QR/Class Code to create it.',code:'JOIN_FIRST'});
        if(fullName.length<2)return res.status(400).json({ok:false,error:'Full name is required for first-time setup.'});
        const cls=await sql`SELECT class_id,class_name FROM classes WHERE class_id::text=${classId} AND status='active' LIMIT 1`;
        if(!cls.length)return res.status(404).json({ok:false,error:'Class not found or inactive.'});
        const inserted=await sql`INSERT INTO auth_users(student_id,display_name,role,password_hash) VALUES(${studentId},${fullName},'student',${hashPassword(pin)}) RETURNING user_id,student_id,display_name,role,status`;
        user=inserted[0]; created=true;
      }
      if(classId){
        await sql`INSERT INTO auth_class_members(class_id,student_user_id,status) VALUES(${classId},${user.user_id},'active') ON CONFLICT(class_id,student_user_id) DO UPDATE SET status='active'`;
      }
      await sql`DELETE FROM auth_sessions WHERE expires_at<=NOW()`;
      await createSession(res,user.user_id);
      return res.status(created?201:200).json({ok:true,created,user:{user_id:user.user_id,student_id:user.student_id,display_name:user.display_name,role:'student',status:user.status}});
    }
    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      const actor=await requireAuth(req,res,['teacher','admin']); if(!actor)return;
      const studentId=normalizeStudentId(req.body?.studentId),classId=String(req.body?.classId||'').trim();
      if(!studentId)return res.status(400).json({ok:false,error:'studentId is required'});
      const target=(await sql`SELECT user_id,student_id,display_name FROM auth_users WHERE student_id=${studentId} AND role='student' LIMIT 1`)[0];
      if(!target)return res.status(404).json({ok:false,error:'Student not found'});
      if(actor.role==='teacher'){
        if(!classId||!await teacherOwnsClass(sql,actor,classId))return res.status(403).json({ok:false,error:'Teacher may reset PIN only for students in an owned class.'});
        const member=await sql`SELECT 1 FROM auth_class_members WHERE class_id=${classId} AND student_user_id=${target.user_id} AND status='active' LIMIT 1`;
        if(!member.length)return res.status(403).json({ok:false,error:'Student is not active in this class.'});
      }
      await sql`UPDATE auth_users SET password_hash=NULL,updated_at=NOW() WHERE user_id=${target.user_id}`;
      await sql`DELETE FROM auth_sessions WHERE user_id=${target.user_id}`;
      return res.status(200).json({ok:true,student:{student_id:target.student_id,display_name:target.display_name},message:'PIN reset. Student must set a new 6-digit PIN through class join.'});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){console.error('student auth failed',e);if(String(e?.message||'').includes('duplicate key'))return res.status(409).json({ok:false,error:'Student ID already exists'});return res.status(500).json({ok:false,error:'Student access failed'});}
}
