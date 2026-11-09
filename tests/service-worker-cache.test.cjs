// Run: node tests/service-worker-cache.test.cjs
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8');
let handlers={},requests=0;
const store=new Map();
const cache={match:async req=>store.get(req.url),put:async(req,res)=>store.set(req.url,res)};
const context={URL,Date,Map,Promise,Response,
  fetch:async()=>{requests++;const response=new Response('mock',{status:200});Object.defineProperty(response,'type',{value:'basic'});return response;},
  caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{}},
  self:{location:{origin:'https://eleap.test'},addEventListener:(name,handler)=>handlers[name]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
vm.runInNewContext(code,context);
async function get(path,headers={}){
  const req={url:'https://eleap.test'+path,method:'GET',mode:'same-origin',credentials:'same-origin',headers:new Headers(headers)};
  let handled=null;const background=[];
  handlers.fetch({request:req,respondWith:promise=>handled=promise,waitUntil:promise=>background.push(promise)});
  if(!handled)return 'not-intercepted';
  const res=await handled;await Promise.all(background);return res.status;
}
(async()=>{
  assert.equal(await get('/media/images/forest.png'),200);
  assert.equal(await get('/media/images/forest.png'),200);
  assert.equal(requests,1,'cached unversioned asset should not be re-fetched immediately');
  assert.equal(await get('/media/audio/speech.mp3?v=123'),200);
  assert.equal(await get('/media/audio/speech.mp3?v=123'),200);
  assert.equal(requests,2,'versioned asset should remain cached');
  assert.equal(await get('/api/auth/me'),'not-intercepted');
  assert.equal(await get('/media-private/image.png'),'not-intercepted');
  assert.equal(await get('/media/images/image.png?token=secret'),'not-intercepted');
  assert.equal(await get('/media/images/image.png',{authorization:'Bearer test'}),'not-intercepted');
  console.log('PASS: SW cached media, versioned media, and private/API bypass');
})().catch(err=>{console.error(err);process.exitCode=1});
