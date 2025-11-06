import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

const genres = [
  { id: 1, name: "Electrónica", events: 89, color: "from-purple-500 to-pink-500" },
  { id: 2, name: "Rock", events: 67, color: "from-orange-500 to-red-500" },
  { id: 3, name: "Jazz", events: 34, color: "from-blue-500 to-cyan-500" },
  { id: 4, name: "Pop", events: 92, color: "from-pink-500 to-rose-500" },
  { id: 5, name: "Hip Hop", events: 45, color: "from-yellow-500 to-orange-500" },
  { id: 6, name: "Reggae", events: 28, color: "from-green-500 to-emerald-500" },
  { id: 7, name: "Metal", events: 41, color: "from-gray-700 to-gray-900" },
  { id: 8, name: "Indie", events: 56, color: "from-teal-500 to-cyan-500" },
  { id: 9, name: "Clásica", events: 23, color: "from-indigo-500 to-purple-500" },
];

const Generos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Géneros Musicales
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encuentra eventos de tu género favorito
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {genres.map((genre) => (
              <Card 
                key={genre.id}
                className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${genre.color} p-8 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                      <Music className="h-32 w-32" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 relative z-10">
                      {genre.name}
                    </h3>
                    <p className="text-white/90 relative z-10">
                      {genre.events} eventos disponibles
                    </p>
                  </div>
                  <div className="p-6">
                    <Button className="w-full" variant="default">
                      Explorar {genre.name}
                    </Button>
                  </div>
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

export default Generos;
