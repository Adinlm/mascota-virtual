const CACHE_NAME = 'cybernexo-prisma-pwa-v19';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './styles/app.css',
  './src/main.js',
  './src/pwa.js',
  './src/assets/evolutionImages.js',
  './src/audio/soundscape.js',
  './src/config/evolutions.js',
  './src/game/PetScene.js',
  './src/state/store.js',
  './src/ui/dashboard.js',
  './src/ui/trainingSprite.js',
  './assets/evolutions/phase-1.webp',
  './assets/evolutions/phase-2.webp',
  './assets/evolutions/phase-3.webp',
  './assets/evolutions/phase-4.webp',
  './assets/evolutions/phase-5.webp',
  './assets/evolutions/phase-6.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
