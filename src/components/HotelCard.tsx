import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

interface HotelCardProps {
  hotel: {
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
  };
  onAddHotel: (hotel: any) => void;
}

const HotelCard = ({ hotel, onAddHotel }: HotelCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
  const reviewScore = hotel.hotel_rating || hotel.hotel_stars;
  const facilities = hotel.facility_names_es || [];
  const displayFacilities = facilities.slice(0, 5);
  const remainingFacilities = facilities.length - 5;
  const description = hotel.hotel_description || "Hotel confortable cerca del venue";
  const shortDescription = description.length > 100 ? description.substring(0, 100) + "..." : description;
  const distanceText = hotel.distance_km > 0 ? `${hotel.distance_km.toFixed(1)} km` : "";

  return (
    <Card className="border-2 overflow-hidden hover:shadow-lg transition-all">
      <div className="relative h-48">
        <img
          src={hotel.hotel_main_photo || "/placeholder.svg"}
          alt={hotel.hotel_name}
          className="w-full h-full object-cover"
        />
        {/* Rating badge - top left */}
        {reviewScore > 0 && (
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-xs">
            ★ {Number(reviewScore).toFixed(1)}
          </Badge>
        )}
        {/* Distance badge - top right */}
        {distanceText && (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {distanceText}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-base mb-2 line-clamp-1">{hotel.hotel_name}</h3>
        
        {/* Facilities badges */}
        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {displayFacilities.map((facility, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground"
              >
                {facility}
              </Badge>
            ))}
            {remainingFacilities > 0 && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-2 py-0.5 border-accent text-accent"
              >
                +{remainingFacilities} más
              </Badge>
            )}
          </div>
        )}
        
        {/* Description with expand */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">
            {showFullDescription ? description : shortDescription}
          </p>
          {description.length > 100 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-xs text-accent font-medium hover:underline mt-1 flex items-center gap-1"
            >
              {showFullDescription ? (
                <>Ver menos <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Ver más <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">desde</p>
            <p className="text-xl font-bold text-foreground">
              €{pricePerNight.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">/noche</p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => onAddHotel(hotel)}
          >
            Añadir
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HotelCard;
