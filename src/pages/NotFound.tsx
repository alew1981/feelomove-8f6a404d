import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Home, Search, Music, Ticket, Bus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fullUrl = window.location.href;
    const referrer = document.referrer || "direct";
    
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Push to dataLayer for Google Analytics / GTM
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "page_not_found",
        page_path: location.pathname,
        page_url: fullUrl,
        page_referrer: referrer,
        page_title: "404 - Página no encontrada"
      });
    }
    
    // Also log to console in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("404 Analytics Event:", {
        path: location.pathname,
        url: fullUrl,
        referrer: referrer
      });
    }
  }, [location.pathname]);

  // Fetch suggested concerts
  const { data: concerts } = useQuery({
    queryKey: ["suggestedConcerts"],
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

  // Fetch suggested festivals
  const { data: festivals } = useQuery({
    queryKey: ["suggestedFestivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("id, name, slug, venue_city, event_date, image_standard_url, price_min_incl_fees")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/eventos?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const renderEventCard = (event: any, type: 'concierto' | 'festival') => {
    const basePath = type === 'festival' ? '/festivales' : '/producto';
    return (
      <Link key={event.id} to={`${basePath}/${event.slug}`}>
        <Card className="hover:scale-[1.02] transition-transform overflow-hidden h-full border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img 
              src={event.image_standard_url || "/placeholder.svg"} 
              alt={event.name || "Evento"}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              width={300}
              height={225}
            />
          </div>
          <CardContent className="p-4">
            <h4 className="font-bold text-base mb-2 line-clamp-2 text-foreground">{event.name}</h4>
            <p className="text-sm text-muted-foreground mb-1">{event.venue_city}</p>
            <p className="text-sm text-muted-foreground">
              {event.event_date && new Date(event.event_date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            {event.price_min_incl_fees && (
              <p className="text-sm font-semibold text-primary mt-2">
                Desde {event.price_min_incl_fees.toFixed(0)}€
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <>
      {/* SEO: Tell search engines not to index 404 pages */}
      <Helmet>
        <title>404 - Página no encontrada | Feelomove</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="description" content="La página que buscas no existe o ha sido movida. Explora nuestros conciertos y festivales disponibles." />
      </Helmet>
      <Navbar />
      <div className="flex min-h-screen flex-col pt-16">
        <div className="flex-1 flex items-center justify-center bg-background py-16 px-4">
          <div className="text-center max-w-5xl mx-auto w-full">
            {/* Error Header */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-black text-primary mb-4">404</h1>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Página no encontrada</h2>
              <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Buscar eventos, artistas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="default">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Ir al Inicio
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/eventos">
                  <Ticket className="mr-2 h-5 w-5" />
                  Ver Eventos
                </Link>
              </Button>
            </div>

            {/* Suggested Events by Type */}
            {(concerts?.length || festivals?.length) && (
              <div className="mt-8">
                <h3 className="text-xl md:text-2xl font-bold mb-6 text-foreground">Explora estos eventos</h3>
                
                <Tabs defaultValue="conciertos" className="w-full">
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                    <TabsTrigger value="conciertos" className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Conciertos
                    </TabsTrigger>
                    <TabsTrigger value="festivales" className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Festivales
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="conciertos">
                    {concerts && concerts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {concerts.map((event) => renderEventCard(event, 'concierto'))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay conciertos disponibles</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="festivales">
                    {festivals && festivals.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {festivals.map((event) => renderEventCard(event, 'festival'))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay festivales disponibles</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Quick Links */}
            <div className="mt-12 pt-8 border-t border-border">
              <h4 className="text-lg font-semibold mb-4 text-foreground">Enlaces rápidos</h4>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/destinos" className="text-muted-foreground hover:text-primary transition-colors">
                  Destinos
                </Link>
                <Link to="/artistas" className="text-muted-foreground hover:text-primary transition-colors">
                  Artistas
                </Link>
                <Link to="/generos" className="text-muted-foreground hover:text-primary transition-colors">
                  Géneros
                </Link>
                <a 
                  href="https://feelomove-com.nuitee.link/?language=es&currency=EUR" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Hoteles
                </a>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
