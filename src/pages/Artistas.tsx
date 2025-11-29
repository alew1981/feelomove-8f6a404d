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
import { Search, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArtistCardSkeleton } from "@/components/ui/skeleton-loader";
import { useInView } from "react-intersection-observer";

const Artistas = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  // Query for unique artists extracted from events with more details
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["allArtists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("attraction_names, attraction_slug, image_standard_url, venue_city, event_date, categories")
        .gte("event_date", new Date().toISOString())
        .not("attraction_names", "is", null);
      
      if (error) throw error;
      
      // Extract unique artists with aggregated data
      const artistMap = new Map();
      data?.forEach(event => {
        if (event.attraction_names && Array.isArray(event.attraction_names)) {
          event.attraction_names.forEach((name: string) => {
            if (!artistMap.has(name)) {
              const categories = Array.isArray(event.categories) ? event.categories : [];
              const genres = categories.flatMap((cat: any) => 
                Array.isArray(cat.subcategories) 
                  ? cat.subcategories.map((sub: any) => sub.name) 
                  : []
              ).filter(Boolean);
              artistMap.set(name, {
                main_attraction_name: name,
                attraction_slug: event.attraction_slug,
                event_count: 1,
                attraction_image_standard_url: event.image_standard_url,
                cities: new Set([event.venue_city]),
                genres: new Set(genres),
                dates: [event.event_date]
              });
            } else {
              const artist = artistMap.get(name);
              artist.event_count++;
              if (event.venue_city) artist.cities.add(event.venue_city);
              const categories = Array.isArray(event.categories) ? event.categories : [];
              const genres = categories.flatMap((cat: any) => 
                Array.isArray(cat.subcategories) 
                  ? cat.subcategories.map((sub: any) => sub.name) 
                  : []
              ).filter(Boolean);
              genres.forEach((g: string) => artist.genres.add(g));
              artist.dates.push(event.event_date);
            }
          });
        }
      });
      
      return Array.from(artistMap.values()).map(artist => ({
        ...artist,
        cities: Array.from(artist.cities),
        genres: Array.from(artist.genres),
      })).sort((a, b) => b.event_count - a.event_count);
    },
  });

  // Query for artist events when selected
  const { data: artistEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["artistEvents", selectedArtist],
    queryFn: async () => {
      if (!selectedArtist) return null;
      
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("event_id, event_name, event_slug, venue_city, venue_name, event_date, image_standard_url, ticket_price_min_no_fees")
        .contains("attraction_names", [selectedArtist])
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data?.map(e => ({ 
        ...e, 
        id: e.event_id,
        name: e.event_name,
        min_price: e.ticket_price_min_no_fees,
        price_min_excl_fees: e.ticket_price_min_no_fees
      }));
    },
    enabled: !!selectedArtist,
  });

  // Extract unique cities and genres for filters
  const cities = useMemo(() => {
    if (!artists) return [];
    const uniqueCities = [...new Set(artists.flatMap((a: any) => a.cities))];
    return uniqueCities.sort();
  }, [artists]);

  const genres = useMemo(() => {
    if (!artists) return [];
    const uniqueGenres = [...new Set(artists.flatMap((a: any) => a.genres))];
    return uniqueGenres.sort();
  }, [artists]);

  // Extract unique months from event dates
  const availableMonths = useMemo(() => {
    if (!artists) return [];
    const monthsSet = new Set<string>();
    
    artists.forEach((artist: any) => {
      artist.dates?.forEach((date: string) => {
        const eventDate = new Date(date);
        const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(monthKey);
      });
    });
    
    const months = Array.from(monthsSet).sort();
    return months.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
      return {
        key: monthKey,
        label: `${monthName} ${year}`
      };
    });
  }, [artists]);

  const filteredArtists = artists?.filter((artist: any) => {
    const matchesSearch = artist.main_attraction_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply city filter
    const matchesCity = filterCity === "all" || artist.cities.includes(filterCity);
    
    // Apply genre filter
    const matchesGenre = filterGenre === "all" || artist.genres.includes(filterGenre);
    
    // Apply date filter
    let matchesDate = true;
    if (filterDate !== "all") {
      const dates = artist.dates || [];
      matchesDate = dates.some((d: string) => {
        const eventDate = new Date(d);
        const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === filterDate;
      });
    }
    
    return matchesSearch && matchesCity && matchesGenre && matchesDate;
  });

  // Display only the first displayCount artists
  const displayedArtists = useMemo(() => {
    return filteredArtists?.slice(0, displayCount) || [];
  }, [filteredArtists, displayCount]);

  // Load more when scrolling to bottom
  useMemo(() => {
    if (inView && filteredArtists && displayedArtists.length < filteredArtists.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredArtists.length));
    }
  }, [inView, displayedArtists.length, filteredArtists]);

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
                  <Link key={event.event_id} to={`/producto/${event.event_slug}`}>
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
        
        <div className="mb-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Artistas</h1>
          <Breadcrumbs />
          <p className="text-muted-foreground text-lg mt-2">
            Explora nuestra colección completa de {artists?.length || 0} artistas
          </p>
        </div>

        {/* Search */}
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

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="h-11 border-2">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month.key} value={month.key}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="h-11 border-2">
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                {genres.map(genre => (
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
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => {
                setSearchQuery("");
                setFilterCity("all");
                setFilterGenre("all");
                setFilterDate("all");
              }}
              className="h-11 px-4 border-2 border-border rounded-md hover:border-[#00FF8F] hover:text-[#00FF8F] transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Artist Cards */}
        {isLoadingArtists ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredArtists && filteredArtists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedArtists.map((artist: any, index) => (
              <Link
                to={`/artista/${artist.attraction_slug}`}
                key={artist.main_attraction_name}
                className="block"
              >
                <Card
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative"
                >
                  <div className="relative h-64 overflow-hidden">
                    {artist.attraction_image_standard_url ? (
                      <img
                        src={artist.attraction_image_standard_url}
                        alt={artist.main_attraction_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                        {artist.event_count} eventos próximos
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-xl text-foreground line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                      {artist.main_attraction_name}
                    </h3>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-semibold py-2 rounded-lg text-sm"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Ver Eventos →
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Infinite Scroll Loader */}
          {displayedArtists.length < filteredArtists.length && (
            <div ref={loadMoreRef} className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-['Poppins']">Cargando más artistas...</p>
              </div>
            </div>
          )}
        </>
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
