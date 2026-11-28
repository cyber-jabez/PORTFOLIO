/* ==========================================================================
   Jabez Gabrielraj Portfolio - Service Worker (Offline Resilience & PWA)
   ========================================================================== */

const CACHE_NAME = 'jgr-offline-v4.3';

const OFFLINE_URL = 'offline.html';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles.css?v=4.3',
  './main.js?v=4.3',
  './grainient.js',
  './blurText.js',
  './theme.js',
  './cursor-pointer.svg',
  './favicon.ico',
  './favicon.png',
  './favicon-48x48.png',
  './apple-touch-icon.png',
  './site.webmanifest'
];

// Install: Pre-cache core shell & offline fallback page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Prune outdated caches and immediately claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Purging legacy cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Serve from network with offline fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only intercept GET requests
  if (req.method !== 'GET') return;

  // Navigation requests (HTML documents)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        // When network fails while navigating, return the offline fallback page
        return caches.match(OFFLINE_URL)
          .then((res) => res || caches.match('./' + OFFLINE_URL))
          .then((res) => res || caches.match('/PORTFOLIO/' + OFFLINE_URL));
      })
    );
    return;
  }

  // Static assets (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to keep cache fresh (stale-while-revalidate)
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse.clone()));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Not in cache: fetch from network and cache successful response
      return fetch(req)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting an image or font, fail gracefully
          return null;
        });
    })
  );
});
