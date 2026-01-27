import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bus, Car, Tent, ExternalLink, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface FestivalServiceAddonsProps {
  eventId: string;
  festivalName?: string;
  className?: string;
}

interface TransportEvent {
  id: string;
  name: string;
  url: string;
  price_min_incl_fees: number | null;
  image_standard_url: string | null;
}

// Determine the appropriate icon based on service name
const getServiceIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("bus") || lowerName.includes("autobús") || lowerName.includes("shuttle") || lowerName.includes("transporte")) {
    return Bus;
  }
  if (lowerName.includes("parking") || lowerName.includes("aparcamiento")) {
    return Car;
  }
  if (lowerName.includes("camping") || lowerName.includes("acampada")) {
    return Tent;
  }
  
  // Default icon for other services
  return Package;
};

// Clean up the service name by removing festival name if repeated
const cleanServiceName = (name: string, festivalName?: string): string => {
  if (!festivalName) return name;
  
  // Common patterns to clean
  const patterns = [
    new RegExp(`^${festivalName}\\s*[-–—:]\\s*`, 'i'),
    new RegExp(`\\s*[-–—:]\\s*${festivalName}$`, 'i'),
    new RegExp(`^Servicio de `, 'i'),
    new RegExp(`^Servicio `, 'i'),
  ];
  
  let cleaned = name;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim() || name;
};

const ServiceCardSkeleton = () => (
  <Card className="border border-border overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </CardContent>
  </Card>
);

export const FestivalServiceAddons = memo(({ 
  eventId, 
  festivalName,
  className 
}: FestivalServiceAddonsProps) => {
  // Query festival details to get transport_event_ids
  const { data: festivalDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["festival-details", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tm_tbl_festival_details")
        .select("transport_event_ids")
        .eq("festival_event_id", eventId)
        .maybeSingle();
      
      if (error) {
        console.warn("Error fetching festival details:", error.message);
        return null;
      }
      return data;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });

  // Query transport events based on the IDs
  const { data: transportEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ["transport-events", festivalDetails?.transport_event_ids],
    queryFn: async () => {
      const transportIds = festivalDetails?.transport_event_ids;
      if (!transportIds || transportIds.length === 0) return [];
      
      // Filter out current event ID to avoid showing festival as its own addon
      const filteredIds = transportIds.filter((id: string) => id !== eventId);
      if (filteredIds.length === 0) return [];

      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("id, name, url, price_min_incl_fees, image_standard_url")
        .in("id", filteredIds)
        .eq("is_transport", true);
      
      if (error) {
        console.warn("Error fetching transport events:", error.message);
        return [];
      }
      
      return (data || []) as TransportEvent[];
    },
    enabled: !!festivalDetails?.transport_event_ids?.length,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingDetails || loadingEvents;
  const hasServices = transportEvents && transportEvents.length > 0;

  // Don't render anything if no services available
  if (!isLoading && !hasServices) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Servicios y Complementos
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Transporte, parking y camping disponibles
          </p>
        </div>
      </div>

      {/* Service Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </>
        ) : (
          transportEvents?.map((service) => {
            const Icon = getServiceIcon(service.name);
            const cleanedName = cleanServiceName(service.name, festivalName);
            const price = service.price_min_incl_fees;

            return (
              <Card 
                key={service.id} 
                className="border border-border hover:border-accent/50 transition-all overflow-hidden"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">
                        {cleanedName}
                      </p>
                      {price && price > 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Desde <span className="font-bold text-foreground">{price.toFixed(0)}€</span>
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Consultar disponibilidad
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 border-accent/30 hover:bg-accent hover:text-accent-foreground hover:border-accent text-xs sm:text-sm"
                      onClick={() => {
                        if (service.url) {
                          window.open(service.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <span className="hidden sm:inline">Reservar</span>
                      <span className="sm:hidden">Ver</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
});

FestivalServiceAddons.displayName = 'FestivalServiceAddons';

export default FestivalServiceAddons;
