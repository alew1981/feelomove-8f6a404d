// Force Vercel redeploy - sitemap EN rewrites v2
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import App from "./App.tsx";
import "./index.css";

// Configure QueryClient with optimized defaults for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce refetching for better perceived performance
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Render app immediately - don't block on non-critical operations
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <App />
        </CartProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);

// DEFER non-critical operations until after initial render
// This improves LCP by not blocking the main thread during initial paint
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for non-critical work (with fallback)
  const scheduleNonCritical = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  
  scheduleNonCritical(() => {
    // Register service worker after initial paint
    import('./lib/serviceWorker').then(({ registerServiceWorker }) => {
      registerServiceWorker();
    });
    
    // Start Web Vitals monitoring
    import('./lib/webVitals').then(({ sendWebVitalsToAnalytics }) => {
      sendWebVitalsToAnalytics();
    });
  });
}
