import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink, Heart, Music, Star, Wifi, Car, Coffee, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Producto = () => {
  const { id } = useParams();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Get event details from vw_events_with_hotels
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
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF8F] mx-auto mb-4"></div>
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

  // Parse ticket prices
  const ticketPrices = Array.isArray(eventDetails.ticket_prices_detail) 
    ? eventDetails.ticket_prices_detail 
    : [];
  
  // Parse hotels
  const hotels = Array.isArray(eventDetails.hotels) 
    ? eventDetails.hotels 
    : [];

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
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            {!eventDetails.sold_out && eventDetails.seats_available && (
              <Badge variant="disponible">DISPONIBLE</Badge>
            )}
            {eventDetails.sold_out && (
              <Badge variant="agotado">AGOTADO</Badge>
            )}
            {eventDetails.has_hotel_offers && (
              <Badge variant="popular">PAQUETE</Badge>
            )}
          </div>

          {/* Favorite Button */}
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
            <Heart className={`h-5 w-5 ${isFavorite(id!) ? 'fill-[#00FF8F] text-[#00FF8F]' : 'text-white'}`} />
          </Button>

          {/* Event Info */}
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              {eventDetails.event_name}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/90 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#00FF8F]" />
                <div>
                  <div className="text-sm capitalize">{formattedDate}</div>
                  <div className="text-sm">{formattedTime}</div>
                </div>
              </div>
              
              {eventDetails.venue_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#00FF8F]" />
                  <div>
                    <div className="text-sm">{eventDetails.venue_name}</div>
                    {eventDetails.venue_address && (
                      <div className="text-xs opacity-80">{eventDetails.venue_address}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Artists */}
            {eventDetails.attraction_names && eventDetails.attraction_names.length > 0 && (
              <Card className="border-2 border-border">
                <CardHeader className="bg-[#121212] text-white">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wide text-sm">
                    <Music className="h-5 w-5 text-[#00FF8F]" />
                    Artistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {eventDetails.attraction_names.map((artist: string, index: number) => (
                      <Badge key={index} className="bg-[#121212] text-white text-sm px-4 py-2 rounded-md">
                        {artist}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket Price List - Brandbook Style */}
            {ticketPrices.length > 0 && (
              <Card className="border-2 border-border overflow-hidden">
                <CardHeader className="bg-[#121212] text-white">
                  <CardTitle className="uppercase tracking-wide text-sm">
                    {eventDetails.event_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {ticketPrices.map((ticket: any, index: number) => (
                    <div 
                      key={index} 
                      className="p-6 border-b border-border last:border-0 hover:bg-[#F2F2F2] dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{ticket.type || "Entrada General"}</h3>
                            {index === 0 && <Badge variant="popular">POPULAR</Badge>}
                            {ticket.type?.toLowerCase().includes("vip") && <Badge variant="vip">VIP</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Entrada para el evento con acceso completo
                          </p>
                          <div className="flex items-center gap-2 text-sm text-[#00FF8F]">
                            <span>✓ Acceso al evento</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#121212] dark:text-white">
                            €{Number(ticket.value || 0).toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">+ tasas</p>
                          <Button variant="add" size="sm" className="mt-3">
                            Añadir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Hotels Section - Brandbook Style */}
            {hotels.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Hoteles Disponibles</h2>
                <div className="space-y-4">
                  {hotels.slice(0, 5).map((hotel: any) => (
                    <Card key={hotel.hotel_id} className="border-2 border-border overflow-hidden hover:shadow-card-hover transition-all">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 h-48 md:h-auto relative">
                          <img
                            src={hotel.hotel_main_photo || hotel.hotel_thumbnail || "/placeholder.svg"}
                            alt={hotel.hotel_name}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-3 left-3 bg-[#121212]/80 text-white backdrop-blur">
                            {hotel.hotel_stars}★
                          </Badge>
                        </div>
                        <div className="md:w-2/3 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-xl mb-1">{hotel.hotel_name}</h3>
                              {hotel.hotel_chain && (
                                <p className="text-sm text-muted-foreground">{hotel.hotel_chain}</p>
                              )}
                            </div>
                            {hotel.hotel_review_score && (
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-[#00FF8F] font-bold text-lg">
                                  <Star className="h-5 w-5 fill-current" />
                                  {hotel.hotel_review_score.toFixed(1)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {hotel.hotel_review_count} opiniones
                                </p>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {hotel.hotel_description || "Hotel confortable cerca del venue"}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-[#121212] text-white text-xs rounded-md">
                              <Wifi className="h-3 w-3 mr-1" /> WiFi
                            </Badge>
                            <Badge className="bg-[#121212] text-white text-xs rounded-md">
                              <Car className="h-3 w-3 mr-1" /> Parking
                            </Badge>
                            <Badge className="bg-[#121212] text-white text-xs rounded-md">
                              <Coffee className="h-3 w-3 mr-1" /> Desayuno
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio por noche</p>
                              <p className="text-2xl font-bold text-[#00FF8F]">
                                €{Number(hotel.price || 0).toFixed(0)}
                              </p>
                            </div>
                            <Button variant="primary">Ver Hotel</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking CTA */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-border">
              <CardHeader className="bg-[#121212] text-white">
                <CardTitle className="uppercase tracking-wide text-sm">Tu Compra</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Evento</p>
                  <p className="font-semibold line-clamp-2">{eventDetails.event_name}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Fecha</p>
                  <p className="font-medium">{format(eventDate, "d MMM yyyy", { locale: es })}</p>
                  <p className="text-sm">{formattedTime}</p>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Desde</p>
                  </div>
                  <p className="text-4xl font-bold text-[#00FF8F]">
                    €{Number(eventDetails.ticket_cheapest_price || 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">por persona</p>
                </div>

                {eventDetails.has_hotel_offers && eventDetails.package_price_min && (
                  <div className="p-4 bg-[#00FF8F]/10 rounded-md border border-[#00FF8F]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="popular" className="text-xs">PAQUETE</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Entrada + Hotel</p>
                    <p className="text-2xl font-bold text-[#121212] dark:text-white">
                      €{Number(eventDetails.package_price_min).toFixed(0)}
                    </p>
                    {eventDetails.estimated_package_savings && eventDetails.estimated_package_savings > 0 && (
                      <p className="text-xs text-[#00FF8F] font-bold mt-1">
                        Ahorra €{Number(eventDetails.estimated_package_savings).toFixed(0)}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  {eventDetails.event_url && (
                    <Button variant="primary" className="w-full h-12 text-base" asChild>
                      <a href={eventDetails.event_url} target="_blank" rel="noopener noreferrer">
                        Reservar Entradas
                      </a>
                    </Button>
                  )}
                  
                  {eventDetails.has_hotel_offers && (
                    <Button variant="outline" className="w-full h-12">
                      Ver Paquetes
                    </Button>
                  )}
                </div>

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
