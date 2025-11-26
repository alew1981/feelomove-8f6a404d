import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EventCard from "./EventCard";
import { Card } from "./ui/card";

const FeaturedEvents = () => {
  // Fetch featured events using vw_events_with_hotels
  const { data: featuredEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select(`
          event_id,
          event_name,
          event_date,
          venue_city,
          image_standard_url,
          ticket_cheapest_price,
          package_price_min,
          has_hotel_offers,
          sold_out,
          seats_available,
          hotels_count,
          attraction_names
        `)
        .gte("event_date", new Date().toISOString())
        .eq("has_hotel_offers", true)
        .order("hotels_count", { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch top destinations
  const { data: destinations, isLoading: isLoadingDestinations } = useQuery({
    queryKey: ["top-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("venue_city, venue_country, event_date")
        .gte("event_date", new Date().toISOString())
        .not("venue_city", "is", null);
      
      if (error) throw error;
      
      // Aggregate by city
      const cityCounts = data.reduce((acc: any, item) => {
        const city = item.venue_city;
        if (!acc[city]) {
          acc[city] = {
            city_name: city,
            country: item.venue_country,
            upcoming_events: 0,
            city_slug: city.toLowerCase().replace(/\s+/g, '-')
          };
        }
        acc[city].upcoming_events++;
        return acc;
      }, {});
      
      return Object.values(cityCounts)
        .sort((a: any, b: any) => b.upcoming_events - a.upcoming_events)
        .slice(0, 4);
    },
  });

  return (
    <div className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 space-y-16">
        {/* Featured Events with Packages */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Paquetes Destacados</h2>
            <p className="text-muted-foreground">Eventos con entrada + hotel incluido</p>
          </div>
          
          {isLoadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents?.slice(0, 4).map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Destinations */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Destinos Populares</h2>
            <p className="text-muted-foreground">Las mejores ciudades para eventos</p>
          </div>
          
          {isLoadingDestinations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations?.map((city: any) => (
                <Link key={city.city_slug} to={`/destinos`} className="group">
                  <Card className="p-8 text-center transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-card-hover border-border">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#00FF8F]/10 flex items-center justify-center group-hover:bg-[#00FF8F]/20 transition-colors">
                        <Globe className="h-8 w-8 text-[#00FF8F]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#121212] dark:text-white">{city.city_name}</h3>
                      <p className="text-sm font-bold text-[#00FF8F] uppercase tracking-wide">
                        {city.upcoming_events} eventos
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* More Events Grid */}
        {featuredEvents && featuredEvents.length > 4 && (
          <section>
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Más Eventos</h2>
              <p className="text-muted-foreground">Descubre más opciones increíbles</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.slice(4, 8).map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center py-12 border-t border-border">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para tu próxima aventura?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explora todos nuestros eventos y encuentra el plan perfecto para ti
          </p>
          <Link to="/eventos">
            <Button size="lg" variant="primary">
              Ver Todos los Eventos
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FeaturedEvents;
