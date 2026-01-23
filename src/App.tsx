import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
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
const RedirectLegacyEvent = lazy(() => import("./components/RedirectLegacyEvent"));

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

// Normalize accidental double (or more) slashes in paths: "//concierto/..." -> "/concierto/..."
// This prevents React Router from missing route matches and showing 404.
const NormalizePath = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedPathname = location.pathname.replace(/\/{2,}/g, "/");
    if (normalizedPathname !== location.pathname) {
      navigate(
        `${normalizedPathname}${location.search ?? ""}${location.hash ?? ""}`,
        { replace: true }
      );
    }
  }, [location.pathname, location.search, location.hash, navigate]);

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
// Genres now redirect to /conciertos
const RedirectMusica = () => <Navigate to="/conciertos" replace />;
const RedirectMusicaGenero = () => <Navigate to="/conciertos" replace />;
const RedirectGeneros = () => <Navigate to="/conciertos" replace />;
const RedirectGenerosSlug = () => <Navigate to="/conciertos" replace />;

// Redirect legacy/malformed genre URLs
const RedirectGeneroCatchAll = () => <Navigate to="/conciertos" replace />;

const RedirectArtista = () => {
  const { slug } = useParams();
  return <Navigate to={`/conciertos/${slug}`} replace />;
};

// Redirect legacy WordPress URLs to appropriate pages
const RedirectToHome = () => <Navigate to="/" replace />;
const RedirectToAbout = () => <Navigate to="/about" replace />;
const RedirectToConciertos = () => <Navigate to="/conciertos" replace />;

// Redirect legacy /events/:id URLs (WordPress numeric IDs)
const RedirectLegacyEvents = () => <Navigate to="/conciertos" replace />;

// Redirect malformed destination URLs like /destinos/pamplona/iruña
const RedirectDestinoMalformed = () => {
  const { destino } = useParams();
  return <Navigate to={`/destinos/${destino}`} replace />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <NormalizePath />
          <Suspense fallback={<PageLoader />}>
            <PageWrapper>
              <Routes>
                {/* Static routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/destinos" element={<Destinos />} />
                <Route path="/destinos/:destino" element={<DestinoDetalle />} />
                {/* Genre routes now redirect to conciertos */}
                <Route path="/generos" element={<RedirectGeneros />} />
                <Route path="/generos/:genero" element={<RedirectGenerosSlug />} />
                <Route path="/generos/*" element={<RedirectGeneroCatchAll />} />
                <Route path="/artistas" element={<Artistas />} />
                <Route path="/conciertos/:artistSlug" element={<ArtistaDetalle />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/conciertos" element={<Conciertos />} />
                <Route path="/festivales" element={<Festivales />} />
                <Route path="/festivales/:festivalSlug" element={<FestivalDetalle />} />
                <Route path="/favoritos" element={<Favoritos />} />
                
                {/* SEO-friendly event routes - handles both new and legacy URLs */}
                <Route path="/concierto" element={<RedirectToConciertos />} />
                <Route path="/concierto/:slug" element={<RedirectLegacyEvent />} />
                <Route path="/festival" element={<Navigate to="/festivales" replace />} />
                <Route path="/festival/:slug" element={<RedirectLegacyEvent />} />
                
                {/* Legacy URL redirects (301) */}
                <Route path="/producto/:slug" element={<RedirectProducto />} />
                <Route path="/evento/:slug" element={<RedirectEvento />} />
                <Route path="/musica" element={<RedirectMusica />} />
                <Route path="/musica/:genero" element={<RedirectMusicaGenero />} />
                <Route path="/artista/:slug" element={<RedirectArtista />} />
                
                {/* Legacy WordPress URLs - redirect to appropriate pages */}
                <Route path="/privacidad" element={<RedirectToAbout />} />
                <Route path="/cookies" element={<RedirectToAbout />} />
                <Route path="/cart" element={<RedirectToConciertos />} />
                <Route path="/cart/" element={<RedirectToConciertos />} />
                <Route path="/my-account" element={<RedirectToHome />} />
                <Route path="/my-account/" element={<RedirectToHome />} />
                <Route path="/wp-login.php" element={<RedirectToHome />} />
                <Route path="/events/:id" element={<RedirectLegacyEvents />} />
                <Route path="/product/:slug" element={<RedirectProducto />} />
                <Route path="/product/:slug/feed" element={<RedirectProducto />} />
                <Route path="/product/:slug/feed/" element={<RedirectProducto />} />
                
                {/* Malformed destination URLs */}
                <Route path="/destinos/:destino/*" element={<RedirectDestinoMalformed />} />
                
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
