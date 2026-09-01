// Frontend/ticket-management/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDsIg9kyvf7k_MOlw41rOg1Cpkt2FAmGOw",
  projectId: "authentication-93abb",
  messagingSenderId: "329524365545",
  appId: "1:329524365545:web:8aae810d7414a7db5e8878"
};

const app = initializeApp(firebaseConfig);

export async function requestFCMToken() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
      });
      console.log('FCM Device Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
}
