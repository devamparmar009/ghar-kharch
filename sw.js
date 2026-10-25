const CACHE = 'ghar-kharch-v2';
const ASSETS = [
  'index.html','history.html','analytics.html','settings.html',
  'css/tokens.css','css/main.css','css/components.css','css/charts.css',
  'js/format.js','js/icons.js','js/storage.js','js/analytics.js','js/app.js','js/home.js','js/addexpense.js','js/history.js','js/charts.js','js/analytics-view.js','js/settings.js',
  'manifest.json','assets/icon-192.png','assets/icon-512.png','assets/favicon.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
    if (e.request.method === 'GET' && url.origin === location.origin) { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return resp;
  }).catch(() => caches.match('index.html'))));
});
