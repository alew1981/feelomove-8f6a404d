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

const Index = () => {
  // Fetch all events from lovable_mv_event_product_page
  const { data: allEvents, isLoading } = useQuery({
    queryKey: ["homepage-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page")
        .select("event_id, event_name, event_slug, event_date, venue_city, venue_name, image_large_url, image_standard_url, primary_attraction_id, primary_attraction_name, primary_subcategory_name, ticket_price_min, ticket_price_max, sold_out, seats_available, event_badges, is_festival")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      
      // Deduplicate by event_id
      const uniqueEvents = data?.reduce((acc: any[], event) => {
        if (!acc.find(e => e.event_id === event.event_id)) {
          acc.push(event);
        }
        return acc;
      }, []) || [];
      
      return uniqueEvents;
    }
  });

  // Process events into different categories
  const concerts = allEvents?.filter(e => !e.is_festival).slice(0, 4) || [];
  const festivals = allEvents?.filter(e => e.is_festival).slice(0, 4) || [];
  const eventsWithHotels = allEvents?.slice(0, 4) || [];

  // Extract destinations with event counts
  const destinations = (() => {
    if (!allEvents) return [];
    const cityMap = new Map<string, { city_name: string; event_count: number; sample_image_url: string }>();
    allEvents.forEach(event => {
      const city = event.venue_city;
      if (city) {
        if (!cityMap.has(city)) {
          cityMap.set(city, { city_name: city, event_count: 1, sample_image_url: event.image_large_url || '' });
        } else {
          cityMap.get(city)!.event_count++;
        }
      }
    });
    return Array.from(cityMap.values()).sort((a, b) => b.event_count - a.event_count).slice(0, 4);
  })();

  // Extract artists with event counts
  const artists = (() => {
    if (!allEvents) return [];
    const artistMap = new Map<string, any>();
    allEvents.forEach(event => {
      const id = event.primary_attraction_id;
      if (id && !artistMap.has(id)) {
        artistMap.set(id, {
          artist_id: id,
          artist_name: event.primary_attraction_name,
          artist_slug: event.primary_attraction_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          image_url: event.image_large_url,
          upcoming_events_count: 1
        });
      } else if (id) {
        artistMap.get(id).upcoming_events_count++;
      }
    });
    return Array.from(artistMap.values()).sort((a, b) => b.upcoming_events_count - a.upcoming_events_count).slice(0, 4);
  })();

  // Extract genres with event counts
  const genres = (() => {
    if (!allEvents) return [];
    const genreMap = new Map<string, { genre_name: string; event_count: number; sample_image_url: string }>();
    allEvents.forEach(event => {
      const genre = event.primary_subcategory_name;
      if (genre) {
        if (!genreMap.has(genre)) {
          genreMap.set(genre, { genre_name: genre, event_count: 1, sample_image_url: event.image_large_url || '' });
        } else {
          genreMap.get(genre)!.event_count++;
        }
      }
    });
    return Array.from(genreMap.values()).sort((a, b) => b.event_count - a.event_count).slice(0, 4);
  })();

  // Transform event for EventCard component
  const transformEvent = (event: any) => ({
    id: event.event_id,
    slug: event.event_slug,
    name: event.event_name,
    event_date: event.event_date,
    venue_city: event.venue_city,
    venue_name: event.venue_name,
    image_large_url: event.image_large_url,
    image_standard_url: event.image_standard_url,
    primary_attraction_name: event.primary_attraction_name,
    price_min_incl_fees: event.ticket_price_min,
    sold_out: event.sold_out,
    seats_available: event.seats_available,
    badges: event.event_badges
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Próximos Conciertos */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Próximos Conciertos</h2>
              <p className="text-muted-foreground">Los conciertos más esperados</p>
            </div>
            <Link to="/conciertos" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              concerts.map((event: any) => (
                <EventCard key={event.event_id} event={transformEvent(event)} />
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
            <Link to="/festivales" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : festivals.length > 0 ? (
              festivals.map((event: any) => (
                <EventCard key={event.event_id} event={transformEvent(event)} />
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
            <Link to="/conciertos" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              eventsWithHotels.map((event: any) => (
                <EventCard key={event.event_id} event={transformEvent(event)} />
              ))
            )}
          </div>
        </section>

        {/* Destinos Populares */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Destinos Populares</h2>
            <Link to="/destinos" className="text-accent hover:underline font-medium">
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
                  to={`/destinos/${encodeURIComponent(destination.city_name)}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={destination.sample_image_url || "/placeholder.svg"}
                        alt={destination.city_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{destination.city_name}</h3>
                        <Badge className="bg-accent text-brand-black">
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
            <Link to="/artistas" className="text-accent hover:underline font-medium">
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
                  key={artist.artist_id}
                  to={`/artista/${artist.artist_slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={artist.image_url || "/placeholder.svg"}
                        alt={artist.artist_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{artist.artist_name}</h3>
                        <Badge className="bg-accent text-brand-black">
                          {artist.upcoming_events_count} eventos
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
            <Link to="/musica" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              genres.map((genre: any) => (
                <Link
                  key={genre.genre_name}
                  to={`/musica/${encodeURIComponent(genre.genre_name)}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={genre.sample_image_url || "/placeholder.svg"}
                        alt={genre.genre_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{genre.genre_name}</h3>
                        <Badge className="bg-accent text-brand-black">
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
