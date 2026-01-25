import { Link } from "react-router-dom";
import { memo, useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

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
    return `${baseUrl}?w=100&q=60&fm=webp&fit=crop`;
  }
  
  return url;
};

interface ArtistListCardProps {
  artist: {
    attraction_id: string;
    attraction_name: string;
    attraction_slug: string;
    event_count?: number;
    city_count?: number;
    sample_image_url?: string;
    sample_image_standard_url?: string;
    genres?: string[];
  };
  priority?: boolean;
}

/**
 * Compact list-style artist card for mobile
 * - Fixed height 100px for maximum density (5-6 visible per screen)
 * - Circular image on left
 * - Artist name + event count in center
 * - Arrow CTA on right
 */
const ArtistListCard = memo(({ artist, priority = false }: ArtistListCardProps) => {
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

  const rawImageUrl = artist.sample_image_url || artist.sample_image_standard_url || "/placeholder.svg";
  const imageUrl = getOptimizedThumbnail(rawImageUrl);
  const eventCount = artist.event_count || 0;
  const mainGenre = artist.genres?.[0];

  return (
    <Link 
      to={`/conciertos/${artist.attraction_slug}`} 
      className="block group touch-manipulation" 
      title={`Ver conciertos de ${artist.attraction_name}`}
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
        {/* Artist Image - Circular */}
        <div className={cn(
          "flex-shrink-0 w-[60px] h-[60px] overflow-hidden relative",
          "rounded-full",
          "bg-foreground/10 dark:bg-zinc-800"
        )}>
          {/* Shimmer placeholder */}
          {!imageLoaded && (
            <div className={cn(
              "absolute inset-0 rounded-full",
              "bg-gradient-to-r from-foreground/5 via-foreground/10 to-foreground/5",
              "dark:from-zinc-900 dark:via-zinc-700 dark:to-zinc-900",
              "animate-shimmer bg-[length:200%_100%]"
            )} />
          )}
          {isInView && (
            <img
              src={imageUrl}
              alt={artist.attraction_name}
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
          {/* Artist Name */}
          <h3 className={cn(
            "text-sm font-bold text-foreground",
            "truncate leading-tight"
          )}>
            {artist.attraction_name}
          </h3>
          
          {/* Event Count */}
          <p className="text-xs text-muted-foreground truncate">
            {eventCount} {eventCount === 1 ? 'evento disponible' : 'eventos disponibles'}
          </p>

          {/* Genre Badge */}
          {mainGenre && (
            <span className="text-[10px] text-accent font-medium truncate mt-0.5">
              {mainGenre}
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

ArtistListCard.displayName = "ArtistListCard";

export default ArtistListCard;

/**
 * Skeleton for ArtistListCard - shimmer effect
 */
export const ArtistListCardSkeleton = memo(() => (
  <div className="flex items-center gap-3 px-3 py-2.5 h-[100px] min-h-[100px] border-b border-border/50">
    {/* Image */}
    <div className="w-[60px] h-[60px] rounded-full flex-shrink-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer bg-[length:200%_100%]" />
    
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

ArtistListCardSkeleton.displayName = "ArtistListCardSkeleton";
