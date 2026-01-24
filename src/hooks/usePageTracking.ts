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

    // Wait for React-Helmet to update the document title
    // Use requestAnimationFrame to ensure DOM has been updated
    const trackPageView = () => {
      requestAnimationFrame(() => {
        // Additional delay to ensure Helmet has processed
        setTimeout(() => {
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
        }, 50); // Small delay to ensure Helmet updates are applied
      });
    };

    trackPageView();
  }, [location.pathname, location.search, pageTitle]);
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
