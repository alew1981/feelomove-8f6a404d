import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load Producto for normal event rendering
const Producto = lazy(() => import("@/pages/Producto"));

// Minimal loader for normal page loading
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

// Minimal redirect loader with SEO meta tags for crawlers
const RedirectLoader = ({ targetUrl }: { targetUrl: string }) => (
  <>
    <Helmet>
      {/* Signal to prerender services this is a 301 redirect */}
      <meta name="prerender-status-code" content="301" />
      <meta name="prerender-header" content={`Location: ${targetUrl}`} />
      {/* Tell crawlers not to index this redirect page */}
      <meta name="robots" content="noindex, follow" />
      {/* Canonical pointing to target */}
      <link rel="canonical" href={targetUrl} />
    </Helmet>
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">Redirigiendo...</p>
      </div>
    </div>
  </>
);

/**
 * Detects if a slug ends with problematic date patterns:
 * 1. Full date: -YYYY-MM-DD (e.g., "event-slug-2026-01-14")
 * 2. Year only: -YYYY (e.g., "event-slug-2026")
 * 3. Placeholder year: -9999 (e.g., "event-slug-9999")
 * 4. Placeholder date parts: -9999-12-31 or similar
 * 
 * Example: "milo-j-la-vida-era-mas-corta-sevilla-2026-01-14"
 * Returns: { baseSlug: "milo-j-la-vida-era-mas-corta-sevilla", date: "2026-01-14", hasLegacySuffix: true }
 * 
 * Example: "matinee-easter-weekend-pervert-barcelona-2026"
 * Returns: { baseSlug: "matinee-easter-weekend-pervert-barcelona", date: null, hasLegacySuffix: true, isYearOnly: true }
 */
function parseLegacySlug(slug: string): { baseSlug: string; date: string | null; hasLegacySuffix: boolean; isPlaceholderDate: boolean; isYearOnly: boolean } {
  // First check for placeholder year suffix: -9999 (with or without date parts)
  // Match: -9999, -9999-12, -9999-12-31
  const placeholderPattern = /-9999(-\d{2})?(-\d{2})?$/;
  if (placeholderPattern.test(slug)) {
    const baseSlug = slug.replace(placeholderPattern, '');
    return { baseSlug, date: null, hasLegacySuffix: true, isPlaceholderDate: true, isYearOnly: false };
  }
  
  // Match full date pattern at the end: -YYYY-MM-DD
  const fullDatePattern = /-(\d{4})-(\d{2})-(\d{2})$/;
  const fullDateMatch = slug.match(fullDatePattern);
  
  if (fullDateMatch) {
    const date = `${fullDateMatch[1]}-${fullDateMatch[2]}-${fullDateMatch[3]}`;
    const baseSlug = slug.replace(fullDatePattern, '');
    return { baseSlug, date, hasLegacySuffix: true, isPlaceholderDate: false, isYearOnly: false };
  }
  
  // Match year-only pattern at the end: -YYYY (where YYYY is 2020-2099)
  const yearOnlyPattern = /-(20[2-9]\d)$/;
  const yearOnlyMatch = slug.match(yearOnlyPattern);
  
  if (yearOnlyMatch) {
    const baseSlug = slug.replace(yearOnlyPattern, '');
    return { baseSlug, date: null, hasLegacySuffix: true, isPlaceholderDate: false, isYearOnly: true };
  }
  
  return { baseSlug: slug, date: null, hasLegacySuffix: false, isPlaceholderDate: false, isYearOnly: false };
}

/**
 * Smart event router component that:
 * 1. First checks if the EXACT slug exists in the database
 * 2. Only if not found, checks for legacy date suffixes and redirects
 * 3. Renders the Producto page for valid event URLs
 */
const RedirectLegacyEvent = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse the slug to check if it has a potential legacy date suffix or placeholder
  const parsedSlug = rawSlug ? parseLegacySlug(rawSlug) : { baseSlug: '', date: null, hasLegacySuffix: false, isPlaceholderDate: false, isYearOnly: false };
  
  // Determine if this is a festival or concert route
  const isFestivalRoute = location.pathname.startsWith('/festival');

  // Query to check if the EXACT slug exists first, then handle legacy redirects
  const { data: eventData, isLoading, error, isFetched } = useQuery({
    queryKey: ['event-redirect-check', rawSlug],
    queryFn: async () => {
      if (!rawSlug) return null;
      
      // STEP 1: Check if the EXACT slug exists in the database
      const { data: exactMatch, error: exactError } = await supabase
        .from("tm_tbl_events")
        .select("event_type, slug, name, venue_city, event_date")
        .eq("slug", rawSlug)
        .maybeSingle();
      
      if (exactError) throw exactError;
      
      // If exact match found, return it with a flag indicating no redirect needed
      if (exactMatch) {
        return { ...exactMatch, needsRedirect: false, isExactMatch: true };
      }
      
      // STEP 2: If no exact match and slug has legacy suffix, try to find the base event
      const { baseSlug, date, hasLegacySuffix, isPlaceholderDate, isYearOnly } = parsedSlug;
      
      if (!hasLegacySuffix || !baseSlug) {
        // No legacy suffix pattern detected and no exact match - event doesn't exist
        return null;
      }
      
      // Try to find event with the base slug (without date/year suffix)
      let query = supabase
        .from("tm_tbl_events")
        .select("event_type, slug, name, venue_city, event_date")
        .eq("slug", baseSlug);
      
      // If we have a full date (not placeholder and not year-only), also filter by date
      if (date && !isPlaceholderDate && !isYearOnly) {
        query = query.gte("event_date", `${date}T00:00:00`)
                     .lte("event_date", `${date}T23:59:59`);
      }
      
      const { data, error: baseError } = await query.maybeSingle();
      
      if (baseError) throw baseError;
      
      if (data) {
        return { ...data, needsRedirect: true, isExactMatch: false };
      }
      
      // Try without date filter if we had one
      if (date && !isPlaceholderDate && !isYearOnly) {
        const { data: withoutDateData } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .eq("slug", baseSlug)
          .maybeSingle();
        
        if (withoutDateData) {
          return { ...withoutDateData, needsRedirect: true, isExactMatch: false };
        }
      }
      
      // Try fuzzy match as last resort
      if (baseSlug) {
        const slugParts = baseSlug.split('-');
        
        if (slugParts.length > 2) {
          const possibleSlugWithoutCity = slugParts.slice(0, -1).join('-');
          
          let fuzzyQuery = supabase
            .from("tm_tbl_events")
            .select("event_type, slug, name, venue_city, event_date")
            .ilike("slug", `${possibleSlugWithoutCity}%`);
          
          if (date && !isPlaceholderDate && !isYearOnly) {
            fuzzyQuery = fuzzyQuery.gte("event_date", `${date}T00:00:00`)
                                   .lte("event_date", `${date}T23:59:59`);
          }
          
          const fuzzyResult = await fuzzyQuery.limit(1).maybeSingle();
          
          if (fuzzyResult.data) {
            return { ...fuzzyResult.data, needsRedirect: true, isExactMatch: false };
          }
        }
      }
      
      return null;
    },
    enabled: !!rawSlug,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    // Wait for data to be fetched
    if (isLoading) return;
    
    if (eventData) {
      // If exact match found, check if we need to redirect due to wrong route type
      if (eventData.isExactMatch) {
        const isFestival = eventData.event_type === 'festival';
        const expectedPath = isFestival 
          ? `/festival/${eventData.slug}` 
          : `/concierto/${eventData.slug}`;
        
        // Redirect only if wrong route type (e.g., concert on /festival route)
        if (location.pathname !== expectedPath) {
          console.log(`Route type redirect: ${location.pathname} → ${expectedPath}`);
          navigate(expectedPath, { replace: true });
        }
        return;
      }
      
      // Legacy URL - needs redirect to the correct slug
      if (eventData.needsRedirect) {
        const isFestival = eventData.event_type === 'festival';
        const newPath = isFestival 
          ? `/festival/${eventData.slug}` 
          : `/concierto/${eventData.slug}`;
        
        console.log(`Legacy redirect: ${location.pathname} → ${newPath}`);
        navigate(newPath, { replace: true });
      }
    } else if (isFetched && !eventData) {
      // No event found - redirect to list page based on current route
      console.warn(`Event not found: "${rawSlug}", redirecting to list page`);
      
      if (isFestivalRoute) {
        navigate('/festivales', { replace: true });
      } else {
        navigate('/conciertos', { replace: true });
      }
    }
  }, [eventData, isLoading, isFetched, navigate, location.pathname, rawSlug, isFestivalRoute]);

  // Handle query errors
  if (error) {
    console.error('Event redirect error:', error);
    navigate(isFestivalRoute ? '/festivales' : '/conciertos', { replace: true });
    return null;
  }

  // If still loading, show loader
  if (isLoading) {
    return <PageLoader />;
  }

  // If event found with exact match and correct route, render Producto directly
  if (eventData?.isExactMatch) {
    const isFestival = eventData.event_type === 'festival';
    const expectedPath = isFestival ? `/festival/${eventData.slug}` : `/concierto/${eventData.slug}`;
    
    // Only render if on correct route
    if (location.pathname === expectedPath) {
      return (
        <Suspense fallback={<PageLoader />}>
          <Producto />
        </Suspense>
      );
    }
  }

  // For legacy URLs that need redirect, show redirect loader with SEO meta tags
  if (eventData?.needsRedirect) {
    const isFestival = eventData.event_type === 'festival';
    const targetPath = isFestival ? `/festival/${eventData.slug}` : `/concierto/${eventData.slug}`;
    const targetUrl = `https://feelomove.com${targetPath}`;
    
    return <RedirectLoader targetUrl={targetUrl} />;
  }

  // Default: render Producto (for cases where exact match exists but redirect hasn't happened yet)
  return (
    <Suspense fallback={<PageLoader />}>
      <Producto />
    </Suspense>
  );
};

export default RedirectLegacyEvent;
