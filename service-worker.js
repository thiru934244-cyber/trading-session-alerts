// Import Firebase v10 compat libraries for Service Worker background processing
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const CACHE_NAME = 'fx-alerts-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Offline Caching (PWA Requirement)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 2. Background Sync (PWA Requirement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    console.log('[SW] Background sync triggered.');
  }
});

// 3. Firebase Background Messaging
// NOTE: Replace these placeholders with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Received background message ', payload);
    
    const title = payload.notification?.title || 'Trading Alert';
    const options = {
      body: payload.notification?.body || 'New high impact event.',
      icon: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: { url: '/', payload: payload },
      tag: 'fcm-push-alert'
    };

    // Save to IndexedDB so the UI can log it to Recent Alerts when next opened
    saveAlertToIDB(title, '🔥');

    return self.registration.showNotification(title, options);
  });
} catch (e) {
  console.warn('[SW] Firebase messaging not initialized in SW.', e);
}

// 4. Offline Background Storage Sync Engine
function saveAlertToIDB(title, icon) {
  const request = indexedDB.open('trading-alerts-db', 1);
  request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
  };
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('alerts', 'readwrite');
    tx.objectStore('alerts').add({ title, icon, timestamp: Date.now() });
  };
}

// 5. Notification Click & Deep Linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = new URL('/', self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === urlToOpen) {
          matchingClient = windowClients[i];
          break;
        }
      }
      // Bring existing app to foreground or open a new instance
      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
