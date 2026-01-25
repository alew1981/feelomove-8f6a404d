import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useEventData } from "@/hooks/useEventData";
import { usePageTracking } from "@/hooks/usePageTracking";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductoSkeleton from "@/components/ProductoSkeleton";
import { LazySection } from "@/components/LazySection";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, Plus, Minus, MapPin, AlertCircle, RefreshCw, Check, Ticket, Building2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/contexts/CartContext";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";

// LAZY LOAD below-fold and non-critical components to reduce initial JS bundle
const HotelMapTabs = lazy(() => import("@/components/HotelMapTabs"));
const HotelCard = lazy(() => import("@/components/HotelCard"));
const Footer = lazy(() => import("@/components/Footer"));
const RelatedLinks = lazy(() => import("@/components/RelatedLinks").then(m => ({ default: m.RelatedLinks })));

// Secondary UI components - not needed for first paint
const MobileCartBar = lazy(() => import("@/components/MobileCartBar"));
const CollapsibleBadges = lazy(() => import("@/components/CollapsibleBadges"));
const EventStatusBanner = lazy(() => import("@/components/EventStatusBanner").then(m => ({ default: m.EventStatusBanner })));
const EventSeo = lazy(() => import("@/components/EventSeo").then(m => ({ default: m.EventSeo })));

// Helper function imported directly (not a component)
import { getEventStatus } from "@/components/EventStatusBanner";
import { createEventSeoProps } from "@/components/EventSeo";

interface PriceLevel {
  id: number;
  name: string;
  face_value: number;
  ticket_fees: number;
  total_price: number;
  availability: string;
}

interface PriceType {
  id: number;
  code: string;
  name: string;
  description: string;
  regular: boolean;
  price_levels: PriceLevel[];
}

interface TicketTypesData {
  currency: string;
  price_types: PriceType[];
}

interface HotelData {
  hotel_id: string;
  hotel_name: string;
  hotel_main_photo: string;
  hotel_description: string;
  hotel_stars: number;
  hotel_rating: number;
  hotel_reviews: number;
  price: number;
  selling_price: number;
  distance_km: number;
  facility_names_es?: string[];
  checkin_date?: string;
  checkout_date?: string;
  nights?: number;
  hotel_address?: string;
  hotel_city?: string;
}

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();
  
  // Detect route type for canonical URL
  const isConcierto = location.pathname.startsWith('/concierto/');
  const isFestivalRoute = location.pathname.startsWith('/festival/');
  
  const [showAllTickets, setShowAllTickets] = useState(false);

  // OPTIMIZED: Use parallelized event data hook (Promise.all instead of waterfall)
  const { data: eventResult, isLoading, isError, error, refetch } = useEventData(
    slug,
    isFestivalRoute,
    isConcierto
  );

  // Handle redirects from the optimized hook
  useEffect(() => {
    if (eventResult?.needsRedirect && eventResult.redirectPath) {
      navigate(eventResult.redirectPath, { replace: true });
    }
    if (eventResult?.needsRouteCorrection && eventResult.correctRoutePath) {
      navigate(eventResult.correctRoutePath, { replace: true });
    }
  }, [eventResult, navigate]);

  // Extract event data and canonical slug from result
  const eventData = eventResult?.data;
  const rpcCanonicalSlug = eventResult?.canonicalSlug || null;

  // Process data - first row has event details
  const eventDetails = eventData?.[0] as unknown as EventProductPage | null;

  // Track page view with proper title (fixes "Page Name not defined" in Matomo)
  usePageTracking(eventDetails?.event_name);
  
  // Get hotels from hotels_prices_aggregated_jsonb
  const hotels: HotelData[] = (() => {
    if (!eventDetails) return [];
    
    let aggregatedHotels = (eventDetails as any).hotels_prices_aggregated_jsonb;
    
    // Handle case where JSONB might be returned as string
    if (typeof aggregatedHotels === 'string') {
      try {
        aggregatedHotels = JSON.parse(aggregatedHotels);
      } catch (e) {
        console.error("Error parsing hotels JSON:", e);
        return [];
      }
    }
    
    if (!aggregatedHotels || !Array.isArray(aggregatedHotels)) {
      return [];
    }
    
    return aggregatedHotels.slice(0, 12).map((hotel: any) => {
      // Calculate distance in km (data comes as distance_meters)
      const distanceMeters = hotel.distance_meters || 0;
      const distanceKm = distanceMeters > 0 ? distanceMeters / 1000 : (hotel.distance_km || 0);
      
      return {
        hotel_id: hotel.hotel_id || hotel.id,
        hotel_name: hotel.name || hotel.hotel_name,
        hotel_main_photo: hotel.main_photo || hotel.thumbnail || hotel.hotel_main_photo,
        hotel_description: hotel.hotel_description || hotel.description || "Hotel confortable cerca del venue",
        hotel_stars: hotel.stars || hotel.hotel_stars || 0,
        hotel_rating: hotel.rating || hotel.hotel_rating || 0,
        hotel_reviews: hotel.review_count || hotel.hotel_reviews || 0,
        price: Number(hotel.min_price) || 0,
        selling_price: Number(hotel.ssp_price) || Number(hotel.min_price) || 0,
        distance_km: distanceKm,
        facility_names_es: hotel.facility_names_es || [],
        checkin_date: hotel.checkin_date,
        checkout_date: hotel.checkout_date,
        nights: hotel.nights || 1,
        hotel_address: hotel.address || hotel.hotel_address || "",
        hotel_city: hotel.city || hotel.hotel_city || "",
      };
    });
  })();

  // Get map widget HTML - only use Stay22 map
  const mapWidgetHtml = (eventDetails as any)?.stay22_map_general || null;

  // Clear cart when viewing a different event than what's in the cart
  // This handles both: navigation between events AND page load with stale cart in localStorage
  const prevEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentEventId = eventDetails?.event_id;
    if (!currentEventId) return;
    
    // Check if cart belongs to a different event
    if (cart && cart.event_id !== currentEventId) {
      // Cart has items from a different event - clear it
      clearCart();
    }
    
    prevEventIdRef.current = currentEventId;
  }, [eventDetails?.event_id, cart, clearCart]);

  // Redirect to 404 when event not found - MUST be before any conditional returns
  useEffect(() => {
    if (isError && error instanceof Error && error.message === "Evento no encontrado") {
      navigate("/404", { replace: true });
    }
  }, [isError, error, navigate]);

  // Schema.org is handled by SEOHead with jsonLd prop - no duplicate injection needed
  // Meta tags are now handled by SEOHead component - removed useMetaTags hook to avoid duplicate query

  if (isLoading) {
    return <ProductoSkeleton />;
  }

  if (isError) {
    // If "Evento no encontrado", redirect handled by useEffect above
    if (error instanceof Error && error.message === "Evento no encontrado") {
      return <ProductoSkeleton />;
    }
    
    // Other errors: show error UI
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Card className="max-w-lg mx-auto border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Error al cargar el evento</h2>
                  <p className="text-muted-foreground text-sm">
                    {error instanceof Error ? error.message : "Ha ocurrido un error inesperado"}
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    className="gap-2"
                  >
                    Volver atrás
                  </Button>
                  <Button 
                    onClick={() => refetch()}
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Evento no encontrado</h2>
                  <p className="text-muted-foreground text-sm">
                    El evento que buscas no existe o ha sido eliminado.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/conciertos")}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Ver todos los eventos
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Helper to check placeholder dates
  const isPlaceholderDate = (d: string | null | undefined) => !d || d.startsWith('9999');
  
  const rawEventDate = eventDetails.event_date;
  const hasValidDate = !isPlaceholderDate(rawEventDate);
  const eventDate = hasValidDate && rawEventDate ? new Date(rawEventDate) : new Date();
  const formattedTime = hasValidDate ? format(eventDate, "HH:mm") : null;
  const monthYear = hasValidDate ? format(eventDate, "MMMM yyyy", { locale: es }) : "Fecha por confirmar";
  
  // Calculate countdown only if valid date
  const now = new Date();
  const daysUntil = hasValidDate ? differenceInDays(eventDate, now) : -1;
  const hoursUntil = hasValidDate ? differenceInHours(eventDate, now) % 24 : 0;
  
  const artistNames = eventDetails.attraction_names || [];
  const mainArtist = artistNames[0] || eventDetails.event_name;
  
  // Festival lineup artists - prioritize manual lineup over automatic
  const festivalLineupArtists = isFestivalRoute 
    ? ((eventDetails as any).festival_lineup_artists_manual as string[] | null) 
      || ((eventDetails as any).festival_lineup_artists as string[] | null) 
      || []
    : [];
  
  // Display logic for festivals based on primary/secondary attraction
  // Case A: Full festival pass (secondary = null or same as primary)
  // Case B: Artist-specific entry (secondary = different artist name)
  const primaryAttraction = (eventDetails as any).primary_attraction_name as string | null;
  const secondaryAttraction = (eventDetails as any).secondary_attraction_name as string | null;
  const isArtistEntry = isFestivalRoute && secondaryAttraction && secondaryAttraction !== primaryAttraction;
  
  // For display purposes
  const displayTitle = isArtistEntry ? secondaryAttraction : eventDetails.event_name;
  const displaySubtitle = isArtistEntry ? `en ${primaryAttraction || eventDetails.event_name}` : null;

  // Generate SEO title - optimized for 60 chars: [Artist] en [City] [Year] - Entradas y Hotel
  const eventYear = hasValidDate ? format(eventDate, "yyyy") : '';
  const seoTitle = `${mainArtist} en ${eventDetails.venue_city}${eventYear ? ` ${eventYear}` : ''} - Entradas y Hotel`;
  
  // Generate SEO description - optimized for ~155 chars
  const seoDescription = `Compra entradas para ${mainArtist} en ${eventDetails.venue_city}${eventYear ? ` ${eventYear}` : ''}. Concierto en ${eventDetails.venue_name}. Reserva tu pack de entradas + hotel con Feelomove+.`;

  // Parse ticket prices from ticket_types (JSON string with price_types array containing price_levels)
  const ticketPrices = (() => {
    const rawTicketTypes = (eventDetails as any).ticket_types;
    if (!rawTicketTypes) return [];
    
    try {
      // Parse JSON string if needed
      const ticketData: TicketTypesData = typeof rawTicketTypes === 'string' 
        ? JSON.parse(rawTicketTypes) 
        : rawTicketTypes;
      
      if (!ticketData?.price_types || !Array.isArray(ticketData.price_types)) return [];
      
      // Flatten price_types -> price_levels into individual ticket options
      const tickets: Array<{id: string; type: string; code: string; description: string; price: number; fees: number; availability: string}> = [];
      
      ticketData.price_types.forEach((priceType) => {
        if (priceType.price_levels && Array.isArray(priceType.price_levels)) {
          priceType.price_levels.forEach((level, levelIndex) => {
            const ticketId = `${priceType.code || 'ticket'}-${levelIndex}`;
            // Normalize availability - treat missing/unknown values as "available"
            const rawAvailability = level.availability?.toLowerCase() || "available";
            const normalizedAvailability = rawAvailability === "none" || rawAvailability === "soldout" || rawAvailability === "sold_out" 
              ? "none" 
              : rawAvailability === "limited" 
                ? "limited" 
                : "available";
            
            tickets.push({
              id: ticketId,
              type: priceType.name || level.name || "Entrada General",
              code: priceType.code || "",
              description: priceType.description || "",
              price: Number(level.face_value || 0),
              fees: Number(level.ticket_fees || 0),
              availability: normalizedAvailability
            });
          });
        }
      });
      
      // Sort by: 1. Available first (not sold out), 2. Then by price
      return tickets.sort((a, b) => {
        const aAvailable = a.availability !== "none" ? 0 : 1;
        const bAvailable = b.availability !== "none" ? 0 : 1;
        if (aAvailable !== bAvailable) return aAvailable - bAvailable;
        return a.price - b.price;
      });
    } catch (e) {
      console.error("Error parsing ticket_types:", e);
      return [];
    }
  })();

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 4);
  const hasMoreTickets = ticketPrices.length > 4;
  
  // Calculate if event has VIP tickets from ticket data (more reliable than has_vip_tickets field)
  const hasVipTickets = ticketPrices.some(ticket => 
    /vip/i.test(ticket.type || '') || 
    /vip/i.test(ticket.description || '') || 
    /vip/i.test(ticket.code || '')
  ) || (eventDetails as any).has_vip_tickets;
  
  // Calculate real availability based on ticket data
  const hasAvailableTickets = ticketPrices.some(ticket => ticket.availability !== "none");
  const isEventAvailable = hasAvailableTickets && !eventDetails.sold_out;

  const handleTicketQuantityChange = (ticketId: string, change: number) => {
    const existingTickets = cart?.event_id === eventDetails.event_id ? cart.tickets : [];
    const ticketIndex = existingTickets.findIndex(t => t.type === ticketId);
    
    const ticketData = ticketPrices.find(t => t.id === ticketId);
    if (!ticketData) return;

    let updatedTickets = [...existingTickets];
    
    if (ticketIndex >= 0) {
      // Existing ticket - increment/decrement
      const newQuantity = Math.max(0, Math.min(10, updatedTickets[ticketIndex].quantity + change));
      if (newQuantity === 0) {
        updatedTickets = updatedTickets.filter(t => t.type !== ticketId);
      } else {
        updatedTickets[ticketIndex] = {
          ...updatedTickets[ticketIndex],
          quantity: newQuantity
        };
      }
    } else if (change > 0) {
      // New ticket - start with quantity 1
      updatedTickets.push({
        type: ticketId,
        description: `${ticketData.type} - ${ticketData.description || ticketData.code}`,
        price: ticketData.price,
        fees: ticketData.fees,
        quantity: 1
      });
    }

    if (updatedTickets.length > 0) {
      addTickets(eventDetails.event_id!, eventDetails as any, updatedTickets);
    } else {
      clearCart();
    }
  };

  const getTicketQuantity = (ticketId: string) => {
    if (!cart || cart.event_id !== eventDetails.event_id) return 0;
    const ticket = cart.tickets.find(t => t.type === ticketId);
    return ticket ? ticket.quantity : 0;
  };

  const handleAddHotel = (hotel: any) => {
    const nights = (eventDetails as any).package_nights || 1;
    const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
    addHotel(eventDetails.event_id!, eventDetails, {
      hotel_id: hotel.hotel_id,
      hotel_name: hotel.hotel_name,
      nights: nights,
      price_per_night: pricePerNight,
      total_price: pricePerNight * nights,
      image: hotel.hotel_main_photo || hotel.hotel_thumbnail || "/placeholder.svg",
      description: hotel.hotel_description || "Hotel confortable cerca del venue",
      checkin_date: (eventDetails as any).package_checkin || format(eventDate, "yyyy-MM-dd"),
      checkout_date: (eventDetails as any).package_checkout || format(new Date(eventDate.getTime() + nights * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    });
  };

  const isEventInCart = cart?.event_id === eventDetails.event_id;
  const totalPersons = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalPersons > 0 ? totalPrice / totalPersons : 0;

  // Get image - prioritize image_large_url and optimize for LCP
  // Use optimized Ticketmaster image variant (max 800px width for mobile LCP)
  const rawEventImage = (eventDetails as any).image_large_url || (eventDetails as any).image_standard_url || "/placeholder.svg";
  
  // Optimize Ticketmaster images: replace CUSTOM/large variants with smaller ones
  // Reduces ~2MB images to ~100KB for faster LCP
  const eventImage = (() => {
    if (!rawEventImage || rawEventImage === "/placeholder.svg") return rawEventImage;
    
    // Ticketmaster image optimization: use TABLET_LANDSCAPE_16_9 variant (~800px wide)
    // Patterns: s1.ticketm.net/img/tat/dam/a/xxx/xxx_CUSTOM.jpg -> xxx_TABLET_LANDSCAPE_16_9.jpg
    if (rawEventImage.includes('ticketm.net')) {
      // Replace common large variants with optimized mobile variant
      return rawEventImage
        .replace(/_CUSTOM\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1')
        .replace(/_RETINA_PORTRAIT_16_9\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1')
        .replace(/_RETINA_LANDSCAPE_16_9\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1')
        .replace(/_SOURCE\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1');
    }
    
    return rawEventImage;
  })();

  // Build canonical URL using RPC canonical slug, VIP/Upgrade variant detection, or current slug
  const currentSlug = eventDetails.event_slug || '';
  const eventName = eventDetails.event_name?.toLowerCase() || '';
  
  // Detect VIP/Upgrade variants by slug patterns AND event name keywords
  const vipSlugPatterns = [
    '-paquetes-vip', '-vip', '-upgrade', '-meet-greet', '-pack', '-parking'
  ];
  const vipNameKeywords = [
    'vip', 'upgrade', 'meet & greet', 'meet and greet', 'paquete', 
    'pack', 'parking', 'golden circle', 'premium', 'platinum'
  ];
  
  const hasVipSlugPattern = vipSlugPatterns.some(pattern => currentSlug.includes(pattern));
  const hasVipNameKeyword = vipNameKeywords.some(keyword => eventName.includes(keyword));
  const isVipVariant = hasVipSlugPattern || hasVipNameKeyword;
  
  // Priority: 1. RPC canonical slug, 2. VIP variant cleanup (remove suffix), 3. Current slug
  // For VIP variants, the canonical should point to the main event (same artist, same day)
  const cleanedVipSlug = vipSlugPatterns.reduce(
    (slug, pattern) => slug.replace(new RegExp(pattern + '(-\\d+)?$', 'g'), ''),
    currentSlug
  );
  
  const canonicalSlug = rpcCanonicalSlug 
    ? rpcCanonicalSlug 
    : isVipVariant 
      ? cleanedVipSlug
      : currentSlug;
  
  // Build canonical URL - always use the canonical slug
  const eventType = isFestivalRoute ? 'festival' : 'concierto';
  const canonicalUrl = `/${eventType}/${canonicalSlug}`;
  const absoluteUrl = `https://feelomove.com${canonicalUrl}`;

  // Determine event status for banner and JSON-LD
  const eventStatus = getEventStatus(
    eventDetails.cancelled,
    eventDetails.rescheduled,
    eventDetails.event_date
  );
  
  // Build comprehensive Event JSON-LD using EventSeo component
  const minPrice = ticketPrices[0]?.price || (eventDetails as any).price_min_incl_fees || 0;
  const maxPrice = ticketPrices[ticketPrices.length - 1]?.price || minPrice;
  
  // Create EventSeo props using helper function
  const eventSeoProps = createEventSeoProps(
    {
      event_id: eventDetails.event_id || '',
      event_name: eventDetails.event_name || '',
      event_slug: eventDetails.event_slug,
      event_date: eventDetails.event_date || '',
      festival_end_date: (eventDetails as any).festival_end_date,
      door_opening_date: (eventDetails as any).door_opening_date,
      venue_name: eventDetails.venue_name,
      venue_address: eventDetails.venue_address,
      venue_city: eventDetails.venue_city || '',
      venue_postal_code: eventDetails.venue_postal_code,
      venue_latitude: eventDetails.venue_latitude,
      venue_longitude: eventDetails.venue_longitude,
      venue_url: (eventDetails as any).venue_url,
      image_large_url: eventDetails.image_large_url,
      image_standard_url: eventDetails.image_standard_url,
      attraction_names: eventDetails.attraction_names,
      price_min_incl_fees: minPrice,
      price_max_incl_fees: maxPrice,
      on_sale_date: (eventDetails as any).on_sale_date,
      sold_out: eventDetails.sold_out,
      cancelled: eventDetails.cancelled,
      rescheduled: eventDetails.rescheduled,
      is_festival: eventDetails.is_festival,
    },
    {
      description: seoDescription,
      url: absoluteUrl,
      status: eventStatus,
      isEventAvailable,
    }
  );

  return (
    <>
      {/* EventSeo component injects JSON-LD structured data - lazy loaded */}
      <Suspense fallback={null}>
        <EventSeo {...eventSeoProps} />
      </Suspense>
      
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={absoluteUrl}
        ogImage={eventImage}
        ogType="event"
        keywords={`${mainArtist}, ${eventDetails.venue_city}, concierto, entradas, hotel, ${eventDetails.event_name}`}
        pageType="ItemPage"
        preloadImage={eventImage}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: eventDetails.is_festival ? "Festivales" : "Conciertos", url: eventDetails.is_festival ? "/festivales" : "/conciertos" },
          // For concerts: link to artist profile; for festivals: link to destination
          ...(eventDetails.is_festival 
            ? [{ name: eventDetails.venue_city || "", url: `/destinos/${(eventDetails.venue_city || "").toLowerCase().replace(/\s+/g, '-')}` }]
            : mainArtist 
              ? [{ name: mainArtist, url: `/artista/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` }]
              : []
          ),
          { name: eventDetails.is_festival ? eventDetails.event_name || "" : eventDetails.venue_city || "" }
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 mt-20">
          {/* Breadcrumbs above hero */}
          <Breadcrumbs />
          
          {/* Event Status Banner for cancelled, rescheduled, or past events - lazy loaded */}
          <Suspense fallback={null}>
            <EventStatusBanner 
              status={eventStatus} 
              eventName={eventDetails.event_name || ''} 
              eventDate={eventDetails.event_date || ''}
            />
          </Suspense>
          
          {/* Single H1 for SEO - screen reader accessible, visually hidden on mobile */}
          <h1 className="sr-only">
            {displayTitle}{displaySubtitle ? ` ${displaySubtitle}` : ''}
          </h1>
          
          {/* Mobile: Event Name above hero - decorative visual title */}
          <div className="md:hidden mb-3">
            <p className="text-xl font-black text-foreground leading-tight" aria-hidden="true">
              {displayTitle}
            </p>
            {displaySubtitle && (
              <p className="text-sm text-muted-foreground font-medium mt-1" aria-hidden="true">
                {displaySubtitle}
              </p>
            )}
          </div>
          
          {/* Hero Section */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            {/* Background Image */}
            <div className="relative h-[200px] sm:h-[340px] md:h-[420px]">
              <img
                src={eventImage}
                alt={eventDetails.event_name || "Evento"}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
                // @ts-expect-error - fetchpriority is valid HTML but React doesn't recognize camelCase
                fetchpriority="high"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Mobile: Compact date/city badge */}
              <div className="absolute left-2 bottom-2 sm:hidden">
                <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-2.5 py-2 flex items-center gap-2">
                  <div className="text-center border-r border-border pr-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {format(eventDate, "MMM", { locale: es })}
                    </p>
                    <p className="text-xl font-black text-foreground leading-none">
                      {format(eventDate, "dd")}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{formattedTime}h</p>
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="text-[10px] font-medium">{eventDetails.venue_city}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Full Date Card with Venue */}
              <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 hidden sm:block">
                <div className="bg-card rounded-xl shadow-lg p-4 sm:p-5 md:p-6 min-w-[140px] sm:min-w-[160px] md:min-w-[180px]">
                  <div className="text-center">
                    <p className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-wider">
                      {format(eventDate, "MMM", { locale: es })}
                    </p>
                    <p className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground leading-none my-1 sm:my-2">
                      {format(eventDate, "dd")}
                    </p>
                    <p className="text-base sm:text-lg font-medium text-muted-foreground">
                      {format(eventDate, "yyyy")}
                    </p>
                    <div className="border-t border-border mt-3 pt-3 sm:mt-4 sm:pt-4">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formattedTime}h</p>
                      <div className="flex flex-col items-center gap-1 mt-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm sm:text-base font-bold">{eventDetails.venue_city}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 text-center max-w-[120px] sm:max-w-[140px]">{eventDetails.venue_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Center - Event Name with Lineup (for festivals) and Favorite above */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center max-w-[55%] sm:max-w-[50%] md:max-w-[45%] hidden sm:block">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-white/20 hover:bg-white/30 flex-shrink-0 backdrop-blur-sm"
                    onClick={() => toggleFavorite({
                      event_id: eventDetails.event_id!,
                      event_name: eventDetails.event_name || '',
                      event_slug: eventDetails.event_slug || '',
                      event_date: eventDetails.event_date || '',
                      venue_city: eventDetails.venue_city || '',
                      image_url: eventImage
                    })}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${isFavorite(eventDetails.event_id!) ? 'fill-accent text-accent' : 'text-white'}`} />
                  </Button>
                  {/* Desktop title display - decorative since H1 is above hero */}
                  <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg" aria-hidden="true">
                    {displayTitle}
                  </p>
                  {displaySubtitle && (
                    <p className="text-sm sm:text-base md:text-lg text-white/80 font-medium drop-shadow-md">
                      {displaySubtitle}
                    </p>
                  )}
                  {/* Lineup for festivals - below event name */}
                  {isFestivalRoute && festivalLineupArtists.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full mt-3">
                      {festivalLineupArtists.map((artist, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs sm:text-sm md:text-base text-white/90 font-semibold drop-shadow-md px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full"
                        >
                          {artist}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile: Favorite button and vertical badges */}
              <div className="absolute right-2 top-2 bottom-2 sm:hidden flex flex-col items-end justify-between">
                {/* Favorite button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                  onClick={() => toggleFavorite({
                    event_id: eventDetails.event_id!,
                    event_name: eventDetails.event_name || '',
                    event_slug: eventDetails.event_slug || '',
                    event_date: eventDetails.event_date || '',
                    venue_city: eventDetails.venue_city || '',
                    image_url: eventImage
                  })}
                >
                  <Heart className={`h-4 w-4 ${isFavorite(eventDetails.event_id!) ? 'fill-accent text-accent' : 'text-white'}`} />
                </Button>
                
                {/* Vertical badges */}
                <div className="flex flex-col gap-1 items-end">
                  {eventDetails.sold_out && (
                    <Badge className="bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5">AGOTADO</Badge>
                  )}

                  {hasVipTickets && (
                    <Badge variant="outline" className="bg-background/80 text-[9px] px-1.5 py-0.5">VIP</Badge>
                  )}
                </div>
              </div>
              
              {/* Desktop: Right Side - Badges and Event Image */}
              <div className="absolute right-3 top-3 bottom-3 sm:right-4 sm:top-4 sm:bottom-4 hidden sm:flex flex-col items-end justify-between">
                {/* Badges - collapsible on mobile - lazy loaded */}
                <Suspense fallback={<div className="h-8" />}>
                  <CollapsibleBadges eventDetails={eventDetails} hasVipTickets={hasVipTickets} isEventAvailable={isEventAvailable} daysUntil={daysUntil} />
                </Suspense>
                
                {/* Event Image with hover zoom */}
                <div className="flex flex-col items-end gap-2 mb-6">
                  <div className="overflow-hidden rounded-xl shadow-2xl border-4 border-background group">
                    <img
                      src={(eventDetails as any).image_large_url || eventImage}
                      alt={eventDetails.event_name || "Evento"}
                      className="w-[150px] h-[200px] md:w-[225px] md:h-[305px] object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Ticket Cards - List Format */}
              {ticketPrices.length > 0 && (
                <div>
                  {/* Section Header with Step Number */}
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isEventInCart && totalPersons > 0 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-foreground text-background"
                    }`}>
                      {isEventInCart && totalPersons > 0 ? <Check className="h-4 w-4" /> : "1"}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">Selecciona tus entradas</h2>
                      {isEventInCart && totalPersons > 0 && (
                        <p className="text-sm text-foreground flex items-center gap-1 mt-0.5">
                          <Check className="h-3 w-3 text-accent" />
                          ¡Entradas añadidas! Ahora elige tu alojamiento abajo
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {displayedTickets.map((ticket: any) => {
                      const quantity = getTicketQuantity(ticket.id);
                      const isSoldOut = ticket.availability === "none";
                      const isLimited = ticket.availability === "limited";
                      const isVIP = /vip/i.test(ticket.type || '') || /vip/i.test(ticket.description || '') || /vip/i.test(ticket.code || '');
                      
                      return (
                        <Card 
                          key={ticket.id} 
                          className={`border-2 overflow-hidden transition-all ${
                            isSoldOut 
                              ? 'opacity-60 border-muted' 
                              : quantity > 0 
                                ? 'border-accent shadow-lg shadow-accent/20' 
                                : 'hover:border-accent/50'
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start sm:items-center justify-between gap-3">
                              {/* Left: Ticket info */}
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {isVIP && (
                                    <span className="text-[10px] font-bold text-white bg-foreground px-2 py-0.5 rounded">
                                      VIP
                                    </span>
                                  )}
                                  {isSoldOut ? (
                                    <span className="text-[10px] font-bold text-destructive bg-destructive/15 px-2 py-0.5 rounded border border-destructive/30">
                                      AGOTADO
                                    </span>
                                  ) : isLimited ? (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 dark:text-amber-200 dark:bg-amber-900/50 dark:border-amber-700">
                                      ÚLTIMAS
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 dark:text-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700">
                                      DISPONIBLE
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm sm:text-base font-bold uppercase text-foreground">
                                  {ticket.type}
                                </p>
                                {ticket.description && ticket.description !== ticket.type && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">
                                    {ticket.description}
                                  </p>
                                )}
                              </div>

                              {/* Right: Price stacked above Quantity Selector */}
                              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                {/* Price */}
                                <div className="text-center">
                                  <span className="text-xl sm:text-2xl font-black text-foreground">
                                    €{ticket.price.toFixed(0)}
                                  </span>
                                  {ticket.fees > 0 && (
                                    <p className="text-[10px] text-muted-foreground">
                                      + €{ticket.fees.toFixed(2)} gastos
                                    </p>
                                  )}
                                </div>

                                {/* Quantity Selector */}
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/50 rounded-full p-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ticket-qty-decrease h-7 w-7 sm:h-9 sm:w-9 rounded-full hover:bg-background hover:text-foreground transition-colors disabled:opacity-30"
                                    onClick={() => handleTicketQuantityChange(ticket.id, -1)}
                                    disabled={quantity === 0 || isSoldOut}
                                    aria-label={`Reducir cantidad de ${ticket.type}`}
                                    data-ticket-type={ticket.type}
                                  >
                                    <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center font-bold text-base sm:text-lg">{quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ticket-qty-increase h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground transition-colors disabled:opacity-30"
                                    onClick={() => handleTicketQuantityChange(ticket.id, 1)}
                                    disabled={quantity >= 10 || isSoldOut}
                                    aria-label={`Aumentar cantidad de ${ticket.type}`}
                                    data-ticket-type={ticket.type}
                                  >
                                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {hasMoreTickets && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllTickets(!showAllTickets)}
                        className="border-2 hover:border-accent hover:text-accent font-bold px-8"
                      >
                        {showAllTickets ? "Ver menos" : `Ver ${ticketPrices.length - 4} más`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Hotels & Map Section with Tabs - LAZY LOADED */}
              {(hotels.length > 0 || mapWidgetHtml || (eventDetails as any)?.stay22_accommodations || (eventDetails as any)?.stay22_activities) && (
                <LazySection minHeight="400px" rootMargin="300px">
                  <div id="hotels-section">
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-muted/30 rounded-xl" />}>
                      <HotelMapTabs 
                        hotels={hotels} 
                        mapWidgetHtml={mapWidgetHtml} 
                        onAddHotel={handleAddHotel}
                        checkinDate={(eventDetails as any).package_checkin || format(eventDate, "yyyy-MM-dd")}
                        checkoutDate={(eventDetails as any).package_checkout || format(new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")}
                        eventName={eventDetails.event_name || undefined}
                        ticketsSelected={isEventInCart && totalPersons > 0}
                        selectedHotelId={cart?.hotel?.hotel_id || null}
                        venueCity={eventDetails.venue_city || ""}
                        stay22Accommodations={(eventDetails as any)?.stay22_accommodations || null}
                        stay22Activities={(eventDetails as any)?.stay22_activities || null}
                      />
                    </Suspense>
                  </div>
                </LazySection>
              )}
            </div>

            {/* Sidebar - Shopping Cart (Hidden on mobile/tablet, replaced by MobileCartBar) */}
            <div className="hidden xl:block xl:col-span-1">
              <Card className="sticky top-24 border-2">
                <CardHeader className="bg-foreground text-background">
                  <CardTitle className="uppercase tracking-wide text-sm flex items-center gap-2">
                    Tu Pack
                    {isEventInCart && cart?.hotel && (
                      <span className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
                        COMPLETO
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {isEventInCart && cart ? (
                    <>
                      {/* Event Info */}
                      <div className="mb-4">
                        <p className="text-sm font-bold text-foreground">
                          {eventDetails.event_name}
                        </p>
                      </div>

                      {/* Pack complete success */}
                      {cart.hotel && totalPersons > 0 && (
                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-4">
                          <p className="text-xs text-foreground font-medium flex items-center gap-2">
                            <Check className="h-3 w-3 text-accent" />
                            ¡Pack completo! Entradas + Hotel
                          </p>
                        </div>
                      )}

                      {/* Tickets in cart */}
                      {cart.tickets.map((ticket, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Ticket className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">Entrada</span>
                              </div>
                              <h3 className="font-bold text-sm">{ticket.type}</h3>
                              {ticket.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeTicket(ticket.type)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Cantidad:</span>
                            <span className="font-bold">{ticket.quantity}</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold">€{((ticket.price + ticket.fees) * ticket.quantity).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                              €{ticket.price.toFixed(2)} + €{ticket.fees.toFixed(2)} gastos
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Reserve tickets button */}
                      <Button
                        variant="default"
                        className="w-full h-10 text-sm bg-accent text-accent-foreground hover:bg-accent/90"
                        asChild
                      >
                        <a href={(eventDetails as any).event_url || "#"} target="_blank" rel="noopener noreferrer">
                          Reservar Entradas
                        </a>
                      </Button>

                      {/* Hotel in cart */}
                      {cart.hotel && (
                        <>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] uppercase text-muted-foreground font-medium">Hotel</span>
                                </div>
                                <h3 className="font-bold text-sm">{cart.hotel.hotel_name}</h3>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={removeHotel}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground mb-2">
                              {cart.hotel.checkin_date && cart.hotel.checkout_date && (
                                <p>
                                  {new Date(cart.hotel.checkin_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(cart.hotel.checkout_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                              <p>{cart.hotel.nights} noches · 2 huéspedes</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">€{cart.hotel.total_price.toFixed(2)}</div>
                            </div>
                          </div>

                      {/* Reserve hotel button with deeplink */}
                          <Button 
                            className="w-full h-10 text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                            asChild
                          >
                            <a href={(eventDetails as any).destination_deeplink || "#"} target="_blank" rel="noopener noreferrer">
                              Reservar Hotel
                            </a>
                          </Button>
                        </>
                      )}

                      {/* Summary - Inverted: Por persona grande, Total pequeño */}
                      <div className="pt-4 border-t-2 space-y-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Total por persona</p>
                          <span className="text-3xl font-black text-foreground">€{pricePerPerson.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-muted-foreground">Total ({totalPersons} personas)</span>
                          <span className="text-base font-bold text-accent">€{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Ticket className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium mb-2">
                        Empieza seleccionando tus entradas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Elige las entradas y después añade un hotel para completar tu pack
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Mobile Cart Bar - lazy loaded (below fold interaction) */}
        <Suspense fallback={null}>
          <MobileCartBar 
            eventId={eventDetails.event_id || undefined}
            eventUrl={(eventDetails as any).event_url}
            hotelUrl={(eventDetails as any).destination_deeplink}
            eventName={eventDetails.event_name || undefined}
          />
        </Suspense>

        {/* Add padding at bottom for mobile/tablet cart bar */}
        <div className="h-20 xl:hidden" />
        
        {/* Related Links for SEO - LAZY LOADED */}
        <LazySection minHeight="200px" rootMargin="400px">
          <div className="container mx-auto px-4 pb-8">
            <Suspense fallback={<div className="h-[150px] animate-pulse bg-muted/30 rounded-xl" />}>
              <RelatedLinks slug={slug || ''} type="event" />
            </Suspense>
          </div>
        </LazySection>
        
        {/* Footer - LAZY LOADED */}
        <Suspense fallback={<div className="h-[200px] bg-muted/30" />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default Producto;
