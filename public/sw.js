const CACHE_VERSION = 'v4';
const STATIC_CACHE = `feelomove-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `feelomove-images-${CACHE_VERSION}`;

// Critical routes to precache
const PRECACHE_ROUTES = [
  '/',
  '/conciertos',
  '/festivales',
  '/artistas',
  '/generos',
  '/destinos'
];

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/og-image.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).then(() => {
        // Best-effort route precache; don't fail install
        return Promise.allSettled(
          PRECACHE_ROUTES.map(route =>
            fetch(route, { mode: 'no-cors' })
              .then(response => {
                if (response.ok || response.type === 'opaque') {
                  return cache.put(route, response);
                }
              })
              .catch(() => {/* ignore */})
          )
        );
      });
    })
  );

  // Activate updated SW ASAP
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('feelomove-') && !validCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // NEVER cache Supabase/API requests here.
  // This avoids serving stale availability/ticket data that can break add-to-cart logic.
  if (url.hostname.includes('supabase.co')) {
    return; // let the browser handle it (network)
  }

  // Image caching: Stale-While-Revalidate
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i) ||
    url.hostname.includes('ticketm.net') ||
    url.hostname.includes('tmimg.net') ||
    url.hostname.includes('unsplash.com')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cachedResponse || caches.match('/placeholder.svg'));

          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  // Static assets: Cache First (hashed assets will still update on new deploy)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // HTML navigation: Network First, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cachedResponse) => cachedResponse || caches.match('/'))
        )
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'PREFETCH_ROUTE') {
    const route = event.data.route;
    caches.open(STATIC_CACHE).then((cache) => {
      fetch(route)
        .then((response) => {
          if (response.ok) cache.put(route, response);
        })
        .catch(() => {/* ignore */});
    });
  }
});
