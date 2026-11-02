// Offline support: the app shell is fetched fresh when online and served from the
// cache when offline. Everything else (scripts, fonts, the guitar sound) is cached
// the first time it is loaded.
const CACHE = 'fingerstyle-v3'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

// Hashed build files of this version (filled in by the build; undefined in development)
const ASSETS = self.__ASSETS__

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => pruneOldAssets())
      .then(() => self.clients.claim()),
  )
})

// Drop scripts and styles from earlier versions: their hashed names never come back
async function pruneOldAssets() {
  if (!Array.isArray(ASSETS)) return
  const keep = new Set(ASSETS.map((f) => new URL(f, self.registration.scope).href))
  const cache = await caches.open(CACHE)
  for (const req of await cache.keys()) {
    if (new URL(req.url).pathname.includes('/assets/') && !keep.has(req.url)) await cache.delete(req)
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html', { ignoreVary: true })),
    )
    return
  }

  event.respondWith(
    caches.match(req, { ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})

// The page sends the files it loaded before this worker was running, so they are
// available offline too.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-urls') return
  const urls = event.data.urls.filter((u) => new URL(u).origin === self.location.origin)
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        urls.map((u) =>
          c.match(u, { ignoreVary: true }).then((hit) => hit || fetch(u).then((res) => (res.ok ? c.put(u, res) : undefined)).catch(() => undefined)),
        ),
      ),
    ),
  )
})
