import { useState, useMemo, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Check, ChevronDown, Map, Hotel, Compass, AlertCircle, RefreshCw } from "lucide-react";
import HotelCard from "./HotelCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HotelData {
  hotel_id: string;
  hotel_name: string;
  hotel_main_photo: string;
  hotel_description: string;
  hotel_stars: number;
  hotel_rating: number;
  hotel_reviews: number;
  price: number;
  selling_price: number;
  distance_km: number;
  facility_names_es?: string[];
}

interface HotelMapTabsProps {
  hotels: HotelData[];
  mapWidgetHtml: string | null;
  onAddHotel: (hotel: HotelData) => void;
  checkinDate?: string;
  checkoutDate?: string;
  eventName?: string;
  ticketsSelected?: boolean;
  selectedHotelId?: string | null;
  venueCity?: string;
  stay22Accommodations?: string | null;
  stay22Activities?: string | null;
}

type TabId = "hotels" | "map" | "accommodations" | "activities";

interface LoadingState {
  map: boolean;
  accommodations: boolean;
  activities: boolean;
}

interface ErrorState {
  map: boolean;
  accommodations: boolean;
  activities: boolean;
}

const HotelMapTabs = ({ 
  hotels, 
  mapWidgetHtml, 
  onAddHotel, 
  checkinDate, 
  checkoutDate, 
  eventName,
  ticketsSelected = false,
  selectedHotelId = null,
  venueCity = "",
  stay22Accommodations = null,
  stay22Activities = null,
}: HotelMapTabsProps) => {
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [activeTab, setActiveTab] = useState<TabId>("hotels");
  const [loadedIframes, setLoadedIframes] = useState<Set<TabId>>(new Set());
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    map: false,
    accommodations: false,
    activities: false,
  });
  const [errorStates, setErrorStates] = useState<ErrorState>({
    map: false,
    accommodations: false,
    activities: false,
  });
  
  const isMobile = useIsMobile();
  
  // Determine if dropdown items are active
  const isDropdownItemActive = activeTab === "accommodations" || activeTab === "activities";
  
  // Short city name for display
  const cityDisplay = venueCity || "la zona";
  
  const sortedHotels = useMemo(() => {
    const sorted = [...hotels];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => (a.selling_price || a.price || 0) - (b.selling_price || b.price || 0));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.selling_price || b.price || 0) - (a.selling_price || a.price || 0));
        break;
      case "distance-asc":
        sorted.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
        break;
      case "rating-desc":
        sorted.sort((a, b) => (b.hotel_rating || b.hotel_stars || 0) - (a.hotel_rating || a.hotel_stars || 0));
        break;
      case "stars-desc":
        sorted.sort((a, b) => (b.hotel_stars || 0) - (a.hotel_stars || 0));
        break;
    }
    return sorted;
  }, [hotels, sortBy]);

  // Handle tab change with lazy loading
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    
    // Mark iframe as loading if not already loaded
    if (tabId !== "hotels" && !loadedIframes.has(tabId)) {
      setLoadingStates(prev => ({ ...prev, [tabId]: true }));
    }
  };
  
  // Handle dropdown option selection
  const handleDropdownSelect = (tabId: TabId) => {
    handleTabChange(tabId);
  };
  
  // Handle iframe load complete
  const handleIframeLoad = (tabId: TabId) => {
    setLoadedIframes(prev => new Set(prev).add(tabId));
    setLoadingStates(prev => ({ ...prev, [tabId]: false }));
    setErrorStates(prev => ({ ...prev, [tabId]: false }));
  };
  
  // Handle iframe error
  const handleIframeError = (tabId: TabId) => {
    setLoadingStates(prev => ({ ...prev, [tabId]: false }));
    setErrorStates(prev => ({ ...prev, [tabId]: true }));
  };
  
  // Retry loading iframe
  const handleRetry = (tabId: TabId) => {
    setErrorStates(prev => ({ ...prev, [tabId]: false }));
    setLoadingStates(prev => ({ ...prev, [tabId]: true }));
    setLoadedIframes(prev => {
      const newSet = new Set(prev);
      newSet.delete(tabId);
      return newSet;
    });
  };
  
  // Loading spinner component
  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-[500px] sm:h-[600px] bg-muted/30 rounded-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
  
  // Error component
  const ErrorState = ({ onRetry, message }: { onRetry: () => void; message: string }) => (
    <div className="flex flex-col items-center justify-center h-[500px] sm:h-[600px] bg-muted/30 rounded-xl">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-foreground font-medium mb-2">{message}</p>
      <p className="text-sm text-muted-foreground mb-4">Comprueba tu conexión e inténtalo de nuevo</p>
      <Button onClick={onRetry} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
  
  // Iframe wrapper component with lazy loading
  const IframeContent = ({ 
    tabId, 
    url, 
    title 
  }: { 
    tabId: TabId; 
    url: string; 
    title: string;
  }) => {
    const shouldLoad = activeTab === tabId || loadedIframes.has(tabId);
    const isLoaded = loadedIframes.has(tabId);
    const hasError = errorStates[tabId as keyof ErrorState];
    
    // Show loading state only when we should load but haven't loaded yet
    const showLoading = shouldLoad && !isLoaded && !hasError;
    
    if (hasError) {
      return <ErrorState onRetry={() => handleRetry(tabId)} message="No se pudo cargar el contenido" />;
    }
    
    return (
      <div className="relative">
        {showLoading && (
          <div className="absolute inset-0 z-10">
            <LoadingSpinner message={`Cargando ${title.toLowerCase()}...`} />
          </div>
        )}
        {shouldLoad && (
          <iframe
            src={url}
            className={`w-full h-[500px] sm:h-[600px] lg:h-[650px] border-0 rounded-xl ${showLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            title={title}
            allow="geolocation"
            loading="lazy"
            onLoad={() => handleIframeLoad(tabId)}
          />
        )}
      </div>
    );
  };

  // Tab labels based on screen size
  const getTabLabels = () => ({
    hotels: isMobile ? "🏨 Hotel" : "🏨 Alojamiento",
    map: isMobile ? "🗺️ Mapa" : `🗺️ Mapa`,
    moreOptions: isMobile ? "⋯ Más" : "🎯 Más opciones",
    accommodations: `🌟 Hoteles en ${cityDisplay}`,
    activities: `🎯 Qué hacer en ${cityDisplay}`,
  });
  
  const labels = getTabLabels();
  
  // Check if we have any Stay22 content
  const hasMapContent = !!mapWidgetHtml;
  const hasAccommodationsContent = !!stay22Accommodations;
  const hasActivitiesContent = !!stay22Activities;
  const hasDropdownContent = hasAccommodationsContent || hasActivitiesContent;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            selectedHotelId 
              ? "bg-accent text-accent-foreground" 
              : "bg-foreground text-background"
          }`}>
            {selectedHotelId ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Completa tu pack con un hotel</h2>
            {selectedHotelId && (
              <p className="text-sm text-foreground flex items-center gap-1 mt-0.5">
                <Check className="h-3 w-3 text-accent" />
                Hotel añadido al pack
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Custom Tab Navigation */}
      <div className="w-full">
        {/* Tab List */}
        <div className="flex items-stretch border-b border-border mb-4">
          {/* Tab 1: Alojamiento */}
          <button
            onClick={() => handleTabChange("hotels")}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all duration-300 border-b-[3px] ${
              activeTab === "hotels"
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            aria-selected={activeTab === "hotels"}
            role="tab"
          >
            {labels.hotels}
          </button>
          
          {/* Tab 2: Mapa */}
          {hasMapContent && (
            <button
              onClick={() => handleTabChange("map")}
              className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all duration-300 border-b-[3px] ${
                activeTab === "map"
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              aria-selected={activeTab === "map"}
              role="tab"
            >
              {labels.map}
            </button>
          )}
          
          {/* Tab 3: Dropdown "Más opciones" */}
          {hasDropdownContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all duration-300 border-b-[3px] flex items-center justify-center gap-1.5 ${
                    isDropdownItemActive
                      ? "border-accent text-accent font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  aria-haspopup="true"
                  aria-expanded={false}
                >
                  {isDropdownItemActive && (
                    <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                  {labels.moreOptions}
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="min-w-[250px] bg-card border-2 border-border shadow-lg z-50"
              >
                {hasAccommodationsContent && (
                  <DropdownMenuItem
                    onClick={() => handleDropdownSelect("accommodations")}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      activeTab === "accommodations"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Hotel className="h-4 w-4 mr-2" />
                    {labels.accommodations}
                  </DropdownMenuItem>
                )}
                {hasActivitiesContent && (
                  <DropdownMenuItem
                    onClick={() => handleDropdownSelect("activities")}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      activeTab === "activities"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Compass className="h-4 w-4 mr-2" />
                    {labels.activities}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {/* Hotels Tab Content */}
          {activeTab === "hotels" && (
            <div>
              {hotels.length > 0 ? (
                <>
                  {/* Sorting dropdown */}
                  <div className="flex items-center justify-end mb-4">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-80 md:w-96 h-11 sm:h-12 text-sm sm:text-base border-2 border-border bg-card font-medium shadow-sm">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-2 w-full min-w-[320px] z-50">
                        <SelectItem value="price-asc" className="text-sm sm:text-base py-3">Precio (menor a mayor)</SelectItem>
                        <SelectItem value="price-desc" className="text-sm sm:text-base py-3">Precio (mayor a menor)</SelectItem>
                        <SelectItem value="distance-asc" className="text-sm sm:text-base py-3">Distancia (más cercano)</SelectItem>
                        <SelectItem value="rating-desc" className="text-sm sm:text-base py-3">Valoración (mejor puntuada)</SelectItem>
                        <SelectItem value="stars-desc" className="text-sm sm:text-base py-3">Estrellas (más estrellas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedHotels.map((hotel) => (
                      <HotelCard 
                        key={hotel.hotel_id} 
                        hotel={hotel} 
                        onAddHotel={onAddHotel}
                        checkinDate={checkinDate}
                        checkoutDate={checkoutDate}
                        eventName={eventName}
                        showTicketHint={ticketsSelected}
                        isAdded={selectedHotelId === hotel.hotel_id}
                      />
                    ))}
                  </div>
                </>
              ) : mapWidgetHtml ? (
                // Fallback: Show Stay22 map when no hotels available
                <div className="space-y-4">
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Buscar hoteles en el mapa</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Explora alojamientos cerca del evento directamente en el mapa interactivo.
                      </p>
                    </div>
                  </div>
                  <IframeContent 
                    tabId="map" 
                    url={mapWidgetHtml} 
                    title={`Mapa de hoteles cerca de ${eventName || 'el evento'}`} 
                  />
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No hay hoteles disponibles para este evento</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Los hoteles se añadirán próximamente</p>
                </div>
              )}
            </div>
          )}
          
          {/* Map Tab Content */}
          {activeTab === "map" && mapWidgetHtml && (
            <div className="rounded-xl overflow-hidden border-2 border-border">
              <IframeContent 
                tabId="map" 
                url={mapWidgetHtml} 
                title={`Mapa de hoteles cerca de ${eventName || 'el evento'}`} 
              />
            </div>
          )}
          
          {/* Accommodations Tab Content (from dropdown) */}
          {activeTab === "accommodations" && stay22Accommodations && (
            <div className="rounded-xl overflow-hidden border-2 border-border">
              <IframeContent 
                tabId="accommodations" 
                url={stay22Accommodations} 
                title={`Hoteles y apartamentos en ${cityDisplay}`} 
              />
            </div>
          )}
          
          {/* Activities Tab Content (from dropdown) */}
          {activeTab === "activities" && stay22Activities && (
            <div className="rounded-xl overflow-hidden border-2 border-border">
              <IframeContent 
                tabId="activities" 
                url={stay22Activities} 
                title={`Actividades y experiencias en ${cityDisplay}`} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelMapTabs;
