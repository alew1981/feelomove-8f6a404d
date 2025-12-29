import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { matchesSearch } from "@/lib/searchUtils";
import { FestivalCardSkeleton } from "@/components/ui/skeleton-loader";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FestivalCard from "@/components/FestivalCard";
import { FestivalProductPage } from "@/types/events.types";

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

const Festivales = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterHeadliner, setFilterHeadliner] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterSort, setFilterSort] = useState<string>("proximos");

  // Fetch festivals using the new dedicated festivals view
  const { data: festivals, isLoading } = useQuery({
    queryKey: ["festivales-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page_festivales")
        .select("*")
        .gte("festival_start_date", new Date().toISOString().split('T')[0])
        .order("festival_start_date", { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as FestivalProductPage[];
    }
  });

  // Get unique cities, genres, and headliners for filters
  const cities = useMemo(() => {
    if (!festivals) return [];
    const uniqueCities = [...new Set(festivals.map(f => f.venue_city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  }, [festivals]);

  const genres = useMemo(() => {
    if (!festivals) return [];
    const uniqueGenres = [...new Set(festivals.map(f => f.primary_subcategory_name).filter(Boolean))];
    return uniqueGenres.sort() as string[];
  }, [festivals]);

  const headliners = useMemo(() => {
    if (!festivals) return [];
    const allHeadliners = festivals.flatMap(f => f.festival_headliners || []).filter(Boolean);
    return [...new Set(allHeadliners)].sort() as string[];
  }, [festivals]);

  // Filter and sort festivals
  const filteredFestivals = useMemo(() => {
    if (!festivals) return [];
    
    let filtered = [...festivals];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(festival => 
        matchesSearch(festival.event_name, searchQuery) ||
        matchesSearch(festival.venue_city, searchQuery) ||
        matchesSearch(festival.venue_name, searchQuery) ||
        (festival.festival_headliners || []).some(h => matchesSearch(h, searchQuery))
      );
    }
    
    // Apply city filter
    if (filterCity !== "all") {
      filtered = filtered.filter(festival => festival.venue_city === filterCity);
    }

    // Apply genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(festival => festival.primary_subcategory_name === filterGenre);
    }

    // Apply headliner filter
    if (filterHeadliner !== "all") {
      filtered = filtered.filter(festival => 
        festival.festival_headliners?.includes(filterHeadliner)
      );
    }

    // Apply month filter
    if (filterMonth !== "all") {
      filtered = filtered.filter(festival => {
        if (!festival.festival_start_date) return false;
        const eventMonth = new Date(festival.festival_start_date).toISOString().slice(5, 7);
        return eventMonth === filterMonth;
      });
    }
    
    // Sort based on filter selection
    if (filterSort === "recientes") {
      // Sort by created_at descending for recently added
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Sort by festival start date ascending by default
      filtered.sort((a, b) => 
        new Date(a.festival_start_date).getTime() - new Date(b.festival_start_date).getTime()
      );
    }
    
    return filtered;
  }, [festivals, searchQuery, filterCity, filterGenre, filterHeadliner, filterMonth, filterSort]);

  // Get hero image from first festival
  const heroImage = festivals?.[0]?.image_large_url || "/placeholder.svg";

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
        "name": festival.event_name,
        "startDate": festival.festival_start_date,
        "endDate": festival.festival_end_date,
        "url": `https://feelomove.com/festival/${festival.event_slug}`,
        "image": festival.image_large_url,
        "location": {
          "@type": "Place",
          "name": festival.venue_name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": festival.venue_city
          }
        },
        ...(festival.price_min_incl_fees && festival.price_min_incl_fees > 0 && {
          "offers": {
            "@type": "Offer",
            "price": festival.price_min_incl_fees,
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

            {/* Filters Row - orden, ciudad, genero, headliner, mes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Select value={filterSort} onValueChange={setFilterSort}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterSort !== "proximos" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterSort === "proximos" ? "Próximos" : "Recientes"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proximos">Próximos</SelectItem>
                  <SelectItem value="recientes">Añadidos recientemente</SelectItem>
                </SelectContent>
              </Select>

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

              <Select value={filterHeadliner} onValueChange={setFilterHeadliner}>
                <SelectTrigger className={`h-10 px-3 rounded-lg border-2 transition-all ${filterHeadliner !== "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:border-muted-foreground/50"}`}>
                  <span className="truncate text-sm">{filterHeadliner === "all" ? "Headliner" : filterHeadliner}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los headliners</SelectItem>
                  {headliners.map(headliner => (
                    <SelectItem key={headliner} value={headliner}>{headliner}</SelectItem>
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

            {(filterCity !== "all" || filterGenre !== "all" || filterHeadliner !== "all" || filterMonth !== "all" || filterSort !== "proximos") && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilterCity("all");
                    setFilterGenre("all");
                    setFilterHeadliner("all");
                    setFilterMonth("all");
                    setFilterSort("proximos");
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
                <FestivalCard 
                  key={festival.event_id} 
                  festival={festival}
                  priority={index < 4}
                />
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
