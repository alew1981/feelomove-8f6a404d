import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Calendar, MapPin, Clock, Trash2, SlidersHorizontal, Euro, Music } from "lucide-react";
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
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", debouncedTerm, filters],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 1) return { events: [], destinations: [], artists: [], genres: [] };
      
      const dateEnd = getDateFilter();
      const now = new Date().toISOString();
      
      let concerts: any[] = [];
      let festivals: any[] = [];
      
      // Search in concerts
      if (filters.eventType === 'all' || filters.eventType === 'concerts') {
        let query = supabase
          .from("mv_concerts_cards")
          .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, artist_name, price_min_incl_fees")
          .or(`name.ilike.%${debouncedTerm}%,venue_city.ilike.%${debouncedTerm}%,artist_name.ilike.%${debouncedTerm}%`)
          .gte("event_date", now)
          .gte("price_min_incl_fees", filters.priceRange[0])
          .lte("price_min_incl_fees", filters.priceRange[1])
          .order("event_date", { ascending: true })
          .limit(4);
        
        if (dateEnd) {
          query = query.lte("event_date", dateEnd);
        }
        
        const { data } = await query;
        concerts = data || [];
      }
      
      // Search in festivals  
      if (filters.eventType === 'all' || filters.eventType === 'festivals') {
        let query = supabase
          .from("mv_festivals_cards")
          .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, main_attraction, price_min_incl_fees")
          .or(`name.ilike.%${debouncedTerm}%,venue_city.ilike.%${debouncedTerm}%,main_attraction.ilike.%${debouncedTerm}%`)
          .gte("event_date", now)
          .gte("price_min_incl_fees", filters.priceRange[0])
          .lte("price_min_incl_fees", filters.priceRange[1])
          .order("event_date", { ascending: true })
          .limit(4);
        
        if (dateEnd) {
          query = query.lte("event_date", dateEnd);
        }
        
        const { data } = await query;
        festivals = data || [];
      }

      // Search destinations
      const { data: destinations } = await supabase
        .from("mv_destinations_cards")
        .select("city_name, city_slug, event_count, sample_image_url")
        .ilike("city_name", `%${debouncedTerm}%`)
        .limit(3);

      // Search artists
      const { data: artists } = await supabase
        .from("mv_attractions")
        .select("attraction_id, attraction_name, attraction_slug, event_count, sample_image_url")
        .ilike("attraction_name", `%${debouncedTerm}%`)
        .limit(3);

      // Search genres
      const { data: genres } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_slug, event_count, sample_image_url")
        .ilike("genre_name", `%${debouncedTerm}%`)
        .limit(3);
      
      const events = [...concerts, ...festivals]
        .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime())
        .slice(0, 6);
      
      return { 
        events, 
        destinations: destinations || [], 
        artists: artists || [], 
        genres: genres || [] 
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
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Buscar Eventos</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Escribe para buscar eventos, artistas, destinos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-20"
            autoFocus
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4 pt-2 pb-4 border-b border-border">
            {/* Event Type Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo de evento</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'concerts', label: 'Conciertos' },
                  { value: 'festivals', label: 'Festivales' }
                ].map((type) => (
                  <Badge
                    key={type.value}
                    variant={filters.eventType === type.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent/80"
                    onClick={() => setFilters(f => ({ ...f, eventType: type.value as any }))}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Fecha</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Cualquier fecha' },
                  { value: 'week', label: 'Esta semana' },
                  { value: 'month', label: 'Este mes' },
                  { value: '3months', label: 'Próximos 3 meses' }
                ].map((date) => (
                  <Badge
                    key={date.value}
                    variant={filters.dateRange === date.value ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent/80"
                    onClick={() => setFilters(f => ({ ...f, dateRange: date.value as any }))}
                  >
                    {date.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Rango de precio: {filters.priceRange[0]}€ - {filters.priceRange[1]}€
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
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                Limpiar filtros
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-4 overflow-y-auto max-h-[50vh]">
          {/* Search History - Show when no search term */}
          {!searchTerm && searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Búsquedas recientes</h4>
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
                    className="w-full p-3 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/30 transition-all text-left flex items-center gap-3"
                  >
                    <div className="p-2 bg-muted rounded-full">
                      <Clock className="h-4 w-4 text-muted-foreground" />
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
            <p className="text-center text-muted-foreground py-4">Buscando...</p>
          )}
          
          {!hasResults && debouncedTerm.length >= 1 && !isLoading && (
            <p className="text-center text-muted-foreground py-4">No se encontraron resultados</p>
          )}
          
          {/* Events Section */}
          {searchResults?.events && searchResults.events.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Eventos</h4>
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
                    className="w-full p-3 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/30 transition-all text-left flex gap-3"
                  >
                    {result.image_standard_url && (
                      <img
                        src={result.image_standard_url}
                        alt={result.name}
                        className="w-14 h-14 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{result.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.venue_city}
                        </span>
                        {result.price_min_incl_fees && (
                          <span className="flex items-center gap-1">
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
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Destinos</h4>
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
                    className="p-2 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/30 transition-all text-center"
                  >
                    <p className="font-medium text-sm truncate">{dest.city_name}</p>
                    <p className="text-xs text-muted-foreground">{dest.event_count} eventos</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {searchResults?.artists && searchResults.artists.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Artistas</h4>
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
                    className="p-2 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/30 transition-all text-center"
                  >
                    <p className="font-medium text-sm truncate">{artist.attraction_name}</p>
                    <p className="text-xs text-muted-foreground">{artist.event_count} eventos</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Genres Section */}
          {searchResults?.genres && searchResults.genres.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Géneros</h4>
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
                    className="p-2 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/30 transition-all text-center"
                  >
                    <p className="font-medium text-sm truncate">{genre.genre_name}</p>
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