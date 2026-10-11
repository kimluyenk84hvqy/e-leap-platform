import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass,ensureResearchStaffUser } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=getResearchDb(); const user=await requireAuth(req,res); if(!user)return;
    if(req.method==='GET'){
      let rows=[];
      if(user.role==='admin') rows=await sql`SELECT * FROM classes WHERE status<>'archived' ORDER BY created_at DESC`;
      else if(user.role==='teacher'){
        let researchUserId=user.user_id;
        try{researchUserId=await ensureResearchStaffUser(sql,user)}catch(e){console.warn('legacy research-user bridge unavailable; using auth identity',e?.message||e)}
        rows=await sql`SELECT * FROM classes WHERE (teacher_id=${researchUserId} OR teacher_id=${user.user_id}) AND status<>'archived' ORDER BY created_at DESC`;
      } else rows=await sql`SELECT c.* FROM classes c JOIN auth_class_members m ON m.class_id::text=c.class_id::text WHERE m.student_user_id=${user.user_id} AND m.status='active' AND c.status<>'archived' ORDER BY c.created_at DESC`;
      return res.status(200).json({ok:true,classes:rows});
    }
    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return; if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Teacher or admin required'});
      const {className,courseId=null,academicYear=null}=req.body||{}; if(!String(className||'').trim())return res.status(400).json({ok:false,error:'className is required'});
      let teacherId=user.user_id;
      if(user.role==='teacher'){
        try{teacherId=await ensureResearchStaffUser(sql,user)}catch(e){console.warn('legacy research-user bridge unavailable; creating class with auth identity',e?.message||e)}
      }
      const rows=await sql`INSERT INTO classes(teacher_id,class_name,course_id,academic_year) VALUES(${teacherId},${String(className).trim().slice(0,160)},${courseId},${academicYear}) RETURNING *`;
      return res.status(201).json({ok:true,class:rows[0]});
    }
    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return; const {classId,className,status}=req.body||{}; if(!classId)return res.status(400).json({ok:false,error:'classId is required'});
      if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      const rows=await sql`UPDATE classes SET class_name=COALESCE(${className?String(className).slice(0,160):null},class_name),status=COALESCE(${status||null},status),updated_at=NOW() WHERE class_id=${classId} RETURNING *`;
      return res.status(200).json({ok:true,class:rows[0]});
    }
    res.setHeader('Allow',['GET','POST','PATCH']);return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){console.error('classes failed',e);return res.status(500).json({ok:false,error:'Classes request failed'});}
}
