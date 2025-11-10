import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Map from "@/components/Map";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, ArrowUpDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Eventos = () => {
  const [sortBy, setSortBy] = useState("date");
  const [filterCity, setFilterCity] = useState("all");
  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const observerTarget = useRef(null);
  const EVENTS_PER_PAGE = 50;

  const { data: events, isLoading, isFetching } = useQuery({
    queryKey: ["events", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_list_page_view")
        .select("event_id, event_name, venue_city, venue_name, event_date, image_standard_url, min_price, venue_country, main_attraction_name, venue_latitude, venue_longitude")
        .gt("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .range((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE - 1);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (events) {
      setAllEvents(prev => {
        const newEvents = events.filter(e => !prev.some(p => p.event_id === e.event_id));
        return [...prev, ...newEvents];
      });
    }
  }, [events]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isFetching && events && events.length === EVENTS_PER_PAGE) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isFetching, events]);

  const cities = [...new Set(allEvents?.map(e => e.venue_city).filter(Boolean))];

  const filteredEvents = allEvents?.filter(event => 
    filterCity === "all" || event.venue_city === filterCity
  );

  const sortedEvents = filteredEvents?.sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    }
    if (sortBy === "price-asc" && a.min_price && b.min_price) {
      return Number(a.min_price) - Number(b.min_price);
    }
    if (sortBy === "price-desc" && a.min_price && b.min_price) {
      return Number(b.min_price) - Number(a.min_price);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Todos los Eventos</h1>
          <p className="text-muted-foreground text-lg">
            Descubre los mejores eventos y conciertos en España
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city!}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-8">
          <Map events={filteredEvents?.filter(e => e.venue_latitude && e.venue_longitude) || []} />
        </div>

        {isLoading && page === 1 ? (
          <div className="text-center py-12">Cargando eventos...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEvents?.map((event) => {
              const eventDate = new Date(event.event_date);
              const formattedDate = eventDate.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              });

                return (
                  <Card key={event.event_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={event.image_standard_url || "/placeholder.svg"}
                        alt={event.event_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                        <h3 className="font-bold text-lg p-4 line-clamp-2 text-foreground">{event.event_name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                    {event.main_attraction_name && (
                      <p className="text-sm text-muted-foreground mb-2">{event.main_attraction_name}</p>
                    )}
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-secondary" />
                        <span>{event.venue_city}</span>
                      </div>
                      {event.venue_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{event.venue_name}</span>
                        </div>
                      )}
                    </div>
                    {event.min_price && (
                      <div className="mt-3">
                        <Badge variant="secondary">Desde €{Number(event.min_price).toFixed(2)}</Badge>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button asChild className="w-full">
                      <Link to={`/producto/${event.event_id}`}>Ver Detalles</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            {isFetching && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Cargando más eventos...</span>
              </div>
            )}
          </div>
        </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Eventos;
