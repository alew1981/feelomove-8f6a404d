import { Link } from "react-router-dom";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, MapPin } from "lucide-react";
import { usePrefetch } from "@/hooks/usePrefetch";

// Thumbnail optimization for smallest possible image
const getOptimizedThumbnail = (url: string): string => {
  if (!url || url === "/placeholder.svg") return url;
  
  if (url.includes("ticketm.net") || url.includes("tmimg.net")) {
    return url
      .replace(/_CUSTOM\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/_EVENT_DETAIL_PAGE_16_9\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/_RETINA_PORTRAIT_16_9\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/_ARTIST_PAGE_3_2\.jpg/i, '_TABLET_LANDSCAPE_3_2.jpg')
      .replace(/RATIO\/\d+_\d+/g, "RATIO/3_2")
      .replace(/\/\d+x\d+\//g, "/100x100/");
  }

  if (url.includes("unsplash.com")) {
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?w=150&h=150&fit=crop&q=75&fm=webp`;
  }
  
  // For Supabase storage URLs, they're already optimized
  return url;
};

interface DestinationListCardProps {
  city: {
    city_name: string;
    city_slug?: string;
    event_count?: number;
    concerts_count?: number;
    festivals_count?: number;
    ciudad_imagen?: string;
    sample_image_url?: string;
    sample_image_standard_url?: string;
    price_from?: number;
    genres?: string[];
  };
  priority?: boolean;
}

/**
 * Compact list-style destination card for mobile
 * - Fixed height 100px for maximum density (5-6 visible per screen)
 * - Rounded square image on left
 * - City name + event count in center
 * - Arrow CTA on right
 */
const DestinationListCard = memo(({ city, priority = false }: DestinationListCardProps) => {
  const [isInView, setIsInView] = useState(priority);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { prefetchDestination } = usePrefetch();
  const hasPrefetched = useRef(false);

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

  const rawImageUrl = city.ciudad_imagen || city.sample_image_url || city.sample_image_standard_url || "/placeholder.svg";
  const imageUrl = getOptimizedThumbnail(rawImageUrl);
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
        ref={cardRef}
        className={cn(
          "flex items-center gap-3 px-3",
          "h-[100px] min-h-[100px] max-h-[100px]",
          "border-b border-border/50",
          "bg-card hover:bg-accent/5",
          "transition-colors duration-200",
          "active:bg-accent/10"
        )}
        style={{
          contentVisibility: priority ? 'visible' : 'auto',
          containIntrinsicSize: '0 100px',
        }}
      >
        {/* City Image - Rounded Square */}
        <div className={cn(
          "flex-shrink-0 w-[60px] h-[60px] overflow-hidden relative",
          "rounded-xl",
          "bg-foreground/10 dark:bg-zinc-800"
        )}>
          {/* Shimmer placeholder */}
          {!imageLoaded && (
            <div className={cn(
              "absolute inset-0 rounded-xl",
              "bg-gradient-to-r from-foreground/5 via-foreground/10 to-foreground/5",
              "dark:from-zinc-900 dark:via-zinc-700 dark:to-zinc-900",
              "animate-shimmer bg-[length:200%_100%]"
            )} />
          )}
          {isInView && (
            <img
              src={imageUrl}
              alt={city.city_name}
              width={60}
              height={60}
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

        {/* Info - Center */}
        <div className="flex-grow min-w-0 flex flex-col justify-center gap-0.5">
          {/* City Name */}
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-accent flex-shrink-0" />
            <h3 className={cn(
              "text-sm font-bold text-foreground",
              "truncate leading-tight"
            )}>
              {city.city_name}
            </h3>
          </div>
          
          {/* Event Count */}
          <p className="text-xs text-muted-foreground truncate">
            {eventText}
          </p>

          {/* Price Info */}
          {city.price_from && (
            <span className="text-[10px] text-accent font-semibold mt-0.5">
              Desde {Number(city.price_from).toFixed(0)}€
            </span>
          )}
        </div>

        {/* Action Button - Right */}
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

DestinationListCard.displayName = "DestinationListCard";

export default DestinationListCard;

/**
 * Skeleton for DestinationListCard - shimmer effect
 */
export const DestinationListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-3 py-2.5 h-[100px] min-h-[100px] border-b border-border/50">
    {/* Image */}
    <div className="w-[60px] h-[60px] rounded-xl flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    
    {/* Info */}
    <div className="flex-grow flex flex-col gap-1.5">
      <div className="h-4 w-3/4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
      <div className="h-3 w-1/2 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
      <div className="h-2.5 w-1/4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    </div>
    
    {/* Button */}
    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
  </div>
));

DestinationListCardSkeleton.displayName = "DestinationListCardSkeleton";
