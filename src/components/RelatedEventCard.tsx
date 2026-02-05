import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

// Native date formatting (no date-fns dependency)
const SPANISH_MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const formatEventDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return {
    month: SPANISH_MONTHS_SHORT[date.getMonth()],
    day: String(date.getDate()).padStart(2, '0'),
    year: String(date.getFullYear()),
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}h`
  };
};

// Inline SVG icons
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={cn("h-3 w-3", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconArrowRight = ({ className = "" }: { className?: string }) => (
  <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

export interface RelatedEvent {
  id: string;
  slug: string;
  name: string;
  artist_name?: string;
  event_date: string;
  venue_city: string;
  venue_name?: string;
  image_url?: string;
  price_min?: number;
  is_festival?: boolean;
}

interface RelatedEventCardProps {
  event: RelatedEvent;
  className?: string;
}

/**
 * Related Event Card - Feelomove+ Design
 * Based on the screenshot: Image with date overlay, artist name, green CTA
 */
export const RelatedEventCard = memo(({ event, className }: RelatedEventCardProps) => {
  const { month, day, year, time } = useMemo(() => formatEventDate(event.event_date), [event.event_date]);
  
  // CRITICAL SEO: Use plural routes as canonical
  const eventUrl = event.is_festival 
    ? `/festivales/${event.slug}` 
    : `/conciertos/${event.slug}`;
  
  const displayName = event.artist_name || event.name.split(' - ')[0] || event.name;

  return (
    <Link
      to={eventUrl}
      className={cn(
        "group block rounded-2xl overflow-hidden bg-card",
        "transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Image Container with Date Overlay */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={displayName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
            <span className="text-4xl font-bold text-accent/30">{displayName.charAt(0)}</span>
          </div>
        )}
        
        {/* Date Overlay - Left side */}
        <div className="absolute top-3 left-3 bg-white rounded-lg px-3 py-2 shadow-lg text-center min-w-[70px]">
          <div className="text-xs font-bold text-muted-foreground tracking-wide">{month}</div>
          <div className="text-2xl font-black text-foreground leading-none">{day}</div>
          <div className="text-xs font-semibold text-muted-foreground">{year}</div>
          <div className="text-xs font-bold text-foreground mt-1 border-t border-border pt-1">{time}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            <IconMapPin className="h-2.5 w-2.5" />
            <span className="truncate max-w-[60px]">{event.venue_city}</span>
          </div>
        </div>

        {/* Artist Name Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-8">
          <h3 className="font-bold text-white text-lg line-clamp-1">{displayName}</h3>
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-3">
        <div className="w-full bg-accent text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-accent/90 transition-colors">
          VER ENTRADAS
          <IconArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
});

RelatedEventCard.displayName = "RelatedEventCard";

/**
 * Destination Card - Feelomove+ Design (No Image variant)
 * Similar structure but without image, using data-driven content
 */
interface DestinationCardData {
  city_name: string;
  city_slug: string;
  event_count: number;
  top_artists?: string[];
  genres?: string[];
  price_from?: number;
}

interface DestinationCardProps {
  destination: DestinationCardData;
  className?: string;
}

export const DestinationCard = memo(({ destination, className }: DestinationCardProps) => {
  const topArtists = destination.top_artists?.slice(0, 2)?.join(', ') || '';
  const genres = destination.genres?.slice(0, 2)?.join(' · ') || '';
  
  return (
    <Link
      to={`/destinos/${destination.city_slug}`}
      className={cn(
        "group block rounded-2xl overflow-hidden bg-card border border-border",
        "transition-all duration-300 hover:-translate-y-1 hover:border-accent",
        className
      )}
    >
      {/* Content Area (replaces image) */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-muted via-card to-muted/50 p-4 flex flex-col justify-between">
        {/* Top: Event Count Badge */}
        <div className="flex justify-between items-start">
          <div className="bg-foreground text-background rounded-lg px-3 py-2 text-center">
            <div className="text-2xl font-black leading-none">{destination.event_count}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide">eventos</div>
          </div>
          {destination.price_from && destination.price_from > 0 && (
            <div className="bg-accent/10 text-accent rounded-lg px-2 py-1 text-xs font-semibold">
              desde {destination.price_from}€
            </div>
          )}
        </div>

        {/* Middle: Location Icon */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <IconMapPin className="w-8 h-8 text-accent" />
          </div>
        </div>

        {/* Bottom: Genres/Artists */}
        <div className="space-y-1">
          {genres && (
            <p className="text-xs text-muted-foreground truncate">{genres}</p>
          )}
          {topArtists && (
            <p className="text-sm font-medium text-foreground truncate">{topArtists}</p>
          )}
        </div>
      </div>

      {/* CTA Button with City Name */}
      <div className="p-3">
        <div className="w-full bg-accent text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-accent/90 transition-colors">
          {destination.city_name.toUpperCase()}
          <IconArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
});

DestinationCard.displayName = "DestinationCard";

export default RelatedEventCard;
