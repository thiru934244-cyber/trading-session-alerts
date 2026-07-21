importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAAZuVRZkCzbDhJLuL-3ch_TB1gI5L3n3Y",
  authDomain: "nova-7d0e9.firebaseapp.com",
  databaseURL: "https://nova-7d0e9-default-rtdb.firebaseio.com",
  projectId: "nova-7d0e9",
  storageBucket: "nova-7d0e9.firebasestorage.app",
  messagingSenderId: "546942411373",
  appId: "1:546942411373:web:751c6ef4058426c6d65564",
  measurementId: "G-359S23JL34"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Market Alert';
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://placehold.co/192x192/007AFF/FFFFFF.png?text=FX', // Standard fallback icon
    data: payload.data // Pass payload data for click handling
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Open the website or focus if it's already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) { 
            client = clientList[i]; 
          }
        }
        return client.focus();
      }
      // Uses relative path for GitHub pages compatibility
      return clients.openWindow('./index.html');
    })
  );
});