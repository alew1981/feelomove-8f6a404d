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
  notFound: boolean; // CRITICAL: Flag for graceful 404 handling without throwing
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
        // IMPORTANT: festival MV rows may not include event_type. Infer from the MV being queried.
        const shouldBeFestival =
          viewName === "lovable_mv_event_product_page_festivales"
            ? true
            : viewName === "lovable_mv_event_product_page_conciertos"
              ? false
              : eventType === "festival";
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
            notFound: false,
          };
        }

        return {
          data: data as unknown as EventProductPage[],
          canonicalSlug: null,
          needsRedirect: false,
          redirectPath: null,
          needsRouteCorrection: false,
          correctRoutePath: null,
          notFound: false,
        };
      }

      // Event not found in primary view - check alternate view for route correction
      // This handles cases like accessing /concierto/x when event is actually a festival
      const alternateViewName: ViewName = isFestivalRoute 
        ? "lovable_mv_event_product_page_conciertos"
        : "lovable_mv_event_product_page_festivales";
      
      const { data: alternateData } = await (supabase
        .from(alternateViewName as any)
        .select("*") as any)
        .eq("event_slug", slug);
      
      if (alternateData && alternateData.length > 0) {
        // Found in alternate view - needs route correction
        const shouldBeFestival = alternateViewName === "lovable_mv_event_product_page_festivales";
        return {
          data: alternateData as unknown as EventProductPage[],
          canonicalSlug: null,
          needsRedirect: false,
          redirectPath: null,
          needsRouteCorrection: true,
          correctRoutePath: shouldBeFestival
            ? `/festival/${slug}`
            : `/concierto/${slug}`,
          notFound: false,
        };
      }

      // Event not found in either view - check if it's a redirect case
      // OPTIMIZATION: Run redirect check only if event not found directly
      // CRITICAL: Use event_id to get current slug, NOT new_slug (which may be outdated)
      const { data: redirectResult } = await supabase
        .from("slug_redirects")
        .select("event_id")
        .eq("old_slug", slug)
        .maybeSingle();

      if (redirectResult?.event_id) {
        // Get current event data by ID (single-hop redirect)
        const { data: targetEvent } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug")
          .eq("id", redirectResult.event_id)
          .maybeSingle();
        
        if (targetEvent?.slug && targetEvent.slug !== slug) {
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
            notFound: false,
          };
        }
      }

      // CRITICAL SEO: Semantic search - if slug not found exactly, search partial match
      // This prevents 404s when users arrive with partial/incorrect URLs
      const partialSlug = slug.split('-').slice(0, 3).join('-'); // First 3 segments (e.g., "artista-ciudad")
      
      const { data: partialMatch } = await (supabase
        .from(viewName as any)
        .select("event_slug, event_type") as any)
        .ilike("event_slug", `${partialSlug}%`)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(1);
      
      if (partialMatch && partialMatch.length > 0) {
        const matchedSlug = partialMatch[0].event_slug;
        const matchedType = partialMatch[0].event_type;
        
        if (matchedSlug && matchedSlug !== slug) {
          console.log(`[SEO] Partial match redirect: ${slug} → ${matchedSlug}`);
          const targetPath = matchedType === "festival" || isFestivalRoute
            ? `/festival/${matchedSlug}`
            : `/concierto/${matchedSlug}`;
          
          return {
            data: null,
            canonicalSlug: matchedSlug,
            needsRedirect: true,
            redirectPath: targetPath,
            needsRouteCorrection: false,
            correctRoutePath: null,
            notFound: false,
          };
        }
      }

      // CRITICAL SEO: No event found - return notFound flag instead of throwing
      // This allows the component to handle the redirect gracefully to /conciertos
      console.log(`[SEO] Event not found: ${slug} - will redirect to listing`);
      return {
        data: null,
        canonicalSlug: null,
        needsRedirect: false,
        redirectPath: null,
        needsRouteCorrection: false,
        correctRoutePath: null,
        notFound: true,
      };
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
          notFound: !data || data.length === 0,
        };
      },
      staleTime: 60000,
    });
  };
}
