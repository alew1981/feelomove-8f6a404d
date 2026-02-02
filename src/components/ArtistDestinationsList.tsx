import { Link } from "react-router-dom";
import { memo } from "react";
import { cn } from "@/lib/utils";

// Inline SVG icons to reduce bundle size (aria-hidden for accessibility)
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconChevronRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

/**
 * Artist Destinations - Pill/Chip format with horizontal scroll on mobile
 * Feelomove+ Design: Black border, Green hover, 4px lift
 */
const ArtistDestinationsList = memo(({ artistName, citiesWithData, currentCity }: ArtistDestinationsListProps) => {
  // Filter out current city if provided
  const filteredCities = currentCity 
    ? citiesWithData.filter(city => city.name.toLowerCase() !== currentCity.toLowerCase())
    : citiesWithData;
  
  if (filteredCities.length === 0) return null;

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

      {/* Horizontal Pill Layout with Scroll on Mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
        {filteredCities.map((city) => (
          <Link
            key={city.slug}
            to={`/destinos/${city.slug}`}
            className={cn(
              "group inline-flex items-center gap-2 px-4 py-2.5",
              "bg-card border-2 border-foreground rounded-full",
              "whitespace-nowrap flex-shrink-0",
              "transition-all duration-200 ease-out",
              "hover:bg-[#00FF8F] hover:-translate-y-1"
            )}
          >
            <span className="font-semibold text-sm text-foreground group-hover:text-black transition-colors duration-200">
              {city.name}
            </span>
            <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full group-hover:bg-black group-hover:text-[#00FF8F] transition-colors duration-200">
              {city.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});

ArtistDestinationsList.displayName = "ArtistDestinationsList";

export default ArtistDestinationsList;
