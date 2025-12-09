import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Fetch suggested events using mv_concerts_cards
  const { data: suggestedEvents } = useQuery({
    queryKey: ["suggestedEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("id, name, slug, venue_city, event_date, image_standard_url, price_min_incl_fees")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col pt-16">
        <div className="flex-1 flex items-center justify-center bg-background py-16 px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-9xl font-black text-[#00FF8F] mb-4">404</h1>
              <h2 className="text-3xl font-bold text-foreground mb-2">Página no encontrada</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F]/90">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Ir al Inicio
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/eventos">
                  <Search className="mr-2 h-5 w-5" />
                  Ver Eventos
                </Link>
              </Button>
            </div>

            {suggestedEvents && suggestedEvents.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6">O explora estos eventos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {suggestedEvents.map((event) => (
                    <Link key={event.id} to={`/producto/${event.slug}`}>
                      <Card className="hover-lift overflow-hidden h-full">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img 
                            src={event.image_standard_url || "/placeholder.svg"} 
                            alt={event.name || "Evento"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-lg mb-2 line-clamp-2">{event.name}</h4>
                          <p className="text-sm text-muted-foreground mb-1">{event.venue_city}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.event_date && new Date(event.event_date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default NotFound;