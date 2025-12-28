import { useState } from "react";
import { Badge } from "./ui/badge";
import { ChevronDown } from "lucide-react";
import { EventProductPage } from "@/types/events.types";

interface CollapsibleBadgesProps {
  eventDetails: EventProductPage;
  hasVipTickets: boolean;
  isEventAvailable: boolean;
  daysUntil: number;
}

const CollapsibleBadges = ({ 
  eventDetails, 
  hasVipTickets, 
  isEventAvailable, 
  daysUntil 
}: CollapsibleBadgesProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build list of all badges
  const badges: { key: string; content: React.ReactNode; priority: number }[] = [];

  // Availability Badge - highest priority
  if (isEventAvailable) {
    badges.push({
      key: "available",
      priority: 1,
      content: (
        <Badge className="bg-accent text-accent-foreground font-black px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          DISPONIBLE
        </Badge>
      )
    });
  } else {
    badges.push({
      key: "soldout",
      priority: 1,
      content: (
        <Badge className="bg-destructive text-destructive-foreground font-black px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          SOLD OUT
        </Badge>
      )
    });
  }

  // VIP Badge - high priority
  if (hasVipTickets) {
    badges.push({
      key: "vip",
      priority: 2,
      content: (
        <Badge className="bg-foreground text-background font-black px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          VIP
        </Badge>
      )
    });
  }

  // Urgency Badge
  if (daysUntil >= 0 && daysUntil < 7) {
    badges.push({
      key: "urgency",
      priority: 3,
      content: (
        <Badge className="bg-destructive text-destructive-foreground font-black px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs animate-pulse rounded-full shadow-md whitespace-nowrap">
          ¡ÚLTIMA SEMANA!
        </Badge>
      )
    });
  }

  // Day of Week
  if (eventDetails.day_of_week) {
    badges.push({
      key: "day",
      priority: 4,
      content: (
        <Badge className="bg-white/95 text-foreground font-semibold px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          {eventDetails.day_of_week}
        </Badge>
      )
    });
  }

  // Season
  if ((eventDetails as any).event_season) {
    badges.push({
      key: "season",
      priority: 5,
      content: (
        <Badge className="bg-white/95 text-foreground font-semibold px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          {(eventDetails as any).event_season}
        </Badge>
      )
    });
  }

  // Genre
  if (eventDetails.primary_category_name) {
    badges.push({
      key: "genre",
      priority: 6,
      content: (
        <Badge className="bg-white text-foreground font-semibold px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          {eventDetails.primary_category_name}
        </Badge>
      )
    });
  }

  // Subgenre
  if (eventDetails.primary_subcategory_name) {
    badges.push({
      key: "subgenre",
      priority: 7,
      content: (
        <Badge className="bg-white/90 text-foreground font-medium px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          {eventDetails.primary_subcategory_name}
        </Badge>
      )
    });
  }

  // Sort by priority
  badges.sort((a, b) => a.priority - b.priority);

  // On mobile, show first 3 badges + expand button if more
  const mobileVisibleCount = 3;
  const hasMoreBadges = badges.length > mobileVisibleCount;
  const visibleBadges = isExpanded ? badges : badges.slice(0, mobileVisibleCount);
  const hiddenCount = badges.length - mobileVisibleCount;

  return (
    <div className="flex items-start gap-1 sm:gap-1.5 flex-wrap justify-end max-w-[140px] sm:max-w-[280px] md:max-w-none">
      {/* On desktop (sm+), show all badges */}
      <div className="hidden sm:flex items-start gap-1.5 flex-wrap justify-end">
        {badges.map(badge => (
          <div key={badge.key}>{badge.content}</div>
        ))}
      </div>

      {/* On mobile, show limited badges with expand option */}
      <div className="flex sm:hidden items-start gap-1 flex-wrap justify-end">
        {visibleBadges.map(badge => (
          <div key={badge.key}>{badge.content}</div>
        ))}
        
        {hasMoreBadges && !isExpanded && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="bg-white/90 text-foreground font-bold px-2 py-1 text-[10px] rounded-full shadow-md flex items-center gap-0.5 hover:bg-white transition-colors"
          >
            +{hiddenCount}
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CollapsibleBadges;