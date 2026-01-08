import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
// Schema.org is now handled directly by SEOHead component with dynamic jsonLd prop
import { useMetaTags } from "@/hooks/useMetaTags";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import HotelCard from "@/components/HotelCard";
import HotelMapTabs from "@/components/HotelMapTabs";
import ProductoSkeleton from "@/components/ProductoSkeleton";
import MobileCartBar from "@/components/MobileCartBar";
import CollapsibleBadges from "@/components/CollapsibleBadges";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, Plus, Minus, MapPin, AlertCircle, RefreshCw, Check, ArrowDown, Ticket, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart, CartTicket } from "@/contexts/CartContext";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { handleLegacyRedirect } from "@/utils/redirects";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";
import { getEventUrl } from "@/lib/eventUtils";
import { RelatedLinks } from "@/components/RelatedLinks";

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

  // State to store canonical slug from RPC
  const [rpcCanonicalSlug, setRpcCanonicalSlug] = useState<string | null>(null);

  // Fetch event details from specific views based on route type
  const { data: eventData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event-product-page", slug, isFestivalRoute],
    queryFn: async () => {
      if (!slug) throw new Error("No se proporcionó el identificador del evento");
      
      // Check for canonical slug redirect FIRST
      const { data: canonicalSlug, error: rpcError } = await supabase
        .rpc('get_canonical_slug' as any, { input_slug: slug });
      
      // Store the canonical slug for SEO purposes
      if (!rpcError && canonicalSlug) {
        setRpcCanonicalSlug(canonicalSlug);
      }
      
      // If we have a different canonical slug, redirect 301
      if (!rpcError && canonicalSlug && canonicalSlug !== slug) {
        const redirectPath = isFestivalRoute 
          ? `/festival/${canonicalSlug}` 
          : `/concierto/${canonicalSlug}`;
        navigate(redirectPath, { replace: true });
        return null; // Stop execution, redirect will happen
      }
      
      // Use specific view based on route type
      const viewName = isFestivalRoute 
        ? "lovable_mv_event_product_page_festivales" 
        : isConcierto 
          ? "lovable_mv_event_product_page_conciertos"
          : "lovable_mv_event_product_page"; // Fallback for legacy routes
      
      const { data, error } = await supabase
        .from(viewName)
        .select("*")
        .eq("event_slug", slug);
      
      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Error al cargar el evento: ${error.message}`);
      }
      
      // Event found - check if valid (not cancelled, not past)
      if (data && data.length > 0) {
        const event = data[0] as any;
        
        // Check if event is cancelled
        if (event.cancelled === true) {
          navigate("/404", { replace: true });
          return null;
        }
        
        // Check if event has passed (only if it has a valid date)
        const eventDate = event.event_date;
        if (eventDate && !eventDate.startsWith('9999')) {
          const eventDateTime = new Date(eventDate);
          const now = new Date();
          if (eventDateTime < now) {
            navigate("/404", { replace: true });
            return null;
          }
        }
        
        return data;
      }
      
      // No event found - try the general view as fallback before giving up
      if (viewName !== "lovable_mv_event_product_page") {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("lovable_mv_event_product_page")
          .select("*")
          .eq("event_slug", slug);
        
        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          return fallbackData;
        }
      }
      
      // Still not found - try legacy redirect
      if (slug) {
        const redirected = await handleLegacyRedirect(slug, navigate);
        if (redirected) return null;
      }
      
      throw new Error("Evento no encontrado");
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
    staleTime: 30000, // Cache for 30 seconds to prevent refetching on navigation
  });


  // Process data - first row has event details
  const eventDetails = eventData?.[0] as unknown as EventProductPage | null;
  
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

  // Get map widget HTML
  const mapWidgetHtml = (eventDetails as any)?.map_widget_html || null;

  // Clear cart when changing events
  useEffect(() => {
    if (cart && eventDetails && cart.event_id !== eventDetails.event_id) {
      clearCart();
    }
  }, [eventDetails, cart, clearCart]);

  // Redirect to 404 when event not found - MUST be before any conditional returns
  useEffect(() => {
    if (isError && error instanceof Error && error.message === "Evento no encontrado") {
      navigate("/404", { replace: true });
    }
  }, [isError, error, navigate]);

  // Schema.org is handled by SEOHead with jsonLd prop - no duplicate injection needed
  
  // Inject Open Graph and meta tags from materialized view
  useMetaTags(slug);

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
  
  // Festival lineup artists - use festival_lineup_artists from the festival view
  const festivalLineupArtists = isFestivalRoute && (eventDetails as any).festival_lineup_artists 
    ? (eventDetails as any).festival_lineup_artists as string[]
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

  // Generate SEO description
  const seoDescription = `Disfruta de ${mainArtist} en ${eventDetails.venue_city} este ${monthYear}. Consigue tus entradas para ${eventDetails.event_name} en ${eventDetails.venue_name}. Vive una experiencia única con la mejor música en directo. Reserva ahora tus entradas y hoteles con Feelomove+.`;

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
            tickets.push({
              id: ticketId,
              type: priceType.name || level.name || "Entrada General",
              code: priceType.code || "",
              description: priceType.description || "",
              price: Number(level.face_value || 0),
              fees: Number(level.ticket_fees || 0),
              availability: level.availability || "available"
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

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 8);
  const hasMoreTickets = ticketPrices.length > 8;
  
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
      updatedTickets.push({
        type: ticketId,
        description: `${ticketData.type} - ${ticketData.description || ticketData.code}`,
        price: ticketData.price,
        fees: ticketData.fees,
        quantity: 2
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

  // Get image - prioritize image_large_url
  const eventImage = (eventDetails as any).image_large_url || (eventDetails as any).image_standard_url || "/placeholder.svg";

  // Build canonical URL using RPC canonical slug, VIP variant detection, or current slug
  const currentSlug = eventDetails.event_slug || '';
  const isVipVariant = currentSlug.includes('-paquetes-vip') || currentSlug.includes('-vip');
  
  // Priority: 1. RPC canonical slug, 2. VIP variant cleanup, 3. Current slug
  const canonicalSlug = rpcCanonicalSlug 
    ? rpcCanonicalSlug 
    : isVipVariant 
      ? currentSlug.replace(/-paquetes-vip|-vip/g, '') 
      : currentSlug;
  
  // Build canonical URL - always use the canonical slug
  const eventType = isFestivalRoute ? 'festival' : 'concierto';
  const canonicalUrl = `/${eventType}/${canonicalSlug}`;
  const absoluteUrl = `https://feelomove.com${canonicalUrl}`;

  // Build comprehensive Event JSON-LD for Google Rich Results
  const minPrice = ticketPrices[0]?.price || (eventDetails as any).price_min_incl_fees || 0;
  const maxPrice = ticketPrices[ticketPrices.length - 1]?.price || minPrice;
  
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": eventDetails.is_festival ? "Festival" : "MusicEvent",
    "@id": absoluteUrl,
    "name": eventDetails.event_name,
    "description": seoDescription,
    "startDate": eventDetails.event_date,
    "endDate": (eventDetails as any).festival_end_date || eventDetails.event_date,
    "doorTime": (eventDetails as any).door_opening_date || undefined,
    "eventStatus": eventDetails.cancelled 
      ? "https://schema.org/EventCancelled" 
      : eventDetails.rescheduled 
        ? "https://schema.org/EventRescheduled"
        : "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "url": absoluteUrl,
    "image": [eventImage],
    "location": {
      "@type": "Place",
      "name": eventDetails.venue_name || "Venue",
      "url": (eventDetails as any).venue_url || undefined,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": eventDetails.venue_address || eventDetails.venue_name || "Recinto del evento",
        "addressLocality": eventDetails.venue_city,
        "addressRegion": "España",
        "postalCode": eventDetails.venue_postal_code || undefined,
        "addressCountry": "ES"
      },
      "geo": eventDetails.venue_latitude && eventDetails.venue_longitude ? {
        "@type": "GeoCoordinates",
        "latitude": eventDetails.venue_latitude,
        "longitude": eventDetails.venue_longitude
      } : undefined
    },
    "organizer": {
      "@type": "Organization",
      "name": "FEELOMOVE+",
      "url": "https://feelomove.com"
    },
    "offers": {
      "@type": "AggregateOffer",
      "url": absoluteUrl,
      "lowPrice": minPrice > 0 ? minPrice : 0,
      "highPrice": maxPrice > 0 ? maxPrice : minPrice > 0 ? minPrice : 0,
      "priceCurrency": "EUR",
      "availability": eventDetails.sold_out 
        ? "https://schema.org/SoldOut" 
        : isEventAvailable 
          ? "https://schema.org/InStock" 
          : "https://schema.org/PreOrder",
      "offerCount": ticketPrices.length || 1,
      "validFrom": (eventDetails as any).on_sale_date || new Date().toISOString(),
      "seller": {
        "@type": "Organization",
        "name": "FEELOMOVE+",
        "url": "https://feelomove.com"
      }
    },
    "performer": artistNames.length > 0 ? artistNames.map((name: string) => ({
      "@type": "MusicGroup",
      "name": name
    })) : undefined,
    "inLanguage": "es"
  };

  return (
    <>
      <SEOHead
        title={`${eventDetails.event_name} - Entradas y Hotel`}
        description={seoDescription}
        canonical={canonicalUrl}
        ogImage={eventImage}
        ogType="event"
        keywords={`${mainArtist}, ${eventDetails.venue_city}, concierto, entradas, hotel, ${eventDetails.event_name}`}
        pageType="ItemPage"
        jsonLd={jsonLdData}
        preloadImage={eventImage}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: eventDetails.is_festival ? "Festivales" : "Conciertos", url: eventDetails.is_festival ? "/festivales" : "/conciertos" },
          { name: eventDetails.venue_city || "", url: `/destinos/${(eventDetails.venue_city || "").toLowerCase().replace(/\s+/g, '-')}` },
          { name: eventDetails.event_name || "" }
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 mt-20">
          {/* Breadcrumbs above hero */}
          <Breadcrumbs />
          
          {/* Mobile: Countdown + Event Name above hero */}
          <div className="md:hidden mb-3">
            {/* Countdown timer if last week - mobile */}
            {daysUntil >= 0 && daysUntil < 7 && (
              <div className="bg-accent/10 rounded-lg px-3 py-2 flex items-center justify-center gap-3 border border-accent/30 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Faltan</span>
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <span className="text-lg font-black text-accent">{String(daysUntil).padStart(2, '0')}</span>
                    <span className="text-[9px] uppercase text-muted-foreground ml-0.5">días</span>
                  </div>
                  <span className="text-accent font-bold">:</span>
                  <div className="text-center">
                    <span className="text-lg font-black text-accent">{String(hoursUntil).padStart(2, '0')}</span>
                    <span className="text-[9px] uppercase text-muted-foreground ml-0.5">hrs</span>
                  </div>
                </div>
              </div>
            )}
            {/* Event title - mobile */}
            <h1 className="text-xl font-black text-foreground leading-tight">
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-sm text-muted-foreground font-medium mt-1">
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
                fetchPriority="high"
                loading="eager"
                decoding="sync"
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
                  {/* Lineup for festivals - prominent display above event name */}
                  {isFestivalRoute && festivalLineupArtists.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full">
                      {festivalLineupArtists.slice(0, 6).map((artist, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs sm:text-sm md:text-base text-white/90 font-semibold drop-shadow-md px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full"
                        >
                          {artist}
                        </span>
                      ))}
                      {festivalLineupArtists.length > 6 && (
                        <span className="text-xs sm:text-sm md:text-base text-white/70 font-medium drop-shadow-md px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full">
                          +{festivalLineupArtists.length - 6} más
                        </span>
                      )}
                    </div>
                  )}
                  {/* Title and optional subtitle for artist entries */}
                  <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg">
                    {displayTitle}
                  </h1>
                  {displaySubtitle && (
                    <p className="text-sm sm:text-base md:text-lg text-white/80 font-medium drop-shadow-md">
                      {displaySubtitle}
                    </p>
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
                  {!eventDetails.sold_out && daysUntil >= 0 && daysUntil <= 7 && (
                    <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5">¡ÚLTIMA SEMANA!</Badge>
                  )}
                  {hasVipTickets && (
                    <Badge variant="outline" className="bg-background/80 text-[9px] px-1.5 py-0.5">VIP</Badge>
                  )}
                </div>
              </div>
              
              {/* Desktop: Right Side - Badges and Event Image */}
              <div className="absolute right-3 top-3 bottom-3 sm:right-4 sm:top-4 sm:bottom-4 hidden sm:flex flex-col items-end justify-between">
                {/* Badges - collapsible on mobile */}
                <CollapsibleBadges eventDetails={eventDetails} hasVipTickets={hasVipTickets} isEventAvailable={isEventAvailable} daysUntil={daysUntil} />
                
                {/* Event Image with hover zoom */}
                <div className="flex flex-col items-end gap-2">
                  {/* Countdown timer if last week */}
                  {daysUntil >= 0 && daysUntil < 7 && (
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 flex items-center gap-1.5 sm:gap-2 md:gap-3 border-2 border-accent">
                      <div className="text-center">
                        <span className="text-base sm:text-lg md:text-2xl lg:text-3xl font-black text-accent">{String(daysUntil).padStart(2, '0')}</span>
                        <p className="text-[7px] sm:text-[8px] md:text-[10px] uppercase text-muted-foreground font-medium">Días</p>
                      </div>
                      <span className="text-base sm:text-lg md:text-2xl text-accent font-bold">:</span>
                      <div className="text-center">
                        <span className="text-base sm:text-lg md:text-2xl lg:text-3xl font-black text-accent">{String(hoursUntil).padStart(2, '0')}</span>
                        <p className="text-[7px] sm:text-[8px] md:text-[10px] uppercase text-muted-foreground font-medium">Hrs</p>
                      </div>
                    </div>
                  )}
                  
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
                                    className="h-7 w-7 sm:h-9 sm:w-9 rounded-full hover:bg-background hover:text-foreground transition-colors disabled:opacity-30"
                                    onClick={() => handleTicketQuantityChange(ticket.id, -1)}
                                    disabled={quantity === 0 || isSoldOut}
                                    aria-label={`Reducir cantidad de ${ticket.type}`}
                                  >
                                    <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center font-bold text-base sm:text-lg">{quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground transition-colors disabled:opacity-30"
                                    onClick={() => handleTicketQuantityChange(ticket.id, 1)}
                                    disabled={quantity >= 10 || isSoldOut}
                                    aria-label={`Aumentar cantidad de ${ticket.type}`}
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
                        {showAllTickets ? "Ver menos" : `Ver ${ticketPrices.length - 8} más`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Hotels & Map Section with Tabs */}
              {(hotels.length > 0 || mapWidgetHtml || (eventDetails as any)?.hotels_list_widget_html) && (
                <div id="hotels-section">
                  <HotelMapTabs 
                    hotels={hotels} 
                    mapWidgetHtml={mapWidgetHtml} 
                    hotelsListWidgetHtml={(eventDetails as any)?.hotels_list_widget_html}
                    onAddHotel={handleAddHotel}
                    checkinDate={(eventDetails as any).package_checkin || format(eventDate, "yyyy-MM-dd")}
                    checkoutDate={(eventDetails as any).package_checkout || format(new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")}
                    eventName={eventDetails.event_name || undefined}
                    ticketsSelected={isEventInCart && totalPersons > 0}
                    selectedHotelId={cart?.hotel?.hotel_id || null}
                  />
                </div>
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
                              <p>{cart.hotel.nights} noches · {getTotalTickets()} huéspedes</p>
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

        {/* Mobile Cart Bar */}
        <MobileCartBar 
          eventUrl={(eventDetails as any).event_url}
          hotelUrl={(eventDetails as any).destination_deeplink}
          eventName={eventDetails.event_name || undefined}
        />

        {/* Add padding at bottom for mobile/tablet cart bar */}
        <div className="h-20 xl:hidden" />
        
        {/* Related Links for SEO */}
        <div className="container mx-auto px-4 pb-8">
          <RelatedLinks slug={slug || ''} type="event" />
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default Producto;
