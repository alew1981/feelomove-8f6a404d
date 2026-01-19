import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Music, Users, Ticket, ChevronRight } from 'lucide-react';

interface RelatedLink {
  type: string;
  label: string;
  url: string;
  slug: string;
  event_count?: number;
  image?: string;
}

interface CityWithDeeplink {
  id: number;
  ticketmaster_city: string;
  place_id: string;
  imagen_ciudad: string | null;
  nuitee_deeplink: string;
}

// Helper to build Nuitee deeplink with dynamic dates
const buildNuiteeDeeplink = (placeId: string): string => {
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 7);
  const checkout = new Date();
  checkout.setDate(checkout.getDate() + 8);
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  return `https://feelomove.nuitee.link/hotels?placeId=${placeId}&checkin=${formatDate(checkin)}&checkout=${formatDate(checkout)}&language=es&currency=EUR`;
};

interface RelatedLinksData {
  cities?: RelatedLink[];
  genres?: RelatedLink[];
  top_artists?: RelatedLink[];
  top_cities?: RelatedLink[];
}

interface RelatedLinksProps {
  slug: string;
  type: 'event' | 'artist' | 'city' | 'genre';
  currentCity?: string;
  currentGenre?: string;
}

// Semantic genre relationships for better link juice
const GENRE_RELATIONSHIPS: Record<string, string[]> = {
  'rock': ['metal', 'indie', 'alternative', 'punk', 'hard-rock'],
  'metal': ['rock', 'hard-rock', 'alternative', 'punk', 'hardcore'],
  'pop': ['dance', 'electro-pop', 'indie-pop', 'r-b', 'latin'],
  'indie': ['alternative', 'rock', 'folk', 'indie-pop', 'shoegaze'],
  'hip-hop': ['rap', 'r-b', 'trap', 'urban', 'reggaeton'],
  'electronica': ['techno', 'house', 'dance', 'trance', 'edm'],
  'jazz': ['blues', 'soul', 'funk', 'swing', 'latin-jazz'],
  'reggaeton': ['latin', 'urban', 'hip-hop', 'trap', 'dancehall'],
  'flamenco': ['latin', 'world', 'fusion', 'spanish-guitar', 'folk'],
  'classical': ['opera', 'orchestra', 'chamber', 'baroque', 'contemporary-classical'],
};

// Geographic proximity for Spanish cities
const CITY_PROXIMITY: Record<string, string[]> = {
  'madrid': ['toledo', 'segovia', 'guadalajara', 'avila', 'barcelona', 'valencia'],
  'barcelona': ['tarragona', 'girona', 'lleida', 'madrid', 'valencia', 'zaragoza'],
  'valencia': ['castellon', 'alicante', 'murcia', 'barcelona', 'madrid', 'albacete'],
  'sevilla': ['cadiz', 'malaga', 'cordoba', 'huelva', 'granada', 'jerez'],
  'bilbao': ['san-sebastian', 'vitoria', 'santander', 'pamplona', 'logrono', 'burgos'],
  'malaga': ['marbella', 'granada', 'sevilla', 'cordoba', 'almeria', 'cadiz'],
  'zaragoza': ['huesca', 'teruel', 'pamplona', 'logrono', 'barcelona', 'madrid'],
  'alicante': ['elche', 'murcia', 'valencia', 'albacete', 'cartagena', 'benidorm'],
  'granada': ['malaga', 'almeria', 'jaen', 'sevilla', 'cordoba', 'murcia'],
  'murcia': ['cartagena', 'alicante', 'almeria', 'albacete', 'valencia', 'granada'],
};

export const RelatedLinks = ({ slug, type, currentCity, currentGenre }: RelatedLinksProps) => {
  const [links, setLinks] = useState<RelatedLink[] | RelatedLinksData | null>(null);
  const [fallbackDestinations, setFallbackDestinations] = useState<RelatedLink[]>([]);
  const [fallbackGenres, setFallbackGenres] = useState<RelatedLink[]>([]);
  const [relatedGenres, setRelatedGenres] = useState<RelatedLink[]>([]);
  const [nearbyDestinations, setNearbyDestinations] = useState<RelatedLink[]>([]);
  const [citiesWithDeeplinks, setCitiesWithDeeplinks] = useState<CityWithDeeplink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize slug for comparison and URL generation
  const normalizeSlug = (s: string) => 
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\/\\]/g, '-')  // Replace slashes with hyphens
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')      // Collapse multiple hyphens
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens

  // Fetch primary related links with graceful error handling for MV
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('mv_internal_links')
          .select('related_links')
          .eq('source_type', type)
          .eq('source_slug', slug)
          .maybeSingle(); // Use maybeSingle to handle 406 errors gracefully

        // Gracefully handle MV errors (406, 500) - these can happen during refresh
        if (error) {
          console.warn('mv_internal_links unavailable (MV may be refreshing):', error.message);
          // Continue with fallback data instead of throwing
        } else if (data?.related_links) {
          setLinks(data.related_links as RelatedLink[] | RelatedLinksData);
        }
      } catch (error) {
        // Catch any unexpected errors silently - fallback links will be used
        console.warn('Error fetching related links, using fallback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchLinks();
    }
  }, [slug, type]);

  // Fetch fallback destinations (top 6 by event count)
  useEffect(() => {
    const fetchFallbackDestinations = async () => {
      try {
        const { data } = await supabase
          .from('mv_destinations_cards')
          .select('city_name, city_slug, event_count')
          .order('event_count', { ascending: false })
          .limit(8);

        if (data) {
          const currentSlug = normalizeSlug(slug);
          setFallbackDestinations(
            data
              .filter(d => normalizeSlug(d.city_slug || '') !== currentSlug)
              .slice(0, 6)
              .map(d => ({
                type: 'city',
                label: `Conciertos en ${d.city_name}`,
                url: `/destinos/${d.city_slug}`,
                slug: d.city_slug || '',
                event_count: d.event_count || 0
              }))
          );
        }
      } catch (error) {
        console.error('Error fetching fallback destinations:', error);
      }
    };

    if (type === 'city' || type === 'genre') {
      fetchFallbackDestinations();
    }
  }, [type, slug]);

  // Fetch fallback genres (top 6 by event count) WITH images
  useEffect(() => {
    const fetchFallbackGenres = async () => {
      try {
        const { data } = await supabase
          .from('mv_genres_cards')
          .select('genre_name, event_count, image_genres')
          .order('event_count', { ascending: false })
          .limit(8);

        if (data) {
          const currentSlug = normalizeSlug(slug);
          setFallbackGenres(
            data
              .filter(g => normalizeSlug(g.genre_name || '') !== currentSlug)
              .slice(0, 6)
              .map(g => {
                const genreSlug = normalizeSlug(g.genre_name || '');
                return {
                  type: 'genre',
                  label: `Explorar música ${g.genre_name}`,
                  url: `/generos/${genreSlug}`,
                  slug: genreSlug,
                  event_count: g.event_count || 0,
                  image: g.image_genres || undefined
                };
              })
          );
        }
      } catch (error) {
        console.error('Error fetching fallback genres:', error);
      }
    };

    if (type === 'genre' || type === 'artist') {
      fetchFallbackGenres();
    }
  }, [type, slug]);

  // Fetch cities with Nuitee deeplinks for artist pages
  useEffect(() => {
    const fetchCitiesWithDeeplinks = async () => {
      if (type !== 'artist') return;

      try {
        const { data, error } = await supabase
          .from('lite_tbl_city_mapping')
          .select('id, ticketmaster_city, place_id, imagen_ciudad')
          .not('place_id', 'is', null)
          .limit(6);

        if (error) {
          console.error('Error fetching cities:', error);
          return;
        }

        if (data) {
          const citiesWithLinks = data.map(city => ({
            id: city.id,
            ticketmaster_city: city.ticketmaster_city,
            place_id: city.place_id!,
            imagen_ciudad: city.imagen_ciudad,
            nuitee_deeplink: buildNuiteeDeeplink(city.place_id!)
          }));
          setCitiesWithDeeplinks(citiesWithLinks);
        }
      } catch (error) {
        console.error('Error fetching cities with deeplinks:', error);
      }
    };

    fetchCitiesWithDeeplinks();
  }, [type]);

  // Fetch semantically related genres
  useEffect(() => {
    const fetchRelatedGenres = async () => {
      if (type !== 'genre') return;

      const normalizedSlug = normalizeSlug(slug);
      const relatedSlugs = GENRE_RELATIONSHIPS[normalizedSlug] || [];

      if (relatedSlugs.length === 0) return;

      try {
        const { data } = await supabase
          .from('mv_genres_cards')
          .select('genre_name, event_count');

        if (data) {
          const matches = data.filter(g => {
            const gSlug = normalizeSlug(g.genre_name || '');
            return relatedSlugs.some(rs => gSlug.includes(rs) || rs.includes(gSlug));
          });

          setRelatedGenres(
            matches.slice(0, 4).map(g => {
              const genreSlug = normalizeSlug(g.genre_name || '');
              return {
                type: 'genre',
                label: `Explorar música ${g.genre_name}`,
                url: `/generos/${genreSlug}`,
                slug: genreSlug,
                event_count: g.event_count || 0
              };
            })
          );
        }
      } catch (error) {
        console.error('Error fetching related genres:', error);
      }
    };

    fetchRelatedGenres();
  }, [type, slug]);

  // Fetch nearby destinations
  useEffect(() => {
    const fetchNearbyDestinations = async () => {
      if (type !== 'city') return;

      const normalizedSlug = normalizeSlug(slug);
      const nearbySlugs = CITY_PROXIMITY[normalizedSlug] || [];

      try {
        const { data } = await supabase
          .from('mv_destinations_cards')
          .select('city_name, city_slug, event_count')
          .order('event_count', { ascending: false });

        if (data) {
          // First try to get nearby cities from our proximity map
          let matches = data.filter(d => {
            const dSlug = normalizeSlug(d.city_slug || '');
            return nearbySlugs.some(ns => dSlug === ns || dSlug.includes(ns));
          });

          // If not enough nearby cities, add popular ones
          if (matches.length < 4) {
            const additionalCities = data
              .filter(d => {
                const dSlug = normalizeSlug(d.city_slug || '');
                return dSlug !== normalizedSlug && !matches.some(m => m.city_slug === d.city_slug);
              })
              .slice(0, 4 - matches.length);
            matches = [...matches, ...additionalCities];
          }

          setNearbyDestinations(
            matches.slice(0, 4).map(d => ({
              type: 'city',
              label: `Conciertos en ${d.city_name}`,
              url: `/destinos/${d.city_slug}`,
              slug: d.city_slug || '',
              event_count: d.event_count || 0
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching nearby destinations:', error);
      }
    };

    fetchNearbyDestinations();
  }, [type, slug]);

  // Compute context-aware links
  const contextLinks = useMemo(() => {
    const currentSlug = normalizeSlug(slug);

    if (type === 'city') {
      // For destinations: show nearby/popular destinations
      const destinationLinks = nearbyDestinations.length > 0 
        ? nearbyDestinations 
        : fallbackDestinations.filter(d => normalizeSlug(d.slug) !== currentSlug).slice(0, 4);
      
      return {
        destinations: destinationLinks,
        showDestinations: true
      };
    }

    if (type === 'genre') {
      // For genres: show semantically related genres
      const genreLinks = relatedGenres.length > 0 
        ? relatedGenres 
        : fallbackGenres.filter(g => normalizeSlug(g.slug) !== currentSlug).slice(0, 4);
      
      return {
        genres: genreLinks,
        showGenres: true
      };
    }

    if (type === 'artist') {
      // For artists: ONLY show genres (destinations already shown in "Destinos de X" section)
      return {
        genres: fallbackGenres.slice(0, 4),
        showGenres: true,
        showDestinations: false // Avoid redundancy with "Destinos de X"
      };
    }

    return {};
  }, [type, slug, nearbyDestinations, fallbackDestinations, relatedGenres, fallbackGenres]);

  if (isLoading) return null;

  const getIcon = (linkType: string) => {
    switch (linkType) {
      case 'city':
        return <MapPin className="h-3.5 w-3.5" />;
      case 'artist':
        return <Users className="h-3.5 w-3.5" />;
      case 'genre':
        return <Music className="h-3.5 w-3.5" />;
      default:
        return <Ticket className="h-3.5 w-3.5" />;
    }
  };

  const renderLinkSection = (title: string, linkArray: RelatedLink[] | null | undefined, titleAttr: string) => {
    if (!linkArray || linkArray.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {linkArray.slice(0, 8).map((link, index) => (
            <a
              key={`${link.slug}-${index}`}
              href={link.url}
              title={`${titleAttr} ${link.label.replace(/^(Conciertos en |Explorar música )/, '')} - FEELOMOVE+`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
            >
              {getIcon(link.type)}
              {link.label}
              {link.event_count && link.event_count > 0 && (
                <span className="text-xs text-muted-foreground ml-1">({link.event_count})</span>
              )}
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Check if we have any links to show
  const hasContextLinks = 
    (contextLinks.showDestinations && contextLinks.destinations && contextLinks.destinations.length > 0) ||
    (contextLinks.showGenres && contextLinks.genres && contextLinks.genres.length > 0);

  const hasOriginalLinks = links && (
    (Array.isArray(links) && links.length > 0) ||
    (!Array.isArray(links) && (
      (links.cities && links.cities.length > 0) ||
      (links.genres && links.genres.length > 0) ||
      (links.top_artists && links.top_artists.length > 0) ||
      (links.top_cities && links.top_cities.length > 0)
    ))
  );

  if (!hasContextLinks && !hasOriginalLinks) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        🔗 También te puede interesar
      </h3>

      {/* Context-aware links for destinations */}
      {type === 'city' && contextLinks.showDestinations && (
        renderLinkSection('Otros destinos populares', contextLinks.destinations, 'Ver conciertos en')
      )}

      {/* Context-aware links for genres */}
      {type === 'genre' && contextLinks.showGenres && (
        renderLinkSection('Géneros relacionados', contextLinks.genres, 'Explorar')
      )}

      {/* Context-aware links for artists - Genres with visual cards and real images */}
      {type === 'artist' && contextLinks.showGenres && contextLinks.genres && contextLinks.genres.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-foreground mb-4">Géneros musicales</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contextLinks.genres.slice(0, 4).map((genre, index) => (
              <Link
                key={genre.slug}
                to={genre.url}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {genre.image ? (
                  <img 
                    src={genre.image} 
                    alt={genre.label.replace('Explorar música ', '')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                    <Music className="w-12 h-12 text-accent/50 group-hover:text-accent transition-colors" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-white text-base line-clamp-2">
                    {genre.label.replace('Explorar música ', '')}
                  </h3>
                  {genre.event_count && genre.event_count > 0 && (
                    <span className="text-xs text-white/70">{genre.event_count} eventos</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hotels by destination section for artists - External Nuitee deeplinks */}
      {type === 'artist' && citiesWithDeeplinks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-foreground mb-4">🏨 Hoteles en destinos con eventos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {citiesWithDeeplinks.map((city) => (
              <a
                key={city.id}
                href={city.nuitee_deeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
              >
                {city.imagen_ciudad ? (
                  <img 
                    src={city.imagen_ciudad} 
                    alt={`Hoteles en ${city.ticketmaster_city}`}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-foreground text-sm truncate">
                    {city.ticketmaster_city}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Ver hoteles disponibles
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Reserva alojamiento cerca de los conciertos • Los enlaces abren en nueva pestaña
          </p>
        </div>
      )}

      {/* Original links from mv_internal_links as fallback/supplement */}
      {type === 'event' && Array.isArray(links) && links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link: RelatedLink, index: number) => (
            <a
              key={`${link.slug}-${index}`}
              href={link.url}
              title={`${link.label} - FEELOMOVE+`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
            >
              {getIcon(link.type)}
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Additional artist links from database - Skip cities (already shown in Destinos section) */}

      {/* Additional city links from database */}
      {type === 'city' && !Array.isArray(links) && links && (
        <>
          {links.genres && links.genres.length > 0 && 
            renderLinkSection('Géneros disponibles', links.genres, 'Explorar')}
          {links.top_artists && links.top_artists.length > 0 && 
            renderLinkSection('Artistas destacados', links.top_artists, 'Ver conciertos de')}
        </>
      )}

      {/* Additional genre links from database */}
      {type === 'genre' && !Array.isArray(links) && links && (
        <>
          {links.top_artists && links.top_artists.length > 0 && 
            renderLinkSection('Artistas destacados', links.top_artists, 'Ver conciertos de')}
          {links.top_cities && links.top_cities.length > 0 && 
            renderLinkSection('Ciudades con eventos', links.top_cities, 'Ver conciertos en')}
        </>
      )}
    </div>
  );
};
