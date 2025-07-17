// Service Worker for Sport Arbitrage App
const CACHE_NAME = 'sport-arbitrage-v1.2.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/opportunities.png',
  '/icons/bookmakers.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Helper function to determine if a request is for an API call
const isApiRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('supabase.co') || 
         url.includes('bet9ja.com') || 
         url.includes('1xbet.com') || 
         url.includes('betking.com') || 
         url.includes('sportybet.com');
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = [
    '.html', '.css', '.js', '.json', '.ico', '.png', '.jpg', 
    '.jpeg', '.svg', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) || 
         STATIC_ASSETS.includes(url.pathname);
};

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin && !isApiRequest(url.href)) {
    return;
  }
  
  // Different caching strategies based on request type
  if (isApiRequest(url.href)) {
    // Network-first strategy for API requests with fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(event.request, responseClone);
            }
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Return a fallback offline response for API requests
              return new Response(
                JSON.stringify({
                  error: 'Network connection unavailable. Please check your internet connection.',
                  offline: true,
                  timestamp: new Date().toISOString()
                }),
                {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              );
            });
        })
    );
  } else if (isStaticAsset(url)) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached response
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Cache a copy of the response
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              
              // Return a fallback for HTML requests (app shell)
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
              
              // Let the browser handle other failures
              throw error;
            });
        })
    );
  } else {
    // Network-first strategy for other requests
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If it's an HTML request, return the cached app shell
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
              
              // Let the browser handle other failures
              return new Response('Network error', { status: 408 });
            });
        })
    );
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-opportunities') {
    event.waitUntil(syncOpportunities());
  }
  
  if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'New Notification',
        body: event.data.text()
      };
    }
  }
  
  const options = {
    body: data.body || 'New arbitrage opportunity available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/?tab=opportunities'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sport Arbitrage', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const url = event.notification.data.url || '/';
        
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Sync opportunities when online
async function syncOpportunities() {
  try {
    const opportunitiesCache = await caches.open('opportunities-store');
    const requests = await opportunitiesCache.keys();
    
    const syncPromises = requests.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await opportunitiesCache.delete(request);
        }
        return response;
      } catch (error) {
        console.error('[Service Worker] Failed to sync opportunity:', error);
        return null;
      }
    });
    
    return Promise.all(syncPromises);
  } catch (error) {
    console.error('[Service Worker] Sync opportunities failed:', error);
  }
}

// Sync settings when online
async function syncSettings() {
  try {
    const settingsCache = await caches.open('settings-store');
    const requests = await settingsCache.keys();
    
    const syncPromises = requests.map(async (request) => {
      try {
        const cachedResponse = await settingsCache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await settingsCache.delete(request);
        }
        return response;
      } catch (error) {
        console.error('[Service Worker] Failed to sync settings:', error);
        return null;
      }
    });
    
    return Promise.all(syncPromises);
  } catch (error) {
    console.error('[Service Worker] Sync settings failed:', error);
  }
}

// Periodic background sync for fresh data (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-opportunities') {
    event.waitUntil(refreshOpportunities());
  }
});

// Refresh opportunities in the background
async function refreshOpportunities() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Fetch fresh data
    const response = await fetch('/api/opportunities');
    if (response.ok) {
      await cache.put('/api/opportunities', response);
      
      // Notify clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'OPPORTUNITIES_UPDATED',
          timestamp: new Date().toISOString()
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Background refresh failed:', error);
  }
}