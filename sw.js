const CACHE_NAME = 'cybernexo-prisma-pwa-v25';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './styles/app.css',
  './styles/training-phase1.css',
  './src/main.js',
  './src/pwa.js',
  './src/assets/evolutionImages.js',
  './src/assets/phase1TrainingFrames.js',
  './src/assets/phase2TrainingFrames.js',
  './src/assets/phase3TrainingFrames.js',
  './src/assets/phase4TrainingFrames.js',
  './src/assets/phase5TrainingFrames.js',
  './src/assets/phase6TrainingFrames.js',
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
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }

        return response;
      });
    })
  );
});
