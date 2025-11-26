import { Link } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";

interface EventCardProps {
  event: {
    event_id: string;
    event_name: string;
    event_date: string;
    venue_city: string;
    venue_name?: string;
    venue_address?: string;
    local_event_date?: string;
    image_standard_url: string;
    image_large_url?: string;
    ticket_cheapest_price?: number;
    package_price_min?: number;
    has_hotel_offers?: boolean;
    sold_out?: boolean;
    seats_available?: boolean;
    hotels_count?: number;
    attraction_names?: string[];
    categories?: Array<{ name: string }>;
  };
  viewMode?: "grid" | "list";
}

const EventCard = ({ event, viewMode = "grid" }: EventCardProps) => {
  const eventDate = parseISO(event.event_date);
  const now = new Date();
  const daysUntil = differenceInDays(eventDate, now);
  const dayNumber = format(eventDate, "dd");
  const monthName = format(eventDate, "MMM", { locale: es }).toUpperCase();
  const year = format(eventDate, "yyyy");
  const time = event.local_event_date ? format(parseISO(event.local_event_date), "HH:mm") : format(eventDate, "HH:mm");

  // Countdown state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const totalHours = differenceInHours(eventDate, now);
      const days = Math.max(0, differenceInDays(eventDate, now));
      const hours = Math.max(0, differenceInHours(eventDate, now) % 24);
      const minutes = Math.max(0, differenceInMinutes(eventDate, now) % 60);
      
      setCountdown({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [eventDate]);

  // Show countdown only if within 30 days
  const showCountdown = daysUntil >= 0 && daysUntil <= 30;
  const isLessThan24Hours = differenceInHours(eventDate, new Date()) < 24 && differenceInHours(eventDate, new Date()) > 0;

  // Determine badge
  let badgeVariant: "disponible" | "agotado" | undefined;
  let badgeText: string | undefined;

  if (event.sold_out) {
    badgeVariant = "agotado";
    badgeText = "AGOTADO";
  } else if (event.seats_available) {
    badgeVariant = "disponible";
    badgeText = "DISPONIBLE";
  }

  return (
    <Link to={`/producto/${event.event_id}`} className="group block">
      {viewMode === "grid" ? (
        <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover border-0">
          <div className="flex flex-col">
            {/* Main Event Area with Background Image */}
            <div className="relative h-48 overflow-hidden">
              {/* Background Image */}
              <img
                src={event.image_large_url || event.image_standard_url || "/placeholder.svg"}
                alt={event.event_name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Gradient Overlay - Only at bottom for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Date Card - Absolute positioned on the left */}
              <div className="absolute -left-3 top-4 bg-white rounded-xl shadow-2xl overflow-hidden z-10 border-2 border-gray-100" style={{ width: '110px' }}>
                <div className="text-center px-3 py-3 bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{monthName}</div>
                  <div className="text-5xl font-black text-gray-900 leading-none my-2">{dayNumber}</div>
                  <div className="text-sm font-semibold text-gray-600">{year}</div>
                </div>
                {badgeText && badgeVariant && (
                  <div className="px-2 pb-2">
                    <Badge variant={badgeVariant} className="w-full justify-center text-xs font-bold py-1.5">
                      {badgeText}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content over image */}
              <div className="relative h-full flex flex-col justify-between p-4 pl-32">
                {/* Event Name */}
                <div>
                  <h3 className="text-white text-2xl font-black mb-3 line-clamp-2 drop-shadow-lg leading-tight tracking-tight">
                    {event.event_name}
                  </h3>
                </div>

                {/* Countdown Timer and Badge - Top Right */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  {showCountdown && (
                    <div className="bg-black/80 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl">
                      <div className="flex gap-4 text-white text-center">
                        {isLessThan24Hours ? (
                          <>
                            <div>
                              <div className="text-2xl font-black">{countdown.hours}</div>
                              <div className="text-[9px] uppercase font-bold tracking-wider">HRS</div>
                            </div>
                            <div>
                              <div className="text-2xl font-black">{countdown.minutes}</div>
                              <div className="text-[9px] uppercase font-bold tracking-wider">MIN</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="text-2xl font-black">{countdown.days}</div>
                              <div className="text-[9px] uppercase font-bold tracking-wider">DÍAS</div>
                            </div>
                            <div>
                              <div className="text-2xl font-black">{countdown.hours}</div>
                              <div className="text-[9px] uppercase font-bold tracking-wider">HRS</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Time and Location */}
                <div className="text-white space-y-1.5 drop-shadow-lg">
                  <div className="text-base font-bold">{time}h</div>
                  <div className="flex items-start gap-2 text-sm text-white/95">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2 font-medium">
                      {event.venue_name && `${event.venue_name}, `}
                      {event.venue_address || event.venue_city}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section with Button */}
            <div className="bg-background p-4 flex justify-center items-center">
              <Button variant="primary" size="lg" className="gap-2 min-w-[280px] flex items-center justify-center">
                <span>Entradas</span>
                <span>→</span>
                <span>Desde {event.ticket_cheapest_price?.toFixed(0) || 0}€</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // List View
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-card-hover border-0">
          <div className="flex flex-row h-40">
            {/* Image Section - Left */}
            <div className="relative w-64 flex-shrink-0 overflow-hidden">
              <img
                src={event.image_large_url || event.image_standard_url || "/placeholder.svg"}
                alt={event.event_name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            </div>

            {/* Content Section - Right */}
            <div className="flex-1 flex items-center justify-between p-6">
              <div className="flex-1 space-y-3">
                {/* Date and Event Name */}
                <div className="flex items-start gap-4">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-100 flex-shrink-0" style={{ width: '70px' }}>
                    <div className="text-center px-2 py-2 bg-gradient-to-b from-gray-50 to-white">
                      <div className="text-[8px] font-bold text-gray-500 uppercase">{monthName}</div>
                      <div className="text-3xl font-black text-gray-900 leading-none">{dayNumber}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-foreground mb-1 line-clamp-1">
                      {event.event_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue_city}</span>
                      <span>•</span>
                      <span>{time}h</span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2 items-center">
                  {badgeText && badgeVariant && (
                    <Badge variant={badgeVariant} className="text-xs">
                      {badgeText}
                    </Badge>
                  )}
                  {showCountdown && (
                    <div className="text-xs font-bold text-muted-foreground">
                      {isLessThan24Hours 
                        ? `${countdown.hours}h ${countdown.minutes}m`
                        : `${countdown.days}d ${countdown.hours}h`
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Price Button */}
              <div className="flex-shrink-0">
                <Button variant="primary" size="lg" className="gap-2">
                  <span>Entradas</span>
                  <span>→</span>
                  <span>Desde {event.ticket_cheapest_price?.toFixed(0) || 0}€</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </Link>
  );
};

export default EventCard;
