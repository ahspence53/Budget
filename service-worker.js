// Basic service worker for offline caching of app shell

const CACHE_NAME = 'budgie-cache-v29';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// Install: cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, network fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request);
    })
  );
});
