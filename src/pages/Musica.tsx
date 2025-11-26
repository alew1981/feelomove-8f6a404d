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
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";

// Helper function to get a representative image for each genre
const getGenreImage = (genreName: string): string => {
  const genreImages: Record<string, string> = {
    "Rock": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80",
    "Pop": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    "Electronic": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80",
    "Hip-Hop": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    "Jazz": "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
    "Classical": "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80",
    "Country": "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&q=80",
    "R&B": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    "Metal": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
    "Indie": "https://images.unsplash.com/photo-1524650359799-842906ca1c06?w=800&q=80",
    "Dance": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80",
    "Reggaeton": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    "Flamenco": "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=800&q=80",
    "Soul": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  };
  
  const matchingKey = Object.keys(genreImages).find(key => 
    genreName.toLowerCase().includes(key.toLowerCase())
  );
  
  return matchingKey ? genreImages[matchingKey] : "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80";
};

const Musica = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  const { data: musicGenres, isLoading: isLoadingGenres } = useQuery({
    queryKey: ["musicGenres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("categories, attraction_names, venue_city, event_date, image_standard_url")
        .gte("event_date", new Date().toISOString())
        .not("categories", "is", null);
      
      if (error) throw error;
      
      // Extract unique genres from subcategories
      const genreMap = new Map();
      data?.forEach(event => {
        const categories = Array.isArray(event.categories) ? event.categories : [];
        
        categories.forEach((cat: any) => {
          if (cat.subcategories && Array.isArray(cat.subcategories)) {
            cat.subcategories.forEach((subcat: any) => {
              const genreName = subcat.name;
              const genreId = subcat.id;
              
              if (genreName) {
                if (!genreMap.has(genreName)) {
                  genreMap.set(genreName, {
                    id: genreId,
                    name: genreName,
                    event_count: 1,
                    artists: new Set(),
                    cities: new Set(),
                    dates: [],
                    image_url: event.image_standard_url || getGenreImage(genreName)
                  });
                } else {
                  const genre = genreMap.get(genreName);
                  genre.event_count++;
                }
                
                const genre = genreMap.get(genreName);
                if (event.attraction_names && Array.isArray(event.attraction_names)) {
                  event.attraction_names.forEach((artist: string) => genre.artists.add(artist));
                }
                if (event.venue_city) genre.cities.add(event.venue_city);
                if (event.event_date) genre.dates.push(event.event_date);
              }
            });
          }
        });
      });
      
      return Array.from(genreMap.values())
        .map(genre => ({
          ...genre,
          artist_count: genre.artists.size,
          cities: Array.from(genre.cities),
          artists: Array.from(genre.artists),
        }))
        .sort((a, b) => b.event_count - a.event_count);
    },
  });

  // Extract unique cities for filters
  const cities = useMemo(() => {
    if (!musicGenres) return [];
    const uniqueCities = [...new Set(musicGenres.flatMap((g: any) => g.cities))];
    return uniqueCities.sort();
  }, [musicGenres]);

  // Extract unique months from event dates
  const availableMonths = useMemo(() => {
    if (!musicGenres) return [];
    const monthsSet = new Set<string>();
    
    musicGenres.forEach((genre: any) => {
      genre.dates?.forEach((date: string) => {
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
  }, [musicGenres]);

  const filteredGenres = useMemo(() => {
    if (!musicGenres) return [];
    
    return musicGenres.filter((genre: any) => {
      const matchesSearch = genre.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply city filter
      const matchesCity = filterCity === "all" || genre.cities.includes(filterCity);
      
      // Apply date filter
      let matchesDate = true;
      if (filterDate !== "all") {
        const dates = genre.dates || [];
        matchesDate = dates.some((d: string) => {
          const eventDate = new Date(d);
          const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === filterDate;
        });
      }
      
      return matchesSearch && matchesCity && matchesDate;
    });
  }, [musicGenres, searchQuery, filterCity, filterDate]);

  // Display only the first displayCount genres
  const displayedGenres = useMemo(() => {
    return filteredGenres.slice(0, displayCount);
  }, [filteredGenres, displayCount]);

  // Load more when scrolling to bottom
  useMemo(() => {
    if (inView && displayedGenres.length < filteredGenres.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredGenres.length));
    }
  }, [inView, displayedGenres.length, filteredGenres.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Géneros Musicales</h1>
          <p className="text-muted-foreground text-lg">
            Explora por género musical y descubre eventos increíbles
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar géneros musicales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 border-2 border-border focus:border-[#00FF8F] transition-colors"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                setFilterDate("all");
              }}
              className="h-11 px-4 border-2 border-border rounded-md hover:border-[#00FF8F] hover:text-[#00FF8F] transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Genre Cards */}
        {isLoadingGenres ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">No se encontraron géneros</p>
            <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedGenres.map((genre: any, index) => (
                <Link
                  key={genre.name}
                  to={`/musica/${encodeURIComponent(genre.name)}`}
                  className="block"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative animate-fade-in">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={genre.image_url}
                        alt={genre.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                          {genre.event_count} eventos
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-xl text-foreground line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                        {genre.name}
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
            {displayedGenres.length < filteredGenres.length && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground font-['Poppins']">Cargando más géneros...</p>
                </div>
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
