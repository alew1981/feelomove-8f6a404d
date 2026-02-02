import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { memo, useState, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDate, isFuture, isPast, formatDay, formatMonth, formatYear } from "@/lib/dateUtils";

// Inline SVGs for critical icons (aria-hidden for accessibility)
const MapPinIcon = () => (
  <svg className="h-2.5 w-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);

interface ParentFestival {
  primary_attraction_id: string;
  festival_nombre: string;
  venue_city: string;
  event_count: number;
  image_large_url: string;
  min_start_date: string;
  max_end_date: string;
  // Manual date overrides - prioritize these
  start_date_manual?: string | null;
  end_date_manual?: string | null;
  total_artists?: number;
  genres?: string[];
  // On sale date for "coming soon" badge (earliest on_sale_date from events)
  earliest_on_sale_date?: string | null;
}

interface ParentFestivalCardProps {
  festival: ParentFestival;
  priority?: boolean;
}

// Helper to check if date is a placeholder (9999-12-31)
const isPlaceholderDateCheck = (dateStr: string | null | undefined): boolean => {
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
  
  // Check for placeholder dates - prioritize manual dates
  const startDateSource = festival.start_date_manual || festival.min_start_date;
  const endDateSource = festival.end_date_manual || festival.max_end_date;
  
  const isStartPlaceholder = isPlaceholderDateCheck(startDateSource);
  const isEndPlaceholder = isPlaceholderDateCheck(endDateSource);
  const hasValidDates = !isStartPlaceholder && !isEndPlaceholder;
  
  const startDate = hasValidDates ? parseDate(startDateSource) : null;
  const endDate = hasValidDates ? parseDate(endDateSource) : null;
  
  // Check if event is in the past
  const eventDateForCheck = endDate || startDate;
  const isEventPast = eventDateForCheck ? isPast(eventDateForCheck) : false;
  
  // Check if tickets are not yet on sale
  const onSaleDate = festival.earliest_on_sale_date ? parseDate(festival.earliest_on_sale_date) : null;
  const isNotYetOnSale = onSaleDate && isFuture(onSaleDate);
  const onSaleDateFormatted = onSaleDate 
    ? `${formatDay(onSaleDate)} ${formatMonth(onSaleDate)} ${formatYear(onSaleDate)}`
    : '';
  
  // Format dates for badge
  let dateDisplay: React.ReactNode;
  
  if (!hasValidDates) {
    dateDisplay = (
      <div className="text-center px-3 py-3 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">FECHA</div>
        <div className="text-xs font-bold text-gray-700 mt-1 px-1">Pendiente</div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-2 border-t border-gray-200 pt-2">
          <MapPinIcon />
          <span className="line-clamp-1 font-medium">{festival.venue_city || 'Por confirmar'}</span>
        </div>
      </div>
    );
  } else if (startDate && endDate) {
    const monthName = formatMonth(startDate).toUpperCase();
    const startDay = parseInt(formatDay(startDate));
    const endDay = parseInt(formatDay(endDate));
    const year = formatYear(startDate);
    const isSameDay = startDay === endDay && startDate.getMonth() === endDate.getMonth();
    const dayDisplay = isSameDay ? startDay.toString() : `${startDay}-${endDay}`;
    
    dateDisplay = (
      <div className="text-center px-3 py-2 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{monthName}</div>
        <div className="text-2xl font-black text-gray-900 leading-none my-1 whitespace-nowrap">{dayDisplay}</div>
        <div className="text-xs font-semibold text-gray-600 mb-1">{year}</div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-1">
          <MapPinIcon />
          <span className="line-clamp-1 font-medium">{festival.venue_city}</span>
        </div>
      </div>
    );
  }

  const imageUrl = festival.image_large_url || "/placeholder.svg";

  return (
    <Link to={`/festivales/${festivalSlug}`} className="block group" title={`Ver eventos del festival ${festival.festival_nombre}`}>
      <Card 
        ref={cardRef}
        className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20 shadow-lg"
      >
        <div className="flex flex-col">
          {/* Main Event Area with Background Image */}
          <div className="relative h-56 overflow-hidden bg-muted">
            {isInView ? (
              <>
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 w-full h-full" />
                )}
                <img
                  src={imageUrl}
                  alt={`${festival.festival_nombre} - Festival de música en ${festival.venue_city}`}
                  title={`${festival.festival_nombre} - Festival en ${festival.venue_city}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading={priority ? "eager" : "lazy"}
                  decoding={priority ? "sync" : "async"}
                  fetchPriority={priority ? "high" : "low"}
                  width={400}
                  height={224}
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
            
            {/* On Sale Soon Badge - Top Right */}
            {isNotYetOnSale ? (
              <div className="absolute right-2 top-2 z-20">
                <Badge className="text-xs font-bold px-3 py-1.5 bg-amber-500 text-white flex items-center gap-1.5 shadow-lg">
                  <ClockIcon />
                  A la venta {onSaleDateFormatted}
                </Badge>
              </div>
            ) : null}
            
            {/* Past Event Badge - Top Left */}
            {isEventPast && (
              <div className="absolute left-2 top-2 z-20">
                <Badge variant="destructive" className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white">
                  PASADO
                </Badge>
              </div>
            )}
            
            {/* Date Card - Absolute positioned on the left */}
            <div className={`absolute left-2 ${isEventPast ? 'top-10' : 'top-3'} bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200`} style={{ minWidth: '90px' }}>
              {dateDisplay}
            </div>
          </div>
          
          {/* Festival Name Below Image */}
          <div className="bg-background px-4 pt-4 pb-2">
            <h3 className="text-foreground text-xl font-bold truncate leading-tight tracking-tight font-['Poppins']">
              {festival.festival_nombre}
            </h3>
          </div>
          
          {/* Bottom Section with Button */}
          <div className="bg-background px-4 py-4 flex justify-center items-center">
            <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 py-3 h-auto transition-all duration-300">
              <span>VER ENTRADAS</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
});

ParentFestivalCard.displayName = "ParentFestivalCard";

export default ParentFestivalCard;
