import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Helper function to get a representative image for each genre
const getGenreImage = (genreName: string): string => {
  const genreImages: Record<string, string> = {
    "Rock": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80",
    "Pop": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    "Electronic": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80",
    "Hip-Hop/Rap": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    "Jazz": "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
    "Classical": "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80",
    "Country": "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&q=80",
    "R&B": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    "Metal": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
    "Indie": "https://images.unsplash.com/photo-1524650359799-842906ca1c06?w=800&q=80",
    "Reggae": "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=800&q=80",
    "Blues": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
    "Folk": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
    "Latino": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    "Alternative": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  };
  
  // Find a matching genre or return a default image
  const matchingKey = Object.keys(genreImages).find(key => 
    genreName.toLowerCase().includes(key.toLowerCase())
  );
  
  return matchingKey ? genreImages[matchingKey] : "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80";
};

const Musica = () => {
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
          artist_count: stats.artists,
          image_url: getGenreImage(name)
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Música</h1>
          <p className="text-muted-foreground text-lg">
            Explora por género musical y descubre tus artistas favoritos
          </p>
        </div>

        {/* Music Genre Cards Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Géneros Musicales</h2>
          {isLoadingGenres ? (
            <div className="text-center py-12">Cargando géneros...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {musicGenres?.map((genre: any) => (
                <Link
                  key={genre.name}
                  to={`/musica/${encodeURIComponent(genre.name)}`}
                  className="block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={genre.image_url}
                        alt={genre.name}
                        className="w-full h-full object-cover brightness-50 group-hover:brightness-75 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-3xl font-bold text-white px-4 text-center drop-shadow-lg">{genre.name}</h3>
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Musica;
