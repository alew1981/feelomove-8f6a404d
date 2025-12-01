import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Heart, Music, Trash2, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart, CartTicket } from "@/contexts/CartContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { handleLegacyRedirect } from "@/utils/redirects";
import { CategoryBadge } from "@/components/CategoryBadge";
import { SEOHead } from "@/components/SEOHead";

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();
  
  const [showAllTickets, setShowAllTickets] = useState(false);

  const { data: eventDetails, isLoading } = useQuery({
    queryKey: ["event-with-hotels", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("*")
        .eq("event_slug", slug)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no event found with slug, try legacy redirect
      if (!data && slug) {
        const redirected = await handleLegacyRedirect(slug, navigate);
        if (redirected) return null;
      }
      
      return data;
    }
  });

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
  const formattedDate = format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = format(eventDate, "HH:mm");
  const monthYear = format(eventDate, "MMMM yyyy", { locale: es });
  
  const artistNames = eventDetails.attraction_names || [];
  const mainArtist = artistNames[0] || eventDetails.event_name;

  // Generate SEO description
  const seoDescription = `Disfruta de ${mainArtist} en ${eventDetails.venue_city} este ${monthYear}. Consigue tus entradas para ${eventDetails.event_name} en ${eventDetails.venue_name}. Vive una experiencia única con la mejor música en directo. Reserva ahora tus entradas y hoteles con Feelomove+.`;

  // Parse ticket prices from ticket_prices_detail
  const rawTicketPrices = Array.isArray(eventDetails.ticket_prices_detail) ? eventDetails.ticket_prices_detail : [];
  const ticketPrices = rawTicketPrices.flatMap((ticket: any) => {
    if (!ticket.price_levels || !Array.isArray(ticket.price_levels)) return [];
    return ticket.price_levels.map((level: any) => ({
      type: ticket.name || ticket.description || "Entrada General",
      code: ticket.code,
      price: Number(level.face_value || 0),
      fees: Number(level.ticket_fees || 0),
      availability: level.availability || "high"
    }));
  }).sort((a, b) => a.price - b.price);

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 6);
  const hasMoreTickets = ticketPrices.length > 6;

  const hotels = Array.isArray(eventDetails.hotels) ? eventDetails.hotels.slice(0, 10) : [];

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
      addTickets(eventDetails.event_id!, eventDetails, updatedTickets);
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
    const nights = 2;
    const pricePerNight = Number(hotel.price || 0);
    addHotel(eventDetails.event_id!, {
      hotel_id: hotel.hotel_id,
      hotel_name: hotel.hotel_name,
      nights: nights,
      price_per_night: pricePerNight,
      total_price: pricePerNight * nights,
      image: hotel.hotel_main_photo || hotel.hotel_thumbnail || "/placeholder.svg",
      description: hotel.hotel_description || "Hotel confortable cerca del venue",
      checkin_date: format(eventDate, "yyyy-MM-dd"),
      checkout_date: format(new Date(eventDate.getTime() + nights * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    });
    toast.success("Hotel añadido al carrito");
  };

  const isEventInCart = cart?.event_id === eventDetails.event_id;
  const totalPersons = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalPersons > 0 ? totalPrice / totalPersons : 0;

  return (
    <>
      <SEOHead
        title={`${eventDetails.event_name} - Entradas y Hotel`}
        description={seoDescription}
        canonical={`/producto/${eventDetails.event_slug}`}
        ogImage={eventDetails.image_large_url || eventDetails.image_standard_url}
        ogType="event"
        keywords={`${mainArtist}, ${eventDetails.venue_city}, concierto, entradas, hotel, ${eventDetails.event_name}`}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Event Hero Section */}
        <div className="relative bg-brand-black rounded-lg overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Left: Date Block */}
            <div className="md:col-span-2 bg-white p-8 flex flex-col items-center justify-center border-r-4 border-brand-black">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">{format(eventDate, "EEE", { locale: es })}</p>
                <p className="text-7xl font-black leading-none mb-2">{format(eventDate, "dd")}</p>
                <p className="text-base mb-4">{format(eventDate, "MMM yyyy", { locale: es })}</p>
                <p className="text-lg font-medium">{eventDetails.venue_city}</p>
                <p className="text-3xl font-bold mt-6">{formattedTime}</p>
              </div>
            </div>

            {/* Center: Artist Image with Badges */}
            <div className="md:col-span-5 relative h-[500px]">
              <img
                src={eventDetails.image_large_url || eventDetails.image_standard_url || "/placeholder.svg"}
                alt={eventDetails.event_name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges Above Image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <CategoryBadge badges={eventDetails.event_badges} />
                {eventDetails.categories && (
                  <Badge className="bg-white text-brand-black font-bold px-3 py-1">
                    {eventDetails.categories[0]?.segment?.name || "Pop/Rock"}
                  </Badge>
                )}
                {artistNames[0] && (
                  <Badge className="bg-white text-brand-black font-bold px-3 py-1 flex items-center gap-1">
                    {artistNames[0]}
                    <span className="text-accent">✓</span>
                  </Badge>
                )}
              </div>

              {/* DISPONIBLE Badge */}
              <div className="absolute top-4 right-4">
                {!eventDetails.sold_out && eventDetails.seats_available && (
                  <Badge className="bg-accent text-brand-black font-black px-6 py-2 text-base">
                    DISPONIBLE
                  </Badge>
                )}
                {eventDetails.sold_out && (
                  <Badge className="bg-red-600 text-white font-black px-6 py-2 text-base">
                    AGOTADO
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Event Info */}
            <div className="md:col-span-5 bg-brand-black text-white p-8 flex flex-col justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                  {eventDetails.event_name}
                </h1>

                {/* Info Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {eventDetails.off_sale_date && (
                    <Badge variant="outline" className="bg-white text-brand-black border-0 font-medium px-4 py-2">
                      Off sale: {format(new Date(eventDetails.off_sale_date), "d MMM yyyy")}
                    </Badge>
                  )}
                  {eventDetails.has_hotel_offers && (
                    <Badge className="bg-accent text-brand-black font-bold px-4 py-2 flex items-center gap-1">
                      Hoteles
                      <span>✓</span>
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-base leading-relaxed mb-6">
                  {seoDescription}
                </p>

                {/* Venue Info */}
                <div className="space-y-2 text-sm">
                  <p className="font-bold">
                    [{eventDetails.venue_name}. {eventDetails.venue_address}]
                  </p>
                  <p className="text-white/70">
                    [{eventDetails.venue_city}, {eventDetails.venue_country}]
                  </p>
                  {eventDetails.promoter_name && (
                    <p className="text-white/70 font-medium">
                      [{eventDetails.promoter_name}]
                    </p>
                  )}
                </div>
              </div>

              {/* Favorite Button */}
              <div className="mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-accent text-accent hover:bg-accent hover:text-brand-black font-bold"
                  onClick={() => toggleFavorite({
                    event_id: eventDetails.event_id!,
                    event_name: eventDetails.event_name,
                    event_slug: eventDetails.event_slug,
                    event_date: eventDetails.event_date || '',
                    venue_city: eventDetails.venue_city || '',
                    image_url: eventDetails.image_standard_url || ''
                  })}
                >
                  <Heart className={`h-5 w-5 mr-2 ${isFavorite(eventDetails.event_id!) ? 'fill-accent' : ''}`} />
                  {isFavorite(eventDetails.event_id!) ? 'En Favoritos' : 'Añadir a Favoritos'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Breadcrumbs />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ticket Prices */}
            {ticketPrices.length > 0 && (
              <Card className="border-2 border-border overflow-hidden">
                <CardHeader className="bg-brand-black text-white">
                  <CardTitle className="uppercase tracking-wide text-sm">
                    Entradas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {displayedTickets.map((ticket: any, index: number) => {
                    const quantity = getTicketQuantity(ticket.type);
                    
                    return (
                      <div
                        key={index}
                        className="p-6 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-6">
                          {/* Left: Ticket Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{ticket.type}</h3>
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {ticket.code}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {ticket.type.includes("VIP") ? "Acceso preferente + merchandising" : "Entrada anticipada + 1 bebida"}
                            </p>
                          </div>

                          {/* Center: Price */}
                          <div className="text-center">
                            <div className="text-3xl font-black text-brand-black">
                              €{ticket.price.toFixed(0)}
                            </div>
                            <p className="text-xs text-muted-foreground">+ €{ticket.fees.toFixed(2)} fees</p>
                          </div>

                          {/* Right: Quantity Selector */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2"
                                onClick={() => handleTicketQuantityChange(ticket.type, -1)}
                                disabled={quantity === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-accent text-brand-black hover:bg-accent/90 border-2 border-accent"
                                onClick={() => handleTicketQuantityChange(ticket.type, 1)}
                                disabled={quantity >= 10}
                              >
                                <Plus className="h-5 w-5 font-bold" />
                              </Button>
                            </div>
                            {quantity > 0 && (
                              <div className="text-lg font-bold text-accent">
                                Total: €{((ticket.price + ticket.fees) * quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {hasMoreTickets && (
                    <div className="p-4 text-center bg-muted/20">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllTickets(!showAllTickets)}
                        className="w-full border-2 hover:border-accent hover:text-accent font-bold"
                      >
                        {showAllTickets ? "Ver menos entradas" : `Ver más entradas (${ticketPrices.length - 6} más)`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Hotels Section */}
            {hotels.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Hoteles Disponibles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotels.map((hotel: any) => {
                    const pricePerNight = Number(hotel.price || 0);
                    const facilities = hotel.facilities_catalog?.slice(0, 3) || [];
                    const reviewScore = hotel.hotel_review_score || hotel.hotel_stars;
                    const reviewCount = hotel.hotel_review_count || 0;
                    
                    return (
                      <Card key={hotel.hotel_id} className="border-2 border-border overflow-hidden hover:shadow-lg transition-all">
                        <div className="relative h-48">
                          <img
                            src={hotel.hotel_main_photo || hotel.hotel_thumbnail || "/placeholder.svg"}
                            alt={hotel.hotel_name}
                            className="w-full h-full object-cover"
                          />
                          {reviewScore && (
                            <Badge className="absolute top-2 left-2 bg-brand-black/80 text-white backdrop-blur text-xs">
                              ★ {reviewScore.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-bold text-base mb-1 line-clamp-1">{hotel.hotel_name}</h3>
                          
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {hotel.hotel_description || "Hotel confortable cerca del venue"}
                          </p>

                          {facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {facilities.map((facility: any, idx: number) => (
                                <Badge key={idx} className="bg-brand-black text-white text-[10px] rounded-md px-2 py-0.5">
                                  {facility.name || facility}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">desde</p>
                              <p className="text-xl font-bold text-brand-black">
                                €{pricePerNight.toFixed(0)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">/noche</p>
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={() => handleAddHotel(hotel)}
                            >
                              Añadir
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Shopping Cart */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-border">
              <CardHeader className="bg-brand-black text-white">
                <CardTitle className="uppercase tracking-wide text-sm">
                  {eventDetails.event_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {isEventInCart && cart ? (
                  <>
                    {/* Tickets in cart */}
                    {cart.tickets.map((ticket, idx) => (
                      <div key={idx} className="bg-white rounded-lg border-2 border-border p-4">
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
                            €{ticket.price.toFixed(2)} + €{ticket.fees.toFixed(2)} fees
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Reserve tickets button */}
                    <Button
                      variant="default"
                      className="w-full h-10 text-sm bg-accent text-brand-black hover:bg-accent/90"
                      asChild
                    >
                      <a href={eventDetails.event_url || "#"} target="_blank" rel="noopener noreferrer">
                        Reservar Entradas
                      </a>
                    </Button>

                    {/* Hotel in cart */}
                    {cart.hotel && (
                      <>
                        <div className="bg-white rounded-lg border-2 border-border p-4">
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

                        {/* Reserve hotel button */}
                        <Button variant="outline" className="w-full h-10 text-sm border-2">
                          Reservar Hotel
                        </Button>
                      </>
                    )}

                    {/* Summary */}
                    <div className="pt-4 border-t-2 border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-brand-black">Total</span>
                        <span className="text-2xl font-bold text-accent">€{totalPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total por persona</span>
                        <span className="text-lg font-bold text-brand-black">€{pricePerPerson.toFixed(2)}</span>
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

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    🔒 Pago seguro y confirmación instantánea
                  </p>
                </div>
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
