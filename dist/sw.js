/**
 * Plan de Rodajes — Service Worker
 *
 * Strategies:
 *   Navigations (HTML)       → network-first  (asegura index.html fresco tras deploy)
 *   App assets (JS/CSS hash) → stale-while-revalidate (inmutables por hash)
 *   API calls (/.netlify/)   → network-first, cache fallback
 *   External images (R2 etc) → cache-first
 *
 * IMPORTANTE: las navegaciones van network-first a propósito. Si se cachea un
 * index.html viejo, referencia chunks con hashes que el deploy nuevo ya borró
 * → 404 → el redirect SPA devuelve HTML → error de MIME → pantalla en blanco.
 */

const CACHE = 'pdr-v3'

// Solo cacheamos GET http(s) del mismo origen. chrome-extension://, ws:, etc.
// rompen Cache.put ("Request scheme '...' is unsupported").
function isCacheable(request) {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  return url.protocol === 'http:' || url.protocol === 'https:'
}

async function safePut(cache, request, response) {
  try {
    if (response && response.ok) await cache.put(request, response.clone())
  } catch {
    /* opaque/no-store/scheme no soportado: ignorar */
  }
}

// ── Helpers ────────────────────────────────────────────────────

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then(res => { safePut(cache, request, res); return res })
    .catch(() => null)
  return cached ?? (await fresh) ?? new Response('', { status: 503 })
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    await safePut(cache, request, res)
    return res
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Navegaciones: red primero; si no hay red, caemos al index.html cacheado.
async function navigationHandler(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    // Cacheamos el shell bajo una clave estable, no bajo la URL con query.
    if (res.ok) await safePut(cache, '/index.html', res)
    return res
  } catch {
    const shell = (await cache.match('/index.html')) ?? (await cache.match('/'))
    if (shell) return shell
    return new Response('', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    await safePut(cache, request, res)
    return res
  } catch {
    return new Response('', { status: 503 })
  }
}

// ── Lifecycle ──────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Purgar caches de versiones anteriores (index.html + chunks viejos).
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

// ── Fetch interception ─────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event

  // Dejar pasar todo lo que no sea GET http(s) (chrome-extension, ws, POST…).
  if (!isCacheable(request)) return

  const url = new URL(request.url)

  // Navegaciones (HTML): siempre red primero → index.html fresco tras deploy.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(navigationHandler(request))
    return
  }

  // Netlify Functions (API data)
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // External images: R2, CloudFlare, YouTube thumbnails
  const host = url.hostname
  if (
    host !== self.location.hostname &&
    (host.includes('r2.dev') ||
     host.includes('cloudflarestorage.com') ||
     host.includes('img.youtube.com') ||
     request.destination === 'image')
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // App assets (JS/CSS con hash, inmutables)
  event.respondWith(staleWhileRevalidate(request))
})
