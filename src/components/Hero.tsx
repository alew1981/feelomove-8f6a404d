import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, MapPin, Music, User, Calendar, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch, matchesSearch } from "@/lib/searchUtils";
import heroConcertImage from "@/assets/hero-concert.webp";

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

        // Filter concerts
        concertsRes.data?.forEach(event => {
          if (matchesSearch(event.name || '', searchQuery) || 
              matchesSearch(event.artist_name || '', searchQuery) ||
              matchesSearch(event.venue_city || '', searchQuery)) {
            searchResults.push({
              type: 'event',
              name: event.name || '',
              path: `/producto/${event.slug}`,
              subtitle: event.venue_city || '',
              image: event.image_standard_url || ''
            });
          }
        });

        // Filter festivals
        festivalsRes.data?.forEach(event => {
          if (matchesSearch(event.name || '', searchQuery) ||
              matchesSearch(event.main_attraction || '', searchQuery) ||
              matchesSearch(event.venue_city || '', searchQuery)) {
            searchResults.push({
              type: 'event',
              name: event.name || '',
              path: `/producto/${event.slug}`,
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
              path: `/artista/${artist.attraction_slug}`,
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
      case 'artist': return <User className="h-4 w-4 text-accent" />;
      case 'destination': return <MapPin className="h-4 w-4 text-accent" />;
      case 'genre': return <Music className="h-4 w-4 text-accent" />;
      default: return <Calendar className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <section className="relative min-h-[750px] flex items-center justify-center overflow-hidden">
      {/* Static Image Background - LCP optimized */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroConcertImage}
          alt="Festival concert"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/80 via-brand-black/70 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center pt-32 pb-20">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white tracking-tight">
            TU ESPECTÁCULO,{" "}
            <span className="text-accent">TU ESTANCIA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto font-medium">
            Ahorra en grande y quédate cerca: reserva tu próxima aventura hoy con Feelomove+
          </p>
        </div>

        {/* Improved Search Bar */}
        <div 
          ref={searchRef}
          className="max-w-3xl mx-auto mb-16 animate-fade-in relative" 
          style={{ animationDelay: "150ms" }}
        >
          <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                  <X className="h-4 w-4" />
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
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <span className="font-medium">Buscando experiencias...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.name}-${index}`}
                      onClick={() => handleResultClick(result.path)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left group"
                    >
                      {result.image ? (
                        <img 
                          src={result.image} 
                          alt={result.name}
                          className="w-12 h-12 rounded-lg object-cover border border-border group-hover:border-accent transition-colors"
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
                    </button>
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 text-white animate-fade-in" style={{ animationDelay: "300ms" }}>
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
