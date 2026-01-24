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

      // OPTIMIZATION: Run redirect check and type check in PARALLEL
      const [redirectResult, typeCheckResult] = await Promise.all([
        // Check slug_redirects
        supabase
          .from("slug_redirects")
          .select("new_slug")
          .eq("old_slug", slug)
          .maybeSingle()
          .then(({ data }) => data),
        
        // Check event type for route correction
        supabase
          .from("tm_tbl_events")
          .select("event_type, slug")
          .eq("slug", slug)
          .maybeSingle()
          .then(({ data }) => data),
      ]);

      // Handle redirect if needed
      const isPlaceholderSlug = (s: string) => /-9999(-\d{2})?(-\d{2})?$/.test(s);
      
      if (redirectResult?.new_slug && redirectResult.new_slug !== slug) {
        if (!isPlaceholderSlug(redirectResult.new_slug)) {
          const redirectPath = isFestivalRoute
            ? `/festival/${redirectResult.new_slug}`
            : `/concierto/${redirectResult.new_slug}`;
          
          return {
            data: null,
            canonicalSlug: redirectResult.new_slug,
            needsRedirect: true,
            redirectPath,
            needsRouteCorrection: false,
            correctRoutePath: null,
          };
        }
      }

      // Handle route type correction
      if (typeCheckResult?.event_type) {
        const shouldBeFestival = typeCheckResult.event_type === "festival";
        const isWrongRoute = shouldBeFestival ? !isFestivalRoute : !isConcierto;

        if (isWrongRoute) {
          const correctPath = shouldBeFestival
            ? `/festival/${typeCheckResult.slug}`
            : `/concierto/${typeCheckResult.slug}`;
          
          return {
            data: null,
            canonicalSlug: null,
            needsRedirect: false,
            redirectPath: null,
            needsRouteCorrection: true,
            correctRoutePath: correctPath,
          };
        }
      }

      // Select appropriate view
      const viewName: ViewName = isFestivalRoute
        ? "lovable_mv_event_product_page_festivales"
        : isConcierto
          ? "lovable_mv_event_product_page_conciertos"
          : "lovable_mv_event_product_page";

      // OPTIMIZATION: Direct query to the correct view
      const { data, error } = await supabase
        .from(viewName)
        .select("*")
        .eq("event_slug", slug);

      if (error) {
        console.error(`Supabase error in ${viewName}:`, error);
        throw new Error("Error al cargar el evento");
      }

      if (data && data.length > 0) {
        return {
          data: data as unknown as EventProductPage[],
          canonicalSlug: null,
          needsRedirect: false,
          redirectPath: null,
          needsRouteCorrection: false,
          correctRoutePath: null,
        };
      }

      // Fallback: Check reverse redirect (new_slug -> old_slug in view)
      const { data: reverseRedirect } = await supabase
        .from("slug_redirects")
        .select("old_slug")
        .eq("new_slug", slug)
        .limit(1);

      if (reverseRedirect && reverseRedirect.length > 0) {
        const oldSlug = reverseRedirect[0].old_slug;
        const { data: fallbackData } = await supabase
          .from(viewName)
          .select("*")
          .eq("event_slug", oldSlug);

        if (fallbackData && fallbackData.length > 0) {
          return {
            data: fallbackData as unknown as EventProductPage[],
            canonicalSlug: slug, // Keep the clean slug as canonical
            needsRedirect: false,
            redirectPath: null,
            needsRouteCorrection: false,
            correctRoutePath: null,
          };
        }
      }

      throw new Error("Evento no encontrado");
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
    staleTime: 60000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
        const { data } = await supabase
          .from(viewName)
          .select("*")
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
