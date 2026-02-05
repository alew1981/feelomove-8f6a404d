import { useState, useMemo, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
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
import { useAggregationSEO } from "@/hooks/useAggregationSEO";
import { RelatedLinks } from "@/components/RelatedLinks";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { normalizeSearch } from "@/lib/searchUtils";

// Keywords that should redirect to /festivales
const FESTIVAL_GENRE_KEYWORDS = ['festival-de-musica', 'festival de musica', 'festivales'];

const GeneroDetalle = () => {
  const { genero } = useParams<{ genero: string }>();
  const genreParam = genero ? decodeURIComponent(genero) : "";
  
  // Check if this genre should redirect to /festivales
  const normalizedGenre = genreParam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  if (FESTIVAL_GENRE_KEYWORDS.some(k => normalizedGenre.includes(k.replace(/\s+/g, '-')))) {
    return <Navigate to="/festivales" replace />;
  }
  
  // Fetch SEO content from materialized view
  const { seoContent } = useAggregationSEO(genreParam, 'genre');
  
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Fetch genre info to get the correct name - search by matching slug pattern
  const { data: genreInfo } = useQuery({
    queryKey: ["genre-info", genreParam],
    queryFn: async () => {
      // First try exact match (URL might contain the exact genre name)
      const { data: exactMatch } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_id, event_count")
        .eq("genre_name", genreParam)
        .maybeSingle();
      
      if (exactMatch) return exactMatch;
      
      // Fetch all genres and find match by normalized slug
      const { data: allGenres } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_id, event_count");
      
      if (!allGenres) return null;
      
      // Normalize the URL param to match genre slugs
      const normalizedParam = genreParam
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      
      // Find genre where normalized name matches
      const match = allGenres.find(g => {
        const normalizedGenre = g.genre_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        return normalizedGenre === normalizedParam;
      });
      
      return match || null;
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

  // Fetch top artists for this genre with images
  const { data: topArtists } = useQuery({
    queryKey: ["genre-top-artists", genreName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("artist_id, artist_name, image_standard_url, genre")
        .eq("genre", genreName)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      // Group by artist and get unique artists with images
      const artistMap = new Map<string, { name: string; image: string | null; slug: string }>();
      (data || []).forEach((event: any) => {
        if (event.artist_name && !artistMap.has(event.artist_name)) {
          artistMap.set(event.artist_name, {
            name: event.artist_name,
            image: event.image_standard_url,
            slug: normalizeSearch(event.artist_name)
              .replace(/&/g, '')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')
          });
        }
      });
      
      return Array.from(artistMap.values()).slice(0, 4);
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

  // Calculate min price for SEO
  const minPriceEur = useMemo(() => {
    if (!events || events.length === 0) return null;
    const prices = events.map(e => e.price_min_incl_fees).filter((p): p is number => p !== null && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [events]);

  // Top artists for SEO description
  const topArtistsForSeo = useMemo(() => {
    const artistSet = new Set<string>();
    events?.forEach(event => {
      const artist = getEventArtist(event);
      if (artist) artistSet.add(artist);
    });
    return Array.from(artistSet).slice(0, 5);
  }, [events]);

  // Unique cities count
  const uniqueCitiesCount = cities.length;

  // Build proper genre SEO description (NOT destination)
  const seoDescription = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Descubre los mejores conciertos de ${genreName} en España.`);
    
    const eventCount = events?.length || 0;
    if (eventCount > 0) {
      parts.push(`${eventCount} eventos confirmados${uniqueCitiesCount > 0 ? ` en ${uniqueCitiesCount} ciudades` : ''}.`);
    }
    
    if (topArtistsForSeo.length > 0) {
      parts.push(`Artistas: ${topArtistsForSeo.join(', ')}.`);
    }
    
    if (minPriceEur && minPriceEur > 0) {
      parts.push(`Entradas desde ${Math.round(minPriceEur)}€.`);
    }
    
    parts.push('Compra entradas y reserva hotel.');
    
    return parts.join(' ');
  }, [genreName, events, uniqueCitiesCount, topArtistsForSeo, minPriceEur]);

  // Clean genre slug for URLs (no %20)
  const cleanGenreSlug = genreParam.toLowerCase().replace(/\s+/g, '-').replace(/%20/g, '-');
  const canonicalUrl = `https://feelomove.com/generos/${cleanGenreSlug}`;

  // Clean image URL (remove lovable.app references)
  const cleanImageUrl = useMemo(() => {
    const img = heroImage;
    if (!img) return 'https://feelomove.com/og-image.jpg';
    if (img.includes('lovable.app')) return 'https://feelomove.com/og-image.jpg';
    return img;
  }, [heroImage]);

  // Clean title (no %20)
  const cleanGenreName = genreName.replace(/%20/g, ' ');
  const pageTitle = `Conciertos de ${cleanGenreName} en España 2025`;

  // Generate JSON-LD structured data for genre (ItemList with complete Event objects for Google)
  const jsonLdData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Conciertos de ${cleanGenreName} en España`,
    "description": seoDescription,
    "url": canonicalUrl,
    "numberOfItems": events?.length || 0,
    "itemListElement": events?.slice(0, 15).map((event: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "name": event.name,
        "description": `Concierto de ${cleanGenreName} en ${event.venue_city}. Compra entradas y reserva hotel.`,
        "startDate": event.event_date,
        "endDate": event.event_date,
        "eventStatus": event.sold_out ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "url": `https://feelomove.com/conciertos/${event.slug}`,
        "image": [event.image_large_url || event.image_standard_url || "https://feelomove.com/og-image.jpg"],
        "location": {
          "@type": "Place",
          "name": event.venue_name || "Recinto del evento",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": event.venue_name || "Recinto del evento",
            "addressLocality": event.venue_city,
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
          "url": `https://feelomove.com/conciertos/${event.slug}`,
          "price": event.price_min_incl_fees || 0,
          "priceCurrency": event.currency || "EUR",
          "availability": event.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          "validFrom": new Date().toISOString()
        },
        "performer": event.artist_name ? {
          "@type": "MusicGroup",
          "name": event.artist_name
        } : undefined
      }
    }))
  }), [cleanGenreName, canonicalUrl, seoDescription, events]);

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
        "name": "Géneros",
        "item": "https://feelomove.com/generos"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": cleanGenreName,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        pageType="CollectionPage"
        jsonLd={[jsonLdData, breadcrumbJsonLd]}
        preloadImage={heroImage}
        ogImage={cleanImageUrl}
      />
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-16">
        
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        
        {/* Hero Image */}
        <PageHero title={seoContent?.h1Content || cleanGenreName} imageUrl={heroImage} />
        
        {/* H2 for SEO hierarchy (sr-only) */}
        <h2 className="sr-only">Listado de conciertos y eventos de música {cleanGenreName}</h2>
        
        {/* Description */}
        <p className="text-muted-foreground text-lg mb-8">
          {seoContent?.introText || `Descubre los mejores eventos de ${cleanGenreName}`}
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
            
            {/* Top Artists Section - Visual Cards */}
            {topArtists && topArtists.length > 0 && (
              <div className="mt-12 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Artistas destacados</h2>
                  <Link
                    to="/artistas"
                    className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
                  >
                    Ver todos <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {topArtists.map((artist, index) => (
                    <Link
                      key={artist.slug}
                      to={`/conciertos/${artist.slug}`}
                      className="group relative aspect-square rounded-xl overflow-hidden animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {artist.image ? (
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-bold text-white text-lg line-clamp-2">{artist.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Links for SEO */}
            <RelatedLinks slug={genreParam} type="genre" />
          </>
        )}
      </div>
      <Footer />
    </div>
    </>
  );
};

export default GeneroDetalle;