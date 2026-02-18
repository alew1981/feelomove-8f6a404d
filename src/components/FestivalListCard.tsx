import { Link } from "react-router-dom";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import { Skeleton } from "./ui/skeleton";
import { getEventUrl } from "@/lib/eventUtils";
import { usePrefetchEvent } from "@/hooks/useEventData";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { parseDate, isFuture, isPast, isPlaceholderDate as isPlaceholder, formatDay, formatMonth, formatYear } from "@/lib/dateUtils";

// Inline SVGs for critical icons (aria-hidden for accessibility)
const ChevronRightIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// Thumbnail optimization: generate smallest possible image URL for list cards
const getOptimizedThumbnail = (url: string): string => {
  if (!url || url === "/placeholder.svg") return url;
  
  // For Ticketmaster images, request the smallest available variant
  if (url.includes("ticketm.net") || url.includes("tmimg.net")) {
    return url
      .replace(/_CUSTOM\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/_EVENT_DETAIL_PAGE_16_9\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/_RETINA_PORTRAIT_16_9\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/_ARTIST_PAGE_3_2\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/RATIO\/\d+_\d+/g, "RATIO/3_2")
      .replace(/\/\d+x\d+\//g, "/100x100/");
  }

  // For Unsplash images, add aggressive compression
  if (url.includes("unsplash.com")) {
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?w=100&q=60&fm=webp&fit=crop`;
  }
  
  return url;
};

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
  const rawImageUrl = festival.image_standard_url || festival.image_large_url || "/placeholder.svg";
  // Use optimized thumbnail for list cards
  const imageUrl = getOptimizedThumbnail(rawImageUrl);

  // Handle dates - support both NormalizedFestival and ParentFestival field names
  const isPlaceholderDateFn = (d: string | null | undefined) => !d || d.startsWith('9999');
  // ParentFestival uses min_start_date/max_end_date, NormalizedFestival uses festival_start_date/festival_end_date
  const startDateStr = (festival as any).min_start_date || festival.festival_start_date || festival.event_date;
  const endDateStr = (festival as any).max_end_date || festival.festival_end_date;
  
  const hasStartDate = Boolean(startDateStr) && !isPlaceholderDateFn(startDateStr);
  const startDate = hasStartDate && startDateStr ? parseDate(startDateStr) : null;
  const endDate = endDateStr && !isPlaceholderDateFn(endDateStr) ? parseDate(endDateStr) : null;
  
  // For multi-day festivals, show day range
  const startDay = startDate ? formatDay(startDate) : '--';
  const endDay = endDate && endDate.getTime() !== startDate?.getTime() ? formatDay(endDate) : null;
  const monthName = startDate ? formatMonth(startDate).toUpperCase() : '';
  const year = startDate ? formatYear(startDate) : ''; // Full year (2026)

  // Check sold out status
  const isSoldOut = festival.sold_out === true || festival.seats_available === false;
  
  // Check if not yet on sale
  const onSaleDate = festival.on_sale_date ? parseDate(festival.on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);

  // Check if event is past
  const isEventPast = startDate && isPast(startDate);

  // Festival URL
  const { locale, t } = useTranslation();
  const eventUrl = getEventUrl(festivalSlug || '', true, locale);

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
          "flex items-center gap-3 px-3",
          "h-[100px] min-h-[100px] max-h-[100px]",
          "border-b border-border/50",
          "bg-card hover:bg-accent/5",
          "transition-colors duration-200",
          "active:bg-accent/10",
          (isSoldOut || isEventPast) && "opacity-60"
        )}
        style={{
          // CSS containment for off-viewport performance
          contentVisibility: priority ? 'visible' : 'auto',
          containIntrinsicSize: '0 100px',
        }}
      >
        {/* a. Date Block - Left - Black background with white text */}
        <div className={cn(
          "flex-shrink-0 w-[54px] h-[72px]",
          "flex flex-col items-center justify-center",
          "bg-foreground rounded-lg",
          "text-center"
        )}>
          <span className={cn(
            "font-black text-background leading-none",
            endDay ? "text-lg" : "text-2xl"
          )}>
            {endDay ? `${startDay}-${endDay}` : startDay}
          </span>
          <span className="text-[10px] font-bold text-background/90 uppercase tracking-wider leading-none mt-1">
            {monthName}
          </span>
          <span className="text-[9px] font-medium text-background/70 leading-none mt-0.5">
            {year}
          </span>
        </div>

        {/* b. Festival Image - Square with rounded corners, LCP priority */}
        <div className={cn(
          "flex-shrink-0 w-[56px] h-[56px] overflow-hidden relative",
          "rounded-xl",
          "bg-foreground/10 dark:bg-zinc-800" // Dark placeholder for organic transition
        )}>
          {/* Shimmer placeholder - dark gradient for smooth transition */}
          {!imageLoaded && (
            <div className={cn(
              "absolute inset-0",
              "bg-gradient-to-r from-foreground/5 via-foreground/10 to-foreground/5",
              "dark:from-zinc-900 dark:via-zinc-700 dark:to-zinc-900",
              "animate-shimmer bg-[length:200%_100%]",
              "rounded-xl"
            )} />
          )}
          {isInView && (
            <img
              src={imageUrl}
              alt={festivalName}
              width={56}
              height={56}
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              {...(priority ? { fetchpriority: "high" } : {})}
              className={cn(
                "w-full h-full object-cover",
                "transition-opacity duration-300 ease-out",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
                setImageLoaded(true);
              }}
            />
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
                <ClockIcon />
                {t('Pronto')}
              </span>
            ) : isEventPast ? (
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {t('Pasado')}
              </span>
            ) : artistCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <UsersIcon />
                {artistCount} {t('artistas')}
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
          <ChevronRightIcon />
        </div>
      </div>
    </Link>
  );
});

FestivalListCard.displayName = "FestivalListCard";

export default FestivalListCard;

/**
 * Skeleton for FestivalListCard - maintains same height and structure with shimmer effect
 */
export const FestivalListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-3 py-2.5 h-[100px] min-h-[100px] border-b border-border/50">
    {/* Date Block */}
    <div className="w-[54px] h-[72px] rounded-lg flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    
    {/* Image */}
    <div className="w-[56px] h-[56px] rounded-xl flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    
    {/* Info */}
    <div className="flex-grow flex flex-col gap-1.5">
      <div className="h-4 w-3/4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
      <div className="h-3 w-1/2 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    </div>
    
    {/* Button */}
    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
  </div>
));

FestivalListCardSkeleton.displayName = "FestivalListCardSkeleton";
