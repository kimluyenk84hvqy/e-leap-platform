const CACHE_PREFIX='e-leap-clean-v1-2';
const CACHE=CACHE_PREFIX+'runtime-v20261005-clean-v1.2';
const MEDIA_RE=/\.(?:png|jpe?g|svg|webp|gif|mp3|m4a|wav|ogg|mp4|webm|woff2?)$/i;
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k))))
])));
async function networkFirst(req){const cache=await caches.open(CACHE);try{const r=await fetch(req,{cache:'no-store'});if(r&&r.ok)await cache.put(req,r.clone());return r;}catch(_){return await cache.match(req)||new Response('Offline',{status:503});}}
async function mediaCache(req){const cache=await caches.open(CACHE);const hit=await cache.match(req);const fresh=fetch(req).then(async r=>{if(r&&r.ok)await cache.put(req,r.clone());return r;}).catch(()=>null);return hit||await fresh||new Response('Unavailable',{status:503});}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  // Code, JSON and HTML are network-first to prevent mixed-version Preview deployments.
  if(MEDIA_RE.test(u.pathname)){e.respondWith(mediaCache(e.request));return;}
  e.respondWith(networkFirst(e.request));
});
