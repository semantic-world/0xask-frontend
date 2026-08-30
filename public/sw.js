/**
 * 0xAsk service worker.
 *
 * Written by hand rather than generated, because the caching rules here are
 * product decisions, not defaults. The governing rule is that the worker must
 * never be able to break a deployment or contradict the owner: anything it
 * cannot serve confidently it passes straight to the network.
 *
 * Bump VERSION whenever the caching behaviour changes. Old caches are removed
 * on activation.
 */

const VERSION = "v2";
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

/**
 * Paths the worker must never serve from cache.
 *
 * `/ask` is the important one. A cached answer is an answer built from
 * knowledge the owner may since have withdrawn, and a portfolio that keeps
 * saying something after being told to stop is the failure this whole system
 * exists to prevent.
 */
const NEVER_CACHE = ["/api/", "/admin", "/ask"];

const MAX_PAGE_ENTRIES = 40;

/**
 * How long a cached page may still be shown when there is no network.
 *
 * Bounded on purpose. A page cached indefinitely could keep a blocked project
 * readable on one device long after it was withdrawn. Seven days is short
 * enough to bound that and long enough for offline reading to be useful. When
 * an entry is older than this the offline page is served instead, which is a
 * worse experience and a more honest one.
 */
const MAX_PAGE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const CACHED_AT_HEADER = "x-cached-at";

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

  // The page can ask the worker to forget every cached page. Used when a
  // visitor signs out of nothing in particular but wants a clean slate, and
  // available as a recovery path if a cached page ever looks wrong.
  if (event.data === "clear-pages") {
    event.waitUntil(caches.delete(PAGE_CACHE));
  }
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

/** Stamp a response so its age can be judged later. */
async function withTimestamp(response) {
  const body = await response.clone().blob();
  const headers = new Headers(response.headers);
  headers.set(CACHED_AT_HEADER, String(Date.now()));
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isTooOld(response) {
  const stamp = Number(response.headers.get(CACHED_AT_HEADER));
  if (!stamp) return false;
  return Date.now() - stamp > MAX_PAGE_AGE_MS;
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

/**
 * Prefer fresh content, fall back to the last good copy, then to offline.
 *
 * Network first rather than stale while revalidate, deliberately. Serving a
 * cached page to an online visitor would mean a project the owner blocked
 * moments ago is still readable, and no caching benefit is worth that.
 */
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, await withTimestamp(response));
      trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES);
    }
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit && !isTooOld(hit)) return hit;

    if (hit) await cache.delete(request);

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
