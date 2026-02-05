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

  // Inject contextual links into #seo-fallback on mount
  // Uses a 500ms delay to let the pre-React script inject global links first
  // Then APPENDS context-specific links without overwriting the global ones
  useLayoutEffect(() => {
    const seoFallback = document.getElementById('seo-fallback');
    if (!seoFallback) return;

    let isCancelled = false;

    // Delay to let the inline script populate global links first
    const fetchTimeoutId = setTimeout(async () => {
      if (isCancelled) return;

      // Find or create the event links container
      let linksContainer = document.getElementById('seo-fallback-event-links');
      if (!linksContainer) {
        linksContainer = document.createElement('ul');
        linksContainer.id = 'seo-fallback-event-links';
        linksContainer.setAttribute('aria-label', 'Próximos eventos');
        seoFallback.appendChild(linksContainer);
      }

      try {
        let events: SeoEvent[] = [];
        const today = new Date().toISOString();

        // Only fetch contextual events for specific page types
        // Home and listing pages already have global links from the pre-React script
        if (pageContext.type === 'city' && pageContext.slug) {
          const { data } = await supabase
            .from('mv_concerts_cards')
            .select('slug, name, artist_name')
            .ilike('venue_city_slug', pageContext.slug)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(15);
          events = (data || []) as SeoEvent[];
        } else if (pageContext.type === 'genre' && pageContext.slug) {
          const { data } = await supabase
            .from('mv_concerts_cards')
            .select('slug, name, artist_name')
            .ilike('genre_slug', pageContext.slug)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(15);
          events = (data || []) as SeoEvent[];
        } else if (pageContext.type === 'festivals') {
          const { data } = await supabase
            .from('mv_festivals_cards')
            .select('slug, name, main_attraction')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(15);
          events = (data || []).map(f => ({
            slug: f.slug,
            name: f.name,
            artist_name: f.main_attraction
          })) as SeoEvent[];
        }
        // Skip for 'home', 'listing', and 'event' - these get global links from pre-React script

        if (events.length === 0) return;

        // Get existing slugs to avoid duplicates
        const existingSlugs = new Set(
          Array.from(linksContainer.querySelectorAll('a'))
            .map(a => {
              const href = a.getAttribute('href') || '';
              const match = href.match(/\/conciertos\/([^/]+)$/) || href.match(/\/festivales\/([^/]+)$/);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        );

        // Append only non-duplicate events
        const isFestival = pageContext.type === 'festivals';
        events.forEach(event => {
          if (!event.slug || existingSlugs.has(event.slug)) return;
          
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `/${isFestival ? 'festivales' : 'conciertos'}/${event.slug}`;
          a.textContent = `Entradas ${event.artist_name || event.name}`;
          li.appendChild(a);
          linksContainer!.appendChild(li);
          existingSlugs.add(event.slug); // Track to avoid future duplicates
        });

      } catch (error) {
        console.error('[SeoFallbackLinks] Error fetching contextual events:', error);
      }
    }, 500); // 500ms delay to let pre-React script execute first

    // Cleanup on unmount - don't clear links, they might be from the global script
    return () => {
      isCancelled = true;
      clearTimeout(fetchTimeoutId);
    };
  }, [pageContext]);

  // This component renders nothing visible
  return null;
};

export default SeoFallbackLinks;
