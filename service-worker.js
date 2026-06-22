/*
  Service Worker for MoE Scalper PWA
  -----------------------------------
  Strategy:
    - APP SHELL (index.html, manifest, icons) -> cache-first, so the app
      still opens (UI shell) even with no signal/offline.
    - LIVE DATA (Binance API calls) -> always network, NEVER cached.
      Trading signals must always reflect the freshest possible candle;
      serving a stale cached candle would be actively dangerous here.
*/

const CACHE_NAME = 'moe-scalper-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept/cache calls to the live market data API -- always
  // go straight to the network so signals are based on real-time data.
  if (url.hostname.includes('binance.com')) {
    return; // let the browser handle it normally, no caching
  }

  // App shell: cache-first, falling back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
