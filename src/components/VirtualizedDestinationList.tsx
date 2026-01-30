import { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import DestinationListCard, { DestinationListCardSkeleton } from "./DestinationListCard";

interface Destination {
  city_name: string;
  city_slug?: string;
  event_count?: number;
  concerts_count?: number;
  festivals_count?: number;
  ciudad_imagen?: string;
  sample_image_url?: string;
  sample_image_standard_url?: string;
  price_from?: number;
  genres?: string[];
}

interface VirtualizedDestinationListProps {
  cities: Destination[];
  isLoading?: boolean;
}

const ITEM_HEIGHT = 80; // Fixed row height for destinations (no images)
const OVERSCAN = 5; // Render 5 extra items above/below viewport

/**
 * Virtualized list for destinations on mobile
 * - Only renders visible items + overscan
 * - Uses @tanstack/react-virtual for efficient DOM management
 * - First 5 items get priority loading for LCP
 */
export default function VirtualizedDestinationList({ 
  cities, 
  isLoading = false 
}: VirtualizedDestinationListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: cities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => ITEM_HEIGHT, []),
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Loading state - show skeletons
  if (isLoading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <DestinationListCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (cities.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">No se encontraron destinos</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="-mx-4 overflow-auto"
      style={{
        // Use viewport height minus navbar/search/filters
        height: 'calc(100vh - 180px)',
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const city = cities[virtualRow.index];
          const isPriority = virtualRow.index < 5; // First 5 get priority

          return (
            <div
              key={city.city_name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <DestinationListCard city={city} priority={isPriority} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
