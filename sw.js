const CACHE_NAME = 'planderodajes-v1';
const API_ROUTES = [
  '/.netlify/functions/',
];

// Instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  self.clients.claim();
});

// Fetch - manejo cuidadoso sin crashear
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Requests a Netlify functions: pasar directo a red ────────
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(err => {
          console.warn('[SW] Fetch error:', request.url, err.message);
          // No retornar error — dejar que el navegador maneje
          return new Response(
            JSON.stringify({ error: 'Network error', message: err.message }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // ── Requests a recursos externos (Cloudflare, etc): ignorar ────
  if (!url.origin.includes(self.location.origin)) {
    return; // Dejar que el navegador lo maneje normalmente
  }

  // ── Recursos locales (HTML, CSS, JS): cache-first ────────────
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const respToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, respToCache));
          }
          return response;
        })
        .catch(err => {
          console.warn('[SW] Fallback to cached or offline:', request.url);
          // Si offline y no hay cache, retornar página offline
          return caches.match('/offline.html')
            .then(r => r || new Response('Offline', { status: 503 }));
        });
    })
  );
});

// ── Background Sync ────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    // En el futuro: sincronizar datos pendientes con el servidor
    event.waitUntil(Promise.resolve());
  }
});

// ── Messages desde el cliente ────────────────────────────────
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded at', new Date().toISOString());
