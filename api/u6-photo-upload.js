// Preview-only, U6 p.41 original photograph intake. Never enables generic client upload.
// Exact image checksums are fixed to the teacher-verified original cropped PDF source.
import {createHash} from 'node:crypto';
import {getResearchDb} from '../server/_research-db.js';
import {requireAuth,requireSameOrigin} from '../server/_auth.js';
const STORE_ID='store_u4AgJ1AqUMRUMMz2';
const PHOTO={
 'Mavis Carver':{hash:'fd749a893ec2a46f7949c0490c93225bd72ca58276753e6abd4d01c326c2e7bb',width:190,height:143,webp:'3ded69976fd41af29d049559dc2a42ca4f2208cdd39a4544e85e3af970cf0074',path:'mavis-carver'},
 'Anita Green':{hash:'296e6ec023996e998b0a9e068264ae47e9b37e3c38577bfca48662253f5a9aa3',width:199,height:182,webp:'18e73ba40023e48ecb54d6fc929330121ad7dca31567528018a18a1582dd7fc1',path:'anita-green'},
 'Neil Johnson':{hash:'a4cb1aa5db2674cec7701b28106f202ed05b40bd78832865b3398f8a2be1ab69',width:158,height:187,webp:'f91c48ca04dc6dcaa937c91571ff35233bbb851d6ac4c6b0a5c97cf7004a632f',path:'neil-johnson'}
};
const ready=()=>process.env.VERCEL_ENV==='preview'&&
 process.env.STUDIO_U6_PRIVATE_UPLOAD_ENABLED==='true'&&
 process.env.BLOB_STORE_ID===STORE_ID;
const fail=(res,code,msg)=>res.status(code).json({ok:false,error:msg});
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(res,405,'Method not allowed');}
  const actor=await requireAuth(req,res,['teacher','admin']);if(!actor)return;
  if(!requireSameOrigin(req,res))return;
  if(!ready())return fail(res,503,'Original-photo upload is not enabled for this Preview');
  const person=String(req.body?.person||''),spec=PHOTO[person];
  const base64=req.body?.fileBase64;
  if(!spec||typeof base64!=='string'||base64.length>280000||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)||base64.length<100)
    return fail(res,400,'Choose one of the original page-41 photographs');
  const bytes=Buffer.from(base64,'base64');
  const digest=createHash('sha256').update(bytes).digest('hex');
  const authenticPng=digest===spec.hash&&bytes.subarray(0,8).equals(pngSignature)&&
    bytes.toString('ascii',12,16)==='IHDR'&&bytes.readUInt32BE(16)===spec.width&&
    bytes.readUInt32BE(20)===spec.height;
  // Q82 WebP derivative of the same source crop (visually compared against original);
  // fixed digest prevents arbitrary images, and the actual original PNG is also accepted.
  const approvedWebp=digest===spec.webp&&bytes.toString('ascii',0,4)==='RIFF'&&
    bytes.toString('ascii',8,12)==='WEBP';
  if(bytes.length<1000||bytes.length>190000||(!authenticPng&&!approvedWebp))
    return fail(res,422,'Image differs from the verified original page-41 crop');
  const mime=approvedWebp?'image/webp':'image/png';
  const ext=approvedWebp?'webp':'png';
  const sql=getResearchDb(),owner=String(actor.user_id);
  // Media table is created by the existing Media Library schema/GET route.
  const prior=await sql`SELECT asset_id,client_sha256 FROM studio_media_v1
    WHERE owner_id=${owner} AND client_sha256=${digest} AND status='active' LIMIT 1`;
  if(prior.length)return res.status(200).json({ok:true,person,assetId:prior[0].asset_id,sha256:digest,reused:true});
  const {put,head}=await import('@vercel/blob');
  const blob=await put('studio-library/u6-p41/'+spec.path+'.'+ext,bytes,{
    access:'private',contentType:mime,addRandomSuffix:true,allowOverwrite:false
  });
  // Check persisted object attributes before creating the Student-visible reference.
  const stored=await head(blob.url);
  if(stored.size!==bytes.length||stored.contentType!==mime)
    return fail(res,502,'Private image metadata verification failed');
  const rows=await sql`INSERT INTO studio_media_v1
    (owner_id,original_name,category,content_type,bytes,client_sha256,blob_path)
    VALUES(${owner},${spec.path+'.'+ext},'image',${mime},${bytes.length},${digest},${blob.pathname})
    RETURNING asset_id`;
  return res.status(201).json({ok:true,person,assetId:rows[0].asset_id,sha256:digest,reused:false});
 }catch(err){
  console.error('U6 original-photo private upload error',err);
  return fail(res,500,'Private original photo upload was not confirmed');
 }
}
