import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Loader2 } from "lucide-react";
import { getOptimizedCardImage } from "@/lib/imagekitUtils";

interface HotelCardProps {
  hotel: {
    hotel_id: string;
    hotel_name: string;
    hotel_main_photo: string;
    hotel_thumbnail?: string;
    hotel_photos?: string[];
    hotel_description: string;
    hotel_stars: number;
    hotel_rating: number;
    hotel_reviews: number;
    price: number;
    selling_price: number;
    distance_km: number;
    facility_names_es?: string[];
    hotel_address?: string;
    hotel_city?: string;
  };
  onAddHotel: (hotel: any) => void;
  checkinDate?: string;
  checkoutDate?: string;
  eventName?: string;
  showTicketHint?: boolean;
  isAdded?: boolean;
  priority?: boolean;
}

// Helper to strip HTML tags
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

// Get rating text based on score
const getRatingText = (rating: number): string => {
  if (rating >= 9) return "Excelente";
  if (rating >= 8) return "Muy bien";
  if (rating >= 7) return "Bien";
  if (rating >= 6) return "Aceptable";
  return "Regular";
};

/**
 * Optimized hotel image
 * All configured origins (Ticketmaster, Supabase, cupid.travel) use ImageKit CDN
 */
const HotelImage = memo(({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) => {
  const [hasError, setHasError] = useState(false);
  const fetchPriorityAttr = priority ? "high" : "low";

  return (
    <div className="relative w-full h-full aspect-video">
      <img
        src={hasError ? "/placeholder.svg" : src}
        alt={alt}
        className="w-full h-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...({ fetchpriority: fetchPriorityAttr } as any)}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        width={450}
        height={253}
      />
    </div>
  );
});

HotelImage.displayName = "HotelImage";

const HotelCard = ({
  hotel,
  onAddHotel,
  checkinDate,
  checkoutDate,
  eventName,
  showTicketHint = false,
  isAdded = false,
  priority = false,
}: HotelCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simplified & robust ImageKit URL for cupid.travel images
  // Format: https://ik.imagekit.io/feelomove/{full_original_url}?tr=w-600,h-400,fo-auto
  const imageUrl = hotel.hotel_main_photo?.includes("static.cupid.travel")
    ? `https://ik.imagekit.io/feelomove/${hotel.hotel_main_photo.split('?')[0]}?tr=w-600,h-400,fo-auto`
    : getOptimizedCardImage(hotel.hotel_main_photo);

  console.log("DEBUG HOTEL IMG:", imageUrl);

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
          className={`text-base tracking-tighter ${i < starCount ? "text-orange-400" : "text-muted/40"}`}
        >
          ★
        </span>,
      );
    }
    return stars;
  };

  const handleAddClick = async () => {
    if (isAdded) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    onAddHotel(hotel);
    setIsLoading(false);
  };

  return (
    <div
      className={`rounded-lg shadow-lg bg-card overflow-visible relative w-full transition-all ${isAdded ? "ring-2 ring-accent" : ""}`}
    >
      {/* Added badge */}
      {isAdded && (
        <div className="absolute -top-2 -right-2 z-20 bg-accent text-accent-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Review Box - Top Right */}
      {reviewScore > 0 && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-start p-1.5 bg-background/95 rounded-md shadow-sm">
          <span className="bg-accent text-accent-foreground px-1.5 py-1 rounded font-bold text-sm mr-1.5 leading-none">
            {Number(reviewScore).toFixed(1)}
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-foreground text-xs whitespace-nowrap">{getRatingText(reviewScore)}</span>
            {reviewCount > 0 && (
              <span className="text-xs font-bold text-muted-foreground">({reviewCount.toLocaleString()})</span>
            )}
          </div>
        </div>
      )}

      {/* Hotel Image */}
      <div className="h-[140px] sm:h-[200px] overflow-hidden rounded-t-lg bg-muted">
        <HotelImage
          src={imageUrl || "/placeholder.svg"}
          alt={`${hotel.hotel_name} - Hotel ${hotel.hotel_stars > 0 ? hotel.hotel_stars + " estrellas" : ""} en ${hotel.hotel_city || "España"} para eventos`}
          priority={priority}
        />
      </div>

      {/* Hotel Details */}
      <div className="p-4 pb-2.5">
        {/* Stars */}
        {hotel.hotel_stars > 0 && <div className="mb-1 leading-none">{renderStars(hotel.hotel_stars)}</div>}

        {/* Hotel Name */}
        <h3 className="text-base sm:text-xl font-bold text-foreground leading-tight mb-1 line-clamp-2 min-h-[2.4em]">
          {hotel.hotel_name}
        </h3>

        {/* Hotel Address and City */}
        {(hotel.hotel_address || hotel.hotel_city) && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {hotel.hotel_address}
            {hotel.hotel_address && hotel.hotel_city && ", "}
            {hotel.hotel_city}
          </p>
        )}

        {/* Distance to Event */}
        {distanceText && (
          <div className="text-sm text-muted-foreground mt-1 leading-snug">
            <strong className="font-bold">
              <MapPin className="h-3 w-3 inline-block mr-1" />a {distanceText} de:
            </strong>
            {eventName && (
              <span className="block text-muted-foreground font-normal mt-0.5 leading-tight">{eventName}</span>
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
      <div className="bg-muted p-3 sm:p-4 flex justify-end">
        <div className="text-right flex flex-col items-end w-full">
          <span className="text-2xl sm:text-3xl font-bold text-foreground block mb-0.5">
            €{pricePerNight.toFixed(0)}
          </span>
          <span className="text-xs text-muted-foreground block leading-tight">
            1 habitación x 1 noche impuestos incluidos
          </span>
          {showTicketHint && (
            <span className="text-[10px] text-accent font-medium block mt-0.5">+ entradas seleccionadas</span>
          )}
          <Button
            size="sm"
            className={`mt-2 font-bold text-sm px-3 py-1.5 rounded transition-all ${
              isAdded
                ? "bg-accent/20 text-accent border-2 border-accent cursor-default"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            }`}
            onClick={handleAddClick}
            disabled={isLoading || isAdded}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Añadido
              </>
            ) : (
              "Añadir al pack"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
