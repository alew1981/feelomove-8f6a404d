import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import { registerServiceWorker } from "./lib/serviceWorker";
import { sendWebVitalsToAnalytics } from "./lib/webVitals";
import App from "./App.tsx";
import "./index.css";

// Register service worker for caching
registerServiceWorker();

// Start Web Vitals monitoring
sendWebVitalsToAnalytics();

const queryClient = new QueryClient();

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
