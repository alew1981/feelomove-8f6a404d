import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const Generos = () => {
  const navigate = useNavigate();

  const { data: musicGenres, isLoading: isLoadingGenres } = useQuery({
    queryKey: ["musicGenres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_attractions")
        .select("subcategory_name, event_count")
        .gt("event_count", 0);
      
      if (error) throw error;
      
      // Group by subcategory and sum event counts
      const genreMap = new Map();
      data?.forEach(item => {
        if (item.subcategory_name) {
          const current = genreMap.get(item.subcategory_name) || { count: 0, artists: 0 };
          genreMap.set(item.subcategory_name, {
            count: current.count + (item.event_count || 0),
            artists: current.artists + 1
          });
        }
      });
      
      return Array.from(genreMap.entries())
        .map(([name, stats]) => ({
          name,
          event_count: stats.count,
          artist_count: stats.artists
        }))
        .sort((a, b) => b.event_count - a.event_count);
    },
  });


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Géneros Musicales</h1>
          <p className="text-muted-foreground text-lg">
            Explora por tipo de música y descubre tus artistas favoritos
          </p>
        </div>

        {isLoadingGenres ? (
          <div className="text-center py-12">Cargando géneros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {musicGenres?.map((genre: any) => (
              <Card
                key={genre.name}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/artistas?genre=${encodeURIComponent(genre.name)}`)}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="w-full h-full flex items-center justify-center">
                    <h3 className="text-3xl font-bold text-foreground px-4 text-center">{genre.name}</h3>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-medium">
                      {genre.artist_count} artistas
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-accent/10 text-[#121212] border-accent/20">
                      {genre.event_count} eventos próximos
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="accent" className="w-full">
                    Ver Artistas
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Generos;
