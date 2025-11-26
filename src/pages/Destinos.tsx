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
import { Calendar, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DestinationCardSkeleton } from "@/components/ui/skeleton-loader";

interface CityData {
  city_name: string;
  country: string;
  upcoming_events: number;
  city_slug: string;
  next_event_name?: string;
  next_event_date?: string;
}

const Destinos = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cities, isLoading: isLoadingCities } = useQuery<CityData[]>({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("venue_city, venue_country, event_date, name")
        .gte("event_date", new Date().toISOString())
        .not("venue_city", "is", null)
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Aggregate by city
      const cityCounts = data.reduce((acc: Record<string, CityData>, item) => {
        const city = item.venue_city!;
        if (!acc[city]) {
          acc[city] = {
            city_name: city,
            country: item.venue_country || '',
            upcoming_events: 0,
            city_slug: city.toLowerCase().replace(/\s+/g, '-'),
            next_event_name: item.name,
            next_event_date: item.event_date || undefined
          };
        }
        acc[city].upcoming_events++;
        return acc;
      }, {});
      
      return Object.values(cityCounts)
        .sort((a, b) => b.upcoming_events - a.upcoming_events);
    },
  });

  const { data: cityEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["cityEvents", selectedCity],
    queryFn: async () => {
      if (!selectedCity) return null;
      
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("id, name, venue_city, venue_name, event_date, image_standard_url, price_min_excl_fees, attraction_names")
        .eq("venue_city", selectedCity)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data?.map(e => ({
        ...e,
        event_id: e.id,
        event_name: e.name,
        min_price: e.price_min_excl_fees,
        main_attraction_name: e.attraction_names?.[0] || null
      }));
    },
    enabled: !!selectedCity,
  });

  const filteredCities = cities?.filter((city) =>
    city.city_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCityData = cities?.find((c) => c.city_name === selectedCity);

  if (selectedCity && selectedCityData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8 mt-20">
          <Breadcrumbs />
          
          <Button
            variant="ghost"
            onClick={() => setSelectedCity(null)}
            className="mb-6"
          >
            ← Volver a Destinos
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{selectedCityData.city_name}</h1>
            <p className="text-muted-foreground text-lg">
              {selectedCityData.upcoming_events} eventos próximos
            </p>
          </div>

          {isLoadingEvents ? (
            <div className="text-center py-12">Cargando eventos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cityEvents?.map((event) => {
                const eventDate = new Date(event.event_date);
                const formattedDate = eventDate.toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <Link key={event.event_id} to={`/producto/${event.event_id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 overflow-hidden">
                        <img
                          src={event.image_standard_url || "/placeholder.svg"}
                          alt={event.event_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.event_name}</h3>
                        {event.main_attraction_name && (
                          <p className="text-sm text-muted-foreground mb-2">{event.main_attraction_name}</p>
                        )}
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-accent" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-accent" />
                            <span>{event.venue_name}</span>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Destinos</h1>
          <p className="text-muted-foreground text-lg">
            Explora eventos en las mejores ciudades de España
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar destinos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoadingCities ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <DestinationCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCities?.map((city) => (
              <Card
                key={city.city_slug}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCity(city.city_name)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{city.city_name}</h3>
                      <p className="text-sm text-muted-foreground">{city.country}</p>
                    </div>
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {city.upcoming_events} eventos próximos
                    </Badge>
                  </div>
                  {city.next_event_name && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Próximo evento:</p>
                      <p className="text-sm font-medium line-clamp-1">{city.next_event_name}</p>
                      {city.next_event_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(city.next_event_date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button className="w-full bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-bold">
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

export default Destinos;
