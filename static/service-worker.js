const CACHE_NAME = 'bookmarks-pwa-v3'; // Increment to clear problematic cache
const BASE_PATH = '/bookmarks';
let CURRENT_VERSION = null;

// Only cache static files that don't change names
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/feather-sprite.svg`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`
  // Note: Don't cache _app files as they have dynamic hashes
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Load current version separately (don't cache it during install)
        return fetch(`${BASE_PATH}/_app/version.json`)
          .then(response => response.json())
          .then(data => {
            CURRENT_VERSION = data.version;
            console.log('Loaded app version:', CURRENT_VERSION);
          })
          .catch(err => console.warn('Could not load version during install:', err));
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service Worker install failed:', err);
        // Still skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle requests within our base path
  if (!event.request.url.includes(BASE_PATH)) {
    return;
  }

  // Use network-first strategy for _app files (they have dynamic hashes)
  if (event.request.url.includes('/_app/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If successful, cache the response and return it
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone))
              .catch(err => console.warn('Failed to cache _app resource:', err));
          }
          return response;
        })
        .catch(err => {
          console.warn('Network failed for _app resource, trying cache:', event.request.url);
          // Fallback to cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If it's a navigation request, return the cached index
              if (event.request.mode === 'navigate') {
                return caches.match(`${BASE_PATH}/`);
              }
              throw err;
            });
        })
    );
    return;
  }

  // Use cache-first strategy for static files
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Cache successful GET requests for static files
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone))
                .catch(err => console.warn('Failed to cache static resource:', err));
            }
            return response;
          })
          .catch(err => {
            console.warn('Network failed for static resource:', event.request.url);
            // Return offline page or cached index for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}/`);
            }
            throw err;
          });
      })
  );
});

// Handle messages from client for version checking
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    fetch(`${BASE_PATH}/_app/version.json`)
      .then(response => response.json())
      .then(data => {
        const latestVersion = data.version;
        const isStale = CURRENT_VERSION && CURRENT_VERSION !== latestVersion;
        
        event.ports[0].postMessage({
          type: 'VERSION_CHECK_RESULT',
          currentVersion: CURRENT_VERSION,
          latestVersion,
          isStale,
          cacheExpired: isStale
        });
        
        if (isStale) {
          console.log('Cache is stale. Current:', CURRENT_VERSION, 'Latest:', latestVersion);
        }
      })
      .catch(err => {
        event.ports[0].postMessage({
          type: 'VERSION_CHECK_ERROR',
          error: err.message
        });
      });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
