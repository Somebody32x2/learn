/**
 * Service worker for the hub. Its scope is the hub's folder, so it also covers every subject below it
 * (dsa/, physics2/, ...): installing the hub installs every subject, and any page you have opened works
 * offline afterwards.
 *
 * Same-origin requests are network-first (nothing has hashed file names, so the network is the source of
 * truth) with the cache as the offline fallback. Google Fonts are stale-while-revalidate.
 * Bump VERSION when the shell list changes; old caches are dropped on activate.
 */
const VERSION = 'v1';
const CACHE = `learn-${VERSION}`;
const FONTS = 'learn-fonts';
// Caches this worker may delete: its own old versions. Other apps on the same origin keep theirs.
const OWN = /^(learn|education)-/;
const SHELL = [
  './',
  'styles.css',
  'main.js',
  'subjects.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];
// A slow network (not just no network) falls back to the cache after this long, if there is a cached copy.
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => OWN.test(k) && k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }
  // Only our own path: leave the rest of the origin (and other origins) alone.
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  event.respondWith(networkFirst(request, event));
});

async function networkFirst(request, event) {
  const cache = await caches.open(CACHE);
  const network = fetch(request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(cache.put(request, copy));
    }
    return response;
  });
  network.catch(() => {}); // a failure after the cache has already answered is not an error

  const cached = () => cache.match(request, { ignoreSearch: request.mode === 'navigate' });
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    // Whichever comes first: the network, or (after the timeout) a cached copy if there is one.
    return await Promise.race([network, timeout.then(cached).then((hit) => hit ?? network)]);
  } catch {
    const hit = await cached();
    if (hit) return hit;
    if (request.mode === 'navigate') return offlinePage();
    return Response.error();
  }
}

async function staleWhileRevalidate(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit ?? Response.error());
  return hit ?? network;
}

function offlinePage() {
  const home = new URL('./', self.registration.scope).href;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>Offline</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.6 system-ui,sans-serif;background:#fbfbfa;color:#2f3437}@media (prefers-color-scheme:dark){body{background:#0c0c0b;color:#d9d8d4}}main{max-width:28rem;padding:2rem}a{color:inherit}</style></head>
<body><main><h1>You're offline</h1><p>This page hasn't been saved on this device yet. Lessons you've opened before still work offline.</p><p><a href="${home}">Back to Learn</a></p></main></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
