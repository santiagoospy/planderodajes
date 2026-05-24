const CACHE_NAME = 'planderodajes-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

// Instalar y cachear assets
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Algunos assets no se pudieron cachear:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear solicitudes a las funciones serverless
  if (url.pathname.includes('/.netlify/functions/')) {
    event.respondWith(
      fetch(request).catch(() => 
        new Response('Offline - no cached response available', { status: 503 })
      )
    );
    return;
  }

  // Para GET requests: network first
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si es 200, cachear
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para POST/PUT/DELETE: solo network
  event.respondWith(
    fetch(request).catch(() =>
      new Response('Offline - cannot process request', { status: 503 })
    )
  );
});

console.log('[SW] Service Worker listo');
