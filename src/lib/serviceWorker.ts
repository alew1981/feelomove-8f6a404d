// Service Worker registration
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    // IMPORTANT:
    // - We add a version query param to bypass any CDN/browser caching of sw.js
    // - This fixes the "works in incognito but not in normal mode" issue caused by stale SW.
    const registration = await navigator.serviceWorker.register('/sw.js?v=v5', {
      scope: '/',
    });

    // If there's an update waiting, activate it immediately
    const activateWaitingWorker = () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version installed; activate and reload to ensure JS/CSS match
          activateWaitingWorker();
          window.location.reload();
        }
      });
    });

    // Proactively check for updates shortly after load and then hourly
    setTimeout(() => registration.update(), 5_000);
    setInterval(() => registration.update(), 60 * 60 * 1000);

    console.log('Service Worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Unregister service worker (useful for debugging)
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
};

// Clear all caches
export const clearCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
};
