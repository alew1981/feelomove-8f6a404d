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

// Helper to strip HTML tags
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const HotelCard = ({ hotel, onAddHotel }: HotelCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
  const reviewScore = hotel.hotel_rating || hotel.hotel_stars;
  const reviewCount = hotel.hotel_reviews || 0;
  const facilities = hotel.facility_names_es || [];
  const displayFacilities = facilities.slice(0, 3);
  const remainingFacilities = facilities.length - 3;
  
  // Strip HTML from description
  const rawDescription = stripHtml(hotel.hotel_description) || "Hotel confortable cerca del venue";
  const shortDescription = rawDescription.length > 120 ? rawDescription.substring(0, 120) + "..." : rawDescription;
  const distanceText = hotel.distance_km > 0 ? `${hotel.distance_km.toFixed(1)} km` : "";

  return (
    <Card className="border-2 overflow-hidden hover:shadow-lg transition-all">
      <div className="relative h-40 sm:h-48">
        <img
          src={hotel.hotel_main_photo || "/placeholder.svg"}
          alt={hotel.hotel_name}
          className="w-full h-full object-cover"
        />
        {/* Rating badge with reviews - top left */}
        {reviewScore > 0 && (
          <Badge className="absolute top-2 left-2 bg-white text-foreground text-xs flex items-center gap-1">
            ★ {Number(reviewScore).toFixed(1)}
            {reviewCount > 0 && (
              <span className="text-muted-foreground">({reviewCount})</span>
            )}
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
      
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-1">{hotel.hotel_name}</h3>
        
        {/* Facilities badges - max 3 */}
        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {displayFacilities.map((facility, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-muted text-muted-foreground"
              >
                {facility}
              </Badge>
            ))}
            {remainingFacilities > 0 && (
              <Badge 
                variant="outline" 
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border-accent text-accent"
              >
                +{remainingFacilities} más
              </Badge>
            )}
          </div>
        )}
        
        {/* Description with expand */}
        <div className="mb-2">
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            {showFullDescription ? rawDescription : shortDescription}
          </p>
          {rawDescription.length > 120 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-[11px] sm:text-xs text-accent font-medium hover:underline mt-1 flex items-center gap-1"
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
            <p className="text-[10px] sm:text-xs text-muted-foreground">desde</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              €{pricePerNight.toFixed(0)}
            </p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">/noche</p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm"
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
