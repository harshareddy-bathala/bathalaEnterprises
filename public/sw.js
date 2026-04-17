const STATIC_CACHE = "bathala-static-v2";
const RUNTIME_CACHE = "bathala-runtime-v2";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  OFFLINE_URL,
  "/site.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Never intercept Next.js build/runtime assets to avoid stale module chunks.
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  const isLocalStaticAsset =
    url.origin === self.location.origin &&
    /\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/i.test(url.pathname);

  if (!isLocalStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      });
    })
  );
});
