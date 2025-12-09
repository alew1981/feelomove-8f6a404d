import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import HotelCard from "@/components/HotelCard";
import HotelMapTabs from "@/components/HotelMapTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, Plus, Minus, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart, CartTicket } from "@/contexts/CartContext";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { handleLegacyRedirect } from "@/utils/redirects";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";

interface TicketType {
  availability: string;
  code: string;
  description: string;
  face_value: number;
  fees: number;
  name: string;
  total: number;
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
}

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();
  
  const [showAllTickets, setShowAllTickets] = useState(false);

  // Fetch event details from lovable_mv_event_product_page
  const { data: eventData, isLoading } = useQuery({
    queryKey: ["event-product-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page")
        .select("*")
        .eq("event_slug", slug);
      
      if (error) throw error;
      
      // If no event found with slug, try legacy redirect
      if ((!data || data.length === 0) && slug) {
        const redirected = await handleLegacyRedirect(slug, navigate);
        if (redirected) return null;
      }
      
      return data;
    }
  });

  // Process data - first row has event details
  const eventDetails = eventData?.[0] as unknown as EventProductPage | null;
  
  // Get hotels from hotels_prices_aggregated_jsonb
  const hotels: HotelData[] = (() => {
    if (!eventDetails) return [];
    const aggregatedHotels = (eventDetails as any).hotels_prices_aggregated_jsonb;
    if (!aggregatedHotels || !Array.isArray(aggregatedHotels)) return [];
    
    return aggregatedHotels.slice(0, 10).map((hotel: any) => {
      // Calculate distance in km (data comes as distance_meters)
      const distanceMeters = hotel.distance_meters || 0;
      const distanceKm = distanceMeters > 0 ? distanceMeters / 1000 : (hotel.distance_km || 0);
      
      return {
        hotel_id: hotel.hotel_id || hotel.id,
        hotel_name: hotel.name || hotel.hotel_name,
        hotel_main_photo: hotel.main_photo || hotel.hotel_main_photo,
        hotel_description: hotel.hotel_description || hotel.description || "Hotel confortable cerca del venue",
        hotel_stars: hotel.stars || hotel.hotel_stars || 0,
        hotel_rating: hotel.rating || hotel.hotel_rating || 0,
        hotel_reviews: hotel.review_count || hotel.hotel_reviews || 0,
        price: hotel.min_price || 0,
        selling_price: hotel.ssp_price || hotel.min_price || 0,
        distance_km: distanceKm,
        facility_names_es: hotel.facility_names_es || [],
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-20">
          <p className="text-center text-muted-foreground">Evento no encontrado</p>
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

  // Parse ticket prices from ticket_types
  const rawTicketTypes = ((eventDetails as any).ticket_types as TicketType[] | null) || [];
  const ticketPrices = rawTicketTypes.map(ticket => ({
    type: ticket.name || "Entrada General",
    code: ticket.code,
    description: ticket.description || "",
    price: Number(ticket.face_value || 0),
    fees: Number(ticket.fees || 0),
    availability: ticket.availability || "available"
  })).sort((a, b) => a.price - b.price);

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 6);
  const hasMoreTickets = ticketPrices.length > 6;

  const handleTicketQuantityChange = (ticketType: string, change: number) => {
    const existingTickets = cart?.event_id === eventDetails.event_id ? cart.tickets : [];
    const ticketIndex = existingTickets.findIndex(t => t.type === ticketType);
    
    const ticketData = ticketPrices.find(t => t.type === ticketType);
    if (!ticketData) return;

    let updatedTickets = [...existingTickets];
    
    if (ticketIndex >= 0) {
      const newQuantity = Math.max(0, Math.min(10, updatedTickets[ticketIndex].quantity + change));
      if (newQuantity === 0) {
        updatedTickets = updatedTickets.filter(t => t.type !== ticketType);
      } else {
        updatedTickets[ticketIndex] = {
          ...updatedTickets[ticketIndex],
          quantity: newQuantity
        };
      }
    } else if (change > 0) {
      updatedTickets.push({
        type: ticketData.type,
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

  const getTicketQuantity = (ticketType: string) => {
    if (!cart || cart.event_id !== eventDetails.event_id) return 0;
    const ticket = cart.tickets.find(t => t.type === ticketType);
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
          {/* Hero Section */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            {/* Background Image */}
            <div className="relative h-[450px] md:h-[500px]">
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

              {/* Countdown Badge - Top Right - Only show if less than 7 days */}
              {daysUntil >= 0 && daysUntil < 7 && (
                <div className="absolute top-4 right-4">
                  <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3 border-2 border-accent">
                    <div className="text-center">
                      <span className="text-2xl md:text-3xl font-black text-accent">{String(daysUntil).padStart(2, '0')}</span>
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Días</p>
                    </div>
                    <span className="text-2xl text-accent font-bold">:</span>
                    <div className="text-center">
                      <span className="text-2xl md:text-3xl font-black text-accent">{String(hoursUntil).padStart(2, '0')}</span>
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Hrs</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Card - Bottom Left (Extended height) */}
              <div className="absolute bottom-4 left-4 bg-card rounded-xl shadow-lg p-5 min-w-[160px]">
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {format(eventDate, "MMM", { locale: es })}
                  </p>
                  <p className="text-6xl font-black text-foreground leading-none my-2">
                    {format(eventDate, "dd")}
                  </p>
                  <p className="text-base font-medium text-muted-foreground">
                    {format(eventDate, "yyyy")}
                  </p>
                  <div className="border-t border-border mt-4 pt-4">
                    <p className="text-2xl font-bold text-foreground">{formattedTime}h</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{eventDetails.venue_city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Name + Favorite Button - Bottom Right */}
              <div className="absolute bottom-4 right-4 max-w-md text-right">
                <div className="flex items-start justify-end gap-3">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg leading-tight">
                      {eventDetails.event_name}
                    </h1>
                    <p className="text-sm text-white/80 mt-1">{eventDetails.venue_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex-shrink-0"
                    onClick={() => toggleFavorite({
                      event_id: eventDetails.event_id!,
                      event_name: eventDetails.event_name || '',
                      event_slug: eventDetails.event_slug || '',
                      event_date: eventDetails.event_date || '',
                      venue_city: eventDetails.venue_city || '',
                      image_url: eventImage
                    })}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite(eventDetails.event_id!) ? 'fill-accent text-accent' : 'text-white'}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Breadcrumbs />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Ticket Cards */}
              {ticketPrices.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Entradas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedTickets.map((ticket: any, index: number) => {
                      const quantity = getTicketQuantity(ticket.type);
                      
                      return (
                        <Card key={index} className="border-2 overflow-hidden hover:border-accent transition-colors">
                          <CardContent className="p-4">
                            {/* Ticket Header */}
                            <div className="mb-3">
                              <h3 className="font-bold text-sm line-clamp-2 min-h-[40px]">{ticket.type}</h3>
                              {ticket.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                              {ticket.code && (
                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground mt-2 inline-block">
                                  {ticket.code}
                                </span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-center py-3 border-y border-border">
                              <div className="text-2xl font-black text-foreground">
                                €{ticket.price.toFixed(0)}
                              </div>
                              {ticket.fees > 0 && (
                                <p className="text-[10px] text-muted-foreground">+ €{ticket.fees.toFixed(2)} gastos</p>
                              )}
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between mt-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border-2"
                                onClick={() => handleTicketQuantityChange(ticket.type, -1)}
                                disabled={quantity === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-lg font-bold">{quantity}</span>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                                onClick={() => handleTicketQuantityChange(ticket.type, 1)}
                                disabled={quantity >= 10}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Total if selected */}
                            {quantity > 0 && (
                              <div className="mt-2 text-center">
                                <span className="text-xs font-bold text-accent">
                                  Total: €{((ticket.price + ticket.fees) * quantity).toFixed(2)}
                                </span>
                              </div>
                            )}
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
                        className="border-2 hover:border-accent hover:text-accent font-bold"
                      >
                        {showAllTickets ? "Ver menos" : `Ver más (${ticketPrices.length - 6} más)`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Hotels & Map Section with Tabs */}
              {(hotels.length > 0 || mapWidgetHtml) && (
                <div>
                  <HotelMapTabs 
                    hotels={hotels} 
                    mapWidgetHtml={mapWidgetHtml} 
                    onAddHotel={handleAddHotel} 
                  />
                </div>
              )}
            </div>

            {/* Sidebar - Shopping Cart */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-2">
                <CardHeader className="bg-foreground text-background">
                  <CardTitle className="uppercase tracking-wide text-sm">
                    Tu Reserva
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {isEventInCart && cart ? (
                    <>
                      {/* Event Info with Image */}
                      <div className="mb-4">
                        <p className="text-sm font-bold text-foreground mb-2">
                          {eventDetails.event_name}
                        </p>
                        <img 
                          src={eventImage} 
                          alt={eventDetails.event_name || "Evento"} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      </div>

                      {/* Tickets in cart */}
                      {cart.tickets.map((ticket, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm">{ticket.type}</h3>
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
                            <p className="text-xs text-muted-foreground mb-2">
                              {cart.hotel.nights} noches
                            </p>
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

        <Footer />
      </div>
    </>
  );
};

export default Producto;
