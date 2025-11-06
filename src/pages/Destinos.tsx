import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const destinations = [
  { id: 1, name: "Barcelona", events: 45, image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800" },
  { id: 2, name: "Madrid", events: 38, image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800" },
  { id: 3, name: "Valencia", events: 28, image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800" },
  { id: 4, name: "Sevilla", events: 22, image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800" },
  { id: 5, name: "Bilbao", events: 19, image: "https://images.unsplash.com/photo-1544988807-ee6c7c11b633?w=800" },
  { id: 6, name: "Málaga", events: 25, image: "https://images.unsplash.com/photo-1562922294-f0f6f21bcba4?w=800" },
];

const Destinos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Explora Destinos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre los mejores festivales y conciertos en las ciudades más vibrantes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((destination) => (
              <Card 
                key={destination.id}
                className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {destination.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{destination.events} eventos disponibles</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <Button className="w-full" variant="default">
                    Ver Eventos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Destinos;
