import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch, matchesSearch } from "@/lib/searchUtils";
import { getEventUrl } from "@/lib/eventUtils";
// Hero image served from public folder for LCP preload discovery
const heroConcertImage = "/images/hero-concert.webp";

// === INLINE SVG ICONS (replaces lucide-react for LCP optimization) ===
const IconSearch = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconMusic = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);
const IconUser = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconCalendar = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
  </svg>
);
const IconX = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);
const IconLoader = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" />
  </svg>
);

interface SearchResult {
  type: 'event' | 'artist' | 'destination' | 'genre';
  name: string;
  path: string;
  subtitle?: string;
  image?: string;
}

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search as user types
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const searchResults: SearchResult[] = [];
      const normalizedQuery = normalizeSearch(searchQuery);

      try {
        // Search events (concerts + festivals)
        // First get genres, then fetch images for them
        const [concertsRes, festivalsRes, destinationsRes, artistsRes, genresRes] = await Promise.all([
          supabase.from("mv_concerts_cards").select("id, name, slug, venue_city, image_standard_url, artist_name, genre").limit(50),
          supabase.from("mv_festivals_cards").select("id, name, slug, venue_city, image_standard_url, main_attraction, genre").limit(50),
          supabase.from("mv_destinations_cards").select("city_name, city_slug, sample_image_url").limit(50),
          supabase.from("mv_attractions").select("attraction_id, attraction_name, attraction_slug, sample_image_url").limit(50),
          supabase.from("mv_genres_cards").select("genre_name, genre_id").limit(50)
        ]);

        // Build genre image map from concert images
        const genreImageMap: Record<string, string> = {};
        [...(concertsRes.data || []), ...(festivalsRes.data || [])].forEach(event => {
          if (event.genre && event.image_standard_url && !genreImageMap[event.genre]) {
            genreImageMap[event.genre] = event.image_standard_url;
          }
        });

        // Filter concerts (is_festival = false)
        concertsRes.data?.forEach(event => {
          if (matchesSearch(event.name || '', searchQuery) || 
              matchesSearch(event.artist_name || '', searchQuery) ||
              matchesSearch(event.venue_city || '', searchQuery)) {
            searchResults.push({
              type: 'event',
              name: event.name || '',
              path: getEventUrl(event.slug || '', false),
              subtitle: event.venue_city || '',
              image: event.image_standard_url || ''
            });
          }
        });

        // Filter festivals (is_festival = true)
        festivalsRes.data?.forEach(event => {
          if (matchesSearch(event.name || '', searchQuery) ||
              matchesSearch(event.main_attraction || '', searchQuery) ||
              matchesSearch(event.venue_city || '', searchQuery)) {
            searchResults.push({
              type: 'event',
              name: event.name || '',
              path: getEventUrl(event.slug || '', true),
              subtitle: event.venue_city || '',
              image: event.image_standard_url || ''
            });
          }
        });

        // Filter destinations
        destinationsRes.data?.forEach(dest => {
          if (matchesSearch(dest.city_name || '', searchQuery)) {
            searchResults.push({
              type: 'destination',
              name: dest.city_name || '',
              path: `/destinos/${dest.city_slug || encodeURIComponent(dest.city_name || '')}`,
              image: dest.sample_image_url || ''
            });
          }
        });

        // Filter artists
        artistsRes.data?.forEach(artist => {
          if (matchesSearch(artist.attraction_name || '', searchQuery)) {
            searchResults.push({
              type: 'artist',
              name: artist.attraction_name || '',
              path: `/conciertos/${artist.attraction_slug}`,
              image: artist.sample_image_url || ''
            });
          }
        });

        // Filter genres with images
        genresRes.data?.forEach(genre => {
          if (matchesSearch(genre.genre_name || '', searchQuery)) {
            searchResults.push({
              type: 'genre',
              name: genre.genre_name || '',
              path: `/musica/${encodeURIComponent(genre.genre_name || '')}`,
              image: genreImageMap[genre.genre_name || ''] || ''
            });
          }
        });

        // Month search (in Spanish)
        const months = [
          { name: 'enero', num: '01' }, { name: 'febrero', num: '02' }, { name: 'marzo', num: '03' },
          { name: 'abril', num: '04' }, { name: 'mayo', num: '05' }, { name: 'junio', num: '06' },
          { name: 'julio', num: '07' }, { name: 'agosto', num: '08' }, { name: 'septiembre', num: '09' },
          { name: 'octubre', num: '10' }, { name: 'noviembre', num: '11' }, { name: 'diciembre', num: '12' }
        ];
        months.forEach(month => {
          if (matchesSearch(month.name, searchQuery)) {
            searchResults.push({
              type: 'event',
              name: `Eventos en ${month.name.charAt(0).toUpperCase() + month.name.slice(1)}`,
              path: `/conciertos?month=${month.num}`
            });
          }
        });

        setResults(searchResults.slice(0, 8));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery) {
      navigate(`/eventos?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (path: string) => {
    navigate(path);
    setShowResults(false);
    setSearchQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'artist': return <IconUser className="h-4 w-4 text-accent" />;
      case 'destination': return <IconMapPin className="h-4 w-4 text-accent" />;
      case 'genre': return <IconMusic className="h-4 w-4 text-accent" />;
      default: return <IconCalendar className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <section className="hero-section relative min-h-[750px] flex items-center justify-center overflow-hidden">
      {/* Static Image Background - LCP optimized with critical rendering path */}
      <div className="absolute inset-0 z-0">
        {/* 
          LCP Optimization:
          - fetchpriority="high" tells browser this is critical
          - loading="eager" disables lazy loading
          - decoding="sync" ensures immediate decode
          - width/height prevent layout shift
        */}
        {/* 
          LCP Optimization with responsive images:
          - srcset provides different image sizes for different viewport widths
          - sizes tells browser the image will be full viewport width
          - Vite hashes the image, so we serve appropriately sized versions
        */}
        <img
          src={heroConcertImage}
          srcSet={`${heroConcertImage} 1920w`} 
          sizes="100vw"
          alt="Conciertos y festivales en España - FEELOMOVE+"
          className="hero-image w-full h-full object-cover"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
        <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-brand-black/80 via-brand-black/70 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center pt-32 pb-20">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white tracking-tight">
            Entradas para Conciertos y Festivales en España
            <br />
            <span className="text-accent">+ Hotel. Todo Resuelto.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto font-medium">
            Compra entradas y reserva hotel cerca del evento. Ahorra tiempo y dinero con Feelomove+
          </p>
        </div>

        {/* Improved Search Bar */}
        <div 
          ref={searchRef}
          className="max-w-3xl mx-auto mb-16 animate-fade-in animation-delay-150 relative"
        >
          <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por evento, artista, destino, género o mes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 pr-10 h-16 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setResults([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              className="h-16 px-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Buscar
            </Button>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (searchQuery.length >= 2 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border-2 border-accent/30 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border bg-muted/50">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-foreground">feelomove</span>
                  <span className="text-accent">+</span>
                  <span className="text-muted-foreground ml-2">resultados</span>
                </p>
              </div>
              
              {isSearching ? (
                <div className="p-6 flex items-center justify-center gap-3 text-muted-foreground">
                  <IconLoader className="h-5 w-5 animate-spin text-accent" />
                  <span className="font-medium">Buscando experiencias...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <Link
                      key={`${result.type}-${result.name}-${index}`}
                      to={result.path}
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery("");
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left group"
                    >
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={`${result.name} - ${result.type === 'event' ? 'Evento' : result.type === 'artist' ? 'Artista' : result.type === 'destination' ? 'Destino' : 'Género'}`}
                          className="w-12 h-12 rounded-lg object-cover border border-border group-hover:border-accent transition-colors"
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:border-accent transition-colors">
                          {getIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">{result.name}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-accent-foreground capitalize px-3 py-1.5 bg-accent rounded-full">
                        {result.type === 'event' ? 'Evento' : 
                         result.type === 'artist' ? 'Artista' :
                         result.type === 'destination' ? 'Destino' : 'Género'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground mb-2">No se encontraron resultados para</p>
                  <p className="font-semibold text-foreground">"{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground mt-3">Prueba con otro término o explora nuestros <Link to="/conciertos" className="text-accent hover:underline">conciertos</Link></p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Improved 3 Steps */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 text-white animate-fade-in animation-delay-300">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black text-xl shadow-lg flex-shrink-0">
              1
            </div>
            <div className="text-left">
              <span className="font-bold text-base block">Busca tu evento</span>
              <span className="text-sm text-white/70">Encuentra tu concierto ideal</span>
            </div>
          </div>
          
          <div className="hidden md:block w-8 h-0.5 bg-accent/50 rounded-full" />
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black text-xl shadow-lg flex-shrink-0">
              2
            </div>
            <div className="text-left">
              <span className="font-bold text-base block">Elige entradas + hotel</span>
              <span className="text-sm text-white/70">Paquetes todo incluido</span>
            </div>
          </div>
          
          <div className="hidden md:block w-8 h-0.5 bg-accent/50 rounded-full" />
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black text-xl shadow-lg flex-shrink-0">
              3
            </div>
            <div className="text-left">
              <span className="font-bold text-base block">Disfruta la música</span>
              <span className="text-sm text-white/70">Vive la experiencia</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
