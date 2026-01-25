import { Link } from "react-router-dom";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import { Skeleton } from "./ui/skeleton";
import { getEventUrl } from "@/lib/eventUtils";
import { usePrefetchEvent } from "@/hooks/useEventData";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, Users } from "lucide-react";

interface FestivalListCardProps {
  festival: {
    event_id?: string;
    primary_attraction_id?: string;
    event_slug?: string;
    slug?: string;
    event_name?: string;
    festival_nombre?: string;
    name?: string;
    event_date?: string | null;
    festival_start_date?: string;
    festival_end_date?: string;
    venue_city: string;
    venue_name?: string;
    image_large_url?: string;
    image_standard_url?: string;
    sold_out?: boolean;
    seats_available?: boolean;
    on_sale_date?: string | null;
    festival_lineup_artists?: string[];
    attraction_names?: string[];
    festival_total_artists?: number;
    event_count?: number;
    events?: any[];
  };
  priority?: boolean;
}

/**
 * Compact list-style festival card for mobile
 * - Fixed height 100px for maximum density
 * - Date block on left (shows date range for multi-day)
 * - Square/rounded image for festivals
 * - Festival name + city + artist count in center
 * - Arrow CTA on right
 */
const FestivalListCard = memo(({ festival, priority = false }: FestivalListCardProps) => {
  const [isInView, setIsInView] = useState(priority);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [priority]);

  // Normalize field names
  const festivalName = festival.festival_nombre || festival.event_name || festival.name || '';
  const festivalSlug = festival.event_slug || festival.slug;
  const imageUrl = festival.image_large_url || festival.image_standard_url || "/placeholder.svg";

  // Handle dates
  const isPlaceholderDate = (d: string | null | undefined) => !d || d.startsWith('9999');
  const startDateStr = festival.festival_start_date || festival.event_date;
  const endDateStr = festival.festival_end_date;
  
  const hasStartDate = Boolean(startDateStr) && !isPlaceholderDate(startDateStr);
  const startDate = hasStartDate && startDateStr ? parseISO(startDateStr) : null;
  const endDate = endDateStr && !isPlaceholderDate(endDateStr) ? parseISO(endDateStr) : null;
  
  // For multi-day festivals, show day range
  const startDay = startDate ? format(startDate, "d") : '--';
  const endDay = endDate && endDate.getTime() !== startDate?.getTime() ? format(endDate, "d") : null;
  const monthName = startDate ? format(startDate, "MMM", { locale: es }).toUpperCase() : '';
  const year = startDate ? format(startDate, "yy") : '';

  // Check sold out status
  const isSoldOut = festival.sold_out === true || festival.seats_available === false;
  
  // Check if not yet on sale
  const onSaleDate = festival.on_sale_date ? parseISO(festival.on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);

  // Check if event is past
  const isEventPast = startDate && isPast(startDate);

  // Festival URL
  const eventUrl = getEventUrl(festivalSlug || '', true);

  // Artist count info
  const artistCount = festival.festival_total_artists || festival.attraction_names?.length || festival.festival_lineup_artists?.length || 0;
  const eventCount = festival.event_count || festival.events?.length || 0;

  // Prefetch on hover/touch
  const prefetchEvent = usePrefetchEvent();
  const handleInteraction = useCallback(() => {
    if (festivalSlug) {
      prefetchEvent(festivalSlug, true);
    }
  }, [festivalSlug, prefetchEvent]);

  return (
    <Link 
      to={eventUrl} 
      className="block group touch-manipulation" 
      title={`Ver ${festivalName}`}
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div 
        ref={cardRef}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5",
          "h-[100px] min-h-[100px]",
          "border-b border-border/50",
          "bg-card hover:bg-accent/5",
          "transition-colors duration-200",
          "active:bg-accent/10",
          (isSoldOut || isEventPast) && "opacity-60"
        )}
      >
        {/* a. Date Block - Left */}
        <div className={cn(
          "flex-shrink-0 w-[52px]",
          "flex flex-col items-center justify-center",
          "bg-accent/10 rounded-lg py-2",
          "text-center"
        )}>
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wide leading-none">
            {monthName}
          </span>
          <span className="text-xl font-black text-foreground leading-none mt-0.5">
            {endDay ? `${startDay}-${endDay}` : startDay}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground leading-none mt-0.5">
            {year}
          </span>
        </div>

        {/* b. Festival Image - Square with rounded corners */}
        <div className={cn(
          "flex-shrink-0 w-[56px] h-[56px] overflow-hidden",
          "rounded-xl",
          "bg-muted"
        )}>
          {isInView ? (
            <>
              {!imageLoaded && (
                <Skeleton className="w-full h-full" />
              )}
              <img
                src={imageUrl}
                alt={festivalName}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                className={cn(
                  "w-full h-full object-cover",
                  "transition-opacity duration-300",
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>

        {/* c. Info - Center (flex-grow) */}
        <div className="flex-grow min-w-0 flex flex-col justify-center gap-0.5">
          {/* Festival Name */}
          <h3 className={cn(
            "text-sm font-bold text-foreground",
            "truncate leading-tight"
          )}>
            {festivalName}
          </h3>
          
          {/* City */}
          <p className="text-xs text-muted-foreground truncate">
            {festival.venue_city}
          </p>

          {/* Status or Artist/Event Count */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {isNotYetOnSale ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
                <Clock className="h-3 w-3" />
                Pronto
              </span>
            ) : isSoldOut ? (
              <span className="text-[10px] font-bold text-destructive uppercase">
                Agotado
              </span>
            ) : isEventPast ? (
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Pasado
              </span>
            ) : (artistCount > 0 || eventCount > 1) ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {artistCount > 0 ? `${artistCount} artistas` : `${eventCount} opciones`}
              </span>
            ) : null}
          </div>
        </div>

        {/* d. Action Button - Right */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10",
          "flex items-center justify-center",
          "rounded-full",
          "bg-accent text-accent-foreground",
          "transition-transform duration-200",
          "group-hover:scale-110 group-active:scale-95"
        )}>
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
});

FestivalListCard.displayName = "FestivalListCard";

export default FestivalListCard;

/**
 * Skeleton for FestivalListCard - maintains same height and structure
 */
export const FestivalListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-3 py-2.5 h-[100px] min-h-[100px] border-b border-border/50">
    {/* Date Block */}
    <Skeleton className="w-[52px] h-[60px] rounded-lg flex-shrink-0" />
    
    {/* Image */}
    <Skeleton className="w-[56px] h-[56px] rounded-xl flex-shrink-0" />
    
    {/* Info */}
    <div className="flex-grow flex flex-col gap-1.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    
    {/* Button */}
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
  </div>
));

FestivalListCardSkeleton.displayName = "FestivalListCardSkeleton";
