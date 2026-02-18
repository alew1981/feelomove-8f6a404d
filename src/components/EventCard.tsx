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
import { useTranslation } from "@/hooks/useTranslation";
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
    primary_attraction_name?: string | null;
    secondary_attraction_name?: string | null;
    on_sale_date?: string | null;
  };
  festivalName?: string;
  forceConcierto?: boolean;
}

interface EventCardComponentProps extends EventCardProps {
  priority?: boolean;
}

const EventCard = memo(({ event, priority = false, festivalName, forceConcierto = false }: EventCardComponentProps) => {
  const { t, locale } = useTranslation();
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

  const eventId = event.id || event.event_id;
  const eventName = event.name || event.event_name || '';
  const eventSlug = event.slug || event.event_slug;
  const imageUrl = event.image_large_url || event.event_image_large || event.image_standard_url || event.event_image_standard || "/placeholder.svg";
  const price = event.price_min_incl_fees ?? event.ticket_price_min ?? event.ticket_cheapest_price ?? 0;
  const badges = event.badges || event.event_badges || [];
  
  const hasVIP = badges.some((b: string) => /vip/i.test(b)) || /vip/i.test(eventName);

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

  const onSaleDate = event.on_sale_date ? parseDate(event.on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);
  const onSaleBadgeFormatted = onSaleDate ? formatOnSaleBadge(onSaleDate) : '';

  let badgeVariant: "disponible" | undefined;
  let badgeText: string | undefined;

  if (event.seats_available === true) {
    badgeVariant = "disponible";
    badgeText = t("DISPONIBLE");
  }

  const isFestival = forceConcierto ? false : (event.is_festival === true || event.event_type === 'festival');
  const eventUrl = getEventUrl(eventSlug || '', isFestival, locale);
  
  const festivalBadgeName = festivalName || (
    event.secondary_attraction_name && 
    event.primary_attraction_name && 
    event.secondary_attraction_name !== event.primary_attraction_name
      ? event.primary_attraction_name
      : null
  );

  const isoDate = eventDate ? event.event_date : undefined;

  const prefetchEvent = usePrefetchEvent();
  const handleMouseEnter = useCallback(() => {
    if (eventSlug) {
      prefetchEvent(eventSlug, isFestival);
    }
  }, [eventSlug, isFestival, prefetchEvent]);

  const concertLabel = locale === 'en' ? 'Concert' : 'Concierto';

  return (
    <Link 
      to={eventUrl} 
      className="group block" 
      title={`${t("Ver entradas y detalles de")} ${eventName}`}
      onMouseEnter={handleMouseEnter}
    >
      <Card ref={cardRef} className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20 shadow-lg">
        <article itemScope itemType="https://schema.org/Event">
          <meta itemProp="name" content={eventName} />
          {isoDate && <meta itemProp="startDate" content={isoDate} />}
          <meta itemProp="eventAttendanceMode" content="https://schema.org/OfflineEventAttendanceMode" />
          <meta itemProp="eventStatus" content="https://schema.org/EventScheduled" />
          
          <div className="flex flex-col">
            <div className="relative h-64 overflow-hidden bg-muted" style={{ aspectRatio: '16 / 10' }}>
              {isInView ? (
                <>
                  {!imageLoaded && (
                    <Skeleton className="absolute inset-0 w-full h-full animate-shimmer" />
                  )}
                  <img
                    src={getOptimizedCardImage(imageUrl)}
                    srcSet={generateCardSrcSet(imageUrl)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    alt={`${eventName} - ${concertLabel} ${t("en")} ${event.venue_city || 'España'}`}
                    title={`${eventName} - ${concertLabel} ${t("en")} ${event.venue_city || 'España'}`}
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
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {isNotYetOnSale ? (
                <div className="absolute right-2 top-2 z-20">
                  <Badge className="text-[10px] font-bold px-2 py-1.5 bg-accent text-accent-foreground flex flex-col items-center leading-tight shadow-lg uppercase">
                    <span className="flex items-center gap-1">
                      <ClockIcon />
                      {t("A la venta:")}
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
              
              <div className="absolute bottom-14 left-3 z-10">
                <CategoryBadge badges={badges} />
              </div>

              <div className="absolute bottom-3 left-3 right-3 z-10">
                <h3 className="text-white text-xl font-bold leading-tight tracking-tight font-['Poppins'] line-clamp-2 drop-shadow-lg" itemProp="name">
                  {eventName}
                </h3>
              </div>

              <div className="absolute left-2 top-3 bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200" style={{ width: '85px' }}>
                <div className="text-center px-2 py-2 bg-gradient-to-b from-gray-50 to-white">
                  {hasDate && eventDate ? (
                    <time dateTime={isoDate} itemProp="startDate" content={isoDate}>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{monthName}</div>
                      <div className="text-3xl font-black text-gray-900 leading-none my-1">{dayNumber}</div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">{year}</div>
                      {time && time !== "00:00" && <div className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5">{time}h</div>}
                    </time>
                  ) : (
                    <time dateTime="" aria-label={t("Por confirmar")}>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{t("FECHA")}</div>
                      <div className="text-xs font-bold text-gray-700 my-2 px-1">{t("Por confirmar")}</div>
                    </time>
                  )}
                  <address 
                    className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-1 border-t border-gray-200 pt-1.5 not-italic"
                    itemProp="location" 
                    itemScope 
                    itemType="https://schema.org/Place"
                  >
                    <MapPinIcon />
                    <span className="line-clamp-1 font-medium" itemProp="name">
                      {event.venue_city || t("Por confirmar")}
                    </span>
                    <meta itemProp="address" content={event.venue_city || 'España'} />
                  </address>
                </div>
              </div>

              {hasVIP && (
                <div className="absolute top-3 right-3 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded shadow-lg">
                  VIP
                </div>
              )}
            </div>

            <div className="bg-background px-4 py-4 flex justify-center items-center">
              <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 py-3 h-auto transition-all duration-300">
                <span>{t("VER ENTRADAS")}</span>
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
