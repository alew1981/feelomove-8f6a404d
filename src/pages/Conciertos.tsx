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
import { matchesSearch } from "@/lib/searchUtils";

const Conciertos = () => {
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Fetch conciertos using mv_concerts_cards
  const { data: events, isLoading } = useQuery({
    queryKey: ["conciertos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
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
    const uniqueArtists = [...new Set(events.map(e => e.artist_name).filter(Boolean))];
    return uniqueArtists.sort() as string[];
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let filtered = [...events];

    // Apply search filter (accent-insensitive)
    if (searchQuery) {
      filtered = filtered.filter(event => 
        matchesSearch(event.name, searchQuery) ||
        matchesSearch(event.venue_city, searchQuery) ||
        matchesSearch(event.artist_name, searchQuery)
      );
    }

    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(event => event.venue_city === filterCity);
    }

    // Apply artist filter
    if (filterArtist !== "all") {
      filtered = filtered.filter(event => event.artist_name === filterArtist);
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

  // Generate JSON-LD for concerts list
  const jsonLd = events && events.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Conciertos en España",
    "description": "Lista de conciertos disponibles en España",
    "numberOfItems": events.length,
    "itemListElement": events.slice(0, 20).map((event, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "name": event.name,
        "description": `Concierto de ${event.artist_name || event.name} en ${event.venue_city}`,
        "startDate": event.event_date,
        "endDate": event.event_date,
        "eventStatus": event.sold_out ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "url": `https://feelomove.com/producto/${event.slug || event.id}`,
        "image": event.image_large_url || event.image_standard_url,
        "location": {
          "@type": "Place",
          "name": event.venue_name || "Venue",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": event.venue_city,
            "addressCountry": "ES"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": "FEELOMOVE+",
          "url": "https://feelomove.com"
        },
        ...(event.price_min_incl_fees && {
          "offers": {
            "@type": "Offer",
            "price": event.price_min_incl_fees,
            "priceCurrency": event.currency || "EUR",
            "availability": event.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            "validFrom": new Date().toISOString()
          }
        })
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title="Conciertos en España - Entradas y Hoteles"
        description="Descubre todos los conciertos en España. Compra tus entradas y reserva hotel en el mismo lugar. Encuentra los mejores conciertos en Madrid, Barcelona, Valencia y más ciudades."
        canonical="/conciertos"
        keywords="conciertos españa, entradas conciertos, conciertos madrid, conciertos barcelona"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image */}
          <PageHero title="Conciertos" imageUrl={heroImage} />
          
          {/* Description */}
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-muted-foreground leading-relaxed">
              Descubre todos los conciertos en España. Desde rock y pop hasta indie y electrónica. 
              Encuentra tu concierto perfecto y reserva hotel en la misma ciudad.
            </p>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar conciertos, ciudades o artistas..."
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
              {[...Array(8)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron conciertos</p>
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
                    <p className="text-sm text-muted-foreground font-['Poppins']">Cargando más conciertos...</p>
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

export default Conciertos;