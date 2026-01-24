import { useState, useRef } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
  activeFilterCount?: number;
  className?: string;
}

/**
 * Redesigned mobile search bar with improved UX
 * - Floating design with glass effect
 * - Larger touch targets (48px minimum)
 * - Clear visual feedback with accent colors
 * - Integrated filter toggle with count badge
 * - Smooth micro-animations
 */
const MobileSearchBar = ({
  value,
  onChange,
  placeholder = "Buscar...",
  onFilterToggle,
  showFilterButton = true,
  activeFilterCount = 0,
  className,
}: MobileSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-40",
      "bg-background/80 backdrop-blur-xl",
      "border-t border-border/40",
      "shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.2)]",
      className
    )}>
      {/* Safe area padding for devices with home indicator */}
      <div className="px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-2.5">
          {/* Search Input Container */}
          <div className={cn(
            "flex-1 relative flex items-center",
            "rounded-2xl transition-all duration-300",
            "bg-muted/60",
            isFocused 
              ? "ring-2 ring-accent shadow-lg shadow-accent/20" 
              : "ring-1 ring-border/30"
          )}>
            {/* Search Icon */}
            <div className={cn(
              "absolute left-3.5 flex items-center justify-center",
              "h-5 w-5 transition-colors duration-200",
              isFocused ? "text-accent" : "text-muted-foreground"
            )}>
              <Search className="h-5 w-5" />
            </div>
            
            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "border-0 bg-transparent",
                "pl-12 pr-11 h-12",
                "text-base font-medium",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/50"
              )}
            />
            
            {/* Clear Button - Only visible when there's input */}
            {value && (
              <button
                onClick={handleClear}
                className={cn(
                  "absolute right-3 h-7 w-7",
                  "flex items-center justify-center",
                  "rounded-full bg-muted-foreground/15",
                  "hover:bg-muted-foreground/25 active:bg-muted-foreground/30",
                  "transition-all duration-150 active:scale-90"
                )}
                type="button"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          {showFilterButton && onFilterToggle && (
            <button
              onClick={onFilterToggle}
              className={cn(
                "h-12 w-12 flex-shrink-0",
                "flex items-center justify-center",
                "rounded-2xl relative",
                "transition-all duration-200 active:scale-95",
                activeFilterCount > 0
                  ? "bg-accent text-accent-foreground shadow-md shadow-accent/30"
                  : "bg-muted/60 text-muted-foreground ring-1 ring-border/30 hover:bg-muted"
              )}
              aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount} activos)` : ''}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              
              {/* Filter Count Badge */}
              {activeFilterCount > 0 && (
                <span className={cn(
                  "absolute -top-1.5 -right-1.5",
                  "h-5 min-w-[20px] px-1",
                  "flex items-center justify-center",
                  "rounded-full bg-background text-accent",
                  "text-xs font-bold shadow-md",
                  "border-2 border-accent"
                )}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSearchBar;