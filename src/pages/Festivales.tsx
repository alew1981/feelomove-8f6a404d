import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X, Tent, Bus, Calendar } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";
import { FestivalCardSkeleton } from "@/components/ui/skeleton-loader";
import FestivalCard from "@/components/FestivalCard";
import ParentFestivalCard from "@/components/ParentFestivalCard";
import { FestivalProductPage } from "@/types/events.types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

// Interface for grouped parent festivals
interface ParentFestival {
  secondary_attraction_id: string;
  secondary_attraction_name: string;
  venue_city: string;
  event_count: number;
  events: FestivalProductPage[];
  image_large_url: string;
  min_start_date: string;
  max_end_date: string;
  total_artists: number;
}

const Festivales = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterSort, setFilterSort] = useState<string>("proximos");
  const [filterDuration, setFilterDuration] = useState<string>("all");
  const [filterCamping, setFilterCamping] = useState<boolean>(false);
  const [filterTransport, setFilterTransport] = useState<boolean>(false);

  // Fetch festivals using the new dedicated festivals view
  const { data: festivals, isLoading } = useQuery({
    queryKey: ["festivales-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page_festivales")
        .select("*")
        .gte("festival_start_date", new Date().toISOString().split('T')[0])
        .order("festival_start_date", { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as FestivalProductPage[];
    }
  });

  // Group festivals by parent festival (secondary_attraction_id)
  const groupedFestivals = useMemo(() => {
    if (!festivals) return { parentFestivals: [] as ParentFestival[], standaloneFestivals: [] as FestivalProductPage[] };
    
    const parentMap = new Map<string, FestivalProductPage[]>();
    const standalone: FestivalProductPage[] = [];
    
    festivals.forEach(festival => {
      const parentId = festival.secondary_attraction_id;
      const parentName = festival.secondary_attraction_name;
      
      // If has a parent festival (secondary_attraction), group it
      if (parentId && parentName && parentName !== festival.primary_attraction_name) {
        const existing = parentMap.get(parentId) || [];
        existing.push(festival);
        parentMap.set(parentId, existing);
      } else {
        // Standalone festival
        standalone.push(festival);
      }
    });
    
    // Convert map to array of parent festivals
    const parentFestivals: ParentFestival[] = [];
    parentMap.forEach((events, parentId) => {
      if (events.length > 0) {
        // Sort events by date
        events.sort((a, b) => 
          new Date(a.festival_start_date).getTime() - new Date(b.festival_start_date).getTime()
        );
        
        const firstEvent = events[0];
        const minDate = events.reduce((min, e) => 
          e.festival_start_date < min ? e.festival_start_date : min, 
          events[0].festival_start_date
        );
        const maxDate = events.reduce((max, e) => 
          e.festival_end_date > max ? e.festival_end_date : max, 
          events[0].festival_end_date
        );
        
        // Count unique artists across all events
        const allArtists = events.flatMap(e => e.festival_lineup_artists || []);
        const uniqueArtists = [...new Set(allArtists)];
        
        parentFestivals.push({
          secondary_attraction_id: parentId,
          secondary_attraction_name: firstEvent.secondary_attraction_name || "Festival",
          venue_city: firstEvent.venue_city,
          event_count: events.length,
          events,
          image_large_url: firstEvent.image_large_url,
          min_start_date: minDate,
          max_end_date: maxDate,
          total_artists: uniqueArtists.length
        });
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
      
      // Camping filter
      if (filterCamping && !festival.festival_camping_available) return false;
      
      // Transport filter
      if (filterTransport && !festival.festival_has_official_transport) return false;
      
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
      filteredStandalone.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      filteredParents.sort((a, b) => {
        const aLatest = Math.max(...a.events.map(e => new Date(e.created_at).getTime()));
        const bLatest = Math.max(...b.events.map(e => new Date(e.created_at).getTime()));
        return bLatest - aLatest;
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
  }, [groupedFestivals, searchQuery, filterCity, filterGenre, filterMonth, filterSort, filterDuration, filterCamping, filterTransport]);

  // Get hero image from first festival
  const heroImage = festivals?.[0]?.image_large_url || "/placeholder.svg";

  // Total count - count parent festivals as 1 festival each, plus standalone
  const totalCount = filteredData.parentFestivals.length + filteredData.standaloneFestivals.length;

  // Check if any advanced filter is active
  const hasAdvancedFilters = filterDuration !== "all" || filterCamping || filterTransport;

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
        title="Festivales en España - Entradas y Hoteles"
        description="Descubre todos los festivales de música en España. Compra tus entradas y reserva hotel. Los mejores festivales de rock, electrónica, indie y más."
        canonical="/festivales"
        keywords="festivales españa, festivales música, festivales verano, festivales madrid"
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
          
          {/* Hero Image */}
          <PageHero title="Festivales" imageUrl={heroImage} />
          
          {/* Description */}
          <div className="prose prose-lg max-w-none mb-8">
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
                  <span className="truncate text-sm">{filterSort === "proximos" ? "Próximos" : "Recientes"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proximos">Próximos</SelectItem>
                  <SelectItem value="recientes">Añadidos recientemente</SelectItem>
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

            {/* Advanced Filters Row - Camping & Transport toggles */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="camping-filter"
                  checked={filterCamping}
                  onCheckedChange={setFilterCamping}
                />
                <Label htmlFor="camping-filter" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Tent className="h-4 w-4" />
                  Con camping
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="transport-filter"
                  checked={filterTransport}
                  onCheckedChange={setFilterTransport}
                />
                <Label htmlFor="transport-filter" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Bus className="h-4 w-4" />
                  Con transporte oficial
                </Label>
              </div>
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
                    setFilterCamping(false);
                    setFilterTransport(false);
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

          {/* Festival Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <FestivalCardSkeleton key={i} />
              ))}
            </div>
          ) : totalCount === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron festivales</p>
              <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Parent Festivals - show as cards linking to detail page */}
              {filteredData.parentFestivals.map((parent, index) => (
                <ParentFestivalCard 
                  key={parent.secondary_attraction_id} 
                  festival={parent}
                  priority={index < 4}
                />
              ))}

              {/* Standalone Festivals */}
              {filteredData.standaloneFestivals.map((festival, index) => (
                <FestivalCard 
                  key={festival.event_id} 
                  festival={festival}
                  priority={index < 4}
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
