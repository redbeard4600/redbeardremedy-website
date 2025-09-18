// Advanced Service Worker for Red Beard Remedy - Progressive Web App
const CACHE_NAME = 'redbeard-remedy-v2.0';
const DYNAMIC_CACHE = 'redbeard-dynamic-v2.0';
const ANALYTICS_CACHE = 'redbeard-analytics-v2.0';

// Core app shell files
const APP_SHELL = [
  '/',
  '/index.html',
  '/content-gallery.html',
  '/education.html',
  '/civil-law-misconceptions.html',
  '/resources.html',
  '/legal-disclaimer.html',
  '/privacy.html',
  '/terms.html',
  '/reality-check-blog.html',
  '/css/main.css',
  '/js/main.js',
  '/js/chat-system.js',
  '/js/blog.js',
  '/assets/images/redbeard-logo.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/images/favicon.ico'
];

// External resources
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.tailwindcss.com'
];

// All cached resources
const urlsToCache = [...APP_SHELL, ...EXTERNAL_RESOURCES];

// Install Service Worker with enhanced caching
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Install failed:', error);
      })
  );
});

// Advanced fetch strategy with multiple cache layers
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different request types
  if (request.url.includes('/tables/')) {
    // API requests - Network first, cache fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'image') {
    // Images - Cache first, network fallback
    event.respondWith(cacheFirstStrategy(request));
  } else if (APP_SHELL.includes(url.pathname)) {
    // App shell - Cache first with network update
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Other requests - Network first
    event.respondWith(networkFirstStrategy(request));
  }
});

// Network First Strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline - Please check your connection');
    }
    throw error;
  }
}

// Cache First Strategy (for images)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Image load failed:', error);
    // Return placeholder image or throw error
    throw error;
  }
}

// Stale While Revalidate Strategy (for app shell)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('Network update failed:', error);
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Activate Service Worker with enhanced cleanup
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE && cacheName !== ANALYTICS_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Ready to serve!');
    })
  );
});

// Background sync for analytics (when network is restored)
self.addEventListener('sync', function(event) {
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync offline analytics data when back online
async function syncAnalytics() {
  try {
    const cache = await caches.open(ANALYTICS_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Retry sending analytics data
        await fetch('/tables/site_analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        // Remove from cache after successful sync
        await cache.delete(request);
        console.log('Analytics data synced successfully');
      } catch (error) {
        console.error('Failed to sync analytics:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications (for future features)
self.addEventListener('push', function(event) {
  console.log('Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New legal education content available!',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'View Content',
        icon: '/assets/images/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Redbeards Remedy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked');
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Message handling for communication with main app
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'CACHE_ANALYTICS') {
    // Cache analytics data for later sync
    cacheAnalyticsData(event.data.payload);
  }
  
  // Send response back to client
  event.ports[0].postMessage({
    type: 'SW_RESPONSE',
    success: true
  });
});

// Cache analytics data when offline
async function cacheAnalyticsData(data) {
  try {
    const cache = await caches.open(ANALYTICS_CACHE);
    const request = new Request(`/analytics-${Date.now()}`, {
      method: 'POST'
    });
    const response = new Response(JSON.stringify(data));
    await cache.put(request, response);
    console.log('Analytics data cached for later sync');
  } catch (error) {
    console.error('Failed to cache analytics data:', error);
  }
}
