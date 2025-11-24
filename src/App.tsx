import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Destinos from "./pages/Destinos";
import Generos from "./pages/Generos";
import Artistas from "./pages/Artistas";
import Categorias from "./pages/Categorias";
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
          <Route path="/generos" element={<Generos />} />
          <Route path="/artistas" element={<Artistas />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categorias/:categoryId" element={<Categorias />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/producto/:id" element={<Producto />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
