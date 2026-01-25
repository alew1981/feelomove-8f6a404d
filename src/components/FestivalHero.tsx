import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { format } from "date-fns";
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
        // @ts-expect-error - fetchpriority is valid HTML but React types don't recognize lowercase
        fetchpriority="high"
        width={1200}
        height={320}
        style={{ transform: `translateY(${scrollOffset}px) scale(1.1)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Left Side - Date Badge */}
      <div className="absolute left-4 md:left-6 top-4 md:top-6 z-10 flex flex-col items-start gap-3">
        
        {/* Date Badge - Same structure as concerts but without time */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 md:p-5 text-center shadow-lg min-w-[140px] md:min-w-[180px]">
          <div className="text-xs md:text-sm font-bold text-primary uppercase">
            {dateInfo.month}
          </div>
          {dateInfo.pendiente ? (
            <div className="text-sm md:text-base font-bold text-muted-foreground my-3 px-1">
              Pendiente fechas
            </div>
          ) : (
            <>
              <div className="text-4xl md:text-5xl font-black text-foreground leading-none my-2">
                {dateInfo.day}
              </div>
              <div className="text-sm md:text-base text-muted-foreground">
                {dateInfo.year}
              </div>
            </>
          )}
          {/* City/Venue section - same style as concerts */}
          {(city || venue) && (
            <div className="border-t border-border mt-3 pt-3">
              <div className="flex items-center justify-center gap-1 text-sm md:text-base">
                <span className="text-muted-foreground">⊙</span>
                <span className="font-bold text-foreground">{city || "España"}</span>
              </div>
              {venue && (
                <div className="text-xs md:text-sm text-muted-foreground mt-1 leading-tight">
                  {venue}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Top Right - Status Badges in horizontal row */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge className="bg-accent text-accent-foreground text-[10px] md:text-xs font-bold px-3 py-1">
            DISPONIBLE
          </Badge>
          {dateInfo.weekday && !dateInfo.pendiente && (
            <Badge variant="secondary" className="text-[10px] md:text-xs px-3 py-1">
              {dateInfo.weekday}
            </Badge>
          )}
          {season && (
            <Badge variant="secondary" className="text-[10px] md:text-xs px-3 py-1">
              {season}
            </Badge>
          )}
          {genre && (
            <Badge variant="secondary" className="text-[10px] md:text-xs px-3 py-1">
              {genre.toUpperCase()}
            </Badge>
          )}
          {durationDays > 1 && (
            <Badge variant="secondary" className="text-[10px] md:text-xs px-3 py-1">
              {durationDays} DÍAS
            </Badge>
          )}
        </div>
      </div>
      
      {/* Center - Favorite Button */}
      {eventId && eventSlug && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
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
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            aria-label={isFavorite(eventId) ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart
              className={`h-6 w-6 ${
                isFavorite(eventId) ? "fill-red-500 text-red-500" : "text-white"
              }`}
            />
          </button>
        </div>
      )}
      
      {/* Bottom Center - Title */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-10">
        <div className="text-center px-4 md:px-6">
          {/* Headliners */}
          {headliners.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mb-2">
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
          
          {/* Title - Centered */}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
            {title}
          </h1>
        </div>
      </div>
      
      {/* Right Side - Small Event Image - positioned higher */}
      <div className="hidden md:block absolute right-4 bottom-12 w-24 h-24 lg:w-28 lg:h-28 rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
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
