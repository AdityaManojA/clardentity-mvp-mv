/* Service worker, present mainly so the app is installable.
 *
 * Chrome will not offer "install" without a service worker that handles
 * fetch, so this exists to satisfy that and to make a cold launch of the
 * installed app feel instant - not to make the app work offline. An AI
 * companion with no network is a text box that can't answer anything, and
 * caching answers would be actively wrong: every response here is scored
 * against sources that can change.
 *
 * So the strategy is deliberately narrow: cache the static build output,
 * never cache API traffic, and always go to the network for pages.
 */

// Bumping this name is how a deploy drops everything the last one cached:
// `activate` deletes every cache that isn't this one.
const CACHE = "clardentity-shell-v2";

// Only things that are content-addressed or genuinely static. HTML is not
// here on purpose - a stale shell is how a deployed fix fails to reach
// someone for a week.
const PRECACHE = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Anything that isn't a plain GET of our own origin is none of this
  // worker's business - and that deliberately includes every API call, the
  // SSE stream and the realtime session.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations always hit the network. Serving a cached document would pin
  // users to whichever build they first opened.
  if (request.mode === "navigate") return;

  const save = (response) => {
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  };

  // Next's build output is content-addressed: the filename changes whenever
  // the file does, so a hit is always the right file and cache-first is free.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request).then(save)));
    return;
  }

  // Everything else we serve - the design's icons, the app icons, the
  // manifest - keeps its name when its contents change, so cache-first would
  // pin someone to the version they first loaded and never let go. Serve the
  // cached copy for speed, then replace it in the background, so the change
  // lands on the next visit instead of never.
  event.respondWith(
    caches.match(request).then((hit) => {
      const fresh = fetch(request).then(save);
      return hit ?? fresh;
    }),
  );
});
