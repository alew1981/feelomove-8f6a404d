import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Route to component chunk mapping for prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
  "/conciertos": () => import("@/pages/Conciertos"),
  "/festivales": () => import("@/pages/Festivales"),
  "/artistas": () => import("@/pages/Artistas"),
  "/generos": () => import("@/pages/Musica"),
  "/destinos": () => import("@/pages/Destinos"),
  "/favoritos": () => import("@/pages/Favoritos"),
  "/about": () => import("@/pages/About"),
};

// Cache to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();
const prefetchedData = new Set<string>();

export const usePrefetch = () => {
  const queryClient = useQueryClient();
  const throttleRef = useRef<Record<string, number>>({});
  
  const prefetch = useCallback((path: string) => {
    // Normalize path (remove query params)
    const normalizedPath = path.split("?")[0];
    
    // Throttle: prevent multiple prefetches within 2 seconds
    const now = Date.now();
    if (throttleRef.current[normalizedPath] && now - throttleRef.current[normalizedPath] < 2000) {
      return;
    }
    throttleRef.current[normalizedPath] = now;
    
    // Check if already prefetched
    if (prefetchedRoutes.has(normalizedPath)) return;
    
    // Find matching route module
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
    
    // Prefetch data for critical routes
    if (!prefetchedData.has(normalizedPath)) {
      prefetchedData.add(normalizedPath);
      
      if (normalizedPath === '/conciertos') {
        queryClient.prefetchQuery({
          queryKey: ['concerts-list'],
          queryFn: async () => {
            const { data } = await supabase
              .from('mv_concerts_cards')
              .select('*')
              .gte('event_date', new Date().toISOString())
              .order('event_date', { ascending: true })
              .limit(20);
            return data || [];
          },
          staleTime: 5 * 60 * 1000
        });
      } else if (normalizedPath === '/festivales') {
        queryClient.prefetchQuery({
          queryKey: ['festivals-list'],
          queryFn: async () => {
            const { data } = await supabase
              .from('mv_festivals_cards')
              .select('*')
              .gte('event_date', new Date().toISOString())
              .order('event_date', { ascending: true })
              .limit(20);
            return data || [];
          },
          staleTime: 5 * 60 * 1000
        });
      }
    }
    
    // Tell Service Worker to prefetch route
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH_ROUTE',
        route: normalizedPath
      });
    }
  }, [queryClient]);

  return { prefetch };
};

export default usePrefetch;
