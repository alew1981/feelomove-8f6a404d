import { useEffect, lazy, Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useInstantSEO } from "@/hooks/useInstantSEO";
import SeoFallbackLinks from "@/components/SeoFallbackLinks";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Lazy load Radix-heavy UI components to reduce initial JS execution time
// These are not critical for first paint
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));

// Lazy load Index to defer Radix bundle loading
const Index = lazy(() => import("./pages/Index"));

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
const ConciertosSlugRouter = lazy(() => import("./pages/ConciertosSlugRouter"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Inspiration = lazy(() => import("./pages/Inspiration"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load redirect components (legacy URL support only)
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

// Hook to defer non-critical UI components until user interaction
// This reduces main-thread work by not loading Radix/sonner bundle during initial render
const useInteractionDeferred = () => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (isReady) return;
    
    const activate = () => {
      setIsReady(true);
      // Remove all listeners once activated
      events.forEach(evt => window.removeEventListener(evt, activate, { capture: true }));
    };
    
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];
    events.forEach(evt => 
      window.addEventListener(evt, activate, { passive: true, capture: true, once: true })
    );
    
    // Fallback: load after 4s if no interaction (for automated tools/bots)
    const fallback = setTimeout(activate, 4000);
    
    return () => {
      clearTimeout(fallback);
      events.forEach(evt => window.removeEventListener(evt, activate, { capture: true }));
    };
  }, [isReady]);
  
  return isReady;
};

// Scroll to top on route change + inject instant SEO + inject event links for crawlers
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  // CRITICAL: Inject SEO tags instantly from URL before Supabase loads
  useInstantSEO();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  // SEO: Inject dynamic event links into #seo-fallback for crawler discovery
  return <SeoFallbackLinks />;
};

// CSS-only loading fallback - no Radix/Skeleton dependency for faster initial load
const PageLoader = () => (
  <div className="min-h-screen bg-background">
    {/* Navbar skeleton - pure CSS */}
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="hidden md:flex gap-6">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
    
    {/* Hero skeleton - pure CSS */}
    <div className="pt-16">
      <div className="h-64 w-full bg-muted animate-pulse" />
    </div>
    
    {/* Content skeleton - pure CSS */}
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 mb-4 bg-muted rounded animate-pulse" />
      <div className="h-4 w-full max-w-2xl mb-8 bg-muted rounded animate-pulse" />
      
      {/* Cards grid skeleton - pure CSS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-56 w-full rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
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

// Deferred Radix providers wrapper - loads only after user interaction
const DeferredProviders = () => {
  const isReady = useInteractionDeferred();
  
  if (!isReady) return null;
  
  return (
    <Suspense fallback={null}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/* Deferred load Radix providers - reduces TBT by ~900ms */}
        <BrowserRouter>
        <LanguageProvider>
        <DeferredProviders />
        <ScrollToTop />
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
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/conciertos" element={<Conciertos />} />
                <Route path="/conciertos/:slug" element={<ConciertosSlugRouter />} />
                <Route path="/festivales" element={<Festivales />} />
                {/* Single festival event pages - uses Producto for event_slug format */}
                <Route path="/festivales/:slug" element={<Producto />} />
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/inspiration" element={<Inspiration />} />

                {/* EN routes - same components, locale detected from URL */}
                <Route path="/en" element={<Index />} />
                <Route path="/en/tickets" element={<Conciertos />} />
                <Route path="/en/tickets/:slug" element={<ConciertosSlugRouter />} />
                <Route path="/en/festivals" element={<Festivales />} />
                <Route path="/en/festivals/:slug" element={<Producto />} />
                <Route path="/en/destinations" element={<Destinos />} />
                <Route path="/en/destinations/:destino" element={<DestinoDetalle />} />
                <Route path="/en/artists" element={<Artistas />} />
                <Route path="/en/favorites" element={<Favoritos />} />
                <Route path="/en/inspiration" element={<Inspiration />} />
                <Route path="/en/about" element={<About />} />
                
                {/* Legacy singular routes - redirect to plural for SEO */}
                <Route path="/concierto" element={<RedirectToConciertos />} />
                <Route path="/concierto/:slug" element={<Producto />} />
                <Route path="/festival" element={<Navigate to="/festivales" replace />} />
                <Route path="/festival/:slug" element={<Producto />} />
                
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
        </LanguageProvider>
        </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
