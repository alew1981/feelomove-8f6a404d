import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

const Producto = () => {
  const { id } = useParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets } = useCart();
  
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [selectedHotelNights, setSelectedHotelNights] = useState<Record<string, number>>({});

  const { data: eventDetails, isLoading } = useQuery({
    queryKey: ["event-with-hotels", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("*")
        .eq("event_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

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

  const ticketPrices = Array.isArray(eventDetails.ticket_prices_detail) ? eventDetails.ticket_prices_detail : [];
  const hotels = Array.isArray(eventDetails.hotels) ? eventDetails.hotels.slice(0, 10) : [];

  const handleTicketQuantityChange = (ticketType: string, change: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [ticketType]: Math.max(0, (prev[ticketType] || 0) + change)
    }));
  };

  const handleAddTickets = () => {
    const selectedTickets: CartTicket[] = ticketPrices
      .filter((ticket: any) => ticketQuantities[ticket.type] > 0)
      .map((ticket: any) => ({
        type: ticket.type || "Entrada General",
        price: Number(ticket.value || 0),
        fees: Number(ticket.value || 0) * 0.15,
        quantity: ticketQuantities[ticket.type]
      }));

    if (selectedTickets.length === 0) {
      toast.error("Por favor, selecciona al menos una entrada");
      return;
    }

    addTickets(id!, eventDetails, selectedTickets);
    toast.success("Entradas añadidas al carrito");
  };

  const handleAddHotel = (hotel: any, nights: number) => {
    if (nights < 1) {
      toast.error("Selecciona el número de noches");
      return;
    }

    const pricePerNight = Number(hotel.price || 0);
    addHotel(id!, {
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

  const isEventInCart = cart?.event_id === id;
  const totalPersons = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalPersons > 0 ? totalPrice / totalPersons : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />

        {/* Event Hero Section */}
        <div className="relative rounded-lg overflow-hidden mb-8 h-[500px]">
          <img
            src={eventDetails.image_large_url || eventDetails.image_standard_url || "/placeholder.svg"}
            alt={eventDetails.event_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent" />
          
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            {!eventDetails.sold_out && eventDetails.seats_available && <Badge variant="disponible">DISPONIBLE</Badge>}
            {eventDetails.sold_out && <Badge variant="agotado">AGOTADO</Badge>}
            {eventDetails.has_hotel_offers && <Badge variant="popular">PAQUETE</Badge>}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 left-6 bg-white/10 backdrop-blur hover:bg-white/20"
            onClick={() => toggleFavorite({
              event_id: id!,
              event_name: eventDetails.event_name,
              event_date: eventDetails.event_date || '',
              venue_city: eventDetails.venue_city || '',
              image_url: eventDetails.image_standard_url || ''
            })}
          >
            <Heart className={`h-5 w-5 ${isFavorite(id!) ? 'fill-accent text-accent' : 'text-white'}`} />
          </Button>

          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              {eventDetails.event_name}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/90 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-sm capitalize">{formattedDate}</div>
                  <div className="text-sm">{formattedTime}</div>
                </div>
              </div>
              
              {eventDetails.venue_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-sm">{eventDetails.venue_name}</div>
                    {eventDetails.venue_address && <div className="text-xs opacity-80">{eventDetails.venue_address}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* SEO Description */}
            <Card className="border-2 border-border">
              <CardHeader className="bg-brand-black text-white">
                <CardTitle className="flex items-center gap-2 uppercase tracking-wide text-sm">
                  <Music className="h-5 w-5 text-accent" />
                  Descripción
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-foreground leading-relaxed">{seoDescription}</p>
              </CardContent>
            </Card>

            {/* Artists */}
            {artistNames.length > 0 && (
              <Card className="border-2 border-border">
                <CardHeader className="bg-brand-black text-white">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wide text-sm">
                    <Music className="h-5 w-5 text-accent" />
                    Artistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {artistNames.map((artist: string, index: number) => (
                      <Badge key={index} className="bg-brand-black text-white text-sm px-4 py-2 rounded-md">
                        {artist}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket Prices */}
            {ticketPrices.length > 0 && (
              <Card className="border-2 border-border overflow-hidden">
                <CardHeader className="bg-brand-black text-white">
                  <CardTitle className="uppercase tracking-wide text-sm">
                    {eventDetails.event_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {ticketPrices.map((ticket: any, index: number) => {
                    const price = Number(ticket.value || 0);
                    const fees = price * 0.15;
                    const quantity = ticketQuantities[ticket.type] || 0;
                    
                    return (
                      <div
                        key={index}
                        className="p-6 border-b border-border last:border-0 hover:bg-brand-light-gray transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{ticket.type || "Entrada General"}</h3>
                              {index === 0 && <Badge variant="hot">HOT</Badge>}
                              {ticket.type?.toLowerCase().includes("vip") && <Badge variant="vip">VIP</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              Entrada anticipada + 1 bebida
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-brand-black">
                              €{price.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">+ fees: €{fees.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Cantidad:</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleTicketQuantityChange(ticket.type, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                                onClick={() => handleTicketQuantityChange(ticket.type, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {quantity > 0 && (
                            <div className="text-right">
                              <div className="text-xl font-bold">€{((price + fees) * quantity).toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">
                                €{price.toFixed(2)} + €{fees.toFixed(2)} tasas
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="p-6">
                    <Button
                      variant="default"
                      className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={handleAddTickets}
                    >
                      Reservar Entradas →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hotels Section */}
            {hotels.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Hoteles Disponibles</h2>
                <div className="space-y-4">
                  {hotels.map((hotel: any) => {
                    const nights = selectedHotelNights[hotel.hotel_id] || 2;
                    const pricePerNight = Number(hotel.price || 0);
                    const facilities = hotel.facilities_catalog?.slice(0, 4) || [];
                    const reviewScore = hotel.hotel_review_score || hotel.hotel_stars;
                    const reviewCount = hotel.hotel_review_count || 0;
                    
                    return (
                      <Card key={hotel.hotel_id} className="border-2 border-border overflow-hidden hover:shadow-lg transition-all hover-lift">
                        <div className="flex flex-col">
                          <div className="relative h-64">
                            <img
                              src={hotel.hotel_main_photo || hotel.hotel_thumbnail || "/placeholder.svg"}
                              alt={hotel.hotel_name}
                              className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-3 left-3 bg-brand-black/80 text-white backdrop-blur px-3 py-1">
                              ★ {reviewScore?.toFixed(1) || "N/A"} ({reviewCount} reviews)
                            </Badge>
                            <Badge className="absolute top-3 right-3 bg-white text-brand-black px-3 py-1">
                              2.1 km del evento
                            </Badge>
                          </div>
                          
                          <div className="p-6">
                            <h3 className="font-bold text-xl mb-1">{hotel.hotel_name}</h3>
                            
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {hotel.hotel_description || "Hotel confortable con vista al mar y ambiente bohemio único en Ibiza"}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                              {facilities.length > 0 ? (
                                facilities.map((facility: any, idx: number) => (
                                  <Badge key={idx} className="bg-brand-black text-white text-xs rounded-md px-3 py-1">
                                    {facility.name || facility}
                                  </Badge>
                                ))
                              ) : (
                                <>
                                  <Badge className="bg-brand-black text-white text-xs rounded-md px-3 py-1">WiFi</Badge>
                                  <Badge className="bg-brand-black text-white text-xs rounded-md px-3 py-1">Piscina</Badge>
                                  <Badge className="bg-brand-black text-white text-xs rounded-md px-3 py-1">Spa</Badge>
                                  <Badge className="bg-brand-black text-white text-xs rounded-md px-3 py-1">Restaurante</Badge>
                                </>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">desde</p>
                                <p className="text-3xl font-bold text-brand-black">
                                  €{pricePerNight.toFixed(0)}
                                </p>
                                <p className="text-xs text-muted-foreground">/noche</p>
                              </div>
                              <Button
                                variant="default"
                                className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12"
                                onClick={() => handleAddHotel(hotel, nights)}
                              >
                                Añadir Hotel
                              </Button>
                            </div>
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
                <p className="text-xs text-white/70 mt-1">
                  {format(eventDate, "d MMM yyyy", { locale: es })} • {formattedTime} • UNVRS Club, Ibiza
                </p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {isEventInCart && cart ? (
                  <>
                    {/* Tickets in cart */}
                    {cart.tickets.map((ticket, idx) => (
                      <div key={idx} className="bg-white rounded-lg border-2 border-border p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold">{ticket.type}</h3>
                              {ticket.type.toLowerCase().includes("early") && <Badge variant="hot" className="text-xs">HOT</Badge>}
                              {ticket.type.toLowerCase().includes("vip") && <Badge variant="vip" className="text-xs">VIP</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">Entrada anticipada + 1 bebida</p>
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
                        
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Cantidad:</span>
                          <span className="font-bold">{ticket.quantity}</span>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold">€{((ticket.price + ticket.fees) * ticket.quantity).toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">
                            €{ticket.price.toFixed(2)} + €{ticket.fees.toFixed(2)} tasas
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Hotel in cart */}
                    {cart.hotel && (
                      <div className="bg-white rounded-lg border-2 border-border p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold flex-1">{cart.hotel.hotel_name}</h3>
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
                          20 AGO 2025 - 22 AGO 2025 • {cart.hotel.nights} noches
                        </p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                          Ibiza, España • 2.1 km del evento
                        </p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                          {cart.hotel.description}
                        </p>
                        <div className="text-right">
                          <div className="text-xl font-bold">€{cart.hotel.total_price.toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="pt-4 border-t-2 border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total por persona ({totalPersons} personas)</span>
                        <span className="text-2xl font-bold text-accent">€{pricePerPerson.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-3xl font-bold">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button
                        variant="default"
                        className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90"
                        asChild
                      >
                        <a href={eventDetails.event_url} target="_blank" rel="noopener noreferrer">
                          Reservar Entradas →
                        </a>
                      </Button>
                      
                      {cart.hotel && (
                        <Button variant="outline" className="w-full h-12 border-2">
                          Reservar Hotel →
                        </Button>
                      )}
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
  );
};

export default Producto;
