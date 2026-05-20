// ─── Country Home & Deco — Service Worker ────────────────
const CACHE = 'country-v1';
const STATIC = [
  '/',
  '/index.html',
  '/logo_country_500x500.png',
  '/logo_country.jpg',
  '/manifest.json'
];

// ─── INSTALL: pre-cachear assets estáticos ────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: limpiar caches viejos ─────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── FETCH: estrategia por tipo de recurso ────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API: siempre red, fallback vacío
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('[]', {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Fuentes externas: no cachear
  if (url.origin !== location.origin) return;

  // Todo lo demás: cache first, actualiza en background
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ─── PUSH NOTIFICATIONS ───────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'Country Home & Deco', body: 'Tenemos novedades para vos', url: '/' };
  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo_country_500x500.png',
      badge: '/logo_country_500x500.png',
      image: data.image || undefined,
      data: { url: data.url },
      actions: [
        { action: 'ver', title: 'Ver producto' },
        { action: 'wsp', title: 'Consultar' }
      ],
      vibrate: [200, 100, 200],
      requireInteraction: false
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.action === 'wsp'
    ? 'https://wa.me/541131655653'
    : (e.notification.data?.url || '/');
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes(location.origin));
      if (match) { match.focus(); match.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
