import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "@/lib/searchUtils";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useEffect, useMemo } from "react";

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generates URL-friendly slug from name (accent-insensitive)
 */
const generateSlug = (name: string): string => {
  return normalizeSearch(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
};

/**
 * Maps genre subcategory names to their correct URL slugs
 * This ensures breadcrumb links match actual routes in /generos/:slug
 */
const GENRE_SLUG_MAP: Record<string, string> = {
  'Pop/Rock': 'pop-rock',
  'poprock': 'pop-rock',
  'Hard Rock/Metal': 'hard-rock-metal',
  'hardrockmetall': 'hard-rock-metal',
  'Dance/Electrónica': 'dance-electronica',
  'danceelectronica': 'dance-electronica',
  'Jazz/Blues': 'jazz-blues',
  'jazzblues': 'jazz-blues',
  'Hip-hop/R&B': 'hip-hop-rb',
  'hiphoprab': 'hip-hop-rb',
  'hiphopb': 'hip-hop-rb',
  'hip-hoprb': 'hip-hop-rb',
  'Indie/Alternativo': 'indie-alternativo',
  'indiealternativo': 'indie-alternativo',
  'Otros - Música': 'otros-musica',
  'otrosmusica': 'otros-musica',
  'otros-musica': 'otros-musica',
  'World': 'world',
  'Reggae': 'reggae',
  'Soul': 'soul',
  'Festival de Música': 'festival-de-musica',
  'festivaldemusica': 'festival-de-musica',
};

/**
 * Gets the correct genre slug for URL routing
 * Prioritizes the mapping table, falls back to slug generation
 */
const getGenreSlug = (genreName: string): string => {
  if (!genreName) return '';
  
  // Check direct mapping first
  if (GENRE_SLUG_MAP[genreName]) {
    return GENRE_SLUG_MAP[genreName];
  }
  
  // Check normalized version
  const normalized = generateSlug(genreName);
  if (GENRE_SLUG_MAP[normalized]) {
    return GENRE_SLUG_MAP[normalized];
  }
  
  // Fallback to generated slug
  return normalized;
};

/**
 * Transforms slug or raw text into elegant display text
 * Examples: 
 *   'heavy-metal' → 'Heavy Metal'
 *   'pop-rock' → 'Pop Rock'
 *   'hip-hop-rap' → 'Hip Hop Rap'
 *   'r-b' → 'R&B'
 */
const formatDisplayText = (text: string): string => {
  if (!text) return '';
  
  // Special cases mapping
  const specialCases: Record<string, string> = {
    'r-b': 'R&B',
    'r&b': 'R&B',
    'dj': 'DJ',
    'edm': 'EDM',
    'uk': 'UK',
    'usa': 'USA',
    'pop-rock': 'Pop/Rock',
    'poprock': 'Pop/Rock',
    'hip-hop': 'Hip Hop',
    'hiphop': 'Hip Hop',
  };
  
  const lowerText = text.toLowerCase();
  if (specialCases[lowerText]) {
    return specialCases[lowerText];
  }
  
  // Replace hyphens/underscores with spaces and capitalize each word
  return text
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => {
      // Handle special abbreviations
      const lowerWord = word.toLowerCase();
      if (specialCases[lowerWord]) return specialCases[lowerWord];
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Cleans up genre name for display
 */
const cleanGenreName = (genre: string): string => {
  if (!genre) return '';
  // Remove suffixes like " - España" or " Spain"
  const cleaned = genre.split(' - ')[0].split(' Spain')[0].trim();
  return formatDisplayText(cleaned);
};

/**
 * Cleans up city name for display
 */
const cleanCityName = (city: string): string => {
  if (!city) return '';
  return formatDisplayText(city);
};

const linkClass = "hover:text-foreground hover:underline transition-colors";

// ============================================
// TYPES
// ============================================

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbsProps {
  /** Override automatic breadcrumb generation with custom items */
  items?: BreadcrumbItem[];
  /** Whether to inject JSON-LD (default: true) */
  injectJsonLd?: boolean;
}

// ============================================
// SCHEMA.ORG JSON-LD GENERATION
// ============================================

/**
 * Generates BreadcrumbList JSON-LD schema for SEO
 * Follows Google's structured data guidelines for breadcrumbs
 */
const generateBreadcrumbJsonLd = (items: BreadcrumbItem[]) => {
  if (!items || items.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { 
        "item": item.url.startsWith('http') 
          ? item.url 
          : `https://feelomove.com${item.url}` 
      })
    }))
  };
};

/**
 * Injects BreadcrumbList JSON-LD into document head
 */
const useBreadcrumbJsonLd = (items: BreadcrumbItem[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled || !items || items.length === 0) return;
    
    const scriptId = 'breadcrumb-jsonld';
    
    // Remove existing script
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create and inject new script
    const jsonLd = generateBreadcrumbJsonLd(items);
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    
    // Cleanup on unmount
    return () => {
      const script = document.getElementById(scriptId);
      if (script) {
        script.remove();
      }
    };
  }, [items, enabled]);
};

// ============================================
// MAIN COMPONENT
// ============================================

const Breadcrumbs = ({ items: customItems, injectJsonLd = true }: BreadcrumbsProps) => {
  const location = useLocation();
  const params = useParams();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { prefetch } = usePrefetch();

  // ============================================
  // PAGE TYPE DETECTION
  // ============================================
  
  const isConcertProductPage = pathnames[0] === "concierto";
  const isFestivalProductPage = pathnames[0] === "festival";
  const isProductPage = isConcertProductPage || isFestivalProductPage;
  const productSlug = isProductPage ? params.slug : null;

  // ============================================
  // DATA FETCHING - Event Details
  // ============================================
  
  const { data: eventDetails } = useQuery({
    queryKey: ["event-breadcrumb-full", productSlug, isFestivalProductPage],
    queryFn: async () => {
      if (!productSlug) return null;
      
      // Use festival-specific view for festivals, concert-specific for concerts
      const viewName = isFestivalProductPage 
        ? "lovable_mv_event_product_page_festivales" 
        : "lovable_mv_event_product_page_conciertos";
      
      const { data, error } = await supabase
        .from(viewName)
        .select(`
          event_name, 
          event_slug,
          primary_subcategory_name, 
          primary_category_name, 
          venue_city,
          event_type
        `)
        .eq("event_slug", productSlug)
        .maybeSingle();
      
      if (error || !data) {
        // Fallback to generic view
        const { data: fallbackData } = await supabase
          .from("lovable_mv_event_product_page")
          .select(`
            event_name, 
            event_slug,
            primary_subcategory_name, 
            primary_category_name, 
            venue_city,
            event_type
          `)
          .eq("event_slug", productSlug)
          .maybeSingle();
        return fallbackData;
      }
      return data;
    },
    enabled: !!productSlug,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // ============================================
  // DATA FETCHING - City Slug from Mapping
  // ============================================
  
  const venueCity = eventDetails?.venue_city;
  
  const { data: cityMapping } = useQuery({
    queryKey: ["city-mapping-breadcrumb", venueCity],
    queryFn: async () => {
      if (!venueCity) return null;
      
      // Search in city mapping table for the destination slug
      const { data } = await supabase
        .from("lite_tbl_city_mapping")
        .select("ticketmaster_city, liteapi_city")
        .ilike("ticketmaster_city", venueCity)
        .maybeSingle();
      
      if (data) {
        return {
          cityName: data.ticketmaster_city,
          citySlug: generateSlug(data.ticketmaster_city)
        };
      }
      
      // Fallback: check destinations cards view
      const { data: destData } = await supabase
        .from("mv_destinations_cards")
        .select("city_name, city_slug")
        .ilike("city_name", venueCity)
        .maybeSingle();
      
      if (destData) {
        return {
          cityName: destData.city_name,
          citySlug: destData.city_slug
        };
      }
      
      // Last resort: generate slug from venue city
      return {
        cityName: venueCity,
        citySlug: generateSlug(venueCity)
      };
    },
    enabled: !!venueCity && isProductPage,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // ============================================
  // DATA FETCHING - Artist Details (for artist pages)
  // ============================================
  
  const artistSlugRaw = pathnames[0] === "conciertos" && pathnames.length === 2 && params.artistSlug 
    ? decodeURIComponent(params.artistSlug) 
    : null;
  const artistSlug = artistSlugRaw ? artistSlugRaw.toLowerCase().replace(/-+/g, '-') : null;
  
  const { data: artistData } = useQuery({
    queryKey: ["artist-breadcrumb", artistSlug],
    queryFn: async () => {
      if (!artistSlug) return null;
      
      const { data } = await supabase
        .from("mv_attractions")
        .select("attraction_name")
        .eq("attraction_slug", artistSlug)
        .maybeSingle();
      
      return data?.attraction_name || null;
    },
    enabled: !!artistSlug,
  });

  // ============================================
  // DATA FETCHING - Destination Details (for destination pages)
  // ============================================
  
  const destinoSlug = pathnames[0] === "destinos" && params.destino 
    ? decodeURIComponent(params.destino) 
    : null;
  
  const { data: destinoData } = useQuery({
    queryKey: ["destino-breadcrumb", destinoSlug],
    queryFn: async () => {
      if (!destinoSlug) return null;
      
      const { data } = await supabase
        .from("mv_destinations_cards")
        .select("city_name")
        .eq("city_slug", destinoSlug)
        .maybeSingle();
      
      return data?.city_name || null;
    },
    enabled: !!destinoSlug,
  });

  // ============================================
  // DERIVED DATA
  // ============================================
  
  // Extract genre from event (prefer subcategory, fallback to category)
  const eventGenre = eventDetails?.primary_subcategory_name || eventDetails?.primary_category_name || null;
  const genreFromPath = params.genero ? decodeURIComponent(params.genero) : null;

  // ============================================
  // BREADCRUMB ITEMS BUILDER
  // ============================================
  
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    // If custom items provided, use those
    if (customItems && customItems.length > 0) {
      return customItems;
    }
    
    const items: BreadcrumbItem[] = [
      { name: "Inicio", url: "/" }
    ];

    // ----------------------------------------
    // CONCERT PRODUCT PAGE (5 levels)
    // Inicio > Conciertos > Género > Ciudad > Evento
    // ----------------------------------------
    if (isConcertProductPage && eventDetails) {
      // Level 2: Conciertos
      items.push({
        name: "Conciertos",
        url: "/conciertos"
      });
      
      // Level 3: Genre (if available)
      if (eventGenre) {
        const genreSlug = getGenreSlug(eventGenre);
        items.push({
          name: cleanGenreName(eventGenre),
          url: `/generos/${genreSlug}`
        });
      }
      
      // Level 4: City (if available)
      if (cityMapping || eventDetails.venue_city) {
        const cityName = cityMapping?.cityName || eventDetails.venue_city;
        const citySlug = cityMapping?.citySlug || generateSlug(eventDetails.venue_city);
        items.push({
          name: cleanCityName(cityName),
          url: `/destinos/${citySlug}`
        });
      }
      
      // Level 5: Event name (no URL - current page)
      items.push({
        name: eventDetails.event_name || ''
      });
      
      return items;
    }

    // ----------------------------------------
    // FESTIVAL PRODUCT PAGE (5 levels)
    // Inicio > Festivales > Género > Ciudad > Evento
    // ----------------------------------------
    if (isFestivalProductPage && eventDetails) {
      // Level 2: Festivales
      items.push({
        name: "Festivales",
        url: "/festivales"
      });
      
      // Level 3: Genre (if available)
      if (eventGenre) {
        const genreSlug = getGenreSlug(eventGenre);
        items.push({
          name: cleanGenreName(eventGenre),
          url: `/generos/${genreSlug}`
        });
      }
      
      // Level 4: City (if available)
      if (cityMapping || eventDetails.venue_city) {
        const cityName = cityMapping?.cityName || eventDetails.venue_city;
        const citySlug = cityMapping?.citySlug || generateSlug(eventDetails.venue_city);
        items.push({
          name: cleanCityName(cityName),
          url: `/destinos/${citySlug}`
        });
      }
      
      // Level 5: Event name (no URL - current page)
      items.push({
        name: eventDetails.event_name || ''
      });
      
      return items;
    }

    // ----------------------------------------
    // GENRE PAGE
    // Inicio > Géneros > Nombre del Género
    // ----------------------------------------
    if (pathnames[0] === "generos" && genreFromPath) {
      items.push({ name: "Géneros", url: "/generos" });
      items.push({ name: formatDisplayText(genreFromPath) });
      return items;
    }
    
    // ----------------------------------------
    // MUSIC/GENRE PAGE (legacy)
    // Inicio > Géneros > Nombre del Género
    // ----------------------------------------
    if (pathnames[0] === "musica" && pathnames.length === 2) {
      items.push({ name: "Géneros", url: "/generos" });
      items.push({ name: formatDisplayText(pathnames[1]) });
      return items;
    }

    // ----------------------------------------
    // DESTINATION PAGE
    // Inicio > Destinos > Ciudad
    // ----------------------------------------
    if (pathnames[0] === "destinos" && destinoSlug) {
      items.push({ name: "Destinos", url: "/destinos" });
      const cityName = destinoData || formatDisplayText(destinoSlug);
      items.push({ name: cityName });
      return items;
    }

    // ----------------------------------------
    // ARTIST PAGE
    // Inicio > Artistas > Nombre del Artista
    // ----------------------------------------
    if (pathnames[0] === "conciertos" && artistSlug) {
      items.push({ name: "Artistas", url: "/artistas" });
      const artistName = artistData || formatDisplayText(artistSlug);
      items.push({ name: artistName });
      return items;
    }

    // ----------------------------------------
    // FESTIVAL DETAIL PAGE (from /festivales/:slug)
    // Inicio > Festivales > Nombre del Festival
    // ----------------------------------------
    if (pathnames[0] === "festivales" && pathnames.length === 2) {
      items.push({ name: "Festivales", url: "/festivales" });
      // Decode URL encoding first, then extract festival name before underscore
      const decodedSlug = decodeURIComponent(pathnames[1]);
      const festivalName = formatDisplayText(decodedSlug.split('_')[0]);
      items.push({ name: festivalName });
      return items;
    }

    // ----------------------------------------
    // DEFAULT: Map pathnames to breadcrumb names
    // ----------------------------------------
    const breadcrumbNames: Record<string, string> = {
      about: "Nosotros",
      destinos: "Destinos",
      musica: "Géneros",
      generos: "Géneros",
      eventos: "Eventos",
      conciertos: "Conciertos",
      festivales: "Festivales",
      artistas: "Artistas",
      favoritos: "Favoritos",
    };

    pathnames.forEach((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
      const isLast = index === pathnames.length - 1;
      const displayName = breadcrumbNames[name] || formatDisplayText(decodeURIComponent(name));
      
      items.push({
        name: displayName,
        url: isLast ? undefined : routeTo
      });
    });

    return items;
  }, [
    customItems, 
    isConcertProductPage, 
    isFestivalProductPage, 
    eventDetails, 
    eventGenre, 
    cityMapping,
    genreFromPath, 
    pathnames, 
    destinoSlug, 
    destinoData, 
    artistSlug, 
    artistData
  ]);

  // ============================================
  // INJECT JSON-LD FOR SEO
  // ============================================
  
  useBreadcrumbJsonLd(breadcrumbItems, injectJsonLd);

  // ============================================
  // RENDER
  // ============================================

  return (
    <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4 pb-1" aria-label="Breadcrumb">
      <ol 
        className="flex items-center text-xs sm:text-sm text-muted-foreground whitespace-nowrap" 
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li 
              key={`${item.name}-${index}`} 
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {/* Separator (not for first item) */}
              {!isFirst && (
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60 flex-shrink-0" />
              )}
              
              {/* Home icon for first item */}
              {isFirst ? (
                <Link
                  to={item.url || "/"}
                  className="flex items-center hover:text-foreground transition-colors p-1 -m-1 rounded"
                  aria-label="Inicio"
                  itemProp="item"
                  onMouseEnter={() => prefetch("/")}
                >
                  <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <meta itemProp="name" content={item.name} />
                </Link>
              ) : isLast || !item.url ? (
                // Last item or no URL: display as plain text (not a link)
                <span 
                  className="text-foreground font-semibold truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" 
                  itemProp="name"
                  title={item.name}
                >
                  {item.name}
                </span>
              ) : (
                // Middle items: display as links
                <Link
                  to={item.url}
                  className={`${linkClass} truncate max-w-[80px] sm:max-w-[150px] md:max-w-none`}
                  itemProp="item"
                  onMouseEnter={() => item.url && prefetch(item.url)}
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              
              {/* Position meta for schema.org */}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

// ============================================
// EXPORTS
// ============================================

export { generateBreadcrumbJsonLd, formatDisplayText, cleanGenreName, cleanCityName, getGenreSlug, generateSlug };
export type { BreadcrumbItem as BreadcrumbItemType };
