/**
 * 0xAsk service worker.
 *
 * Written by hand rather than generated, because the caching rules here are
 * product decisions, not defaults. The governing rule is that the worker must
 * never be able to break a deployment: anything it cannot serve confidently it
 * passes straight to the network.
 *
 * Bump VERSION whenever the caching behaviour changes. Old caches are removed
 * on activation.
 */

const VERSION = "v1";
const SHELL_CACHE = `0xask-shell-${VERSION}`;
const ASSET_CACHE = `0xask-assets-${VERSION}`;
const PAGE_CACHE = `0xask-pages-${VERSION}`;

const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

/** Paths the worker must never serve from cache. */
const NEVER_CACHE = [
  "/api/",
  "/admin",
  // Conversational answers are generated against live approved knowledge. A
  // stale answer is a wrong answer, so this experience is always network only.
  "/ask",
];

const MAX_PAGE_ENTRIES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // A precache miss must not prevent installation. The site still works.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, PAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => !keep.has(name)).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

function isNeverCached(pathname) {
  return NEVER_CACHE.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

/** Hashed build output never changes under the same URL, so cache wins. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Serve immediately, refresh in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  return hit ?? (await network) ?? Response.error();
}

/** Prefer fresh content, fall back to the last good copy, then to offline. */
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES);
    }
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;

    const shell = await caches.open(SHELL_CACHE);
    const offline = await shell.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Same origin only. Anything external is the browser's business.
  if (url.origin !== self.location.origin) return;

  if (isNeverCached(url.pathname)) return;

  // Next.js build output is content hashed and safe to cache indefinitely.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  if (/\.(?:png|jpg|jpeg|webp|avif|svg|gif|woff2?)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  }
});
