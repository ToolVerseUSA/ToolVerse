const CACHE_NAME = 'toolverse-static-v1';
const APP_ROOT = '/ToolVerse/';
const OFFLINE_URL = `${APP_ROOT}offline.html`;
const STATIC_ASSETS = [
  APP_ROOT,
  `${APP_ROOT}index.html`,
  `${APP_ROOT}offline.html`,
  `${APP_ROOT}site.webmanifest`,
  `${APP_ROOT}favicon.svg`,
  `${APP_ROOT}favicon.ico`,
  `${APP_ROOT}favicon-192.png`,
  `${APP_ROOT}favicon-512.png`,
  `${APP_ROOT}apple-touch-icon.png`,
  `${APP_ROOT}style.css`,
  `${APP_ROOT}navigation.css`,
  `${APP_ROOT}navigation.js`,
  `${APP_ROOT}toolverse-calculations.js`,
  `${APP_ROOT}decision-tools.js`,
  `${APP_ROOT}homebuying-tools.js`,
  `${APP_ROOT}renter-tools.js`,
  `${APP_ROOT}guides.css`,
  `${APP_ROOT}guides.js`
];
const STATIC_PATHS = new Set(STATIC_ASSETS.map((asset) => new URL(asset, self.location.origin).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('toolverse-static-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
});

const isToolVerseUrl = (url) => url.origin === self.location.origin && url.pathname.startsWith(APP_ROOT);
const isAcaRequest = (url) => url.pathname === `${APP_ROOT}api/aca-lookup` || url.pathname === '/api/aca-lookup';
const isDocumentRequest = (request) => request.mode === 'navigate' || request.destination === 'document';
const isHomeNavigation = (url) => url.pathname === APP_ROOT || url.pathname === `${APP_ROOT}index.html`;

const offlineResponse = () => caches.match(OFFLINE_URL).then((response) => response || new Response(
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>ToolVerse offline</title><p>ToolVerse is temporarily offline. Please reconnect and try again.</p>',
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !isToolVerseUrl(url) || url.search || isAcaRequest(url)) return;

  if (isDocumentRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => isHomeNavigation(url) ? caches.match(`${APP_ROOT}index.html`).then((response) => response || offlineResponse()) : offlineResponse())
    );
    return;
  }

  if (!STATIC_PATHS.has(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (!response || !response.ok) return response;
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, response.clone());
        return response;
      });
    }))
  );
});
