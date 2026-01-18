import { useMemo, useState } from "react";
import { Building2, MapPin, Check, ChevronDown } from "lucide-react";
import HotelCard from "./HotelCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const IframeBox = ({ src, title }: { src: string; title: string }) => (
  <div className="rounded-xl overflow-hidden border-2 border-border">
    <iframe
      src={src}
      title={title}
      className="w-full h-[500px] sm:h-[600px] border-0"
      allow="geolocation"
      allowFullScreen
      loading="lazy"
    />
  </div>
);

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

  const isMobile = useIsMobile();
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

  // Tab labels without icons
  const labels = {
    hotels: "Feelomove Hoteles",
    accommodations: `Hoteles en ${cityDisplay}`,
    activities: `Actividades en ${cityDisplay}`,
    map: `Mapa a ${eventName || "evento"}`,
  };

  const hasMapContent = !!mapWidgetHtml;
  const hasAccommodationsContent = !!stay22Accommodations;
  const hasActivitiesContent = !!stay22Activities;

  // Mobile: check which dropdown group is active
  const isHotelsDropdownActive = activeTab === "hotels" || activeTab === "accommodations";
  const isActivitiesDropdownActive = activeTab === "activities" || activeTab === "map";

  // Get current label for mobile dropdowns
  const getHotelsDropdownLabel = () => {
    if (activeTab === "hotels") return labels.hotels;
    if (activeTab === "accommodations") return labels.accommodations;
    return labels.hotels;
  };

  const getActivitiesDropdownLabel = () => {
    if (activeTab === "activities") return labels.activities;
    if (activeTab === "map") return labels.map;
    return labels.activities;
  };

  // Desktop tab button component
  const TabButton = ({ tabId, label, isActive }: { tabId: TabId; label: string; isActive: boolean }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-t-lg border-b-2 ${
        isActive
          ? "border-accent bg-accent/10 text-accent font-semibold"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
      role="tab"
      aria-selected={isActive}
    >
      {label}
    </button>
  );

  // Mobile dropdown button component
  const MobileDropdown = ({
    isActive,
    currentLabel,
    children,
  }: {
    isActive: boolean;
    currentLabel: string;
    children: React.ReactNode;
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-between gap-2 ${
            isActive
              ? "bg-accent text-accent-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="min-w-[200px] bg-card border-2 border-border shadow-xl z-50"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              selectedHotelId ? "bg-accent text-accent-foreground" : "bg-foreground text-background"
            }`}
          >
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

      {/* Tabs */}
      <div className="w-full">
        {/* Mobile: Two dropdowns */}
        {isMobile ? (
          <div className="flex gap-2 mb-4">
            {/* Dropdown 1: Feelomove Hoteles + Hoteles en ciudad */}
            <MobileDropdown isActive={isHotelsDropdownActive} currentLabel={getHotelsDropdownLabel()}>
              <DropdownMenuItem
                onClick={() => setActiveTab("hotels")}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  activeTab === "hotels" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              >
                {labels.hotels}
              </DropdownMenuItem>
              {hasAccommodationsContent && (
                <DropdownMenuItem
                  onClick={() => setActiveTab("accommodations")}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    activeTab === "accommodations" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                >
                  {labels.accommodations}
                </DropdownMenuItem>
              )}
            </MobileDropdown>

            {/* Dropdown 2: Actividades + Mapa */}
            {(hasActivitiesContent || hasMapContent) && (
              <MobileDropdown isActive={isActivitiesDropdownActive} currentLabel={getActivitiesDropdownLabel()}>
                {hasActivitiesContent && (
                  <DropdownMenuItem
                    onClick={() => setActiveTab("activities")}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      activeTab === "activities" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {labels.activities}
                  </DropdownMenuItem>
                )}
                {hasMapContent && (
                  <DropdownMenuItem
                    onClick={() => setActiveTab("map")}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      activeTab === "map" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {labels.map}
                  </DropdownMenuItem>
                )}
              </MobileDropdown>
            )}
          </div>
        ) : (
          /* Desktop: All tabs visible */
          <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto">
            <TabButton tabId="hotels" label={labels.hotels} isActive={activeTab === "hotels"} />
            {hasAccommodationsContent && (
              <TabButton tabId="accommodations" label={labels.accommodations} isActive={activeTab === "accommodations"} />
            )}
            {hasActivitiesContent && (
              <TabButton tabId="activities" label={labels.activities} isActive={activeTab === "activities"} />
            )}
            {hasMapContent && (
              <TabButton tabId="map" label={labels.map} isActive={activeTab === "map"} />
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === "hotels" && (
          <div>
            {hotels.length > 0 ? (
              <>
                <div className="flex items-center justify-end mb-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-80 md:w-96 h-11 sm:h-12 text-sm sm:text-base border-2 border-border bg-card font-medium shadow-sm">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-2 w-full min-w-[320px] z-50">
                      <SelectItem value="price-asc" className="text-sm sm:text-base py-3">
                        Precio (menor a mayor)
                      </SelectItem>
                      <SelectItem value="price-desc" className="text-sm sm:text-base py-3">
                        Precio (mayor a menor)
                      </SelectItem>
                      <SelectItem value="distance-asc" className="text-sm sm:text-base py-3">
                        Distancia (más cercano)
                      </SelectItem>
                      <SelectItem value="rating-desc" className="text-sm sm:text-base py-3">
                        Valoración (mejor puntuada)
                      </SelectItem>
                      <SelectItem value="stars-desc" className="text-sm sm:text-base py-3">
                        Estrellas (más estrellas)
                      </SelectItem>
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
            ) : hasMapContent ? (
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
                <IframeBox
                  src={mapWidgetHtml!}
                  title={`Mapa de hoteles cerca de ${eventName || "el evento"}`}
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

        {activeTab === "map" && mapWidgetHtml && (
          <IframeBox src={mapWidgetHtml} title={`Mapa de hoteles cerca de ${eventName || "el evento"}`} />
        )}

        {activeTab === "accommodations" && stay22Accommodations && (
          <IframeBox src={stay22Accommodations} title={`Hoteles y apartamentos en ${cityDisplay}`} />
        )}

        {activeTab === "activities" && stay22Activities && (
          <IframeBox src={stay22Activities} title={`Actividades y experiencias en ${cityDisplay}`} />
        )}
      </div>
    </div>
  );
};

export default HotelMapTabs;
