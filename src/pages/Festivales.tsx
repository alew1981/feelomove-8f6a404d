import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { SEOHead } from "@/components/SEOHead";

const Festivales = () => {
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterFestival, setFilterFestival] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Fetch festivales using mv_festivals_cards
  const { data: events, isLoading } = useQuery({
    queryKey: ["festivales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get first event image for hero
  const heroImage = events?.[0]?.image_large_url || events?.[0]?.image_standard_url;

  // Extract unique cities and artists
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  const artists = useMemo(() => {
    if (!events) return [];
    const allArtists = events.flatMap(e => e.attraction_names || []);
    const uniqueArtists = [...new Set(allArtists)];
    return uniqueArtists.sort() as string[];
  }, [events]);

  // Extract unique festivals (secondary_attraction_name)
  const festivals = useMemo(() => {
    if (!events) return [];
    const uniqueFestivals = [...new Set(events.map(e => e.secondary_attraction_name).filter(Boolean))];
    return uniqueFestivals.sort() as string[];
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
        event.venue_city?.toLowerCase().includes(query) ||
        event.attraction_names?.some((artist: string) => artist.toLowerCase().includes(query))
      );
    }

    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(event => event.venue_city === filterCity);
    }

    // Apply artist filter
    if (filterArtist !== "all") {
      filtered = filtered.filter(event => event.attraction_names?.includes(filterArtist));
    }

    // Apply festival filter
    if (filterFestival !== "all") {
      filtered = filtered.filter(event => event.secondary_attraction_name === filterFestival);
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
  }, [events, searchQuery, filterCity, filterArtist, filterFestival, sortBy]);

  // Group events by festival
  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof filteredAndSortedEvents> = {};
    filteredAndSortedEvents.forEach(event => {
      const festivalName = event.secondary_attraction_name || "Otros Eventos";
      if (!groups[festivalName]) {
        groups[festivalName] = [];
      }
      groups[festivalName].push(event);
    });
    return groups;
  }, [filteredAndSortedEvents]);

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

  return (
    <>
      <SEOHead
        title="Festivales en España - Entradas y Hoteles"
        description="Descubre todos los festivales de música en España. Compra tus entradas y reserva hotel. Los mejores festivales de rock, electrónica, indie y más."
        canonical="/festivales"
        keywords="festivales españa, festivales música, festivales verano, festivales madrid"
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Hero Image */}
          <PageHero title="Festivales" imageUrl={heroImage} />
          
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          
          {/* Description */}
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-muted-foreground leading-relaxed">
              Descubre todos los festivales de música en España. Desde festivales de verano hasta eventos multi-día. 
              Encuentra tu festival perfecto y reserva hotel cerca del recinto.
            </p>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar festivales, ciudades o artistas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 border-border focus:border-[#00FF8F] transition-colors"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={filterFestival} onValueChange={setFilterFestival}>
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="Todos los festivales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los festivales</SelectItem>
                  {festivals.map(festival => (
                    <SelectItem key={festival} value={festival}>{festival}</SelectItem>
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

              <button
                onClick={() => {
                  setSortBy("date-asc");
                  setFilterCity("all");
                  setFilterArtist("all");
                  setFilterFestival("all");
                  setSearchQuery("");
                }}
                className="h-11 px-4 border-2 border-border rounded-md hover:border-[#00FF8F] hover:text-[#00FF8F] transition-colors font-semibold"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Events Grid - Grouped by Festival */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron festivales</p>
              <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedEvents).map(([festivalName, festivalEvents]) => {
                const festivalImage = festivalEvents[0]?.image_large_url || festivalEvents[0]?.image_standard_url;
                return (
                <div key={festivalName} className="space-y-6">
                  {/* Festival Header with Image */}
                  <div className="relative rounded-xl overflow-hidden">
                    {festivalImage && (
                      <div className="relative h-48 md:h-64">
                        <img 
                          src={festivalImage} 
                          alt={festivalName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h2 className="text-2xl md:text-3xl font-bold text-white font-['Poppins']">
                            {festivalName}
                          </h2>
                          <p className="text-white/80 text-sm mt-1">
                            {festivalEvents.length} {festivalEvents.length === 1 ? 'concierto' : 'conciertos'}
                          </p>
                        </div>
                      </div>
                    )}
                    {!festivalImage && (
                      <div className="border-b-2 border-accent pb-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-['Poppins']">
                          {festivalName}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                          {festivalEvents.length} {festivalEvents.length === 1 ? 'concierto' : 'conciertos'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Festival Events Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {festivalEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Festivales;