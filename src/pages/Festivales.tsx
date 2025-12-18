import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Users, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";
import { FestivalCardSkeleton } from "@/components/ui/skeleton-loader";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const months = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

interface FestivalGroup {
  name: string;
  slug: string;
  image: string;
  city: string;
  venue: string;
  eventCount: number;
  artistCount: number;
  minPrice: number;
  maxPrice: number;
  firstDate: string;
  lastDate: string;
  genre: string;
}

const Festivales = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterArtist, setFilterArtist] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Fetch festivales using mv_festivals_cards
  const { data: events, isLoading } = useQuery({
    queryKey: ["festivales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Group events by festival (secondary_attraction_name OR main_attraction if secondary is null)
  const festivalGroups = useMemo(() => {
    if (!events) return [];
    
    const groups: Record<string, FestivalGroup> = {};
    
    events.forEach(event => {
      // Use secondary_attraction_name, or fallback to main_attraction, or event name
      const festivalName = event.secondary_attraction_name || event.main_attraction || event.name;
      if (!festivalName) return;
      
      // Create a unique key for grouping
      const groupKey = festivalName.toLowerCase();
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: festivalName,
          slug: encodeURIComponent(festivalName.toLowerCase().replace(/\s+/g, "-")),
          image: event.image_large_url || event.image_standard_url || "",
          city: event.venue_city || "",
          venue: event.venue_name || "",
          eventCount: 0,
          artistCount: 0,
          minPrice: Infinity,
          maxPrice: 0,
          firstDate: event.event_date || "",
          lastDate: event.event_date || "",
          genre: event.genre || "",
        };
      }
      
      const group = groups[groupKey];
      group.eventCount++;
      
      // Track unique artists
      const artistsSet = new Set<string>();
      events
        .filter(e => {
          const eName = e.secondary_attraction_name || e.main_attraction || e.name;
          return eName?.toLowerCase() === festivalName.toLowerCase();
        })
        .forEach(e => {
          e.attraction_names?.forEach((a: string) => artistsSet.add(a));
        });
      group.artistCount = artistsSet.size;
      
      // Update price range
      const eventMinPrice = Number(event.price_min_incl_fees) || 0;
      const eventMaxPrice = Number(event.price_max_incl_fees) || 0;
      if (eventMinPrice > 0 && eventMinPrice < group.minPrice) {
        group.minPrice = eventMinPrice;
      }
      if (eventMaxPrice > group.maxPrice) {
        group.maxPrice = eventMaxPrice;
      }
      
      // Update date range
      if (event.event_date && event.event_date > group.lastDate) {
        group.lastDate = event.event_date;
      }
    });
    
    // Convert to array and fix infinite minPrice
    return Object.values(groups).map(g => ({
      ...g,
      minPrice: g.minPrice === Infinity ? 0 : g.minPrice,
    }));
  }, [events]);

  // Get unique cities, genres, and artists
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(festivalGroups.map(f => f.city).filter(Boolean))];
    return uniqueCities.sort();
  }, [festivalGroups]);

  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(festivalGroups.map(f => f.genre).filter(Boolean))];
    return uniqueGenres.sort();
  }, [festivalGroups]);

  const artists = useMemo(() => {
    if (!events) return [];
    const allArtists = events.flatMap(e => e.attraction_names || []).filter(Boolean);
    return [...new Set(allArtists)].sort() as string[];
  }, [events]);

  // Filter and sort festivals
  const filteredFestivals = useMemo(() => {
    let filtered = [...festivalGroups];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(festival => 
        matchesSearch(festival.name, searchQuery) ||
        matchesSearch(festival.city, searchQuery) ||
        matchesSearch(festival.venue, searchQuery)
      );
    }
    
    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(festival => festival.city === filterCity);
    }

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(festival => festival.genre === filterGenre);
    }

    // Apply artist filter (check against original events)
    if (filterArtist !== "all") {
      const festivalNamesWithArtist = events
        ?.filter(e => e.attraction_names?.includes(filterArtist))
        .map(e => (e.secondary_attraction_name || e.main_attraction || e.name)?.toLowerCase());
      filtered = filtered.filter(festival => 
        festivalNamesWithArtist?.includes(festival.name.toLowerCase())
      );
    }

    // Apply month filter
    if (filterMonth !== "all") {
      filtered = filtered.filter(festival => {
        if (!festival.firstDate) return false;
        const eventMonth = new Date(festival.firstDate).toISOString().slice(5, 7);
        return eventMonth === filterMonth;
      });
    }
    
    // Sort by date ascending by default
    filtered.sort((a, b) => new Date(a.firstDate).getTime() - new Date(b.firstDate).getTime());
    
    return filtered;
  }, [festivalGroups, events, searchQuery, filterCity, filterGenre, filterArtist, filterMonth]);

  // Get hero image from first festival
  const heroImage = festivalGroups[0]?.image || "/placeholder.svg";

  // Generate JSON-LD for festivals list
  const jsonLd = filteredFestivals.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Festivales en España",
    "description": "Lista de festivales de música disponibles en España",
    "numberOfItems": filteredFestivals.length,
    "itemListElement": filteredFestivals.slice(0, 20).map((festival, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Festival",
        "name": festival.name,
        "startDate": festival.firstDate,
        "endDate": festival.lastDate,
        "url": `https://feelomove.com/festivales/${festival.slug}`,
        "image": festival.image,
        "location": {
          "@type": "Place",
          "name": festival.venue,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": festival.city
          }
        },
        ...(festival.minPrice > 0 && {
          "offers": {
            "@type": "Offer",
            "price": festival.minPrice,
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          }
        })
      }
    }))
  } : null;

  return (
    <>
      <SEOHead
        title="Festivales en España - Entradas y Hoteles"
        description="Descubre todos los festivales de música en España. Compra tus entradas y reserva hotel. Los mejores festivales de rock, electrónica, indie y más."
        canonical="/festivales"
        keywords="festivales españa, festivales música, festivales verano, festivales madrid"
        pageType="CollectionPage"
        jsonLd={jsonLd || undefined}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Festivales" }
        ]}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image */}
          <PageHero title="Festivales" imageUrl={heroImage} />
          
          {/* Description */}
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-muted-foreground leading-relaxed">
              Descubre todos los festivales de música en España. Desde festivales de verano hasta eventos multi-día. 
              Encuentra tu festival perfecto y reserva hotel cerca del recinto.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3 mb-8">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar festivales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-card border-2 border-border rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filters Row - ciudad, genero, artista, mes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterCity !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterCity === "all" ? "Ciudad" : filterCity}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterGenre !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterGenre === "all" ? "Género" : filterGenre}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los géneros</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterArtist} onValueChange={setFilterArtist}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterArtist !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterArtist === "all" ? "Artista" : filterArtist}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los artistas</SelectItem>
                  {artists.map(artist => (
                    <SelectItem key={artist} value={artist}>{artist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterMonth !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterMonth === "all" ? "Mes" : months.find(m => m.value === filterMonth)?.label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterCity !== "all" || filterGenre !== "all" || filterArtist !== "all" || filterMonth !== "all") && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilterCity("all");
                    setFilterGenre("all");
                    setFilterArtist("all");
                    setFilterMonth("all");
                  }}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Festival Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <FestivalCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredFestivals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron festivales</p>
              <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFestivals.map((festival, index) => (
                <Link 
                  key={festival.name} 
                  to={`/festivales/${festival.slug}`}
                  className="block"
                >
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-[#00FF8F]/50 h-full"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={festival.image || "/placeholder.svg"} 
                        alt={festival.name}
                        loading={index < 4 ? "eager" : "lazy"}
                        fetchPriority={index < 4 ? "high" : "auto"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        <Badge className="bg-[#00FF8F] text-black font-semibold">
                          {festival.eventCount} {festival.eventCount === 1 ? 'concierto' : 'conciertos'}
                        </Badge>
                      </div>
                      
                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          Desde €{festival.minPrice.toFixed(0)}
                        </Badge>
                      </div>
                      
                      {/* Festival Name */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white font-['Poppins'] line-clamp-2">
                          {festival.name}
                        </h3>
                      </div>
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      {/* Info Row */}
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {festival.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {festival.artistCount} artistas
                        </span>
                      </div>
                      
                      {/* Date Range */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-[#00FF8F]" />
                        <span className="font-medium">
                          {festival.firstDate && format(new Date(festival.firstDate), "d MMM", { locale: es })}
                          {festival.lastDate && festival.firstDate !== festival.lastDate && 
                            ` - ${format(new Date(festival.lastDate), "d MMM yyyy", { locale: es })}`
                          }
                        </span>
                      </div>
                      
                      {/* Genre Badge */}
                      {festival.genre && (
                        <Badge variant="outline" className="text-xs">
                          {festival.genre}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Festivales;