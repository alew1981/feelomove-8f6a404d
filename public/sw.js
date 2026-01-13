const CACHE_VERSION = 'v5';
const STATIC_CACHE = `feelomove-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `feelomove-images-${CACHE_VERSION}`;
const DATA_CACHE = `feelomove-data-${CACHE_VERSION}`;

// Maximum items in image cache to prevent storage bloat
const MAX_IMAGE_CACHE_ITEMS = 100;

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

// Install event - cache static assets and critical routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Cache static assets
      return cache.addAll(STATIC_ASSETS).then(() => {
        // Precache critical routes (best effort, don't fail install)
        return Promise.allSettled(
          PRECACHE_ROUTES.map(route => 
            fetch(route, { mode: 'no-cors' })
              .then(response => {
                if (response.ok || response.type === 'opaque') {
                  return cache.put(route, response);
                }
              })
              .catch(() => {/* Ignore precache failures */})
          )
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, IMAGE_CACHE, DATA_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('feelomove-') && !validCaches.includes(name);
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Image caching strategy: Stale-While-Revalidate with aggressive caching
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i) ||
    url.hostname.includes('ticketm.net') ||
    url.hostname.includes('tmimg.net') ||
    url.hostname.includes('unsplash.com')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cachedResponse || caches.match('/placeholder.svg'));

          // Return cached immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // API/Data caching: Stale-While-Revalidate with short cache
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              // Clone and cache the response
              const responseToCache = response.clone();
              cache.put(request, responseToCache);
            }
            return response;
          });

          // Return cached immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Static assets: Cache First with long expiry
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML pages: Network First, fallback to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Prefetch specific routes on demand
  if (event.data && event.data.type === 'PREFETCH_ROUTE') {
    const route = event.data.route;
    caches.open(STATIC_CACHE).then((cache) => {
      fetch(route)
        .then((response) => {
          if (response.ok) {
            cache.put(route, response);
          }
        })
        .catch(() => {/* Ignore prefetch failures */});
    });
  }
});
