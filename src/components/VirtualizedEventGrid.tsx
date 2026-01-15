import { memo, useRef, useEffect, useState, useCallback } from "react";
import EventCard from "./EventCard";

interface VirtualizedEventGridProps {
  events: any[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const INITIAL_VISIBLE = 12;
const CHUNK_SIZE = 12;

const VirtualizedEventGrid = memo(({
  events,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: VirtualizedEventGridProps) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const eventsLengthRef = useRef(events.length);
  
  // Stable callback refs to avoid re-creating observer
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Reset visible count only when events array actually changes
  useEffect(() => {
    if (eventsLengthRef.current !== events.length) {
      eventsLengthRef.current = events.length;
      // Only reset if filter changed (length decreased or dramatically changed)
      if (events.length < visibleCount) {
        setVisibleCount(INITIAL_VISIBLE);
      }
    }
  }, [events.length, visibleCount]);

  // Single stable IntersectionObserver
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => {
            const eventsLen = eventsLengthRef.current;
            if (prev < eventsLen) {
              return Math.min(prev + CHUNK_SIZE, eventsLen);
            }
            // Trigger server fetch if needed
            if (hasMore && !isLoadingMore) {
              onLoadMoreRef.current?.();
            }
            return prev;
          });
        }
      },
      { rootMargin: "300px", threshold: 0 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-muted-foreground mb-4">No se encontraron conciertos</p>
        <p className="text-muted-foreground">Prueba ajustando los filtros o la búsqueda</p>
      </div>
    );
  }

  const visibleEvents = events.slice(0, visibleCount);
  const hasMoreToShow = visibleCount < events.length || hasMore;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleEvents.map((event, index) => (
          <EventCard key={event.id} event={event} priority={index < 4} />
        ))}
      </div>

      {/* Load more trigger */}
      {hasMoreToShow && (
        <div ref={loadMoreRef} className="flex justify-center items-center py-12">
          {isLoadingMore ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-['Poppins']">
                Cargando más conciertos...
              </p>
            </div>
          ) : (
            <div className="h-12" /> // Invisible trigger zone
          )}
        </div>
      )}

      {/* Total count indicator */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Mostrando {visibleEvents.length} de {events.length} conciertos
      </p>
    </div>
  );
});

VirtualizedEventGrid.displayName = "VirtualizedEventGrid";

export default VirtualizedEventGrid;
