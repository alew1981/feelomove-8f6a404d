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
import { Calendar, MapPin, ArrowLeft, Bus, Play, Music, Users, Tent, Ticket } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatFestivalDateRange, getFestivalDurationText, formatHeadliners } from "@/lib/festivalUtils";

const FestivalDetalle = () => {
  const { festivalSlug } = useParams<{ festivalSlug: string }>();
  
  // Decode the festival name from slug
  const festivalName = decodeURIComponent(festivalSlug || "").replace(/-/g, " ");

  // Fetch all events for this festival using the festivals-specific view
  const { data: events, isLoading } = useQuery({
    queryKey: ["festival-events", festivalSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page_festivales")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Filter by secondary_attraction_name OR primary_attraction_name OR event_name (case-insensitive)
      return (data || []).filter(e => {
        const eName = (e.secondary_attraction_name || e.primary_attraction_name || e.event_name || "").toLowerCase();
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
      const name = normalizeText(event.event_name || "");
      const attraction = normalizeText(event.primary_attraction_name || "");
      return transportKeywords.some(keyword => 
        name.includes(keyword) || attraction.includes(keyword)
      );
    };
    
    const transport = events.filter(isTransport);
    const concerts = events.filter(e => !isTransport(e));
    
    return { concertEvents: concerts, transportEvents: transport };
  }, [events]);

  // Get festival metadata (using the new festival-specific fields when available)
  const festivalData = useMemo(() => {
    if (!events || events.length === 0) return null;
    
    const allEvents = concertEvents.length > 0 ? concertEvents : events;
    const firstEvent = allEvents[0];
    const lastEvent = allEvents[allEvents.length - 1];
    
    // Use festival-specific fields if available
    const festivalStartDate = firstEvent.festival_start_date || firstEvent.event_date;
    const festivalEndDate = firstEvent.festival_end_date || lastEvent.event_date;
    const festivalDuration = firstEvent.festival_duration_days || 1;
    const headliners = firstEvent.festival_headliners || [];
    const lineupArtists = firstEvent.festival_lineup_artists || concertEvents.flatMap(e => e.attraction_names || []);
    const uniqueArtists = [...new Set(lineupArtists)];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    const minPrice = Math.min(...allEvents.map(e => Number(e.price_min_incl_fees) || 0).filter(p => p > 0));
    const maxPrice = Math.max(...allEvents.map(e => Number(e.price_min_incl_fees) || 0));
    
    return {
      name: firstEvent.secondary_attraction_name || firstEvent.primary_attraction_name || firstEvent.event_name,
      image: firstEvent.image_large_url || firstEvent.image_standard_url,
      venue: firstEvent.venue_name,
      city: firstEvent.venue_city,
      cities: uniqueCities,
      artistCount: firstEvent.festival_total_artists || uniqueArtists.length,
      eventCount: concertEvents.length,
      transportCount: transportEvents.length,
      firstDate: festivalStartDate,
      lastDate: festivalEndDate,
      durationDays: festivalDuration,
      minPrice,
      maxPrice,
      genre: firstEvent.primary_subcategory_name || firstEvent.primary_category_name,
      headliners,
      lineupArtists: uniqueArtists,
      stages: firstEvent.festival_stages || [],
      hasCamping: firstEvent.festival_camping_available || false,
      hasTransport: firstEvent.festival_has_official_transport || false,
      hasFestivalPass: firstEvent.has_festival_pass || false,
      hasDailyTickets: firstEvent.has_daily_tickets || false,
    };
  }, [events, concertEvents, transportEvents]);

  const heroImage = festivalData?.image || "/placeholder.svg";

  // Generate JSON-LD for festival detail
  const jsonLd = festivalData ? {
    "@context": "https://schema.org",
    "@type": "Festival",
    "name": festivalData.name,
    "startDate": festivalData.firstDate,
    "endDate": festivalData.lastDate,
    "url": `https://feelomove.com/festivales/${festivalSlug}`,
    "image": festivalData.image,
    "location": {
      "@type": "Place",
      "name": festivalData.venue || festivalData.city,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": festivalData.city
      }
    },
    ...(festivalData.minPrice > 0 && {
      "offers": {
        "@type": "Offer",
        "price": festivalData.minPrice,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
    }),
    "performer": concertEvents.slice(0, 10).map(event => ({
      "@type": "MusicGroup",
      "name": event.primary_attraction_name || event.event_name
    }))
  } : null;

  return (
    <>
      <SEOHead
        title={`${festivalData?.name || festivalName} - Todos los Conciertos`}
        description={`Descubre todos los conciertos de ${festivalData?.name || festivalName}. ${festivalData?.eventCount || 0} eventos, ${festivalData?.artistCount || 0} artistas. Entradas desde €${festivalData?.minPrice || 0}.`}
        canonical={`/festivales/${festivalSlug}`}
        keywords={`${festivalName}, festival, conciertos, ${festivalData?.city || ""}`}
        pageType="ItemPage"
        jsonLd={jsonLd || undefined}
        preloadImage={heroImage !== "/placeholder.svg" ? heroImage : undefined}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image */}
          <PageHero title={festivalData?.name || festivalName} imageUrl={heroImage} />
          
          {/* Back Link */}
          <Link 
            to="/festivales" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#00FF8F] transition-colors mt-4 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Festivales
          </Link>
          
          {/* Festival Info Section */}
          {festivalData && (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 space-y-4">
              {/* Date and Location */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="font-medium text-foreground">
                    {festivalData.durationDays > 1 
                      ? formatFestivalDateRange(festivalData.firstDate, festivalData.lastDate)
                      : format(new Date(festivalData.firstDate), "d MMMM yyyy", { locale: es })}
                  </span>
                  {festivalData.durationDays > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {getFestivalDurationText(festivalData.durationDays)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{festivalData.venue || festivalData.city}</span>
                </div>
              </div>

              {/* Stats Badges */}
              <div className="flex flex-wrap gap-2">
                {festivalData.artistCount > 0 && (
                  <Badge className="bg-accent/10 text-accent border-accent/30 gap-1">
                    <Users className="h-3 w-3" />
                    {festivalData.artistCount} ARTISTAS
                  </Badge>
                )}
                {festivalData.eventCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
                    <Music className="h-3 w-3" />
                    {festivalData.eventCount} EVENTOS
                  </Badge>
                )}
                {festivalData.hasCamping && (
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1">
                    <Tent className="h-3 w-3" />
                    CAMPING
                  </Badge>
                )}
                {festivalData.hasTransport && (
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 gap-1">
                    <Bus className="h-3 w-3" />
                    TRANSPORTE
                  </Badge>
                )}
                {festivalData.hasFestivalPass && (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                    <Ticket className="h-3 w-3" />
                    ABONOS
                  </Badge>
                )}
                {festivalData.hasDailyTickets && (
                  <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30 gap-1">
                    <Calendar className="h-3 w-3" />
                    ENTRADAS DIARIAS
                  </Badge>
                )}
              </div>

              {/* Headliners */}
              {festivalData.headliners && festivalData.headliners.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">CABEZAS DE CARTEL</p>
                  <div className="flex flex-wrap gap-2">
                    {festivalData.headliners.slice(0, 6).map((artist: string) => (
                      <Badge key={artist} variant="outline" className="text-sm font-medium">
                        {artist}
                      </Badge>
                    ))}
                    {festivalData.headliners.length > 6 && (
                      <Badge variant="outline" className="text-sm text-muted-foreground">
                        +{festivalData.headliners.length - 6} más
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Price Range */}
              {festivalData.minPrice > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground text-sm">
                    Entradas desde <span className="text-accent font-bold text-lg">€{Math.round(festivalData.minPrice)}</span>
                    {festivalData.maxPrice > festivalData.minPrice && (
                      <span className="text-muted-foreground"> - €{Math.round(festivalData.maxPrice)}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

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
                        key={event.event_id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <EventCard event={event as any} priority={index < 4} />
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
                        key={event.event_id}
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
                          <EventCard event={event as any} />
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
