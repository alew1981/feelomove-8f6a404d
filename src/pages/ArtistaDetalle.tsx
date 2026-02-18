import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
import { SEOHead } from "@/components/SEOHead";
import { SEOText } from "@/components/SEOText";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import EventListCard, { EventListCardSkeleton } from "@/components/EventListCard";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useInView } from "react-intersection-observer";
import { normalizeSearch } from "@/lib/searchUtils";
import { useAggregationSEO } from "@/hooks/useAggregationSEO";
import { RelatedLinks } from "@/components/RelatedLinks";
import { useTranslation } from "@/hooks/useTranslation";

// Helper to generate slug from name (accent-insensitive)
const generateSlug = (name: string): string => {
  return normalizeSearch(name)
    .replace(/&/g, '') // Remove ampersand
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

interface ArtistaDetalleProps {
  slugProp?: string;
}

const ArtistaDetalle = ({ slugProp }: ArtistaDetalleProps) => {
  const { t, locale, localePath } = useTranslation();
  const params = useParams<{ artistSlug?: string; slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Priority: prop > :slug > :artistSlug (legacy compatibility)
  const rawSlug = slugProp 
    || params.slug 
    || params.artistSlug 
    || "";
  const artistSlug = rawSlug ? decodeURIComponent(rawSlug).replace(/-+/g, '-') : "";
  
  // CRITICAL SEO: Detect if we're on plural /conciertos/ or /en/tickets/ and need redirect
  const isOnPluralRoute = location.pathname.startsWith('/conciertos/') || location.pathname.startsWith('/en/tickets/');
  
  // State to track if we've already initiated a redirect
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redirect to normalized URL if slug has double dashes
  useEffect(() => {
    if (rawSlug !== artistSlug && artistSlug) {
      navigate(localePath(`/conciertos/${artistSlug}`), { replace: true });
    }
  }, [rawSlug, artistSlug, navigate, localePath]);

  // Fetch SEO content from materialized view
  const { seoContent } = useAggregationSEO(artistSlug, 'artist');
  
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
  // IMPORTANT: Must be defined BEFORE any conditional returns to maintain hook order
  const artistName = events && events.length > 0 
    ? (events[0] as any).artist_name || (events[0] as any).main_attraction || artistSlug.replace(/-/g, ' ')
    : artistSlug.replace(/-/g, ' ');

  // Get hero image from first event
  const heroImage = (events?.[0] as any)?.image_large_url || (events?.[0] as any)?.image_standard_url;

  // Get genre from first event
  const artistGenre = (events?.[0] as any)?.genre || null;
  const genreSlug = (events?.[0] as any)?.genre_slug || null;

  // Extract unique cities for filters with event counts
  // IMPORTANT: All useMemo hooks must be called BEFORE any conditional returns
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  // Cities with event counts and images for destination section
  const citiesWithData = useMemo(() => {
    if (!events) return [];
    const cityMap = new Map<string, { count: number; image: string | null; slug: string }>();
    
    events.forEach((event: any) => {
      const city = event.venue_city;
      if (city) {
        const existing = cityMap.get(city);
        if (existing) {
          existing.count++;
        } else {
          cityMap.set(city, {
            count: 1,
            image: event.image_standard_url || event.image_large_url,
            slug: event.venue_city_slug || normalizeSearch(city).replace(/\s+/g, '-')
          });
        }
      }
    });
    
    return Array.from(cityMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Fetch related artists from the same genre
  // IMPORTANT: All useQuery hooks must be called BEFORE any conditional returns
  const { data: relatedArtists } = useQuery({
    queryKey: ["related-artists", artistGenre, artistName],
    queryFn: async () => {
      if (!artistGenre) return [];
      
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("artist_id, artist_name, image_standard_url, genre, genre_slug")
        .eq("genre", artistGenre)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      // Group by artist and filter out current artist
      const artistMap = new Map<string, any>();
      (data || []).forEach((event: any) => {
        if (event.artist_name && 
            normalizeSearch(event.artist_name) !== normalizeSearch(artistName) &&
            !artistMap.has(event.artist_name)) {
          artistMap.set(event.artist_name, {
            name: event.artist_name,
            image: event.image_standard_url,
            slug: generateSlug(event.artist_name)
          });
        }
      });
      
      return Array.from(artistMap.values()).slice(0, 4);
    },
    enabled: !!artistGenre && !!artistName && !isRedirecting,
  });

  // Native date formatting (replaces date-fns)
  const SPANISH_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  
  const formatMonthYear = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${SPANISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  const availableMonths = useMemo(() => {
    if (!events) return [];
    const monthSet = new Set<string>();
    
    events.forEach(event => {
      if (event.event_date) {
        const monthYear = formatMonthYear(event.event_date);
        monthSet.add(monthYear);
      }
    });
    
    return Array.from(monthSet).sort((a, b) => {
      // Parse "enero 2026" format back to comparable dates
      const parseMonth = (str: string) => {
        const [month, year] = str.split(' ');
        return new Date(parseInt(year), SPANISH_MONTHS.indexOf(month));
      };
      return parseMonth(a).getTime() - parseMonth(b).getTime();
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
          const eventMonth = formatMonthYear(event.event_date);
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

  // SEO Gold Format: [Artista]: Conciertos, Gira y Entradas 2026 | FEELOMOVE+
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const seoYear = events?.some((e: any) => new Date(e.event_date).getFullYear() > currentYear) ? nextYear : currentYear;
  
  const seoTitle = locale === 'en'
    ? `${artistName}: Concerts, Tour & Tickets ${seoYear}`
    : `${artistName}: Conciertos, Gira y Entradas ${seoYear}`;
  const seoDescription = locale === 'en'
    ? `Check all confirmed tour dates for ${artistName}. Updated concert info and official ticket sales. ${events?.length || 0} dates available.`
    : `Consulta todas las fechas confirmadas de la gira de ${artistName}. Información actualizada de conciertos y venta de entradas oficial. ${events?.length || 0} fechas disponibles.`;

  // Generate JSON-LD structured data for artist and events
  const jsonLdData = useMemo(() => {
    const artistSchema = {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "name": artistName,
      "url": `https://feelomove.com/conciertos/${artistSlug}`,
      "image": heroImage || undefined,
      "genre": artistGenre || undefined,
      "event": events?.slice(0, 10).map((event: any) => ({
        "@type": "MusicEvent",
        "name": event.name,
        "description": `Concierto de ${artistName} en ${event.venue_city}. Entradas disponibles.`,
        "startDate": event.event_date,
        "endDate": event.event_date, // Same day event
        "eventStatus": event.sold_out ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "url": `https://feelomove.com/conciertos/${event.slug}`,
        "image": event.image_large_url || event.image_standard_url,
        "location": {
          "@type": "Place",
          "name": event.venue_name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": event.venue_city,
            "addressCountry": "ES"
          },
          ...(event.venue_latitude && event.venue_longitude && {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": event.venue_latitude,
              "longitude": event.venue_longitude
            }
          })
        },
        "organizer": event.promoter_name ? {
          "@type": "Organization",
          "name": event.promoter_name
        } : undefined,
        "offers": event.price_min_incl_fees ? {
          "@type": "Offer",
          "url": `https://feelomove.com/conciertos/${event.slug}`,
          "price": event.price_min_incl_fees,
          "priceCurrency": event.currency || "EUR",
          "availability": event.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          "validFrom": new Date().toISOString()
        } : undefined,
        "performer": {
          "@type": "MusicGroup",
          "name": artistName
        }
      }))
    };

    return artistSchema;
  }, [artistName, artistSlug, heroImage, artistGenre, events]);

  // CRITICAL SEO: If artist has exactly 1 event, redirect directly to event page
  // Uses useLayoutEffect + window.location.replace for IMMEDIATE redirect before paint
  // This ensures Googlebot sees the redirect in the first cycle, not a rendered page
  // IMPORTANT: This hook must be AFTER all other hooks to maintain consistent hook order
  useLayoutEffect(() => {
    if (isLoading || events === undefined || isRedirecting) return;
    
    // No events → 404
    if (events.length === 0) {
      setIsRedirecting(true);
      window.location.replace("/404");
      return;
    }
    
    // Single event → FORCE immediate redirect to event detail
    // This is critical for SEO: Google must not index this intermediate page
    if (events.length === 1) {
      const singleEvent = events[0] as any;
      const eventSlug = singleEvent.slug || singleEvent.canonical_slug;
      if (eventSlug) {
        setIsRedirecting(true);
        
        // Determine if festival or concert - use plural routes as canonical
        const isFestival = singleEvent.main_attraction || singleEvent.artist_count > 1;
        const esPath = isFestival 
          ? `/festivales/${eventSlug}` 
          : `/conciertos/${eventSlug}`;
        const targetPath = localePath(esPath);
        
        console.log(`[SEO] Immediate redirect: ${artistSlug} → ${targetPath}`);
        
        // window.location.replace executes synchronously and prevents further rendering
        window.location.replace(targetPath);
        return;
      }
    }
  }, [events, isLoading, artistSlug, isRedirecting]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && displayedEvents.length < filteredAndSortedEvents.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredAndSortedEvents.length));
    }
  }, [inView, displayedEvents.length, filteredAndSortedEvents.length]);
  
  // Block rendering completely if redirect is in progress
  // IMPORTANT: This conditional return is AFTER all hooks
  if (isRedirecting) {
    return null;
  }


  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={`https://feelomove.com/conciertos/${artistSlug}`}
        ogImage={heroImage || undefined}
        pageType="ItemPage"
        jsonLd={jsonLdData}
        preloadImage={heroImage}
        breadcrumbs={[
          { name: t("Inicio"), url: "/" },
          { name: t("Artistas"), url: localePath("/artistas") },
          { name: artistName }
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 pt-8 mt-16">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
        </div>
        
        {/* Hero Header - Full Width with Artist Image */}
        <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden">
          {heroImage ? (
            <img
              src={heroImage}
              alt={`${artistName} - ${t("Conciertos y gira en España")}`}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="sync"
              // @ts-expect-error - fetchpriority is valid HTML but React types don't recognize lowercase
              fetchpriority="high"
              width={1200}
              height={400}
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
                {seoContent?.h1Content || artistName}
              </h1>
              {seoContent?.introText && (
                <p className="text-muted-foreground mt-3 text-lg max-w-2xl line-clamp-2">
                  {seoContent.introText}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                  {events?.length || 0} {t('eventos')}
                </span>
                {artistGenre && (
                  <Link
                    to={`/generos/${genreSlug}`}
                    className="bg-foreground text-background px-3 py-1 rounded-full text-sm font-bold hover:bg-foreground/80 transition-colors"
                  >
                    {artistGenre}
                  </Link>
                )}
                {cities.length > 0 && (
                  <span className="text-muted-foreground text-sm">
                    {locale === 'en' ? 'in' : 'en'} {cities.slice(0, 3).join(", ")}{cities.length > 3 ? ` +${cities.length - 3}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              type="text"
              placeholder={t('Buscar eventos o ciudades...')}
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
                  <SelectItem value="date-asc">{t('Fecha (próximos primero)')}</SelectItem>
                  <SelectItem value="date-desc">{t('Fecha (lejanos primero)')}</SelectItem>
                  <SelectItem value="price-asc">{t('Precio (menor a mayor)')}</SelectItem>
                  <SelectItem value="price-desc">{t('Precio (mayor a menor)')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="h-11 border-2">
                  <SelectValue placeholder="Todas las fechas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Todas las fechas')}</SelectItem>
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
                  <SelectItem value="all">{t('Todas las ciudades')}</SelectItem>
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
              {t('Limpiar filtros')}
            </button>
            </div>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <>
              {/* Mobile: List Skeletons */}
              <div className="md:hidden space-y-0 -mx-4">
                {[...Array(6)].map((_, i) => (
                  <EventListCardSkeleton key={i} />
                ))}
              </div>
              {/* Desktop: Grid Skeletons */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(6)].map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">{t('No se encontraron eventos')}</p>
              <p className="text-muted-foreground">{t('Prueba ajustando los filtros o la búsqueda')}</p>
            </div>
          ) : (
            <>
              {/* Mobile: Compact List View */}
              <div className="md:hidden space-y-0 -mx-4">
                {displayedEvents.map((event, index) => (
                  <EventListCard 
                    key={event.id} 
                    event={event} 
                    priority={index < 5} 
                  />
                ))}
              </div>
              
              {/* Desktop: Grid View */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <p className="text-sm text-muted-foreground font-['Poppins']">{t('Cargando más eventos...')}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Destinations Section - Compact List with Images */}
          {citiesWithData.length > 0 && (
            <div className="mt-16 mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t('Destinos de')} {artistName}</h2>
                <Link
                  to={localePath('/destinos')}
                  className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
                >
                    {t('Ver todos')} 
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {citiesWithData.map((city, index) => (
                  <Link
                    key={city.name}
                    to={localePath(`/destinos/${city.slug}`)}
                    className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent transition-all">
                        {city.image ? (
                          <img
                            src={city.image}
                            alt={city.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted" />
                        )}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {city.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-background bg-foreground px-3 py-1 rounded-full font-medium">
                        {city.count} {city.count === 1 ? t('evento') : t('eventos')}
                      </span>
                      <svg className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Artists Section */}
          {relatedArtists && relatedArtists.length > 0 && (
            <div className="mt-12 mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t('Artistas relacionados')}</h2>
                {genreSlug && (
                  <Link 
                    to={`/generos/${genreSlug}`}
                    className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
                  >
                    {t('Ver todos')} 
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedArtists.map((artist: any, index: number) => (
                  <Link
                    key={artist.slug}
                    to={localePath(`/conciertos/${artist.slug}`)}
                    className="group relative aspect-square rounded-xl overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {artist.image ? (
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
          <RelatedLinks slug={artistSlug} type="artist" />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ArtistaDetalle;
