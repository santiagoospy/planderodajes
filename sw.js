const CACHE_NAME = 'planderodajes-v1';

// Instalar
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activar
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Para funciones serverless, solo network
  if (request.url.includes('/.netlify/functions/')) {
    event.respondWith(
      fetch(request).catch(() => 
        new Response('Offline', { status: 503 })
      )
    );
    return;
  }

  // Para todo lo demás
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 && request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});
