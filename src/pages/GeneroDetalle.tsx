import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
import { SEOHead } from "@/components/SEOHead";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "react-intersection-observer";

const GeneroDetalle = () => {
  const { genero } = useParams<{ genero: string }>();
  const genreParam = genero ? decodeURIComponent(genero) : "";
  
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Fetch genre info to get the correct name
  const { data: genreInfo } = useQuery({
    queryKey: ["genre-info", genreParam],
    queryFn: async () => {
      // Try by genre_name
      const { data } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_id, event_count")
        .eq("genre_name", genreParam)
        .maybeSingle();
      
      return data;
    },
    enabled: !!genreParam,
  });

  const genreName = genreInfo?.genre_name || genreParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Fetch concerts for this genre using genre name
  const { data: concerts, isLoading: isLoadingConcerts } = useQuery({
    queryKey: ["genre-concerts", genreName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .eq("genre", genreName)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!genreName,
  });

  // Fetch festivals for this genre using genre name
  const { data: festivals, isLoading: isLoadingFestivals } = useQuery({
    queryKey: ["genre-festivals", genreName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .eq("genre", genreName)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!genreName,
  });

  const isLoading = isLoadingConcerts || isLoadingFestivals;

  // Combine events
  const events = useMemo(() => {
    const allEvents = [...(concerts || []), ...(festivals || [])];
    return allEvents.sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());
  }, [concerts, festivals]);

  // Get hero image from first event
  const heroImage = events[0]?.image_large_url || events[0]?.image_standard_url;

  // Extract unique cities and artists for filters
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  // Helper to get artist name from event (works for both concerts and festivals)
  const getEventArtist = (event: typeof events[0]) => {
    if ('artist_name' in event && event.artist_name) return event.artist_name;
    if ('main_attraction' in event && event.main_attraction) return event.main_attraction;
    return null;
  };

  const artists = useMemo(() => {
    if (!events) return [];
    const artistSet = new Set<string>();
    events.forEach(event => {
      const artist = getEventArtist(event);
      if (artist) artistSet.add(artist);
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
      filtered = filtered.filter(event => {
        const nameMatch = event.name?.toLowerCase().includes(query);
        const cityMatch = event.venue_city?.toLowerCase().includes(query);
        const artistMatch = getEventArtist(event)?.toLowerCase().includes(query);
        return nameMatch || cityMatch || artistMatch;
      });
    }

    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(event => event.venue_city === filterCity);
    }

    // Apply artist filter
    if (filterArtist !== "all") {
      filtered = filtered.filter(event => getEventArtist(event) === filterArtist);
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
  }, [events, searchQuery, filterCity, filterArtist, sortBy]);

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

  // SEO description
  const seoDescription = `Descubre los mejores conciertos y festivales de ${genreName}. ${events?.length || 0} eventos disponibles en España.`;

  // Generate JSON-LD structured data for genre
  const jsonLdData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Conciertos de ${genreName}`,
    "description": seoDescription,
    "url": `https://feelomove.com/musica/${genreParam}`,
    "numberOfItems": events?.length || 0,
    "itemListElement": events?.slice(0, 10).map((event: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "name": event.name,
        "startDate": event.event_date,
        "url": `https://feelomove.com/producto/${event.slug}`,
        "image": event.image_large_url || event.image_standard_url,
        "location": {
          "@type": "Place",
          "name": event.venue_name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": event.venue_city,
            "addressCountry": "ES"
          }
        }
      }
    }))
  }), [genreName, genreParam, seoDescription, events]);

  return (
    <>
      <SEOHead
        title={`${genreName} - Conciertos y Festivales | FEELOMOVE`}
        description={seoDescription}
        canonical={`https://feelomove.com/musica/${genreParam}`}
      />
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-16">
        
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        
        {/* Hero Image */}
        <PageHero title={genreName} imageUrl={heroImage} />
        
        {/* Description */}
        <p className="text-muted-foreground text-lg mb-8">
          Descubre los mejores eventos de {genreName}
        </p>

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

export default GeneroDetalle;