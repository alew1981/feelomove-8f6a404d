import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, Hotel, ExternalLink, ShoppingCart, Star, Heart, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import electronicImg from "@/assets/festival-electronic.jpg";

interface CartTicket {
  priceId: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartHotel {
  hotelId: string;
  name: string;
  pricePerNight: number;
  nights: number;
  image?: string;
  bookingUrl?: string;
}

const Producto = () => {
  const { id } = useParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [cartTickets, setCartTickets] = useState<CartTicket[]>([]);
  const [cartHotel, setCartHotel] = useState<CartHotel | null>(null);
  const [sortBy, setSortBy] = useState("distance");
  const [expandedHotels, setExpandedHotels] = useState<{ [key: string]: boolean }>({});
  const [filterStars, setFilterStars] = useState("all");
  const [filterPrice, setFilterPrice] = useState("all");

  // Obtener detalles del evento
  const { data: eventDetails, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_list_page_view")
        .select("*")
        .eq("event_id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener precios de tickets
  const { data: ticketPrices, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["tickets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticketmaster_event_prices")
        .select("*")
        .eq("event_id", id)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener hoteles reales de Supabase
  const { data: hotels, isLoading: isLoadingHotels } = useQuery({
    queryKey: ["hotels", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_details_page_hotels_view")
        .select("*")
        .eq("event_id", id)
        .order("hotel_rank", { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Seleccionar por defecto 2 entradas del primer tipo disponible al cargar
  useEffect(() => {
    if (ticketPrices && ticketPrices.length > 0 && cartTickets.length === 0) {
      const firstAvailableTicket = ticketPrices.find(t => t.availability !== 'none');
      if (firstAvailableTicket) {
        setCartTickets([{
          priceId: firstAvailableTicket.id.toString(),
          name: firstAvailableTicket.price_type_name,
          code: firstAvailableTicket.price_type_code,
          description: firstAvailableTicket.price_type_description,
          price: Number(firstAvailableTicket.total_price),
          quantity: 2,
          image: eventDetails?.image_standard_url || electronicImg,
        }]);
      }
    }
  }, [ticketPrices, cartTickets.length, eventDetails]);

  const updateTicketInCart = (priceId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartTickets(prev => prev.filter(t => t.priceId !== priceId));
      return;
    }

    const ticket = ticketPrices?.find(t => t.id.toString() === priceId);
    if (!ticket) return;

    setCartTickets(prev => {
      const existing = prev.find(t => t.priceId === priceId);
      if (existing) {
        return prev.map(t => t.priceId === priceId ? { ...t, quantity } : t);
      } else {
        return [...prev, {
          priceId,
          name: ticket.price_type_name,
          code: ticket.price_type_code,
          description: ticket.price_type_description,
          price: Number(ticket.total_price),
          quantity,
          image: eventDetails?.image_standard_url || electronicImg,
        }];
      }
    });
  };

  const addHotelToCart = (hotel: any) => {
    setCartHotel({
      hotelId: hotel.hotel_id,
      name: hotel.hotel_name,
      pricePerNight: Number(hotel.price || hotel.suggested_selling_price || 0),
      nights: 1,
      image: hotel.thumbnail || hotel.main_photo,
      bookingUrl: `https://www.booking.com/hotel/${hotel.hotel_id}.html`,
    });
  };

  const updateHotelNights = (nights: number) => {
    if (cartHotel) {
      setCartHotel({ ...cartHotel, nights: Math.max(1, nights) });
    }
  };

  const getTotalAttendees = () => {
    return cartTickets.reduce((sum, t) => sum + t.quantity, 0);
  };

  const getTicketsTotal = () => {
    return cartTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  };

  const hotelTotal = cartHotel ? cartHotel.pricePerNight * cartHotel.nights : 0;
  const totalPackage = getTicketsTotal() + hotelTotal;
  const totalAttendees = getTotalAttendees();
  const totalPerPerson = totalAttendees > 0 ? totalPackage / totalAttendees : 0;

  const filteredHotels = (hotels || [])
    .filter(hotel => filterStars === "all" || hotel.stars === Number(filterStars))
    .filter(hotel => {
      if (filterPrice === "all") return true;
      const price = Number(hotel.price || hotel.suggested_selling_price || 0);
      if (filterPrice === "budget") return price < 150;
      if (filterPrice === "mid") return price >= 150 && price < 250;
      if (filterPrice === "luxury") return price >= 250;
      return true;
    });

  const sortedHotels = [...filteredHotels].sort((a, b) => {
    const priceA = Number(a.price || a.suggested_selling_price || 0);
    const priceB = Number(b.price || b.suggested_selling_price || 0);
    
    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "distance") return (a.distance_to_venue || 999) - (b.distance_to_venue || 999);
    if (sortBy === "stars") return (b.stars || 0) - (a.stars || 0);
    return 0;
  });

  const toggleDescription = (hotelId: string) => {
    setExpandedHotels(prev => ({ ...prev, [hotelId]: !prev[hotelId] }));
  };

  const truncateText = (text: string, limit: number) => {
    if (!text) return "";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleToggleFavorite = () => {
    if (eventDetails) {
      toggleFavorite({
        event_id: eventDetails.event_id,
        event_name: eventDetails.event_name,
        event_date: eventDetails.event_date,
        venue_city: eventDetails.venue_city,
        image_url: eventDetails.image_standard_url,
      });
    }
  };

  if (isLoadingEvent || isLoadingTickets) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center">Cargando...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!eventDetails || !ticketPrices) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center">No se encontró el evento</div>
        </main>
        <Footer />
      </div>
    );
  }

  const eventDate = new Date(eventDetails.event_date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <Breadcrumbs />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Festival Info */}
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src={eventDetails.image_standard_url || electronicImg}
                alt={eventDetails.event_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                <div className="p-8 w-full">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">{eventDetails.event_name}</h1>
                  {eventDetails.main_attraction_name && (
                    <p className="text-xl text-muted-foreground mb-2">{eventDetails.main_attraction_name}</p>
                  )}
                </div>
              </div>
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Badge className="bg-background/90 text-foreground backdrop-blur-sm">
                  <Calendar className="mr-1 h-3 w-3" />
                  {eventDate.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric'
                  })}
                </Badge>
                <Badge className="bg-background/90 text-foreground backdrop-blur-sm">
                  <Clock className="mr-1 h-3 w-3" />
                  {eventDate.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                  })} h
                </Badge>
                <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-left max-w-sm text-xs">
                  <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                  <span>
                    Ubicación: {eventDetails.venue_name}, {eventDetails.venue_city}, {eventDetails.venue_country}
                    {eventDetails.venue_address && (
                      <span className="block mt-1">{eventDetails.venue_address}</span>
                    )}
                  </span>
                </Badge>
                {eventDetails.seats_available && (
                  <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                    Entradas Disponibles
                  </Badge>
                )}
              </div>
              <button
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 p-3 rounded-full bg-background/80 hover:bg-background transition-colors"
                aria-label={isFavorite(eventDetails.event_id) ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Heart 
                  className={`h-6 w-6 ${isFavorite(eventDetails.event_id) ? 'fill-red-500 text-red-500' : 'text-foreground'}`}
                />
              </button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Descripción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Sobre el evento</h3>
                  <p className="text-muted-foreground">
                    {eventDetails?.attraction_description || `Disfruta de ${eventDetails.event_name} en ${eventDetails.venue_name}. Una experiencia única que no te puedes perder.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Entradas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Ticket className="h-6 w-6" />
                  Tipos de Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticketPrices.map((ticket) => {
                    const cartTicket = cartTickets.find(t => t.priceId === ticket.id.toString());
                    const currentQuantity = cartTicket?.quantity || 0;

                    return (
                      <div
                        key={ticket.id}
                        className="p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <h3 className="font-semibold text-base">{ticket.price_type_name}</h3>
                              <span className="text-xs text-muted-foreground">{ticket.price_type_code}</span>
                            </div>
                            {ticket.price_type_description && (
                              <p className="text-xs text-muted-foreground mb-2">{ticket.price_type_description}</p>
                            )}
                            {ticket.availability === 'none' && (
                              <Badge variant="destructive" className="text-xs">Agotado</Badge>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className="text-xl font-bold text-primary">€{Number(ticket.total_price).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">por persona</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateTicketInCart(ticket.id.toString(), currentQuantity - 1)}
                                disabled={currentQuantity <= 0}
                              >
                                -
                              </Button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {currentQuantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateTicketInCart(ticket.id.toString(), currentQuantity + 1)}
                                disabled={ticket.availability === 'none'}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              variant={currentQuantity > 0 ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (currentQuantity === 0) {
                                  updateTicketInCart(ticket.id.toString(), 1);
                                }
                              }}
                              disabled={ticket.availability === 'none'}
                            >
                              Añadir
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Hoteles */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Hotel className="h-6 w-6" />
                    Hoteles Recomendados
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">Distancia</SelectItem>
                        <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                        <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                        <SelectItem value="stars">Estrellas</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterStars} onValueChange={setFilterStars}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Estrellas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="3">3 <Star className="inline h-3 w-3" /></SelectItem>
                        <SelectItem value="4">4 <Star className="inline h-3 w-3" /></SelectItem>
                        <SelectItem value="5">5 <Star className="inline h-3 w-3" /></SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterPrice} onValueChange={setFilterPrice}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Precio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="budget">Económico (&lt;€150)</SelectItem>
                        <SelectItem value="mid">Medio (€150-250)</SelectItem>
                        <SelectItem value="luxury">Lujo (€250+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHotels ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando hoteles...
                  </div>
                ) : sortedHotels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron hoteles disponibles
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedHotels.map((hotel) => {
                      const price = Number(hotel.price || hotel.suggested_selling_price || 0);
                      const isSelected = cartHotel?.hotelId === hotel.hotel_id;

                      return (
                        <div
                          key={hotel.hotel_id}
                          className={`rounded-lg border-2 overflow-hidden transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {(hotel.thumbnail || hotel.main_photo) && (
                            <div className="h-32 overflow-hidden">
                              <img
                                src={hotel.thumbnail || hotel.main_photo}
                                alt={hotel.hotel_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-sm">{hotel.hotel_name}</h4>
                              {isSelected && (
                                <Badge variant="default" className="text-xs">✓</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {"⭐".repeat(hotel.stars || 0)}
                              {hotel.rating && ` ${hotel.rating}/10`}
                            </p>
                            {hotel.distance_to_venue && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {hotel.distance_to_venue.toFixed(1)} km del evento
                              </p>
                            )}
                            {hotel.hotel_description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {expandedHotels[hotel.hotel_id] 
                                  ? stripHtml(hotel.hotel_description)
                                  : truncateText(stripHtml(hotel.hotel_description), 50)}
                                {stripHtml(hotel.hotel_description).length > 50 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDescription(hotel.hotel_id);
                                    }}
                                    className="text-primary hover:underline ml-1"
                                  >
                                    {expandedHotels[hotel.hotel_id] ? "ver menos" : "ver más"}
                                  </button>
                                )}
                              </p>
                            )}
                             <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-primary">
                                €{Math.round(price)}/noche
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected && cartHotel) {
                                        updateHotelNights(cartHotel.nights - 1);
                                      }
                                    }}
                                    disabled={!isSelected || (cartHotel?.nights || 1) <= 1}
                                  >
                                    -
                                  </Button>
                                  <span className="text-sm font-semibold w-8 text-center">
                                    {isSelected ? cartHotel?.nights : 1}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected && cartHotel) {
                                        updateHotelNights(cartHotel.nights + 1);
                                      }
                                    }}
                                    disabled={!isSelected}
                                  >
                                    +
                                  </Button>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={() => !isSelected && addHotelToCart(hotel)}
                                  disabled={isSelected}
                                >
                                  {isSelected ? "✓" : "Añadir"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cesta lateral */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Reserva tu experiencia para {eventDetails.event_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tickets en la cesta */}
                  {cartTickets.length > 0 ? (
                    <div className="space-y-3">
                      {cartTickets.map((ticket) => (
                        <div key={ticket.priceId} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex gap-3">
                            {ticket.image && (
                              <img 
                                src={ticket.image} 
                                alt={ticket.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="mb-2">
                                <p className="font-medium text-sm">{ticket.name}</p>
                                <p className="text-xs text-muted-foreground">Código: {ticket.code}</p>
                                {ticket.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateTicketInCart(ticket.priceId, ticket.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="text-sm font-semibold w-6 text-center">
                                    {ticket.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateTicketInCart(ticket.priceId, ticket.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                                <p className="font-bold text-sm">€{(ticket.price * ticket.quantity).toFixed(2)}</p>
                              </div>
                              <div className="flex justify-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  asChild
                                >
                                  <a href={eventDetails.event_url} target="_blank" rel="noopener noreferrer">
                                    Reservar entradas
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Selecciona tus entradas
                    </p>
                  )}

                  {/* Hotel en la cesta */}
                  {cartHotel && (
                    <div className="pt-4 border-t">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex gap-3">
                          {cartHotel.image && (
                            <img 
                              src={cartHotel.image} 
                              alt={cartHotel.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-2">{cartHotel.name}</p>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Noches:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateHotelNights(cartHotel.nights - 1)}
                                >
                                  -
                                </Button>
                                <span className="text-sm font-semibold w-6 text-center">
                                  {cartHotel.nights}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateHotelNights(cartHotel.nights + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <p className="font-bold text-sm text-right mb-2">
                              €{Math.round(cartHotel.pricePerNight * cartHotel.nights)}
                            </p>
                            <div className="flex justify-center">
                              <Button
                                variant="default"
                                size="sm"
                                asChild
                              >
                                <a href={cartHotel.bookingUrl} target="_blank" rel="noopener noreferrer">
                                  Reservar hoteles
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Totales */}
                  {(cartTickets.length > 0 || cartHotel) && (
                    <div className="pt-4 space-y-3 border-t">
                      {totalAttendees > 0 && (
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Total por persona</p>
                            <p className="text-3xl font-bold text-primary">
                              €{totalPerPerson.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {totalAttendees} {totalAttendees === 1 ? 'asistente' : 'asistentes'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>€{totalPackage.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Producto;
