import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EventProductPage } from "@/types/events.types";

type ViewName = 
  | "lovable_mv_event_product_page"
  | "lovable_mv_event_product_page_conciertos"
  | "lovable_mv_event_product_page_festivales";

interface EventDataResult {
  data: EventProductPage[] | null;
  canonicalSlug: string | null;
  needsRedirect: boolean;
  redirectPath: string | null;
  needsRouteCorrection: boolean;
  correctRoutePath: string | null;
}

/**
 * Optimized event data fetching hook
 * Uses Promise.all to parallelize initial checks and avoid waterfall queries
 */
export function useEventData(
  slug: string | undefined,
  isFestivalRoute: boolean,
  isConcierto: boolean
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["event-product-page-optimized", slug, isFestivalRoute],
    queryFn: async (): Promise<EventDataResult> => {
      if (!slug) {
        throw new Error("No se proporcionó el identificador del evento");
      }

      // Select appropriate view based on route
      const viewName: ViewName = isFestivalRoute
        ? "lovable_mv_event_product_page_festivales"
        : isConcierto
          ? "lovable_mv_event_product_page_conciertos"
          : "lovable_mv_event_product_page";

      // STABILITY FIX: Query event data FIRST without checking redirects
      // This ensures the page can render even if redirect logic fails
      const { data, error } = await (supabase
        .from(viewName as any)
        .select("*") as any)
        .eq("event_slug", slug);

      if (error) {
        console.error(`Supabase error in ${viewName}:`, error);
        throw new Error("Error al cargar el evento");
      }

      // If event found directly, return it (no redirect needed)
      if (data && data.length > 0) {
        // Check if route type is correct
        const eventType = (data[0] as any).event_type;
        const shouldBeFestival = eventType === "festival";
        const isWrongRoute = shouldBeFestival ? !isFestivalRoute : !isConcierto;

        if (isWrongRoute) {
          // Return route correction info but DON'T trigger redirect here
          // Let the component handle it to avoid loops
          return {
            data: data as unknown as EventProductPage[],
            canonicalSlug: null,
            needsRedirect: false,
            redirectPath: null,
            needsRouteCorrection: true,
            correctRoutePath: shouldBeFestival
              ? `/festival/${slug}`
              : `/concierto/${slug}`,
          };
        }

        return {
          data: data as unknown as EventProductPage[],
          canonicalSlug: null,
          needsRedirect: false,
          redirectPath: null,
          needsRouteCorrection: false,
          correctRoutePath: null,
        };
      }

      // Event not found in view - check if it's a redirect case
      // OPTIMIZATION: Run redirect check only if event not found directly
      const { data: redirectResult } = await supabase
        .from("slug_redirects")
        .select("new_slug, event_id")
        .eq("old_slug", slug)
        .maybeSingle();

      if (redirectResult?.new_slug && redirectResult.new_slug !== slug) {
        // Verify the redirect target exists and is not a placeholder
        const isPlaceholderSlug = (s: string) => /-9999(-\d{2})?(-\d{2})?$/.test(s);
        
        if (!isPlaceholderSlug(redirectResult.new_slug)) {
          // Get event type from the target event
          const { data: targetEvent } = await supabase
            .from("tm_tbl_events")
            .select("event_type, slug")
            .eq("id", redirectResult.event_id)
            .maybeSingle();
          
          if (targetEvent) {
            const targetPath = targetEvent.event_type === "festival"
              ? `/festival/${targetEvent.slug}`
              : `/concierto/${targetEvent.slug}`;
            
            return {
              data: null,
              canonicalSlug: targetEvent.slug,
              needsRedirect: true,
              redirectPath: targetPath,
              needsRouteCorrection: false,
              correctRoutePath: null,
            };
          }
        }
      }

      // No event and no valid redirect - throw 404
      throw new Error("Evento no encontrado");
    },
    retry: 1, // Reduce retries to speed up 404
    retryDelay: 500,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    // CRITICAL: Prevent refetch loops
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Prefetch event data on hover for instant navigation
 */
export function usePrefetchEvent() {
  const queryClient = useQueryClient();

  return (slug: string, isFestival: boolean = false) => {
    const viewName = isFestival
      ? "lovable_mv_event_product_page_festivales"
      : "lovable_mv_event_product_page_conciertos";

    queryClient.prefetchQuery({
      queryKey: ["event-product-page-optimized", slug, isFestival],
      queryFn: async () => {
        const { data } = await (supabase
          .from(viewName as any)
          .select("*") as any)
          .eq("event_slug", slug);

        return {
          data: data as unknown as EventProductPage[],
          canonicalSlug: null,
          needsRedirect: false,
          redirectPath: null,
          needsRouteCorrection: false,
          correctRoutePath: null,
        };
      },
      staleTime: 60000,
    });
  };
}
