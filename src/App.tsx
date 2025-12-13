import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all pages except Index for faster initial load
const About = lazy(() => import("./pages/About"));
const Destinos = lazy(() => import("./pages/Destinos"));
const DestinoDetalle = lazy(() => import("./pages/DestinoDetalle"));
const Musica = lazy(() => import("./pages/Musica"));
const GeneroDetalle = lazy(() => import("./pages/GeneroDetalle"));
const Artistas = lazy(() => import("./pages/Artistas"));
const ArtistaDetalle = lazy(() => import("./pages/ArtistaDetalle"));
const Eventos = lazy(() => import("./pages/Eventos"));
const Conciertos = lazy(() => import("./pages/Conciertos"));
const Festivales = lazy(() => import("./pages/Festivales"));
const FestivalDetalle = lazy(() => import("./pages/FestivalDetalle"));
const Producto = lazy(() => import("./pages/Producto"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/conciertos" element={<Conciertos />} />
            <Route path="/festivales" element={<Festivales />} />
            <Route path="/festivales/:festivalSlug" element={<FestivalDetalle />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/producto/:slug" element={<Producto />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
