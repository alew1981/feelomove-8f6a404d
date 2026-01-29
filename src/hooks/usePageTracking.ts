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

    // EXTREME DEFERRAL: Wait 5 seconds before ANY analytics
    // This ensures LCP, FCP, and TBT are completely unaffected by tracking scripts
    const timer = setTimeout(() => {
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

        // Track with Matomo if available
        if (typeof window !== "undefined" && (window as any)._paq) {
          (window as any)._paq.push(["setDocumentTitle", title]);
          (window as any)._paq.push(["setCustomUrl", window.location.href]);
          (window as any)._paq.push(["trackPageView"]);
        }
      };

      // Use requestIdleCallback for final deferral after 5s delay
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(doTrack, { timeout: 1000 });
      } else {
        doTrack();
      }
    }, 5000); // 5 SECOND DELAY - extreme deferral for LCP protection

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, pageTitle]);
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
