// Service Worker registration
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    // If a previous SW is stuck (common on production), aggressively unregister it and clear caches.
    // This ensures all tabs converge to the same, latest bundle.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const hasOldSw = regs.some((r) => {
        const url = r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || '';
        return url.includes('/sw.js') && !url.includes('v=5');
      });

      if (hasOldSw) {
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      }
    } catch {
      // ignore cleanup failures
    }

    // IMPORTANT: avoid the browser HTTP cache for sw.js so production updates actually apply.
    // (Chrome supports this option; cast to any for TS compatibility.)
    const registration = await navigator.serviceWorker.register('/sw.js?v=6', {
      scope: '/',
      updateViaCache: 'none',
    } as any);

    // Ask for updates ASAP (not just hourly)
    registration.update().catch(() => void 0);

    // If there's already a waiting worker (common when a new deploy happened), activate it.
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // When an update is found, auto-activate it.
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        // "installed" + existing controller => new version available
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Once the new SW takes control, reload so the new JS bundle is used.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update().catch(() => void 0);
    }, 60 * 60 * 1000); // Check every hour

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
