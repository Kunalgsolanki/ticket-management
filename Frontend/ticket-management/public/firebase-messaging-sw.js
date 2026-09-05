// public/firebase-messaging-sw.js
// Handles both Web Push API events and Firebase background messages

// ── Web Push API (direct browser push — works without FCM) ────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Ticketify', body: 'You have a new notification.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ticketify', {
      body: data.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'ticketify-notification',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// ── Firebase Cloud Messaging (optional, fires when FCM is properly configured) ──
try {
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyDsIg9kyvf7k_MOlw41rOg1Cpkt2FAmGOw",
    projectId: "authentication-93abb",
    messagingSenderId: "329524365545",
    appId: "1:329524365545:web:8aae810d7414a7db5e8878"
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    if (!payload?.notification?.title) return;
    self.registration.showNotification(payload.notification.title, {
      body: payload.notification.body || '',
      icon: '/favicon.ico',
    });
  });
} catch (_) {
  // FCM scripts unavailable — Web Push still works above
}
