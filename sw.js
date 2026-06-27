const CACHE_NAME = 'cybernexo-prisma-pwa-v23';

const CORE_ASSETS = [
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

const TRAINING_ASSETS = [
  './assets/evolutions/training/phase-1-training-frame-1.webp',
  './assets/evolutions/training/phase-1-training-frame-2.webp',
  './assets/evolutions/training/phase-1-training-frame-3.webp',
  './assets/evolutions/training/phase-1-training-frame-4.webp',
  './assets/evolutions/training/phase-1-training-frame-5.webp',
  './assets/evolutions/training/phase-2-walk-frame-01.webp',
  './assets/evolutions/training/phase-2-walk-frame-02.webp',
  './assets/evolutions/training/phase-2-walk-frame-03.webp',
  './assets/evolutions/training/phase-2-walk-frame-04.webp',
  './assets/evolutions/training/phase-2-walk-frame-05.webp',
  './assets/evolutions/training/phase-2-walk-frame-06.webp',
  './assets/evolutions/training/phase-2-walk-frame-07.webp',
  './assets/evolutions/training/phase-2-walk-frame-08.webp',
  './assets/evolutions/training/phase-2-walk-frame-09.webp',
  './assets/evolutions/training/phase-2-walk-frame-10.webp',
  './assets/evolutions/training/phase-2-walk-frame-11.webp',
  './assets/evolutions/training/phase-2-walk-frame-12.webp',
  './assets/evolutions/training/phase-3-walk-frame-01.webp',
  './assets/evolutions/training/phase-3-walk-frame-02.webp',
  './assets/evolutions/training/phase-3-walk-frame-03.webp',
  './assets/evolutions/training/phase-3-walk-frame-04.webp',
  './assets/evolutions/training/phase-3-walk-frame-05.webp',
  './assets/evolutions/training/phase-3-walk-frame-06.webp',
  './assets/evolutions/training/phase-3-walk-frame-07.webp',
  './assets/evolutions/training/phase-3-walk-frame-08.webp',
  './assets/evolutions/training/phase-3-walk-frame-09.webp',
  './assets/evolutions/training/phase-3-walk-frame-10.webp',
  './assets/evolutions/training/phase-4-walk-frame-01.webp',
  './assets/evolutions/training/phase-4-walk-frame-02.webp',
  './assets/evolutions/training/phase-4-walk-frame-03.webp',
  './assets/evolutions/training/phase-4-walk-frame-04.webp',
  './assets/evolutions/training/phase-4-walk-frame-05.webp',
  './assets/evolutions/training/phase-4-walk-frame-06.webp',
  './assets/evolutions/training/phase-4-walk-frame-07.webp',
  './assets/evolutions/training/phase-4-walk-frame-08.webp',
  './assets/evolutions/training/phase-4-walk-frame-09.webp',
  './assets/evolutions/training/phase-4-walk-frame-10.webp',
  './assets/evolutions/training/phase-5-walk-frame-01.webp',
  './assets/evolutions/training/phase-5-walk-frame-02.webp',
  './assets/evolutions/training/phase-5-walk-frame-03.webp',
  './assets/evolutions/training/phase-5-walk-frame-04.webp',
  './assets/evolutions/training/phase-5-walk-frame-05.webp',
  './assets/evolutions/training/phase-5-walk-frame-06.webp',
  './assets/evolutions/training/phase-5-walk-frame-07.webp',
  './assets/evolutions/training/phase-5-walk-frame-08.webp',
  './assets/evolutions/training/phase-5-walk-frame-09.webp',
  './assets/evolutions/training/phase-5-walk-frame-10.webp',
  './assets/evolutions/training/phase-6-float-frame-01.webp',
  './assets/evolutions/training/phase-6-float-frame-02.webp',
  './assets/evolutions/training/phase-6-float-frame-03.webp',
  './assets/evolutions/training/phase-6-float-frame-04.webp',
  './assets/evolutions/training/phase-6-float-frame-05.webp',
  './assets/evolutions/training/phase-6-float-frame-06.webp',
  './assets/evolutions/training/phase-6-float-frame-07.webp',
  './assets/evolutions/training/phase-6-float-frame-08.webp',
  './assets/evolutions/training/phase-6-float-frame-09.webp',
  './assets/evolutions/training/phase-6-float-frame-10.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS)
        .then(() => Promise.allSettled(TRAINING_ASSETS.map((asset) => cache.add(asset)))))
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
