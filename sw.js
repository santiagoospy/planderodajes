// Service Worker para planderodajes.com
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
  const url = new URL(request.url);

  // NO cachear: chrome-extension, blob, data
  if (url.protocol === 'chrome-extension:' || url.protocol === 'blob:' || url.protocol === 'data:') {
    return;
  }

  // NO cachear: POST, PUT, DELETE, PATCH
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // NO cachear funciones serverless
  if (url.pathname.includes('/.netlify/functions/')) {
    event.respondWith(
      fetch(request).catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Network first para todo lo demás
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Solo cachear respuestas 200 válidas
        if (response && response.status === 200 && response.type !== 'error') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch(() => {
              // Ignorar errores de caché
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla, intentar caché
        return caches.match(request).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

console.log('[SW] Service Worker listo');
