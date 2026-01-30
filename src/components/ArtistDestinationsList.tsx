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

// MAX 6 ITEMS initially
const INITIAL_LIMIT = 6;

/**
 * Compact destinations list for artist events - NO IMAGES for better performance.
 * Clean grid layout with city name and event count.
 */
const ArtistDestinationsList = memo(({ artistName, citiesWithData, currentCity }: ArtistDestinationsListProps) => {
  const [showAll, setShowAll] = useState(false);
  
  // Filter out current city if provided
  const filteredCities = currentCity 
    ? citiesWithData.filter(city => city.name.toLowerCase() !== currentCity.toLowerCase())
    : citiesWithData;
  
  if (filteredCities.length === 0) return null;

  // LIMIT: Show max items unless "showAll" is true
  const visibleCities = showAll ? filteredCities : filteredCities.slice(0, INITIAL_LIMIT);
  const hasMore = filteredCities.length > INITIAL_LIMIT;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <IconMapPin className="h-5 w-5 text-accent" />
          Ver en otros destinos
        </h2>
        <Link
          to="/destinos"
          className="flex items-center gap-1 text-accent hover:text-accent/80 font-semibold transition-colors text-sm"
        >
          Ver todos <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Clean Grid - No Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {visibleCities.map((city) => (
          <Link
            key={city.slug}
            to={`/destinos/${city.slug}`}
            className={cn(
              "group flex items-center justify-between gap-2 px-4 py-3",
              "bg-card border border-border rounded-xl",
              "hover:border-accent hover:bg-accent/5",
              "transition-all duration-200"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <IconMapPin className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="font-medium text-foreground text-sm truncate group-hover:text-accent transition-colors">
                {city.name}
              </span>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold bg-foreground text-background px-2 py-0.5 rounded-full">
              {city.count}
            </span>
          </Link>
        ))}
      </div>

      {/* "Ver más" button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full py-2.5 text-center text-sm font-semibold text-accent hover:text-accent/80 bg-card border border-border rounded-xl hover:border-accent transition-all"
        >
          Ver {filteredCities.length - INITIAL_LIMIT} destinos más
        </button>
      )}
    </section>
  );
});

ArtistDestinationsList.displayName = "ArtistDestinationsList";

export default ArtistDestinationsList;
