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
import { Calendar, MapPin, ArrowLeft, Bus, Play, Music, Users, Tent, Car } from "lucide-react";
import { formatFestivalDateRange, getFestivalDurationText } from "@/lib/festivalUtils";
import { FestivalServices } from "@/components/FestivalServices";
import { FestivalProductPage } from "@/types/events.types";
import { EventStatusBanner, getEventStatus } from "@/components/EventStatusBanner";
import { EventSeo } from "@/components/EventSeo";

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
      const { data, error } = await (supabase
        .from("lovable_mv_event_product_page_festivales" as any)
        .select("*") as any)
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      
      // Normalize festival name for matching (remove dashes, lowercase)
      const normalizedFestivalName = festivalName.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Filter events that belong to this festival
      return (data || []).filter((e: any) => {
        const correctedName = getFestivalNombre(e as FestivalProductPage);
        const eventCity = e.venue_city || '';
        const eventName = (e.event_name || '').toLowerCase();
        const venueName = (e.venue_name || '').toLowerCase();
        
        // Check 1: Festival name matches via corrected logic
        const nameMatches = correctedName.toLowerCase() === normalizedFestivalName;
        
        // Check 2: For transport/service events, check if festival name appears in event_name
        // e.g., "Servicio de Autobús - Malú - Concert Music Festival" contains "concert music festival"
        const isServiceEvent = e.is_transport === true || e.is_package === true;
        const festivalInEventName = eventName.includes(normalizedFestivalName.replace(/\s+/g, ' '));
        
        // Check 3: Venue name contains festival reference (e.g., "ServicioBus ConcertMusicFestival")
        const festivalInVenueName = venueName.replace(/\s+/g, '').includes(normalizedFestivalName.replace(/\s+/g, ''));
        
        // City must match for regular events, but service events can have different venues
        const cityMatches = !cityName || eventCity.toLowerCase() === cityName.toLowerCase();
        const serviceWithFestivalRef = isServiceEvent && (festivalInEventName || festivalInVenueName);
        
        return (nameMatches && cityMatches) || serviceWithFestivalRef;
      }) as FestivalProductPage[];
    },
    enabled: !!festivalSlug,
  });

  // Separate events into categories: concerts, transport, camping, parking
  const { concertEvents, transportEvents, campingEvents, parkingEvents } = useMemo(() => {
    if (!events) return { concertEvents: [], transportEvents: [], campingEvents: [], parkingEvents: [] };
    
    // Normalize text to handle accents (autobús -> autobus)
    const normalizeText = (text: string) => 
      text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    
    // Transport patterns - use word boundaries to avoid false positives like "Obús" (band name)
    const transportPatterns = [
      /\bautobus\b/i,           // "autobús" as a word
      /\bbus\b/i,               // "bus" as a word (not "Obús")
      /\bshuttle\b/i,           // shuttle service
      /\btransfer\b/i,          // transfer service
      /\btransporte\b/i,        // transporte
      /servicio\s*(de\s*)?bus/i, // "servicio de bus" or "servicio bus"
      /servicio\s*(de\s*)?autobus/i, // "servicio de autobús"
      /^bus\s/i,                // starts with "bus "
      /\sbus$/i,                // ends with " bus"
    ];
    
    // Camping patterns
    const campingPatterns = [
      /\bcamping\b/i,
      /\balojamiento\b/i,
      /\bacampada\b/i,
    ];
    
    // Parking patterns
    const parkingPatterns = [
      /\bparking\b/i,
      /plaza\s*(de\s*)?parking/i,
      /\baparcamiento\b/i,
    ];
    
    const categorizeEvent = (event: typeof events[0]): 'concert' | 'transport' | 'camping' | 'parking' => {
      const name = normalizeText(event.event_name || "");
      const attraction = normalizeText(event.primary_attraction_name || "");
      
      // Check database flag first
      if (event.is_transport === true) {
        // Further categorize transport-flagged events
        if (campingPatterns.some(p => p.test(name) || p.test(attraction))) return 'camping';
        if (parkingPatterns.some(p => p.test(name) || p.test(attraction))) return 'parking';
        return 'transport';
      }
      
      // Check patterns for camping
      if (campingPatterns.some(p => p.test(name) || p.test(attraction))) return 'camping';
      
      // Check patterns for parking
      if (parkingPatterns.some(p => p.test(name) || p.test(attraction))) return 'parking';
      
      // Check patterns for transport (word boundaries prevent "Obús" matching "bus")
      if (transportPatterns.some(p => p.test(name) || p.test(attraction))) return 'transport';
      
      return 'concert';
    };
    
    const transport: typeof events = [];
    const camping: typeof events = [];
    const parking: typeof events = [];
    const concerts: typeof events = [];
    
    events.forEach(event => {
      const category = categorizeEvent(event);
      switch (category) {
        case 'transport': transport.push(event); break;
        case 'camping': camping.push(event); break;
        case 'parking': parking.push(event); break;
        default: concerts.push(event);
      }
    });
    
    return { 
      concertEvents: concerts, 
      transportEvents: transport, 
      campingEvents: camping, 
      parkingEvents: parking 
    };
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
    // Priority: manual lineup > automatic lineup > attractions from events
    const lineupArtists = firstEvent.festival_lineup_artists_manual 
      || firstEvent.festival_lineup_artists 
      || concertEvents.flatMap(e => e.attraction_names || []);
    const uniqueArtists = [...new Set(lineupArtists)];
    const uniqueCities = [...new Set(events.map(e => e.venue_city).filter(Boolean))];
    const validPrices = allEvents.map(e => Number(e.price_min_incl_fees) || 0).filter(p => p > 0);
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
    
    // Calculate if we have service events
    const hasServices = transportEvents.length > 0 || campingEvents.length > 0 || parkingEvents.length > 0;
    
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
      campingCount: campingEvents.length,
      parkingCount: parkingEvents.length,
      hasServices,
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
      hasCamping: firstEvent.festival_camping_available || campingEvents.length > 0,
      hasTransport: firstEvent.festival_has_official_transport || transportEvents.length > 0,
      hasFestivalPass: firstEvent.has_festival_pass || false,
      hasDailyTickets: firstEvent.has_daily_tickets || false,
      hasCampingTickets: firstEvent.has_camping_tickets || campingEvents.length > 0,
      hasParkingTickets: firstEvent.has_parking_tickets || parkingEvents.length > 0,
    };
  }, [events, concertEvents, transportEvents, campingEvents, parkingEvents]);

  const heroImage = festivalData?.image || "/placeholder.svg";

  // Determine festival status for banner display
  const festivalStatus = useMemo(() => {
    if (!events || events.length === 0) return 'scheduled' as const;
    
    // Check if any event is cancelled
    const hasCancelledEvent = events.some(e => e.cancelled);
    if (hasCancelledEvent) return 'cancelled' as const;
    
    // Check if festival has passed (use last date)
    const lastDate = festivalData?.lastDate;
    if (lastDate && !lastDate.startsWith('9999')) {
      const festivalEndDate = new Date(lastDate);
      const now = new Date();
      if (festivalEndDate < now) return 'past' as const;
    }
    
    return 'scheduled' as const;
  }, [events, festivalData?.lastDate]);

  // Build description for SEO - rich and unique content
  const headlinersText = festivalData?.headliners?.slice(0, 3).join(', ') || '';
  const dateText = festivalData?.hasValidDates && festivalData?.firstDate
    ? ` del ${new Date(festivalData.firstDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : '';
  const priceText = festivalData?.minPrice ? ` desde ${Math.round(festivalData.minPrice)}€` : '';
  
  const seoDescription = festivalData?.artistCount && festivalData.artistCount > 1
    ? `Compra entradas para ${festivalData?.name || festivalName}${dateText} en ${festivalData?.city || 'España'}. ${festivalData.artistCount} artistas${headlinersText ? ` incluyendo ${headlinersText}` : ''}. Entradas${priceText}. Reserva hotel cerca del festival. ¡Vive la experiencia!`
    : `Compra entradas para ${festivalData?.name || festivalName}${dateText} en ${festivalData?.city || 'España'}. Entradas${priceText}. Reserva hotel cerca del recinto. ¡Vive la experiencia del mejor festival!`;
  
  const absoluteUrl = `https://feelomove.com/festivales/${festivalSlug}`;

  // Build performers list from concert events
  const performers = concertEvents.slice(0, 20).map(event => ({
    name: event.primary_attraction_name || event.event_name || '',
    type: 'MusicGroup' as const,
  }));

  return (
    <>
      {/* EventSeo component injects JSON-LD structured data */}
      {festivalData && events && events.length > 0 && (
        <EventSeo
          eventId={events[0].event_id || festivalSlug || ''}
          name={festivalData.name}
          description={seoDescription}
          image={heroImage}
          images={{
            wide: festivalData.image,
          }}
          startDate={festivalData.firstDate || ''}
          endDate={festivalData.lastDate || festivalData.firstDate || ''}
          location={{
            name: festivalData.venue || festivalData.city || '',
            city: festivalData.city || '',
            country: 'ES',
          }}
          performers={performers}
          offers={festivalData.minPrice > 0 ? {
            lowPrice: festivalData.minPrice,
            highPrice: festivalData.maxPrice || festivalData.minPrice,
            currency: 'EUR',
            url: absoluteUrl,
            availability: festivalStatus === 'past' || festivalStatus === 'cancelled' ? 'SoldOut' : 'InStock',
          } : undefined}
          status={festivalStatus}
          isFestival={true}
          url={absoluteUrl}
        />
      )}
      
      <SEOHead
        title={`${festivalData?.name || festivalName} ${new Date().getFullYear()} - Entradas y Hotel`}
        description={seoDescription}
        canonical={absoluteUrl}
        keywords={`${festivalName}, festival música, entradas festival, ${festivalData?.city || 'España'}, hotel festival, ${festivalData?.lineupArtists?.slice(0, 5).join(', ') || ''}`}
        pageType="ItemPage"
        preloadImage={heroImage !== "/placeholder.svg" ? heroImage : undefined}
        ogImage={heroImage !== "/placeholder.svg" ? heroImage : undefined}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Festivales", url: "/festivales" },
          // Include city with navigable link for proper hierarchy
          ...(festivalData?.city ? [{
            name: festivalData.city,
            url: `/destinos/${festivalData.city.toLowerCase().replace(/\s+/g, '-')}`
          }] : []),
          { name: festivalData?.name || festivalName }
        ]}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Event Status Banner for cancelled or past festivals */}
          <EventStatusBanner 
            status={festivalStatus} 
            eventName={festivalData?.name || festivalName} 
            eventDate={festivalData?.lastDate || ''}
          />
          
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
            </div>
          )}
          
          {/* Lineup Section */}
          {festivalData && festivalData.lineupArtists && festivalData.lineupArtists.length > 0 && (
            <div className="mb-8 p-6 bg-card rounded-xl border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Line-up del Festival
              </h2>
              <div className="flex flex-wrap gap-2">
                {festivalData.lineupArtists.map((artist, index) => (
                  <Badge 
                    key={`${artist}-${index}`} 
                    variant="secondary" 
                    className="text-sm px-3 py-1.5"
                  >
                    {artist}
                  </Badge>
                ))}
              </div>
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
              {/* Only show tabs if there are service events */}
              {festivalData?.hasServices && (
                <TabsList className="mb-6 flex-wrap h-auto gap-1">
                  <TabsTrigger value="conciertos" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Entradas
                  </TabsTrigger>
                  {transportEvents.length > 0 && (
                    <TabsTrigger value="transporte" className="flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      Transporte ({transportEvents.length})
                    </TabsTrigger>
                  )}
                  {campingEvents.length > 0 && (
                    <TabsTrigger value="camping" className="flex items-center gap-2">
                      <Tent className="h-4 w-4" />
                      Camping ({campingEvents.length})
                    </TabsTrigger>
                  )}
                  {parkingEvents.length > 0 && (
                    <TabsTrigger value="parking" className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Parking ({parkingEvents.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              )}
              
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
              
              {campingEvents.length > 0 && (
                <TabsContent value="camping">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {campingEvents.map((event, index) => (
                      <div
                        key={event.event_id}
                        className="animate-fade-in relative"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Camping badge overlay */}
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Tent className="h-3 w-3" />
                            CAMPING
                          </div>
                        </div>
                        <div className="ring-2 ring-emerald-600/50 rounded-lg overflow-hidden">
                          <EventCard event={event as any} forceConcierto={true} />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
              
              {parkingEvents.length > 0 && (
                <TabsContent value="parking">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {parkingEvents.map((event, index) => (
                      <div
                        key={event.event_id}
                        className="animate-fade-in relative"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Parking badge overlay */}
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Car className="h-3 w-3" />
                            PARKING
                          </div>
                        </div>
                        <div className="ring-2 ring-blue-600/50 rounded-lg overflow-hidden">
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
