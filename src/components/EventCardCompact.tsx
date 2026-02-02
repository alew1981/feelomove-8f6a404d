import { Link } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import { Skeleton } from "./ui/skeleton";
import { getEventUrl } from "@/lib/eventUtils";
import { usePrefetchEvent } from "@/hooks/useEventData";
import { cn } from "@/lib/utils";
import { parseDate, isFuture, isPlaceholderDate, formatDay, formatMonth, formatYear } from "@/lib/dateUtils";

// Inline SVGs for critical icons (aria-hidden for screen reader accessibility)
const MapPinIcon = () => (
  <svg className="h-3 w-3 text-white/80 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);

interface EventCardCompactProps {
  event: {
    id?: string;
    event_id?: string;
    name?: string;
    event_name?: string;
    slug?: string;
    event_slug?: string;
    event_date?: string | null;
    venue_city: string;
    image_standard_url?: string;
    image_large_url?: string;
    event_image_large?: string;
    event_image_standard?: string;
    price_min_incl_fees?: number | null;
    ticket_price_min?: number | null;
    sold_out?: boolean;
    seats_available?: boolean;
    is_festival?: boolean | null;
    event_type?: string | null;
    on_sale_date?: string | null;
  };
  priority?: boolean;
  forceConcierto?: boolean;
}

/**
 * Redesigned compact event card for mobile 2-column grid
 * - Improved visual hierarchy
 * - Better touch targets
 * - Price indicator when available
 * - Cleaner typography
 */
const EventCardCompact = memo(({ event, priority = false, forceConcierto = false }: EventCardCompactProps) => {
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
  const imageUrl = event.image_large_url || event.event_image_large || event.image_standard_url || event.event_image_standard || "/placeholder.svg";
  const price = event.price_min_incl_fees ?? event.ticket_price_min ?? null;

  // Handle dates - use imported isPlaceholderDate
  const hasDate = Boolean(event.event_date) && !isPlaceholderDate(event.event_date);
  const eventDate = hasDate && event.event_date ? parseDate(event.event_date) : null;
  const dayNumber = eventDate ? formatDay(eventDate) : '';
  const monthName = eventDate ? formatMonth(eventDate).toUpperCase() : '';
  const year = eventDate ? formatYear(eventDate, true) : '';

  // Check sold out status
  const isSoldOut = event.sold_out === true || event.seats_available === false;
  
  // Check if not yet on sale
  const onSaleDate = event.on_sale_date ? parseDate(event.on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);

  // Determine route
  const isFestival = forceConcierto ? false : (event.is_festival === true || event.event_type === 'festival');
  const eventUrl = getEventUrl(eventSlug || '', isFestival);

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
      title={`Ver ${eventName}`}
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <Card 
        ref={cardRef} 
        className={cn(
          "overflow-hidden",
          "transition-all duration-200",
          "border border-border/40",
          "hover:shadow-xl hover:border-accent/30",
          "active:scale-[0.98]",
          isSoldOut && "opacity-75"
        )}
      >
        {/* Image Container - 3:4 aspect for better mobile viewing */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {isInView ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full" />
              )}
              <img
                src={imageUrl}
                alt={eventName}
                width={300}
                height={400}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  "transition-all duration-300 group-hover:scale-105",
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
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Date Badge - Redesigned */}
          {hasDate && (
            <div className={cn(
              "absolute top-2 left-2",
              "bg-white/95 backdrop-blur-sm rounded-lg",
              "px-2 py-1.5 text-center shadow-lg",
              "min-w-[52px]"
            )}>
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                {monthName}
              </div>
              <div className="text-lg font-black text-foreground leading-none">
                {dayNumber}
              </div>
              <div className="text-[9px] font-medium text-muted-foreground">
                {year}
              </div>
            </div>
          )}

          {/* Status Badges */}
          {isNotYetOnSale ? (
            <div className="absolute top-2 right-2">
              <Badge
                className={cn(
                  "text-[9px] font-bold px-2 py-1",
                  "bg-amber-500 text-white",
                  "flex items-center gap-1",
                )}
              >
                <ClockIcon />
                Pronto
              </Badge>
            </div>
          ) : null}

          {/* Event Info - Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            {/* Event Name */}
            <h3 className={cn(
              "text-white text-sm font-bold leading-snug",
              "line-clamp-2 mb-1.5",
              "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            )}>
              {eventName}
            </h3>
            
            {/* City + Price Row */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <MapPinIcon />
                <span className="text-[11px] text-white/90 font-medium truncate">
                  {event.venue_city}
                </span>
              </div>
              
              {/* Price Badge */}
              {price !== null && price > 0 && !isSoldOut && (
                <div className={cn(
                  "flex items-center gap-0.5",
                  "bg-accent/90 backdrop-blur-sm",
                  "px-1.5 py-0.5 rounded",
                  "flex-shrink-0"
                )}>
                  <span className="text-[10px] font-bold text-accent-foreground">
                    {price}€
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

EventCardCompact.displayName = "EventCardCompact";

export default EventCardCompact;