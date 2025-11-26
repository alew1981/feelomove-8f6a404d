import { useState } from "react";
import { Link } from "react-router-dom";
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

const Artistas = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Query for unique artists extracted from events
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["allArtists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("attraction_names, image_standard_url")
        .gte("event_date", new Date().toISOString())
        .not("attraction_names", "is", null);
      
      if (error) throw error;
      
      // Extract unique artists
      const artistMap = new Map();
      data?.forEach(event => {
        if (event.attraction_names && Array.isArray(event.attraction_names)) {
          event.attraction_names.forEach((name: string) => {
            if (!artistMap.has(name)) {
              artistMap.set(name, {
                main_attraction_name: name,
                event_count: 1,
                attraction_image_standard_url: event.image_standard_url
              });
            } else {
              const artist = artistMap.get(name);
              artist.event_count++;
            }
          });
        }
      });
      
      return Array.from(artistMap.values()).sort((a, b) => b.event_count - a.event_count);
    },
  });

  // Query for artist events when selected
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

  const filteredArtists = artists?.filter((artist: any) => {
    const matchesSearch = artist.main_attraction_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            ← Volver a Artistas
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

  // View: All Artists with Search
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Artistas</h1>
          <p className="text-muted-foreground text-lg">
            Explora nuestra colección completa de {artists?.length || 0} artistas
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artistas por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredArtists?.length || 0} artistas encontrados
            {searchQuery && ` con "${searchQuery}"`}
          </p>
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Limpiar búsqueda
            </Button>
          )}
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
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2"
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
                  {artist.event_count > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-semibold px-4 py-1 text-sm rounded-full uppercase">
                        Disponible
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-xl mb-3 text-foreground">{artist.main_attraction_name}</h3>
                  <div className="inline-block bg-[#00FF8F]/20 text-[#121212] px-4 py-2 rounded-lg font-medium text-sm">
                    {artist.event_count} eventos próximos
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Button 
                    className="w-full bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-bold py-6 text-base rounded-xl"
                  >
                    Ver Eventos
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No se encontraron artistas con esos criterios</p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Limpiar búsqueda
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Artistas;
