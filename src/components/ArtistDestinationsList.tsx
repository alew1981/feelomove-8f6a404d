import { Link } from "react-router-dom";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";

// Inline SVG icons to reduce bundle size
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconChevronRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

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

// MAX 4 ITEMS initially to reduce DOM nodes
const INITIAL_LIMIT = 4;

/**
 * Compact destinations list for artist events.
 * OPTIMIZED: Limited to 4 items initially with "View More" button to reduce DOM nodes.
 */
const ArtistDestinationsList = memo(({ artistName, citiesWithData, currentCity }: ArtistDestinationsListProps) => {
  const [showAll, setShowAll] = useState(false);
  
  // Filter out current city if provided
  const filteredCities = currentCity 
    ? citiesWithData.filter(city => city.name.toLowerCase() !== currentCity.toLowerCase())
    : citiesWithData;
  
  if (filteredCities.length === 0) return null;

  // LIMIT: Show max 4 items unless "showAll" is true
  const visibleCities = showAll ? filteredCities : filteredCities.slice(0, INITIAL_LIMIT);
  const hasMore = filteredCities.length > INITIAL_LIMIT;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Ver en otros destinos</h2>
        <Link
          to="/destinos"
          className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors text-sm"
        >
          Ver todos <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Desktop: Visual Cards Grid - MAX 4 items */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleCities.slice(0, 4).map((city) => (
          <Link
            key={city.slug}
            to={`/destinos/${city.slug}`}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden"
          >
            {city.image ? (
              <img
                src={city.image}
                alt={`${artistName} en ${city.name}`}
                width={300}
                height={225}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                <IconMapPin className="w-8 h-8 text-accent/50" />
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

      {/* Mobile: Compact List View - MAX 4 items with "Ver más" */}
      <div className="md:hidden bg-card border border-border rounded-xl divide-y divide-border">
        {visibleCities.map((city) => (
          <Link
            key={city.slug}
            to={`/destinos/${city.slug}`}
            className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group"
          >
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent transition-all">
                  {city.image ? (
                    <img src={city.image} alt={city.name} width={40} height={40} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                      <IconMapPin className="w-4 h-4 text-accent/50" />
                    </div>
                  )}
                </div>
                <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {city.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-background bg-foreground px-3 py-1 rounded-full font-medium">
                  {city.count}
                </span>
                <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </>
          </Link>
        ))}
        
        {/* "Ver más" button for mobile */}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full p-4 text-center text-sm font-semibold text-accent hover:bg-accent/5 transition-colors"
          >
            Ver {filteredCities.length - INITIAL_LIMIT} destinos más
          </button>
        )}
      </div>
    </section>
  );
});

ArtistDestinationsList.displayName = "ArtistDestinationsList";

export default ArtistDestinationsList;
