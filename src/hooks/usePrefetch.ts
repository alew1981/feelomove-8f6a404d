import { useCallback } from "react";

// Route to component chunk mapping for prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
  "/conciertos": () => import("@/pages/Conciertos"),
  "/festivales": () => import("@/pages/Festivales"),
  "/artistas": () => import("@/pages/Artistas"),
  "/musica": () => import("@/pages/Musica"),
  "/destinos": () => import("@/pages/Destinos"),
  "/favoritos": () => import("@/pages/Favoritos"),
  "/about": () => import("@/pages/About"),
  "/eventos": () => import("@/pages/Eventos"),
};

// Cache to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();

export const usePrefetch = () => {
  const prefetch = useCallback((path: string) => {
    // Normalize path (remove query params)
    const normalizedPath = path.split("?")[0];
    
    // Check if already prefetched
    if (prefetchedRoutes.has(normalizedPath)) return;
    
    // Find matching route
    const moduleLoader = routeModules[normalizedPath];
    
    if (moduleLoader) {
      // Mark as prefetched
      prefetchedRoutes.add(normalizedPath);
      
      // Prefetch the chunk
      moduleLoader().catch(() => {
        // Remove from cache on error so it can retry
        prefetchedRoutes.delete(normalizedPath);
      });
    }
  }, []);

  return { prefetch };
};

export default usePrefetch;
