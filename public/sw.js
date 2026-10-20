// Offline support. Bump VERSION to force every client to refresh its cache.
const VERSION = 'dod-v1'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION)
      await cache.addAll(SHELL)
      try {
        // Precache the hashed JS/CSS the built index.html points at, so the first offline visit works.
        const html = await (await fetch('./index.html', { cache: 'reload' })).text()
        const assets = [...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map((m) => m[1])
        await cache.addAll(assets)
      } catch (e) {
        /* offline caching is best effort */
      }
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // fonts etc. fall back to system fonts offline

  if (req.mode === 'navigate') {
    // pages: try the network first so deploys show up, fall back to the cached shell
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    )
    return
  }

  // everything else: serve the cached copy now, refresh it in the background
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req)
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => hit)
      return hit || refresh
    })
  )
})
