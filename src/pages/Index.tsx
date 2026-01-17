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

  // Fetch artists with graceful MV error handling
  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ["home-artists"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('mv_attractions')
          .select('*')
          .order('event_count', { ascending: false })
          .limit(4);
        
        if (error) {
          console.warn('mv_attractions unavailable (MV may be refreshing):', error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn('Error fetching home artists:', error);
        return [];
      }
    },
    retry: 1,
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

  // City events - ensure minimum of 4 events for Valencia and Sevilla
  const cityEvents: Record<string, any[]> = {};
  FEATURED_CITIES.forEach(city => {
    const cityEventsList = allEvents
      .filter(e => e.venue_city?.toLowerCase() === city.toLowerCase())
      .slice(0, 4);
    
    // If Valencia or Sevilla have fewer than 4 events, fill with other upcoming events
    if ((city === 'Valencia' || city === 'Sevilla') && cityEventsList.length < 4) {
      const remaining = allEvents
        .filter(e => !cityEventsList.includes(e))
        .slice(0, 4 - cityEventsList.length);
      cityEvents[city] = [...cityEventsList, ...remaining];
    } else {
      cityEvents[city] = cityEventsList;
    }
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
        title="Entradas Conciertos y Festivales España 2025"
        description="Compra entradas para conciertos y festivales en España 2025. Reserva hotel cerca del evento y ahorra. ¡Descubre los mejores eventos ahora!"
        canonical="https://feelomove.com/"
        keywords="entradas conciertos españa, festivales españa 2025, hoteles para festivales, transporte conciertos, logística eventos musicales"
        jsonLd={jsonLd}
        ogImage="https://feelomove.com/og-image.jpg"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* H1 estático para SEO - visible para rastreadores */}
        <h1 className="sr-only">FEELOMOVE+ | Entradas Conciertos, Festivales y Hoteles en España</h1>
        
        <Hero />

      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Feelomove + love - Featured Events */}
        <section aria-labelledby="featured-heading">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="featured-heading" className="text-3xl font-bold mb-1 flex items-center gap-2">
                Eventos Destacados
                <Heart className="h-5 w-5 text-accent fill-accent" aria-hidden="true" />
              </h2>
              <p className="text-muted-foreground">Los conciertos y festivales más populares de 2025</p>
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
        <section aria-labelledby="festivals-heading">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="festivals-heading" className="text-3xl font-bold mb-2">Festivales de Música en España</h2>
              <p className="text-muted-foreground">Los mejores festivales con hoteles cerca del recinto</p>
            </div>
            <Link to="/festivales" className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label="Ver todos los festivales de música">
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
          <section key={city} aria-labelledby={`city-${city.toLowerCase()}-heading`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 id={`city-${city.toLowerCase()}-heading`} className="text-3xl font-bold mb-2">Conciertos y Festivales en {city}</h2>
                <p className="text-muted-foreground">Entradas y hoteles para eventos en {city}</p>
              </div>
              <Link to={`/destinos/${city.toLowerCase().replace(/\s+/g, '-')}`} className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label={`Ver todos los eventos en ${city}`}>
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
        <section aria-labelledby="concerts-heading">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="concerts-heading" className="text-3xl font-bold mb-2">Conciertos en España 2025</h2>
              <p className="text-muted-foreground">Compra entradas para los conciertos más esperados</p>
            </div>
            <Link to="/conciertos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label="Ver todos los conciertos en España">
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
        <section aria-labelledby="hotels-heading">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="hotels-heading" className="text-3xl font-bold mb-2">Hoteles para Festivales y Conciertos</h2>
              <p className="text-muted-foreground">Paquetes de entradas + alojamiento cerca del evento</p>
            </div>
            <Link to="/conciertos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label="Ver paquetes de eventos con hotel">
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
        <section aria-labelledby="destinations-heading">
          <div className="flex items-center justify-between mb-8">
            <h2 id="destinations-heading" className="text-3xl font-bold">Ciudades con Eventos Musicales</h2>
            <Link to="/destinos" className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label="Ver todos los destinos con eventos">
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
                  to={`/destinos/${destination.city_slug || encodeURIComponent((destination.city_name || '').toLowerCase().replace(/\s+/g, '-'))}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={destination.sample_image_url || "/placeholder.svg"}
                        alt={`Conciertos y festivales en ${destination.city_name} - ${destination.event_count} eventos disponibles`}
                        loading="lazy"
                        width={400}
                        height={256}
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
        <section aria-labelledby="artists-heading">
          <div className="flex items-center justify-between mb-8">
            <h2 id="artists-heading" className="text-3xl font-bold">Artistas en Gira por España</h2>
            <Link to="/artistas" className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label="Ver todos los artistas con conciertos">
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
                        alt={`${artist.attraction_name} - ${artist.event_count} conciertos en España`}
                        loading="lazy"
                        width={400}
                        height={256}
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
        <section aria-labelledby="genres-heading">
          <div className="flex items-center justify-between mb-8">
            <h2 id="genres-heading" className="text-3xl font-bold">Géneros Musicales</h2>
            <Link to="/musica" className="text-foreground hover:text-accent hover:underline font-medium transition-colors" aria-label="Explorar todos los géneros musicales">
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
                          alt={`Eventos de ${genre.genre_name} - ${genre.event_count} conciertos y festivales`}
                          loading="lazy"
                          width={400}
                          height={192}
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

        {/* SEO Content Section - Contenido para eliminar Thin Content */}
        <section className="mt-20 pt-16 pb-8 border-t border-border bg-muted/30" aria-labelledby="seo-content-heading">
          <div className="max-w-4xl mx-auto">
            <h2 id="seo-content-heading" className="text-2xl md:text-3xl font-bold mb-8 text-foreground">
              La forma más inteligente de vivir la música en España
            </h2>
            <div className="space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
              <p>
                En <strong className="text-foreground">FEELOMOVE+</strong> redefinimos la <strong>gestión de movilidad</strong> para 
                que tu única preocupación sea disfrutar del espectáculo. Somos especialistas en conectar a los amantes de la música 
                con los eventos más importantes del país, ofreciendo una solución integral que combina el transporte eficiente 
                con el acceso a los mejores recintos.
              </p>
              <p>
                Entendemos que asistir a un gran evento requiere planificación. Por ello, no solo facilitamos la compra de 
                <strong className="text-foreground"> entradas para conciertos y festivales</strong> en toda España, sino que 
                gestionamos el <strong>alojamiento para eventos</strong> de manera estratégica, seleccionando hoteles cercanos 
                a los recintos para reducir tiempos de desplazamiento.
              </p>
              <p>
                Desde la reserva de <strong>hoteles para festivales</strong> hasta soluciones personalizadas de 
                <strong> transporte para conciertos</strong>, en FEELOMOVE+ trabajamos para que la movilidad sea sostenible, 
                segura y puntual. Descubre la forma más inteligente de viajar a tus eventos musicales favoritos en 2025.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      </div>
    </>
  );
};

export default Index;