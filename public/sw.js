// Minimal service worker: satisfies installability and caches the app shell.
// Video is deliberately NOT cached — episodes are large and range-requested.
const CACHE = "dopamine-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // never intercept media, API, or auth traffic
  if (
    url.origin !== self.location.origin ||
    /\.(mp4|mov|m3u8|webm)$/i.test(url.pathname) ||
    url.pathname.startsWith("/auth")
  ) return;

  // navigations: network first so new deploys land immediately
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((r) => r ?? Response.error())),
    );
    return;
  }

  // static assets: cache first
  event.respondWith(
    caches.match(request).then((hit) =>
      hit ??
      fetch(request).then((resp) => {
        if (resp.ok && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
        }
        return resp;
      }).catch(() => hit ?? Response.error()),
    ),
  );
});
