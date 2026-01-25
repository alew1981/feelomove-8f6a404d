import { useRef, useState, useEffect } from "react";
import HotelCard from "./HotelCard";
import HotelCardSkeleton from "./HotelCardSkeleton";

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
  hotel_address?: string;
  hotel_city?: string;
}

interface LazyHotelCardProps {
  hotel: HotelData;
  onAddHotel: (hotel: HotelData) => void;
  checkinDate?: string;
  checkoutDate?: string;
  eventName?: string;
  showTicketHint?: boolean;
  isAdded?: boolean;
  index: number;
}

/**
 * LazyHotelCard - Wraps HotelCard with intersection observer for progressive loading
 * First 2 cards load immediately, rest load when 200px from viewport
 */
const LazyHotelCard = ({
  hotel,
  onAddHotel,
  checkinDate,
  checkoutDate,
  eventName,
  showTicketHint = false,
  isAdded = false,
  index,
}: LazyHotelCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // First 2 cards render immediately for perceived performance
  const [shouldRender, setShouldRender] = useState(index < 2);

  useEffect(() => {
    // Skip observer for immediately rendered cards
    if (index < 2) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [index]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        // Reserve space to prevent CLS
        minHeight: shouldRender ? 'auto' : '340px',
        contentVisibility: shouldRender ? 'visible' : 'auto',
        containIntrinsicSize: '0 340px',
      }}
    >
      {shouldRender ? (
        <HotelCard
          hotel={hotel}
          onAddHotel={onAddHotel}
          checkinDate={checkinDate}
          checkoutDate={checkoutDate}
          eventName={eventName}
          showTicketHint={showTicketHint}
          isAdded={isAdded}
          priority={index < 2}
        />
      ) : (
        <HotelCardSkeleton />
      )}
    </div>
  );
};

export default LazyHotelCard;
