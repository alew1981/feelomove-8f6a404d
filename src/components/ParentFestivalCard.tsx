import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Music } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useState, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ParentFestival {
  primary_attraction_id: string;
  festival_nombre: string;
  venue_city: string;
  event_count: number;
  image_large_url: string;
  min_start_date: string;
  max_end_date: string;
  total_artists?: number;
  genres?: string[];
}

interface ParentFestivalCardProps {
  festival: ParentFestival;
  priority?: boolean;
}

// Helper to check if date is a placeholder (9999-12-31)
const isPlaceholderDate = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return true;
  return dateStr.startsWith('9999');
};

const ParentFestivalCard = memo(({ festival, priority = false }: ParentFestivalCardProps) => {
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
      { rootMargin: "200px", threshold: 0 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [priority]);

  // Generate slug from festival name + city (matching the grouping key format)
  const festivalSlug = encodeURIComponent(
    `${festival.festival_nombre.toLowerCase().replace(/\s+/g, '-')}_${(festival.venue_city || 'unknown').toLowerCase().replace(/\s+/g, '-')}`
  );
  
  // Check for placeholder dates
  const isStartPlaceholder = isPlaceholderDate(festival.min_start_date);
  const isEndPlaceholder = isPlaceholderDate(festival.max_end_date);
  const hasValidDates = !isStartPlaceholder && !isEndPlaceholder;
  
  // Format date range
  let dateDisplay: string;
  
  if (!hasValidDates) {
    dateDisplay = "Fechas por confirmar";
  } else {
    const startDate = parseISO(festival.min_start_date);
    const endDate = parseISO(festival.max_end_date);
    const isSameMonth = startDate.getMonth() === endDate.getMonth();
    const isSameYear = startDate.getFullYear() === endDate.getFullYear();
    const isSameDay = startDate.getDate() === endDate.getDate() && isSameMonth && isSameYear;
    
    if (isSameDay) {
      dateDisplay = format(startDate, "d MMM yyyy", { locale: es });
    } else if (isSameMonth && isSameYear) {
      dateDisplay = `${format(startDate, "d", { locale: es })}-${format(endDate, "d MMM yyyy", { locale: es })}`;
    } else if (isSameYear) {
      dateDisplay = `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`;
    } else {
      dateDisplay = `${format(startDate, "d MMM yyyy", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`;
    }
  }

  const imageUrl = festival.image_large_url || "/placeholder.svg";

  return (
    <Link to={`/festivales/${festivalSlug}`} title={`Ver eventos del festival ${festival.festival_nombre}`}>
      <Card 
        ref={cardRef}
        className="group overflow-hidden border-2 border-border hover:border-accent transition-all duration-300 bg-card h-full"
      >
        {/* Image Container */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {isInView ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full" />
              )}
              <img
                src={imageUrl}
                alt={`${festival.festival_nombre} - Festival de música en ${festival.venue_city}`}
                title={`${festival.festival_nombre} - Festival en ${festival.venue_city}`}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading={priority ? "eager" : "lazy"}
                decoding={priority ? "sync" : "async"}
                fetchPriority={priority ? "high" : "auto"}
                width={400}
                height={225}
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
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Event Count Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-accent-foreground font-bold gap-1">
              <Music className="h-3 w-3" />
              {festival.event_count} {festival.event_count === 1 ? 'evento' : 'eventos'}
            </Badge>
          </div>
          
          {/* Festival Name on Image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-lg line-clamp-2">
              {festival.festival_nombre}
            </h3>
          </div>
        </div>
        
        {/* Card Content - with content-visibility for below-fold cards */}
        <div className="p-4 space-y-3" style={!priority ? { contentVisibility: 'auto', containIntrinsicSize: '0 120px' } : undefined}>
          {/* Date and Location Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" />
              <span className={`font-medium ${hasValidDates ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                {dateDisplay}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{festival.venue_city}</span>
            </div>
          </div>
          
          {/* Artists count if available */}
          {festival.total_artists && festival.total_artists > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              <span>{festival.total_artists} artistas</span>
            </div>
          )}
          
          {/* CTA Button */}
          <div className="pt-2">
            <div className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-bold text-center text-sm group-hover:bg-accent/90 transition-colors">
              Ver eventos del festival
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

ParentFestivalCard.displayName = "ParentFestivalCard";

export default ParentFestivalCard;