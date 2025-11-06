import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Calendar, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-festival.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Festival atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center pt-24 pb-16">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
          Vive la Música
          <br />
          Duerme con Estilo
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
          Descubre conciertos y festivales increíbles con alojamiento perfecto incluido
        </p>

        {/* Search Box */}
        <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-2xl p-4 md:p-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="¿Dónde quieres ir?"
                className="pl-10 h-12 bg-background"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="¿Cuándo?"
                type="date"
                className="pl-10 h-12 bg-background"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Artista o festival"
                className="pl-10 h-12 bg-background"
              />
            </div>
          </div>
          <Button variant="hero" size="lg" className="w-full h-12">
            <Search className="mr-2 h-5 w-5" />
            Buscar Eventos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
