import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_TTL } from "@/lib/cacheClient";

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
  
  // Prefetch destination detail page data
  const prefetchDestination = useCallback((citySlug: string) => {
    const cacheKey = `destination-${citySlug}`;
    
    // Throttle: prevent multiple prefetches within 2 seconds
    const now = Date.now();
    if (throttleRef.current[cacheKey] && now - throttleRef.current[cacheKey] < 2000) {
      return;
    }
    throttleRef.current[cacheKey] = now;
    
    if (prefetchedData.has(cacheKey)) return;
    prefetchedData.add(cacheKey);
    
    // Prefetch concerts for this city
    queryClient.prefetchQuery({
      queryKey: ['destination-concerts', citySlug],
      queryFn: async () => {
        const { data } = await supabase
          .from('mv_concerts_cards')
          .select('id, name, slug, event_date, venue_city, image_standard_url, price_min_incl_fees, artist_name')
          .ilike('venue_city_slug', citySlug)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(20);
        return data || [];
      },
      staleTime: CACHE_TTL.destinations,
    });
    
    // Prefetch festivals for this city
    queryClient.prefetchQuery({
      queryKey: ['destination-festivals', citySlug],
      queryFn: async () => {
        const { data } = await supabase
          .from('mv_festivals_cards')
          .select('id, name, slug, event_date, venue_city, image_standard_url, price_min_incl_fees')
          .ilike('venue_city_slug', citySlug)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(20);
        return data || [];
      },
      staleTime: CACHE_TTL.destinations,
    });
    
    // Prefetch DestinoDetalle component
    import("@/pages/DestinoDetalle").catch(() => {
      prefetchedData.delete(cacheKey);
    });
  }, [queryClient]);

  const prefetch = useCallback((path: string) => {
    // Normalize path (remove query params)
    const normalizedPath = path.split("?")[0];
    
    // Throttle: prevent multiple prefetches within 2 seconds
    const now = Date.now();
    if (throttleRef.current[normalizedPath] && now - throttleRef.current[normalizedPath] < 2000) {
      return;
    }
    throttleRef.current[normalizedPath] = now;
    
    // Handle destination detail pages
    if (normalizedPath.startsWith('/destinos/')) {
      const citySlug = normalizedPath.replace('/destinos/', '');
      if (citySlug) {
        prefetchDestination(citySlug);
        return;
      }
    }
    
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
  }, [queryClient, prefetchDestination]);

  return { prefetch, prefetchDestination };
};

export default usePrefetch;
