import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  isCleanSeoUrl,
  hasTrackingParams,
  cleanSlugClientSide,
  getCachedRedirect,
  setCachedRedirect,
  isFestivalSlug, 
  extractCityFromSlug, 
  getEventUrl
} from "@/lib/slugUtils";

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

// Redirect loader with SEO meta tags
const RedirectLoader = ({ targetUrl }: { targetUrl: string }) => (
  <>
    <Helmet>
      <meta name="prerender-status-code" content="301" />
      <meta name="prerender-header" content={`Location: ${targetUrl}`} />
      <meta name="robots" content="noindex, follow" />
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

interface EventData {
  id: string;
  slug: string;
  event_type: string;
  name: string;
  venue_city: string;
  event_date: string;
}

interface RedirectResult {
  event: EventData | null;
  needsRedirect: boolean;
  targetSlug: string | null;
  targetPath: string | null;
  source: string;
  fastPath: boolean;
}

/**
 * Optimized event router with fast-path for clean URLs
 * 
 * Execution hierarchy:
 * 1. EARLY EXIT: Clean SEO URLs pass through immediately
 * 2. CLIENT-SIDE CLEANUP: Regex cleanup before any DB queries
 * 3. CACHE CHECK: In-memory cache for common redirects
 * 4. INDEXED DB SEARCH: Only slug/event_id fields
 * 5. FUZZY SEARCH: Only as last resort
 */
const RedirectLegacyEvent = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isFestivalRoute = location.pathname.startsWith('/festival');
  const isConciertRoute = location.pathname.startsWith('/concierto');
  
  // ============================================
  // STEP 1: EARLY EXIT CHECK (NO DB QUERY)
  // ============================================
  const earlyExitResult = useMemo(() => {
    if (!rawSlug) return null;
    
    // If URL has tracking params, strip them but don't treat as redirect
    const hasTracking = hasTrackingParams(location.search);
    
    // Check if slug is already clean SEO format
    const isClean = isCleanSeoUrl(rawSlug);
    
    // Quick festival/concierto route check based on slug keywords
    const slugIsFestival = isFestivalSlug(rawSlug);
    const routeMismatch = (slugIsFestival && isConciertRoute) || (!slugIsFestival && isFestivalRoute && !slugIsFestival);
    
    if (isClean && !routeMismatch && !hasTracking) {
      // FAST PATH: Clean URL, correct route, no tracking - proceed directly
      return { 
        canFastPath: true, 
        needsRouteCorrection: false,
        cleanedSlug: rawSlug 
      };
    }
    
    // Check if route needs correction
    if (isClean && routeMismatch) {
      return {
        canFastPath: false,
        needsRouteCorrection: true,
        correctRoute: slugIsFestival ? '/festival' : '/concierto',
        cleanedSlug: rawSlug
      };
    }
    
    return null;
  }, [rawSlug, location.search, isFestivalRoute, isConciertRoute]);
  
  // ============================================
  // STEP 2: CLIENT-SIDE CLEANUP
  // ============================================
  const clientCleanup = useMemo(() => {
    if (!rawSlug) return null;
    
    const result = cleanSlugClientSide(rawSlug);
    return result;
  }, [rawSlug]);
  
  // ============================================
  // MAIN QUERY (ONLY RUNS IF NEEDED)
  // ============================================
  const { data: result, isLoading, error, isFetched } = useQuery({
    queryKey: ['event-redirect-v2', rawSlug],
    queryFn: async (): Promise<RedirectResult> => {
      if (!rawSlug) {
        return { event: null, needsRedirect: false, targetSlug: null, targetPath: null, source: 'no_slug', fastPath: false };
      }
      
      // Use cleaned slug from client-side processing
      const workingSlug = clientCleanup?.wasModified ? clientCleanup.cleanedSlug : rawSlug;
      
      // ============================================
      // STEP 3: CHECK MEMORY CACHE
      // ============================================
      const cachedRedirect = getCachedRedirect(rawSlug);
      if (cachedRedirect !== undefined) {
        if (cachedRedirect === null) {
          // Cached as "no redirect needed" - check if exact match exists
          console.log(`[Redirect] Cache hit (no redirect): ${rawSlug}`);
        } else {
          // Cached redirect found
          const targetPath = getEventUrl(cachedRedirect.new_slug, cachedRedirect.event_type);
          console.log(`[Redirect] Cache hit: ${rawSlug} → ${targetPath}`);
          return {
            event: { 
              id: cachedRedirect.event_id, 
              slug: cachedRedirect.new_slug, 
              event_type: cachedRedirect.event_type,
              name: '', venue_city: '', event_date: ''
            },
            needsRedirect: true,
            targetSlug: cachedRedirect.new_slug,
            targetPath,
            source: 'cache',
            fastPath: true
          };
        }
      }
      
      // ============================================
      // STEP 4: INDEXED DB LOOKUPS (slug, event_id only)
      // ============================================
      
      // 4a: Check slug_redirects table
      const { data: redirect } = await supabase
        .from('slug_redirects')
        .select('new_slug, event_id')
        .eq('old_slug', rawSlug)
        .maybeSingle();
      
      if (redirect) {
        // Anti-loop check
        if (redirect.new_slug === rawSlug) {
          setCachedRedirect(rawSlug, null);
        } else {
          // Single-hop: get event by ID (indexed)
          const { data: eventFromId } = await supabase
            .from('tm_tbl_events')
            .select('id, slug, event_type, name, venue_city, event_date')
            .eq('id', redirect.event_id)
            .maybeSingle();
          
          if (eventFromId) {
            const targetPath = getEventUrl(eventFromId.slug, eventFromId.event_type);
            
            // Cache the redirect
            setCachedRedirect(rawSlug, {
              new_slug: eventFromId.slug,
              event_id: eventFromId.id,
              event_type: eventFromId.event_type
            });
            
            return {
              event: eventFromId as EventData,
              needsRedirect: true,
              targetSlug: eventFromId.slug,
              targetPath,
              source: 'slug_redirects',
              fastPath: false
            };
          }
        }
      }
      
      // 4b: Check exact slug match (indexed)
      const { data: exactMatch } = await supabase
        .from('tm_tbl_events')
        .select('id, slug, event_type, name, venue_city, event_date')
        .eq('slug', workingSlug)
        .maybeSingle();
      
      if (exactMatch) {
        const isFestival = exactMatch.event_type === 'festival';
        const wrongRoute = (isFestival && isConciertRoute) || (!isFestival && isFestivalRoute);
        
        // Route type correction
        if (wrongRoute) {
          const targetPath = getEventUrl(exactMatch.slug, exactMatch.event_type);
          return {
            event: exactMatch as EventData,
            needsRedirect: true,
            targetSlug: exactMatch.slug,
            targetPath,
            source: 'route_correction',
            fastPath: false
          };
        }
        
        // Slug was cleaned - redirect to clean version
        if (clientCleanup?.wasModified) {
          const targetPath = getEventUrl(exactMatch.slug, exactMatch.event_type);
          return {
            event: exactMatch as EventData,
            needsRedirect: true,
            targetSlug: exactMatch.slug,
            targetPath,
            source: 'client_cleanup',
            fastPath: false
          };
        }
        
        // Cache as "no redirect"
        setCachedRedirect(rawSlug, null);
        
        return {
          event: exactMatch as EventData,
          needsRedirect: false,
          targetSlug: null,
          targetPath: null,
          source: 'exact_match',
          fastPath: true
        };
      }
      
      // 4c: If cleaned slug is different, try that
      if (clientCleanup?.wasModified && clientCleanup.cleanedSlug !== workingSlug) {
        const { data: cleanedMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .eq('slug', clientCleanup.cleanedSlug)
          .maybeSingle();
        
        if (cleanedMatch) {
          const targetPath = getEventUrl(cleanedMatch.slug, cleanedMatch.event_type);
          return {
            event: cleanedMatch as EventData,
            needsRedirect: true,
            targetSlug: cleanedMatch.slug,
            targetPath,
            source: 'cleaned_slug_match',
            fastPath: false
          };
        }
      }
      
      // ============================================
      // STEP 5: LIGHTWEIGHT FUZZY SEARCH (ONLY IF NEEDED)
      // ============================================
      const city = extractCityFromSlug(workingSlug);
      
      if (city) {
        // Extract artist part (everything before city)
        const slugLower = workingSlug.toLowerCase();
        const cityIndex = slugLower.lastIndexOf(`-${city}`);
        const artistPart = cityIndex > 0 ? workingSlug.substring(0, cityIndex) : null;
        
        if (artistPart && artistPart.length >= 3) {
          // Search by slug prefix (indexed via LIKE with prefix)
          const { data: artistMatch } = await supabase
            .from('tm_tbl_events')
            .select('id, slug, event_type, name, venue_city, event_date')
            .ilike('slug', `${artistPart}-${city}%`)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (artistMatch) {
            const targetPath = getEventUrl(artistMatch.slug, artistMatch.event_type);
            
            // Cache the result
            setCachedRedirect(rawSlug, {
              new_slug: artistMatch.slug,
              event_id: artistMatch.id,
              event_type: artistMatch.event_type
            });
            
            return {
              event: artistMatch as EventData,
              needsRedirect: true,
              targetSlug: artistMatch.slug,
              targetPath,
              source: 'artist_city_prefix',
              fastPath: false
            };
          }
        }
      }
      
      // Last resort: prefix search with first 2-3 parts
      const slugParts = workingSlug.split('-');
      if (slugParts.length >= 2) {
        const prefix = slugParts.slice(0, Math.min(3, slugParts.length)).join('-');
        
        const { data: prefixMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .ilike('slug', `${prefix}%`)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (prefixMatch) {
          const targetPath = getEventUrl(prefixMatch.slug, prefixMatch.event_type);
          return {
            event: prefixMatch as EventData,
            needsRedirect: true,
            targetSlug: prefixMatch.slug,
            targetPath,
            source: 'prefix_fallback',
            fastPath: false
          };
        }
      }
      
      // Event not found
      console.log(`[Redirect] Not found: ${rawSlug}`);
      return { event: null, needsRedirect: false, targetSlug: null, targetPath: null, source: 'not_found', fastPath: false };
    },
    // Skip query if early exit is possible
    enabled: !!rawSlug && !earlyExitResult?.canFastPath,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });

  // ============================================
  // NAVIGATION EFFECTS
  // ============================================
  
  // Handle route correction from early exit
  useEffect(() => {
    if (earlyExitResult?.needsRouteCorrection && earlyExitResult.correctRoute && rawSlug) {
      const targetPath = `${earlyExitResult.correctRoute}/${rawSlug}`;
      navigate(targetPath, { replace: true });
    }
  }, [earlyExitResult, rawSlug, navigate]);
  
  // Handle query results
  useEffect(() => {
    if (earlyExitResult?.canFastPath) return; // Fast path, no redirect needed
    if (isLoading || !isFetched) return;
    
    if (result?.needsRedirect && result.targetPath) {
      navigate(result.targetPath, { replace: true });
      return;
    }
    
    if (!result?.event && isFetched && result?.source === 'not_found') {
      const slugLooksFestival = rawSlug ? isFestivalSlug(rawSlug) : false;
      navigate(isFestivalRoute || slugLooksFestival ? '/festivales' : '/conciertos', { replace: true });
    }
  }, [result, isLoading, isFetched, navigate, rawSlug, isFestivalRoute, earlyExitResult]);

  // ============================================
  // RENDER
  // ============================================
  
  if (error) {
    console.error('Event redirect error:', error);
    navigate(isFestivalRoute ? '/festivales' : '/conciertos', { replace: true });
    return null;
  }

  // FAST PATH: Clean URL with correct route - render immediately
  if (earlyExitResult?.canFastPath) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Producto />
      </Suspense>
    );
  }
  
  // Waiting for route correction
  if (earlyExitResult?.needsRouteCorrection) {
    return <PageLoader />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  // Event found with no redirect needed
  if (result?.event && !result.needsRedirect) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Producto />
      </Suspense>
    );
  }

  // Redirect in progress
  if (result?.needsRedirect && result.targetPath) {
    const targetUrl = `https://feelomove.com${result.targetPath}`;
    return <RedirectLoader targetUrl={targetUrl} />;
  }

  // Fallback
  return (
    <Suspense fallback={<PageLoader />}>
      <Producto />
    </Suspense>
  );
};

export default RedirectLegacyEvent;