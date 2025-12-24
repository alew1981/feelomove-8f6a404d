import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

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
  eventName?: string;
}

// Helper to strip HTML tags
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

// Get rating text based on score
const getRatingText = (rating: number): string => {
  if (rating >= 9) return "Excelente";
  if (rating >= 8) return "Muy bien";
  if (rating >= 7) return "Bien";
  if (rating >= 6) return "Aceptable";
  return "Regular";
};

const HotelCard = ({ hotel, onAddHotel, checkinDate, checkoutDate, eventName }: HotelCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
  const reviewScore = hotel.hotel_rating || hotel.hotel_stars;
  const reviewCount = hotel.hotel_reviews || 0;
  
  // Strip HTML from description
  const rawDescription = stripHtml(hotel.hotel_description) || "Hotel confortable cerca del venue";
  const shortDescription = rawDescription.length > 100 ? rawDescription.substring(0, 100) + "..." : rawDescription;
  const distanceText = hotel.distance_km > 0 ? `${hotel.distance_km.toFixed(1)} km` : "";
  
  // Render stars
  const renderStars = (starCount: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`text-base ${i < starCount ? "text-orange-400" : "text-muted/40"}`}
          style={{ letterSpacing: '-2px' }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="rounded-lg shadow-lg bg-card overflow-visible relative max-w-[350px]">
      {/* Review Box - Top Right */}
      {reviewScore > 0 && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-start p-1.5 bg-background/95 rounded-md shadow-sm">
          <span className="bg-accent text-accent-foreground px-1.5 py-1 rounded font-bold text-sm mr-1.5 leading-none">
            {Number(reviewScore).toFixed(1)}
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-foreground text-xs whitespace-nowrap">
              {getRatingText(reviewScore)}
            </span>
            {reviewCount > 0 && (
              <span className="text-xs font-bold text-muted-foreground">
                ({reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hotel Image */}
      <div className="h-[200px] overflow-hidden rounded-t-lg bg-muted">
        <img
          src={hotel.hotel_main_photo || "/placeholder.svg"}
          alt={hotel.hotel_name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          width={350}
          height={200}
        />
      </div>

      {/* Hotel Details */}
      <div className="p-4 pb-2.5">
        {/* Stars */}
        {hotel.hotel_stars > 0 && (
          <div className="mb-1 leading-none">
            {renderStars(hotel.hotel_stars)}
          </div>
        )}

        {/* Hotel Name */}
        <h3 className="text-xl font-bold text-foreground leading-tight mb-2 line-clamp-2 min-h-[2.4em]">
          {hotel.hotel_name}
        </h3>

        {/* Distance to Event */}
        {distanceText && (
          <div className="text-sm text-muted-foreground mt-1 leading-snug">
            <strong className="font-bold">
              <MapPin className="h-3 w-3 inline-block mr-1" />
              a {distanceText} de:
            </strong>
            {eventName && (
              <span className="block text-muted-foreground font-normal mt-0.5 leading-tight">
                {eventName}
              </span>
            )}
          </div>
        )}

        {/* Description with Toggle */}
        <div className="pt-2.5 mt-2.5 border-t border-border leading-relaxed">
          {showFullDescription ? (
            <div className="text-sm text-muted-foreground">
              {rawDescription}
              <button
                onClick={() => setShowFullDescription(false)}
                className="text-primary font-medium text-xs ml-1 hover:underline whitespace-nowrap"
                aria-label="Ver menos descripción del hotel"
              >
                ver menos
              </button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <span>{shortDescription}</span>
              {rawDescription.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="text-primary font-medium text-xs ml-1 hover:underline whitespace-nowrap"
                  aria-label="Ver más descripción del hotel"
                >
                  ver más
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Price */}
      <div className="bg-muted p-4 flex justify-end">
        <div className="text-right flex flex-col items-end w-full">
          <span className="text-3xl font-bold text-foreground block mb-0.5">
            €{pricePerNight.toFixed(0)}
          </span>
          <span className="text-xs text-muted-foreground block leading-tight mb-2">
            1 habitación x 1 noche impuestos incluidos
          </span>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm px-3 py-1.5 rounded"
            onClick={() => onAddHotel(hotel)}
          >
            Añadir a la cesta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
