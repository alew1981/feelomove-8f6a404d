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
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
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
      
      // Filter by secondary_attraction_name (case-insensitive)
      return (data || []).filter(e => 
        e.secondary_attraction_name?.toLowerCase() === festivalName.toLowerCase()
      );
    },
    enabled: !!festivalSlug,
  });

  // Get festival metadata
  const festivalData = useMemo(() => {
    if (!events || events.length === 0) return null;
    
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const uniqueArtists = [...new Set(events.flatMap(e => e.attraction_names || []))];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    const minPrice = Math.min(...events.map(e => Number(e.price_min_incl_fees) || 0).filter(p => p > 0));
    const maxPrice = Math.max(...events.map(e => Number(e.price_max_incl_fees) || 0));
    
    return {
      name: firstEvent.secondary_attraction_name,
      image: firstEvent.image_large_url || firstEvent.image_standard_url,
      venue: firstEvent.venue_name,
      city: firstEvent.venue_city,
      cities: uniqueCities,
      artistCount: uniqueArtists.length,
      eventCount: events.length,
      firstDate: firstEvent.event_date,
      lastDate: lastEvent.event_date,
      minPrice,
      maxPrice,
      genre: firstEvent.genre,
    };
  }, [events]);

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
          
          {/* Festival Info */}
          {festivalData && (
            <div className="bg-card border-2 border-border rounded-xl p-6 mb-8">
              <div className="flex flex-wrap gap-3 mb-4">
                {festivalData.genre && (
                  <Badge variant="secondary" className="bg-[#00FF8F]/10 text-[#00FF8F] border-[#00FF8F]/30">
                    {festivalData.genre}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {festivalData.artistCount} artistas
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {festivalData.eventCount} conciertos
                </Badge>
                {festivalData.cities.map(city => (
                  <Badge key={city} variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {city}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Fechas:</span>
                  <p className="font-semibold">
                    {festivalData.firstDate && format(new Date(festivalData.firstDate), "d MMM", { locale: es })}
                    {festivalData.lastDate && festivalData.firstDate !== festivalData.lastDate && 
                      ` - ${format(new Date(festivalData.lastDate), "d MMM yyyy", { locale: es })}`
                    }
                    {festivalData.firstDate === festivalData.lastDate && 
                      ` ${format(new Date(festivalData.firstDate), "yyyy", { locale: es })}`
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Venue:</span>
                  <p className="font-semibold">{festivalData.venue}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Precios:</span>
                  <p className="font-semibold text-[#00FF8F]">
                    Desde €{festivalData.minPrice?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Events Grid */}
          <h2 className="text-2xl font-bold mb-6">Conciertos del Festival</h2>
          
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event, index) => (
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
        </div>
        <Footer />
      </div>
    </>
  );
};

export default FestivalDetalle;
