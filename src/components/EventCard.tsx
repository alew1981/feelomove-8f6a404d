import { Link } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { CategoryBadge } from "./CategoryBadge";

interface EventCardProps {
  event: {
    // Support both old and new field names
    id?: string;
    event_id?: string;
    name?: string;
    event_name?: string;
    slug?: string;
    event_slug?: string;
    event_date: string;
    venue_city: string;
    venue_name?: string;
    venue_address?: string;
    local_event_date?: string;
    image_standard_url?: string;
    image_large_url?: string;
    event_image_large?: string;
    event_image_standard?: string;
    price_min_incl_fees?: number | null;
    ticket_price_min?: number | null;
    ticket_cheapest_price?: number;
    sold_out?: boolean;
    seats_available?: boolean;
    badges?: string[];
    event_badges?: string[];
  };
}

const EventCard = ({ event }: EventCardProps) => {
  // Normalize field names (support both old and new views)
  const eventId = event.id || event.event_id;
  const eventName = event.name || event.event_name || '';
  const eventSlug = event.slug || event.event_slug;
  const imageUrl = event.image_large_url || event.event_image_large || event.image_standard_url || event.event_image_standard || "/placeholder.svg";
  const price = event.price_min_incl_fees ?? event.ticket_price_min ?? event.ticket_cheapest_price ?? 0;
  const badges = event.badges || event.event_badges || [];

  const eventDate = parseISO(event.event_date);
  const dayNumber = format(eventDate, "dd");
  const monthName = format(eventDate, "MMM", { locale: es }).toUpperCase();
  const year = format(eventDate, "yyyy");
  const time = event.local_event_date ? format(parseISO(event.local_event_date), "HH:mm") : format(eventDate, "HH:mm");

  // Countdown state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLessThan24Hours: false
  });

  // Calculate initial values for showing countdown
  const initialDaysUntil = differenceInDays(eventDate, new Date());
  const showCountdown = initialDaysUntil >= 0 && initialDaysUntil <= 30;

  useEffect(() => {
    if (!showCountdown) return;

    const updateCountdown = () => {
      const now = new Date();
      const targetDate = parseISO(event.event_date);
      const days = Math.max(0, differenceInDays(targetDate, now));
      const hours = Math.max(0, differenceInHours(targetDate, now) % 24);
      const minutes = Math.max(0, differenceInMinutes(targetDate, now) % 60);
      const seconds = Math.max(0, differenceInSeconds(targetDate, now) % 60);
      const hoursUntil = differenceInHours(targetDate, now);
      const isUnder24h = hoursUntil < 24 && hoursUntil > 0;
      
      setCountdown({ days, hours, minutes, seconds, isLessThan24Hours: isUnder24h });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.event_date, showCountdown]);

  // Determine badge
  let badgeVariant: "disponible" | "agotado" | undefined;
  let badgeText: string | undefined;

  if (event.sold_out) {
    badgeVariant = "agotado";
    badgeText = "AGOTADO";
  } else if (event.seats_available !== false) {
    badgeVariant = "disponible";
    badgeText = "DISPONIBLE";
  }

  const eventUrl = `/producto/${eventSlug}`;

  return (
    <Link to={eventUrl} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20 shadow-lg">
          <div className="flex flex-col">
            {/* Main Event Area with Background Image */}
            <div className="relative h-56 overflow-hidden">
              {/* Background Image */}
              <img
                src={imageUrl}
                alt={eventName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
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
              
              {/* Category Badge - Bottom Left */}
              <div className="absolute bottom-3 left-3 z-10">
                <CategoryBadge badges={badges} />
              </div>

              {/* Date Card - Absolute positioned on the left */}
              <div className="absolute left-2 top-8 bg-white rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200" style={{ width: '85px' }}>
                <div className="text-center px-2 py-2 bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{monthName}</div>
                  <div className="text-3xl font-black text-gray-900 leading-none my-1">{dayNumber}</div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">{year}</div>
                  {/* Time */}
                  <div className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5">{time}h</div>
                  {/* Location */}
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-600 mt-1">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="line-clamp-1 font-medium">
                      {event.venue_city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown Timer - Top Right */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                {showCountdown && (
                  <div className="bg-black/90 backdrop-blur-md rounded-md px-3 py-2 shadow-xl border border-accent/30">
                    <div className="flex gap-2 text-accent font-['Poppins'] text-center">
                      {countdown.isLessThan24Hours ? (
                        <>
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-bold leading-none">{String(countdown.hours).padStart(2, '0')}</div>
                            <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">HRS</div>
                          </div>
                          <div className="text-xl font-bold self-center leading-none pb-2 text-white/60">:</div>
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-bold leading-none">{String(countdown.minutes).padStart(2, '0')}</div>
                            <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">MIN</div>
                          </div>
                          <div className="text-xl font-bold self-center leading-none pb-2 text-white/60">:</div>
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-bold leading-none">{String(countdown.seconds).padStart(2, '0')}</div>
                            <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">SEG</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-bold leading-none">{String(countdown.days).padStart(2, '0')}</div>
                            <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">DÍAS</div>
                          </div>
                          <div className="text-xl font-bold self-center leading-none pb-2 text-white/60">:</div>
                          <div className="flex flex-col items-center">
                            <div className="text-xl font-bold leading-none">{String(countdown.hours).padStart(2, '0')}</div>
                            <div className="text-[7px] uppercase font-semibold tracking-wide text-white/70 mt-0.5">HRS</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Name Below Image */}
            <div className="bg-background px-4 pt-4 pb-2">
              <h3 className="text-foreground text-xl font-bold truncate leading-tight tracking-tight font-['Poppins']" title={eventName}>
                {eventName}
              </h3>
            </div>

            {/* Bottom Section with Button */}
            <div className="bg-background px-4 pb-4 flex justify-center items-center">
              <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 py-3 h-auto transition-all duration-300">
                <span>Entradas</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                <span>Desde {Number(price).toFixed(0)}€</span>
              </Button>
            </div>
          </div>
        </Card>
    </Link>
  );
};

export default EventCard;
