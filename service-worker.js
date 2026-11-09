/* E-LEAP cache policy: cache media efficiently, never cache private/API responses. */
const CACHE_PREFIX='e-leap-clean-v1-2';
const CACHE=CACHE_PREFIX+'runtime-v20261109-media-ttl-v1';
const MEDIA_RE=/\.(?:png|jpe?g|svg|webp|gif|mp3|m4a|wav|ogg|mp4|webm|woff2?)$/i;
const IMMUTABLE_RE=/(?:[._-][a-f0-9]{12,})(?:\.[^.]+)$/i;
const MEDIA_RECHECK_MS=15*60*1000;
const recheckedAt=new Map();
const pendingMedia=new Map();
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))
])));
const isPrivate=(req,url)=>req.headers.has('authorization')||
  /^(?:\/api\/|\/media-private\/|\/private\/|\/auth\/|\/student-access)/i.test(url.pathname)||
  /(?:token|signature|sig|key|secret|expires|x-amz-|x-goog-)/i.test(url.search);
async function networkFirst(req){
  const cache=await caches.open(CACHE);
  try{const response=await fetch(req,{cache:'no-cache'});
    if(response.ok&&response.type==='basic'&&!response.headers.has('set-cookie'))await cache.put(req,response.clone());
    return response;
  }catch(_){return (await cache.match(req))||new Response('Offline',{status:503});}
}
async function mediaCache(req,url,event){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(req);
  const key=url.href;
  const immutable=url.searchParams.has('v')||url.searchParams.has('version')||IMMUTABLE_RE.test(url.pathname);
  if(cached){
    if(!immutable && Date.now()-(recheckedAt.get(key)||0)>=MEDIA_RECHECK_MS){
      recheckedAt.set(key,Date.now());
      let pending=pendingMedia.get(key);
      if(!pending){
        pending=fetch(req).then(async response=>{
          if(response.ok&&response.type==='basic'&&!response.headers.has('set-cookie'))await cache.put(req,response.clone());
        }).catch(()=>{}).finally(()=>pendingMedia.delete(key));
        pendingMedia.set(key,pending);
      }
      event.waitUntil(pending);
    }
    return cached;
  }
  try{const response=await fetch(req);
    if(response.ok&&response.type==='basic'&&!response.headers.has('set-cookie'))await cache.put(req,response.clone());
    recheckedAt.set(key,Date.now());
    return response;
  }catch(_){return new Response('Unavailable',{status:503});}
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||req.mode==='navigate'&&req.credentials==='include')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||isPrivate(req,url))return;
  if(MEDIA_RE.test(url.pathname)){event.respondWith(mediaCache(req,url,event));return;}
  // Keep code / HTML / JSON fresh while retaining an offline fallback for public assets.
  event.respondWith(networkFirst(req));
});
