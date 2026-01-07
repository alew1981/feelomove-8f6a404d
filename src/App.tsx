import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load all pages except Index for faster initial load
const About = lazy(() => import("./pages/About"));
const Destinos = lazy(() => import("./pages/Destinos"));
const DestinoDetalle = lazy(() => import("./pages/DestinoDetalle"));
const Generos = lazy(() => import("./pages/Musica"));
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

// Lazy load redirect components
const RedirectProducto = lazy(() => import("./components/RedirectProducto"));
const RedirectEvento = lazy(() => import("./components/RedirectEvento"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: 1,
      // Stale-while-revalidate: show cached data immediately, fetch in background
      refetchOnMount: 'always',
      networkMode: 'offlineFirst',
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

// Loading fallback component with shimmer effect - matches actual page structure
const PageLoader = () => (
  <div className="min-h-screen bg-background">
    {/* Navbar skeleton */}
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="hidden md:flex gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
    
    {/* Hero skeleton */}
    <div className="pt-16">
      <Skeleton className="h-64 w-full" />
    </div>
    
    {/* Content skeleton */}
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full max-w-2xl mb-8" />
      
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Page wrapper with transition animation
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
};

// Redirect components for old URLs (301 redirects)
const RedirectMusica = () => <Navigate to="/generos" replace />;
const RedirectMusicaGenero = () => {
  const { genero } = useParams();
  return <Navigate to={`/generos/${genero}`} replace />;
};

// Redirect legacy/malformed genre URLs that include extra path segments, e.g. /generos/Hard%20Rock/Metal
// We collapse the extra segments into a single slug: hard-rock-metal
const RedirectGeneroCatchAll = () => {
  const params = useParams();
  const splat = (params["*"] ?? "") as string;
  const normalized = splat
    .split("/")
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return <Navigate to={`/generos/${normalized}`} replace />;
};

const RedirectArtista = () => {
  const { slug } = useParams();
  return <Navigate to={`/conciertos/${slug}`} replace />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <PageWrapper>
              <Routes>
                {/* Static routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/destinos" element={<Destinos />} />
                <Route path="/destinos/:destino" element={<DestinoDetalle />} />
                <Route path="/generos" element={<Generos />} />
                <Route path="/generos/:genero" element={<GeneroDetalle />} />
                {/* Catch malformed legacy genre URLs that contain extra segments */}
                <Route path="/generos/*" element={<RedirectGeneroCatchAll />} />
                <Route path="/artistas" element={<Artistas />} />
                <Route path="/conciertos/:artistSlug" element={<ArtistaDetalle />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/conciertos" element={<Conciertos />} />
                <Route path="/festivales" element={<Festivales />} />
                <Route path="/festivales/:festivalSlug" element={<FestivalDetalle />} />
                <Route path="/favoritos" element={<Favoritos />} />
                
                {/* New SEO-friendly event routes */}
                <Route path="/concierto/:slug" element={<Producto />} />
                <Route path="/festival/:slug" element={<Producto />} />
                
                {/* Legacy URL redirects (301) */}
                <Route path="/producto/:slug" element={<RedirectProducto />} />
                <Route path="/evento/:slug" element={<RedirectEvento />} />
                <Route path="/musica" element={<RedirectMusica />} />
                <Route path="/musica/:genero" element={<RedirectMusicaGenero />} />
                <Route path="/artista/:slug" element={<RedirectArtista />} />
                
                {/* Dedicated 404 route for tracking */}
                <Route path="/404" element={<NotFound />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageWrapper>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
