const CACHE_NAME = 'tech-sokoni-cache-v1';
const IMAGE_CACHE_NAME = 'tech-sokoni-images-v1';

// Essential assets to precache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/robots.txt',
  '/sitemap.xml'
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching core offline assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches to save disk space
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache container:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache-First for static assets and Unsplash imagery, Stale-While-Revalidate for application scripts
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass non-GET requests, Firebase, and critical online-only API calls (Paystack, merchant center logs)
  if (event.request.method !== 'GET' || 
      requestUrl.pathname.includes('/google.firestore') || 
      requestUrl.hostname.includes('firestore.googleapis.com') ||
      requestUrl.hostname.includes('securetoken.googleapis.com') ||
      requestUrl.hostname.includes('identitytoolkit.googleapis.com') ||
      requestUrl.pathname.startsWith('/api/merchant-sync') ||
      requestUrl.pathname.startsWith('/api/email') ||
      requestUrl.pathname.startsWith('/api/paystack')) {
    return;
  }

  // Caching mechanism for Images (Local public images or external stock product photos on Unsplash)
  if (event.request.destination === 'image' || 
      requestUrl.hostname.includes('unsplash.com') || 
      requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve cached copy, but update cache with fresh network copy in the background
            fetch(event.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse);
              }
            }).catch(() => {/* Ignore background errors when offline */});
            return cachedResponse;
          }

          // Fall back to standard network request if not cached
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((err) => {
            console.warn('[Service Worker] Image offline fetch failed:', err);
          });
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate caching for core application scripts, styles and page routing
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to keep cache populated/updated
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore background errors when offline */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Handle navigation/routing offline fallback (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        throw err;
      });
    })
  );
});
