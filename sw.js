const CACHE='serafidraco-dmg-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./stage_1.b64','./stage_2.b64','./stage_3.b64','./stage_4.b64','./stage_5.b64','./stage_6.b64','./stage_7.b64','./stage_8.b64'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
