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
import { useAggregationSEO } from "@/hooks/useAggregationSEO";
import { RelatedLinks } from "@/components/RelatedLinks";
import { buildDestinationSeoDescription } from "@/lib/seoDescriptions";

// Normalize slug by removing accents for DB matching
const normalizeSlug = (slug: string): string => {
  return slug
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const DestinoDetalle = () => {
  const { destino } = useParams<{ destino: string }>();
  const rawSlug = destino ? decodeURIComponent(destino) : "";
  const citySlug = normalizeSlug(rawSlug);
  
  // Fetch SEO content from materialized view
  const { seoContent } = useAggregationSEO(citySlug, 'city');
  
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Fetch city image from lite_tbl_city_mapping
  const { data: cityImage } = useQuery({
    queryKey: ["city-image", citySlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("lite_tbl_city_mapping")
        .select("ticketmaster_city, imagen_ciudad")
        .not("imagen_ciudad", "is", null);
      
      if (!data) return null;
      
      // Find the city that matches the slug
      const match = data.find(c => 
        c.ticketmaster_city?.toLowerCase().replace(/\s+/g, '-') === citySlug.toLowerCase()
      );
      return match?.imagen_ciudad || null;
    },
    enabled: !!citySlug,
  });

  // Fetch concerts for this city using venue_city_slug
  const { data: concerts, isLoading: isLoadingConcerts } = useQuery({
    queryKey: ["city-concerts", citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .eq("venue_city_slug", citySlug)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!citySlug,
  });

  // Fetch festivals for this city using venue_city_slug
  const { data: festivals, isLoading: isLoadingFestivals } = useQuery({
    queryKey: ["city-festivals", citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .eq("venue_city_slug", citySlug)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!citySlug,
  });

  const isLoading = isLoadingConcerts || isLoadingFestivals;

  // Combine and dedupe events
  const events = useMemo(() => {
    const allEvents = [...(concerts || []), ...(festivals || [])];
    // Sort by date
    return allEvents.sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());
  }, [concerts, festivals]);

  // Get city name from first event or format from slug
  const cityName = events[0]?.venue_city || citySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Get hero image - prefer city image, fallback to first event
  const heroImage = cityImage || events[0]?.image_large_url || events[0]?.image_standard_url;

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
      // For concerts: artist_name, for festivals: main_attraction
      if ('artist_name' in event && event.artist_name) {
        artistSet.add(event.artist_name);
      }
      if ('main_attraction' in event && event.main_attraction) {
        artistSet.add(event.main_attraction);
      }
    });
    return Array.from(artistSet).sort();
  }, [events]);

  // Helper to get artist name from event (works for both concerts and festivals)
  const getEventArtist = (event: typeof events[0]) => {
    if ('artist_name' in event && event.artist_name) return event.artist_name;
    if ('main_attraction' in event && event.main_attraction) return event.main_attraction;
    return null;
  };

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const nameMatch = event.name?.toLowerCase().includes(query);
        const artistMatch = getEventArtist(event)?.toLowerCase().includes(query);
        return nameMatch || artistMatch;
      });
    }

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(event => event.genre === filterGenre);
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

  // SEO content (Súper SEO: conteos + artistas + precio)
  const topArtistsList = artists.slice(0, 6);
  const concertsCount = concerts?.length || 0;
  const festivalsCount = festivals?.length || 0;
  const minPriceEur = (() => {
    const prices = (events || [])
      .map((e: any) => e.price_min_incl_fees)
      .filter((p: any) => typeof p === "number" && p > 0) as number[];
    return prices.length ? Math.min(...prices) : null;
  })();

  const seoDescription = buildDestinationSeoDescription({
    cityName,
    totalEvents: events?.length || 0,
    concertsCount,
    festivalsCount,
    topArtists: topArtistsList,
    minPriceEur,
  });

  // Generate JSON-LD structured data for destination (ItemList with complete Event objects for Google)
  const jsonLdData = useMemo(() => {
    const itemList = (events || []).slice(0, 15).map((event: any, index: number) => {
      const isConcert = "artist_name" in event;
      const eventUrl = isConcert
        ? `https://feelomove.com/concierto/${event.slug}`
        : `https://feelomove.com/festival/${event.slug}`;
      const artistName = event.artist_name || event.main_attraction || event.name;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": isConcert ? "MusicEvent" : "Festival",
          "name": event.name,
          "description": `${isConcert ? 'Concierto' : 'Festival'} en ${cityName}. Compra entradas y reserva hotel.`,
          "startDate": event.event_date,
          "endDate": event.event_date,
          "eventStatus": event.sold_out ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "url": eventUrl,
          "image": [event.image_large_url || event.image_standard_url || "https://feelomove.com/og-image.jpg"],
          "location": {
            "@type": "Place",
            "name": event.venue_name || "Recinto del evento",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": event.venue_name || "Recinto del evento",
              "addressLocality": cityName,
              "addressRegion": "España",
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
            "url": eventUrl,
            "price": event.price_min_incl_fees || 0,
            "priceCurrency": event.currency || "EUR",
            "availability": event.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            "validFrom": new Date().toISOString()
          },
          "performer": artistName ? {
            "@type": "MusicGroup",
            "name": artistName
          } : undefined
        }
      };
    });

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Conciertos y Festivales en ${cityName}`,
      "description": seoDescription,
      "url": `https://feelomove.com/destinos/${citySlug}`,
      "numberOfItems": events?.length || 0,
      "itemListElement": itemList
    };
  }, [cityName, citySlug, seoDescription, events]);

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://feelomove.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Destinos",
        "item": "https://feelomove.com/destinos"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": cityName,
        "item": `https://feelomove.com/destinos/${citySlug}`
      }
    ]
  };

  return (
    <>
      <SEOHead
        title={`Conciertos en ${cityName} - Entradas y Hoteles`}
        description={seoDescription}
        canonical={`https://feelomove.com/destinos/${citySlug}`}
        pageType="CollectionPage"
        jsonLd={[jsonLdData, breadcrumbJsonLd]}
        preloadImage={heroImage}
        ogImage={heroImage || undefined}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image */}
          <PageHero title={seoContent?.h1Content || cityName} imageUrl={heroImage} />
          
          {/* H2 universal (sr-only) para evitar salto de niveles: H1 > H2 > H3 */}
          <h2 className="sr-only">Eventos y experiencias destacadas en {cityName}</h2>
          
          {/* SEO Text */}
          <SEOText 
            title={seoContent?.h1Content || `Eventos en ${cityName}`}
            description={seoContent?.introText || seoDescription}
            keywords={seoContent?.metaKeywords || [`conciertos ${cityName}`, `festivales ${cityName}`, `eventos ${cityName}`, ...artists.slice(0, 3).map(a => `${a} ${cityName}`)]}
          />

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
                  <EventCard event={event} priority={index < 4} />
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
            
            {/* Related Links for SEO */}
            <RelatedLinks slug={citySlug} type="city" />
          </>
        )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default DestinoDetalle;