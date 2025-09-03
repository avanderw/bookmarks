const CACHE_NAME = 'bookmarks-pwa-v2'; // Increment when cache strategy changes
const BASE_PATH = '/bookmarks';
let CURRENT_VERSION = null;

// Core app files to cache
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/feather-sprite.svg`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`,
  `${BASE_PATH}/_app/version.json` // Cache version file
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
        // Load current version after caching
        return fetch(`${BASE_PATH}/_app/version.json`)
          .then(response => response.json())
          .then(data => {
            CURRENT_VERSION = data.version;
            console.log('Cached app version:', CURRENT_VERSION);
          })
          .catch(err => console.warn('Could not load version:', err));
      })
      .then(() => self.skipWaiting())
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

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Cache successful GET requests
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Return offline page or cached index for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}/`);
            }
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
