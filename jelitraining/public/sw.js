const CACHE = "jelitraining-v1";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/", "/index.html"])));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin GET requests; skip Supabase API calls
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Hashed assets (cache-first — safe because filename changes on content change)
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // HTML and everything else (network-first, fallback to cache for offline)
  e.respondWith(
    fetch(request)
      .then(res => {
        caches.open(CACHE).then(c => c.put(request, res.clone()));
        return res;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match("/")))
  );
});
