import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Inline SVG icons to reduce bundle size (no lucide-react import)
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconMusic = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const IconUsers = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconTicket = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
  </svg>
);
const IconChevronRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

// Alias for compatibility with existing code
const MapPin = IconMapPin;
const Music = IconMusic;
const Users = IconUsers;
const Ticket = IconTicket;
const ChevronRight = IconChevronRight;

interface RelatedLink {
  type: string;
  label: string;
  url: string;
  slug: string;
  event_count?: number;
  image?: string;
}

interface DestinationWithHotels {
  city_name: string;
  city_slug: string;
  hotels_count: number | null;
  imagen_ciudad: string | null;
  sample_image_url?: string | null;
  place_id: string | null;
}

// Helper function to generate Nuitee deeplink with dynamic dates
const generateNuiteeDeeplink = (placeId: string): string => {
  const today = new Date();
  const checkin = new Date(today);
  checkin.setDate(today.getDate() + 7);
  const checkout = new Date(checkin);
  checkout.setDate(checkin.getDate() + 1);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
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
  const [artistDestinationsWithHotels, setArtistDestinationsWithHotels] = useState<DestinationWithHotels[]>([]);
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

          // For genres where mv_genres_cards has no image (e.g. "Latino"), fallback to known storage assets.
          const imageFallbackByGenreName: Record<string, string> = {
            latino:
              'https://wcyjuytpxxqailtixept.supabase.co/storage/v1/object/sign/Generos/world.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wZDZlYWM3Mi05NWIwLTQ2MDItYTZiNC01NWRmY2U1YmUyMWIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJHZW5lcm9zL3dvcmxkLmpwZyIsImlhdCI6MTc2NTg4NjQwOCwiZXhwIjoxNzk3NDIyNDA4fQ.d_WNdfAS3PGVb59oyezVR7-QZMm2hQBnAY1HM9nuR2k'
          };

          setFallbackGenres(
            data
              .filter(g => normalizeSlug(g.genre_name || '') !== currentSlug)
              .slice(0, 6)
              .map(g => {
                const genreName = g.genre_name || '';
                const genreSlug = normalizeSlug(genreName);
                const normalizedName = normalizeSlug(genreName);

                return {
                  type: 'genre',
                  label: `Explorar música ${genreName}`,
                  url: `/generos/${genreSlug}`,
                  slug: genreSlug,
                  event_count: g.event_count || 0,
                  image: g.image_genres || imageFallbackByGenreName[normalizedName] || undefined
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

  // Fetch destinations with hotel counts for artist pages - ONLY cities where this artist performs
  useEffect(() => {
    const fetchArtistDestinationsWithHotels = async () => {
      if (type !== 'artist') return;

      try {
        // First get artist name from slug to find their events
        const artistSlug = slug;
        
        // Find all unique cities where this artist has events (check both concerts and festivals)
        const [concertsResult, festivalsResult] = await Promise.all([
          supabase
            .from('mv_concerts_cards')
            .select('venue_city, artist_name')
            .ilike('artist_name', `%${artistSlug.replace(/-/g, '%')}%`),
          supabase
            .from('mv_festivals_cards')
            .select('venue_city, main_attraction')
            .ilike('main_attraction', `%${artistSlug.replace(/-/g, '%')}%`)
        ]);

        // Combine unique cities from both sources
        const citiesSet = new Set<string>();
        concertsResult.data?.forEach(e => {
          if (e.venue_city) citiesSet.add(e.venue_city);
        });
        festivalsResult.data?.forEach(e => {
          if (e.venue_city) citiesSet.add(e.venue_city);
        });

        const artistCities = Array.from(citiesSet);
        
        if (artistCities.length === 0) return;

        // Fetch destination data for only these cities
        const destinationsResults = await Promise.all(
          artistCities.map(city =>
            supabase
              .from('mv_destinations_cards')
              .select('city_name, city_slug, hotels_count, sample_image_url')
              .eq('city_name', city)
              .maybeSingle()
          )
        );

        const validDestinations = destinationsResults
          .map(r => r.data)
          .filter((d): d is NonNullable<typeof d> => d !== null && (d.hotels_count || 0) > 0);

        if (validDestinations.length > 0) {
          // Fetch city mappings for images and place_id
          const mappingResults = await Promise.all(
            validDestinations.map((d) =>
              supabase
                .from('lite_tbl_city_mapping')
                .select('ticketmaster_city, place_id, imagen_ciudad')
                .eq('ticketmaster_city', d.city_name)
                .maybeSingle()
            )
          );

          const merged = validDestinations.map((dest, idx) => {
            const mapping = mappingResults[idx].data;
            return {
              city_name: dest.city_name,
              city_slug: dest.city_slug,
              hotels_count: dest.hotels_count,
              imagen_ciudad: mapping?.imagen_ciudad || null,
              sample_image_url: dest.sample_image_url || null,
              place_id: mapping?.place_id || null
            } as DestinationWithHotels;
          });

          setArtistDestinationsWithHotels(merged);
        }
      } catch (error) {
        console.error('Error fetching artist destinations with hotels:', error);
      }
    };

    fetchArtistDestinationsWithHotels();
  }, [type, slug]);

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

  // OPTIMIZED: Limit to 4 items max per section to reduce DOM nodes
  const MAX_ITEMS = 4;
  
  const renderLinkSection = (title: string, linkArray: RelatedLink[] | null | undefined, titleAttr: string) => {
    if (!linkArray || linkArray.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {linkArray.slice(0, MAX_ITEMS).map((link, index) => (
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
    <div className="mt-10 pt-8 border-t border-border" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
      <h3 className="text-xl font-bold text-foreground mb-6">
        También te puede interesar
      </h3>

      {/* Context-aware links for destinations - Visual cards like artist page */}
      {type === 'city' && contextLinks.showDestinations && contextLinks.destinations && contextLinks.destinations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-foreground">Otros destinos populares</h4>
            <Link 
              to="/destinos" 
              className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Desktop: Visual Cards Grid */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
            {contextLinks.destinations.slice(0, 4).map((dest) => (
              <Link
                key={dest.slug}
                to={dest.url}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-accent/50 group-hover:text-accent transition-colors" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h5 className="font-semibold text-white text-sm line-clamp-1">
                    {dest.label.replace('Conciertos en ', '')}
                  </h5>
                  {dest.event_count && dest.event_count > 0 && (
                    <span className="text-xs text-white/70">{dest.event_count} eventos</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {/* Mobile: Compact List View */}
          <div className="md:hidden bg-card border border-border rounded-xl divide-y divide-border">
            {contextLinks.destinations.slice(0, 6).map((dest) => (
              <Link
                key={dest.slug}
                to={dest.url}
                className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent transition-all">
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-accent/50" />
                    </div>
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {dest.label.replace('Conciertos en ', '')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-background bg-foreground px-3 py-1 rounded-full font-medium">
                    {dest.event_count || 0} evento{(dest.event_count || 0) === 1 ? '' : 's'}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Context-aware links for genres - Visual cards like artist page */}
      {type === 'genre' && contextLinks.showGenres && contextLinks.genres && contextLinks.genres.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-foreground">Géneros relacionados</h4>
            <Link 
              to="/musica" 
              className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contextLinks.genres.slice(0, 4).map((genre) => (
              <Link
                key={genre.slug}
                to={genre.url}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                {genre.image ? (
                  <img 
                    src={genre.image} 
                    alt={genre.label.replace('Explorar música ', '')}
                    width={300}
                    height={225}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                    <Music className="w-12 h-12 text-accent/50 group-hover:text-accent transition-colors" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h5 className="font-semibold text-white text-sm line-clamp-1">
                    {genre.label.replace('Explorar música ', '')}
                  </h5>
                  {genre.event_count && genre.event_count > 0 && (
                    <span className="text-xs text-white/70">{genre.event_count} eventos</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Context-aware links for artists - Genres with visual cards */}
      {type === 'artist' && contextLinks.showGenres && contextLinks.genres && contextLinks.genres.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-foreground">Géneros musicales</h4>
            <Link 
              to="/musica" 
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contextLinks.genres.slice(0, 4).map((genre) => (
              <Link
                key={genre.slug}
                to={genre.url}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                {genre.image ? (
                  <img 
                    src={genre.image} 
                    alt={genre.label.replace('Explorar música ', '')}
                    width={300}
                    height={225}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                    <Music className="w-12 h-12 text-accent/50 group-hover:text-accent transition-colors" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h5 className="font-semibold text-white text-sm line-clamp-1">
                    {genre.label.replace('Explorar música ', '')}
                  </h5>
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
      {type === 'artist' && artistDestinationsWithHotels.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-foreground">Hoteles en destinos con eventos</h4>
            <a 
              href="https://feelomove.nuitee.link/?language=es&currency=EUR" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Ver todos
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {artistDestinationsWithHotels.slice(0, 4).map((destination) => {
              const linkUrl = destination.place_id 
                ? generateNuiteeDeeplink(destination.place_id)
                : `/destinos/${destination.city_slug}`;
              const isExternal = !!destination.place_id;
              
              return isExternal ? (
                <a
                  key={destination.city_slug}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                >
                  {destination.imagen_ciudad || destination.sample_image_url ? (
                    <img 
                      src={(destination.imagen_ciudad || destination.sample_image_url) as string} 
                      alt={`Hoteles en ${destination.city_name}`}
                      width={300}
                      height={225}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h5 className="font-semibold text-white text-sm line-clamp-1">
                      {destination.city_name}
                    </h5>
                    <span className="text-xs text-white/70">{destination.hotels_count} hoteles</span>
                  </div>
                </a>
              ) : (
                <Link
                  key={destination.city_slug}
                  to={linkUrl}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                >
                  {destination.imagen_ciudad || destination.sample_image_url ? (
                    <img 
                      src={(destination.imagen_ciudad || destination.sample_image_url) as string} 
                      alt={`Hoteles en ${destination.city_name}`}
                      width={300}
                      height={225}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h5 className="font-semibold text-white text-sm line-clamp-1">
                      {destination.city_name}
                    </h5>
                    <span className="text-xs text-white/70">{destination.hotels_count} hoteles</span>
                  </div>
                </Link>
              );
            })}
          </div>
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

      {/* Additional city links from database - Visual cards for genres and artists */}
      {type === 'city' && !Array.isArray(links) && links && (
        <>
          {/* Géneros disponibles - Visual cards */}
          {links.genres && links.genres.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-foreground">Géneros disponibles</h4>
                <Link 
                  to="/musica" 
                  className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
                >
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {/* Desktop: Visual Cards Grid */}
              <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
                {links.genres.slice(0, 4).map((genre) => (
                  <Link
                    key={genre.slug}
                    to={genre.url}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                  >
                    {genre.image ? (
                      <img 
                        src={genre.image} 
                        alt={genre.label.replace('Explorar música ', '')}
                        width={300}
                        height={225}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                        <Music className="w-12 h-12 text-accent/50 group-hover:text-accent transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h5 className="font-semibold text-white text-sm line-clamp-1">
                        {genre.label.replace('Explorar música ', '')}
                      </h5>
                      {genre.event_count && genre.event_count > 0 && (
                        <span className="text-xs text-white/70">{genre.event_count} eventos</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {/* Mobile: Compact List View */}
              <div className="md:hidden bg-card border border-border rounded-xl divide-y divide-border">
                {links.genres.slice(0, 6).map((genre) => (
                  <Link
                    key={genre.slug}
                    to={genre.url}
                    className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent transition-all">
                        {genre.image ? (
                          <img 
                            src={genre.image} 
                            alt={genre.label.replace('Explorar música ', '')}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                            <Music className="w-4 h-4 text-accent/50" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {genre.label.replace('Explorar música ', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-background bg-foreground px-3 py-1 rounded-full font-medium">
                        {genre.event_count || 0} evento{(genre.event_count || 0) === 1 ? '' : 's'}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Artistas destacados - Visual cards */}
          {links.top_artists && links.top_artists.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-foreground">Artistas destacados</h4>
                <Link 
                  to="/artistas" 
                  className="flex items-center gap-1 text-foreground hover:text-foreground/70 font-semibold transition-colors"
                >
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {/* Desktop: Visual Cards Grid */}
              <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
                {links.top_artists.slice(0, 4).map((artist) => (
                  <Link
                    key={artist.slug}
                    to={artist.url}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                  >
                    {artist.image ? (
                      <img 
                        src={artist.image} 
                        alt={artist.label.replace('Ver conciertos de ', '')}
                        width={300}
                        height={225}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-muted flex items-center justify-center">
                        <Users className="w-12 h-12 text-accent/50 group-hover:text-accent transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h5 className="font-semibold text-white text-sm line-clamp-1">
                        {artist.label.replace('Ver conciertos de ', '')}
                      </h5>
                      {artist.event_count && artist.event_count > 0 && (
                        <span className="text-xs text-white/70">{artist.event_count} conciertos</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {/* Mobile: Compact List View */}
              <div className="md:hidden bg-card border border-border rounded-xl divide-y divide-border">
                {links.top_artists.slice(0, 6).map((artist) => (
                  <Link
                    key={artist.slug}
                    to={artist.url}
                    className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-transparent group-hover:ring-accent transition-all">
                        {artist.image ? (
                          <img 
                            src={artist.image} 
                            alt={artist.label.replace('Ver conciertos de ', '')}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                            <Users className="w-4 h-4 text-accent/50" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {artist.label.replace('Ver conciertos de ', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-background bg-foreground px-3 py-1 rounded-full font-medium">
                        {artist.event_count || 0} concierto{(artist.event_count || 0) === 1 ? '' : 's'}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Additional genre links from database - Ciudades only (artistas shown as visual cards) */}
      {type === 'genre' && !Array.isArray(links) && links && (
        <>
          {links.top_cities && links.top_cities.length > 0 && 
            renderLinkSection('Ciudades con eventos', links.top_cities, 'Ver conciertos en')}
        </>
      )}
    </div>
  );
};

export default RelatedLinks;
