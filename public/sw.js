// Service Worker for Sport Arbitrage
const CACHE_NAME = 'sport-arbitrage-cache-v1';

// Files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon-small.svg',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
