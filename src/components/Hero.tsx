import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, MapPin, Ticket } from "lucide-react";
import heroImage from "@/assets/hero-festival.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Hero = () => {
  const [eventSearch, setEventSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (eventSearch) {
      navigate(`/eventos?search=${encodeURIComponent(eventSearch)}&city=${encodeURIComponent(citySearch)}`);
    }
  };

  return (
    <section className="relative min-h-[750px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Festival atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center pt-32 pb-20">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 text-white tracking-tight">
            TU ESPECTÁCULO,{" "}
            <span className="text-accent">TU ESTANCIA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Ahorra en grande y quédate cerca: reserva tu próxima aventura hoy con Feelomove+
          </p>
        </div>

        {/* Tabs for Entrada + Hotel / Solo Hotel */}
        <div className="max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: "150ms" }}>
          <Tabs defaultValue="package" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-black/40 border border-white/10">
              <TabsTrigger 
                value="package" 
                className="data-[state=active]:bg-accent data-[state=active]:text-background text-white font-semibold"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Entrada + Hotel
              </TabsTrigger>
              <TabsTrigger 
                value="hotel" 
                className="data-[state=active]:bg-accent data-[state=active]:text-background text-white font-semibold"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ofertas De Hotel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="package" className="space-y-6">
              {/* Two-field search bar */}
              <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar recintos, eventos, artistas o equi..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Todas las ciudades"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-14 px-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-base rounded-xl"
                >
                  Buscar
                </Button>
              </div>

              {/* 3 Steps Section */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white/90 text-sm mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background font-bold">
                    1
                  </div>
                  <span className="font-medium">Busque su evento</span>
                </div>
                <div className="hidden md:block w-8 h-px bg-white/30" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background font-bold">
                    2
                  </div>
                  <span className="font-medium">Seleccione sus entradas y su hotel</span>
                </div>
                <div className="hidden md:block w-8 h-px bg-white/30" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background font-bold">
                    3
                  </div>
                  <span className="font-medium">¡Haga el pago y guarde!</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hotel" className="space-y-6">
              {/* Two-field search bar for hotels */}
              <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar eventos o destinos..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/destinos')}
                    className="pl-12 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Todas las ciudades"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/destinos')}
                    className="pl-12 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                <Button
                  onClick={() => navigate('/destinos')}
                  className="h-14 px-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-base rounded-xl"
                >
                  Buscar
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/eventos")}
              className="bg-[#121212] border-accent text-accent hover:bg-accent hover:text-[#121212] transition-all font-semibold"
            >
              Todos los eventos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/artistas")}
              className="bg-[#121212] border-accent text-accent hover:bg-accent hover:text-[#121212] transition-all font-semibold"
            >
              Ver artistas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/musica")}
              className="bg-[#121212] border-accent text-accent hover:bg-accent hover:text-[#121212] transition-all font-semibold"
            >
              Explorar géneros
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
