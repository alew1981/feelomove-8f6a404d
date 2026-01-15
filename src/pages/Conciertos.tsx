import { useState, useMemo, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import VirtualizedEventGrid from "@/components/VirtualizedEventGrid";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";

// Generate month-year options dynamically from available events
const getMonthYearOptions = (events: any[]) => {
  if (!events || events.length === 0) return [];

  const monthYearSet = new Set<string>();
  events.forEach((event) => {
    if (event.event_date) {
      const date = new Date(event.event_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthYearSet.add(monthYear);
    }
  });

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return Array.from(monthYearSet)
    .sort()
    .map((my) => {
      const [year, month] = my.split("-");
      const monthName = monthNames[parseInt(month) - 1];
      return {
        value: my,
        label: `${monthName} - ${year}`,
      };
    });
};

const PAGE_SIZE = 30;

const Conciertos = () => {
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterMonthYear, setFilterMonthYear] = useState<string>("all");
  const [filterVip, setFilterVip] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch conciertos paginated (avoid pulling thousands of rows on first paint)
  const {
    data: eventsPages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "conciertos",
      {
        filterCity,
        filterGenre,
        filterArtist,
        filterMonthYear,
        searchQuery,
      },
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const nowIso = new Date().toISOString();

      // Only request columns we actually use in the cards/list
      let query = supabase
        .from("mv_concerts_cards")
        .select(
          "id, name, slug, event_date, venue_city, venue_name, venue_latitude, venue_longitude, image_standard_url, image_large_url, price_min_incl_fees, currency, sold_out, badges, artist_name, genre"
        )
        .gte("event_date", nowIso)
        .order("event_date", { ascending: true })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Server-side filters to reduce payload
      if (filterCity !== "all") query = query.eq("venue_city", filterCity);
      if (filterGenre !== "all") query = query.eq("genre", filterGenre);
      if (filterArtist !== "all") query = query.eq("artist_name", filterArtist);

      if (filterMonthYear !== "all") {
        const [yearStr, monthStr] = filterMonthYear.split("-");
        const year = Number(yearStr);
        const monthIndex = Number(monthStr) - 1;
        const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
        const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59));
        query = query.gte("event_date", start.toISOString()).lte("event_date", end.toISOString());
      }


      // Basic server-side search (keeps initial load fast)
      if (searchQuery.trim()) {
        const pattern = `%${searchQuery.trim()}%`;
        query = query.or(`name.ilike.${pattern},venue_city.ilike.${pattern},artist_name.ilike.${pattern}`);
      }

      const { data: cards, error } = await query;
      if (error) throw error;

      // Filter out transport services (bus, shuttle, etc.)
      const transportKeywords = ["autobus", "bus", "shuttle", "transfer", "transporte", "servicio de autobus"];
      const normalizeText = (text: string) =>
        text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

      return (cards || []).filter((event: any) => {
        const name = normalizeText(event.name || "");
        const artist = normalizeText(event.artist_name || "");
        return !transportKeywords.some((kw) => name.includes(kw) || artist.includes(kw));
      });
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined),
    staleTime: 60 * 1000,
  });

  const events = useMemo(() => eventsPages?.pages.flat() ?? [], [eventsPages]);

  // Separate query for created_at - only fetched when "novedades" or "added" filter is active
  const { data: createdAtMap } = useQuery({
    queryKey: ["conciertos-created-at"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Only get events created in the last 7 days for novedades
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("id, created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) throw error;
      return new Map((data || []).map((e) => [e.id, e.created_at]));
    },
    enabled: filterVip === "novedades",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get first event image for hero
  const heroImage = events?.[0]?.image_large_url || events?.[0]?.image_standard_url;

  // Extract unique cities, genres, and artists (based on loaded pages; grows as you scroll)
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(events.map((e: any) => e.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [events]);

  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(events.map((e: any) => e.genre).filter(Boolean))];
    return uniqueGenres.sort() as string[];
  }, [events]);

  const artists = useMemo(() => {
    const uniqueArtists = [...new Set(events.map((e: any) => e.artist_name).filter(Boolean))];
    return uniqueArtists.sort() as string[];
  }, [events]);

  // Get month-year options from events
  const monthYearOptions = useMemo(() => getMonthYearOptions(events || []), [events]);

  // Filter and sort events (keep client-side VIP + novedades sorting)
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Apply search filter (accent-insensitive) as a second-pass, to keep UX consistent
    if (searchQuery) {
      filtered = filtered.filter(
        (event: any) =>
          matchesSearch(event.name, searchQuery) ||
          matchesSearch(event.venue_city, searchQuery) ||
          matchesSearch(event.artist_name, searchQuery)
      );
    }

    // Apply novedades filter (events added in last 7 days)
    if (filterVip === "novedades" && createdAtMap) {
      filtered = filtered.filter((event: any) => createdAtMap.has(event.id));
      filtered.sort((a: any, b: any) => {
        const aDate = createdAtMap.get(a.id) ? new Date(createdAtMap.get(a.id)!).getTime() : 0;
        const bDate = createdAtMap.get(b.id) ? new Date(createdAtMap.get(b.id)!).getTime() : 0;
        return bDate - aDate;
      });
    }

    // Apply VIP filter (check badges for VIP or name contains VIP)
    if (filterVip === "vip") {
      filtered = filtered.filter((event: any) => {
        const badges = event.badges || [];
        const hasVipBadge = badges.some((b: string) => /vip/i.test(b));
        const hasVipInName = /vip/i.test(event.name || "");
        return hasVipBadge || hasVipInName;
      });
    }

    // Default sort by date ascending unless already sorted by created_at (novedades)
    if (filterVip !== "novedades") {
      filtered.sort(
        (a: any, b: any) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime()
      );
    }

    return filtered;
  }, [events, searchQuery, filterVip, createdAtMap]);

  // Callback for load more
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Generate JSON-LD for concerts list (ItemList with complete Event objects for Google)
  const jsonLd = events && events.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Conciertos en España 2025",
    "description": "Listado de conciertos y eventos musicales en España. Compra entradas y reserva hotel.",
    "url": "https://feelomove.com/conciertos",
    "numberOfItems": events.length,
    "itemListElement": events.slice(0, 20).map((event, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicEvent",
        "name": event.name,
        "description": `Concierto de ${event.artist_name || event.name} en ${event.venue_city}. Compra entradas y reserva hotel cercano.`,
        "startDate": event.event_date,
        "endDate": event.event_date,
        "eventStatus": event.sold_out ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "url": `https://feelomove.com/concierto/${event.slug || event.id}`,
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
          "url": `https://feelomove.com/concierto/${event.slug || event.id}`,
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
  } : null;

  return (
    <>
      <SEOHead
        title="Conciertos en España 2025 - Entradas y Hoteles"
        description="Compra entradas para conciertos en Madrid, Barcelona y toda España. Reserva hotel cerca del venue. Rock, pop, indie y más."
        canonical="/conciertos"
        keywords="conciertos españa 2025, entradas conciertos madrid, conciertos barcelona, rock pop indie"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Conciertos" }
        ]}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image - LCP optimized */}
          <PageHero 
            title="Conciertos en España" 
            subtitle="Entradas y hoteles para los mejores conciertos"
            imageUrl={heroImage} 
            priority={true}
          />
          
          {/* H2 for proper heading hierarchy - visible for SEO */}
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-4">
            Próximos eventos y conciertos destacados en España
          </h2>
          
          {/* Description */}
          <div className="prose prose-lg max-w-none mb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}>
            <p className="text-muted-foreground leading-relaxed">
              Descubre todos los conciertos en España. Desde rock y pop hasta indie y electrónica. 
              Encuentra tu concierto perfecto y reserva hotel en la misma ciudad.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3 mb-8">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="conciertos-search"
                name="q"
                type="text"
                placeholder="Buscar conciertos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-card border-2 border-border rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                  aria-label="Borrar búsqueda"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filters Row - ciudad, genero, artista, mes, próximos, VIP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterCity === "all" ? "Ciudad" : filterCity}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterGenre !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterGenre === "all" ? "Género" : filterGenre}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los géneros</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterArtist} onValueChange={setFilterArtist}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterArtist !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterArtist === "all" ? "Artista" : filterArtist}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los artistas</SelectItem>
                  {artists.map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMonthYear} onValueChange={setFilterMonthYear}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonthYear !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterMonthYear === "all" ? "Mes" : monthYearOptions.find(m => m.value === filterMonthYear)?.label}</span>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {monthYearOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterVip} onValueChange={setFilterVip}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterVip !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">
                    {filterVip === "all" ? "Tipo" : filterVip === "vip" ? "VIP" : "Novedades"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vip">Solo VIP</SelectItem>
                  <SelectItem value="novedades">Novedades</SelectItem>
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
                  Limpiar filtros
                </button>
              </div>
            )}
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
            <VirtualizedEventGrid
              events={filteredAndSortedEvents}
              onLoadMore={handleLoadMore}
              hasMore={hasNextPage}
              isLoadingMore={isFetchingNextPage}
            />
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Conciertos;