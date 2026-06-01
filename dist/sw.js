/**
 * Plan de Rodajes — Service Worker
 *
 * Strategies:
 *   App shell (HTML/JS/CSS)  → stale-while-revalidate
 *   API calls (/.netlify/)   → network-first, cache fallback
 *   External images (R2 etc) → cache-first
 */

const CACHE = 'pdr-v2'

// ── Helpers ────────────────────────────────────────────────────

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then(res => { if (res.ok) cache.put(request, res.clone()); return res })
    .catch(() => null)
  return cached ?? (await fresh) ?? new Response('', { status: 503 })
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
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

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch {
    return new Response('', { status: 503 })
  }
}

// ── Lifecycle ──────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

// ── Fetch interception ─────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

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

  // App shell + assets
  event.respondWith(staleWhileRevalidate(request))
})
