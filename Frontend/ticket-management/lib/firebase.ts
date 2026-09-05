// lib/firebase.ts
// Browser-based push notifications using the Web Notifications API + Service Worker
// No FCM dependency — works fully offline and without Google Cloud setup.

let swReg: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker and request notification permission.
 * Shows a welcome OS notification immediately to confirm it works.
 */
export async function initBrowserNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;

  // Return early if already initialized
  if (swReg && Notification.permission === 'granted') return true;

  try {
    // 1. Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[Notifications] Permission denied.');
      return false;
    }

    // 2. Register + activate service worker
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    console.info('[Notifications] Service worker ready. Notifications active.');

    // 3. Fire immediate welcome notification to prove it works
    await swReg.showNotification('🎫 Ticketify Notifications Active', {
      body: 'You will receive real-time alerts for ticket events.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'ticketify-welcome',
    });

    return true;
  } catch (err) {
    console.warn('[Notifications] Init failed:', err);
    return false;
  }
}

/**
 * Show an OS-level browser push notification.
 * Uses the cached service worker registration — no FCM required.
 */
export async function showBrowserNotification(
  title: string,
  options?: { body?: string; tag?: string; icon?: string }
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Auto-init if permission already granted (e.g. page refresh / localStorage restore)
  if (!swReg && Notification.permission === 'granted') {
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    } catch {
      // fall through to direct Notification
    }
  }

  if (Notification.permission !== 'granted') return;

  try {
    const reg = swReg ?? (await navigator.serviceWorker.ready);
    await reg.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      body: options?.body ?? '',
      tag: options?.tag ?? 'ticketify',
    });
  } catch (err) {
    // Fallback: direct Notification (Firefox / Safari)
    try {
      new Notification(title, { body: options?.body, icon: '/favicon.ico' });
    } catch {
      console.warn('[Notifications] showBrowserNotification failed:', err);
    }
  }
}

// ── Legacy exports kept for compatibility ─────────────────────────────────

/** @deprecated use initBrowserNotifications() */
export async function requestNotificationPermission() {
  await initBrowserNotifications();
  return swReg;
}

/** @deprecated use initBrowserNotifications() */
export async function requestFCMToken(_force = false): Promise<string | null> {
  await initBrowserNotifications();
  return null; // FCM token not required for browser-based notifications
}

/** No-op — FCM foreground listener not needed without FCM token */
export function onMessageListener(_callback?: (payload: unknown) => void) {
  return undefined;
}
