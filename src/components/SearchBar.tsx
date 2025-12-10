import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Calendar, MapPin, Clock, Trash2, SlidersHorizontal, Euro, Music, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { normalizeSearch, matchesSearch } from "@/lib/searchUtils";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchHistoryItem {
  type: 'event' | 'destination' | 'artist' | 'genre';
  id: string;
  name: string;
  path: string;
  timestamp: number;
}

interface SearchFilters {
  priceRange: [number, number];
  eventType: 'all' | 'concerts' | 'festivals';
  dateRange: 'all' | 'week' | 'month' | '3months';
}

const SEARCH_HISTORY_KEY = 'feelomove_search_history';
const MAX_HISTORY_ITEMS = 5;

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 500],
    eventType: 'all',
    dateRange: 'all'
  });
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce search term for live search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      setSearchHistory(JSON.parse(stored));
    }
  }, [isOpen]);

  const saveToHistory = (item: Omit<SearchHistoryItem, 'timestamp'>) => {
    const newItem = { ...item, timestamp: Date.now() };
    const updated = [newItem, ...searchHistory.filter(h => h.path !== item.path)].slice(0, MAX_HISTORY_ITEMS);
    setSearchHistory(updated);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (filters.dateRange) {
      case 'week':
        const weekLater = new Date(now);
        weekLater.setDate(weekLater.getDate() + 7);
        return weekLater.toISOString();
      case 'month':
        const monthLater = new Date(now);
        monthLater.setMonth(monthLater.getMonth() + 1);
        return monthLater.toISOString();
      case '3months':
        const threeLater = new Date(now);
        threeLater.setMonth(threeLater.getMonth() + 3);
        return threeLater.toISOString();
      default:
        return null;
    }
  };

  // Normalize search term for accent-insensitive matching
  const normalizedSearchTerm = normalizeSearch(debouncedTerm);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", debouncedTerm, filters],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 1) return { events: [], destinations: [], artists: [], genres: [] };
      
      const dateEnd = getDateFilter();
      const now = new Date().toISOString();
      
      let concerts: any[] = [];
      let festivals: any[] = [];
      
      // Search in concerts - fetch more results for client-side filtering
      if (filters.eventType === 'all' || filters.eventType === 'concerts') {
        let query = supabase
          .from("mv_concerts_cards")
          .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, artist_name, price_min_incl_fees")
          .gte("event_date", now)
          .gte("price_min_incl_fees", filters.priceRange[0])
          .lte("price_min_incl_fees", filters.priceRange[1])
          .order("event_date", { ascending: true })
          .limit(50); // Fetch more for client-side filtering
        
        if (dateEnd) {
          query = query.lte("event_date", dateEnd);
        }
        
        const { data } = await query;
        // Client-side accent-insensitive filtering
        concerts = (data || []).filter(item => 
          matchesSearch(item.name, debouncedTerm) ||
          matchesSearch(item.venue_city, debouncedTerm) ||
          matchesSearch(item.artist_name, debouncedTerm)
        ).slice(0, 6);
      }
      
      // Search in festivals  
      if (filters.eventType === 'all' || filters.eventType === 'festivals') {
        let query = supabase
          .from("mv_festivals_cards")
          .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, main_attraction, price_min_incl_fees")
          .gte("event_date", now)
          .gte("price_min_incl_fees", filters.priceRange[0])
          .lte("price_min_incl_fees", filters.priceRange[1])
          .order("event_date", { ascending: true })
          .limit(50);
        
        if (dateEnd) {
          query = query.lte("event_date", dateEnd);
        }
        
        const { data } = await query;
        festivals = (data || []).filter(item =>
          matchesSearch(item.name, debouncedTerm) ||
          matchesSearch(item.venue_city, debouncedTerm) ||
          matchesSearch(item.main_attraction, debouncedTerm)
        ).slice(0, 6);
      }

      // Search destinations with client-side filtering
      const { data: allDestinations } = await supabase
        .from("mv_destinations_cards")
        .select("city_name, city_slug, event_count, sample_image_url")
        .limit(50);
      
      const destinations = (allDestinations || []).filter(dest =>
        matchesSearch(dest.city_name, debouncedTerm)
      ).slice(0, 3);

      // Search artists with client-side filtering
      const { data: allArtists } = await supabase
        .from("mv_attractions")
        .select("attraction_id, attraction_name, attraction_slug, event_count, sample_image_url")
        .limit(100);
      
      const artists = (allArtists || []).filter(artist =>
        matchesSearch(artist.attraction_name, debouncedTerm)
      ).slice(0, 3);

      // Search genres with client-side filtering
      const { data: allGenres } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_slug, event_count, sample_image_url")
        .limit(50);
      
      const genres = (allGenres || []).filter(genre =>
        matchesSearch(genre.genre_name, debouncedTerm)
      ).slice(0, 3);
      
      const events = [...concerts, ...festivals]
        .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime())
        .slice(0, 6);
      
      return { 
        events, 
        destinations, 
        artists, 
        genres 
      };
    },
    enabled: debouncedTerm.length >= 1,
  });

  const handleResultClick = (path: string, historyItem?: Omit<SearchHistoryItem, 'timestamp'>) => {
    if (historyItem) {
      saveToHistory(historyItem);
    }
    navigate(path);
    onClose();
    setSearchTerm("");
  };

  const hasResults = searchResults && (
    searchResults.events?.length > 0 || 
    searchResults.destinations?.length > 0 || 
    searchResults.artists?.length > 0 || 
    searchResults.genres?.length > 0
  );

  const activeFiltersCount = 
    (filters.eventType !== 'all' ? 1 : 0) + 
    (filters.dateRange !== 'all' ? 1 : 0) + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 500 ? 1 : 0);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setDebouncedTerm("");
    }
  }, [isOpen]);

  const formatHistoryTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 500],
      eventType: 'all',
      dateRange: 'all'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-accent" />
            Buscar Eventos
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4 space-y-4">
          {/* Search Input - Enhanced Design */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-card border-2 border-border rounded-xl focus-within:border-accent/50 transition-all duration-200 shadow-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Busca eventos, artistas, ciudades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-24 h-14 text-base border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant={showFilters ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 rounded-full relative ${showFilters ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Search Hints */}
          {!searchTerm && !showFilters && searchHistory.length === 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Prueba:</span>
              {['Madrid', 'Rock', 'Barcelona', 'Festival'].map(hint => (
                <Badge
                  key={hint}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors text-xs"
                  onClick={() => setSearchTerm(hint)}
                >
                  {hint}
                </Badge>
              ))}
            </div>
          )}

          {/* Advanced Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4 pt-2 pb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border/50">
                {/* Event Type Filter */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Tipo de evento</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: 'Todos', icon: '🎵' },
                      { value: 'concerts', label: 'Conciertos', icon: '🎤' },
                      { value: 'festivals', label: 'Festivales', icon: '🎪' }
                    ].map((type) => (
                      <Badge
                        key={type.value}
                        variant={filters.eventType === type.value ? "default" : "outline"}
                        className={`cursor-pointer transition-all px-3 py-1.5 ${
                          filters.eventType === type.value 
                            ? 'bg-accent text-accent-foreground shadow-md' 
                            : 'hover:bg-muted hover:border-accent/50'
                        }`}
                        onClick={() => setFilters(f => ({ ...f, eventType: type.value as any }))}
                      >
                        <span className="mr-1">{type.icon}</span>
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Fecha</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: 'Cualquier fecha' },
                      { value: 'week', label: 'Esta semana' },
                      { value: 'month', label: 'Este mes' },
                      { value: '3months', label: '3 meses' }
                    ].map((date) => (
                      <Badge
                        key={date.value}
                        variant={filters.dateRange === date.value ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          filters.dateRange === date.value 
                            ? 'bg-accent text-accent-foreground shadow-md' 
                            : 'hover:bg-muted hover:border-accent/50'
                        }`}
                        onClick={() => setFilters(f => ({ ...f, dateRange: date.value as any }))}
                      >
                        {date.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wide">
                    Precio: <span className="text-foreground font-bold">{filters.priceRange[0]}€ - {filters.priceRange[1]}€</span>
                  </label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters(f => ({ ...f, priceRange: value as [number, number] }))}
                    min={0}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>

                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs w-full mt-2">
                    <X className="h-3 w-3 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[50vh]">
          {/* Search History - Show when no search term */}
          {!searchTerm && searchHistory.length > 0 && (
            <div className="animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Búsquedas recientes
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearHistory}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              </div>
              <div className="space-y-2">
                {searchHistory.map((item, idx) => (
                  <button
                    key={`${item.path}-${idx}`}
                    onClick={() => handleResultClick(item.path)}
                    className="w-full p-3 rounded-xl bg-card border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all text-left flex items-center gap-3 group"
                  >
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-accent/20 transition-colors">
                      <Clock className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatHistoryTime(item.timestamp)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && debouncedTerm.length >= 1 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span>Buscando...</span>
              </div>
            </div>
          )}
          
          {!hasResults && debouncedTerm.length >= 1 && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No se encontraron resultados para "<span className="font-medium text-foreground">{searchTerm}</span>"</p>
              <p className="text-xs text-muted-foreground mt-1">Intenta con otros términos</p>
            </div>
          )}
          
          {/* Events Section */}
          {searchResults?.events && searchResults.events.length > 0 && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Music className="h-3 w-3" />
                Eventos
              </h4>
              <div className="space-y-2">
                {searchResults.events.map((result: any) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(`/producto/${result.slug}`, {
                      type: 'event',
                      id: result.id,
                      name: result.name,
                      path: `/producto/${result.slug}`
                    })}
                    className="w-full p-3 rounded-xl bg-card border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all text-left flex gap-4 group"
                  >
                    {result.image_standard_url && (
                      <img
                        src={result.image_standard_url}
                        alt={result.name}
                        className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate group-hover:text-accent transition-colors">{result.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.venue_city}
                        </span>
                        {result.price_min_incl_fees && (
                          <span className="flex items-center gap-1 text-accent font-medium">
                            <Euro className="h-3 w-3" />
                            {result.price_min_incl_fees}€
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Destinations Section */}
          {searchResults?.destinations && searchResults.destinations.length > 0 && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Destinos
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {searchResults.destinations.map((dest: any) => (
                  <button
                    key={dest.city_name}
                    onClick={() => handleResultClick(`/destinos/${encodeURIComponent(dest.city_name)}`, {
                      type: 'destination',
                      id: dest.city_name,
                      name: dest.city_name,
                      path: `/destinos/${encodeURIComponent(dest.city_name)}`
                    })}
                    className="p-3 rounded-xl bg-card border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all text-center group"
                  >
                    <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">{dest.city_name}</p>
                    <p className="text-xs text-muted-foreground">{dest.event_count} eventos</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {searchResults?.artists && searchResults.artists.length > 0 && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Artistas
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {searchResults.artists.map((artist: any) => (
                  <button
                    key={artist.attraction_id}
                    onClick={() => handleResultClick(`/artista/${artist.attraction_slug}`, {
                      type: 'artist',
                      id: artist.attraction_id,
                      name: artist.attraction_name,
                      path: `/artista/${artist.attraction_slug}`
                    })}
                    className="p-3 rounded-xl bg-card border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all text-center group"
                  >
                    <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">{artist.attraction_name}</p>
                    <p className="text-xs text-muted-foreground">{artist.event_count} eventos</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Genres Section */}
          {searchResults?.genres && searchResults.genres.length > 0 && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Music className="h-3 w-3" />
                Géneros
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {searchResults.genres.map((genre: any) => (
                  <button
                    key={genre.genre_name}
                    onClick={() => handleResultClick(`/musica/${genre.genre_slug}`, {
                      type: 'genre',
                      id: genre.genre_slug,
                      name: genre.genre_name,
                      path: `/musica/${genre.genre_slug}`
                    })}
                    className="p-3 rounded-xl bg-card border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all text-center group"
                  >
                    <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">{genre.genre_name}</p>
                    <p className="text-xs text-muted-foreground">{genre.event_count} eventos</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchBar;