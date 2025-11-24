import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-festival.jpg";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Combined search across events, artists, genres, and cities
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["hero-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { events: [], artists: [], subgenres: [], cities: [] };

      const [eventsRes, attractionsRes, subgenresRes, citiesRes] = await Promise.all([
        supabase
          .from("tm_tbl_events")
          .select("event_id, name, event_date, venue_city, image_standard_url, domain_id")
          .ilike("name", `%${searchQuery}%`)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(3),
        supabase
          .from("tm_tbl_attractions")
          .select("attraction_id, name, image_standard_url, event_count, domain_id")
          .ilike("name", `%${searchQuery}%`)
          .gt("event_count", 0)
          .order("event_count", { ascending: false })
          .limit(3),
        supabase
          .from("tm_tbl_subcategories")
          .select("id, name, category_id, domain_id")
          .ilike("name", `%${searchQuery}%`)
          .limit(3),
        supabase
          .from("tm_tbl_events")
          .select("venue_city, venue_country")
          .ilike("venue_city", `%${searchQuery}%`)
          .gte("event_date", new Date().toISOString())
          .not("venue_city", "is", null)
          .limit(3)
      ]);

      return {
        events: eventsRes.data || [],
        artists: attractionsRes.data || [],
        subgenres: subgenresRes.data || [],
        cities: Array.from(new Set(citiesRes.data?.map(e => e.venue_city))).slice(0, 3)
      };
    },
    enabled: searchQuery.length >= 2,
  });

  const handleEventClick = (eventId: string, domainId: string) => {
    navigate(`/producto/${eventId}?domain=${domainId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleArtistClick = (artistId: string) => {
    navigate(`/generos?artist=${artistId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleSubgenreClick = (subgenreId: number) => {
    navigate(`/categorias/${subgenreId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCityClick = (city: string) => {
    navigate(`/destinos?city=${city}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Festival atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/85 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center pt-32 pb-20">
        <div className="animate-fade-in">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground">
            Vive la <span className="text-accent">Música</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light">
            Conciertos y festivales con alojamiento perfecto incluido
          </p>
        </div>

        {/* Unified Search Box */}
        <div className="max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "150ms" }}>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-accent transition-colors z-10" />
                <Input
                  placeholder="Busca por evento, artista, género o ciudad..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(e.target.value.length >= 2);
                  }}
                  className="pl-16 pr-6 h-16 text-lg bg-card border-2 border-border hover:border-accent/50 focus:border-accent transition-all shadow-xl rounded-2xl"
                />
                {isLoading && (
                  <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-accent animate-spin" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0" align="start">
              <Command>
                <CommandList className="max-h-[400px]">
                  {searchResults && (
                    <>
                      {searchResults.events.length > 0 && (
                        <CommandGroup heading="Eventos">
                          {searchResults.events.map((event) => (
                            <CommandItem
                              key={event.event_id}
                              onSelect={() => handleEventClick(event.event_id, event.domain_id)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                {event.image_standard_url && (
                                  <img
                                    src={event.image_standard_url}
                                    alt={event.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{event.name}</p>
                                  <p className="text-xs text-muted-foreground">{event.venue_city}</p>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {searchResults.artists.length > 0 && (
                        <CommandGroup heading="Artistas">
                          {searchResults.artists.map((artist) => (
                            <CommandItem
                              key={artist.attraction_id}
                              onSelect={() => handleArtistClick(artist.attraction_id)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                {artist.image_standard_url && (
                                  <img
                                    src={artist.image_standard_url}
                                    alt={artist.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{artist.name}</p>
                                  <p className="text-xs text-muted-foreground">{artist.event_count} eventos</p>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {searchResults.subgenres.length > 0 && (
                        <CommandGroup heading="Géneros Musicales">
                          {searchResults.subgenres.map((subgenre) => (
                            <CommandItem
                              key={subgenre.id}
                              onSelect={() => handleSubgenreClick(subgenre.id)}
                              className="cursor-pointer"
                            >
                              <p className="font-medium">{subgenre.name}</p>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {searchResults.cities.length > 0 && (
                        <CommandGroup heading="Ciudades">
                          {searchResults.cities.map((city) => (
                            <CommandItem
                              key={city}
                              onSelect={() => handleCityClick(city)}
                              className="cursor-pointer"
                            >
                              <p className="font-medium">{city}</p>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {!isLoading && searchQuery.length >= 2 && 
                       searchResults.events.length === 0 && 
                       searchResults.artists.length === 0 && 
                       searchResults.subgenres.length === 0 && 
                       searchResults.cities.length === 0 && (
                        <CommandEmpty>No se encontraron resultados</CommandEmpty>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/eventos")}
              className="border-accent/20 hover:border-accent hover:bg-accent/10"
            >
              Todos los eventos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/destinos")}
              className="border-accent/20 hover:border-accent hover:bg-accent/10"
            >
              Explorar destinos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/generos")}
              className="border-accent/20 hover:border-accent hover:bg-accent/10"
            >
              Ver géneros
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
