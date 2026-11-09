// Teacher-only preview utility; fixed Wikimedia Commons photo allowlist.
// Return only compact JPEG thumbnail bytes as base64 for self-contained offline packaging.
const names={
 polar:"Polar bear silently stepping from an ice floe.jpg",
 tiger:"Tiger walking through grass.jpg",
 orangutan:"Orangutan and infant Sumatra.jpg",
 snow:"Snow Leopard on Snowy Rocks (23966719139).jpg",
 koala:"Koala 2026.jpg",
 parrot:"Rhynchopsitta-pachyrhyncha.jpg",
 shark:"Tiger Shark Galeocerdo Cuvier (223179837).jpeg",
};
module.exports=async function handler(req,res){
 const key=String(req.query?.image||"");
 if(!Object.hasOwn(names,key))return res.status(404).json({error:"Unknown image"});
 const url="https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(names[key])+"?width=620";
 try{
 const r=await fetch(url,{headers:{"User-Agent":"ELEAP-Educational-Preview/1.0 (noncommercial classroom use)","Accept":"image/jpeg"}});
 if(!r.ok) return res.status(502).json({error:"Image response "+r.status});
 const bytes=Buffer.from(await r.arrayBuffer());
 if(bytes.length<1000||bytes.length>1200000)return res.status(502).json({error:"Invalid image size",bytes:bytes.length});
 res.setHeader("Cache-Control","private,max-age=600");
 return res.status(200).json({name:key,mime:r.headers.get("content-type"),bytes:bytes.length,data:bytes.toString("base64")});
 }catch(e){return res.status(500).json({error:String(e)})}
};