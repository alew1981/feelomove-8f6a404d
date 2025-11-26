import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useInView } from "react-intersection-observer";

const Eventos = () => {
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

  // Fetch events using vw_events_with_hotels
  const { data: events, isLoading } = useQuery({
    queryKey: ["all-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select(`
          event_id,
          event_name,
          event_date,
          venue_city,
          image_standard_url,
          ticket_cheapest_price,
          package_price_min,
          has_hotel_offers,
          sold_out,
          seats_available,
          hotels_count,
          attraction_names
        `)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Extract unique cities and artists for filters
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort();
  }, [events]);

  const artists = useMemo(() => {
    if (!events) return [];
    const allArtists = events.flatMap(e => e.attraction_names || []);
    const uniqueArtists = [...new Set(allArtists)];
    return uniqueArtists.sort();
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];

    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.event_name.toLowerCase().includes(query) ||
        event.venue_city?.toLowerCase().includes(query) ||
        event.attraction_names?.some(artist => artist.toLowerCase().includes(query))
      );
    }

    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(event => event.venue_city === filterCity);
    }

    // Apply artist filter
    if (filterArtist !== "all") {
      filtered = filtered.filter(event => 
        event.attraction_names?.includes(filterArtist)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date-asc":
        filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        break;
      case "date-desc":
        filtered.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
        break;
      case "price-asc":
        filtered.sort((a, b) => (a.ticket_cheapest_price || 0) - (b.ticket_cheapest_price || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.ticket_cheapest_price || 0) - (a.ticket_cheapest_price || 0));
        break;
      case "packages":
        filtered = filtered.filter(e => e.has_hotel_offers);
        filtered.sort((a, b) => (a.package_price_min || 0) - (b.package_price_min || 0));
        break;
    }

    return filtered;
  }, [events, searchQuery, filterCity, filterArtist, sortBy]);

  // Display only the first displayCount events
  const displayedEvents = useMemo(() => {
    return filteredAndSortedEvents.slice(0, displayCount);
  }, [filteredAndSortedEvents, displayCount]);

  // Load more when scrolling to bottom
  useMemo(() => {
    if (inView && displayedEvents.length < filteredAndSortedEvents.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredAndSortedEvents.length));
    }
  }, [inView, displayedEvents.length, filteredAndSortedEvents.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        
        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Todos los Eventos</h1>
          <p className="text-muted-foreground text-lg">
            {filteredAndSortedEvents.length} eventos disponibles {displayedEvents.length < filteredAndSortedEvents.length && `(mostrando ${displayedEvents.length})`}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar eventos, ciudades o artistas..."
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
                <SelectItem value="packages">Con paquetes</SelectItem>
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

            <Select value={filterArtist} onValueChange={setFilterArtist}>
              <SelectTrigger className="h-11 border-2">
                <SelectValue placeholder="Todos los artistas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los artistas</SelectItem>
                {artists.map(artist => (
                  <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => {
                setSortBy("date-asc");
                setFilterCity("all");
                setFilterArtist("all");
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEvents.map((event, index) => (
                <div 
                  key={event.event_id}
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
  );
};

export default Eventos;
