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
  };
  priority?: boolean;
}

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
  
  // Festival date handling - use festival_start_date and festival_end_date
  const startDateStr = festival.festival_start_date || festival.event_date;
  const endDateStr = festival.festival_end_date || festival.event_date;
  
  const hasDate = Boolean(startDateStr && startDateStr.length > 0);
  const startDate = hasDate && startDateStr ? parseISO(startDateStr) : null;
  const endDate = hasDate && endDateStr ? parseISO(endDateStr) : null;
  
  // Format dates for badge: "ene 04-05 2026 19:00h Madrid" style
  const monthName = startDate ? format(startDate, "MMM", { locale: es }).toUpperCase() : '';
  const startDay = startDate ? format(startDate, "dd") : '';
  const endDay = endDate ? format(endDate, "dd") : '';
  const year = startDate ? format(startDate, "yyyy") : '';
  const time = startDate ? format(startDate, "HH:mm") : '';
  
  // Show day range if different days
  const dayDisplay = startDay === endDay ? startDay : `${startDay}-${endDay}`;

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
                  alt={festival.event_name || "Festival"}
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

            {/* Badge "Disponible" - Top Left above Date Card */}
            {badgeText && badgeVariant && (
              <div className="absolute left-2 top-0.5 z-20">
                <Badge variant={badgeVariant} className="text-[10px] font-bold px-2 py-1">
                  {badgeText}
                </Badge>
              </div>
            )}

            {/* Date Card - Absolute positioned on the left - Only show if we have a date */}
            {hasDate && (
              <div className="absolute left-2 top-8 bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200" style={{ minWidth: '90px' }}>
                <div className="text-center px-3 py-2 bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{monthName}</div>
                  <div className="text-2xl font-black text-gray-900 leading-none my-1 whitespace-nowrap">{dayDisplay}</div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">{year}</div>
                  {/* Time */}
                  {time && <div className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5">{time}h</div>}
                  {/* Location */}
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-1">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="line-clamp-1 font-medium">
                      {festival.venue_city}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Name Below Image */}
          <div className="bg-background px-4 pt-4 pb-2">
            <h3 className="text-foreground text-xl font-bold truncate leading-tight tracking-tight font-['Poppins']" title={festival.event_name || ""}>
              {festival.event_name}
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
      </Card>
    </Link>
  );
});

FestivalCard.displayName = "FestivalCard";

export default FestivalCard;
