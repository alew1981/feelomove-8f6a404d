import { Badge } from "@/components/ui/badge";
import { Tent, Bus, Ticket, CalendarDays, ParkingSquare, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface FestivalServicesProps {
  campingAvailable?: boolean | null;
  hasOfficialTransport?: boolean | null;
  hasFestivalPass?: boolean | null;
  hasDailyTickets?: boolean | null;
  hasCampingTickets?: boolean | null;
  hasParkingTickets?: boolean | null;
  totalStages?: number | null;
  variant?: "badge" | "icon" | "full";
  className?: string;
  maxItems?: number;
}

interface ServiceItem {
  icon: React.ReactNode;
  label: string;
  shortLabel: string;
}

export function FestivalServices({
  campingAvailable,
  hasOfficialTransport,
  hasFestivalPass,
  hasDailyTickets,
  hasCampingTickets,
  hasParkingTickets,
  totalStages,
  variant = "badge",
  className,
  maxItems = 4,
}: FestivalServicesProps) {
  const services: ServiceItem[] = [];

  if (campingAvailable) {
    services.push({
      icon: <Tent className="h-3.5 w-3.5" />,
      label: "Camping disponible",
      shortLabel: "Camping",
    });
  }

  if (hasOfficialTransport) {
    services.push({
      icon: <Bus className="h-3.5 w-3.5" />,
      label: "Transporte oficial",
      shortLabel: "Transporte",
    });
  }

  if (hasFestivalPass) {
    services.push({
      icon: <Ticket className="h-3.5 w-3.5" />,
      label: "Abonos disponibles",
      shortLabel: "Abonos",
    });
  }

  if (hasDailyTickets) {
    services.push({
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      label: "Entradas por día",
      shortLabel: "Día",
    });
  }

  if (hasCampingTickets) {
    services.push({
      icon: <Tent className="h-3.5 w-3.5" />,
      label: "Tickets de camping",
      shortLabel: "Camp. Ticket",
    });
  }

  if (hasParkingTickets) {
    services.push({
      icon: <ParkingSquare className="h-3.5 w-3.5" />,
      label: "Parking disponible",
      shortLabel: "Parking",
    });
  }

  if (totalStages && totalStages > 1) {
    services.push({
      icon: <Music className="h-3.5 w-3.5" />,
      label: `${totalStages} escenarios`,
      shortLabel: `${totalStages} Esc.`,
    });
  }

  if (services.length === 0) return null;

  const displayedServices = services.slice(0, maxItems);
  const remainingCount = services.length - maxItems;

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {displayedServices.map((service, index) => (
          <div
            key={index}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent"
            title={service.label}
          >
            {service.icon}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {services.map((service, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium"
          >
            {service.icon}
            <span>{service.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Default: badge variant
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayedServices.map((service, index) => (
        <Badge
          key={index}
          variant="outline"
          className="text-[10px] px-1.5 py-0.5 gap-1 bg-accent/5 border-accent/20 text-accent"
        >
          {service.icon}
          <span>{service.shortLabel}</span>
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0.5 bg-muted border-muted-foreground/20"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
