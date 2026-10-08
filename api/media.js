import { get } from '@vercel/blob';

const ALLOWED_PREFIXES=['objective-first-b2/','life-intermediate/'];
const safePath=(value)=>typeof value==='string'&&value.length<=500&&!value.includes('..')&&!value.includes('://')&&ALLOWED_PREFIXES.some(prefix=>value.startsWith(prefix));

export default async function handler(req,res){
  const pathname=String(req.query?.pathname||'').trim();
  if(!pathname)return res.status(400).send('Missing pathname');
  if(!safePath(pathname))return res.status(403).send('Forbidden');
  try{
    const result=await get(pathname,{access:'private'});
    if(!result)return res.status(404).send('Media not found');
    if(result.blob?.contentType)res.setHeader('Content-Type',result.blob.contentType);
    res.setHeader('Cache-Control','private, max-age=600, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options','nosniff');
    const reader=result.stream.getReader();
    while(true){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));}
    return res.end();
  }catch(error){
    console.error('Private Blob read failed:',error);
    return res.status(500).send('Media unavailable');
  }
}
