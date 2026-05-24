// Service Worker minimalista para planderodajes.com
// Solo cachea GET requests, no intenta cachear POST/PUT/DELETE

const CACHE_NAME = 'pdr-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Solo cachear GET
  if (request.method !== 'GET') {
    event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // No cachear funciones serverless
  if (request.url.includes('/.netlify/functions/')) {
    event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Network first, fallback to cache para todo lo demás
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear solo respuestas 200
        if (response.status === 200) {
          const cache = caches.open(CACHE_NAME);
          const responseClone = response.clone();
          cache.then((c) => c.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).catch(() => new Response('Offline', { status: 503 }));
      })
  );
});

console.log('[SW] Service Worker cargado');
