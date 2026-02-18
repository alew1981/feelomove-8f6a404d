import { useState, useMemo, useEffect } from "react";
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
import { ArtistCardSkeleton } from "@/components/ui/skeleton-loader";
import { useInView } from "react-intersection-observer";
import { matchesSearch } from "@/lib/searchUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import ArtistListCard, { ArtistListCardSkeleton } from "@/components/ArtistListCard";
import MobileFilterPills from "@/components/MobileFilterPills";
import { useTranslation } from "@/hooks/useTranslation";

const Artistas = () => {
  const { t, locale, localePath } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  const isMobile = useIsMobile();
  
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  const months = useMemo(() => [
    { value: "01", label: t("Enero") },
    { value: "02", label: t("Febrero") },
    { value: "03", label: t("Marzo") },
    { value: "04", label: t("Abril") },
    { value: "05", label: t("Mayo") },
    { value: "06", label: t("Junio") },
    { value: "07", label: t("Julio") },
    { value: "08", label: t("Agosto") },
    { value: "09", label: t("Septiembre") },
    { value: "10", label: t("Octubre") },
    { value: "11", label: t("Noviembre") },
    { value: "12", label: t("Diciembre") },
  ], [t]);

  // Fetch artists from mv_attractions with graceful error handling
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["allArtists"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("mv_attractions")
          .select("*")
          .order("event_count", { ascending: false });
        
        if (error) {
          console.warn('mv_attractions unavailable (MV may be refreshing):', error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn('Error fetching artists:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Get hero image from first artist
  const heroImage = artists?.[0]?.sample_image_url || artists?.[0]?.sample_image_standard_url;

  // Extract unique genres and cities for filters
  const genres = useMemo(() => {
    if (!artists) return [];
    const allGenres = artists.flatMap((a: any) => a.genres || []).filter(Boolean);
    return [...new Set(allGenres)].sort() as string[];
  }, [artists]);

  const cities = useMemo(() => {
    if (!artists) return [];
    const allCities = artists.flatMap((a: any) => {
      const topCities = a.top_cities_json;
      if (Array.isArray(topCities)) {
        return topCities.map((c: any) => c.city);
      }
      return [];
    }).filter(Boolean);
    return [...new Set(allCities)].sort() as string[];
  }, [artists]);

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    return artists.filter((artist: any) => {
      const searchMatches = matchesSearch(artist.attraction_name, searchQuery);
      const matchesGenreFilter = filterGenre === "all" || artist.genres?.includes(filterGenre);
      
      let matchesCityFilter = filterCity === "all";
      if (filterCity !== "all" && artist.top_cities_json) {
        const topCities = Array.isArray(artist.top_cities_json) ? artist.top_cities_json : [];
        matchesCityFilter = topCities.some((c: any) => c.city === filterCity);
      }

      let matchesMonthFilter = filterMonth === "all";
      if (filterMonth !== "all" && artist.next_event_date) {
        const eventMonth = new Date(artist.next_event_date).toISOString().slice(5, 7);
        matchesMonthFilter = eventMonth === filterMonth;
      }

      return searchMatches && matchesGenreFilter && matchesCityFilter && matchesMonthFilter;
    });
  }, [artists, searchQuery, filterGenre, filterCity, filterMonth]);

  const displayedArtists = useMemo(() => {
    return filteredArtists.slice(0, displayCount);
  }, [filteredArtists, displayCount]);

  useEffect(() => {
    if (inView && displayedArtists.length < filteredArtists.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredArtists.length));
    }
  }, [inView, displayedArtists.length, filteredArtists.length]);

  // Filter config for mobile pills
  const mobileFilters = useMemo(() => [
    {
      id: "city",
      label: t("Ciudad"),
      value: filterCity,
      options: cities.map(c => ({ value: c, label: c })),
      onChange: setFilterCity,
    },
    {
      id: "genre",
      label: t("Género"),
      value: filterGenre,
      options: genres.map(g => ({ value: g, label: t(g) })),
      onChange: setFilterGenre,
    },
    {
      id: "month",
      label: t("Mes"),
      value: filterMonth,
      options: months.map(m => ({ value: m.value, label: m.label })),
      onChange: setFilterMonth,
    },
  ], [filterCity, filterGenre, filterMonth, cities, genres, months, t]);

  const handleClearFilters = () => {
    setFilterCity("all");
    setFilterGenre("all");
    setFilterMonth("all");
  };

  // Generate JSON-LD for artists
  const jsonLd = artists && artists.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": locale === 'en' ? "Artists with Events in Spain" : "Artistas con Eventos en España",
    "description": locale === 'en' ? "Artists and musicians with concerts and festivals in Spain" : "Artistas y músicos con conciertos y festivales en España",
    "numberOfItems": artists.length,
    "itemListElement": artists.slice(0, 20).map((artist: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicGroup",
        "name": artist.attraction_name,
        "url": `https://feelomove.com/conciertos/${artist.attraction_slug}`,
        "image": artist.sample_image_url || artist.sample_image_standard_url,
        ...(artist.genres && artist.genres[0] && { "genre": artist.genres[0] })
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title={locale === 'en' ? "Artists in Concert Spain 2025 - Tickets" : "Artistas en Concierto España 2025 - Entradas"}
        description={locale === 'en' ? "Find concerts from your favorite artists in Spain. Tickets for pop, rock, indie, electronic and more genres." : "Encuentra conciertos de tus artistas favoritos en España. Entradas para pop, rock, indie, electrónica y más géneros."}
        canonical="/artistas"
        keywords="artistas conciertos españa, músicos en directo, artistas festivales 2025"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: t("Inicio"), url: "/" },
          { name: t("Artistas") }
        ]}
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
            title={t("Artistas en Concierto")} 
            subtitle={t("Encuentra eventos de tus artistas favoritos")}
            imageUrl={heroImage} 
            priority={true}
          />
          
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-4">
            {t("Artistas destacados con conciertos y festivales en España")}
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 40px' }}>
            {locale === 'en' 
              ? `Explore our collection of ${filteredArtists?.length || 0} artists with events in Spain`
              : `Explora nuestra colección de ${filteredArtists?.length || 0} artistas con eventos en España`}
          </p>
        </div>

        {/* Mobile: Compact Title */}
        <div className="md:hidden mb-4">
          <h1 className="text-xl font-bold text-foreground">
            {t("Artistas")}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("Buscar artistas...")}
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
                <span className="truncate text-sm">{filterCity === "all" ? t("Ciudad") : filterCity}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Todas las ciudades")}</SelectItem>
                {cities.map((city: string) => (
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
                {genres.map((genre: string) => (
                  <SelectItem key={genre} value={genre}>{t(genre)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonth !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                <span className="truncate text-sm">{filterMonth === "all" ? t("Mes") : months.find(m => m.value === filterMonth)?.label}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Todos los meses")}</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterCity !== "all" || filterGenre !== "all" || filterMonth !== "all") ? (
              <button
                onClick={handleClearFilters}
                className="h-10 px-3 rounded-lg border-2 border-border bg-card text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              >
                {t("Limpiar")}
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {isLoadingArtists ? (
          <>
            {/* Mobile: List Skeletons */}
            <div className="md:hidden space-y-0">
              {[...Array(8)].map((_, i) => <ArtistListCardSkeleton key={i} />)}
            </div>
            {/* Desktop: Card Grid Skeletons */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <ArtistCardSkeleton key={i} />)}
            </div>
          </>
        ) : filteredArtists.length > 0 ? (
          <>
            {/* Mobile: Compact List View */}
            <div className="md:hidden space-y-0 -mx-4">
              {displayedArtists.map((artist: any, index: number) => (
                <ArtistListCard 
                  key={artist.attraction_id} 
                  artist={artist} 
                  priority={index < 4} 
                />
              ))}
            </div>

            {/* Desktop: Card Grid View */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedArtists.map((artist: any, index: number) => {
                const isPriority = index < 4;
                return (
                  <Link to={localePath(`/conciertos/${artist.attraction_slug}`)} key={artist.attraction_id} className="block" title={`${t("Ver conciertos de")} ${artist.attraction_name}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative">
                      <div className="relative h-64 overflow-hidden bg-muted">
                        <img
                          src={artist.sample_image_url || artist.sample_image_standard_url || "/placeholder.svg"}
                          alt={`${artist.attraction_name} - ${artist.event_count} ${t("conciertos en España")}`}
                          title={`${artist.attraction_name} - ${locale === 'en' ? 'Concerts in Spain' : 'Conciertos en España'}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading={isPriority ? "eager" : "lazy"}
                          decoding={isPriority ? "sync" : "async"}
                          {...(isPriority ? { fetchpriority: "high" } : {})}
                          width={400}
                          height={256}
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-accent text-brand-black hover:bg-accent border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                            {artist.event_count} {t("eventos")}
                          </Badge>
                        </div>
                        {artist.genres && artist.genres[0] && (
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="secondary" className="text-xs">
                              {t(artist.genres[0])}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-bold text-xl text-foreground line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                          {artist.attraction_name}
                        </h3>
                        {artist.city_count && (
                          <p className="text-sm text-muted-foreground">
                            {artist.city_count} {artist.city_count === 1 ? t("ciudad") : t("ciudades")}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full bg-accent hover:bg-accent/90 text-brand-black font-semibold py-2 rounded-lg text-sm">
                          {t("Ver Eventos")} →
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
            
            {displayedArtists.length < filteredArtists.length && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t("No se encontraron artistas")}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
    </>
  );
};

export default Artistas;
