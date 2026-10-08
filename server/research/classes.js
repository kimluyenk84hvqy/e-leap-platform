import { getResearchDb } from '../_research-db.js';
import { requireAuth,requireSameOrigin,teacherOwnsClass } from '../_auth.js';

async function ensureClassesSchema(sql){
  await sql`CREATE TABLE IF NOT EXISTS classes (
    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    class_name TEXT NOT NULL,
    course_id TEXT,
    academic_year TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS course_id TEXT`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year TEXT`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS status TEXT`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ`;
  await sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ`;
  await sql`UPDATE classes SET status='active' WHERE status IS NULL`;
  await sql`UPDATE classes SET created_at=NOW() WHERE created_at IS NULL`;
  await sql`UPDATE classes SET updated_at=NOW() WHERE updated_at IS NULL`;
}

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    const user=await requireAuth(req,res);
    if(!user)return;

    await ensureClassesSchema(sql);

    if(req.method==='GET'){
      let rows=[];
      if(user.role==='admin') rows=await sql`SELECT * FROM classes WHERE COALESCE(status,'active')<>'archived' ORDER BY COALESCE(created_at,NOW()) DESC`;
      else if(user.role==='teacher') rows=await sql`SELECT * FROM classes WHERE teacher_id=${user.user_id} AND COALESCE(status,'active')<>'archived' ORDER BY COALESCE(created_at,NOW()) DESC`;
      else rows=await sql`SELECT c.* FROM classes c JOIN auth_class_members m ON m.class_id::text=c.class_id::text WHERE m.student_user_id=${user.user_id} AND m.status='active' AND COALESCE(c.status,'active')<>'archived' ORDER BY COALESCE(c.created_at,NOW()) DESC`;
      return res.status(200).json({ok:true,classes:rows});
    }

    if(req.method==='POST'){
      if(!requireSameOrigin(req,res))return;
      if(!['teacher','admin'].includes(user.role))return res.status(403).json({ok:false,error:'Teacher or admin required'});
      const {className,courseId=null,academicYear=null}=req.body||{};
      if(!String(className||'').trim())return res.status(400).json({ok:false,error:'className is required'});
      const teacherId=user.role==='admin'&&req.body?.teacherId?req.body.teacherId:user.user_id;
      const rows=await sql`INSERT INTO classes(teacher_id,class_name,course_id,academic_year,status,created_at,updated_at) VALUES(${teacherId},${String(className).trim().slice(0,160)},${courseId},${academicYear},'active',NOW(),NOW()) RETURNING *`;
      return res.status(201).json({ok:true,class:rows[0]});
    }

    if(req.method==='PATCH'){
      if(!requireSameOrigin(req,res))return;
      const {classId,className,status}=req.body||{};
      if(!classId)return res.status(400).json({ok:false,error:'classId is required'});
      if(!await teacherOwnsClass(sql,user,classId))return res.status(403).json({ok:false,error:'Class access denied'});
      const rows=await sql`UPDATE classes SET class_name=COALESCE(${className?String(className).slice(0,160):null},class_name),status=COALESCE(${status||null},status),updated_at=NOW() WHERE class_id=${classId} RETURNING *`;
      return res.status(200).json({ok:true,class:rows[0]});
    }

    res.setHeader('Allow',['GET','POST','PATCH']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(e){
    console.error('classes failed',e);
    return res.status(500).json({ok:false,error:'Classes request failed',detail:process.env.NODE_ENV==='production'?undefined:String(e?.message||e)});
  }
}
