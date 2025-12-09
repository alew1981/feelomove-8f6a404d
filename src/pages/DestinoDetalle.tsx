import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "react-intersection-observer";

const DestinoDetalle = () => {
  const { destino } = useParams<{ destino: string }>();
  const cityNameDecoded = destino ? decodeURIComponent(destino) : "";
  
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Fetch concerts for this city
  const { data: concerts, isLoading: isLoadingConcerts } = useQuery({
    queryKey: ["city-concerts", cityNameDecoded],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .eq("venue_city", cityNameDecoded)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!cityNameDecoded,
  });

  // Fetch festivals for this city
  const { data: festivals, isLoading: isLoadingFestivals } = useQuery({
    queryKey: ["city-festivals", cityNameDecoded],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .eq("venue_city", cityNameDecoded)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!cityNameDecoded,
  });

  const isLoading = isLoadingConcerts || isLoadingFestivals;

  // Combine and dedupe events
  const events = useMemo(() => {
    const allEvents = [...(concerts || []), ...(festivals || [])];
    // Sort by date
    return allEvents.sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());
  }, [concerts, festivals]);

  // Extract unique genres and artists for filters
  const genres = useMemo(() => {
    if (!events) return [];
    const genreSet = new Set<string>();
    events.forEach(event => {
      if (event.genre) {
        genreSet.add(event.genre);
      }
    });
    return Array.from(genreSet).sort();
  }, [events]);

  const artists = useMemo(() => {
    if (!events) return [];
    const artistSet = new Set<string>();
    events.forEach(event => {
      if (event.artist_name) artistSet.add(event.artist_name);
      if (event.main_attraction) artistSet.add(event.main_attraction);
    });
    return Array.from(artistSet).sort();
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
        event.artist_name?.toLowerCase().includes(query) ||
        event.main_attraction?.toLowerCase().includes(query)
      );
    }

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(event => event.genre === filterGenre);
    }

    // Apply artist filter
    if (filterArtist !== "all") {
      filtered = filtered.filter(event => 
        event.artist_name === filterArtist || event.main_attraction === filterArtist
      );
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
  }, [events, searchQuery, filterGenre, filterArtist, sortBy]);

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-4 mt-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{cityNameDecoded}</h1>
          <Breadcrumbs />
          <p className="text-muted-foreground text-lg mt-2">
            Descubre los mejores eventos en {cityNameDecoded}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar eventos o artistas..."
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
                setFilterGenre("all");
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
  );
};

export default DestinoDetalle;
