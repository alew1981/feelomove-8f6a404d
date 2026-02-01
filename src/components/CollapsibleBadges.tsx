import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { EventProductPage } from "@/types/events.types";
import { parseDate, isFuture, formatOnSaleBadge } from "@/lib/dateUtils";

// Inline SVGs for critical icons
const ChevronDownIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);

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

  const onSaleBadgeFormatted = useMemo(() => {
    const onSaleDateStr = (eventDetails as any).on_sale_date as string | null | undefined;
    if (!onSaleDateStr) return null;
    const d = parseISO(onSaleDateStr);
    if (!isFuture(d)) return null;
    // "2 feb 09:00h" (requested)
    return `${format(d, "d MMM", { locale: es })} ${format(d, "HH:mm")}h`;
  }, [eventDetails]);

  // Build list of all badges
  const badges: { key: string; content: React.ReactNode; priority: number }[] = [];

  // On-sale date badge (highest priority)
  if (onSaleBadgeFormatted) {
    badges.push({
      key: "on_sale",
      priority: 0,
      content: (
        <Badge className="bg-accent text-accent-foreground font-black px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase flex flex-col items-center leading-tight">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            A la venta:
          </span>
          <span>{onSaleBadgeFormatted}</span>
        </Badge>
      ),
    });
  }

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

  // Category/Genre Badge - only show if NOT a festival (festivals show subcategory instead)
  // Avoid duplicate badges like "Festivales" + "Festival de música"
  const isFestival = eventDetails.primary_category_name?.toLowerCase().includes('festival');
  
  if (eventDetails.primary_subcategory_name) {
    badges.push({
      key: "subgenre",
      priority: 6,
      content: (
        <Badge className="bg-white/90 text-foreground font-medium px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs rounded-full shadow-md whitespace-nowrap uppercase">
          {eventDetails.primary_subcategory_name}
        </Badge>
      )
    });
  } else if (eventDetails.primary_category_name && !isFestival) {
    // Only show category if no subcategory and not a festival
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