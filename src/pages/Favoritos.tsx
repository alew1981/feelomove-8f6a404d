import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { getEventUrl } from "@/lib/eventUtils";

const Favoritos = () => {
  const { favorites, removeFavorite } = useFavorites();

  // Get first favorite image for hero
  const heroImage = favorites.length > 0 ? favorites[0].image_url : undefined;

  return (
    <>
      <SEOHead
        title="Mis Favoritos - Eventos Guardados"
        description="Tus conciertos y festivales favoritos guardados. Accede rápidamente a los eventos que más te interesan."
        canonical="/favoritos"
        keywords="favoritos, eventos guardados, conciertos favoritos"
        pageType="CollectionPage"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          {/* Hero Image */}
          <PageHero 
            title="Mis Eventos Favoritos" 
            imageUrl={heroImage || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920"} 
          />
        
        <div className="mb-8">
          <p className="text-muted-foreground">
            {favorites.length === 0 
              ? "No tienes eventos favoritos guardados"
              : `Tienes ${favorites.length} ${favorites.length === 1 ? 'evento favorito' : 'eventos favoritos'}`
            }
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No hay favoritos aún</h2>
              <p className="text-muted-foreground mb-6">
                Explora eventos y añade tus favoritos haciendo clic en el corazón
              </p>
              <Button asChild>
                <Link to="/eventos">Explorar Eventos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.event_id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className="relative">
                  {favorite.image_url && (
                    <img
                      src={favorite.image_url}
                      alt={favorite.event_name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeFavorite(favorite.event_id)}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{favorite.event_name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <time dateTime={favorite.event_date}>
                        {new Date(favorite.event_date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    <address className="flex items-center gap-2 not-italic">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      <span>{favorite.venue_city || 'Por confirmar'}</span>
                    </address>
                  </div>
                  <Button asChild className="w-full">
                    <Link to={getEventUrl(favorite.event_slug, favorite.is_festival)}>
                      Ver Detalles
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Favoritos;
