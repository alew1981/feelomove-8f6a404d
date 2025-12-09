import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Calendar, MapPin } from "lucide-react";
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

const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      // Search in concerts
      const { data: concerts, error: concertsError } = await supabase
        .from("mv_concerts_cards")
        .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url")
        .or(`name.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%,artist_name.ilike.%${searchTerm}%`)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(5);
      
      // Search in festivals  
      const { data: festivals, error: festivalsError } = await supabase
        .from("mv_festivals_cards")
        .select("id, name, slug, event_date, venue_city, venue_name, image_standard_url")
        .or(`name.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(5);
      
      const allResults = [...(concerts || []), ...(festivals || [])];
      
      // Sort by date and limit
      return allResults
        .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime())
        .slice(0, 10);
    },
    enabled: searchTerm.length >= 2,
  });

  const handleResultClick = (eventSlug: string) => {
    navigate(`/producto/${eventSlug}`);
    onClose();
    setSearchTerm("");
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

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
            placeholder="Buscar por evento, artista o ciudad..."
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

        <div className="space-y-2 overflow-y-auto max-h-[50vh]">
          {isLoading && searchTerm.length >= 2 && (
            <p className="text-center text-muted-foreground py-4">Buscando...</p>
          )}
          
          {searchResults && searchResults.length === 0 && searchTerm.length >= 2 && !isLoading && (
            <p className="text-center text-muted-foreground py-4">No se encontraron resultados</p>
          )}
          
          {searchResults?.map((result: any) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result.slug)}
              className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left flex gap-3"
            >
              {result.image_standard_url && (
                <img
                  src={result.image_standard_url}
                  alt={result.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{result.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(result.event_date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}
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
      </DialogContent>
    </Dialog>
  );
};

export default SearchBar;
