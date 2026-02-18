import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";
import { FestivalCardSkeleton } from "@/components/ui/skeleton-loader";
import FestivalCard from "@/components/FestivalCard";
import ParentFestivalCard from "@/components/ParentFestivalCard";
import FestivalListCard, { FestivalListCardSkeleton } from "@/components/FestivalListCard";
import { FestivalProductPage } from "@/types/events.types";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

const monthsEs = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const monthsEn = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Interface for normalized festival event with corrected names
interface NormalizedFestival extends FestivalProductPage {
  festival_nombre: string;  // Always the festival brand
  artista_nombre: string | null;  // Artist if it's a day entry
  tipo_producto: 'ABONO / GENERAL' | 'ENTRADA DE DÍA';
}

// Interface for grouped parent festivals - uses primary_attraction as festival identity
interface ParentFestival {
  primary_attraction_id: string;
  festival_nombre: string;
  venue_city: string;
  event_count: number;
  events: NormalizedFestival[];
  abonos: NormalizedFestival[];  // Festival passes, parking, services
  entradas_dia: NormalizedFestival[];  // Individual artist entries
  image_large_url: string;
  min_start_date: string;
  max_end_date: string;
  total_artists: number;
  // On sale date for "coming soon" badge
  earliest_on_sale_date?: string | null;
}

// Interface for consolidated artist entries (same artist + date = same concert with different prices)
interface ConsolidatedArtistEntry {
  artista_nombre: string;
  festival_nombre: string;
  event_date: string;
  events: NormalizedFestival[];  // All price options for this concert
  image_large_url: string;
  venue_city: string;
  venue_name: string;
  min_price: number | null;
  max_price: number | null;
}

// Keywords that identify a festival name (case-insensitive)
const FESTIVAL_KEYWORDS = [
  'Festival', 'Concert Music', 'Starlite', 'Fest', 'Sonar', 'Primavera', 
  'BBK Live', 'Mad Cool', 'Arenal', 'Medusa', 'Weekend', 'Viña Rock',
  'Cruïlla', 'Rototom', 'Monegros', 'FIB', 'Low Festival', 'Dreambeach',
  'A Summer Story', 'Reggaeton Beach', 'Abono'
];

// Helper to check if a string contains festival keywords
const containsFestivalKeyword = (name: string | null | undefined): boolean => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return FESTIVAL_KEYWORDS.some(keyword => 
    lowerName.includes(keyword.toLowerCase())
  );
};

// Helper to extract clean artist name from event_name
// e.g., "Lola Índigo - Concert Music Festival" → "Lola Índigo"
const extractArtistFromEventName = (eventName: string, festivalName: string): string => {
  if (!eventName || !festivalName) return eventName;
  
  // Common separators: " - ", " en ", " at "
  const separators = [' - ', ' – ', ' — ', ' en ', ' at '];
  
  for (const sep of separators) {
    if (eventName.includes(sep)) {
      const parts = eventName.split(sep);
      // Find the part that's NOT the festival name
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!containsFestivalKeyword(trimmedPart) && 
            trimmedPart.toLowerCase() !== festivalName.toLowerCase()) {
          return trimmedPart;
        }
      }
    }
  }
  
  // Try removing the festival name directly
  const festivalLower = festivalName.toLowerCase();
  const eventLower = eventName.toLowerCase();
  if (eventLower.includes(festivalLower)) {
    const cleaned = eventName
      .replace(new RegExp(festivalName, 'gi'), '')
      .replace(/[-–—]/g, '')
      .trim();
    if (cleaned && cleaned.length > 2) return cleaned;
  }
  
  return eventName;
};

// Normalize festival data: apply forced re-mapping logic
const normalizeFestival = (festival: FestivalProductPage): NormalizedFestival => {
  const primaryName = festival.primary_attraction_name || '';
  const secondaryName = festival.secondary_attraction_name || '';
  const eventName = festival.event_name || '';
  const venueName = festival.venue_name || '';
  
  // Step 1: Find the festival name from ALL possible fields
  // Priority: Check primary, secondary, venue_name, event_name
  let festival_nombre: string = '';
  let artista_nombre: string | null = null;
  
  const primaryIsFestival = containsFestivalKeyword(primaryName);
  const secondaryIsFestival = containsFestivalKeyword(secondaryName);
  const venueIsFestival = containsFestivalKeyword(venueName);
  const eventIsFestival = containsFestivalKeyword(eventName);
  
  // Case 1: Secondary is festival, Primary is artist (INVERTED DATA)
  // e.g., primary="Lola Indigo", secondary="Concert Music Festival"
  if (secondaryIsFestival && !primaryIsFestival) {
    festival_nombre = secondaryName;
    artista_nombre = primaryName || null;
  }
  // Case 2: Venue name is the festival (common pattern)
  // e.g., venue_name="Concert Music Festival", primary="Lola Indigo"
  else if (venueIsFestival && !primaryIsFestival && !secondaryIsFestival) {
    festival_nombre = venueName;
    artista_nombre = primaryName || secondaryName || null;
  }
  // Case 3: Event name contains festival but primary is artist
  // e.g., event_name="Lola Índigo - Concert Music Festival", primary="Lola Indigo"
  else if (eventIsFestival && !primaryIsFestival) {
    // Extract festival from event_name
    const eventLower = eventName.toLowerCase();
    for (const keyword of FESTIVAL_KEYWORDS) {
      if (eventLower.includes(keyword.toLowerCase())) {
        // Find the full festival name in event_name
        const keywordIndex = eventLower.indexOf(keyword.toLowerCase());
        // Get text from keyword to end or separator
        const afterKeyword = eventName.substring(keywordIndex);
        const endMatch = afterKeyword.match(/^[^-–—\n]+/);
        festival_nombre = endMatch ? endMatch[0].trim() : eventName;
        artista_nombre = primaryName || null;
        break;
      }
    }
    if (!festival_nombre) {
      festival_nombre = eventName;
    }
  }
  // Case 4: Normal case - primary is festival
  else if (primaryIsFestival) {
    festival_nombre = primaryName;
    artista_nombre = secondaryName && secondaryName !== primaryName ? secondaryName : null;
  }
  // Case 5: Fallback - use event_name as festival
  else {
    festival_nombre = primaryName || eventName;
    artista_nombre = secondaryName && secondaryName !== primaryName ? secondaryName : null;
  }
  
  // Step 2: Clean up artist name from event_name if needed
  if (artista_nombre && festival_nombre) {
    artista_nombre = extractArtistFromEventName(artista_nombre, festival_nombre);
  }
  
  // Step 3: Classify tipo_producto based on event_name content
  let tipo_producto: 'ABONO / GENERAL' | 'ENTRADA DE DÍA';
  
  const eventNameLower = eventName.toLowerCase();
  const isAbonoByName = eventNameLower.includes('abono') || 
                        eventNameLower.includes('pase') ||
                        eventNameLower.includes('pass') ||
                        eventNameLower.includes('parking') ||
                        eventNameLower.includes('camping');
  
  // If event_name only contains festival name (no artist) → ABONO
  // If event_name contains an artist name → ENTRADA DE DÍA
  if (isAbonoByName || !artista_nombre) {
    tipo_producto = 'ABONO / GENERAL';
  } else {
    tipo_producto = 'ENTRADA DE DÍA';
  }
  
  // Also check the flags from the database
  if (festival.has_festival_pass && !artista_nombre) {
    tipo_producto = 'ABONO / GENERAL';
  }
  if (festival.has_daily_tickets && artista_nombre) {
    tipo_producto = 'ENTRADA DE DÍA';
  }
  
  return {
    ...festival,
    festival_nombre,
    artista_nombre,
    tipo_producto
  };
};

const Festivales = () => {
  const { t, locale } = useTranslation();
  const months = locale === 'en' ? monthsEn : monthsEs;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterSort, setFilterSort] = useState<string>("recientes");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Fetch festivals using the new dedicated festivals view
  const { data: festivals, isLoading } = useQuery({
    queryKey: ["festivales-list"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("lovable_mv_event_product_page_festivales" as any)
        .select("*") as any)
        .order("start_date", { ascending: true });
      
      if (error) throw error;
      return (data || []) as FestivalProductPage[];
    }
  });

  // Normalize and group festivals
  const groupedFestivals = useMemo(() => {
    if (!festivals) return { parentFestivals: [] as ParentFestival[], standaloneFestivals: [] as NormalizedFestival[] };
    
    // Filter out past events, transport/service events, and normalize all festivals
    const validFestivals = festivals.filter(f => {
      // Exclude transport/service events - they are shown within their parent festival
      if (f.is_transport === true) return false;
      
      const dateStr = f.festival_start_date || f.event_date;
      if (!dateStr || dateStr.startsWith('9999')) return true; // Keep TBC dates
      return new Date(dateStr) >= new Date();
    }).map(normalizeFestival);
    
    // Group by festival_nombre + venue_city (to separate same festival in different cities)
    const festivalMap = new Map<string, NormalizedFestival[]>();
    
    validFestivals.forEach(festival => {
      // Create a composite key: festival name + city for proper grouping
      const key = `${festival.festival_nombre}_${festival.venue_city || 'unknown'}`;
      const existing = festivalMap.get(key) || [];
      existing.push(festival);
      festivalMap.set(key, existing);
    });
    
    const parentFestivals: ParentFestival[] = [];
    const standalone: NormalizedFestival[] = [];
    
    festivalMap.forEach((events, festivalName) => {
      // Separate by tipo_producto
      const abonos = events.filter(e => e.tipo_producto === 'ABONO / GENERAL');
      const entradasDia = events.filter(e => e.tipo_producto === 'ENTRADA DE DÍA');
      
      // Consolidate artists: group entries with same artista_nombre + event_date
      const consolidatedEntradasDia: NormalizedFestival[] = [];
      const artistDateMap = new Map<string, NormalizedFestival[]>();
      
      entradasDia.forEach(entry => {
        const key = `${entry.artista_nombre || ''}_${entry.event_date}`;
        const existing = artistDateMap.get(key) || [];
        existing.push(entry);
        artistDateMap.set(key, existing);
      });
      
      // Take only the first entry for each artist+date combination (others are price options)
      artistDateMap.forEach((entries) => {
        if (entries.length > 0) {
          // Sort by price to get the cheapest option first
          entries.sort((a, b) => (a.price_min_incl_fees || 0) - (b.price_min_incl_fees || 0));
          consolidatedEntradasDia.push(entries[0]);
        }
      });
      
      // If festival has multiple events (abonos OR day entries), it's a parent festival
      if (events.length > 1 || entradasDia.length > 0) {
        const firstEvent = abonos[0] || events[0];
        
        // Find min/max dates, excluding placeholder dates
        const validDates = events.filter(e => {
          const d = e.festival_start_date || e.event_date;
          return d && !d.startsWith('9999');
        });
        
        const minDate = validDates.length > 0 
          ? validDates.reduce((min, e) => {
              const d = e.festival_start_date || e.event_date || '';
              return d < min ? d : min;
            }, validDates[0].festival_start_date || validDates[0].event_date || '')
          : '9999-12-31';
          
        const maxDate = validDates.length > 0
          ? validDates.reduce((max, e) => {
              const d = e.festival_end_date || e.event_date || '';
              return d > max ? d : max;
            }, validDates[0].festival_end_date || validDates[0].event_date || '')
          : '9999-12-31';
        
        // Count unique artists across all events
        const allArtists = events.flatMap(e => e.festival_lineup_artists || []);
        const artistFromEntries = consolidatedEntradasDia.map(e => e.artista_nombre).filter(Boolean);
        const uniqueArtists = [...new Set([...allArtists, ...artistFromEntries])];
        
        // Find earliest on_sale_date for "coming soon" badge
        const onSaleDates = events
          .map(e => e.on_sale_date)
          .filter(d => d && !d.startsWith('9999'))
          .sort();
        const earliestOnSaleDate = onSaleDates.length > 0 ? onSaleDates[0] : null;
        
        parentFestivals.push({
          primary_attraction_id: firstEvent.primary_attraction_id,
          festival_nombre: festivalName,
          venue_city: firstEvent.venue_city,
          event_count: abonos.length + consolidatedEntradasDia.length,
          events,
          abonos,
          entradas_dia: consolidatedEntradasDia,
          image_large_url: firstEvent.image_large_url,
          min_start_date: minDate,
          max_end_date: maxDate,
          total_artists: uniqueArtists.length,
          earliest_on_sale_date: earliestOnSaleDate
        });
      } else {
        // Single event standalone festival
        standalone.push(...events);
      }
    });
    
    return { parentFestivals, standaloneFestivals: standalone };
  }, [festivals]);

  // Get unique cities and genres for filters
  const cities = useMemo(() => {
    if (!festivals) return [];
    const uniqueCities = [...new Set(festivals.map(f => f.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [festivals]);

  const genres = useMemo(() => {
    if (!festivals) return [];
    const uniqueGenres = [...new Set(festivals.map(f => f.primary_subcategory_name).filter(Boolean))];
    return uniqueGenres.sort() as string[];
  }, [festivals]);

  // Get unique artists from lineup
  const artists = useMemo(() => {
    if (!festivals) return [];
    const allArtists = festivals.flatMap(f => f.festival_lineup_artists || []);
    const uniqueArtists = [...new Set(allArtists.filter(Boolean))];
    return uniqueArtists.sort() as string[];
  }, [festivals]);

  // Filter parent festivals and standalone festivals
  const filteredData = useMemo(() => {
    const { parentFestivals, standaloneFestivals } = groupedFestivals;
    
    // Filter function for individual festivals
    const matchesFestival = (festival: FestivalProductPage) => {
      // Search filter
      if (searchQuery) {
        const matchesName = matchesSearch(festival.event_name, searchQuery) ||
          matchesSearch(festival.venue_city, searchQuery) ||
          matchesSearch(festival.venue_name, searchQuery) ||
          matchesSearch(festival.secondary_attraction_name || '', searchQuery) ||
          (festival.festival_lineup_artists || []).some(h => matchesSearch(h, searchQuery));
        if (!matchesName) return false;
      }
      
      // Artist filter - check lineup
      if (filterArtist !== "all") {
        const lineup = festival.festival_lineup_artists || [];
        if (!lineup.some(a => a === filterArtist)) return false;
      }
      
      // City filter
      if (filterCity !== "all" && festival.venue_city !== filterCity) return false;
      
      // Genre filter
      if (filterGenre !== "all" && festival.primary_subcategory_name !== filterGenre) return false;
      
      // Month filter
      if (filterMonth !== "all") {
        if (!festival.festival_start_date) return false;
        const eventMonth = new Date(festival.festival_start_date).toISOString().slice(5, 7);
        if (eventMonth !== filterMonth) return false;
      }
      
      return true;
    };
    
    // Filter standalone festivals
    let filteredStandalone = standaloneFestivals.filter(matchesFestival);
    
    // Filter parent festivals (keep if any child matches)
    let filteredParents = parentFestivals.filter(parent => 
      parent.events.some(matchesFestival)
    ).map(parent => ({
      ...parent,
      events: parent.events.filter(matchesFestival)
    }));
    
    // Sort
    if (filterSort === "recientes") {
      // Sort by event_id descending as proxy for recently added (higher IDs = newer)
      filteredStandalone.sort((a, b) => String(b.event_id).localeCompare(String(a.event_id)));
      filteredParents.sort((a, b) => {
        const aMaxId = Math.max(...a.events.map(e => parseInt(e.event_id) || 0));
        const bMaxId = Math.max(...b.events.map(e => parseInt(e.event_id) || 0));
        return bMaxId - aMaxId;
      });
    } else {
      filteredStandalone.sort((a, b) => 
        new Date(a.festival_start_date).getTime() - new Date(b.festival_start_date).getTime()
      );
      filteredParents.sort((a, b) => 
        new Date(a.min_start_date).getTime() - new Date(b.min_start_date).getTime()
      );
    }
    
    return { parentFestivals: filteredParents, standaloneFestivals: filteredStandalone };
  }, [groupedFestivals, searchQuery, filterArtist, filterCity, filterGenre, filterMonth, filterSort]);

  // Get hero image from first festival
  const heroImage = festivals?.[0]?.image_large_url || "/placeholder.svg";

  // Total count - count parent festivals as 1 festival each, plus standalone
  const totalCount = filteredData.parentFestivals.length + filteredData.standaloneFestivals.length;

  // Generate JSON-LD for festivals list
  const allFilteredFestivals = [...filteredData.standaloneFestivals, ...filteredData.parentFestivals.flatMap(p => p.events)];
  const jsonLd = allFilteredFestivals.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Festivales en España",
    "description": "Lista de festivales de música disponibles en España",
    "numberOfItems": allFilteredFestivals.length,
    "itemListElement": allFilteredFestivals.slice(0, 20).filter(f => f.festival_start_date && !f.festival_start_date.startsWith('9999')).map((festival, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Festival",
        "name": festival.event_name,
        "startDate": festival.festival_start_date,
        "endDate": festival.festival_end_date || festival.festival_start_date,
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": festival.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/EventScheduled",
        "url": `https://feelomove.com/${locale === 'en' ? 'en/festivals' : 'festivales'}/${festival.event_slug}`,
        "description": locale === 'en'
          ? `${festival.event_name} music festival in ${festival.venue_city}, Spain. Buy tickets and book nearby hotels.`
          : `Festival de música ${festival.event_name} en ${festival.venue_city}. Compra entradas y reserva hotel cercano.`,
        ...(festival.image_large_url && { "image": [festival.image_large_url] }),
        "location": {
          "@type": "Place",
          "name": festival.venue_name || festival.venue_city,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": festival.venue_city,
            "addressCountry": "ES"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": "FEELOMOVE+",
          "url": "https://feelomove.com"
        },
        "offers": {
          "@type": "Offer",
          "url": `https://feelomove.com/${locale === 'en' ? 'en/festivals' : 'festivales'}/${festival.event_slug}`,
          ...(festival.price_min_incl_fees != null && festival.price_min_incl_fees > 0 && { "price": festival.price_min_incl_fees }),
          "priceCurrency": "EUR",
          "availability": festival.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock"
        },
        ...(festival.festival_headliners && festival.festival_headliners.length > 0 && {
          "performer": festival.festival_headliners.map(name => ({
            "@type": "MusicGroup",
            "name": name
          }))
        })
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title={locale === 'en' ? "Music Festivals in Spain 2025 - Tickets and Hotels | Feelomove" : "Festivales de Música en España 2025 - Entradas y Hoteles | Feelomove"}
        description={locale === 'en' ? "Discover the best music festivals in Spain 2025. Buy tickets for rock, electronic, indie festivals and book hotels near the venue." : "Descubre los mejores festivales de música en España 2025. Compra tus entradas para festivales de rock, electrónica, indie y reserva hotel cerca del recinto."}
        canonical="/festivales"
        keywords="festivales españa 2025, festivales música, festivales verano, festivales madrid, festivales barcelona"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: t("Inicio"), url: "/" },
          { name: t("Festivales") }
        ]}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-4 md:py-8 mt-16">
          
          {/* Breadcrumbs - hidden on mobile */}
          <div className="hidden md:block mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image - hidden on mobile for faster content access */}
          <div className="hidden md:block">
            <PageHero 
              title={t("Festivales de Música en España")} 
              subtitle={t("Entradas + Hotel para los mejores festivales de 2025")}
              imageUrl={heroImage} 
              priority={true}
            />
          </div>
          
          {/* Mobile Header - compact */}
          <div className="md:hidden mb-3">
            <h1 className="text-xl font-bold text-foreground">{t("Festivales en España")}</h1>
            <p className="text-sm text-muted-foreground">{totalCount} {t("festivales disponibles")}</p>
          </div>

          {/* Mobile Search Bar - Above Filters */}
          <div className="md:hidden mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Buscar artista, festival...")}

                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-sm bg-card border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          {/* Desktop H2 */}
          <h2 className="hidden md:block text-2xl font-semibold text-foreground mt-6 mb-4">
            {t("Próximos festivales y eventos musicales destacados en España")}
          </h2>
          
          {/* Description - desktop only */}
          <div className="hidden md:block prose prose-lg max-w-none mb-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}>
            <p className="text-muted-foreground leading-relaxed">
              {t("Descubre todos los festivales de música en España. Desde festivales de verano hasta eventos multi-día. Encuentra tu festival perfecto y reserva hotel cerca del recinto.")}
            </p>
          </div>

          {/* Mobile Filters - Collapsible */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-lg text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>{t("Filtros")}</span>
                {(filterArtist !== "all" || filterCity !== "all") && (
                  <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                    {[filterArtist !== "all", filterCity !== "all"].filter(Boolean).length}
                  </span>
                )}
              </div>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showFilters && (
              <div className="mt-2 p-3 bg-card border border-border rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={filterArtist} onValueChange={setFilterArtist}>
                    <SelectTrigger className="h-9 text-xs">
                      <span className="truncate">{filterArtist === "all" ? t("Artista") : filterArtist}</span>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">{t("Todos los artistas")}</SelectItem>
                      {artists.map(artist => (
                        <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="h-9 text-xs">
                      <span className="truncate">{filterCity === "all" ? t("Ciudad") : filterCity}</span>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">{t("Todas las ciudades")}</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(filterArtist !== "all" || filterCity !== "all") && (
                  <button
                    onClick={() => {
                      setFilterArtist("all");
                      setFilterCity("all");
                      setShowFilters(false);
                    }}
                    className="text-xs text-destructive hover:underline w-full text-center pt-1"
                  >
                    {t("Limpiar filtros")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Search and Filters */}
          <div className="hidden md:block space-y-3 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Buscar festivales...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-card border-2 border-border rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-5 gap-2">
              <Select value={filterSort} onValueChange={setFilterSort}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterSort !== "proximos" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterSort === "proximos" ? t("Próximos") : t("Recientes")}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proximos">{t("Próximos")}</SelectItem>
                  <SelectItem value="recientes">{t("Añadidos recientemente")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterCity === "all" ? t("Ciudad") : filterCity}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todas las ciudades")}</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterGenre !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterGenre === "all" ? t("Género") : filterGenre}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todos los géneros")}</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonth !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterMonth === "all" ? t("Mes") : months.find(m => m.value === filterMonth)?.label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todos los meses")}</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterCity !== "all" || filterGenre !== "all" || filterMonth !== "all" || filterSort !== "proximos") && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilterCity("all");
                    setFilterGenre("all");
                    setFilterMonth("all");
                    setFilterSort("proximos");
                  }}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
                >
                  {t("Limpiar filtros")}
                </button>
              </div>
            )}
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground mb-4">
              {totalCount} {totalCount === 1 ? t('festival encontrado') : t('festivales encontrados')}
            </p>
          )}

          {/* Festival Cards - Mobile List / Desktop Grid */}
          {isLoading ? (
            <>
              {/* Mobile List Skeleton */}
              <div className="md:hidden space-y-0">
                {[...Array(6)].map((_, i) => (
                  <FestivalListCardSkeleton key={i} />
                ))}
              </div>
              {/* Desktop Grid Skeleton */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <FestivalCardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : totalCount === 0 ? (
            <div className="text-center py-16" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
              <p className="text-xl text-muted-foreground mb-4">{t("No se encontraron festivales")}</p>
              <p className="text-muted-foreground">{t("Prueba ajustando los filtros o la búsqueda")}</p>
            </div>
          ) : (
            <>
              {/* Mobile: Compact List View */}
              <div className="md:hidden -mx-4">
                {/* Parent Festivals */}
                {filteredData.parentFestivals.map((parent, index) => (
                  <FestivalListCard 
                    key={parent.primary_attraction_id} 
                    festival={parent}
                    priority={index < 6}
                  />
                ))}

                {/* Standalone Festivals */}
                {filteredData.standaloneFestivals.map((festival, index) => (
                  <FestivalListCard 
                    key={festival.event_id} 
                    festival={festival}
                    priority={filteredData.parentFestivals.length + index < 6}
                  />
                ))}
              </div>

              {/* Desktop: Grid View */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Parent Festivals - first 4 get priority loading for LCP */}
                {filteredData.parentFestivals.map((parent, index) => (
                  <ParentFestivalCard 
                    key={parent.primary_attraction_id} 
                    festival={parent}
                    priority={index < 4}
                  />
                ))}

                {/* Standalone Festivals - priority based on position */}
                {filteredData.standaloneFestivals.map((festival, index) => (
                  <FestivalCard 
                    key={festival.event_id} 
                    festival={festival}
                    priority={filteredData.parentFestivals.length + index < 4}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Festivales;
