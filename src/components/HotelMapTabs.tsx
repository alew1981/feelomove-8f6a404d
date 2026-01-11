import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Check, ArrowDown } from "lucide-react";
import HotelCard from "./HotelCard";

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

interface HotelMapTabsProps {
  hotels: HotelData[];
  mapWidgetHtml: string | null;
  hotelsListWidgetHtml?: string | null;
  onAddHotel: (hotel: HotelData) => void;
  checkinDate?: string;
  checkoutDate?: string;
  eventName?: string;
  ticketsSelected?: boolean;
  selectedHotelId?: string | null;
}

const HotelMapTabs = ({ 
  hotels, 
  mapWidgetHtml, 
  hotelsListWidgetHtml, 
  onAddHotel, 
  checkinDate, 
  checkoutDate, 
  eventName,
  ticketsSelected = false,
  selectedHotelId = null
}: HotelMapTabsProps) => {
  const [sortBy, setSortBy] = useState<string>("price-asc");

  const sortedHotels = useMemo(() => {
    const sorted = [...hotels];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => (a.selling_price || a.price || 0) - (b.selling_price || b.price || 0));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.selling_price || b.price || 0) - (a.selling_price || a.price || 0));
        break;
      case "distance-asc":
        sorted.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
        break;
      case "rating-desc":
        sorted.sort((a, b) => (b.hotel_rating || b.hotel_stars || 0) - (a.hotel_rating || a.hotel_stars || 0));
        break;
      case "stars-desc":
        sorted.sort((a, b) => (b.hotel_stars || 0) - (a.hotel_stars || 0));
        break;
    }
    return sorted;
  }, [hotels, sortBy]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            selectedHotelId 
              ? "bg-accent text-accent-foreground" 
              : "bg-foreground text-background"
          }`}>
            {selectedHotelId ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Completa tu pack con un hotel</h2>
            {selectedHotelId && (
              <p className="text-sm text-foreground flex items-center gap-1 mt-0.5">
                <Check className="h-3 w-3 text-accent" />
                Hotel añadido al pack
              </p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="hotels" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-12 sm:h-10 p-1 bg-muted/80">
          <TabsTrigger 
            value="hotels" 
            className="flex items-center justify-center gap-2 text-sm sm:text-sm font-semibold h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
          >
            <Building2 className="h-4 w-4 sm:h-4 sm:w-4" />
            <span>Hoteles</span>
          </TabsTrigger>
          <TabsTrigger 
            value="map" 
            className="flex items-center justify-center gap-2 text-sm sm:text-sm font-semibold h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md transition-all" 
            disabled={!mapWidgetHtml}
          >
            <MapPin className="h-4 w-4 sm:h-4 sm:w-4" />
            <span>Mapa</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="hotels">
          {hotels.length > 0 ? (
            <>
              {/* Sorting dropdown - improved visibility */}
              <div className="flex items-center justify-end mb-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-80 md:w-96 h-11 sm:h-12 text-sm sm:text-base border-2 border-border bg-card font-medium shadow-sm">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-2 w-full min-w-[320px]">
                    <SelectItem value="price-asc" className="text-sm sm:text-base py-3">Precio (menor a mayor)</SelectItem>
                    <SelectItem value="price-desc" className="text-sm sm:text-base py-3">Precio (mayor a menor)</SelectItem>
                    <SelectItem value="distance-asc" className="text-sm sm:text-base py-3">Distancia (más cercano)</SelectItem>
                    <SelectItem value="rating-desc" className="text-sm sm:text-base py-3">Valoración (mejor puntuada)</SelectItem>
                    <SelectItem value="stars-desc" className="text-sm sm:text-base py-3">Estrellas (más estrellas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedHotels.map((hotel) => (
                  <HotelCard 
                    key={hotel.hotel_id} 
                    hotel={hotel} 
                    onAddHotel={onAddHotel}
                    checkinDate={checkinDate}
                    checkoutDate={checkoutDate}
                    eventName={eventName}
                    showTicketHint={ticketsSelected}
                    isAdded={selectedHotelId === hotel.hotel_id}
                  />
                ))}
              </div>
            </>
          ) : hotelsListWidgetHtml ? (
            <div className="space-y-4">
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Buscar hoteles cercanos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Encuentra alojamiento cerca del evento con disponibilidad y precios actualizados.
                  </p>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-border shadow-lg">
                <iframe
                  srcDoc={hotelsListWidgetHtml}
                  className="w-full min-h-[500px] sm:min-h-[600px] border-0"
                  title="Lista de hoteles"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay hoteles disponibles para este evento</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Los hoteles se añadirán próximamente</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="map">
          {mapWidgetHtml ? (
            <div className="rounded-xl overflow-hidden border-2 border-border">
              <iframe
                src={mapWidgetHtml}
                className="w-full h-[550px] sm:h-[650px] lg:h-[720px] border-0"
                title="Mapa de hoteles"
                allow="geolocation"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Mapa no disponible</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HotelMapTabs;
