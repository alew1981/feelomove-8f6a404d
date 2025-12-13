import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
import { SEOHead } from "@/components/SEOHead";
import { SEOText } from "@/components/SEOText";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "react-intersection-observer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { normalizeSearch } from "@/lib/searchUtils";

// Helper to generate slug from name (accent-insensitive)
const generateSlug = (name: string): string => {
  return normalizeSearch(name)
    .replace(/&/g, '') // Remove ampersand
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

const ArtistaDetalle = () => {
  const { slug } = useParams<{ slug: string }>();
  const artistSlug = slug ? decodeURIComponent(slug) : "";
  
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Fetch events for this artist from both concerts and festivals
  const { data: events, isLoading } = useQuery({
    queryKey: ["artist-events", artistSlug],
    queryFn: async () => {
      // Fetch from both sources in parallel
      const [concertsRes, festivalsRes] = await Promise.all([
        supabase
          .from("mv_concerts_cards")
          .select("*")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true }),
        supabase
          .from("mv_festivals_cards")
          .select("*")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
      ]);
      
      if (concertsRes.error) throw concertsRes.error;
      if (festivalsRes.error) throw festivalsRes.error;
      
      const allEvents = [...(concertsRes.data || []), ...(festivalsRes.data || [])] as any[];
      
      // Filter by artist slug - check artist_name and attraction_names
      const normalizedSlug = normalizeSearch(artistSlug.replace(/-/g, ' '));
      
      const filtered = allEvents.filter((event: any) => {
        // Check primary artist_name (concerts)
        const artistName = event.artist_name || '';
        if (generateSlug(artistName) === artistSlug.toLowerCase() ||
            normalizeSearch(artistName) === normalizedSlug) {
          return true;
        }
        
        // Check main_attraction (festivals)
        const mainAttraction = event.main_attraction || '';
        if (generateSlug(mainAttraction) === artistSlug.toLowerCase() ||
            normalizeSearch(mainAttraction) === normalizedSlug) {
          return true;
        }
        
        // Check attraction_names array (for festivals with multiple artists)
        const attractionNames = event.attraction_names || [];
        return attractionNames.some((name: string) => {
          return generateSlug(name) === artistSlug.toLowerCase() ||
                 normalizeSearch(name) === normalizedSlug;
        });
      });
      
      // Sort by date after filtering
      filtered.sort((a: any, b: any) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());
      
      return filtered;
    },
    enabled: !!artistSlug,
  });

  // Get artist name from first event - check both artist_name (concerts) and main_attraction (festivals)
  const artistName = events && events.length > 0 
    ? (events[0] as any).artist_name || (events[0] as any).main_attraction || artistSlug.replace(/-/g, ' ')
    : artistSlug.replace(/-/g, ' ');

  // Get hero image from first event
  const heroImage = (events?.[0] as any)?.image_large_url || (events?.[0] as any)?.image_standard_url;

  // Extract unique cities for filters
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  const availableMonths = useMemo(() => {
    if (!events) return [];
    const monthSet = new Set<string>();
    
    events.forEach(event => {
      if (event.event_date) {
        const date = new Date(event.event_date);
        const monthYear = format(date, "MMMM yyyy", { locale: es });
        monthSet.add(monthYear);
      }
    });
    
    return Array.from(monthSet).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(query) ||
        event.venue_city?.toLowerCase().includes(query)
      );
    }

    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(event => event.venue_city === filterCity);
    }

    // Apply date filter
    if (filterDate !== "all") {
      filtered = filtered.filter(event => {
        if (!event.event_date) return false;
        const eventMonth = format(new Date(event.event_date), "MMMM yyyy", { locale: es });
        return eventMonth === filterDate;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "date-asc":
        filtered.sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());
        break;
      case "date-desc":
        filtered.sort((a, b) => new Date(b.event_date || 0).getTime() - new Date(a.event_date || 0).getTime());
        break;
      case "price-asc":
        filtered.sort((a, b) => (a.price_min_incl_fees || 0) - (b.price_min_incl_fees || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.price_min_incl_fees || 0) - (a.price_min_incl_fees || 0));
        break;
    }
    
    return filtered;
  }, [events, searchQuery, filterCity, filterDate, sortBy]);

  // Display only the first displayCount events
  const displayedEvents = useMemo(() => {
    return filteredAndSortedEvents.slice(0, displayCount);
  }, [filteredAndSortedEvents, displayCount]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && displayedEvents.length < filteredAndSortedEvents.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredAndSortedEvents.length));
    }
  }, [inView, displayedEvents.length, filteredAndSortedEvents.length]);

  // SEO content
  const firstCity = cities[0] || "España";
  const seoDescription = `Descubre todos los conciertos de ${artistName} en ${firstCity} y otras ciudades. Compra entradas + hotel para los próximos eventos de ${artistName} en España.`;

  return (
    <>
      <SEOHead
        title={`${artistName} - Entradas y Paquetes | FEELOMOVE`}
        description={seoDescription}
        canonical={`https://feelomove.com/artista/${artistSlug}`}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Hero Header - Full Width with Artist Image */}
        <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden mt-16">
          {heroImage ? (
            <img
              src={heroImage}
              alt={artistName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-background" />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Artist Name */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="container mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">
                {artistName}
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                  {events?.length || 0} eventos
                </span>
                {cities.length > 0 && (
                  <span className="text-muted-foreground text-sm">
                    en {cities.slice(0, 3).join(", ")}{cities.length > 3 ? ` +${cities.length - 3}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs />
          </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar eventos o ciudades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-2 border-border focus:border-[#00FF8F] transition-colors"
            />
          </div>

          {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Fecha (próximos primero)</SelectItem>
                  <SelectItem value="date-desc">Fecha (lejanos primero)</SelectItem>
                  <SelectItem value="price-asc">Precio (menor a mayor)</SelectItem>
                  <SelectItem value="price-desc">Precio (mayor a menor)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="Todas las fechas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

            <button
              onClick={() => {
                setSortBy("date-asc");
                setFilterCity("all");
                setFilterDate("all");
                setSearchQuery("");
              }}
              className="h-11 px-4 border-2 border-border rounded-md hover:border-[#00FF8F] hover:text-[#00FF8F] transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
            </div>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron eventos</p>
              <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
              
              {/* Infinite Scroll Loader */}
              {displayedEvents.length < filteredAndSortedEvents.length && (
                <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-['Poppins']">Cargando más eventos...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ArtistaDetalle;
