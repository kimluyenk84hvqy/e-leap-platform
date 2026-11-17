import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../api/u6-photo-upload.js',import.meta.url),'utf8');
const html=await fs.readFile(new URL('../reading-jigsaw.html',import.meta.url),'utf8');
const SHA=['fd749a893ec2a46f7949c0490c93225bd72ca58276753e6abd4d01c326c2e7bb',
 '296e6ec023996e998b0a9e068264ae47e9b37e3c38577bfca48662253f5a9aa3',
 'a4cb1aa5db2674cec7701b28106f202ed05b40bd78832865b3398f8a2be1ab69'];
test('Only Preview, exact private store and dedicated U6 flag can upload genuine photographs',()=>{
 assert.match(source,/process\.env\.VERCEL_ENV==='preview'/);
 assert.match(source,/process\.env\.STUDIO_U6_PRIVATE_UPLOAD_ENABLED==='true'/);
 assert.match(source,/process\.env\.BLOB_STORE_ID===STORE_ID/);
 assert.match(source,/store_u4AgJ1AqUMRUMMz2/);
 assert.match(source,/requireAuth\(req,res,\['teacher','admin'\]\)/);
 assert.match(source,/requireSameOrigin\(req,res\)/);
 assert.match(source,/access:'private'/);
 assert.match(source,/contentType:'image\/png'/);
 assert.match(source,/addRandomSuffix:true/);
 assert.match(source,/head\(blob\.url\)/);
 for(const hash of SHA)assert.ok(source.includes(hash),'Missing authentic source SHA '+hash);
 assert.match(source,/bytes\.readUInt32BE\(16\)/);
 assert.match(source,/createHash\('sha256'\)/);
 assert.doesNotMatch(source,/access:'public'/);
});
test('Teacher U6 can upload 3 real images into private Media Library with returned IDs, but no silent verification',()=>{
 assert.match(html,/Upload 3 original photographs/);
 assert.match(html,/api\('\/api\/u6-photo-upload'/);
 assert.match(html,/result\.assetId/);
 assert.match(html,/Save the source draft and review the textbook before confirming/);
 assert.match(html,/confirmSourceText:true,confirmOriginalPhotos:true/);
});
test('Server rejects unauthenticated, unsupported user roles and absent private Preview config',async()=>{
 const ctx=vm.createContext({console,Buffer,process:{env:{VERCEL_ENV:'production',BLOB_STORE_ID:'store_u4AgJ1AqUMRUMMz2',STUDIO_U6_PRIVATE_UPLOAD_ENABLED:'true'}}});
 const main=new vm.SourceTextModule(source,{context:ctx});
 const libs={
  'node:crypto':{createHash:()=>{throw Error('No hashing expected in negative auth test')}},
  '../server/_research-db.js':{getResearchDb:()=>{throw Error('No database read expected')}},
  '../server/_auth.js':{
   requireAuth:async(req,res)=>{if(!req.actor){res.status(401).json({ok:false});return null;}return req.actor.role==='student'?(res.status(403).json({ok:false}),null):req.actor;},
   requireSameOrigin:()=>true
  }
 };
 const cached=new Map();
 await main.link(name=>{
  if(!libs[name])throw Error('Unexpected module '+name);
  if(!cached.has(name))cached.set(name,new vm.SyntheticModule(Object.keys(libs[name]),function(){
   for(const [key,value]of Object.entries(libs[name]))this.setExport(key,value);
  },{context:ctx,identifier:name}));
  return cached.get(name);
 });
 await main.evaluate();
 async function call(actor){let result={status:200};const res={setHeader(){return this;},status(n){result.status=n;return this;},json(x){result.body=x;return this;}};
  await main.namespace.default({method:'POST',body:{},actor},res);return result;
 }
 assert.equal((await call(null)).status,401);
 assert.equal((await call({role:'student'})).status,403);
 assert.equal((await call({role:'teacher'})).status,503);
});

test('Server only stores private, SHA-verified image for authenticated Teacher on Preview (synthetic bytes)',async()=>{
 const {createHash}=await import('node:crypto');
 const png=Buffer.alloc(1800);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(png,0);
 png.write('IHDR',12,'ascii');png.writeUInt32BE(190,16);png.writeUInt32BE(143,20);
 const digest=createHash('sha256').update(png).digest('hex');
 const modified=source.replace(SHA[0],digest);
 assert.notEqual(source,modified);
 const uploads=[],sqlEvents=[];
 const sql=async(strings,...args)=>{
  const q=strings.join('?').replace(/\\s+/g,' ');
  sqlEvents.push(q);
  if(q.includes('SELECT asset_id,client_sha256 FROM studio_media_v1'))return [];
  if(q.includes('INSERT INTO studio_media_v1'))return [{asset_id:'20000000-0000-4000-8000-000000000001'}];
  throw Error('Unsupported SQL: '+q);
 };
 const ctx=vm.createContext({console,Buffer,process:{env:{
  VERCEL_ENV:'preview',STUDIO_U6_PRIVATE_UPLOAD_ENABLED:'true',BLOB_STORE_ID:'store_u4AgJ1AqUMRUMMz2'
 }}});
 const libs={
  'node:crypto':{createHash},
  '../server/_research-db.js':{getResearchDb:()=>sql},
  '../server/_auth.js':{
   requireAuth:async(req,res)=>req.actor,
   requireSameOrigin:()=>true
  },
  '@vercel/blob':{
   put:async(path,buffer,options)=>{
    uploads.push({path,bytes:buffer.length,options});
    return {pathname:path+'-qa-random',url:'https://synthetic.invalid/u6'};
   },
   head:async()=>({size:png.length,contentType:'image/png'})
  }
 };
 const linked=new Map();
 const resolve=async name=>{
  if(!libs[name])throw Error('unexpected import '+name);
  if(!linked.has(name))linked.set(name,new vm.SyntheticModule(Object.keys(libs[name]),function(){
   for(const [key,value]of Object.entries(libs[name]))this.setExport(key,value);
  },{context:ctx,identifier:name}));
  return linked.get(name);
 };
 const module=new vm.SourceTextModule(modified,{context:ctx,importModuleDynamically:async name=>{
  const m=await resolve(name);
  if(m.status==='unlinked')await m.link(resolve);
  if(m.status==='linked')await m.evaluate();
  return m;
 }});
 await module.link(resolve);await module.evaluate();
 const result={status:200,body:null};
 const res={setHeader(){return this;},status(n){result.status=n;return this;},json(body){result.body=JSON.parse(JSON.stringify(body));return this;}};
 await module.namespace.default({method:'POST',actor:{role:'teacher',user_id:'10000000-0000-4000-8000-000000000004'},
  body:{person:'Mavis Carver',fileBase64:png.toString('base64')},headers:{}},res);
 assert.equal(result.status,201,JSON.stringify(result.body));
 assert.equal(result.body.assetId,'20000000-0000-4000-8000-000000000001');
 assert.equal(uploads.length,1);
 assert.equal(uploads[0].options.access,'private');
 assert.equal(uploads[0].bytes,png.length);
 assert.equal(sqlEvents.some(q=>q.includes('INSERT INTO studio_media_v1')),true);
});
