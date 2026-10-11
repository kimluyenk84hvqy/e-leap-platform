import { getResearchDb } from '../_research-db.js';
import { getAuth,requireAuth,requireSameOrigin } from '../_auth.js';

async function ensureShellStore(sql){
  await sql`CREATE TABLE IF NOT EXISTS platform_shell_state (
    scope TEXT PRIMARY KEY,
    shells JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function validateShells(value){
  if(!Array.isArray(value))throw new Error('shells must be an array');
  if(value.length>5000)throw new Error('Too many shells');
  const seen=new Set();
  const clean=value.map((raw,i)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`Invalid shell at ${i}`);
    const x=JSON.parse(JSON.stringify(raw));
    x.id=String(x.id||'').trim();
    if(!x.id||x.id.length>180)throw new Error(`Invalid shell id at ${i}`);
    if(seen.has(x.id))throw new Error(`Duplicate shell id: ${x.id}`);
    seen.add(x.id);
    x.parentId=x.parentId==null?null:String(x.parentId).slice(0,180);
    x.name=String(x.name||'').slice(0,240);
    x.type=String(x.type||'module').slice(0,80);
    x.status=String(x.status||'draft').slice(0,40);
    return x;
  });
  const bytes=Buffer.byteLength(JSON.stringify(clean),'utf8');
  if(bytes>2_000_000)throw new Error('Shell catalog is too large');
  return clean;
}

export default async function handler(req,res){
  try{
    const sql=getResearchDb();
    await ensureShellStore(sql);
    if(req.method==='GET'){
      const user=await getAuth(req).catch(()=>null);
      const rows=await sql`SELECT shells,updated_at FROM platform_shell_state WHERE scope='global' LIMIT 1`;
      const all=Array.isArray(rows[0]?.shells)?rows[0].shells:[];
      const shells=user?.role==='admin' ? all : all.filter(x=>['published','approved'].includes(String(x?.status||'').toLowerCase()) || x?.custom!==true);
      return res.status(200).json({ok:true,shells,updatedAt:rows[0]?.updated_at||null,scope:user?.role||'guest'});
    }
    if(req.method==='PUT'){
      if(!requireSameOrigin(req,res))return;
      const user=await requireAuth(req,res,['admin']); if(!user)return;
      let shells;
      try{shells=validateShells(req.body?.shells);}catch(e){return res.status(400).json({ok:false,error:e.message});}
      const rows=await sql`INSERT INTO platform_shell_state(scope,shells,updated_by,updated_at)
        VALUES('global',${shells},${user.user_id},NOW())
        ON CONFLICT(scope) DO UPDATE SET shells=EXCLUDED.shells,updated_by=EXCLUDED.updated_by,updated_at=NOW()
        RETURNING updated_at`;
      return res.status(200).json({ok:true,count:shells.length,updatedAt:rows[0]?.updated_at||null});
    }
    res.setHeader('Allow',['GET','PUT']);
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(error){
    console.error('shell persistence failed',error);
    return res.status(500).json({ok:false,error:'Shell persistence request failed'});
  }
}
