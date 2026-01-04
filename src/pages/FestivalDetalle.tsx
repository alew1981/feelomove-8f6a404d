import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useSchemaOrg } from "@/hooks/useSchemaOrg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import FestivalHero from "@/components/FestivalHero";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, ArrowLeft, Bus, Play, Music, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatFestivalDateRange, getFestivalDurationText } from "@/lib/festivalUtils";
import { FestivalServices } from "@/components/FestivalServices";
import { FestivalProductPage } from "@/types/events.types";

// Keywords that identify a festival name (case-insensitive)
const FESTIVAL_KEYWORDS = [
  'Festival', 'Concert Music', 'Starlite', 'Fest', 'Sonar', 'Primavera', 
  'BBK Live', 'Mad Cool', 'Arenal', 'Medusa', 'Weekend', 'Viña Rock',
  'Cruïlla', 'Rototom', 'Monegros', 'FIB', 'Low Festival', 'Dreambeach',
  'A Summer Story', 'Reggaeton Beach', 'Abono'
];

// Helper to check if a string contains festival keywords
const containsFestivalKeyword = (name: string | null | undefined): boolean => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return FESTIVAL_KEYWORDS.some(keyword => 
    lowerName.includes(keyword.toLowerCase())
  );
};

// Get the corrected festival name (apply forced re-mapping logic)
const getFestivalNombre = (event: FestivalProductPage): string => {
  const primaryName = event.primary_attraction_name || '';
  const secondaryName = event.secondary_attraction_name || '';
  const eventName = event.event_name || '';
  const venueName = event.venue_name || '';
  
  const primaryIsFestival = containsFestivalKeyword(primaryName);
  const secondaryIsFestival = containsFestivalKeyword(secondaryName);
  const venueIsFestival = containsFestivalKeyword(venueName);
  const eventIsFestival = containsFestivalKeyword(eventName);
  
  // Case 1: Secondary is festival, Primary is artist (INVERTED DATA)
  if (secondaryIsFestival && !primaryIsFestival) {
    return secondaryName;
  }
  // Case 2: Venue name is the festival
  if (venueIsFestival && !primaryIsFestival && !secondaryIsFestival) {
    return venueName;
  }
  // Case 3: Event name contains festival but primary is artist
  if (eventIsFestival && !primaryIsFestival) {
    const eventLower = eventName.toLowerCase();
    for (const keyword of FESTIVAL_KEYWORDS) {
      if (eventLower.includes(keyword.toLowerCase())) {
        const keywordIndex = eventLower.indexOf(keyword.toLowerCase());
        const afterKeyword = eventName.substring(keywordIndex);
        const endMatch = afterKeyword.match(/^[^-–—\n]+/);
        return endMatch ? endMatch[0].trim() : eventName;
      }
    }
    return eventName;
  }
  // Case 4: Normal - primary is festival
  if (primaryIsFestival) {
    return primaryName;
  }
  // Case 5: Fallback
  return primaryName || eventName;
};

const FestivalDetalle = () => {
  const { festivalSlug } = useParams<{ festivalSlug: string }>();
  
  // Decode the festival name and city from slug (format: festival-name_city-name)
  const decodedSlug = decodeURIComponent(festivalSlug || "");
  const slugParts = decodedSlug.split('_');
  const festivalName = slugParts[0]?.replace(/-/g, " ") || "";
  const cityName = slugParts[1]?.replace(/-/g, " ") || "";

  // Fetch all events for this festival using the festivals-specific view
  const { data: events, isLoading } = useQuery({
    queryKey: ["festival-events", festivalSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page_festivales")
        .select("*")
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Filter by corrected festival name AND city (both case insensitive)
      return (data || []).filter(e => {
        const correctedName = getFestivalNombre(e as FestivalProductPage);
        const eventCity = e.venue_city || '';
        const nameMatches = correctedName.toLowerCase() === festivalName.toLowerCase();
        const cityMatches = !cityName || eventCity.toLowerCase() === cityName.toLowerCase();
        return nameMatches && cityMatches;
      }) as FestivalProductPage[];
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

  // Get festival metadata (using the corrected festival name and festival-specific fields)
  const festivalData = useMemo(() => {
    if (!events || events.length === 0) return null;
    
    const allEvents = concertEvents.length > 0 ? concertEvents : events;
    const firstEvent = allEvents[0];
    const lastEvent = allEvents[allEvents.length - 1];
    
    // Get corrected festival name
    const correctedFestivalName = getFestivalNombre(firstEvent);
    
    // Helper to check placeholder dates
    const isPlaceholder = (d: string | null | undefined) => !d || d.startsWith('9999');
    
    // Use festival-specific fields if available, handle placeholder dates
    const rawStartDate = firstEvent.festival_start_date || firstEvent.event_date;
    const rawEndDate = firstEvent.festival_end_date || lastEvent.event_date;
    const festivalStartDate = isPlaceholder(rawStartDate) ? null : rawStartDate;
    const festivalEndDate = isPlaceholder(rawEndDate) ? null : rawEndDate;
    const festivalDuration = firstEvent.festival_duration_days || 1;
    const headliners = firstEvent.festival_headliners || [];
    const lineupArtists = firstEvent.festival_lineup_artists || concertEvents.flatMap(e => e.attraction_names || []);
    const uniqueArtists = [...new Set(lineupArtists)];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    const validPrices = allEvents.map(e => Number(e.price_min_incl_fees) || 0).filter(p => p > 0);
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
    
    return {
      // Use corrected festival name
      name: correctedFestivalName,
      image: firstEvent.image_large_url || firstEvent.image_standard_url,
      venue: firstEvent.venue_name,
      city: firstEvent.venue_city,
      cities: uniqueCities,
      artistCount: firstEvent.festival_total_artists || uniqueArtists.length,
      eventCount: concertEvents.length,
      transportCount: transportEvents.length,
      firstDate: festivalStartDate,
      lastDate: festivalEndDate,
      hasValidDates: festivalStartDate !== null && festivalEndDate !== null,
      durationDays: festivalDuration,
      minPrice,
      maxPrice,
      genre: firstEvent.primary_subcategory_name || firstEvent.primary_category_name,
      headliners,
      lineupArtists: uniqueArtists,
      stages: firstEvent.festival_stages || [],
      totalStages: firstEvent.festival_total_stages,
      hasCamping: firstEvent.festival_camping_available || false,
      hasTransport: firstEvent.festival_has_official_transport || false,
      hasFestivalPass: firstEvent.has_festival_pass || false,
      hasDailyTickets: firstEvent.has_daily_tickets || false,
      hasCampingTickets: firstEvent.has_camping_tickets || false,
      hasParkingTickets: firstEvent.has_parking_tickets || false,
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
          
          {/* Festival Hero with dates, lineup, countdown */}
          <FestivalHero 
            title={festivalData?.name || festivalName}
            imageUrl={heroImage}
            eventDate={festivalData?.firstDate}
            endDate={festivalData?.lastDate}
            durationDays={festivalData?.durationDays}
            city={festivalData?.city || undefined}
            venue={festivalData?.venue || undefined}
            genre={festivalData?.genre || undefined}
            headliners={festivalData?.headliners || []}
            eventId={events?.[0]?.event_id || undefined}
            eventSlug={festivalSlug}
            isFestival={true}
          />
          
          {/* Back Link */}
          <Link 
            to="/festivales" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#00FF8F] transition-colors mt-4 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Festivales
          </Link>
          
          {/* Services Section - Compact */}
          {festivalData && (
            <div className="mb-6">
              <FestivalServices
                campingAvailable={festivalData.hasCamping}
                hasOfficialTransport={festivalData.hasTransport}
                hasFestivalPass={festivalData.hasFestivalPass}
                hasDailyTickets={festivalData.hasDailyTickets}
                hasCampingTickets={festivalData.hasCampingTickets}
                hasParkingTickets={festivalData.hasParkingTickets}
                totalStages={festivalData.totalStages}
                variant="badge"
              />
              {/* Price Range */}
              {festivalData.minPrice > 0 && (
                <p className="text-muted-foreground text-sm mt-3">
                  Entradas desde <span className="text-accent font-bold text-lg">€{Math.round(festivalData.minPrice)}</span>
                  {festivalData.maxPrice > festivalData.minPrice && (
                    <span className="text-muted-foreground"> - €{Math.round(festivalData.maxPrice)}</span>
                  )}
                </p>
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
                        <EventCard 
                          event={event as any} 
                          priority={index < 4} 
                          festivalName={festivalData?.name}
                          forceConcierto={true}
                        />
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
                          <EventCard event={event as any} forceConcierto={true} />
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
