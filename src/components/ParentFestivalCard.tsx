import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Music } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ParentFestival {
  secondary_attraction_id: string;
  secondary_attraction_name: string;
  venue_city: string;
  event_count: number;
  image_large_url: string;
  min_start_date: string;
  max_end_date: string;
  total_artists?: number;
  genres?: string[];
}

interface ParentFestivalCardProps {
  festival: ParentFestival;
  priority?: boolean;
}

const ParentFestivalCard = ({ festival, priority = false }: ParentFestivalCardProps) => {
  // Generate slug from festival name
  const festivalSlug = encodeURIComponent(
    festival.secondary_attraction_name.toLowerCase().replace(/\s+/g, '-')
  );
  
  // Format date range
  const startDate = new Date(festival.min_start_date);
  const endDate = new Date(festival.max_end_date);
  const isSameMonth = startDate.getMonth() === endDate.getMonth();
  const isSameYear = startDate.getFullYear() === endDate.getFullYear();
  
  let dateDisplay: string;
  if (isSameMonth && isSameYear) {
    dateDisplay = `${format(startDate, "d", { locale: es })}-${format(endDate, "d MMM yyyy", { locale: es })}`;
  } else if (isSameYear) {
    dateDisplay = `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`;
  } else {
    dateDisplay = `${format(startDate, "d MMM yyyy", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}`;
  }

  return (
    <Link to={`/festivales/${festivalSlug}`}>
      <Card className="group overflow-hidden border-2 border-border hover:border-accent transition-all duration-300 bg-card h-full">
        {/* Image Container */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={festival.image_large_url || "/placeholder.svg"}
            alt={festival.secondary_attraction_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading={priority ? "eager" : "lazy"}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Event Count Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-accent-foreground font-bold gap-1">
              <Music className="h-3 w-3" />
              {festival.event_count} {festival.event_count === 1 ? 'evento' : 'eventos'}
            </Badge>
          </div>
          
          {/* Festival Name on Image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-lg line-clamp-2">
              {festival.secondary_attraction_name}
            </h3>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-4 space-y-3">
          {/* Date and Location Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">{dateDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{festival.venue_city}</span>
            </div>
          </div>
          
          {/* Artists count if available */}
          {festival.total_artists && festival.total_artists > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              <span>{festival.total_artists} artistas</span>
            </div>
          )}
          
          {/* CTA Button */}
          <div className="pt-2">
            <div className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-bold text-center text-sm group-hover:bg-accent/90 transition-colors">
              Ver eventos del festival
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ParentFestivalCard;
