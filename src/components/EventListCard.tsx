import { Link } from "react-router-dom";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import { Skeleton } from "./ui/skeleton";
import { getEventUrl } from "@/lib/eventUtils";
import { usePrefetchEvent } from "@/hooks/useEventData";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock } from "lucide-react";

// Thumbnail optimization: generate small image URL for list cards
const getOptimizedThumbnail = (url: string): string => {
  if (!url || url === "/placeholder.svg") return url;
  
  // For Ticketmaster images, request smaller size
  if (url.includes("ticketm.net") || url.includes("ticketmaster")) {
    // Replace RATIO/WIDTH_HEIGHT with smaller dimensions
    return url
      .replace(/RATIO\/\d+_\d+/g, "RATIO/1_1")
      .replace(/\/\d+x\d+\//g, "/100x100/");
  }
  
  return url;
};

interface EventListCardProps {
  event: {
    id?: string;
    event_id?: string;
    name?: string;
    event_name?: string;
    slug?: string;
    event_slug?: string;
    event_date?: string | null;
    venue_city: string;
    venue_name?: string;
    image_standard_url?: string;
    image_large_url?: string;
    event_image_large?: string;
    event_image_standard?: string;
    artist_name?: string;
    primary_attraction_name?: string;
    price_min_incl_fees?: number | null;
    ticket_price_min?: number | null;
    sold_out?: boolean;
    seats_available?: boolean;
    is_festival?: boolean | null;
    event_type?: string | null;
    on_sale_date?: string | null;
    // Festival-specific
    attraction_names?: string[];
    festival_lineup_artists?: string[];
  };
  priority?: boolean;
  forceConcierto?: boolean;
}

/**
 * Compact list-style event card for mobile
 * - Fixed height 100px for maximum density (4-5 visible per screen)
 * - Date block on left with black background
 * - Circular/rounded image optimized as thumbnail
 * - Event name + city in center
 * - Arrow CTA on right
 */
const EventListCard = memo(({ event, priority = false, forceConcierto = false }: EventListCardProps) => {
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
  const eventName = event.name || event.event_name || '';
  const eventSlug = event.slug || event.event_slug;
  const artistName = event.artist_name || event.primary_attraction_name || '';
  const rawImageUrl = event.image_standard_url || event.event_image_standard || event.image_large_url || event.event_image_large || "/placeholder.svg";
  // Use optimized thumbnail for list cards
  const imageUrl = getOptimizedThumbnail(rawImageUrl);

  // Handle dates
  const isPlaceholderDate = (d: string | null | undefined) => !d || d.startsWith('9999');
  const hasDate = Boolean(event.event_date) && !isPlaceholderDate(event.event_date);
  const eventDate = hasDate && event.event_date ? parseISO(event.event_date) : null;
  const dayNumber = eventDate ? format(eventDate, "d") : '--';
  const monthName = eventDate ? format(eventDate, "MMM", { locale: es }).toUpperCase() : '';
  const year = eventDate ? format(eventDate, "yyyy") : ''; // Full year (2026)

  // Check sold out status
  const isSoldOut = event.sold_out === true || event.seats_available === false;
  
  // Check if not yet on sale
  const onSaleDate = event.on_sale_date ? parseISO(event.on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);

  // Check if event is past
  const isEventPast = eventDate && isPast(eventDate);

  // Determine route
  const isFestival = forceConcierto ? false : (event.is_festival === true || event.event_type === 'festival');
  const eventUrl = getEventUrl(eventSlug || '', isFestival);

  // Display name - for concerts show artist, for festivals show event name
  const displayName = isFestival ? eventName : (artistName || eventName);
  
  // Extra info for festivals
  const artistCount = event.attraction_names?.length || event.festival_lineup_artists?.length || 0;
  const festivalExtraInfo = isFestival && artistCount > 1 ? `${artistCount} artistas` : '';

  // Prefetch on hover/touch
  const prefetchEvent = usePrefetchEvent();
  const handleInteraction = useCallback(() => {
    if (eventSlug) {
      prefetchEvent(eventSlug, isFestival);
    }
  }, [eventSlug, isFestival, prefetchEvent]);

  return (
    <Link 
      to={eventUrl} 
      className="block group touch-manipulation" 
      title={`Ver ${displayName}`}
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div 
        ref={cardRef}
        className={cn(
          "flex items-center gap-3 px-3",
          "h-[100px] min-h-[100px] max-h-[100px]",
          "border-b border-border/50",
          "bg-card hover:bg-accent/5",
          "transition-colors duration-200",
          "active:bg-accent/10",
          (isSoldOut || isEventPast) && "opacity-60"
        )}
      >
        {/* a. Date Block - Left - Black background with white text */}
        <div className={cn(
          "flex-shrink-0 w-[54px] h-[72px]",
          "flex flex-col items-center justify-center",
          "bg-foreground rounded-lg",
          "text-center"
        )}>
          <span className="text-2xl font-black text-background leading-none">
            {dayNumber}
          </span>
          <span className="text-[10px] font-bold text-background/90 uppercase tracking-wider leading-none mt-1">
            {monthName}
          </span>
          <span className="text-[9px] font-medium text-background/70 leading-none mt-0.5">
            {year}
          </span>
        </div>

        {/* b. Event Image - Optimized thumbnail */}
        <div className={cn(
          "flex-shrink-0 w-[56px] h-[56px] overflow-hidden",
          isFestival ? "rounded-xl" : "rounded-full",
          "bg-muted"
        )}>
          {isInView ? (
            <>
              {!imageLoaded && (
                <Skeleton className="w-full h-full" />
              )}
              <img
                src={imageUrl}
                alt={displayName}
                width={56}
                height={56}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className={cn(
                  "w-full h-full object-cover",
                  "transition-opacity duration-200",
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
          {/* Event/Artist Name */}
          <h3 className={cn(
            "text-sm font-bold text-foreground",
            "truncate leading-tight"
          )}>
            {displayName}
          </h3>
          
          {/* City / Venue */}
          <p className="text-xs text-muted-foreground truncate">
            {event.venue_city}
            {event.venue_name && ` · ${event.venue_name}`}
          </p>

          {/* Status Badges or Festival Extra Info */}
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
            ) : festivalExtraInfo ? (
              <span className="text-[10px] text-muted-foreground">
                {festivalExtraInfo}
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

EventListCard.displayName = "EventListCard";

export default EventListCard;

/**
 * Skeleton for EventListCard - maintains same height and structure
 */
export const EventListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-3 py-2.5 h-[100px] min-h-[100px] border-b border-border/50">
    {/* Date Block */}
    <Skeleton className="w-[52px] h-[60px] rounded-lg flex-shrink-0" />
    
    {/* Image */}
    <Skeleton className="w-[56px] h-[56px] rounded-full flex-shrink-0" />
    
    {/* Info */}
    <div className="flex-grow flex flex-col gap-1.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    
    {/* Button */}
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
  </div>
));

EventListCardSkeleton.displayName = "EventListCardSkeleton";
