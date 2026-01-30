import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Custom hook to track page views with proper title handling for Matomo/GTM
 * Waits for React-Helmet to update the title before sending the page view event
 */
export function usePageTracking(pageTitle?: string) {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    // Avoid duplicate tracking for the same path
    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

    // EXTREME DEFERRAL: Wait for load event + 3s delay before ANY analytics
    // This ensures LCP, FCP, and TBT are completely unaffected by tracking scripts
    const initTracking = () => {
      setTimeout(() => {
        const doTrack = () => {
          const title = pageTitle || document.title || "FEELOMOVE+";
          
          // Push to dataLayer for GTM/GA4
          if (typeof window !== "undefined" && window.dataLayer) {
            window.dataLayer.push({
              event: "page_view",
              page_path: location.pathname + location.search,
              page_title: title,
              page_location: window.location.href,
            });
          }

          // Track with Matomo if available (deferred initialization)
          if (typeof window !== "undefined" && (window as any)._paq) {
            (window as any)._paq.push(["setDocumentTitle", title]);
            (window as any)._paq.push(["setCustomUrl", window.location.href]);
            (window as any)._paq.push(["trackPageView"]);
          }
        };

        // Use requestIdleCallback for final deferral
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(doTrack, { timeout: 1000 });
        } else {
          doTrack();
        }
      }, 3000); // 3 SECOND DELAY post-load
    };

    // Wait for page load before starting timer
    if (document.readyState === 'complete') {
      initTracking();
    } else {
      window.addEventListener('load', initTracking, { once: true });
    }

    return () => {
      window.removeEventListener('load', initTracking);
    };
  }, [location.pathname, location.search, pageTitle]);
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
