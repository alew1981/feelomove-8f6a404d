import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DestinationCardSkeleton } from "@/components/ui/skeleton-loader";
import { useInView } from "react-intersection-observer";
import { matchesSearch } from "@/lib/searchUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import DestinationListCard, { DestinationListCardSkeleton } from "@/components/DestinationListCard";
import MobileFilterPills from "@/components/MobileFilterPills";
import VirtualizedDestinationList from "@/components/VirtualizedDestinationList";
import { CACHE_TTL } from "@/lib/cacheClient";
import { usePrefetch } from "@/hooks/usePrefetch";

const months = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const Destinos = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });
  const isMobile = useIsMobile();
  const { prefetchDestination } = usePrefetch();
  const prefetchedCards = useRef<Set<string>>(new Set());

  const { data: cities, isLoading, error } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      // Parallel fetch: destinations MV + city images
      const [destinationsRes, cityImagesRes] = await Promise.all([
        supabase
          .from("mv_destinations_cards")
          .select("*")
          .order("event_count", { ascending: false }),
        supabase
          .from("lite_tbl_city_mapping")
          .select("ticketmaster_city, imagen_ciudad")
          .not("imagen_ciudad", "is", null)
      ]);
      
      if (destinationsRes.error) {
        console.error("Error fetching destinations:", destinationsRes.error);
        throw destinationsRes.error;
      }
      
      const destinations = destinationsRes.data || [];
      
      // Build city image map
      const cityImageMap = new Map<string, string>();
      if (cityImagesRes.data && Array.isArray(cityImagesRes.data)) {
        cityImagesRes.data.forEach((city) => {
          if (city.ticketmaster_city && city.imagen_ciudad) {
            cityImageMap.set(city.ticketmaster_city.toLowerCase(), city.imagen_ciudad);
          }
        });
      }
      
      return destinations.map((dest: any) => ({
        ...dest,
        ciudad_imagen: dest.city_name ? cityImageMap.get(dest.city_name.toLowerCase()) || null : null
      }));
    },
    // Use longer cache TTL - data is from materialized view, refreshed periodically
    staleTime: CACHE_TTL.destinations,
    gcTime: CACHE_TTL.destinations * 2,
  });

  const heroImage = cities?.[0]?.sample_image_url || cities?.[0]?.sample_image_standard_url;

  const cityNames = useMemo(() => {
    if (!cities) return [];
    return [...new Set(cities.map((c: any) => c.city_name).filter(Boolean))].sort() as string[];
  }, [cities]);

  const genres = useMemo(() => {
    if (!cities) return [];
    const allGenres = cities.flatMap((c: any) => c.genres || []).filter(Boolean);
    return [...new Set(allGenres)].sort() as string[];
  }, [cities]);

  const artists = useMemo(() => {
    if (!cities) return [];
    const allArtists = cities.flatMap((c: any) => c.top_artists || []).filter(Boolean);
    return [...new Set(allArtists)].sort() as string[];
  }, [cities]);

  const filteredCities = useMemo(() => {
    if (!cities) return [];
    return cities.filter((city: any) => {
      const searchMatches = matchesSearch(city.city_name, searchQuery);
      const matchesCityFilter = filterCity === "all" || city.city_name === filterCity;
      const matchesGenreFilter = filterGenre === "all" || city.genres?.includes(filterGenre);
      const matchesArtistFilter = filterArtist === "all" || city.top_artists?.includes(filterArtist);
      return searchMatches && matchesCityFilter && matchesGenreFilter && matchesArtistFilter;
    });
  }, [cities, searchQuery, filterCity, filterGenre, filterArtist]);

  const displayedCities = useMemo(() => filteredCities.slice(0, displayCount), [filteredCities, displayCount]);

  useEffect(() => {
    if (inView && displayedCities.length < filteredCities.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredCities.length));
    }
  }, [inView, displayedCities.length, filteredCities.length]);

  // Filter config for mobile pills
  const mobileFilters = useMemo(() => [
    {
      id: "city",
      label: "Ciudad",
      value: filterCity,
      options: cityNames.map(c => ({ value: c, label: c })),
      onChange: setFilterCity,
    },
    {
      id: "genre",
      label: "Género",
      value: filterGenre,
      options: genres.map(g => ({ value: g, label: g })),
      onChange: setFilterGenre,
    },
  ], [filterCity, filterGenre, cityNames, genres]);

  const handleClearFilters = () => {
    setFilterCity("all");
    setFilterGenre("all");
    setFilterArtist("all");
    setFilterMonth("all");
  };

  // Prefetch handler for desktop cards
  const handleCardPrefetch = useCallback((citySlug: string) => {
    if (!prefetchedCards.current.has(citySlug)) {
      prefetchedCards.current.add(citySlug);
      prefetchDestination(citySlug);
    }
  }, [prefetchDestination]);

  const jsonLd = cities && cities.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Destinos de Eventos en España",
    "description": "Ciudades con eventos musicales en España",
    "numberOfItems": cities.length,
    "itemListElement": cities.slice(0, 20).map((city: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "City",
        "name": city.city_name,
        "url": `https://feelomove.com/destinos/${city.city_slug || encodeURIComponent(city.city_name)}`,
        "description": `${city.event_count} eventos musicales en ${city.city_name}`
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title="Destinos Musicales en España - Eventos por Ciudad"
        description="Explora conciertos y festivales en Madrid, Barcelona, Valencia y más. Encuentra eventos musicales cerca de ti."
        canonical="/destinos"
        keywords="destinos musicales españa, eventos madrid, conciertos barcelona, festivales valencia"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Destinos" }
        ]}
        preloadImage={cities?.[0]?.ciudad_imagen}
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        
        {/* Breadcrumbs - Hidden on mobile */}
        <div className="mb-4 hidden md:block">
          <Breadcrumbs />
        </div>
        
        {/* Hero Image - Hidden on mobile for faster results */}
        <div className="hidden md:block">
          <PageHero 
            title="Destinos Musicales en España" 
            subtitle="Conciertos y festivales por ciudad"
            imageUrl={heroImage} 
            priority={true}
          />
          
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-4">
            Ciudades destacadas con eventos musicales en España
          </h2>
          
          <p className="text-muted-foreground leading-relaxed mb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 40px' }}>
            Explora eventos musicales en las mejores ciudades de España.
          </p>
        </div>

        {/* Mobile: Compact Title */}
        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-foreground">
            Destinos ({filteredCities?.length || 0})
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar destino..."
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

        {/* Mobile: Filter Pills */}
        <div className="md:hidden mb-4">
          <MobileFilterPills filters={mobileFilters} onClearAll={handleClearFilters} />
        </div>

        {/* Desktop: Filters Row */}
        <div className="hidden md:block space-y-3 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                <span className="truncate text-sm">{filterCity === "all" ? "Ciudad" : filterCity}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cityNames.map((city: string) => (
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
                {genres.map((genre: string) => (
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
                {artists.map((artist: string) => (
                  <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonth !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                <span className="truncate text-sm">{filterMonth === "all" ? "Mes" : months.find(m => m.value === filterMonth)?.label}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(filterCity !== "all" || filterGenre !== "all" || filterArtist !== "all" || filterMonth !== "all") && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <>
            {/* Mobile: List Skeletons */}
            <div className="md:hidden space-y-0">
              {Array.from({ length: 8 }).map((_, i) => <DestinationListCardSkeleton key={i} />)}
            </div>
            {/* Desktop: Card Grid Skeletons */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
            </div>
          </>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-16"><p className="text-xl text-muted-foreground">No se encontraron destinos</p></div>
        ) : (
          <>
            {/* Mobile: Virtualized List - Only renders visible items */}
            <div className="md:hidden">
              <VirtualizedDestinationList 
                cities={filteredCities} 
                isLoading={isLoading} 
              />
            </div>

            {/* Desktop: Card Grid View */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedCities.map((city: any, index: number) => {
                const isPriority = index < 4;
                const citySlug = city.city_slug || encodeURIComponent(city.city_name);
                return (
                  <Link 
                    key={city.city_name} 
                    to={`/destinos/${citySlug}`} 
                    className="block" 
                    title={`Descubrir eventos en ${city.city_name}`}
                    onMouseEnter={() => handleCardPrefetch(citySlug)}
                    onTouchStart={() => handleCardPrefetch(citySlug)}
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative">
                      <div className="relative h-64 overflow-hidden bg-muted">
                        <img 
                          src={city.ciudad_imagen || city.sample_image_url || city.sample_image_standard_url || "/placeholder.svg"} 
                          alt={`Conciertos y festivales en ${city.city_name} - ${city.event_count} eventos musicales`}
                          title={`Eventos en ${city.city_name} - ${city.event_count} conciertos y festivales`}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          loading={isPriority ? "eager" : "lazy"}
                          decoding={isPriority ? "sync" : "async"}
                          fetchPriority={isPriority ? "high" : "auto"}
                          width={400}
                          height={256}
                          onError={(e) => {
                            e.currentTarget.src = city.sample_image_url || city.sample_image_standard_url || "/placeholder.svg";
                          }}
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <Badge className="bg-accent text-accent-foreground hover:bg-accent border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                            {city.event_count} eventos
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-bold text-xl text-foreground line-clamp-1">{city.city_name}</h3>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {city.concerts_count > 0 && <span>{city.concerts_count} conciertos</span>}
                          {city.festivals_count > 0 && <span>• {city.festivals_count} festivales</span>}
                        </div>
                        {city.price_from && (
                          <p className="text-sm text-accent font-semibold">
                            Desde {Number(city.price_from).toFixed(0)}€
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 rounded-lg text-sm">Ver Eventos →</Button>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
            {displayedCities.length < filteredCities.length && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
    </>
  );
};

export default Destinos;
