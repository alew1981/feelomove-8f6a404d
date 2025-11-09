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
        .from("event_list_page_view")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch top artists (by event count)
  const { data: artists } = useQuery({
    queryKey: ["top-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_list_page_view")
        .select("main_attraction_id, main_attraction_name, attraction_image_standard_url")
        .gte("event_date", new Date().toISOString())
        .not("main_attraction_name", "is", null)
        .limit(100);
      if (error) throw error;
      
      // Group by artist and count events
      const artistMap = new Map();
      data?.forEach(event => {
        const key = event.main_attraction_id;
        if (artistMap.has(key)) {
          artistMap.get(key).count++;
        } else {
          artistMap.set(key, {
            id: event.main_attraction_id,
            name: event.main_attraction_name,
            image: event.attraction_image_standard_url,
            count: 1
          });
        }
      });
      
      return Array.from(artistMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
    },
  });

  // Fetch top genres (categories)
  const { data: genres } = useQuery({
    queryKey: ["top-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_list_page_view")
        .select("category_id, category_name")
        .gte("event_date", new Date().toISOString())
        .not("category_name", "is", null)
        .limit(100);
      if (error) throw error;
      
      // Group by genre and count
      const genreMap = new Map();
      data?.forEach(event => {
        const key = event.category_id;
        if (genreMap.has(key)) {
          genreMap.get(key).count++;
        } else {
          genreMap.set(key, {
            id: event.category_id,
            name: event.category_name,
            count: 1
          });
        }
      });
      
      return Array.from(genreMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
    },
  });

  // Fetch top destinations (cities)
  const { data: destinations } = useQuery({
    queryKey: ["top-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("city_summary")
        .select("*")
        .order("upcoming_events", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
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
              <Link key={event.event_id} to={`/producto/${event.event_id}`}>
                <Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image_standard_url || "/placeholder.svg"}
                      alt={event.event_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-foreground line-clamp-2">
                      {event.event_name}
                    </h3>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.venue_city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.event_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    </div>
                    {event.display_price && (
                      <div className="text-lg font-bold text-foreground">
                        Desde {event.display_price}€
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Artists */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Artistas Destacados</h2>
            <p className="text-muted-foreground">Los más populares</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists?.map((artist) => (
              <Link key={artist.id} to={`/generos?artist=${artist.id}`}>
                <Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={artist.image || "/placeholder.svg"}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-1">
                        {artist.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Music className="h-3 w-3" />
                        <span>{artist.count} eventos</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Genres */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Géneros Musicales</h2>
            <p className="text-muted-foreground">Explora por categoría</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {genres?.map((genre) => (
              <Link key={genre.id} to={`/generos?category=${genre.id}`}>
                <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Music className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">{genre.name}</h3>
                    <p className="text-sm text-muted-foreground">{genre.count} eventos</p>
                  </div>
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
            {destinations?.map((city) => (
              <Link key={city.id} to={`/destinos/${city.city_slug}`}>
                <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Globe className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">{city.city_name}</h3>
                    <p className="text-sm text-muted-foreground">{city.upcoming_events} eventos</p>
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
            <Button size="lg" variant="default">
              Ver Todos los Eventos
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FeaturedEvents;
