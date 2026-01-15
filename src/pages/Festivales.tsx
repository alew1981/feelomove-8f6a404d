import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X, Calendar } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";
import { FestivalCardSkeleton } from "@/components/ui/skeleton-loader";
import FestivalCard from "@/components/FestivalCard";
import ParentFestivalCard from "@/components/ParentFestivalCard";
import { FestivalProductPage } from "@/types/events.types";
import { Button } from "@/components/ui/button";

const months = [
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterSort, setFilterSort] = useState<string>("proximos");
  const [filterDuration, setFilterDuration] = useState<string>("all");

  // Fetch festivals using the new dedicated festivals view - single optimized query
  const { data: festivals, isLoading } = useQuery({
    queryKey: ["festivales-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page_festivales")
        .select("*")
        .order("festival_start_date", { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as FestivalProductPage[];
    }
  });

  // Separate query for created_at - only fetched when "novedades" or "recientes" filter is active
  const { data: createdAtMap } = useQuery({
    queryKey: ["festivales-created-at"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Only get events created in the last 7 days for novedades
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("id, created_at")
        .gte("created_at", sevenDaysAgo.toISOString());
      
      if (error) throw error;
      return new Map((data || []).map(e => [e.id, e.created_at]));
    },
    enabled: filterSort === "novedades",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Normalize and group festivals
  const groupedFestivals = useMemo(() => {
    if (!festivals) return { parentFestivals: [] as ParentFestival[], standaloneFestivals: [] as NormalizedFestival[] };
    
    // Filter out past events and normalize all festivals
    const validFestivals = festivals.filter(f => {
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
          total_artists: uniqueArtists.length
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
      
      // Duration filter
      if (filterDuration !== "all") {
        const days = festival.festival_duration_days || 1;
        if (filterDuration === "1" && days !== 1) return false;
        if (filterDuration === "2-3" && (days < 2 || days > 3)) return false;
        if (filterDuration === "4+" && days < 4) return false;
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
    if (filterSort === "novedades" && createdAtMap) {
      // Filter events added in the last 7 days using lazy-loaded map
      filteredStandalone = filteredStandalone.filter(f => createdAtMap.has(f.event_id));
      filteredStandalone.sort((a, b) => {
        const aDate = createdAtMap.get(a.event_id) ? new Date(createdAtMap.get(a.event_id)!).getTime() : 0;
        const bDate = createdAtMap.get(b.event_id) ? new Date(createdAtMap.get(b.event_id)!).getTime() : 0;
        return bDate - aDate;
      });
      
      // For parent festivals, filter those with any event added in last 7 days
      filteredParents = filteredParents.filter(parent => 
        parent.events.some(e => createdAtMap.has(e.event_id))
      );
      filteredParents.sort((a, b) => {
        const aNewest = Math.max(...a.events.map(e => {
          const createdAt = createdAtMap.get(e.event_id);
          return createdAt ? new Date(createdAt).getTime() : 0;
        }));
        const bNewest = Math.max(...b.events.map(e => {
          const createdAt = createdAtMap.get(e.event_id);
          return createdAt ? new Date(createdAt).getTime() : 0;
        }));
        return bNewest - aNewest;
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
  }, [groupedFestivals, searchQuery, filterCity, filterGenre, filterMonth, filterSort, filterDuration, createdAtMap]);

  // Get hero image from first festival
  const heroImage = festivals?.[0]?.image_large_url || "/placeholder.svg";

  // Total count - count parent festivals as 1 festival each, plus standalone
  const totalCount = filteredData.parentFestivals.length + filteredData.standaloneFestivals.length;

  // Check if any advanced filter is active
  const hasAdvancedFilters = filterDuration !== "all";

  // Generate JSON-LD for festivals list
  const allFilteredFestivals = [...filteredData.standaloneFestivals, ...filteredData.parentFestivals.flatMap(p => p.events)];
  const jsonLd = allFilteredFestivals.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Festivales en España",
    "description": "Lista de festivales de música disponibles en España",
    "numberOfItems": allFilteredFestivals.length,
    "itemListElement": allFilteredFestivals.slice(0, 20).map((festival, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Festival",
        "name": festival.event_name,
        "startDate": festival.festival_start_date,
        "endDate": festival.festival_end_date,
        "url": `https://feelomove.com/festival/${festival.event_slug}`,
        "image": festival.image_large_url,
        "location": {
          "@type": "Place",
          "name": festival.venue_name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": festival.venue_city
          }
        },
        ...(festival.price_min_incl_fees && festival.price_min_incl_fees > 0 && {
          "offers": {
            "@type": "Offer",
            "price": festival.price_min_incl_fees,
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          }
        })
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title="Festivales de Música en España 2025 - Entradas y Hoteles | Feelomove"
        description="Descubre los mejores festivales de música en España 2025. Compra tus entradas para festivales de rock, electrónica, indie y reserva hotel cerca del recinto."
        canonical="/festivales"
        keywords="festivales españa 2025, festivales música, festivales verano, festivales madrid, festivales barcelona"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Festivales" }
        ]}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image - LCP optimized with priority loading */}
          <PageHero 
            title="Festivales de Música en España" 
            subtitle="Entradas + Hotel para los mejores festivales de 2025"
            imageUrl={heroImage} 
            priority={true}
          />
          
          {/* H2 for proper heading hierarchy */}
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-4">
            Próximos festivales y eventos musicales destacados en España
          </h2>
          
          {/* Description - with content-visibility for below-fold optimization */}
          <div className="prose prose-lg max-w-none mb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}>
            <p className="text-muted-foreground leading-relaxed">
              Descubre todos los festivales de música en España. Desde festivales de verano hasta eventos multi-día. 
              Encuentra tu festival perfecto y reserva hotel cerca del recinto.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3 mb-8">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar festivales..."
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

            {/* Basic Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Select value={filterSort} onValueChange={setFilterSort}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterSort !== "proximos" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">
                    {filterSort === "proximos" ? "Orden" : "Novedades"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proximos">Próximos</SelectItem>
                  <SelectItem value="novedades">Novedades</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterCity === "all" ? "Ciudad" : filterCity}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterGenre !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterGenre === "all" ? "Género" : filterGenre}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los géneros</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDuration} onValueChange={setFilterDuration}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterDuration !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate text-sm">
                    {filterDuration === "all" ? "Duración" : filterDuration === "1" ? "1 día" : filterDuration === "2-3" ? "2-3 días" : "4+ días"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier duración</SelectItem>
                  <SelectItem value="1">1 día</SelectItem>
                  <SelectItem value="2-3">2-3 días</SelectItem>
                  <SelectItem value="4+">4 o más días</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonth !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterMonth === "all" ? "Mes" : months.find(m => m.value === filterMonth)?.label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterCity !== "all" || filterGenre !== "all" || filterMonth !== "all" || filterSort !== "proximos" || hasAdvancedFilters) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilterCity("all");
                    setFilterGenre("all");
                    setFilterMonth("all");
                    setFilterSort("proximos");
                    setFilterDuration("all");
                  }}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground mb-4">
              {totalCount} {totalCount === 1 ? 'festival encontrado' : 'festivales encontrados'}
            </p>
          )}

          {/* Festival Cards Grid - content-visibility for below-fold optimization */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <FestivalCardSkeleton key={i} />
              ))}
            </div>
          ) : totalCount === 0 ? (
            <div className="text-center py-16" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
              <p className="text-xl text-muted-foreground mb-4">No se encontraron festivales</p>
              <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Festivales;
