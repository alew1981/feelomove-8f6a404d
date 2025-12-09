import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Calendar, MapPin, Clock, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const SEARCH_HISTORY_KEY = 'feelomove_search_history';
const MAX_HISTORY_ITEMS = 5;

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const navigate = useNavigate();

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

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { events: [], destinations: [], artists: [], genres: [] };
      
      // Search in concerts
      const { data: concerts } = await supabase
        .from("mv_concerts_cards")
        .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, artist_name")
        .or(`name.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%,artist_name.ilike.%${searchTerm}%`)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      
      // Search in festivals  
      const { data: festivals } = await supabase
        .from("mv_festivals_cards")
        .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url, main_attraction")
        .or(`name.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%,main_attraction.ilike.%${searchTerm}%`)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);

      // Search destinations
      const { data: destinations } = await supabase
        .from("mv_destinations_cards")
        .select("city_name, city_slug, event_count, sample_image_url")
        .ilike("city_name", `%${searchTerm}%`)
        .limit(3);

      // Search artists
      const { data: artists } = await supabase
        .from("mv_attractions")
        .select("attraction_id, attraction_name, attraction_slug, event_count, sample_image_url")
        .ilike("attraction_name", `%${searchTerm}%`)
        .limit(3);

      // Search genres
      const { data: genres } = await supabase
        .from("mv_genres_cards")
        .select("genre_name, genre_slug, event_count, sample_image_url")
        .ilike("genre_name", `%${searchTerm}%`)
        .limit(3);
      
      const events = [...(concerts || []), ...(festivals || [])]
        .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime())
        .slice(0, 6);
      
      return { 
        events, 
        destinations: destinations || [], 
        artists: artists || [], 
        genres: genres || [] 
      };
    },
    enabled: searchTerm.length >= 2,
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

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buscar Eventos</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar eventos, artistas, destinos o géneros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
            autoFocus
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

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

          {isLoading && searchTerm.length >= 2 && (
            <p className="text-center text-muted-foreground py-4">Buscando...</p>
          )}
          
          {!hasResults && searchTerm.length >= 2 && !isLoading && (
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