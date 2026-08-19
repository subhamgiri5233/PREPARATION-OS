// src/services/nativeNotificationService.js
// Native Web & System Notification Service for Android, iOS, Windows, Mac

/**
 * Checks if Notification API is supported in current browser
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Checks current notification permission state ('granted', 'denied', 'default')
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Prompts user for system notification permission
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[NativeNotification] Error requesting permission:', err);
    return Notification.permission;
  }
}

/**
 * Sends a real native system notification to user's device (phone or desktop)
 * @param {object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.icon] - Icon URL (defaults to app PWA icon)
 * @param {string} [options.url] - URL to open when clicked
 * @param {string} [options.tag] - Grouping tag (prevents duplicates)
 */
export async function sendNativeNotification({ title, body, icon = '/pwa-192x192.svg', url = '/', tag = 'prepos-general' }) {
  if (!isNotificationSupported()) return false;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    console.info('[NativeNotification] Notification permission not granted');
    return false;
  }

  // 1. Try sending through active Service Worker registration (works best on Android/PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: '/favicon.svg',
          tag,
          renotify: true,
          data: { url },
          vibrate: [200, 100, 200],
        });
        return true;
      }
    } catch (err) {
      console.warn('[NativeNotification] ServiceWorker showNotification failed, falling back to Notification constructor:', err);
    }
  }

  // 2. Standard Web Notification API fallback
  try {
    const notif = new Notification(title, {
      body,
      icon,
      tag,
      badge: '/favicon.svg',
    });

    notif.onclick = () => {
      window.focus();
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('[NativeNotification] Failed to display notification:', err);
    return false;
  }
}
