import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Search } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  const artistFromUrl = searchParams.get("artist");
  const genreFromUrl = searchParams.get("genre");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(artistFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState(genreFromUrl || "all");
  const artistsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (artistFromUrl) {
      setSelectedArtist(artistFromUrl);
    }
  }, [artistFromUrl]);

  useEffect(() => {
    if (genreFromUrl) {
      setFilterGenre(genreFromUrl);
      // Scroll to artists section when genre is set from URL
      setTimeout(() => {
        artistsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [genreFromUrl]);

  const handleGenreClick = (genreName: string) => {
    setFilterGenre(genreName);
    // Scroll to artists section
    setTimeout(() => {
      artistsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

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

  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_attractions")
        .select("attraction_id, name, image_standard_url, event_count, subcategory_name")
        .gt("event_count", 0)
        .order("event_count", { ascending: false });
      
      if (error) throw error;
      return data?.map(a => ({
        main_attraction_id: a.attraction_id,
        main_attraction_name: a.name,
        attraction_image_standard_url: a.image_standard_url,
        event_count: a.event_count,
        subcategory_name: a.subcategory_name
      }));
    },
  });

  // Get unique subcategories for filter
  const subcategories = Array.from(new Set(artists?.map((a: any) => a.subcategory_name).filter(Boolean)));

  const { data: artistEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["artistEvents", selectedArtist],
    queryFn: async () => {
      if (!selectedArtist) return null;
      
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("event_id, name, venue_city, venue_name, event_date, image_standard_url, min_price, domain_id")
        .eq("main_attraction_id", selectedArtist)
        .gt("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data?.map(e => ({ ...e, event_name: e.name }));
    },
    enabled: !!selectedArtist,
  });

  const filteredArtists = artists?.filter((artist: any) => {
    const matchesSearch = artist.main_attraction_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = filterGenre === "all" || artist.subcategory_name === filterGenre;
    return matchesSearch && matchesGenre;
  });

  const selectedArtistData = artists?.find((a: any) => a.main_attraction_id === selectedArtist);

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
            ← Volver a Música
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
                  <Card key={event.event_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 overflow-hidden">
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
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-secondary" />
                          <span>{event.venue_city}</span>
                        </div>
                      </div>
                      {event.min_price && (
                        <div className="mt-3">
                          <Badge variant="secondary">Desde €{Number(event.min_price).toFixed(2)}</Badge>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                    <Button asChild className="w-full">
                      <Link to={`/producto/${event.event_id}?domain=${event.domain_id}`}>Ver Detalles</Link>
                    </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }

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
                <Card
                  key={genre.name}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleGenreClick(genre.name)}
                >
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
              ))}
            </div>
          )}
        </div>

        {/* Artists Section */}
        <div ref={artistsSectionRef} className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-bold mb-4">
            {filterGenre !== "all" ? `Artistas de ${filterGenre}` : "Artistas"}
          </h2>
          <p className="text-muted-foreground">
            {filterGenre !== "all" 
              ? `${filteredArtists?.length || 0} artistas encontrados` 
              : "Descubre tus artistas favoritos y sus próximos eventos"}
          </p>
          {filterGenre !== "all" && (
            <Button
              variant="ghost"
              onClick={() => setFilterGenre("all")}
              className="mt-2"
            >
              ← Ver todos los géneros
            </Button>
          )}
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artistas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por tipo de música" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {subcategories?.map(subcategory => (
                <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingArtists ? (
          <div className="text-center py-12">Cargando artistas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredArtists?.map((artist: any) => (
              <Card
                key={artist.main_attraction_id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedArtist(artist.main_attraction_id)}
              >
                <div className="relative h-48 overflow-hidden">
                  {artist.attraction_image_standard_url ? (
                    <img
                      src={artist.attraction_image_standard_url}
                      alt={artist.main_attraction_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {artist.subcategory_name && (
                      <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-medium">
                        {artist.subcategory_name}
                      </Badge>
                    )}
                    {artist.event_count > 0 && (
                      <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-medium">
                        Entradas disponibles
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-3">{artist.main_attraction_name}</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-accent/10 text-[#121212] border-accent/20">
                      {artist.event_count} eventos próximos
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="accent" className="w-full">
                    Ver Eventos
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

export default Musica;
