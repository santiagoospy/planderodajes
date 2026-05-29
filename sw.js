/* ───────────────────────────────────────────────────────────────
   Service Worker — planderodajes.com
   Estrategia anti-caché-viejo:
   • HTML / navegación → NETWORK-FIRST (siempre trae lo último si hay red,
     cae al caché solo si estás offline). Esto elimina el "no aparecen los cambios".
   • Otros recursos (JS/CSS/fuentes/imágenes) → STALE-WHILE-REVALIDATE
     (carga rápido del caché y actualiza en segundo plano).
   • Subí el número de versión cada vez que querés forzar limpieza de caché.
   ─────────────────────────────────────────────────────────────── */
const VERSION    = 'v3';                         // ← subí esto en cada deploy importante
const CACHE_NAME = 'pdr-' + VERSION;

// Instalar: activar de inmediato sin esperar.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activar: borrar cachés viejas y tomar control de las pestañas abiertas.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// El index.html pide saltar la espera → activamos la versión nueva ya.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigation(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                 // no cachear POST/PUT/etc.

  const url = new URL(req.url);

  // Nunca cachear las funciones de Netlify (datos en vivo).
  if (url.pathname.startsWith('/.netlify/')) return;

  // HTML / navegación → network-first.
  if (isNavigation(req)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match('/index.html') || Response.error();
      }
    })());
    return;
  }

  // Resto de recursos GET → stale-while-revalidate.
  event.respondWith((async () => {
    const cache  = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});

// Mantener el comportamiento de sync que usa la app.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll();
      clients.forEach(c => c.postMessage({ type: 'SYNC_AVAILABLE' }));
    })());
  }
});
