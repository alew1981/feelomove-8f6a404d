import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
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

const ArtistaDetalle = () => {
  const { slug } = useParams<{ slug: string }>();
  const artistSlug = slug ? decodeURIComponent(slug) : "";
  
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Fetch events for this artist using lovable_mv_event_product_page
  const { data: events, isLoading } = useQuery({
    queryKey: ["artist-events", artistSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page")
        .select("event_id, event_name, event_slug, event_date, venue_city, venue_name, image_large_url, image_standard_url, primary_attraction_name, attraction_names, primary_subcategory_name, ticket_price_min, sold_out, seats_available, event_badges")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Filter by artist slug and deduplicate
      const filtered = data?.filter(event => {
        const names = event.attraction_names || [];
        return names.some((name: string) => 
          name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === artistSlug.toLowerCase() ||
          name.toLowerCase() === artistSlug.toLowerCase().replace(/-/g, ' ')
        );
      }) || [];
      
      // Deduplicate by event_id
      const uniqueEvents = filtered.reduce((acc: any[], event) => {
        if (!acc.find(e => e.event_id === event.event_id)) {
          acc.push({
            id: event.event_id,
            slug: event.event_slug,
            name: event.event_name,
            event_date: event.event_date,
            venue_city: event.venue_city,
            venue_name: event.venue_name,
            image_large_url: event.image_large_url,
            image_standard_url: event.image_standard_url,
            primary_attraction_name: event.primary_attraction_name,
            attraction_names: event.attraction_names,
            primary_subcategory_name: event.primary_subcategory_name,
            price_min_incl_fees: event.ticket_price_min,
            sold_out: event.sold_out,
            seats_available: event.seats_available,
            badges: event.event_badges
          });
        }
        return acc;
      }, []);
      
      return uniqueEvents;
    },
    enabled: !!artistSlug,
  });

  // Get artist name from first event
  const artistName = events && events.length > 0 
    ? events[0].primary_attraction_name || artistSlug.replace(/-/g, ' ')
    : artistSlug.replace(/-/g, ' ');

  // Extract unique cities for filters
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  // Extract genres from subcategory
  const genres = useMemo(() => {
    if (!events) return [];
    const genreSet = new Set<string>();
    events.forEach(event => {
      if (event.primary_subcategory_name) {
        genreSet.add(event.primary_subcategory_name);
      }
    });
    return Array.from(genreSet).sort();
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

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(event => event.primary_subcategory_name === filterGenre);
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
  }, [events, searchQuery, filterCity, filterGenre, filterDate, sortBy]);

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
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="mb-8 mt-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{artistName}</h1>
            <Breadcrumbs />
            <SEOText 
              title={`Conciertos de ${artistName}`}
              description={`Encuentra todos los próximos conciertos de ${artistName} en España. Reserva tus entradas junto con hotel cercano al venue y ahorra en tu experiencia completa. Tenemos ${events?.length || 0} eventos disponibles de ${artistName} en ciudades como ${cities.slice(0, 3).join(", ")}.`}
              keywords={[`${artistName} españa`, `${artistName} conciertos`, `entradas ${artistName}`, ...cities.slice(0, 3).map(city => `${artistName} ${city}`)]}
            />
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="Todos los géneros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los géneros</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
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
                setFilterGenre("all");
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