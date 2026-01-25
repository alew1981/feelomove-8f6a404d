import { useRef, useState, useEffect, memo } from "react";
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
 * LazyHotelCard - Optimized wrapper with stable rendering
 * First 3 cards render immediately, rest use IntersectionObserver
 * Memoized to prevent unnecessary re-renders
 */
const LazyHotelCard = memo(({
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
  // First 3 cards render immediately - no lazy loading needed
  const isPriority = index < 3;
  const [hasIntersected, setHasIntersected] = useState(isPriority);

  useEffect(() => {
    // Priority cards already rendered, skip observer
    if (isPriority || hasIntersected) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px", threshold: 0 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isPriority, hasIntersected]);

  // Priority cards render immediately without any wrapper overhead
  if (isPriority) {
    return (
      <HotelCard
        hotel={hotel}
        onAddHotel={onAddHotel}
        checkinDate={checkinDate}
        checkoutDate={checkoutDate}
        eventName={eventName}
        showTicketHint={showTicketHint}
        isAdded={isAdded}
        priority={true}
      />
    );
  }

  return (
    <div ref={containerRef}>
      {hasIntersected ? (
        <HotelCard
          hotel={hotel}
          onAddHotel={onAddHotel}
          checkinDate={checkinDate}
          checkoutDate={checkoutDate}
          eventName={eventName}
          showTicketHint={showTicketHint}
          isAdded={isAdded}
          priority={false}
        />
      ) : (
        <HotelCardSkeleton />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.hotel.hotel_id === nextProps.hotel.hotel_id &&
    prevProps.isAdded === nextProps.isAdded &&
    prevProps.index === nextProps.index
  );
});

LazyHotelCard.displayName = 'LazyHotelCard';

export default LazyHotelCard;
