// Naze AI service worker — static shell caching + an offline fallback
// page ONLY. It deliberately never touches /api/* responses: chat,
// memory, images, everything that needs Mistral or the database cannot
// work offline, and this service worker must never pretend otherwise
// (spec §30, "jangan mengatakan AI dapat digunakan offline jika
// sebenarnya masih bergantung pada API"). All this does is make repeat
// visits load instantly and show a real "you're offline" page instead
// of the browser's default network-error screen.

const CACHE_NAME = "naze-shell-v1";
const OFFLINE_URL = "/offline";
const SHELL_URLS = ["/", OFFLINE_URL, "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls or anything non-GET — those need a live
  // network/database and must fail honestly (the app's own ErrorNotice
  // components already handle that), not return a stale or fake response.
  if (url.pathname.startsWith("/api/")) return;
  if (request.method !== "GET") return;

  // Next.js build assets are content-hashed and immutable — safe to
  // cache-first for speed.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Page navigations: always prefer the network (so people see fresh
  // content when online) and only fall back to the offline page when the
  // network genuinely fails.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});
