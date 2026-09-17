/* Fanaye PWA service worker — static assets + offline shell */
const CACHE_VERSION = "fanaye-pwa-v1";
const PRECACHE = [
    "/en",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/apple-touch-icon.png",
    "/media/logos/logo_07_golden_cloche.svg",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_VERSION)
                        .map(key => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", event => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Never cache API / auth / sockets
    if (
        url.pathname.includes("/backend/") ||
        url.pathname.includes("/api/") ||
        url.pathname.includes("socket")
    ) {
        return;
    }

    // Network-first for navigations (fresh app shell when online)
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    void caches.open(CACHE_VERSION).then(cache => {
                        void cache.put(request, copy);
                    });
                    return response;
                })
                .catch(() =>
                    caches
                        .match(request)
                        .then(cached => cached || caches.match("/en")),
                ),
        );
        return;
    }

    // Cache-first for static assets
    if (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/media/") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".webp")
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const copy = response.clone();
                    void caches.open(CACHE_VERSION).then(cache => {
                        void cache.put(request, copy);
                    });
                    return response;
                });
            }),
        );
    }
});
