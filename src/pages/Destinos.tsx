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

// Helper function to get a representative image for each city
const getCityImage = (cityName: string): string => {
  const cityImages: Record<string, string> = {
    "Madrid": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
    "Barcelona": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
    "Valencia": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    "Sevilla": "https://images.unsplash.com/photo-1585849834908-3481231155e8?w=800&q=80",
    "Bilbao": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80",
    "Málaga": "https://images.unsplash.com/photo-1562882238-c3387de91d45?w=800&q=80",
    "Zaragoza": "https://images.unsplash.com/photo-1555881986-6e03f4f44fc5?w=800&q=80",
    "Murcia": "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&q=80",
  };
  
  return cityImages[cityName] || "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80";
};

const Destinos = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(30);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0
  });

  const { data: cities, isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("venue_city, venue_country, event_date, image_standard_url, categories")
        .gte("event_date", new Date().toISOString())
        .not("venue_city", "is", null);
      
      if (error) throw error;
      
      // Aggregate by city
      const cityMap = new Map();
      data?.forEach(event => {
        const cityName = event.venue_city;
        
        if (cityName) {
          if (!cityMap.has(cityName)) {
            cityMap.set(cityName, {
              city_name: cityName,
              country: event.venue_country,
              event_count: 1,
              genres: new Set(),
              dates: [],
              image_url: event.image_standard_url || getCityImage(cityName)
            });
          } else {
            const city = cityMap.get(cityName);
            city.event_count++;
          }
          
          const city = cityMap.get(cityName);
          if (event.event_date) city.dates.push(event.event_date);
          
          const categories = Array.isArray(event.categories) ? event.categories : [];
          categories.forEach((cat: any) => {
            if (cat.subcategories && Array.isArray(cat.subcategories)) {
              cat.subcategories.forEach((subcat: any) => {
                if (subcat.name) city.genres.add(subcat.name);
              });
            }
          });
        }
      });
      
      return Array.from(cityMap.values())
        .map(city => ({
          ...city,
          genres: Array.from(city.genres),
        }))
        .sort((a, b) => b.event_count - a.event_count);
    },
  });

  // Extract unique genres for filters
  const genres = useMemo(() => {
    if (!cities) return [];
    const uniqueGenres = [...new Set(cities.flatMap((c: any) => c.genres))];
    return uniqueGenres.sort();
  }, [cities]);

  // Extract unique months from event dates
  const availableMonths = useMemo(() => {
    if (!cities) return [];
    const monthsSet = new Set<string>();
    
    cities.forEach((city: any) => {
      city.dates?.forEach((date: string) => {
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
  }, [cities]);

  const filteredCities = useMemo(() => {
    if (!cities) return [];
    
    return cities.filter((city: any) => {
      const matchesSearch = city.city_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply genre filter
      const matchesGenre = filterGenre === "all" || city.genres.includes(filterGenre);
      
      // Apply date filter
      let matchesDate = true;
      if (filterDate !== "all") {
        const dates = city.dates || [];
        matchesDate = dates.some((d: string) => {
          const eventDate = new Date(d);
          const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === filterDate;
        });
      }
      
      return matchesSearch && matchesGenre && matchesDate;
    });
  }, [cities, searchQuery, filterGenre, filterDate]);

  // Display only the first displayCount cities
  const displayedCities = useMemo(() => {
    return filteredCities.slice(0, displayCount);
  }, [filteredCities, displayCount]);

  // Load more when scrolling to bottom
  useMemo(() => {
    if (inView && displayedCities.length < filteredCities.length) {
      setDisplayCount(prev => Math.min(prev + 30, filteredCities.length));
    }
  }, [inView, displayedCities.length, filteredCities.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Destinos</h1>
          <p className="text-muted-foreground text-lg">
            Explora eventos en las mejores ciudades
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar destinos..."
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

            <button
              onClick={() => {
                setSearchQuery("");
                setFilterGenre("all");
                setFilterDate("all");
              }}
              className="h-11 px-4 border-2 border-border rounded-md hover:border-[#00FF8F] hover:text-[#00FF8F] transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* City Cards */}
        {isLoadingCities ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">No se encontraron destinos</p>
            <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCities.map((city: any, index) => (
                <Link
                  key={city.city_name}
                  to={`/destinos/${encodeURIComponent(city.city_name)}`}
                  className="block"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 relative animate-fade-in">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={city.image_url}
                        alt={city.city_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F] border-0 font-semibold px-3 py-1 text-xs rounded-md uppercase">
                          {city.event_count} eventos
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-xl text-foreground line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                        {city.city_name}
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
            {displayedCities.length < filteredCities.length && (
              <div ref={loadMoreRef} className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground font-['Poppins']">Cargando más destinos...</p>
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

export default Destinos;
