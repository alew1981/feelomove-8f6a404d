import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Ticket, Hotel, ExternalLink, ShoppingCart, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import electronicImg from "@/assets/festival-electronic.jpg";

// Event ID para testing - en producción vendría del parámetro de la URL
const TEST_EVENT_ID = "1073965188";

// Mock data para hoteles - en producción vendría de la API
const mockHotels = [
  { id: 1, name: "Hotel Barceló Raval", distance: 1.5, stars: 4, pricePerNight: 120, image: electronicImg, partnerUrl: "https://booking.com", description: "Moderno hotel en el corazón del Raval con terraza panorámica y piscina en la azotea." },
  { id: 2, name: "W Barcelona", distance: 2, stars: 5, pricePerNight: 250, image: electronicImg, partnerUrl: "https://booking.com", description: "Icónico hotel de lujo frente al mar con diseño vanguardista y servicios exclusivos." },
  { id: 3, name: "Hotel Arts Barcelona", distance: 1.8, stars: 5, pricePerNight: 280, image: electronicImg, partnerUrl: "https://booking.com", description: "Elegante hotel de 5 estrellas con vistas al Mediterráneo y gastronomía de primer nivel." },
  { id: 4, name: "NH Collection Barcelona", distance: 3, stars: 4, pricePerNight: 150, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel céntrico con habitaciones espaciosas y servicios de calidad para tu estancia." },
  { id: 5, name: "Hotel Pullman Barcelona", distance: 2.5, stars: 4, pricePerNight: 140, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel contemporáneo cerca del puerto con spa, gimnasio y restaurante mediterráneo." },
  { id: 6, name: "Melia Barcelona Sky", distance: 2.2, stars: 4, pricePerNight: 165, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel moderno con impresionantes vistas de la ciudad desde sus plantas superiores." },
  { id: 7, name: "Grand Hotel Central", distance: 1.3, stars: 5, pricePerNight: 220, image: electronicImg, partnerUrl: "https://booking.com", description: "Boutique hotel de lujo en el Barrio Gótico con piscina infinity en la azotea." },
  { id: 8, name: "Hotel Ohla Barcelona", distance: 1.6, stars: 5, pricePerNight: 240, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel boutique de diseño en Vía Laietana con gastronomía galardonada con estrella Michelin." },
  { id: 9, name: "Room Mate Emma", distance: 2.8, stars: 3, pricePerNight: 95, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel boutique con diseño único y ubicación perfecta para explorar la ciudad." },
  { id: 10, name: "Hotel Praktik Bakery", distance: 2.3, stars: 3, pricePerNight: 110, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel con concepto único que incluye panadería artesanal propia en el lobby." },
  { id: 11, name: "Cotton House Hotel", distance: 1.9, stars: 5, pricePerNight: 290, image: electronicImg, partnerUrl: "https://booking.com", description: "Lujoso hotel en edificio histórico neoclásico con spa y restaurante de alta cocina." },
  { id: 12, name: "Hotel 1898", distance: 1.7, stars: 4, pricePerNight: 175, image: electronicImg, partnerUrl: "https://booking.com", description: "Elegante hotel en La Rambla en edificio colonial con piscina en azotea." },
  { id: 13, name: "Almanac Barcelona", distance: 2.1, stars: 5, pricePerNight: 270, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel de lujo con rooftop bar, spa exclusivo y habitaciones con vistas espectaculares." },
  { id: 14, name: "Hotel Casa Fuster", distance: 3.2, stars: 5, pricePerNight: 310, image: electronicImg, partnerUrl: "https://booking.com", description: "Hotel cinco estrellas Gran Lujo en edificio modernista con jazz bar y terraza." },
  { id: 15, name: "Hotel El Palace", distance: 2.6, stars: 5, pricePerNight: 320, image: electronicImg, partnerUrl: "https://booking.com", description: "Histórico hotel de lujo con más de 100 años de elegancia y servicio excepcional." },
  { id: 16, name: "Hotel Soho House", distance: 1.4, stars: 4, pricePerNight: 195, image: electronicImg, partnerUrl: "https://booking.com", description: "Exclusivo hotel club con diseño contemporáneo y ambiente cosmopolita único." },
];

const Producto = () => {
  const { id } = useParams();
  const [ticketAttendees, setTicketAttendees] = useState<{ [key: string]: number }>({});
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [hotelNights, setHotelNights] = useState(3);
  const [sortBy, setSortBy] = useState("distance");
  const [expandedHotels, setExpandedHotels] = useState<{ [key: number]: boolean }>({});

  // Obtener detalles del evento
  const { data: eventDetails, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["event", TEST_EVENT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticketmaster_event_details")
        .select("event_id, event_name, venue_name, venue_city, event_date, venue_address, event_url")
        .eq("event_id", TEST_EVENT_ID)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener precios de tickets
  const { data: ticketPrices, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["tickets", TEST_EVENT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticketmaster_event_prices")
        .select("*")
        .eq("event_id", TEST_EVENT_ID)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const festival = {
    hotels: mockHotels,
  };
  
  const getTotalAttendees = () => {
    return Object.values(ticketAttendees).reduce((sum, count) => sum + count, 0);
  };

  const getTicketsTotal = () => {
    if (!ticketPrices) return 0;
    return Object.entries(ticketAttendees).reduce((total, [priceId, count]) => {
      const ticket = ticketPrices.find(t => t.id.toString() === priceId);
      return total + (ticket?.total_price || 0) * count;
    }, 0);
  };

  const hotelPrice = selectedHotel ? (festival.hotels.find(h => h.id === selectedHotel)?.pricePerNight || 0) * hotelNights : 0;
  const totalPackage = getTicketsTotal() + hotelPrice;
  const totalAttendees = getTotalAttendees();
  const totalPerPerson = totalAttendees > 0 ? totalPackage / totalAttendees : 0;

  const updateTicketAttendees = (priceId: string, count: number) => {
    setTicketAttendees(prev => ({
      ...prev,
      [priceId]: Math.max(0, count)
    }));
  };

  const sortedHotels = [...festival.hotels].sort((a, b) => {
    if (sortBy === "price-asc") return a.pricePerNight - b.pricePerNight;
    if (sortBy === "price-desc") return b.pricePerNight - a.pricePerNight;
    if (sortBy === "distance") return a.distance - b.distance;
    if (sortBy === "stars") return b.stars - a.stars;
    return 0;
  });

  const toggleDescription = (hotelId: number) => {
    setExpandedHotels(prev => ({ ...prev, [hotelId]: !prev[hotelId] }));
  };

  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit) + "..." : text;
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Festival Info */}
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src={electronicImg}
                alt={eventDetails.event_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                <div className="p-8 w-full">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">{eventDetails.event_name}</h1>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{eventDetails.venue_name}, {eventDetails.venue_city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-secondary" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Disfruta de {eventDetails.event_name} en {eventDetails.venue_name}. 
                  Una experiencia única que no te puedes perder.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  📍 {eventDetails.venue_address}
                </p>
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
                  {ticketPrices.map((ticket) => (
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
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">Asistentes:</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateTicketAttendees(ticket.id.toString(), (ticketAttendees[ticket.id.toString()] || 0) - 1)}
                                disabled={ticket.availability === 'none'}
                              >
                                -
                              </Button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {ticketAttendees[ticket.id.toString()] || 0}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateTicketAttendees(ticket.id.toString(), (ticketAttendees[ticket.id.toString()] || 0) + 1)}
                                disabled={ticket.availability === 'none'}
                              >
                                +
                              </Button>
                            </div>
                            {ticket.availability === 'none' && (
                              <Badge variant="destructive" className="text-xs">Agotado</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">€{Number(ticket.total_price).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">por persona</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hoteles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Hotel className="h-6 w-6" />
                    Hoteles Recomendados
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className={`rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                        selectedHotel === hotel.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedHotel(hotel.id)}
                    >
                      <div className="h-32 overflow-hidden">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{hotel.name}</h4>
                          {selectedHotel === hotel.id && (
                            <Badge variant="default" className="text-xs">✓</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {"⭐".repeat(hotel.stars)}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">{hotel.distance} km del festival</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {expandedHotels[hotel.id] 
                            ? hotel.description 
                            : truncateText(hotel.description, 50)}
                          {hotel.description.length > 50 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDescription(hotel.id);
                              }}
                              className="text-primary hover:underline ml-1"
                            >
                              {expandedHotels[hotel.id] ? "ver menos" : "ver más"}
                            </button>
                          )}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          €{hotel.pricePerNight}/noche
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedHotel && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <label className="text-sm font-medium mb-2 block">
                      Número de noches
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setHotelNights(Math.max(1, hotelNights - 1))}
                      >
                        -
                      </Button>
                      <span className="text-lg font-semibold w-12 text-center">{hotelNights}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setHotelNights(hotelNights + 1)}
                      >
                        +
                      </Button>
                    </div>
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
                    Tu Paquete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getTotalAttendees() > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(ticketAttendees).map(([priceId, count]) => {
                        if (count === 0) return null;
                        const ticket = ticketPrices?.find(t => t.id.toString() === priceId);
                        if (!ticket) return null;
                        return (
                          <div key={priceId} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sm">{ticket.price_type_name}</p>
                                <p className="text-xs text-muted-foreground">{ticket.price_type_code}</p>
                              </div>
                              <Badge variant="secondary">{count}x</Badge>
                            </div>
                            <p className="text-right font-bold">€{(Number(ticket.total_price) * count).toFixed(2)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => updateTicketAttendees(priceId, 0)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Selecciona tus entradas
                    </p>
                  )}

                  {selectedHotel && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {festival.hotels.find(h => h.id === selectedHotel)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{hotelNights} noches</p>
                        </div>
                        <p className="font-bold">€{hotelPrice.toFixed(2)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-2"
                        onClick={() => setSelectedHotel(null)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}

                  {(getTotalAttendees() > 0 || selectedHotel) && (
                    <div className="pt-4 space-y-2 border-t">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">€{totalPackage.toFixed(2)}</span>
                      </div>
                      {totalAttendees > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                          €{totalPerPerson.toFixed(2)} por persona ({totalAttendees} asistentes)
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={getTotalAttendees() === 0}
                    asChild={getTotalAttendees() > 0}
                  >
                    {getTotalAttendees() > 0 ? (
                      <a href={eventDetails.event_url} target="_blank" rel="noopener noreferrer">
                        Reservar en Ticketmaster
                      </a>
                    ) : (
                      <span>Selecciona entradas</span>
                    )}
                  </Button>
                </CardFooter>
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
