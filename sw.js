const CACHE_NAME = "calendar-cache-v20251113-2210";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./script.js",
  "./manifest.json"
];

// Install and pre-cache files
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Network First strategy
self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      try {
        // First, try to get the resource from the network
        const networkResponse = await fetch(e.request);
        
        // Optional: Update the cache with the fresh response
        const cache = await caches.open(CACHE_NAME);
        cache.put(e.request, networkResponse.clone());
        
        return networkResponse;
      } catch (error) {
        // Network failed - try to serve from cache
        console.log('Network failed, serving from cache:', error);
        const cachedResponse = await caches.match(e.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache either, you might want to return a custom offline page
        return new Response('Network error and no cached version available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});
