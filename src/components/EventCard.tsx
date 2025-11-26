import { Link } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface EventCardProps {
  event: {
    event_id: string;
    event_name: string;
    event_date: string;
    venue_city: string;
    image_standard_url: string;
    ticket_cheapest_price?: number;
    package_price_min?: number;
    has_hotel_offers?: boolean;
    sold_out?: boolean;
    seats_available?: boolean;
    hotels_count?: number;
    attraction_names?: string[];
  };
}

const EventCard = ({ event }: EventCardProps) => {
  const eventDate = parseISO(event.event_date);
  const daysUntil = differenceInDays(eventDate, new Date());
  const dayNumber = format(eventDate, "dd");
  const monthName = format(eventDate, "MMM", { locale: es }).toUpperCase();

  // Determine badge
  let badgeVariant: "hot" | "limitado" | "disponible" | "agotado" | undefined;
  let badgeText: string | undefined;

  if (event.sold_out) {
    badgeVariant = "agotado";
    badgeText = "AGOTADO";
  } else if (daysUntil <= 3 && daysUntil >= 0) {
    badgeVariant = "hot";
    badgeText = "HOT";
  } else if (daysUntil <= 7 && daysUntil > 3) {
    badgeVariant = "limitado";
    badgeText = `${daysUntil} DÍAS`;
  } else if (event.seats_available) {
    badgeVariant = "disponible";
    badgeText = "DISPONIBLE";
  }

  return (
    <Link to={`/producto/${event.event_id}`} className="group block">
      <Card className="overflow-hidden h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover border-border">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={event.image_standard_url || "/placeholder.svg"}
            alt={event.event_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Date Badge - Top Left */}
          <div className="absolute top-3 left-3 bg-[#121212] text-white rounded-md overflow-hidden shadow-lg">
            <div className="text-center px-3 py-2 border-b border-[#00FF8F]">
              <div className="text-2xl font-bold leading-none">{dayNumber}</div>
            </div>
            <div className="text-center px-3 py-1 bg-[#00FF8F] text-[#121212]">
              <div className="text-xs font-bold">{monthName}</div>
            </div>
          </div>

          {/* Status Badge - Top Right */}
          {badgeText && badgeVariant && (
            <div className="absolute top-3 right-3">
              <Badge variant={badgeVariant}>{badgeText}</Badge>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/90 via-[#121212]/40 to-transparent" />

          {/* Event Name - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white text-lg font-bold line-clamp-2 mb-2">
              {event.event_name}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin className="h-4 w-4 text-[#00FF8F]" />
              <span>{event.venue_city}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3 bg-white dark:bg-[#1a1a1a]">
          {/* Artists */}
          {event.attraction_names && event.attraction_names.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-[#00FF8F]" />
              <span className="truncate">{event.attraction_names.join(", ")}</span>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Desde</div>
              <div className="text-2xl font-bold text-[#121212] dark:text-white">
                {event.ticket_cheapest_price?.toFixed(0)}€
              </div>
            </div>

            {event.has_hotel_offers && event.package_price_min && (
              <div className="text-right">
                <Badge variant="popular" className="mb-1">PAQUETE</Badge>
                <div className="text-sm font-bold text-[#00FF8F]">
                  {event.package_price_min.toFixed(0)}€
                </div>
              </div>
            )}
          </div>

          {/* Hotel Count */}
          {event.has_hotel_offers && event.hotels_count && event.hotels_count > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              {event.hotels_count} {event.hotels_count === 1 ? "hotel disponible" : "hoteles disponibles"}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;
