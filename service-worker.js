const CACHE='e-leap-r3b-rc2-v1';
const STATIC_RE=/\.(?:css|js|json|png|jpe?g|svg|webp|mp3|mp4|woff2?)$/i;
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
async function staleWhileRevalidate(req){const cache=await caches.open(CACHE);const hit=await cache.match(req);const fresh=fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r;}).catch(()=>null);return hit||await fresh||new Response('Unavailable',{status:503});}
async function networkWithFallback(req){const cache=await caches.open(CACHE);try{const r=await fetch(req);if(r&&r.ok)cache.put(req,r.clone());return r;}catch(_){return await cache.match(req)||new Response('Offline',{status:503});}}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;if(STATIC_RE.test(u.pathname)||u.pathname==='/media-map.json'){e.respondWith(staleWhileRevalidate(e.request));return;}e.respondWith(networkWithFallback(e.request));});
