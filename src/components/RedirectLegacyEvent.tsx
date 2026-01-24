import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  parseLegacySlug, 
  isFestivalSlug, 
  extractCityFromSlug, 
  getEventUrl,
  isValidSeoSlug 
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
}

/**
 * Smart event router that implements SEO URL standards:
 * 
 * 1. Anti-Loop: If old_slug = new_slug, load page directly
 * 2. Single-Hop: Use event_id from slug_redirects to generate current URL
 * 3. Auto-Clean Suffixes: Remove -1, -2 and search by artist+city
 * 4. Festival Detection: Force /festival/ route for festival content
 */
const RedirectLegacyEvent = () => {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isFestivalRoute = location.pathname.startsWith('/festival');
  const isConciertRoute = location.pathname.startsWith('/concierto');
  const slugLooksLikeFestival = rawSlug ? isFestivalSlug(rawSlug) : false;
  
  const { data: result, isLoading, error, isFetched } = useQuery({
    queryKey: ['event-redirect', rawSlug],
    queryFn: async (): Promise<RedirectResult> => {
      if (!rawSlug) {
        return { event: null, needsRedirect: false, targetSlug: null, targetPath: null, source: 'no_slug' };
      }
      
      const parsedSlug = parseLegacySlug(rawSlug);
      console.log(`[RedirectLegacyEvent] Parsing "${rawSlug}":`, parsedSlug);
      
      // RULE 1: Check slug_redirects table first (uses event_id for single-hop)
      try {
        const { data: redirect } = await supabase
          .from('slug_redirects')
          .select('new_slug, event_id')
          .eq('old_slug', rawSlug)
          .maybeSingle();
        
        if (redirect) {
          // Anti-loop: if old_slug = new_slug, skip redirect
          if (redirect.new_slug === rawSlug) {
            console.log(`[RedirectLegacyEvent] Anti-loop detected, loading directly`);
          } else {
            // Single-hop: use event_id to get current event data
            const { data: eventFromId } = await supabase
              .from('tm_tbl_events')
              .select('id, slug, event_type, name, venue_city, event_date')
              .eq('id', redirect.event_id)
              .maybeSingle();
            
            if (eventFromId) {
              const targetPath = getEventUrl(eventFromId.slug, eventFromId.event_type);
              console.log(`[RedirectLegacyEvent] Single-hop redirect via event_id: ${rawSlug} → ${targetPath}`);
              return {
                event: eventFromId as EventData,
                needsRedirect: true,
                targetSlug: eventFromId.slug,
                targetPath,
                source: 'slug_redirects_event_id'
              };
            }
          }
        }
      } catch (e) {
        console.warn('[RedirectLegacyEvent] slug_redirects lookup failed:', e);
      }
      
      // RULE 2: Check exact slug match in events
      const { data: exactMatch } = await supabase
        .from('tm_tbl_events')
        .select('id, slug, event_type, name, venue_city, event_date')
        .eq('slug', rawSlug)
        .maybeSingle();
      
      if (exactMatch) {
        const isFestival = exactMatch.event_type === 'festival';
        const correctRoute = isFestival ? '/festival/' : '/concierto/';
        const wrongRoute = (isFestival && isConciertRoute) || (!isFestival && isFestivalRoute);
        
        // Festival detection: content is festival but accessed via /concierto/
        if (wrongRoute) {
          const targetPath = getEventUrl(exactMatch.slug, exactMatch.event_type);
          console.log(`[RedirectLegacyEvent] Route type correction: ${location.pathname} → ${targetPath}`);
          return {
            event: exactMatch as EventData,
            needsRedirect: true,
            targetSlug: exactMatch.slug,
            targetPath,
            source: 'route_type_correction'
          };
        }
        
        // Check if slug is valid SEO format
        if (!isValidSeoSlug(rawSlug)) {
          // Slug has prohibited patterns, but we found the event - serve it anyway
          console.log(`[RedirectLegacyEvent] Slug not ideal SEO but event exists, serving directly`);
        }
        
        return {
          event: exactMatch as EventData,
          needsRedirect: false,
          targetSlug: null,
          targetPath: null,
          source: 'exact_match'
        };
      }
      
      // RULE 3: Spanish date format in URL - parse and find event
      if (parsedSlug.isSpanishDateFormat && parsedSlug.date) {
        const { data: dateMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .ilike('slug', `${parsedSlug.baseSlug}%`)
          .gte('event_date', `${parsedSlug.date}T00:00:00`)
          .lt('event_date', `${parsedSlug.date}T23:59:59`)
          .maybeSingle();
        
        if (dateMatch) {
          // Check if the URL slug matches the DB slug
          if (dateMatch.slug !== rawSlug) {
            const targetPath = getEventUrl(dateMatch.slug, dateMatch.event_type);
            console.log(`[RedirectLegacyEvent] Spanish date format redirect: ${rawSlug} → ${targetPath}`);
            return {
              event: dateMatch as EventData,
              needsRedirect: true,
              targetSlug: dateMatch.slug,
              targetPath,
              source: 'spanish_date_match'
            };
          }
          return {
            event: dateMatch as EventData,
            needsRedirect: false,
            targetSlug: null,
            targetPath: null,
            source: 'spanish_date_exact'
          };
        }
      }
      
      // RULE 4: Auto-clean numeric suffixes and search by artist+city
      if (parsedSlug.hasNumericSuffix || parsedSlug.hasLegacySuffix) {
        const city = extractCityFromSlug(parsedSlug.baseSlug);
        
        if (city) {
          const cityLower = city.toLowerCase();
          const slugLower = parsedSlug.baseSlug.toLowerCase();
          const cityIndex = slugLower.lastIndexOf(`-${cityLower}`);
          const artistPart = cityIndex > 0 ? parsedSlug.baseSlug.substring(0, cityIndex) : null;
          
          if (artistPart) {
            // Search by artist prefix + city
            const citySearchPattern = city.replace(/-/g, ' ');
            
            const { data: artistCityMatches } = await supabase
              .from('tm_tbl_events')
              .select('id, slug, event_type, name, venue_city, event_date')
              .ilike('slug', `${artistPart}-%`)
              .ilike('venue_city', `%${citySearchPattern}%`)
              .gte('event_date', new Date().toISOString())
              .order('event_date', { ascending: true })
              .limit(5);
            
            if (artistCityMatches && artistCityMatches.length > 0) {
              // Find the best match (preferably upcoming, not VIP)
              const bestMatch = artistCityMatches.find(e => 
                !e.slug.includes('-paquetes-vip') && !e.slug.includes('-parking')
              ) || artistCityMatches[0];
              
              const targetPath = getEventUrl(bestMatch.slug, bestMatch.event_type);
              console.log(`[RedirectLegacyEvent] Artist+city match: ${rawSlug} → ${targetPath}`);
              return {
                event: bestMatch as EventData,
                needsRedirect: true,
                targetSlug: bestMatch.slug,
                targetPath,
                source: 'artist_city_search'
              };
            }
          }
        }
        
        // Fallback: search by base slug prefix
        const { data: prefixMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .ilike('slug', `${parsedSlug.baseSlug}-%`)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (prefixMatch) {
          const targetPath = getEventUrl(prefixMatch.slug, prefixMatch.event_type);
          console.log(`[RedirectLegacyEvent] Prefix match: ${rawSlug} → ${targetPath}`);
          return {
            event: prefixMatch as EventData,
            needsRedirect: true,
            targetSlug: prefixMatch.slug,
            targetPath,
            source: 'prefix_search'
          };
        }
      }
      
      // RULE 5: Festival keyword detection - search in festivals
      if (slugLooksLikeFestival && !isFestivalRoute) {
        const slugParts = rawSlug.split('-').slice(0, 3).join('-');
        
        const { data: festivalMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .eq('event_type', 'festival')
          .ilike('slug', `%${slugParts}%`)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (festivalMatch) {
          const targetPath = getEventUrl(festivalMatch.slug, festivalMatch.event_type);
          console.log(`[RedirectLegacyEvent] Festival keyword detection: ${rawSlug} → ${targetPath}`);
          return {
            event: festivalMatch as EventData,
            needsRedirect: true,
            targetSlug: festivalMatch.slug,
            targetPath,
            source: 'festival_detection'
          };
        }
      }
      
      // RULE 6: Fuzzy search as last resort
      const slugParts = rawSlug.split('-');
      if (slugParts.length >= 2) {
        const prefixLength = Math.min(3, slugParts.length);
        const fuzzyPrefix = slugParts.slice(0, prefixLength).join('-');
        
        const { data: fuzzyMatch } = await supabase
          .from('tm_tbl_events')
          .select('id, slug, event_type, name, venue_city, event_date')
          .ilike('slug', `${fuzzyPrefix}%`)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (fuzzyMatch) {
          const targetPath = getEventUrl(fuzzyMatch.slug, fuzzyMatch.event_type);
          console.log(`[RedirectLegacyEvent] Fuzzy match: ${rawSlug} → ${targetPath}`);
          return {
            event: fuzzyMatch as EventData,
            needsRedirect: true,
            targetSlug: fuzzyMatch.slug,
            targetPath,
            source: 'fuzzy_search'
          };
        }
      }
      
      // Event not found
      console.log(`[RedirectLegacyEvent] No event found for: ${rawSlug}`);
      return { event: null, needsRedirect: false, targetSlug: null, targetPath: null, source: 'not_found' };
    },
    enabled: !!rawSlug,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (isLoading || !isFetched) return;
    
    if (result?.needsRedirect && result.targetPath) {
      navigate(result.targetPath, { replace: true });
      return;
    }
    
    if (!result?.event && isFetched) {
      // No event found - redirect to appropriate list
      console.warn(`Event not found: "${rawSlug}", redirecting to list page`);
      navigate(isFestivalRoute || slugLooksLikeFestival ? '/festivales' : '/conciertos', { replace: true });
    }
  }, [result, isLoading, isFetched, navigate, rawSlug, isFestivalRoute, slugLooksLikeFestival]);

  if (error) {
    console.error('Event redirect error:', error);
    navigate(isFestivalRoute ? '/festivales' : '/conciertos', { replace: true });
    return null;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  // Event found with no redirect needed - render page
  if (result?.event && !result.needsRedirect) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Producto />
      </Suspense>
    );
  }

  // Redirect in progress - show loader with SEO tags
  if (result?.needsRedirect && result.targetPath) {
    const targetUrl = `https://feelomove.com${result.targetPath}`;
    return <RedirectLoader targetUrl={targetUrl} />;
  }

  // Fallback - render Producto
  return (
    <Suspense fallback={<PageLoader />}>
      <Producto />
    </Suspense>
  );
};

export default RedirectLegacyEvent;
