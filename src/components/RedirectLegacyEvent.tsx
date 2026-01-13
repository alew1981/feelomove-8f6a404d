import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load Producto for normal event rendering
const Producto = lazy(() => import("@/pages/Producto"));

const PageLoader = () => (
  <div className="min-h-screen bg-background">
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="hidden md:flex gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
    <div className="pt-16">
      <Skeleton className="h-64 w-full" />
    </div>
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full max-w-2xl mb-8" />
    </div>
  </div>
);

/**
 * Detects if a slug ends with a date pattern (YYYY-MM-DD)
 * Example: "milo-j-la-vida-era-mas-corta-sevilla-2026-01-14"
 * Returns: { baseSlug: "milo-j-la-vida-era-mas-corta-sevilla", date: "2026-01-14", hasDateSuffix: true }
 */
function parseLegacySlug(slug: string): { baseSlug: string; date: string | null; hasDateSuffix: boolean } {
  // Match date pattern at the end: -YYYY-MM-DD
  const datePattern = /-(\d{4})-(\d{2})-(\d{2})$/;
  const match = slug.match(datePattern);
  
  if (match) {
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    const baseSlug = slug.replace(datePattern, '');
    return { baseSlug, date, hasDateSuffix: true };
  }
  
  return { baseSlug: slug, date: null, hasDateSuffix: false };
}

/**
 * Smart event router component that:
 * 1. Detects legacy URLs with date suffix (e.g., /concierto/event-slug-2026-01-14)
 * 2. Redirects legacy URLs to the correct current URL
 * 3. Renders the Producto page for normal event URLs
 */
const RedirectLegacyEvent = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse the slug to check if it has a date suffix
  const { baseSlug, date, hasDateSuffix } = rawSlug ? parseLegacySlug(rawSlug) : { baseSlug: '', date: null, hasDateSuffix: false };
  
  // Determine if this is a festival or concert route
  const isFestivalRoute = location.pathname.startsWith('/festival');

  // Only query if we have a legacy slug with date suffix
  const { data: eventData, isLoading, error, isFetched } = useQuery({
    queryKey: ['legacy-event-redirect', baseSlug, date],
    queryFn: async () => {
      // First, try exact match with base slug
      let query = supabase
        .from("tm_tbl_events")
        .select("event_type, slug, name, venue_city, event_date")
        .eq("slug", baseSlug);
      
      // If we have a date, also filter by date for more accuracy
      if (date) {
        query = query.gte("event_date", `${date}T00:00:00`)
                     .lte("event_date", `${date}T23:59:59`);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      
      // If we found an exact match, return it
      if (data) {
        return data;
      }
      
      // If no exact match found with date filter, try without date filter
      if (date) {
        const { data: withoutDateData } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .eq("slug", baseSlug)
          .maybeSingle();
        
        if (withoutDateData) {
          return withoutDateData;
        }
      }
      
      // Try finding an event that matches the slug pattern without the last segment (usually city)
      if (baseSlug) {
        const slugParts = baseSlug.split('-');
        
        if (slugParts.length > 2) {
          const possibleSlugWithoutCity = slugParts.slice(0, -1).join('-');
          
          let fuzzyQuery = supabase
            .from("tm_tbl_events")
            .select("event_type, slug, name, venue_city, event_date")
            .ilike("slug", `${possibleSlugWithoutCity}%`);
          
          if (date) {
            fuzzyQuery = fuzzyQuery.gte("event_date", `${date}T00:00:00`)
                                   .lte("event_date", `${date}T23:59:59`);
          }
          
          const fuzzyResult = await fuzzyQuery.limit(1).maybeSingle();
          
          if (fuzzyResult.data) {
            return fuzzyResult.data;
          }
        }
      }
      
      return null;
    },
    enabled: hasDateSuffix && !!baseSlug,
    staleTime: Infinity, // Cache indefinitely for redirects
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  useEffect(() => {
    // Only process redirects for legacy URLs with date suffix
    if (!hasDateSuffix) return;
    
    if (eventData) {
      // Redirect to the correct URL based on event type
      const isFestival = eventData.event_type === 'festival';
      const newPath = isFestival 
        ? `/festival/${eventData.slug}` 
        : `/concierto/${eventData.slug}`;
      
      // Only redirect if the path is different
      if (location.pathname !== newPath) {
        console.log(`Legacy redirect: ${location.pathname} → ${newPath}`);
        navigate(newPath, { replace: true });
      }
    } else if (isFetched && !isLoading && !eventData) {
      // No event found - redirect to search or events page
      console.warn(`Legacy redirect: No event found for legacy slug "${rawSlug}", redirecting to list page`);
      
      if (isFestivalRoute) {
        navigate('/festivales', { replace: true });
      } else {
        navigate('/conciertos', { replace: true });
      }
    }
  }, [eventData, isLoading, isFetched, navigate, location.pathname, rawSlug, isFestivalRoute, hasDateSuffix]);

  // Handle query errors for legacy redirects
  if (hasDateSuffix && error) {
    console.error('Error in legacy redirect:', error);
    navigate(isFestivalRoute ? '/festivales' : '/conciertos', { replace: true });
    return null;
  }

  // For legacy URLs, show loader while looking up the event
  if (hasDateSuffix) {
    return <PageLoader />;
  }

  // For normal URLs (no date suffix), render the Producto page directly
  return (
    <Suspense fallback={<PageLoader />}>
      <Producto />
    </Suspense>
  );
};

export default RedirectLegacyEvent;
