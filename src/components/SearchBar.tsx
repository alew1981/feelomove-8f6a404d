import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Calendar, MapPin, Clock, Trash2, Euro, Music, Sparkles, User, Disc, ChevronRight } from "lucide-react";
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
import { matchesSearch } from "@/lib/searchUtils";
import { getEventUrl } from "@/lib/eventUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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

interface AutocompleteSuggestion {
  type: 'event' | 'artist' | 'destination' | 'genre';
  name: string;
  path: string;
  id: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const SEARCH_HISTORY_KEY = 'feelomove_search_history';
const MAX_HISTORY_ITEMS = 5;

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const { locale } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 500],
    eventType: 'all',
    dateRange: 'all'
  });
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce search term for autocomplete
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 150); // Faster debounce for autocomplete
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
      const searchPattern = `%${debouncedTerm}%`;
      
      let concerts: any[] = [];
      let festivals: any[] = [];
      
      if (filters.eventType === 'all' || filters.eventType === 'concerts') {
        // Use server-side ILIKE search for better results
        let query = supabase
          .from("mv_concerts_cards")
          .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, artist_name, price_min_incl_fees")
          .gte("event_date", now)
          .gte("price_min_incl_fees", filters.priceRange[0])
          .lte("price_min_incl_fees", filters.priceRange[1])
          .or(`name.ilike.${searchPattern},venue_city.ilike.${searchPattern},artist_name.ilike.${searchPattern}`)
          .order("event_date", { ascending: true })
          .limit(20);
        
        if (dateEnd) {
          query = query.lte("event_date", dateEnd);
        }
        
        const { data } = await query;
        concerts = data || [];
      }
      
      if (filters.eventType === 'all' || filters.eventType === 'festivals') {
        let query = supabase
          .from("mv_festivals_cards")
          .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, main_attraction, price_min_incl_fees, is_festival")
          .gte("event_date", now)
          .gte("price_min_incl_fees", filters.priceRange[0])
          .lte("price_min_incl_fees", filters.priceRange[1])
          .or(`name.ilike.${searchPattern},venue_city.ilike.${searchPattern},main_attraction.ilike.${searchPattern}`)
          .order("event_date", { ascending: true })
          .limit(20);
        
        if (dateEnd) {
          query = query.lte("event_date", dateEnd);
        }
        
        const { data } = await query;
        // Mark festivals with is_festival = true
        festivals = (data || []).map((f: any) => ({ ...f, is_festival: true }));
      }

      // Use server-side ILIKE for destinations
      const { data: destinations } = await supabase
        .from("mv_destinations_cards")
        .select("city_name, city_slug, event_count, sample_image_url")
        .ilike("city_name", searchPattern)
        .limit(8);

      // Use server-side ILIKE for artists
      const { data: artists } = await supabase
        .from("mv_attractions")
        .select("attraction_id, attraction_name, attraction_slug, event_count, sample_image_url")
        .ilike("attraction_name", searchPattern)
        .limit(8);

      // Use server-side ILIKE for genres
      const { data: genres } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_id, event_count")
        .ilike("genre_name", searchPattern)
        .limit(8);
      
      const events = [...concerts, ...festivals]
        .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime())
        .slice(0, 16);
      
      return { 
        events, 
        destinations: destinations || [], 
        artists: artists || [], 
        genres: genres || []
      };
    },
    enabled: debouncedTerm.length >= 1,
  });

  // Generate autocomplete suggestions
  const autocompleteSuggestions: AutocompleteSuggestion[] = [];
  
  if (searchResults) {
    searchResults.artists?.slice(0, 2).forEach(artist => {
      autocompleteSuggestions.push({
        type: 'artist',
        name: artist.attraction_name,
        path: `/conciertos/${artist.attraction_slug}`,
        id: artist.attraction_id,
        subtitle: `${artist.event_count} eventos`,
        icon: <User className="h-4 w-4" />
      });
    });
    
    searchResults.destinations?.slice(0, 2).forEach(dest => {
      autocompleteSuggestions.push({
        type: 'destination',
        name: dest.city_name,
        path: `/destinos/${encodeURIComponent(dest.city_name)}`,
        id: dest.city_name,
        subtitle: `${dest.event_count} eventos`,
        icon: <MapPin className="h-4 w-4" />
      });
    });
    
    searchResults.genres?.slice(0, 2).forEach(genre => {
      const genreSlug = encodeURIComponent(genre.genre_name?.toLowerCase().replace(/\s+/g, '-') || '');
      autocompleteSuggestions.push({
        type: 'genre',
        name: genre.genre_name,
        path: `/generos/${genreSlug}`,
        id: String(genre.genre_id),
        subtitle: `${genre.event_count} eventos`,
        icon: <Disc className="h-4 w-4" />
      });
    });
    
    // Concerts (is_festival = false)
    searchResults.events?.filter(e => !e.is_festival).slice(0, 2).forEach(event => {
      autocompleteSuggestions.push({
        type: 'event',
        name: event.name,
        path: getEventUrl(event.slug, false, locale),
        id: event.id,
        subtitle: `${event.venue_city} · ${new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
        icon: <Music className="h-4 w-4" />
      });
    });
    
    // Festivals (is_festival = true)
    searchResults.events?.filter(e => e.is_festival).slice(0, 2).forEach(event => {
      autocompleteSuggestions.push({
        type: 'event',
        name: event.name,
        path: getEventUrl(event.slug, true, locale),
        id: event.id,
        subtitle: `${event.venue_city} · ${new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
        icon: <Sparkles className="h-4 w-4" />
      });
    });
  }

  const handleResultClick = (path: string, historyItem?: Omit<SearchHistoryItem, 'timestamp'>) => {
    if (historyItem) {
      saveToHistory(historyItem);
    }
    navigate(path);
    onClose();
    setSearchTerm("");
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = autocompleteSuggestions.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < totalItems) {
      e.preventDefault();
      const selected = autocompleteSuggestions[selectedIndex];
      handleResultClick(selected.path, {
        type: selected.type,
        id: selected.id,
        name: selected.name,
        path: selected.path
      });
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [autocompleteSuggestions, selectedIndex, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedTerm]);

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
      setShowFilters(false);
      setSelectedIndex(-1);
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

  const filterOptions = {
    eventType: [
      { value: 'all', label: 'Todos' },
      { value: 'concerts', label: 'Conciertos' },
      { value: 'festivals', label: 'Festivales' }
    ],
    dateRange: [
      { value: 'all', label: 'Cualquier fecha' },
      { value: 'week', label: 'Esta semana' },
      { value: 'month', label: 'Este mes' },
      { value: '3months', label: '3 meses' }
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden border-border/50 bg-background">
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar eventos</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar eventos, artistas, ciudades, géneros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-12 pr-12 h-14 text-base bg-muted/50 border-0 rounded-xl focus-visible:ring-2 focus-visible:ring-accent/50 placeholder:text-muted-foreground/60"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Filtros:</span>
            
            {filterOptions.eventType.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilters(f => ({ ...f, eventType: type.value as any }))}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                  filters.eventType === type.value 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {type.label}
              </button>
            ))}
            
            <div className="w-px h-4 bg-border mx-1" />
            
            {filterOptions.dateRange.map((date) => (
              <button
                key={date.value}
                onClick={() => setFilters(f => ({ ...f, dateRange: date.value as any }))}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                  filters.dateRange === date.value 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {date.label}
              </button>
            ))}
            
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* Price Range */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/30 rounded-xl animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-muted-foreground mb-3 block">
                Precio: <span className="text-foreground">{filters.priceRange[0]}€ - {filters.priceRange[1]}€</span>
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
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-2 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            {showFilters ? 'Ocultar precio' : 'Filtrar por precio'}
            <ChevronRight className={cn("h-3 w-3 transition-transform", showFilters && "rotate-90")} />
          </button>
        </div>

        <div ref={resultsRef} className="px-4 pb-4 space-y-3 overflow-y-auto max-h-[55vh]">
          {/* Quick Suggestions - when no search */}
          {!searchTerm && searchHistory.length === 0 && (
            <div className="py-4">
              <p className="text-xs text-muted-foreground font-medium mb-3">Sugerencias populares</p>
              <div className="flex flex-wrap gap-2">
                {['Madrid', 'Barcelona', 'Rock', 'Festival', 'Reggaeton'].map(hint => (
                  <button
                    key={hint}
                    onClick={() => setSearchTerm(hint)}
                    className="px-4 py-2 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-full text-sm font-medium transition-all duration-200"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {!searchTerm && searchHistory.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Búsquedas recientes
                </p>
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
              <div className="space-y-1">
                {searchHistory.map((item, idx) => (
                  <button
                    key={`${item.path}-${idx}`}
                    onClick={() => handleResultClick(item.path)}
                    className="w-full p-3 rounded-xl hover:bg-muted/50 transition-colors text-left flex items-center gap-3 group"
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

          {/* Loading State */}
          {isLoading && debouncedTerm.length >= 1 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            </div>
          )}
          
          {/* No Results */}
          {!hasResults && debouncedTerm.length >= 1 && !isLoading && (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Sin resultados para "<span className="font-medium text-foreground">{searchTerm}</span>"
              </p>
              <p className="text-xs text-muted-foreground mt-1">Prueba con otros términos</p>
            </div>
          )}
          
          {/* Autocomplete Suggestions */}
          {autocompleteSuggestions.length > 0 && (
            <div className="py-2">
              <p className="text-xs text-muted-foreground font-medium mb-2 px-1">Resultados</p>
              <div className="space-y-1">
                {autocompleteSuggestions.map((suggestion, idx) => (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleResultClick(suggestion.path, {
                      type: suggestion.type,
                      id: suggestion.id,
                      name: suggestion.name,
                      path: suggestion.path
                    })}
                    className={cn(
                      "w-full p-3 rounded-xl transition-all text-left flex items-center gap-3 group",
                      selectedIndex === idx 
                        ? "bg-accent/10 border border-accent/30" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      selectedIndex === idx 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-muted group-hover:bg-accent/20"
                    )}>
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate transition-colors",
                        selectedIndex === idx ? "text-accent" : "group-hover:text-accent"
                      )}>
                        {suggestion.name}
                      </p>
                      {suggestion.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{suggestion.subtitle}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide opacity-60">
                      {suggestion.type === 'event' ? 'Evento' : 
                       suggestion.type === 'artist' ? 'Artista' : 
                       suggestion.type === 'destination' ? 'Ciudad' : 'Género'}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          {autocompleteSuggestions.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd>
                seleccionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono">Esc</kbd>
                cerrar
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchBar;
