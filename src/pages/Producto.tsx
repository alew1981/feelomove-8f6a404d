import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import HotelCard from "@/components/HotelCard";
import HotelMapTabs from "@/components/HotelMapTabs";
import ProductoSkeleton from "@/components/ProductoSkeleton";
import MobileCartBar from "@/components/MobileCartBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, Plus, Minus, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart, CartTicket } from "@/contexts/CartContext";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { handleLegacyRedirect } from "@/utils/redirects";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";

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
}

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();
  
  const [showAllTickets, setShowAllTickets] = useState(false);

  // Fetch event details from lovable_mv_event_product_page
  const { data: eventData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event-product-page", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No se proporcionó el identificador del evento");
      
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page")
        .select("*")
        .eq("event_slug", slug);
      
      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Error al cargar el evento: ${error.message}`);
      }
      
      // If no event found with slug, try legacy redirect
      if ((!data || data.length === 0) && slug) {
        const redirected = await handleLegacyRedirect(slug, navigate);
        if (redirected) return null;
        throw new Error("Evento no encontrado");
      }
      
      return data;
    },
    retry: 2,
    retryDelay: 1000,
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
    
    return aggregatedHotels.slice(0, 10).map((hotel: any) => {
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

  if (isLoading) {
    return <ProductoSkeleton />;
  }

  if (isError) {
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

  const eventDate = eventDetails.event_date ? new Date(eventDetails.event_date) : new Date();
  const formattedTime = format(eventDate, "HH:mm");
  const monthYear = format(eventDate, "MMMM yyyy", { locale: es });
  
  // Calculate countdown
  const now = new Date();
  const daysUntil = differenceInDays(eventDate, now);
  const hoursUntil = differenceInHours(eventDate, now) % 24;
  
  const artistNames = eventDetails.attraction_names || [];
  const mainArtist = artistNames[0] || eventDetails.event_name;

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
      
      return tickets.sort((a, b) => a.price - b.price);
    } catch (e) {
      console.error("Error parsing ticket_types:", e);
      return [];
    }
  })();

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 8);
  const hasMoreTickets = ticketPrices.length > 8;

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
    const nights = (eventDetails as any).package_nights || 2;
    const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
    addHotel(eventDetails.event_id!, {
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
    toast.success("Hotel añadido al carrito");
  };

  const isEventInCart = cart?.event_id === eventDetails.event_id;
  const totalPersons = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalPersons > 0 ? totalPrice / totalPersons : 0;

  // Get image - prioritize image_large_url
  const eventImage = (eventDetails as any).image_large_url || (eventDetails as any).image_standard_url || "/placeholder.svg";

  return (
    <>
      <SEOHead
        title={`${eventDetails.event_name} - Entradas y Hotel`}
        description={seoDescription}
        canonical={`/producto/${eventDetails.event_slug}`}
        ogImage={eventImage}
        ogType="event"
        keywords={`${mainArtist}, ${eventDetails.venue_city}, concierto, entradas, hotel, ${eventDetails.event_name}`}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 mt-20">
          {/* Breadcrumbs above hero */}
          <Breadcrumbs />
          
          {/* Hero Section */}
          <div className="relative rounded-2xl overflow-hidden mb-8 mt-4">
            {/* Background Image */}
            <div className="relative h-[380px] sm:h-[420px] md:h-[500px]">
              <img
                src={eventImage}
                alt={eventDetails.event_name || "Evento"}
                className="w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Availability Badge - Top Left */}
              <div className="absolute top-4 left-4">
                {!eventDetails.sold_out && eventDetails.seats_available && (
                  <Badge className="bg-accent text-accent-foreground font-black px-4 py-2 text-sm rounded-full">
                    DISPONIBLE
                  </Badge>
                )}
                {eventDetails.sold_out && (
                  <Badge className="bg-destructive text-destructive-foreground font-black px-4 py-2 text-sm rounded-full">
                    AGOTADO
                  </Badge>
                )}
              </div>

              {/* Countdown Badge + Urgency Badge - Top Right - Only show if less than 7 days */}
              {daysUntil >= 0 && daysUntil < 7 && (
                <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col items-end gap-2">
                  {/* Urgency Badge */}
                  <Badge className="bg-destructive text-destructive-foreground font-black px-3 py-1 text-xs md:text-sm animate-pulse">
                    ¡ÚLTIMA SEMANA!
                  </Badge>
                  {/* Countdown */}
                  <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 md:gap-3 border-2 border-accent">
                    <div className="text-center">
                      <span className="text-lg md:text-2xl lg:text-3xl font-black text-accent">{String(daysUntil).padStart(2, '0')}</span>
                      <p className="text-[8px] md:text-[10px] uppercase text-muted-foreground font-medium">Días</p>
                    </div>
                    <span className="text-lg md:text-2xl text-accent font-bold">:</span>
                    <div className="text-center">
                      <span className="text-lg md:text-2xl lg:text-3xl font-black text-accent">{String(hoursUntil).padStart(2, '0')}</span>
                      <p className="text-[8px] md:text-[10px] uppercase text-muted-foreground font-medium">Hrs</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Card - Bottom Left (Responsive) */}
              <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-card rounded-xl shadow-lg p-3 md:p-5 min-w-[120px] md:min-w-[160px]">
                <div className="text-center">
                  <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {format(eventDate, "MMM", { locale: es })}
                  </p>
                  <p className="text-4xl md:text-6xl font-black text-foreground leading-none my-1 md:my-2">
                    {format(eventDate, "dd")}
                  </p>
                  <p className="text-sm md:text-base font-medium text-muted-foreground">
                    {format(eventDate, "yyyy")}
                  </p>
                  <div className="border-t border-border mt-3 pt-3 md:mt-4 md:pt-4">
                    <p className="text-xl md:text-2xl font-bold text-foreground">{formattedTime}h</p>
                    <div className="flex items-center justify-center gap-1 mt-1 md:mt-2 text-muted-foreground">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="text-xs md:text-sm">{eventDetails.venue_city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Name + Favorite Button - Bottom Right */}
              <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 max-w-[200px] sm:max-w-xs md:max-w-md text-right">
                <div className="flex items-start justify-end gap-2 md:gap-3">
                  <div>
                    <h1 className="text-lg sm:text-xl md:text-3xl font-black text-white drop-shadow-lg leading-tight line-clamp-2">
                      {eventDetails.event_name}
                    </h1>
                    <p className="text-xs md:text-sm text-white/80 mt-1 line-clamp-1">{eventDetails.venue_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex-shrink-0"
                    onClick={() => toggleFavorite({
                      event_id: eventDetails.event_id!,
                      event_name: eventDetails.event_name || '',
                      event_slug: eventDetails.event_slug || '',
                      event_date: eventDetails.event_date || '',
                      venue_city: eventDetails.venue_city || '',
                      image_url: eventImage
                    })}
                  >
                    <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isFavorite(eventDetails.event_id!) ? 'fill-accent text-accent' : 'text-white'}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Ticket Cards */}
              {ticketPrices.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Entradas</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                    {displayedTickets.map((ticket: any, index: number) => {
                      const quantity = getTicketQuantity(ticket.id);
                      const isSoldOut = ticket.availability === "none";
                      const isLimited = ticket.availability === "limited";
                      
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
                          <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                            {/* Ticket Header with Code & Availability */}
                            <div className="mb-2 sm:mb-3">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                {ticket.code && (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    {ticket.code}
                                  </span>
                                )}
                                {isSoldOut ? (
                                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                                    AGOTADO
                                  </span>
                                ) : isLimited ? (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                                    ÚLTIMAS
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                    DISPONIBLE
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-sm sm:text-base line-clamp-2 min-h-[40px] sm:min-h-[48px]">{ticket.type}</h3>
                              <p className="text-sm sm:text-base text-foreground/70 mt-1 line-clamp-2 min-h-[40px] sm:min-h-[48px]">
                                {ticket.description || ticket.type}
                              </p>
                            </div>

                            {/* Price - Improved Design */}
                            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-3 sm:p-4 text-center mb-3">
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-2xl sm:text-3xl font-black text-foreground">
                                  €{ticket.price.toFixed(0)}
                                </span>
                                <span className="text-xs text-muted-foreground">/entrada</span>
                              </div>
                              {ticket.fees > 0 && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                  + €{ticket.fees.toFixed(2)} gastos de gestión
                                </p>
                              )}
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center justify-center gap-3 mt-auto bg-muted/50 rounded-full p-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full hover:bg-background hover:text-foreground transition-colors disabled:opacity-30"
                                onClick={() => handleTicketQuantityChange(ticket.id, -1)}
                                disabled={quantity === 0 || isSoldOut}
                              >
                                <Minus className="h-5 w-5" />
                              </Button>
                              <span className="w-10 text-center font-bold text-xl">{quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground transition-colors disabled:opacity-30"
                                onClick={() => handleTicketQuantityChange(ticket.id, 1)}
                                disabled={quantity >= 10 || isSoldOut}
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
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
                        {showAllTickets ? "Ver menos" : "Ver más"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Hotels & Map Section with Tabs */}
              {(hotels.length > 0 || mapWidgetHtml || (eventDetails as any)?.hotels_list_widget_html) && (
                <div>
                  <HotelMapTabs 
                    hotels={hotels} 
                    mapWidgetHtml={mapWidgetHtml} 
                    hotelsListWidgetHtml={(eventDetails as any)?.hotels_list_widget_html}
                    onAddHotel={handleAddHotel}
                    checkinDate={(eventDetails as any).package_checkin || format(eventDate, "yyyy-MM-dd")}
                    checkoutDate={(eventDetails as any).package_checkout || format(new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")}
                    eventName={eventDetails.event_name || undefined}
                  />
                </div>
              )}
            </div>

            {/* Sidebar - Shopping Cart (Hidden on mobile/tablet, replaced by MobileCartBar) */}
            <div className="hidden xl:block xl:col-span-1">
              <Card className="sticky top-24 border-2">
                <CardHeader className="bg-foreground text-background">
                  <CardTitle className="uppercase tracking-wide text-sm">
                    Tu Reserva
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

                      {/* Tickets in cart */}
                      {cart.tickets.map((ticket, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
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
                              <h3 className="font-bold text-sm flex-1">{cart.hotel.hotel_name}</h3>
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
                          <span className="text-3xl font-black text-accent">€{pricePerPerson.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-muted-foreground">Total ({totalPersons} personas)</span>
                          <span className="text-base font-bold">€{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Selecciona entradas para comenzar
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
        
        <Footer />
      </div>
    </>
  );
};

export default Producto;
