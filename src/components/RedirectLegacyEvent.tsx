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
 * Detects if a slug ends with problematic patterns:
 * 1. Full date: -YYYY-MM-DD (e.g., "event-slug-2026-01-14")
 * 2. Year only: -YYYY (e.g., "event-slug-2026")
 * 3. Placeholder year: -9999 (e.g., "event-slug-9999")
 * 4. Numeric suffix: -1, -2, -3 etc. (legacy duplicate handling)
 * 5. Long tour names that should be simplified
 */
interface ParsedSlug {
  baseSlug: string;
  date: string | null;
  hasLegacySuffix: boolean;
  isPlaceholderDate: boolean;
  isYearOnly: boolean;
  hasNumericSuffix: boolean;
  simplifiedSlug: string | null;
}

/**
 * Extract city from a slug by matching known Spanish city patterns
 */
const SPANISH_CITIES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga', 'zaragoza',
  'murcia', 'palma', 'las-palmas', 'alicante', 'cordoba', 'valladolid', 'vigo',
  'gijon', 'hospitalet', 'vitoria', 'granada', 'elche', 'oviedo', 'terrassa',
  'badalona', 'cartagena', 'jerez', 'sabadell', 'mostoles', 'santa-cruz',
  'pamplona', 'almeria', 'san-sebastian', 'donostia', 'santander', 'burgos',
  'castellon', 'albacete', 'alcorcon', 'getafe', 'salamanca', 'logrono',
  'badajoz', 'huelva', 'lleida', 'tarragona', 'leon', 'cadiz', 'jaen', 'ourense',
  'lugo', 'caceres', 'melilla', 'ceuta', 'guadalajara', 'toledo', 'pontevedra',
  'palencia', 'ciudad-real', 'zamora', 'avila', 'cuenca', 'huesca', 'segovia',
  'soria', 'teruel', 'chiclana', 'chiclana-de-la-frontera', 'marbella', 'benidorm',
  'torremolinos', 'fuengirola', 'estepona', 'algeciras', 'ronda', 'antequera',
  'velez-malaga', 'mijas', 'roquetas-de-mar', 'el-ejido', 'motril', 'linares',
  'ubeda', 'baeza', 'martos', 'andujar', 'mancha-real', 'la-carolina',
  'puerto-real', 'san-fernando', 'rota', 'conil', 'sanlucar', 'chipiona',
  'el-puerto-de-santa-maria', 'arcos-de-la-frontera', 'utrera', 'dos-hermanas',
  'ecija', 'carmona', 'lebrija', 'osuna', 'moron-de-la-frontera', 'arahal',
  'marchena', 'alcala-de-guadaira', 'la-rinconada', 'camas', 'tomares', 'mairena',
  'la-algaba', 'bormujos', 'gines', 'castilleja', 'espartinas', 'san-juan',
  // Galicia
  'a-coruna', 'coruna', 'la-coruna', 'santiago', 'santiago-de-compostela', 'ferrol',
  // Cataluña adicionales
  'girona', 'reus', 'mataro', 'santa-coloma', 'cornella',
  // País Vasco adicionales
  'irun', 'barakaldo', 'getxo', 'portugalete'
];

function extractCityFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  
  // Try to find a city at the end of the slug
  for (let i = parts.length - 1; i >= 0; i--) {
    const possibleCity = parts.slice(i).join('-');
    if (SPANISH_CITIES.includes(possibleCity.toLowerCase())) {
      return possibleCity;
    }
    // Also check single word
    if (SPANISH_CITIES.includes(parts[i].toLowerCase())) {
      return parts[i];
    }
  }
  return null;
}

function parseLegacySlug(slug: string): ParsedSlug {
  let workingSlug = slug;
  let hasNumericSuffix = false;
  let simplifiedSlug: string | null = null;
  
  // Check for numeric suffix (-1, -2, -3, etc.) at the very end
  const numericSuffixPattern = /-(\d{1,2})$/;
  const numericMatch = workingSlug.match(numericSuffixPattern);
  if (numericMatch && parseInt(numericMatch[1]) <= 99) {
    hasNumericSuffix = true;
    workingSlug = workingSlug.replace(numericSuffixPattern, '');
  }
  
  // Check for placeholder year suffix: -9999 (with or without date parts)
  const placeholderPattern = /-9999(-\d{2})?(-\d{2})?$/;
  if (placeholderPattern.test(workingSlug)) {
    const baseSlug = workingSlug.replace(placeholderPattern, '');
    return { 
      baseSlug, 
      date: null, 
      hasLegacySuffix: true, 
      isPlaceholderDate: true, 
      isYearOnly: false,
      hasNumericSuffix,
      simplifiedSlug: null
    };
  }
  
  // Match full date pattern at the end: -YYYY-MM-DD
  const fullDatePattern = /-(\d{4})-(\d{2})-(\d{2})$/;
  const fullDateMatch = workingSlug.match(fullDatePattern);
  
  if (fullDateMatch) {
    const date = `${fullDateMatch[1]}-${fullDateMatch[2]}-${fullDateMatch[3]}`;
    const baseSlug = workingSlug.replace(fullDatePattern, '');
    return { 
      baseSlug, 
      date, 
      hasLegacySuffix: true, 
      isPlaceholderDate: false, 
      isYearOnly: false,
      hasNumericSuffix,
      simplifiedSlug: null
    };
  }
  
  // Match year-only pattern at the end: -YYYY (where YYYY is 2020-2099)
  const yearOnlyPattern = /-(20[2-9]\d)$/;
  const yearOnlyMatch = workingSlug.match(yearOnlyPattern);
  
  if (yearOnlyMatch) {
    const baseSlug = workingSlug.replace(yearOnlyPattern, '');
    return { 
      baseSlug, 
      date: null, 
      hasLegacySuffix: true, 
      isPlaceholderDate: false, 
      isYearOnly: true,
      hasNumericSuffix,
      simplifiedSlug: null
    };
  }
  
  // Check for long tour name patterns that should be simplified
  // Pattern: [artist]-[tour-name-words]-[city] → [artist]-[city]
  const tourKeywords = [
    'world-tour', 'tour', 'live', 'concert', 'en-concierto', 'gira', 
    'the-tour', 'experience', 'show', 'festival', 'everyone-s', 'everyones'
  ];
  
  const city = extractCityFromSlug(workingSlug);
  if (city) {
    const slugWithoutCity = workingSlug.replace(new RegExp(`-${city}$`, 'i'), '');
    const slugParts = slugWithoutCity.split('-');
    
    // If slug has more than 4 parts (likely includes tour name), try to simplify
    if (slugParts.length > 4) {
      // Find where tour keywords start
      let tourStartIndex = -1;
      for (let i = 0; i < slugParts.length; i++) {
        const part = slugParts[i].toLowerCase();
        if (tourKeywords.some(kw => kw.includes(part) || part.includes(kw.replace('-', '')))) {
          tourStartIndex = i;
          break;
        }
      }
      
      if (tourStartIndex > 0) {
        // Artist name is before tour keywords
        const artistParts = slugParts.slice(0, tourStartIndex);
        simplifiedSlug = `${artistParts.join('-')}-${city}`;
      }
    }
  }
  
  // If we found a numeric suffix, it's a legacy pattern
  if (hasNumericSuffix) {
    return { 
      baseSlug: workingSlug, 
      date: null, 
      hasLegacySuffix: true, 
      isPlaceholderDate: false, 
      isYearOnly: false,
      hasNumericSuffix: true,
      simplifiedSlug
    };
  }
  
  return { 
    baseSlug: slug, 
    date: null, 
    hasLegacySuffix: simplifiedSlug !== null, 
    isPlaceholderDate: false, 
    isYearOnly: false,
    hasNumericSuffix: false,
    simplifiedSlug
  };
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
  const parsedSlug = rawSlug ? parseLegacySlug(rawSlug) : { 
    baseSlug: '', 
    date: null, 
    hasLegacySuffix: false, 
    isPlaceholderDate: false, 
    isYearOnly: false,
    hasNumericSuffix: false,
    simplifiedSlug: null
  };
  
  // Determine if this is a festival or concert route
  const isFestivalRoute = location.pathname.startsWith('/festival');

  // Query to check if the EXACT slug exists first, then handle legacy redirects
  const { data: eventData, isLoading, error, isFetched } = useQuery({
    queryKey: ['event-redirect-check', rawSlug],
    queryFn: async () => {
      if (!rawSlug) return null;
      
      // STEP 0: Check slug_redirects table first for migrated URLs
      // This handles the old → new slug mapping from our migration
      try {
        const { data: redirectData } = await supabase
          .from('slug_redirects')
          .select('new_slug, event_id')
          .eq('old_slug', rawSlug)
          .maybeSingle();
        
        if (redirectData?.new_slug && redirectData.new_slug !== rawSlug) {
          // Ignore placeholder slugs to prevent loops
          const isPlaceholderTarget = /-9999(-\d{2})?(-\d{2})?$/.test(redirectData.new_slug);
          if (!isPlaceholderTarget) {
            // Fetch the event type for proper routing
            const { data: eventInfo } = await supabase
              .from('tm_tbl_events')
              .select('event_type, slug')
              .eq('slug', redirectData.new_slug)
              .maybeSingle();
            
            if (eventInfo) {
              return { 
                ...eventInfo, 
                needsRedirect: true, 
                isExactMatch: false,
                redirectSource: 'slug_redirects'
              };
            }
          }
        }
      } catch (e) {
        console.warn('slug_redirects check failed:', e);
      }
      
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
      
      // STEP 2: If no exact match and slug has legacy patterns, try to find the event
      const { baseSlug, date, hasLegacySuffix, isPlaceholderDate, isYearOnly, hasNumericSuffix, simplifiedSlug } = parsedSlug;
      
      if (!hasLegacySuffix && !hasNumericSuffix && !simplifiedSlug) {
        // No legacy pattern detected and no exact match - event doesn't exist
        return null;
      }
      
      // STEP 2a: If we have a simplified slug (long tour name → short), try that first
      if (simplifiedSlug) {
        const { data: simplifiedMatch } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .ilike("slug", `${simplifiedSlug}%`)
          .order("event_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (simplifiedMatch) {
          console.log(`Simplified slug match: ${rawSlug} → ${simplifiedMatch.slug}`);
          return { ...simplifiedMatch, needsRedirect: true, isExactMatch: false, redirectSource: 'simplified' };
        }
      }
      
      // STEP 2b: Try to find event with the base slug (without suffix)
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
        return { ...data, needsRedirect: true, isExactMatch: false, redirectSource: 'base_slug' };
      }
      
      // STEP 2c: Try without date filter if we had one
      if (date && !isPlaceholderDate && !isYearOnly) {
        const { data: withoutDateData } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .eq("slug", baseSlug)
          .maybeSingle();
        
        if (withoutDateData) {
          return { ...withoutDateData, needsRedirect: true, isExactMatch: false, redirectSource: 'base_slug_no_date' };
        }
      }
      
      // STEP 2d: For numeric suffixes (-1, -2) and legacy URLs, search by extracting artist and city
      // and finding the next upcoming event for that combination
      const slugToAnalyze = baseSlug || rawSlug;
      const city = extractCityFromSlug(slugToAnalyze);
      
      console.log(`Redirect analysis: slug="${rawSlug}", baseSlug="${baseSlug}", city="${city}"`);
      
      if (city) {
        // Extract artist name from the slug (everything before the city)
        // Find the position where city starts in the slug
        const cityLower = city.toLowerCase();
        const slugLower = slugToAnalyze.toLowerCase();
        const cityStartIndex = slugLower.lastIndexOf(`-${cityLower}`);
        
        let artistPart: string | null = null;
        if (cityStartIndex > 0) {
          artistPart = slugToAnalyze.substring(0, cityStartIndex);
        }
        
        console.log(`Artist extraction: artistPart="${artistPart}", city="${city}"`);
        
        if (artistPart) {
          // Normalize city name for venue_city search
          const citySearchPattern = city.replace(/-/g, ' ');
          
          // Strategy 1: Search by artist prefix + venue_city matching
          const { data: artistCityMatches } = await supabase
            .from("tm_tbl_events")
            .select("event_type, slug, name, venue_city, event_date")
            .ilike("slug", `${artistPart}-%`)
            .ilike("venue_city", `%${citySearchPattern}%`)
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true })
            .limit(5);
          
          if (artistCityMatches && artistCityMatches.length > 0) {
            console.log(`Artist+venue_city match: ${rawSlug} → ${artistCityMatches[0].slug}`);
            return { ...artistCityMatches[0], needsRedirect: true, isExactMatch: false, redirectSource: 'artist_city_venue' };
          }
          
          // Strategy 2: Search by slug pattern (artist-city prefix)
          const { data: slugPatternMatches } = await supabase
            .from("tm_tbl_events")
            .select("event_type, slug, name, venue_city, event_date")
            .ilike("slug", `${artistPart}-${city}%`)
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true })
            .limit(1);
          
          if (slugPatternMatches && slugPatternMatches.length > 0) {
            console.log(`Slug pattern match: ${rawSlug} → ${slugPatternMatches[0].slug}`);
            return { ...slugPatternMatches[0], needsRedirect: true, isExactMatch: false, redirectSource: 'slug_pattern' };
          }
        }
      }
      
      // STEP 2e: For numeric suffixes, also try base slug pattern matching without city filtering
      if (hasNumericSuffix && baseSlug) {
        const { data: numericMatch } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .ilike("slug", `${baseSlug}-%`)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (numericMatch) {
          console.log(`Numeric suffix match: ${rawSlug} → ${numericMatch.slug}`);
          return { ...numericMatch, needsRedirect: true, isExactMatch: false, redirectSource: 'numeric_suffix' };
        }
      }
      
      // STEP 2f: Last resort fuzzy match by slug prefix (first 3 words)
      if (baseSlug) {
        const slugParts = baseSlug.split('-');
        
        if (slugParts.length >= 2) {
          const prefixLength = Math.min(3, slugParts.length);
          const possibleSlugPrefix = slugParts.slice(0, prefixLength).join('-');
          
          const { data: fuzzyResult } = await supabase
            .from("tm_tbl_events")
            .select("event_type, slug, name, venue_city, event_date")
            .ilike("slug", `${possibleSlugPrefix}%`)
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (fuzzyResult) {
            console.log(`Fuzzy prefix match: ${rawSlug} → ${fuzzyResult.slug}`);
            return { ...fuzzyResult, needsRedirect: true, isExactMatch: false, redirectSource: 'fuzzy' };
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
