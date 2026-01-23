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
 * Known festival names for forced festival route detection
 * These keywords in a slug indicate it should use /festival/ route
 */
const KNOWN_FESTIVAL_NAMES = [
  'sonorama', 'sonorama-ribera', 'primavera-sound', 'mad-cool', 'madcool',
  'bbk-live', 'bilbao-bbk', 'arenal-sound', 'viña-rock', 'vina-rock',
  'resurrection-fest', 'low-festival', 'dcode', 'cabo-de-plata',
  'cruilla', 'vida-festival', 'festival-de-les-arts', 'les-arts',
  'tomorrowland', 'ultra', 'medusa', 'weekend-beach', 'dream-beach',
  'rototom', 'barcelona-beach', 'starlite', 'festival-jardins',
  'porta-ferrada', 'cap-roig', 'concert-music-festival', 'cmf',
  'o-gozo', 'festival-noroeste', 'atlantic-fest', 'canela-party',
  'warm-up', 'interestelar', 'tomavistas', 'mulafest', 'sansan',
  'granada-sound', 'alrumbo', 'sun-festival', 'brisa-festival',
  'iboga-summer', 'festival-internacional', 'share-festival',
  'intro-music', 'mallorca-live', 'son-estrella', 'cala-mijas',
  'cabaret-festival', 'festival-de-guitarra', 'jazz-festival',
  'heineken-jazzaldia', 'jazz-vitoria', 'getxo-jazz', 'terrassa-jazz',
  'leyendas-del-rock', 'rock-imperium', 'amnesia-festival', 'monegros',
  'electrobeach', 'a-summer-story', 'medusa-sunbeach', 'aquasella',
  'tomorrowland', 'dreambeach', 'marenostrum', 'festival-sol',
  'boombastic', 'festival-gigante', 'gigante', 'conexion-valladolid',
  'festival-rio-babel', 'rio-babel', 'coca-cola-music', 'ccme',
  'festival-cultura-inquieta', 'cultura-inquieta', 'festival-de-musica',
  'iberdrola-music', 'nos-alive', 'alive', 'aupa-lumbreiras', 'lumbreiras',
  'ezcaray-fest', 'degusta-fest', 'festival-vive-latino', 'vive-latino',
  'matinee-easter', 'circuit-festival', 'gran-illa', 'cranc-illa',
  'festial', 'amusufest', 'fuck-censorship', 'f-ck-censorship',
  'leon-solo-musica', 'ginetarock', 'glory', 'can-reon',
  'abono', 'bono-festival', 'pase-festival', 'entrada-festival'
];

/**
 * Festival keyword patterns that indicate an event is a festival
 */
const FESTIVAL_KEYWORDS = [
  'festival', 'fest', 'sound', 'music-festival', 'rock-festival',
  'jazz-festival', 'summer-festival', 'beach-festival', 'live-festival',
  'electronic-festival', 'indie-festival', 'abono', 'bono-general',
  'camping', 'glamping'
];

/**
 * Detects if a slug represents a festival event
 */
function isFestivalSlug(slug: string): boolean {
  const slugLower = slug.toLowerCase();
  
  // Check against known festival names
  for (const festivalName of KNOWN_FESTIVAL_NAMES) {
    if (slugLower.includes(festivalName)) {
      return true;
    }
  }
  
  // Check for festival keywords
  for (const keyword of FESTIVAL_KEYWORDS) {
    // Match as whole word to avoid false positives
    const keywordPattern = new RegExp(`(^|-)${keyword}(-|$)`, 'i');
    if (keywordPattern.test(slug)) {
      return true;
    }
  }
  
  return false;
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
  // Festival cities
  'aranda-de-duero', 'aranda', 'benicassim', 'benicasim', 'villarrobledo',
  'viveiro', 'vilagarcia', 'vilagarcia-de-arousa', 'sanxenxo', 'cangas',
  'villena', 'aguilas', 'la-manga', 'mazarron', 'jumilla', 'caravaca',
  // Galicia
  'a-coruna', 'coruna', 'la-coruna', 'santiago', 'santiago-de-compostela', 'ferrol',
  // Cataluña adicionales
  'girona', 'reus', 'mataro', 'santa-coloma', 'cornella', 'vilanova-i-la-geltru',
  'vilanova', 'sitges', 'calella', 'lloret', 'lloret-de-mar', 'blanes',
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

// Spanish month names for parsing new-format slugs
const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function parseLegacySlug(slug: string): ParsedSlug {
  let workingSlug = slug;
  let hasNumericSuffix = false;
  let simplifiedSlug: string | null = null;
  
  // PRIORITY CHECK: Detect new SEO format with Spanish month names: artist-city-DD-month-YYYY
  // Pattern: [artist]-[city]-[day]-[spanish-month]-[year]
  // Example: morat-barcelona-16-octubre-2026
  // The hyphen before the day is REQUIRED to properly separate from the city/artist
  const spanishMonthPattern = new RegExp(
    `-(\\d{1,2})-(${SPANISH_MONTHS.join('|')})-(20[2-9]\\d)$`,
    'i'
  );
  const spanishMonthMatch = workingSlug.match(spanishMonthPattern);
  
  console.log(`[parseLegacySlug] Input: "${slug}", Spanish month match: ${spanishMonthMatch ? 'YES' : 'NO'}`);
  
  if (spanishMonthMatch) {
    // This is the new SEO-friendly format - extract base slug
    const baseSlug = workingSlug.replace(spanishMonthPattern, '');
    const day = spanishMonthMatch[1];
    const monthName = spanishMonthMatch[2].toLowerCase();
    const year = spanishMonthMatch[3];
    const monthNum = String(SPANISH_MONTHS.indexOf(monthName) + 1).padStart(2, '0');
    const dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
    
    console.log(`[parseLegacySlug] SEO format detected: "${slug}" → baseSlug: "${baseSlug}", date: "${dateStr}"`);
    
    return {
      baseSlug,
      date: dateStr,
      hasLegacySuffix: true,
      isPlaceholderDate: false,
      isYearOnly: false,
      hasNumericSuffix: false,
      simplifiedSlug: null
    };
  }
  
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
  const isConciertRoute = location.pathname.startsWith('/concierto');
  const isArtistaRoute = location.pathname.startsWith('/artista');
  
  // Early detection: Check if slug looks like a festival (for wrong route redirects)
  const slugLooksLikeFestival = rawSlug ? isFestivalSlug(rawSlug) : false;

  // Query to check if the EXACT slug exists first, then handle legacy redirects
  const { data: eventData, isLoading, error, isFetched } = useQuery({
    queryKey: ['event-redirect-check', rawSlug],
    queryFn: async () => {
      if (!rawSlug) return null;
      
      console.log(`[RedirectLegacyEvent] Starting lookup for slug: "${rawSlug}"`);
      console.log(`[RedirectLegacyEvent] Route info: isFestival=${isFestivalRoute}, isConcierto=${isConciertRoute}`);
      
      // STEP 0a: Festival detection from slug keywords
      // If accessing /concierto/ or /artista/ with a festival-like slug, 
      // search for the festival and force redirect
      if ((isConciertRoute || isArtistaRoute) && isFestivalSlug(rawSlug)) {
        console.log(`[Festival Detection] Slug "${rawSlug}" looks like a festival, searching in festivals...`);
        
        // Try to find the festival by matching slug patterns
        const { data: festivalMatch } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .eq("event_type", "festival")
          .ilike("slug", `%${rawSlug.split('-').slice(0, 3).join('-')}%`)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (festivalMatch) {
          console.log(`[Festival Detection] Found festival: ${festivalMatch.slug}`);
          return { 
            ...festivalMatch, 
            needsRedirect: true, 
            isExactMatch: false,
            redirectSource: 'festival_keyword_detection',
            forceFestivalRoute: true
          };
        }
        
        // Also try exact slug match in festivals
        const { data: exactFestival } = await supabase
          .from("tm_tbl_events")
          .select("event_type, slug, name, venue_city, event_date")
          .eq("event_type", "festival")
          .eq("slug", rawSlug)
          .maybeSingle();
        
        if (exactFestival) {
          console.log(`[Festival Detection] Exact festival match: ${exactFestival.slug}`);
          return { 
            ...exactFestival, 
            needsRedirect: true, 
            isExactMatch: false,
            redirectSource: 'festival_exact_wrong_route',
            forceFestivalRoute: true
          };
        }
      }
      
      // STEP 0b: Check slug_redirects table first for migrated URLs
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
            // Fetch the event type for proper routing - MUST verify new_slug exists
            const { data: eventInfo } = await supabase
              .from('tm_tbl_events')
              .select('event_type, slug')
              .eq('slug', redirectData.new_slug)
              .maybeSingle();
            
            // Only redirect if the target slug actually exists in the database
            if (eventInfo) {
              console.log(`[slug_redirects] Valid redirect: ${rawSlug} → ${eventInfo.slug}`);
              return { 
                ...eventInfo, 
                needsRedirect: true, 
                isExactMatch: false,
                redirectSource: 'slug_redirects'
              };
            } else {
              // Target slug doesn't exist - check if event exists by event_id with a DIFFERENT slug
              console.warn(`[slug_redirects] Target slug "${redirectData.new_slug}" not found, checking event_id...`);
              const { data: eventById } = await supabase
                .from('tm_tbl_events')
                .select('event_type, slug')
                .eq('id', redirectData.event_id)
                .maybeSingle();
              
              if (eventById && eventById.slug !== rawSlug) {
                // Event exists with a different slug - redirect to the actual slug
                console.log(`[slug_redirects] Event found by ID with slug: ${eventById.slug}`);
                return { 
                  ...eventById, 
                  needsRedirect: true, 
                  isExactMatch: false,
                  redirectSource: 'slug_redirects_by_event_id'
                };
              } else if (eventById && eventById.slug === rawSlug) {
                // Event's actual slug matches what user requested - it's an exact match!
                console.log(`[slug_redirects] Event's actual slug matches request, treating as exact match`);
                return { ...eventById, needsRedirect: false, isExactMatch: true };
              }
              // If event_id lookup also fails, continue to exact match check
            }
          }
        }
      } catch (e) {
        console.warn('slug_redirects check failed:', e);
      }
      
      // STEP 1: Check if the EXACT slug exists in the database
      console.log(`[RedirectLegacyEvent] STEP 1: Checking exact match for slug: "${rawSlug}"`);
      const { data: exactMatch, error: exactError } = await supabase
        .from("tm_tbl_events")
        .select("event_type, slug, name, venue_city, event_date")
        .eq("slug", rawSlug)
        .maybeSingle();
      
      console.log(`[RedirectLegacyEvent] Exact match result:`, exactMatch ? `Found: ${exactMatch.slug}` : 'Not found');
      
      if (exactError) throw exactError;
      
      // If exact match found, check if it's a festival accessed via wrong route
      if (exactMatch) {
        const isFestival = exactMatch.event_type === 'festival';
        const needsRouteCorrection = isFestival && (isConciertRoute || isArtistaRoute);
        
        if (needsRouteCorrection) {
          console.log(`[Festival Detection] Exact match is festival but accessed via wrong route`);
          return { 
            ...exactMatch, 
            needsRedirect: true, 
            isExactMatch: false, 
            redirectSource: 'festival_wrong_route',
            forceFestivalRoute: true
          };
        }
        
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
      // For SEO-friendly URLs with Spanish date (artist-city-DD-month-YYYY), this will find the base event
      console.log(`[RedirectLegacyEvent] STEP 2b: Searching for baseSlug="${baseSlug}", date="${date}"`);
      
      // First, try to find by exact base slug
      const { data: baseSlugData, error: baseError } = await supabase
        .from("tm_tbl_events")
        .select("event_type, slug, name, venue_city, event_date")
        .eq("slug", baseSlug)
        .maybeSingle();
      
      if (baseError) {
        console.error('[RedirectLegacyEvent] baseSlug query error:', baseError);
        throw baseError;
      }
      
      console.log(`[RedirectLegacyEvent] baseSlug query result:`, baseSlugData);
      
      if (baseSlugData) {
        // Check if date matches (if we have one)
        if (date && !isPlaceholderDate && !isYearOnly) {
          // Compare dates (ignoring time)
          const eventDate = new Date(baseSlugData.event_date).toISOString().split('T')[0];
          const urlDate = date;
          console.log(`[RedirectLegacyEvent] Date comparison: eventDate="${eventDate}", urlDate="${urlDate}"`);
          
          if (eventDate === urlDate) {
            // SEO-friendly URL with Spanish date: show page directly without redirect
            console.log(`[RedirectLegacyEvent] SEO-friendly URL match: ${rawSlug} → event ${baseSlugData.slug} (no redirect needed)`);
            return { 
              ...baseSlugData, 
              needsRedirect: false, 
              isExactMatch: true, 
              redirectSource: 'seo_date_format',
              originalSlug: rawSlug 
            };
          } else {
            // Date doesn't match - might be wrong event, redirect to actual event
            console.log(`[RedirectLegacyEvent] Date mismatch, redirecting to actual event`);
            return { ...baseSlugData, needsRedirect: true, isExactMatch: false, redirectSource: 'base_slug_wrong_date' };
          }
        }
        
        // No date in URL, just return the base slug match
        return { ...baseSlugData, needsRedirect: true, isExactMatch: false, redirectSource: 'base_slug' };
      }
      
      // STEP 2c: If baseSlug wasn't found, log and continue to other strategies
      
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
        const basePath = isFestival 
          ? `/festival/${eventData.slug}` 
          : `/concierto/${eventData.slug}`;
        
        // Check if current path is valid for this event:
        // 1. Exact match with base slug
        // 2. SEO-friendly format (base slug + date suffix)
        const redirectSource = 'redirectSource' in eventData ? eventData.redirectSource : null;
        const isValidPath = location.pathname === basePath || 
          location.pathname.startsWith(`${basePath}-`) ||
          redirectSource === 'seo_date_format';
        
        // Only redirect if on completely wrong route
        if (!isValidPath) {
          // Check if at least on correct route type
          const isCorrectRouteType = isFestival 
            ? location.pathname.startsWith('/festival/')
            : location.pathname.startsWith('/concierto/');
          
          // If wrong route type, redirect to correct one
          if (!isCorrectRouteType) {
            console.log(`Route type redirect: ${location.pathname} → ${basePath}`);
            navigate(basePath, { replace: true });
          }
          // If correct route type but path doesn't match, SEO format is being used - don't redirect
        }
        return;
      }
      
      // Legacy URL - needs redirect to the correct slug
      if (eventData.needsRedirect) {
        // Check for forced festival route (festival accessed via /concierto or /artista)
        const forceFestival = 'forceFestivalRoute' in eventData && eventData.forceFestivalRoute;
        const isFestival = forceFestival || eventData.event_type === 'festival';
        const newPath = isFestival 
          ? `/festival/${eventData.slug}` 
          : `/concierto/${eventData.slug}`;
        
        console.log(`Legacy redirect: ${location.pathname} → ${newPath} (forceFestival: ${forceFestival})`);
        navigate(newPath, { replace: true });
      }
    } else if (isFetched && !eventData) {
      // No event found - redirect to list page based on current route or slug pattern
      console.warn(`Event not found: "${rawSlug}", redirecting to list page`);
      
      // If slug looks like a festival, redirect to festivals page
      if (isFestivalRoute || slugLooksLikeFestival) {
        navigate('/festivales', { replace: true });
      } else {
        navigate('/conciertos', { replace: true });
      }
    }
  }, [eventData, isLoading, isFetched, navigate, location.pathname, rawSlug, isFestivalRoute, slugLooksLikeFestival]);

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
    const basePath = isFestival ? `/festival/${eventData.slug}` : `/concierto/${eventData.slug}`;
    
    // Check if current path matches expected route type
    const isCorrectRouteType = isFestival 
      ? location.pathname.startsWith('/festival/')
      : location.pathname.startsWith('/concierto/');
    
    // For SEO-friendly URLs, check if the path starts with the base path pattern
    // Accept: exact match, path with date suffix, or SEO date format matches
    const redirectSource = 'redirectSource' in eventData ? eventData.redirectSource : null;
    const pathMatchesEvent = location.pathname === basePath || 
      location.pathname.startsWith(`${basePath}-`) ||
      (redirectSource === 'seo_date_format' && isCorrectRouteType);
    
    if (pathMatchesEvent) {
      return (
        <Suspense fallback={<PageLoader />}>
          <Producto />
        </Suspense>
      );
    }
  }

  // For legacy URLs that need redirect, show redirect loader with SEO meta tags
  if (eventData?.needsRedirect) {
    const forceFestival = 'forceFestivalRoute' in eventData && eventData.forceFestivalRoute;
    const isFestival = forceFestival || eventData.event_type === 'festival';
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
