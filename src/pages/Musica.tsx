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
import { GenreCardSkeleton } from "@/components/ui/skeleton-loader";
import { useInView } from "react-intersection-observer";
import { matchesSearch } from "@/lib/searchUtils";

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

const Musica = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  const { data: genres, isLoading } = useQuery({
    queryKey: ["musicGenres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_genres_cards")
        .select("*")
        .order("event_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sample images per genre from concerts AND festivals
  const { data: genreImages } = useQuery({
    queryKey: ["genreImages"],
    queryFn: async () => {
      // Fetch from concerts
      const { data: concertData } = await supabase
        .from("mv_concerts_cards")
        .select("genre, image_large_url, image_standard_url")
        .not("genre", "is", null)
        .not("image_large_url", "is", null);
      
      // Fetch from festivals
      const { data: festivalData } = await supabase
        .from("mv_festivals_cards")
        .select("genre, image_large_url, image_standard_url")
        .not("genre", "is", null)
        .not("image_large_url", "is", null);
      
      const images: Record<string, string> = {};
      
      // Add festival images first (so concerts can override if available)
      festivalData?.forEach((event) => {
        if (event.genre && !images[event.genre]) {
          images[event.genre] = event.image_large_url || event.image_standard_url || "";
        }
      });
      
      // Add concert images
      concertData?.forEach((concert) => {
        if (concert.genre && !images[concert.genre]) {
          images[concert.genre] = concert.image_large_url || concert.image_standard_url || "";
        }
      });
      
      return images;
    }
  });

  // Fetch events to get artists and cities for filters
  const { data: events } = useQuery({
    queryKey: ["genreFilterEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("artist_name, venue_city, event_date, genre")
        .gte("event_date", new Date().toISOString());
      if (error) throw error;
      return data || [];
    }
  });

  // Get hero image from first genre's sample image (prefer festival images for variety)
  const heroImage = useMemo(() => {
    if (genreImages && Object.keys(genreImages).length > 0) {
      return genreImages['Festival de Música'] || genreImages['Pop/Rock'] || Object.values(genreImages)[0] || "/placeholder.svg";
    }
    return "/placeholder.svg";
  }, [genreImages]);

  // Extract unique artists and cities for filters
  const artists = useMemo(() => {
    if (!events) return [];
    return [...new Set(events.map(e => e.artist_name).filter(Boolean))].sort() as string[];
  }, [events]);

  const cities = useMemo(() => {
    if (!events) return [];
    return [...new Set(events.map(e => e.venue_city).filter(Boolean))].sort() as string[];
  }, [events]);

  const filteredGenres = useMemo(() => {
    if (!genres) return [];
    return genres.filter((genre: any) => {
      const searchMatches = matchesSearch(genre.genre_name, searchQuery);

      // Artist filter - check if any event with this genre has the selected artist
      let matchesArtistFilter = filterArtist === "all";
      if (filterArtist !== "all" && events) {
        matchesArtistFilter = events.some(e => e.genre === genre.genre_name && e.artist_name === filterArtist);
      }

      // City filter
      let matchesCityFilter = filterCity === "all";
      if (filterCity !== "all" && genre.cities) {
        matchesCityFilter = genre.cities?.includes(filterCity);
      }

      // Month filter
      let matchesMonthFilter = filterMonth === "all";
      if (filterMonth !== "all" && events) {
        matchesMonthFilter = events.some(e => {
          if (e.genre !== genre.genre_name || !e.event_date) return false;
          const eventMonth = new Date(e.event_date).toISOString().slice(5, 7);
          return eventMonth === filterMonth;
        });
      }

      return searchMatches && matchesArtistFilter && matchesCityFilter && matchesMonthFilter;
    });
  }, [genres, events, searchQuery, filterArtist, filterCity, filterMonth]);

  const displayedGenres = useMemo(() => filteredGenres.slice(0, displayCount), [filteredGenres, displayCount]);

  useEffect(() => {
    if (inView && displayedGenres.length < filteredGenres.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredGenres.length));
    }
  }, [inView, displayedGenres.length, filteredGenres.length]);

  // Generate JSON-LD for genres
  const jsonLd = genres && genres.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Géneros Musicales en España",
    "description": "Eventos por género musical en España",
    "numberOfItems": genres.length,
    "itemListElement": genres.slice(0, 20).map((genre: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicGenre",
        "name": genre.genre_name,
        "url": `https://feelomove.com/generos/${genre.genre_slug || encodeURIComponent(genre.genre_name)}`
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title="Géneros Musicales - Conciertos por Estilo"
        description="Explora eventos por género: rock, pop, electrónica, jazz y más. Encuentra conciertos y festivales de tu estilo favorito."
        canonical="/generos"
        keywords="géneros musicales españa, conciertos rock, festivales electrónica, jazz en vivo"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Géneros" }
        ]}
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>
        
        {/* Hero Image - LCP optimized */}
        <PageHero 
          title="Géneros Musicales" 
          subtitle="Encuentra eventos de tu estilo favorito"
          imageUrl={heroImage} 
          priority={true}
        />
        
        {/* H2 for proper heading hierarchy */}
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-4">
          Estilos musicales destacados con eventos en España
        </h2>
        
        {/* Description */}
        <p className="text-muted-foreground leading-relaxed mb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 40px' }}>
          Explora eventos por género musical en toda España.
        </p>

        {/* Search and Filters */}
        <div className="space-y-3 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar géneros..."
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

          {/* Filters Row - genero (search), artista, ciudad, mes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                <span className="truncate text-sm">{filterCity === "all" ? "Ciudad" : filterCity}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map((city: string) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
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

            {(filterArtist !== "all" || filterCity !== "all" || filterMonth !== "all") ? (
              <button
                onClick={() => {
                  setFilterArtist("all");
                  setFilterCity("all");
                  setFilterMonth("all");
                }}
                className="h-10 px-3 rounded-lg border-2 border-border bg-card text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              >
                Limpiar
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <GenreCardSkeleton key={i} />)}
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="text-center py-16"><p className="text-xl text-muted-foreground">No se encontraron géneros</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedGenres.map((genre: any, index: number) => {
                const isPriority = index < 4; // First 4 cards get priority loading
                return (
                  <Link key={genre.genre_id} to={`/musica/${genre.genre_slug || encodeURIComponent(genre.genre_name)}`} className="block">
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative">
                      <div className="relative h-64 overflow-hidden bg-muted">
                        <img 
                          src={genreImages?.[genre.genre_name] || "/placeholder.svg"} 
                          alt={`Conciertos y festivales de ${genre.genre_name} - ${genre.event_count} eventos en España`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          loading={isPriority ? "eager" : "lazy"}
                          decoding={isPriority ? "sync" : "async"}
                          {...(isPriority ? { fetchpriority: "high" } : {})}
                          width={400}
                          height={256}
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <Badge className="bg-accent text-accent-foreground hover:bg-accent border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                            {genre.event_count} eventos
                          </Badge>
                        </div>
                        {genre.city_count > 0 && (
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="secondary" className="text-xs">
                              {genre.city_count} ciudades
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-bold text-xl text-foreground line-clamp-1">{genre.genre_name}</h3>
                        {genre.top_artists && genre.top_artists.length > 0 && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {genre.top_artists.slice(0, 3).join(", ")}
                          </p>
                        )}
                        {genre.price_from && (
                          <p className="text-sm text-accent font-semibold">
                            Desde {Number(genre.price_from).toFixed(0)}€
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
            {displayedGenres.length < filteredGenres.length && (
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

export default Musica;
