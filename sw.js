// Red primero (para recibir actualizaciones) y caché si no hay conexión.
const CACHE = 'gpsaver-v5';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }) // revalidar siempre: GitHub Pages pide guardar 10 min
      .then(r => {
        const copy = r.clone();
        const url = new URL(e.request.url); url.search = ''; // ?gasto=… no crea entradas nuevas
        caches.open(CACHE).then(c => c.put(url, copy));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
