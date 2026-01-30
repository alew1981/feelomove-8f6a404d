import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Custom hook to track page views with proper title handling for Matomo/GTM
 * Uses interaction-based triggering to avoid blocking TBT during PageSpeed tests
 */
export function usePageTracking(pageTitle?: string) {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");
  const hasTrackedInteraction = useRef(false);

  useEffect(() => {
    // Avoid duplicate tracking for the same path
    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

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

    // INTERACTION-TRIGGERED: Only track after first user interaction
    const handleInteraction = () => {
      if (hasTrackedInteraction.current) {
        // Already had interaction, track immediately via idle callback
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(doTrack, { timeout: 2000 });
        } else {
          setTimeout(doTrack, 100);
        }
        return;
      }

      hasTrackedInteraction.current = true;
      
      // Remove listeners
      const events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];
      events.forEach(evt => {
        window.removeEventListener(evt, handleInteraction, { capture: true } as EventListenerOptions);
      });

      // Track after interaction
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(doTrack, { timeout: 2000 });
      } else {
        setTimeout(doTrack, 100);
      }
    };

    // If already had interaction (navigation after first page), track immediately
    if (hasTrackedInteraction.current) {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(doTrack, { timeout: 2000 });
      } else {
        setTimeout(doTrack, 100);
      }
      return;
    }

    // Add passive listeners for first interaction
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];
    events.forEach(evt => {
      window.addEventListener(evt, handleInteraction, { passive: true, capture: true, once: true });
    });

    return () => {
      events.forEach(evt => {
        window.removeEventListener(evt, handleInteraction, { capture: true } as EventListenerOptions);
      });
    };
  }, [location.pathname, location.search, pageTitle]);
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
