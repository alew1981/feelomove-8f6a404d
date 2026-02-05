import { Link } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useEffect, useState, memo, useRef, useCallback } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { Skeleton } from "./ui/skeleton";
import { getEventUrl } from "@/lib/eventUtils";
import { usePrefetchEvent } from "@/hooks/useEventData";
import { getOptimizedCardImage, generateCardSrcSet } from "@/lib/imagekitUtils";
import { parseDate, isFuture, isPlaceholderDate, formatDay, formatMonth, formatYear, formatTime, formatShortDate, formatOnSaleBadge } from "@/lib/dateUtils";

// Inline SVGs for critical icons (eliminates lucide-react from critical path)
const MapPinIcon = () => (
  <svg className="h-2.5 w-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);

interface EventCardProps {
  event: {
    // Support both old and new field names
    id?: string;
    event_id?: string;
    name?: string;
    event_name?: string;
    slug?: string;
    event_slug?: string;
    event_date?: string | null;
    venue_city: string;
    venue_name?: string;
    venue_address?: string;
    local_event_date?: string | null;
    image_standard_url?: string;
    image_large_url?: string;
    event_image_large?: string;
    event_image_standard?: string;
    price_min_incl_fees?: number | null;
    ticket_price_min?: number | null;
    ticket_cheapest_price?: number;
    sold_out?: boolean;
    seats_available?: boolean;
    badges?: string[];
    event_badges?: string[];
    is_festival?: boolean | null;
    event_type?: string | null;
    // Festival parent info for "day entry" events
    primary_attraction_name?: string | null;
    secondary_attraction_name?: string | null;
    // On sale date for "coming soon" badge
    on_sale_date?: string | null;
  };
  // Optional: name of parent festival to show as badge (for artist day entries)
  festivalName?: string;
  // Force route type - when true, always use /concierto/ route regardless of event_type
  forceConcierto?: boolean;
}

interface EventCardComponentProps extends EventCardProps {
  priority?: boolean; // For LCP optimization - first 4 cards should have priority
}

const EventCard = memo(({ event, priority = false, festivalName, forceConcierto = false }: EventCardComponentProps) => {
  // Lazy loading state
  const [isInView, setIsInView] = useState(priority);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
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

  // Normalize field names (support both old and new views)
  const eventId = event.id || event.event_id;
  const eventName = event.name || event.event_name || '';
  const eventSlug = event.slug || event.event_slug;
  const imageUrl = event.image_large_url || event.event_image_large || event.image_standard_url || event.event_image_standard || "/placeholder.svg";
  const price = event.price_min_incl_fees ?? event.ticket_price_min ?? event.ticket_cheapest_price ?? 0;
  const badges = event.badges || event.event_badges || [];
  
  // Detect if event has VIP tickets based on badges or name
  const hasVIP = badges.some((b: string) => /vip/i.test(b)) || /vip/i.test(eventName);

  // Handle null/undefined dates AND placeholder dates (9999-12-31)
  const hasDate = Boolean(event.event_date) && !isPlaceholderDate(event.event_date);
  const eventDate = hasDate && event.event_date ? parseDate(event.event_date) : null;
  const dayNumber = eventDate ? formatDay(eventDate, true) : '';
  const monthName = eventDate ? formatMonth(eventDate).toUpperCase() : '';
  const year = eventDate ? formatYear(eventDate) : '';
  const time = hasDate && event.local_event_date 
    ? formatTime(parseDate(event.local_event_date)!) 
    : eventDate 
      ? formatTime(eventDate) 
      : '';

  // Check if tickets are not yet on sale - show "Inicio ventas" badge
  const onSaleDate = event.on_sale_date ? parseDate(event.on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);
  const onSaleDateFormatted = onSaleDate ? formatShortDate(onSaleDate) : '';
  // Format for the badge above event name: "DD mes HH:MMh"
  const onSaleBadgeFormatted = onSaleDate ? formatOnSaleBadge(onSaleDate) : '';

  // Availability badge: NEVER show SOLD OUT/AGOTADO (requested).
  // Only show DISPONIBLE when we know for sure there are seats.
  let badgeVariant: "disponible" | undefined;
  let badgeText: string | undefined;

  if (event.seats_available === true) {
    // Only show DISPONIBLE when we know for sure there are seats
    badgeVariant = "disponible";
    badgeText = "DISPONIBLE";
  }
  // If seats_available is null/undefined, don't show any availability badge

  // Determine if it's a festival based on is_festival OR event_type
  // BUT if forceConcierto is true (e.g., when inside FestivalDetalle), always use /conciertos/
  // NOTE: getEventUrl now returns plural routes as canonical
  const isFestival = forceConcierto ? false : (event.is_festival === true || event.event_type === 'festival');
  const eventUrl = getEventUrl(eventSlug || '', isFestival);
  
  // Determine festival badge name: passed prop or detect from event data
  // If secondary_attraction_name exists and differs from primary, it's likely a festival day entry
  const festivalBadgeName = festivalName || (
    event.secondary_attraction_name && 
    event.primary_attraction_name && 
    event.secondary_attraction_name !== event.primary_attraction_name
      ? event.primary_attraction_name
      : null
  );

  // ISO 8601 date for schema
  const isoDate = eventDate ? event.event_date : undefined;

  // Prefetch event data on hover for instant navigation
  const prefetchEvent = usePrefetchEvent();
  const handleMouseEnter = useCallback(() => {
    if (eventSlug) {
      prefetchEvent(eventSlug, isFestival);
    }
  }, [eventSlug, isFestival, prefetchEvent]);

  return (
    <Link 
      to={eventUrl} 
      className="group block" 
      title={`Ver entradas y detalles de ${eventName}`}
      onMouseEnter={handleMouseEnter}
    >
      <Card ref={cardRef} className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20 shadow-lg">
        <article itemScope itemType="https://schema.org/Event">
          {/* Hidden semantic data for SEO */}
          <meta itemProp="name" content={eventName} />
          {isoDate && <meta itemProp="startDate" content={isoDate} />}
          <meta itemProp="eventAttendanceMode" content="https://schema.org/OfflineEventAttendanceMode" />
          <meta itemProp="eventStatus" content="https://schema.org/EventScheduled" />
          
          <div className="flex flex-col">
            {/* Main Event Area with Background Image */}
            <div className="relative h-64 overflow-hidden bg-muted" style={{ aspectRatio: '16 / 10' }}>
              {/* Background Image - Lazy loaded with IntersectionObserver */}
              {isInView ? (
                <>
                  {!imageLoaded && (
                    <Skeleton className="absolute inset-0 w-full h-full animate-shimmer" />
                  )}
                  <img
                    src={getOptimizedCardImage(imageUrl)}
                    srcSet={generateCardSrcSet(imageUrl)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    alt={`${eventName} - Concierto en ${event.venue_city || 'España'}`}
                    title={`${eventName} - Concierto en ${event.venue_city || 'España'}`}
                    loading={priority ? "eager" : "lazy"}
                    decoding={priority ? "sync" : "async"}
                    fetchPriority={priority ? "high" : "low"}
                    width={450}
                    height={281}
                    style={{ contentVisibility: priority ? 'visible' : 'auto' }}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                      setImageLoaded(true);
                    }}
                    itemProp="image"
                  />
                </>
              ) : (
                <Skeleton className="absolute inset-0 w-full h-full animate-shimmer" />
              )}
              
              {/* Gradient Overlay - stronger at bottom for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Badge "On Sale Soon" - Top Right (priority over availability) */}
              {isNotYetOnSale ? (
                <div className="absolute right-2 top-2 z-20">
                  <Badge className="text-[10px] font-bold px-2 py-1.5 bg-accent text-accent-foreground flex flex-col items-center leading-tight shadow-lg uppercase">
                    <span className="flex items-center gap-1">
                      <ClockIcon />
                      A la venta:
                    </span>
                    <span>{onSaleBadgeFormatted}</span>
                  </Badge>
                </div>
              ) : badgeText && badgeVariant ? (
                <div className="absolute left-2 top-0.5 z-20">
                  <Badge variant={badgeVariant} className="text-[10px] font-bold px-2 py-1">
                    {badgeText}
                  </Badge>
                </div>
              ) : null}
              
              {/* Category Badge - Above event name */}
              <div className="absolute bottom-14 left-3 z-10">
                <CategoryBadge badges={badges} />
              </div>

              {/* Event Name - Overlaid at bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <h3 className="text-white text-xl font-bold leading-tight tracking-tight font-['Poppins'] line-clamp-2 drop-shadow-lg" itemProp="name">
                  {eventName}
                </h3>
              </div>

              {/* Date Card - Absolute positioned on the left, aligned with countdown */}
              <div className="absolute left-2 top-3 bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200" style={{ width: '85px' }}>
                <div className="text-center px-2 py-2 bg-gradient-to-b from-gray-50 to-white">
                  {hasDate && eventDate ? (
                    <time dateTime={isoDate} itemProp="startDate" content={isoDate}>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{monthName}</div>
                      <div className="text-3xl font-black text-gray-900 leading-none my-1">{dayNumber}</div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">{year}</div>
                      {/* Time */}
                      {time && time !== "00:00" && <div className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5">{time}h</div>}
                    </time>
                  ) : (
                    <time dateTime="" aria-label="Fecha pendiente de confirmar">
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">FECHA</div>
                      <div className="text-xs font-bold text-gray-700 my-2 px-1">Por confirmar</div>
                    </time>
                  )}
                  {/* Location with semantic address tag */}
                  <address 
                    className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-1 border-t border-gray-200 pt-1.5 not-italic"
                    itemProp="location" 
                    itemScope 
                    itemType="https://schema.org/Place"
                  >
                    <MapPinIcon />
                    <span className="line-clamp-1 font-medium" itemProp="name">
                      {event.venue_city || 'Por confirmar'}
                    </span>
                    <meta itemProp="address" content={event.venue_city || 'España'} />
                  </address>
                </div>
              </div>

              {/* VIP Badge - Top Right */}
              {hasVIP && (
                <div className="absolute top-3 right-3 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded shadow-lg">
                  VIP
                </div>
              )}
            </div>

            {/* Bottom Section with Button - vertical padding for centering */}
            <div className="bg-background px-4 py-4 flex justify-center items-center">
              <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 py-3 h-auto transition-all duration-300">
                <span>VER ENTRADAS</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Button>
            </div>
          </div>
        </article>
      </Card>
    </Link>
  );
});

EventCard.displayName = "EventCard";

export default EventCard;
