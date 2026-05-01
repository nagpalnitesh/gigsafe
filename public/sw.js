/**
 * GigSafe Service Worker
 * Provides offline caching for static assets and API responses.
 */

const CACHE_NAME = "gigsafe-v1";
const STATIC_ASSETS = [
  "/",
  "/gigs",
  "/create",
  "/dashboard",
  "/profile",
  "/faucet",
  "/favicon-32x32.png",
  "/android-chrome-192x192.png",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Skip non-GET and API requests
  if (request.method !== "GET" || request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Serve from cache if network fails
        return caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 }));
      })
  );
});
