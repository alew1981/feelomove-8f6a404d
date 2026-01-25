import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  isCleanSeoUrl,
  hasNoisePatterns,
  hasTrackingParams,
  cleanSlugClientSide,
  getCachedRedirect,
  setCachedRedirect,
  isFestivalSlug, 
  extractCityFromSlug, 
  getEventUrl,
  isHighTrafficArtist
} from "@/lib/slugUtils";

// Lazy load Producto for normal event rendering
const Producto = lazy(() => import("@/pages/Producto"));

// Minimal loader for normal page loading with STATIC meta tags for SEO
const PageLoader = ({ slug, isFestival }: { slug?: string; isFestival?: boolean }) => {
  // Generate static meta tags from slug (without DB query) for initial render
  const slugParts = slug?.split('-') || [];
  const artistName = slugParts.slice(0, -4).join(' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Evento';
  const city = slugParts[slugParts.length - 4]?.replace(/\b\w/g, c => c.toUpperCase()) || '';
  const staticTitle = city 
    ? `${artistName} en ${city} - Entradas y Hotel | FEELOMOVE+`
    : `${artistName} - Entradas y Hotel | FEELOMOVE+`;
  const staticDescription = city
    ? `Compra entradas para ${artistName} en ${city}. Reserva tu pack de entradas + hotel con Feelomove+.`
    : `Compra entradas para ${artistName}. Reserva tu pack de entradas + hotel con Feelomove+.`;

  return (
    <>
      {/* CRITICAL: Static meta tags from first render for SEO bots */}
      <Helmet>
        <title>{staticTitle}</title>
        <meta name="description" content={staticDescription} />
        <meta property="og:title" content={staticTitle} />
        <meta property="og:description" content={staticDescription} />
        <meta name="robots" content="index, follow" />
      </Helmet>
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
    </>
  );
};

// Redirect loader with SEO meta tags for 301
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
}

// Timeout for redirect lookup (500ms)
const REDIRECT_TIMEOUT = 500;

/**
 * Optimized event router with priority interception for dirty URLs
 * 
 * CRITICAL EXECUTION ORDER:
 * 1. INTERCEPT: If slug has noise patterns, START redirect immediately
 * 2. EARLY EXIT: Clean SEO URLs pass through directly
 * 3. CLIENT-SIDE CLEANUP: Regex cleanup before any DB queries
 * 4. CACHE CHECK: In-memory cache for common redirects
 * 5. INDEXED DB SEARCH: Only slug/event_id fields
 * 6. FUZZY SEARCH: Artist + city prefix search
 * 7. TIMEOUT FALLBACK: If >500ms, redirect to artist search page
 */
const RedirectLegacyEvent = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const hasNavigatedRef = useRef(false);
  
  const isFestivalRoute = location.pathname.startsWith('/festival');
  const isConciertRoute = location.pathname.startsWith('/concierto');
  const fullUrl = `${location.pathname}${location.search}`;
  
  // Debug logging
  useEffect(() => {
    console.log(`[SEO Debug] Entrada: ${fullUrl}`);
    startTimeRef.current = Date.now();
    hasNavigatedRef.current = false;
  }, [fullUrl]);

  // ============================================
  // STEP 1: PRIORITY INTERCEPTION CHECK
  // Runs BEFORE any render - checks if URL must be redirected
  // ============================================
  const interceptCheck = useMemo(() => {
    if (!rawSlug) return { shouldIntercept: false, cleanedData: null };
    
    // CRITICAL: Check for noise patterns FIRST
    const hasNoise = hasNoisePatterns(rawSlug);
    
    if (hasNoise) {
      console.log(`[SEO Debug] INTERCEPTING noisy URL: ${rawSlug}`);
      const cleanedData = cleanSlugClientSide(rawSlug);
      return { 
        shouldIntercept: true, 
        cleanedData,
        reason: 'noise_patterns'
      };
    }
    
    // Check for numeric suffix
    if (/-\d{1,2}$/.test(rawSlug) && !/-20[2-9]\d$/.test(rawSlug)) {
      console.log(`[SEO Debug] INTERCEPTING numeric suffix: ${rawSlug}`);
      const cleanedData = cleanSlugClientSide(rawSlug);
      return { 
        shouldIntercept: true, 
        cleanedData,
        reason: 'numeric_suffix'
      };
    }
    
    return { shouldIntercept: false, cleanedData: null };
  }, [rawSlug]);

  // ============================================
  // STEP 2: EARLY EXIT CHECK (FAST PATH)
  // CRITICAL FIX: Do NOT redirect if slug looks valid - let Producto handle 404
  // ============================================
  const earlyExitResult = useMemo(() => {
    if (!rawSlug) return null;
    
    // CRITICAL: If URL has noise patterns, we MUST intercept (handled above)
    if (interceptCheck.shouldIntercept) return null;
    
    // Check if slug is already clean SEO format (ends with year pattern)
    const isClean = isCleanSeoUrl(rawSlug);
    
    // Check route type for festival/concierto mismatch
    const slugIsFestival = isFestivalSlug(rawSlug);
    const routeMismatch = (slugIsFestival && isConciertRoute) || (!slugIsFestival && isFestivalRoute);
    
    // STABILITY FIX: Clean URLs go directly to Producto - NO redirect queries
    // Producto will handle 404 if event doesn't exist in DB
    if (isClean && !routeMismatch) {
      console.log(`[SEO Debug] FAST PATH: Clean URL, rendering Producto directly (no redirect check)`);
      return { 
        canFastPath: true, 
        needsRouteCorrection: false,
        cleanedSlug: rawSlug 
      };
    }
    
    // Route type mismatch (festival in /concierto or vice versa) - redirect silently
    if (isClean && routeMismatch) {
      console.log(`[SEO Debug] Route correction: ${slugIsFestival ? '/festival' : '/concierto'}`);
      return {
        canFastPath: false,
        needsRouteCorrection: true,
        correctRoute: slugIsFestival ? '/festival' : '/concierto',
        cleanedSlug: rawSlug
      };
    }
    
    // Not clean - need to query for redirect
    return null;
  }, [rawSlug, isFestivalRoute, isConciertRoute, interceptCheck.shouldIntercept]);

  // ============================================
  // MAIN QUERY - Only runs for intercepted or unclear URLs
  // ============================================
  const shouldQuery = !!rawSlug && !earlyExitResult?.canFastPath;
  
  const { data: result, isLoading, error, isFetched } = useQuery({
    queryKey: ['event-redirect-v3', rawSlug],
    queryFn: async (): Promise<RedirectResult> => {
      if (!rawSlug) {
        return { event: null, needsRedirect: false, targetSlug: null, targetPath: null, source: 'no_slug' };
      }
      
      console.log(`[SEO Debug] Starting redirect lookup for: ${rawSlug}`);
      
      // Use cleaned slug from interception or do cleanup now
      const cleanedData = interceptCheck.cleanedData || cleanSlugClientSide(rawSlug);
      const workingSlug = cleanedData.wasModified ? cleanedData.cleanedSlug : rawSlug;
      
      // ============================================
      // STEP 3: CHECK MEMORY CACHE
      // ============================================
      const cachedRedirect = getCachedRedirect(rawSlug);
      if (cachedRedirect !== undefined) {
        if (cachedRedirect === null) {
          console.log(`[SEO Debug] Cache hit (no redirect needed): ${rawSlug}`);
          // Still check if slug was modified
          if (cleanedData.wasModified) {
            // Need to find the event with cleaned slug
          } else {
            // Return as-is - will be handled by exact match below
          }
        } else {
          const targetPath = getEventUrl(cachedRedirect.new_slug, cachedRedirect.event_type);
          console.log(`[SEO Debug] Cache hit, redirigiendo a: ${targetPath}`);
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
            source: 'cache'
          };
        }
      }
      
      // ============================================
      // STEP 4: CHECK slug_redirects TABLE
      // ============================================
      const { data: redirect } = await supabase
        .from('slug_redirects')
        .select('new_slug, event_id')
        .eq('old_slug', rawSlug)
        .maybeSingle();
      
      if (redirect) {
        // Anti-loop: if old_slug === new_slug, don't redirect
        if (redirect.new_slug === rawSlug) {
          console.log(`[SEO Debug] Anti-loop: slug redirects to itself, skipping`);
          setCachedRedirect(rawSlug, null);
        } else {
          // SINGLE-HOP: ALWAYS get event by ID to get CURRENT canonical slug
          // This prevents using stale/dirty new_slug values from the redirect table
          const { data: eventFromId } = await supabase
            .from('tm_tbl_events')
            .select('id, slug, event_type, name, venue_city, event_date')
            .eq('id', redirect.event_id)
            .maybeSingle();
          
          if (eventFromId) {
            // CRITICAL: Use event's current slug, NOT the new_slug from redirect table
            // The event table slug is the source of truth
            const canonicalSlug = eventFromId.slug;
            
            // Double-check: if event's slug is STILL dirty, clean it
            const isEventSlugClean = !hasNoisePatterns(canonicalSlug);
            const finalSlug = isEventSlugClean ? canonicalSlug : cleanSlugClientSide(canonicalSlug).cleanedSlug;
            
            // If final slug equals original, we found a loop - skip
            if (finalSlug === rawSlug) {
              console.log(`[SEO Debug] Anti-loop: cleaned slug equals original, skipping redirect`);
              setCachedRedirect(rawSlug, null);
            } else {
              const targetPath = getEventUrl(finalSlug, eventFromId.event_type);
              console.log(`[SEO Debug] Found via slug_redirects (event_id lookup), redirigiendo a: ${targetPath}`);
              
              setCachedRedirect(rawSlug, {
                new_slug: finalSlug,
                event_id: eventFromId.id,
                event_type: eventFromId.event_type
              });
              
              return {
                event: { ...eventFromId, slug: finalSlug } as EventData,
                needsRedirect: true,
                targetSlug: finalSlug,
                targetPath,
                source: 'slug_redirects'
              };
            }
          }
        }
      }
      
      // ============================================
      // STEP 5: EXACT SLUG MATCH (indexed)
      // ============================================
      const { data: exactMatch } = await supabase
        .from('tm_tbl_events')
        .select('id, slug, event_type, name, venue_city, event_date')
        .eq('slug', workingSlug)
        .maybeSingle();
      
      if (exactMatch) {
        const isFestival = exactMatch.event_type === 'festival' || isFestivalSlug(exactMatch.slug);
        const wrongRoute = (isFestival && isConciertRoute) || (!isFestival && isFestivalRoute);
        
        // Route type correction
        if (wrongRoute) {
          const targetPath = getEventUrl(exactMatch.slug, exactMatch.event_type);
          console.log(`[SEO Debug] Route correction, redirigiendo a: ${targetPath}`);
          return {
            event: exactMatch as EventData,
            needsRedirect: true,
            targetSlug: exactMatch.slug,
            targetPath,
            source: 'route_correction'
          };
        }
        
        // Slug was cleaned - redirect to clean version
        if (cleanedData.wasModified) {
          const targetPath = getEventUrl(exactMatch.slug, exactMatch.event_type);
          console.log(`[SEO Debug] Cleaned slug match, redirigiendo a: ${targetPath}`);
          return {
            event: exactMatch as EventData,
            needsRedirect: true,
            targetSlug: exactMatch.slug,
            targetPath,
            source: 'client_cleanup'
          };
        }
        
        // Cache as "no redirect needed"
        setCachedRedirect(rawSlug, null);
        console.log(`[SEO Debug] Exact match found, no redirect needed`);
        
        return {
          event: exactMatch as EventData,
          needsRedirect: false,
          targetSlug: null,
          targetPath: null,
          source: 'exact_match'
        };
      }
      
      // ============================================
      // STEP 6: CLEANED SLUG MATCH
      // ============================================
      if (cleanedData.wasModified && cleanedData.cleanedSlug !== workingSlug) {
        const { data: cleanedMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .eq('slug', cleanedData.cleanedSlug)
          .maybeSingle();
        
        if (cleanedMatch) {
          const targetPath = getEventUrl(cleanedMatch.slug, cleanedMatch.event_type);
          console.log(`[SEO Debug] Cleaned slug match, redirigiendo a: ${targetPath}`);
          return {
            event: cleanedMatch as EventData,
            needsRedirect: true,
            targetSlug: cleanedMatch.slug,
            targetPath,
            source: 'cleaned_slug_match'
          };
        }
      }
      
      // ============================================
      // STEP 7: ARTIST + CITY FUZZY SEARCH
      // ============================================
      const city = cleanedData.citySlug || extractCityFromSlug(workingSlug);
      const artistPart = cleanedData.artistSlug;
      
      if (artistPart && city && artistPart.length >= 3) {
        console.log(`[SEO Debug] Fuzzy search: artist=${artistPart}, city=${city}`);
        
        // Search by artist prefix + city
        const { data: artistMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .ilike('slug', `${artistPart}%${city}%`)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (artistMatch) {
          const targetPath = getEventUrl(artistMatch.slug, artistMatch.event_type);
          console.log(`[SEO Debug] Artist+city match, redirigiendo a: ${targetPath}`);
          
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
            source: 'artist_city_search'
          };
        }
      }
      
      // ============================================
      // STEP 8: PREFIX FALLBACK SEARCH
      // ============================================
      const slugParts = workingSlug.split('-');
      if (slugParts.length >= 2) {
        const prefix = slugParts.slice(0, Math.min(4, slugParts.length)).join('-');
        
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
          console.log(`[SEO Debug] Prefix match, redirigiendo a: ${targetPath}`);
          return {
            event: prefixMatch as EventData,
            needsRedirect: true,
            targetSlug: prefixMatch.slug,
            targetPath,
            source: 'prefix_fallback'
          };
        }
      }
      
      // Event not found
      console.log(`[SEO Debug] No match found for: ${rawSlug}`);
      return { 
        event: null, 
        needsRedirect: false, 
        targetSlug: null, 
        targetPath: null, 
        source: 'not_found' 
      };
    },
    enabled: shouldQuery,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    // CRITICAL: Prevent refetch loops
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // ============================================
  // TIMEOUT FALLBACK (500ms) - ONLY for intercepted URLs
  // STABILITY FIX: Clean URLs skip this entirely
  // ============================================
  useEffect(() => {
    // Exit conditions to prevent loops
    if (!shouldQuery) return;
    if (!rawSlug) return;
    if (hasNavigatedRef.current) return;
    if (!interceptCheck.shouldIntercept) return; // Only timeout for dirty URLs
    
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= REDIRECT_TIMEOUT && isLoading && !hasNavigatedRef.current) {
        console.log(`[SEO Debug] TIMEOUT (${elapsed}ms), fallback to Producto`);
        hasNavigatedRef.current = true;
        
        // STABILITY FIX: Don't redirect on timeout - just render Producto
        // This prevents PageSpeed from getting stuck in redirect loops
      }
    }, REDIRECT_TIMEOUT);
    
    return () => clearTimeout(timeout);
  }, [shouldQuery, rawSlug, isLoading, interceptCheck.shouldIntercept]);

  // ============================================
  // NAVIGATION EFFECTS
  // ============================================
  
  // Handle route correction from early exit
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    
    if (earlyExitResult?.needsRouteCorrection && earlyExitResult.correctRoute && rawSlug) {
      const targetPath = `${earlyExitResult.correctRoute}/${rawSlug}`;
      console.log(`[SEO Debug] Route correction, redirigiendo a: ${targetPath}`);
      hasNavigatedRef.current = true;
      navigate(targetPath, { replace: true });
    }
  }, [earlyExitResult, rawSlug, navigate]);
  
  // Handle query results
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (earlyExitResult?.canFastPath) return;
    if (isLoading || !isFetched) return;
    
    if (result?.needsRedirect && result.targetPath) {
      console.log(`[SEO Debug] Navigating to: ${result.targetPath}`);
      hasNavigatedRef.current = true;
      navigate(result.targetPath, { replace: true });
      return;
    }
    
    if (!result?.event && isFetched && result?.source === 'not_found') {
      console.log(`[SEO Debug] Event not found, redirecting to listing`);
      hasNavigatedRef.current = true;
      const slugLooksFestival = rawSlug ? isFestivalSlug(rawSlug) : false;
      navigate(isFestivalRoute || slugLooksFestival ? '/festivales' : '/conciertos', { replace: true });
    }
  }, [result, isLoading, isFetched, navigate, rawSlug, isFestivalRoute, earlyExitResult]);

  // ============================================
  // RENDER
  // ============================================
  
  if (error) {
    console.error('[SEO Debug] Event redirect error:', error);
    navigate(isFestivalRoute ? '/festivales' : '/conciertos', { replace: true });
    return null;
  }

  // FAST PATH: Clean URL with correct route - render immediately
  if (earlyExitResult?.canFastPath) {
    return (
      <Suspense fallback={<PageLoader slug={rawSlug} isFestival={isFestivalRoute} />}>
        <Producto />
      </Suspense>
    );
  }
  
  // Waiting for route correction
  if (earlyExitResult?.needsRouteCorrection) {
    const targetUrl = `https://feelomove.com${earlyExitResult.correctRoute}/${rawSlug}`;
    return <RedirectLoader targetUrl={targetUrl} />;
  }

  // Intercepted URL - show redirect loader immediately
  if (interceptCheck.shouldIntercept && isLoading) {
    // Show loader but with redirect meta tags
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <PageLoader slug={rawSlug} isFestival={isFestivalRoute} />
      </>
    );
  }

  if (isLoading) {
    return <PageLoader slug={rawSlug} isFestival={isFestivalRoute} />;
  }

  // Event found with no redirect needed
  if (result?.event && !result.needsRedirect) {
    return (
      <Suspense fallback={<PageLoader slug={rawSlug} isFestival={isFestivalRoute} />}>
        <Producto />
      </Suspense>
    );
  }

  // Redirect in progress
  if (result?.needsRedirect && result.targetPath) {
    const targetUrl = `https://feelomove.com${result.targetPath}`;
    return <RedirectLoader targetUrl={targetUrl} />;
  }

  // Fallback - render Producto directly (no more redirect loops)
  return (
    <Suspense fallback={<PageLoader slug={rawSlug} isFestival={isFestivalRoute} />}>
      <Producto />
    </Suspense>
  );
};

export default RedirectLegacyEvent;