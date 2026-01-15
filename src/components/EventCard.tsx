import { Link } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";
import { format, differenceInDays, differenceInHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState, memo, useRef } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { Skeleton } from "./ui/skeleton";
import { getEventUrl } from "@/lib/eventUtils";
import { getOptimizedImageUrl } from "@/lib/imageProxy";

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
      { rootMargin: '100px', threshold: 0 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [priority]);

  // Normalize field names (support both old and new views)
  const eventId = event.id || event.event_id;
  const eventName = event.name || event.event_name || '';
  const eventSlug = event.slug || event.event_slug;
  const rawImageUrl = event.image_large_url || event.event_image_large || event.image_standard_url || event.event_image_standard || "/placeholder.svg";
  // Use optimized image proxy for Ticketmaster images
  const imageUrl = getOptimizedImageUrl(rawImageUrl, { width: 400, quality: 80 });
  const price = event.price_min_incl_fees ?? event.ticket_price_min ?? event.ticket_cheapest_price ?? 0;
  const badges = event.badges || event.event_badges || [];
  
  // Detect if event has VIP tickets based on badges or name
  const hasVIP = badges.some((b: string) => /vip/i.test(b)) || /vip/i.test(eventName);

  // Handle null/undefined dates AND placeholder dates (9999-12-31)
  const isPlaceholderDate = (d: string | null | undefined) => !d || d.startsWith('9999');
  const hasDate = Boolean(event.event_date) && !isPlaceholderDate(event.event_date);
  const eventDate = hasDate && event.event_date ? parseISO(event.event_date) : null;
  const dayNumber = eventDate ? format(eventDate, "dd") : '';
  const monthName = eventDate ? format(eventDate, "MMM", { locale: es }).toUpperCase() : '';
  const year = eventDate ? format(eventDate, "yyyy") : '';
  const time = hasDate && event.local_event_date 
    ? format(parseISO(event.local_event_date), "HH:mm") 
    : eventDate 
      ? format(eventDate, "HH:mm") 
      : '';

  // Calculate countdown values ONCE (no intervals - static display for performance)
  const initialDaysUntil = eventDate ? differenceInDays(eventDate, new Date()) : -1;
  const showCountdown = eventDate && initialDaysUntil >= 0 && initialDaysUntil <= 30;
  
  // Calculate countdown statically - no real-time updates needed for cards list
  const countdown = (() => {
    if (!showCountdown || !eventDate) return null;
    const now = new Date();
    const days = Math.max(0, differenceInDays(eventDate, now));
    const hours = Math.max(0, differenceInHours(eventDate, now) % 24);
    const hoursUntil = differenceInHours(eventDate, now);
    return { 
      days, 
      hours, 
      isLessThan24Hours: hoursUntil < 24 && hoursUntil > 0 
    };
  })();

  // Determine badge - show SOLD OUT if sold_out OR seats_available is explicitly false
  // seats_available = false means actually sold out; seats_available = undefined/null means we don't know
  let badgeVariant: "disponible" | "agotado" | undefined;
  let badgeText: string | undefined;

  const isEventSoldOut = event.sold_out === true || event.seats_available === false;

  if (isEventSoldOut) {
    badgeVariant = "agotado";
    badgeText = "SOLD OUT";
  } else if (event.seats_available === true) {
    // Only show DISPONIBLE when we know for sure there are seats
    badgeVariant = "disponible";
    badgeText = "DISPONIBLE";
  }
  // If seats_available is null/undefined, don't show any availability badge

  // Determine if it's a festival based on is_festival OR event_type
  // BUT if forceConcierto is true (e.g., when inside FestivalDetalle), always use /concierto/
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

  return (
    <Link to={eventUrl} className="group block" title={`Ver entradas y detalles de ${eventName}`}>
      <Card ref={cardRef} className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20 shadow-lg">
        <article itemScope itemType="https://schema.org/Event">
          {/* Hidden semantic data for SEO */}
          <meta itemProp="name" content={eventName} />
          {isoDate && <meta itemProp="startDate" content={isoDate} />}
          <meta itemProp="eventAttendanceMode" content="https://schema.org/OfflineEventAttendanceMode" />
          <meta itemProp="eventStatus" content="https://schema.org/EventScheduled" />
          
          <div className="flex flex-col">
            {/* Main Event Area with Background Image */}
            <div className="relative h-56 overflow-hidden bg-muted">
              {/* Background Image - Lazy loaded with IntersectionObserver */}
              {isInView ? (
                <>
                  {!imageLoaded && (
                    <Skeleton className="absolute inset-0 w-full h-full" />
                  )}
                  <img
                    src={imageUrl}
                    alt={`${eventName} - Concierto en ${event.venue_city || 'España'}`}
                    title={`${eventName} - Concierto en ${event.venue_city || 'España'}`}
                    loading={priority ? "eager" : "lazy"}
                    decoding={priority ? "sync" : "async"}
                    fetchPriority={priority ? "high" : "low"}
                    width={400}
                    height={224}
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
                <Skeleton className="absolute inset-0 w-full h-full" />
              )}
              
              {/* Minimal Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Badge "Disponible" - Top Left above Date Card */}
              {badgeText && badgeVariant && (
                <div className="absolute left-2 top-0.5 z-20">
                  <Badge variant={badgeVariant} className="text-[10px] font-bold px-2 py-1">
                    {badgeText}
                  </Badge>
                </div>
              )}
              
              {/* Festival Badge - Top Right (when this is a day entry for a festival) */}
              {festivalBadgeName && (
                <div className="absolute right-2 top-2 z-20">
                  <Badge variant="secondary" className="text-[9px] font-bold bg-black/70 text-white border-0 px-2 py-0.5 max-w-[120px] truncate">
                    {festivalBadgeName}
                  </Badge>
                </div>
              )}
              
              {/* Category Badge - Bottom Left */}
              <div className="absolute bottom-3 left-3 z-10">
                <CategoryBadge badges={badges} />
              </div>

              {/* Date Card - Absolute positioned on the left */}
              <div className="absolute left-2 top-8 bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200" style={{ width: '85px' }}>
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
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1 font-medium" itemProp="name">
                      {event.venue_city || 'Por confirmar'}
                    </span>
                    <meta itemProp="address" content={event.venue_city || 'España'} />
                  </address>
                </div>
              </div>

              {/* VIP Badge and Countdown Timer - Top Right */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                {hasVIP && (
                  <div className="bg-foreground text-background text-[10px] font-bold px-2.5 py-1 rounded shadow-lg">
                    VIP
                  </div>
                )}
                {countdown && (
                  <div className="bg-black/90 backdrop-blur-md rounded-md px-3 py-2 shadow-xl border border-accent/30">
                    <div className="flex gap-2 text-accent font-['Poppins'] text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-xl font-bold leading-none">
                          {countdown.isLessThan24Hours 
                            ? String(countdown.hours).padStart(2, '0') 
                            : String(countdown.days).padStart(2, '0')}
                        </div>
                        <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">
                          {countdown.isLessThan24Hours ? 'HRS' : 'DÍAS'}
                        </div>
                      </div>
                      {!countdown.isLessThan24Hours && (
                        <>
                          <div className="text-xl font-bold self-center leading-none pb-2 text-white/60">:</div>
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-bold leading-none">{String(countdown.hours).padStart(2, '0')}</div>
                            <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">HRS</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Name Below Image */}
            <div className="bg-background px-4 pt-4 pb-2">
              <h3 className="text-foreground text-xl font-bold truncate leading-tight tracking-tight font-['Poppins']" itemProp="name">
                {eventName}
              </h3>
            </div>

            {/* Bottom Section with Button */}
            <div className="bg-background px-4 pb-4 flex justify-center items-center">
              <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 py-3 h-auto transition-all duration-300">
                <span>Ver entradas</span>
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
