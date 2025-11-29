import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Destinos from "./pages/Destinos";
import DestinoDetalle from "./pages/DestinoDetalle";
import Musica from "./pages/Musica";
import GeneroDetalle from "./pages/GeneroDetalle";
import Artistas from "./pages/Artistas";
import ArtistaDetalle from "./pages/ArtistaDetalle";
import Eventos from "./pages/Eventos";
import Producto from "./pages/Producto";
import Favoritos from "./pages/Favoritos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/destinos" element={<Destinos />} />
          <Route path="/destinos/:destino" element={<DestinoDetalle />} />
          <Route path="/musica" element={<Musica />} />
          <Route path="/musica/:genero" element={<GeneroDetalle />} />
          <Route path="/artistas" element={<Artistas />} />
          <Route path="/artista/:slug" element={<ArtistaDetalle />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/producto/:slug" element={<Producto />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
