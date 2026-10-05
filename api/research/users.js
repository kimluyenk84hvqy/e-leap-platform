// Compatibility guard for legacy Research Data v1 user route.
// Identity creation is no longer open. Use /api/auth/users (Admin only).
import { getResearchDb } from '../_research-db.js';
import { requireAuth } from '../_auth.js';
export default async function handler(req,res){
  try{
    const sql=getResearchDb(); const user=await requireAuth(req,res,['admin']); if(!user)return;
    if(req.method==='GET'){
      const rows=await sql`SELECT user_id,email,student_id,display_name,role,status,created_at FROM auth_users ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json({ok:true,users:rows});
    }
    return res.status(410).json({ok:false,error:'Legacy user creation is disabled. Use /api/auth/users as Admin.'});
  }catch(e){console.error('legacy research users guard failed',e);return res.status(500).json({ok:false,error:'User request failed'});}
}
