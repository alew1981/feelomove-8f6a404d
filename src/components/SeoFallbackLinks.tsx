import { useLayoutEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * SeoFallbackLinks - Injects dynamic event links into #seo-fallback for crawler discovery
 * 
 * CRITICAL SEO: This solves the "orphan pages" problem by ensuring crawlers see
 * links to individual events even before React hydrates.
 * 
 * This component fetches top events and injects them into the #seo-fallback div
 * using useLayoutEffect to ensure they're visible to crawlers.
 */

// Top cities for SEO hub links
const TOP_CITIES = [
  { name: 'Madrid', slug: 'madrid' },
  { name: 'Barcelona', slug: 'barcelona' },
  { name: 'Valencia', slug: 'valencia' },
  { name: 'Sevilla', slug: 'sevilla' },
  { name: 'Bilbao', slug: 'bilbao' },
];

// Top genres for SEO hub links
const TOP_GENRES = [
  { name: 'Rock', slug: 'rock' },
  { name: 'Pop', slug: 'pop' },
  { name: 'Electrónica', slug: 'electronica' },
  { name: 'Latino', slug: 'latino' },
  { name: 'Hip-Hop', slug: 'hip-hop' },
];

interface SeoEvent {
  slug: string;
  name: string;
  artist_name?: string;
}

export const SeoFallbackLinks = () => {
  const location = useLocation();
  
  // Determine page context for targeted link injection
  const pageContext = useMemo(() => {
    const path = location.pathname;
    
    if (path.startsWith('/destinos/')) {
      const citySlug = path.split('/')[2];
      return { type: 'city' as const, slug: citySlug };
    }
    if (path.startsWith('/conciertos/') && path.split('/').length === 3) {
      // Could be artist or event page - inject related links
      return { type: 'event' as const, slug: path.split('/')[2] };
    }
    if (path.startsWith('/musica/')) {
      const genreSlug = path.split('/')[2];
      return { type: 'genre' as const, slug: genreSlug };
    }
    if (path === '/conciertos' || path === '/conciertos/') {
      return { type: 'listing' as const, slug: null };
    }
    if (path === '/festivales' || path === '/festivales/') {
      return { type: 'festivals' as const, slug: null };
    }
    
    return { type: 'home' as const, slug: null };
  }, [location.pathname]);

  // Inject links into #seo-fallback on mount
  useLayoutEffect(() => {
    const seoFallback = document.getElementById('seo-fallback');
    if (!seoFallback) return;

    // Find or create the event links container
    let linksContainer = document.getElementById('seo-fallback-event-links');
    if (!linksContainer) {
      linksContainer = document.createElement('ul');
      linksContainer.id = 'seo-fallback-event-links';
      linksContainer.setAttribute('aria-label', 'Próximos eventos');
      seoFallback.appendChild(linksContainer);
    }

    // Fetch events based on context
    const fetchAndInjectEvents = async () => {
      try {
        let events: SeoEvent[] = [];
        const today = new Date().toISOString();

        if (pageContext.type === 'city' && pageContext.slug) {
          // Fetch events for this city
          const { data } = await supabase
            .from('mv_concerts_cards')
            .select('slug, name, artist_name')
            .ilike('venue_city_slug', pageContext.slug)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(20);
          events = (data || []) as SeoEvent[];
        } else if (pageContext.type === 'genre' && pageContext.slug) {
          // Fetch events for this genre
          const { data } = await supabase
            .from('mv_concerts_cards')
            .select('slug, name, artist_name')
            .ilike('genre_slug', pageContext.slug)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(20);
          events = (data || []) as SeoEvent[];
        } else if (pageContext.type === 'listing' || pageContext.type === 'home') {
          // Fetch top upcoming events
          const { data } = await supabase
            .from('mv_concerts_cards')
            .select('slug, name, artist_name')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(20);
          events = (data || []) as SeoEvent[];
        } else if (pageContext.type === 'festivals') {
          // Fetch top upcoming festivals
          const { data } = await supabase
            .from('mv_festivals_cards')
            .select('slug, name, main_attraction')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(20);
          events = (data || []).map(f => ({
            slug: f.slug,
            name: f.name,
            artist_name: f.main_attraction
          })) as SeoEvent[];
        }

        // Clear previous links
        if (linksContainer) {
          linksContainer.innerHTML = '';
          
          // Add event links
          events.forEach(event => {
            if (!event.slug) return;
            const li = document.createElement('li');
            const a = document.createElement('a');
            const isFestival = pageContext.type === 'festivals';
            a.href = `/${isFestival ? 'festivales' : 'conciertos'}/${event.slug}`;
            a.textContent = `Entradas ${event.artist_name || event.name}`;
            li.appendChild(a);
            linksContainer.appendChild(li);
          });
        }
      } catch (error) {
        console.error('[SeoFallbackLinks] Error fetching events:', error);
      }
    };

    fetchAndInjectEvents();

    // Cleanup on unmount
    return () => {
      if (linksContainer) {
        linksContainer.innerHTML = '';
      }
    };
  }, [pageContext]);

  // This component renders nothing visible
  return null;
};

export default SeoFallbackLinks;
