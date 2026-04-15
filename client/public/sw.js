const CACHE_NAME = `Niyojan-v1`;

self.addEventListener('install', (event) => {
  // Don't pre-cache during install — avoids fetch errors in dev mode
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Vite HMR / dev server internals
  if (url.pathname.startsWith('/@') || url.pathname.includes('__vite')) return;

  // Skip API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Skip cross-origin requests (fonts, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      }).catch(() => cached); // Fallback to cache on network failure
    })
  );
});
