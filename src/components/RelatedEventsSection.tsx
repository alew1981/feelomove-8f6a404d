import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

interface RelatedEvent {
  id: string;
  slug: string;
  name: string;
  artist_name?: string;
  event_date: string;
  venue_city: string;
  is_festival?: boolean;
}

interface RelatedEventsSectionProps {
  currentEventId?: string;
  currentArtist?: string;
  currentCity?: string;
  currentGenre?: string;
  maxItems?: number;
}

// Native date formatting
const SPANISH_MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getDate()} ${SPANISH_MONTHS_SHORT[date.getMonth()]}`;
};

/**
 * Related Events Section - "También te puede interesar"
 * Pill/Chip format matching "Ver en otros destinos" for performance
 * No images - just text pills with hover effects
 * 
 * CRITICAL SEO: Links render immediately in DOM for crawler discovery.
 * The <a> tags exist even during loading state to ensure indexability.
 */
export const RelatedEventsSection = ({
  currentEventId,
  currentArtist,
  currentCity,
  currentGenre,
  maxItems = 8
}: RelatedEventsSectionProps) => {
  const [events, setEvents] = useState<RelatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedEvents = async () => {
      setIsLoading(true);
      
      try {
        const today = new Date().toISOString();
        let relatedEvents: RelatedEvent[] = [];
        
        // 1. Same artist events (if artist provided)
        if (currentArtist && relatedEvents.length < maxItems) {
          const { data: artistEvents } = await supabase
            .from('mv_concerts_cards')
            .select('id, slug, name, artist_name, event_date, venue_city')
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
            .select('id, slug, name, artist_name, event_date, venue_city')
            .eq('venue_city', currentCity)
            .gte('event_date', today)
            .neq('id', currentEventId || '')
            .order('event_date', { ascending: true })
            .limit(remaining + 5);
          
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
            .select('id, slug, name, main_attraction, event_date, venue_city')
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

  // SEO: Show skeleton with crawlable placeholder links during loading
  if (isLoading) {
    return (
      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <IconTicket className="h-5 w-5 text-accent" />
            También te puede interesar
          </h3>
        </div>
        {/* SEO: Crawlable placeholder links visible in DOM */}
        <nav aria-label="Eventos relacionados" className="flex gap-2 flex-wrap">
          <a href="/conciertos" className="h-10 w-32 rounded-full bg-muted animate-pulse inline-flex items-center justify-center text-transparent">Conciertos</a>
          <a href="/festivales" className="h-10 w-28 rounded-full bg-muted animate-pulse inline-flex items-center justify-center text-transparent">Festivales</a>
          <a href="/destinos/madrid" className="h-10 w-36 rounded-full bg-muted animate-pulse inline-flex items-center justify-center text-transparent">Madrid</a>
          <a href="/destinos/barcelona" className="h-10 w-36 rounded-full bg-muted animate-pulse inline-flex items-center justify-center text-transparent">Barcelona</a>
        </nav>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
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

      {/* Horizontal Pill Layout with Scroll on Mobile - Same as "Ver en otros destinos" */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
        {events.map((event) => {
          // CRITICAL SEO: Use plural routes as canonical (/conciertos/, /festivales/)
          const eventUrl = event.is_festival 
            ? `/festivales/${event.slug}` 
            : `/conciertos/${event.slug}`;
          const displayName = event.artist_name || event.name.split(' - ')[0] || event.name;
          
          return (
            <Link
              key={event.id}
              to={eventUrl}
              className={cn(
                "group inline-flex items-center gap-2 px-4 py-2.5",
                "bg-card border-2 border-foreground rounded-full",
                "whitespace-nowrap flex-shrink-0",
                "transition-all duration-200 ease-out",
                "hover:bg-[#00FF8F] hover:-translate-y-1"
              )}
            >
              <span className="font-semibold text-sm text-foreground group-hover:text-black transition-colors duration-200">
                {displayName}
              </span>
              <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full group-hover:bg-black group-hover:text-[#00FF8F] transition-colors duration-200">
                {formatShortDate(event.event_date)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedEventsSection;
