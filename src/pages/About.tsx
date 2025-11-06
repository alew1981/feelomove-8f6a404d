import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Music, Hotel, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Sobre FestiStay
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Conectamos la pasión por la música con experiencias de alojamiento inolvidables
            </p>
          </div>

          {/* Mission */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6">Nuestra Misión</h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-4">
                En FestiStay, creemos que cada experiencia musical merece el alojamiento perfecto. 
                Somos una plataforma que simplifica la búsqueda de eventos musicales y la reserva de 
                hoteles cercanos, todo en un solo lugar.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Trabajamos con los mejores partners de la industria musical y hotelera para ofrecerte 
                opciones curadas que se adaptan a tu estilo y presupuesto.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8 bg-card rounded-xl border-2 border-border hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Pasión Musical</h3>
              <p className="text-muted-foreground">
                Seleccionamos los mejores festivales y conciertos para que vivas experiencias únicas
              </p>
            </div>

            <div className="text-center p-8 bg-card rounded-xl border-2 border-border hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-6">
                <Hotel className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Comodidad Garantizada</h3>
              <p className="text-muted-foreground">
                Alojamientos verificados cerca de tus eventos favoritos para máximo confort
              </p>
            </div>

            <div className="text-center p-8 bg-card rounded-xl border-2 border-border hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-6">
                <Heart className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-4">Experiencia Total</h3>
              <p className="text-muted-foreground">
                Simplificamos tu búsqueda para que solo te preocupes de disfrutar
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Nuestro Equipo</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Somos un equipo apasionado de amantes de la música y viajeros que entienden 
              la importancia de una buena planificación para vivir experiencias inolvidables.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
