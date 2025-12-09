import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  onAddHotel: (hotel: HotelData) => void;
}

const HotelMapTabs = ({ hotels, mapWidgetHtml, onAddHotel }: HotelMapTabsProps) => {
  return (
    <Tabs defaultValue="hotels" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="hotels" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Hoteles Disponibles
        </TabsTrigger>
        <TabsTrigger value="map" className="flex items-center gap-2" disabled={!mapWidgetHtml}>
          <MapPin className="h-4 w-4" />
          Mapa Hoteles
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="hotels">
        {hotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotels.map((hotel) => (
              <HotelCard 
                key={hotel.hotel_id} 
                hotel={hotel} 
                onAddHotel={onAddHotel} 
              />
            ))}
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
              className="w-full min-h-[450px] border-0"
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
