import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArtistCardSkeleton } from "@/components/ui/skeleton-loader";

const GeneroDetalle = () => {
  const { genero } = useParams<{ genero: string }>();
  const navigate = useNavigate();
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const genreNameDecoded = genero ? decodeURIComponent(genero) : "";

  // Query for artists of this genre
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["genreArtists", genreNameDecoded],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("attraction_names, image_standard_url, categories")
        .gte("event_date", new Date().toISOString());
      
      if (error) throw error;
      
      // Filter events that match this genre and extract artists
      const artistMap = new Map();
      data?.forEach(event => {
        if (event.categories) {
          const cats = typeof event.categories === 'string' ? JSON.parse(event.categories) : event.categories;
          const subgenres = cats?.subgenres || [];
          const hasGenre = subgenres.some((sg: any) => {
            const name = sg.name || sg;
            return name === genreNameDecoded;
          });
          
          if (hasGenre && event.attraction_names && Array.isArray(event.attraction_names)) {
            event.attraction_names.forEach((artistName: string) => {
              if (!artistMap.has(artistName)) {
                artistMap.set(artistName, {
                  main_attraction_name: artistName,
                  event_count: 1,
                  attraction_image_standard_url: event.image_standard_url,
                  subcategory_name: genreNameDecoded
                });
              } else {
                const artist = artistMap.get(artistName);
                artist.event_count++;
              }
            });
          }
        }
      });
      
      return Array.from(artistMap.values()).sort((a, b) => b.event_count - a.event_count);
    },
    enabled: !!genreNameDecoded,
  });

  // Query for artist events when an artist is selected
  const { data: artistEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["artistEvents", selectedArtist],
    queryFn: async () => {
      if (!selectedArtist) return null;
      
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("id, name, venue_city, venue_name, event_date, image_standard_url, price_min_excl_fees")
        .contains("attraction_names", [selectedArtist])
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data?.map(e => ({ 
        ...e, 
        event_id: e.id,
        event_name: e.name,
        min_price: e.price_min_excl_fees
      }));
    },
    enabled: !!selectedArtist,
  });

  const filteredArtists = artists?.filter((artist: any) => 
    artist.main_attraction_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedArtistData = artists?.find((a: any) => a.main_attraction_name === selectedArtist);

  // View: Artist's Events
  if (selectedArtist && selectedArtistData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8 mt-20">
          <Breadcrumbs />
          
          <Button
            variant="ghost"
            onClick={() => setSelectedArtist(null)}
            className="mb-6"
          >
            ← Volver a Artistas de {genreNameDecoded}
          </Button>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              {(selectedArtistData as any).attraction_image_standard_url && (
                <img
                  src={(selectedArtistData as any).attraction_image_standard_url}
                  alt={(selectedArtistData as any).main_attraction_name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">{(selectedArtistData as any).main_attraction_name}</h1>
                <p className="text-muted-foreground text-lg mt-2">
                  {artistEvents?.length || 0} eventos próximos
                </p>
              </div>
            </div>
          </div>

          {isLoadingEvents ? (
            <div className="text-center py-12">Cargando eventos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {artistEvents?.map((event) => {
                const eventDate = new Date(event.event_date);
                const formattedDate = eventDate.toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <Link key={event.event_id} to={`/producto/${event.event_id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.image_standard_url || "/placeholder.svg"}
                          alt={event.event_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.event_name}</h3>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-accent" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-accent" />
                            <span>{event.venue_city}</span>
                          </div>
                        </div>
                        {event.min_price && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                              Desde €{Number(event.min_price).toFixed(2)}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  // View: All Artists in Genre
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{genreNameDecoded}</h1>
          <p className="text-muted-foreground text-lg">
            {artists?.length || 0} artistas encontrados en {genreNameDecoded}
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artistas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Artist Cards */}
        {isLoadingArtists ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredArtists && filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredArtists.map((artist: any) => (
              <Card
                key={artist.main_attraction_name}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedArtist(artist.main_attraction_name)}
              >
                <div className="relative h-64 overflow-hidden">
                  {artist.attraction_image_standard_url ? (
                    <img
                      src={artist.attraction_image_standard_url}
                      alt={artist.main_attraction_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#00FF8F] text-[#121212] font-bold border-0">
                      {artist.event_count} eventos
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-xl mb-2">{artist.main_attraction_name}</h3>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Button className="w-full bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-bold">
                    Ver Eventos
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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

export default GeneroDetalle;
