import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RelatedEventCard, RelatedEvent } from './RelatedEventCard';
import { cn } from '@/lib/utils';

// Inline SVG icons
const IconTicket = ({ className = "" }: { className?: string }) => (
  <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
  </svg>
);

const IconChevronRight = ({ className = "" }: { className?: string }) => (
  <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

interface RelatedEventsSectionProps {
  currentEventId?: string;
  currentArtist?: string;
  currentCity?: string;
  currentGenre?: string;
  maxItems?: number;
}

/**
 * Related Events Section - "También te puede interesar"
 * Displays related events using the new card design with images
 */
export const RelatedEventsSection = ({
  currentEventId,
  currentArtist,
  currentCity,
  currentGenre,
  maxItems = 4
}: RelatedEventsSectionProps) => {
  const [events, setEvents] = useState<RelatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedEvents = async () => {
      setIsLoading(true);
      
      try {
        // Strategy: Fetch events by same artist, then by same city, then by same genre
        const today = new Date().toISOString();
        let relatedEvents: RelatedEvent[] = [];
        
        // 1. Same artist events (if artist provided)
        if (currentArtist && relatedEvents.length < maxItems) {
          const { data: artistEvents } = await supabase
            .from('mv_concerts_cards')
            .select('id, slug, name, artist_name, event_date, venue_city, venue_name, image_standard_url')
            .ilike('artist_name', `%${currentArtist}%`)
            .gte('event_date', today)
            .neq('id', currentEventId || '')
            .order('event_date', { ascending: true })
            .limit(maxItems);
          
          if (artistEvents) {
            relatedEvents.push(...artistEvents.map(e => ({
              id: e.id,
              slug: e.slug || e.id,
              name: e.name,
              artist_name: e.artist_name,
              event_date: e.event_date,
              venue_city: e.venue_city,
              venue_name: e.venue_name,
              image_url: e.image_standard_url,
              is_festival: false
            })));
          }
        }
        
        // 2. Same city events (if we need more)
        if (currentCity && relatedEvents.length < maxItems) {
          const remaining = maxItems - relatedEvents.length;
          const existingIds = relatedEvents.map(e => e.id);
          
          const { data: cityEvents } = await supabase
            .from('mv_concerts_cards')
            .select('id, slug, name, artist_name, event_date, venue_city, venue_name, image_standard_url')
            .eq('venue_city', currentCity)
            .gte('event_date', today)
            .neq('id', currentEventId || '')
            .order('event_date', { ascending: true })
            .limit(remaining + 5); // Fetch extra to filter
          
          if (cityEvents) {
            const newEvents = cityEvents
              .filter(e => !existingIds.includes(e.id))
              .slice(0, remaining)
              .map(e => ({
                id: e.id,
                slug: e.slug || e.id,
                name: e.name,
                artist_name: e.artist_name,
                event_date: e.event_date,
                venue_city: e.venue_city,
                venue_name: e.venue_name,
                image_url: e.image_standard_url,
                is_festival: false
              }));
            relatedEvents.push(...newEvents);
          }
        }
        
        // 3. Add festivals if still need more
        if (relatedEvents.length < maxItems) {
          const remaining = maxItems - relatedEvents.length;
          const existingIds = relatedEvents.map(e => e.id);
          
          const { data: festivals } = await supabase
            .from('mv_festivals_cards')
            .select('id, slug, name, main_attraction, event_date, venue_city, venue_name, image_standard_url')
            .gte('event_date', today)
            .neq('id', currentEventId || '')
            .order('event_date', { ascending: true })
            .limit(remaining + 5);
          
          if (festivals) {
            const newEvents = festivals
              .filter(e => !existingIds.includes(e.id))
              .slice(0, remaining)
              .map(e => ({
                id: e.id,
                slug: e.slug || e.id,
                name: e.name,
                artist_name: e.main_attraction,
                event_date: e.event_date,
                venue_city: e.venue_city,
                venue_name: e.venue_name,
                image_url: e.image_standard_url,
                is_festival: true
              }));
            relatedEvents.push(...newEvents);
          }
        }
        
        setEvents(relatedEvents.slice(0, maxItems));
      } catch (error) {
        console.error('Error fetching related events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedEvents();
  }, [currentEventId, currentArtist, currentCity, currentGenre, maxItems]);

  if (isLoading) {
    return (
      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <IconTicket className="h-5 w-5 text-accent" />
          También te puede interesar
        </h3>
        <Link 
          to="/conciertos" 
          className="flex items-center gap-1 text-accent hover:text-accent/80 font-semibold transition-colors text-sm"
        >
          Ver todos <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {events.map((event) => (
          <RelatedEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default RelatedEventsSection;
