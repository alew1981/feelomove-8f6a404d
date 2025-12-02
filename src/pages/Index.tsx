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
  // Fetch concerts from mv_concerts_cards
  const { data: concerts, isLoading: concertsLoading } = useQuery({
    queryKey: ["homepage-concerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_concerts_cards")
        .select("*")
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch festivals from mv_festivals_cards
  const { data: festivals, isLoading: festivalsLoading } = useQuery({
    queryKey: ["homepage-festivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_festivals_cards")
        .select("*")
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch all events for "Eventos con Hotel" section
  const { data: eventsWithHotels, isLoading: eventsLoading } = useQuery({
    queryKey: ["homepage-events-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_events_cards")
        .select("*")
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch destinations from mv_destinations_cards
  const { data: destinations, isLoading: destinationsLoading } = useQuery({
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

  // Fetch artists from mv_artists_cards
  const { data: artists, isLoading: artistsLoading } = useQuery({
    queryKey: ["homepage-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_artists_cards")
        .select("*")
        .order("upcoming_events_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch genres from mv_genres_cards
  const { data: genres, isLoading: genresLoading } = useQuery({
    queryKey: ["homepage-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mv_genres_cards")
        .select("*")
        .order("event_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
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
            {concertsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              concerts?.map((event: any) => (
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
            <Link to="/festivales" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {festivalsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              festivals?.map((event: any) => (
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
            <Link to="/conciertos" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              eventsWithHotels?.map((event: any) => (
                <EventCard key={event.id} event={event} />
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
            {destinationsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              destinations?.map((destination: any) => (
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
            {artistsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              artists?.map((artist: any) => (
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
            {genresLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-muted" />
              ))
            ) : (
              genres?.map((genre: any) => (
                <Link
                  key={genre.genre_id}
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
