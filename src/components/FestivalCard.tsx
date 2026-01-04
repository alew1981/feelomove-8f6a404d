import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface FestivalCardProps {
  festival: {
    event_id?: string;
    event_name?: string;
    event_slug?: string;
    event_date?: string | null;
    venue_city?: string;
    venue_name?: string;
    image_large_url?: string | null;
    image_standard_url?: string | null;
    sold_out?: boolean | null;
    seats_available?: boolean | null;
    // Festival-specific fields
    festival_start_date?: string | null;
    festival_end_date?: string | null;
    festival_duration_days?: number | null;
    // Primary/Secondary attraction fields for display logic
    primary_attraction_name?: string | null;
    secondary_attraction_name?: string | null;
  };
  priority?: boolean;
}

// Helper to check if date is a placeholder (9999-12-31)
const isPlaceholderDate = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return true;
  return dateStr.startsWith('9999');
};

// Helper to format date range for festivals
const formatFestivalDateRange = (startDate: Date, endDate: Date): string => {
  const startMonth = format(startDate, "MMM", { locale: es }).toUpperCase();
  const endMonth = format(endDate, "MMM", { locale: es }).toUpperCase();
  const startDay = format(startDate, "dd");
  const endDay = format(endDate, "dd");
  const year = format(startDate, "yyyy");
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay} ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay} ${year}`;
};

const FestivalCard = memo(({ festival, priority = false }: FestivalCardProps) => {
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

  const imageUrl = festival.image_large_url || festival.image_standard_url || "/placeholder.svg";
  const slug = festival.event_slug || festival.event_name?.toLowerCase().replace(/\s+/g, "-") || "";
  
  // Display logic based on primary/secondary attraction
  // Case A: Full festival pass (secondary_attraction_name is NULL) - show event_name or primary_attraction_name
  // Case B: Artist-specific entry (secondary_attraction_name has value) - highlight artist
  const hasSecondaryAttraction = Boolean(festival.secondary_attraction_name);
  const isArtistEntry = hasSecondaryAttraction && festival.secondary_attraction_name !== festival.primary_attraction_name;
  
  // Determine display title and subtitle
  let displayTitle: string;
  let displaySubtitle: string | null = null;
  let entryTypeLabel: string;
  
  if (isArtistEntry) {
    // Case B: Artist-specific entry - show artist name prominently
    displayTitle = festival.secondary_attraction_name || festival.event_name || "";
    displaySubtitle = `en ${festival.primary_attraction_name || ""}`;
    entryTypeLabel = "Entrada de Día";
  } else {
    // Case A: Full festival pass
    displayTitle = festival.event_name || festival.primary_attraction_name || "";
    displaySubtitle = null;
    entryTypeLabel = "Abono Completo";
  }
  
  // Festival date handling - use festival_start_date and festival_end_date
  const startDateStr = festival.festival_start_date || festival.event_date;
  const endDateStr = festival.festival_end_date || festival.event_date;
  
  // Check for placeholder dates (9999-12-31)
  const isStartPlaceholder = isPlaceholderDate(startDateStr);
  const isEndPlaceholder = isPlaceholderDate(endDateStr);
  const hasValidDates = !isStartPlaceholder && !isEndPlaceholder;
  
  const startDate = hasValidDates && startDateStr ? parseISO(startDateStr) : null;
  const endDate = hasValidDates && endDateStr ? parseISO(endDateStr) : null;
  
  // Format dates for badge
  let dateDisplay: React.ReactNode;
  
  if (!hasValidDates) {
    // Show "Pendiente fechas" for placeholder dates - still show city
    dateDisplay = (
      <div className="text-center px-3 py-3 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">FECHA</div>
        <div className="text-xs font-bold text-gray-700 mt-1 px-1">Pendiente fechas</div>
        {/* Always show city */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-2 border-t border-gray-200 pt-2">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="line-clamp-1 font-medium">{festival.venue_city || 'Por confirmar'}</span>
        </div>
      </div>
    );
  } else if (startDate && endDate) {
    const monthName = format(startDate, "MMM", { locale: es }).toUpperCase();
    const startDay = format(startDate, "dd");
    const endDay = format(endDate, "dd");
    const year = format(startDate, "yyyy");
    const dayDisplay = startDay === endDay ? startDay : `${startDay}-${endDay}`;
    
    dateDisplay = (
      <div className="text-center px-3 py-2 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{monthName}</div>
        <div className="text-2xl font-black text-gray-900 leading-none my-1 whitespace-nowrap">{dayDisplay}</div>
        <div className="text-xs font-semibold text-gray-600 mb-1">{year}</div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-1">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="line-clamp-1 font-medium">{festival.venue_city}</span>
        </div>
      </div>
    );
  }

  // Availability badge
  const isSoldOut = festival.sold_out === true || festival.seats_available === false;
  let badgeVariant: "disponible" | "agotado" | undefined;
  let badgeText: string | undefined;

  if (isSoldOut) {
    badgeVariant = "agotado";
    badgeText = "SOLD OUT";
  } else if (festival.seats_available === true) {
    badgeVariant = "disponible";
    badgeText = "DISPONIBLE";
  }

  return (
    <Link to={`/festival/${slug}`} className="block group">
      <Card
        ref={cardRef}
        className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20 shadow-lg"
      >
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
                  alt={displayTitle}
                  loading={priority ? "eager" : "lazy"}
                  decoding={priority ? "sync" : "async"}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
            
            {/* Minimal Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Festival name badge for artist entries - show in corner to maintain context */}
            {isArtistEntry && festival.primary_attraction_name && (
              <div className="absolute right-2 top-2 z-20">
                <Badge variant="secondary" className="text-[9px] font-bold bg-black/70 text-white border-0 px-2 py-0.5">
                  {festival.primary_attraction_name}
                </Badge>
              </div>
            )}

            {/* Badge "Disponible" - Top Left above Date Card */}
            {badgeText && badgeVariant && (
              <div className="absolute left-2 top-0.5 z-20">
                <Badge variant={badgeVariant} className="text-[10px] font-bold px-2 py-1">
                  {badgeText}
                </Badge>
              </div>
            )}

            {/* Date Card - Absolute positioned on the left */}
            <div className="absolute left-2 top-8 bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200" style={{ minWidth: '90px' }}>
              {dateDisplay}
            </div>
            
            {/* Entry type label badge */}
            <div className="absolute bottom-2 right-2 z-20">
              <Badge 
                variant={isArtistEntry ? "outline" : "default"} 
                className={`text-[9px] font-bold ${isArtistEntry ? 'bg-white/90 text-gray-700 border-gray-300' : 'bg-accent text-accent-foreground'}`}
              >
                {entryTypeLabel}
              </Badge>
            </div>
          </div>

          {/* Event Name Below Image */}
          <div className="bg-background px-4 pt-4 pb-2">
            <h3 className="text-foreground text-xl font-bold truncate leading-tight tracking-tight font-['Poppins']" title={displayTitle}>
              {displayTitle}
            </h3>
            {displaySubtitle && (
              <p className="text-muted-foreground text-sm truncate mt-0.5">
                {displaySubtitle}
              </p>
            )}
          </div>

          {/* Bottom Section with Button */}
          <div className="bg-background px-4 pb-4 flex justify-center items-center">
            <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 py-3 h-auto transition-all duration-300">
              <span>Ver entradas</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
});

FestivalCard.displayName = "FestivalCard";

export default FestivalCard;