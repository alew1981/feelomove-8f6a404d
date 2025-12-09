import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

interface HotelCardProps {
  hotel: {
    hotel_id: string;
    hotel_name: string;
    hotel_main_photo: string;
    hotel_photos?: string[];
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
  checkinDate?: string;
  checkoutDate?: string;
}

// Helper to strip HTML tags
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const HotelCard = ({ hotel, onAddHotel, checkinDate, checkoutDate }: HotelCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
  const reviewScore = hotel.hotel_rating || hotel.hotel_stars;
  const reviewCount = hotel.hotel_reviews || 0;
  const facilities = hotel.facility_names_es || [];
  const displayFacilities = facilities.slice(0, 3);
  const remainingFacilities = facilities.length - 3;
  
  // Get photos array - main photo + additional photos if available
  const photos = hotel.hotel_photos?.length 
    ? [hotel.hotel_main_photo, ...hotel.hotel_photos.filter(p => p !== hotel.hotel_main_photo)]
    : [hotel.hotel_main_photo];
  const hasMultiplePhotos = photos.length > 1;
  
  // Strip HTML from description
  const rawDescription = stripHtml(hotel.hotel_description) || "Hotel confortable cerca del venue";
  const shortDescription = rawDescription.length > 120 ? rawDescription.substring(0, 120) + "..." : rawDescription;
  const distanceText = hotel.distance_km > 0 ? `${hotel.distance_km.toFixed(1)} km` : "";
  
  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Card className="border-2 overflow-hidden hover:shadow-lg transition-all">
      <div className="relative h-40 sm:h-48 group">
        <img
          src={photos[currentPhotoIndex] || "/placeholder.svg"}
          alt={hotel.hotel_name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        
        {/* Carousel controls */}
        {hasMultiplePhotos && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Photo indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentPhotoIndex 
                      ? "bg-accent w-3" 
                      : "bg-background/60 hover:bg-background/80"
                  }`}
                />
              ))}
              {photos.length > 5 && (
                <span className="text-[10px] text-background/80 ml-1">+{photos.length - 5}</span>
              )}
            </div>
          </>
        )}
        
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

        {/* Check-in/Check-out dates */}
        {checkinDate && checkoutDate && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 pb-2 border-b border-border">
            <span>Check-in: {formatDate(checkinDate)}</span>
            <span>Check-out: {formatDate(checkoutDate)}</span>
          </div>
        )}

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