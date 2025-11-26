import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import heroImage from "@/assets/hero-festival.jpg";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery) {
      navigate(`/eventos?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Festival atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/90 via-[#121212]/80 to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center pt-32 pb-20">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white tracking-tight">
            TU ESPECTÁCULO,{" "}
            <span className="text-[#00FF8F]">TU ESTANCIA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto font-medium">
            Ahorra en grande y quédate cerca: reserva tu próxima aventura hoy con Feelomove+
          </p>
        </div>

        {/* Simplified Search Bar */}
        <div className="max-w-3xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#121212]/60" />
              <Input
                placeholder="Buscar eventos, artistas o ciudades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-16 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-[#121212] placeholder:text-[#121212]/50"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="h-16 px-12 bg-[#00FF8F] hover:bg-[#00FF8F]/90 text-[#121212] font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* 3 Steps Storytelling */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-white animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex flex-col items-center gap-3 max-w-[200px]">
            <div className="w-16 h-16 rounded-full bg-[#00FF8F] flex items-center justify-center text-[#121212] font-black text-2xl shadow-lg">
              1
            </div>
            <span className="font-bold text-base text-center uppercase tracking-wide">Busca tu evento</span>
          </div>
          <div className="hidden md:block w-12 h-1 bg-[#00FF8F]/50 rounded-full" />
          <div className="flex flex-col items-center gap-3 max-w-[200px]">
            <div className="w-16 h-16 rounded-full bg-[#00FF8F] flex items-center justify-center text-[#121212] font-black text-2xl shadow-lg">
              2
            </div>
            <span className="font-bold text-base text-center uppercase tracking-wide">Selecciona tus entradas y hotel</span>
          </div>
          <div className="hidden md:block w-12 h-1 bg-[#00FF8F]/50 rounded-full" />
          <div className="flex flex-col items-center gap-3 max-w-[200px]">
            <div className="w-16 h-16 rounded-full bg-[#00FF8F] flex items-center justify-center text-[#121212] font-black text-2xl shadow-lg">
              3
            </div>
            <span className="font-bold text-base text-center uppercase tracking-wide">Disfruta de la música</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
