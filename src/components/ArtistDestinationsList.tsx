import { Link } from "react-router-dom";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CityWithData {
  name: string;
  count: number;
  image: string | null;
  slug: string;
}

interface ArtistDestinationsListProps {
  artistName: string;
  citiesWithData: CityWithData[];
  currentCity?: string;
}

/**
 * Compact destinations list for artist events, used on both artist detail and product pages.
 * Desktop: Shows visual cards in a grid layout.
 * Mobile: Shows compact list rows like the reference screenshot.
 */
const ArtistDestinationsList = memo(({ artistName, citiesWithData, currentCity }: ArtistDestinationsListProps) => {
  // Filter out current city if provided
  const filteredCities = currentCity 
    ? citiesWithData.filter(city => city.name.toLowerCase() !== currentCity.toLowerCase())
    : citiesWithData;
  
  if (filteredCities.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Ver en otros destinos</h2>
        <Link
          to="/destinos"
          className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors text-sm"
        >
          Ver todos <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Desktop: Visual Cards Grid */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredCities.slice(0, 4).map((city, index) => (
          <Link
            key={city.slug}
            to={`/destinos/${city.slug}`}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {city.image ? (
              <img
                src={city.image}
                alt={`${artistName} en ${city.name}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                <MapPin className="w-8 h-8 text-accent/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-bold text-white text-sm line-clamp-1">{city.name}</h3>
              <span className="text-xs text-white/70">{city.count} evento{city.count > 1 ? 's' : ''}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: Compact List View (like reference screenshot) */}
      <div className="md:hidden bg-card border border-border rounded-xl divide-y divide-border">
        {filteredCities.slice(0, 6).map((city, index) => (
          <Link
            key={city.slug}
            to={`/destinos/${city.slug}`}
            className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {/* Circular image like reference */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent transition-all">
                {city.image ? (
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent/50" />
                  </div>
                )}
              </div>
              <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                {city.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-background bg-foreground px-3 py-1 rounded-full font-medium">
                {city.count} evento{city.count > 1 ? 's' : ''}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

ArtistDestinationsList.displayName = "ArtistDestinationsList";

export default ArtistDestinationsList;
