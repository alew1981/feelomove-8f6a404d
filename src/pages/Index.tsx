import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

// Featured event IDs for "Feelomove + love" section
const FEATURED_EVENT_IDS = ['172524182', '35655583', '854574106', '2034594644'];

// Featured cities
const FEATURED_CITIES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla'];

const Index = () => {
  // Fetch "Feelomove + love" featured events by specific IDs
  const { data: loveEvents, isLoading: isLoadingLove } = useQuery({
    queryKey: ["homepage-love-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .in("id", FEATURED_EVENT_IDS);
      if (error) throw error;
      
      // Also check festivals for these IDs
      const { data: festivalData } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .in("id", FEATURED_EVENT_IDS);
      
      const allEvents = [...(data || []), ...(festivalData || [])];
      // Sort by the order of FEATURED_EVENT_IDS
      return allEvents.sort((a, b) => {
        const indexA = FEATURED_EVENT_IDS.indexOf(a.id);
        const indexB = FEATURED_EVENT_IDS.indexOf(b.id);
        return indexA - indexB;
      });
    }
  });

  // Fetch events for each featured city
  const { data: barcelonaEvents, isLoading: isLoadingBarcelona } = useQuery({
    queryKey: ["homepage-barcelona"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .ilike("venue_city", "%Barcelona%")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: madridEvents, isLoading: isLoadingMadrid } = useQuery({
    queryKey: ["homepage-madrid"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .ilike("venue_city", "%Madrid%")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: valenciaEvents, isLoading: isLoadingValencia } = useQuery({
    queryKey: ["homepage-valencia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .ilike("venue_city", "%Valencia%")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: sevillaEvents, isLoading: isLoadingSevilla } = useQuery({
    queryKey: ["homepage-sevilla"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .ilike("venue_city", "%Sevilla%")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch concerts from mv_concerts_cards
  const { data: concerts, isLoading: isLoadingConcerts } = useQuery({
    queryKey: ["homepage-concerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch festivals from mv_festivals_cards
  const { data: festivals, isLoading: isLoadingFestivals } = useQuery({
    queryKey: ["homepage-festivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch destinations from mv_destinations_cards
  const { data: destinations, isLoading: isLoadingDestinations } = useQuery({
    queryKey: ["homepage-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_destinations_cards")
        .select("*")
        .order("event_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch artists from mv_attractions
  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["homepage-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_attractions")
        .select("*")
        .order("event_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch genres from mv_genres_cards with images from concerts
  const { data: genres, isLoading: isLoadingGenres } = useQuery({
    queryKey: ["homepage-genres-with-images"],
    queryFn: async () => {
      const { data: genreData, error } = await supabase
        .from("mv_genres_cards")
        .select("*")
        .order("event_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      
      // Fetch sample images for each genre from concerts
      const genresWithImages = await Promise.all(
        (genreData || []).map(async (genre) => {
          const { data: concertData } = await supabase
            .from("mv_concerts_cards")
            .select("image_standard_url")
            .eq("genre", genre.genre_name)
            .not("image_standard_url", "is", null)
            .limit(1)
            .single();
          
          return {
            ...genre,
            sample_image_url: concertData?.image_standard_url || null
          };
        })
      );
      
      return genresWithImages;
    }
  });

  const isLoading = isLoadingConcerts || isLoadingFestivals || isLoadingDestinations || isLoadingArtists || isLoadingGenres;

  // Events with hotels - combine first 4 events
  const eventsWithHotels = [...(concerts || []), ...(festivals || [])].slice(0, 4);

  // City events mapping
  const cityEvents = {
    Barcelona: { events: barcelonaEvents, isLoading: isLoadingBarcelona },
    Madrid: { events: madridEvents, isLoading: isLoadingMadrid },
    Valencia: { events: valenciaEvents, isLoading: isLoadingValencia },
    Sevilla: { events: sevillaEvents, isLoading: isLoadingSevilla }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Feelomove + love - Featured Events */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                Feelomove + love
                <Heart className="h-5 w-5 text-accent fill-accent" />
              </h2>
              <p className="text-muted-foreground">Nuestros eventos favoritos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingLove ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : loveEvents && loveEvents.length > 0 ? (
              loveEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            )}
          </div>
        </section>

        {/* City-specific sections */}
        {FEATURED_CITIES.map((city) => (
          <section key={city}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Destacados en {city}</h2>
                <p className="text-muted-foreground">Los mejores eventos en {city}</p>
              </div>
              <Link to={`/destinos/${city.toLowerCase()}`} className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cityEvents[city as keyof typeof cityEvents].isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
              ) : cityEvents[city as keyof typeof cityEvents].events && cityEvents[city as keyof typeof cityEvents].events!.length > 0 ? (
                cityEvents[city as keyof typeof cityEvents].events!.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <p className="text-muted-foreground col-span-4">No hay eventos próximos en {city}</p>
              )}
            </div>
          </section>
        ))}

        {/* Próximos Conciertos */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Próximos Conciertos</h2>
              <p className="text-muted-foreground">Los conciertos más esperados</p>
            </div>
            <Link to="/conciertos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingConcerts ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              concerts?.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </section>

        {/* Próximos Festivales */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Próximos Festivales</h2>
              <p className="text-muted-foreground">Experiencias multi-día inolvidables</p>
            </div>
            <Link to="/festivales" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingFestivals ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : festivals && festivals.length > 0 ? (
              festivals.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="text-muted-foreground col-span-4">No hay festivales próximos</p>
            )}
          </div>
        </section>

        {/* Eventos con Hotel */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Eventos con Hotel</h2>
              <p className="text-muted-foreground">Paquetes completos de evento + alojamiento</p>
            </div>
            <Link to="/conciertos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              eventsWithHotels.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </section>

        {/* Destinos Populares */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Destinos Populares</h2>
            <Link to="/destinos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingDestinations ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              destinations?.map((destination) => (
                <Link
                  key={destination.city_name}
                  to={`/destinos/${encodeURIComponent(destination.city_name || '')}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={destination.sample_image_url || "/placeholder.svg"}
                        alt={destination.city_name || "Destino"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{destination.city_name}</h3>
                        <Badge className="bg-accent text-accent-foreground">
                          {destination.event_count} eventos
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Artistas */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Artistas</h2>
            <Link to="/artistas" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingArtists ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              artists?.map((artist) => (
                <Link
                  key={artist.attraction_id}
                  to={`/artista/${artist.attraction_slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={artist.sample_image_url || "/placeholder.svg"}
                        alt={artist.attraction_name || "Artista"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{artist.attraction_name}</h3>
                        <Badge className="bg-accent text-accent-foreground">
                          {artist.event_count} eventos
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Géneros */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Géneros</h2>
            <Link to="/musica" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingGenres ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              genres?.map((genre) => (
                <Link
                  key={genre.genre_name}
                  to={`/musica/${encodeURIComponent(genre.genre_name || '')}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={genre.sample_image_url || "/placeholder.svg"}
                        alt={genre.genre_name || "Género"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{genre.genre_name}</h3>
                        <Badge className="bg-accent text-accent-foreground">
                          {genre.event_count} eventos
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
