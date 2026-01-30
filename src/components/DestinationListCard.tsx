import { Link } from "react-router-dom";
import { memo, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePrefetch } from "@/hooks/usePrefetch";

// === INLINE SVG ICON (replaces lucide-react for TBT optimization) ===
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

interface DestinationListCardProps {
  city: {
    city_name: string;
    city_slug?: string;
    event_count?: number;
    concerts_count?: number;
    festivals_count?: number;
    price_from?: number;
    genres?: string[];
  };
  priority?: boolean;
}

/**
 * Compact list-style destination card for mobile
 * - Fixed height 80px for maximum density
 * - Icon on left, city name + event count in center
 * - No images for optimal performance
 */
const DestinationListCard = memo(({ city, priority = false }: DestinationListCardProps) => {
  const { prefetchDestination } = usePrefetch();
  const hasPrefetched = useRef(false);
  const eventCount = city.event_count || 0;
  const concertsCount = city.concerts_count || 0;
  const festivalsCount = city.festivals_count || 0;
  
  // Build event summary
  const eventSummary = [];
  if (concertsCount > 0) eventSummary.push(`${concertsCount} conciertos`);
  if (festivalsCount > 0) eventSummary.push(`${festivalsCount} festivales`);
  const eventText = eventSummary.length > 0 ? eventSummary.join(' · ') : `${eventCount} eventos`;

  const citySlug = city.city_slug || encodeURIComponent(city.city_name);

  // Prefetch on hover/touch for instant navigation
  const handlePrefetch = useCallback(() => {
    if (!hasPrefetched.current) {
      hasPrefetched.current = true;
      prefetchDestination(citySlug);
    }
  }, [citySlug, prefetchDestination]);

  return (
    <Link 
      to={`/destinos/${citySlug}`} 
      className="block group touch-manipulation" 
      title={`Eventos en ${city.city_name}`}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      <div 
        className={cn(
          "flex items-center gap-3 px-4",
          "h-[80px] min-h-[80px] max-h-[80px]",
          "border-b border-border/50",
          "bg-card hover:bg-accent/5",
          "transition-colors duration-200",
          "active:bg-accent/10"
        )}
        style={{
          contentVisibility: priority ? 'visible' : 'auto',
          containIntrinsicSize: '0 80px',
        }}
      >
        {/* Icon - Simple location marker */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10",
          "flex items-center justify-center",
          "rounded-full bg-accent/10"
        )}>
          <IconMapPin className="h-5 w-5 text-accent" />
        </div>

        {/* Info - Center */}
        <div className="flex-grow min-w-0 flex flex-col justify-center gap-0.5">
          {/* City Name */}
          <h3 className={cn(
            "text-base font-bold text-foreground",
            "truncate leading-tight"
          )}>
            {city.city_name}
          </h3>
          
          {/* Event Count */}
          <p className="text-sm text-muted-foreground truncate">
            {eventText}
          </p>
        </div>

        {/* Event Count Badge - Right */}
        <span className={cn(
          "flex-shrink-0 font-bold text-sm",
          "px-3 py-1.5 rounded-full",
          "bg-foreground text-background"
        )}>
          {eventCount}
        </span>
      </div>
    </Link>
  );
});

DestinationListCard.displayName = "DestinationListCard";

export default DestinationListCard;

/**
 * Skeleton for DestinationListCard - shimmer effect
 */
export const DestinationListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-4 h-[80px] min-h-[80px] border-b border-border/50">
    {/* Icon */}
    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    
    {/* Info */}
    <div className="flex-grow flex flex-col gap-1.5">
      <div className="h-5 w-2/3 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
      <div className="h-4 w-1/2 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    </div>
    
    {/* Badge */}
    <div className="w-12 h-8 rounded-full flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
  </div>
));

DestinationListCardSkeleton.displayName = "DestinationListCardSkeleton";
