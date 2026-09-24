const CACHE='mcdl-v0-1';
const CORE=['./','./index.html','./styles.css','./src/app.js','./src/data/catalog.js','./src/data/objectives-b1-unit1.js','./src/services/progress.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
