import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArtistCardSkeleton } from "@/components/ui/skeleton-loader";
import { useInView } from "react-intersection-observer";

const Artistas = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Fetch artists by aggregating from mv_events_cards
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["allArtists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_events_cards")
        .select("primary_attraction_id, primary_attraction_name, image_large_url, primary_subcategory_name, venue_city")
        .gte("event_date", new Date().toISOString())
        .not("primary_attraction_id", "is", null);
      
      if (error) throw error;
      
      // Group by artist and aggregate data
      const artistMap = new Map<string, any>();
      data?.forEach((event: any) => {
        const id = event.primary_attraction_id;
        if (!artistMap.has(id)) {
          artistMap.set(id, {
            artist_id: id,
            artist_name: event.primary_attraction_name,
            artist_slug: event.primary_attraction_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            image_url: event.image_large_url,
            genre: event.primary_subcategory_name,
            cities: new Set([event.venue_city]),
            upcoming_events_count: 1
          });
        } else {
          const artist = artistMap.get(id);
          artist.upcoming_events_count++;
          if (event.venue_city) artist.cities.add(event.venue_city);
        }
      });
      
      return Array.from(artistMap.values())
        .map(a => ({ ...a, cities: Array.from(a.cities) }))
        .sort((a, b) => b.upcoming_events_count - a.upcoming_events_count);
    },
  });

  // Extract unique cities and genres for filters
  const cities = useMemo(() => {
    if (!artists) return [];
    const allCities = artists.flatMap((a: any) => a.cities || []);
    return [...new Set(allCities)].sort();
  }, [artists]);

  const genres = useMemo(() => {
    if (!artists) return [];
    const allGenres = artists.map((a: any) => a.genre).filter(Boolean);
    return [...new Set(allGenres)].sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    return artists.filter((artist: any) => {
      const matchesSearch = artist.artist_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = filterCity === "all" || artist.cities?.includes(filterCity);
      const matchesGenre = filterGenre === "all" || artist.genre === filterGenre;
      return matchesSearch && matchesCity && matchesGenre;
    });
  }, [artists, searchQuery, filterCity, filterGenre]);

  const displayedArtists = useMemo(() => {
    return filteredArtists.slice(0, displayCount);
  }, [filteredArtists, displayCount]);

  useMemo(() => {
    if (inView && displayedArtists.length < filteredArtists.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredArtists.length));
    }
  }, [inView, displayedArtists.length, filteredArtists.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="mb-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Artistas</h1>
          <Breadcrumbs />
          <p className="text-muted-foreground text-lg mt-2">
            Explora nuestra colección de {artists?.length || 0} artistas
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artistas por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-2 border-border focus:border-[#00FF8F] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="h-11 border-2">
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                {genres.map((genre: string) => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="h-11 border-2">
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map((city: string) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => {
                setSearchQuery("");
                setFilterCity("all");
                setFilterGenre("all");
              }}
              className="h-11 px-4 border-2 border-border rounded-md hover:border-[#00FF8F] hover:text-[#00FF8F] transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {isLoadingArtists ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => <ArtistCardSkeleton key={i} />)}
          </div>
        ) : filteredArtists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedArtists.map((artist: any) => (
                <Link to={`/artista/${artist.artist_slug}`} key={artist.artist_id} className="block">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={artist.image_url || "/placeholder.svg"}
                        alt={artist.artist_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                          {artist.upcoming_events_count} eventos próximos
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-xl text-foreground line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                        {artist.artist_name}
                      </h3>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-semibold py-2 rounded-lg text-sm">
                        Ver Eventos →
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
            
            {displayedArtists.length < filteredArtists.length && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No se encontraron artistas</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Artistas;
