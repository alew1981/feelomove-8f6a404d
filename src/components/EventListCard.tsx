import { Link } from "react-router-dom";
import { memo, useCallback } from "react";
import { getEventUrl } from "@/lib/eventUtils";
import { usePrefetchEvent } from "@/hooks/useEventData";
import { cn } from "@/lib/utils";

// Inline SVG icons (eliminate lucide-react for mobile perf)
const IconChevronRight = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IconClock = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

// Native date formatting (eliminate date-fns for mobile perf)
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr || dateStr.startsWith('9999')) return null;
  try { return new Date(dateStr); } catch { return null; }
};

const formatDay = (d: Date) => String(d.getDate());
const formatMonth = (d: Date) => MONTHS_SHORT[d.getMonth()];
const formatYear = (d: Date) => String(d.getFullYear());
const isFutureDate = (d: Date) => d.getTime() > Date.now();
const isPastDate = (d: Date) => d.getTime() < Date.now();

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
 * Ultra-optimized mobile list card - NO IMAGES for maximum performance
 * - Fixed 88px height for density
 * - Date block on left (black bg)
 * - Event info in center
 * - Arrow CTA on right
 * - Zero image loading = instant LCP
 */
const EventListCard = memo(({ event, priority = false, forceConcierto = false }: EventListCardProps) => {
  // Normalize field names
  const eventName = event.name || event.event_name || '';
  const eventSlug = event.slug || event.event_slug;
  const artistName = event.artist_name || event.primary_attraction_name || '';

  // Parse date with native JS (no date-fns)
  const eventDate = parseDate(event.event_date);
  const dayNumber = eventDate ? formatDay(eventDate) : '--';
  const monthName = eventDate ? formatMonth(eventDate).toUpperCase() : '';
  const year = eventDate ? formatYear(eventDate) : '';

  // Status checks
  const isSoldOut = event.sold_out === true || event.seats_available === false;
  const onSaleDate = parseDate(event.on_sale_date);
  const isNotYetOnSale = onSaleDate && isFutureDate(onSaleDate);
  const isEventPast = eventDate && isPastDate(eventDate);

  // Determine route
  const isFestival = forceConcierto ? false : (event.is_festival === true || event.event_type === 'festival');
  const eventUrl = getEventUrl(eventSlug || '', isFestival);

  // Display name - for concerts show artist, for festivals show event name
  const displayName = isFestival ? eventName : (artistName || eventName);
  
  // Extra info for festivals
  const artistCount = event.attraction_names?.length || event.festival_lineup_artists?.length || 0;
  const festivalExtraInfo = isFestival && artistCount > 1 ? `${artistCount} artistas` : '';

  // Prefetch on interaction
  const prefetchEvent = usePrefetchEvent();
  const handleInteraction = useCallback(() => {
    if (eventSlug) prefetchEvent(eventSlug, isFestival);
  }, [eventSlug, isFestival, prefetchEvent]);

  return (
    <Link 
      to={eventUrl} 
      className="block touch-manipulation active:bg-accent/10" 
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div 
        className={cn(
          "flex items-center gap-3 px-3 h-[88px] border-b border-border/40",
          (isSoldOut || isEventPast) && "opacity-50"
        )}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
      >
        {/* Date Block - compact */}
        <div className="flex-shrink-0 w-[50px] h-[66px] flex flex-col items-center justify-center bg-foreground rounded-lg">
          <span className="text-xl font-black text-background leading-none">{dayNumber}</span>
          <span className="text-[9px] font-bold text-background/90 uppercase tracking-wide mt-0.5">{monthName}</span>
          <span className="text-[8px] font-medium text-background/60 mt-0.5">{year}</span>
        </div>

        {/* Info - NO IMAGE for perf */}
        <div className="flex-1 min-w-0 py-2">
          <h3 className="text-sm font-bold text-foreground truncate leading-tight">{displayName}</h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {event.venue_city}{event.venue_name && ` · ${event.venue_name}`}
          </p>
          {isNotYetOnSale ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500 mt-1">
              <IconClock />Pronto
            </span>
          ) : isEventPast ? (
            <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Pasado</span>
          ) : festivalExtraInfo ? (
            <span className="text-[10px] text-muted-foreground mt-1">{festivalExtraInfo}</span>
          ) : null}
        </div>

        {/* Arrow CTA */}
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-accent text-accent-foreground">
          <IconChevronRight />
        </div>
      </div>
    </Link>
  );
});

EventListCard.displayName = "EventListCard";

export default EventListCard;

/** Skeleton - matches compact 88px height */
export const EventListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-3 h-[88px] border-b border-border/40">
    <div className="w-[50px] h-[66px] rounded-lg flex-shrink-0 bg-muted animate-pulse" />
    <div className="flex-1 flex flex-col gap-2">
      <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
    </div>
    <div className="w-9 h-9 rounded-full flex-shrink-0 bg-muted animate-pulse" />
  </div>
));

EventListCardSkeleton.displayName = "EventListCardSkeleton";
