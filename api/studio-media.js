// Load the upload-only SDK only when authenticated private uploads are enabled.
// GET listing must remain available even if the optional client-upload bundle
// was omitted from a deployment's function trace.
import { get, head } from '@vercel/blob';
import { getResearchDb } from '../server/_research-db.js';
import { requireAuth, requireSameOrigin, getAuth } from '../server/_auth.js';

// Feature is OFF until private-store upload and callback are verified on Preview.
const enabled=()=>process.env.STUDIO_MEDIA_UPLOAD_ENABLED==='true' && process.env.STUDIO_MEDIA_PRIVATE_STORE_VERIFIED==='true';
const limits={
 'application/pdf':150e6,
 'application/vnd.openxmlformats-officedocument.presentationml.presentation':200e6,
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':40e6,
 'image/jpeg':15e6,'image/png':15e6,'image/webp':15e6,
 'audio/mpeg':200e6,'audio/wav':200e6,'audio/mp4':200e6,
 'video/mp4':200e6
};
const MAX_LIBRARY=3e9;
const err=(res,status,message)=>res.status(status).json({ok:false,error:message});
const hashOK=x=>/^[a-f0-9]{64}$/.test(String(x||''));
const nameOK=x=>typeof x==='string'&&x.length>0&&x.length<180&&!/[\/\\\u0000-\u001f]/.test(x);
async function ensureSchema(sql){
 await sql`CREATE TABLE IF NOT EXISTS studio_media_v1 (
 asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id TEXT NOT NULL,
 original_name TEXT NOT NULL,
 category TEXT NOT NULL,
 content_type TEXT NOT NULL,
 bytes BIGINT NOT NULL,
 client_sha256 TEXT NOT NULL,
 blob_path TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL DEFAULT 'active',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`;
 await sql`CREATE INDEX IF NOT EXISTS studio_media_v1_owner_idx ON studio_media_v1(owner_id,status,created_at DESC)`;
}
async function used(sql,owner){
 const rows=await sql`SELECT COALESCE(SUM(bytes),0)::bigint AS bytes FROM studio_media_v1 WHERE owner_id=${owner} AND status='active'`;
 return Number(rows[0]?.bytes||0);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
  if(req.method==='GET'&&req.query?.status==='1'){
   const user=await requireAuth(req,res,['teacher','admin']);if(!user)return;
   return res.json({ok:true,uploadEnabled:enabled(),privateStoreVerified:false});
  }
  if(req.method==='POST'&&req.body?.type){
   if(!enabled())return err(res,503,'Media upload is not enabled on this deployment.');
   // The Blob SDK verifies signed completion callbacks; do not trust arbitrary callbacks.
   const { handleUpload } = await import('@vercel/blob/client');
   const response=await handleUpload({
    body:req.body,request:req,
    onBeforeGenerateToken:async(pathname,clientPayload)=>{
     const origin=req.headers?.origin;
     const base=(req.headers?.['x-forwarded-proto']||'https')+'://'+(req.headers?.['x-forwarded-host']||req.headers?.host);
     if(origin && origin!==base)throw Error('Origin not allowed');
     const user=await getAuth(req);
     if(!user||!['teacher','admin'].includes(user.role))throw Error('Teacher/Admin login required');
     const meta=JSON.parse(clientPayload||'{}');
     const mime=String(meta.mime||''),bytes=Number(meta.bytes),name=meta.name;
     const category=String(meta.category||'temporary');
     if(!['textbook','audio','temporary','image','video'].includes(category))throw Error('Invalid category');
     if(!nameOK(name)||!hashOK(meta.sha256)||!limits[mime]||!Number.isSafeInteger(bytes)||bytes<1||bytes>limits[mime])throw Error('File not allowed');
     if(!/^studio-library\/[a-z0-9_-]{8,80}\/[a-z0-9._-]{5,130}$/.test(pathname))throw Error('Invalid storage path');
     const sql=getResearchDb();await ensureSchema(sql);
     const owner=String(user.user_id);
     const dup=await sql`SELECT asset_id FROM studio_media_v1 WHERE owner_id=${owner} AND client_sha256=${meta.sha256} AND bytes=${bytes} AND status='active' LIMIT 1`;
     if(dup.length)throw Error('This file is already in your library');
     if(await used(sql,owner)+bytes>MAX_LIBRARY)throw Error('Library quota reached');
     return {allowedContentTypes:[mime],maximumSizeInBytes:limits[mime],
       addRandomSuffix:true,allowOverwrite:false,
       tokenPayload:JSON.stringify({owner,category,name,mime,bytes,sha256:meta.sha256})};
    },
    onUploadCompleted:async({blob,tokenPayload})=>{
     const meta=JSON.parse(tokenPayload||'{}'),sql=getResearchDb();
     await ensureSchema(sql);
     const actual=await head(blob.url);
     if(actual.size!==meta.bytes||actual.contentType!==meta.mime)throw Error('Stored file metadata differs from approved upload');
     await sql`INSERT INTO studio_media_v1(owner_id,original_name,category,content_type,bytes,client_sha256,blob_path)
       VALUES(${meta.owner},${meta.name},${meta.category},${meta.mime},${actual.size},${meta.sha256},${blob.pathname})
       ON CONFLICT(blob_path) DO NOTHING`;
    }
   });
   return res.status(200).json(response);
  }
  const user=await requireAuth(req,res,['teacher','admin']);if(!user)return;
  const owner=String(user.user_id),sql=getResearchDb();await ensureSchema(sql);
  if(req.method==='GET'&&req.query?.open){
   const id=String(req.query.open);
   const rows=await sql`SELECT blob_path,content_type,original_name FROM studio_media_v1 WHERE asset_id::text=${id} AND owner_id=${owner} AND status='active' LIMIT 1`;
   if(!rows.length)return err(res,404,'File not found');
   const file=await get(rows[0].blob_path,{access:'private'});
   if(!file)return err(res,404,'File unavailable');
   res.setHeader('Content-Type',rows[0].content_type);
   res.setHeader('Content-Disposition','attachment');
   res.setHeader('X-Content-Type-Options','nosniff');
   const reader=file.stream.getReader();
   while(true){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));}
   return res.end();
  }
  if(req.method==='GET'){
   const files=await sql`SELECT asset_id,original_name,category,content_type,bytes,created_at,status
     FROM studio_media_v1 WHERE owner_id=${owner} AND status='active' ORDER BY created_at DESC LIMIT 250`;
   const bytes=await used(sql,owner);
   return res.json({ok:true,files,usage:{bytes,limit:MAX_LIBRARY,warning:bytes/MAX_LIBRARY>=0.8},uploadEnabled:enabled()});
  }
  if(req.method==='PATCH'){
   if(!requireSameOrigin(req,res))return;
   const id=String(req.body?.assetId||'');
   const rows=await sql`UPDATE studio_media_v1 SET status='archived' WHERE asset_id::text=${id} AND owner_id=${owner} AND status='active' RETURNING asset_id`;
   return rows.length?res.json({ok:true,note:'Archived only. Blob still occupies storage until a verified dependency-safe deletion is implemented.'}):err(res,404,'File not found');
  }
  res.setHeader('Allow','GET,POST,PATCH');
  return err(res,405,'Method not allowed');
 }catch(error){
  console.error('Studio media API failed',error);
  return err(res,400,'Upload or library operation failed');
 }
}
