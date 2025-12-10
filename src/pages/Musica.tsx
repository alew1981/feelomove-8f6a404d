import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";
import { matchesSearch } from "@/lib/searchUtils";

const Musica = () => {
  const [searchQuery, setSearchQuery] = useState("");
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

  // Get hero image - using placeholder since genre cards don't have images
  const heroImage = "/placeholder.svg";

  const filteredGenres = useMemo(() => {
    if (!genres) return [];
    return genres.filter((genre: any) =>
      matchesSearch(genre.genre_name, searchQuery)
    );
  }, [genres, searchQuery]);

  const displayedGenres = useMemo(() => filteredGenres.slice(0, displayCount), [filteredGenres, displayCount]);

  useEffect(() => {
    if (inView && displayedGenres.length < filteredGenres.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredGenres.length));
    }
  }, [inView, displayedGenres.length, filteredGenres.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        
        {/* Hero Image */}
        <PageHero title="Géneros Musicales" imageUrl={heroImage} />
        
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs />
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground leading-relaxed mb-8">
          Explora eventos por género musical en toda España.
        </p>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar géneros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-2 border-border focus:border-accent transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i} className="overflow-hidden"><Skeleton className="h-64 w-full" /></Card>)}
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="text-center py-16"><p className="text-xl text-muted-foreground">No se encontraron géneros</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedGenres.map((genre: any) => (
                <Link key={genre.genre_id} to={`/musica/${genre.genre_slug || encodeURIComponent(genre.genre_name)}`} className="block">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative">
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={genre.sample_image_url || genre.sample_image_standard_url || "/placeholder.svg"} 
                        alt={genre.genre_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
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
                      <Button className="w-full bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-semibold py-2 rounded-lg text-sm">Ver Eventos →</Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
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
  );
};

export default Musica;
