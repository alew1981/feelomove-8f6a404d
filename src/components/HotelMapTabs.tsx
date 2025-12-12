import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin } from "lucide-react";
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
}

const HotelMapTabs = ({ hotels, mapWidgetHtml, hotelsListWidgetHtml, onAddHotel, checkinDate, checkoutDate }: HotelMapTabsProps) => {
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
            {/* Sorting dropdown */}
            <div className="flex justify-end mb-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 h-9 text-sm border-2">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Precio (menor a mayor)</SelectItem>
                  <SelectItem value="price-desc">Precio (mayor a menor)</SelectItem>
                  <SelectItem value="distance-asc">Distancia (más cercano)</SelectItem>
                  <SelectItem value="rating-desc">Valoración (mejor primero)</SelectItem>
                  <SelectItem value="stars-desc">Estrellas (más primero)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {sortedHotels.map((hotel) => (
                <HotelCard 
                  key={hotel.hotel_id} 
                  hotel={hotel} 
                  onAddHotel={onAddHotel}
                  checkinDate={checkinDate}
                  checkoutDate={checkoutDate}
                />
              ))}
            </div>
          </>
        ) : hotelsListWidgetHtml ? (
          <div className="rounded-xl overflow-hidden border-2 border-border">
            <iframe
              srcDoc={hotelsListWidgetHtml}
              className="w-full min-h-[500px] sm:min-h-[600px] border-0"
              title="Lista de hoteles"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay hoteles disponibles para este evento</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="map">
        {mapWidgetHtml ? (
          <div className="rounded-xl overflow-hidden border-2 border-border">
            <iframe
              srcDoc={mapWidgetHtml}
              className="w-full min-h-[350px] sm:min-h-[450px] border-0"
              title="Mapa de hoteles"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Mapa no disponible</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default HotelMapTabs;
