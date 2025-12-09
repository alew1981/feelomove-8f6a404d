import { useState, useMemo, useEffect } from "react";
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
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Fetch artists from mv_attractions
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["allArtists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_attractions")
        .select("*")
        .order("event_count", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Extract unique genres for filters
  const genres = useMemo(() => {
    if (!artists) return [];
    const allGenres = artists.flatMap((a: any) => a.genres || []).filter(Boolean);
    return [...new Set(allGenres)].sort() as string[];
  }, [artists]);

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    return artists.filter((artist: any) => {
      const matchesSearch = artist.attraction_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = filterGenre === "all" || artist.genres?.includes(filterGenre);
      return matchesSearch && matchesGenre;
    });
  }, [artists, searchQuery, filterGenre]);

  const displayedArtists = useMemo(() => {
    return filteredArtists.slice(0, displayCount);
  }, [filteredArtists, displayCount]);

  useEffect(() => {
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
            Explora nuestra colección de {filteredArtists?.length || 0} artistas
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
              className="pl-10 h-12 border-2 border-border focus:border-accent transition-colors"
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

            <div />

            <button
              onClick={() => {
                setSearchQuery("");
                setFilterGenre("all");
              }}
              className="h-11 px-4 border-2 border-border rounded-md hover:border-accent hover:text-accent transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {isLoadingArtists ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <ArtistCardSkeleton key={i} />)}
          </div>
        ) : filteredArtists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedArtists.map((artist: any) => (
                <Link to={`/artista/${artist.attraction_slug}`} key={artist.attraction_id} className="block">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={artist.sample_image_url || artist.sample_image_standard_url || "/placeholder.svg"}
                        alt={artist.attraction_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-accent text-brand-black hover:bg-accent border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                          {artist.event_count} eventos
                        </Badge>
                      </div>
                      {artist.genres && artist.genres[0] && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="text-xs">
                            {artist.genres[0]}
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
                          {artist.city_count} ciudades
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-brand-black font-semibold py-2 rounded-lg text-sm">
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
