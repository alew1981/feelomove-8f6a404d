import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, MapPin, Music, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FeaturedEvents = () => {
  // Fetch closest upcoming events
  const { data: closestEvents } = useQuery({
    queryKey: ["closest-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("id, name, venue_city, event_date, image_standard_url, price_min_excl_fees")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  // Artists and subgenres temporarily disabled (tables don't exist)
  const artists = [];
  const subgenres = [];

  // Fetch top destinations (cities)
  const { data: destinations } = useQuery({
    queryKey: ["top-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("venue_city, venue_country, event_date, name")
        .gte("event_date", new Date().toISOString())
        .not("venue_city", "is", null)
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Aggregate by city
      const cityCounts = data.reduce((acc: any, item) => {
        const city = item.venue_city;
        if (!acc[city]) {
          acc[city] = {
            city_name: city,
            country: item.venue_country,
            upcoming_events: 0,
            city_slug: city.toLowerCase().replace(/\s+/g, '-'),
            next_event_name: item.name,
            next_event_date: item.event_date
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
        {/* Closest Events */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Próximos Eventos</h2>
            <p className="text-muted-foreground">Los eventos más cercanos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {closestEvents?.map((event) => (
              <Link key={event.id} to={`/producto/${event.id}`} className="group">
                <Card className="overflow-hidden h-full group-hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image_standard_url || "/placeholder.svg"}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-foreground line-clamp-2">
                      {event.name}
                    </h3>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="truncate">{event.venue_city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span>{new Date(event.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    </div>
                    {event.price_min_excl_fees && (
                      <div className="text-lg font-bold text-accent">
                        Desde {Number(event.price_min_excl_fees).toFixed(2)}€
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>


        {/* Destinations */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Destinos Populares</h2>
            <p className="text-muted-foreground">Las mejores ciudades</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations?.map((city: any) => (
              <Link key={city.city_slug} to={`/destinos`} className="group">
                <Card className="p-8 text-center group-hover:-translate-y-1">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Globe className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold">{city.city_name}</h3>
                    <p className="text-sm text-accent">{city.upcoming_events} eventos</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12 border-t border-border">
          <h2 className="text-3xl font-bold mb-4">¿Listo para tu próxima aventura?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explora todos nuestros eventos y encuentra el plan perfecto para ti
          </p>
          <Link to="/eventos">
            <Button size="lg" variant="accent">
              Ver Todos los Eventos
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FeaturedEvents;
