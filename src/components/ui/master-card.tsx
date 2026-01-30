import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { memo } from "react";

// Feelomove+ Master Card Design System
// Black border, Green #00FF8F hover, no images, 4px lift on hover

interface MasterCardProps {
  to: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  icon?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Master Card - Feelomove+ Design
 * - Black border (2px)
 * - Green #00FF8F background on hover
 * - Black text on hover
 * - 4px upward lift with 0.2s transition
 */
export const MasterCard = memo(({ 
  to, 
  title, 
  subtitle, 
  badge, 
  icon,
  compact = false,
  className 
}: MasterCardProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "group block",
        "bg-card border-2 border-foreground rounded-xl",
        "transition-all duration-200 ease-out",
        "hover:bg-[#00FF8F] hover:-translate-y-1",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Icon + Title */}
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <span className="flex-shrink-0 text-accent group-hover:text-black transition-colors duration-200">
                {icon}
              </span>
            )}
            <h3 className={cn(
              "font-bold text-foreground truncate",
              "group-hover:text-black transition-colors duration-200",
              compact ? "text-sm" : "text-base"
            )}>
              {title}
            </h3>
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <p className={cn(
              "text-muted-foreground truncate",
              "group-hover:text-black/70 transition-colors duration-200",
              icon ? "ml-6" : "",
              compact ? "text-xs" : "text-sm"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Badge */}
        {badge !== undefined && badge !== null && (
          <span className={cn(
            "flex-shrink-0 font-bold rounded-full",
            "bg-foreground text-background",
            "group-hover:bg-black group-hover:text-[#00FF8F]",
            "transition-colors duration-200",
            compact ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
          )}>
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
});

MasterCard.displayName = "MasterCard";

// Pill/Chip variant for horizontal layouts
interface MasterPillProps {
  to: string;
  label: string;
  badge?: string | number;
  className?: string;
}

/**
 * Master Pill - Horizontal chip variant
 * For "Ver en otros destinos" section
 */
export const MasterPill = memo(({ to, label, badge, className }: MasterPillProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2",
        "bg-card border-2 border-foreground rounded-full",
        "whitespace-nowrap flex-shrink-0",
        "transition-all duration-200 ease-out",
        "hover:bg-[#00FF8F] hover:-translate-y-1",
        className
      )}
    >
      <span className="font-semibold text-sm text-foreground group-hover:text-black transition-colors duration-200">
        {label}
      </span>
      {badge !== undefined && badge !== null && (
        <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full group-hover:bg-black group-hover:text-[#00FF8F] transition-colors duration-200">
          {badge}
        </span>
      )}
    </Link>
  );
});

MasterPill.displayName = "MasterPill";

// Inline SVG Icons for the Master Card system
export const MasterCardIcons = {
  MapPin: ({ className = "" }: { className?: string }) => (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Music: ({ className = "" }: { className?: string }) => (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  Calendar: ({ className = "" }: { className?: string }) => (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  Ticket: ({ className = "" }: { className?: string }) => (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    </svg>
  ),
};

export default MasterCard;
