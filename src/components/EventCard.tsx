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
}

const EventCard = ({ event }: EventCardProps) => {
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
      const days = Math.max(0, differenceInDays(eventDate, now));
      const hours = Math.max(0, differenceInHours(eventDate, now) % 24);
      const minutes = Math.max(0, differenceInMinutes(eventDate, now) % 60);
      
      setCountdown({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [eventDate]);

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

  // Get first 2 categories for display
  const displayCategories = event.categories?.slice(0, 2) || [];

  return (
    <Link to={`/producto/${event.event_id}`} className="group block">
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
            <div className="absolute -left-2 top-4 bg-white rounded-lg shadow-xl overflow-hidden z-10" style={{ width: '100px' }}>
              <div className="text-center px-3 py-2">
                <div className="text-xs font-semibold text-gray-600 uppercase">{monthName}</div>
                <div className="text-4xl font-bold text-gray-900 leading-none my-1">{dayNumber}</div>
                <div className="text-sm font-medium text-gray-600">{year}</div>
              </div>
              {badgeText && badgeVariant && (
                <div className="px-2 pb-2">
                  <Badge variant={badgeVariant} className="w-full justify-center text-xs">
                    {badgeText}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content over image */}
            <div className="relative h-full flex flex-col justify-between p-4 pl-28">
              {/* Event Name and Categories */}
              <div>
                <h3 className="text-white text-xl font-bold mb-2 line-clamp-2">
                  {event.event_name}
                </h3>
                {displayCategories.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {displayCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full border border-white/20"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Countdown Timer - Top Right */}
              {daysUntil >= 0 && daysUntil <= 30 && (
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex gap-3 text-white text-center">
                    <div>
                      <div className="text-lg font-bold">{countdown.days}</div>
                      <div className="text-[10px] uppercase">DÍAS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{countdown.hours}</div>
                      <div className="text-[10px] uppercase">HRS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{countdown.minutes}</div>
                      <div className="text-[10px] uppercase">MIN</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time and Location */}
              <div className="text-white space-y-1">
                <div className="text-sm font-semibold">{time}h</div>
                <div className="flex items-start gap-1 text-sm text-white/90">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
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
    </Link>
  );
};

export default EventCard;
