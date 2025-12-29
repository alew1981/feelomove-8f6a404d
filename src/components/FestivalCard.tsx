import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { memo, useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FestivalServices } from "@/components/FestivalServices";
import { formatFestivalDateRange, getFestivalDurationText, formatHeadliners } from "@/lib/festivalUtils";

interface FestivalCardProps {
  festival: {
    event_id?: string;
    event_name?: string;
    event_slug?: string;
    venue_city?: string;
    venue_name?: string;
    image_large_url?: string | null;
    image_standard_url?: string | null;
    price_min_incl_fees?: number | null;
    sold_out?: boolean | null;
    seats_available?: boolean | null;
    primary_subcategory_name?: string | null;
    // Festival-specific fields
    festival_start_date?: string | null;
    festival_end_date?: string | null;
    festival_duration_days?: number | null;
    festival_total_artists?: number | null;
    festival_headliners?: string[] | null;
    festival_camping_available?: boolean | null;
    festival_has_official_transport?: boolean | null;
    festival_total_stages?: number | null;
    has_festival_pass?: boolean | null;
    has_daily_tickets?: boolean | null;
    has_camping_tickets?: boolean | null;
    has_parking_tickets?: boolean | null;
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
  const price = festival.price_min_incl_fees ?? 0;
  const slug = festival.event_slug || festival.event_name?.toLowerCase().replace(/\s+/g, "-") || "";
  
  // Festival-specific data
  const durationDays = festival.festival_duration_days ?? 1;
  const totalArtists = festival.festival_total_artists ?? 0;
  const headliners = festival.festival_headliners || [];
  const startDate = festival.festival_start_date;
  const endDate = festival.festival_end_date;

  // Date formatting
  const dateDisplay = startDate && endDate 
    ? formatFestivalDateRange(startDate, endDate)
    : startDate 
      ? format(new Date(startDate), "d MMM yyyy", { locale: es })
      : "";

  // Availability badge
  const isSoldOut = festival.sold_out === true || festival.seats_available === false;

  return (
    <Link to={`/festival/${slug}`} className="block group">
      <Card
        ref={cardRef}
        className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 hover:border-accent/50 h-full"
      >
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          {isInView ? (
            <>
              {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
              <img
                src={imageUrl}
                alt={festival.event_name || "Festival"}
                loading={priority ? "eager" : "lazy"}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top Left - Duration & Artists */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {durationDays > 1 && (
              <Badge className="bg-accent text-accent-foreground font-semibold text-xs">
                {durationDays} DÍAS
              </Badge>
            )}
            {totalArtists > 0 && (
              <Badge className="bg-accent text-accent-foreground font-semibold text-xs">
                {totalArtists} ARTISTAS
              </Badge>
            )}
          </div>

          {/* Top Right - Price */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/70 text-white font-semibold">
              Desde €{price.toFixed(0)}
            </Badge>
          </div>

          {/* Bottom Left - Availability */}
          {(isSoldOut || festival.seats_available === true) && (
            <div className="absolute bottom-3 left-3">
              <Badge variant={isSoldOut ? "agotado" : "disponible"} className="text-[10px] font-bold">
                {isSoldOut ? "SOLD OUT" : "DISPONIBLE"}
              </Badge>
            </div>
          )}

          {/* Festival Name */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pt-8">
            <h3 className="text-lg font-bold text-white font-['Poppins'] line-clamp-2 drop-shadow-lg">
              {festival.event_name}
            </h3>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Location & Date Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {festival.venue_city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                {festival.venue_city}
              </span>
            )}
            {dateDisplay && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                {dateDisplay}
              </span>
            )}
          </div>

          {/* Headliners */}
          {headliners.length > 0 && (
            <p className="text-sm text-foreground font-medium line-clamp-1">
              {formatHeadliners(headliners, 3)}
            </p>
          )}

          {/* Services */}
          <FestivalServices
            campingAvailable={festival.festival_camping_available}
            hasOfficialTransport={festival.festival_has_official_transport}
            hasFestivalPass={festival.has_festival_pass}
            hasDailyTickets={festival.has_daily_tickets}
            hasCampingTickets={festival.has_camping_tickets}
            hasParkingTickets={festival.has_parking_tickets}
            totalStages={festival.festival_total_stages}
            variant="badge"
            maxItems={4}
          />

          {/* Genre Badge */}
          {festival.primary_subcategory_name && (
            <Badge variant="outline" className="text-xs">
              {festival.primary_subcategory_name}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

FestivalCard.displayName = "FestivalCard";

export default FestivalCard;
