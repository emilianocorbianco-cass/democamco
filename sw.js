const V = 'cambi-v3';
const LOCAL = ["./","index.html","presentazione.html","support.js","ios-frame.jsx","manifest.json","manifest-presentazione.json","icon-192.png","icon-512.png","ds/styles.css","ds/bundle.js","assets/logo-fpcgil.png","assets/logo-fpcgil-splash.png","assets/spid-ico-circle-bb.svg","assets/logo-cie-id.svg","vendor/react.production.min.js","vendor/react-dom.production.min.js","vendor/babel.min.js"];
const CDN = [];
const FONTS = ["https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap","https://fonts.googleapis.com/css2?family=Titillium+Web:wght@600;700&display=swap"];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.all(LOCAL.map(async u => { try { const r = await fetch(u); if (r.ok) await c.put(u, r); } catch (_) {} }));
    await Promise.all(CDN.map(async u => { try { await c.put(u, await fetch(u, { mode: 'no-cors' })); } catch (_) {} }));
    await Promise.all(FONTS.map(async u => { try {
      const r = await fetch(u); const t = await r.clone().text(); await c.put(u, r);
      const files = [...t.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
      await Promise.all(files.map(async f => { try { await c.put(f, await fetch(f)); } catch (_) {} }));
    } catch (_) {} }));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});
const timeout = (p, ms) => Promise.race([p, new Promise((_, j) => setTimeout(() => j(new Error('t')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(V);
      try {
        const r = await timeout(fetch(req), 5000);
        if (r.ok) c.put(req, r.clone());
        return r;
      } catch (_) {
        const hit = (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await c.match(url.pathname.endsWith('presentazione.html') ? 'presentazione.html' : 'index.html') : null);
        return hit || fetch(req);
      }
    })());
  } else {
    e.respondWith((async () => {
      const c = await caches.open(V);
      if (url.hostname.indexOf('fonts.') !== 0) return fetch(req);
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; } catch (_) { return Response.error(); }
    })());
  }
});
