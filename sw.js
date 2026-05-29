/* ───────────────────────────────────────────────────────────────
   Service Worker — planderodajes.com
   Estrategia anti-caché-viejo:
   • HTML / navegación → NETWORK-FIRST (siempre trae lo último si hay red)
   • Recursos LOCALES (JS/CSS/fuentes) → STALE-WHILE-REVALIDATE
   • Recursos EXTERNOS (CDN, analytics) → pasar directo sin cachear
   • Netlify Functions → pasar directo sin cachear
   ─────────────────────────────────────────────────────────────── */
const VERSION    = 'v3';
const CACHE_NAME = 'pdr-' + VERSION;

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigation(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // ── Netlify Functions (datos vivos): pasar directo ──
  if (url.pathname.startsWith('/.netlify/')) return;

  // ── Recursos EXTERNOS (CDN, analytics, etc.): pasar directo ──
  // El SW no debe intentar cachear estos; dejar al navegador.
  if (url.origin !== self.location.origin) return;

  // ── Navegación / HTML: NETWORK-FIRST ──
  if (isNavigation(req)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match('/index.html') || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // ── Recursos locales GET: STALE-WHILE-REVALIDATE ──
  event.respondWith((async () => {
    const cache  = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    // Actualizar en segundo plano (no esperamos)
    const networkPromise = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    if (cached) return cached;
    // Sin caché: esperar la red
    const netRes = await networkPromise;
    return netRes || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  })());
});

// ── Background Sync ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll();
      clients.forEach(c => c.postMessage({ type: 'SYNC_AVAILABLE' }));
    })());
  }
});
