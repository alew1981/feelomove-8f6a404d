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
  // Fetch upcoming events (Próximamente)
  const { data: upcomingEvents, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch featured events (Destacados - events with hotel offers)
  const { data: featuredEvents, isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("*")
        .eq("has_hotel_offers", true)
        .gte("event_date", new Date().toISOString())
        .order("hotels_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch top destinations (cities with most events)
  const { data: topDestinations, isLoading: destinationsLoading } = useQuery({
    queryKey: ["top-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("venue_city, image_standard_url")
        .gte("event_date", new Date().toISOString())
        .not("venue_city", "is", null);
      
      if (error) throw error;

      // Count events per city and get image
      const cityCounts = (data || []).reduce((acc: any, event: any) => {
        const city = event.venue_city;
        if (!acc[city]) {
          acc[city] = { count: 0, image: event.image_standard_url };
        }
        acc[city].count++;
        return acc;
      }, {});

      // Convert to array and sort
      const cities = Object.entries(cityCounts)
        .map(([city, data]: any) => ({
          city,
          count: data.count,
          image: data.image
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      return cities;
    }
  });

  // Fetch top artists (artists with most events)
  const { data: topArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ["top-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("attraction_names, image_standard_url")
        .gte("event_date", new Date().toISOString())
        .not("attraction_names", "is", null);
      
      if (error) throw error;

      // Count events per artist
      const artistCounts = (data || []).reduce((acc: any, event: any) => {
        const artists = event.attraction_names || [];
        artists.forEach((artist: string) => {
          if (!acc[artist]) {
            acc[artist] = { count: 0, image: event.image_standard_url };
          }
          acc[artist].count++;
        });
        return acc;
      }, {});

      // Convert to array and sort
      const artists = Object.entries(artistCounts)
        .map(([artist, data]: any) => ({
          artist,
          count: data.count,
          image: data.image
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      return artists;
    }
  });

  // Fetch top genres (subcategories with most events)
  const { data: topGenres, isLoading: genresLoading } = useQuery({
    queryKey: ["top-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_events_with_hotels")
        .select("categories, image_standard_url")
        .gte("event_date", new Date().toISOString())
        .not("categories", "is", null);
      
      if (error) throw error;

      // Count events per genre
      const genreCounts = (data || []).reduce((acc: any, event: any) => {
        const categories = event.categories || [];
        categories.forEach((cat: any) => {
          const subcategories = cat.subcategories || [];
          subcategories.forEach((sub: any) => {
            const name = sub.name;
            if (!acc[name]) {
              acc[name] = { count: 0, image: event.image_standard_url };
            }
            acc[name].count++;
          });
        });
        return acc;
      }, {});

      // Convert to array and sort
      const genres = Object.entries(genreCounts)
        .map(([genre, data]: any) => ({
          genre,
          count: data.count,
          image: data.image
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      return genres;
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
            {upcomingLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              upcomingEvents
                ?.filter(event => 
                  event.event_badges?.some((badge: string) => 
                    badge.toLowerCase().includes('concert')
                  )
                )
                .slice(0, 4)
                .map((event: any) => (
                  <EventCard key={event.event_id} event={event} />
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
            {upcomingLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              upcomingEvents
                ?.filter(event => 
                  event.event_badges?.some((badge: string) => 
                    badge.toLowerCase().includes('festival')
                  )
                )
                .slice(0, 4)
                .map((event: any) => (
                  <EventCard key={event.event_id} event={event} />
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
            <Link to="/eventos" className="text-accent hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredLoading ? (
              Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : (
              featuredEvents?.map((event: any) => (
                <EventCard key={event.event_id} event={event} />
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
              topDestinations?.map((destination: any) => (
                <Link
                  key={destination.city}
                  to={`/destinos/${destination.city.toLowerCase()}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={destination.image || "/placeholder.svg"}
                        alt={destination.city}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{destination.city}</h3>
                        <Badge className="bg-accent text-brand-black">
                          {destination.count} eventos
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
              topArtists?.map((artist: any) => (
                <Link
                  key={artist.artist}
                  to={`/artistas?artist=${encodeURIComponent(artist.artist)}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={artist.image || "/placeholder.svg"}
                        alt={artist.artist}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{artist.artist}</h3>
                        <Badge className="bg-accent text-brand-black">
                          {artist.count} eventos
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
              topGenres?.map((genre: any) => (
                <Link
                  key={genre.genre}
                  to={`/musica/${genre.genre.toLowerCase()}`}
                  className="group block"
                >
                  <Card className="overflow-hidden h-64 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-accent/20">
                    <div className="relative h-full">
                      <img
                        src={genre.image || "/placeholder.svg"}
                        alt={genre.genre}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{genre.genre}</h3>
                        <Badge className="bg-accent text-brand-black">
                          {genre.count} eventos
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
