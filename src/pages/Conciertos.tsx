import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import EventListCard, { EventListCardSkeleton } from "@/components/EventListCard";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";
import { useTranslation } from "@/hooks/useTranslation";

// Generate month-year options dynamically from available events
const getMonthYearOptions = (events: any[]) => {
  if (!events || events.length === 0) return [];
  
  const monthYearSet = new Set<string>();
  events.forEach(event => {
    if (event.event_date) {
      const date = new Date(event.event_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthYearSet.add(monthYear);
    }
  });
  
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  return Array.from(monthYearSet)
    .sort()
    .map(my => {
      const [year, month] = my.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      return {
        value: my,
        label: `${monthName} - ${year}`
      };
    });
};

const Conciertos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale } = useTranslation();
  
  // Initialize filters from URL params
  const initialGenre = searchParams.get("genero") || "all";
  const initialCity = searchParams.get("ciudad") || "all";
  
  const [filterCity, setFilterCity] = useState<string>(initialCity);
  const [filterGenre, setFilterGenre] = useState<string>(initialGenre);
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterMonthYear, setFilterMonthYear] = useState<string>("all");
  const [filterVip, setFilterVip] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(30);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });
  
  // Sync URL params with filter state
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filterGenre !== "all") newParams.set("genero", filterGenre);
    if (filterCity !== "all") newParams.set("ciudad", filterCity);
    
    // Only update if params changed to avoid loops
    const currentParams = searchParams.toString();
    const newParamsString = newParams.toString();
    if (currentParams !== newParamsString) {
      setSearchParams(newParams, { replace: true });
    }
  }, [filterGenre, filterCity, searchParams, setSearchParams]);

  // Fetch conciertos from mv_concerts_cards (includes updated_at and on_sale_date)
  const { data: events, isLoading } = useQuery({
    queryKey: ["conciertos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .gte("event_date", new Date().toISOString());
      
      if (error) throw error;
      
      // Centralized filter: exclude technical/service events
      const excludedKeywords = [
        "parking", "ticketless", "upgrade", "voucher", "shuttle", "transfer",
        "transporte", "servicio de autobus", "plaza de parking", "hotel package",
        "paquetes vip", "vip packages", "vip package", "autobus", "bus +", "+ bus"
      ];
      const normalizeText = (text: string) => 
        text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      
      const filtered = (data || []).filter(event => {
        const name = normalizeText(event.name || "");
        const artist = normalizeText(event.artist_name || "");
        const combined = `${name} ${artist}`;
        return !excludedKeywords.some(kw => combined.includes(kw));
      });

      // Sort by created_at DESC (most recently created/added first)
      return filtered.sort((a, b) => {
        const dateA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
        const dateB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
        return dateB - dateA;
      });
    }
  });

  // Get first event image for hero
  const heroImage = events?.[0]?.image_large_url || events?.[0]?.image_standard_url;

  // Extract unique cities, genres, and artists
  const cities = useMemo(() => {
    if (!events) return [];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  const genres = useMemo(() => {
    if (!events) return [];
    const uniqueGenres = [...new Set(events.map(e => e.genre).filter(Boolean))];
    return uniqueGenres.sort() as string[];
  }, [events]);

  const artists = useMemo(() => {
    if (!events) return [];
    const uniqueArtists = [...new Set(events.map(e => e.artist_name).filter(Boolean))];
    return uniqueArtists.sort() as string[];
  }, [events]);

  // Get month-year options from events
  const monthYearOptions = useMemo(() => getMonthYearOptions(events || []), [events]);

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

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(event => event.genre === filterGenre);
    }

    // Apply artist filter
    if (filterArtist !== "all") {
      filtered = filtered.filter(event => event.artist_name === filterArtist);
    }

    // Apply month-year filter
    if (filterMonthYear !== "all") {
      filtered = filtered.filter(event => {
        if (!event.event_date) return false;
        const date = new Date(event.event_date);
        const eventMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return eventMonthYear === filterMonthYear;
      });
    }

    // Apply VIP filter (check badges for VIP or name contains VIP)
    if (filterVip === "vip") {
      filtered = filtered.filter(event => {
        const badges = event.badges || [];
        const hasVipBadge = badges.some((b: string) => /vip/i.test(b));
        const hasVipInName = /vip/i.test(event.name || '');
        return hasVipBadge || hasVipInName;
      });
    }

    // Events are already sorted by created_at DESC from the query
    // No additional sorting needed - most recently created events appear first
    
    return filtered;
  }, [events, searchQuery, filterCity, filterGenre, filterArtist, filterMonthYear, filterVip]);

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

  // Generate JSON-LD for concerts list (ItemList with complete Event objects for Google)
  const jsonLd = events && events.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": locale === 'en' ? "Concerts in Spain 2025" : "Conciertos en España 2025",
    "description": locale === 'en' ? "List of concerts and music events in Spain. Buy tickets and book hotels." : "Listado de conciertos y eventos musicales en España. Compra entradas y reserva hotel.",
    "url": "https://feelomove.com/conciertos",
    "numberOfItems": events.length,
    "itemListElement": events.slice(0, 20).map((event, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "name": event.name,
        "description": locale === 'en'
          ? `Concert of ${event.artist_name || event.name} in ${event.venue_city}. Buy tickets and book a nearby hotel.`
          : `Concierto de ${event.artist_name || event.name} en ${event.venue_city}. Compra entradas y reserva hotel cercano.`,
        "startDate": event.event_date,
        "endDate": event.event_date,
        "eventStatus": event.sold_out ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "url": `https://feelomove.com/${locale === 'en' ? 'en/tickets' : 'conciertos'}/${event.slug || event.id}`,
        "image": [event.image_large_url || event.image_standard_url || "https://feelomove.com/og-image.jpg"],
        "location": {
          "@type": "Place",
          "name": event.venue_name || (locale === 'en' ? "Event venue" : "Recinto del evento"),
          "address": {
            "@type": "PostalAddress",
            "streetAddress": event.venue_name || "",
            "addressLocality": event.venue_city,
            "addressRegion": locale === 'en' ? "Spain" : "España",
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
          "url": `https://feelomove.com/${locale === 'en' ? 'en/tickets' : 'conciertos'}/${event.slug || event.id}`,
          "price": event.price_min_incl_fees || 0,
          "priceCurrency": event.currency || "EUR",
          "availability": event.sold_out ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          "validFrom": new Date().toISOString()
        },
        "performer": {
          "@type": "MusicGroup",
          "name": event.artist_name || event.name
        }
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title={locale === 'en' ? "Concerts in Spain 2025 - Tickets and Hotels" : "Conciertos en España 2025 - Entradas y Hoteles"}
        description={locale === 'en' ? "Buy tickets for concerts in Madrid, Barcelona and all Spain. Book a hotel near the venue. Rock, pop, indie and more." : "Compra entradas para conciertos en Madrid, Barcelona y toda España. Reserva hotel cerca del venue. Rock, pop, indie y más."}
        canonical="/conciertos"
        keywords="conciertos españa 2025, entradas conciertos madrid, conciertos barcelona, rock pop indie"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: t("Inicio"), url: "/" },
          { name: t("Conciertos") }
        ]}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-4 md:py-8 mt-16">
          
          {/* Breadcrumbs - hidden on mobile */}
          <div className="hidden md:block mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image - hidden on mobile for faster content access */}
          <div className="hidden md:block">
            <PageHero 
              title={t("Conciertos en España")} 
              subtitle={t("Entradas y hoteles para los mejores conciertos")}
              imageUrl={heroImage} 
              priority={true}
            />
          </div>
          
          {/* Mobile Header - compact */}
          <div className="md:hidden mb-3">
            <h1 className="text-xl font-bold text-foreground">{t("Conciertos en España")}</h1>
            <p className="text-sm text-muted-foreground">{filteredAndSortedEvents.length} {t("conciertos disponibles")}</p>
          </div>

          {/* Mobile Search Bar - Above Filters */}
          <div className="md:hidden mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Buscar artista, ciudad...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-sm bg-card border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          {/* Desktop H2 */}
          <h2 className="hidden md:block text-2xl font-semibold text-foreground mt-6 mb-4">
            {t("Próximos eventos y conciertos destacados en España")}
          </h2>
          
          {/* Description - desktop only */}
          <div className="hidden md:block prose prose-lg max-w-none mb-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}>
            <p className="text-muted-foreground leading-relaxed">
              {t("Descubre todos los conciertos en España. Desde rock y pop hasta indie y electrónica. Encuentra tu concierto perfecto y reserva hotel en la misma ciudad.")}
            </p>
          </div>

          {/* Mobile Filters - Collapsible */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border rounded-lg text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>{t("Filtros")}</span>
                {(filterArtist !== "all" || filterCity !== "all") && (
                  <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                    {[filterArtist !== "all", filterCity !== "all"].filter(Boolean).length}
                  </span>
                )}
              </div>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showFilters && (
              <div className="mt-2 p-3 bg-card border border-border rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={filterArtist} onValueChange={setFilterArtist}>
                    <SelectTrigger className="h-9 text-xs">
                      <span className="truncate">{filterArtist === "all" ? t("Artista") : filterArtist}</span>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">{t("Todos los artistas")}</SelectItem>
                      {artists.map(artist => (
                        <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="h-9 text-xs">
                      <span className="truncate">{filterCity === "all" ? t("Ciudad") : filterCity}</span>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">{t("Todas las ciudades")}</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(filterArtist !== "all" || filterCity !== "all") && (
                  <button
                    onClick={() => {
                      setFilterArtist("all");
                      setFilterCity("all");
                      setShowFilters(false);
                    }}
                    className="text-xs text-destructive hover:underline w-full text-center pt-1"
                  >
                    {t("Limpiar filtros")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Search and Filters */}
          <div className="hidden md:block space-y-3 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Buscar conciertos...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-card border-2 border-border rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-5 gap-2">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterCity === "all" ? t("Ciudad") : filterCity}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todas las ciudades")}</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterGenre !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterGenre === "all" ? t("Género") : filterGenre}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todos los géneros")}</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterArtist} onValueChange={setFilterArtist}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterArtist !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterArtist === "all" ? t("Artista") : filterArtist}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todos los artistas")}</SelectItem>
                  {artists.map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMonthYear} onValueChange={setFilterMonthYear}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonthYear !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterMonthYear === "all" ? t("Mes") : monthYearOptions.find(m => m.value === filterMonthYear)?.label}</span>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">{t("Todos los meses")}</SelectItem>
                  {monthYearOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterVip} onValueChange={setFilterVip}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterVip !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterVip === "all" ? t("Tipo") : "VIP"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Todos")}</SelectItem>
                  <SelectItem value="vip">{t("Solo VIP")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterCity !== "all" || filterGenre !== "all" || filterArtist !== "all" || filterMonthYear !== "all" || filterVip !== "all") && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilterCity("all");
                    setFilterGenre("all");
                    setFilterArtist("all");
                    setFilterMonthYear("all");
                    setFilterVip("all");
                  }}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
                >
                  {t("Limpiar filtros")}
                </button>
              </div>
            )}
          </div>

          {/* Events - Mobile List / Desktop Grid */}
          {isLoading ? (
            <>
              {/* Mobile List Skeleton */}
              <div className="md:hidden space-y-0">
                {[...Array(6)].map((_, i) => (
                  <EventListCardSkeleton key={i} />
                ))}
              </div>
              {/* Desktop Grid Skeleton */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">{t("No se encontraron conciertos")}</p>
              <p className="text-muted-foreground">{t("Prueba ajustando los filtros o la búsqueda")}</p>
            </div>
          ) : (
            <>
              {/* Mobile: Compact List View */}
              <div className="md:hidden -mx-4">
                {displayedEvents.map((event, index) => (
                  <EventListCard key={event.id} event={event} priority={index < 6} />
                ))}
              </div>

              {/* Desktop: Grid View */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} priority={index < 4} />
                ))}
              </div>
              
              {/* Infinite Scroll Loader */}
              {displayedEvents.length < filteredAndSortedEvents.length && (
                <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-['Poppins']">{t("Cargando más conciertos...")}</p>
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
