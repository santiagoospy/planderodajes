const CACHE_NAME = 'planderodajes-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
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

  // No cachear solicitudes a las funciones serverless (siempre network)
  if (url.pathname.includes('/.netlify/functions/')) {
    return event.respondWith(
      fetch(request)
        .catch(() => new Response('Offline - no cached response available', { status: 503 }))
    );
  }

  // Para todo lo demás: network first, fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear respuestas GET exitosas
        if (request.method === 'GET' && response.status === 200) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        // Si falla, intenta caché
        return caches.match(request);
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Sincronización:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_AVAILABLE' });
        });
      })
    );
  }
});

console.log('[SW] Service Worker listo');
