import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass } from '../_auth.js';

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res);
    if(!user)return;

    if(req.method==='GET'){
      let rows=[];
      if(user.role==='admin'){
        rows=await sql`SELECT * FROM classes ORDER BY created_at DESC`;
      }else if(user.role==='teacher'){
        rows=await sql`SELECT * FROM classes WHERE teacher_id::text=${String(user.user_id)} ORDER BY created_at DESC`;
      }else{
        rows=await sql`SELECT c.* FROM classes c JOIN auth_class_members m ON m.class_id::text=c.class_id::text WHERE m.student_user_id::text=${String(user.user_id)} AND m.status='active' ORDER BY c.created_at DESC`;
      }
      return res.status(200).json({ok:true,classes:rows.filter(r=>String(r.status||'active')!=='archived')});
    }

    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Teacher or admin required'});
      const {className,courseId=null,academicYear=null}=req.body||{};
      const cleanName=String(className||'').trim();
      if(!cleanName)return res.status(400).json({ok:false,error:'className is required'});
      const teacherId=user.role==='admin'&&req.body?.teacherId?req.body.teacherId:user.user_id;
      let rows;
      try{
        rows=await sql`INSERT INTO classes(teacher_id,class_name,course_id,academic_year,status,created_at,updated_at) VALUES(${String(teacherId)},${cleanName.slice(0,160)},${courseId},${academicYear},'active',NOW(),NOW()) RETURNING *`;
      }catch(firstError){
        try{
          rows=await sql`INSERT INTO classes(teacher_id,class_name,course_id,academic_year) VALUES(${String(teacherId)},${cleanName.slice(0,160)},${courseId},${academicYear}) RETURNING *`;
        }catch(secondError){
          throw secondError;
        }
      }
      return res.status(201).json({ok:true,class:rows[0]});
    }

    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      const {classId,className,status}=req.body||{};
      if(!classId)return res.status(400).json({ok:false,error:'classId is required'});
      if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      const rows=await sql`UPDATE classes SET class_name=COALESCE(${className?String(className).slice(0,160):null},class_name),status=COALESCE(${status||null},status),updated_at=NOW() WHERE class_id::text=${String(classId)} RETURNING *`;
      return res.status(200).json({ok:true,class:rows[0]});
    }

    res.setHeader('Allow',['GET','POST','PATCH']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){
    console.error('classes failed',e);
    return res.status(500).json({ok:false,error:'Classes request failed',detail:String(e?.message||e),code:e?.code||null});
  }
}
