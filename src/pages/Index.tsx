import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

// Featured cities for display order
const FEATURED_CITIES = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla'];
const FEATURED_IDS = ['172524182', '35655583', '854574106', '2034594644'];

const Index = () => {
  // Fetch featured events by specific IDs
  const { data: featuredConcerts = [] } = useQuery({
    queryKey: ["home-featured-concerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_concerts_cards')
        .select('*')
        .in('id', FEATURED_IDS);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: featuredFestivals = [] } = useQuery({
    queryKey: ["home-featured-festivals"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_festivals_cards')
        .select('*')
        .in('id', FEATURED_IDS);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch concerts (increased limit for cities)
  const { data: concerts = [], isLoading: loadingConcerts } = useQuery({
    queryKey: ["home-concerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_concerts_cards')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(50);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch festivals (increased limit)
  const { data: festivals = [], isLoading: loadingFestivals } = useQuery({
    queryKey: ["home-festivals"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_festivals_cards')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(20);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch destinations
  const { data: destinations = [], isLoading: loadingDestinations } = useQuery({
    queryKey: ["home-destinations"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_destinations_cards')
        .select('*')
        .order('event_count', { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch artists
  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ["home-artists"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_attractions')
        .select('*')
        .order('event_count', { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch genres
  const { data: genres = [], isLoading: loadingGenres } = useQuery({
    queryKey: ["home-genres"],
    queryFn: async () => {
      const { data } = await supabase
        .from('mv_genres_cards')
        .select('*')
        .order('event_count', { ascending: false })
        .limit(4);
      
      // Fetch sample images for each genre from concerts OR festivals
      if (data && data.length > 0) {
        const genresWithImages = await Promise.all(
          data.map(async (genre: any) => {
            // Try concerts first
            let { data: eventData } = await supabase
              .from('mv_concerts_cards')
              .select('image_standard_url')
              .eq('genre', genre.genre_name)
              .limit(1);
            
            // If no concert found, try festivals
            if (!eventData || eventData.length === 0) {
              const { data: festivalData } = await supabase
                .from('mv_festivals_cards')
                .select('image_standard_url')
                .eq('genre', genre.genre_name)
                .limit(1);
              eventData = festivalData;
            }
            
            return {
              ...genre,
              sample_image_url: eventData?.[0]?.image_standard_url || null
            };
          })
        );
        return genresWithImages;
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingConcerts || loadingFestivals;

  // Featured events - combine featured queries and maintain order
  const allFeatured = [...featuredConcerts, ...featuredFestivals];
  const featuredEvents = FEATURED_IDS
    .map(id => allFeatured.find(e => e.id === id))
    .filter(Boolean);

  // All events for city sections
  const allEvents = [...concerts, ...festivals];

  // City events
  const cityEvents: Record<string, any[]> = {};
  FEATURED_CITIES.forEach(city => {
    cityEvents[city] = allEvents
      .filter(e => e.venue_city?.toLowerCase() === city.toLowerCase())
      .slice(0, 4);
  });

  // Events with hotels
  const eventsWithHotels = allEvents.slice(0, 4);

  // Generate JSON-LD for homepage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FEELOMOVE+",
    "url": "https://feelomove.com",
    "description": "Descubre los mejores conciertos y festivales en España. Compra entradas y reserva hotel en el mismo lugar.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://feelomove.com/conciertos?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <SEOHead
        title="Conciertos, Festivales y Hoteles en España"
        description="Descubre los mejores conciertos y festivales en España. Compra entradas y reserva hotel en el mismo lugar."
        canonical="/"
        keywords="conciertos españa, festivales españa, entradas conciertos, hoteles eventos"
        jsonLd={jsonLd}
      />
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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : featuredEvents && featuredEvents.length > 0 ? (
              featuredEvents.map((event: any, index: number) => (
                <EventCard key={event.id} event={event} priority={index < 4} />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            )}
          </div>
        </section>

        {/* Próximos Festivales - moved up */}
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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : festivals && festivals.length > 0 ? (
              festivals.slice(0, 8).map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="text-muted-foreground col-span-4">No hay festivales próximos</p>
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
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
              ) : cityEvents[city] && cityEvents[city].length > 0 ? (
                cityEvents[city].map((event: any) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              concerts.slice(0, 6).map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))
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
              eventsWithHotels.map((event: any) => (
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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              destinations.map((destination: any) => (
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
                        loading="lazy"
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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              artists.map((artist: any) => (
                <Link
                  key={artist.attraction_id}
                  to={`/conciertos/${artist.attraction_slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={artist.sample_image_url || "/placeholder.svg"}
                        alt={artist.attraction_name || "Artista"}
                        loading="lazy"
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
            <Link to="/generos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))
            ) : (
              genres.map((genre: any) => (
                <Link
                  key={genre.genre_id}
                  to={`/generos/${encodeURIComponent(genre.genre_name || '')}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-48 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      {genre.sample_image_url ? (
                        <img
                          src={genre.sample_image_url}
                          alt={genre.genre_name || "Género"}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/20 via-accent/10 to-background" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-xl font-bold text-white mb-1">{genre.genre_name}</h3>
                        <p className="text-white/80 text-sm">{genre.event_count} eventos</p>
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
    </>
  );
};

export default Index;