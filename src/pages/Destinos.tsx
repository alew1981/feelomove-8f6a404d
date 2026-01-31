import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { matchesSearch } from "@/lib/searchUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DestinationListCardSkeleton } from "@/components/DestinationListCard";
import { CACHE_TTL } from "@/lib/cacheClient";
import { usePrefetch } from "@/hooks/usePrefetch";

// === INLINE SVG ICONS (replaces lucide-react for TBT optimization) ===
const IconSearch = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IconX = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

// Lazy load non-critical components (desktop-only or below-fold)
const Breadcrumbs = lazy(() => import("@/components/Breadcrumbs"));
const PageHero = lazy(() => import("@/components/PageHero"));
const MobileFilterPills = lazy(() => import("@/components/MobileFilterPills"));
const VirtualizedDestinationList = lazy(() => import("@/components/VirtualizedDestinationList"));
const Footer = lazy(() => import("@/components/Footer"));

// Desktop filters - lazy loaded since hidden on mobile  
const DesktopFiltersSection = lazy(() => import("@/components/DestinationDesktopFilters"));

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
  const loadMoreRef = useRef<HTMLDivElement>(null);
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

  // Native IntersectionObserver for load more (replaces react-intersection-observer)
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && displayedCities.length < filteredCities.length) {
          setDisplayCount(prev => Math.min(prev + 30, filteredCities.length));
        }
      },
      { threshold: 0 }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [displayedCities.length, filteredCities.length]);

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
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        
        {/* Breadcrumbs - Hidden on mobile, lazy loaded */}
        <div className="mb-4 hidden md:block" style={{ minHeight: '20px' }}>
          <Suspense fallback={<div className="h-5" />}>
            <Breadcrumbs />
          </Suspense>
        </div>
        
        {/* Hero Image - Hidden on mobile for faster results, lazy loaded */}
        <div className="hidden md:block" style={{ minHeight: '340px' }}>
          <Suspense fallback={<div className="h-[340px] bg-muted/20 rounded-2xl animate-pulse" />}>
            <PageHero 
              title="Destinos Musicales en España" 
              subtitle="Conciertos y festivales por ciudad"
              imageUrl={heroImage} 
              priority={true}
            />
          </Suspense>
          
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-4">
            Ciudades destacadas con eventos musicales en España
          </h2>
          
          <p className="text-muted-foreground leading-relaxed mb-8 content-auto">
            Explora eventos musicales en las mejores ciudades de España.
          </p>
        </div>

        {/* Mobile: LCP-optimized Title - Renders INSTANTLY without waiting for data */}
        <h1 
          className="md:hidden text-xl font-bold text-foreground mb-4"
          style={{ 
            minHeight: '28px',
            contain: 'layout style',
          }}
        >
          Destinos {!isLoading && filteredCities ? `(${filteredCities.length})` : ''}
        </h1>

        {/* Search Bar */}
        <div className="relative mb-3">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              <IconX className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Mobile: Filter Pills - Lazy loaded */}
        <div className="md:hidden mb-4">
          <Suspense fallback={<div className="h-10" />}>
            <MobileFilterPills filters={mobileFilters} onClearAll={handleClearFilters} />
          </Suspense>
        </div>

        {/* Desktop: Filters Row - Lazy loaded */}
        <div className="hidden md:block">
          <Suspense fallback={<div className="h-14 bg-muted/20 rounded-lg animate-pulse mb-8" />}>
            <DesktopFiltersSection
              filterCity={filterCity}
              setFilterCity={setFilterCity}
              cityNames={cityNames}
              filterGenre={filterGenre}
              setFilterGenre={setFilterGenre}
              genres={genres}
              filterArtist={filterArtist}
              setFilterArtist={setFilterArtist}
              artists={artists}
              filterMonth={filterMonth}
              setFilterMonth={setFilterMonth}
              months={months}
              handleClearFilters={handleClearFilters}
            />
          </Suspense>
        </div>

        {/* Content container with stable dimensions to prevent CLS */}
        <div 
          style={{ 
            minHeight: 'calc(100vh - 280px)',
            contain: 'layout',
          }}
        >
          {isLoading ? (
            <>
              {/* Mobile: List Skeletons with stable height */}
              <div className="md:hidden">
                {Array.from({ length: 10 }).map((_, i) => <DestinationListCardSkeleton key={i} />)}
              </div>
              {/* Desktop: Card Grid Skeletons */}
              <div className="hidden md:grid grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <DestinationListCardSkeleton key={i} />)}
              </div>
            </>
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-16"><p className="text-xl text-muted-foreground">No se encontraron destinos</p></div>
          ) : (
            <>
              {/* Mobile: Virtualized List - Only renders visible items */}
              <div className="md:hidden">
                <Suspense fallback={
                  <div>
                    {Array.from({ length: 10 }).map((_, i) => <DestinationListCardSkeleton key={i} />)}
                  </div>
                }>
                  <VirtualizedDestinationList 
                    cities={filteredCities} 
                    isLoading={isLoading} 
                  />
                </Suspense>
              </div>

            {/* Desktop: 3-Column List Layout - Spacious design */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              {displayedCities.map((city: any) => {
                const citySlug = city.city_slug || encodeURIComponent(city.city_name);
                const topArtists = city.top_artists?.slice(0, 3)?.join(' · ') || '';
                
                return (
                  <Link 
                    key={city.city_name} 
                    to={`/destinos/${citySlug}`} 
                    className="group flex items-center justify-between gap-4 px-5 py-5 bg-card border-2 border-foreground rounded-2xl transition-all duration-200 ease-out hover:bg-[#00FF8F] hover:-translate-y-1 hover:shadow-lg"
                    title={`Descubrir eventos en ${city.city_name}`}
                    onMouseEnter={() => handleCardPrefetch(citySlug)}
                  >
                    {/* Left: City Name + Artists */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground text-xl truncate group-hover:text-black transition-colors duration-200">
                        {city.city_name}
                      </h3>
                      {topArtists && (
                        <p className="text-sm text-accent font-medium truncate mt-1 group-hover:text-black/70 transition-colors duration-200">
                          {topArtists}
                        </p>
                      )}
                    </div>
                    
                    {/* Right: Event Count Badge */}
                    <span className="flex-shrink-0 font-bold text-base px-4 py-2 rounded-full bg-foreground text-background group-hover:bg-black group-hover:text-[#00FF8F] transition-colors duration-200">
                      {city.event_count}
                    </span>
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
        </div>
      </main>
      <Suspense fallback={<div style={{ minHeight: '256px', contentVisibility: 'auto', containIntrinsicSize: '0 256px' }} />}>
        <Footer />
      </Suspense>
    </div>
    </>
  );
};

export default Destinos;
