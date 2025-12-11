import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, ArrowLeft, Bus, Play } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FestivalDetalle = () => {
  const { festivalSlug } = useParams<{ festivalSlug: string }>();
  
  // Decode the festival name from slug
  const festivalName = decodeURIComponent(festivalSlug || "").replace(/-/g, " ");

  // Fetch all events for this festival
  const { data: events, isLoading } = useQuery({
    queryKey: ["festival-events", festivalSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Filter by secondary_attraction_name OR main_attraction OR name (case-insensitive)
      return (data || []).filter(e => {
        const eName = (e.secondary_attraction_name || e.main_attraction || e.name || "").toLowerCase();
        return eName === festivalName.toLowerCase();
      });
    },
    enabled: !!festivalSlug,
  });

  // Separate concert events from transport events
  const { concertEvents, transportEvents } = useMemo(() => {
    if (!events) return { concertEvents: [], transportEvents: [] };
    
    // Normalize text to handle accents (autobús -> autobus)
    const normalizeText = (text: string) => 
      text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    
    // Transport keywords
    const transportKeywords = ["autobus", "bus", "shuttle", "transfer", "transporte", "servicio de autobus"];
    
    const isTransport = (event: typeof events[0]) => {
      const name = normalizeText(event.name || "");
      const attraction = normalizeText(event.main_attraction || "");
      return transportKeywords.some(keyword => 
        name.includes(keyword) || attraction.includes(keyword)
      );
    };
    
    const transport = events.filter(isTransport);
    const concerts = events.filter(e => !isTransport(e));
    
    return { concertEvents: concerts, transportEvents: transport };
  }, [events]);

  // Get festival metadata (using only concert events for stats)
  const festivalData = useMemo(() => {
    if (!events || events.length === 0) return null;
    
    const allEvents = concertEvents.length > 0 ? concertEvents : events;
    const firstEvent = allEvents[0];
    const lastEvent = allEvents[allEvents.length - 1];
    const uniqueArtists = [...new Set(concertEvents.flatMap(e => e.attraction_names || []))];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    const minPrice = Math.min(...allEvents.map(e => Number(e.price_min_incl_fees) || 0).filter(p => p > 0));
    const maxPrice = Math.max(...allEvents.map(e => Number(e.price_max_incl_fees) || 0));
    
    return {
      name: firstEvent.secondary_attraction_name || firstEvent.main_attraction || firstEvent.name,
      image: firstEvent.image_large_url || firstEvent.image_standard_url,
      venue: firstEvent.venue_name,
      city: firstEvent.venue_city,
      cities: uniqueCities,
      artistCount: uniqueArtists.length,
      eventCount: concertEvents.length,
      transportCount: transportEvents.length,
      firstDate: firstEvent.event_date,
      lastDate: lastEvent.event_date,
      minPrice,
      maxPrice,
      genre: firstEvent.genre,
    };
  }, [events, concertEvents, transportEvents]);

  const heroImage = festivalData?.image || "/placeholder.svg";

  return (
    <>
      <SEOHead
        title={`${festivalData?.name || festivalName} - Todos los Conciertos | FEELOMOVE`}
        description={`Descubre todos los conciertos de ${festivalData?.name || festivalName}. ${festivalData?.eventCount || 0} eventos, ${festivalData?.artistCount || 0} artistas. Entradas desde €${festivalData?.minPrice || 0}.`}
        canonical={`/festivales/${festivalSlug}`}
        keywords={`${festivalName}, festival, conciertos, ${festivalData?.city || ""}`}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Back Link */}
          <Link 
            to="/festivales" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#00FF8F] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Festivales
          </Link>
          
          {/* Hero Image */}
          <PageHero title={festivalData?.name || festivalName} imageUrl={heroImage} />
          
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          

          {/* Tabs for Concerts and Transport */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No se encontraron eventos para este festival</p>
              <Link 
                to="/festivales" 
                className="inline-flex items-center gap-2 text-[#00FF8F] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Ver todos los festivales
              </Link>
            </div>
          ) : (
            <Tabs defaultValue="conciertos" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="conciertos" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Conciertos del Festival
                </TabsTrigger>
                {transportEvents.length > 0 && (
                  <TabsTrigger value="transporte" className="flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    Transporte al Festival
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="conciertos">
                {concertEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground">No hay conciertos disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {concertEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {transportEvents.length > 0 && (
                <TabsContent value="transporte">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {transportEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className="animate-fade-in relative"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Transport badge overlay */}
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Bus className="h-3 w-3" />
                            TRANSPORTE
                          </div>
                        </div>
                        <div className="ring-2 ring-amber-500/50 rounded-lg overflow-hidden">
                          <EventCard event={event} />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default FestivalDetalle;
