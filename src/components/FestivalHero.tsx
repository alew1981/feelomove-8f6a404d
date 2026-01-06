import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { useFavorites } from "@/hooks/useFavorites";

interface FestivalHeroProps {
  title: string;
  imageUrl?: string;
  eventDate?: string | null;
  endDate?: string | null;
  durationDays?: number;
  city?: string;
  venue?: string;
  genre?: string;
  headliners?: string[];
  eventId?: string;
  eventSlug?: string;
  isFestival?: boolean;
  badges?: string[];
  className?: string;
}

const FestivalHero = ({ 
  title, 
  imageUrl, 
  eventDate,
  endDate,
  durationDays = 1,
  city,
  venue,
  genre,
  headliners = [],
  eventId,
  eventSlug,
  isFestival = true,
  badges = [],
  className = "" 
}: FestivalHeroProps) => {
  const defaultImage = "https://s1.ticketm.net/dam/a/512/655083a1-b8c6-45f5-ba9a-f7c3bca2c512_EVENT_DETAIL_PAGE_16_9.jpg";
  const finalImage = imageUrl && imageUrl !== "/placeholder.svg" ? imageUrl : defaultImage;
  
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { toggleFavorite, isFavorite } = useFavorites();

  // Parse dates
  const hasValidDate = eventDate && !eventDate.startsWith('9999');
  const parsedDate = hasValidDate ? new Date(eventDate) : null;
  const parsedEndDate = endDate && !endDate.startsWith('9999') ? new Date(endDate) : null;
  
  // Countdown calculation
  const countdown = useMemo(() => {
    if (!parsedDate) return null;
    const now = new Date();
    const days = differenceInDays(parsedDate, now);
    const hours = differenceInHours(parsedDate, now) % 24;
    if (days < 0) return null;
    return { days, hours };
  }, [parsedDate]);

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          setScrollOffset(window.scrollY * 0.3);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Format date info
  const dateInfo = useMemo(() => {
    if (!parsedDate) return { month: "FECHA", day: "", year: "", time: "", weekday: "", pendiente: true };
    return {
      month: format(parsedDate, "MMM", { locale: es }).toUpperCase(),
      day: format(parsedDate, "dd"),
      year: format(parsedDate, "yyyy"),
      time: format(parsedDate, "HH:mm"),
      weekday: format(parsedDate, "EEEE", { locale: es }).toUpperCase(),
      pendiente: false,
    };
  }, [parsedDate]);

  // Get season from date
  const season = useMemo(() => {
    if (!parsedDate) return null;
    const month = parsedDate.getMonth();
    if (month >= 2 && month <= 4) return "PRIMAVERA";
    if (month >= 5 && month <= 7) return "VERANO";
    if (month >= 8 && month <= 10) return "OTOÑO";
    return "INVIERNO";
  }, [parsedDate]);
  
  return (
    <div 
      ref={heroRef}
      className={`relative min-h-[280px] md:min-h-[320px] overflow-hidden rounded-xl mb-6 ${className}`}
    >
      {/* Background Image with Parallax */}
      <img
        src={finalImage}
        alt={`${title} - Festival de música en ${city || 'España'}`}
        className="absolute inset-0 w-full h-full object-cover parallax-bg"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        width={1200}
        height={320}
        style={{ transform: `translateY(${scrollOffset}px) scale(1.1)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Date Badge - Left Side */}
      <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center shadow-lg min-w-[80px] md:min-w-[100px]">
          <div className="text-xs md:text-sm font-bold text-primary">
            {dateInfo.month}
          </div>
          {dateInfo.pendiente ? (
            <div className="text-xs md:text-sm font-bold text-muted-foreground my-2 px-1">
              Pendiente fechas
            </div>
          ) : (
            <>
              <div className="text-3xl md:text-4xl font-black text-foreground leading-none my-1">
                {dateInfo.day}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {dateInfo.year}
              </div>
            </>
          )}
          {hasValidDate && (
            <>
              <div className="border-t border-border mt-2 pt-2">
                <div className="text-sm md:text-base font-bold text-foreground">
                  {dateInfo.time}h
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="flex items-center justify-center gap-1">
                  📍 {city || venue || "España"}
                </span>
              </div>
              {venue && city && (
                <div className="text-xs text-muted-foreground truncate max-w-[90px] md:max-w-[110px]">
                  {venue}
                </div>
              )}
            </>
          )}
          {!hasValidDate && (city || venue) && (
            <div className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
              <span className="flex items-center justify-center gap-1">
                📍 {city || venue || "España"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Top Right - Badges & Countdown */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10 flex flex-col items-end gap-2">
        {/* Status Badges */}
        <div className="flex flex-wrap justify-end gap-1.5 max-w-[280px]">
          <Badge className="bg-accent text-accent-foreground text-[10px] md:text-xs font-bold">
            DISPONIBLE
          </Badge>
          {countdown && countdown.days <= 7 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] md:text-xs font-bold">
              ¡ÚLTIMA SEMANA!
            </Badge>
          )}
          {dateInfo.weekday && (
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {dateInfo.weekday}
            </Badge>
          )}
          {season && (
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {season}
            </Badge>
          )}
          {genre && (
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {genre.toUpperCase()}
            </Badge>
          )}
          {durationDays > 1 && (
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {durationDays} DÍAS
            </Badge>
          )}
        </div>
        
        {/* Countdown */}
        {countdown && (
          <div className="bg-accent/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-accent-foreground">
            <div className="text-center">
              <div className="text-lg md:text-xl font-black leading-none">{String(countdown.days).padStart(2, '0')}</div>
              <div className="text-[8px] md:text-[10px] uppercase">DÍAS</div>
            </div>
            <div className="text-lg md:text-xl font-bold">:</div>
            <div className="text-center">
              <div className="text-lg md:text-xl font-black leading-none">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-[8px] md:text-[10px] uppercase">HRS</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Center Content - Title and Favorite */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pl-[110px] md:pl-[140px]">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            {/* Headliners */}
            {headliners.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {headliners.slice(0, 4).map((artist) => (
                  <Badge key={artist} variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
                    {artist}
                  </Badge>
                ))}
                {headliners.length > 4 && (
                  <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20 text-xs">
                    +{headliners.length - 4} más
                  </Badge>
                )}
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
              {title}
            </h1>
          </div>
          
          {/* Favorite Button */}
          {eventId && eventSlug && (
            <button
              onClick={() => toggleFavorite({
                event_id: eventId,
                event_name: title,
                event_slug: eventSlug,
                event_date: eventDate || '',
                venue_city: city || '',
                image_url: finalImage,
                is_festival: isFestival
              })}
              className="p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label={isFavorite(eventId) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart
                className={`h-5 w-5 md:h-6 md:w-6 ${
                  isFavorite(eventId) ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </button>
          )}
        </div>
      </div>
      
      {/* Right Side - Small Event Image */}
      <div className="hidden md:block absolute right-4 bottom-4 w-24 h-24 lg:w-28 lg:h-28 rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
        <img
          src={finalImage}
          alt={`Miniatura de ${title}`}
          className="w-full h-full object-cover"
          loading="lazy"
          width={112}
          height={112}
        />
      </div>
    </div>
  );
};

export default FestivalHero;
