const V = 'q30-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== V && k !== 'q30-fonts').map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.host)) {
    e.respondWith(caches.open('q30-fonts').then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(r => {
          const cl = r.clone();
          caches.open(V).then(c => c.put(req, cl));
          return r;
        }).catch(() => hit || caches.match('index.html'));
        return hit || net;
      })
    );
  }
});
